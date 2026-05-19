# Claude Limit Tracker

![image](./Tik-Tokens.png)
A local-first browser extension that shows Claude usage limits in the toolbar.

Claude Limit Tracker displays your 5-hour and 7-day Claude usage, reset countdowns, warning states, and local notifications so you know when to slow down, wait for reset, or resume work.

It is designed for Claude Web and Claude Code users who want a small statusline-style usage indicator without repeatedly opening the Claude settings page.

> Unofficial project. Not affiliated with Anthropic or Claude.

## Features

- Toolbar badge with reset time, usage percent, or smart switching.
- 5-hour session usage tracking.
- 7-day usage tracking.
- Live reset countdowns that tick every second.
- Circular arc progress ring for critical and waiting states.
- "Waiting for reset" view with prominent countdown when session is maxed.
- Manual refresh button.
- Background refresh after setup.
- Warning notifications for high usage.
- Reset detected notification.
- Weekly danger mode.
- Quiet mode for notification control.
- Mute warnings until next reset.
- Settings for sync interval, thresholds, badge mode, and appearance.
- Debug panel for sync status and endpoint health.
- Local-only storage.

## How it works

On first setup, open Claude once and let the extension detect your Claude organization ID. After that, the extension can refresh usage in the background using your existing browser login session.

The extension stores normalized usage data locally and updates the toolbar badge, popup, and notifications from that data.

It does not ask for API keys, cookies, session tokens, or account credentials.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/AymanMain/claude-limit-ext.git
cd claude-limit-ext
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the extension

```bash
npm run build
```

The build output will be created in:

```text
dist/
```

### 4. Load it in Chrome or Chromium

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `dist/` folder.
5. Pin the extension to your toolbar.

## First setup

1. Log in to Claude in the same browser profile.
2. Open `https://claude.ai`.
3. Click the Claude Limit Tracker extension icon.
4. Click **Detect organization** or **Refresh now**.
5. Once setup succeeds, the badge will start showing your usage state.

After setup, the Claude tab does not need to stay open. The extension can keep refreshing while the browser is running, as long as your Claude browser session is still valid.

## Usage

The toolbar badge gives a quick status:

| Badge | Meaning                      |
| ----- | ---------------------------- |
| `4h`  | Reset in about 4 hours       |
| `1h`  | Reset in about 1 hour        |
| `42m` | Reset in 42 minutes          |
| `95`  | Critical usage level         |
| `SET` | Setup needed                 |
| `ERR` | Sync failed or login expired |

Badge colors:

| Color  | Meaning                              |
| ------ | ------------------------------------ |
| Green  | Safe                                 |
| Orange | Warning                              |
| Red    | Critical                             |
| Gray   | Unknown, setup needed, or logged out |

The badge mode can be changed in settings:

- **Smart** — shows usage when critical, reset time otherwise.
- **Reset time** — always shows time until next session reset.
- **Usage percent** — always shows current usage percentage.

Open the popup to see:

- 5-hour usage percentage and arc progress ring.
- 5-hour reset countdown (live, ticking every second when in waiting state).
- 7-day usage percentage.
- 7-day reset countdown.
- Last sync time and freshness indicator.
- Current data source.
- Warning or error states.

## Notifications

Default notifications include:

- Session usage warning.
- Session critical warning.
- Weekly critical warning.
- Reset detected.
- Sync failed or login expired.

Thresholds can be changed in settings.

Default threshold behavior:

| Event                   | Default |
| ----------------------- | ------: |
| Session warning         |     85% |
| Session final warning   |     95% |
| Weekly critical warning |     95% |

You can also enable quiet mode, disable reset notifications, disable weekly warnings, or mute warnings until the next reset.

## Settings

The settings page includes:

### Sync

- Auto-refresh interval: 2, 5, 10, or 15 minutes.
- Refresh now.
- Re-detect organization ID.
- Open Claude usage page.

### Notifications

- Session warning threshold.
- Session critical threshold.
- Session final threshold.
- Weekly warning threshold.
- Weekly critical threshold.
- Reset notifications.
- Weekly warnings.
- Sync error notifications.
- Quiet hours.

### Privacy

- View stored local data.
- Clear organization ID.
- Clear usage history.
- Clear all local data.
- Export safe debug report.

### Appearance

- Badge mode: smart, reset time, or usage percent.
- Theme: system, light, or dark.
- Compact popup.

## Privacy

Claude Limit Tracker is local-first.

It stores only:

- Organization ID.
- Usage percentages.
- Reset times.
- Notification settings.
- Local usage history if enabled.

It never stores:

- Claude cookies.
- Session tokens.
- Auth headers.
- Prompts.
- Responses.
- Conversations.

No data is sent to any third-party server.

## Troubleshooting

### The badge shows `SET`

Setup has not completed yet.

Open `https://claude.ai`, click the extension icon, then click **Detect organization** or **Refresh now**.

### The badge shows `ERR`

The extension could not refresh usage.

Common causes:

- Claude login expired.
- Browser profile is not logged into Claude.
- Network request failed.
- Claude changed its web app or usage endpoint.

Open Claude, log in again, then click **Refresh now**.

### Usage does not update

Check:

- The browser is running.
- Auto-refresh is enabled.
- The sync interval is set.
- The debug panel shows a recent successful sync.
- Claude login is still valid.

### Notifications are too noisy

Use settings to:

- Enable quiet hours.
- Raise warning thresholds.
- Disable reset notifications.
- Disable weekly warnings.
- Mute warnings until next reset.

## Development

Install dependencies:

```bash
npm install
```

Start development build:

```bash
npm run dev
```

Build extension:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

## Project status

The project is built around Claude web usage data available to the signed-in user. The endpoint is unofficial and may change. The extension includes debug and fallback flows to make breakage easier to diagnose.

## Changelog

### v0.1.1

- **Badge modes now work.** All three badge display modes (smart, reset-time, usage-percent) apply correctly. Previously `badgeMode` setting was ignored and smart mode always ran.
- **Notification icon fixed.** Chrome MV3 service workers require `chrome.runtime.getURL()` for notification icon paths. Previously the icon URL was malformed and notification icons did not render.
- **Sync-failed notification deduplication.** Repeated auth failures no longer spam notifications. Re-alerts after 30 minutes.
- **Waiting-for-reset view.** When the 5-hour session hits 95%+ with an upcoming reset, the popup switches to a focused countdown view instead of a static critical view.
- **Circular arc progress ring.** Critical, waiting, and weekly danger views now use a circular SVG progress indicator centered in the popup.
- **Live ticking countdown.** The reset countdown in critical and waiting views updates every second.
- **Pulsing badge dot.** The header indicator pulses red when session is critical or waiting.
- **Taller progress bars and colored card borders** in normal view usage cards.

### v0.1.0

Initial release.

- Background refresh with `chrome.alarms`.
- 5-hour and 7-day usage tracking.
- Toolbar badge with smart mode.
- Popup with usage cards, footer, and action buttons.
- Notification engine with deduplication.
- Quiet mode and snooze-until-reset.
- Weekly danger mode.
- Settings, debug, and privacy panels.
- Local-only storage.

## Contact

Questions, bug reports, or collaboration:

- GitHub: [AymanMain](https://github.com/AymanMain)
- Email: [aymanelkarroussi@gmail.com](mailto:aymanelkarroussi@gmail.com)

## Disclaimer

Claude Limit Tracker is unofficial and is not affiliated with Anthropic or Claude. It uses Claude web data available to the signed-in user and may break if Claude changes its web app or endpoints.
