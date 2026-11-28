# Hero regression register - 70 hero cases + 40 delivery cases

Last reconciled: 2026-11-27 (DEL-01B, delivery sprint).

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

## N. Next Level Projects masthead + video aperture (10)

DEL-00.3C keeps the DEL-00.3B kinetic masthead and Animata aperture and replaces
the four-image slideshow with one persistent Creative Cat video. The section is
still mounted directly after the hero until Capabilities and Selected Work exist.
`e2e/project-aperture.js` was updated for video playback and continuity and passes
on dev (:3000) and production (:3100) with 0 failures on 2026-11-27; the cases
remain **D** under the delivery-sprint policy because the consolidated hero matrix
is not being rerun for this change.

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| NLP-01 | The section is one 190svh runway with one native sticky 100svh stage in enhanced mode; it adds exactly one section-local ScrollTrigger, keeps the hero trigger at 1, has no GSAP pin, no second Lenis, no extra RAF loop and exactly one video element; static/reduced/no-JS add no runway | `e2e/project-aperture.js`: 1440×900 section 1710, one sticky descendant, trigger 1, hero 1, Lenis 1; 1024×600 section 1140; 834×1194 section 914.1, 390×844 512.8 with 0 sticky and 0 triggers; one `<video>` per page; no legacy `[data-aperture-*]` parts | D |
| NLP-02 | Typography uses 0.01em positive tracking and a 14.1vw base; NEXT and LEVEL are separate fragments with a 0.16em gap; both rows are width-matched after font readiness without negative tracking, scaling or glyph compression; the CSS no-JS fallback is 0.933em | same: 1440 rows 1353.4/1353.4, top font 209.63px, bottom 195.63px, tracking 2.10px; 1024 rows 962.6/962.6; 390 rows 361.9/362.2; no-JS 1440 1311.5/1311, 390 355.2/355, 320 291.4/291.3; capsule clearance >4px each side | D |
| NLP-03 | NEXT LEVEL enters from the left and PROJECTS from the right with the demo's 30vw / `(1-p)^2` relationship; both settle, remain visible and reverse exactly; the complete masthead holds with the moving video capsule before the aperture | same: p0 ±432px at 1440, p15 ±108px, p31 0; both opacities 1 at rest; reverse restores 0; 1024 starts ±307.2px; capsule 371.7×148.7 unchanged through the entrance; the 0.31–0.418 hold shows the live capsule video | D |
| NLP-04 | The aperture starts from the actual measured capsule slider rectangle: clip insets and radius match the slider within 1.2px at rest, the clip grows from that rectangle, the radius releases, the ring fades and the shared full-stage media is revealed with no second crop or blank frame | same: 1440 rest clip `inset(499.77 762.34 295.33 349.75 round 52.45)` = slider 327.91×104.89; p60 clip 1269×511, radius 25.7; p85 clip `inset(0px)`; ring opacity 1→0; 1024 rest/full clip also matches; the video covers the rest rect and is within 0.2% of the full stage | D |
| NLP-05 | One persistent muted, looping, inline video is the entire showreel: its source is deferred until the section approaches the viewport, the poster covers the first frame, and the same DOM node plays through entrance, capsule, expansion, full stage and reverse with no clone, no second decoder, no seek, no restart and no scroll-driven `currentTime` | same: `video` count 1 at every state; `src: null` at page load, then `/video/creative-cat-showreel.mp4`; `poster` `/video/creative-cat-showreel-poster.webp`; muted/loop/playsInline true; node marker survives p40→p50→p60→p95; currentTime advances 2.75 → 5.5 across the aperture and 7.96 → loop on the full stage; reverse continues and never returns to 0; rapid scroll is monotonic apart from the loop wrap | D |
| NLP-06 | Headline fragments part and fade as the media opens; the stable portfolio caption then reads in word by word with a scrim, describing the studio rather than any project or verified client work; the accessible sentence is separate from the decorative words | same: at p60 PR/JECTS spread ±361px, NEXT/LEVEL ±124px, fragment opacities 0.03; caption opacity 0 at p60, 1 at p85–p100, q 0.34→1, three word opacities reveal progressively, scrim 0.23→1; caption is "01 / The Creative Cat Showreel", "Creativity in motion.", "Strategy. Design. Technology. Motion."; accessible line exact; no old project names | D |
| NLP-07 | The pointer lens remains an exact coral inversion of the aligned masthead, never clones the video or opens a second decoder, hides when the pointer enters the video capsule, and is disabled during the aperture; it returns only when the masthead is restored | same: 120px `rgb(255, 28, 67)`, clone delta 0.19px, inverted poster, `0` cloned videos, `pointer-events:none`, `aria-hidden`; visible over letters, hidden over the capsule, hidden after wheel/leave, hidden at p60, visible again at p31 reverse | D |
| NLP-08 | The showreel pauses offscreen, document-hidden, on route unmount and through the Showreel motion menu switch; the preference survives expansion and contraction; the playback position is preserved and the video never pauses because the aperture is travelling | same: menu switch `role="switch"` / `aria-checked`; paused currentTime stable to <0.05s over 2.6s at the full stage; pause survives p31 contraction and p95 re-expansion; unpause advances; offscreen and simulated document-hidden are stable; ribbon switch preserved; the aperture pass keeps playing | D |
| NLP-09 | Tablet, mobile, touch and short desktop windows use the natural-flow masthead + the same video + caption with the live poster capsule, readable tracking, no sticky/trigger and no overflow; reduced motion and no-JS show the aligned masthead, branded poster, caption and no playback | same: 834 rows 783.6/783.6, section 914.1; 1024×500 demotes to static (section 872.9, rows 962.6/962.6, trigger 0); 390 rows 361.9/362.2, section 512.8; one natural-flow video playing, no duplicate still; touch lens `display:none`; reduced 1440 section 1325.6, media hidden, poster visible, video unloaded and paused; no-JS 1440/390/320 rows within 0.5px, sections 1313.9/510.9/454; zero overflow | D |
| NLP-10 | The approved assets are served unmodified, light and dark themes keep the approved tokens, the sticky stage releases naturally, and the build and recording are clean | same: served showreel 7,120,424 bytes and SHA-256 `38098de3…257e4`; poster 200 `image/webp`; enhanced light top `rgb(21,14,52)` / bottom+border `rgb(99,19,57)` / transparent capsule; dark top white / bottom+border `rgb(182,175,203)`; static rim white light and midnight dark; stage 0 at p100 and −200 after 200px; `tsc`, scoped ESLint, `pnpm build` clean; dev + production 0 failures; recording 10.47s, 1440×900, 15fps, 3.95MB | D |

