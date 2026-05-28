import type { Settings } from '../core/usageModel';

type Props = {
  settings: Settings;
  onChange: (s: Settings) => void;
};

export function NotificationSettings({ settings, onChange }: Props) {
  const n = settings.notifications;

  function update(patch: Partial<Settings['notifications']>) {
    onChange({ ...settings, notifications: { ...n, ...patch } });
  }

  return (
    <div className="section">
      <h2 className="section__title">Notifications</h2>

      <div className="field">
        <label className="field__label">Session warning (%)</label>
        <input
          className="field__input"
          type="number"
          min={50}
          max={100}
          value={n.sessionWarningPct}
          onChange={(e) => update({ sessionWarningPct: Number(e.target.value) })}
        />
      </div>

      <div className="field">
        <label className="field__label">Session critical (%)</label>
        <input
          className="field__input"
          type="number"
          min={50}
          max={100}
          value={n.sessionCriticalPct}
          onChange={(e) => update({ sessionCriticalPct: Number(e.target.value) })}
        />
      </div>

      <div className="field">
        <label className="field__label">Session final (%)</label>
        <input
          className="field__input"
          type="number"
          min={50}
          max={100}
          value={n.sessionFinalPct}
          onChange={(e) => update({ sessionFinalPct: Number(e.target.value) })}
        />
      </div>

      <div className="field">
        <label className="field__label">Weekly warning (%)</label>
        <input
          className="field__input"
          type="number"
          min={50}
          max={100}
          value={n.weeklyWarningPct}
          onChange={(e) => update({ weeklyWarningPct: Number(e.target.value) })}
        />
      </div>

      <div className="field">
        <label className="field__label">Weekly critical (%)</label>
        <input
          className="field__input"
          type="number"
          min={50}
          max={100}
          value={n.weeklyCriticalPct}
          onChange={(e) => update({ weeklyCriticalPct: Number(e.target.value) })}
        />
      </div>

      <div className="toggle-row">
        <label className="toggle">
          <input
            type="checkbox"
            checked={n.resetEnabled}
            onChange={(e) => update({ resetEnabled: e.target.checked })}
          />
          <span className="toggle__slider" />
        </label>
        <span className="toggle-row__label">Reset notifications</span>
      </div>

      <div className="toggle-row">
        <label className="toggle">
          <input
            type="checkbox"
            checked={n.weeklyEnabled}
            onChange={(e) => update({ weeklyEnabled: e.target.checked })}
          />
          <span className="toggle__slider" />
        </label>
        <span className="toggle-row__label">Weekly warnings</span>
      </div>

      <div className="toggle-row">
        <label className="toggle">
          <input
            type="checkbox"
            checked={n.syncErrorEnabled}
            onChange={(e) => update({ syncErrorEnabled: e.target.checked })}
          />
          <span className="toggle__slider" />
        </label>
        <span className="toggle-row__label">Sync error notifications</span>
      </div>

      <div className="toggle-row">
        <label className="toggle">
          <input
            type="checkbox"
            checked={n.quietHoursEnabled}
            onChange={(e) => update({ quietHoursEnabled: e.target.checked })}
          />
          <span className="toggle__slider" />
        </label>
        <span className="toggle-row__label">Quiet hours ({n.quietHoursStart}:00 – {n.quietHoursEnd}:00)</span>
      </div>

      {n.quietHoursEnabled && (
        <div className="field-row">
          <div className="field">
            <label className="field__label">Quiet start (hour)</label>
            <input
              className="field__input"
              type="number"
              min={0}
              max={23}
              value={n.quietHoursStart}
              onChange={(e) => update({ quietHoursStart: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label className="field__label">Quiet end (hour)</label>
            <input
              className="field__input"
              type="number"
              min={0}
              max={23}
              value={n.quietHoursEnd}
              onChange={(e) => update({ quietHoursEnd: Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
