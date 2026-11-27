/*
 * DEL-00.3C — Next Level Projects: combined masthead + continuous video
 * showreel aperture verification.
 *
 * Read-only measurement. Covers the tracking/width match, the opposing
 * entrance, the measured capsule aperture, the single persistent video, the
 * aperture-independent playback lifecycle, the stable caption, the pointer
 * lens, the menu pause control, sticky release, both themes,
 * responsive/static, reduced motion, no-JS and horizontal overflow.
 *
 * The `window.__nextLevelProjects` accessor is development-only, so trigger
 * counts and exact progress reads are skipped against a production build. The
 * DOM/scroll/video measurements run in both.
 *
 * Usage: HERO_BASE_URL=http://localhost:3000/ node tests/e2e/project-aperture.js
 */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const OUT = out("next-level-projects");

const SHOWREEL = {
  src: "/video/creative-cat-showreel.mp4",
  poster: "/video/creative-cat-showreel-poster.webp",
  bytes: 7120424,
  sha256: "38098de3c2cdeb161673747b143a4e41d3a023dd182abcb1d884ff0a115257e4",
};

const COLORS = {
  light: {
    top: "rgb(21, 14, 52)",
    bottom: "rgb(99, 19, 57)",
    border: "rgb(99, 19, 57)",
    background: "rgb(255, 255, 255)",
  },
  dark: {
    top: "rgb(255, 255, 255)",
    bottom: "rgb(182, 175, 203)",
    border: "rgb(182, 175, 203)",
    background: "rgb(21, 14, 52)",
  },
  coral: "rgb(255, 28, 67)",
};

