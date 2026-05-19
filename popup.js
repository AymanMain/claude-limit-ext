// popup.js

const ARC_CIRCUMFERENCE = 565.49; // 2 * π * 90
const WEEK_ARC_CIRCUMFERENCE = 490.09; // 2 * π * 78

const PLAN_PRESETS = {
  free:   { sessionLimit: 10, sessionWindowHours: 8, weekLimit: 50 },
  pro:    { sessionLimit: 45, sessionWindowHours: 5, weekLimit: 300 },
  team:   { sessionLimit: 50, sessionWindowHours: 5, weekLimit: 400 },
  custom: null
};

// ── State ────────────────────────────────────────────────────────────────────

let state = {};
let refreshInterval = null;

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  state = await loadState();
  render(state);
  bindEvents();

  // Refresh time display every 10 seconds
  refreshInterval = setInterval(async () => {
    state = await loadState();
    render(state);
  }, 10000);
});

async function loadState() {
  return new Promise(resolve => {
    chrome.storage.local.get([
      'plan', 'sessionMessages', 'sessionStart', 'sessionWindowHours',
      'sessionLimit', 'weekMessages', 'weekStart', 'weekLimit',
      'notifyThresholds', 'limitHit', 'manualMode'
    ], data => {
      const defaults = {
        plan: 'pro',
        sessionMessages: 0,
        sessionStart: Date.now(),
        sessionWindowHours: 5,
        sessionLimit: 45,
        weekMessages: 0,
        weekStart: getWeekStart(),
        weekLimit: 300,
        notifyThresholds: [50, 75, 90, 95],
        limitHit: false,
        manualMode: false
      };
      resolve({ ...defaults, ...data });
    });
  });
}

// ── Render ───────────────────────────────────────────────────────────────────

function render(s) {
  const sessionPct = Math.min(100, s.sessionLimit > 0 ? (s.sessionMessages / s.sessionLimit) * 100 : 0);
  const weekPct    = Math.min(100, s.weekLimit > 0    ? (s.weekMessages    / s.weekLimit)    * 100 : 0);

  // State class
  const stateClass = weekPct >= 95 || sessionPct >= 85 ? 'state-red'
    : sessionPct >= 60 ? 'state-orange'
    : 'state-green';

  const app = document.getElementById('app');
  app.className = `app ${stateClass}`;

  // Gauge arc
  const arcOffset = ARC_CIRCUMFERENCE * (1 - sessionPct / 100);
  const weekOffset = WEEK_ARC_CIRCUMFERENCE * (1 - weekPct / 100);
  document.getElementById('progressArc').style.strokeDashoffset = arcOffset;
  document.getElementById('weekArc').style.strokeDashoffset = weekOffset;

  // Percentage display
  document.getElementById('pctDisplay').textContent = `${Math.round(sessionPct)}% used`;

  // Time display
  const now = Date.now();
  const sessionEnd = s.sessionStart + s.sessionWindowHours * 3600 * 1000;
  const msLeft = Math.max(0, sessionEnd - now);
  const minsLeft = Math.ceil(msLeft / 60000);

  let timeStr;
  if (minsLeft === 0) {
    timeStr = '—';
    document.getElementById('timeLabel').textContent = 'resetting…';
  } else if (minsLeft < 60) {
    timeStr = `${minsLeft}m`;
    document.getElementById('timeLabel').textContent = 'until reset';
  } else {
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    timeStr = m > 0 ? `${h}h ${m}m` : `${h}h`;
    document.getElementById('timeLabel').textContent = 'until reset';
  }

  document.getElementById('timeDisplay').textContent = timeStr;

  // Stats
  document.getElementById('sessionUsed').textContent = s.sessionMessages;
  document.getElementById('sessionTotal').textContent = s.sessionLimit;
  document.getElementById('sessionBarFill').style.width = `${sessionPct}%`;

  document.getElementById('weekUsed').textContent = s.weekMessages;
  document.getElementById('weekTotal').textContent = s.weekLimit;
  document.getElementById('weekBarFill').style.width = `${weekPct}%`;

  // Warning banner
  const wb = document.getElementById('warningBanner');
  const wt = document.getElementById('warningText');
  if (weekPct >= 95) {
    wb.style.display = 'flex';
    wt.textContent = `⚠ Last session of the week! You've used ${Math.round(weekPct)}% of your weekly quota. Use carefully.`;
  } else if (s.limitHit) {
    wb.style.display = 'flex';
    wt.textContent = `Session limit reached. Resets in ${timeStr}.`;
  } else {
    wb.style.display = 'none';
  }
}

// ── Events ───────────────────────────────────────────────────────────────────

