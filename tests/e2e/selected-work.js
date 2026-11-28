/*
 * DEL-01A â€” Immersive homepage Selected Projects.
 *
 * Read-only verification against the running site. Covers the circular Zero
 * reveal (small / mid / full / reverse), the scrubbed whole-card movement, the
 * asymmetric composition, the captions and tags, hover and keyboard focus, the
 * two section surfaces, tablet/mobile, reduced motion and no-JS, the frozen
 * Work index and project routes, and the preserved hero/aperture contract.
 *
 * The `window.__selectedWork` accessor is development-only; production reads use
 * DOM, computed styles and scroll positions only.
 *
 * Usage: HERO_BASE_URL=http://localhost:3000/ node tests/e2e/selected-work.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const OUT = out("selected-work");

const FEATURED = [
  { slug: "zero", name: "Zero", layout: "opening", variant: "opening", tags: ["Branding"] },
  {
    slug: "right-sight",
    name: "Right Sight",
    layout: "left-1",
    variant: "perspective",
    tags: ["Brand identity", "Education"],
  },
  {
    slug: "exciting-sundarban",
    name: "Exciting Sundarban",
    layout: "right-1",
    variant: "perspective",
    tags: ["Branding"],
  },
  {
    slug: "splash-shine",
    name: "Splash Shine",
    layout: "feature-right",
    variant: "perspective",
    tags: ["Print design", "Brand collateral"],
  },
  {
    slug: "gdri",
    name: "GDRI",
    layout: "left-2",
    variant: "perspective",
    tags: ["Branding"],
  },
  {
    slug: "project-we",
    name: "Project WE",
    layout: "right-2",
    variant: "perspective",
    tags: ["Social media"],
  },
  {
    slug: "urbancut",
    name: "Urbancut",
    layout: "closing",
    variant: "perspective",
    tags: ["Brand identity", "Lifestyle"],
  },
];

const ALL = [
  "right-sight",
  "zero",
  "exciting-sundarban",
  "splash-shine",
  "gdri",
  "project-we",
  "zero-blind-spots",
  "dipakkhik",
  "urbancut",
  "oralshine",
  "flex",
  "elegantic",
  "yogic-rhythm",
];

// DEL-01D.2 — the /work presentation order. It is local to the archive; `ALL`
// above stays the canonical collection order used by the hero and Next Project.
const WORK_ORDER = [
  "right-sight",
  "exciting-sundarban",
  "splash-shine",
  "zero",
  "gdri",
  "project-we",
  "zero-blind-spots",
  "dipakkhik",
  "urbancut",
  "oralshine",
  "flex",
  "elegantic",
  "yogic-rhythm",
];

const failures = [];
const results = {};

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const near = (actual, expected, tolerance) =>
  Math.abs(actual - expected) <= tolerance;

const radiusOf = (clip) => {
  if (!clip || clip === "none") return null;
  const match = /circle\(([\d.]+)px/.exec(clip);
  return match ? Number(match[1]) : null;
};

const scaleOf = (transform) => {
  const match = /matrix\(([^)]+)\)/.exec(transform || "");
  if (!match) return 1;
  return Number.parseFloat(match[1].split(",")[0]) || 0;
};

const isIdentityTransform = (transform) => {
  if (!transform || transform === "none") return true;
  const match = /matrix\(([^)]+)\)/.exec(transform);
  if (!match) return false;
  const [a, b, , , e, f] = match[1].split(",").map(Number);
  return (
    Math.abs(a - 1) < 0.001 &&
    Math.abs(b) < 0.001 &&
    Math.abs(e) < 0.001 &&
    Math.abs(f) < 0.001
  );
};

const READ = () => {
  const root = document.querySelector("[data-selected-work]");
  const rectOf = (element) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      left: +rect.left.toFixed(2),
      top: +rect.top.toFixed(2),
      width: +rect.width.toFixed(2),
      height: +rect.height.toFixed(2),
      right: +rect.right.toFixed(2),
      bottom: +rect.bottom.toFixed(2),
    };
  };

  const matrixOf = (element) => {
    if (!element) return null;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return {
      x: +matrix.m41.toFixed(2),
      y: +matrix.m42.toFixed(2),
      scale: +matrix.a.toFixed(4),
      rotate: +((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI).toFixed(2),
    };
  };

  const isIdentity = (value) => {
    if (!value || value === "none") return true;
    try {
      return new DOMMatrixReadOnly(value).isIdentity;
    } catch {
      return false;
    }
  };

  const items = root
    ? [...root.querySelectorAll("[data-sw-item]")].map((element) => {
        const card = element.querySelector("[data-sw-card]");
        const link = element.querySelector("[data-sw-link]");
        const media = element.querySelector("[data-sw-media]");
        const image = element.querySelector("[data-sw-image]");
        const info = element.querySelector("[data-sw-info]");
        const action = element.querySelector("[data-sw-action]");
        const panel = element.querySelector("[data-sw-panel]");
        const shell = element.querySelector("[data-sw-shell]");
        const panelTransform = panel
          ? getComputedStyle(panel).transform
          : null;
        return {
          slug: element.getAttribute("data-sw-slug"),
          layout: element.getAttribute("data-sw-item"),
          variant: card?.getAttribute("data-sw-variant") ?? null,
          hasPerspective: Boolean(element.querySelector("[data-sw-perspective]")),
          hasPanel: Boolean(panel),
          panelTransform,
          panelIdentity: isIdentity(panelTransform),
          shellTransform: shell ? getComputedStyle(shell).transform : null,
          rect: rectOf(element),
          offset: {
            left: element.offsetLeft,
            top: element.offsetTop,
            width: element.offsetWidth,
            height: element.offsetHeight,
          },
          media: rectOf(media),
          mediaSize: media
            ? { width: media.offsetWidth, height: media.offsetHeight }
            : null,
          clip: media ? getComputedStyle(media).clipPath : null,
          transform: matrixOf(card),
          name: card?.querySelector("[data-sw-name]")?.textContent ?? null,
          description: card?.querySelector("[data-sw-desc]")?.textContent ?? null,
          tags: card?.querySelector("[data-sw-tags]")?.textContent ?? null,
          href: link?.getAttribute("href") ?? null,
          label: link?.getAttribute("aria-label") ?? null,
          interactiveChildren: element.querySelectorAll(
            "a a, button, input, select, textarea, [tabindex]",
          ).length,
          info: info
            ? {
                opacity: +(
                  Number(getComputedStyle(info).opacity) || 0
                ).toFixed(3),
                visibility: getComputedStyle(info).visibility,
                transform: matrixOf(info),
                rect: rectOf(info),
              }
            : null,
          image: image
            ? {
                src: image.getAttribute("src"),
                currentSrc: image.currentSrc,
                complete: image.complete,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
                fit: getComputedStyle(image).objectFit,
                position: getComputedStyle(image).objectPosition,
                transform: getComputedStyle(image).transform,
              }
            : null,
          action: action
            ? {
                width: +action.getBoundingClientRect().width.toFixed(1),
                background: getComputedStyle(action).backgroundColor,
                transform: getComputedStyle(action).transform,
                icon: action.getAttribute("data-sw-action-icon"),
                iconTransform: getComputedStyle(
                  action.querySelector("svg"),
                ).transform,
                rect: rectOf(action),
              }
            : null,
        };
      })
    : [];

  const sectionRect = root?.getBoundingClientRect();
  const heading = root?.querySelector("h2");
  const archive = document.querySelector("[data-work-archive]");
  const workPage = document.querySelector("[data-work-page]");
  const archiveCards = archive
    ? [...archive.querySelectorAll("[data-work-card]")].map((card) => {
        const frame = card.querySelector("[data-work-frame]");
        const image = card.querySelector("[data-work-image]");
        const frameRect = rectOf(frame);
        return {
          name: card.querySelector("[data-work-name]")?.textContent ?? null,
          href: card.querySelector("a")?.getAttribute("href") ?? null,
          layout: card.getAttribute("data-work-layout"),
          shape: card.getAttribute("data-work-shape"),
          nameSize: card.querySelector("[data-work-name]")
            ? getComputedStyle(card.querySelector("[data-work-name]")).fontSize
            : null,
          frame: frameRect,
          ratio:
            frameRect && frameRect.height
              ? +(frameRect.width / frameRect.height).toFixed(3)
              : null,
          src: image?.getAttribute("src") ?? null,
          currentSrc: image?.currentSrc ?? null,
          fit: image ? getComputedStyle(image).objectFit : null,
          position: image ? getComputedStyle(image).objectPosition : null,
          description:
            card.querySelector("[data-work-description]")?.textContent ?? null,
          tags: [...card.querySelectorAll("[data-work-tag]")].map(
            (tag) => tag.textContent,
          ),
        };
      })
    : [];
  const detail = document.querySelector("[data-project-detail]");
  const header = document.querySelector("header[data-surface]");
  const video = document.querySelector("[data-next-level] video");

  return {
    exists: Boolean(root),
    section: root
      ? {
          top: +((sectionRect?.top ?? 0) + window.scrollY).toFixed(1),
          height: +(sectionRect?.height ?? 0).toFixed(1),
          background: getComputedStyle(root).backgroundColor,
          color: getComputedStyle(root).color,
          overflow: getComputedStyle(root).overflow,
          paddingLeft: +Number.parseFloat(
            getComputedStyle(root).paddingLeft,
          ).toFixed(1),
          motion: root.dataset.swMotion ?? null,
          headingCount: root.querySelectorAll("h2").length,
          id: root.id,
          text: root.innerText,
          hasIntro: Boolean(root.querySelector("[data-sw-intro]")),
        }
      : null,
    heading: heading
      ? {
          text: heading.textContent,
          width: +heading.getBoundingClientRect().width.toFixed(1),
          height: +heading.getBoundingClientRect().height.toFixed(1),
          clip: getComputedStyle(heading).clipPath,
          position: getComputedStyle(heading).position,
        }
      : null,
    gallery: (() => {
      const gallery = root?.querySelector("[data-sw-gallery]");
      return gallery
        ? {
            columns: getComputedStyle(gallery).gridTemplateColumns,
            width: +gallery.getBoundingClientRect().width.toFixed(1),
            offsetLeft: gallery.offsetLeft,
            offsetWidth: gallery.offsetWidth,
          }
        : null;
    })(),
    items,
    archive: archive
      ? {
          count: archiveCards.length,
          cards: archiveCards,
          rows: [...archive.querySelectorAll("[data-work-row]")].map((row) =>
            row.getAttribute("data-work-row-layout"),
          ),
          pageBackground: workPage
            ? getComputedStyle(workPage).backgroundColor
            : null,
          pageColor: workPage ? getComputedStyle(workPage).color : null,
          hasClosing: Boolean(archive.querySelector("[data-work-closing]")),
          closingText:
            archive.querySelector("[data-work-closing]")?.innerText ?? null,
          closingLinks:
            archive.querySelector("[data-work-closing]")?.querySelectorAll("a")
              .length ?? 0,
          contactLinks: document.querySelectorAll(
            "[data-work-page] a[href='/contact']",
          ).length,
          tagSize: archive.querySelector("[data-work-tag]")
            ? getComputedStyle(archive.querySelector("[data-work-tag]"))
                .fontSize
            : null,
          descriptionSize: archive.querySelector("[data-work-description]")
            ? getComputedStyle(
                archive.querySelector("[data-work-description]"),
              ).fontSize
            : null,
          text: archive.innerText,
          gallery: (() => {
            const gallery = archive.querySelector("[data-work-gallery]");
            if (!gallery) return null;
            const rect = gallery.getBoundingClientRect();
            return {
              left: +rect.left.toFixed(2),
              right: +rect.right.toFixed(2),
              width: +rect.width.toFixed(2),
            };
          })(),
        }
      : null,
    detail: detail
      ? {
          title: detail.querySelector("h1")?.textContent ?? null,
          meta:
            detail
              .querySelector("[data-project-meta]")
              ?.textContent?.replace(/\s+/g, " ")
              .trim() ?? null,
          back: detail.querySelector('a[href="/work"]')?.textContent
            ?.replace(/\s+/g, " ")
            .trim() ?? null,
          next: detail
            .querySelector("[data-project-next]")
            ?.getAttribute("href"),
        }
      : null,
    header: header
      ? {
          surface: header.getAttribute("data-surface"),
          color: getComputedStyle(header).color,
        }
      : null,
    hero: {
      linkCount: document.querySelectorAll("[data-hero-project-link]").length,
      layerCount: document.querySelectorAll("[data-hero-project-layer]").length,
      metaCount:
        document.querySelector("[data-hero-meta-count]")?.textContent ?? null,
      trigger:
        typeof window.__heroStory?.triggers === "function"
          ? window.__heroStory.triggers()
          : null,
    },
    aperture: {
      videoCount: document.querySelectorAll("[data-next-level] video").length,
      videoPaused: video?.paused ?? null,
      videoSrc: video?.getAttribute("src") ?? null,
      trigger:
        typeof window.__nextLevelProjects?.triggers === "function"
          ? window.__nextLevelProjects.triggers()
          : null,
    },
    selectedWorkTriggers:
      typeof window.__selectedWork?.triggers === "function"
        ? window.__selectedWork.triggers()
        : null,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  };
};

async function open(browser, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1440, height: 900 },
    colorScheme: options.theme || "light",
    reducedMotion: options.reduced ? "reduce" : "no-preference",
    javaScriptEnabled: options.js !== false,
    hasTouch: options.touch || false,
    isMobile: options.touch || false,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(options.url || BASE, { waitUntil: "networkidle" });
  if (options.js !== false) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
  } else {
    await page.waitForTimeout(700);
  }
  return { context, page, errors };
}

async function scrollTo(page, top) {
  await page.evaluate((value) => {
    const lenis = window.__heroLenis?.instance?.();
    if (lenis) lenis.scrollTo(value, { immediate: true, force: true });
    else window.scrollTo({ top: value, behavior: "instant" });
  }, top);
  await page.waitForTimeout(1000);
}

/**
 * The content top of a card, independent of the entrance transform.
 * `offsetTop` is relative to the positioned section, and scrolling never
 * changes it, so trigger positions stay stable between measurements.
 */
