# Security

## Reporting a vulnerability

Open an issue at [github.com/AymanMain/claude-limit-ext/issues](https://github.com/AymanMain/claude-limit-ext/issues) or email [aymanelkarroussi@gmail.com](mailto:aymanelkarroussi@gmail.com).

## npm audit findings

`npm audit` currently reports 9 vulnerabilities (6 moderate, 3 high). All are in development and build tooling. None are present in the shipped extension.

| Package | Severity | Used in |
|---|---|---|
| `esbuild` ≤0.24.2 | Moderate | Vite dev server only |
| `vite` ≤6.4.1 | Moderate | Build tooling only |
| `vite-node` | Moderate | Vitest test runner only |
| `vitest` | Moderate | Test runner only |
| `tmp` <0.2.6 | High | `vite-plugin-web-extension` build step only |
| `web-ext-run` | High | `vite-plugin-web-extension` build step only |
| `node-notifier` | High | `vite-plugin-web-extension` build step only |
| `uuid` <11.1.1 | Moderate | `node-notifier` (build dep) only |

**The esbuild vulnerability** (GHSA-67mh-4wv8-2f99) allows a website to send requests to the Vite dev server. This only affects developers running `npm run dev` on their local machine. It has no impact on the built extension.

**The tmp vulnerability** (GHSA-ph9p-34f9-6g65) is a path traversal in a temp-file utility used by `vite-plugin-web-extension` during the build step. It has no impact on the built extension.

The built extension in `dist/` contains only:

- `manifest.json`
- Bundled JS (React + extension logic)
- HTML entry points
- PNG icons

None of the vulnerable packages are bundled into the extension output. They exist only in `node_modules` and are used during `npm run build`, `npm test`, and `npm run dev`.

### Why these are not fixed with `--force`

`npm audit fix --force` would install Vite 8 and downgrade `vite-plugin-web-extension` to v3, both breaking changes that would require build configuration work. The tradeoff is not justified given the dev-only scope of the vulnerabilities.

These will be resolved when upstream packages release compatible updates.
