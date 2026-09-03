(() => {
  const feed = document.getElementById('air-message-feed');
  if (!feed) return;

  const identities = {
    A17: { type: 'C172', hex: 'A4D91C' },
    T03: { type: 'PC12', hex: 'A91F03' },
    A08: { type: 'B350', hex: '------' },
    T11: { type: '----', hex: 'A6F20B' }
  };

  function targetId(text) {
    return Object.keys(identities).find(id => text.includes(id)) || null;
  }

  function compactBearingRange(line) {
    const bearing = line.match(/BRG\s+(\d{1,3})°?/i);
    const range = line.match(/RNG\s+([0-9.]+)NM/i);
    if (!bearing && !range) return '';

    const fields = [];
    if (bearing) fields.push(`B${bearing[1].padStart(3, '0')}`);
    if (range) fields.push(`R${range[1]}`);
    return fields.join('  ');
  }

  function enrich(entry) {
    if (!entry || entry.dataset.identityGreeble === '1') return;
    if (entry.dataset.twoLineReady === '1') return;

    const raw = entry.textContent || '';
    const id = targetId(raw);
    if (!id) return;

    const identity = identities[id];
    const lines = raw.split('\n');
    const first = lines[0] || '';
    const second = lines.slice(1).join(' ') || '';
    const brgRng = compactBearingRange(second);

    let lineOne;
    let lineTwo;

    if (/BOGEY|UNCORR/i.test(raw)) {
      lineOne = `${id} BOGEY / UNCORR  ----`;
      lineTwo = `HEX ------  TRACK VALID`;
    } else if (/IDENT CHECK/i.test(raw)) {
      lineOne = `${id} IDENT CHECK  ${identity.type}`;
      lineTwo = `HEX ${identity.hex}  CORR LOST`;
    } else if (/IFF CORRELATION|IDENTIFIED/i.test(raw)) {
      lineOne = `${id} IFF CORR  ${identity.type}`;
      lineTwo = `HEX ${identity.hex}  IDENTIFIED`;
    } else if (/REACQUIRED/i.test(raw)) {
      lineOne = `${id} REACQUIRED  ${identity.type}`;
      lineTwo = `HEX ${identity.hex}  SURV VALID`;
    } else if (/COAST/i.test(raw)) {
      lineOne = `${id} COAST  ${identity.type}`;
      lineTwo = `HEX ${identity.hex}  POS EXTRAP`;
    } else if (/CORRELATED/i.test(raw)) {
      lineOne = `${id} CORRELATED  ${identity.type}`;
      lineTwo = `HEX ${identity.hex}${brgRng ? `  ${brgRng}` : ''}`;
    } else {
      lineOne = `${first}  ${identity.type}`;
      lineTwo = `HEX ${identity.hex}${second ? `  ${second}` : ''}`;
    }

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
