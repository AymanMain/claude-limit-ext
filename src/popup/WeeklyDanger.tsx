import React from 'react';
import { formatPct } from '../shared/format';
import { formatResetDay } from '../core/countdown';

type Props = {
  utilization: number;
  resetsAt: string | null;
  onMute: () => void;
  onRefresh: () => void;
  loading: boolean;
};

export function WeeklyDanger({ utilization, resetsAt, onMute, onRefresh, loading }: Props) {
  return (
    <div className="view view--danger">
      <div className="view__title">Weekly limit nearly exhausted</div>
      <div className="view__big-pct">{formatPct(utilization)}</div>
      <div className="view__sub">Weekly reset: {formatResetDay(resetsAt)}</div>
      <p className="view__advice">Use shorter prompts or wait until weekly reset.</p>
      <div className="btn-row">
        <button className="btn btn--ghost" onClick={onMute}>
          Mute weekly warnings
        </button>
        <button className="btn btn--primary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh now'}
        </button>
      </div>
    </div>
  );
}