## O. Selected Projects gallery, Work index and project showcase (19)

DEL-01A supersedes the DEL-01 homepage presentation after owner review. The
homepage gallery is now a light/dark editorial section with a scroll-driven
circular Zero reveal, scrubbed whole-card movement, descriptions, tags and a
circular action button. DEL-01C replaces the archive covers with the owner's
canonical artwork; DEL-01D removes the hero project link, rebuilds the Work index
as an asymmetric archive and adds the intelligent navbar; DEL-01D.1 reduces the
archive artwork, restores theme-following surfaces and replaces the duplicate
contact button with an editorial closing; DEL-01D.2 gives every standalone
project the full 1200px measure in a cinematic frame and applies the owner's
local feature/pair sequence. The individual project showcase keeps its
presentation and receives artwork-fitting corrections only.
`e2e/selected-work.js` and `e2e/navbar-visibility.js` pass with 0 failures on dev
(:3000) on 2026-11-28; reports are under `tests/.local/out/`. The cases remain
**D** under the delivery-sprint policy because the consolidated hero matrix is
not being rerun.

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| SW-01 | The conventional introduction is gone: no eyebrow, headline, supporting paragraph, CTA or large pre-gallery block; the section still exposes one visually hidden semantic heading, has no video of its own, and follows the showreel aperture directly | `e2e/selected-work.js`: no `[data-sw-intro]`; h2 "Selected projects" is 1px/1px with `inset(50%)`; section text contains no "A little bold", "Explore All Works" or project total; zero `<video>` inside the gallery; aperture still has its one showreel | D |
| SW-02 | The two section-local surfaces are exact and clearly distinct from the midnight showreel: light #F7F6F3 with midnight ink, dark #241B3C with white ink, coral interaction and theme-following support text | same: light `rgb(247,246,243)` / `rgb(21,14,52)`; dark `rgb(36,27,60)` / `rgb(255,255,255)`; no global token changed | D |
| SW-03 | Seven canonical projects in the owner's homepage order: Zero opening, Right Sight left, Exciting Sundarban staggered right, Splash Shine large right, GDRI staggered left, Project WE staggered right, Urbancut centred closing; DOM order is visual and keyboard order | same: 1440 opening 1088.6 wide centred; Right Sight 639.4 at the 63.4 gutter; Sundarban 527 at 737 with a 173px stagger; Splash 864 right-aligned at 512; GDRI 527 / Project WE 414.7 with a 158px stagger; Urbancut 864 centred (288/288); tablet two columns, mobile one | D |
| SW-04 | Every card carries authentic artwork, the canonical name, a concise factual description and informational tags; no scope, stack, metric, year, client or result is invented | same: entries read "Brand identity and education collateral, from brand kit to lanyards.", "Print design and brand collateral for Splash n Shine Carwash.", "Brand identity for the Global Development & Research Initiative.", "Social media artwork from the Project WE education story.", "Brand identity and lifestyle imagery for Urbancut Salon."; tags are Brand identity / Education / Branding / Print design / Brand collateral / Social media / Lifestyle; all are supported by the artwork, live portfolio or canonical category | D |
| SW-05 | The circular opening is genuinely scroll-driven: a small circle at entry expands through measurable intermediate radii to a full rectangle whose radius covers all four corners; the caption arrives with the artwork and reverse scrolling contracts both | same: desktop start circle(75px); mid circle(332px); full circle(616.7px) against a 608.6px half-diagonal; caption hidden at start and visible at full; reverse returns to circle(75px) and hides the caption; mobile start 28px and full 229.4px | D |
| SW-06 | The whole project unit moves as one scrubbed card: 120-140px vertical travel, opposing horizontal offsets, 2.2-3.6 degree rotation, converging to an unrotated identity; reverse scrolling reverses it; the grid item itself stays untransformed so ScrollTrigger positions stay stable | same: desktop start y 112, x -56, rotate -2.99 on GDRI; settles y 0 / x 0 / rotate 0; Project WE settles on its own trigger; no toggle-driven entrance | D |
| SW-07 | Motion layers do not compete: whole-card movement, hover lift, internal image drift/zoom and action-button animation each own a separate element or property; no pin, second Lenis, RAF loop or per-frame React state | same: `[data-sw-card]` GSAP movement, `[data-sw-shell]` CSS lift, `[data-sw-parallax]` GSAP drift, `[data-sw-image]` CSS zoom, `[data-sw-action]` CSS; drift is 2.8% and desktop-only; section triggers are section-local; one root Lenis | D |
| SW-08 | Fine-pointer hover and keyboard focus are premium and restrained: the whole card lifts 8px, the image zooms to 1.045, the action circle turns coral and rotates/scales, and everything recovers; the card is one semantic link with no nested controls | same: shell translateY(-8px), image `matrix(1.045)`, action `rgb(255,28,67)` + rotation; recovery to identity; focus-visible outline 2px `rgb(255,28,67)`; 0 nested links/buttons per card; touch users activate the link without hover | D |
| SW-09 | Artwork presentation is honest and canonical: one owner-supplied `cover.png` per project, no obsolete alternate, no stale override, and the artwork's own ratio is respected; Zero's 1672x941 opening fills its 2:1 frame, square covers fill 1:1, and no sampled background colour remains | same: ten 1254x1254 and three 1672x941 covers; Zero `object-fit: cover` with no #F1521E; Splash Shine/Urbancut 1:1; all homepage URLs carry `?v=20261128`; obsolete `glimpse.jpg`/`aperture.jpg`/`capsule.jpg` archived and removed | D |
| SW-10 | DEL-01D supersedes the frozen Work grid, DEL-01D.1 refines it and DEL-01D.2 makes the standalone projects cinematic: `/work` is a theme-following editorial archive with a full-width-feature / staggered-pair rhythm, a local presentation order, a single semantic link per card, hover zoom, an editorial closing and no project total; the canonical collection and the homepage gallery do not leak into it | same: 9 rows (five full-width features alternating with four pairs); 13/13 cards exactly once; 1440 light paper/midnight and dark midnight/white; 834 features+pairs; 390 single column; no contact CTA before the footer; no `[data-selected-work]` | D |
| SW-11 | The project showcases stay frozen: every valid slug resolves, an unknown slug is a deterministic 404, and Back to Work plus canonical Next Project (wrapping 13 -> 01) still work | same: all 13 `/work/<slug>` requests 200; `/work/not-a-project` 404; Right Sight "01 / 13" next Zero; Yogic Rhythm next Right Sight; `ensureStatic` + `instant = false` unchanged | D |
| SW-12 | The header surface is correct on both section themes with no boundary mismatch: theme-following `inherit` gives midnight navigation on the light gallery and white navigation on the plum gallery | same: `data-surface="inherit"`; nav `rgb(21,14,52)` light and `rgb(255,255,255)` dark; archive/detail remain theme-following | D |
| SW-13 | Tablet, mobile, reduced motion and no-JS keep a complete, usable gallery: two columns on tablet with reduced movement, one column on mobile with a 4:3 opening and vertical-only movement, fully visible untransformed cards under reduced motion, and all links visible without JavaScript; zero overflow | same: 834 two columns, tablet strength 0.55; 390 one 354px column, 4:3 opening, 38px vertical-only entry; reduced motion `off`, clip none, transform none, 0 section triggers; no-JS 1440/390 clip none, all seven captions and links visible; no overflow in any state | D |
| SW-14 | The visible project-total cleanup is applied on the homepage without touching indexing: the hero counter shows the position only (`01`), `WORK_PROJECT_COUNT` and all internal collection logic remain, and the deferred Work-page counts are recorded rather than redesigned | same: `[data-hero-meta-count]` is "01"; section text has no total; `WORK_PROJECT_COUNT` still exported and consumed by hero narrative/aperture logic; `/work` "13 projects" and detail "of 13" remain for the deferred pass | D |
| SW-15 | The opening Zero project is protected: it has no perspective wrapper or panel, no new handlers, and its circular reveal, caption, arrow action, lift/zoom hover and responsive behaviour are unchanged | same: Zero is `data-sw-variant="opening"`, no `[data-sw-perspective]`/`[data-sw-panel]`, action icon "arrow"; start/mid/full circle 75/332/616.7px, reverse returns to 75px; hover shell -8px, image 1.045, action coral + rotated arrow; mobile 4:3 reveal unchanged | D |
| SW-16 | Only the six subsequent projects carry the explicit perspective variant and the white-plus/coral action, with no fragile nth-child or positional selector | same: Right Sight, Exciting Sundarban, Splash Shine, GDRI, Project WE and Urbancut are `data-sw-variant="perspective"` with `[data-sw-perspective] > [data-sw-panel]` and a plus icon; Zero is the only opening variant | D |
| SW-17 | Fine-pointer hover applies a 3D rotation to the complete artwork panel: perspective 1000px, rotateY 8deg, rotateX 1.5deg, origin bottom, 550ms in / 650ms out power3.out; the action moves with the panel, captions stay stationary, neighbours are untouched and the panel returns to identity | same: panel matrix3d on Right Sight/Sundarban/Splash; action rect moves with the panel; info rect unchanged to <0.6px; neighbour panel identity; recovery matrix identity; no shell lift and no image zoom | D |
| SW-18 | The perspective interaction is fine-pointer only: touch receives no tilt, reduced motion creates no panel rotation, keyboard focus keeps the coral outline/action feedback, no-JS shows complete panels, and no state creates horizontal overflow | same: mobile `(hover:hover) and (pointer:fine)` false and panel identity; reduced hover leaves panel identity; focus outline 2px coral; no-JS six panels identity/visible; zero overflow at every hover state | D |
| SW-19 | TypeScript, scoped ESLint, production build, `git diff --check`, the preserved aperture suite and the delivery recording are clean | same: `tsc`, ESLint, production build, selected-work 0 failures dev/production, aperture 0 failures production, diff check exit 0; recordings regenerated for the final build | D |

