# Hero regression register — 70 hero cases + 11 delivery cases

Last reconciled: 2026-11-26 (DEL-00.2C, delivery sprint).

The owner-supplied 70-case handoff register was **not present** in the workspace,
`%LOCALAPPDATA%/Temp/opencode/`, Desktop, Downloads or Documents. This register
was therefore reconstructed from the preserved scripts, the checkpoint reports in
`context/10_PROGRESS.md`, and the decisions in `context/09_DECISIONS.md`, and
reconciled to 70 cases. It is a reconstruction, not a transcription of the
handoff.

## Status legend

| Code | Meaning |
|---|---|
| **V** | Currently verified — last run against the HERO-06C.2 production build on 2026-11-25. |
| **H** | Historically passed — verified at an earlier checkpoint, not re-run for HERO-06C.2. |
| **D** | Deferred — deliberately postponed to the consolidated QA pass. |
| **N** | Not yet tested. |
| **F** | Failed. |

Historical results are **not** verification of the current build. Only **V** rows
are.

Two IDs are intentionally retired from the original numbering: **GL-04** (no
WebGL on static bands) is covered by CAT-06 and GL-07, and **AD-05** (shell
unaffected by copy centring) is covered by RS-08/RS-09. The table below is still
70 live cases.

After the HERO-06C.2 matrix run, the only further production change was a
documentation comment in `app/globals.css`; the production build was rebuilt and
26 representative screenshots were recaptured from it. A comment cannot change
computed style, but the full matrix itself was not re-run after that edit — that
is stated here rather than glossed over.

## A. Cat assets and chroma key (6)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| CAT-01 | Canonical Cat V2 master, start poster and settled poster hashes unchanged | SHA-256: video `3a98e911…6588a`, start `fa747dae…b648`, settled `42a6b4f1…d79` (2026-11-25) | V |
| CAT-02 | Start/settled poster renders on the static and no-JS hero | `e2e/hero-responsive-matrix.js` no-JS captures; `e2e/hero-cat-chromakey.js` | V |
| CAT-03 | Poster remains visible when the enhanced canvas is unavailable | `e2e/hero-architecture-regression.js` (WebGL loss) | V |
| CAT-04 | Chroma-key/matte edge quality against both themes | `e2e/hero-cat-chromakey.js`, `e2e/hero-cat-silhouette.js` (last deep check HERO-06B.3A) | H |
| CAT-05 | Cat scale and centre preserved across phone/tablet/desktop | `e2e/hero-responsive-matrix.js`, `e2e/hero-cat-silhouette.js` | V |
| CAT-06 | No live video and no canvas below 1024px | `e2e/hero-responsive-matrix.js`: 0 canvas / 0 video at 280–767 | V |

## B. WebGL lifecycle and fallback (6)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| GL-01 | Enhanced mode creates exactly one hero canvas | `e2e/hero-architecture-regression.js`: 1024×600 baseline canvas 1 | V |
| GL-02 | Context loss replaces the canvas with the settled poster | same: loss state poster, 0 canvas | V |
| GL-03 | Context restore returns the live cat (frame 104) | same: restored live, frame 104 | V |
| GL-05 | Listener/observer add/remove accounting across mode and route changes | `e2e/hero-listener-hygiene.js` | V |
| GL-06 | Shader, scrubber, `CAT_SOURCE`, `CAT_BEATS` and corridor geometry unchanged by the hero work | source diff + asset hashes | V |
| GL-07 | Reduced motion and no-JS never start a live WebGL hero | `e2e/hero-architecture-regression.js` reduced/no-JS captures | V |

## C. Scroll choreography (6)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| SC-01 | Enhanced wrapper budget is 500svh | `e2e/hero-architecture-regression.js`: wrapper 3000 at 600px stage | V |
| SC-02 | Exactly one hero ScrollTrigger in enhanced mode | same: `triggers: 1` | V |
| SC-03 | Zero hero ScrollTriggers in static mode (phone, tablet, static desktop) | same + matrix: `triggers: 0` | V |
| SC-04 | Stage pins and releases so the story ends while still stuck | HERO-06B.2A/06B.3 regression evidence; re-run with `e2e/hero-architecture-regression.js` | H |
| SC-05 | Exactly one root Lenis instance | same: `lenis: 1` on every viewport | V |
| SC-06 | Reading-position correction restores saved y after resize | `e2e/hero-cases-abc.js`: compatible restores 0 / 1200 / 2400, zero corrective calls | V |

