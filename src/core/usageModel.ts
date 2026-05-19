export type UsageWindow = {
  utilization: number | null;
  resetsAt: string | null;
};

export type ClaudeUsageState = {
  fiveHour: UsageWindow;
  sevenDay: UsageWindow;
  extraUsage: {
    enabled: boolean;
    utilization: number | null;
    monthlyLimit: number | null;
    usedCredits: number | null;
    currency: string | null;
  };
  source: 'web-api' | 'page-capture' | 'claude-code' | 'manual';
  lastSyncedAt: string;
  lastStatusCode?: number;
  lastError?: string | null;
};

export type NotificationMemory = {
  notifiedSessionWarningForResetAt?: string;
  notifiedSessionCriticalForResetAt?: string;
  notifiedSessionFinalForResetAt?: string;
  notifiedWeeklyWarningForResetAt?: string;
  notifiedWeeklyCriticalForResetAt?: string;
  notifiedResetForResetAt?: string;
};

export type SnoozeState = {
  mutedUntil?: string | null;
  mutedUntilResetAt?: string | null;
};

export type BadgeMode = 'smart' | 'reset-time' | 'usage-percent';
export type Theme = 'system' | 'light' | 'dark';
export type SyncInterval = 2 | 5 | 10 | 15;

export type Settings = {
  syncIntervalMinutes: SyncInterval;
  badgeMode: BadgeMode;
  theme: Theme;
  compactPopup: boolean;
  notifications: {
    sessionWarningPct: number;
    sessionCriticalPct: number;
    sessionFinalPct: number;
    weeklyWarningPct: number;
    weeklyCriticalPct: number;
    resetEnabled: boolean;
    weeklyEnabled: boolean;
    syncErrorEnabled: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
  };
};

export const DEFAULT_SETTINGS: Settings = {
  syncIntervalMinutes: 2,
  badgeMode: 'smart',
  theme: 'system',
  compactPopup: false,
  notifications: {
    sessionWarningPct: 85,
    sessionCriticalPct: 90,
    sessionFinalPct: 95,
    weeklyWarningPct: 80,
    weeklyCriticalPct: 95,
    resetEnabled: true,
    weeklyEnabled: true,
    syncErrorEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: 22,
    quietHoursEnd: 8,
  },
};

export type Severity = 'safe' | 'warning' | 'high' | 'critical';
