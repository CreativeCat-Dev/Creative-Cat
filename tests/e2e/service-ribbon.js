/*
 * DEL-00.2 / DEL-00.2A / DEL-00.2B / DEL-00.2C — kinetic service ribbon.
 *
 * Read-only measurement of placement, mirrored-wave separation, responsive
 * type, loop state, the menu motion switch, signed pointer deformation, paused
 * and reduced/no-JS fallbacks. Usage:
 *   HERO_BASE_URL=http://localhost:3000/ node tests/e2e/service-ribbon.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const OUT = out("service-ribbon");
const SWITCH = '[role="switch"][aria-label="Service ribbon motion"]';

const READ = () => {
  const R = (n) => Math.round(n * 100) / 100;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: R(r.top), bottom: R(r.bottom), left: R(r.left), right: R(r.right), width: R(r.width), height: R(r.height) };
  };
  const ribbon = document.querySelector("[data-service-ribbon]");
  const meta = document.querySelector("[data-hero-meta]");
  const motion = document.querySelector(
    '[role="switch"][aria-label="Service ribbon motion"]',
  );
  const cat = document.querySelector("[data-hero-cat]");
  const catBox = cat ? cat.getBoundingClientRect() : null;
  const rule = document.querySelector("[data-hero-rule]");
  const hasDesktopCat = Boolean(catBox && catBox.width > 0);
  const svg = ribbon?.querySelector("svg");
  const text = ribbon?.querySelector("text");
  const coralBand = ribbon?.querySelector('[data-ribbon-band="coral"]');
  const midnightBand = ribbon?.querySelector('[data-ribbon-band="midnight"]');
  const ribbonBox = rect(ribbon);

  /**
   * Peak clear gap inside the visible `slice` crop. Each band is sampled once,
   * then the pair is compared on the same x grid, so this measures the rendered
   * geometry rather than the source constants.
   */
  let peakGap = null;
  if (svg && ribbonBox && coralBand && midnightBand) {
    const matrix = svg.getScreenCTM();
    const stroke = Number(coralBand.getAttribute("stroke-width"));
    const vb = svg.viewBox.baseVal;
    if (matrix && stroke) {
      const sample = (element, count = 800) => {
        const total = element.getTotalLength();
        const points = [];
        for (let i = 0; i <= count; i += 1) {
          const point = element.getPointAtLength((i / count) * total);
          points.push({ x: point.x, y: point.y });
        }
        return points;
      };
      const yAt = (points, x) => {
        let best = points[0];
        for (const point of points) {
          if (Math.abs(point.x - x) < Math.abs(best.x - x)) best = point;
        }
        return best.y;
      };
      const coral = sample(coralBand);
      const midnight = sample(midnightBand);
      const left = -matrix.e / matrix.a;
      const right = (ribbonBox.width - matrix.e) / matrix.a;
      let peak = -Infinity;
      for (let x = left + 2; x <= right - 2; x += 8) {
        const gap = Math.abs(yAt(coral, x) - yAt(midnight, x)) - stroke;
        if (gap > peak) peak = gap;
      }
      peakGap = {
        units: R(peak),
        px: R((peak * ribbonBox.height) / vb.height),
      };
    }
  }

  return {
    mode: document.querySelector("[data-hero-story]")?.dataset.heroMode,
    fit: window.__heroStory?.fit?.() ?? null,
    triggers: window.__heroStory?.triggers?.() ?? null,
    lenis: window.__heroLenis?.instances ?? null,
    meta: rect(meta),
    ribbon: ribbonBox,
    rule: rect(rule),
    cat: rect(cat),
    catGapToRule:
      hasDesktopCat && rule
        ? R(rule.getBoundingClientRect().top - catBox.bottom)
        : null,
    motion: motion
      ? {
          checked: motion.getAttribute("aria-checked"),
          display: getComputedStyle(motion).display,
          rect: rect(motion),
        }
      : null,
    ready: ribbon?.hasAttribute("data-ribbon-ready") ?? false,
    loop: ribbon?.getAttribute("data-ribbon-loop") ?? null,
    services: document.querySelectorAll("[data-service-ribbon] ul li").length,
    viewBox: svg?.getAttribute("viewBox"),
    type: text
      ? {
          fontSize: getComputedStyle(text).fontSize,
          letterSpacing: getComputedStyle(text).letterSpacing,
        }
      : null,
    bandStroke: coralBand?.getAttribute("stroke-width") ?? null,
    peakGap,
    offsets: [...document.querySelectorAll("[data-service-ribbon] textPath")].map((tp) => +(tp.getAttribute("startOffset") || 0)),
    tspans: document.querySelectorAll("[data-service-ribbon] textPath tspan").length,
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  };
};

