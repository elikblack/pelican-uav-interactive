(() => {
  const page = document.getElementById('secondary-page-mission');
  if (!page) return;

  const shared = window.UAV_SHARED;

  page.classList.remove('secondary-placeholder-page');
  page.classList.add('mission-concept');
  page.setAttribute('aria-label', 'Mission execution display concept');

  page.innerHTML = `
    <div class="mission-top-strip" aria-label="Mission execution summary">
      <div class="mission-top-cell mission-execute"><span>MISSION / PHASE</span><strong id="mission-phase">EXECUTE · TRANSIT</strong></div>
      <div class="mission-top-cell"><span>ACTIVE LEG</span><strong id="mission-active-leg">STG → WPT 1</strong></div>
      <div class="mission-top-cell"><span>LEG ETE</span><strong id="mission-leg-ete">00:00:00</strong></div>
    </div>

    <div class="mission-main-grid">
      <section class="mission-panel mission-route-panel" aria-label="Route and flight plan">
        <header class="mission-panel-heading">ROUTE / FLIGHT PLAN <small>MISSION EXECUTION</small></header>
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

            <path id="mission-route-ownship" class="mission-ownship" d="M0 -9L6 7L0 4L-6 7Z" transform="translate(188 141) rotate(92)"/>

            <text class="mission-map-label" x="130" y="148">NAV</text>
            <text class="mission-map-label" x="224" y="118">TASK</text>
            <text class="mission-map-label" x="285" y="82">RTB</text>
            <text class="mission-map-label" x="315" y="39">REC</text>

            <text class="mission-map-dim" x="24" y="28">MISSION ROUTE</text>
            <text class="mission-map-dim" id="mission-track-course" x="270" y="239">CRS 092°T</text>
          </svg>

          <div class="mission-waypoints" aria-label="Flight plan sequence">
            <div class="mission-waypoint active"><span id="mission-active-waypoint">WPT 1 / ACTIVE</span><strong id="mission-wp-range">0.0 NM</strong></div>
            <div class="mission-waypoint"><span>GUIDANCE</span><strong id="mission-guidance">CRS 092°</strong></div>
          </div>
        </div>
      </section>

      <section class="mission-panel mission-flight-panel" aria-label="Aircraft flight state">
        <header class="mission-panel-heading">AIRCRAFT STATE / FLIGHT DIRECTOR <small id="mission-nav-valid">NAV VALID</small></header>

        <div class="mission-flight-values">
          <div class="mission-flight-value"><span>HDG</span><strong id="mission-heading">092.0°</strong></div>
          <div class="mission-flight-value"><span>GS</span><strong id="mission-speed">188<small>KT</small></strong></div>
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
            <text class="profile-label" x="155" y="75">NAV</text>
            <text class="profile-label" x="515" y="67">TASK</text>
            <text class="profile-label" x="695" y="63">RTB</text>
            <text class="profile-amber" x="425" y="69">ACFT 17</text>
            <text class="profile-dim" x="690" y="190">MIN CLR 4.1K</text>
          </svg>
        </div>

        <div class="mission-flight-footer">
          <div class="mission-mode-box">NAV / AUTO</div>
          <div class="mission-progress">
            <div class="mission-progress-label"><span>MISSION PROGRESS</span><strong id="mission-progress-label">00%</strong></div>
            <div class="mission-progress-track"><i id="mission-progress-bar"></i></div>
          </div>
          <div class="mission-xtrack"><span>XTK ERROR</span><strong id="mission-xtrack">0.00 NM</strong></div>
        </div>
      </section>

      <section class="mission-panel mission-system-panel" aria-label="Autonomy and command link state">
        <header class="mission-panel-heading">AUTONOMY / C2 <small>SUPERVISORY</small></header>
        <div class="mission-system-body">
          <div class="mission-system-table">
            <div class="mission-system-row"><span>NAV / MODE</span><strong id="mission-nav-source">GPS/INS · MISSION</strong><b id="mission-nav-state">VALID</b></div>
            <div class="mission-system-row"><span>C2 LINK</span><strong>PRIMARY</strong><b id="mission-link">+18.2 dB</b></div>
            <div class="mission-system-row warning"><span>ENDURANCE</span><strong>EST REMAIN</strong><b id="mission-endurance">03:42</b></div>
          </div>

          <div class="mission-event-queue">
            <span>NEXT MISSION EVENT</span>
            <div class="mission-event"><time id="mission-next-ete">+00:00</time><strong id="mission-next-event">WPT 1 AUTO NAV</strong></div>
          </div>
        </div>
      </section>
    </div>

    <div class="mission-bottom-strip" aria-label="Mission execution status">
      <div class="mission-bottom-cell mission-bottom-good"><span>EXECUTION</span><strong id="mission-execution">NORMAL</strong></div>
      <div class="mission-bottom-cell mission-bottom-next"><span>NEXT ACTION</span><strong id="mission-next-action">WPT 1 AUTO NAV</strong></div>
    </div>
  `;

  const fields = {
    phase: document.getElementById('mission-phase'),
    activeLeg: document.getElementById('mission-active-leg'),
    ete: document.getElementById('mission-leg-ete'),
    range: document.getElementById('mission-wp-range'),
    activeWaypoint: document.getElementById('mission-active-waypoint'),
    guidance: document.getElementById('mission-guidance'),
    trackCourse: document.getElementById('mission-track-course'),
    heading: document.getElementById('mission-heading'),
    speed: document.getElementById('mission-speed'),
    altitude: document.getElementById('mission-altitude'),
    xtrack: document.getElementById('mission-xtrack'),
    link: document.getElementById('mission-link'),
    endurance: document.getElementById('mission-endurance'),
    navValid: document.getElementById('mission-nav-valid'),
    navSource: document.getElementById('mission-nav-source'),
    navState: document.getElementById('mission-nav-state'),
    ownship: document.getElementById('mission-route-ownship'),
    progressLabel: document.getElementById('mission-progress-label'),
    progressBar: document.getElementById('mission-progress-bar'),
    nextEte: document.getElementById('mission-next-ete'),
    nextEvent: document.getElementById('mission-next-event'),
    execution: document.getElementById('mission-execution'),
    nextAction: document.getElementById('mission-next-action')
  };

  function clock(totalSeconds) {
    const value = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    const s = value % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function shortClock(totalSeconds) {
    const value = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(value / 60);
    const s = value % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function hoursMinutes(totalSeconds) {
    const value = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  function formatNavSource(source) {
    return String(source || 'UNKNOWN').replaceAll('_', '/');
  }

  function phaseLabel(phase) {
    if (phase === 'TASK_INGRESS') return 'TASK INGRESS';
    if (phase === 'TASK') return 'TASK EXEC';
    if (phase === 'TASK_EGRESS') return 'TASK EGRESS';
    if (phase === 'RTB') return 'RTB';
    if (phase === 'COMPLETE') return 'COMPLETE';
    return 'TRANSIT';
  }

  function nextAction(mission) {
    const target = mission?.targetId || 'NAV';
    const phase = mission?.phase || 'NAV';
    if (phase === 'TASK_INGRESS') return `${target} TASK INGRESS`;
    if (phase === 'TASK') return `${target} ${String(mission?.taskType || 'TASK').toUpperCase()}`;
    if (phase === 'TASK_EGRESS') return 'EGRESS / RESUME NAV';
    if (phase === 'RTB') return 'RETURN STAGING';
    if (phase === 'COMPLETE') return 'MISSION COMPLETE';
    return `${target} AUTO NAV`;
  }

  function renderShared(state) {
    const aircraft = state?.aircraft;
    if (aircraft) {
      const heading = Number(aircraft.headingDeg);
      const speed = Number(aircraft.groundSpeedKt);
      const altitude = Number(aircraft.altitudeFt);
      const endurance = Number(aircraft.enduranceSeconds);

      if (Number.isFinite(heading)) {
        if (fields.heading?.isConnected) fields.heading.textContent = `${heading.toFixed(1)}°`;
        if (fields.ownship) fields.ownship.setAttribute('transform', `translate(188 141) rotate(${heading.toFixed(1)})`);
      }
      if (Number.isFinite(speed)) fields.speed.innerHTML = `${Math.round(speed)}<small>KT</small>`;
      if (Number.isFinite(altitude)) fields.altitude.innerHTML = `${Math.round(altitude).toLocaleString('en-US')}<small>FT</small>`;
      if (Number.isFinite(endurance)) fields.endurance.textContent = hoursMinutes(endurance);
    }

    const navigation = state?.navigation;
    if (navigation) {
      const valid = Boolean(navigation.valid);
      fields.navValid.textContent = valid ? 'NAV VALID' : 'NAV INVALID';
      fields.navSource.textContent = `${formatNavSource(navigation.source)} · MISSION`;
      fields.navState.textContent = valid ? 'VALID' : 'INVALID';
    }

    const margin = Number(state?.link?.marginDb);
    if (Number.isFinite(margin)) fields.link.textContent = `${margin >= 0 ? '+' : ''}${margin.toFixed(1)} dB`;

    const mission = state?.mission;
    if (mission) {
      const phase = mission.phase || 'NAV';
      const course = Number(mission.courseDeg);
      const crossTrack = Number(mission.crossTrackNm);
      const distance = Number(mission.distanceToNextNm);
      const ete = Number(mission.eteSeconds);
      const progress = Math.max(0, Math.min(100, (Number(mission.routeProgress) || 0) * 100));
      const action = nextAction(mission);

      fields.phase.textContent = `EXECUTE · ${phaseLabel(phase)}`;
      fields.activeLeg.textContent = String(mission.activeLeg || mission.targetId || 'NAV').replaceAll(' > ', ' → ');
      fields.ete.textContent = clock(Number.isFinite(ete) ? ete : 0);
      fields.range.textContent = `${Number.isFinite(distance) ? distance.toFixed(1) : '0.0'} NM`;
      fields.activeWaypoint.textContent = `${mission.targetId || 'NAV'} / ACTIVE`;
      fields.guidance.textContent = Number.isFinite(course) ? `CRS ${String(Math.round(course)).padStart(3, '0')}°` : 'CRS ---';
      fields.trackCourse.textContent = Number.isFinite(course) ? `CRS ${String(Math.round(course)).padStart(3, '0')}°T` : 'CRS ---°T';
      fields.xtrack.textContent = Number.isFinite(crossTrack) ? `${crossTrack.toFixed(2)} NM` : '--';
      fields.progressLabel.textContent = `${Math.round(progress)}%`;
      fields.progressBar.style.width = `${progress}%`;
      fields.nextEte.textContent = `+${shortClock(Number.isFinite(ete) ? ete : 0)}`;
      fields.nextEvent.textContent = action;
      fields.nextAction.textContent = action;
      fields.execution.textContent = phase === 'COMPLETE' ? 'COMPLETE' : 'NORMAL';
    }
  }

  if (shared) shared.subscribe(renderShared, ['aircraft', 'navigation', 'link', 'mission']);
})();
