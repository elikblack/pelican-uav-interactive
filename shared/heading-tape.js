(() => {
  const shared = window.UAV_SHARED;
  if (!shared) return;

  const currentScript = document.currentScript;
  if (!document.querySelector('link[data-heading-tape-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.headingTapeCss = 'true';
    link.href = currentScript?.src
      ? new URL('heading-tape.css?v=20260907-2', currentScript.src).href
      : '../shared/heading-tape.css?v=20260907-2';
    document.head.appendChild(link);
  }

  const PX_PER_DEG = 5;
  const START_DEG = -1080;
  const END_DEG = 2520;
  const STEP_DEG = 5;
  const RESPONSE_MS = 125;

  function normalize(value) {
    return (value % 360 + 360) % 360;
  }

  function shortestDelta(from, to) {
    return ((to - from + 540) % 360) - 180;
  }

  function formatLabel(value) {
    return String(Math.round(normalize(value))).padStart(3, '0');
  }

  function build(tape) {
    if (tape.dataset.headingTapeReady === 'true') return;
    tape.dataset.headingTapeReady = 'true';

    const scale = document.createElement('div');
    scale.className = 'heading-tape-scale';
    scale.dataset.headingTapeScale = '';
    scale.style.width = `${(END_DEG - START_DEG) * PX_PER_DEG}px`;

    const fragment = document.createDocumentFragment();
    for (let degree = START_DEG; degree <= END_DEG; degree += STEP_DEG) {
      const x = (degree - START_DEG) * PX_PER_DEG;
      const normalized = normalize(degree);
      const major = normalized % 10 === 0;
      const emphasis = normalized % 30 === 0;

      const tick = document.createElement('i');
      tick.className = `heading-tape-tick${major ? ' major' : ''}${emphasis ? ' emphasis' : ''}`;
      tick.style.left = `${x}px`;
      fragment.appendChild(tick);

      if (major) {
        const label = document.createElement('span');
        label.className = `heading-tape-label${emphasis ? ' emphasis' : ''}`;
        label.style.left = `${x}px`;
        label.textContent = formatLabel(degree);
        fragment.appendChild(label);
      }
    }

    scale.appendChild(fragment);
    tape.appendChild(scale);

    const lubber = document.createElement('i');
    lubber.className = 'heading-tape-lubber';
    lubber.setAttribute('aria-hidden', 'true');
    tape.appendChild(lubber);
  }

  const tapes = [...document.querySelectorAll('[data-heading-tape]')];
  tapes.forEach(build);

  let targetNormalized = null;
  let targetUnwrapped = null;
  let displayedUnwrapped = null;
  let lastFrame = performance.now();

  function receive(state) {
    const heading = Number(state?.aircraft?.headingDeg);
    if (!Number.isFinite(heading)) return;
    const normalized = normalize(heading);

    if (!Number.isFinite(targetNormalized) || !Number.isFinite(targetUnwrapped)) {
      targetNormalized = normalized;
      targetUnwrapped = normalized;
      displayedUnwrapped = normalized;
      return;
    }

    targetUnwrapped += shortestDelta(targetNormalized, normalized);
    targetNormalized = normalized;
  }

  function recenterIfNeeded() {
    if (!Number.isFinite(displayedUnwrapped) || !Number.isFinite(targetUnwrapped)) return;
    if (displayedUnwrapped > 1800 || displayedUnwrapped < -360) {
      const shift = Math.round((displayedUnwrapped - 720) / 360) * 360;
      displayedUnwrapped -= shift;
      targetUnwrapped -= shift;
    }
  }

  function paint(now) {
    if (Number.isFinite(targetUnwrapped)) {
      if (!Number.isFinite(displayedUnwrapped)) displayedUnwrapped = targetUnwrapped;
      const dt = Math.min(80, Math.max(0, now - lastFrame));
      const alpha = 1 - Math.exp(-dt / RESPONSE_MS);
      displayedUnwrapped += (targetUnwrapped - displayedUnwrapped) * alpha;
      if (Math.abs(targetUnwrapped - displayedUnwrapped) < .002) displayedUnwrapped = targetUnwrapped;
      recenterIfNeeded();

      tapes.forEach(tape => {
        const scale = tape.querySelector('[data-heading-tape-scale]');
        if (scale) {
          const offset = (displayedUnwrapped - START_DEG) * PX_PER_DEG;
          scale.style.transform = `translate3d(${-offset}px,0,0)`;
        }

        const display = String(Math.round(normalize(displayedUnwrapped))).padStart(3, '0');
        tape.setAttribute('aria-label', `True heading ${display} degrees`);
      });
    }

    lastFrame = now;
    requestAnimationFrame(paint);
  }

  shared.subscribe(receive);
  requestAnimationFrame(paint);
})();
