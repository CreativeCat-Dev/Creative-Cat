/*
 * Preserved hero QA — originally hero-06b2ar-regression.js
 * Static/enhanced mode crossings, restoration, WebGL loss, no-JS, reduced motion, touch.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";

const COUNTERS = () => {
  window.__counts = {
    roLive: 0,
    roCreated: 0,
    roDisconnected: 0,
    windowListeners: {},
    documentListeners: {},
    mediaAdds: 0,
    mediaRemoves: 0,
  };
  const NativeRO = window.ResizeObserver;
  window.ResizeObserver = class extends NativeRO {
    constructor(callback) {
      super(callback);
      this.__live = true;
      window.__counts.roLive += 1;
      window.__counts.roCreated += 1;
    }
    disconnect() {
      if (this.__live) {
        this.__live = false;
        window.__counts.roLive -= 1;
        window.__counts.roDisconnected += 1;
      }
      return super.disconnect();
    }
  };
  const tracked = new Set(["resize", "scroll", "pageshow", "visibilitychange"]);
  for (const target of [window, document]) {
    const bucket = target === window ? "windowListeners" : "documentListeners";
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);
    target.addEventListener = function (type, listener, options) {
      if (tracked.has(type)) {
        window.__counts[bucket][type] = (window.__counts[bucket][type] || 0) + 1;
      }
      return add(type, listener, options);
    };
    target.removeEventListener = function (type, listener, options) {
      if (tracked.has(type)) {
        window.__counts[bucket][type] = (window.__counts[bucket][type] || 0) - 1;
      }
      return remove(type, listener, options);
    };
  }
  const mediaAdd = MediaQueryList.prototype.addEventListener;
  const mediaRemove = MediaQueryList.prototype.removeEventListener;
  MediaQueryList.prototype.addEventListener = function (type, listener, options) {
    if (type === "change") window.__counts.mediaAdds += 1;
    return mediaAdd.call(this, type, listener, options);
  };
  MediaQueryList.prototype.removeEventListener = function (type, listener, options) {
    if (type === "change") window.__counts.mediaRemoves += 1;
    return mediaRemove.call(this, type, listener, options);
  };
};

const READ = () => {
  const R = (n) => Math.round(n * 100) / 100;
  const wrapper = document.querySelector("[data-hero-story]");
  const stage = document.querySelector("[data-hero-stage]");
  const wr = wrapper?.getBoundingClientRect();
  const sr = stage?.getBoundingClientRect();
  return {
    path: location.pathname,
    y: R(scrollY),
    docH: document.documentElement.scrollHeight,
    max: document.documentElement.scrollHeight - innerHeight,
    wrapper: wr ? R(wr.height) : null,
    stage: sr ? R(sr.height) : null,
    mode: wrapper?.dataset.heroMode,
    fit: wrapper?.dataset.heroFit,
    h: document.documentElement.style.getPropertyValue("--hero-story-h").trim(),
    cat: document.querySelector("[data-hero-cat]")?.dataset.cat,
    canvases: document.querySelectorAll("[data-hero-cat] canvas").length,
    projectLinks: document.querySelectorAll("[data-hero-corridor] a[href]").length,
    count: stage?.querySelector("[data-hero-meta-count]")?.textContent.replace(/\s+/g, " "),
    theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    counts: window.__counts,
  };
};

(async () => {
  const browser = await chromium.launch(launchOptions());
  const out = {};

  // Ten boundary crossings at the top.
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 600 } });
    const page = await context.newPage();
    await page.addInitScript(COUNTERS);
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 160));
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    const baseline = await page.evaluate(READ);
    const steps = [];
    for (let index = 0; index < 10; index += 1) {
      await page.setViewportSize({ width: 1024, height: 599 });
      await page.waitForTimeout(500);
      steps.push({ at: "599", ...(await page.evaluate(READ)) });
      await page.setViewportSize({ width: 1024, height: 600 });
      await page.waitForTimeout(600);
      steps.push({ at: "600", ...(await page.evaluate(READ)) });
    }
    out.boundary_crossings = { baseline, steps, errors };
    await context.close();
  }

  // Healthy client navigation and return at y1200.
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 600 } });
    const page = await context.newPage();
    await page.addInitScript(COUNTERS);
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await page.waitForTimeout(700);
    const before = await page.evaluate(READ);
    await page.click('a:has-text("View selected work")');
    await page.waitForTimeout(900);
    const away = await page.evaluate(READ);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);
    const back = await page.evaluate(READ);
    out.healthy_navigation = { before, away, back, errors, sameDocument: before.path === back.path };
    await context.close();
  }

  // Client navigation, hidden resize, return (known limitation probe).
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 600 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await page.waitForTimeout(700);
    const before = await page.evaluate(READ);
    await page.click('a:has-text("View selected work")');
    await page.waitForTimeout(700);
    await page.setViewportSize({ width: 1024, height: 500 });
    await page.waitForTimeout(700);
    const away = await page.evaluate(READ);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);
    const back = await page.evaluate(READ);
    out.hidden_resize_return = { before, away, back, errors };
    await context.close();
  }

  // Genuine WebGL loss and restore.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await page.waitForTimeout(700);
    const before = await page.evaluate(READ);
    const frameBefore = await page.evaluate(() => {
      const video = document.querySelector("[data-hero-cat] video");
      return video ? Math.round(video.currentTime * 24 - 0.5) : null;
    });
    await page.evaluate(() => {
      const canvas = document.querySelector("[data-hero-cat] canvas");
      const gl = canvas.getContext("webgl");
      window.__ext = gl.getExtension("WEBGL_lose_context");
      window.__ext.loseContext();
    });
    await page.waitForTimeout(700);
    const lost = await page.evaluate(READ);
    const lostCanvas = await page.evaluate(() => {
      const canvas = document.querySelector("[data-hero-cat] canvas");
      const gl = canvas.getContext("webgl");
      return { lost: gl.isContextLost(), opacity: getComputedStyle(canvas).opacity };
    });
    await page.evaluate(() => window.__ext.restoreContext());
    await page.waitForTimeout(1800);
    const restored = await page.evaluate(READ);
    const restoredCanvas = await page.evaluate(() => {
      const canvas = document.querySelector("[data-hero-cat] canvas");
      const gl = canvas.getContext("webgl");
      const video = document.querySelector("[data-hero-cat] video");
      return {
        lost: gl.isContextLost(),
        opacity: getComputedStyle(canvas).opacity,
        frame: video ? Math.round(video.currentTime * 24 - 0.5) : null,
      };
    });
    out.webgl = { before, frameBefore, lost, lostCanvas, restored, restoredCanvas, errors };
    await context.close();
  }

  // No-JS, reduced motion, dark, touch.
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(800);
    const read = await page.evaluate(READ).catch(() => null);
    out.nojs = read ?? { note: "JS disabled" };
    await context.close();
  }
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
      colorScheme: "dark",
    });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    out.reduced_dark = await page.evaluate(READ);
    await context.close();
  }
  {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 600 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const read = await page.evaluate(READ);
    const ctas = await page.evaluate(() =>
      [...document.querySelectorAll("[data-hero-cta]")].map((el) => ({
        text: (el.textContent || "").trim(),
        href: el.getAttribute("href"),
        visible: Boolean(el.getClientRects().length),
      }))
    );
    out.touch = { read, ctas };
    await context.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
