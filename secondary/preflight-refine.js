(() => {
  function buildAirControlRail() {
    const body = document.querySelector('.air-module .radar-module-body');
    if (!body || body.querySelector('.air-control-rail')) return;

    const rail = document.createElement('div');
    rail.className = 'air-control-rail';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = `
      <div class="air-control-box control-id">12<small>NW<br>072</small></div>
      <div class="air-control-box control-plot">AIR<br>PLOT</div>
      <div class="air-control-box control-wide control-menu">MENU UP&nbsp;&nbsp;M<br>ANT 1&nbsp;&nbsp;S-BAND</div>
      <div class="air-control-box control-wide control-pulse">PULSE&nbsp;&nbsp;L<br>PICTURE&nbsp;&nbsp;2T</div>
    `;
    body.appendChild(rail);
  }

  function startAirTrackSystem() {
    const module = document.querySelector('.air-module');
    const svg = module && module.querySelector('.airspace-plot');
    const rail = module && module.querySelector('.radar-side-data');
    const alert = rail && rail.querySelector('.air-alert');
    const feed = document.getElementById('air-message-feed');
    if (!module || !svg || !rail || !alert || !feed) return;

    const header = alert.querySelector('b');
    const valueNodes = [...rail.querySelectorAll(':scope > div:not(.air-alert) > strong')].slice(0, 4);
    const svgNS = 'http://www.w3.org/2000/svg';

    const targets = [
      { selector: '.contact-a', id: 'A17', heading: 176, speed: 312, phase: 0.3, fallback: [125, 197] },
      { selector: '.contact-c', id: 'T03', heading: 247, speed: 268, phase: 1.4, fallback: [211, 205] },
      { selector: '.contact-d', id: 'A08', heading: 312, speed: 224, phase: 2.2, fallback: [250, 104] },
      { selector: '.contact-f', id: 'T11', heading: 91, speed: 191, phase: 3.1, fallback: [318, 164] }
    ].map(target => ({ ...target, element: svg.querySelector(target.selector) }))
      .filter(target => target.element);

    if (!targets.length || valueNodes.length < 4) return;

    targets.forEach(target => {
      target.element.classList.add('air-cycle-target');
      const box = document.createElementNS(svgNS, 'rect');
      box.setAttribute('class', 'air-active-target-box');
      box.setAttribute('x', '-13');
      box.setAttribute('y', '-13');
      box.setAttribute('width', '26');
      box.setAttribute('height', '26');
      target.element.insertBefore(box, target.element.firstChild);
    });

    let selectedIndex = -1;
    let selectedTarget = null;
    let eventMode = null;
    let eventToken = 0;

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function clearEventClasses() {
      targets.forEach(target => {
        target.element.classList.remove(
          'air-event-coast',
          'air-event-query',
          'air-event-unknown',
          'air-event-resolved'
        );
      });
    }

    function setHeader(state = 'CORRELATED') {
      if (!header || !selectedTarget) return;
      header.textContent = `[TGT ${selectedTarget.id} / ${state}]`;
    }

    function selectTarget(target, state = 'CORRELATED') {
      targets.forEach(item => item.element.classList.remove('air-selected'));
      target.element.classList.add('air-selected');
      selectedTarget = target;
      selectedIndex = targets.indexOf(target);
      setHeader(state);
      updateLiveValues();
    }

    function targetPosition(target) {
      const symbol = target.element.querySelector('.air-symbol, .air-dot');
      const matrix = svg.getScreenCTM();
      if (!symbol || !matrix) return { x: target.fallback[0], y: target.fallback[1] };

      const bounds = symbol.getBoundingClientRect();
      const point = svg.createSVGPoint();
      point.x = bounds.left + bounds.width / 2;
      point.y = bounds.top + bounds.height / 2;
      const local = point.matrixTransform(matrix.inverse());
      return { x: local.x, y: local.y };
    }

    function liveTargetData(target) {
      const now = performance.now();
      const position = targetPosition(target);
      const dx = position.x - 195;
      const dy = position.y - 160;
      const bearing = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
      const range = Math.hypot(dx, dy) / 15;
      const heading = (target.heading + Math.sin(now / 9000 + target.phase) * 1.8 + 360) % 360;
      const speed = target.speed + Math.sin(now / 7200 + target.phase * 1.7) * 3.2;
      return { heading, speed, bearing, range };
    }

    function formatBearing(value) {
      return `${value.toFixed(1).padStart(5, '0')}°T`;
    }

    function updateLiveValues() {
      if (!selectedTarget) return;
      const data = liveTargetData(selectedTarget);
      valueNodes[0].dataset.liveValue = formatBearing(data.heading);
      valueNodes[1].dataset.liveValue = `${Math.round(data.speed)}kt`;
      valueNodes[2].dataset.liveValue = formatBearing(data.bearing);
      valueNodes[3].dataset.liveValue = `${data.range.toFixed(1)}NM`;
    }

    function makeMessage(text, tone = 'normal') {
      const entry = document.createElement('div');
      entry.className = `air-message-entry${tone === 'critical' ? ' air-message-critical' : ''}${tone === 'resolved' ? ' air-message-resolved' : ''}`;
      entry.textContent = text;
      return entry;
    }

    function pushMessage(text, tone = 'normal') {
      feed.insertBefore(makeMessage(text, tone), feed.firstChild);
      while (feed.children.length > 4) feed.lastElementChild.remove();
    }

    function normalTrackMessage(target) {
      const data = liveTargetData(target);
      pushMessage(
        `${target.id} CORRELATED\nBRG ${Math.round(data.bearing).toString().padStart(3, '0')}°  RNG ${data.range.toFixed(1)}NM`
      );
    }

    function cycleTarget() {
      if (!eventMode) {
        selectedIndex = (selectedIndex + 1) % targets.length;
        selectTarget(targets[selectedIndex]);
        normalTrackMessage(selectedTarget);
      }
      setTimeout(cycleTarget, Math.round(randomBetween(5200, 7000)));
    }

    function beginCoast() {
      if (eventMode) return;
      const token = ++eventToken;
      eventMode = 'coast';
      clearEventClasses();

      const target = selectedTarget || targets[Math.floor(Math.random() * targets.length)];
      selectTarget(target, 'COAST');
      target.element.classList.add('air-event-coast');
      pushMessage(`${target.id} COAST\nPOSITION EXTRAPOLATED`);

      setTimeout(() => {
        if (token !== eventToken) return;
        target.element.classList.remove('air-event-coast');
        target.element.classList.add('air-event-resolved');
        setHeader('REACQUIRED');
        pushMessage(`${target.id} REACQUIRED\nSURVEILLANCE VALID`, 'resolved');
      }, 4300);

      setTimeout(() => {
        if (token !== eventToken) return;
        target.element.classList.remove('air-event-resolved');
        eventMode = null;
        setHeader('CORRELATED');
      }, 6800);
    }

    function beginUnknown(force = false) {
      if (eventMode && !force) return;

      const token = ++eventToken;
      eventMode = 'unknown';
      clearEventClasses();

      const target = selectedTarget || targets[Math.floor(Math.random() * targets.length)];
      selectTarget(target, 'IDENT CHECK');
      target.element.classList.add('air-event-query');
      pushMessage(`IDENT CHECK ${target.id}\nCORRELATION LOST`);

      setTimeout(() => {
        if (token !== eventToken) return;
        target.element.classList.remove('air-event-query');
        target.element.classList.add('air-event-unknown');
        setHeader('UNCORR');
        pushMessage(`BOGEY ${target.id} / UNCORR\nTRACK VALID`, 'critical');
      }, 2600);

      setTimeout(() => {
        if (token !== eventToken) return;
        target.element.classList.remove('air-event-unknown');
        target.element.classList.add('air-event-resolved');
        setHeader('IFF VALID');
        pushMessage(`IFF CORRELATION\n${target.id} IDENTIFIED`, 'resolved');
      }, 7200);

      setTimeout(() => {
        if (token !== eventToken) return;
        target.element.classList.remove('air-event-resolved');
        eventMode = null;
        setHeader('CORRELATED');
      }, 9800);
    }

    function scheduleCoast() {
      setTimeout(() => {
        if (!eventMode) beginCoast();
        scheduleCoast();
      }, Math.round(randomBetween(36000, 65000)));
    }

    function scheduleUnknown() {
      setTimeout(() => {
        if (!eventMode) beginUnknown();
        scheduleUnknown();
      }, Math.round(randomBetween(70000, 120000)));
    }

    window.addEventListener('keydown', event => {
      if (event.key !== '1' || event.repeat) return;
      beginUnknown(true);
    });

    selectTarget(targets[0]);
    normalTrackMessage(targets[0]);
    setTimeout(cycleTarget, 5800);
    scheduleCoast();
    scheduleUnknown();
    setInterval(updateLiveValues, 200);
  }

  function weatherTimestamp() {
    const now = new Date();
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(now.getUTCHours()).padStart(2, '0');
    const minute = String(now.getUTCMinutes()).padStart(2, '0');
    return `${day}${hour}${minute}Z`;
  }

  function buildWeatherLayout() {
    const body = document.querySelector('.weather-sector-body');
    if (!body || body.querySelector('.weather-radar-pane')) return;

    const pane = document.createElement('div');
    pane.className = 'weather-radar-pane';

    [...body.children].forEach(child => {
      if (!child.classList.contains('weather-alert-rail')) pane.appendChild(child);
    });

    const rail = document.createElement('div');
    rail.className = 'weather-alert-rail';
    rail.innerHTML = `
      <div class="weather-alert-heading">[WX MESSAGE LIST]</div>
      <div class="weather-message-feed" id="weather-message-feed"></div>
    `;

    body.appendChild(rail);
    body.appendChild(pane);
  }

  function startWeatherMessageFeed() {
    const feed = document.getElementById('weather-message-feed');
    if (!feed) return;

    const messages = [
      { type: 'WEATHER ALERT', main: 'MODERATE / HEAVY', sub: 'FWD SECTOR  20–40NM' },
      { type: 'CELL TRACK', main: 'TSRA / MOV E 18KT', sub: 'TOP FL310  TREND +08' },
      { type: 'SIGMET', main: 'CONVECTIVE ACT', sub: 'VCTS / CB  NW QUADRANT' },
      { type: 'METAR', kind: 'info', main: () => `KBFI ${weatherTimestamp()} 19012G18KT`, sub: '6SM -RA BKN025 OVC045 16/13 A2988' },
      { type: 'PRECIP RETURN', main: 'HEAVY CORE', sub: 'BRG 337°  RNG 24NM' },
      { type: 'TAF TREND', main: 'VCSH → TSRA', sub: 'BKN030CB  TEMPO 4SM' },
      { type: 'CELL TRACK', main: 'SPLIT DETECTED', sub: 'LEFT CELL MOV NE 12KT' },
      { type: 'METAR', kind: 'info', main: () => `KSEA ${weatherTimestamp()} 18014KT 5SM`, sub: 'TSRA BKN020CB OVC040 16/14 A2986' },
      { type: 'WX NOTICE', main: 'GAIN AUTO LIMIT', sub: 'CLUTTER REJECT ACTIVE' },
      { type: 'PRECIP RETURN', main: 'MODERATE BAND', sub: 'BRG 351°  RNG 31NM' }
    ];

    let nextMessage = 4;

    function messageText(value) {
      return typeof value === 'function' ? value() : value;
    }

    function makeEntry(message) {
      const entry = document.createElement('div');
      entry.className = `weather-message-entry${message.kind === 'info' ? ' wx-info' : ''}`;
      entry.innerHTML = `
        <span class="wx-msg-type"></span>
        <strong class="wx-msg-main"></strong>
        <span class="wx-msg-sub"></span>
      `;
      entry.querySelector('.wx-msg-type').textContent = message.type;
      entry.querySelector('.wx-msg-main').textContent = messageText(message.main);
      entry.querySelector('.wx-msg-sub').textContent = messageText(message.sub);
      return entry;
    }

    [messages[3], messages[2], messages[1], messages[0]].forEach(message => {
      feed.appendChild(makeEntry(message));
    });

    function addMessage() {
      const message = messages[nextMessage % messages.length];
      nextMessage += 1;

      feed.insertBefore(makeEntry(message), feed.firstChild);
      while (feed.children.length > 4) feed.lastElementChild.remove();

      const nextDelay = 5000 + Math.round(Math.random() * 3000);
      setTimeout(addMessage, nextDelay);
    }

    setTimeout(addMessage, 4200);
  }

  buildAirControlRail();
  startAirTrackSystem();
  buildWeatherLayout();
  startWeatherMessageFeed();
})();
