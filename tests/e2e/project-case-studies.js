/*
 * DEL-02 — individual project case studies.
 *
 * Read-only verification against the running site. Covers all 13 canonical
 * routes, the shared case-study architecture, complete canonical cover framing,
 * conditional sections, palette provenance and copy interaction, native sticky
 * behaviour and release, Next Project wrapping, both themes, desktop/tablet/
 * mobile, reduced motion, no-JS, 404 and the preserved route/archive contract.
 *
 * Usage:
 *   HERO_BASE_URL=http://localhost:3000/ node tests/e2e/project-case-studies.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const OUT = out("del02");

const failures = [];
const results = {};

function check(condition, message) {
  if (!condition) {
    failures.push(message);
    console.log(`FAIL ${message}`);
  }
}

const near = (a, b, tolerance = 1) =>
  Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;

const PROJECTS = [
  {
    slug: "right-sight",
    name: "Right Sight",
    client: "Rightsight Education",
    coverRatio: 1,
    palette: 6,
    paletteHex: "#DE1B52",
    gallery: 4,
    outcome: false,
  },
  {
    slug: "zero",
    name: "Zero",
    client: "ZERO TV",
    coverRatio: 1672 / 941,
    palette: 4,
    paletteHex: "#FF4B00",
    gallery: 3,
    outcome: false,
  },
  {
    slug: "exciting-sundarban",
    name: "Exciting Sundarban",
    client: "Exciting Sundarban",
    coverRatio: 1,
    palette: 4,
    paletteHex: "#1A5C3A",
    gallery: 3,
    outcome: false,
  },
  {
    slug: "splash-shine",
    name: "Splash Shine",
    client: "Splash n Shine",
    coverRatio: 1,
    palette: 4,
    paletteHex: "#1F4E33",
    gallery: 3,
    outcome: false,
  },
  {
    slug: "gdri",
    name: "GDRI",
    client: "Global Development and Research Initiative Foundation (GDRI)",
    coverRatio: 1,
    palette: 4,
    paletteHex: "#0A253E",
    gallery: 2,
    outcome: false,
  },
  {
    slug: "project-we",
    name: "Project WE",
    client: "Project WE",
    coverRatio: 1,
    palette: 4,
    paletteHex: "#D3293B",
    gallery: 4,
    outcome: true,
    challenge: true,
  },
  {
    slug: "zero-blind-spots",
    name: "Zero Blind Spots",
    client: null,
    coverRatio: 1672 / 941,
    palette: 4,
    paletteHex: "#FF7000",
    gallery: 0,
    outcome: false,
    artworkOnly: true,
  },
  {
    slug: "dipakkhik",
    name: "Dipakkhik",
    client: "Dipakkhik",
    coverRatio: 1,
    palette: 3,
    paletteHex: "#311222",
    gallery: 4,
    outcome: true,
    typography: true,
    challenge: true,
  },
  {
    slug: "urbancut",
    name: "Urbancut",
    client: "Urbancut Salon",
    coverRatio: 1,
    palette: 5,
    paletteHex: "#8A3641",
    gallery: 3,
    outcome: false,
  },
  {
    slug: "oralshine",
    name: "OralShine",
    client: "Oral Shine",
    coverRatio: 1,
    palette: 5,
    paletteHex: "#2E466D",
    gallery: 2,
    outcome: false,
  },
  {
    slug: "flex",
    name: "FLEX",
    client: "Flex",
    coverRatio: 1,
    palette: 5,
    paletteHex: "#9CFF2F",
    gallery: 2,
    outcome: false,
  },
  {
    slug: "elegantic",
    name: "Elegantic",
    client: "Elegantic",
    coverRatio: 1,
    palette: 5,
    paletteHex: "#B69D74",
    gallery: 2,
    outcome: false,
  },
  {
    slug: "yogic-rhythm",
    name: "Yogic Rhythm",
    client: "Yogic Rhythm",
    coverRatio: 1672 / 941,
    palette: 5,
    paletteHex: "#631054",
    gallery: 3,
    outcome: false,
  },
];

const NEXT = {
  "right-sight": "/work/zero",
  zero: "/work/exciting-sundarban",
  "exciting-sundarban": "/work/splash-shine",
  "splash-shine": "/work/gdri",
  gdri: "/work/project-we",
  "project-we": "/work/zero-blind-spots",
  "zero-blind-spots": "/work/dipakkhik",
  dipakkhik: "/work/urbancut",
  urbancut: "/work/oralshine",
  oralshine: "/work/flex",
  flex: "/work/elegantic",
  elegantic: "/work/yogic-rhythm",
  "yogic-rhythm": "/work/right-sight",
};

async function open(browser, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1440, height: 900 },
    colorScheme: options.theme || "light",
    reducedMotion: options.reduced ? "reduce" : "no-preference",
    javaScriptEnabled: options.js !== false,
    permissions: options.clipboard
      ? ["clipboard-read", "clipboard-write"]
      : undefined,
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
    await page.waitForTimeout(700);
  }
  return { context, page, errors };
}

const READ = () => {
  const rect = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return {
      left: +box.left.toFixed(1),
      top: +box.top.toFixed(1),
      width: +box.width.toFixed(1),
      height: +box.height.toFixed(1),
      right: +box.right.toFixed(1),
      bottom: +box.bottom.toFixed(1),
    };
  };
  const heroImage = document.querySelector("[data-case-hero-frame] img");
  const sticky = document.querySelector("[data-case-sticky]");
  const meta = document.querySelector("[data-project-meta]");
  const paletteButtons = [...document.querySelectorAll("[data-case-palette] button")];

  return {
    title: document.querySelector("h1")?.textContent?.trim() ?? null,
    intro: document.querySelector("[data-case-header] p:last-child")?.textContent?.trim() ?? null,
    back: document.querySelector('a[href="/work"]')?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    metaText: meta?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    sections: [...document.querySelectorAll("[data-case-section]")].map((section) => section.id),
    nav: [...document.querySelectorAll('[aria-label="Case study sections"] a')].map((link) => link.getAttribute("href")),
    palette: paletteButtons.map((button) => ({
      label: button.getAttribute("aria-label"),
      provenance: button.textContent?.replace(/\s+/g, " ").trim() ?? "",
      chip: button.firstElementChild
        ? getComputedStyle(button.firstElementChild).backgroundColor
        : null,
    })),
    typography: Boolean(document.querySelector("[data-case-typography]")),
    typingText: document.querySelector("[data-case-typography]")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    galleryBlocks: document.querySelectorAll("[data-case-media-grid]").length,
    mediaCount: document.querySelectorAll("[data-case-study] img").length,
    sources: document.querySelector("[data-case-sources]")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    outcome: document.querySelector("#outcomes")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    next: document.querySelector("[data-project-next]")?.getAttribute("href") ?? null,
    cover: heroImage
      ? {
          complete: heroImage.complete,
          naturalWidth: heroImage.naturalWidth,
          naturalHeight: heroImage.naturalHeight,
          fit: getComputedStyle(heroImage).objectFit,
          ratio:
            heroImage.getBoundingClientRect().width /
            heroImage.getBoundingClientRect().height,
        }
      : null,
    frame: rect("[data-case-hero-frame]"),
    main: rect("[data-case-main]"),
    grid: rect("[data-case-grid]"),
    sidebar: rect("[data-case-sidebar]"),
    sticky: sticky
      ? {
          position: getComputedStyle(sticky).position,
          top: rect("[data-case-sticky]")?.top,
          bottom: rect("[data-case-sticky]")?.bottom,
          padding: getComputedStyle(sticky).padding,
          background: getComputedStyle(sticky).backgroundColor,
        }
      : null,
    paletteColumns: getComputedStyle(
      document.querySelector("[data-case-palette-grid]"),
    ).gridTemplateColumns.split(" ").filter(Boolean).length,
    nextColumns: getComputedStyle(
      document.querySelector("[data-case-next-card]"),
    ).gridTemplateColumns.split(" ").filter(Boolean).length,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    headerSurface: document.querySelector("header[data-surface]")?.getAttribute("data-surface"),
    headerColor: document.querySelector("header[data-surface]")
      ? getComputedStyle(document.querySelector("header[data-surface]")).color
      : null,
    projectCountText: /\b\d{1,2}\s*\/\s*13\b/.test(document.body.innerText),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    revealCount: document.querySelectorAll("[data-case-reveal]").length,
    revealVisible: [...document.querySelectorAll("[data-case-reveal]")].every(
      (element) =>
        getComputedStyle(element).opacity === "1" &&
        getComputedStyle(element).visibility === "visible",
    ),
    heroCount: document.querySelectorAll("[data-case-hero-frame] img").length,
    nextMedia: Boolean(document.querySelector("[data-case-next-media] img")),
  };
};

async function openProject(browser, slug, options = {}) {
  return open(browser, {
    ...options,
    url: new URL(`/work/${slug}`, BASE).href,
  });
}

async function scrollThrough(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let top = 0; top < height; top += 720) {
    await page.evaluate((value) => window.scrollTo(0, value), top);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(450);
}

async function runContent(browser) {
  const tag = "content";
  for (const project of PROJECTS) {
    const { context, page, errors } = await openProject(browser, project.slug);
    await scrollThrough(page);
    const state = await page.evaluate(READ);

    check(state.title === project.name, `${tag}: ${project.slug} title ${state.title}`);
    check(Boolean(state.intro && state.intro.length > 60), `${tag}: ${project.slug} intro missing`);
    check(state.back === "Back to Work", `${tag}: ${project.slug} back label ${state.back}`);
    check(state.next === NEXT[project.slug], `${tag}: ${project.slug} next ${state.next}`);
    check(!state.projectCountText, `${tag}: ${project.slug} shows a project total`);
    check(state.overflowX === false, `${tag}: ${project.slug} horizontal overflow`);
    check(state.heroCount === 1, `${tag}: ${project.slug} hero count ${state.heroCount}`);
    check(state.nextMedia, `${tag}: ${project.slug} next preview missing`);
    check(state.palette.length === project.palette, `${tag}: ${project.slug} palette ${state.palette.length}`);
    check(
      state.palette.every((swatch) => swatch.label?.includes("Copy") && swatch.label?.includes("HEX")),
      `${tag}: ${project.slug} palette labels`,
    );
    check(
      state.palette.some((swatch) => swatch.label?.includes(project.paletteHex)),
      `${tag}: ${project.slug} expected HEX ${project.paletteHex} missing`,
    );
    check(
      state.palette.every((swatch) =>
        /(Brand artwork|Published portfolio|Artwork-sampled)/i.test(swatch.provenance),
      ),
      `${tag}: ${project.slug} palette provenance missing`,
    );
    check(state.galleryBlocks === project.gallery, `${tag}: ${project.slug} gallery blocks ${state.galleryBlocks}`);

    check(
      Boolean(state.cover && state.cover.complete && state.cover.naturalWidth > 0),
      `${tag}: ${project.slug} cover not decoded`,
    );
    check(state.cover?.fit === "cover", `${tag}: ${project.slug} cover fit ${state.cover?.fit}`);
    check(
      near(state.cover?.ratio, project.coverRatio, 0.02),
      `${tag}: ${project.slug} cover ratio ${state.cover?.ratio} vs ${project.coverRatio}`,
    );
    check(
      near(state.frame?.width, state.main?.width ?? 0, 1),
      `${tag}: ${project.slug} cover is not the full main column`,
    );

    if (project.client) {
      check(
        state.metaText?.includes(project.client),
        `${tag}: ${project.slug} client ${project.client} missing`,
      );
    } else {
      check(
        !/Client/i.test(state.metaText ?? ""),
        `${tag}: ${project.slug} shows a client that is not published`,
      );
    }

    if (project.artworkOnly) {
      check(
        state.sections.join(",") === "overview,creative-direction,style-guide",
        `${tag}: ${project.slug} sections ${state.sections}`,
      );
      check(
        (state.sources ?? "").includes("Artwork review only"),
        `${tag}: ${project.slug} artwork-only provenance missing`,
      );
      check(state.galleryBlocks === 0, `${tag}: ${project.slug} empty gallery rendered`);
    } else {
      check(state.sections.includes("overview"), `${tag}: ${project.slug} overview missing`);
      check(state.sections.includes("work-scope"), `${tag}: ${project.slug} work scope missing`);
      check(state.sections.includes("creative-direction"), `${tag}: ${project.slug} direction missing`);
      check(state.sections.includes("style-guide"), `${tag}: ${project.slug} style guide missing`);
      check(state.sections.includes("gallery"), `${tag}: ${project.slug} gallery missing`);
      check(
        (state.sources ?? "").includes("Published project record plus artwork review"),
        `${tag}: ${project.slug} published provenance missing`,
      );
    }

    check(
      state.sections.includes("outcomes") === project.outcome,
      `${tag}: ${project.slug} outcome section mismatch`,
    );
    check(
      state.sections.includes("challenges") === Boolean(project.challenge),
      `${tag}: ${project.slug} challenges section mismatch`,
    );
    check(
      state.typography === Boolean(project.typography),
      `${tag}: ${project.slug} typography section mismatch`,
    );
    if (project.typography) {
      check(
        ["Clash Display", "Waterfall Regular", "Metropolis"].every((family) =>
          (state.typingText ?? "").includes(family),
        ),
        `${tag}: ${project.slug} verified families missing`,
      );
    }

    check(
      state.nav.join(",") === state.sections.map((id) => `#${id}`).join(","),
      `${tag}: ${project.slug} contents nav does not match rendered sections`,
    );

    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("[data-case-study] img")]
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
    );
    check(broken.length === 0, `${tag}: ${project.slug} broken media ${broken.join(", ")}`);
    check(errors.length === 0, `${tag}: ${project.slug} console errors ${errors.join(" | ")}`);

    results[project.slug] = {
      sections: state.sections,
      palette: state.palette.length,
      gallery: state.galleryBlocks,
      media: state.mediaCount,
      cover: state.cover,
      next: state.next,
    };
    await context.close();
  }
}

async function runSticky(browser) {
  const tag = "sticky";
  const { context, page, errors } = await openProject(browser, "right-sight");
  const initial = await page.evaluate(READ);
  check(initial.sticky?.position === "sticky", `${tag}: desktop position ${initial.sticky?.position}`);
  check(
    near(initial.sidebar?.width, 240, 2),
    `${tag}: desktop rail width ${initial.sidebar?.width}`,
  );
  check(
    initial.sidebar.left < initial.main.left,
    `${tag}: rail is not beside the narrative`,
  );

  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(700);
  const scrolled = await page.evaluate(READ);
  check(
    scrolled.sticky.position === "sticky" &&
      scrolled.sticky.top >= 90 &&
      scrolled.sticky.top <= 130,
    `${tag}: rail did not stick (${scrolled.sticky.top})`,
  );
  check(
    scrolled.sticky.bottom <= 900,
    `${tag}: rail exceeds the viewport (${scrolled.sticky.bottom})`,
  );
  await page.screenshot({ path: path.join(OUT, "sticky-sidebar.png") });

  // Release naturally at the end of the grid, before Next Project.
  const release = await page.evaluate(() => {
    const grid = document.querySelector("[data-case-grid]");
    const gridBottom = grid.getBoundingClientRect().bottom + window.scrollY;
    const nextTop = document
      .querySelector("[data-case-next]")
      .getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, gridBottom - 900));
    return { gridBottom, nextTop };
  });
  await page.waitForTimeout(700);
  const released = await page.evaluate(() => {
    const sticky = document.querySelector("[data-case-sticky]").getBoundingClientRect();
    const grid = document.querySelector("[data-case-grid]").getBoundingClientRect();
    return { top: +sticky.top.toFixed(1), bottom: +sticky.bottom.toFixed(1), gridBottom: +grid.bottom.toFixed(1) };
  });
  check(
    released.bottom <= released.gridBottom + 2,
    `${tag}: rail overruns the grid (${released.bottom}/${released.gridBottom})`,
  );
  check(
    release.nextTop > release.gridBottom,
    `${tag}: Next Project is not after the grid`,
  );

  // Short desktop viewports fall back to natural flow.
  const short = await openProject(browser, "right-sight", { viewport: { width: 1024, height: 600 } });
  const shortState = await short.page.evaluate(READ);
  check(shortState.sticky?.position === "static", `${tag}: 1024x600 position ${shortState.sticky?.position}`);
  await short.context.close();

  check(errors.length === 0, `${tag}: console errors ${errors.join(" | ")}`);
  await context.close();
}

async function runInteraction(browser) {
  const tag = "interaction";
  const { context, page, errors } = await openProject(browser, "right-sight", {
    clipboard: true,
  });

  await page.evaluate(() => {
    const section = document.querySelector("#style-guide");
    window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - 100);
  });
  await page.waitForTimeout(900);
  await page.locator("[data-case-palette] button").first().click();
  await page.waitForTimeout(250);
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const live = await page.locator("[data-case-palette] p[aria-live]").textContent();
  check(copied === "#241A57", `${tag}: clipboard ${copied}`);
  check((live ?? "").includes("Copied #241A57"), `${tag}: live region ${live}`);
  await page.screenshot({ path: path.join(OUT, "palette-copied.png") });

  await page.locator('button:has-text("Copy project link")').click();
  await page.waitForTimeout(250);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  check(
    link === new URL("/work/right-sight", BASE).href,
    `${tag}: project link ${link}`,
  );

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  // Move to the information rail with a real wheel gesture first; clicking a
  // link Playwright has to auto-scroll into view fights Lenis's smooth anchor.
  await page.mouse.move(200, 500);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1100);
  await page.locator('[aria-label="Case study sections"] a[href="#style-guide"]').click();
  await page
    .waitForFunction(
      () => {
        const top = document.querySelector("#style-guide").getBoundingClientRect().top;
        return top >= 60 && top <= 220;
      },
      null,
      { timeout: 5000 },
    )
    .catch(() => {});
  const anchor = await page.evaluate(() => ({
    hash: location.hash,
    top: Math.round(document.querySelector("#style-guide").getBoundingClientRect().top),
  }));
  check(anchor.hash === "#style-guide", `${tag}: anchor hash ${anchor.hash}`);
  check(anchor.top >= 60 && anchor.top <= 220, `${tag}: anchor position ${anchor.top}`);
  check(errors.length === 0, `${tag}: console errors ${errors.join(" | ")}`);
  await context.close();
}

async function runResponsive(browser) {
  const tag = "responsive";
  for (const [width, height, label] of [
    [1920, 1080, "1920x1080"],
    [1024, 600, "1024x600"],
    [834, 1194, "834x1194"],
    [390, 844, "390x844"],
  ]) {
    const { context, page, errors } = await openProject(browser, "right-sight", {
      viewport: { width, height },
    });
    const state = await page.evaluate(READ);
    check(state.overflowX === false, `${tag}: ${label} overflow`);
    check(
      near(state.frame.width, state.main.width, 1.5),
      `${tag}: ${label} hero width ${state.frame.width}/${state.main.width}`,
    );
    if (width < 1024) {
      check(state.sticky.position === "static", `${tag}: ${label} rail is sticky`);
      check(
        state.sidebar.top <= state.frame.top,
        `${tag}: ${label} information does not precede the artwork`,
      );
      check(
        near(state.sidebar.width, state.grid.width, 1.5),
        `${tag}: ${label} information card width`,
      );
    } else {
      check(
        height <= 720
          ? state.sticky.position === "static"
          : state.sticky.position === "sticky",
        `${tag}: ${label} rail is not sticky`,
      );
    }
    if (width === 390) {
      check(state.paletteColumns === 2, `${tag}: mobile palette columns ${state.paletteColumns}`);
      check(state.nextColumns === 1, `${tag}: mobile next columns ${state.nextColumns}`);
      check(state.frame.width <= 390, `${tag}: mobile hero overflow`);
    }
    await page.screenshot({ path: path.join(OUT, `${label}.png`) });
    check(errors.length === 0, `${tag}: ${label} errors ${errors.join(" | ")}`);
    await context.close();
  }
}

async function runThemes(browser) {
  const tag = "themes";
  const light = await openProject(browser, "right-sight", { theme: "light" });
  const lightState = await light.page.evaluate(READ);
  check(
    lightState.bodyBg === "rgb(255, 255, 255)" && lightState.bodyColor === "rgb(21, 14, 52)",
    `${tag}: light surface ${lightState.bodyBg}/${lightState.bodyColor}`,
  );
  check(
    lightState.headerSurface === "inherit" && lightState.headerColor === "rgb(21, 14, 52)",
    `${tag}: light navbar ${lightState.headerSurface}/${lightState.headerColor}`,
  );
  await light.page.screenshot({ path: path.join(OUT, "light-top.png") });
  await light.context.close();

  const dark = await openProject(browser, "right-sight", { theme: "dark" });
  const darkState = await dark.page.evaluate(READ);
  check(
    darkState.bodyBg === "rgb(21, 14, 52)" && darkState.bodyColor === "rgb(255, 255, 255)",
    `${tag}: dark surface ${darkState.bodyBg}/${darkState.bodyColor}`,
  );
  check(
    darkState.headerSurface === "inherit" && darkState.headerColor === "rgb(255, 255, 255)",
    `${tag}: dark navbar ${darkState.headerSurface}/${darkState.headerColor}`,
  );
  check(
    darkState.palette[0].chip === lightState.palette[0].chip,
    `${tag}: project swatch changed with the global theme`,
  );
  await dark.page.screenshot({ path: path.join(OUT, "dark-top.png") });
  await dark.context.close();

  // Live switch on the route.
  const live = await openProject(browser, "right-sight", { theme: "light" });
  await live.page.locator('button[aria-label="Switch to dark theme"]').first().click();
  await live.page.waitForTimeout(800);
  const switched = await live.page.evaluate(READ);
  check(
    switched.bodyBg === "rgb(21, 14, 52)" &&
      switched.bodyColor === "rgb(255, 255, 255)",
    `${tag}: live switch ${switched.bodyBg}/${switched.bodyColor}`,
  );
  await live.page.screenshot({ path: path.join(OUT, "live-dark.png") });
  check(live.errors.length === 0, `${tag}: console errors ${live.errors.join(" | ")}`);
  await live.context.close();
}

async function runReducedAndNoJs(browser) {
  const tag = "fallbacks";
  const reduced = await openProject(browser, "right-sight", { reduced: true });
  const reducedState = await reduced.page.evaluate(READ);
  check(reducedState.revealCount > 0, `${tag}: no reveal targets`);
  check(reducedState.revealVisible, `${tag}: reduced motion hid content`);
  check(reducedState.overflowX === false, `${tag}: reduced overflow`);
  await reduced.context.close();

  const noJs = await openProject(browser, "right-sight", { js: false });
  const noJsState = await noJs.page.evaluate(READ);
  check(noJsState.title === "Right Sight", `${tag}: no-JS title ${noJsState.title}`);
  check(
    noJsState.sections.join(",") ===
      "overview,work-scope,creative-direction,style-guide,gallery",
    `${tag}: no-JS sections ${noJsState.sections}`,
  );
  check(noJsState.palette.length === 6, `${tag}: no-JS palette ${noJsState.palette.length}`);
  check(noJsState.next === "/work/zero", `${tag}: no-JS next ${noJsState.next}`);
  check(
    noJsState.palette.every((swatch) => swatch.label?.includes("HEX")),
    `${tag}: no-JS palette labels`,
  );
  await noJs.context.close();
}

async function runRoutes(browser) {
  const tag = "routes";
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const project of PROJECTS) {
    const response = await page.request.get(
      new URL(`/work/${project.slug}`, BASE).href,
    );
    check(response.ok(), `${tag}: /work/${project.slug} returned ${response.status()}`);
  }

  const invalid = await page.request.get(
    new URL("/work/not-a-project", BASE).href,
  );
  check(invalid.status() === 404, `${tag}: invalid slug returned ${invalid.status()}`);

  const archive = await page.request.get(new URL("/work", BASE).href);
  check(archive.ok(), `${tag}: /work returned ${archive.status()}`);
  const home = await page.request.get(new URL("/", BASE).href);
  check(home.ok(), `${tag}: / returned ${home.status()}`);

  await context.close();
}

async function runScreenshots(browser) {
  const tag = "shots";
  const targets = [
    ["right-sight", "right-sight"],
    ["zero", "zero"],
    ["project-we", "project-we"],
    ["dipakkhik", "dipakkhik"],
  ];
  for (const [slug, name] of targets) {
    const { context, page, errors } = await openProject(browser, slug);
    await page.screenshot({ path: path.join(OUT, `${name}-top.png`) });
    // Reveal every scroll-triggered section before the full-page capture.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let top = 0; top < height; top += 560) {
      await page.evaluate((value) => window.scrollTo(0, value), top);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(OUT, `${name}-full.png`),
      fullPage: true,
    });
    check(errors.length === 0, `${tag}: ${slug} errors ${errors.join(" | ")}`);
    await context.close();
  }

  const mobile = await openProject(browser, "right-sight", {
    viewport: { width: 390, height: 844 },
  });
  await mobile.page.screenshot({ path: path.join(OUT, "mobile-top.png") });
  await mobile.page.evaluate(() => {
    const el = document.querySelector("#style-guide");
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80);
  });
  await mobile.page.waitForTimeout(600);
  await mobile.page.screenshot({ path: path.join(OUT, "mobile-style.png") });
  await mobile.context.close();

  const extras = await openProject(browser, "right-sight");
  await extras.page.evaluate(() => {
    const el = document.querySelector("#style-guide");
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 110);
  });
  await extras.page.waitForTimeout(900);
  await extras.page.screenshot({ path: path.join(OUT, "style-guide.png") });
  await extras.page.evaluate(() => {
    const el = document.querySelector("[data-case-next]");
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 120);
  });
  await extras.page.waitForTimeout(900);
  await extras.page.screenshot({ path: path.join(OUT, "next-project.png") });
  await extras.context.close();
}

(async () => {
  const browser = await chromium.launch(launchOptions());

  await runContent(browser);
  await runSticky(browser);
  await runInteraction(browser);
  await runResponsive(browser);
  await runThemes(browser);
  await runReducedAndNoJs(browser);
  await runRoutes(browser);
  await runScreenshots(browser);

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
          routes: Object.keys(results).length,
          paletteTotal: Object.values(results).reduce(
            (total, entry) => total + entry.palette,
            0,
          ),
          galleryBlocks: Object.values(results).reduce(
            (total, entry) => total + entry.gallery,
            0,
          ),
        },
      },
      null,
      1,
    ),
  );

  await browser.close();
  process.exit(failures.length > 0 ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
