(() => {
  const cfg = window.DISPLAY_CONFIG;
  const baseFlight = window.UAV_FLIGHT;
  const mission = window.UAV_MISSION;
  const route = document.getElementById('route-base');
  if (!cfg || !baseFlight || !route) return;

  const listeners = new Set();
  const baseSpeedPxPerSec = Math.max(1, Number(cfg.animation?.aircraftSpeedPxPerSec) || 20);
  const cruiseGroundSpeedKt = Math.max(1, Number(cfg.animation?.cruiseGroundSpeedKt) || 188);
  const knotsPerPxPerSec = cruiseGroundSpeedKt / baseSpeedPxPerSec;
  const nmPerPx = Number(cfg.map?.nmPerPx) || 0.032;
  const SPEED_RESPONSE_MS = 220;

  let missionState = mission?.getState?.() || null;
  let current = baseFlight.getState?.() || null;
  let previousRaw = null;
  let previousAt = null;
  let smoothedSpeedKt = cruiseGroundSpeedKt;

  function normalizeHeading(value) {
    return (value % 360 + 360) % 360;
  }

  function headingForVector(vector) {
    return normalizeHeading(Math.atan2(vector.y, vector.x) * 180 / Math.PI + 90);
  }

  function routeTangentAt(length) {
    const total = Math.max(1, route.getTotalLength());
    const clamped = Math.max(0, Math.min(total, length));
    const delta = 4;
    const before = route.getPointAtLength(Math.max(0, clamped - delta));
    const after = route.getPointAtLength(Math.min(total, clamped + delta));
    return { x: after.x - before.x, y: after.y - before.y };
  }

  function updateMeasuredSpeed(raw, now) {
    if (previousRaw && Number.isFinite(previousAt)) {
      const dtMs = now - previousAt;
      if (dtMs > 4 && dtMs < 350) {
        const distancePx = Math.hypot(raw.x - previousRaw.x, raw.y - previousRaw.y);
        const measuredKt = distancePx / (dtMs / 1000) * knotsPerPxPerSec;
        const alpha = 1 - Math.exp(-dtMs / SPEED_RESPONSE_MS);
        smoothedSpeedKt += (measuredKt - smoothedSpeedKt) * alpha;
      }
    }

    previousRaw = { x: raw.x, y: raw.y };
    previousAt = now;
    return Math.max(0, smoothedSpeedKt);
  }

  function routeInstrumentation(raw) {
    const phase = missionState?.phase || 'NAV';
    if (!['NAV', 'RTB', 'COMPLETE'].includes(phase)) {
      return {
        courseDeg: Number(raw.headingDeg),
        crossTrackNm: null
      };
    }

    const total = Math.max(1, route.getTotalLength());
    const progress = Math.max(0, Math.min(1, Number(missionState?.routeProgress) || 0));
    const routeLength = total * progress;
    const planned = route.getPointAtLength(routeLength);
    const tangent = routeTangentAt(routeLength);

    return {
      courseDeg: headingForVector(tangent),
      crossTrackNm: Math.hypot(raw.x - planned.x, raw.y - planned.y) * nmPerPx
    };
  }

  function enrich(raw, now = performance.now()) {
    if (!raw) return null;
    const routeData = routeInstrumentation(raw);
    return {
      ...raw,
      groundSpeedKt: updateMeasuredSpeed(raw, now),
      courseDeg: routeData.courseDeg,
      crossTrackNm: routeData.crossTrackNm
    };
  }

  function notify() {
    if (!current) return;
    const snapshot = { ...current };
    listeners.forEach(listener => listener(snapshot));
  }

  if (mission?.subscribe) {
    mission.subscribe(state => {
      missionState = state;
    });
  }

  baseFlight.subscribe(raw => {
    current = enrich(raw);
    notify();
  });

  window.UAV_FLIGHT = {
    getState: () => current ? { ...current } : null,
    subscribe(listener) {
      listeners.add(listener);
      if (current) listener({ ...current });
      return () => listeners.delete(listener);
    }
  };
})();