async function layoutTop(page, slug) {
  return page.evaluate((target) => {
    const section = document.querySelector("[data-selected-work]");
    const element = document.querySelector(`[data-sw-slug="${target}"]`);
    if (!section || !element) return window.scrollY;
    return section.getBoundingClientRect().top + window.scrollY + element.offsetTop;
  }, slug);
}

async function waitForCardImage(page, slug, timeout = 9000) {
  await page
    .waitForFunction(
      (target) => {
        const image = document.querySelector(
          `[data-sw-slug="${target}"] img`,
        );
        return Boolean(image && image.complete && image.naturalWidth > 0);
      },
      slug,
      { timeout },
    )
    .catch(() => {});
}

async function runHomeDesktop(browser) {
  const { context, page, errors } = await open(browser);
  const tag = "1440x900-light";
  const state = await page.evaluate(READ);

  check(state.exists, `${tag}: Selected Projects section missing`);
  check(
    state.section?.id === "selected-work",
    `${tag}: section id ${state.section?.id}`,
  );
  check(
    state.section?.background === "rgb(247, 246, 243)",
    `${tag}: light gallery background ${state.section?.background}`,
  );
  check(
    state.section?.color === "rgb(21, 14, 52)",
    `${tag}: light gallery ink ${state.section?.color}`,
  );
  check(
    state.section?.overflow === "clip",
    `${tag}: gallery overflow ${state.section?.overflow}`,
  );
  check(
    state.section?.headingCount === 1,
    `${tag}: expected one semantic heading`,
  );
  check(
    state.heading?.text === "Selected projects" &&
      state.heading.width <= 2 &&
      state.heading.height <= 2,
    `${tag}: heading is not visually hidden (${JSON.stringify(state.heading)})`,
  );
  check(
    state.section?.hasIntro === false,
    `${tag}: the removed introductory block is still rendered`,
  );
  check(
    !/Explore All Works|A little bold|A lot of character|13 projects/i.test(
      state.section?.text ?? "",
    ),
    `${tag}: removed introduction or project total is still visible`,
  );
  check(
    state.items.length === 7,
    `${tag}: card count ${state.items.length}`,
  );
  check(state.overflowX === false, `${tag}: horizontal overflow`);

  FEATURED.forEach((expected, index) => {
    const item = state.items[index];
    check(item?.slug === expected.slug, `${tag}: card ${index} slug ${item?.slug}`);
    check(
      item?.layout === expected.layout,
      `${tag}: card ${index} layout ${item?.layout}`,
    );
    check(
      item?.variant === expected.variant,
      `${tag}: card ${index} variant ${item?.variant}`,
    );
    check(
      expected.variant === "opening"
        ? item?.hasPerspective === false && item?.hasPanel === false
        : item?.hasPerspective === true && item?.hasPanel === true,
      `${tag}: card ${index} perspective structure ${JSON.stringify({
        perspective: item?.hasPerspective,
        panel: item?.hasPanel,
      })}`,
    );
    check(
      item?.action?.icon === (expected.variant === "opening" ? "arrow" : "plus"),
      `${tag}: card ${index} action icon ${item?.action?.icon}`,
    );
    check(item?.name === expected.name, `${tag}: card ${index} name ${item?.name}`);
    check(
      item?.href === `/work/${expected.slug}`,
      `${tag}: card ${index} href ${item?.href}`,
    );
    check(
      item?.label === `View ${expected.name} project`,
      `${tag}: card ${index} label ${item?.label}`,
    );
    check(
      item?.interactiveChildren === 0,
      `${tag}: card ${index} has nested controls`,
    );
    check(
      Boolean(item?.description && item.description.length > 12),
      `${tag}: card ${index} description ${item?.description}`,
    );
    check(
      expected.tags.every((value) => item?.tags?.includes(value)),
      `${tag}: card ${index} tags ${item?.tags}`,
    );
    check(
      item?.action?.background === "rgb(255, 255, 255)",
      `${tag}: card ${index} action ${item?.action?.background}`,
    );
    check(
      (item?.action?.width ?? 0) >= 40,
      `${tag}: card ${index} action is ${item?.action?.width}px`,
    );
  });

  // Composition: large centred opening, left feature, staggered right feature,
  // large right-aligned feature, staggered left/right pair, centred closing.
  const [zero, rightSight, sundarban, splash, gdri, projectWe, urbancut] =
    state.items;
  const contentLeft = state.section.paddingLeft;

  // DEL-01C: the new canonical artwork keeps its own ratio. Zero is 2:1 on
  // desktop; the square Splash Shine and Urbancut covers fill 1:1 frames.
  check(
    near(zero.mediaSize.width / zero.mediaSize.height, 2, 0.02),
    `${tag}: Zero opening is not 2:1 (${zero.mediaSize.width}/${zero.mediaSize.height})`,
  );
  check(
    near(splash.mediaSize.width / splash.mediaSize.height, 1, 0.02),
    `${tag}: Splash Shine is not square (${splash.mediaSize.width}/${splash.mediaSize.height})`,
  );
  check(
    near(urbancut.mediaSize.width / urbancut.mediaSize.height, 1, 0.02),
    `${tag}: Urbancut is not square (${urbancut.mediaSize.width}/${urbancut.mediaSize.height})`,
  );
  const contentRight =
    contentLeft + (state.gallery?.offsetWidth ?? 0);

  check(
    zero.offset.width < state.gallery.offsetWidth * 0.95 &&
      zero.offset.width > state.gallery.offsetWidth * 0.75,
    `${tag}: opening feature width ${zero.offset.width}/${state.gallery.offsetWidth}`,
  );
  check(
    near(
      zero.offset.left - contentLeft,
      contentRight - (zero.offset.left + zero.offset.width),
      18,
    ),
    `${tag}: opening feature is not centred`,
  );
  check(
    near(rightSight.offset.left, contentLeft, 18),
    `${tag}: Right Sight is not on the left (${rightSight.offset.left})`,
  );
  check(
    sundarban.offset.left > rightSight.offset.left + rightSight.offset.width,
    `${tag}: first pair overlaps`,
  );
  check(
    sundarban.offset.top > rightSight.offset.top + 80,
    `${tag}: first pair is not staggered (${rightSight.offset.top}/${sundarban.offset.top})`,
  );
  check(
    splash.offset.left > rightSight.offset.left + 150 &&
      splash.offset.width > rightSight.offset.width,
    `${tag}: Splash Shine is not a large right feature`,
  );
  check(
    near(splash.offset.left + splash.offset.width, contentRight, 18),
    `${tag}: Splash Shine is not right-aligned (${splash.offset.left + splash.offset.width}/${contentRight})`,
  );
  check(
    gdri.offset.left > contentLeft + 40 &&
      gdri.offset.left + gdri.offset.width < projectWe.offset.left,
    `${tag}: second pair overlaps`,
  );
  check(
    projectWe.offset.top > gdri.offset.top + 60,
    `${tag}: second pair is not staggered (${gdri.offset.top}/${projectWe.offset.top})`,
  );
  check(
    near(
      urbancut.offset.left - contentLeft,
      contentRight - (urbancut.offset.left + urbancut.offset.width),
      18,
    ),
    `${tag}: closing feature is not centred`,
  );
  check(
    urbancut.offset.width > splash.offset.width * 0.9,
    `${tag}: closing feature width ${urbancut.offset.width}`,
  );

  // Circular opening: small start, mid expansion, full rectangle, caption.
  const zeroTop = await layoutTop(page, "zero");
  await scrollTo(page, zeroTop - 0.6 * 900);
  const small = await page.evaluate(READ);
  const smallZero = small.items[0];
  const smallRadius = radiusOf(smallZero.clip);
  check(
    smallRadius !== null && smallRadius <= 120,
    `${tag}: opening did not start small (${smallZero.clip})`,
  );
  check(
    smallZero.info?.visibility === "hidden",
    `${tag}: opening caption is visible before the artwork`,
  );
  check(small.overflowX === false, `${tag}: overflow at opening start`);
  await page.screenshot({ path: path.join(OUT, `${tag}-opening-small.png`) });

  await scrollTo(page, zeroTop - 0.36 * 900);
  const mid = await page.evaluate(READ);
  const midRadius = radiusOf(mid.items[0].clip);
  check(
    midRadius !== null && midRadius > smallRadius * 1.6,
    `${tag}: opening did not expand (${mid.items[0].clip})`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}-opening-mid.png`) });

  await scrollTo(page, zeroTop - 0.17 * 900);
  const full = await page.evaluate(READ);
  const fullZero = full.items[0];
  const fullRadius = radiusOf(fullZero.clip);
  const halfDiagonal = Math.hypot(
    fullZero.media.width,
    fullZero.media.height,
  ) / 2;
  check(
    fullRadius !== null && fullRadius >= halfDiagonal - 1,
    `${tag}: opening is not fully revealed (${fullZero.clip} / ${halfDiagonal})`,
  );
  check(
    fullZero.info?.visibility === "visible" &&
      near(fullZero.info.opacity, 1, 0.01),
    `${tag}: opening caption did not become visible (${JSON.stringify(fullZero.info)})`,
  );
  await waitForCardImage(page, "zero");
  const zeroImage = (await page.evaluate(READ)).items[0].image;
  check(
    zeroImage?.complete && zeroImage.naturalWidth > 0,
    `${tag}: Zero artwork did not load`,
  );
  check(
    zeroImage?.fit === "cover",
    `${tag}: Zero artwork is not filling its frame (${zeroImage?.fit})`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}-opening-full.png`) });

  // Reverse: above the trigger the circle contracts and the caption hides.
  await scrollTo(page, zeroTop - 0.8 * 900);
  const reversed = (await page.evaluate(READ)).items[0];
  check(
    radiusOf(reversed.clip) <= 120,
    `${tag}: opening did not contract on reverse (${reversed.clip})`,
  );
  check(
    reversed.info?.visibility === "hidden",
    `${tag}: opening caption did not reverse`,
  );

  // Whole-card scrubbed movement on the second pair.
  const gdriTop = await layoutTop(page, "gdri");
  await scrollTo(page, gdriTop - 0.97 * 900);
  const moving = (await page.evaluate(READ)).items[4];
  check(
    moving.transform.y > 60 &&
      Math.abs(moving.transform.x) > 20 &&
      Math.abs(moving.transform.rotate) > 1.5,
    `${tag}: whole card is not moving at entry (${JSON.stringify(moving.transform)})`,
  );

  // Capture the same card while it is still visibly in motion.
  await scrollTo(page, gdriTop - 0.74 * 900);
  await page.screenshot({ path: path.join(OUT, `${tag}-card-motion.png`) });

  await scrollTo(page, gdriTop - 0.5 * 900);
  const gdriSettled = (await page.evaluate(READ)).items[4];
  check(
    near(gdriSettled.transform.y, 0, 1.5) &&
      near(gdriSettled.transform.x, 0, 1.5) &&
      near(gdriSettled.transform.rotate, 0, 0.1),
    `${tag}: gdri did not settle (${JSON.stringify(gdriSettled.transform)})`,
  );
  const weTop = await layoutTop(page, "project-we");
  await scrollTo(page, weTop - 0.45 * 900);
  const pairSettled = (await page.evaluate(READ)).items.slice(4, 6);
  pairSettled.forEach((item) => {
    check(
      near(item.transform.y, 0, 1.5) &&
        near(item.transform.x, 0, 1.5) &&
        near(item.transform.rotate, 0, 0.1),
      `${tag}: ${item.slug} did not settle (${JSON.stringify(item.transform)})`,
    );
  });

  const rightTop = await layoutTop(page, "right-sight");
  await scrollTo(page, rightTop - 0.18 * 900);
  await page.screenshot({ path: path.join(OUT, `${tag}-pair.png`) });

  // Image drift uses its own wrapper and remains restrained.
  await scrollTo(page, gdriTop - 0.2 * 900);
  const drifted = await page.evaluate(() => {
    const element = document.querySelector('[data-sw-slug="gdri"]');
    const wrapper = element.querySelector("[data-sw-parallax]");
    const image = element.querySelector("[data-sw-image]");
    const matrix = new DOMMatrixReadOnly(getComputedStyle(wrapper).transform);
    return {
      y: +matrix.m42.toFixed(2),
      imageTransform: getComputedStyle(image).transform,
    };
  });
  check(
    Math.abs(drifted.y) > 0.5 && Math.abs(drifted.y) < 20,
    `${tag}: restrained image drift ${drifted.y}`,
  );
  check(
    drifted.imageTransform === "none" ||
      near(scaleOf(drifted.imageTransform), 1, 0.001),
    `${tag}: drift leaked into the image transform (${drifted.imageTransform})`,
  );

  // Hover: whole card lift, image zoom, coral action circle.
  await scrollTo(page, zeroTop - 0.14 * 900);
  const point = await page.evaluate(() => {
    const rect = document
      .querySelector('[data-sw-slug="zero"] [data-sw-media]')
      .getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  });
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(900);
  const hover = await page.evaluate(() => {
    const card = document.querySelector('[data-sw-slug="zero"]');
    return {
      shell: getComputedStyle(card.querySelector("[data-sw-shell]")).transform,
      image: getComputedStyle(card.querySelector("[data-sw-image]")).transform,
      actionBg: getComputedStyle(card.querySelector("[data-sw-action]"))
        .backgroundColor,
      action: getComputedStyle(card.querySelector("[data-sw-action]")).transform,
    };
  });
  check(
    hover.shell.includes("matrix") &&
      near(
        Number.parseFloat(hover.shell.split(",").at(-1) ?? "0"),
        -8,
        1,
      ),
    `${tag}: card did not lift on hover (${hover.shell})`,
  );
  check(
    near(scaleOf(hover.image), 1.045, 0.003),
    `${tag}: image did not zoom on hover (${hover.image})`,
  );
  check(
    hover.actionBg === "rgb(255, 28, 67)",
    `${tag}: action circle did not turn coral (${hover.actionBg})`,
  );
  check(
    hover.action !== "none",
    `${tag}: action circle did not animate (${hover.action})`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}-hover.png`) });

  await page.mouse.move(6, 6);
  await page.waitForTimeout(900);
  const recovered = await page.evaluate(() => {
    const card = document.querySelector('[data-sw-slug="zero"]');
    return {
      shell: getComputedStyle(card.querySelector("[data-sw-shell]")).transform,
      image: getComputedStyle(card.querySelector("[data-sw-image]")).transform,
    };
  });
  check(
    recovered.shell === "none" || /matrix\(1, 0, 0, 1, 0, 0\)/.test(recovered.shell),
    `${tag}: hover lift did not recover (${recovered.shell})`,
  );
  check(
    recovered.image === "none" ||
      near(scaleOf(recovered.image), 1, 0.002),
    `${tag}: image zoom did not recover (${recovered.image})`,
  );

  // Keyboard focus.
  await page.evaluate(() => {
    document
      .querySelector('[data-sw-slug="zero"] [data-sw-link]')
      ?.focus({ focusVisible: true });
  });
  await page.waitForTimeout(500);
  const focus = await page.evaluate(() => {
    const link = document.querySelector('[data-sw-slug="zero"] [data-sw-link]');
    const style = getComputedStyle(link);
    const card = document.querySelector('[data-sw-slug="zero"]');
    return {
      active: document.activeElement === link,
      outline: style.outlineStyle,
      width: style.outlineWidth,
      color: style.outlineColor,
      shell: getComputedStyle(card.querySelector("[data-sw-shell]")).transform,
    };
  });
  check(focus.active, `${tag}: project link did not focus`);
  check(
    focus.outline === "solid" &&
      focus.width === "2px" &&
      focus.color === "rgb(255, 28, 67)",
    `${tag}: focus outline ${JSON.stringify(focus)}`,
  );
  check(
    focus.shell.includes("matrix"),
    `${tag}: focus did not lift the card`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}-focus.png`) });

  /*
   * DEL-01B â€” perspective hover on the six subsequent projects only.
   * Zero keeps the lift/zoom/arrow hover verified above and has no panel.
   */
  const zeroStructure = (await page.evaluate(READ)).items[0];
  check(
    zeroStructure.variant === "opening" &&
      zeroStructure.hasPerspective === false &&
      zeroStructure.hasPanel === false &&
      zeroStructure.action?.icon === "arrow",
    `${tag}: Zero is no longer isolated from the perspective variant (${JSON.stringify({
      variant: zeroStructure.variant,
      perspective: zeroStructure.hasPerspective,
      panel: zeroStructure.hasPanel,
      icon: zeroStructure.action?.icon,
    })})`,
  );

  const perspectiveSlugs = [
    "right-sight",
    "exciting-sundarban",
    "splash-shine",
    "gdri",
    "project-we",
    "urbancut",
  ];

  await scrollTo(page, rightTop - 0.18 * 900);
  const resting = await page.evaluate(READ);
  const restRight = resting.items[1];
  const restSundarban = resting.items[2];
  check(
    restRight.panelIdentity && restSundarban.panelIdentity,
    `${tag}: perspective panels are transformed at rest`,
  );

  const hoverPoint = async (slug) =>
    page.evaluate((target) => {
      const rect = document
        .querySelector(`[data-sw-slug="${target}"] [data-sw-media]`)
        .getBoundingClientRect();
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      };
    }, slug);

  const rsPoint = await hoverPoint("right-sight");
  await page.mouse.move(rsPoint.x, rsPoint.y);
  await page.waitForTimeout(900);
  const hovered = await page.evaluate(READ);
  const hoverRight = hovered.items[1];
  const hoverNeighbour = hovered.items[2];
  check(hovered.overflowX === false, `${tag}: overflow during perspective hover`);

  check(
    !hoverRight.panelIdentity &&
      /matrix3d/.test(hoverRight.panelTransform ?? ""),
    `${tag}: Right Sight did not rotate in 3D (${hoverRight.panelTransform})`,
  );
  check(
    hoverRight.shellTransform === "none",
    `${tag}: perspective card still lifts (${hoverRight.shellTransform})`,
  );
  check(
    hoverRight.image?.transform === "none",
    `${tag}: perspective image still zooms (${hoverRight.image?.transform})`,
  );
  check(
    hoverRight.action?.background === "rgb(255, 28, 67)",
    `${tag}: perspective action did not turn coral (${hoverRight.action?.background})`,
  );
  check(
    near(scaleOf(hoverRight.action?.transform), 1.06, 0.01),
    `${tag}: perspective action scale ${hoverRight.action?.transform}`,
  );
  check(
    near(scaleOf(hoverRight.action?.iconTransform), 1.12, 0.02),
    `${tag}: plus icon did not transition (${hoverRight.action?.iconTransform})`,
  );
  check(
    near(hoverRight.info.rect.left, restRight.info.rect.left, 0.6) &&
      near(hoverRight.info.rect.top, restRight.info.rect.top, 0.6),
    `${tag}: caption moved during perspective hover`,
  );
  check(
    Math.abs(hoverRight.action.rect.left - restRight.action.rect.left) > 0.5 ||
      Math.abs(hoverRight.action.rect.top - restRight.action.rect.top) > 0.5,
    `${tag}: action circle did not move with the panel`,
  );
  check(
    hoverNeighbour.panelIdentity,
    `${tag}: neighbouring card responded to the hover`,
  );
  await page.screenshot({
    path: path.join(OUT, `${tag}-perspective-right-sight.png`),
  });

  // Alternate to the neighbouring card without scrolling.
  const sunPoint = await hoverPoint("exciting-sundarban");
  await page.mouse.move(sunPoint.x, sunPoint.y);
  await page.waitForTimeout(900);
  const alternating = await page.evaluate(READ);
  check(
    alternating.overflowX === false,
    `${tag}: overflow during alternating perspective hover`,
  );
  check(
    alternating.items[1].panelIdentity,
    `${tag}: Right Sight did not recover when the pointer left`,
  );
  check(
    !alternating.items[2].panelIdentity,
    `${tag}: Exciting Sundarban did not respond`,
  );
  check(
    alternating.items[2].action?.background === "rgb(255, 28, 67)" &&
      alternating.items[1].action?.background === "rgb(255, 255, 255)",
    `${tag}: alternating action states are wrong`,
  );
  await page.screenshot({
    path: path.join(OUT, `${tag}-perspective-sundarban.png`),
  });

  await page.mouse.move(6, 6);
  await page.waitForTimeout(900);
  check(
    (await page.evaluate(READ)).items[2].panelIdentity,
    `${tag}: Sundarban did not recover after pointer departure`,
  );

  // Splash Shine and the remaining authorized projects.
  const splashTop = await layoutTop(page, "splash-shine");
  await scrollTo(page, splashTop - 0.2 * 900);
  const splashPoint = await hoverPoint("splash-shine");
  await page.mouse.move(splashPoint.x, splashPoint.y);
  await page.waitForTimeout(900);
  const splashState = await page.evaluate(READ);
  const splashHover = splashState.items[3];
  check(
    !splashHover.panelIdentity &&
      splashHover.action?.background === "rgb(255, 28, 67)",
    `${tag}: Splash Shine perspective hover failed`,
  );
  check(
    splashState.overflowX === false,
    `${tag}: overflow during Splash perspective hover`,
  );
  await page.screenshot({
    path: path.join(OUT, `${tag}-perspective-splash.png`),
  });
  await page.mouse.move(6, 6);
  await page.waitForTimeout(900);

  for (const slug of perspectiveSlugs) {
    const top = await layoutTop(page, slug);
    await scrollTo(page, top - 0.2 * 900);
    const point = await hoverPoint(slug);
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(800);
    const current = (await page.evaluate(READ)).items.find(
      (item) => item.slug === slug,
    );
    check(
      current && !current.panelIdentity,
      `${tag}: ${slug} did not receive the perspective hover`,
    );
    check(
      current?.action?.background === "rgb(255, 28, 67)",
      `${tag}: ${slug} action did not activate`,
    );
    await page.mouse.move(6, 6);
    await page.waitForTimeout(800);
    const recoveredItem = (await page.evaluate(READ)).items.find(
      (item) => item.slug === slug,
    );
    check(
      recoveredItem?.panelIdentity,
      `${tag}: ${slug} did not recover to rest`,
    );
  }

  // Header surface follows the light section.
  await scrollTo(page, state.section.top + 300);
  const headerState = await page.evaluate(READ);
  check(
    headerState.header?.surface === "inherit",
    `${tag}: navbar surface ${headerState.header?.surface}`,
  );
  check(
    headerState.header?.color === "rgb(21, 14, 52)",
    `${tag}: light navbar colour ${headerState.header?.color}`,
  );

  // Preserved hero + aperture, and the visible total-count cleanup.
  await scrollTo(page, 0);
  const heroState = await page.evaluate(READ);
  check(
    heroState.hero.linkCount === 0 && heroState.hero.layerCount === 0,
    `${tag}: hero project interaction still present`,
  );
  check(
    heroState.hero.metaCount === "01",
    `${tag}: hero counter still shows a total (${heroState.hero.metaCount})`,
  );
  if (heroState.hero.trigger !== null) {
    check(heroState.hero.trigger === 1, `${tag}: hero trigger ${heroState.hero.trigger}`);
    check(
      heroState.aperture.trigger === 1,
      `${tag}: aperture trigger ${heroState.aperture.trigger}`,
    );
  }
  check(
    heroState.aperture.videoCount === 1,
    `${tag}: aperture video count ${heroState.aperture.videoCount}`,
  );
  if (heroState.aperture.videoSrc !== null) {
    check(
      heroState.aperture.videoSrc === "/video/creative-cat-showreel.mp4",
      `${tag}: showreel source ${heroState.aperture.videoSrc}`,
    );
  }
  if (heroState.selectedWorkTriggers !== null) {
    check(
      heroState.selectedWorkTriggers >= 7,
      `${tag}: only ${heroState.selectedWorkTriggers} section triggers`,
    );
  }

  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  results[`${tag}-initial`] = state;
  await context.close();
}

