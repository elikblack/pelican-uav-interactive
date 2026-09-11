(() => {
  const cfg = window.DISPLAY_CONFIG;
  if (!cfg) return;

  const shared = window.UAV_SHARED;
  const flight = window.UAV_FLIGHT;
  const mission = window.UAV_MISSION;
  const routeProgress = document.getElementById('route-progress');
  const gpsRibbon = document.querySelector('[data-bind="labels.gps"]');
  const fields = {
    altitude: document.getElementById('flight-altitude'),
    speed: document.getElementById('flight-speed'),
    heading: document.getElementById('flight-heading'),
    vspeed: document.getElementById('flight-vspeed'),
    endurance: document.getElementById('flight-endurance'),
    navSource: document.getElementById('flight-nav-source'),
    leg: document.getElementById('ops-active-leg'),
    course: document.getElementById('ops-course'),
    xtk: document.getElementById('ops-xtk'),
    distance: document.getElementById('ops-distance'),
    ete: document.getElementById('ops-ete'),
    progress: document.getElementById('ops-route-progress'),
    progressBar: document.getElementById('ops-route-progress-bar'),
    taskName: document.getElementById('ops-task-name'),
    taskState: document.getElementById('ops-task-state'),
    taskNext: document.getElementById('ops-task-next')
  };

  if (!flight) return;

  const started = performance.now();
  let lastPaint = 0;
  let lastSharedPublish = 0;
  const PAINT_INTERVAL_MS = 50;
  const SHARED_PUBLISH_INTERVAL_MS = 50;

  function pad3(value) {
    return String(Math.round((value % 360 + 360) % 360)).padStart(3, '0');
  }

  function formatTrueHeading(value) {
    const normalized = (value % 360 + 360) % 360;
    return `${normalized.toFixed(1).padStart(5, '0')}°T`;
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatNavSource(source) {
    return String(source || 'UNKNOWN').replaceAll('_', ' / ');
  }

  function activeWaypointIndex() {
    const active = document.querySelector('.waypoint-item.active');
    if (!active) return -1;
    return Number(active.dataset.waypointList);
  }

  function renderSharedNavigation(state) {
    const nav = state?.navigation;
    if (!nav) return;
    if (fields.navSource) fields.navSource.textContent = formatNavSource(nav.source);
    if (gpsRibbon) gpsRibbon.textContent = nav.valid ? 'LOCK' : 'INVALID';
  }

  if (shared) shared.subscribe(renderSharedNavigation, ['navigation']);

  function publishAircraft(now, heading, speed, altitude, enduranceSeconds) {
    if (!shared || now - lastSharedPublish < SHARED_PUBLISH_INTERVAL_MS) return;
    lastSharedPublish = now;
    shared.update({
      aircraft: {
        headingDeg: Number(heading.toFixed(1)),
        groundSpeedKt: Number(speed.toFixed(1)),
        altitudeFt: Math.round(altitude),
        enduranceSeconds: Math.max(0, Math.round(enduranceSeconds))
      }
    }, 'primary-aircraft');
  }

  function renderMission(execution, position, speed, heading, t) {
    const points = cfg.route?.waypoints || [];
    const activeIndex = Number.isInteger(execution?.targetIndex)
      ? execution.targetIndex
      : activeWaypointIndex();
    const target = points[activeIndex];
    const previous = activeIndex > 0 ? points[activeIndex - 1] : null;
    const distancePx = target && position ? Math.hypot(target.x - position.x, target.y - position.y) : 0;
    const distanceNm = distancePx * 0.032;
    const eteSeconds = speed > 0 ? distanceNm / speed * 3600 : 0;
    const phase = execution?.phase || 'NAV';

    if (fields.course) fields.course.textContent = `${pad3(heading)}°`;
    if (fields.xtk) fields.xtk.textContent = `${(0.02 + Math.abs(Math.sin(t / 8)) * 0.03).toFixed(2)} NM`;

    if (phase === 'COMPLETE') {
      if (fields.leg) fields.leg.textContent = 'ROUTE COMPLETE';
      if (fields.distance) fields.distance.textContent = '0.0 NM';
      if (fields.ete) fields.ete.textContent = '00:00';
      if (fields.taskName) fields.taskName.textContent = 'MISSION COMPLETE';
      if (fields.taskState) fields.taskState.textContent = 'COMPLETE';
      if (fields.taskNext) fields.taskNext.textContent = 'RECOVERY';
      return;
    }

    if (previous && target && fields.leg) fields.leg.textContent = `${previous.id}  >  ${target.id}`;
    if (fields.distance) fields.distance.textContent = `${distanceNm.toFixed(1)} NM`;
    if (fields.ete) fields.ete.textContent = formatDuration(eteSeconds);

    if (phase === 'RTB') {
      if (fields.taskName) fields.taskName.textContent = 'RETURN TO BASE';
      if (fields.taskState) fields.taskState.textContent = 'RTB';
      if (fields.taskNext) fields.taskNext.textContent = `STAGING · ${distanceNm.toFixed(1)} NM`;
      return;
    }

    if (phase === 'TASK' || phase === 'TASK_INGRESS' || phase === 'TASK_EGRESS') {
      const label = execution?.taskLabel || target?.task?.label || target?.label || 'MISSION TASK';
      const progress = Math.round((Number(execution?.taskProgress) || 0) * 100);
      if (fields.taskName) fields.taskName.textContent = label;
      if (fields.taskState) {
        fields.taskState.textContent = phase === 'TASK'
          ? 'ON STATION'
          : phase === 'TASK_INGRESS' ? 'TASK INGRESS' : 'TASK COMPLETE';
      }
      if (fields.taskNext) {
        fields.taskNext.textContent = phase === 'TASK'
          ? `${String(execution?.taskType || 'TASK').toUpperCase()} · ${String(progress).padStart(2, '0')}%`
          : `${target?.id || 'TASK'} · ${distanceNm.toFixed(1)} NM`;
      }
      return;
    }

    if (fields.taskName) fields.taskName.textContent = 'TRANSIT';
    if (fields.taskState) fields.taskState.textContent = 'IN TRANSIT';
    if (fields.taskNext) fields.taskNext.textContent = target ? `${target.id} · ${distanceNm.toFixed(1)} NM` : 'NAV';
  }

  function paint(now) {
    if (now - lastPaint < PAINT_INTERVAL_MS) {
      requestAnimationFrame(paint);
      return;
    }
    lastPaint = now;

    const t = (now - started) / 1000;
    const position = flight.getState();
    const execution = mission?.getState?.() || null;
    const heading = Number.isFinite(position?.headingDeg) ? position.headingDeg : 92;
    const speed = 188 + Math.sin(t / 6.5) * 3.8 + Math.sin(t / 2.7) * 1.1;
    const altitude = 12480 + Math.sin(t / 10.5) * 62;
    const verticalSpeed = Math.round(Math.cos(t / 10.5) * 145 / 10) * 10;
    const enduranceSeconds = 3 * 3600 + 42 * 60 - t;

    if (fields.altitude) fields.altitude.textContent = Math.round(altitude).toLocaleString('en-US');
    if (fields.speed) fields.speed.textContent = `${Math.round(speed)}`;
    if (fields.heading) fields.heading.textContent = formatTrueHeading(heading);
    if (fields.vspeed) fields.vspeed.textContent = `${verticalSpeed >= 0 ? '+' : ''}${verticalSpeed} FPM`;
    if (fields.endurance) {
      const hours = Math.floor(enduranceSeconds / 3600);
      const minutes = Math.floor((enduranceSeconds % 3600) / 60);
      fields.endurance.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    publishAircraft(now, heading, speed, altitude, enduranceSeconds);

    const progressValue = Number((routeProgress?.textContent || '0').replace('%', '')) || 0;
    if (fields.progress) fields.progress.textContent = `${String(Math.round(progressValue)).padStart(2, '0')}%`;
    if (fields.progressBar) fields.progressBar.style.width = `${Math.max(0, Math.min(100, progressValue))}%`;

    renderMission(execution, position, speed, heading, t);
    requestAnimationFrame(paint);
  }

  requestAnimationFrame(paint);
})();
