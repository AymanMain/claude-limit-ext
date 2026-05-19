import React, { useState, useEffect } from 'react';
import { getOrgId, getUsageState, getSettings } from '../core/storage';
import { formatAgeLabel } from '../core/freshness';
import type { ClaudeUsageState } from '../core/usageModel';

export function DebugPanel() {
  const [hasOrgId, setHasOrgId] = useState(false);
  const [usage, setUsage] = useState<ClaudeUsageState | null>(null);
  const [syncInterval, setSyncInterval] = useState(2);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [orgId, u, settings] = await Promise.all([getOrgId(), getUsageState(), getSettings()]);
    setHasOrgId(Boolean(orgId));
    setUsage(u);
    setSyncInterval(settings.syncIntervalMinutes);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await chrome.runtime.sendMessage({ type: 'REFRESH_NOW' });
    await load();
    setRefreshing(false);
  }

  async function handleRedetect() {
    await chrome.runtime.sendMessage({ type: 'DETECT_ORG_ID' });
    await new Promise((r) => setTimeout(r, 3000));
    await load();
  }

  async function handleCopyDebug() {
    const settings = await getSettings();
    const report = {
      extensionVersion: '0.1.0',
      source: usage?.source ?? null,
      hasOrgId,
      lastSync: usage?.lastSyncedAt ?? null,
      lastStatusCode: usage?.lastStatusCode ?? null,
      lastError: usage?.lastError ?? null,
      responseShape: usage
        ? {
            five_hour: true,
            seven_day: true,
            extra_usage: true,
          }
        : null,
      settings: {
        syncIntervalMinutes: settings.syncIntervalMinutes,
        badgeMode: settings.badgeMode,
        quietModeEnabled: settings.notifications.quietHoursEnabled,
      },
    };
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="section">
      <h2 className="section__title">Debug</h2>

      <div className="debug-table">
        <div className="debug-row">
          <span className="debug-key">Org ID</span>
          <span className="debug-val">{hasOrgId ? 'detected' : 'missing'}</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Last sync</span>
          <span className="debug-val">{usage ? formatAgeLabel(usage.lastSyncedAt) : '—'}</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Last status</span>
          <span className="debug-val">{usage?.lastStatusCode ? `${usage.lastStatusCode}` : '—'}</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Last error</span>
          <span className="debug-val">{usage?.lastError ?? 'none'}</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Source</span>
          <span className="debug-val">{usage?.source ?? '—'}</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Refresh interval</span>
          <span className="debug-val">{syncInterval} min</span>
        </div>
        <div className="debug-row">
          <span className="debug-key">Version</span>
          <span className="debug-val">0.1.0</span>
        </div>
      </div>

      {usage && (
        <div className="debug-shape">
          <div className="debug-shape__label">Response shape</div>
          <div className="debug-shape__row">✓ five_hour</div>
          <div className="debug-shape__row">✓ seven_day</div>
          <div className="debug-shape__row">✓ extra_usage</div>
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn--ghost" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh now'}
        </button>
        <button className="btn btn--ghost" onClick={handleRedetect}>
          Re-detect org ID
        </button>
        <button className="btn btn--ghost" onClick={handleCopyDebug}>
          {copied ? 'Copied!' : 'Copy debug info'}
        </button>
      </div>
    </div>
  );
}
