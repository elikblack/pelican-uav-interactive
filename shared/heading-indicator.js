(() => {
  const shared = window.UAV_SHARED;
  if (!shared) return;

  const currentScript = document.currentScript;
  if (!document.querySelector('link[data-heading-indicator-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.headingIndicatorCss = 'true';
    link.href = currentScript?.src
      ? new URL('heading-indicator.css?v=20260907-2', currentScript.src).href
      : '../shared/heading-indicator.css?v=20260907-2';
    document.head.appendChild(link);
  }

  function upgradeReadout(id, variant) {
    const readout = document.getElementById(id);
    if (!readout || readout.matches('[data-heading-indicator]')) return;
    const indicator = document.createElement('div');
    indicator.className = `heading-indicator ${variant}`;
    indicator.dataset.headingIndicator = '';
    readout.replaceWith(indicator);
  }

  // The secondary Mission page exposes a numeric heading field. Upgrade it in
  // place so the page itself does not need to know about the instrument.
  upgradeReadout('mission-heading', 'heading-indicator-mission');

  const labels = ['N','3','6','E','12','15','S','21','24','27','W','33'];
  const ticks = Array.from({ length: 36 }, (_, index) => {
    const major = index % 3 === 0;
    return `<line class="${major ? 'heading-tick-major' : 'heading-tick-minor'}" x1="60" y1="${major ? 7 : 9}" x2="60" y2="${major ? 17 : 14}" transform="rotate(${index * 10} 60 60)"/>`;
  }).join('');
  const cardLabels = labels.map((label, index) =>
    `<text class="heading-card-label" x="60" y="24" transform="rotate(${index * 30} 60 60)">${label}</text>`
  ).join('');

  function build(indicator) {
    if (indicator.dataset.headingReady === 'true') return;
    indicator.dataset.headingReady = 'true';
    indicator.innerHTML = `
      <svg class="heading-indicator-card" data-heading-card viewBox="0 0 120 120" aria-hidden="true">
        <circle class="heading-card-ring" cx="60" cy="60" r="52"/>
        ${ticks}
        ${cardLabels}
      </svg>
      <i class="heading-indicator-lubber" aria-hidden="true"></i>
      <i class="heading-indicator-reference" aria-hidden="true"></i>
      <strong class="heading-indicator-value" data-heading-value>000°</strong>
    `;
  }

  function normalize(value) {
    return (value % 360 + 360) % 360;
  }

  function shortestDelta(from, to) {
    return ((to - from + 540) % 360) - 180;
  }

  const indicators = [...document.querySelectorAll('[data-heading-indicator]')];
  indicators.forEach(build);

  const RESPONSE_MS = 125;
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

  function paint(now) {
    if (Number.isFinite(targetUnwrapped)) {
      if (!Number.isFinite(displayedUnwrapped)) displayedUnwrapped = targetUnwrapped;
      const dt = Math.min(80, Math.max(0, now - lastFrame));
      const alpha = 1 - Math.exp(-dt / RESPONSE_MS);
      displayedUnwrapped += (targetUnwrapped - displayedUnwrapped) * alpha;
      if (Math.abs(targetUnwrapped - displayedUnwrapped) < .002) displayedUnwrapped = targetUnwrapped;

      const normalized = normalize(displayedUnwrapped);
      const display = String(Math.round(normalized)).padStart(3, '0');

      indicators.forEach(indicator => {
        indicator.style.setProperty('--heading-card-rotation', `${-displayedUnwrapped}deg`);
        const value = indicator.querySelector('[data-heading-value]');
        if (value) value.textContent = `${display}°`;
        indicator.setAttribute('aria-label', `Heading ${display} degrees`);
      });
    }

    lastFrame = now;
    requestAnimationFrame(paint);
  }

  shared.subscribe(receive, ['aircraft']);
  requestAnimationFrame(paint);
})();