## D. Project corridor and cards (7)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| CO-01 | Every card is 4:5 and bottom-aligned in its track | `e2e/hero-responsive-matrix.js` card rects | V |
| CO-02 | Canonical 13-project order; `lib/work.ts` unchanged | `01 / 13` counter + source unchanged | V |
| CO-03 | Counter synchronises with story progress | `e2e/hero-architecture-regression.js`: 07 / 13 at y1200 | V |
| CO-04 | No project links or temporary destinations exist yet | matrix: `projectLinks: 0`; source scan | V |
| CO-05 | `cover` / `contain` fit policy and assets unchanged | `lib/work.ts` + `hero-card.tsx` unchanged; fit matrix | V |
| CO-06 | Phone peek is 18%, tablet 26%, desktop geometry untouched | `responsive/hero-card-peek.js`, matrix track data | V |
| CO-07 | Cat occludes only the cards' inner edges, never the GDRI wordmark | `responsive/hero-artwork-occlusion.js`: clear margin 17.65 / 25.32 / 168.84px | V |

## E. Metadata and composition (5)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| MT-01 | "Featured Work" label present and legible | matrix captures; geometry at 24–296 on phones | V |
| MT-02 | `01 / 13` counter present in static layouts | matrix `metaRow` | V |
| MT-03 | Bottom editorial rule present and unbroken | matrix `rule` | V |
| MT-04 | Footer "13 Projects" label and footer layout | HERO-06B.3A shell evidence (footer not re-run in 06C.2) | H |
| MT-05 | Mobile metadata sits on the content gutter, not the desktop rule | matrix `featuredMeta` at 24–296 / 24–456 | V |

## F. Project interaction and eligibility (5)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| IN-01 | Card artwork hover push-in (desktop) | HERO-06B.3 visual evidence; no re-run | H |
| IN-02 | Focus-visible card scrim | HERO-06B.3 visual evidence; no re-run | H |
| IN-03 | Touch layout has no hover dependency; both CTAs visible at 280–767 | matrix touch captures | V |
| IN-04 | Enhanced story eligibility requires a large enough viewport/pointer | `e2e/hero-content-fit.js` + font-size matrix | V |
| IN-05 | Theme toggle and view-transition wipe still work | HERO-06A/shell evidence; no re-run in 06C.2 | H |

## G. Navigation, menu and shell (6)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| NV-01 | Healthy Work navigation returns to saved hero position | `e2e/hero-architecture-regression.js`: y1200, 07 / 13 | V |
| NV-02 | Resize while the page is hidden restores correctly | same: hidden-resize return | V |
| NV-03 | Menu overlay keyboard order and focus trap | HERO-06A shell verification | H |
| NV-04 | Mobile menu open/close and body scroll lock | HERO-06A shell verification | H |
| NV-05 | Scrolled navbar legibility over the hero | Deferred NF-3 item, still open | H |
| NV-06 | Footer composition and motion | HERO-06B.3A footer evidence | H |

## H. Adaptive responsive eligibility (5)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| AD-01 | Eligibility at 1024×600 with 20px root | `e2e/hero-content-fit.js`, `e2e/hero-cases-abc.js` | V |
| AD-02 | Root-font matrix: enhanced vs static thresholds | `e2e/hero-cases-abc.js`: 1440@20 enhanced, @24/@32 static; 1024×600@20 static; 1024×768@20 enhanced | V |
| AD-03 | Content-fit required height and nav gap values are stable | `e2e/hero-content-fit.js`: 753.46875/38.03, 844.96875/17.03, 1074.46875, 679.0625/11.00, 759.921875/38.01 | V |
| AD-04 | Static desktop fallback is complete | `e2e/hero-static-fallback.js` | V |
| AD-06 | Mode crossings 767↔768 and 1023↔1024 with no overflow or console error | `responsive/hero-mode-crossover.js` | V |

