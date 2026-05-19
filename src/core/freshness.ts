import { FRESHNESS_FRESH_MS, FRESHNESS_STALE_MS } from '../shared/constants';

export type FreshnessStatus = 'fresh' | 'stale' | 'expired' | 'error';

export function getFreshness(lastSyncedAt: string | null, hasError: boolean): FreshnessStatus {
  if (hasError) return 'error';
  if (!lastSyncedAt) return 'expired';
  const age = Date.now() - new Date(lastSyncedAt).getTime();
  if (age < FRESHNESS_FRESH_MS) return 'fresh';
  if (age < FRESHNESS_STALE_MS) return 'stale';
  return 'expired';
}

export function formatAgeLabel(lastSyncedAt: string | null): string {
  if (!lastSyncedAt) return 'never';
  const ms = Date.now() - new Date(lastSyncedAt).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1m ago';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

export function sourceLabel(source: string): string {
  switch (source) {
    case 'web-api': return 'Claude Web API';
    case 'page-capture': return 'Page capture';
    case 'claude-code': return 'Claude Code statusline';
    case 'manual': return 'Manual';
    default: return source;
  }
}