async function runHomeDark(browser) {
  const { context, page, errors } = await open(browser, { theme: "dark" });
  const tag = "1440x900-dark";
  const zeroTop = await layoutTop(page, "zero");
  await scrollTo(page, zeroTop - 0.14 * 900);
  const state = await page.evaluate(READ);

  check(
    state.section?.background === "rgb(36, 27, 60)",
    `${tag}: background ${state.section?.background}`,
  );
  check(
    state.section?.color === "rgb(255, 255, 255)",
    `${tag}: ink ${state.section?.color}`,
  );
  check(
    state.header?.surface === "inherit" && state.header.color === "rgb(255, 255, 255)",
    `${tag}: dark navbar ${JSON.stringify(state.header)}`,
  );
  check(state.overflowX === false, `${tag}: horizontal overflow`);
  check(state.items[0].info?.visibility === "visible", `${tag}: opening caption hidden`);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });

  const pairTop = await layoutTop(page, "right-sight");
  await scrollTo(page, pairTop - 0.2 * 900);
  await page.screenshot({ path: path.join(OUT, `${tag}-pair.png`) });

  const point = await page.evaluate(() => {
    const rect = document
      .querySelector('[data-sw-slug="right-sight"] [data-sw-media]')
      .getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  });
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(900);
  const darkHover = (await page.evaluate(READ)).items[1];
  check(
    !darkHover.panelIdentity &&
      darkHover.action?.background === "rgb(255, 28, 67)",
    `${tag}: perspective hover failed on the dark surface`,
  );
  await page.screenshot({
    path: path.join(OUT, `${tag}-perspective.png`),
  });
  await page.mouse.move(6, 6);
  await page.waitForTimeout(900);
  check(
    (await page.evaluate(READ)).items[1].panelIdentity,
    `${tag}: dark perspective did not recover`,
  );
  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runHomeTablet(browser) {
  const { context, page, errors } = await open(browser, {
    viewport: { width: 834, height: 1112 },
  });
  const tag = "834x1112";
  const state = await page.evaluate(READ);
  const columns = state.gallery?.columns?.split(" ").length ?? 0;

  check(state.overflowX === false, `${tag}: horizontal overflow`);
  check(columns === 2, `${tag}: gallery columns ${state.gallery?.columns}`);

  const zeroTop = await layoutTop(page, "zero");
  await scrollTo(page, zeroTop - 0.16 * 1112);
  const full = await page.evaluate(READ);
  check(
    radiusOf(full.items[0].clip) >=
      Math.hypot(full.items[0].media.width, full.items[0].media.height) / 2 - 1,
    `${tag}: opening not fully revealed`,
  );

  const gdriTop = await layoutTop(page, "gdri");
  await scrollTo(page, gdriTop - 0.97 * 1112);
  const moving = (await page.evaluate(READ)).items[4];
  check(
    moving.transform.y > 25 && Math.abs(moving.transform.rotate) > 0.6,
    `${tag}: tablet whole-card movement too small (${JSON.stringify(moving.transform)})`,
  );

  await scrollTo(page, gdriTop - 0.45 * 1112);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });
  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runHomeMobile(browser) {
  const { context, page, errors } = await open(browser, {
    viewport: { width: 390, height: 844 },
    touch: true,
  });
  const tag = "390x844-touch";
  const state = await page.evaluate(READ);
  const columns = state.gallery?.columns?.split(" ").length ?? 0;

  check(state.overflowX === false, `${tag}: horizontal overflow`);
  check(columns === 1, `${tag}: gallery columns ${state.gallery?.columns}`);

  const zeroTop = await layoutTop(page, "zero");
  await scrollTo(page, zeroTop - 0.6 * 844);
  const small = (await page.evaluate(READ)).items[0];
  const smallRadius = radiusOf(small.clip);
  check(
    smallRadius !== null && smallRadius <= 80,
    `${tag}: opening did not start small (${small.clip})`,
  );
  check(
    near(small.media.width / small.media.height, 4 / 3, 0.02),
    `${tag}: mobile opening is not 4:3 (${small.media.width}/${small.media.height})`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}-opening-small.png`) });

  await scrollTo(page, zeroTop - 0.15 * 844);
  const full = (await page.evaluate(READ)).items[0];
  check(
    radiusOf(full.clip) >=
      Math.hypot(full.media.width, full.media.height) / 2 - 1,
    `${tag}: opening not fully revealed`,
  );
  check(full.info?.visibility === "visible", `${tag}: opening caption hidden`);
  await page.screenshot({ path: path.join(OUT, `${tag}-opening-full.png`) });

  const gdriTop = await layoutTop(page, "gdri");
  await scrollTo(page, gdriTop - 0.97 * 844);
  const moving = (await page.evaluate(READ)).items[4];
  check(
    moving.transform.y > 15 &&
      moving.transform.x === 0 &&
      moving.transform.rotate === 0,
    `${tag}: mobile movement should be vertical only (${JSON.stringify(moving.transform)})`,
  );

  const pairTop = await layoutTop(page, "right-sight");
  await scrollTo(page, pairTop - 0.12 * 844);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });

  const fine = await page.evaluate(() =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  check(fine === false, `${tag}: touch device reports a fine pointer`);
  const rsPoint = await page.evaluate(() => {
    const rect = document
      .querySelector('[data-sw-slug="right-sight"] [data-sw-media]')
      .getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  });
  await page.mouse.move(rsPoint.x, rsPoint.y);
  await page.waitForTimeout(700);
  check(
    (await page.evaluate(READ)).items[1].panelIdentity,
    `${tag}: touch device received a simulated perspective tilt`,
  );

  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runReduced(browser) {
  const { context, page, errors } = await open(browser, { reduced: true });
  const tag = "1440x900-reduced";
  const zeroTop = await layoutTop(page, "zero");
  await scrollTo(page, zeroTop - 0.2 * 900);
  const state = await page.evaluate(READ);

  check(state.section?.motion === "off", `${tag}: motion ${state.section?.motion}`);
  state.items.forEach((item) => {
    check(item.clip === "none", `${tag}: ${item.slug} is clipped (${item.clip})`);
    check(
      near(item.transform.y, 0, 0.5) &&
        near(item.transform.x, 0, 0.5) &&
        near(item.transform.rotate, 0, 0.1),
      `${tag}: ${item.slug} is transformed`,
    );
    check(
      item.info?.visibility === "visible",
      `${tag}: ${item.slug} caption is hidden`,
    );
    check(Boolean(item.href), `${tag}: ${item.slug} lost its link`);
    check(
      item.variant === "opening"
        ? item.hasPanel === false
        : item.hasPanel === true && item.panelIdentity === true,
      `${tag}: ${item.slug} perspective state is wrong`,
    );
  });
  if (state.selectedWorkTriggers !== null) {
    check(
      state.selectedWorkTriggers === 0,
      `${tag}: reduced motion created ${state.selectedWorkTriggers} triggers`,
    );
  }

  const rsTop = await layoutTop(page, "right-sight");
  await scrollTo(page, rsTop - 0.2 * 900);
  const rsPoint = await page.evaluate(() => {
    const rect = document
      .querySelector('[data-sw-slug="right-sight"] [data-sw-media]')
      .getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  });
  await page.mouse.move(rsPoint.x, rsPoint.y);
  await page.waitForTimeout(700);
  check(
    (await page.evaluate(READ)).items[1].panelIdentity,
    `${tag}: reduced motion still rotated the artwork panel`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });
  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runNoJs(browser, viewport, tag) {
  const { context, page, errors } = await open(browser, {
    viewport,
    js: false,
  });
  await page.evaluate(() => {
    const element = document.querySelector('[data-sw-slug="zero"]');
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 100,
      behavior: "instant",
    });
  });
  await page.waitForTimeout(700);
  const state = await page.evaluate(READ);

  check(state.overflowX === false, `${tag}: horizontal overflow`);
  check(state.items.length === 7, `${tag}: card count ${state.items.length}`);
  state.items.forEach((item) => {
    check(item.clip === "none", `${tag}: ${item.slug} is clipped`);
    check(
      near(item.transform.y, 0, 0.5),
      `${tag}: ${item.slug} is transformed`,
    );
    check(item.info?.visibility === "visible", `${tag}: ${item.slug} caption hidden`);
    check(Boolean(item.href), `${tag}: ${item.slug} lost its link`);
    check(
      item.variant === "opening"
        ? item.hasPanel === false
        : item.hasPanel === true && item.panelIdentity === true,
      `${tag}: ${item.slug} perspective markup is wrong without JS`,
    );
  });
  check(
    state.items[0].image?.naturalWidth > 0,
    `${tag}: opening artwork did not load`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });
  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runArchive(browser) {
  const tag = "work-index";
  const { context, page, errors } = await open(browser, {
    url: new URL("/work", BASE).href,
  });
  const state = await page.evaluate(READ);

  check(state.exists === false, `${tag}: homepage gallery leaked into the archive`);
  check(state.archive?.count === 13, `${tag}: count ${state.archive?.count}`);
  check(
    state.archive?.cards.map((card) => card.href).join(",") ===
      WORK_ORDER.map((slug) => `/work/${slug}`).join(","),
    `${tag}: archive order/hrefs ${state.archive?.cards
      .map((card) => card.href)
      .join(",")}`,
  );
  check(
    new Set(WORK_ORDER).size === ALL.length &&
      ALL.every((slug) => WORK_ORDER.includes(slug)),
    `${tag}: archive sequence is not a permutation of the collection`,
  );

  // DEL-01D.2 composition: five full-width features alternating with four
  // staggered pairs, then the closing feature and the editorial closing.
  const expectedRows = [
    "feature",
    "pair-left",
    "feature",
    "pair-left",
    "feature",
    "pair-left",
    "feature",
    "pair-left",
    "closing",
  ];
  check(
    state.archive?.rows.join(",") === expectedRows.join(","),
    `${tag}: row rhythm ${state.archive?.rows}`,
  );

  // DEL-01C / DEL-01D.2: every card resolves the one revisioned canonical cover.
  // Paired cards keep the native ratio; the five full-width features use the
  // cinematic ratio and the artwork-specific focal point chosen after inspecting
  // each cover. `object-fit: cover` never stretches the source.
  const revision = "cover.png%3Fv%3D20261128";
  const FEATURE_FRAMES = {
    "right-sight": { ratio: 15 / 7, position: "50% 38%", height: [540, 580] },
    oralshine: { ratio: 15 / 7, position: "50% 17%", height: [540, 580] },
    zero: { ratio: 30 / 11, position: "50% 45%", height: [420, 460] },
    "zero-blind-spots": {
      ratio: 30 / 11,
      position: "50% 45%",
      height: [420, 460],
    },
    "yogic-rhythm": { ratio: 30 / 11, position: "50% 35%", height: [420, 460] },
  };
  for (const card of state.archive?.cards ?? []) {
    const slug = card.href?.split("/").pop();
    const feature = FEATURE_FRAMES[slug];
    check(
      Boolean(card.src?.includes(revision)),
      `${tag}: ${card.name} cover URL ${card.src}`,
    );
    check(card.fit === "cover", `${tag}: ${card.name} fit ${card.fit}`);
    check(
      card.ratio !== null &&
        near(card.ratio, feature?.ratio ?? 1, 0.02),
      `${tag}: ${card.name} frame ratio ${card.ratio}`,
    );
    if (feature) {
      check(
        card.position === feature.position,
        `${tag}: ${card.name} crop position ${card.position}`,
      );
    }
    check(
      Boolean(card.description && card.description.length > 12),
      `${tag}: ${card.name} description missing`,
    );
  }

  // DEL-01D.1: the route follows the saved global theme, so the default light
  // context must paint paper, midnight ink and the theme-following navbar.
  check(
    state.archive?.pageBackground === "rgb(255, 255, 255)" &&
      state.archive?.pageColor === "rgb(21, 14, 52)",
    `${tag}: light surface ${state.archive?.pageBackground}/${state.archive?.pageColor}`,
  );
  check(
    state.header?.surface === "inherit" &&
      state.header?.color === "rgb(21, 14, 52)",
    `${tag}: light navbar ${state.header?.surface}/${state.header?.color}`,
  );

  // DEL-01D.2 geometry: all five standalone projects own the full 1200px
  // measure, share the gallery boundaries, stay cinematic in height, and leave
  // the four paired cards at their DEL-01D.1 size and inset.
  const bySlug = Object.fromEntries(
    (state.archive?.cards ?? []).map((card) => [
      card.href?.split("/").pop(),
      card,
    ]),
  );
  const widthIn = (slug, min, max, label) => {
    const width = bySlug[slug]?.frame?.width ?? 0;
    check(width >= min && width <= max, `${tag}: ${label} width ${width}`);
    return width;
  };
  const gallery = state.archive?.gallery;
  check(
    Boolean(gallery && gallery.width >= 1190 && gallery.width <= 1200),
    `${tag}: gallery measure ${gallery?.width}`,
  );
  for (const [slug, frame] of Object.entries(FEATURE_FRAMES)) {
    widthIn(slug, 1190, 1200, "full-width feature");
    check(
      near(bySlug[slug]?.frame?.left, gallery?.left ?? 0, 0.6) &&
        near(bySlug[slug]?.frame?.right, gallery?.right ?? 0, 0.6),
      `${tag}: ${slug} does not share the gallery boundaries`,
    );
    check(
      bySlug[slug]?.frame?.height >= frame.height[0] &&
        bySlug[slug]?.frame?.height <= frame.height[1],
      `${tag}: ${slug} feature height ${bySlug[slug]?.frame?.height}`,
    );
  }
  for (const slug of [
    "exciting-sundarban",
    "splash-shine",
    "gdri",
    "project-we",
    "dipakkhik",
    "urbancut",
    "flex",
    "elegantic",
  ]) {
    widthIn(slug, 430, 520, "paired card");
  }
  check(
    near(bySlug["exciting-sundarban"].frame.left - gallery.left, 104.7, 2) &&
      near(
        gallery.right - bySlug["splash-shine"].frame.right,
        104.7,
        2,
      ),
    `${tag}: paired band inset changed`,
  );
  const stagger =
    bySlug["splash-shine"].frame.top - bySlug["exciting-sundarban"].frame.top;
  check(
    stagger > 28 && stagger < 68,
    `${tag}: paired stagger changed (${stagger.toFixed(1)}px)`,
  );

  const nameSize = (slug) =>
    Number.parseFloat(bySlug[slug]?.nameSize ?? "0");
  check(
    nameSize("right-sight") >= 24 &&
      nameSize("right-sight") <= 32.5 &&
      nameSize("exciting-sundarban") >= 22 &&
      nameSize("exciting-sundarban") <= 32.5,
    `${tag}: title sizes ${nameSize("right-sight")}/${nameSize("exciting-sundarban")}`,
  );
  check(
    Number.parseFloat(state.archive?.descriptionSize ?? "0") >= 13.5 &&
      Number.parseFloat(state.archive?.descriptionSize ?? "0") <= 15.5,
    `${tag}: description size ${state.archive?.descriptionSize}`,
  );
  check(
    Number.parseFloat(state.archive?.tagSize ?? "0") >= 10 &&
      Number.parseFloat(state.archive?.tagSize ?? "0") <= 12,
    `${tag}: tag size ${state.archive?.tagSize}`,
  );

  // DEL-01D.1 closing: editorial statement, no repeated contact button.
  check(state.archive?.hasClosing, `${tag}: editorial closing missing`);
  check(
    /the next chapter/i.test(state.archive?.closingText ?? "") &&
      /your idea could be next/i.test(state.archive?.closingText ?? "") &&
      /every great project begins somewhere/i.test(
        state.archive?.closingText ?? "",
      ),
    `${tag}: closing copy ${state.archive?.closingText}`,
  );
  check(
    state.archive?.closingLinks === 0 &&
      state.archive?.contactLinks === 0 &&
      !/let'?s talk/i.test(state.archive?.closingText ?? ""),
    `${tag}: duplicate contact CTA before the footer`,
  );
  check(
    (await page.locator("[data-footer] a[href='/contact']").count()) > 0,
    `${tag}: footer contact action missing`,
  );
  check(
    !/13 projects|explore all 13|selected work 13/i.test(state.archive?.text ?? ""),
    `${tag}: promotional project total is visible`,
  );
  check(state.overflowX === false, `${tag}: horizontal overflow`);

  // Image zoom: frame and caption stay fixed, the image scales inside, the
  // neighbour is untouched and departure recovers.
  await page.evaluate(() => {
    const card = document.querySelector("[data-work-card]");
    window.scrollTo({
      top: card.getBoundingClientRect().top + window.scrollY - 180,
      behavior: "instant",
    });
  });
  await page.waitForTimeout(600);
  const firstPoint = await page.evaluate(() => {
    const rect = document
      .querySelector("[data-work-card] [data-work-frame]")
      .getBoundingClientRect();
    return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
  });
  const beforeHover = await page.evaluate(() => {
    const card = document.querySelector("[data-work-card]");
    return {
      image: getComputedStyle(card.querySelector("[data-work-image]")).transform,
      caption: card.querySelector("[data-work-caption]").getBoundingClientRect().toJSON(),
    };
  });
  await page.mouse.move(firstPoint.x, firstPoint.y);
  await page.waitForTimeout(700);
  const afterHover = await page.evaluate(() => {
    const card = document.querySelector("[data-work-card]");
    const neighbour = document.querySelectorAll("[data-work-card]")[1];
    return {
      image: getComputedStyle(card.querySelector("[data-work-image]")).transform,
      caption: card.querySelector("[data-work-caption]").getBoundingClientRect().toJSON(),
      neighbour: neighbour
        ? getComputedStyle(neighbour.querySelector("[data-work-image]")).transform
        : null,
    };
  });
  check(
    near(scaleOf(afterHover.image), 1.055, 0.01),
    `${tag}: artwork zoom ${afterHover.image}`,
  );
  check(
    near(afterHover.caption.left, beforeHover.caption.left, 0.6) &&
      near(afterHover.caption.top, beforeHover.caption.top, 0.6),
    `${tag}: caption moved during artwork zoom`,
  );
  check(
    isIdentityTransform(afterHover.neighbour),
    `${tag}: neighbour artwork moved`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}-hover.png`) });
  await page.mouse.move(6, 6);
  await page.waitForTimeout(700);
  const recovered = await page.evaluate(
    () => getComputedStyle(document.querySelector("[data-work-image]")).transform,
  );
  check(
    near(scaleOf(recovered), 1, 0.005),
    `${tag}: artwork did not recover (${recovered})`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });

  // Dark theme follows the same tokens: midnight canvas, white ink, dark navbar.
  const darkWork = await open(browser, {
    theme: "dark",
    url: new URL("/work", BASE).href,
  });
  const darkWorkState = await darkWork.page.evaluate(READ);
  check(
    darkWorkState.archive?.pageBackground === "rgb(21, 14, 52)" &&
      darkWorkState.archive?.pageColor === "rgb(255, 255, 255)",
    `${tag}-dark: surface ${darkWorkState.archive?.pageBackground}/${darkWorkState.archive?.pageColor}`,
  );
  check(
    darkWorkState.header?.surface === "inherit" &&
      darkWorkState.header?.color === "rgb(255, 255, 255)",
    `${tag}-dark: navbar ${darkWorkState.header?.surface}/${darkWorkState.header?.color}`,
  );
  check(
    darkWorkState.archive?.count === 13 &&
      darkWorkState.archive?.hasClosing === true,
    `${tag}-dark: archive incomplete`,
  );
  await darkWork.page.screenshot({
    path: path.join(OUT, `${tag}-dark.png`),
  });
  await darkWork.context.close();

  // Live switching while the visitor remains on /work, and the choice persists
  // when navigating away. Return to the top so the navbar control is reachable.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.locator('button[aria-label*="theme"]').first().click();
  await page.waitForTimeout(1300);
  const switched = await page.evaluate(READ);
  check(
    switched.archive?.pageBackground === "rgb(21, 14, 52)" &&
      switched.archive?.pageColor === "rgb(255, 255, 255)" &&
      switched.header?.surface === "inherit" &&
      switched.header?.color === "rgb(255, 255, 255)",
    `${tag}: live switch did not reach the dark theme (${switched.archive?.pageBackground}/${switched.archive?.pageColor}/${switched.header?.surface}/${switched.header?.color})`,
  );
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  check(
    await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    ),
    `${tag}: leaving /work overwrote the saved theme`,
  );
  await page.goto(new URL("/work", BASE).href, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  for (const [width, height, label] of [
    [1920, 1080, "1920x1080"],
    [1024, 600, "1024x600"],
    [834, 1194, "834x1194"],
    [390, 844, "390x844"],
  ]) {
    const tablet = await open(browser, {
      viewport: { width, height },
      url: new URL("/work", BASE).href,
    });
    const tabletState = await tablet.page.evaluate(READ);
    const cards = tabletState.archive?.cards ?? [];
    const bySlug = Object.fromEntries(
      cards.map((card) => [card.href?.split("/").pop(), card]),
    );
    const featureSlugs = Object.keys(FEATURE_FRAMES);
    check(cards.length === 13, `${tag}-${label}: count ${cards.length}`);
    check(tabletState.overflowX === false, `${tag}-${label}: overflow`);
    check(
      featureSlugs.every(
        (slug) =>
          near(
            bySlug[slug]?.frame?.width,
            tabletState.archive?.gallery?.width ?? 0,
            1,
          ) &&
          near(
            bySlug[slug]?.frame?.left,
            bySlug["right-sight"]?.frame?.left ?? 0,
            0.6,
          ),
      ),
      `${tag}-${label}: features do not span the gallery`,
    );
    if (width === 390) {
      const lefts = new Set(cards.map((card) => Math.round(card.frame?.left ?? 0)));
      check(lefts.size === 1, `${tag}-${label}: not a single column (${[...lefts]})`);
      // Mobile restores the native artwork ratios instead of the cinematic crop.
      check(
        near(bySlug["right-sight"]?.ratio, 1, 0.02) &&
          near(bySlug["zero"]?.ratio, 1672 / 941, 0.02),
        `${tag}-${label}: mobile ratio is not native (${bySlug["right-sight"]?.ratio}/${bySlug["zero"]?.ratio})`,
      );
    } else {
      check(
        bySlug["right-sight"].frame.width > bySlug["exciting-sundarban"].frame.width,
        `${tag}-${label}: feature is not wider than the pair`,
      );
      check(
        bySlug["exciting-sundarban"].frame.left <
          bySlug["splash-shine"].frame.left - 100,
        `${tag}-${label}: pair is not side by side`,
      );
      check(
        near(
          bySlug["exciting-sundarban"].frame.width,
          bySlug["splash-shine"].frame.width,
          0.6,
        ),
        `${tag}-${label}: paired widths diverged`,
      );
    }
    await tablet.page.screenshot({
      path: path.join(OUT, `${tag}-${label}.png`),
      fullPage: false,
    });
    await tablet.context.close();
  }

  // Reduced motion keeps every card complete and untransformed.
  const reduced = await open(browser, {
    url: new URL("/work", BASE).href,
    reduced: true,
  });
  const reducedCards = await reduced.page.evaluate(() =>
    [...document.querySelectorAll("[data-work-card]")].map((card) => ({
      opacity: getComputedStyle(card).opacity,
      transform: getComputedStyle(card).transform,
    })),
  );
  check(
    reducedCards.length === 13 &&
      reducedCards.every(
        (card) =>
          near(Number(card.opacity), 1, 0.01) &&
          isIdentityTransform(card.transform),
      ),
    `${tag}: reduced motion left hidden or moved cards`,
  );
  await reduced.context.close();

  // No JavaScript: the server markup already contains every full-width feature,
  // pair, caption and project link at the cinematic geometry.
  const noJs = await open(browser, {
    url: new URL("/work", BASE).href,
    js: false,
  });
  const noJsState = await noJs.page.evaluate(READ);
  check(
    noJsState.archive?.count === 13 &&
      noJsState.archive?.cards.every(
        (card) => card.name && card.description && card.href,
      ),
    `${tag}: no-JS archive is incomplete`,
  );
  check(
    (noJsState.archive?.cards.find((card) =>
      card.href?.endsWith("/right-sight"),
    )?.frame?.width ?? 0) >= 1190,
    `${tag}: no-JS feature is not full width`,
  );
  await noJs.context.close();

  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runRoutes(browser) {
  const tag = "routes";
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const slug of ALL) {
    const response = await page.request.get(new URL(`/work/${slug}`, BASE).href);
    check(response.ok(), `${tag}: /work/${slug} returned ${response.status()}`);
  }

  const invalid = await page.request.get(
    new URL("/work/not-a-project", BASE).href,
  );
  check(invalid.status() === 404, `${tag}: invalid slug returned ${invalid.status()}`);

  const first = await open(browser, {
    url: new URL("/work/right-sight", BASE).href,
  });
  const firstState = await first.page.evaluate(READ);
  check(firstState.detail?.title === "Right Sight", `${tag}: first title`);
  check(
    firstState.detail?.meta?.includes("Branding") &&
      !/\b\d+\s*\/\s*13\b/.test(firstState.detail?.meta ?? ""),
    `${tag}: first meta ${firstState.detail?.meta}`,
  );
  check(firstState.detail?.back === "Back to Work", `${tag}: back label`);
  check(firstState.detail?.next === "/work/zero", `${tag}: first next`);
  await first.context.close();

  const last = await open(browser, {
    url: new URL("/work/yogic-rhythm", BASE).href,
  });
  const lastState = await last.page.evaluate(READ);
  check(lastState.detail?.title === "Yogic Rhythm", `${tag}: last title`);
  check(lastState.detail?.next === "/work/right-sight", `${tag}: last next`);
  await last.context.close();

  await context.close();
}