const READ = () => {
  const root = document.querySelector("[data-next-level]");
  if (!root) return null;

  const stage = root.querySelector("[data-nlp-stage]");
  const title = root.querySelector("[data-nlp-title]");
  const topLine = root.querySelector('[data-nlp-line="top"]');
  const bottomLine = root.querySelector('[data-nlp-line="bottom"]');
  const capsule = root.querySelector("[data-nlp-capsule]");
  const slider = root.querySelector("[data-nlp-slider]");
  const media = root.querySelector("[data-nlp-media]");
  const showreel = root.querySelector("[data-nlp-showreel]");
  const video = root.querySelector("video");
  const caption = root.querySelector("[data-nlp-caption]");
  const scrim = root.querySelector("[data-nlp-scrim]");
  const figure = root.querySelector("[data-nlp-static]");
  const lens = document.querySelector("[data-nlp-lens]");
  const mode = root.getAttribute("data-nlp-mode") || "static";

  const cloneTop = lens?.querySelector('[data-nlp-line="top"]');
  const clonePoster = lens?.querySelector("[data-nlp-capsule-poster]");
  const capsulePoster = slider?.querySelector("[data-nlp-capsule-poster]");

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

  const sectionRect = root.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const sliderRect = slider.getBoundingClientRect();
  const capsuleRect = capsule.getBoundingClientRect();
  const mediaRect = media.getBoundingClientRect();
  const topRect = topLine.getBoundingClientRect();
  const bottomRect = bottomLine.getBoundingClientRect();
  const prRect = root.querySelector('[data-nlp-fragment="pr"]').getBoundingClientRect();
  const jectsRect = root.querySelector('[data-nlp-fragment="jects"]').getBoundingClientRect();

  const clipPath = getComputedStyle(media).clipPath;
  const insetMatch = /inset\(([^)]+)\)/.exec(clipPath);
  let clip = { top: 0, right: 0, bottom: 0, left: 0, radius: 0 };
  if (insetMatch) {
    const body = insetMatch[1].split(" round ")[0].trim();
    const values = body
      .split(/\s+/)
      .map((value) => Number.parseFloat(value))
      .filter(Number.isFinite);
    if (values.length === 1) {
      clip = { top: values[0], right: values[0], bottom: values[0], left: values[0], radius: 0 };
    } else if (values.length === 2) {
      clip = { top: values[0], right: values[1], bottom: values[0], left: values[1], radius: 0 };
    } else if (values.length === 3) {
      clip = { top: values[0], right: values[1], bottom: values[2], left: values[1], radius: 0 };
    } else if (values.length >= 4) {
      clip = { top: values[0], right: values[1], bottom: values[2], left: values[3], radius: 0 };
    }
    const roundMatch = /round\s+([\d.]+)px/.exec(insetMatch[1]);
    if (roundMatch) clip.radius = Number.parseFloat(roundMatch[1]);
  }

  const mediaMatrix = new DOMMatrixReadOnly(getComputedStyle(showreel).transform);

  const fragment = (name) => {
    const element = root.querySelector(`[data-nlp-fragment="${name}"]`);
    if (!element) return null;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return {
      x: +matrix.m41.toFixed(2),
      y: +matrix.m42.toFixed(2),
      opacity: +(Number(getComputedStyle(element).opacity) || 0).toFixed(3),
    };
  };

  const words = Array.from(root.querySelectorAll("[data-nlp-word]")).map((element) =>
    +(Number(getComputedStyle(element).opacity) || 0).toFixed(3),
  );

  const captionStyle = getComputedStyle(caption);
  const figureStyle = getComputedStyle(figure);
  const figureImage = figure.querySelector("img");

  return {
    mode,
    motion: root.getAttribute("data-nlp-motion"),
    section: {
      top: +(sectionRect.top + window.scrollY).toFixed(1),
      height: +sectionRect.height.toFixed(1),
      position: getComputedStyle(root).position,
      surface: root.getAttribute("data-header-surface"),
      stickyDescendants: Array.from(root.querySelectorAll("*")).filter(
        (element) => getComputedStyle(element).position === "sticky",
      ).length,
      legacyApertureParts: root.querySelectorAll(
        "[data-aperture-frame], [data-aperture-caption], [data-aperture-image]",
      ).length,
    },
    stage: rectOf(stage),
    title: rectOf(title),
    rows: {
      topWidth: +topRect.width.toFixed(1),
      bottomWidth: +bottomRect.width.toFixed(1),
      topTransform: getComputedStyle(topLine).transform,
      bottomTransform: getComputedStyle(bottomLine).transform,
      topOpacity: getComputedStyle(topLine).opacity,
      bottomOpacity: getComputedStyle(bottomLine).opacity,
      topColor: getComputedStyle(topLine).color,
      bottomColor: getComputedStyle(bottomLine).color,
      topFont: getComputedStyle(topLine).fontSize,
      bottomFont: getComputedStyle(bottomLine).fontSize,
      topLetterSpacing: getComputedStyle(topLine).letterSpacing,
      topGap: getComputedStyle(topLine).gap,
      headingHeight: +title.getBoundingClientRect().height.toFixed(1),
    },
    capsule: {
      width: +capsuleRect.width.toFixed(1),
      height: +capsuleRect.height.toFixed(1),
      borderColor: getComputedStyle(capsule).borderTopColor,
      background: getComputedStyle(capsule).backgroundColor,
      opacity: +(Number(getComputedStyle(capsule).opacity) || 0).toFixed(3),
      gapLeft: +(capsuleRect.left - prRect.right).toFixed(1),
      gapRight: +(jectsRect.left - capsuleRect.right).toFixed(1),
      posterVisibility: capsulePoster
        ? getComputedStyle(capsulePoster).visibility
        : null,
      posterSrc: capsulePoster?.getAttribute("src") ?? null,
    },
    media: {
      display: getComputedStyle(media).display,
      position: getComputedStyle(media).position,
      rect: rectOf(media),
      clipPath,
      clip,
      clipRect: {
        left: +clip.left.toFixed(2),
        top: +clip.top.toFixed(2),
        width: +(mediaRect.width - clip.left - clip.right).toFixed(2),
        height: +(mediaRect.height - clip.top - clip.bottom).toFixed(2),
      },
      sliderRelative: {
        left: +(sliderRect.left - stageRect.left).toFixed(2),
        top: +(sliderRect.top - stageRect.top).toFixed(2),
        width: +sliderRect.width.toFixed(2),
        height: +sliderRect.height.toFixed(2),
        radius: +(sliderRect.height / 2).toFixed(2),
      },
      showreelTransform: getComputedStyle(showreel).transform,
      scale: +mediaMatrix.a.toFixed(5),
      translateX: +mediaMatrix.e.toFixed(2),
      translateY: +mediaMatrix.f.toFixed(2),
    },
    video: {
      count: root.querySelectorAll("video").length,
      exists: !!video,
      src: video?.getAttribute("src") ?? null,
      poster: video?.getAttribute("poster") ?? null,
      paused: video?.paused ?? null,
      muted: video?.muted ?? null,
      loop: video?.loop ?? null,
      playsInline: video?.playsInline ?? null,
      readyState: video?.readyState ?? -1,
      currentTime: video ? +video.currentTime.toFixed(3) : null,
      display: video ? getComputedStyle(video).display : null,
      fit: video ? getComputedStyle(video).objectFit : null,
      rect: rectOf(video),
      marker: video?.__nlpMarker ?? null,
    },
    fragments: {
      next: fragment("next"),
      level: fragment("level"),
      pr: fragment("pr"),
      jects: fragment("jects"),
    },
    figure: {
      display: figureStyle.display,
      src: figureImage?.getAttribute("src") ?? null,
      alt: figureImage?.getAttribute("alt") ?? null,
      naturalWidth: figureImage?.naturalWidth ?? 0,
      height: +figure.getBoundingClientRect().height.toFixed(1),
    },
    caption: {
      display: captionStyle.display,
      position: captionStyle.position,
      opacity: +(Number(captionStyle.opacity) || 0).toFixed(3),
      color: captionStyle.color,
      q: Number.parseFloat(captionStyle.getPropertyValue("--nlp-caption-q")) || 0,
      scrim:
        getComputedStyle(scrim).display === "none"
          ? null
          : +(Number(getComputedStyle(scrim).opacity) || 0).toFixed(3),
      words,
      text: (caption.textContent || "").replace(/\s+/g, " ").trim(),
      accessibleLine:
        caption.querySelector(".nlp-caption__line .sr-only")?.textContent?.trim() ??
        null,
    },
    lens: {
      display: lens ? getComputedStyle(lens).display : null,
      visibility: lens ? getComputedStyle(lens).visibility : null,
      opacity: lens ? getComputedStyle(lens).opacity : null,
      pointerEvents: lens ? getComputedStyle(lens).pointerEvents : null,
      ariaHidden: lens?.getAttribute("aria-hidden") ?? null,
      width: lens?.offsetWidth ?? null,
      height: lens?.offsetHeight ?? null,
      background: lens ? getComputedStyle(lens).backgroundColor : null,
      cloneDelta:
        cloneTop && capsulePoster
          ? {
              left: +(cloneTop.getBoundingClientRect().left - topRect.left).toFixed(2),
              top: +(cloneTop.getBoundingClientRect().top - topRect.top).toFixed(2),
            }
          : null,
      cloneFilter: clonePoster ? getComputedStyle(clonePoster).filter : null,
      clonePosterSrc: clonePoster?.getAttribute("src") ?? null,
      cloneVideoCount: lens?.querySelectorAll("video").length ?? 0,
    },
    scrollY: +window.scrollY.toFixed(1),
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    headingCount: document.querySelectorAll("h2#next-level-projects-title").length,
    heroTriggers: window.__heroStory?.triggers?.() ?? null,
    apertureTriggers: window.__nextLevelProjects?.triggers?.() ?? null,
    lenis: window.__heroLenis?.instances ?? null,
    progress: window.__nextLevelProjects?.progress?.() ?? null,
    aperture: window.__nextLevelProjects?.info?.().aperture ?? null,
    playback: window.__nextLevelProjects?.info?.().playback ?? null,
  };
};

const translationX = (transform) => {
  if (!transform || transform === "none") return 0;
  const match = /matrix\(([^)]+)\)/.exec(transform);
  if (!match) return 0;
  return Number.parseFloat(match[1].split(",")[4]) || 0;
};

const failures = [];
const results = {};

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const near = (actual, expected, tolerance) =>
  Math.abs(actual - expected) <= tolerance;

/*
 * The reel loops every 9.42s, so "kept moving" must also accept a wrap from the
 * end back to the start. A backwards jump of seconds is only valid as that wrap.
 */
const advanced = (before, after, minimum = 0.5) =>
  after > before + minimum || after < before - 5;

async function open(browser, width, height, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
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
  await page.goto(BASE, { waitUntil: "networkidle" });
  if (options.js !== false) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
  } else {
    await page.waitForTimeout(500);
  }
  return { context, page, errors };
}

async function scrollToProgress(page, progress, settle = 650) {
  await page.evaluate((value) => {
    if (window.__nextLevelProjects?.scrollTo) {
      window.__nextLevelProjects.scrollTo(value);
      return;
    }
    const root = document.querySelector("[data-next-level]");
    const stage = root.querySelector("[data-nlp-stage]");
    const title = root.querySelector("[data-nlp-title]");
    const top = root.getBoundingClientRect().top + window.scrollY;
    const bottom = root.getBoundingClientRect().bottom + window.scrollY;
    const offset =
      title.getBoundingClientRect().top - stage.getBoundingClientRect().top;
    const start = top + offset - window.innerHeight * 0.94;
    const end = bottom - window.innerHeight;
    window.scrollTo({ top: start + (end - start) * value, behavior: "instant" });
  }, progress);
  await page.waitForTimeout(settle);
}

