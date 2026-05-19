import React, { useState, useEffect } from 'react';
import type { Settings, SyncInterval } from '../core/usageModel';
import { getSettings, setSettings } from '../core/storage';
import { SYNC_INTERVALS } from '../shared/constants';
import { NotificationSettings } from './NotificationSettings';
import { PrivacySettings } from './PrivacySettings';
import { DebugPanel } from './DebugPanel';

type Tab = 'sync' | 'notifications' | 'privacy' | 'appearance' | 'debug';

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('sync');
  const [settings, setLocal] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setLocal);
  }, []);

  async function handleSave() {
    if (!settings) return;
    await setSettings(settings);
    await chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) {
    return <div className="page-loading">Loading…</div>;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'sync', label: 'Sync' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'debug', label: 'Debug' },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">Claude Limit Tracker</div>
        <div className="page-header__sub">Settings</div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="page-body">
        {tab === 'sync' && (
          <div className="section">
            <h2 className="section__title">Sync</h2>

            <div className="field">
              <label className="field__label">Auto-refresh interval</label>
              <select
                className="field__select"
                value={settings.syncIntervalMinutes}
                onChange={(e) =>
                  setLocal({ ...settings, syncIntervalMinutes: Number(e.target.value) as SyncInterval })
                }
              >
                {SYNC_INTERVALS.map((i) => (
                  <option key={i} value={i}>
                    {i} minutes
                  </option>
                ))}
              </select>
            </div>

            <div className="btn-group">
              <button
                className="btn btn--ghost"
                onClick={() => chrome.runtime.sendMessage({ type: 'REFRESH_NOW' })}
              >
                Refresh now
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => chrome.runtime.sendMessage({ type: 'DETECT_ORG_ID' })}
              >
                Re-detect org ID
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => chrome.tabs.create({ url: 'https://claude.ai/settings' })}
              >
                Open Claude usage page
              </button>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <NotificationSettings settings={settings} onChange={setLocal} />
        )}

        {tab === 'privacy' && (
          <PrivacySettings onDataCleared={() => getSettings().then(setLocal)} />
        )}

        {tab === 'appearance' && (
          <div className="section">
            <h2 className="section__title">Appearance</h2>

            <div className="field">
              <label className="field__label">Badge mode</label>
              <select
                className="field__select"
                value={settings.badgeMode}
                onChange={(e) =>
                  setLocal({ ...settings, badgeMode: e.target.value as Settings['badgeMode'] })
                }
              >
                <option value="percent-first">% until full, then time to reset</option>
                <option value="smart">Smart (time until critical, % when critical)</option>
                <option value="reset-time">Always reset time</option>
                <option value="usage-percent">Always usage %</option>
              </select>
            </div>

            <div className="field">
              <label className="field__label">Theme</label>
              <select
                className="field__select"
                value={settings.theme}
                onChange={(e) =>
                  setLocal({ ...settings, theme: e.target.value as Settings['theme'] })
                }
              >
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div className="toggle-row">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.compactPopup}
                  onChange={(e) => setLocal({ ...settings, compactPopup: e.target.checked })}
                />
                <span className="toggle__slider" />
              </label>
              <span className="toggle-row__label">Compact popup</span>
            </div>
          </div>
        )}

        {tab === 'debug' && <DebugPanel />}
      </main>

      {tab !== 'privacy' && tab !== 'debug' && (
        <footer className="page-footer">
          <button className="btn btn--save" onClick={handleSave}>
            {saved ? 'Saved!' : 'Save settings'}
          </button>
        </footer>
      )}
    </div>
  );
}
