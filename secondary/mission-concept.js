(() => {
  const page = document.getElementById('secondary-page-mission');
  if (!page) return;

  page.classList.remove('secondary-placeholder-page');
  page.classList.add('mission-concept');
  page.setAttribute('aria-label', 'Mission execution display concept');

  page.innerHTML = `
    <div class="mission-top-strip" aria-label="Mission execution summary">
      <div class="mission-top-cell mission-execute"><span>MISSION STATE</span><strong>EXECUTE</strong></div>
      <div class="mission-top-cell mission-phase"><span>PHASE</span><strong>TRANSIT</strong></div>
      <div class="mission-top-cell"><span>ACTIVE LEG</span><strong>WP04 → WP05</strong></div>
      <div class="mission-top-cell"><span>LEG ETE</span><strong id="mission-leg-ete">00:08:42</strong></div>
    </div>

    <div class="mission-main-grid">
      <section class="mission-panel mission-route-panel" aria-label="Route and flight plan">
        <header class="mission-panel-heading">ROUTE / FLIGHT PLAN <small>SEQ 04 / 09</small></header>
        <div class="mission-route-body">
          <svg class="mission-route-map" viewBox="0 0 400 260" role="img" aria-label="Mission route overview">
            <path class="mission-map-line" d="M25 45H375M25 95H375M25 145H375M25 195H375M70 20V240M155 20V240M240 20V240M325 20V240"/>
            <path class="mission-map-line" d="M36 220L360 48M52 32L348 224"/>
            <path class="mission-route-complete" d="M55 218L108 184L155 158"/>
            <path class="mission-route-path" d="M155 158L214 128L275 92L340 50"/>

            <circle class="mission-wp" cx="55" cy="218" r="6"/>
            <circle class="mission-wp" cx="108" cy="184" r="6"/>
            <circle class="mission-wp active" cx="155" cy="158" r="7"/>
            <circle class="mission-wp" cx="214" cy="128" r="6"/>
            <circle class="mission-wp" cx="275" cy="92" r="6"/>
            <circle class="mission-wp" cx="340" cy="50" r="6"/>

            <path class="mission-ownship" d="M0 -9L6 7L0 4L-6 7Z" transform="translate(188 141) rotate(48)"/>

            <text class="mission-map-label" x="38" y="238">WP01</text>
            <text class="mission-map-label" x="130" y="148">WP04</text>
            <text class="mission-map-label" x="224" y="118">WP05</text>
            <text class="mission-map-label" x="285" y="82">WP06</text>
            <text class="mission-map-label" x="315" y="39">REC</text>

            <text class="mission-map-dim" x="24" y="28">ROUTE 17B</text>
            <text class="mission-map-dim" x="270" y="239">TRK 044°T</text>
            <text class="mission-map-dim" x="291" y="28">RNG 40NM</text>
          </svg>

          <div class="mission-waypoints" aria-label="Flight plan sequence">
            <div class="mission-waypoint complete"><span>WP03 / PASSED</span><strong>15:39Z</strong></div>
            <div class="mission-waypoint active"><span>WP04 / ACTIVE</span><strong id="mission-wp-range">23.6 NM</strong></div>
            <div class="mission-waypoint"><span>WP05 / TURN</span><strong>HDG 061°</strong></div>
          </div>
        </div>
      </section>

      <section class="mission-panel mission-flight-panel" aria-label="Aircraft flight state">
        <header class="mission-panel-heading">AIRCRAFT STATE / FLIGHT DIRECTOR <small>NAV VALID</small></header>

        <div class="mission-flight-values">
          <div class="mission-flight-value"><span>HDG</span><strong id="mission-heading">176.2°</strong></div>
          <div class="mission-flight-value"><span>GS</span><strong id="mission-speed">312<small>KT</small></strong></div>
          <div class="mission-flight-value"><span>ALT MSL</span><strong id="mission-altitude">12,480<small>FT</small></strong></div>
        </div>

        <div class="mission-profile-wrap">
          <svg class="mission-profile" viewBox="0 0 900 205" role="img" aria-label="Mission vertical profile">
            <path class="profile-grid" d="M0 42H900M0 84H900M0 126H900M0 168H900M180 0V205M360 0V205M540 0V205M720 0V205"/>
            <path class="profile-envelope" d="M25 54H875V105H25Z"/>
            <path class="profile-terrain" d="M0 181L70 172L118 176L184 156L235 163L301 145L356 151L423 137L477 148L535 140L596 153L652 144L720 161L780 151L844 167L900 158V205H0Z"/>
            <path class="profile-route" d="M30 94L180 91L360 85L540 83L720 79L870 78"/>

            <circle class="profile-mark" cx="180" cy="91" r="5"/>
            <circle class="profile-mark" cx="540" cy="83" r="5"/>
            <circle class="profile-mark" cx="720" cy="79" r="5"/>
            <path class="profile-aircraft" d="M0 -8L7 6L0 4L-7 6Z" transform="translate(410 84) rotate(90)"/>

            <text class="profile-dim" x="18" y="28">14,000</text>
            <text class="profile-dim" x="18" y="122">10,000</text>
            <text class="profile-dim" x="18" y="196">TERRAIN</text>
            <text class="profile-label" x="155" y="75">WP04</text>
            <text class="profile-label" x="515" y="67">WP05</text>
            <text class="profile-label" x="695" y="63">WP06</text>
            <text class="profile-amber" x="425" y="69">ACFT 17</text>
            <text class="profile-dim" x="690" y="190">MIN CLR 4.1K</text>
          </svg>
        </div>

        <div class="mission-flight-footer">
          <div class="mission-mode-box">NAV / AUTO</div>
          <div class="mission-progress">
            <div class="mission-progress-label"><span>MISSION PROGRESS</span><strong id="mission-progress-label">46%</strong></div>
            <div class="mission-progress-track"><i id="mission-progress-bar"></i></div>
          </div>
          <div class="mission-xtrack"><span>XTK ERROR</span><strong id="mission-xtrack">0.03 NM</strong></div>
        </div>
      </section>

      <section class="mission-panel mission-system-panel" aria-label="Autonomy and command link state">
        <header class="mission-panel-heading">AUTONOMY / C2 <small>SUPERVISORY</small></header>
        <div class="mission-system-body">
          <div class="mission-system-table">
            <div class="mission-system-row"><span>NAV / MODE</span><strong>GPS/INS · MISSION</strong><b>VALID</b></div>
            <div class="mission-system-row"><span>C2 LINK</span><strong>PRIMARY</strong><b id="mission-link">+18.4 dB</b></div>
            <div class="mission-system-row"><span>LATENCY</span><strong>CMD / TLM</strong><b id="mission-latency">084 ms</b></div>
            <div class="mission-system-row warning"><span>ENDURANCE</span><strong>EST REMAIN</strong><b id="mission-endurance">05:42</b></div>
          </div>

          <div class="mission-event-queue">
            <span>NEXT MISSION EVENTS</span>
            <div class="mission-event"><time>+08:42</time><strong>WP05 AUTO TURN / HDG 061°</strong></div>
            <div class="mission-event"><time>+17:10</time><strong>WP06 HOLD / 8 MIN</strong></div>
          </div>
        </div>
      </section>
    </div>

    <div class="mission-bottom-strip" aria-label="Mission execution status">
      <div class="mission-bottom-cell mission-bottom-good"><span>EXECUTION</span><strong>NORMAL</strong></div>
      <div class="mission-bottom-cell"><span>RECOVERY</span><strong>AVAILABLE / AUTO</strong></div>
      <div class="mission-bottom-cell mission-bottom-next"><span>NEXT ACTION</span><strong>WP05 AUTO TURN</strong></div>
    </div>
  `;

  const fields = {
    ete: document.getElementById('mission-leg-ete'),
    range: document.getElementById('mission-wp-range'),
    heading: document.getElementById('mission-heading'),
    speed: document.getElementById('mission-speed'),
    altitude: document.getElementById('mission-altitude'),
    xtrack: document.getElementById('mission-xtrack'),
    link: document.getElementById('mission-link'),
    latency: document.getElementById('mission-latency'),
    endurance: document.getElementById('mission-endurance'),
    progressLabel: document.getElementById('mission-progress-label'),
    progressBar: document.getElementById('mission-progress-bar')
  };

  const startedAt = Date.now();
  const baseEte = 8 * 60 + 42;
  const baseRange = 23.6;
  const baseEndurance = 5 * 60 + 42;

  function clock(totalSeconds) {
    const value = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    const s = value % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function hoursMinutes(totalMinutes) {
    const value = Math.max(0, Math.round(totalMinutes));
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  }

  function updateMission() {
    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    const slowSeconds = elapsedSeconds * 0.16;

    const ete = Math.max(0, baseEte - slowSeconds);
    const range = Math.max(0, baseRange - slowSeconds * 0.0105);
    const progress = Math.min(99, 46 + slowSeconds * 0.018);
    const enduranceMinutes = baseEndurance - slowSeconds / 60;

    const heading = 176.2 + Math.sin(elapsedSeconds / 7.5) * 0.7;
    const speed = 312 + Math.sin(elapsedSeconds / 5.2) * 2.4;
    const altitude = 12480 + Math.sin(elapsedSeconds / 8.8) * 24;
    const xtrack = 0.03 + Math.abs(Math.sin(elapsedSeconds / 12.4)) * 0.018;
    const link = 18.4 + Math.sin(elapsedSeconds / 6.3) * 0.6;
    const latency = 84 + Math.sin(elapsedSeconds / 3.8) * 8;

    fields.ete.textContent = clock(ete);
    fields.range.textContent = `${range.toFixed(1)} NM`;
    fields.heading.textContent = `${heading.toFixed(1)}°`;
    fields.speed.innerHTML = `${Math.round(speed)}<small>KT</small>`;
    fields.altitude.innerHTML = `${Math.round(altitude).toLocaleString('en-US')}<small>FT</small>`;
    fields.xtrack.textContent = `${xtrack.toFixed(2)} NM`;
    fields.link.textContent = `+${link.toFixed(1)} dB`;
    fields.latency.textContent = `${String(Math.round(latency)).padStart(3, '0')} ms`;
    fields.endurance.textContent = hoursMinutes(enduranceMinutes);
    fields.progressLabel.textContent = `${Math.round(progress)}%`;
    fields.progressBar.style.width = `${progress}%`;
  }

  updateMission();
  setInterval(updateMission, 500);
})();