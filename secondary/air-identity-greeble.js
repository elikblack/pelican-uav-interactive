(() => {
  const feed = document.getElementById('air-message-feed');
  const rail = document.querySelector('.air-module .radar-side-data');
  if (!feed || !rail) return;

  const identities = {
    A17: { type: 'C172', hex: 'A4D91C' },
    T03: { type: 'PC12', hex: 'A91F03' },
    A08: { type: 'B350', hex: '------' },
    T11: { type: '----', hex: 'A6F20B' }
  };

  function targetId(text) {
    return Object.keys(identities).find(id => text.includes(id)) || null;
  }

  function wholeDegrees(value) {
    const number = parseFloat(value || '');
    return Number.isFinite(number) ? `${Math.round(number).toString().padStart(3, '0')}°` : '';
  }

  function liveFields() {
    const values = [...rail.querySelectorAll(':scope > div:not(.air-alert) > strong')].slice(0, 4);
    const raw = values.map(node => node && node.dataset.liveValue || '');
    const speed = parseFloat(raw[1]);
    const range = parseFloat(raw[3]);

    return {
      hdg: wholeDegrees(raw[0]),
      spd: Number.isFinite(speed) ? `${Math.round(speed)}KT` : '',
      brg: wholeDegrees(raw[2]),
      rng: Number.isFinite(range) ? `${range.toFixed(1)}NM` : ''
    };
  }

  function kinematicSuffix(fields) {
    const parts = [];
    if (fields.hdg) parts.push(`HDG ${fields.hdg}`);
    if (fields.spd) parts.push(`SPD ${fields.spd}`);
    return parts.join('  ');
  }

  function positionSuffix(fields) {
    const parts = [];
    if (fields.brg) parts.push(`BRG ${fields.brg}`);
    if (fields.rng) parts.push(`RNG ${fields.rng}`);
    return parts.join('  ');
  }

  function enrich(entry) {
    if (!entry || entry.dataset.identityGreeble === '1') return;
    if (entry.dataset.twoLineReady === '1') return;

    const raw = entry.textContent || '';
    const id = targetId(raw);
    if (!id) return;

    const identity = identities[id];
    const fields = liveFields();
    const kin = kinematicSuffix(fields);
    const pos = positionSuffix(fields);

    let state = 'TRACK';
    let type = identity.type;
    let hex = identity.hex;

    if (/BOGEY|UNCORR/i.test(raw)) {
      state = 'BOGEY / UNCORR';
      type = '----';
      hex = '------';
    } else if (/IDENT CHECK/i.test(raw)) {
      state = 'IDENT CHECK';
    } else if (/IFF CORRELATION|IDENTIFIED/i.test(raw)) {
      state = 'IFF CORR';
    } else if (/REACQUIRED/i.test(raw)) {
      state = 'REACQUIRED';
    } else if (/COAST/i.test(raw)) {
      state = 'COAST';
    } else if (/CORRELATED/i.test(raw)) {
      state = 'CORRELATED';
    }

    const lineOne = `${id} ${state}  ${type}${kin ? `  ${kin}` : ''}`;
    const lineTwo = `HEX ${hex}${pos ? `  ${pos}` : ''}`;

    entry.dataset.identityGreeble = '1';
    entry.textContent = `${lineOne}\n${lineTwo}`;
  }

  [...feed.querySelectorAll(':scope > .air-message-entry')].forEach(enrich);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('air-message-entry')) enrich(node);
      });
    });
  });

  observer.observe(feed, { childList: true });
})();
