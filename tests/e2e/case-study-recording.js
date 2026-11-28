/*
 * DEL-02 — short recording of a project case study.
 *
 * The capture walks the real route:
 *   introduction -> sticky information rail -> About/Work Scope
 *   -> Creative Direction -> Style Guide -> palette copy -> gallery
 *   -> Next Project hover.
 *
 * Screenshot frames are encoded with a full ffmpeg build.
 *
 * Usage:
 *   HERO_BASE_URL=http://localhost:3100/ \
 *   FFMPEG_PATH=C:/Users/<you>/AppData/Local/Programs/Stremio/ffmpeg.exe \
 *   node tests/e2e/case-study-recording.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium, launchOptions } = require("../lib/playwright");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const FFMPEG = process.env.FFMPEG_PATH;
const OUT =
  process.env.RECORD_OUT ||
  path.join(__dirname, "..", ".local", "out", "case-study");
const FRAMES = path.join(OUT, "frames");
const TARGET = path.join(OUT, "case-study.mp4");

const FPS = 15;
const VIEWPORT = { width: 1440, height: 900 };
const PAGE_URL = new URL("/work/right-sight", BASE).href;

if (!FFMPEG || !fs.existsSync(FFMPEG)) {
  console.error(
    "Set FFMPEG_PATH to a full ffmpeg binary, for example:\n" +
      "  C:/Users/<you>/AppData/Local/Programs/Stremio/ffmpeg.exe",
  );
  process.exit(1);
}

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

(async () => {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });

  const browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({
    viewport: VIEWPORT,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  await page.goto(PAGE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  const scrollTo = async (top) => {
    await page.evaluate((value) => {
      const lenis = window.__heroLenis?.instance?.();
      if (lenis) lenis.scrollTo(value, { immediate: true, force: true });
      else window.scrollTo({ top: value, behavior: "instant" });
    }, top);
  };

  const topOf = async (selector) =>
    page.evaluate((target) => {
      const element = document.querySelector(target);
      return element ? element.getBoundingClientRect().top + window.scrollY : 0;
    }, selector);

  let frame = 0;
  const capture = async (settle = 90) => {
    await page.waitForTimeout(settle);
    await page.screenshot({
      path: path.join(FRAMES, `frame-${String(frame).padStart(4, "0")}.png`),
    });
    frame += 1;
  };

  const camera = async (top) => {
    await scrollTo(top);
    await capture();
  };

  const walk = async (from, to, count) => {
    for (let index = 0; index < count; index += 1) {
      const t = easeInOutCubic(index / Math.max(1, count - 1));
      await camera(from + (to - from) * t);
    }
  };

  const hold = async (count, settle = 90) => {
    for (let index = 0; index < count; index += 1) await capture(settle);
  };

  let mouse = { x: 1420, y: 880 };
  const moveTo = async (x, y, count = 6) => {
    const from = mouse;
    for (let index = 0; index < count; index += 1) {
      const t = count <= 1 ? 1 : index / (count - 1);
      await page.mouse.move(
        Math.round(from.x + (x - from.x) * t),
        Math.round(from.y + (y - from.y) * t),
        { steps: 1 },
      );
      await capture(70);
    }
    mouse = { x, y };
  };

  const overviewTop = await topOf("#overview");
  const directionTop = await topOf("#creative-direction");
  const styleTop = await topOf("#style-guide");
  const galleryTop = await topOf("#gallery");
  const nextTop = await topOf("[data-case-next]");

  // Introduction and complete canonical artwork.
  await hold(12, 100);
  await walk(0, overviewTop - 180, 10);
  await hold(9);

  // Sticky rail during the narrative.
  await walk(overviewTop - 180, directionTop - 140, 12);
  await hold(8);

  // Style Guide and the interactive palette.
  await walk(directionTop - 140, styleTop - 110, 16);
  await hold(12);
  const crimson = await page.evaluate(() => {
    const button = document.querySelectorAll("[data-case-palette] button")[1];
    const rect = button.getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  });
  await moveTo(crimson.x, crimson.y, 7);
  await page.mouse.down();
  await capture(90);
  await page.mouse.up();
  await hold(12);
  await moveTo(1200, 700, 5);
  await hold(5);

  // Gallery.
  await walk(styleTop - 110, galleryTop - 110, 16);
  await hold(10);
  await walk(galleryTop - 110, galleryTop + 1500, 18);
  await hold(9);

  // Next Project preview and hover.
  await walk(galleryTop + 1500, nextTop - 180, 16);
  await hold(9);
  const nextPoint = await page.evaluate(() => {
    const rect = document.querySelector("[data-project-next]").getBoundingClientRect();
    return {
      x: Math.round(rect.right - 190),
      y: Math.round(rect.top + Math.min(160, rect.height / 2)),
    };
  });
  await moveTo(nextPoint.x, nextPoint.y, 7);
  await hold(10);
  await moveTo(10, 10, 5);
  await hold(10);

  await context.close();
  await browser.close();

  execFileSync(
    FFMPEG,
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-framerate",
      String(FPS),
      "-i",
      path.join(FRAMES, "frame-%04d.png"),
      "-c:v",
      "libx264",
      "-crf",
      "19",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      TARGET,
    ],
    { stdio: "inherit" },
  );

  fs.rmSync(FRAMES, { recursive: true, force: true });
  console.log(TARGET);
  console.log(`frames: ${frame}, ${(frame / FPS).toFixed(1)}s @ ${FPS}fps`);
})();
