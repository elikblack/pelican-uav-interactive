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

## Lineage

Initial screen implementations and assets were migrated from `elikblack/pelican-uav-display`. The secondary starts from the large-text/readability fork rather than the original small-format secondary.
