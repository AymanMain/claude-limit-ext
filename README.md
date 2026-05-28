# Claude Session Tracker

![Claude Session Tracker](./docs/banner.png)
![CI](https://github.com/AymanMain/claude-limit-ext/actions/workflows/ci.yml/badge.svg)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-passing-blue)
![Privacy](https://img.shields.io/badge/Privacy-Local--First-green)
![License](https://img.shields.io/github/license/AymanMain/claude-limit-ext)

Local-first Chromium extension that shows Claude usage windows, reset countdowns, and local warning alerts from the browser toolbar.

> Unofficial project. Not affiliated with Anthropic or Claude.

---

## Why I built this

Claude usage limits are easy to hit during deep work because reset windows are not visible enough. The only way to check is to open Claude settings. This extension makes usage state visible in the toolbar without sending user data to any external server.

---

## Demo

<!-- Add demo GIF here: assets/demo/demo.gif -->
<!-- Suggested flow: open Claude → open extension → see usage → settings → notification -->

---

## Screenshots

<!-- Add screenshots here: assets/screenshots/ -->
<!-- 01-popup-safe.png, 02-popup-warning.png, 03-settings.png, 04-debug-panel.png -->

---

## Features

- Toolbar badge with reset countdown or usage percentage
- 5-hour session usage tracking
- 7-day usage tracking
- Live reset countdown (updates every second when session is maxed)
- Circular arc progress ring for critical states
- Local warning notifications before hitting the limit
- Reset detected notification
- Weekly danger mode
- Quiet mode and mute-until-reset
- Configurable thresholds and refresh interval
- Settings, debug, and privacy panels
- Local-only storage

---

## Browser support

Works on any Chromium-based browser that supports Manifest V3.

| Browser | Notes |
|---|---|
| Chrome | Primary target |
| Edge | Same build |
| Brave | Same build |
| Opera | Same build |

---

## Installation

### 1. Clone

```bash
git clone https://github.com/AymanMain/claude-limit-ext.git
cd claude-limit-ext
```

### 2. Install

```bash
npm install
```

### 3. Build

```bash
npm run build
```

Output: `dist/`

### 4. Load the extension

#### Chrome / Brave

1. Open `chrome://extensions` (or `brave://extensions`).
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `dist/` folder.
5. Pin the extension to your toolbar.

#### Edge

1. Open `edge://extensions`.
2. Enable **Developer mode** (bottom left).
3. Click **Load unpacked**.
4. Select the `dist/` folder.

#### Opera

1. Open `opera://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** or drag-drop the `dist/` folder.

---

## First setup

1. Log in to Claude in the same browser profile.
2. Open `https://claude.ai`.
3. Click the Claude Session Tracker extension icon.
4. Click **Detect organization** or **Refresh now**.

After setup, the Claude tab does not need to stay open.

---

## Usage

The toolbar badge gives a quick status:

| Badge | Meaning |
|---|---|
| `4h` | Reset in about 4 hours |
| `42m` | Reset in 42 minutes |
| `95` | Critical usage |
| `SET` | Setup needed |
| `ERR` | Sync failed or login expired |

Badge colors: green = safe · orange = warning · red = critical · gray = unknown

Badge modes (configurable in settings):
- **Smart** — usage when critical, reset time otherwise
- **Reset time** — always shows time to reset
- **Usage percent** — always shows usage percentage

---

## Notifications

| Event | Default threshold |
|---|---|
| Session warning | 85% |
| Session final warning | 95% |
| Weekly critical | 95% |
| Reset detected | on |
| Sync failed | on |

Thresholds are configurable. Notifications are deduplicated per reset window.

---

## Privacy

Claude Session Tracker is local-first.

**Stores only:**
- Organization ID
- Usage percentages and reset times
- Extension settings
- Notification state

**Never stores:**
- Claude session cookies or tokens
- Prompts or conversation content
- Model responses
- Any auth credentials

No data is sent to any third-party server.

Full privacy policy: [docs/privacy.html](./docs/privacy.html)

---

## Troubleshooting

**Badge shows `SET`**

Setup not complete. Open `https://claude.ai`, click the extension icon, then click **Detect organization**.

**Badge shows `ERR`**

Sync failed. Open Claude, log in again, then click **Refresh now**.

**Usage does not update**

Check:
- Browser is running
- Auto-refresh is enabled in settings
- Claude login is still valid
- Debug panel shows a recent successful sync

**Notifications are too frequent**

In settings: enable quiet hours, raise thresholds, disable reset notifications, or click **Mute until reset**.

---

## Development

```bash
npm run dev          # watch build
npm run build        # production build
npm test             # run tests
npm run lint         # lint
npm run typecheck    # TypeScript check
npm run check        # all quality gates
```

### Release packaging

```bash
npm run package:chrome   # runs check + builds release/chrome/*.zip
npm run package:edge     # runs check + builds release/edge/*.zip
npm run package:opera    # runs check + builds release/opera/*.zip
npm run package:all      # all three
npm run release:validate # pre-release checklist
```

---

## Architecture

| Component | Role |
|---|---|
| Background service worker | Periodic refresh, alarms, badge, notifications |
| Content script | Org ID detection on claude.ai |
| Popup | Usage state, reset countdown, actions |
| Settings page | Sync interval, thresholds, privacy controls |
| Core utilities | Normalization, storage, countdown formatting |

Data flow: Claude page → content script → background worker → local storage → popup + badge + notifications.

Full architecture notes: [docs/architecture.md](./docs/architecture.md)

---

## What this project demonstrates

- **Product thinking** — identified a real workflow pain point, designed a focused solution
- **Privacy engineering** — local-first model, minimal permissions, no third-party calls
- **Browser platform** — Manifest V3, service workers, content scripts, alarms, notifications
- **Quality** — TypeScript, ESLint, Vitest, CI, release packaging scripts
- **Deployment readiness** — store listings, reviewer notes, permission justifications, versioned ZIP artifacts

---

## Docs

- [Architecture](./docs/architecture.md)
- [Product decisions](./docs/product-decisions.md)
- [Permissions justification](./docs/permissions.md)
- [Store listing copy](./docs/store-listing.md)
- [Reviewer notes](./docs/reviewer-notes.md)
- [Privacy policy](./docs/privacy.html)
- [Security](./SECURITY.md)
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md)

---

## Roadmap

- [ ] Screenshots and demo GIF
- [ ] GitHub Pages for hosted privacy policy
- [ ] Chrome Web Store submission
- [ ] Edge Add-ons submission
- [ ] v0.2: usage history chart, burn-rate estimate, better onboarding

---

## Disclaimer

Claude Session Tracker is unofficial and is not affiliated with Anthropic or Claude. It uses Claude web data available to the signed-in user and may break if Claude changes its web app or endpoints.
