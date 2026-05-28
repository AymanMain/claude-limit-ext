# Reviewer Notes

Notes for Chrome Web Store, Edge Add-ons, and Opera reviewers.

---

## What this extension does

Claude Session Tracker shows Claude usage windows (5-hour and 7-day), reset countdowns, and local warning notifications from the browser toolbar.

It is a local-first utility for Claude users who want to track usage state without opening Claude settings.

## How to test

1. Install the extension in developer mode or from the store.
2. Sign into [claude.ai](https://claude.ai) in the same browser profile.
3. Open `https://claude.ai` in any tab.
4. Click the Claude Session Tracker toolbar icon.
5. Click **Detect organization** or **Refresh now**.
6. Confirm that usage percentages and reset countdown appear.
7. Open settings (gear icon) to verify the settings and debug panels load.

## What requires a Claude account

Usage data is fetched from `https://claude.ai/api/organizations/{orgId}/usage` using the browser's existing Claude session. A valid Claude login is required. Without it, the extension shows a "Sync failed — login expired" state.

## Data handling

- Stores: organization ID, usage percentages, reset timestamps, settings, notification state — locally in `chrome.storage.local`
- Does not store: cookies, session tokens, prompts, responses, conversations, or any personally identifiable information
- No external servers, analytics, telemetry, or remote backend

## External connections

The extension makes one type of network request: `GET https://claude.ai/api/organizations/{orgId}/usage` using the browser's existing Claude session cookies (`credentials: include`). No other external connections are made.

## Affiliation

Claude Session Tracker is unofficial and is not affiliated with Anthropic or Claude.

## Support

- GitHub issues: https://github.com/AymanMain/claude-limit-ext/issues
- Email: aymanelkarroussi@gmail.com
