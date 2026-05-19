import type { ClaudeUsageState, NotificationMemory, Settings, SnoozeState } from '../core/usageModel';
import { formatCountdown, msUntilReset } from '../core/countdown';

function isQuietHours(settings: Settings): boolean {
  if (!settings.notifications.quietHoursEnabled) return false;
  const hour = new Date().getHours();
  const { quietHoursStart, quietHoursEnd } = settings.notifications;
  if (quietHoursStart > quietHoursEnd) {
    return hour >= quietHoursStart || hour < quietHoursEnd;
  }
  return hour >= quietHoursStart && hour < quietHoursEnd;
}

function isSnoozed(snooze: SnoozeState, resetAt: string | null): boolean {
  if (snooze.mutedUntil && new Date(snooze.mutedUntil) > new Date()) return true;
  if (snooze.mutedUntilResetAt && resetAt && snooze.mutedUntilResetAt === resetAt) return true;
  return false;
}

function send(id: string, title: string, message: string): void {
  chrome.notifications.create(`claude-limit-${id}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 2,
  });
}

export function evaluateNotifications(
  usage: ClaudeUsageState,
  prev: ClaudeUsageState | null,
  memory: NotificationMemory,
  settings: Settings,
  snooze: SnoozeState,
): NotificationMemory {
  const updated = { ...memory };
  const quiet = isQuietHours(settings);
  const n = settings.notifications;

  const fh = usage.fiveHour.utilization;
  const sd = usage.sevenDay.utilization;
  const fhResetAt = usage.fiveHour.resetsAt;
  const sdResetAt = usage.sevenDay.resetsAt;
  const snoozed = isSnoozed(snooze, fhResetAt);

  // Session warning
  if (!quiet && !snoozed && fh !== null && fh >= n.sessionWarningPct && fh < n.sessionCriticalPct) {
    const key = fhResetAt ?? 'none';
    if (updated.notifiedSessionWarningForResetAt !== key) {
      updated.notifiedSessionWarningForResetAt = key;
      send('session-warning', 'Claude session warning', `Your 5-hour usage is above ${n.sessionWarningPct}%.`);
    }
  }

  // Session critical
  if (!quiet && !snoozed && fh !== null && fh >= n.sessionCriticalPct && fh < n.sessionFinalPct) {
    const key = fhResetAt ?? 'none';
    if (updated.notifiedSessionCriticalForResetAt !== key) {
      updated.notifiedSessionCriticalForResetAt = key;
      const ms = msUntilReset(fhResetAt);
      const cd = ms > 0 ? ` Reset in ${formatCountdown(ms)}.` : '';
      send('session-critical', 'Claude session critical', `Your 5-hour usage is above ${n.sessionCriticalPct}%.${cd}`);
    }
  }

  // Session final
  if (!quiet && !snoozed && fh !== null && fh >= n.sessionFinalPct) {
    const key = fhResetAt ?? 'none';
    if (updated.notifiedSessionFinalForResetAt !== key) {
      updated.notifiedSessionFinalForResetAt = key;
      const ms = msUntilReset(fhResetAt);
      const cd = ms > 0 ? ` Reset in ${formatCountdown(ms)}.` : '';
      send('session-final', 'Claude session critical', `Your 5-hour usage is above ${n.sessionFinalPct}%.${cd}`);
    }
  }

  // Weekly warning
  if (!quiet && !snoozed && n.weeklyEnabled && sd !== null && sd >= n.weeklyWarningPct && sd < n.weeklyCriticalPct) {
    const key = sdResetAt ?? 'none';
    if (updated.notifiedWeeklyWarningForResetAt !== key) {
      updated.notifiedWeeklyWarningForResetAt = key;
      send('weekly-warning', 'Claude weekly warning', `Your 7-day usage is above ${n.weeklyWarningPct}%.`);
    }
  }

  // Weekly critical
  if (!quiet && !snoozed && n.weeklyEnabled && sd !== null && sd >= n.weeklyCriticalPct) {
    const key = sdResetAt ?? 'none';
    if (updated.notifiedWeeklyCriticalForResetAt !== key) {
      updated.notifiedWeeklyCriticalForResetAt = key;
      send('weekly-critical', 'Claude weekly warning', `Your 7-day usage is above ${n.weeklyCriticalPct}%. Be careful with long Claude Code sessions.`);
    }
  }

  // Reset detected
  if (n.resetEnabled && !quiet && prev && fh !== null && prev.fiveHour.utilization !== null) {
    const wasHigh = prev.fiveHour.utilization >= 50;
    const nowLow = fh < 20;
    const resetAtChanged = fhResetAt !== prev.fiveHour.resetsAt;
    if (wasHigh && nowLow && resetAtChanged) {
      const key = fhResetAt ?? 'none';
      if (updated.notifiedResetForResetAt !== key) {
        updated.notifiedResetForResetAt = key;
        send('reset', 'Claude reset detected', 'Your 5-hour usage window appears to have reset.');
      }
    }
  }

  return updated;
}

export function notifySyncFailed(settings: Settings): void {
  if (!settings.notifications.syncErrorEnabled) return;
  send('sync-failed', 'Claude sync failed', 'Open Claude and log in again.');
}
