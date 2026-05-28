import { formatPct } from '../shared/format';
import { formatResetDay } from '../core/countdown';
import { StatusFooter } from './StatusFooter';
import type { ClaudeUsageState } from '../core/usageModel';

type Props = {
  utilization: number;
  resetsAt: string | null;
  onMute: () => void;
  onRefresh: () => void;
  loading: boolean;
  usage?: ClaudeUsageState;
};

export function WeeklyDanger({ utilization, resetsAt, onMute, onRefresh, loading, usage }: Props) {
  const pct = Math.min(100, utilization);
  const circ = 2 * Math.PI * 52;
  const dash = (pct / 100) * circ;

  return (
    <div className="view view--danger view--centered">
      <div className="view__title">Weekly limit nearly exhausted</div>

      <div className="ring-wrap">
        <svg className="ring-svg" width="136" height="136" viewBox="0 0 136 136">
          <circle cx="68" cy="68" r={52} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
          <circle
            cx="68" cy="68" r={52} fill="none"
            stroke="#ef4444" strokeWidth="11"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 68 68)"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="ring-center">
          <span className="ring-pct" style={{ color: '#ef4444' }}>{formatPct(utilization)}</span>
          <span className="ring-label">7-day</span>
        </div>
      </div>

      <div className="weekly-danger-banner">
        <div className="weekly-danger-banner__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="weekly-danger-banner__text">
          Weekly reset: {formatResetDay(resetsAt)}.{' '}
          Use shorter prompts or wait until the weekly window resets.
        </div>
      </div>

      {usage && <StatusFooter usage={usage} />}

      <div className="btn-row">
        <button className="btn btn--ghost" onClick={onMute}>
          Mute warnings
        </button>
        <button className="btn btn--primary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh now'}
        </button>
      </div>
    </div>
  );
}
