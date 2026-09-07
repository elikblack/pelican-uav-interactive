(() => {
  const shared = window.UAV_SHARED;
  if (!shared) return;

  const currentScript = document.currentScript;
  if (!document.querySelector('link[data-heading-tape-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.headingTapeCss = 'true';
    link.href = currentScript?.src
      ? new URL('heading-tape.css?v=20260907-1', currentScript.src).href
      : '../shared/heading-tape.css?v=20260907-1';
    document.head.appendChild(link);
  }

  const PX_PER_DEG = 5;
  const START_DEG = -1080;
  const END_DEG = 2520;
  const STEP_DEG = 5;

  function normalize(value) {
    return (value % 360 + 360) % 360;
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

  function render(state) {
    const heading = Number(state?.aircraft?.headingDeg);
    if (!Number.isFinite(heading)) return;
    const normalized = normalize(heading);

    document.querySelectorAll('[data-heading-tape]').forEach(tape => {
      build(tape);

      const previousNormalized = Number(tape.dataset.headingNormalized);
      let unwrapped = Number(tape.dataset.headingUnwrapped);
      if (!Number.isFinite(previousNormalized) || !Number.isFinite(unwrapped)) {
        unwrapped = normalized;
      } else {
        const delta = ((normalized - previousNormalized + 540) % 360) - 180;
        unwrapped += delta;
      }

      tape.dataset.headingNormalized = String(normalized);
      tape.dataset.headingUnwrapped = String(unwrapped);

      const scale = tape.querySelector('[data-heading-tape-scale]');
      if (scale) {
        const offset = (unwrapped - START_DEG) * PX_PER_DEG;
        scale.style.transform = `translateX(${-offset}px)`;
      }

      const display = String(Math.round(normalized)).padStart(3, '0');
      tape.setAttribute('aria-label', `True heading ${display} degrees`);
    });
  }

  shared.subscribe(render);
})();
