/*
 * DEL-00.3C — short recording of the combined masthead + video showreel
 * aperture.
 *
 * The capture walks the real scroll sequence:
 *   headline entrance -> aligned hold with the moving capsule (and the lens)
 *   -> aperture expansion with the video still playing -> full-stage moving
 *   showreel -> section exit.
 *
 * Screenshot frames are encoded with a full ffmpeg build; Playwright's bundled
 * ffmpeg on this machine is muxer-only.
 *
 * Usage:
 *   HERO_BASE_URL=http://localhost:3100/ \
 *   FFMPEG_PATH=C:/Users/<you>/AppData/Local/Programs/Stremio/ffmpeg.exe \
 *   node tests/e2e/project-aperture-recording.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium, launchOptions } = require("../lib/playwright");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";
const FFMPEG = process.env.FFMPEG_PATH;
const OUT =
  process.env.RECORD_OUT ||
  path.join(__dirname, "..", ".local", "out", "next-level-projects-video");
const FRAMES = path.join(OUT, "frames");
const TARGET = path.join(OUT, "creative-cat-showreel-aperture.mp4");

const FPS = 15;
const ENTRANCE_FRAMES = 30;
const HOLD_FRAMES = 22;
const APERTURE_FRAMES = 55;
const FULL_FRAMES = 30;
const EXIT_FRAMES = 20;

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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);

  const scrollToProgress = async (progress) => {
    await page.evaluate((value) => {
      if (window.__nextLevelProjects?.scrollTo) {
        window.__nextLevelProjects.scrollTo(value);
        return;
      }
      const root = document.querySelector("[data-next-level]");
      const stage = root.querySelector("[data-nlp-stage]");
      const title = root.querySelector("[data-nlp-title]");
      const top = root.getBoundingClientRect().top + window.scrollY;
      const bottom = root.getBoundingClientRect().bottom + window.scrollY;
      const offset =
        title.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      const start = top + offset - window.innerHeight * 0.94;
      const end = bottom - window.innerHeight;
      window.scrollTo({ top: start + (end - start) * value, behavior: "instant" });
    }, progress);
  };

  let frame = 0;
  const capture = async (settle = 55) => {
    await page.waitForTimeout(settle);
    await page.screenshot({
      path: path.join(FRAMES, `frame-${String(frame).padStart(4, "0")}.png`),
    });
    frame += 1;
  };

  // Start just before the field enters, so the first frames show the opposing
  // entrance rather than the hero alone.
  const from = 0.05;
  const hold = 0.31;
  const full = 0.93;

  await scrollToProgress(from);
  await page.waitForTimeout(700);

  for (let index = 0; index < ENTRANCE_FRAMES; index += 1) {
    const t = easeInOutCubic(index / (ENTRANCE_FRAMES - 1));
    await scrollToProgress(from + (hold - from) * t);
    await capture();
  }

  // Hold: the capsule keeps cycling while the pointer crosses the aligned
  // masthead, showing the inversion lens.
  await scrollToProgress(hold);
  await page.waitForTimeout(350);
  for (let index = 0; index < HOLD_FRAMES; index += 1) {
    const t = index / (HOLD_FRAMES - 1);
    await page.mouse.move(380 + 700 * t, 510, { steps: 1 });
    await capture(85);
  }
  await page.mouse.move(12, 12, { steps: 1 });
  await page.waitForTimeout(350);

  // Aperture expansion. The same showreel grows from the measured capsule to
  // the full stage; the reel is suspended during this pass.
  for (let index = 0; index < APERTURE_FRAMES; index += 1) {
    const t = easeInOutCubic(index / (APERTURE_FRAMES - 1));
    await scrollToProgress(hold + (full - hold) * t);
    await capture();
  }

  // Full stage. The caption is fully read and the reel resumes.
  await scrollToProgress(full);
  await page.waitForTimeout(500);
  for (let index = 0; index < FULL_FRAMES; index += 1) {
    await capture(120);
  }

  // Natural release into the next section.
  for (let index = 0; index < EXIT_FRAMES; index += 1) {
    await page.evaluate((step) => {
      const root = document.querySelector("[data-next-level]");
      const bottom = root.getBoundingClientRect().bottom + window.scrollY;
      const start = bottom - window.innerHeight;
      const target = start + 380 * step;
      window.scrollTo({ top: target, behavior: "instant" });
    }, index / (EXIT_FRAMES - 1));
    await capture(80);
  }

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
