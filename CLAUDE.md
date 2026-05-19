# Claude Limit Tracker — Claude Code Implementation Guide

This file is the working instruction set for Claude Code while building the repository. Follow it as the source of truth for planning, implementation, commits, and documentation style.

## 1. Product Summary

Claude Limit Tracker is an unofficial, local-first browser extension that acts like a statusline for Claude usage limits. It shows the user's 5-hour and 7-day Claude usage windows, reset countdowns, warning states, and local notifications.

The extension is designed for developers and heavy Claude Code / Claude Web users who want a persistent usage indicator without repeatedly opening Claude settings.

The project must be privacy-first, transparent, and self-hostable from GitHub.

## 2. Core Principles

Build the repository like a serious open-source utility.

- Keep the app local-first.
- Do not store cookies, session tokens, auth headers, prompts, responses, or conversations.
- Store only organization ID, normalized usage data, settings, notification state, and limited usage history.
- Treat Claude web endpoints as unofficial and unstable.
- Keep the implementation provider-based so data sources can be replaced later.
- Make the UI calm, compact, and useful.
- Avoid noisy notifications.
- Avoid AI-generated-sounding copy in README and UI text.
- Do not reference the original author, a school assignment, ChatGPT, or AI planning.
- Do not over-explain implementation details in the README.
- Keep the README user-facing: what it does, how to install, how to use, features, privacy, troubleshooting.

## 3. Repository Standards

Use a clean, professional structure.

Recommended stack:

- TypeScript
- React for popup/settings UI
- Vite for extension build
- Manifest V3
- Chrome / Chromium first
- ESLint + Prettier
- Vitest for core utility tests

Recommended structure:

```text
src/
  background/
    alarms.ts
    badge.ts
    notifications.ts
    refreshUsage.ts

  content/
    detectOrgId.ts
    index.ts

  core/
    burnRate.ts
    countdown.ts
    freshness.ts
    normalizeUsage.ts
    storage.ts
    thresholds.ts
    usageModel.ts

  providers/
    claudeWebApiProvider.ts
    manualProvider.ts
    pageCaptureProvider.ts

  popup/
    Popup.tsx
    UsageCard.tsx
    StatusFooter.tsx
    WeeklyDanger.tsx

  settings/
    SettingsPage.tsx
    DebugPanel.tsx
    NotificationSettings.tsx
    PrivacySettings.tsx

  shared/
    constants.ts
    errors.ts
    format.ts

public/
  icons/

README.md
CLAUDE.md
LICENSE
package.json
vite.config.ts
tsconfig.json
```

## 4. Product Scope

### v0.1 MVP

Implement:

- Browser extension manifest.
- Setup flow that detects and stores Claude organization ID.
- Background refresh using `chrome.alarms`.
- Usage fetch from `https://claude.ai/api/organizations/{orgId}/usage`.
- Normalization of Claude usage response.
- Toolbar badge.
- Popup with 5-hour and 7-day usage cards.
- Manual refresh button.
- Open Claude button.
- Warning notifications.
- Reset detected notification.
- Sync failed / login expired state.
- Quiet mode.
- Mute until next reset.
- Weekly danger mode.
- Settings page.
- Basic debug panel.
- Privacy panel.
- Local storage only.

Do not implement in v0.1 unless the core is stable:

- Mini history chart.
- Burn-rate estimate.
- Session timeline.
- Claude Code statusline provider.
- Firefox support.
- Store publishing workflow.

### v0.2

Implement:

- Mini history chart.
- Burn-rate estimate.
- Session timeline.
- Better debug export.
- More resilient org ID detection.
- Optional passive page-capture provider.

### v0.3

Implement:

- Claude Code statusline data provider.
- Import/export settings.
- Better onboarding.
- Expanded tests.

### v1.0

Implement:

- Stable provider system.
- Polished UI.
- Signed release ZIPs.
- Full troubleshooting docs.
- Optional Firefox support.

## 5. Data Model

Use a normalized model internally. Do not leak raw endpoint field names across the app.

```ts
export type UsageWindow = {
  utilization: number | null;
  resetsAt: string | null;
};

export type ClaudeUsageState = {
  fiveHour: UsageWindow;
  sevenDay: UsageWindow;
  extraUsage: {
    enabled: boolean;
    utilization: number | null;
    monthlyLimit: number | null;
    usedCredits: number | null;
    currency: string | null;
  };
  source: 'web-api' | 'page-capture' | 'claude-code' | 'manual';
  lastSyncedAt: string;
  lastStatusCode?: number;
  lastError?: string | null;
};
```

