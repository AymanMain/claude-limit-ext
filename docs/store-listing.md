# Store Listing

Reusable copy for Chrome, Edge, and Opera submissions. Adapt browser-specific wording where noted.

---

## Name

Claude Session Tracker

## Short description (≤132 chars)

Track Claude usage windows, reset countdowns, and local alerts from your browser toolbar.

## Category

Productivity

## Full description

Claude Session Tracker helps Claude power users avoid unexpected usage-limit interruptions.

It shows your current 5-hour and 7-day Claude usage, reset countdowns, warning states, and local notifications directly from the browser toolbar.

**Features**

- Toolbar badge with reset countdown or usage percentage
- 5-hour session usage tracking
- 7-day usage tracking
- Live reset countdown (updates every second when session is maxed)
- Local warning notifications before you hit the limit
- Configurable thresholds and refresh interval
- Debug panel for sync status and endpoint health
- Local-only storage

**Privacy**

Claude Session Tracker stores usage metadata locally in your browser. It does not collect prompts, responses, conversations, cookies, authentication tokens, or credentials. No data is sent to any third-party server.

**Disclaimer**

Claude Session Tracker is unofficial and is not affiliated with Anthropic or Claude. It uses Claude web data available to the signed-in user and may stop working if Claude changes its web app.

---

## Privacy practices (Chrome Web Store field)

**Does your extension handle user data?** Yes

**User data types:** Website content (Claude usage metadata from claude.ai)

**Storage:** Local only (chrome.storage.local)

**Data sharing:** Not shared with any third party

**Privacy policy URL:** https://aymanmain.github.io/claude-limit-ext/privacy

---

## Single-purpose description (Chrome)

Claude Session Tracker shows Claude usage limits, reset countdowns, and local alerts in the browser toolbar.

---

## Permission justifications (Chrome review)

- **storage** — saves usage state and settings locally
- **alarms** — schedules background refresh
- **notifications** — sends local usage alerts
- **tabs** — queries Claude tabs to forward detect command; opens claude.ai from popup
- **https://claude.ai/*** — content script for org ID detection; usage API fetch