## P. Canonical artwork, Work archive and intelligent navbar (DEL-01C-B / DEL-01D)

| ID | Case | Evidence / script | Status |
|---|---|---|---|
| SW-20 | One authoritative `cover.png` per canonical project exists and the obsolete alternates are gone: ten 1254x1254 covers and Zero/Zero Blind Spots/Yogic Rhythm at 1672x941; every file decodes; `lib/work.ts` uses the actual dimensions and no `artwork` override; the five old JPEGs are archived outside the repository | source + filesystem audit: 13 canonical covers, 0 obsolete files; `glimpse.jpg`/`aperture.jpg`/`capsule.jpg` absent; archive at `%TEMP%/opencode/del01d/obsolete-assets`; `getWorkArtwork` removed | D |
| SW-21 | The Work archive is a theme-following editorial composition, reclaims the full gallery measure for every standalone project and keeps the pair rhythm: Right Sight, pair, Zero, pair, Zero Blind Spots, pair, OralShine, pair, Yogic Rhythm; features share the 1200px boundaries, pairs keep their ten-track inset and stagger, and only the presentation order changes while `WORK_PROJECTS` stays canonical | `e2e/selected-work.js` archive block: 9 rows; 13 cards; order permutation check; light `rgb(255,255,255)`/`rgb(21,14,52)` and dark `rgb(21,14,52)`/white; 1920/1024/834 features full width with side-by-side pairs; 390 one column; no total text; overflow false | D |
| SW-22 | Artwork hover is a smooth in-frame zoom: resting 1, hover 1.055 over 520ms with `cubic-bezier(0.22,1,0.36,1)`; frame, caption, tags and neighbours stay fixed; departure recovers to identity; the arrow shifts diagonally and turns coral; no 3D perspective is applied | same: image `matrix(1.055)`; caption rect unchanged <0.6px; neighbour identity; recovery identity; no panel wrapper on `/work` | D |
| SW-23 | DEL-01D.1 replaces the duplicate contact block with a compact editorial closing: "THE NEXT CHAPTER", "Your idea could be next.", "Every great project begins somewhere.", a divider and coral punctuation, with no form and no contact button; the shared footer keeps the primary "Let's talk" action | same: `[data-work-closing]` present; 0 links inside it; 0 `/contact` links anywhere before the footer; 2 footer contact actions; closing copy matches; footer untouched | D |
| SW-24 | The navbar hides on sustained downward scroll and reveals on upward scroll using document position and an 8px accumulated direction tolerance; it stays visible in the top 80px, while stopped, while the menu is open or retracting, while focus is inside it and after route changes; rapid reversals settle in a whole state; progress moves with the bar; reduced motion and no-JS keep it visible | `e2e/navbar-visibility.js`: hidden y -77, stop stable, 20px up reveals, 6px jitter stable, rapid reversal settles, menu/focus/route exceptions pass, progress matches, Work surface `inherit` in both themes, reduced/no-JS visible, mobile touch swipe hides then reveals; 0 failures dev and production | D |
| SW-25 | The hero has no VIEW PROJECT interaction: no focal link layer, coral circle, hover scrim, image push-in, hidden activation target or leftover eligibility code; the CTAs, cat, corridor, scroll narrative and 500svh story budget are unchanged | source + browser: `[data-hero-project-link]`/`[data-hero-project-layer]` count 0; no `:has()` art scale; `projectLinkEligible`/`HAS_WORK_DESTINATIONS` removed; `START A PROJECT`/`VIEW SELECTED WORK` and hero trigger remain | D |
| SW-26 | Stale artwork cannot return through the optimizer: every canonical cover request carries the stable `?v=20261128` revision, `images.localPatterns` allows exactly that search for `/work/**` plus the unversioned Cat posters, and a fresh production build serves the current WebP variants at the canonical aspect ratios | dev + fresh production: 13/13 direct cover SHA-256 match disk; 65/65 optimized WebP variants at 384/640/750/828/1200 have canonical dimensions; versioned URL returns 200 (no `"url" parameter is not allowed`); no obsolete or unversioned `/work/` refs in the Work HTML; `pnpm build` 21/21 pages | D |
| SW-27 | DEL-01D.2 gives each standalone project the complete 1200px measure in a cinematic frame without distortion: square sources use 15:7 (560px tall) and landscape sources 30:11 (440px tall) at 1440, with artwork-specific focal points; pairs stay 467px at their native ratio, titles stay 24-32px, descriptions 13.5-15px and tags 10-12px; mobile falls back to native ratios | `e2e/selected-work.js`: all five features 1200x560/1200x440 sharing the gallery left/right; positions 50% 38% / 50% 17% / 50% 45% / 50% 45% / 50% 35%; pairs 467.3 + 60.5px stagger + 104.7px inset; document 8155; 1920 1200x560/440, 1024 928x433/340, 834 762x356/279, 390 native 350x350/197 | D |
| SW-28 | The DEL-01D.2 sequence is local to `/work` and does not re-sort canonical data: visual, DOM and keyboard order are the same permutation, every project appears exactly once, and the hero corridor, homepage Selected Projects and Next Project navigation keep the canonical collection order | `e2e/selected-work.js`: archive order Right Sight → Sundarban/Splash → Zero → GDRI/WE → Zero Blind Spots → Dipakkhik/Urbancut → OralShine → FLEX/Elegantic → Yogic; 13 unique; `lib/work.ts` untouched; routes 13/13; hero/aperture contract and canonical next-project checks unchanged | D |

