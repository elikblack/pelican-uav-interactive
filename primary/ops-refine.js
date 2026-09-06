(() => {
  const cfg = window.DISPLAY_CONFIG;
  if (!cfg) return;

  const aircraft = document.getElementById('aircraft');
  const routeProgress = document.getElementById('route-progress');
  const fields = {
    altitude: document.getElementById('flight-altitude'),
    speed: document.getElementById('flight-speed'),
    heading: document.getElementById('flight-heading'),
    vspeed: document.getElementById('flight-vspeed'),
    endurance: document.getElementById('flight-endurance'),
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

  if (!aircraft) return;

  const started = performance.now();
  let lastPaint = 0;

  function pad3(value) {
    return String(Math.round((value % 360 + 360) % 360)).padStart(3, '0');
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function parseAircraftTransform() {
    const transform = aircraft.getAttribute('transform') || '';
    const match = transform.match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)\s*rotate\(([-\d.]+)\)/);
    if (!match) return null;
    return { x: Number(match[1]), y: Number(match[2]), heading: Number(match[3]) };
  }

  function activeWaypointIndex() {
    const active = document.querySelector('.waypoint-item.active');
    if (!active) return -1;
    return Number(active.dataset.waypointList);
  }

  function paint(now) {
    if (now - lastPaint < 100) {
      requestAnimationFrame(paint);
      return;
    }
    lastPaint = now;

    const t = (now - started) / 1000;
    const position = parseAircraftTransform();
    const heading = position ? (position.heading % 360 + 360) % 360 : 92;
    const speed = 188 + Math.sin(t / 6.5) * 3.8 + Math.sin(t / 2.7) * 1.1;
    const altitude = 12480 + Math.sin(t / 10.5) * 62;
    const verticalSpeed = Math.round(Math.cos(t / 10.5) * 145 / 10) * 10;
    const enduranceSeconds = 3 * 3600 + 42 * 60 - t;

    if (fields.altitude) fields.altitude.textContent = Math.round(altitude).toLocaleString('en-US');
    if (fields.speed) fields.speed.textContent = `${Math.round(speed)}`;
    if (fields.heading) fields.heading.textContent = `${pad3(heading)}°`;
    if (fields.vspeed) fields.vspeed.textContent = `${verticalSpeed >= 0 ? '+' : ''}${verticalSpeed} FPM`;
    if (fields.endurance) {
      const hours = Math.floor(enduranceSeconds / 3600);
      const minutes = Math.floor((enduranceSeconds % 3600) / 60);
      fields.endurance.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const progressValue = Number((routeProgress?.textContent || '0').replace('%', '')) || 0;
    if (fields.progress) fields.progress.textContent = `${String(Math.round(progressValue)).padStart(2, '0')}%`;
    if (fields.progressBar) fields.progressBar.style.width = `${Math.max(0, Math.min(100, progressValue))}%`;

    const activeIndex = activeWaypointIndex();
    const points = cfg.route?.waypoints || [];
    if (activeIndex > 0 && points[activeIndex]) {
      const previous = points[activeIndex - 1];
      const target = points[activeIndex];
      const distancePx = position ? Math.hypot(target.x - position.x, target.y - position.y) : 0;
      const distanceNm = distancePx * 0.032;
      const eteSeconds = speed > 0 ? distanceNm / speed * 3600 : 0;
      const onStation = distanceNm < 1.25;

      if (fields.leg) fields.leg.textContent = `${previous.id}  >  ${target.id}`;
      if (fields.course) fields.course.textContent = `${pad3(heading)}°`;
      if (fields.xtk) fields.xtk.textContent = `${(0.02 + Math.abs(Math.sin(t / 8)) * 0.03).toFixed(2)} NM`;
      if (fields.distance) fields.distance.textContent = `${distanceNm.toFixed(1)} NM`;
      if (fields.ete) fields.ete.textContent = formatDuration(eteSeconds);
      if (fields.taskName) fields.taskName.textContent = `SURVEY AREA ${String(activeIndex).padStart(2, '0')}`;
      if (fields.taskState) fields.taskState.textContent = onStation ? 'ON STATION' : 'IN TRANSIT';
      if (fields.taskNext) fields.taskNext.textContent = `${target.id} · ${distanceNm.toFixed(1)} NM`;
    } else if (activeIndex < 0 && progressValue >= 99) {
      if (fields.leg) fields.leg.textContent = 'ROUTE COMPLETE';
      if (fields.distance) fields.distance.textContent = '0.0 NM';
      if (fields.ete) fields.ete.textContent = '00:00';
      if (fields.taskState) fields.taskState.textContent = 'COMPLETE';
      if (fields.taskNext) fields.taskNext.textContent = 'RECOVERY';
    }

    requestAnimationFrame(paint);
  }

  requestAnimationFrame(paint);
})();