Expected Claude web usage response:

```json
{
  "five_hour": {
    "utilization": 100,
    "resets_at": "2026-05-19T10:50:00.708437+00:00"
  },
  "seven_day": {
    "utilization": 40,
    "resets_at": "2026-05-21T03:00:00.708462+00:00"
  },
  "extra_usage": {
    "is_enabled": false,
    "monthly_limit": null,
    "used_credits": null,
    "utilization": null,
    "currency": null
  }
}
```

Normalizer requirements:

- Missing fields must not crash the app.
- Unknown fields should be ignored.
- Invalid response shape should produce a clear debug error.
- Store normalized data, not full raw response by default.

## 6. Sync Behavior

Default sync interval: 2 minutes.

Supported intervals in settings:

- 2 minutes
- 5 minutes
- 10 minutes
- 15 minutes

Use `chrome.alarms`, not `setInterval`, for background refresh.

Refresh cycle:

```text
1. Load orgId from storage.
2. If missing, set badge to SET.
3. Fetch usage endpoint with credentials included.
4. Normalize response.
5. Save usage state.
6. Append limited history point if history is enabled.
7. Update toolbar badge.
8. Evaluate notifications.
9. Save last status/error.
```

Fetch behavior:

```ts
fetch(`https://claude.ai/api/organizations/${orgId}/usage`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    accept: 'application/json'
  }
});
```

Error behavior:

- `401` or `403`: mark as login expired.
- Network error: keep last known data but mark state as stale.
- Missing fields: show endpoint changed/debug warning.
- No org ID: show setup needed.

## 7. Organization ID Detection

First setup flow:

```text
1. User opens claude.ai.
2. User clicks setup / detect.
3. Extension scans the active Claude page for UUID candidates.
4. Extension tests candidates against the usage endpoint.
5. First candidate returning a valid usage shape is saved.
6. Extension performs initial sync.
```

Potential detection sources:

- URLs in page scripts or markup.
- `current_user_access` bootstrap request pattern.
- Usage endpoint URL if user is on settings usage page.
- Manual paste fallback.

Useful patterns:

```text
/api/bootstrap/{orgId}/current_user_access
/api/organizations/{orgId}/usage
```

Do not require the user to paste cookies or tokens.

## 8. Toolbar Badge

The badge should be glanceable.

Badge text examples:

```text
4h
1h
42m
95
SET
ERR
```

Smart badge rules:

```text
If setup missing:
  SET

If sync error and no recent data:
  ERR

If weekly utilization >= 95:
  show weekly utilization number, red

If five-hour utilization >= 95:
  show five-hour utilization number, red

If reset is less than 60 minutes away:
  show minutes until reset

Otherwise:
  show hours until reset
```

Badge colors:

```text
Green  = safe
Orange = warning
Red    = critical
Gray   = setup needed / logged out / unknown
```

Severity logic:

```ts
function getSeverity(fiveHour: number | null, sevenDay: number | null) {
  if (sevenDay !== null && sevenDay >= 95) return 'critical';
  if (fiveHour !== null && fiveHour >= 95) return 'critical';
  if (fiveHour !== null && fiveHour >= 90) return 'high';
  if (fiveHour !== null && fiveHour >= 75) return 'warning';
  if (sevenDay !== null && sevenDay >= 80) return 'warning';
  return 'safe';
}
```

## 9. Popup UX

The popup must answer:

```text
How close am I?
When does it reset?
Is sync working?
```

Normal state:

```text
Claude Limit Tracker

5-hour session
64% used · Reset in 2h 12m

7-day usage
40% used · Resets Thu 05:00

Fresh · synced 1m ago
Source: Claude Web API

[Refresh now] [Open Claude]
```

Critical state:

```text
Claude session is critical

95% used
Reset in 38m

Weekly usage is safe at 40%.
Last sync: 1m ago

[Mute until reset] [Refresh now]
```

Weekly danger state:

```text
Weekly limit nearly exhausted

97% used
Weekly reset: Thu 05:00

Use shorter prompts or wait until weekly reset.

[Mute weekly warnings] [Refresh now]
```

Error state:

```text
Sync failed

Claude login may have expired.
Open Claude and log in again.

Last successful sync: 23m ago
Last error: 401 Unauthorized

