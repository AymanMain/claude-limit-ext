import type { ClaudeUsageState, Settings, NotificationMemory, SnoozeState } from './usageModel';
import { DEFAULT_SETTINGS } from './usageModel';
import {
  STORAGE_KEY_ORG_ID,
  STORAGE_KEY_USAGE,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_NOTIFICATION_MEMORY,
  STORAGE_KEY_SNOOZE,
} from '../shared/constants';

export async function getOrgId(): Promise<string | null> {
  const r = await chrome.storage.local.get(STORAGE_KEY_ORG_ID);
  return (r[STORAGE_KEY_ORG_ID] as string | undefined) ?? null;
}

export async function setOrgId(orgId: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_ORG_ID]: orgId });
}

export async function clearOrgId(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY_ORG_ID);
}

export async function getUsageState(): Promise<ClaudeUsageState | null> {
  const r = await chrome.storage.local.get(STORAGE_KEY_USAGE);
  return (r[STORAGE_KEY_USAGE] as ClaudeUsageState | undefined) ?? null;
}

export async function setUsageState(state: ClaudeUsageState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_USAGE]: state });
}

export async function getSettings(): Promise<Settings> {
  const r = await chrome.storage.local.get(STORAGE_KEY_SETTINGS);
  const saved = (r[STORAGE_KEY_SETTINGS] as Partial<Settings> | undefined) ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...((saved.notifications as Partial<Settings['notifications']>) ?? {}),
    },
  };
}

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: settings });
}

export async function getNotificationMemory(): Promise<NotificationMemory> {
  const r = await chrome.storage.local.get(STORAGE_KEY_NOTIFICATION_MEMORY);
  return (r[STORAGE_KEY_NOTIFICATION_MEMORY] as NotificationMemory | undefined) ?? {};
}

export async function setNotificationMemory(memory: NotificationMemory): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_NOTIFICATION_MEMORY]: memory });
}

export async function getSnoozeState(): Promise<SnoozeState> {
  const r = await chrome.storage.local.get(STORAGE_KEY_SNOOZE);
  return (r[STORAGE_KEY_SNOOZE] as SnoozeState | undefined) ?? {};
}

export async function setSnoozeState(snooze: SnoozeState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_SNOOZE]: snooze });
}

export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
}
