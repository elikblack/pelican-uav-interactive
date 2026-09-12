window.DISPLAY_CONFIG = {
  canvas: { width: 1920, height: 1080 },

  theme: {
    background: "#010301",
    panel: "rgba(2, 8, 4, 0.78)",
    panelSoft: "rgba(4, 13, 7, 0.72)",
    green: "#77c95b",
    greenDim: "#345f30",
    cyan: "#63d2d8",
    routeDone: "#315c58",
    throughputYellow: "#f2d35e",
    throughputOrange: "#ed8b2f",
    amber: "#d7aa35",
    red: "#d95750",
    text: "#b3caaa",
    muted: "#70866a"
  },

  labels: {
    title: "GROUND CONTROL",
    subtitle: "MISSION CONTROL",
    system: "READY",
    link: "GOOD",
    gps: "LOCK",
    mode: "EXECUTE",
    area: "ALPHA",
    operator: "OPERATOR 01"
  },

  mission: {
    plan: "ALPHA_01",
    type: "RECONNAISSANCE",
    launch: "MANUAL",
    start: "STAGING AREA",
    duration: "00:38",
    state: "IN PROGRESS"
  },

  panels: {
    platform: {
      title: "PLATFORM STATUS",
      rows: [
        ["AIRFRAME", "READY"],
        ["PROPULSION", "NOMINAL"],
        ["POWER", "NOMINAL"],
        ["NAVIGATION", "READY"],
        ["COMMS", "READY"],
        ["PAYLOAD SYS", "STANDBY"],
        ["DATA RECORDER", "READY"]
      ]
    },
    sensors: {
      title: "SENSORS",
      rows: [
        ["EO / IR", "STANDBY"],
        ["SAR", "STANDBY"],
        ["MTI", "STANDBY"],
        ["SIGINT", "OFFLINE", "muted"],
        ["LIDAR", "N/A", "muted"]
      ]
    },
    payload: {
      title: "PAYLOAD",
      rows: [
        ["GIMBAL", "PARKED"],
        ["ZOOM", "1.0×", "muted"],
        ["RECORDER", "READY"],
        ["MODE", "IDLE"]
      ]
    },
    datalink: { title: "DATALINK / TELEMETRY", rows: [] }
  },

  map: {
    image: "../shared/assets/terrain-desert.jpg",
    worldWidth: 2400,
    worldHeight: 1028,
    nmPerPx: window.UAV_WORLD?.missionMap?.nmPerPx ?? 0.0113,
    startX: -664,
    startY: -60,
    endX: -884,
    endY: -124
  },

  animation: {
    aircraftSpeedPxPerSec: 20,
    cruiseGroundSpeedKt: 188,
    crossTrackAmplitudePx: 5,
    taskIngressPx: 52,
    taskEgressPx: 52,
    endPauseMs: 3200,
    aoiSize: 126
  },

  throughput: {
    stepMs: 185
  },

  // The route describes mission intent. NAV points are simple routing fixes;
  // TASK points own an AOI and a maneuver pattern; the hidden RTB point closes
  // the planned route back at staging without drawing a duplicate marker.
  route: {
    waypoints: [
      { id: "STG", label: "STAGING", x: 730, y: 254, kind: "staging" },
      { id: "WPT 1", label: "NAV", x: 1152, y: 254, kind: "nav" },
      {
        id: "AOI 1", label: "SURVEY AREA", x: 1345, y: 477, kind: "task",
        task: { pattern: "orbit", label: "AREA SURVEY", radius: 50, turns: 1, speedMultiplier: 0.82 }
      },
      { id: "WPT 2", label: "NAV", x: 1217, y: 719, kind: "nav" },
      {
        id: "AOI 2", label: "SEARCH AREA", x: 1141, y: 951, kind: "task",
        task: { pattern: "sweep", label: "SEARCH PATTERN", width: 118, height: 78, passes: 5, angleDeg: -10, speedMultiplier: 0.72 }
      },
      { id: "RTB", label: "STAGING AREA", x: 730, y: 254, kind: "recovery", marker: false, list: false }
    ]
  }
};
