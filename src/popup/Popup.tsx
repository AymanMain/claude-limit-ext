import React, { useState, useEffect, useCallback } from 'react';
import type { ClaudeUsageState, Settings, SnoozeState } from '../core/usageModel';
import { UsageCard } from './UsageCard';
import { StatusFooter } from './StatusFooter';
import { WeeklyDanger } from './WeeklyDanger';
import {
  getOrgId,
  getUsageState,
  getSettings,
  getSnoozeState,
  setSnoozeState,
} from '../core/storage';
import { isWeeklyDanger, isSessionCritical } from '../core/thresholds';
import { formatPct } from '../shared/format';
import { msUntilReset, formatCountdown } from '../core/countdown';

type PopupState = {
  orgId: string | null;
  usage: ClaudeUsageState | null;
  settings: Settings | null;
  snooze: SnoozeState;
};

// Live countdown that ticks every second
function useCountdown(resetsAt: string | null): number {
  const [ms, setMs] = useState(() => msUntilReset(resetsAt));
  useEffect(() => {
    setMs(msUntilReset(resetsAt));
    if (!resetsAt) return;
    const id = setInterval(() => setMs(msUntilReset(resetsAt)), 1000);
    return () => clearInterval(id);
  }, [resetsAt]);
  return ms;
}

// Circular arc progress indicator
function RingProgress({
  pct,
  color,
  children,
}: {
  pct: number;
  color: string;
  children?: React.ReactNode;
}) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(100, Math.max(0, pct));
  const dash = (fill / 100) * circ;

  return (
    <div className="ring-wrap">
      <svg className="ring-svg" width="136" height="136" viewBox="0 0 136 136">
        <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
        <circle
          cx="68"
          cy="68"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 68 68)"
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s ease' }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

export function Popup() {
  const [data, setData] = useState<PopupState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [orgId, usage, settings, snooze] = await Promise.all([
      getOrgId(),
      getUsageState(),
      getSettings(),
      getSnoozeState(),
    ]);
    setData({ orgId, usage, settings, snooze });
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await chrome.runtime.sendMessage({ type: 'REFRESH_NOW' });
    await loadData();
    setRefreshing(false);
  };

  const handleDetect = async () => {
    setRefreshing(true);
    await chrome.runtime.sendMessage({ type: 'DETECT_ORG_ID' });
    await new Promise((r) => setTimeout(r, 3000));
    await loadData();
    setRefreshing(false);
  };

  const handleMuteUntilReset = async () => {
    if (!data) return;
    const resetAt = data.usage?.fiveHour.resetsAt ?? null;
    const newSnooze = { ...data.snooze, mutedUntilResetAt: resetAt };
    await setSnoozeState(newSnooze);
    setData((d) => d && { ...d, snooze: newSnooze });
  };

  const handleMuteWeekly = async () => {
    if (!data) return;
    const resetAt = data.usage?.sevenDay.resetsAt ?? null;
    const newSnooze = { ...data.snooze, mutedUntilResetAt: resetAt };
    await setSnoozeState(newSnooze);
    setData((d) => d && { ...d, snooze: newSnooze });
  };

  if (!data) {
    return (
      <div className="popup">
        <PopupHeader />
        <div className="popup-body popup-body--loading">
          <span className="loading-dot" />
          Loading
        </div>
      </div>
    );
  }

  const { orgId, usage } = data;
  const fh = usage?.fiveHour.utilization ?? null;
  const sd = usage?.sevenDay.utilization ?? null;
  const hasError = Boolean(usage?.lastError);
  const hasData = fh !== null || sd !== null;

  let view: 'setup' | 'error' | 'weekly-danger' | 'critical' | 'normal' = 'normal';
  if (!orgId) view = 'setup';
  else if (hasError && !hasData) view = 'error';
  else if (isWeeklyDanger(sd)) view = 'weekly-danger';
  else if (isSessionCritical(fh)) view = 'critical';

  return (
    <div className={`popup popup--${view}`}>
      <PopupHeader />

      <div className="popup-body">
        {view === 'setup' && (
          <SetupView
            onDetect={handleDetect}
            onOpenClaude={() => chrome.tabs.create({ url: 'https://claude.ai' })}
            loading={refreshing}
          />
        )}

        {view === 'error' && (
          <ErrorView
            usage={usage}
            onRetry={handleRefresh}
            onOpenClaude={() => chrome.tabs.create({ url: 'https://claude.ai' })}
            loading={refreshing}
          />
        )}

        {view === 'weekly-danger' && usage && (
          <WeeklyDanger
            utilization={sd!}
            resetsAt={usage.sevenDay.resetsAt}
            onMute={handleMuteWeekly}
            onRefresh={handleRefresh}
            loading={refreshing}
            usage={usage}
          />
        )}

        {view === 'critical' && usage && (
          <CriticalView
            usage={usage}
            onMute={handleMuteUntilReset}
            onRefresh={handleRefresh}
            loading={refreshing}
          />
        )}

        {view === 'normal' && usage && (
          <NormalView
            usage={usage}
            onRefresh={handleRefresh}
            onOpenClaude={() => chrome.tabs.create({ url: 'https://claude.ai' })}
            loading={refreshing}
          />
        )}
      </div>
    </div>
  );
}

