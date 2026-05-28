# Changelog

## 0.1.1

- Fixed TypeScript errors: `interceptor.ts` global augmentation, unused React imports across 9 files
- Fixed lint errors: empty catch blocks in `detectOrgId.ts`
- Fixed countdown test `afterEach` return type
- Removed unnecessary `activeTab` permission from manifest
- Added CI workflow (typecheck, lint, test, build, production audit)
- Added release packaging scripts for Chrome, Edge, Opera
- Added release validation script
- Added GitHub issue templates and PR template
- Added `docs/permissions.md`, `docs/store-listing.md`, `docs/reviewer-notes.md`
- Added `docs/product-decisions.md`, `docs/architecture.md`
- Added store-specific privacy pages (Edge, Opera)
- Added `SECURITY.md` documenting dev-toolchain audit findings
- Added `CONTRIBUTING.md`
- Renamed product to Claude Session Tracker
- Aligned version across `package.json` and `manifest.json`
- Added CI badge to README
- Removed `activeTab` from `docs/privacy.html`

## 0.1.0

Initial release.

- Background refresh with `chrome.alarms`
- 5-hour and 7-day usage tracking
- Toolbar badge with smart mode
- Popup with usage cards, footer, and action buttons
- Notification engine with deduplication
- Quiet mode and snooze-until-reset
- Weekly danger mode
- Settings, debug, and privacy panels
- Local-only storage
- Waiting-for-reset view with live countdown
- Circular arc progress ring for critical states
