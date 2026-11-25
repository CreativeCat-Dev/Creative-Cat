/*
 * Preserved hero QA — originally hero-06b3-regression.js
 * Adaptive eligibility, CLS and reading-position restoration cases A/B/C.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";

const INIT = () => {
  window.__q = { shifts: [], scrolls: [] };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__q.shifts.push({ v: e.value, t: e.startTime, input: e.hadRecentInput });
    }
  }).observe({ type: "layout-shift", buffered: true });
  const original = window.scrollTo.bind(window);
  window.scrollTo = (...args) => {
    window.__q.scrolls.push({ args: JSON.stringify(args), y: scrollY });
    return original(...args);
  };
};

const READ = () => {
  const R = (n) => Math.round(n * 100) / 100;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: R(r.top), bottom: R(r.bottom), height: R(r.height) };
  };
  const cls = (() => {
    const entries = window.__q.shifts.filter((x) => !x.input).sort((a, b) => a.t - b.t);
    const sessions = [];
    let cur = null;
    for (const e of entries) {
      if (!cur || e.t - cur.last >= 1000 || e.t - cur.first >= 5000) {
        cur = { first: e.t, last: e.t, sum: 0, values: [] };
        sessions.push(cur);
      }
      cur.last = e.t;
      cur.sum += e.v;
      cur.values.push(+e.v.toFixed(6));
    }
    return sessions.length ? Math.max(...sessions.map((s) => s.sum)) : 0;
  })();
  const stage = document.querySelector("[data-hero-stage]");
  const wrapper = document.querySelector("[data-hero-story]");
  const footer = document.querySelector("footer");
  return {
    y: R(scrollY),
    docH: document.documentElement.scrollHeight,
    max: document.documentElement.scrollHeight - innerHeight,
    wrapper: rect(wrapper),
    stage: rect(stage),
    stagePad: stage ? { top: getComputedStyle(stage).paddingTop, bottom: getComputedStyle(stage).paddingBottom } : null,
    copy: rect(document.querySelector("[data-hero-copy]")),
    eyebrow: rect(document.querySelector("[data-hero-eyebrow]")),
    title: rect(document.querySelector("#hero-title")),
    cta: rect(document.querySelector("[data-hero-cta]")),
    rule: rect(document.querySelector("[data-hero-rule]")),
    meta: rect(document.querySelector("[data-hero-meta]")),
    footer: rect(footer),
    mode: wrapper?.dataset.heroMode,
    fit: wrapper?.dataset.heroFit,
    rootFont: getComputedStyle(document.documentElement).fontSize,
    count: stage?.querySelector("[data-hero-meta-count]")?.textContent.replace(/\s+/g, " "),
    cat: document.querySelector("[data-hero-cat]")?.dataset.cat,
    canvases: document.querySelectorAll("[data-hero-cat] canvas").length,
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    cls: +cls.toFixed(6),
    shifts: window.__q.shifts.length,
    corrections: window.__q.scrolls.filter((c) => c.args.trim().startsWith("[{"))
      .map((c) => c.args),
  };
};

(async () => {
  const browser = await chromium.launch(launchOptions());
  const out = {};
  const open = async (w, h) => {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.addInitScript(INIT);
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
    return { context, page };
  };

  for (const [name, w, h, scroll, font] of [
    ["A_1024x600_saved1200_20", 1024, 600, 1200, 20],
    ["B_1440x900_saved1800_24", 1440, 900, 1800, 24],
  ]) {
    const { context, page } = await open(w, h);
    const cdp = await context.newCDPSession(page);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), scroll);
    await page.waitForTimeout(600);
    const before = await page.evaluate(READ);
    await cdp.send("Page.setFontSizes", { fontSizes: { standard: font, fixed: font } });
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2200);
    out[name] = { before, after: await page.evaluate(READ) };
    await context.close();
  }

  {
    const { context, page } = await open(1024, 600);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await page.waitForTimeout(600);
    const before = await page.evaluate(READ);
    await page.evaluate(() => { window.__q.scrolls = []; });
    await page.addStyleTag({ content: "html{font-size:20px !important}" });
    await page.waitForTimeout(1800);
    out.C_1024x600_runtime20 = { before, after: await page.evaluate(READ) };
    await context.close();
  }

  for (const [name, y] of [
    ["Compatible_p0", 0],
    ["Compatible_p05", 1200],
    ["Compatible_p1", 2400],
  ]) {
    const { context, page } = await open(1024, 600);
    if (y) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(600);
    }
    const before = await page.evaluate(READ);
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    out[name] = { before, after: await page.evaluate(READ) };
    await context.close();
  }

  for (const [name, w, h, font] of [
    ["Font_1440x900_20", 1440, 900, 20],
    ["Font_1440x900_24", 1440, 900, 24],
    ["Font_1440x900_32", 1440, 900, 32],
    ["Font_1024x600_20", 1024, 600, 20],
    ["Font_1024x768_20", 1024, 768, 20],
    ["Font_1920x1080_24", 1920, 1080, 24],
  ]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Page.setFontSizes", { fontSizes: { standard: font, fixed: font } });
    await page.addInitScript(INIT);
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    out[name] = await page.evaluate(READ);
    await context.close();
  }

  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