function PopupHeader() {
  return (
    <div className="popup-header">
      <div className="popup-header__left">
        <div className="popup-header__dot" />
        <span className="popup-header__title">Claude Limit Tracker</span>
      </div>
      <button
        className="btn-icon"
        onClick={() => chrome.runtime.openOptionsPage()}
        title="Settings"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>
  );
}

function SetupView({
  onDetect,
  onOpenClaude,
  loading,
}: {
  onDetect: () => void;
  onOpenClaude: () => void;
  loading: boolean;
}) {
  return (
    <div className="view view--centered">
      <div className="setup-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="view__title">Setup needed</div>
      <p className="view__body">
        Open Claude once to let the extension detect your organization ID, then click Detect.
      </p>
      <div className="btn-row">
        <button className="btn btn--primary" onClick={onOpenClaude}>
          Open Claude
        </button>
        <button className="btn btn--ghost" onClick={onDetect} disabled={loading}>
          {loading ? 'Detecting…' : 'Detect now'}
        </button>
      </div>
    </div>
  );
}

function ErrorView({
  usage,
  onRetry,
  onOpenClaude,
  loading,
}: {
  usage: ClaudeUsageState | null;
  onRetry: () => void;
  onOpenClaude: () => void;
  loading: boolean;
}) {
  const isAuth = usage?.lastStatusCode === 401 || usage?.lastStatusCode === 403;
  return (
    <div className="view view--error">
      <div className="error-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="view__title">Sync failed</div>
      <p className="view__body">
        {isAuth
          ? 'Claude login may have expired. Open Claude and log in again.'
          : 'Could not reach Claude. Check your connection.'}
      </p>
      {usage?.lastError && (
        <div className="view__error-detail">{usage.lastError}</div>
      )}
      <div className="btn-row">
        <button className="btn btn--primary" onClick={onOpenClaude}>
          Open Claude
        </button>
        <button className="btn btn--ghost" onClick={onRetry} disabled={loading}>
          {loading ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    </div>
  );
}

function CriticalView({
  usage,
  onMute,
  onRefresh,
  loading,
}: {
  usage: ClaudeUsageState;
  onMute: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  const fh = usage.fiveHour.utilization ?? 0;
  const sd = usage.sevenDay.utilization;
  const ms = useCountdown(usage.fiveHour.resetsAt);
  const isMaxed = fh >= 100;

  return (
    <div className="view view--critical">
      <div className="view__title view__title--center">
        {isMaxed ? 'Session limit reached' : 'Claude session is critical'}
      </div>

      <RingProgress pct={fh} color="#ef4444">
        <span className="ring-pct" style={{ color: '#ef4444' }}>{Math.round(fh)}%</span>
        <span className="ring-label">5-hour</span>
      </RingProgress>

      {ms > 0 ? (
        <div className="countdown-block">
          <div className="countdown__time">{formatCountdown(ms)}</div>
          <div className="countdown__label">until reset</div>
        </div>
      ) : usage.fiveHour.resetsAt ? (
        <div className="countdown-block">
          <div className="countdown__time countdown__time--reset">Resetting…</div>
        </div>
      ) : null}

      {sd !== null && (
        <div className="view__weekly-line">
          <span className={sd >= 95 ? 'text-red' : sd >= 80 ? 'text-orange' : 'text-muted'}>
            7-day: {formatPct(sd)}
          </span>
        </div>
      )}

      <StatusFooter usage={usage} />

      <div className="btn-row">
        <button className="btn btn--ghost" onClick={onMute}>
          Mute until reset
        </button>
        <button className="btn btn--primary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh now'}
        </button>
      </div>
    </div>
  );
}

function NormalView({
  usage,
  onRefresh,
  onOpenClaude,
  loading,
}: {
  usage: ClaudeUsageState;
  onRefresh: () => void;
  onOpenClaude: () => void;
  loading: boolean;
}) {
  return (
    <div className="view">
      <UsageCard label="5-hour session" window={usage.fiveHour} />
      <UsageCard label="7-day usage" window={usage.sevenDay} showResetDay />
      <StatusFooter usage={usage} />
      <div className="btn-row">
        <button className="btn btn--ghost" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh now'}
        </button>
        <button className="btn btn--primary" onClick={onOpenClaude}>
          Open Claude
        </button>
      </div>
    </div>
  );
}
