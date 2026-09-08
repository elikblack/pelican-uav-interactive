(() => {
  const params = new URLSearchParams(location.search);
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const ua = navigator.userAgent || '';
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && maxTouchPoints > 1);
  const forceTransform = params.get('fit') === 'transform';
  const forceZoom = params.get('fit') === 'zoom';
  const useCssZoom = !forceTransform && (forceZoom || isAppleTouch);

  // primary.js owns the normal desktop transform fit and registers one resize
  // listener for it. In CSS-zoom mode, ios-layout-fit.js owns fitting instead.
  // Suppress only that registration so Safari pinch/browser-chrome resize noise
  // can never reintroduce the whole-screen transform that crashes WebKit.
  if (!useCssZoom) return;

  const nativeAddEventListener = window.addEventListener;
  let intercepted = false;

  window.addEventListener = function(type, listener, options) {
    if (!intercepted && type === 'resize' && typeof listener === 'function') {
      intercepted = true;
      window.addEventListener = nativeAddEventListener;
      return;
    }
    return nativeAddEventListener.call(this, type, listener, options);
  };

  setTimeout(() => {
    if (!intercepted) window.addEventListener = nativeAddEventListener;
  }, 0);
})();
