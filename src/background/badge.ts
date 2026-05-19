import type { ClaudeUsageState } from '../core/usageModel';
import { getSeverity, getBadgeColor, isWeeklyDanger } from '../core/thresholds';
import { msUntilReset } from '../core/countdown';

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
  const fh = usage.fiveHour.utilization;
  const sd = usage.sevenDay.utilization;
  const severity = getSeverity(fh, sd);
  const color = getBadgeColor(severity);

  let text: string;

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

  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
}
