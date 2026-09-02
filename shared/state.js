(() => {
  const CHANNEL_NAME = 'pelican-uav-interactive-v2';
  const listeners = new Set();
  let state = {
    mission: { status: 'IDLE', requestId: null },
    aircraft: { status: 'READY' },
    selectedTrack: null,
    alerts: []
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  const channel = typeof BroadcastChannel === 'function'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

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
    replace({ ...state, ...patch }, source, true);
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
