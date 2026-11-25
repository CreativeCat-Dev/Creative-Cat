/*
 * Preserved hero QA — originally hero-06b3-fit.js
 * Content-fit requirement, nav gap and runtime candidate reporting.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";

const READ = () => {
  const R = (n) => Math.round(n * 100) / 100;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: R(r.top), bottom: R(r.bottom), width: R(r.width), height: R(r.height) };
  };
  const stage = document.querySelector("[data-hero-stage]");
  const copy = document.querySelector("[data-hero-copy]");
  const rule = document.querySelector("[data-hero-rule]");
  const meta = document.querySelector("[data-hero-meta]");
  const desktop = document.querySelector("[data-hero-desktop]");
  return {
    mode: window.__heroStory?.mode(),
    fit: window.__heroStory?.fit(),
    info: window.__heroStory?.info(),
    rootFont: getComputedStyle(document.documentElement).fontSize,
    stage: rect(stage),
    copy: rect(copy),
    rule: rect(rule),
    meta: rect(meta),
    padding: stage ? { top: getComputedStyle(stage).paddingTop, bottom: getComputedStyle(stage).paddingBottom } : null,
    desktopDisplay: desktop ? getComputedStyle(desktop).display : null,
    wrapper: rect(document.querySelector("[data-hero-story]")),
  };
};

(async () => {
  const browser = await chromium.launch(launchOptions());
  const out = [];
  for (const [w, h, font, runtime] of [
    [1440, 900, 24, false],
    [1440, 900, 24, true],
    [1440, 900, 20, true],
    [1024, 600, 20, true],
    [1024, 768, 20, true],
    [1440, 900, 32, true],
  ]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    if (!runtime) await cdp.send("Page.setFontSizes", { fontSizes: { standard: font, fixed: font } });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForFunction(() => Boolean(window.__heroStory), null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    if (runtime) {
      await page.addStyleTag({ content: `html{font-size:${font}px !important}` });
      await page.waitForTimeout(1500);
    }
    out.push({ w, h, font, runtime, ...(await page.evaluate(READ)) });
    await context.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
