(() => {
  const WEATHER_FRAME_COUNT = 40;
  const WEATHER_FRAME_MS = 750;
  const WEATHER_FRAME_PATH = '../shared/assets/weather';

  const world = window.UAV_WORLD;
  const weatherModel = world?.weather || {};
  const weatherRangeNm = Number(weatherModel.rangeNm) || 60;
  const referenceBearingDeg = Number(weatherModel.referenceBearingDeg) || 335;
  const weatherBody = document.querySelector('.weather-sector-body');
  const weatherPane = document.querySelector('.weather-radar-pane') || weatherBody;
  const weatherSvg = weatherPane && weatherPane.querySelector('.weather-sector');
  if (!weatherBody || !weatherPane || !weatherSvg) return;

  function normalizeHeading(value) {
    return (value % 360 + 360) % 360;
  }

  function headingTickLabel(value) {
    const normalized = normalizeHeading(value);
    const tens = Math.round(normalized / 10) % 36;
    return String(tens === 0 ? 36 : tens).padStart(2, '0');
  }

  function integrateBearingScale() {
    const scale = weatherSvg.querySelector('.wx-heading-scale');
    const grid = weatherSvg.querySelector('.wx-sector-grid');
    if (!scale || !grid) return;

    const gridPaths = [...grid.querySelectorAll(':scope > path')];
    /* The 360-radius arc remains hidden. Use the next ring inward as the
       bearing ring so labels and ticks can live directly on its inner edge. */
    const bearingRing = gridPaths[gridPaths.length - 2];
    const centerline = grid.querySelector('.wx-centerline');

    if (bearingRing) {
      bearingRing.classList.add('wx-bearing-ring');
      bearingRing.style.stroke = '#fff';
      bearingRing.style.strokeWidth = '1.7px';
      bearingRing.style.strokeDasharray = 'none';
      bearingRing.style.opacity = '1';
    }

    if (centerline) centerline.setAttribute('d', 'M310 312V14');

    const cx = 310;
    const cy = 312;
    /* The 275-radius bearing ring is enlarged 1.045x by CSS, landing at ~287px
       on screen. Build the heading furniture against that displayed radius. */
    const bearingRadius = 287;
    const point = (radius, degrees) => {
      const radians = degrees * Math.PI / 180;
      return {
        x: cx + radius * Math.sin(radians),
        y: cy - radius * Math.cos(radians)
      };
    };
    const segment = (angle, innerRadius) => {
      const a = point(bearingRadius, angle);
      const b = point(innerRadius, angle);
      return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    };

    const majorAngles = [-35, -25, -15, -5, 5, 15, 25, 35];
    const minorAngles = [-40, -30, -20, -10, 0, 10, 20, 30, 40];

    const majorTicks = majorAngles.map(angle => segment(angle, 267)).join('');
    const minorTicks = minorAngles.map(angle => segment(angle, 278)).join('');
    const labelMarkup = majorAngles.map(angle => {
      const p = point(253, angle);
      const rotation = angle * .72;
      const label = headingTickLabel(referenceBearingDeg + angle);
      return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" transform="rotate(${rotation.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})" style="fill:#fff;opacity:1;font-size:11px;font-weight:600;text-anchor:middle;letter-spacing:.03em;paint-order:stroke;stroke:#020402;stroke-width:2px">${label}</text>`;
    }).join('');

    scale.innerHTML = `
      <path d="${minorTicks}" style="fill:none;stroke:#fff;stroke-width:1.1;opacity:1;vector-effect:non-scaling-stroke" />
      <path d="${majorTicks}" style="fill:none;stroke:#fff;stroke-width:1.7;opacity:1;vector-effect:non-scaling-stroke" />
      ${labelMarkup}
      <path class="wx-heading-bug" d="M299 2L310 15L321 2" style="fill:none;stroke:var(--amber);stroke-width:2.3;opacity:1;vector-effect:non-scaling-stroke" />
    `;
  }

  function applyWorldScale() {
    weatherSvg.setAttribute('aria-label', 'Remote regional weather radar product');

    const rangeLabels = [...weatherSvg.querySelectorAll('.wx-range-labels text')];
    const fractions = [.25, .5, .75, 1];
    rangeLabels.slice(0, 4).forEach((label, index) => {
      const value = Math.round(weatherRangeNm * fractions[index]);
      label.textContent = index === 3 ? `${value} NM` : String(value);
    });

    const mode = document.querySelector('.weather-module .wx-mode');
    if (mode) {
      const labels = [...mode.querySelectorAll('span')];
      const rangeLabel = labels.find(label => label.textContent.trim() === 'RNG');
      const rangeValue = rangeLabel?.nextElementSibling;
      if (rangeValue) rangeValue.textContent = `${weatherRangeNm} NM`;
    }
  }

  integrateBearingScale();
  applyWorldScale();

  const frames = Array.from({ length: WEATHER_FRAME_COUNT }, (_, index) =>
    `${WEATHER_FRAME_PATH}/weather-radar-frame-${String(index + 1).padStart(3, '0')}.png`
  );

  frames.forEach(src => {
    const preload = new Image();
    preload.src = src;
  });

  const frame = document.createElement('img');
  frame.className = 'weather-frame-layer weather-frame-sequence';
  frame.alt = '';
  frame.setAttribute('aria-hidden', 'true');
  frame.src = frames[0];
  weatherPane.insertBefore(frame, weatherSvg);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frameIndex = 0;
  setInterval(() => {
    frameIndex = (frameIndex + 1) % frames.length;
    frame.src = frames[frameIndex];
  }, WEATHER_FRAME_MS);
})();
