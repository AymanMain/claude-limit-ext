# Permissions

Permissions requested in `manifest.json` and their justification.

## storage

Saves usage state, reset timestamps, organization ID, settings, and notification deduplication state locally using `chrome.storage.local`. No remote storage is used.

## alarms

Schedules periodic background refresh. Default interval: 2 minutes. Configurable to 2, 5, 10, or 15 minutes in settings. Using `chrome.alarms` instead of `setInterval` because `setInterval` does not survive service worker suspension in Manifest V3.

## notifications

Sends local browser notifications when usage passes configured thresholds (default: 85% and 95% for 5-hour session, 95% for 7-day window). Notifications are deduplicated per reset window and respect quiet-hours settings.

## tabs

Queries open `claude.ai` tabs to forward the detect-org-ID message to the content script. Also used to open `claude.ai` from popup buttons. No tab content is read — only tab URLs are queried to find Claude tabs.

## host_permissions: https://claude.ai/*

Required for two purposes:

1. Content script injection into claude.ai pages for org ID detection.
2. Background fetch of `https://claude.ai/api/organizations/{orgId}/usage` with `credentials: include` to read usage data from the signed-in session.

No other hosts are accessed.

## Permissions not requested

| Permission | Why not included |
|---|---|
| `activeTab` | Not needed — the extension does not read active tab content on user gesture |
| `<all_urls>` | Not needed — only claude.ai is accessed |
| `cookies` | Not needed — credentials are passed via fetch session, not read directly |
| `webRequest` | Not needed — org ID is captured via content script fetch interception |
| `identity` | Not needed — no OAuth or Google account access |