async function readAt(page, progress, settle = 650) {
  await scrollToProgress(page, progress, settle);
  return page.evaluate(READ);
}

async function waitForVideo(page, timeout = 6000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const state = await page.evaluate(() => {
      const video = document.querySelector("[data-nlp-video]");
      return video
        ? {
            paused: video.paused,
            readyState: video.readyState,
            currentTime: video.currentTime,
            src: video.getAttribute("src"),
          }
        : null;
    });
    if (state && state.src && !state.paused && state.readyState >= 2) return state;
    await page.waitForTimeout(100);
  }
  return null;
}

async function assertVideoPlaying(tag, state, minimumTime = 0) {
  check(state.video.count === 1, `${tag}: expected exactly one video element`);
  check(state.video.src === SHOWREEL.src, `${tag}: video source ${state.video.src}`);
  check(state.video.poster === SHOWREEL.poster, `${tag}: video poster ${state.video.poster}`);
  check(state.video.paused === false, `${tag}: video is paused`);
  check(state.video.muted === true, `${tag}: video is not muted`);
  check(state.video.loop === true, `${tag}: video does not loop`);
  check(state.video.playsInline === true, `${tag}: video is not playsInline`);
  check(state.video.readyState >= 2, `${tag}: video has no decodable frame`);
  check(
    state.video.currentTime > minimumTime - 0.05,
    `${tag}: video currentTime ${state.video.currentTime} did not advance past ${minimumTime}`,
  );
  check(state.video.fit === "cover", `${tag}: video is not object-fit cover`);
}

async function runAssetChecks(page) {
  const videoResponse = await page.request.get(new URL(SHOWREEL.src, BASE).href);
  const videoBody = await videoResponse.body();
  const posterResponse = await page.request.get(new URL(SHOWREEL.poster, BASE).href);
  const posterBody = await posterResponse.body();

  check(videoResponse.ok(), `assets: showreel returned ${videoResponse.status()}`);
  check(
    videoBody.length === SHOWREEL.bytes,
    `assets: showreel is ${videoBody.length} bytes, expected ${SHOWREEL.bytes}`,
  );
  check(
    crypto.createHash("sha256").update(videoBody).digest("hex") === SHOWREEL.sha256,
    "assets: showreel SHA-256 does not match the approved asset",
  );
  check(posterResponse.ok(), `assets: poster returned ${posterResponse.status()}`);
  check(posterBody.length > 0, "assets: poster is empty");
  check(
    (posterResponse.headers()["content-type"] || "").includes("image/webp"),
    `assets: poster content-type ${posterResponse.headers()["content-type"]}`,
  );
}

