(() => {
  const CHANNEL_NAME = 'pelican-uav-interactive-v3';
  const listeners = new Set();

  // Keep this deliberately small. Shared state describes underlying facts,
  // not the labels individual displays choose to show.
  let state = {
    power: {
      busVoltage: 27.8,
      loadWatts: 232
    },
    link: {
      marginDb: 18.2,
      latencyMs: 84
    },
    diagnostics: {
      stationTempC: 38,
      activeFaults: 0
    }
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  const channel = typeof BroadcastChannel === 'function'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

  function merge(base, patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return clone(patch);
    const next = { ...(base || {}) };
    Object.entries(patch).forEach(([key, value]) => {
      next[key] = value && typeof value === 'object' && !Array.isArray(value)
        ? merge(next[key], value)
        : clone(value);
    });
    return next;
  }

  function notify(source = 'local') {
    const snapshot = clone(state);
    listeners.forEach(listener => listener(snapshot, source));
  }

  function replace(next, source = 'local', broadcast = true) {
    state = clone(next);
    notify(source);
    if (broadcast && channel) channel.postMessage({ type: 'state', state, source });
  }

  function update(patch, source = 'local') {
    replace(merge(state, patch), source, true);
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(clone(state), 'initial');
    return () => listeners.delete(listener);
  }

  if (channel) {
    channel.addEventListener('message', event => {
      const message = event.data || {};
      if (message.type === 'hello') {
        channel.postMessage({ type: 'state', state, source: 'sync' });
      } else if (message.type === 'state' && message.state) {
        replace(message.state, message.source || 'remote', false);
      }
    });
    channel.postMessage({ type: 'hello' });
  }

  window.UAV_SHARED = {
    getState: () => clone(state),
    update,
    replace,
    subscribe
  };
})();
