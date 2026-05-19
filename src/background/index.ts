import { setupAlarms, updateAlarmInterval } from './alarms';
import { refreshUsage } from './refreshUsage';
import { setOrgId, getSettings } from '../core/storage';
import { ALARM_REFRESH } from '../shared/constants';

chrome.runtime.onInstalled.addListener(async () => {
  await setupAlarms();
  await refreshUsage();
});

chrome.runtime.onStartup.addListener(async () => {
  await setupAlarms();
  await refreshUsage();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_REFRESH) {
    await refreshUsage();
  }
});

chrome.runtime.onMessage.addListener(
  (
    msg: { type: string; orgId?: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (r: { ok: boolean }) => void,
  ) => {
    if (msg.type === 'ORG_ID_DETECTED' && msg.orgId) {
      setOrgId(msg.orgId).then(() => refreshUsage()).then(() => sendResponse({ ok: true }));
      return true;
    }

    if (msg.type === 'REFRESH_NOW') {
      refreshUsage().then(() => sendResponse({ ok: true }));
      return true;
    }

    if (msg.type === 'SETTINGS_UPDATED') {
      getSettings()
        .then((s) => updateAlarmInterval(s.syncIntervalMinutes))
        .then(() => sendResponse({ ok: true }));
      return true;
    }

    if (msg.type === 'DETECT_ORG_ID') {
      chrome.tabs.query({ url: 'https://claude.ai/*' }, (tabs) => {
        const active = tabs.find((t) => t.active) ?? tabs[0];
        if (active?.id) {
          chrome.tabs.sendMessage(active.id, { type: 'DETECT_ORG_ID' });
        }
        sendResponse({ ok: true });
      });
      return true;
    }

    return false;
  },
);
