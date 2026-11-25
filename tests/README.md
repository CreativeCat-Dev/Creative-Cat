# Hero QA — preserved scripts and test register

This directory holds the hero QA work produced during HERO-00a → HERO-06C.2 so it
survives the temporary directory. The hero is **frozen** (see
`context/09_DECISIONS.md`, "Delivery sprint"), so these scripts are an archive and
a future regression harness, not a per-change gate.

- Register: [`hero-regression.md`](./hero-regression.md) — 70 cases, statuses,
  and the script → case manifest.
- Scripts: `e2e/`, `responsive/`, `accessibility/`, `performance/`.
- Shared loader: `lib/playwright.js`, `lib/paths.js`.
- Local, git-ignored overrides: `.local/runtime.json`.

## What these scripts are

Read-only browser measurements. They start Chromium, load the running site, read
geometry/DOM/WebGL state, optionally write screenshots and JSON under
`tests/.local/out/`, then exit. They never write project files, never mutate Git,
and never touch production data.

They were written against the project's own Playwright runtime rather than a test
framework. No testing framework was installed for this preservation pass.

## Prerequisites

1. Node.js 20+.
2. A running site — dev (`pnpm dev`, :3000) or a production build
   (`pnpm build && pnpm start`, :3000) .
3. A Playwright module (not a project dependency) and a Chromium build.

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `HERO_BASE_URL` | Site under test | each script's original default (`:3000` or `:3100`) |
| `PLAYWRIGHT_MODULE` | Module path/name for `playwright-core` or `playwright` | `playwright-core`, then `playwright` |
| `CHROMIUM_PATH` | Chrome/Chromium executable | Playwright's bundled browser |
| `HERO_OUT_DIR` | Screenshot/JSON root | `tests/.local/out` |

Machine-specific values belong in `tests/.local/runtime.json` (git-ignored):

```json
{
  "playwrightModule": "C:/path/to/node_modules/playwright-core",
  "chromiumPath": "C:/path/to/chrome.exe"
}
```

`tests/runtime.example.json` is the committed template.

## Running

```bash
# from the repository root, with the site already running
HERO_BASE_URL=http://localhost:3000/ node tests/e2e/hero-entrance.js
```

PowerShell:

```powershell
$env:HERO_BASE_URL = "http://localhost:3000/"
node tests/e2e/hero-entrance.js
```

Every script prints human-readable lines and/or JSON to stdout. Scripts that
write artefacts create their own directory under `HERO_OUT_DIR`.

Recommended first runs after a fresh checkout:

| Script | Runtime | Why |
|---|---|---|
| `e2e/hero-entrance.js` | ~30 s | Proves the loader, base URL and headline selectors. |
| `e2e/hero-architecture-regression.js` | ~2 min | Mode crossing, restoration, WebGL, no-JS, reduced motion. |
| `accessibility/hero-enlarged-text.js` | ~2 min | Enlarged-text overflow/clearance matrix. |
| `e2e/hero-responsive-matrix.js` | ~15 min | Full matrix; use only for a consolidated QA pass. |

## Portability limitations

- Authored and last run on Windows with Chromium 1255. Anything browser-specific
  (frame timing, `readPixels`, `100svh`, view transitions) may differ on another
  engine; cross-browser coverage is deferred.
- The scripts depend on hero `data-*` hooks and `window.__heroStory` /
  `window.__heroLenis` / `window.__heroCorridor` accessors. Renaming those hooks
  breaks the scripts — update the selectors with the component.
- `hero-responsive-matrix.js` writes ~170 screenshots; it needs disk space and
  several minutes.
- Some scripts assume enhanced desktop (`>=1024px`, pointer) and report zero
  canvas on static bands by design.
- Fractional CSS viewports cannot be driven: Chromium rounds an iframe viewport
  to whole pixels (767.5 → 768, 1023.5 → 1024). Fractional band edges are covered
  by construction, not by a driven test.
- Actual browser page zoom is not driven; root-font injection is the
  zoom-equivalent and is labelled as such in the register.

## Artefacts

Generated output is git-ignored (`/playwright-report/`, `/test-results/`,
`tests/.local/`). The HERO-06C.2 capture sets remain in the original temporary
directory until the owner deletes them:

- `%LOCALAPPDATA%/Temp/opencode/hero-06c2-baseline/` — 73 before files
- `%LOCALAPPDATA%/Temp/opencode/hero-06c2-candidates/` — 36 headline candidates
- `%LOCALAPPDATA%/Temp/opencode/hero-06c2-final/` — 167 matrix files
- `%LOCALAPPDATA%/Temp/opencode/hero-06c2-final-verified/` — 26 final-build files
- `%LOCALAPPDATA%/Temp/opencode/hero-06c2-peek/` — 16 peek comparisons