## I. Responsive layout (10)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| RS-01 | Phone copy group centred on the viewport axis | matrix: centre delta 0 at every phone width | V |
| RS-02 | Two-line compact headline at ≥375px, three-line below 375px | matrix line widths; `responsive/hero-headline-candidates.js` | V |
| RS-03 | Body keeps the 34ch measure and is centred | matrix `bodyStyle` + line widths | V |
| RS-04 | CTAs stack below 540px, one row at 540–767.98px | matrix `ctaGroup.dir` | V |
| RS-05 | Both CTAs are at least 44px tall | matrix 46 / 44 at 16px root | V |
| RS-06 | CTA-to-highest-artwork clearance is at least 16px | matrix: 16.00 where cards bleed; 29–79px elsewhere | V |
| RS-07 | Zero horizontal overflow and zero footer overlap on all tested sizes | matrix `overflowX` / `overlapFooter` | V |
| RS-08 | Tablet band geometry identical to HERO-06C.1 | 8-viewport rect comparison + 4 in matrix | V |
| RS-09 | Desktop geometry identical to HERO-06C.1 / HERO-06B.3A | 7-viewport rect comparison | V |
| RS-10 | Landscape phones grow the document and scroll naturally | matrix 568×320/667×375/720×360/767×430 | V |

## J. Accessibility (8)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| AX-01 | Exactly one `h1` at every width | AX snapshot: `heading "Ideas into brands that move." [level=1]` | V |
| AX-02 | Accessible name is exactly "Ideas into brands that move." | same, all sizes | V |
| AX-03 | Exactly two hero CTA focusables | keyboard probe at 375 and 834 | V |
| AX-04 | Keyboard order is primary then secondary | keyboard probe: nav → Start a project → View selected work | V |
| AX-05 | Both hero CTAs show a visible focus ring | keyboard probe `box-shadow` | V |
| AX-06 | Reduced motion renders the finished hero immediately | matrix reduced-motion captures | V |
| AX-07 | No-JS renders a readable static hero | matrix no-JS captures | V |
| AX-08 | 200% text enlargement has no overflow, clipping or footer overlap | `accessibility/hero-enlarged-text.js` | V |

## K. Performance (3)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| PF-01 | Frame pacing stays under 33.4ms (desktop traversal) | `performance/hero-frame-pacing.js`: 16.7 median / 16.8 p95 / 33.2 max, 0 long frames | V |
| PF-02 | CLS for cases A/B/C | `e2e/hero-cases-abc.js`: 0 / 0.00005 / 0.072302 | V |
| PF-03 | Real-device LCP/INP/CLS and mobile JS weight | — | D |

## L. Production verification (3)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| OP-01 | `tsc --noEmit`, scoped ESLint, `pnpm build`, `git diff --check` pass | 2026-11-25: all exit 0 | V |
| OP-02 | No diagnostic hooks, QA fixtures, secrets or temporary destinations in the build | `.next/static` scan + source scan: none | V |
| OP-03 | Essential routes load (/, /work, /services, /about, /contact) with real content | Only `/` is built; the other four are placeholders | N |

## M. Global scroll chrome + service ribbon (11)

