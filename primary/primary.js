(() => {
  const cfg = window.DISPLAY_CONFIG;
  if (!cfg) throw new Error("DISPLAY_CONFIG is missing");

  const NS = "http://www.w3.org/2000/svg";
  const root = document.documentElement;
  const display = document.getElementById("primary-display");
  const workspace = document.querySelector(".workspace");
  const mapWorld = document.getElementById("map-world");
  const mapSvg = document.getElementById("map-svg");
  const terrain = document.getElementById("terrain-image");
  const routeBase = document.getElementById("route-base");
  const routeProgress = document.getElementById("route-progress-path");
  let aoiLayer = document.getElementById("aoi-layer");
  const waypointLayer = document.getElementById("waypoint-layer");
  const aircraft = document.getElementById("aircraft");
  const waypointList = document.getElementById("waypoint-list");
  const progressText = document.getElementById("route-progress");
  const sparkPath = document.getElementById("spark-path");

  let running = true;
  let loopStarted = performance.now();
  let pausedAt = 0;
  let routeLength = 1;
  let cameraOutboundLength = 1;
  let waypointMeta = [];
  let timeline = [];
  let motionEndMs = 1;
  let totalLoopMs = 1;

  const flightListeners = new Set();
  let flightState = null;
  const missionListeners = new Set();
  let missionState = null;

  function normalizeHeading(value) {
    return (value % 360 + 360) % 360;
  }

  function publishFlightState(point, headingDeg) {
    flightState = {
      x: Number(point.x),
      y: Number(point.y),
      headingDeg: normalizeHeading(headingDeg)
    };
    const snapshot = { ...flightState };
    flightListeners.forEach(listener => listener(snapshot));
  }

  function publishMissionState(next) {
    missionState = { ...next };
    const snapshot = { ...missionState };
    missionListeners.forEach(listener => listener(snapshot));
  }

  window.UAV_FLIGHT = {
    getState: () => flightState ? { ...flightState } : null,
    subscribe(listener) {
      flightListeners.add(listener);
      if (flightState) listener({ ...flightState });
      return () => flightListeners.delete(listener);
    }
  };

  window.UAV_MISSION = {
    getState: () => missionState ? { ...missionState } : null,
    subscribe(listener) {
      missionListeners.add(listener);
      if (missionState) listener({ ...missionState });
      return () => missionListeners.delete(listener);
    }
  };

  const sparkCount = 58;
  const sparkStepMs = cfg.throughput?.stepMs ?? 185;
  const sparkSamples = [];
  let sparkLastStep = 0;

  function applyTheme() {
    Object.entries(cfg.theme).forEach(([key, value]) => {
      const cssName = `--${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;
      root.style.setProperty(cssName, value);
    });
  }

  function bindText() {
    document.querySelectorAll("[data-bind]").forEach(node => {
      const value = node.dataset.bind.split(".").reduce((obj, key) => obj?.[key], cfg);
      if (value != null) node.textContent = value;
    });
  }

  function buildPanel(key) {
    const panel = cfg.panels[key];
    if (!panel) return;
    const title = document.querySelector(`[data-panel-title="${key}"]`);
    const rows = document.querySelector(`[data-panel-rows="${key}"]`);
    if (title) title.textContent = panel.title;
    if (!rows) return;
    rows.innerHTML = panel.rows.map(([name, state, tone = ""]) => `
      <div class="status-row">
        <span class="row-symbol" aria-hidden="true"></span>
        <span class="row-name">${name}</span>
        <span class="row-state ${tone}">${state}</span>
      </div>`).join("");
  }

  function fitDisplay() {
    const scale = Math.min(window.innerWidth / cfg.canvas.width, window.innerHeight / cfg.canvas.height);
    display.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  function installEffectsStylesheet() {
    if (document.querySelector('link[data-effects-css]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "effects.css?v=20260911-1";
    link.dataset.effectsCss = "true";
    document.head.appendChild(link);
  }

  function ensureThroughputGradient() {
    if (!sparkPath || document.getElementById("throughput-gradient")) return;
    const gradient = document.createElementNS(NS, "linearGradient");
    gradient.id = "throughput-gradient";
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "0%");
    [
      ["0%", cfg.theme.throughputOrange ?? "#ed8b2f"],
      ["58%", "#f0ad39"],
      ["100%", cfg.theme.throughputYellow ?? "#f2d35e"]
    ].forEach(([offset, color]) => {
      const stop = document.createElementNS(NS, "stop");
      stop.setAttribute("offset", offset);
      stop.style.stopColor = color;
      gradient.appendChild(stop);
    });
    const sparkSvg = sparkPath.ownerSVGElement;
    let defs = sparkSvg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(NS, "defs");
      sparkSvg.insertBefore(defs, sparkSvg.firstChild);
    }
    defs.appendChild(gradient);
    sparkPath.style.stroke = "url(#throughput-gradient)";
  }

  function buildMap() {
    const { worldWidth:w, worldHeight:h } = cfg.map;
    mapWorld.style.width = `${w}px`;
    mapWorld.style.height = `${h}px`;
    terrain.src = cfg.map.image;
    terrain.style.width = `${w}px`;
    terrain.style.height = `${h}px`;
    mapSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    mapSvg.setAttribute("width", w);
    mapSvg.setAttribute("height", h);

    if (workspace) {
      workspace.style.setProperty("--map-image", `url("${cfg.map.image}")`);
      workspace.style.setProperty("--map-width", `${w}px`);
      workspace.style.setProperty("--map-height", `${h}px`);
      workspace.style.setProperty("--map-x", `${cfg.map.startX}px`);
      workspace.style.setProperty("--map-y", `${cfg.map.startY}px`);
    }

    if (!aoiLayer) {
      aoiLayer = document.createElementNS(NS, "g");
      aoiLayer.id = "aoi-layer";
      mapSvg.insertBefore(aoiLayer, waypointLayer);
    }

    ensureThroughputGradient();

    const points = cfg.route.waypoints;
    const pathData = points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
    routeBase.setAttribute("d", pathData);
    routeProgress.setAttribute("d", pathData);

    waypointLayer.innerHTML = points.map((p, index) => p.marker === false ? "" : `
      <g class="waypoint waypoint-${p.kind || "nav"}" data-waypoint="${index}" transform="translate(${p.x} ${p.y})">
        <circle r="12"></circle>
        <text x="20" y="-17">${p.id}</text>
      </g>`).join("");

    waypointList.innerHTML = points.map((p, index) => p.list === false ? "" : `
      <div class="waypoint-item waypoint-${p.kind || "nav"}" data-waypoint-list="${index}">
        <span class="wp-dot"></span>
        <span class="wp-id">${p.id}</span>
        <span class="wp-label">${p.label || ""}</span>
      </div>`).join("");

    aoiLayer.innerHTML = points.map((p, index) => p.kind === "task" ? buildAOIMarkup(p, index) : "").join("");

    requestAnimationFrame(() => {
      routeLength = Math.max(1, routeBase.getTotalLength());
      routeProgress.style.strokeDasharray = `${routeLength}`;
      routeProgress.style.strokeDashoffset = `${routeLength}`;

      let cumulative = 0;
      waypointMeta = points.map((p, index) => {
        if (index > 0) {
          const previous = points[index - 1];
          cumulative += Math.hypot(p.x - previous.x, p.y - previous.y);
        }
        return { ...p, length: cumulative, progress: cumulative / routeLength };
      });
      cameraOutboundLength = [...waypointMeta].reverse().find(point => point.kind !== "recovery")?.length || routeLength;

      buildTimeline();
      renderAtElapsed(0);
    });
  }

  function buildAOIMarkup(point, index) {
    const size = point.task?.size ?? cfg.animation.aoiSize ?? 126;
    const half = size / 2;
    const cx = point.x;
    const cy = point.y;
    const left = cx - half;
    const right = cx + half;
    const top = cy - half;
    const bottom = cy + half;
    const ring = Math.min(31, half * .48);
    const bracket = Math.min(14, half * .22);
    const taskLabel = point.task?.label || point.label || "TASK AREA";
    const pattern = point.task?.pattern || "task";

    const quadrant = (name, edge, arc, corner) => `
      <g class="aoi-quadrant" data-quadrant="${name}">
        <path class="aoi-edge" d="${edge}"></path>
        <path class="aoi-ring" d="${arc}"></path>
        <path class="aoi-corner" d="${corner}"></path>
      </g>`;

    return `
      <g class="aoi-box planned" data-aoi="${index}" data-task-pattern="${pattern}">
        ${quadrant("UR", `M ${cx} ${top} H ${right} V ${cy}`, `M ${cx} ${cy-ring} A ${ring} ${ring} 0 0 1 ${cx+ring} ${cy}`, `M ${right-bracket} ${top} H ${right} V ${top+bracket}`)}
        ${quadrant("BR", `M ${right} ${cy} V ${bottom} H ${cx}`, `M ${cx+ring} ${cy} A ${ring} ${ring} 0 0 1 ${cx} ${cy+ring}`, `M ${right} ${bottom-bracket} V ${bottom} H ${right-bracket}`)}
        ${quadrant("BL", `M ${cx} ${bottom} H ${left} V ${cy}`, `M ${cx} ${cy+ring} A ${ring} ${ring} 0 0 1 ${cx-ring} ${cy}`, `M ${left+bracket} ${bottom} H ${left} V ${bottom-bracket}`)}
        ${quadrant("UL", `M ${left} ${cy} V ${top} H ${cx}`, `M ${cx-ring} ${cy} A ${ring} ${ring} 0 0 1 ${cx} ${cy-ring}`, `M ${left} ${top+bracket} V ${top} H ${left+bracket}`)}
        <path class="aoi-crosshair" d="M ${cx-9} ${cy} H ${cx+9} M ${cx} ${cy-9} V ${cy+9}"></path>
        <text class="aoi-label aoi-label-main" x="${cx}" y="${cy+47}">${point.id}</text>
        <text class="aoi-label aoi-label-sub" x="${cx}" y="${cy+59}">${taskLabel}</text>
      </g>`;
  }

  function normalize(x, y) {
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function routeTangentAt(length) {
    const clamped = Math.max(0, Math.min(routeLength, length));
    const delta = 4;
    const before = routeBase.getPointAtLength(Math.max(0, clamped - delta));
    const after = routeBase.getPointAtLength(Math.min(routeLength, clamped + delta));
    return normalize(after.x - before.x, after.y - before.y);
  }

  function cubicPoint(phase, t) {
    const u = 1 - t;
    return {
      x: u*u*u*phase.p0.x + 3*u*u*t*phase.p1.x + 3*u*t*t*phase.p2.x + t*t*t*phase.p3.x,
      y: u*u*u*phase.p0.y + 3*u*u*t*phase.p1.y + 3*u*t*t*phase.p2.y + t*t*t*phase.p3.y
    };
  }

  function cubicDerivative(phase, t) {
    const u = 1 - t;
    return {
      x: 3*u*u*(phase.p1.x-phase.p0.x) + 6*u*t*(phase.p2.x-phase.p1.x) + 3*t*t*(phase.p3.x-phase.p2.x),
      y: 3*u*u*(phase.p1.y-phase.p0.y) + 6*u*t*(phase.p2.y-phase.p1.y) + 3*t*t*(phase.p3.y-phase.p2.y)
    };
  }

  function buildCurveLookup(phase, samples = 72) {
    const lookup = [{ t: 0, distance: 0, point: phase.p0 }];
    let total = 0;
    let previous = phase.p0;
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const point = cubicPoint(phase, t);
      total += Math.hypot(point.x - previous.x, point.y - previous.y);
      lookup.push({ t, distance: total, point });
      previous = point;
    }
    phase.curveLookup = lookup;
    phase.curveLength = total;
    return total;
  }

  function curveTAtDistance(phase, distance) {
    const target = Math.max(0, Math.min(phase.curveLength, distance));
    const lookup = phase.curveLookup;
    for (let i = 1; i < lookup.length; i++) {
      if (lookup[i].distance >= target) {
        const a = lookup[i - 1];
        const b = lookup[i];
        const span = Math.max(.0001, b.distance - a.distance);
        const mix = (target - a.distance) / span;
        return a.t + (b.t - a.t) * mix;
      }
    }
    return 1;
  }

  function rotatePoint(cx, cy, x, y, angleRad) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return {
      x: cx + x * cos - y * sin,
      y: cy + x * sin + y * cos
    };
  }

  function buildSweepPoints(wp, approachPoint) {
    const task = wp.task || {};
    const width = task.width ?? 110;
    const height = task.height ?? 72;
    const passes = Math.max(2, Math.round(task.passes ?? 5));
    const angle = (task.angleDeg ?? 0) * Math.PI / 180;
    const points = [];

    for (let row = 0; row < passes; row++) {
      const y = -height / 2 + height * row / (passes - 1);
      const left = rotatePoint(wp.x, wp.y, -width / 2, y, angle);
      const right = rotatePoint(wp.x, wp.y, width / 2, y, angle);
      if (row % 2 === 0) points.push(left, right);
      else points.push(right, left);
    }

    const firstDistance = Math.hypot(points[0].x - approachPoint.x, points[0].y - approachPoint.y);
    const last = points[points.length - 1];
    const lastDistance = Math.hypot(last.x - approachPoint.x, last.y - approachPoint.y);
    if (lastDistance < firstDistance) points.reverse();
    return points;
  }

  function buildPolylineLookup(points) {
    const lookup = [{ distance: 0, point: points[0], index: 0 }];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      lookup.push({ distance: total, point: points[i], index: i });
    }
    return { lookup, length: total };
  }

  function polylinePose(phase, distance) {
    const target = Math.max(0, Math.min(phase.pathLength, distance));
    const lookup = phase.pathLookup;
    for (let i = 1; i < lookup.length; i++) {
      if (lookup[i].distance >= target) {
        const a = lookup[i - 1];
        const b = lookup[i];
        const span = Math.max(.0001, b.distance - a.distance);
        const mix = (target - a.distance) / span;
        return {
          point: {
            x: a.point.x + (b.point.x - a.point.x) * mix,
            y: a.point.y + (b.point.y - a.point.y) * mix
          },
          vector: { x: b.point.x - a.point.x, y: b.point.y - a.point.y }
        };
      }
    }
    const end = phase.pathPoints[phase.pathPoints.length - 1];
    const before = phase.pathPoints[Math.max(0, phase.pathPoints.length - 2)];
    return { point: end, vector: { x: end.x - before.x, y: end.y - before.y } };
  }

  function addTravelPhase(cursor, fromLength, toLength, targetIndex, completedThrough, missionPhase, speed, deviationSeed) {
    const distance = Math.max(0, toLength - fromLength);
    const phase = {
      type: "travel",
      missionPhase,
      start: cursor,
      end: cursor + Math.max(1, distance * 1000 / speed),
      fromAircraftLength: fromLength,
      toAircraftLength: toLength,
      targetIndex,
      completedThrough,
      deviationSeed,
      deviationCycles: Math.max(.65, distance / 210)
    };
    timeline.push(phase);
    return phase.end;
  }

  function addCurvePhase(cursor, phase, speed) {
    const curveLength = buildCurveLookup(phase);
    phase.end = cursor + Math.max(1, curveLength * 1000 / speed);
    timeline.push(phase);
    return phase.end;
  }

  function buildTimeline() {
    const speed = Math.max(1, cfg.animation.aircraftSpeedPxPerSec ?? 20);
    const defaultIngress = cfg.animation.taskIngressPx ?? 52;
    const defaultEgress = cfg.animation.taskEgressPx ?? 52;
    const endPauseMs = cfg.animation.endPauseMs ?? 3200;

    timeline = [];
    let cursor = 0;
    let currentAircraftLength = 0;

    for (let index = 1; index < waypointMeta.length; index++) {
      const wp = waypointMeta[index];
      const isTask = wp.kind === "task" && wp.task;
      const isRecovery = wp.kind === "recovery";

      if (!isTask) {
        cursor = addTravelPhase(
          cursor,
          currentAircraftLength,
          wp.length,
          index,
          index - 1,
          isRecovery ? "RTB" : "NAV",
          speed,
          index * 1.37
        );
        currentAircraftLength = wp.length;
        continue;
      }

      const ingressDistance = wp.task.ingressPx ?? defaultIngress;
      const egressDistance = wp.task.egressPx ?? defaultEgress;
      const approachLength = Math.max(currentAircraftLength, wp.length - ingressDistance);
      const nextLength = waypointMeta[index + 1]?.length ?? routeLength;
      const exitLength = Math.min(nextLength, wp.length + egressDistance);

      cursor = addTravelPhase(
        cursor,
        currentAircraftLength,
        approachLength,
        index,
        index - 1,
        "NAV",
        speed,
        index * 1.37
      );

      const routeEntry = routeBase.getPointAtLength(approachLength);
      const routeExit = routeBase.getPointAtLength(exitLength);
      const routeEntryTangent = routeTangentAt(approachLength);
      const routeExitTangent = routeTangentAt(exitLength);
      const taskSpeed = speed * Math.max(.2, wp.task.speedMultiplier ?? 1);

      let taskEntry;
      let taskExit;
      let taskEntryTangent;
      let taskExitTangent;
      let taskPhase;

      if (wp.task.pattern === "sweep") {
        const pathPoints = buildSweepPoints(wp, routeEntry);
        const path = buildPolylineLookup(pathPoints);
        taskEntry = pathPoints[0];
        taskExit = pathPoints[pathPoints.length - 1];
        taskEntryTangent = normalize(pathPoints[1].x - taskEntry.x, pathPoints[1].y - taskEntry.y);
        taskExitTangent = normalize(taskExit.x - pathPoints[pathPoints.length - 2].x, taskExit.y - pathPoints[pathPoints.length - 2].y);
        taskPhase = {
          type: "task-sweep",
          missionPhase: "TASK",
          targetIndex: index,
          completedThrough: index - 1,
          routeProgressLength: wp.length,
          taskType: "sweep",
          taskLabel: wp.task.label,
          pathPoints,
          pathLookup: path.lookup,
          pathLength: path.length
        };
        taskPhase.start = 0;
        taskPhase.end = Math.max(1, path.length * 1000 / taskSpeed);
      } else {
        const radius = wp.task.radius ?? 50;
        const turns = wp.task.turns ?? 1;
        const startAngle = Math.atan2(routeEntry.y - wp.y, routeEntry.x - wp.x);
        taskEntry = {
          x: wp.x + Math.cos(startAngle) * radius,
          y: wp.y + Math.sin(startAngle) * radius
        };
        const endAngle = startAngle + Math.PI * 2 * turns;
        taskExit = {
          x: wp.x + Math.cos(endAngle) * radius,
          y: wp.y + Math.sin(endAngle) * radius
        };
        taskEntryTangent = normalize(-Math.sin(startAngle), Math.cos(startAngle));
        taskExitTangent = normalize(-Math.sin(endAngle), Math.cos(endAngle));
        taskPhase = {
          type: "task-orbit",
          missionPhase: "TASK",
          targetIndex: index,
          completedThrough: index - 1,
          routeProgressLength: wp.length,
          taskType: "orbit",
          taskLabel: wp.task.label,
          center: { x: wp.x, y: wp.y },
          radius,
          turns,
          startAngle
        };
        const orbitLength = Math.PI * 2 * radius * Math.abs(turns);
        taskPhase.start = 0;
        taskPhase.end = Math.max(1, orbitLength * 1000 / taskSpeed);
      }

      const ingressControl = Math.max(18, Math.min(44, Math.hypot(taskEntry.x - routeEntry.x, taskEntry.y - routeEntry.y) * .55));
      const ingress = {
        type: "task-ingress",
        missionPhase: "TASK_INGRESS",
        start: cursor,
        fromRouteLength: approachLength,
        toRouteLength: wp.length,
        targetIndex: index,
        completedThrough: index - 1,
        taskType: wp.task.pattern,
        taskLabel: wp.task.label,
        p0: { x: routeEntry.x, y: routeEntry.y },
        p1: { x: routeEntry.x + routeEntryTangent.x * ingressControl, y: routeEntry.y + routeEntryTangent.y * ingressControl },
        p2: { x: taskEntry.x - taskEntryTangent.x * ingressControl, y: taskEntry.y - taskEntryTangent.y * ingressControl },
        p3: { x: taskEntry.x, y: taskEntry.y }
      };
      cursor = addCurvePhase(cursor, ingress, taskSpeed);

      const taskDuration = taskPhase.end;
      taskPhase.start = cursor;
      taskPhase.end = cursor + taskDuration;
      timeline.push(taskPhase);
      cursor = taskPhase.end;

      const egressControl = Math.max(18, Math.min(44, Math.hypot(routeExit.x - taskExit.x, routeExit.y - taskExit.y) * .55));
      const egress = {
        type: "task-egress",
        missionPhase: "TASK_EGRESS",
        start: cursor,
        fromRouteLength: wp.length,
        toRouteLength: exitLength,
        targetIndex: index + 1,
        taskIndex: index,
        completedThrough: index,
        taskType: wp.task.pattern,
        taskLabel: wp.task.label,
        p0: { x: taskExit.x, y: taskExit.y },
        p1: { x: taskExit.x + taskExitTangent.x * egressControl, y: taskExit.y + taskExitTangent.y * egressControl },
        p2: { x: routeExit.x - routeExitTangent.x * egressControl, y: routeExit.y - routeExitTangent.y * egressControl },
        p3: { x: routeExit.x, y: routeExit.y }
      };
      cursor = addCurvePhase(cursor, egress, taskSpeed);
      currentAircraftLength = exitLength;
    }

    motionEndMs = cursor;
    totalLoopMs = motionEndMs + endPauseMs;
  }

  function setAircraft(point, vector) {
    const angle = Math.atan2(vector.y, vector.x) * 180 / Math.PI + 90;
    publishFlightState(point, angle);
    aircraft.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);
  }

  function setAircraftOnRoute(length) {
    const clamped = Math.max(0, Math.min(routeLength, length));
    const p = routeBase.getPointAtLength(clamped);
    const tangent = routeTangentAt(clamped);
    setAircraft(p, tangent);
  }

  function deviatedRoutePoint(phase, localT) {
    const t = clamp01(localT);
    const length = phase.fromAircraftLength + (phase.toAircraftLength - phase.fromAircraftLength) * t;
    const point = routeBase.getPointAtLength(length);
    const tangent = routeTangentAt(length);
    const normal = { x: -tangent.y, y: tangent.x };
    const amplitude = cfg.animation.crossTrackAmplitudePx ?? 0;
    const envelope = Math.pow(Math.sin(Math.PI * t), 2);
    const wave = Math.sin((phase.deviationSeed ?? 0) + t * Math.PI * 2 * (phase.deviationCycles ?? 1));
    const offset = amplitude * envelope * wave;
    return { x: point.x + normal.x * offset, y: point.y + normal.y * offset };
  }

  function setRouteProgress(length, cameraMode = "MISSION", phaseProgress = 0) {
    const clamped = Math.max(0, Math.min(routeLength, length));
    routeProgress.style.strokeDashoffset = `${routeLength - clamped}`;
    const progress = clamped / routeLength;

    let cameraEase;
    if (cameraMode === "RTB") {
      const t = clamp01(phaseProgress);
      const smooth = t * t * (3 - 2 * t);
      cameraEase = 1 - smooth;
    } else if (cameraMode === "COMPLETE") {
      cameraEase = 0;
    } else {
      const outbound = Math.max(0, Math.min(1, clamped / Math.max(1, cameraOutboundLength)));
      cameraEase = outbound * outbound * (3 - 2 * outbound);
    }

    const x = cfg.map.startX + (cfg.map.endX - cfg.map.startX) * cameraEase;
    const y = cfg.map.startY + (cfg.map.endY - cfg.map.startY) * cameraEase;
    mapWorld.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (workspace) {
      workspace.style.setProperty("--map-x", `${x}px`);
      workspace.style.setProperty("--map-y", `${y}px`);
    }
    progressText.textContent = `${String(Math.round(progress * 100)).padStart(2, "0")}%`;
  }

  function updateWaypointState(activeIndex, completedThrough) {
    const update = item => {
      const index = Number(item.dataset.waypointList ?? item.dataset.waypoint);
      item.classList.toggle("active", index === activeIndex);
      item.classList.toggle("completed", index <= completedThrough && index !== activeIndex);
    };
    document.querySelectorAll("[data-waypoint-list]").forEach(update);
    document.querySelectorAll("#waypoint-layer .waypoint").forEach(update);
  }

  function updateAOIs(completedThrough, activeIndex = -1, taskProgress = 0) {
    document.querySelectorAll("[data-aoi]").forEach(box => {
      const index = Number(box.dataset.aoi);
      const complete = index <= completedThrough;
      const active = index === activeIndex;
      box.classList.add("started");
      box.classList.toggle("completed", complete);
      box.classList.toggle("active", active);
      box.style.setProperty("--task-progress", String(clamp01(taskProgress)));
    });
  }

  function missionTarget(index) {
    const wp = waypointMeta[index];
    return wp ? { targetIndex: index, targetId: wp.id, targetKind: wp.kind || "nav" } : { targetIndex: -1, targetId: "", targetKind: "" };
  }

  function publishPhaseState(phase, localT, taskProgress = 0) {
    const target = missionTarget(phase.targetIndex);
    publishMissionState({
      phase: phase.missionPhase || "NAV",
      ...target,
      completedThrough: phase.completedThrough,
      taskType: phase.taskType || null,
      taskLabel: phase.taskLabel || null,
      taskProgress: clamp01(taskProgress),
      routeProgress: routeLength ? Math.max(0, Math.min(1, (
        phase.type === "travel"
          ? phase.fromAircraftLength + (phase.toAircraftLength - phase.fromAircraftLength) * clamp01(localT)
          : phase.toRouteLength != null
            ? phase.fromRouteLength + (phase.toRouteLength - phase.fromRouteLength) * clamp01(localT)
            : phase.routeProgressLength ?? 0
      ) / routeLength)) : 0
    });
  }

  function renderTravel(phase, localT) {
    const t = clamp01(localT);
    const aircraftLength = phase.fromAircraftLength + (phase.toAircraftLength - phase.fromAircraftLength) * t;
    const point = deviatedRoutePoint(phase, t);
    const before = deviatedRoutePoint(phase, Math.max(0, t - .004));
    const after = deviatedRoutePoint(phase, Math.min(1, t + .004));
    setAircraft(point, { x: after.x - before.x, y: after.y - before.y });
    setRouteProgress(aircraftLength, phase.missionPhase, t);
    updateWaypointState(phase.targetIndex, phase.completedThrough);
    updateAOIs(phase.completedThrough);
    publishPhaseState(phase, t);
  }

  function renderCurve(phase, localT) {
    const traveled = phase.curveLength * clamp01(localT);
    const t = curveTAtDistance(phase, traveled);
    const point = cubicPoint(phase, t);
    const vector = cubicDerivative(phase, t);
    const routeFraction = phase.curveLength ? traveled / phase.curveLength : 1;
    const progressLength = phase.fromRouteLength + (phase.toRouteLength - phase.fromRouteLength) * routeFraction;
    setAircraft(point, vector);
    setRouteProgress(progressLength);
    const activeTask = phase.type === "task-ingress" ? phase.targetIndex : phase.taskIndex ?? -1;
    updateWaypointState(phase.targetIndex, phase.completedThrough);
    updateAOIs(phase.completedThrough, activeTask, phase.type === "task-ingress" ? routeFraction * .12 : 1);
    publishPhaseState(phase, routeFraction, phase.type === "task-ingress" ? routeFraction * .12 : 1);
  }

  function renderTaskOrbit(phase, localT) {
    const progress = clamp01(localT);
    const angle = phase.startAngle + Math.PI * 2 * phase.turns * progress;
    const point = {
      x: phase.center.x + Math.cos(angle) * phase.radius,
      y: phase.center.y + Math.sin(angle) * phase.radius
    };
    const direction = phase.turns >= 0 ? 1 : -1;
    const tangent = { x: -Math.sin(angle) * direction, y: Math.cos(angle) * direction };
    setAircraft(point, tangent);
    setRouteProgress(phase.routeProgressLength);
    updateWaypointState(phase.targetIndex, phase.completedThrough);
    updateAOIs(phase.completedThrough, phase.targetIndex, progress);
    publishPhaseState(phase, progress, progress);
  }

  function renderTaskSweep(phase, localT) {
    const progress = clamp01(localT);
    const pose = polylinePose(phase, phase.pathLength * progress);
    setAircraft(pose.point, pose.vector);
    setRouteProgress(phase.routeProgressLength);
    updateWaypointState(phase.targetIndex, phase.completedThrough);
    updateAOIs(phase.completedThrough, phase.targetIndex, progress);
    publishPhaseState(phase, progress, progress);
  }

  function renderEnd() {
    const lastIndex = waypointMeta.length - 1;
    setAircraftOnRoute(routeLength);
    setRouteProgress(routeLength, "COMPLETE", 1);
    updateWaypointState(-1, lastIndex);
    updateAOIs(lastIndex);
    publishMissionState({
      phase: "COMPLETE",
      targetIndex: -1,
      targetId: "STG",
      targetKind: "recovery",
      completedThrough: lastIndex,
      taskType: null,
      taskLabel: null,
      taskProgress: 1,
      routeProgress: 1
    });
  }

  function renderAtElapsed(elapsed) {
    if (!timeline.length) return;
    if (elapsed >= motionEndMs) {
      renderEnd();
      return;
    }
    const phase = timeline.find(item => elapsed >= item.start && elapsed < item.end) || timeline[0];
    const localT = clamp01((elapsed - phase.start) / Math.max(1, phase.end - phase.start));
    if (phase.type === "travel") renderTravel(phase, localT);
    else if (phase.type === "task-ingress" || phase.type === "task-egress") renderCurve(phase, localT);
    else if (phase.type === "task-orbit") renderTaskOrbit(phase, localT);
    else if (phase.type === "task-sweep") renderTaskSweep(phase, localT);
  }

  function animationFrame(now) {
    if (running && totalLoopMs > 1) {
      const elapsed = (now - loopStarted) % totalLoopMs;
      renderAtElapsed(elapsed);
    }
    requestAnimationFrame(animationFrame);
  }

  function throughputSample(timeMs) {
    const t = timeMs / 1000;
    const carrier = 5.3 * Math.sin(t * 1.12);
    const ripple = 2.7 * Math.sin(t * 3.15 + .8);
    const fine = 1.3 * Math.sin(t * 7.2 + 2.1);
    const burst = 3.0 * Math.pow(Math.max(0, Math.sin(t * .38 + 1.4)), 7);
    return Math.max(7, Math.min(41, 24 + carrier + ripple + fine - burst));
  }

  function animateSparkline(now) {
    if (!sparkPath) return;
    if (!sparkSamples.length) {
      for (let i = sparkCount - 1; i >= 0; i--) sparkSamples.push(throughputSample(now - i * sparkStepMs));
      sparkLastStep = now;
    }
    while (now - sparkLastStep >= sparkStepMs) {
      sparkLastStep += sparkStepMs;
      sparkSamples.push(throughputSample(sparkLastStep));
      if (sparkSamples.length > sparkCount) sparkSamples.shift();
    }
    const fractionalScroll = Math.max(0, Math.min(1, (now - sparkLastStep) / sparkStepMs));
    const dx = 170 / (sparkCount - 2);
    const points = sparkSamples.map((value, i) => `${(i * dx - dx * fractionalScroll).toFixed(2)},${value.toFixed(2)}`);
    sparkPath.setAttribute("d", `M ${points.join(" L ")}`);
    requestAnimationFrame(animateSparkline);
  }

  function restart() {
    loopStarted = performance.now();
    renderAtElapsed(0);
  }

  function togglePause() {
    if (running) {
      pausedAt = performance.now();
      running = false;
    } else {
      loopStarted += performance.now() - pausedAt;
      running = true;
    }
  }

  function init() {
    installEffectsStylesheet();
    applyTheme();
    bindText();
    ["platform", "sensors", "payload"].forEach(buildPanel);
    buildMap();
    fitDisplay();
    window.addEventListener("resize", fitDisplay);
    window.addEventListener("keydown", event => {
      if (event.code === "Space") { event.preventDefault(); togglePause(); }
      if (event.key.toLowerCase() === "r") restart();
    });
    requestAnimationFrame(animationFrame);
    requestAnimationFrame(animateSparkline);
  }

  init();
})();
