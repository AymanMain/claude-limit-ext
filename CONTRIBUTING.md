# Contributing

## Before you start

- Check existing issues and PRs before opening a new one.
- For bug fixes: open an issue first to confirm the bug.
- For features: open an issue first to discuss scope.

## Setup

```bash
git clone https://github.com/AymanMain/claude-limit-ext.git
cd claude-limit-ext
npm install
```

## Development

```bash
npm run dev      # watch build
npm run build    # production build
npm test         # run tests
npm run lint     # lint check
npm run typecheck  # TypeScript check
```

Load the `dist/` folder as an unpacked extension in your browser.

## Quality gates

All PRs must pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

Run `npm run check` to run all of the above except the audit.

## Pull requests

Use the PR template. Keep changes focused — one concern per PR.

## Commit style

Use conventional commits:

```
feat: add test notification button
fix: resolve empty catch lint error
docs: update permissions justification
chore: bump version to 0.1.2
```

## Releases

Releases are created by pushing a version tag. See `DEPLOY.md` for the full release flow.

## Code of conduct

Be direct and constructive. No personal attacks. Focus on the work.
