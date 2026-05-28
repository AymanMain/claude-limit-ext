import { useState } from 'react';
import { clearOrgId, clearAllData, getUsageState, getSettings } from '../core/storage';
import { STORAGE_KEY_HISTORY } from '../shared/constants';

type Props = {
  onDataCleared: () => void;
};

export function PrivacySettings({ onDataCleared }: Props) {
  const [exported, setExported] = useState<string | null>(null);

  async function handleExportDebug() {
    const [usage, settings] = await Promise.all([getUsageState(), getSettings()]);
    const report = {
      extensionVersion: '0.1.0',
      source: usage?.source ?? null,
      hasOrgId: true,
      lastSync: usage?.lastSyncedAt ?? null,
      lastStatusCode: usage?.lastStatusCode ?? null,
      lastError: usage?.lastError ?? null,
      responseShape: usage
        ? {
            five_hour: usage.fiveHour !== undefined,
            seven_day: usage.sevenDay !== undefined,
            extra_usage: usage.extraUsage !== undefined,
          }
        : null,
      settings: {
        syncIntervalMinutes: settings.syncIntervalMinutes,
        badgeMode: settings.badgeMode,
        quietModeEnabled: settings.notifications.quietHoursEnabled,
      },
    };
    setExported(JSON.stringify(report, null, 2));
  }

  async function handleClearOrgId() {
    if (!confirm('Clear the stored organization ID?')) return;
    await clearOrgId();
    onDataCleared();
  }

  async function handleClearHistory() {
    await chrome.storage.local.remove(STORAGE_KEY_HISTORY);
    onDataCleared();
  }

  async function handleClearAll() {
    if (!confirm('Clear all extension data? This includes the organization ID, usage history, and settings.')) return;
    await clearAllData();
    onDataCleared();
  }

  return (
    <div className="section">
      <h2 className="section__title">Privacy</h2>

      <p className="section__body">
        This extension stores only your organization ID, usage percentages, reset times, and
        notification settings. No cookies, session tokens, prompts, responses, or conversations
        are stored. No data is sent to any third-party server.
      </p>

      <div className="btn-group">
        <button className="btn btn--ghost" onClick={handleExportDebug}>
          Export debug report
        </button>
        <button className="btn btn--ghost" onClick={handleClearHistory}>
          Clear usage history
        </button>
        <button className="btn btn--ghost" onClick={handleClearOrgId}>
          Clear organization ID
        </button>
        <button className="btn btn--danger" onClick={handleClearAll}>
          Clear all data
        </button>
      </div>

      {exported && (
        <div className="debug-export">
          <div className="debug-export__label">Debug report (safe to share)</div>
          <textarea className="debug-export__text" readOnly value={exported} rows={12} />
          <button
            className="btn btn--ghost"
            onClick={() => navigator.clipboard.writeText(exported)}
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
