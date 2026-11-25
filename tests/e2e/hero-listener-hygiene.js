/*
 * Preserved hero QA — originally hero-06b2ar-listeners.js
 * Listener and observer add/remove accounting across mode and route transitions.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";

const UNIQUE = () => {
  window.__unique = {
    counts: {},
    adds: 0,
    removes: 0,
  };
  const registry = new Map();
  const track = (target, bucket, type, listener, delta) => {
    let types = registry.get(target);
    if (!types) {
      types = new Map();
      registry.set(target, types);
    }
    let set = types.get(type);
    if (!set) {
      set = new Set();
      types.set(type, set);
    }
    const key = `${bucket}:${type}`;
    if (delta > 0 && !set.has(listener)) {
      set.add(listener);
      window.__unique.counts[key] = (window.__unique.counts[key] || 0) + 1;
      window.__unique.adds += 1;
    } else if (delta < 0 && set.delete(listener)) {
      window.__unique.counts[key] = (window.__unique.counts[key] || 0) - 1;
      window.__unique.removes += 1;
    }
  };
  const trackedTypes = new Set(["resize", "scroll", "pageshow", "visibilitychange"]);
  for (const [target, bucket] of [
    [window, "window"],
    [document, "document"],
  ]) {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);
    target.addEventListener = function (type, listener, options) {
      if (trackedTypes.has(type)) track(target, bucket, type, listener, 1);
      return add(type, listener, options);
    };
    target.removeEventListener = function (type, listener, options) {
      if (trackedTypes.has(type)) track(target, bucket, type, listener, -1);
      return remove(type, listener, options);
    };
  }
  const mqlRegistry = new Map();
  const mediaAdd = MediaQueryList.prototype.addEventListener;
  const mediaRemove = MediaQueryList.prototype.removeEventListener;
  MediaQueryList.prototype.addEventListener = function (type, listener, options) {
    if (type === "change") {
      let set = mqlRegistry.get(this);
      if (!set) {
        set = new Set();
        mqlRegistry.set(this, set);
      }
      if (!set.has(listener)) {
        set.add(listener);
        window.__unique.counts["media:change"] =
          (window.__unique.counts["media:change"] || 0) + 1;
        window.__unique.adds += 1;
      }
    }
    return mediaAdd.call(this, type, listener, options);
  };
  MediaQueryList.prototype.removeEventListener = function (type, listener, options) {
    if (type === "change") {
      const set = mqlRegistry.get(this);
      if (set && set.delete(listener)) {
        window.__unique.counts["media:change"] =
          (window.__unique.counts["media:change"] || 0) - 1;
        window.__unique.removes += 1;
      }
    }
    return mediaRemove.call(this, type, listener, options);
  };
};

const READ = () => {
  const wrapper = document.querySelector("[data-hero-story]");
  return {
    path: location.pathname,
    y: Math.round(scrollY * 100) / 100,
    mode: wrapper?.dataset.heroMode,
    wrapper: wrapper ? Math.round(wrapper.getBoundingClientRect().height * 100) / 100 : null,
    unique: window.__unique,
  };
};

(async () => {
  const browser = await chromium.launch(launchOptions());
  const out = {};
  {
    const context = await browser.newContext({ viewport: { width: 1024, height: 600 } });
    const page = await context.newPage();
    await page.addInitScript(UNIQUE);
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    const before = await page.evaluate(READ);
    const steps = [];
    for (let index = 0; index < 10; index += 1) {
      await page.setViewportSize({ width: 1024, height: 599 });
      await page.waitForTimeout(450);
      steps.push({ at: 599, ...(await page.evaluate(READ)) });
      await page.setViewportSize({ width: 1024, height: 600 });
      await page.waitForTimeout(550);
      steps.push({ at: 600, ...(await page.evaluate(READ)) });
    }
    out.crossings = { before, steps };
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await page.waitForTimeout(600);
    await page.click('a:has-text("View selected work")');
    await page.waitForTimeout(800);
    const away = await page.evaluate(READ);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1600);
    const back = await page.evaluate(READ);
    out.navigation = { away, back };
    await context.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
