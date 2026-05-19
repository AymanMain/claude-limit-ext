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
        <div className="popup-body popup-body--loading">Loading…</div>
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
          <SetupView onDetect={handleDetect} onOpenClaude={() => chrome.tabs.create({ url: 'https://claude.ai' })} loading={refreshing} />
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
      <span className="popup-header__title">Claude Limit Tracker</span>
      <button
        className="btn-icon"
        onClick={() => chrome.runtime.openOptionsPage()}
        title="Settings"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
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
    <div className="view">
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
  const fh = usage.fiveHour.utilization;
  const sd = usage.sevenDay.utilization;
  const ms = msUntilReset(usage.fiveHour.resetsAt);

  return (
    <div className="view view--critical">
      <div className="view__title">Claude session is critical</div>
      <div className="view__big-pct">{formatPct(fh)}</div>
      {ms > 0 && <div className="view__sub">Reset in {formatCountdown(ms)}</div>}
      {sd !== null && sd < 95 && (
        <div className="view__weekly-safe">Weekly usage is safe at {formatPct(sd)}.</div>
      )}
      {usage.lastSyncedAt && (
        <div className="view__sync-time">Last sync: <StatusFooter usage={usage} /></div>
      )}
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