**Totals:** 58 currently verified, 10 historically passed, 50 deferred, 1 not yet
tested, 0 failed.

- 70 hero rows: 6+6+6+7+5+5+6+5+10+8+3+3.
- 49 delivery rows: NL-01…NL-11, NLP-01…NLP-10, SW-01…SW-28 (all deferred).


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
| `e2e/project-aperture.js` | NLP-01…NLP-10 | DEL-00.3C opposing entrance, 0.01em tracking/width match, measured capsule aperture, one persistent video playing through expansion/reverse, deferred source and poster, stable caption, lens gating, pause lifecycle, asset hash, themes, sticky release, responsive/reduced/no-JS/touch and overflow. |
| `e2e/project-aperture-recording.js` | NLP-05, NLP-06, NLP-10 | 10.5s, 15fps MP4 of headline entrance → moving capsule → aperture expansion with playback → full-stage moving reel → exit. |
| `e2e/selected-work.js` | SW-01…SW-23, SW-25, SW-27, SW-28 | DEL-01A circular Zero reveal + DEL-01B fine-pointer 3D artwork-panel hover on the six subsequent projects, with Zero isolation, stationary captions, touching action, both surfaces, tablet/mobile/coarse-pointer/reduced/no-JS, the DEL-01D.2 full-width Work archive and local sequence, cinematic features, hover zoom, the editorial closing, routes and hero/aperture preservation (including the removed hero link). |
| `e2e/navbar-visibility.js` | SW-24 | Desktop hide/reveal, stop stability, 8px jitter tolerance, rapid reversal, menu open/close grace, focus reveal, route change, progress synchronization, the Work surface in both themes, reduced motion, no-JS and real mobile touch swipes. |
| `e2e/selected-work-recording.js` | SW-15, SW-17, SW-18 | 28.5s, 15fps MP4 from the showreel stage through the unchanged Zero reveal, alternating Right Sight/Sundarban perspective hovers, Splash perspective, recovery and the return to Zero. |
| `e2e/work-archive-recording.js` | SW-21, SW-22, SW-24, SW-27, SW-28 | Short 1440x900 MP4: theme-following archive scroll through the full-width feature / staggered pair sequence, artwork hover zoom and recovery, navbar hide/reveal, and the editorial closing. |

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
