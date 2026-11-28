/*
 * DEL-01D / DEL-01D.1 â€” short recording of the Work archive.
 *
 * The capture walks the real route:
 *   intro -> full-width Right Sight feature -> artwork hover zoom/recovery
 *   -> staggered Sundarban/Splash pair hover -> full-width Zero feature
 *   -> Zero Blind Spots feature -> closing Yogic Rhythm feature
 *   -> editorial closing -> upward scroll that reveals the navbar.
 *
 * Screenshot frames are encoded with a full ffmpeg build.
 *
 * Usage:
 *   HERO_BASE_URL=http://localhost:3100/ \
 *   FFMPEG_PATH=C:/Users/<you>/AppData/Local/Programs/Stremio/ffmpeg.exe \
 *   node tests/e2e/work-archive-recording.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium, launchOptions } = require("../lib/playwright");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const FFMPEG = process.env.FFMPEG_PATH;
const OUT =
  process.env.RECORD_OUT ||
  path.join(__dirname, "..", ".local", "out", "work-archive");
const FRAMES = path.join(OUT, "frames");
const TARGET = path.join(OUT, "work-archive.mp4");

const FPS = 15;
const VIEWPORT = { width: 1440, height: 900 };
const VH = VIEWPORT.height;
const WORK_URL = new URL("/work", BASE).href;

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
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await page.goto(WORK_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  const scrollTo = async (top) => {
    await page.evaluate((value) => {
      const lenis = window.__heroLenis?.instance?.();
      if (lenis) lenis.scrollTo(value, { immediate: true, force: true });
      else window.scrollTo({ top: value, behavior: "instant" });
    }, top);
  };

  const layoutTop = async (slug) =>
    page.evaluate((target) => {
      const card = document.querySelector(`[data-work-slug="${target}"]`);
      if (!card) return 0;
      return card.getBoundingClientRect().top + window.scrollY;
    }, slug);

  let frame = 0;
  const capture = async (settle = 80) => {
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

  let mouse = { x: 1430, y: 890 };
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

  const hoverPoint = async (slug) =>
    page.evaluate((target) => {
      const rect = document
        .querySelector(`[data-work-slug="${target}"] [data-work-frame]`)
        .getBoundingClientRect();
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      };
    }, slug);

  const rightSightTop = await layoutTop("right-sight");
  const zeroTop = await layoutTop("zero");
  const pairTop = await layoutTop("exciting-sundarban");
  const zeroBlindTop = await layoutTop("zero-blind-spots");
  const yogicTop = await layoutTop("yogic-rhythm");
  const closingTop = await page.evaluate(() => {
    const section = document.querySelector("[data-work-closing]");
    return section
      ? section.getBoundingClientRect().top + window.scrollY
      : document.documentElement.scrollHeight;
  });

  // Intro and first feature.
  await hold(10);
  await walk(0, rightSightTop - 260, 8);
  await hold(6);

  // Hover zoom and recovery on the first feature.
  const rightSightPoint = await hoverPoint("right-sight");
  await moveTo(rightSightPoint.x, rightSightPoint.y, 6);
  await hold(8);
  await moveTo(8, 8, 4);
  await hold(5);

  // Staggered pair, then the full-width Zero feature.
  await walk(rightSightTop - 260, pairTop - 110, 12);
  await hold(6);

  const splashPoint = await hoverPoint("splash-shine");
  await moveTo(splashPoint.x, splashPoint.y, 6);
  await hold(8);
  await moveTo(8, 8, 4);
  await hold(5);

  await walk(pairTop - 110, zeroTop - 140, 10);
  await hold(7);

  // Remaining rhythm into the closing feature.
  await walk(zeroTop - 140, zeroBlindTop - 120, 12);
  await hold(6);
  await walk(zeroBlindTop - 120, yogicTop - 220, 16);
  await hold(7);
  await walk(yogicTop - 220, closingTop - 0.42 * VH, 12);
  await hold(10);

  // Upward scroll reveals the navbar; then a downward move hides it again and
  // a final short upward move leaves the closing section with the bar visible.
  const closingView = closingTop - 0.42 * VH;
  await walk(closingView, closingView - 520, 14);
  await hold(10);
  await walk(closingView - 520, closingView + 50, 10);
  await hold(7);
  await walk(closingView + 50, closingView - 30, 6);
  await hold(14);

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

