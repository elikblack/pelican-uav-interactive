(() => {
  function mountAirBackground() {
    const radarBody = document.querySelector('.air-module .radar-module-body');
    const plot = radarBody && radarBody.querySelector('.airspace-plot');
    if (!radarBody || !plot) return;

    /* The wide AO artwork lives as its own surface behind the live SVG. Keeping
       it separate lets the map continue beneath the control and target-data
       overlays without stretching or relocating the live contacts. */
    let surface = radarBody.querySelector('.airspace-background-surface');
    if (!surface) {
      surface = document.createElement('img');
      surface.className = 'airspace-background-surface';
      surface.alt = '';
      surface.setAttribute('aria-hidden', 'true');
      surface.setAttribute('draggable', 'false');
      surface.decoding = 'async';
      radarBody.insertBefore(surface, plot);
    }
    surface.src = 'air-background-v5.svg?v=20260916-1';

    /* Remove the earlier SVG-in-SVG mount if it is still present from a cached
       script, then make the live plot transparent so the wide surface shows. */
    plot.querySelectorAll('.airspace-background-v3').forEach((node) => node.remove());
    plot.style.background = 'transparent';

    const legacyGeometry = plot.querySelector('.airspace-geometry');
    if (legacyGeometry) legacyGeometry.style.opacity = '0';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAirBackground, { once: true });
  } else {
    mountAirBackground();
  }
})();
