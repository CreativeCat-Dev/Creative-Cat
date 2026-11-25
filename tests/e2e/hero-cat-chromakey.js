/*
 * Preserved hero QA — originally hero-06b3-cat-images.js
 * Extracts the live canvas and the poster at corridor p1 for chroma-key comparison.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");
const path = require("node:path");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const OUT = out("hero-cat-chromakey");
(async () => {
  const browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__heroCorridor), null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__heroCorridor.set(1));
  await page.waitForTimeout(1000);
  await page.locator("[data-hero-cat] canvas").screenshot({ path: path.join(OUT, "canvas-p1.png"), omitBackground: true });
  await page.evaluate(() => {
    const cat = document.querySelector("[data-hero-cat]");
    cat.querySelector("canvas").style.opacity = "0";
    cat.querySelectorAll("img")[0].style.opacity = "1";
  });
  await page.locator("[data-hero-cat]").screenshot({ path: path.join(OUT, "poster-p1.png"), omitBackground: true });
  console.log("done");
  await browser.close();
})();
