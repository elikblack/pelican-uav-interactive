(() => {
  const WEATHER_FRAME_COUNT = 40;
  const WEATHER_FRAME_MS = 500;
  const WEATHER_FRAME_PATH = '../shared/assets/weather';

  const weatherBody = document.querySelector('.weather-sector-body');
  const weatherSvg = weatherBody && weatherBody.querySelector('.weather-sector');
  if (!weatherBody || !weatherSvg) return;

  const frames = Array.from({ length: WEATHER_FRAME_COUNT }, (_, index) =>
    `${WEATHER_FRAME_PATH}/weather-radar-frame-${String(index + 1).padStart(3, '0')}.png`
  );

  frames.forEach(src => {
    const preload = new Image();
    preload.src = src;
  });

  // secondary.js still creates the original weather layer. Replace it here so
  // the new sequence can be tuned independently while the old assets remain
  // available for comparison during development.
  const legacyFrame = weatherBody.querySelector('.weather-frame-layer');
  if (legacyFrame) legacyFrame.remove();

  const frame = document.createElement('img');
  frame.className = 'weather-frame-layer weather-frame-sequence';
  frame.alt = '';
  frame.setAttribute('aria-hidden', 'true');
  frame.src = frames[0];
  weatherBody.insertBefore(frame, weatherSvg);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frameIndex = 0;
  setInterval(() => {
    frameIndex = (frameIndex + 1) % frames.length;
    frame.src = frames[frameIndex];
  }, WEATHER_FRAME_MS);
})();