[Open Claude] [Retry]
```

## 10. Notifications

Default notification events:

- 85% session usage.
- 95% session usage.
- 95% weekly usage.
- Reset detected.
- Sync failed / login expired.

User-configurable thresholds:

```text
Session warning: 75%
Session critical: 90%
Session final: 95%
Weekly warning: 80%
Weekly critical: 95%
```

Notification examples:

```text
Claude session warning
Your 5-hour usage is above 85%.
```

```text
Claude session critical
Your 5-hour usage is above 95%. Reset in 38m.
```

```text
Claude weekly warning
Your 7-day usage is above 95%. Be careful with long Claude Code sessions.
```

```text
Claude reset detected
Your 5-hour usage window appears to have reset.
```

```text
Claude sync failed
Open Claude and log in again.
```

Deduplicate notifications. Never notify every sync for the same threshold/window.

Notification memory:

```ts
export type NotificationMemory = {
  notifiedSessionWarningForResetAt?: string;
  notifiedSessionCriticalForResetAt?: string;
  notifiedSessionFinalForResetAt?: string;
  notifiedWeeklyWarningForResetAt?: string;
  notifiedWeeklyCriticalForResetAt?: string;
  notifiedResetForResetAt?: string;
};
```

## 11. Quiet Mode and Snooze

Quiet mode settings:

- Do not notify between 22:00 and 08:00.
- Only notify critical warnings.
- Disable reset notifications.
- Disable weekly warnings.
- Disable sync error notifications.

Snooze settings:

- Mute until next reset.
- Optional v0.2: snooze 30 minutes.

Storage model:

```ts
export type SnoozeState = {
  mutedUntil?: string | null;
  mutedUntilResetAt?: string | null;
};
```

Rules:

- Snooze suppresses notifications only.
- Badge and popup still update.
- Popup should show muted state clearly.

## 12. Weekly Danger Mode

Trigger:

```text
sevenDay.utilization >= 95
```

When active:

- Use red severity even if 5-hour usage is low.
- Show weekly danger message at the top of the popup.
- Notify once per weekly reset window.
- Make the warning direct but calm.

Message:

```text
Weekly limit nearly exhausted. Use shorter prompts or wait until weekly reset.
```

## 13. Freshness and Source Status

Source labels:

```text
Claude Web API
Page capture
Claude Code statusline
Manual
```

Freshness labels:

```text
Fresh: synced less than 5 minutes ago
Stale: synced 5–30 minutes ago
Expired: synced more than 30 minutes ago
Error: last sync failed
```

Examples:

```text
Fresh · last sync 1m ago · Source: Claude Web API
Stale · last sync 23m ago · Source: Claude Web API
```

## 14. Settings Page

Settings sections:

### Sync

- Auto-refresh interval: 2 / 5 / 10 / 15 minutes.
- Refresh now.
- Re-detect organization ID.
- Open Claude usage page.

### Notifications

- Session warning threshold.
- Session critical threshold.
- Session final threshold.
- Weekly warning threshold.
- Weekly critical threshold.
- Reset notifications on/off.
- Weekly warnings on/off.
- Sync error notifications on/off.
- Quiet hours on/off.
- Quiet hours range.

### Privacy

- Show stored data.
- Clear stored organization ID.
- Clear usage history.
- Clear all local data.
- Export debug report.

### Appearance

- Badge mode: reset time / usage percent / smart.
- Theme: system / light / dark.
- Compact popup on/off.

## 15. Debug Panel

Debug panel contents:

```text
Debug

Org ID: detected
Last sync: 2026-05-19 12:43
Last status: 200 OK
Last error: none

Response shape:
✓ five_hour
✓ seven_day
✓ extra_usage

Source: Claude Web API
Refresh interval: 2 min
Extension version: 0.1.0
```

Actions:

- Refresh now.
- Re-detect org ID.
- Copy debug info.
- Clear org ID.
- Clear history.

Debug export must exclude:

- cookies
- session tokens
- auth headers
- prompts
- responses
- conversations

Safe debug export shape:

```json
{
  "extensionVersion": "0.1.0",
  "source": "web-api",
  "hasOrgId": true,
  "lastSync": "2026-05-19T12:43:00+02:00",
  "lastStatusCode": 200,
  "lastError": null,
  "responseShape": {
    "five_hour": true,
    "seven_day": true,
    "extra_usage": true
  },
  "settings": {
    "syncIntervalMinutes": 2,
    "badgeMode": "smart",
    "quietModeEnabled": false
  }
}
```

## 16. Privacy Copy

Use this privacy copy in README and settings:

```text
Local-only

This extension stores only:
- organization ID
- usage percentages
- reset times
- notification settings
- local usage history if enabled

It never stores:
- Claude cookies
- session tokens
- prompts
- responses
- conversations