Added after the hero freeze; these are delivery-sprint cases, not hero cases.
All eleven are deferred to the consolidated pass, but each received a lightweight
production check on 2026-11-25. DEL-00.1 changed the scrollbar palette from wine
to coral and made every navbar surface opaque; DEL-00.2 replaced the hero's
SCROLL / 13 PROJECTS labels with the kinetic service ribbon; DEL-00.2A thickened
the bands, lengthened the opposing waves, added the knockout crossing, restored
the cat clearance; DEL-00.2B widened the peak separation and moved the pause
control into the site menu; DEL-00.2C mirrored the waves, made the type
responsive, replaced the unsigned bump with a signed spring and confirmed the
hover "spacing" was not typographic; DEL-00.2D thinned both bands to 19px,
reduced the desktop type to 11.5px/500, centred the glyphs and gave the recovered
thickness to separation; DEL-00.2E replaced those desktop dimensions with the
owner-selected 25px band / 10.5px type / 20px gap inside a 76px strip.

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| NL-01 | Navbar progress reads 0 at top, 0.5 at half and 1 at bottom, is 2px tall, sits on the navbar bottom edge and causes no layout shift | `e2e/scroll-chrome.js`: 0 / 0.5 / 1; bar 2px; bar bottom = nav bottom | D |
| NL-02 | Progress updates after client route navigation, window resize and scroll restoration | same: `/contact` reads 0; Back restores y1500 → 0.339; resize re-measured | D |
| NL-03 | Scrollbar thumb is coral `#FF1C43` idle and deeper coral `#D91438` while scrolling; hover `#FF4764`; dragging `#B01030`; native drag and keyboard remain | same: computed idle `rgb(255,28,67)`, active tween toward `rgb(217,20,56)`; hover pseudo `rgb(255,71,100)`; `:active` rule present; scrollbar never replaced | D |
| NL-04 | Both themes, reduced motion and no-JS fallback | same: light/dark identical; reduced scale is exact; no-JS keeps the coral thumb and scale 0 | D |
| NL-05 | Menu lock and mobile keep the effects correct; one Lenis, no new ScrollTrigger | same: menu progress unchanged, overflow hidden→visible; mobile 0.5; `lenis: 1`, triggers unchanged | D |
| NL-06 | Navbar surfaces are fully opaque at page top, mid-scroll and hero exit, with correct foregrounds | same: `.nav-shell` computed `rgb(255,255,255)` light / `rgb(21,14,52)` dark; no content shows through the mid-scroll and mobile captures | D |
| NL-07 | Seven service labels render once in the accessible list; all SVG text is decorative; star separators use the smaller tspan | `e2e/service-ribbon.js`: 7 list items, two aria-hidden text paths, 35 star tspans per path, labels/state in one `ul` | D |
| NL-08 | Two text paths move in opposite directions; the measured loop reset has no gap, duplicate spacing or visible jump | same: offsets diverge; unit measured at 574.7 units at 1440 (984.9 at 1024×600, 973.9 at 390), responsive to the CSS type size; offset 0 and offset L captures differ by the known sub-unit residual (~1px edge alignment) from the curved path | D |
| NL-09 | Hover slows the ribbon to about 0.35 timeScale; pointer deformation is signed, localized and per-ribbon; the coral passes over the midnight with a clean knockout; recovery is elastic and typography never animates | same: 20.94 units/600ms normal vs 7.34 hovered; at x=960 coral 30.25 → 28.22 above / 31.55 below, midnight 7.75 → 6.47 / 9.35; the bump spends the available headroom near the wave extremes so it never clips; exact recovery; `letter-spacing` 0.63px and `textLength` 4026.75 unchanged, glyph gaps <0.001 units, path length +0.16; shine 0.5/0.38 → 0 | D |
| NL-10 | The overlay pause button is gone; the menu motion switch pauses/resumes the same timeline, is keyboard operable, correctly stateful, hidden under reduced motion, and also suspends pointer deformation | same: `role="switch"` with `aria-checked`; pause freezes offsets and leaves both bands at baseline after a pointer move; resume advances; 44px min-height; `display:none` under reduced motion; absent from the no-JS document | D |
| NL-11 | Owner-selected proportions and the height budget preserve the rule, cat and fit: 76px@1440, 34px@1024×600, 52px@834, 46px@390; band 25px, type 10.5px/500, ≈20px peak gap at 1440; ≈9px of measured cap clearance each side; the cat stays 1px above the rule | same: 76px strip keeps `meta + padding` at 80.5px (padding 4.5px), rule 818.5; band 12.5 units = 25px@1440 / 11.18px@1024 / 17.11px@834 / 15.13px@390; type 5.25 units = 10.5px@1440 / 8.05px@1024 / 11.22px@834 / 10.77px@390; peak gap 19.99px@1440, 8.94px@1024, 13.67px@834, 12.11px@390; measured ink above/below 9.3/8.5px@1440, 2.6/2.9px@1024, 3.5/4.2px@390; mask channel 14.5 units; cat gap 1px; 1024×600 enhanced with required 587.56; no overflow | D |

