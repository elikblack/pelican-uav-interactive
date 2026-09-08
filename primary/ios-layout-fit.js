(() => {
  const params = new URLSearchParams(location.search);
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const ua = navigator.userAgent || '';
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && maxTouchPoints > 1);
  const forceTransform = params.get('fit') === 'transform';
  const forceZoom = params.get('fit') === 'zoom';
  const useCssZoom = !forceTransform && (forceZoom || isAppleTouch);

  window.__PRIMARY_FIT_MODE = useCssZoom ? 'css-zoom' : 'transform';
  if (!useCssZoom) return;

  const display = document.getElementById('primary-display');
  const host = document.getElementById('screen-fit');
  if (!display || !host) return;

  const canvasWidth = Number(window.DISPLAY_CONFIG?.canvas?.width) || 1920;
  const canvasHeight = Number(window.DISPLAY_CONFIG?.canvas?.height) || 1080;

  // Give the grid a real, already-scaled box to center. The display itself is
  // absolutely positioned inside and scaled with CSS zoom. This reproduces the
  // old fit geometry without asking WebKit to pinch-zoom a giant transformed
  // 1920x1080 compositor surface.
  let shell = document.getElementById('primary-layout-fit-shell');
  if (!shell) {
    shell = document.createElement('div');
    shell.id = 'primary-layout-fit-shell';
    host.insertBefore(shell, display);
    shell.appendChild(display);
  }

  Object.assign(shell.style, {
    position: 'relative',
    flex: '0 0 auto',
    margin: '0',
    padding: '0'
  });

  function baseViewportSize() {
    const vv = window.visualViewport;
    // visualViewport is the best measure of the actually visible Safari area,
    // but not while the user is already pinch-zoomed.
    if (vv && Math.abs(vv.scale - 1) < .02) {
      return { width: vv.width, height: vv.height };
    }
    return {
      width: document.documentElement.clientWidth || window.innerWidth,
      height: document.documentElement.clientHeight || window.innerHeight
    };
  }

  function applyZoomFit() {
    const viewport = baseViewportSize();
    const scale = Math.min(viewport.width / canvasWidth, viewport.height / canvasHeight);

    shell.style.width = `${canvasWidth * scale}px`;
    shell.style.height = `${canvasHeight * scale}px`;

    display.style.position = 'absolute';
    display.style.left = '0';
    display.style.top = '0';
    display.style.margin = '0';
    display.style.transform = 'none';
    display.style.transformOrigin = '0 0';
    display.style.zoom = String(scale);

    window.__PRIMARY_FIT_SCALE = scale;
  }

  applyZoomFit();

  let orientationTimer = 0;
  window.addEventListener('orientationchange', () => {
    clearTimeout(orientationTimer);
    orientationTimer = setTimeout(applyZoomFit, 450);
  }, { passive: true });

  window.addEventListener('pageshow', event => {
    if (event.persisted) setTimeout(applyZoomFit, 0);
  }, { passive: true });
})();
