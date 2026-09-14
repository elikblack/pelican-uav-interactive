(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const XLINK_NS = 'http://www.w3.org/1999/xlink';

  function mountAirBackground() {
    const plot = document.querySelector('.air-module .airspace-plot');
    if (!plot) return;

    if (!plot.querySelector('.airspace-background-v3')) {
      const image = document.createElementNS(SVG_NS, 'image');
      const href = 'air-background-v3.svg?v=20260913-2';

      image.classList.add('airspace-background-v3');
      image.setAttribute('x', '0');
      image.setAttribute('y', '0');
      image.setAttribute('width', '390');
      image.setAttribute('height', '320');
      image.setAttribute('preserveAspectRatio', 'none');
      image.setAttribute('href', href);
      image.setAttributeNS(XLINK_NS, 'xlink:href', href);
      image.setAttribute('aria-hidden', 'true');

      plot.insertBefore(image, plot.firstChild);
    }

    /* SVG-element CSS backgrounds are inconsistently painted across browsers.
       Once the real image node is mounted, clear the CSS background-image path. */
    plot.style.background = '#020402';

    const legacyGeometry = plot.querySelector('.airspace-geometry');
    if (legacyGeometry) legacyGeometry.style.opacity = '0';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAirBackground, { once: true });
  } else {
    mountAirBackground();
  }
})();