**Totals:** 58 currently verified, 10 historically passed, 12 deferred, 1 not yet
tested, 0 failed.

- 70 hero rows: 6+6+6+7+5+5+6+5+10+8+3+3.
- 11 delivery rows: NL-01…NL-11 (all deferred).

## Script → case manifest

| Script | Cases | Notes |
|---|---|---|
| `e2e/hero-responsive-matrix.js` | RS-01…RS-10, AX-01…AX-08, AD-02, AD-06, MT-01…MT-03, MT-05, CAT-06, CO-01, CO-04 | Full matrix; ~170 screenshots; slowest script. |
| `e2e/hero-geometry-snapshot.js` | RS-01…RS-09, MT-01…MT-03, MT-05, CO-01 | Geometry JSON + per-viewport screenshots. |
| `e2e/hero-architecture-regression.js` | GL-01, GL-02, GL-03, GL-07, SC-01…SC-03, SC-05, CO-03, NV-01, NV-02, AD-04, AD-06, AX-06, AX-07 | The core static/enhanced regression. |
| `e2e/hero-listener-hygiene.js` | GL-05 | Listener/observer accounting. |
| `e2e/hero-cases-abc.js` | SC-06, AD-01, AD-02, PF-02, NV-01 | CLS + restoration cases. |
| `e2e/hero-content-fit.js` | AD-01, AD-03 | Required/navGap values. |
| `e2e/hero-static-fallback.js` | AD-04, RS-10 | Static sweep including short viewports. |
| `e2e/hero-cat-chromakey.js` | CAT-02, CAT-04 | Canvas vs poster extraction at p1. |
| `e2e/hero-cat-silhouette.js` | CAT-04, CAT-05 | WebGL `readPixels` silhouette. |
| `e2e/hero-entrance.js` | RS-02, AX-01 | Entrance sampling; ~30 s smoke test. |
| `performance/hero-frame-pacing.js` | PF-01 | 7 s traversal per run. |
| `accessibility/hero-enlarged-text.js` | AX-08, RS-02, RS-04 | Root-font matrix (zoom-equivalent). |
| `responsive/hero-mode-crossover.js` | AD-06, RS-08, RS-09 | Crossings during the entrance. |
| `responsive/hero-headline-candidates.js` | RS-02 | A/B/C line-width measurement. |
| `responsive/hero-artwork-occlusion.js` | CO-07, RS-06 | GDRI vs cat silhouette. |
| `responsive/hero-card-peek.js` | CO-06, CO-07 | Peek-percentage comparison. |
| `e2e/scroll-chrome.js` | NL-01…NL-06 | DEL-00/00.1 navbar progress + branded scrollbar. |
| `e2e/service-ribbon.js` | NL-07…NL-11 | DEL-00.2/00.2A/00.2B/00.2C/00.2D/00.2E placement, band/type proportions, mirrored separation, signed pointer deformation, loop, menu switch and fallbacks. |

Cases without a preserved script (H rows and shell cases) were verified by the
one-off probes in the temporary directory and by the HERO-06A/06B reports; they
need a new probe rather than an existing script when the consolidated QA pass
runs.

## Known gaps

1. Only Chromium was exercised; Firefox/Safari and iOS/Android devices are not
   covered.
2. Fractional CSS viewports are not drivable in this harness (Chromium rounds
   them); the fractional band edges are verified by construction only.
3. Actual browser page zoom is not driven; root-font injection is the
   zoom-equivalent and is labelled that way.
4. Four of five routes are placeholders, so route-level and content-level QA has
   not happened.
5. PF-03 (real-device performance) is deferred.
6. Captured artefacts still live in `%LOCALAPPDATA%/Temp/opencode/`; they are not
   in the repository.