async function open(browser, width, height, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: options.theme || "light",
    reducedMotion: options.reduced ? "reduce" : "no-preference",
    javaScriptEnabled: options.js !== false,
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
  }
  return { context, page, errors };
}

async function openMenu(page) {
  await page.locator("[data-menu-trigger]").click();
  await page.waitForTimeout(900);
}

async function closeMenu(page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);
}

/** Rendered y of one band centreline at a local x. */
function bandY(page, which, x) {
  return page.evaluate(
    ({ which, x }) => {
      const element = document.querySelector(`[data-ribbon-band="${which}"]`);
      const total = element.getTotalLength();
      let best = { distance: Infinity, y: 0 };
      for (let i = 0; i <= 1200; i += 1) {
        const point = element.getPointAtLength((i / 1200) * total);
        const distance = Math.abs(point.x - x);
        if (distance < best.distance) best = { distance, y: point.y };
      }
      return Math.round(best.y * 1000) / 1000;
    },
    { which, x },
  );
}

function glyphRun(page) {
  return page.evaluate(() => {
    const text = document.querySelector("[data-service-ribbon] text");
    const textPath = document.querySelector("[data-service-ribbon] textPath");
    const path = document.querySelector(textPath.getAttribute("href"));
    const gaps = [];
    for (let i = 221; i < 228; i += 1) {
      const a = textPath.getStartPositionOfChar(i);
      const b = textPath.getStartPositionOfChar(i + 1);
      gaps.push(Math.round(Math.hypot(b.x - a.x, b.y - a.y) * 10000) / 10000);
    }
    return {
      letterSpacing: getComputedStyle(text).letterSpacing,
      textLength: Math.round(textPath.getComputedTextLength() * 1000) / 1000,
      pathLength: Math.round(path.getTotalLength() * 1000) / 1000,
      gaps,
    };
  });
}

