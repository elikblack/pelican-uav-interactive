(() => {
  // iOS Safari fires window resize events while pinch-zooming. The primary
  // display normally responds to resize by re-fitting its fixed 1920x1080
  // canvas, which visually cancels the user's zoom. Stop later resize handlers
  // only while the visual viewport is actually magnified.
  function isPinchZoomed() {
    const viewport = window.visualViewport;
    return viewport && Math.abs(viewport.scale - 1) > .01;
  }

  window.addEventListener('resize', event => {
    if (isPinchZoomed()) event.stopImmediatePropagation();
  }, true);
})();
