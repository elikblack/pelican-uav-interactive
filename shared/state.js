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
      latencyMs: 84,
      txPowerWatts: 25.0
    },
    diagnostics: {
      stationTempC: 38,
      activeFaults: 0
    },
    aircraft: {
      headingDeg: 92,
      groundSpeedKt: 188,
      altitudeFt: 12480,
      enduranceSeconds: 13320
    },
    navigation: {
      source: 'GPS_INS',
      valid: true
    },
    mission: {
      phase: 'NAV',
      targetIndex: 1,
      targetId: 'WPT 1',
      targetKind: 'nav',
      completedThrough: 0,
      taskType: null,
      taskLabel: null,
      taskProgress: 0,
      routeProgress: 0,
      activeLeg: 'STG > WPT 1',
      courseDeg: 92,
      crossTrackNm: 0,
      distanceToNextNm: 0,
      eteSeconds: 0
    }
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  const channel = typeof BroadcastChannel === 'function'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;
  let revisions = Object.fromEntries(Object.keys(state).map(key => [key, 0]));
  let revisionClock = Date.now();

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

  function nextRevision() {
    revisionClock = Math.max(Date.now(), revisionClock + 1);
    return revisionClock;
  }

  function normalizeKeys(keys) {
    if (keys == null) return null;
    const values = Array.isArray(keys) ? keys : [keys];
    return new Set(values.map(String));
  }

  function notify(source = 'local', changedKeys = null) {
    const snapshot = clone(state);
    const changed = changedKeys ? [...changedKeys] : null;
    listeners.forEach(entry => {
      if (entry.keys && changed && !changed.some(key => entry.keys.has(key))) return;
      entry.listener(snapshot, source, changed);
    });
  }

  function broadcastState(source, changedKeys) {
    if (!channel) return;
    channel.postMessage({
      type: 'state',
      state,
      source,
      changedKeys: changedKeys ? [...changedKeys] : null,
      revisions
    });
  }

  function replace(next, source = 'local', broadcast = true) {
    state = clone(next);
    const changedKeys = Object.keys(state);
    changedKeys.forEach(key => {
      revisions[key] = nextRevision();
    });
    notify(source, changedKeys);
    if (broadcast) broadcastState(source, changedKeys);
  }

  function update(patch, source = 'local') {
    const changedKeys = Object.keys(patch || {});
    if (!changedKeys.length) return;
    state = merge(state, patch);
    changedKeys.forEach(key => {
      revisions[key] = nextRevision();
    });
    notify(source, changedKeys);
    broadcastState(source, changedKeys);
  }

  function subscribe(listener, keys = null) {
    const entry = { listener, keys: normalizeKeys(keys) };
    listeners.add(entry);
    listener(clone(state), 'initial', null);
    return () => listeners.delete(entry);
  }

  function applyRemote(message) {
    const incomingState = message.state;
    const incomingRevisions = message.revisions;
    if (!incomingState || typeof incomingState !== 'object') return;

    // Backward-compatible fallback for a tab still running the old state client.
    // Only accept an unversioned snapshot before this instance has seen any
    // authoritative mutation of its own.
    if (!incomingRevisions || typeof incomingRevisions !== 'object') {
      if (Object.values(revisions).some(value => value > 0)) return;
      state = clone(incomingState);
      notify(message.source || 'remote', Object.keys(state));
      return;
    }

    const patch = {};
    const changedKeys = [];
    Object.keys(incomingState).forEach(key => {
      const incomingRevision = Number(incomingRevisions[key]) || 0;
      const currentRevision = Number(revisions[key]) || 0;
      if (incomingRevision <= currentRevision) return;
      patch[key] = incomingState[key];
      revisions[key] = incomingRevision;
      revisionClock = Math.max(revisionClock, incomingRevision);
      changedKeys.push(key);
    });

    if (!changedKeys.length) return;
    state = merge(state, patch);
    notify(message.source || 'remote', changedKeys);
  }

  if (channel) {
    channel.addEventListener('message', event => {
      const message = event.data || {};
      if (message.type === 'hello') {
        channel.postMessage({
          type: 'state',
          state,
          source: 'sync',
          changedKeys: null,
          revisions
        });
      } else if (message.type === 'state' && message.state) {
        applyRemote(message);
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
