/*
 * Preserved hero QA — originally hero-06b3-perf.js
 * Frame pacing and long-frame count during story traversal.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";
const DURATION = 7000;

const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
  return {
    frames: sorted.length,
    median: +percentile(0.5).toFixed(2),
    p95: +percentile(0.95).toFixed(2),
    max: +Math.max(...sorted).toFixed(2),
    over33: sorted.filter((v) => v > 33.4).length,
    over50: sorted.filter((v) => v > 50).length,
  };
};

const runTraversal = async (page) =>
  page.evaluate(async (duration) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((resolve) => setTimeout(resolve, 250));
    const wrapper = document.querySelector("[data-hero-story]");
    const travel = wrapper.getBoundingClientRect().height - innerHeight;
    const intervals = [];
    let last = performance.now();
    const start = last;
    return new Promise((resolve) => {
      const tick = (now) => {
        intervals.push(now - last);
        last = now;
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo({ top: travel * t, behavior: "instant" });
        if (t < 1) {
          requestAnimationFrame(tick);
          return;
        }
        const endedAt = performance.now();
        const video = document.querySelector("[data-hero-cat] video");
        const deadline = endedAt + 2500;
        const poll = () => {
          const frame = video ? Math.round(video.currentTime * 24 - 0.5) : null;
          if ((frame !== null && frame >= 239) || performance.now() > deadline) {
            resolve({ intervals, settleMs: Math.round(performance.now() - endedAt), frame });
          } else {
            setTimeout(poll, 50);
          }
        };
        setTimeout(poll, 50);
      };
      requestAnimationFrame(tick);
    });
  }, DURATION);

(async () => {
  const browser = await chromium.launch(launchOptions());
  const out = {};
  for (const condition of ["glass", "no-fill"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    if (condition === "no-fill") {
      await page.addStyleTag({ content: "[data-hero-card-fill]{display:none !important}" });
    }
    await runTraversal(page);
    await page.waitForTimeout(700);
    const runs = [];
    for (let i = 0; i < 3; i += 1) {
      runs.push(await runTraversal(page));
      await page.waitForTimeout(700);
    }
    out[condition] = {
      runs: runs.map((r) => ({ ...stats(r.intervals), settleMs: r.settleMs, frame: r.frame })),
      combined: stats(runs.flatMap((r) => r.intervals)),
    };
    await context.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
