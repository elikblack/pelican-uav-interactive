(() => {
  const page = document.getElementById('secondary-page-payload');
  if (!page) return;

  page.classList.remove('secondary-placeholder-page');
  page.classList.add('payload-concept');
  page.setAttribute('aria-label', 'Payload sensor display concept');

  page.innerHTML = `
    <div class="payload-view">
      <svg class="payload-scene" viewBox="0 0 1888 290" preserveAspectRatio="none" aria-hidden="true">
        <path class="scene-road" d="M-40 258C320 212 610 220 880 178S1450 96 1930 128"/>
        <path class="scene-road-edge" d="M-40 246C320 201 610 209 880 167S1450 85 1930 117"/>
        <rect class="scene-structure" x="220" y="70" width="260" height="112"/>
        <rect class="scene-dark" x="250" y="88" width="78" height="76"/>
        <rect class="scene-dark" x="349" y="88" width="96" height="76"/>
        <rect class="scene-structure" x="1090" y="52" width="280" height="132"/>
        <rect class="scene-dark" x="1130" y="74" width="78" height="94"/>
        <rect class="scene-dark" x="1235" y="74" width="96" height="94"/>
        <rect class="scene-structure" x="1480" y="104" width="170" height="92"/>
        <text class="scene-label" x="810" y="170" transform="rotate(-8 810 170)">ROUTE 6 / SECTOR B</text>
      </svg>

      <div class="payload-top-left">
        <span class="payload-mode-label">EO / AUTO</span>
        <span class="payload-mode-label small">UTC <b id="payload-utc">22:30:14</b></span>
      </div>

      <div class="payload-top-center">
        <span class="payload-mode-label">FOV</span>
        <span class="payload-mode-label amber">DL LRF</span>
        <span class="payload-mode-label">STAB</span>
      </div>

      <div class="payload-top-right">
        <span class="payload-mode-label">37W · AUTO</span>
        <span class="payload-mode-label small">HIGH  · CMPD</span>
      </div>

      <div class="payload-fov" id="payload-fov">5.5°</div>
      <div class="payload-reticle" aria-hidden="true"><i></i></div>

      <div class="payload-left-stack" aria-hidden="true">
        <div class="payload-sensor-glyph"></div>
        <div class="payload-bearing" id="payload-bearing">028°</div>
      </div>

      <div class="payload-scale" aria-hidden="true"></div>
      <div class="payload-right-stack" aria-hidden="true"><span>+24</span><span>+12</span><span>0</span><span>-12</span><span>-24</span></div>

      <div class="payload-center-readout">
        LOS <span id="payload-los">347.8°</span>
        <small>RNG <span id="payload-range">0.31 NM</span></small>
      </div>

      <div class="payload-no-target">NO TARGET</div>
    </div>

    <div class="payload-bottom-strip" aria-label="Payload telemetry">
      <div class="payload-bottom-cell"><span>GIMBAL AZ / EL</span><strong id="payload-gimbal">348° / -21°</strong></div>
      <div class="payload-bottom-cell"><span>SENSOR</span><strong>EO WIDE</strong></div>
      <div class="payload-bottom-cell amber"><span>DESIGNATOR</span><strong>SAFE</strong></div>
      <div class="payload-bottom-cell"><span>SLANT / AGEO</span><strong id="payload-geo">0.31 NM / 823 FT</strong></div>
    </div>
  `;

  const utc = document.getElementById('payload-utc');
  const bearing = document.getElementById('payload-bearing');
  const los = document.getElementById('payload-los');
  const range = document.getElementById('payload-range');
  const gimbal = document.getElementById('payload-gimbal');
  const geo = document.getElementById('payload-geo');
  const fov = document.getElementById('payload-fov');
  const started = performance.now();

  function tick() {
    const t = (performance.now() - started) / 1000;
    const now = new Date();
    utc.textContent = [now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()]
      .map(value => String(value).padStart(2, '0')).join(':');

    const az = 348 + Math.sin(t / 5.3) * 0.9;
    const el = -21 + Math.sin(t / 7.4) * 0.5;
    const r = 0.31 + Math.sin(t / 9.2) * 0.015;
    const b = 28 + Math.sin(t / 6.1) * 1.1;
    const f = 5.5 + Math.sin(t / 11) * 0.08;

    bearing.textContent = `${Math.round(b).toString().padStart(3, '0')}°`;
    los.textContent = `${az.toFixed(1)}°`;
    range.textContent = `${r.toFixed(2)} NM`;
    gimbal.textContent = `${Math.round(az)}° / ${Math.round(el)}°`;
    geo.textContent = `${r.toFixed(2)} NM / ${Math.round(823 + Math.sin(t / 8.5) * 12)} FT`;
    fov.textContent = `${f.toFixed(1)}°`;
  }

  tick();
  setInterval(tick, 500);
})();
