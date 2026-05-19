import type { ClaudeUsageState } from '../core/usageModel';
import { getSeverity, getBadgeColor, isWeeklyDanger } from '../core/thresholds';
import { msUntilReset } from '../core/countdown';
import { getSettings } from '../core/storage';

const GRAY = '#6b7280';

export async function setBadgeSetup(): Promise<void> {
  await chrome.action.setBadgeText({ text: 'SET' });
  await chrome.action.setBadgeBackgroundColor({ color: GRAY });
}

export async function setBadgeError(): Promise<void> {
  await chrome.action.setBadgeText({ text: 'ERR' });
  await chrome.action.setBadgeBackgroundColor({ color: GRAY });
}

export async function updateBadge(usage: ClaudeUsageState): Promise<void> {
  const settings = await getSettings();
  const fh = usage.fiveHour.utilization;
  const sd = usage.sevenDay.utilization;
  const severity = getSeverity(fh, sd);
  const color = getBadgeColor(severity);
  const mode = settings.badgeMode;

  let text: string;

  if (mode === 'percent-first') {
    // show % when not full; switch to time-until-reset when full (>=95) or weekly danger
    const isFull = isWeeklyDanger(sd) || (fh !== null && fh >= 95);
    if (isFull) {
      const ms = msUntilReset(usage.fiveHour.resetsAt);
      if (ms > 0) {
        const mins = Math.ceil(ms / 60_000);
        text = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
      } else {
        text = fh !== null ? `${Math.round(fh)}` : '—';
      }
    } else {
      if (isWeeklyDanger(sd)) {
        text = `${Math.round(sd!)}`;
      } else {
        text = fh !== null ? `${Math.round(fh)}` : '—';
      }
    }
  } else if (mode === 'usage-percent') {
    if (isWeeklyDanger(sd)) {
      text = `${Math.round(sd!)}`;
    } else {
      text = fh !== null ? `${Math.round(fh)}` : '—';
    }
  } else if (mode === 'reset-time') {
    const ms = msUntilReset(usage.fiveHour.resetsAt);
    if (ms > 0) {
      const mins = Math.ceil(ms / 60_000);
      text = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
    } else {
      text = fh !== null ? `${Math.round(fh)}` : '—';
    }
  } else {
    // smart (default): show usage when critical, time otherwise
    if (isWeeklyDanger(sd)) {
      text = `${Math.round(sd!)}`;
    } else if (fh !== null && fh >= 95) {
      text = `${Math.round(fh)}`;
    } else {
      const ms = msUntilReset(usage.fiveHour.resetsAt);
      if (ms > 0) {
        const mins = Math.ceil(ms / 60_000);
        text = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
      } else {
        text = fh !== null ? `${Math.round(fh)}` : '—';
      }
    }
  }

  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
}
