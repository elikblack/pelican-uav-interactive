(() => {
  const params = new URLSearchParams(location.search);
  const touchDevice = navigator.maxTouchPoints > 0;
  const forceTransform = params.get('fit') === 'transform';
  const forceZoom = params.get('fit') === 'zoom';

  if ((!touchDevice && !forceZoom) || forceTransform) {
    window.__PRIMARY_FIT_MODE = 'transform';
    return;
  }

  const display = document.getElementById('primary-display');
  const host = document.getElementById('screen-fit');
  if (!display || !host) return;

  function applyZoomFit() {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);

    // Replace the whole-screen compositor transform with layout-level CSS zoom.
    // Safari has long supported zoom, and this avoids maintaining a giant
    // transformed 1920x1080 layer while the browser itself is pinch-zooming.
    display.style.position = 'relative';
    display.style.left = 'auto';
    display.style.top = 'auto';
    display.style.transform = 'none';
    display.style.transformOrigin = 'center';
    display.style.zoom = String(scale);

    window.__PRIMARY_FIT_MODE = 'css-zoom';
    window.__PRIMARY_FIT_SCALE = scale;
  }

  applyZoomFit();

  window.addEventListener('orientationchange', () => {
    setTimeout(applyZoomFit, 400);
  }, { passive: true });
})();