No data is sent to any third-party server.
```

## 17. README Requirements

The README must be user-facing and concise.

README sections:

1. Project name.
2. Short description.
3. Features.
4. Installation from GitHub.
5. First setup.
6. Usage.
7. Privacy.
8. Troubleshooting.
9. Development.
10. Disclaimer.

README style:

- No references to AI-generated planning.
- No personal references.
- No “I/we built this because...” unless it sounds natural and project-level.
- Avoid hype.
- Avoid academic whitepaper language.
- Keep sentences direct.
- Make it look like a normal polished open-source README.

README should focus on:

- What the extension does.
- How to install it.
- How to use it.
- What data it stores.
- How to troubleshoot setup and login issues.

## 18. Commit and Push Workflow

Make the repository history look like a real project built step by step.

General rule:

- Commit after each coherent milestone.
- Use clear commit messages.
- Run tests/lint before commits when available.
- Push after each milestone if remote is configured.
- Do not create one giant commit.

Suggested commit sequence:

### Commit 1

```text
chore: initialize extension project
```

Include:

- package.json
- TypeScript config
- Vite config
- folder structure
- base manifest
- README placeholder
- CLAUDE.md

### Commit 2

```text
feat: add usage model and normalization utilities
```

Include:

- usage types
- normalizer
- countdown formatting
- threshold utilities
- basic unit tests

### Commit 3

```text
feat: add Claude web usage provider
```

Include:

- web API provider
- fetch wrapper
- error mapping
- response-shape validation

### Commit 4

```text
feat: implement organization detection flow
```

Include:

- content script
- org ID detection
- manual fallback support
- setup state storage

### Commit 5

```text
feat: add background refresh and badge updates
```

Include:

- alarms
- refresh cycle
- badge text/color logic
- stale/error state handling

### Commit 6

```text
feat: build popup usage dashboard
```

Include:

- popup UI
- 5-hour card
- 7-day card
- source/freshness footer
- refresh/open Claude actions

### Commit 7

```text
feat: add notification thresholds and reset alerts
```

Include:

- notification engine
- threshold settings
- reset detection
- deduplication state

### Commit 8

```text
feat: add quiet mode and snooze controls
```

Include:

- quiet hours
- mute until reset
- notification suppression logic

### Commit 9

```text
feat: add settings and debug screens
```

Include:

- sync settings
- notification settings
- privacy panel
- debug panel
- safe debug export

### Commit 10

```text
docs: polish setup guide and privacy notes
```

Include:

- final README
- screenshots placeholders if needed
- troubleshooting
- disclaimer

### Commit 11

```text
chore: prepare initial release
```

Include:

- build script verification
- release ZIP script if desired
- version bump to 0.1.0

## 19. Quality Checklist

Before considering v0.1 complete:

- Extension loads in Chrome / Chromium developer mode.
- User can open Claude once and detect org ID.
- Extension fetches usage after Claude tab is closed.
- Badge updates correctly.
- Popup shows 5-hour and 7-day status.
- Manual refresh works.
- 401/403 shows login expired state.
- Notification thresholds do not spam.
- Quiet mode suppresses expected notifications.
- Mute until reset works.
- Weekly danger mode overrides normal state.
- Debug export does not include secrets.
- README install steps work from a fresh clone.
- No cookies, tokens, prompts, responses, or conversations are stored.

## 20. Writing Guidelines

UI and README text should sound human and practical.

Good copy:

```text
Claude session is critical. Reset in 38m.
Weekly usage is safe at 40%.
Last sync: 1m ago.
```

Bad copy:

```text
This revolutionary AI-powered tool empowers developers to optimize productivity.
```

Good README tone:

```text
Claude Limit Tracker shows your Claude usage limits in the browser toolbar. It tracks the 5-hour and 7-day windows, displays reset countdowns, and sends local warnings before you run out.
```

Bad README tone:

```text
In today's rapidly evolving AI landscape, users require robust observability into their LLM utilization metrics.
```

## 21. Disclaimer Text

Use this disclaimer in README:

```text
Claude Limit Tracker is unofficial and is not affiliated with Anthropic or Claude. It uses Claude web data available to the signed-in user and may break if Claude changes its web app or endpoints.
```

## 22. Final Product Target

The product should feel like this:

```text
Icon: red 95

Popup:
Claude session is critical. Reset in 38m.
Weekly usage is safe at 40%.
Last sync: 1m ago.

Notification:
Claude reset detected — you can resume.
```

Keep the app small, useful, transparent, and reliable.
