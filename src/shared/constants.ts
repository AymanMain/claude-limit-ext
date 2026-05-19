export const STORAGE_KEY_ORG_ID = 'orgId';
export const STORAGE_KEY_USAGE = 'usageState';
export const STORAGE_KEY_SETTINGS = 'settings';
export const STORAGE_KEY_NOTIFICATION_MEMORY = 'notificationMemory';
export const STORAGE_KEY_SNOOZE = 'snoozeState';
export const STORAGE_KEY_HISTORY = 'usageHistory';

export const ALARM_REFRESH = 'refresh';

export const SYNC_INTERVAL_DEFAULT = 2;
export const SYNC_INTERVALS = [2, 5, 10, 15] as const;

export const FRESHNESS_FRESH_MS = 5 * 60 * 1000;
export const FRESHNESS_STALE_MS = 30 * 60 * 1000;

export const CLAUDE_BASE_URL = 'https://claude.ai';
export const USAGE_ENDPOINT = (orgId: string) =>
  `${CLAUDE_BASE_URL}/api/organizations/${orgId}/usage`;
