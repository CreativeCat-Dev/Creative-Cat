/*
 * Preserved hero QA — originally hero-06c2-entrance.js
 * Entrance timeline sampling of the visible headline masks.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";

const PATCH = () => {
  const original = performance.getEntriesByName.bind(performance);
  performance.getEntriesByName = (name, type) => {
    if (name === "first-contentful-paint") {
      return [{ name, entryType: "paint", startTime: performance.now() }];
    }
    return original(name, type);
  };
};

const SAMPLE = () => {
  const R = (n) => Math.round(n * 100) / 100;
  return [...document.querySelectorAll("[data-hero-line]")].map((line) => {
    const style = getComputedStyle(line);
    const r = line.getBoundingClientRect();
    const mask = line.parentElement.getBoundingClientRect();
    return {
      text: line.innerText,
      transform: style.transform,
      y: R(r.top - mask.top),
      height: R(r.height),
      maskHeight: R(mask.height),
      visible: style.display !== "none" && r.height > 0,
      maskDisplay: getComputedStyle(line.parentElement).display,
    };
  });
};

(async () => {
  const browser = await chromium.launch(launchOptions());
  for (const [w, h] of [[375, 812], [430, 932], [767, 1024], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.addInitScript(PATCH);
    await page.goto(BASE, { waitUntil: "commit" });
    const started = Date.now();
    let caught = false;
    try {
      await page.waitForFunction(
        () => {
          const line = document.querySelector("[data-hero-line]");
          if (!line) return false;
          const t = getComputedStyle(line).transform;
          return t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)";
        },
        null,
        { timeout: 8000, polling: 10 }
      );
      caught = true;
    } catch {}
    const caughtAt = Date.now() - started;
    const samples = [];
    let last = 0;
    for (const wait of [0, 80, 200, 400, 800, 1500]) {
      if (wait > last) await page.waitForTimeout(wait - last);
      last = wait;
      samples.push({ wait, lines: await page.evaluate(SAMPLE) });
    }
    console.log(`## ${w}x${h} caught=${caught} at≈${caughtAt}ms`);
    for (const sample of samples) {
      console.log(
        `  +${sample.wait}ms ${sample.lines
          .map(
            (l) =>
              `${l.text}:${l.maskDisplay}:${l.transform}:y${l.y}/${l.maskHeight}:${l.visible ? "vis" : "hidden"}`
          )
          .join(" | ")}`
      );
    }
    await context.close();
  }
  await browser.close();
})();
