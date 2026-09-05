(() => {
  const shared = window.UAV_SHARED;
  if (!shared) return;

  const rank = { good: 0, caution: 1, fault: 2 };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function worst(...states) {
    return states.reduce((current, next) => rank[next] > rank[current] ? next : current, 'good');
  }

  function secondaryPower(power) {
    const voltage = Number(power?.busVoltage);
    const load = Number(power?.loadWatts);
    if (voltage >= 24.5 && voltage <= 29.5 && load < 300) return 'good';
    if (voltage >= 23 && voltage <= 31 && load < 330) return 'caution';
    return 'fault';
  }

  function secondaryLink(link) {
    const margin = Number(link?.marginDb);
    const latency = Number(link?.latencyMs);
    if (margin >= 10 && latency <= 180) return 'good';
    if (margin >= 5 && latency <= 300) return 'caution';
    return 'fault';
  }

  function secondarySystems(diagnostics) {
    const temp = Number(diagnostics?.stationTempC);
    const faults = Number(diagnostics?.activeFaults);
    if (temp < 55 && faults === 0) return 'good';
    if (temp < 65 && faults <= 1) return 'caution';
    return 'fault';
  }

  function primaryPower(power) {
    const voltage = Number(power?.busVoltage);
    const load = Number(power?.loadWatts);
    if (voltage >= 24 && voltage <= 30.5 && load < 310) return 'good';
    if (voltage >= 22.5 && voltage <= 31.5 && load < 340) return 'caution';
    return 'fault';
  }

  function primaryLink(link) {
    const margin = Number(link?.marginDb);
    const latency = Number(link?.latencyMs);
    if (margin >= 8 && latency <= 200) return 'good';
    if (margin >= 4 && latency <= 350) return 'caution';
    return 'fault';
  }

  function primarySystems(diagnostics) {
    const temp = Number(diagnostics?.stationTempC);
    const faults = Number(diagnostics?.activeFaults);
    if (temp < 58 && faults === 0) return 'good';
    if (temp < 68 && faults <= 1) return 'caution';
    return 'fault';
  }

  function setSecondaryRow(row, state, goodText = 'GO') {
    if (!row) return;
    row.classList.toggle('is-caution', state === 'caution');
    row.classList.toggle('is-fault', state === 'fault');
    const strong = row.querySelector('strong');
    const text = state === 'good' ? goodText : state === 'caution' ? 'CHECK' : 'FAULT';
    if (strong) strong.textContent = text;
    const label = row.querySelector('span')?.textContent?.trim() || 'STATUS';
    row.setAttribute('aria-label', `${label}: ${text}`);
  }

  function setSharedMeter(id, text, width) {
    const value = document.getElementById(id);
    const card = value?.closest('.status-card');
    if (!card) return;
    card.dataset.sharedTelemetry = 'true';
    card.dataset.sharedValue = text;
    card.style.setProperty('--shared-meter-width', `${width}%`);
  }

  function renderSecondaryMeters(state) {
    const loadWatts = Number(state.power?.loadWatts);
    const tempC = Number(state.diagnostics?.stationTempC);
    const marginDb = Number(state.link?.marginDb);

    setSharedMeter(
      'power-consumption',
      `${Math.round(loadWatts)} W`,
      clamp(loadWatts / 340 * 100, 40, 90)
    );
    setSharedMeter(
      'thermal',
      `${Math.round(tempC)}°C`,
      clamp(tempC / 70 * 100, 35, 80)
    );
    setSharedMeter(
      'link-margin',
      `${marginDb >= 0 ? '+' : ''}${marginDb.toFixed(1)} dB`,
      clamp((marginDb + 5) / 30 * 100, 35, 96)
    );
  }

  function renderSecondary(state) {
    const module = document.querySelector('.status-module');
    if (!module) return false;

    const healthRow = module.querySelector('.status-health-main');
    const rows = [...module.querySelectorAll('.status-go-list > div')];
    const linkRow = rows[0];
    const powerRow = rows[1];
    const systemsRow = rows[2];

    const power = secondaryPower(state.power);
    const link = secondaryLink(state.link);
    const systems = secondarySystems(state.diagnostics);
    const health = worst(power, link, systems);

    setSecondaryRow(linkRow, link);
    setSecondaryRow(powerRow, power);
    setSecondaryRow(systemsRow, systems);
    setSecondaryRow(healthRow, health, 'GOOD');
    renderSecondaryMeters(state);

    const healthText = healthRow?.querySelector('small');
    if (healthText) {
      healthText.textContent = health === 'good'
        ? 'NO ACTIVE FAULTS'
        : health === 'caution' ? 'CHECK SUBSYSTEM STATUS' : 'ACTIVE FAULT';
    }
    return true;
  }

  function findPrimaryPlatformState(name) {
    const names = [...document.querySelectorAll('[data-panel-rows="platform"] .row-name')];
    const label = names.find(node => node.textContent.trim() === name);
    return label?.closest('.status-row')?.querySelector('.row-state') || null;
  }

  function findTelemetryState(name) {
    const labels = [...document.querySelectorAll('.datalink-panel .telemetry-line > span')];
    const label = labels.find(node => node.textContent.trim() === name);
    return label?.parentElement?.querySelector('strong') || null;
  }

  function renderPrimary(state) {
    const display = document.getElementById('primary-display');
    if (!display) return false;

    const power = primaryPower(state.power);
    const link = primaryLink(state.link);
    const systems = primarySystems(state.diagnostics);
    const overall = worst(power, link, systems);

    const systemRibbon = display.querySelector('[data-bind="labels.system"]');
    const linkRibbon = display.querySelector('[data-bind="labels.link"]');
    const powerState = findPrimaryPlatformState('POWER');
    const commsState = findPrimaryPlatformState('COMMS');
    const qualityState = findTelemetryState('LINK QUALITY');
    const latencyState = findTelemetryState('LATENCY');
    const telemetryState = findTelemetryState('TELEMETRY');

    if (systemRibbon) systemRibbon.textContent = overall === 'good' ? 'READY' : overall === 'caution' ? 'CHECK' : 'FAULT';
    if (linkRibbon) linkRibbon.textContent = link === 'good' ? 'GOOD' : link === 'caution' ? 'DEGRADED' : 'LOST';
    if (powerState) powerState.textContent = power === 'good' ? 'NOMINAL' : power === 'caution' ? 'CHECK' : 'FAULT';
    if (commsState) commsState.textContent = link === 'good' ? 'READY' : link === 'caution' ? 'DEGRADED' : 'FAULT';
    if (qualityState) qualityState.textContent = link === 'good' ? 'GOOD' : link === 'caution' ? 'FAIR' : 'LOST';

    const latency = Number(state.link?.latencyMs);
    if (latencyState) latencyState.textContent = latency <= 150 ? 'LOW' : latency <= 300 ? 'HIGH' : 'EXCESSIVE';
    if (telemetryState) telemetryState.textContent = link === 'good' ? 'NOMINAL' : link === 'caution' ? 'DEGRADED' : 'LOST';
    return true;
  }

  function render(state) {
    renderSecondary(state);
    renderPrimary(state);
  }

  shared.subscribe(render);
})();