async function runEnhancedLight(browser) {
  const { context, page, errors } = await open(browser, 1440, 900, { theme: "light" });
  const tag = "1440x900-light";
  const initial = await page.evaluate(READ);

  check(initial.mode === "enhanced", `${tag}: enhanced mode was not promoted`);
  check(initial.headingCount === 1, `${tag}: expected one "Next Level Projects" h2`);
  check(initial.section.stickyDescendants === 1, `${tag}: expected one sticky stage`);
  check(initial.section.surface === "inherit", `${tag}: header surface is not inherit`);
  check(initial.section.legacyApertureParts === 0, `${tag}: legacy aperture DOM present`);
  check(
    near(initial.section.height, 1710, 2),
    `${tag}: section height ${initial.section.height}, expected 190svh`,
  );
  if (initial.apertureTriggers !== null) {
    check(initial.apertureTriggers === 1, `${tag}: section trigger count ${initial.apertureTriggers}`);
    check(initial.heroTriggers === 1, `${tag}: hero trigger count ${initial.heroTriggers}`);
  }
  check(initial.lenis === null || initial.lenis === 1, `${tag}: Lenis count ${initial.lenis}`);
  check(initial.overflowX === false, `${tag}: horizontal overflow at load`);

  // Exactly one video element; its source is deferred while the section is far
  // below the viewport, and no slideshow images remain.
  check(initial.video.count === 1, `${tag}: video count ${initial.video.count}`);
  check(initial.video.exists, `${tag}: no video element`);
  check(initial.video.src === null, `${tag}: video src loaded too early (${initial.video.src})`);
  check(initial.video.poster === SHOWREEL.poster, `${tag}: poster ${initial.video.poster}`);
  check(initial.video.paused === true, `${tag}: offscreen video is already playing`);
  check(initial.capsule.posterVisibility === "hidden", `${tag}: capsule poster is visible`);
  check(
    initial.section.stickyDescendants === 1,
    `${tag}: expected exactly one sticky stage`,
  );

  // Tracking and width match.
  check(
    near(
      Number.parseFloat(initial.rows.topLetterSpacing),
      Number.parseFloat(initial.rows.topFont) * 0.01,
      0.2,
    ),
    `${tag}: tracking is ${initial.rows.topLetterSpacing}`,
  );
  check(
    Number.parseFloat(initial.rows.topGap) > Number.parseFloat(initial.rows.topFont) * 0.1,
    `${tag}: NEXT/LEVEL gap is ${initial.rows.topGap}`,
  );
  check(
    near(initial.rows.topWidth, initial.rows.bottomWidth, 2),
    `${tag}: rows are not width-matched (${initial.rows.topWidth} / ${initial.rows.bottomWidth})`,
  );
  check(
    initial.capsule.gapLeft > 4 && initial.capsule.gapRight > 4,
    `${tag}: capsule clearance ${initial.capsule.gapLeft}/${initial.capsule.gapRight}`,
  );

  // Entrance.
  const start = await readAt(page, 0, 250);
  const mid = await readAt(page, 0.15, 250);
  const settled = await readAt(page, 0.31, 900);
  await page.screenshot({ path: path.join(OUT, `${tag}-hold.png`) });

  const expectedStart = 1440 * 0.3;
  check(
    near(translationX(start.rows.topTransform), -expectedStart, 1.5),
    `${tag}: NEXT LEVEL starts at ${translationX(start.rows.topTransform)}`,
  );
  check(
    near(translationX(start.rows.bottomTransform), expectedStart, 1.5),
    `${tag}: PROJECTS starts at ${translationX(start.rows.bottomTransform)}`,
  );
  check(
    near(translationX(mid.rows.topTransform), -expectedStart * 0.25, 2),
    `${tag}: p15 is not (1-p)^2 (${translationX(mid.rows.topTransform)})`,
  );
  check(
    near(translationX(settled.rows.topTransform), 0, 0.5) &&
      near(translationX(settled.rows.bottomTransform), 0, 0.5),
    `${tag}: rows do not settle`,
  );
  check(
    settled.rows.topOpacity === "1" && settled.rows.bottomOpacity === "1",
    `${tag}: a headline row disappears at rest`,
  );
  check(
    settled.overflowX === false && mid.overflowX === false,
    `${tag}: horizontal overflow during the entrance`,
  );
  check(
    Object.values(settled.fragments).every(
      (fragment) => fragment && fragment.opacity === 1 && near(fragment.x, 0, 0.5),
    ),
    `${tag}: a fragment is already displaced at the hold`,
  );

  // The video starts once the section approaches the viewport, inside the
  // measured capsule, and plays muted.
  const waited = await waitForVideo(page);
  check(waited !== null, `${tag}: video did not start around the aligned hold`);
  const playingHold = await page.evaluate(READ);
  await assertVideoPlaying(`${tag}-hold`, playingHold);

  // Palette and capsule at the hold.
  const palette = COLORS.light;
  check(settled.rows.topColor === palette.top, `${tag}: top colour ${settled.rows.topColor}`);
  check(settled.rows.bottomColor === palette.bottom, `${tag}: bottom colour ${settled.rows.bottomColor}`);
  check(settled.capsule.borderColor === palette.border, `${tag}: capsule border ${settled.capsule.borderColor}`);
  check(
    settled.capsule.background === "rgba(0, 0, 0, 0)",
    `${tag}: capsule should be transparent in enhanced mode (${settled.capsule.background})`,
  );
  check(
    near(settled.capsule.width, initial.capsule.width, 0.5) &&
      near(settled.capsule.height, initial.capsule.height, 0.5),
    `${tag}: capsule changes size during the entrance`,
  );

  // Aperture rest: the clip must be the measured slider rectangle, and the
  // video must fill it.
  const rest = await readAt(page, 0.4, 900);
  check(
    near(rest.media.clipRect.left, rest.media.sliderRelative.left, 1.2) &&
      near(rest.media.clipRect.top, rest.media.sliderRelative.top, 1.2) &&
      near(rest.media.clipRect.width, rest.media.sliderRelative.width, 1.2) &&
      near(rest.media.clipRect.height, rest.media.sliderRelative.height, 1.2),
    `${tag}: aperture rest clip ${JSON.stringify(rest.media.clipRect)} != slider ${JSON.stringify(
      rest.media.sliderRelative,
    )}`,
  );
  check(
    near(rest.media.clip.radius, rest.media.sliderRelative.radius, 0.5),
    `${tag}: aperture rest radius ${rest.media.clip.radius}`,
  );
  check(rest.capsule.opacity > 0.95, `${tag}: capsule ring is not opaque at rest`);
  check(rest.capsule.posterVisibility === "hidden", `${tag}: capsule poster is visible`);
  check(rest.caption.opacity === 0, `${tag}: caption is visible at rest`);
  check(
    rest.video.rect &&
      rest.video.rect.width >= rest.media.sliderRelative.width - 1 &&
      rest.video.rect.height >= rest.media.sliderRelative.height - 1,
    `${tag}: video does not cover the capsule (${JSON.stringify(rest.video.rect)})`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}-rest.png`) });

  // Continuity: the same video node keeps playing while the aperture travels.
  await page.evaluate(() => {
    const video = document.querySelector("[data-nlp-video]");
    video.__nlpMarker = "same-video";
    const media = document.querySelector("[data-nlp-media]");
    media.__nlpMarker = "same-media";
  });
  const beforeExpand = await page.evaluate(READ);
  await scrollToProgress(page, 0.5, 500);
  const expanding = await page.evaluate(READ);
  const expandingMarker = await page.evaluate(() => {
    const video = document.querySelector("[data-nlp-video]");
    const media = document.querySelector("[data-nlp-media]");
    return { video: video?.__nlpMarker ?? null, media: media?.__nlpMarker ?? null };
  });
  check(
    expandingMarker.video === "same-video" && expandingMarker.media === "same-media",
    `${tag}: the video/media node was replaced during the aperture`,
  );
  check(
    advanced(beforeExpand.video.currentTime, expanding.video.currentTime, 0.2),
    `${tag}: video did not keep playing through the aperture (${beforeExpand.video.currentTime} -> ${expanding.video.currentTime})`,
  );
  check(
    expanding.video.paused === false,
    `${tag}: video paused because the aperture was expanding`,
  );
  await page.waitForTimeout(1600);
  const stillExpanding = await page.evaluate(READ);
  check(
    advanced(expanding.video.currentTime, stillExpanding.video.currentTime, 0.8),
    `${tag}: video stopped while the aperture was expanding`,
  );

  // Mid expansion: same clip grows, fragments part, ring releases.
  const midAperture = await readAt(page, 0.6, 900);
  await page.screenshot({ path: path.join(OUT, `${tag}-aperture-p60.png`) });
  check(
    midAperture.media.clipRect.width > rest.media.clipRect.width + 20 &&
      midAperture.media.clipRect.height > rest.media.clipRect.height + 20,
    `${tag}: aperture did not grow`,
  );
  check(
    midAperture.media.clipRect.width < midAperture.media.rect.width - 1 &&
      midAperture.media.clipRect.height < midAperture.media.rect.height - 1,
    `${tag}: aperture skipped the intermediate state`,
  );
  check(midAperture.media.clip.radius < rest.media.clip.radius, `${tag}: radius did not release`);
  check(midAperture.capsule.opacity === 0, `${tag}: capsule ring did not fade`);
  check(
    midAperture.fragments.pr.x < -10 &&
      midAperture.fragments.jects.x > 10 &&
      midAperture.fragments.next.x < -5 &&
      midAperture.fragments.level.x > 5,
    `${tag}: headline fragments did not part ${JSON.stringify(midAperture.fragments)}`,
  );
  check(
    Object.values(midAperture.fragments).every((fragment) => fragment.opacity < 0.35),
    `${tag}: headline fragments did not fade`,
  );
  check(midAperture.caption.opacity === 0, `${tag}: caption appeared before the full stage`);
  check(midAperture.video.paused === false, `${tag}: video paused mid-aperture`);
  check(
    advanced(rest.video.currentTime, midAperture.video.currentTime, 0.2),
    `${tag}: video restarted mid-aperture`,
  );

  // Full stage: edge-to-edge, still the same playing video.
  const full = await readAt(page, 0.85, 900);
  await page.screenshot({ path: path.join(OUT, `${tag}-full-p85.png`) });
  check(
    near(full.media.clip.top, 0, 0.5) &&
      near(full.media.clip.right, 0, 0.5) &&
      near(full.media.clip.bottom, 0, 0.5) &&
      near(full.media.clip.left, 0, 0.5),
    `${tag}: clip is not full-stage ${full.media.clipPath}`,
  );
  check(
    near(full.media.scale, 1.002, 0.004) &&
      near(full.media.translateX, 0, 0.8) &&
      near(full.media.translateY, 0, 0.8),
    `${tag}: showreel camera did not settle (${full.media.showreelTransform})`,
  );
  check(
    full.video.rect &&
      full.video.rect.width >= full.media.rect.width - 0.6 &&
      full.video.rect.height >= full.media.rect.height - 0.6 &&
      full.video.rect.width <= full.media.rect.width * 1.01 &&
      full.video.rect.height <= full.media.rect.height * 1.01,
    `${tag}: video is not edge-to-edge (${JSON.stringify(full.video.rect)} vs ${JSON.stringify(
      full.media.rect,
    )})`,
  );
  check(
    Object.values(full.fragments).every((fragment) => fragment.opacity === 0),
    `${tag}: a headline fragment remains over the full stage`,
  );
  check(
    full.caption.opacity > 0.9 && full.caption.q > 0.3,
    `${tag}: caption did not start revealing (${JSON.stringify(full.caption)})`,
  );
  check(full.caption.scrim !== null && full.caption.scrim > 0.5, `${tag}: scrim is not visible`);
  check(full.caption.color === "rgb(255, 255, 255)", `${tag}: caption colour ${full.caption.color}`);
  check(full.video.paused === false, `${tag}: video paused at the full stage`);
  await assertVideoPlaying(`${tag}-full`, full, 0);

  const captionA = full.caption.text;
  const captionB = (await readAt(page, 0.97, 700)).caption.text;
  check(captionA === captionB, `${tag}: caption text changed across the reveal`);
  check(
    captionA.includes("01 / The Creative Cat Showreel") &&
      captionA.includes("Creativity in motion.") &&
      captionA.includes("Strategy. Design. Technology. Motion."),
    `${tag}: caption is not the stable showreel caption (${captionA})`,
  );
  check(
    full.caption.accessibleLine === "Creativity in motion.",
    `${tag}: accessible caption line ${full.caption.accessibleLine}`,
  );
  check(full.caption.words.length === 3, `${tag}: expected three caption words`);
  check(
    full.caption.words.some((opacity) => opacity < 0.95),
    `${tag}: caption words are not revealing progressively`,
  );
  check(
    !/Right Sight|Urbancut|Splash Shine|Elegantic/i.test(captionA),
    `${tag}: caption still names the old project slideshow`,
  );
  check(full.overflowX === false, `${tag}: horizontal overflow at the full stage`);

  // Playback is monotonic and never seeks or restarts.
  const beforeLoop = full.video.currentTime;
  await page.waitForTimeout(1800);
  const afterLoop = await page.evaluate(READ);
  check(
    advanced(beforeLoop, afterLoop.video.currentTime, 0.8),
    `${tag}: full-stage video did not keep moving (${beforeLoop} -> ${afterLoop.video.currentTime})`,
  );

  // Reverse: the video keeps playing, and the capsule clip returns exactly.
  await scrollToProgress(page, 0.6, 600);
  const reverseBefore = await page.evaluate(READ);
  await page.waitForTimeout(1400);
  const reverseAfter = await page.evaluate(READ);
  check(
    reverseAfter.video.paused === false &&
      advanced(reverseBefore.video.currentTime, reverseAfter.video.currentTime, 0.6),
    `${tag}: video stopped while reversing through the aperture`,
  );
  check(reverseAfter.caption.opacity === 0, `${tag}: caption remained visible while reversing`);
  check(
    reverseAfter.video.currentTime > 1,
    `${tag}: reversing reset the video to the beginning`,
  );

  const reverseRest = await readAt(page, 0.31, 900);
  check(
    near(translationX(reverseRest.rows.topTransform), 0, 0.5) &&
      near(translationX(reverseRest.rows.bottomTransform), 0, 0.5),
    `${tag}: reverse did not restore the aligned rows`,
  );
  check(
    near(reverseRest.media.clipRect.width, reverseRest.media.sliderRelative.width, 1.2) &&
      near(reverseRest.media.clipRect.height, reverseRest.media.sliderRelative.height, 1.2),
    `${tag}: reverse did not restore the capsule clip`,
  );
  check(reverseRest.capsule.opacity > 0.95, `${tag}: reverse did not restore the ring`);
  check(
    Object.values(reverseRest.fragments).every(
      (fragment) => fragment.opacity === 1 && near(fragment.x, 0, 0.5),
    ),
    `${tag}: reverse did not restore the fragments`,
  );
  check(
    reverseRest.video.paused === false &&
      (reverseRest.video.currentTime >= reverseAfter.video.currentTime - 0.1 ||
        reverseRest.video.currentTime < reverseAfter.video.currentTime - 5),
    `${tag}: reverse restarted or paused the video`,
  );
  check(reverseRest.video.marker === "same-video", `${tag}: reverse replaced the video node`);

  // Sticky release.
  await scrollToProgress(page, 1, 700);
  const atEnd = await page.evaluate(READ);
  check(near(atEnd.stage.top, 0, 1.2), `${tag}: sticky stage is not at the top at p100`);
  await page.evaluate(() => {
    const root = document.querySelector("[data-next-level]");
    const bottom = root.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: bottom - window.innerHeight + 200, behavior: "instant" });
  });
  await page.waitForTimeout(600);
  const released = await page.evaluate(READ);
  check(
    near(released.stage.top, -200, 2),
    `${tag}: sticky stage did not release (${released.stage.top})`,
  );
  await page.screenshot({ path: path.join(OUT, `${tag}-release.png`) });

  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  results[`${tag}-errors`] = errors;
  results[`${tag}-initial`] = initial;
  results[`${tag}-rest`] = rest;
  results[`${tag}-full`] = full;
  await context.close();
}

async function runEnhancedDark(browser) {
  const { context, page, errors } = await open(browser, 1440, 900, { theme: "dark" });
  const tag = "1440x900-dark";
  const hold = await readAt(page, 0.31, 900);
  const palette = COLORS.dark;

  check(hold.mode === "enhanced", `${tag}: not enhanced`);
  check(hold.rows.topColor === palette.top, `${tag}: top colour ${hold.rows.topColor}`);
  check(hold.rows.bottomColor === palette.bottom, `${tag}: bottom colour ${hold.rows.bottomColor}`);
  check(hold.capsule.borderColor === palette.border, `${tag}: capsule border ${hold.capsule.borderColor}`);
  check(
    hold.capsule.background === "rgba(0, 0, 0, 0)",
    `${tag}: capsule is not transparent (${hold.capsule.background})`,
  );
  check(hold.overflowX === false, `${tag}: horizontal overflow`);
  await waitForVideo(page);
  await page.screenshot({ path: path.join(OUT, `${tag}-hold.png`) });

  const full = await readAt(page, 0.92, 900);
  check(full.caption.opacity === 1, `${tag}: caption is not visible`);
  check(full.caption.color === "rgb(255, 255, 255)", `${tag}: caption colour ${full.caption.color}`);
  await assertVideoPlaying(`${tag}-full`, full, 0);
  await page.screenshot({ path: path.join(OUT, `${tag}-full.png`) });

  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runEnhanced1024(browser) {
  const { context, page, errors } = await open(browser, 1024, 600, { theme: "light" });
  const tag = "1024x600-light";
  const hold = await readAt(page, 0.31, 800);

  check(hold.mode === "enhanced", `${tag}: not enhanced`);
  check(
    near(hold.section.height, 1140, 2),
    `${tag}: section height ${hold.section.height}`,
  );
  check(
    near(hold.rows.topWidth, hold.rows.bottomWidth, 2),
    `${tag}: rows not matched (${hold.rows.topWidth} / ${hold.rows.bottomWidth})`,
  );
  check(hold.overflowX === false, `${tag}: horizontal overflow`);
  await waitForVideo(page);
  await page.screenshot({ path: path.join(OUT, `${tag}-hold.png`) });

  const rest = await readAt(page, 0.4, 800);
  check(
    near(rest.media.clipRect.width, rest.media.sliderRelative.width, 1.2) &&
      near(rest.media.clipRect.height, rest.media.sliderRelative.height, 1.2),
    `${tag}: rest clip does not match the capsule`,
  );
  const full = await readAt(page, 0.95, 900);
  check(
    near(full.media.clip.top, 0, 0.5) && near(full.media.clip.left, 0, 0.5),
    `${tag}: full-stage clip ${full.media.clipPath}`,
  );
  check(full.caption.opacity === 1, `${tag}: caption missing`);
  await assertVideoPlaying(`${tag}-full`, full, 0);
  await page.screenshot({ path: path.join(OUT, `${tag}-full.png`) });
  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runLens(browser) {
  const { context, page, errors } = await open(browser, 1440, 900);
  const tag = "1440x900-light-lens";

  await scrollToProgress(page, 0.31, 900);
  const point = await page.evaluate(() => {
    const rect = document.querySelector('[data-nlp-line="top"]').getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width * 0.6),
      y: Math.round(rect.top + rect.height / 2),
    };
  });

  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(600);
  const lens = await page.evaluate(READ);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });

  check(lens.lens.display !== "none", `${tag}: lens is display:none on a fine pointer`);
  check(lens.lens.visibility === "visible", `${tag}: lens did not appear`);
  check(lens.lens.width === 120 && lens.lens.height === 120, `${tag}: lens is not 120px`);
  check(lens.lens.background === COLORS.coral, `${tag}: lens is not coral`);
  check(lens.lens.pointerEvents === "none", `${tag}: lens captures pointer events`);
  check(lens.lens.ariaHidden === "true", `${tag}: lens is exposed to assistive tech`);
  check(
    lens.lens.cloneDelta !== null &&
      near(lens.lens.cloneDelta.left, 0, 1.5) &&
      near(lens.lens.cloneDelta.top, 0, 1.5),
    `${tag}: lens clone misaligned ${JSON.stringify(lens.lens.cloneDelta)}`,
  );
  check(
    (lens.lens.cloneFilter || "").includes("invert(1)"),
    `${tag}: lens poster is not inverted (${lens.lens.cloneFilter})`,
  );
  check(lens.lens.cloneVideoCount === 0, `${tag}: lens cloned the video element`);
  check(lens.lens.clonePosterSrc === SHOWREEL.poster, `${tag}: lens poster is stale`);

  // The lens must hide while the pointer is over the live video capsule.
  const capsulePoint = await page.evaluate(() => {
    const rect = document.querySelector("[data-nlp-capsule]").getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  });
  await page.mouse.move(capsulePoint.x, capsulePoint.y);
  await page.waitForTimeout(600);
  const overCapsule = await page.evaluate(READ);
  check(overCapsule.lens.visibility === "hidden", `${tag}: lens stayed visible over the video capsule`);

  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(500);
  const backOverLetters = await page.evaluate(READ);
  check(backOverLetters.lens.visibility === "visible", `${tag}: lens did not return over the letters`);

  // Hides on scroll and departure.
  await page.mouse.wheel(0, 60);
  await page.waitForTimeout(500);
  const afterScroll = await page.evaluate(READ);
  check(afterScroll.lens.visibility === "hidden", `${tag}: lens stayed visible after scroll`);

  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(450);
  await page.mouse.move(10, 20);
  await page.waitForTimeout(500);
  const afterLeave = await page.evaluate(READ);
  check(afterLeave.lens.visibility === "hidden", `${tag}: lens stayed visible after departure`);

  // Disabled while the aperture is open, restored on reverse.
  await scrollToProgress(page, 0.6, 700);
  await page.mouse.move(720, 450);
  await page.waitForTimeout(500);
  const during = await page.evaluate(READ);
  check(during.aperture === null || during.aperture.a > 0.02, `${tag}: aperture did not start`);
  check(during.lens.visibility === "hidden", `${tag}: lens appeared over the aperture`);

  await scrollToProgress(page, 0.31, 700);
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(600);
  const back = await page.evaluate(READ);
  check(back.lens.visibility === "visible", `${tag}: lens did not return after reverse`);
  check(back.lens.clonePosterSrc === SHOWREEL.poster, `${tag}: lens poster did not resync`);

  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runPause(browser) {
  const { context, page, errors } = await open(browser, 1440, 900);
  const tag = "1440x900-light-pause";

  await scrollToProgress(page, 0.95, 900);
  const started = await waitForVideo(page);
  check(started !== null, `${tag}: video did not start before pausing`);

  await page.locator("[data-menu-trigger]").click();
  await page.waitForTimeout(900);

  const ribbonSwitch = page.getByRole("switch", { name: "Service ribbon motion" });
  const showreelSwitch = page.getByRole("switch", { name: "Showreel motion" });
  check((await ribbonSwitch.count()) === 1, `${tag}: ribbon switch disappeared`);
  check((await showreelSwitch.count()) === 1, `${tag}: showreel switch missing`);
  check((await showreelSwitch.getAttribute("aria-checked")) === "true", `${tag}: switch starts off`);

  await showreelSwitch.click();
  await page.waitForTimeout(300);
  check(
    (await showreelSwitch.getAttribute("aria-checked")) === "false",
    `${tag}: switch did not report paused`,
  );
  const pausedBefore = await page.evaluate(READ);
  await page.waitForTimeout(2600);
  const pausedAfter = await page.evaluate(READ);
  check(
    Math.abs(pausedAfter.video.currentTime - pausedBefore.video.currentTime) < 0.05,
    `${tag}: paused video advanced (${pausedBefore.video.currentTime} -> ${pausedAfter.video.currentTime})`,
  );
  check(pausedAfter.video.paused === true, `${tag}: video still reports playing`);

  // Preference survives contraction and re-expansion.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  await scrollToProgress(page, 0.31, 800);
  await page.waitForTimeout(1500);
  const holdPaused = await page.evaluate(READ);
  check(
    Math.abs(holdPaused.video.currentTime - pausedAfter.video.currentTime) < 0.05,
    `${tag}: pause did not survive contraction`,
  );

  await scrollToProgress(page, 0.95, 800);
  await page.waitForTimeout(1500);
  const fullPaused = await page.evaluate(READ);
  check(
    Math.abs(fullPaused.video.currentTime - pausedAfter.video.currentTime) < 0.05,
    `${tag}: pause did not survive re-expansion`,
  );

  await page.locator("[data-menu-trigger]").click();
  await page.waitForTimeout(900);
  const showreelSwitchAgain = page.getByRole("switch", { name: "Showreel motion" });
  check(
    (await showreelSwitchAgain.getAttribute("aria-checked")) === "false",
    `${tag}: switch lost the paused preference`,
  );
  await showreelSwitchAgain.click();
  await page.waitForTimeout(2800);
  const resumed = await page.evaluate(READ);
  check(
    resumed.video.paused === false &&
      advanced(fullPaused.video.currentTime, resumed.video.currentTime, 1),
    `${tag}: reel did not resume`,
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // Offscreen pause.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(1200);
  const offscreenBefore = await page.evaluate(READ);
  await page.waitForTimeout(2400);
  const offscreenAfter = await page.evaluate(READ);
  check(
    Math.abs(offscreenAfter.video.currentTime - offscreenBefore.video.currentTime) < 0.05,
    `${tag}: video kept playing offscreen`,
  );

  // Document-hidden pause. Chromium's real visibility cannot be forced from a
  // page, so the owned listener is exercised through the same property.
  await scrollToProgress(page, 0.95, 900);
  await waitForVideo(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(400);
  const hiddenBefore = await page.evaluate(READ);
  await page.waitForTimeout(1400);
  const hiddenAfter = await page.evaluate(READ);
  check(
    Math.abs(hiddenAfter.video.currentTime - hiddenBefore.video.currentTime) < 0.05,
    `${tag}: video kept playing while the document was hidden`,
  );
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(1800);
  const visibleAgain = await page.evaluate(READ);
  check(
    visibleAgain.video.paused === false &&
      advanced(hiddenAfter.video.currentTime, visibleAgain.video.currentTime, 0.4),
    `${tag}: video did not resume after the document became visible`,
  );

  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runRapidScroll(browser) {
  const { context, page, errors } = await open(browser, 1440, 900);
  const tag = "1440x900-light-rapid";

  await scrollToProgress(page, 0.95, 900);
  await waitForVideo(page);
  await page.evaluate(() => {
    document.querySelector("[data-nlp-video]").__nlpMarker = "rapid";
  });

  let previousTime = 0;
  for (const progress of [0.31, 0.95, 0.5, 0.31, 0.9, 1, 0.31]) {
    await scrollToProgress(page, progress, 140);
    const state = await page.evaluate(READ);
    check(state.video.count === 1, `${tag}: video count ${state.video.count} at ${progress}`);
    check(state.video.src === SHOWREEL.src, `${tag}: unexpected source at ${progress}`);
    check(state.video.marker === "rapid", `${tag}: video node replaced at ${progress}`);
    check(state.video.paused === false, `${tag}: video paused at ${progress}`);
    check(
      state.video.currentTime >= previousTime - 0.05 ||
        state.video.currentTime < previousTime - 5,
      `${tag}: video time went backwards at ${progress} (${previousTime} -> ${state.video.currentTime})`,
    );
    previousTime = state.video.currentTime;
    check(state.overflowX === false, `${tag}: overflow at ${progress}`);
  }
  check(previousTime > 0.3, `${tag}: video never advanced during rapid scrolling`);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });
  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function runStatic(browser, width, height, options) {
  const { context, page, errors } = await open(browser, width, height, options);
  const tag = `${width}x${height}-${options.label}`;

  await page.evaluate(() => {
    const root = document.querySelector("[data-next-level]");
    window.scrollTo({
      top: root.getBoundingClientRect().top + window.scrollY - 100,
      behavior: "instant",
    });
  });
  await page.waitForTimeout(900);
  const state = await page.evaluate(READ);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });

  check(state.mode === "static", `${tag}: mode ${state.mode}`);
  check(state.overflowX === false, `${tag}: horizontal overflow`);
  check(state.section.stickyDescendants === 0, `${tag}: sticky stage present`);
  check(state.section.legacyApertureParts === 0, `${tag}: legacy aperture DOM present`);
  check(
    near(state.rows.topWidth, state.rows.bottomWidth, 2.5),
    `${tag}: rows not matched (${state.rows.topWidth} / ${state.rows.bottomWidth})`,
  );
  const palette = COLORS[options.theme || "light"];
  check(state.rows.topColor === palette.top, `${tag}: top colour ${state.rows.topColor}`);
  check(state.rows.bottomColor === palette.bottom, `${tag}: bottom colour ${state.rows.bottomColor}`);
  check(state.capsule.borderColor === palette.border, `${tag}: capsule border ${state.capsule.borderColor}`);
  check(
    state.capsule.background === palette.background,
    `${tag}: static capsule rim ${state.capsule.background}`,
  );
  check(state.caption.position === "static", `${tag}: caption is not in flow`);
  check(state.caption.opacity === 1, `${tag}: caption is hidden`);
  check(
    state.caption.text.includes("The Creative Cat Showreel") &&
      state.caption.text.includes("Creativity in motion."),
    `${tag}: caption text ${state.caption.text}`,
  );
  check(state.capsule.posterVisibility === "visible", `${tag}: capsule poster is hidden`);
  check(state.capsule.posterSrc === SHOWREEL.poster, `${tag}: capsule poster ${state.capsule.posterSrc}`);
  if (state.apertureTriggers !== null) {
    check(state.apertureTriggers === 0, `${tag}: static mode created a trigger`);
  }

  if (options.reduced) {
    check(state.motion === "off", `${tag}: motion attribute ${state.motion}`);
    check(state.lens.display === "none", `${tag}: lens is visible`);
    check(state.rows.topTransform === "none", `${tag}: rows are translated`);
    check(state.rows.bottomTransform === "none", `${tag}: rows are translated`);
    check(state.media.display === "none", `${tag}: video layer is visible`);
    check(state.figure.display === "block", `${tag}: poster still is hidden`);
    check(state.figure.src === SHOWREEL.poster, `${tag}: poster src ${state.figure.src}`);
    check((state.figure.alt || "").includes("Creative Cat"), `${tag}: poster alt ${state.figure.alt}`);
    check(state.video.paused === true, `${tag}: reduced-motion video is playing`);
    check(state.video.src === null, `${tag}: reduced-motion video loaded a source`);
    check(state.figure.naturalWidth > 0, `${tag}: poster image did not load`);
    const before = state.video.currentTime;
    await page.waitForTimeout(1800);
    const after = await page.evaluate(READ);
    check(after.video.currentTime === before, `${tag}: reduced-motion video advanced`);
  } else {
    check(state.motion === "on", `${tag}: motion attribute ${state.motion}`);
    check(state.media.display === "block", `${tag}: natural-flow video is hidden`);
    check(
      state.media.position === "relative",
      `${tag}: natural-flow media position ${state.media.position}`,
    );
    check(state.media.rect.width <= state.stage.width + 1, `${tag}: media overflows the stage`);
    check(state.figure.display === "none", `${tag}: duplicate poster still is visible`);
    const started = await waitForVideo(page);
    check(started !== null, `${tag}: natural-flow video did not start`);
    const playing = await page.evaluate(READ);
    await assertVideoPlaying(`${tag}-natural`, playing, 0);
    check(playing.video.count === 1, `${tag}: second video element present`);
  }

  if (options.touch) {
    check(state.lens.display === "none", `${tag}: lens is visible on a coarse pointer`);
    const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
    check(coarse, `${tag}: touch emulation did not report a coarse pointer`);
  }

  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  results[`${tag}-state`] = state;
  await context.close();
}

async function runNoJs(browser, width, height) {
  const { context, page, errors } = await open(browser, width, height, { js: false });
  const tag = `${width}x${height}-nojs`;

  await page.evaluate(() => {
    const root = document.querySelector("[data-next-level]");
    window.scrollTo({
      top: root.getBoundingClientRect().top + window.scrollY - 100,
      behavior: "instant",
    });
  });
  await page.waitForTimeout(600);
  const state = await page.evaluate(READ);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });

  check(state.overflowX === false, `${tag}: horizontal overflow`);
  check(state.section.stickyDescendants === 0, `${tag}: sticky stage present`);
  check(
    near(state.rows.topWidth, state.rows.bottomWidth, 1.5),
    `${tag}: no-JS rows not matched (${state.rows.topWidth} / ${state.rows.bottomWidth})`,
  );
  check(
    state.rows.topWidth <= state.title.width + 1,
    `${tag}: no-JS top row overflows its measure (${state.rows.topWidth} > ${state.title.width})`,
  );
  check(state.rows.topTransform === "none", `${tag}: no-JS rows are translated`);
  check(state.media.display === "none", `${tag}: no-JS video layer is visible`);
  check(state.video.paused === true, `${tag}: no-JS video is playing`);
  check(state.video.src === null, `${tag}: no-JS video loaded a source`);
  check(state.figure.display === "block", `${tag}: no-JS poster is hidden`);
  check(state.figure.src === SHOWREEL.poster, `${tag}: no-JS poster src ${state.figure.src}`);
  check(state.caption.position === "static", `${tag}: no-JS caption is not in flow`);
  check(state.caption.opacity === 1, `${tag}: no-JS caption is hidden`);
  check(state.headingCount === 1, `${tag}: expected one heading`);
  check(state.video.count === 1, `${tag}: no-JS video count ${state.video.count}`);
  check(
    state.section.height < height * 2,
    `${tag}: no-JS section reserves a runway (${state.section.height})`,
  );
  check(errors.length === 0, `${tag}: console/page errors: ${errors.join(" | ")}`);
  results[`${tag}-state`] = state;
  await context.close();
}

(async () => {
  const browser = await chromium.launch(launchOptions());

  // Asset integrity is checked once, against the served files.
  const assetContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const assetPage = await assetContext.newPage();
  await assetPage.goto(BASE, { waitUntil: "domcontentloaded" });
  await runAssetChecks(assetPage);
  await assetContext.close();

  await runEnhancedLight(browser);
  await runEnhancedDark(browser);
  await runEnhanced1024(browser);
  await runLens(browser);
  await runPause(browser);
  await runRapidScroll(browser);

  await runStatic(browser, 834, 1194, { label: "light" });
  await runStatic(browser, 1024, 500, { label: "short" });
  await runStatic(browser, 390, 844, { label: "light" });
  await runStatic(browser, 390, 844, { label: "touch", touch: true });
  await runStatic(browser, 1440, 900, { label: "reduced", reduced: true });
  await runStatic(browser, 1440, 900, {
    label: "reduced-dark",
    reduced: true,
    theme: "dark",
  });

  await runNoJs(browser, 1440, 900);
  await runNoJs(browser, 390, 844);
  await runNoJs(browser, 320, 700);

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
        summary: Object.fromEntries(
          Object.entries(results).map(([name, value]) => [
            name,
            value && value.section
              ? {
                  height: value.section.height,
                  rows: `${value.rows.topWidth}/${value.rows.bottomWidth}`,
                  mode: value.mode,
                  clip: value.media.clipPath,
                  caption: value.caption.opacity,
                  video: value.video.src,
                  paused: value.video.paused,
                  time: value.video.currentTime,
                  lens: value.lens?.display,
                  overflowX: value.overflowX,
                  triggers: value.apertureTriggers,
                }
              : value,
          ]),
        ),
      },
      null,
      1,
    ),
  );

  await browser.close();
  if (failures.length > 0) process.exitCode = 1;
})();
