# pelican-uav-interactive

Interactive descendant of `pelican-uav-display`. The original repository is treated as the frozen v1 prop/display artifact; this repository is free to evolve into a coordinated two-screen system.

## Displays

- `primary/index.html` — 1920×1080 primary ground-control display.
- `secondary/index.html` — 1920×480 large-format secondary instrument display.
- `index.html` — lightweight development launcher for opening either display.

## Structure

```text
primary/            Primary display markup, styling, configuration and behavior
secondary/          Secondary display markup, instrument styling and behavior
shared/
  ui-base.css       Shared palette, global reset, fixed-canvas fitting and scanline treatment
  state.js          Cross-window state boundary using BroadcastChannel
  assets/           Terrain and weather imagery used by the displays
```

The migration intentionally keeps display-specific CSS and JavaScript local instead of prematurely turning everything into shared abstractions. New interactive behavior that genuinely affects both displays should cross through `shared/state.js`.

## Data ownership

- `primary/primary.js` owns mission motion and geometry. It produces the raw local `UAV_FLIGHT` position/heading stream and `UAV_MISSION` execution state.
- `primary/ops-refine.js` augments local flight motion into instrument facts such as ground speed, planned course and cross-track error. It also owns the current synthetic altitude, vertical-speed and endurance model, then bridges aircraft and mission facts into shared state.
- `shared/state.js` is the cross-display bus, not a simulator. Aircraft, mission, navigation and ground-station facts should have one producer and any number of consumers.
- Shared ground-station status values (`power`, `link`, transmitter power and `diagnostics`) are rendered by `shared/status-sync.js`; display-local scripts should not generate competing copies.
- The secondary mission page, heading instrument and weather bearing scale consume shared aircraft/mission state rather than maintaining independent flight simulations.
- Secondary payload behavior and local air-radar contacts remain intentionally display-local simulations until a shared producer is defined for those systems.

## Lineage

Initial screen implementations and assets were migrated from `elikblack/pelican-uav-display`. The secondary starts from the large-text/readability fork rather than the original small-format secondary.
