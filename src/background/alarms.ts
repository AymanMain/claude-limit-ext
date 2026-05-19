import { ALARM_REFRESH } from '../shared/constants';
import { getSettings } from '../core/storage';

export async function setupAlarms(): Promise<void> {
  const settings = await getSettings();
  await chrome.alarms.clearAll();
  chrome.alarms.create(ALARM_REFRESH, {
    periodInMinutes: settings.syncIntervalMinutes,
    delayInMinutes: 0,
  });
}

export async function updateAlarmInterval(minutes: number): Promise<void> {
  await chrome.alarms.clear(ALARM_REFRESH);
  chrome.alarms.create(ALARM_REFRESH, { periodInMinutes: minutes });
}
