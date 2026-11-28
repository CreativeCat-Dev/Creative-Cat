# Hero QA — preserved scripts and test register

This directory holds the hero QA work produced during HERO-00a → HERO-06C.2 so it
survives the temporary directory. The hero is **frozen** (see
`context/09_DECISIONS.md`, "Delivery sprint"), so these scripts are an archive and
a future regression harness, not a per-change gate.

- Register: [`hero-regression.md`](./hero-regression.md) — 70 hero cases plus 55
  delivery cases (service ribbon, Next Level Projects masthead/video aperture, the
  DEL-01A Selected Projects gallery with the DEL-01B perspective hover on the six
  subsequent projects, canonical DEL-01C artwork, the DEL-01D.2 theme-following
  full-width Work archive with a local feature/pair sequence and editorial
  closing, the intelligent navbar, and the DEL-02 individual project case
  studies), statuses, and the script → case manifest.
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

`e2e/project-aperture-recording.js` writes the DEL-00.3C showreel-aperture MP4
under `tests/.local/out/next-level-projects-video/` (10.5s, 1440×900, 15fps) and
needs `FFMPEG_PATH` pointing at a full ffmpeg build.

`e2e/selected-work-recording.js` writes the DEL-01B gallery MP4 under
`tests/.local/out/selected-work/` (28.5s, 1440×900, 15fps). It starts at the
showreel full stage, follows the natural release into the unchanged circular Zero
reveal, scrolls the asymmetric gallery, alternates the perspective hover between
Right Sight and Exciting Sundarban, hovers Splash Shine, recovers, continues
through the remaining projects and reverses back to Zero and the contracting
circle. The script derives the aperture hold from the section geometry, so it also
runs against a production build.

`e2e/work-archive-recording.js` writes the DEL-01D.2 Work MP4 under
`tests/.local/out/work-archive/` (short, 1440×900, 15fps): theme-following archive
scroll through the full-width feature / staggered pair sequence, artwork hover
zoom and recovery, navbar hide/reveal and the editorial closing. It needs
`FFMPEG_PATH` like the other recording scripts.

`e2e/case-study-recording.js` writes the DEL-02 case-study MP4 under
`tests/.local/out/case-study/` (14.6s, 1440×900, 15fps): introduction, About and
Work Scope with the sticky information rail, Creative Direction, the Style Guide,
copying the Crimson `#DE1B52` swatch, the project gallery and the canonical Next
Project. It needs `FFMPEG_PATH` and clipboard permission in the browser context.

Recommended first runs after a fresh checkout:

| Script | Runtime | Why |
|---|---|---|
| `e2e/hero-entrance.js` | ~30 s | Proves the loader, base URL and headline selectors. |
| `e2e/project-aperture.js` | ~4 min | DEL-00.3C tracking/width match, opposing entrance, measured capsule aperture, one persistent video playing through expansion and reverse, deferred source/poster, caption, lens, pause, sticky release, asset hash, themes, reduced/no-JS/touch and overflow. |
| `e2e/selected-work.js` | ~7 min | DEL-01A circular Zero reveal and contract, scrubbed whole-card movement, asymmetric placement, descriptions/tags, hover/focus, light/dark surfaces, tablet/mobile, reduced/no-JS, all project routes and hero/aperture preservation; DEL-01B six-project perspective structure and recovery; DEL-01C canonical cover URLs/ratios; DEL-01D.2 theme-following Work archive, local feature/pair sequence, full-width cinematic features, hover zoom, editorial closing and removed hero link. |
| `e2e/project-case-studies.js` | ~6 min | DEL-02 all 13 case studies: shared architecture and conditional content, complete cover framing, sticky rail and release, palette provenance/copy, Dipakkhik typography, canonical Next Project, themes, 1920/1024/834/390, reduced/no-JS and 404. |
| `e2e/navbar-visibility.js` | ~2 min | Intelligent navbar: top visibility, 80px threshold, sustained hide, upward reveal, stop stability, 8px jitter tolerance, rapid reversal, menu/focus/route exceptions, progress synchronization, the Work surface in both themes, reduced/no-JS and real mobile touch swipes. |
| `e2e/hero-architecture-regression.js` | ~2 min | Mode crossing, restoration, WebGL, no-JS, reduced motion. |
| `accessibility/hero-enlarged-text.js` | ~2 min | Enlarged-text overflow/clearance matrix. |
| `e2e/hero-responsive-matrix.js` | ~15 min | Full matrix; use only for a consolidated QA pass. |

## Portability limitations

- Authored and last run on Windows with Chromium 1255. Anything browser-specific
  (frame timing, `readPixels`, `100svh`, view transitions) may differ on another
  engine; cross-browser coverage is deferred.
- The scripts depend on hero `data-*` hooks and `window.__heroStory` /
  `window.__heroLenis` / `window.__heroCorridor` accessors, plus the Work
  `[data-work-card]` / `[data-work-frame]` / `[data-work-image]` hooks, the
  case-study `[data-case-*]` hooks and the navbar `[data-nav-progress]` /
  `[data-surface]` contract. Renaming those hooks breaks the scripts — update the
  selectors with the component.
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

DEL-02 artefacts under `tests/.local/out/`:

- `del02/` — Right Sight, Zero, Project WE and Dipakkhik top/full captures,
  sticky rail, copied palette, light/dark, 1920/1024/834/390 and mobile Style
  Guide screenshots, plus `report.json`.
- `case-study/case-study.mp4` — 14.6s, 1440×900, 15fps walkthrough.
