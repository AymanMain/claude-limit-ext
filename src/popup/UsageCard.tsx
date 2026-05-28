import type { UsageWindow } from '../core/usageModel';
import { msUntilReset, formatCountdown, formatResetDay } from '../core/countdown';
import { formatPct } from '../shared/format';

type Props = {
  label: string;
  window: UsageWindow;
  showResetDay?: boolean;
};

export function UsageCard({ label, window: w, showResetDay = false }: Props) {
  const pct = w.utilization ?? 0;
  const ms = msUntilReset(w.resetsAt);
  const severity = pct >= 95 ? 'critical' : pct >= 75 ? 'warning' : 'safe';

  const resetLabel = showResetDay
    ? `Resets ${formatResetDay(w.resetsAt)}`
    : ms > 0
      ? `Reset in ${formatCountdown(ms)}`
      : w.resetsAt
        ? `Resets ${formatResetDay(w.resetsAt)}`
        : '—';

  return (
    <div className={`usage-card usage-card--${severity}`}>
      <div className="usage-card__header">
        <span className="usage-card__label">{label}</span>
        <span className="usage-card__pct">{formatPct(w.utilization)}</span>
      </div>
      <div className="usage-bar">
        <div
          className="usage-bar__fill"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="usage-card__reset">{resetLabel}</div>
    </div>
  );
}
