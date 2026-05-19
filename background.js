// background.js — Service Worker

const ALARM_TICK = 'tick';
const ALARM_RESET_CHECK = 'resetCheck';

const DEFAULTS = {
  plan: 'pro',
  sessionMessages: 0,
  sessionStart: Date.now(),
  sessionWindowHours: 5,
  sessionLimit: 45,
  weekMessages: 0,
  weekStart: getWeekStart(),
  weekLimit: 300,
  notifyThresholds: [50, 75, 90, 95],
  notifiedThresholds: [],
  notifiedWeekThresholds: [],
  limitHit: false,
  lastResetNotified: null,
  manualMode: false // if true, user tracks manually via popup
};

function getWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day); // Get Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

function getNextWeekStart() {
  return getWeekStart() + 7 * 24 * 60 * 60 * 1000;
}

// ── Init ────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const toSet = {};
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (existing[k] === undefined) toSet[k] = v;
  }
  await chrome.storage.local.set(toSet);

  chrome.alarms.create(ALARM_TICK, { periodInMinutes: 1 });
  chrome.alarms.create(ALARM_RESET_CHECK, { periodInMinutes: 1 });

  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM_TICK, { periodInMinutes: 1 });
  chrome.alarms.create(ALARM_RESET_CHECK, { periodInMinutes: 1 });
  updateBadge();
});

// ── Alarm Handler ───────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_TICK || alarm.name === ALARM_RESET_CHECK) {
    await checkResets();
    await updateBadge();
  }
});

async function checkResets() {
  const data = await chrome.storage.local.get([
    'sessionStart', 'sessionWindowHours', 'sessionMessages',
    'sessionLimit', 'weekStart', 'weekMessages', 'weekLimit',
    'notifiedThresholds', 'notifiedWeekThresholds',
    'notifyThresholds', 'limitHit', 'lastResetNotified'
  ]);

  const now = Date.now();
  const updates = {};

  // ── Session reset ──
  const sessionEnd = data.sessionStart + data.sessionWindowHours * 3600 * 1000;
  if (now >= sessionEnd && data.sessionMessages > 0) {
    updates.sessionMessages = 0;
    updates.sessionStart = now;
    updates.notifiedThresholds = [];
    updates.limitHit = false;

    if (data.lastResetNotified !== 'session' || now - (data.lastResetNotified || 0) > 60000) {
      sendNotification(
        'claude-reset',
        '✅ Claude Session Reset',
        'Your session limit has refreshed. You\'re good to go!'
      );
      updates.lastResetNotified = now;
    }
  }

  // ── Week reset ──
  const nextWeek = getNextWeekStart();
  if (now >= nextWeek) {
    updates.weekMessages = 0;
    updates.weekStart = getWeekStart();
    updates.notifiedWeekThresholds = [];

    sendNotification(
      'claude-week-reset',
      '📅 Claude Weekly Reset',
      'Your weekly usage has reset. Fresh week ahead!'
    );
  }

  // ── Threshold notifications ──
  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }

  // Re-fetch after updates
  const fresh = await chrome.storage.local.get([
    'sessionMessages', 'sessionLimit', 'weekMessages', 'weekLimit',
    'notifyThresholds', 'notifiedThresholds', 'notifiedWeekThresholds'
  ]);

  checkThresholds(fresh);
}

function checkThresholds(data) {
  const sessionPct = data.sessionLimit > 0
    ? (data.sessionMessages / data.sessionLimit) * 100
    : 0;
  const weekPct = data.weekLimit > 0
    ? (data.weekMessages / data.weekLimit) * 100
    : 0;

  const thresholds = data.notifyThresholds || [50, 75, 90, 95];
  const notifiedSession = data.notifiedThresholds || [];
  const notifiedWeek = data.notifiedWeekThresholds || [];
  const newNotifiedSession = [...notifiedSession];
  const newNotifiedWeek = [...notifiedWeek];
  let changed = false;

  for (const t of thresholds) {
    if (sessionPct >= t && !notifiedSession.includes(t)) {
      newNotifiedSession.push(t);
      changed = true;
      const emoji = t >= 95 ? '🔴' : t >= 75 ? '🟠' : '🟡';
      sendNotification(
        `session-${t}`,
        `${emoji} Session at ${t}%`,
        `You've used ${data.sessionMessages} of ${data.sessionLimit} messages this session.${t >= 95 ? ' Consider pausing — this may be your last session this week!' : ''}`
      );
    }
    if (weekPct >= t && !notifiedWeek.includes(t)) {
      newNotifiedWeek.push(t);
      changed = true;
      const emoji = t >= 95 ? '🔴' : t >= 75 ? '🟠' : '🟡';
      sendNotification(
        `week-${t}`,
        `${emoji} Weekly Usage at ${t}%`,
        `You've used ${data.weekMessages} of ${data.weekLimit} messages this week.${t >= 95 ? ' ⚠️ Last session warning: you\'re almost out of your weekly quota!' : ''}`
      );
    }
  }

  if (changed) {
    chrome.storage.local.set({
      notifiedThresholds: newNotifiedSession,
      notifiedWeekThresholds: newNotifiedWeek
    });
  }
}

