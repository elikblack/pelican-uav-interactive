(() => {
  const module = document.querySelector('.air-module');
  const body = module && module.querySelector('.radar-module-body');
  const controlRail = module && module.querySelector('.air-control-rail');
  const legend = module && module.querySelector('.radar-legend');
  const alert = module && module.querySelector('.radar-side-data .air-alert');
  const header = alert && alert.querySelector('b');
  const feed = document.getElementById('air-message-feed');
  if (!module || !body || !controlRail || !legend || !alert || !header || !feed) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MESSAGE_ROW_HEIGHT = 44;

  /* Move the existing legend rather than duplicating its state/key definitions. */
  controlRail.appendChild(legend);

  const summary = document.createElement('div');
  summary.className = 'air-message-summary';
  summary.setAttribute('aria-live', 'polite');
  summary.dataset.tone = 'normal';
  summary.textContent = header.textContent || '[AIRSPACE / MONITOR]';
  body.appendChild(summary);

  let summaryToken = 0;

  function summaryTone(text) {
    const value = text.toUpperCase();
    if (value.includes('UNCORR')) return 'critical';
    if (value.includes('COAST') || value.includes('IDENT CHECK')) return 'warning';
    if (value.includes('REACQUIRED') || value.includes('IFF VALID')) return 'resolved';
    return 'normal';
  }

  function replaceSummary(nextText) {
    const token = ++summaryToken;
    summary.dataset.tone = summaryTone(nextText);

    if (reducedMotion) {
      summary.textContent = nextText;
      return;
    }

    const currentText = summary.textContent;
    const width = Math.max(currentText.length, nextText.length);
    const current = currentText.padEnd(width, ' ').split('');
    const next = nextText.padEnd(width, ' ').split('');
    let index = 0;

    /* The blank advances one character ahead of the replacement, producing a
       visible little erase head instead of an instantaneous character swap. */
    const timer = setInterval(() => {
      if (token !== summaryToken) {
        clearInterval(timer);
        return;
      }

      if (index > 0) current[index - 1] = next[index - 1];
      if (index < width) current[index] = ' ';
      summary.textContent = current.join('');
      index += 1;

      if (index > width) {
        clearInterval(timer);
        summary.textContent = nextText;
      }
    }, 32);
  }

  const headerObserver = new MutationObserver(() => {
    replaceSummary(header.textContent || '[AIRSPACE / MONITOR]');
  });
  headerObserver.observe(header, { childList: true, characterData: true, subtree: true });

  function splitMessage(entry, animateTyping) {
    if (entry.dataset.twoLineReady === '1') return;

    const raw = entry.textContent;
    const parts = raw.split('\n');
    const lineOneText = parts.shift() || '';
    const lineTwoText = parts.join(' ') || '';

    entry.dataset.twoLineReady = '1';
    entry.getAnimations().forEach(animation => animation.cancel());
    entry.textContent = '';

    const lineOne = document.createElement('span');
    const lineTwo = document.createElement('span');
    lineOne.className = 'air-message-line';
    lineTwo.className = 'air-message-line';
    entry.append(lineOne, lineTwo);

    if (!animateTyping || reducedMotion) {
      lineOne.textContent = lineOneText;
      lineTwo.textContent = lineTwoText;
      return;
    }

    let index = 0;
    const length = Math.max(lineOneText.length, lineTwoText.length);
    const timer = setInterval(() => {
      index += 1;
      lineOne.textContent = lineOneText.slice(0, index);
      lineTwo.textContent = lineTwoText.slice(0, index);
      if (index >= length) clearInterval(timer);
    }, 25);
  }

  /* Convert anything already present before this refinement layer loaded. */
  [...feed.querySelectorAll(':scope > .air-message-entry')].forEach(entry => {
    splitMessage(entry, false);
  });

  const feedObserver = new MutationObserver(mutations => {
    const additions = [];

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('air-message-entry')) additions.push(node);
      });
    });

    additions.forEach(entry => {
      const olderEntries = [...feed.querySelectorAll(':scope > .air-message-entry')]
        .filter(item => item !== entry);

      if (!reducedMotion) {
        olderEntries.forEach(oldEntry => {
          oldEntry.animate(
            [
              { transform: `translateY(${-MESSAGE_ROW_HEIGHT}px)` },
              { transform: 'translateY(0)' }
            ],
            { duration: 260, easing: 'steps(4,end)' }
          );
        });
      }

      splitMessage(entry, true);
    });
  });

  feedObserver.observe(feed, { childList: true });
})();
