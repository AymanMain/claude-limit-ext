import React from 'react';
import type { ClaudeUsageState } from '../core/usageModel';
import { getFreshness, formatAgeLabel, sourceLabel } from '../core/freshness';

type Props = {
  usage: ClaudeUsageState;
};

export function StatusFooter({ usage }: Props) {
  const hasError = Boolean(usage.lastError);
  const freshness = getFreshness(usage.lastSyncedAt, hasError);
  const age = formatAgeLabel(usage.lastSyncedAt);
  const src = sourceLabel(usage.source);

  const freshnessLabel =
    freshness === 'error'
      ? 'Sync error'
      : freshness === 'expired'
        ? 'Expired'
        : freshness === 'stale'
          ? 'Stale'
          : 'Fresh';

  return (
    <div className={`status-footer status-footer--${freshness}`}>
      <span className="status-footer__freshness">{freshnessLabel}</span>
      <span className="status-footer__sep">·</span>
      <span className="status-footer__age">{age}</span>
      <span className="status-footer__sep">·</span>
      <span className="status-footer__source">{src}</span>
    </div>
  );
}
