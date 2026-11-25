/*
 * Preserved hero QA — originally hero-06b3a-static.js
 * Static layout, wrapper/footer overlap and overflow sweep.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";
const READ = () => {
  const R = (n) => Math.round(n * 100) / 100;
  const doc = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: R(r.top + scrollY), bottom: R(r.bottom + scrollY), height: R(r.height) };
  };
  const wrapper = doc(document.querySelector("[data-hero-story]"));
  const footer = doc(document.querySelector("footer"));
  return {
    viewport: `${innerWidth}x${innerHeight}`,
    mode: document.querySelector("[data-hero-story]")?.dataset.heroMode,
    cat: document.querySelector("[data-hero-cat]")?.dataset.cat,
    wrapper,
    footer,
    overlap: wrapper && footer ? R(Math.max(0, wrapper.bottom - footer.top)) : null,
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  };
};
(async () => {
  const browser = await chromium.launch(launchOptions());
  const out = [];
  for (const [w, h] of [[375, 812], [390, 844], [768, 1024], [834, 1194], [900, 600], [960, 720], [1024, 600], [1024, 768], [1024, 800], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]]) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1100);
    out.push(await page.evaluate(READ));
    await context.close();
  }
  for (const x of out) console.log(x.viewport, "mode", x.mode, "cat", x.cat, "wrapper", x.wrapper && [x.wrapper.top, x.wrapper.bottom], "footer", x.footer && x.footer.top, "overlap", x.overlap, "ovf", x.overflowX);
  await browser.close();
})();
