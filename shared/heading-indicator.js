(() => {
  const shared = window.UAV_SHARED;
  if (!shared) return;

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

  function render(state) {
    const heading = Number(state?.aircraft?.headingDeg);
    if (!Number.isFinite(heading)) return;
    const normalized = normalize(heading);

    document.querySelectorAll('[data-heading-indicator]').forEach(indicator => {
      build(indicator);

      const previousNormalized = Number(indicator.dataset.headingNormalized);
      let unwrapped = Number(indicator.dataset.headingUnwrapped);
      if (!Number.isFinite(previousNormalized) || !Number.isFinite(unwrapped)) {
        unwrapped = normalized;
      } else {
        const delta = ((normalized - previousNormalized + 540) % 360) - 180;
        unwrapped += delta;
      }

      indicator.dataset.headingNormalized = String(normalized);
      indicator.dataset.headingUnwrapped = String(unwrapped);
      indicator.style.setProperty('--heading-card-rotation', `${-unwrapped}deg`);

      const value = indicator.querySelector('[data-heading-value]');
      const display = String(Math.round(normalized)).padStart(3, '0');
      if (value) value.textContent = `${display}°`;
      indicator.setAttribute('aria-label', `Heading ${display} degrees`);
    });
  }

  shared.subscribe(render);
})();
