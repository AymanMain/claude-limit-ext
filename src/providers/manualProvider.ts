import type { ClaudeUsageState } from '../core/usageModel';

export function createManualState(
  fiveHourPct: number,
  sevenDayPct: number,
): ClaudeUsageState {
  return {
    fiveHour: { utilization: fiveHourPct, resetsAt: null },
    sevenDay: { utilization: sevenDayPct, resetsAt: null },
    extraUsage: {
      enabled: false,
      utilization: null,
      monthlyLimit: null,
      usedCredits: null,
      currency: null,
    },
    source: 'manual',
    lastSyncedAt: new Date().toISOString(),
    lastError: null,
  };
}