(async () => {
  const browser = await chromium.launch(launchOptions());
  const report = {};

  for (const [w, h, theme] of [
    [1440, 900, "light"],
    [1440, 900, "dark"],
    [1024, 600, "light"],
    [834, 1194, "light"],
    [390, 844, "light"],
    [390, 844, "dark"],
  ]) {
    const { context, page, errors } = await open(browser, w, h, { theme });
    report[`${w}x${h}-${theme}`] = { ...(await page.evaluate(READ)), errors };
    await page.locator("[data-service-ribbon]").screenshot({
      path: path.join(OUT, `${w}x${h}-${theme}-ribbon.png`),
    });
    await context.close();
  }

  {
    const { context, page, errors } = await open(browser, 1440, 900, { reduced: true });
    await openMenu(page);
    const switchCount = await page.locator(SWITCH).count();
    const switchVisible = switchCount ? await page.locator(SWITCH).isVisible() : false;
    await closeMenu(page);
    report.reduced = { ...(await page.evaluate(READ)), switchCount, switchVisible, errors };
    await context.close();
  }

  {
    const { context, page, errors } = await open(browser, 1440, 900, { js: false });
    report.nojs = {
      ...(await page.evaluate(READ)),
      switchCount: await page.locator(SWITCH).count(),
      errors,
    };
    await context.close();
  }

  {
    const { context, page, errors } = await open(browser, 1440, 900);
    const loop = Number(await page.locator("[data-service-ribbon]").getAttribute("data-ribbon-loop"));

    await openMenu(page);
    await page.locator(SWITCH).click(); // pause
    await closeMenu(page);

    const setOffsets = async (value) => {
      await page.evaluate((v) => {
        for (const tp of document.querySelectorAll("[data-service-ribbon] textPath")) {
          tp.setAttribute("startOffset", String(v));
        }
      }, value);
      await page.waitForTimeout(200);
    };
    await setOffsets(0);
    await page.locator("[data-service-ribbon]").screenshot({ path: path.join(OUT, "seam-0.png") });
    await setOffsets(loop);
    await page.locator("[data-service-ribbon]").screenshot({ path: path.join(OUT, "seam-L.png") });

    const pausedA = await page.evaluate(READ);
    await page.waitForTimeout(500);
    const pausedB = await page.evaluate(READ);

    await openMenu(page);
    await page.locator(SWITCH).click(); // resume
    await closeMenu(page);
    await page.waitForTimeout(600);
    const resumed = await page.evaluate(READ);
    report.pause = { loop, pausedA, pausedB, resumed, errors };
    await context.close();
  }

  /**
   * DEL-00.2C pointer interaction: signed lift/dip, elastic recovery, paused
   * suspension, and typography that stays fixed while the path deforms.
   */
  {
    const { context, page, errors } = await open(browser, 1440, 900);
    const box = await page.locator("[data-service-ribbon]").boundingBox();
    const localX = 960;

    const baseline = {
      coral: await bandY(page, "coral", localX),
      midnight: await bandY(page, "midnight", localX),
    };
    const spacingBefore = await glyphRun(page);

    await page.mouse.move(box.x + box.width / 2, box.y + 6);
    await page.waitForTimeout(500);
    const above = {
      coral: await bandY(page, "coral", localX),
      midnight: await bandY(page, "midnight", localX),
    };
    const spacingDuring = await glyphRun(page);
    const shineOn = await page.evaluate(() =>
      [...document.querySelectorAll("[data-ribbon-shine]")].map((p) =>
        Number(p.getAttribute("opacity")),
      ),
    );

    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 6);
    await page.waitForTimeout(500);
    const below = {
      coral: await bandY(page, "coral", localX),
      midnight: await bandY(page, "midnight", localX),
    };

    await page.mouse.move(box.x + box.width / 2, box.y - 120);
    await page.waitForTimeout(1500);
    const recovered = {
      coral: await bandY(page, "coral", localX),
      midnight: await bandY(page, "midnight", localX),
    };
    const shineOff = await page.evaluate(() =>
      [...document.querySelectorAll("[data-ribbon-shine]")].map((p) =>
        Number(p.getAttribute("opacity")),
      ),
    );

    // Paused: the same pointer movement must not deform the ribbon.
    await openMenu(page);
    await page.locator(SWITCH).click();
    await closeMenu(page);
    await page.mouse.move(box.x + box.width / 2, box.y + 2);
    await page.waitForTimeout(500);
    const pausedDeform = {
      coral: await bandY(page, "coral", localX),
      midnight: await bandY(page, "midnight", localX),
    };
    const pausedOffsetsA = await page.evaluate(READ);
    await page.waitForTimeout(500);
    const pausedOffsetsB = await page.evaluate(READ);

    report.pointer = {
      baseline,
      above,
      below,
      recovered,
      pausedDeform,
      pausedStable: pausedOffsetsA.offsets[0] === pausedOffsetsB.offsets[0],
      spacingBefore,
      spacingDuring,
      shineOn,
      shineOff,
      errors,
    };
    await context.close();
  }

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})();
