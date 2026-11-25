/*
 * Preserved hero QA — originally hero-06b3a-silhouette.js
 * WebGL readPixels silhouette sampling through the story.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");
const fs = require("fs");
const path = require("path");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const OUT = out("hero-06b3a-baseline");
fs.mkdirSync(OUT, { recursive: true });

const PATCH = () => {
  window.__sil = null;
  for (const Ctor of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Ctor) continue;
    const original = Ctor.prototype.readPixels;
    Ctor.prototype.readPixels = function (x, y, w, h, format, type, pixels) {
      const result = original.apply(this, arguments);
      if (w === 1280 && h === 720 && pixels && pixels.length === w * h * 4) {
        const rows = [];
        let minRow = null;
        let maxRow = null;
        for (let row = 0; row < h; row += 1) {
          let minCol = -1;
          let maxCol = -1;
          for (let col = 0; col < w; col += 1) {
            if (pixels[(row * w + col) * 4 + 3] > 8) {
              if (minCol === -1) minCol = col;
              maxCol = col;
            }
          }
          if (minCol !== -1) {
            if (minRow === null) minRow = row;
            maxRow = row;
            rows.push([row, minCol, maxCol]);
          }
        }
        window.__sil = { width: w, height: h, minRow, maxRow, rows };
      }
      return result;
    };
  }
};

const READ = () => {
  const R = (n) => Math.round(n * 100) / 100;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: R(r.top), bottom: R(r.bottom), left: R(r.left), right: R(r.right), width: R(r.width), height: R(r.height) };
  };
  const focal = document.querySelector('[data-corridor-index][data-focal="true"]');
  const metaBlock = document.querySelector("[data-hero-featured-meta]");
  const metaLabel = metaBlock?.querySelector("p");
  const metaName = document.querySelector("[data-hero-meta-name]");
  const metaCount = document.querySelector("[data-hero-meta-count]");
  const cat = document.querySelector("[data-hero-cat]");
  const canvas = document.querySelector("[data-hero-cat] canvas");
  const rule = document.querySelector("[data-hero-rule]");
  const copy = document.querySelector("[data-hero-copy]");
  const stage = document.querySelector("[data-hero-stage]");
  const corridor = document.querySelector("[data-hero-corridor]");
  return {
    viewport: `${innerWidth}x${innerHeight}`,
    y: R(scrollY),
    mode: document.querySelector("[data-hero-story]")?.dataset.heroMode,
    stage: rect(stage),
    stagePadding: stage ? { top: getComputedStyle(stage).paddingTop, bottom: getComputedStyle(stage).paddingBottom } : null,
    copy: rect(copy),
    corridor: rect(corridor),
    focal: rect(focal),
    focalProject: focal ? Number(focal.dataset.corridorIndex) + 1 : null,
    metaBlock: rect(metaBlock),
    metaLabel: rect(metaLabel),
    metaName: rect(metaName),
    metaCount: rect(metaCount),
    metaCountText: metaCount?.textContent.replace(/\s+/g, " "),
    cat: rect(cat),
    canvas: rect(canvas),
    rule: rect(rule),
    sil: window.__sil,
  };
};

(async () => {
  const browser = await chromium.launch(launchOptions());
  const viewports = [
    [1024, 600], [1024, 768], [1024, 800], [1024, 1366],
    [1080, 720], [1100, 800], [1199, 800], [1200, 800],
    [1280, 720], [1366, 768], [1440, 900], [1920, 1080],
  ];
  const progressions = [0, 0.15, 0.24, 0.345, 0.5, 0.665, 0.85, 1];
  const out = [];
  for (const [w, h] of viewports) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.addInitScript(PATCH);
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForFunction(() => Boolean(window.__heroCorridor && window.__heroCat), null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    const base = await page.evaluate(READ);
    const poses = [];
    for (const p of progressions) {
      await page.evaluate((prog) => window.__heroCorridor.set(prog), p);
      await page.waitForTimeout(600);
      await page.evaluate(() => {
        const video = document.querySelector("[data-hero-cat] video");
        window.__heroCat.snapshot(video);
      });
      await page.waitForTimeout(60);
      poses.push({ progress: p, ...(await page.evaluate(READ)) });
    }
    out.push({ w, h, baseline: base, poses });
    await context.close();
  }
  fs.writeFileSync(path.join(OUT, "silhouette.json"), JSON.stringify(out, null, 1));

  const summary = out.map(({ w, h, baseline, poses }) => {
    const label = baseline.metaLabel;
    const count = baseline.metaCount;
    const sample = poses.find((p) => p.sil);
    const sil = sample.sil;
    const box = sample.cat;
    const scale = box.height / sil.height;
    const px = (col) => Math.round((box.left + col * scale) * 100) / 100;
    const py = (row) => Math.round((box.bottom - row * scale) * 100) / 100;
    const bandsOf = (pose) => {
      const s = pose.sil;
      const b = pose.cat;
      const sc = b.height / s.height;
      const px2 = (c) => b.left + c * sc;
      const py2 = (r) => b.bottom - r * sc;
      const ranges = {
        metaTopRow: [pose.metaLabel.top, pose.metaLabel.top + 8],
        metaBand: [pose.metaLabel.top, pose.metaCount.bottom],
        cardUpper: [pose.focal.top + pose.focal.height * 0.15, pose.focal.top + pose.focal.height * 0.45],
        cardMid: [pose.focal.top + pose.focal.height * 0.4, pose.focal.top + pose.focal.height * 0.8],
      };
      const res = {};
      for (const [name, [top, bottom]] of Object.entries(ranges)) {
        let left = null;
        let right = null;
        let rows = 0;
        for (const [row, minCol, maxCol] of s.rows) {
          const y = py2(row);
          if (y >= top && y <= bottom) {
            rows += 1;
            if (left === null || minCol < left) left = minCol;
            if (right === null || maxCol > right) right = maxCol;
          }
        }
        res[name] = {
          rows,
          catLeft: left === null ? null : Math.round(px2(left) * 100) / 100,
          catRight: right === null ? null : Math.round(px2(right) * 100) / 100,
          metaOverlap: right === null ? 0 : Math.round(Math.max(0, px2(right) - pose.metaLabel.left) * 100) / 100,
          focalOverlap: right === null ? 0 : Math.round(Math.max(0, px2(right) - pose.focal.left) * 100) / 100,
        };
      }
      return res;
    };
    return {
      viewport: `${w}x${h}`,
      mode: baseline.mode,
      focal: baseline.focal,
      metaLabel: label,
      metaName: baseline.metaName,
      metaCount: count,
      catBox: baseline.cat,
      gap: poses.map((p) => {
        if (!p.sil) return null;
        const sc = p.cat.height / p.sil.height;
        return Math.round((p.rule.top - (p.cat.bottom - p.sil.minRow * sc)) * 100) / 100;
      }),
      metaOverlap: poses.map((p) => (p.sil ? bandsOf(p).metaBand.metaOverlap : null)),
      metaTopOverlap: poses.map((p) => (p.sil ? bandsOf(p).metaTopRow.metaOverlap : null)),
      cardUpperOverlap: poses.map((p) => (p.sil ? bandsOf(p).cardUpper.focalOverlap : null)),
      cardMidOverlap: poses.map((p) => (p.sil ? bandsOf(p).cardMid.focalOverlap : null)),
      catRight: poses.map((p) => (p.sil ? bandsOf(p).cardMid.catRight : null)),
      projects: poses.map((p) => p.focalProject),
      counts: poses.map((p) => p.metaCountText),
    };
  });
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 1));
  for (const s of summary) {
    console.log(`\n## ${s.viewport} mode=${s.mode} focal=[${s.focal?.left},${s.focal?.right}] metaLeft=${s.metaLabel?.left} countRight=${s.metaCount?.right} catBox=[${s.catBox?.left},${s.catBox?.right}]`);
    console.log(`   gapToRule: ${s.gap.join(", ")}`);
    console.log(`   metaBandOverlap: ${s.metaOverlap.join(", ")}`);
    console.log(`   metaTopOverlap: ${s.metaTopOverlap.join(", ")}`);
    console.log(`   cardUpperOverlap: ${s.cardUpperOverlap.join(", ")}`);
    console.log(`   cardMidOverlap: ${s.cardMidOverlap.join(", ")}`);
  }
  await browser.close();
})();
