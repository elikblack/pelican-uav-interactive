(() => {
  const vv = window.visualViewport;
  const startedAt = performance.now();
  const events = [];
  let eventSerial = 0;

  let boot = 1;
  try {
    boot = Number(sessionStorage.getItem('pelicanViewportDebugBoot') || 0) + 1;
    sessionStorage.setItem('pelicanViewportDebugBoot', String(boot));
  } catch (_) {}

  const navEntry = performance.getEntriesByType?.('navigation')?.[0];
  const navType = navEntry?.type || 'unknown';

  const panel = document.createElement('pre');
  panel.id = 'viewport-debug';
  panel.setAttribute('aria-label', 'Viewport diagnostics');
  Object.assign(panel.style, {
    position: 'fixed',
    zIndex: '2147483647',
    left: '6px',
    top: '6px',
    margin: '0',
    padding: '7px 9px',
    maxWidth: 'calc(100vw - 12px)',
    color: '#d8ffbd',
    background: 'rgba(0, 0, 0, .88)',
    border: '1px solid rgba(166, 236, 125, .78)',
    borderRadius: '2px',
    font: '10px/1.22 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    letterSpacing: '0',
    whiteSpace: 'pre',
    pointerEvents: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none'
  });
  document.body.appendChild(panel);

  function n(value, digits = 1) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : '-';
  }

  function size(width, height) {
    return `${n(width, 0)}x${n(height, 0)}`;
  }

  function orientationText() {
    const so = screen.orientation;
    if (so) return `${so.type || '?'} ${n(so.angle, 0)}°`;
    return `legacy ${n(window.orientation, 0)}°`;
  }

  function touchSummary(event) {
    if (!event?.touches) return '';
    return ` touches=${event.touches.length}`;
  }

  function log(name, detail = '') {
    const t = ((performance.now() - startedAt) / 1000).toFixed(2);
    events.unshift(`${String(++eventSerial).padStart(3, '0')} ${t}s ${name}${detail}`);
    events.length = Math.min(events.length, 8);
    render();
  }

  function render() {
    const de = document.documentElement;
    const display = document.getElementById('primary-display');
    const rect = display?.getBoundingClientRect();
    const transform = display?.style.transform || getComputedStyle(display || document.body).transform || '-';
    const safeMode = de.classList.contains('ios-safe-compositing') ? 'ON' : 'off';
    const fitMode = window.__PRIMARY_FIT_MODE || 'pending';
    const fitScale = window.__PRIMARY_FIT_SCALE;

    panel.textContent = [
      `VIEWPORT DEBUG  boot:${boot} nav:${navType}`,
      `safeFX  ${safeMode}  fit:${fitMode}${Number.isFinite(fitScale) ? ` ${n(fitScale, 3)}` : ''}`,
      `inner   ${size(innerWidth, innerHeight)}  outer ${size(outerWidth, outerHeight)}`,
      `client  ${size(de.clientWidth, de.clientHeight)}  screen ${size(screen.width, screen.height)}`,
      vv
        ? `visual  ${size(vv.width, vv.height)}  scale ${n(vv.scale, 3)}`
        : 'visual  unavailable',
      vv
        ? `vv off  ${n(vv.offsetLeft, 1)},${n(vv.offsetTop, 1)}  page ${n(vv.pageLeft, 1)},${n(vv.pageTop, 1)}`
        : '',
      `scroll  ${n(scrollX, 1)},${n(scrollY, 1)}  dpr ${n(devicePixelRatio, 2)}`,
      `orient  ${orientationText()}`,
      rect ? `display ${size(rect.width, rect.height)} @ ${n(rect.left, 0)},${n(rect.top, 0)}` : 'display unavailable',
      `xfm     ${transform}`,
      'EVENTS newest first:',
      ...events
    ].filter(Boolean).join('\n');
  }

  const windowEvents = ['resize', 'scroll', 'orientationchange', 'pageshow', 'pagehide'];
  windowEvents.forEach(name => {
    window.addEventListener(name, event => {
      let detail = '';
      if (name === 'pageshow' || name === 'pagehide') detail = ` persisted=${Boolean(event.persisted)}`;
      log(`win:${name}`, detail);
    }, { capture: true, passive: true });
  });

  ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(name => {
    window.addEventListener(name, event => log(name, touchSummary(event)), { capture: true, passive: true });
  });

  ['gesturestart', 'gesturechange', 'gestureend'].forEach(name => {
    window.addEventListener(name, event => {
      log(name, ` scale=${n(event.scale, 3)} rot=${n(event.rotation, 1)}`);
    }, { capture: true, passive: true });
  });

  if (vv) {
    vv.addEventListener('resize', () => log('vv:resize'), { passive: true });
    vv.addEventListener('scroll', () => log('vv:scroll'), { passive: true });
  }

  document.addEventListener('visibilitychange', () => log(`visibility:${document.visibilityState}`), { passive: true });
  window.addEventListener('beforeunload', () => {
    try {
      sessionStorage.setItem('pelicanViewportDebugLastUnload', String(Date.now()));
    } catch (_) {}
  }, { capture: true });

  log('debug:init');
  setInterval(render, 100);
})();
