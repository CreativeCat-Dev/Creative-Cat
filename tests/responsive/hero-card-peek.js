/*
 * Preserved hero QA — originally hero-06c2-peek.js
 * Card peek percentage comparison and screenshots.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");
const fs = require("fs");
const path = require("path");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const OUT = out("hero-06c2-peek");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch(launchOptions());
  for (const [w, h] of [[375, 812], [430, 932], [600, 800], [767, 1024]]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    for (const p of [26, 21, 18, 14]) {
      await page.addStyleTag({
        content: `@media (max-width: 767.98px){
          [data-hero-card-side="left"]{translate:-${p}% 0 !important}
          [data-hero-card-side="right"]{translate:${p}% 0 !important}
        }`,
      });
      await page.waitForTimeout(120);
      const geo = await page.evaluate(() => {
        const R = (n) => Math.round(n * 100) / 100;
        const cards = [...document.querySelectorAll("[data-hero-lane] .hero-card")].map((c) => {
          const r = c.getBoundingClientRect();
          return { left: R(r.left), right: R(r.right), width: R(r.width) };
        });
        return cards;
      });
      console.log(w, h, `peek ${p}%`, JSON.stringify(geo));
      await page.screenshot({ path: path.join(OUT, `${w}x${h}-peek${p}.png`) });
    }
    await context.close();
  }
  await browser.close();
})();
