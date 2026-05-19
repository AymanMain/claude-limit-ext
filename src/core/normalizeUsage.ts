import type { ClaudeUsageState, UsageWindow } from './usageModel';
import { ProviderError } from '../shared/errors';

type RawWindow = { utilization?: number | null; resets_at?: string | null } | null | undefined;

type RawUsageResponse = {
  five_hour?: RawWindow;
  seven_day?: RawWindow;
  extra_usage?: {
    is_enabled?: boolean | null;
    monthly_limit?: number | null;
    used_credits?: number | null;
    utilization?: number | null;
    currency?: string | null;
  } | null;
};

function normalizeWindow(raw: RawWindow): UsageWindow {
  return {
    utilization: raw?.utilization ?? null,
    resetsAt: raw?.resets_at ?? null,
  };
}

export function normalizeUsageResponse(raw: unknown, statusCode: number): ClaudeUsageState {
  if (typeof raw !== 'object' || raw === null) {
    throw new ProviderError('INVALID_RESPONSE', 'Usage response is not an object');
  }

  const r = raw as RawUsageResponse;

  if (!('five_hour' in r) && !('seven_day' in r)) {
    throw new ProviderError('INVALID_RESPONSE', 'Usage response missing expected fields');
  }

  return {
    fiveHour: normalizeWindow(r.five_hour),
    sevenDay: normalizeWindow(r.seven_day),
    extraUsage: {
      enabled: r.extra_usage?.is_enabled ?? false,
      utilization: r.extra_usage?.utilization ?? null,
      monthlyLimit: r.extra_usage?.monthly_limit ?? null,
      usedCredits: r.extra_usage?.used_credits ?? null,
      currency: r.extra_usage?.currency ?? null,
    },
    source: 'web-api',
    lastSyncedAt: new Date().toISOString(),
    lastStatusCode: statusCode,
    lastError: null,
  };
}

export function getResponseShape(raw: unknown): Record<string, boolean> {
  if (typeof raw !== 'object' || raw === null) return {};
  const r = raw as Record<string, unknown>;
  return {
    five_hour: 'five_hour' in r,
    seven_day: 'seven_day' in r,
    extra_usage: 'extra_usage' in r,
  };
}