// ── Message Handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === 'MESSAGES_SENT') {
    const data = await chrome.storage.local.get([
      'sessionMessages', 'weekMessages', 'sessionLimit',
      'weekLimit', 'notifyThresholds', 'notifiedThresholds', 'notifiedWeekThresholds'
    ]);

    const newSession = (data.sessionMessages || 0) + msg.delta;
    const newWeek = (data.weekMessages || 0) + msg.delta;

    await chrome.storage.local.set({
      sessionMessages: newSession,
      weekMessages: newWeek
    });

    checkThresholds({
      ...data,
      sessionMessages: newSession,
      weekMessages: newWeek
    });

    updateBadge();
  }

  if (msg.type === 'LIMIT_HIT') {
    const data = await chrome.storage.local.get(['limitHit', 'sessionStart', 'sessionWindowHours']);
    if (!data.limitHit) {
      await chrome.storage.local.set({ limitHit: true });
      const resetIn = (data.sessionStart + data.sessionWindowHours * 3600 * 1000) - Date.now();
      const resetMins = Math.max(0, Math.ceil(resetIn / 60000));
      const resetStr = resetMins >= 60
        ? `${Math.floor(resetMins / 60)}h ${resetMins % 60}m`
        : `${resetMins}m`;

      sendNotification(
        'limit-hit',
        '🚫 Claude Limit Reached',
        `You've hit your session limit. Reset in ${resetStr}.`
      );
    }
  }

  if (msg.type === 'ADD_MANUAL') {
    const data = await chrome.storage.local.get(['sessionMessages', 'weekMessages']);
    const newSession = Math.max(0, (data.sessionMessages || 0) + msg.delta);
    const newWeek = Math.max(0, (data.weekMessages || 0) + msg.delta);
    await chrome.storage.local.set({ sessionMessages: newSession, weekMessages: newWeek });
    checkThresholds({ ...data, sessionMessages: newSession, weekMessages: newWeek });
    updateBadge();
  }

  if (msg.type === 'RESET_SESSION') {
    await chrome.storage.local.set({
      sessionMessages: 0,
      sessionStart: Date.now(),
      notifiedThresholds: [],
      limitHit: false
    });
    updateBadge();
  }

  if (msg.type === 'RESET_WEEK') {
    await chrome.storage.local.set({
      weekMessages: 0,
      weekStart: getWeekStart(),
      notifiedWeekThresholds: []
    });
    updateBadge();
  }
});

// ── Badge ───────────────────────────────────────────────────────────────────

async function updateBadge() {
  const data = await chrome.storage.local.get([
    'sessionStart', 'sessionWindowHours', 'sessionMessages',
    'sessionLimit', 'weekMessages', 'weekLimit', 'limitHit'
  ]);

  const pct = data.sessionLimit > 0
    ? (data.sessionMessages / data.sessionLimit) * 100
    : 0;

  const weekPct = data.weekLimit > 0
    ? (data.weekMessages / data.weekLimit) * 100
    : 0;

  const now = Date.now();
  const sessionEnd = data.sessionStart + data.sessionWindowHours * 3600 * 1000;
  const minsLeft = Math.max(0, Math.ceil((sessionEnd - now) / 60000));

  let badgeText = '';
  if (data.limitHit) {
    badgeText = minsLeft >= 60 ? `${Math.floor(minsLeft / 60)}h` : `${minsLeft}m`;
  } else {
    badgeText = minsLeft >= 60 ? `${Math.floor(minsLeft / 60)}h` : `${minsLeft}m`;
  }

  const color = weekPct >= 95 ? '#ef4444'
    : pct >= 85 ? '#ef4444'
    : pct >= 60 ? '#f97316'
    : '#22c55e';

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color });
}

// ── Notifications ───────────────────────────────────────────────────────────

function sendNotification(id, title, message) {
  chrome.notifications.create(`claude-tracker-${id}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 2
  });
}