async function runApertureTransition(browser) {
  const tag = "aperture-transition";
  const { context, page, errors } = await open(browser);
  const state = await page.evaluate(READ);

  check(state.aperture.videoCount === 1, `${tag}: showreel count`);
  if (state.aperture.trigger !== null) {
    await page.evaluate(() => window.__nextLevelProjects?.scrollTo?.(0.95));
    await page.waitForTimeout(1200);
    const full = await page.evaluate(READ);
    check(full.aperture.videoPaused === false, `${tag}: showreel paused at stage`);
    await page.screenshot({ path: path.join(OUT, `${tag}-stage.png`) });
  }

  // Natural release: the aperture must be followed immediately by the gallery.
  await page.evaluate(() => {
    const aperture = document.querySelector("[data-next-level]");
    const bottom = aperture.getBoundingClientRect().bottom + window.scrollY;
    const lenis = window.__heroLenis?.instance?.();
    if (lenis) lenis.scrollTo(bottom + 20, { immediate: true, force: true });
    else window.scrollTo({ top: bottom + 20, behavior: "instant" });
  });
  await page.waitForTimeout(1000);
  const transition = await page.evaluate(READ);
  check(transition.exists, `${tag}: gallery missing after the aperture`);
  check(transition.overflowX === false, `${tag}: overflow at the transition`);
  await page.screenshot({ path: path.join(OUT, `${tag}-release.png`) });
  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

(async () => {
  const browser = await chromium.launch(launchOptions());

  await runHomeDesktop(browser);
  await runHomeDark(browser);
  await runHomeTablet(browser);
  await runHomeMobile(browser);
  await runReduced(browser);
  await runNoJs(browser, { width: 1440, height: 900 }, "1440x900-nojs");
  await runNoJs(browser, { width: 390, height: 844 }, "390x844-nojs");
  await runArchive(browser);
  await runRoutes(browser);
  await runApertureTransition(browser);

  fs.writeFileSync(
    path.join(OUT, "report.json"),
    JSON.stringify(
      { base: BASE, generated: new Date().toISOString(), failures, results },
      null,
      1,
    ),
  );

  console.log(
    JSON.stringify(
      {
        base: BASE,
        failures,
        summary: {
          featured: Object.fromEntries(
            (results["1440x900-light-initial"]?.items ?? []).map((item) => [
              item.slug,
              {
                layout: item.layout,
                top: item.rect.top,
                left: item.rect.left,
                width: item.rect.width,
                height: item.rect.height,
                href: item.href,
              },
            ]),
          ),
          archiveCount: results["1440x900-light-initial"]?.archive?.count ?? null,
        },
      },
      null,
      1,
    ),
  );

  await browser.close();
  if (failures.length > 0) process.exitCode = 1;
})();

