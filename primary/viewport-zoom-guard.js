(() => {
  // The fixed primary display only needs to refit when the device's physical
  // layout changes. On touch devices, Safari also emits window resize events
  // while pinch-zooming and moving browser chrome. Rather than trying to infer
  // which of those resize events are "real", intercept primary.js's one resize
  // registration and reroute it to orientationchange instead.
  //
  // Desktop/non-touch browsers keep the original resize behavior unchanged.
  const isTouchDevice = navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return;

  const nativeAddEventListener = window.addEventListener;
  let intercepted = false;

  window.addEventListener = function(type, listener, options) {
    if (!intercepted && type === 'resize' && typeof listener === 'function') {
      intercepted = true;

      nativeAddEventListener.call(window, 'orientationchange', () => {
        // Safari needs a moment to settle the new layout dimensions after a
        // physical rotation before the fixed 1920x1080 canvas is re-fit.
        setTimeout(() => listener.call(window, new Event('resize')), 350);
      }, { passive: true });

      // primary.js has registered its fitter. Put the native method back now so
      // later modules are not affected by this compatibility shim.
      window.addEventListener = nativeAddEventListener;
      return;
    }

    return nativeAddEventListener.call(this, type, listener, options);
  };

  // Safety valve in case primary.js ever stops registering a resize handler.
  // All scripts in the document execute synchronously before this fires.
  setTimeout(() => {
    if (!intercepted) window.addEventListener = nativeAddEventListener;
  }, 0);
})();
