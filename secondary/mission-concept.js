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
      <div class="mission-top-cell"><span>AIR VEHICLE</span><strong>ACFT 17</strong></div>
      <div class="mission-top-cell"><span>ACTIVE LEG</span><strong>WP04 → WP05</strong></div>
      <div class="mission-top-cell"><span>LEG ETE</span><strong id="mission-leg-ete">00:08:42</strong></div>
      <div class="mission-top-cell"><span>MISSION ELAPSED</span><strong id="mission-elapsed">01:17:26</strong></div>
    </div>

    <div class="mission-main-grid">
      <section class="mission-panel mission-route-panel" aria-label="Route and flight plan">
        <header class="mission-panel-heading">ROUTE / FLIGHT PLAN <small>SEQ 04 / 09</small></header>
        <div class="mission-route-body">
          <svg class="mission-route-map" viewBox="0 0 270 265" role="img" aria-label="Mission route overview">
            <path class="mission-map-line" d="M18 44L252 44M18 91L252 91M18 138L252 138M18 185L252 185M18 232L252 232M55 17V250M118 17V250M181 17V250M244 17V250"/>
            <path class="mission-map-line" d="M30 218L244 54M41 37L230 226"/>
            <path class="mission-route-complete" d="M38 226L73 193L104 167"/>
            <path class="mission-route-path" d="M104 167L145 139L187 102L228 62"/>

            <circle class="mission-wp" cx="38" cy="226" r="5"/>
            <circle class="mission-wp" cx="73" cy="193" r="5"/>
            <circle class="mission-wp active" cx="104" cy="167" r="6"/>
            <circle class="mission-wp" cx="145" cy="139" r="5"/>
            <circle class="mission-wp" cx="187" cy="102" r="5"/>
            <circle class="mission-wp" cx="228" cy="62" r="5"/>

            <path class="mission-ownship" d="M0 -8L5 6L0 4L-5 6Z" transform="translate(126 151) rotate(46)"/>

            <text class="mission-map-label" x="23" y="240">WP01</text>
            <text class="mission-map-label" x="58" y="207">WP02</text>
            <text class="mission-map-label" x="82" y="157">WP04</text>
            <text class="mission-map-label" x="151" y="132">WP05</text>
            <text class="mission-map-label" x="193" y="94">WP06</text>
            <text class="mission-map-label" x="206" y="52">REC</text>

            <text class="mission-map-dim" x="16" y="25">ROUTE 17B</text>
            <text class="mission-map-dim" x="174" y="247">TRK 044°T</text>
            <text class="mission-map-dim" x="172" y="17">RNG 40NM</text>
          </svg>

          <div class="mission-waypoints" aria-label="Flight plan sequence">
            <div class="mission-waypoint complete"><span>WP03 / PASSED</span><strong>15:39:12Z</strong></div>
            <div class="mission-waypoint active"><span>WP04 / ACTIVE</span><strong id="mission-wp-range">23.6 NM</strong></div>
            <div class="mission-waypoint"><span>WP05 / TURN</span><strong>HDG 061°</strong></div>
            <div class="mission-waypoint"><span>WP06 / HOLD</span><strong>08+00</strong></div>
            <div class="mission-waypoint"><span>WP07 / ON STA</span><strong>ALT 120</strong></div>
          </div>
        </div>
      </section>

      <section class="mission-panel mission-flight-panel" aria-label="Aircraft flight state">
        <header class="mission-panel-heading">AIRCRAFT STATE / FLIGHT DIRECTOR <small>NAV SOLUTION VALID</small></header>

        <div class="mission-flight-values">
          <div class="mission-flight-value"><span>HDG</span><strong id="mission-heading">176.2°</strong></div>
          <div class="mission-flight-value"><span>GS</span><strong id="mission-speed">312<small>KT</small></strong></div>
          <div class="mission-flight-value"><span>ALT MSL</span><strong id="mission-altitude">12,480<small>FT</small></strong></div>
          <div class="mission-flight-value"><span>VERT SPD</span><strong id="mission-vs">+120<small>FPM</small></strong></div>
        </div>

        <div class="mission-profile-wrap">
          <svg class="mission-profile" viewBox="0 0 900 205" role="img" aria-label="Mission vertical profile">
            <path class="profile-grid" d="M0 38H900M0 76H900M0 114H900M0 152H900M150 0V205M300 0V205M450 0V205M600 0V205M750 0V205"/>
            <path class="profile-envelope" d="M20 54H880V103H20Z"/>
            <path class="profile-terrain" d="M0 181L70 172L118 176L184 156L235 163L301 145L356 151L423 137L477 148L535 140L596 153L652 144L720 161L780 151L844 167L900 158V205H0Z"/>
            <path class="profile-route" d="M25 93L150 91L285 88L420 82L560 84L700 79L875 78"/>

            <circle class="profile-mark" cx="150" cy="91" r="4"/>
            <circle class="profile-mark" cx="420" cy="82" r="4"/>
            <circle class="profile-mark" cx="700" cy="79" r="4"/>
            <path class="profile-aircraft" d="M0 -7L6 5L0 3L-6 5Z" transform="translate(355 84) rotate(90)"/>

            <text class="profile-dim" x="16" y="23">14,000</text>
            <text class="profile-dim" x="16" y="112">10,000</text>
            <text class="profile-dim" x="16" y="196">TERRAIN</text>
            <text class="profile-label" x="131" y="78">WP04</text>
            <text class="profile-label" x="401" y="69">WP05</text>
            <text class="profile-label" x="681" y="66">WP06</text>
            <text class="profile-amber" x="367" y="71">ACFT 17</text>
            <text class="profile-dim" x="677" y="189">MIN CLR 4.1K</text>
            <text class="profile-dim" x="757" y="23">ALT BAND 12–14K</text>
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
            <div class="mission-system-row"><span>NAV SOURCE</span><strong>GPS / INS</strong><b>VALID</b></div>
            <div class="mission-system-row"><span>CMD MODE</span><strong>MISSION NAV</strong><b>ARMED</b></div>
            <div class="mission-system-row"><span>C2 LINK</span><strong>PRIMARY</strong><b id="mission-link">+18.4 dB</b></div>
            <div class="mission-system-row"><span>LATENCY</span><strong>CMD / TLM</strong><b id="mission-latency">084 ms</b></div>
            <div class="mission-system-row"><span>ENDURANCE</span><strong>EST REMAIN</strong><b id="mission-endurance">05:42</b></div>
            <div class="mission-system-row warning"><span>NEXT LIMIT</span><strong>FUEL BINGO</strong><b>01:20</b></div>
          </div>

          <div class="mission-event-queue">
            <span>MISSION EVENT QUEUE</span>
            <div class="mission-event"><time>+08:42</time><strong>WP05 AUTO TURN / HDG 061°</strong></div>
            <div class="mission-event"><time>+17:10</time><strong>WP06 HOLD / 8 MIN</strong></div>
            <div class="mission-event"><time>+31:44</time><strong>ON-STATION ENTRY</strong></div>
            <div class="mission-event"><time>+47:00</time><strong>RECOVERY WINDOW CHECK</strong></div>
          </div>
        </div>
      </section>
    </div>

    <div class="mission-bottom-strip" aria-label="Mission execution status">
      <div class="mission-bottom-cell mission-bottom-good"><span>EXECUTION</span><strong>NORMAL / NO ACTIVE CONSTRAINTS</strong></div>
      <div class="mission-bottom-cell"><span>RECOVERY</span><strong>AVAILABLE / AUTO</strong></div>
      <div class="mission-bottom-cell mission-bottom-next"><span>NEXT ACTION</span><strong>WP05 AUTO TURN</strong></div>
      <div class="mission-bottom-cell"><span>DATA AGE</span><strong id="mission-data-age">0.2 s</strong></div>
    </div>
  `;

  const fields = {
    elapsed: document.getElementById('mission-elapsed'),
    ete: document.getElementById('mission-leg-ete'),
    range: document.getElementById('mission-wp-range'),
    heading: document.getElementById('mission-heading'),
    speed: document.getElementById('mission-speed'),
    altitude: document.getElementById('mission-altitude'),
    vs: document.getElementById('mission-vs'),
    xtrack: document.getElementById('mission-xtrack'),
    link: document.getElementById('mission-link'),
    latency: document.getElementById('mission-latency'),
    endurance: document.getElementById('mission-endurance'),
    dataAge: document.getElementById('mission-data-age'),
    progressLabel: document.getElementById('mission-progress-label'),
    progressBar: document.getElementById('mission-progress-bar')
  };

  const startedAt = Date.now();
  const baseElapsed = 1 * 3600 + 17 * 60 + 26;
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
    const verticalSpeed = 120 + Math.sin(elapsedSeconds / 4.7) * 38;
    const xtrack = 0.03 + Math.abs(Math.sin(elapsedSeconds / 12.4)) * 0.018;
    const link = 18.4 + Math.sin(elapsedSeconds / 6.3) * 0.6;
    const latency = 84 + Math.sin(elapsedSeconds / 3.8) * 8;
    const dataAge = 0.16 + Math.abs(Math.sin(elapsedSeconds / 2.9)) * 0.14;

    fields.elapsed.textContent = clock(baseElapsed + elapsedSeconds);
    fields.ete.textContent = clock(ete);
    fields.range.textContent = `${range.toFixed(1)} NM`;
    fields.heading.textContent = `${heading.toFixed(1)}°`;
    fields.speed.innerHTML = `${Math.round(speed)}<small>KT</small>`;
    fields.altitude.innerHTML = `${Math.round(altitude).toLocaleString('en-US')}<small>FT</small>`;
    fields.vs.innerHTML = `${verticalSpeed >= 0 ? '+' : ''}${Math.round(verticalSpeed)}<small>FPM</small>`;
    fields.xtrack.textContent = `${xtrack.toFixed(2)} NM`;
    fields.link.textContent = `+${link.toFixed(1)} dB`;
    fields.latency.textContent = `${String(Math.round(latency)).padStart(3, '0')} ms`;
    fields.endurance.textContent = hoursMinutes(enduranceMinutes);
    fields.dataAge.textContent = `${dataAge.toFixed(1)} s`;
    fields.progressLabel.textContent = `${Math.round(progress)}%`;
    fields.progressBar.style.width = `${progress}%`;
  }

  updateMission();
  setInterval(updateMission, 500);
})();