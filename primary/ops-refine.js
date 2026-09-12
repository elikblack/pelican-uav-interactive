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
  const nmPerPx = Number(cfg.map?.nmPerPx) || 0.032;
  const cruiseGroundSpeedKt = Number(cfg.animation?.cruiseGroundSpeedKt) || 188;
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

  function missionMetrics(execution, position, speed) {
    const points = cfg.route?.waypoints || [];
    const activeIndex = Number.isInteger(execution?.targetIndex)
      ? execution.targetIndex
      : activeWaypointIndex();
    const target = points[activeIndex];
    const previous = activeIndex > 0 ? points[activeIndex - 1] : null;
    const phase = execution?.phase || 'NAV';
    const course = Number(position?.courseDeg);
    const crossTrack = Number(position?.crossTrackNm);

    if (phase === 'COMPLETE') {
      return {
        phase,
        activeIndex,
        target,
        previous,
        activeLeg: 'ROUTE COMPLETE',
        courseDeg: Number.isFinite(course) ? course : Number(position?.headingDeg) || 0,
        crossTrackNm: 0,
        distanceToNextNm: 0,
        eteSeconds: 0
      };
    }

    if (phase === 'TASK') {
      return {
        phase,
        activeIndex,
        target,
        previous,
        activeLeg: `${target?.id || 'TASK'} / ${String(execution?.taskType || 'TASK').toUpperCase()}`,
        courseDeg: Number.isFinite(course) ? course : Number(position?.headingDeg) || 0,
        crossTrackNm: null,
        distanceToNextNm: 0,
        eteSeconds: 0
      };
    }

    const distancePx = target && position ? Math.hypot(target.x - position.x, target.y - position.y) : 0;
    const distanceNm = distancePx * nmPerPx;
    const eteSeconds = speed > 0 ? distanceNm / speed * 3600 : 0;
    return {
      phase,
      activeIndex,
      target,
      previous,
      activeLeg: previous && target ? `${previous.id} > ${target.id}` : target?.id || 'NAV',
      courseDeg: Number.isFinite(course) ? course : Number(position?.headingDeg) || 0,
      crossTrackNm: Number.isFinite(crossTrack) ? crossTrack : null,
      distanceToNextNm: distanceNm,
      eteSeconds
    };
  }

  function publishShared(now, execution, position, metrics, altitude, enduranceSeconds) {
    if (!shared || now - lastSharedPublish < SHARED_PUBLISH_INTERVAL_MS) return;
    lastSharedPublish = now;

    const heading = Number(position?.headingDeg);
    const speed = Number(position?.groundSpeedKt);
    const missionSnapshot = execution ? {
      phase: execution.phase || 'NAV',
      targetIndex: Number.isInteger(execution.targetIndex) ? execution.targetIndex : -1,
      targetId: execution.targetId || metrics.target?.id || '',
      targetKind: execution.targetKind || metrics.target?.kind || '',
      completedThrough: Number.isInteger(execution.completedThrough) ? execution.completedThrough : -1,
      taskType: execution.taskType || null,
      taskLabel: execution.taskLabel || null,
      taskProgress: Number(execution.taskProgress) || 0,
      routeProgress: Number(execution.routeProgress) || 0,
      activeLeg: metrics.activeLeg,
      courseDeg: Number(metrics.courseDeg) || 0,
      crossTrackNm: metrics.crossTrackNm,
      distanceToNextNm: Number(metrics.distanceToNextNm) || 0,
      eteSeconds: Number(metrics.eteSeconds) || 0
    } : null;

    const patch = {
      aircraft: {
        headingDeg: Number.isFinite(heading) ? Number(heading.toFixed(1)) : 0,
        groundSpeedKt: Number.isFinite(speed) ? Number(speed.toFixed(1)) : cruiseGroundSpeedKt,
        altitudeFt: Math.round(altitude),
        enduranceSeconds: Math.max(0, Math.round(enduranceSeconds))
      }
    };
    if (missionSnapshot) patch.mission = missionSnapshot;
    shared.update(patch, 'primary-flight');
  }

  function renderMission(execution, metrics) {
    const phase = metrics.phase;
    const target = metrics.target;

    if (fields.course) fields.course.textContent = `${pad3(metrics.courseDeg)}°`;
    if (fields.xtk) {
      fields.xtk.textContent = Number.isFinite(metrics.crossTrackNm)
        ? `${metrics.crossTrackNm.toFixed(2)} NM`
        : '--';
    }

    if (phase === 'COMPLETE') {
      if (fields.leg) fields.leg.textContent = 'ROUTE COMPLETE';
      if (fields.distance) fields.distance.textContent = '0.0 NM';
      if (fields.ete) fields.ete.textContent = '00:00';
      if (fields.taskName) fields.taskName.textContent = 'MISSION COMPLETE';
      if (fields.taskState) fields.taskState.textContent = 'COMPLETE';
      if (fields.taskNext) fields.taskNext.textContent = 'RECOVERY';
      return;
    }

    if (fields.leg) fields.leg.textContent = metrics.activeLeg.replace(' > ', '  >  ');
    if (fields.distance) fields.distance.textContent = `${metrics.distanceToNextNm.toFixed(1)} NM`;
    if (fields.ete) fields.ete.textContent = formatDuration(metrics.eteSeconds);

    if (phase === 'RTB') {
      if (fields.taskName) fields.taskName.textContent = 'RETURN TO BASE';
      if (fields.taskState) fields.taskState.textContent = 'RTB';
      if (fields.taskNext) fields.taskNext.textContent = `STAGING · ${metrics.distanceToNextNm.toFixed(1)} NM`;
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
          : `${target?.id || 'TASK'} · ${metrics.distanceToNextNm.toFixed(1)} NM`;
      }
      return;
    }

    if (fields.taskName) fields.taskName.textContent = 'TRANSIT';
    if (fields.taskState) fields.taskState.textContent = 'IN TRANSIT';
    if (fields.taskNext) fields.taskNext.textContent = target ? `${target.id} · ${metrics.distanceToNextNm.toFixed(1)} NM` : 'NAV';
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
    const speed = Number.isFinite(position?.groundSpeedKt) ? position.groundSpeedKt : cruiseGroundSpeedKt;
    const altitude = 12480 + Math.sin(t / 10.5) * 62;
    const verticalSpeed = Math.round(Math.cos(t / 10.5) * 145 / 10) * 10;
    const enduranceSeconds = 3 * 3600 + 42 * 60 - t;
    const metrics = missionMetrics(execution, position, speed);

    if (fields.altitude) fields.altitude.textContent = Math.round(altitude).toLocaleString('en-US');
    if (fields.speed) fields.speed.textContent = `${Math.round(speed)}`;
    if (fields.heading) fields.heading.textContent = formatTrueHeading(heading);
    if (fields.vspeed) fields.vspeed.textContent = `${verticalSpeed >= 0 ? '+' : ''}${verticalSpeed} FPM`;
    if (fields.endurance) {
      const hours = Math.floor(enduranceSeconds / 3600);
      const minutes = Math.floor((enduranceSeconds % 3600) / 60);
      fields.endurance.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    publishShared(now, execution, position, metrics, altitude, enduranceSeconds);

    const executionProgress = Number(execution?.routeProgress);
    const progressValue = Number.isFinite(executionProgress)
      ? executionProgress * 100
      : Number((routeProgress?.textContent || '0').replace('%', '')) || 0;
    if (fields.progress) fields.progress.textContent = `${String(Math.round(progressValue)).padStart(2, '0')}%`;
    if (fields.progressBar) fields.progressBar.style.width = `${Math.max(0, Math.min(100, progressValue))}%`;

    renderMission(execution, metrics);
    requestAnimationFrame(paint);
  }

  requestAnimationFrame(paint);
})();