function bindEvents() {
  // Settings toggle
  document.getElementById('settingsToggle').addEventListener('click', () => {
    const main = document.getElementById('mainView');
    const settings = document.getElementById('settingsPanel');
    const isSettings = settings.style.display !== 'none';
    main.style.display = isSettings ? 'flex' : 'none';
    settings.style.display = isSettings ? 'none' : 'block';
    if (!isSettings) loadSettingsUI();
  });

  // Add manual message
  document.getElementById('addMsgBtn').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'ADD_MANUAL', delta: 1 });
    state = await loadState();
    render(state);
  });

  // Open Claude
  document.getElementById('openClaudeBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://claude.ai' });
  });

  // Reset session
  document.getElementById('resetSessionBtn').addEventListener('click', async () => {
    if (confirm('Reset your session counter?')) {
      await chrome.runtime.sendMessage({ type: 'RESET_SESSION' });
      state = await loadState();
      render(state);
    }
  });

  // Save settings
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

  // Reset all
  document.getElementById('resetAllBtn').addEventListener('click', async () => {
    if (confirm('Reset ALL data and counters?')) {
      await chrome.runtime.sendMessage({ type: 'RESET_SESSION' });
      await chrome.runtime.sendMessage({ type: 'RESET_WEEK' });
      state = await loadState();
      render(state);
      toggleSettings(false);
    }
  });

  // Plan select
  document.getElementById('planSelect').addEventListener('change', (e) => {
    const custom = document.getElementById('customSection');
    custom.style.display = e.target.value === 'custom' ? 'flex' : 'none';
    if (e.target.value !== 'custom') applyPlanPreset(e.target.value);
  });
}

function toggleSettings(show) {
  document.getElementById('mainView').style.display = show ? 'none' : 'flex';
  document.getElementById('settingsPanel').style.display = show ? 'block' : 'none';
}

async function loadSettingsUI() {
  const s = await loadState();

  const planSelect = document.getElementById('planSelect');
  planSelect.value = s.plan || 'pro';

  document.getElementById('customSection').style.display =
    s.plan === 'custom' ? 'flex' : 'none';

  document.getElementById('sessionLimitInput').value  = s.sessionLimit;
  document.getElementById('sessionWindowInput').value = s.sessionWindowHours;
  document.getElementById('weekLimitInput').value     = s.weekLimit;

  const thresholds = s.notifyThresholds || [50, 75, 90, 95];
  document.querySelectorAll('.threshold-chip input').forEach(cb => {
    cb.checked = thresholds.includes(Number(cb.value));
  });

  // Load notification toggles
  chrome.storage.local.get(['notifyOnReset', 'notifyOnWeekReset'], data => {
    document.getElementById('notifyResetToggle').checked =
      data.notifyOnReset !== false;
    document.getElementById('notifyWeekResetToggle').checked =
      data.notifyOnWeekReset !== false;
  });
}

function applyPlanPreset(plan) {
  const preset = PLAN_PRESETS[plan];
  if (!preset) return;
  document.getElementById('sessionLimitInput').value  = preset.sessionLimit;
  document.getElementById('sessionWindowInput').value = preset.sessionWindowHours;
  document.getElementById('weekLimitInput').value     = preset.weekLimit;
}

async function saveSettings() {
  const plan = document.getElementById('planSelect').value;

  let sessionLimit, sessionWindowHours, weekLimit;

  if (plan !== 'custom') {
    const preset = PLAN_PRESETS[plan];
    sessionLimit = preset.sessionLimit;
    sessionWindowHours = preset.sessionWindowHours;
    weekLimit = preset.weekLimit;
  } else {
    sessionLimit = parseInt(document.getElementById('sessionLimitInput').value) || 45;
    sessionWindowHours = parseInt(document.getElementById('sessionWindowInput').value) || 5;
    weekLimit = parseInt(document.getElementById('weekLimitInput').value) || 300;
  }

  const notifyThresholds = [];
  document.querySelectorAll('.threshold-chip input:checked').forEach(cb => {
    notifyThresholds.push(Number(cb.value));
  });

  const notifyOnReset = document.getElementById('notifyResetToggle').checked;
  const notifyOnWeekReset = document.getElementById('notifyWeekResetToggle').checked;

  await chrome.storage.local.set({
    plan,
    sessionLimit,
    sessionWindowHours,
    weekLimit,
    notifyThresholds,
    notifyOnReset,
    notifyOnWeekReset,
    notifiedThresholds: [],
    notifiedWeekThresholds: []
  });

  // Feedback
  const btn = document.getElementById('saveSettingsBtn');
  btn.textContent = '✓ Saved!';
  setTimeout(() => { btn.textContent = 'Save Settings'; }, 1500);

  state = await loadState();
  render(state);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}
