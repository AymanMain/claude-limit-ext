# Product Decisions

## Problem

Claude power users — developers, writers, researchers — lose flow when they hit usage limits mid-session. The reset windows (5-hour and 7-day) are not visible in the browser. The only way to check is to navigate into Claude settings and look at a usage page.

## Users

- Developers using Claude Code for long sessions
- Writers working through multi-step prompts
- Researchers running long chains of queries
- Anyone who has been cut off mid-task and had to wait

## Core jobs to be done

- "Tell me if I should slow down before I hit the limit."
- "Tell me when Claude resets so I know when to resume."
- "Show usage state from the toolbar without opening settings every time."
- "Do not store my Claude conversations or credentials anywhere."

## Key decisions

### Local-first by default

The extension stores only usage metadata (percentages, reset timestamps, org ID) in `chrome.storage.local`. No data is sent to any external server. This was a non-negotiable constraint because the extension reads data from a signed-in session and users should not have to trust a third-party backend.

### Toolbar-first UX

The primary surface is the browser badge, not a tab or sidebar. Users need glanceable status — a number or reset time — without opening anything. The popup gives more detail on demand.

### Stale-state visibility

Claude's usage endpoint is unofficial. It will change. When data is old or a fetch fails, the extension shows this clearly rather than silently showing stale numbers. Users learn to interpret the freshness indicator.

### Debug panel

The debug panel exists because the data source is unofficial and endpoint changes are likely. When something breaks, users need a way to see what state the extension is in and report a useful bug.

### Conservative notifications

Notifications default to high thresholds (85%, 95%) with deduplication and quiet-hours support. The goal is to surface information when it is actionable, not to generate noise.

## Tradeoffs

| Decision | Upside | Downside |
|---|---|---|
| Local-only storage | Better privacy, no backend to maintain | No cross-device sync |
| Unofficial Claude endpoint | No API key needed | May break when Claude updates |
| Browser extension | Native toolbar integration | Requires install, platform-specific review |
| React for popup UI | Composable components | Slightly larger bundle than vanilla JS |
