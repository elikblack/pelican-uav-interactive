(() => {
  // Safari can fire ordinary window resize events during pinch zoom, sometimes
  // before visualViewport.scale has caught up. primary.js treats every resize
  // as a request to re-fit the fixed 1920x1080 canvas, so one stray event can
  // fight the browser's own zoom and make the page jump back toward fit-to-screen.
  //
  // Detect the gesture itself as well as the visualViewport scale, and ignore
  // resize noise that does not represent a genuine layout-width change.
  let touchCount = 0;
  let pinching = false;
  let stableWidth = document.documentElement.clientWidth;
  let stableHeight = document.documentElement.clientHeight;

  const visualViewport = window.visualViewport;

  function viewportIsMagnified() {
    return visualViewport && Math.abs(visualViewport.scale - 1) > .015;
  }

  function rememberStableViewport() {
    stableWidth = document.documentElement.clientWidth;
    stableHeight = document.documentElement.clientHeight;
  }

  window.addEventListener('touchstart', event => {
    touchCount = event.touches.length;
    if (touchCount >= 2) pinching = true;
  }, { capture: true, passive: true });

  window.addEventListener('touchmove', event => {
    touchCount = event.touches.length;
    if (touchCount >= 2) pinching = true;
  }, { capture: true, passive: true });

  const finishTouch = event => {
    touchCount = event.touches.length;
    if (touchCount < 2) pinching = false;
  };
  window.addEventListener('touchend', finishTouch, { capture: true, passive: true });
  window.addEventListener('touchcancel', finishTouch, { capture: true, passive: true });

  window.addEventListener('resize', event => {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const widthChanged = Math.abs(width - stableWidth) > 2;
    const heightChanged = Math.abs(height - stableHeight) > 2;

    // Pinch zoom, including Safari's first resize event before scale updates.
    if (pinching || viewportIsMagnified()) {
      event.stopImmediatePropagation();
      return;
    }

    // Safari's browser chrome can create height-only resize noise. The primary
    // display should not rescale just because the URL bar moved.
    if (!widthChanged && heightChanged) {
      event.stopImmediatePropagation();
      return;
    }

    // Duplicate/no-op resize event. There is nothing for primary.js to fit.
    if (!widthChanged && !heightChanged) {
      event.stopImmediatePropagation();
      return;
    }

    // A genuine layout-width change (desktop resize or orientation change).
    rememberStableViewport();
  }, true);

  window.addEventListener('orientationchange', () => {
    // Let Safari finish settling the layout before accepting its new baseline.
    setTimeout(rememberStableViewport, 350);
  }, { passive: true });
})();
