/*
 * Preserved hero QA — originally hero-06c2-crossover.js
 * Responsive mode crossing while the entrance timeline is active.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";

const SAMPLE = () => {
  const R = (n) => Math.round(n * 100) / 100;
  const lines = [...document.querySelectorAll("[data-hero-line]")];
  const copy = document.querySelector("[data-hero-copy]");
  const story = document.querySelector("[data-hero-story]");
  return {
    viewport: `${innerWidth}x${innerHeight}`,
    mode: story?.dataset.heroMode,
    copy: copy ? [R(copy.getBoundingClientRect().left), R(copy.getBoundingClientRect().right)] : null,
    align: copy ? getComputedStyle(copy).textAlign : null,
    inner: document.querySelector("#hero-title")?.innerText,
    lines: lines.map((line) => ({
      text: line.innerText,
      display: getComputedStyle(line.parentElement).display,
      transform: getComputedStyle(line).transform,
      height: R(line.getBoundingClientRect().height),
      mask: R(line.parentElement.getBoundingClientRect().height),
    })),
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    canvases: document.querySelectorAll("[data-hero-cat] canvas").length,
    video: document.querySelectorAll("video").length,
    footerOverlap: (() => {
      const w = story?.getBoundingClientRect();
      const f = document.querySelector("footer")?.getBoundingClientRect();
      return w && f ? R(Math.max(0, w.bottom + scrollY - (f.top + scrollY))) : null;
    })(),
    ax: document.querySelector("#hero-title")?.getAttribute("aria-level"),
  };
};

(async () => {
  const browser = await chromium.launch(launchOptions());

  {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(BASE, { waitUntil: "commit" });
    await page.waitForTimeout(250);
    await page.setViewportSize({ width: 768, height: 1024 });
    const at768early = await page.evaluate(SAMPLE);
    await page.waitForTimeout(140);
    await page.setViewportSize({ width: 375, height: 812 });
    const backEarly = await page.evaluate(SAMPLE);
    await page.waitForTimeout(1500);
    const settled = await page.evaluate(SAMPLE);
    console.log("PHONE->TABLET during entrance", JSON.stringify({ at768early, backEarly, settled, errors }, null, 1));
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1023, height: 1366 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(BASE, { waitUntil: "commit" });
    await page.waitForTimeout(250);
    await page.setViewportSize({ width: 1024, height: 1366 });
    await page.waitForTimeout(400);
    const at1024 = await page.evaluate(SAMPLE);
    await page.setViewportSize({ width: 1023, height: 1366 });
    await page.waitForTimeout(400);
    const back1023 = await page.evaluate(SAMPLE);
    await page.waitForTimeout(1200);
    const settled = await page.evaluate(SAMPLE);
    console.log("TABLET->DESKTOP during entrance", JSON.stringify({ at1024, back1023, settled, errors }, null, 1));
    await context.close();
  }

  await browser.close();
})();
