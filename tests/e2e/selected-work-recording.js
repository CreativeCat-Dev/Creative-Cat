/*
 * DEL-01B — short recording of the immersive homepage Selected Projects.
 *
 * The capture walks the real sequence:
 *   showreel full stage -> natural release -> unchanged circular Zero opening
 *   -> whole-card gallery scroll -> alternating perspective hover on Right
 *   Sight and Exciting Sundarban -> Splash Shine perspective -> recovery
 *   -> reverse scroll back to the unchanged Zero project and small circle.
 *
 * Screenshot frames are encoded with a full ffmpeg build; Playwright's bundled
 * ffmpeg on this machine is muxer-only.
 *
 * Usage:
 *   HERO_BASE_URL=http://localhost:3000/ \
 *   FFMPEG_PATH=C:/Users/<you>/AppData/Local/Programs/Stremio/ffmpeg.exe \
 *   node tests/e2e/selected-work-recording.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium, launchOptions } = require("../lib/playwright");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const FFMPEG = process.env.FFMPEG_PATH;
const OUT =
  process.env.RECORD_OUT ||
  path.join(__dirname, "..", ".local", "out", "selected-work");
const FRAMES = path.join(OUT, "frames");
const TARGET = path.join(OUT, "selected-work-gallery.mp4");

const FPS = 15;
const VIEWPORT = { width: 1440, height: 900 };
const VH = VIEWPORT.height;

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
  await page.goto(BASE, { waitUntil: "networkidle" });
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
      const section = document.querySelector("[data-selected-work]");
      const element = document.querySelector(`[data-sw-slug="${target}"]`);
      if (!section || !element) return window.scrollY;
      return (
        section.getBoundingClientRect().top + window.scrollY + element.offsetTop
      );
    }, slug);

  let frame = 0;
  const capture = async (settle = 60) => {
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

  const hold = async (count, settle = 75) => {
    for (let index = 0; index < count; index += 1) await capture(settle);
  };

  let mouse = { x: 1430, y: 890 };
  const moveTo = async (x, y, count = 7) => {
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
        .querySelector(`[data-sw-slug="${target}"] [data-sw-media]`)
        .getBoundingClientRect();
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      };
    }, slug);

  // Full showreel stage. Production has no development scroll hook, so derive
  // the hold from the aperture's own section geometry.
  const apertureHold = await page.evaluate(() => {
    const element = document.querySelector("[data-next-level]");
    if (!element) return window.scrollY;
    const top = element.getBoundingClientRect().top + window.scrollY;
    return top + Math.max(0, element.offsetHeight - window.innerHeight) * 0.95;
  });
  await scrollTo(apertureHold);
  await page.waitForTimeout(900);
  await hold(14);

  const zeroTop = await layoutTop("zero");
  const pairTop = await layoutTop("right-sight");
  const splashTop = await layoutTop("splash-shine");
  const gdriTop = await layoutTop("gdri");
  const closingTop = await layoutTop("urbancut");

  // Natural release into the gallery, ending with the small circle.
  await walk(apertureHold, zeroTop - 0.62 * VH, 24);
  await hold(8);

  // Scroll-driven circular reveal: small -> full rectangle.
  await walk(zeroTop - 0.62 * VH, zeroTop - 0.17 * VH, 46);
  await hold(10);

  // Zero's unchanged hover (lift + image zoom + arrow action).
  const zeroPoint = await hoverPoint("zero");
  await moveTo(zeroPoint.x, zeroPoint.y, 6);
  await hold(6);
  await moveTo(8, 8, 4);
  await hold(4);

  // First pair and the alternating perspective hover.
  await walk(zeroTop - 0.17 * VH, pairTop - 0.18 * VH, 26);
  await hold(4);

  const rightPoint = await hoverPoint("right-sight");
  await moveTo(rightPoint.x, rightPoint.y, 7);
  await hold(10);
  const sundarbanPoint = await hoverPoint("exciting-sundarban");
  await moveTo(sundarbanPoint.x, sundarbanPoint.y, 7);
  await hold(10);
  await moveTo(8, 8, 5);
  await hold(8);

  // Splash Shine perspective and recovery.
  await walk(pairTop - 0.18 * VH, splashTop - 0.2 * VH, 24);
  await hold(4);
  const splashPoint = await hoverPoint("splash-shine");
  await moveTo(splashPoint.x, splashPoint.y, 7);
  await hold(12);
  await moveTo(8, 8, 5);
  await hold(8);

  // Continue through the second pair and closing project.
  await walk(splashTop - 0.2 * VH, gdriTop - 0.2 * VH, 22);
  await hold(4);
  await walk(gdriTop - 0.2 * VH, closingTop - 0.17 * VH, 20);
  await hold(8);

  // Reverse scroll back to the unchanged Zero project.
  await walk(closingTop - 0.17 * VH, splashTop - 0.2 * VH, 22);
  await hold(4);
  await walk(splashTop - 0.2 * VH, zeroTop - 0.17 * VH, 30);
  await hold(6);

  const zeroReturn = await hoverPoint("zero");
  await moveTo(zeroReturn.x, zeroReturn.y, 6);
  await hold(8);
  await moveTo(8, 8, 4);
  await hold(4);

  // Contract the unchanged circular opening.
  await walk(zeroTop - 0.17 * VH, zeroTop - 0.55 * VH, 20);
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
