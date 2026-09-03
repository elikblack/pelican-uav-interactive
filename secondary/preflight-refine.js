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
      <div class="weather-metar-block">
        <span>METAR / AUTO</span>
        <strong id="weather-metar"></strong>
      </div>
    `;

    body.appendChild(rail);
    body.appendChild(pane);
  }

  function startWeatherMessageFeed() {
    const feed = document.getElementById('weather-message-feed');
    const metar = document.getElementById('weather-metar');
    if (!feed || !metar) return;

    const messages = [
      { type: 'WEATHER ALERT', main: 'MODERATE / HEAVY', sub: 'FWD SECTOR  20–40NM' },
      { type: 'CELL TRACK', main: 'TSRA / MOV E 18KT', sub: 'TOP FL310  TREND +08' },
      { type: 'SIGMET', main: 'CONVECTIVE ACT', sub: 'VCTS / CB  NW QUADRANT' },
      { type: 'PRECIP RETURN', main: 'HEAVY CORE', sub: 'BRG 337°  RNG 24NM' },
      { type: 'TAF TREND', main: 'VCSH → TSRA', sub: 'BKN030CB  TEMPO 4SM' },
      { type: 'CELL TRACK', main: 'SPLIT DETECTED', sub: 'LEFT CELL MOV NE 12KT' },
      { type: 'WX NOTICE', main: 'GAIN AUTO LIMIT', sub: 'CLUTTER REJECT ACTIVE' },
      { type: 'PRECIP RETURN', main: 'MODERATE BAND', sub: 'BRG 351°  RNG 31NM' }
    ];

    const metars = [
      () => `KBFI ${weatherTimestamp()} 19012G18KT 6SM -RA BKN025 OVC045 16/13 A2988`,
      () => `KPAE ${weatherTimestamp()} 21009KT 8SM VCTS SCT028CB BKN055 17/12 A2987`,
      () => `KSEA ${weatherTimestamp()} 18014KT 5SM TSRA BKN020CB OVC040 16/14 A2986`,
      () => `KBFI ${weatherTimestamp()} 20011KT P6SM VCSH SCT030 BKN060 17/13 A2989`
    ];

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let nextMessage = 3;
    let nextMetar = 0;

    function makeEntry(message) {
      const entry = document.createElement('div');
      entry.className = 'weather-message-entry';
      entry.innerHTML = `
        <span class="wx-msg-type"></span>
        <strong class="wx-msg-main"></strong>
        <span class="wx-msg-sub"></span>
      `;
      entry.querySelector('.wx-msg-type').textContent = message.type;
      entry.querySelector('.wx-msg-main').textContent = message.main;
      entry.querySelector('.wx-msg-sub').textContent = message.sub;
      return entry;
    }

    [messages[2], messages[1], messages[0]].forEach(message => {
      feed.appendChild(makeEntry(message));
    });

    function updateMetar() {
      metar.textContent = metars[nextMetar % metars.length]();
      nextMetar += 1;
    }

    function addMessage() {
      const message = messages[nextMessage % messages.length];
      nextMessage += 1;

      const entry = makeEntry(message);
      feed.insertBefore(entry, feed.firstChild);

      if (!reducedMotion) {
        entry.animate(
          [
            { opacity: 0, transform: 'translateY(-12px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          { duration: 300, easing: 'steps(4,end)' }
        );
      }

      while (feed.children.length > 3) feed.lastElementChild.remove();

      if (nextMessage % 2 === 0) updateMetar();
      const nextDelay = 5000 + Math.round(Math.random() * 3000);
      setTimeout(addMessage, nextDelay);
    }

    updateMetar();
    setTimeout(addMessage, 4200);
  }

  buildAirControlRail();
  buildWeatherLayout();
  startWeatherMessageFeed();
})();
