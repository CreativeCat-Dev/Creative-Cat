/*
 * Preserved hero QA — originally hero-06c2-final-run.js
 * HERO-06C.2 full responsive matrix, themes, enlarged text, reduced motion, no-JS, touch, keyboard.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");
const fs = require("fs");
const path = require("path");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";
const OUT = out("hero-06c2-final");
fs.mkdirSync(OUT, { recursive: true });

const READ = () => {
  const R = (n) => Math.round(n * 100) / 100;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: R(r.top), bottom: R(r.bottom), left: R(r.left), right: R(r.right), width: R(r.width), height: R(r.height) };
  };
  const doc = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: R(r.top + scrollY), bottom: R(r.bottom + scrollY), height: R(r.height) };
  };
  const textWidth = (el) => {
    if (!el) return null;
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    return R(r.width);
  };
  const copy = document.querySelector("[data-hero-copy]");
  const h1 = document.querySelector("#hero-title");
  const body = document.querySelector("[data-hero-body]");
  const ctas = [...document.querySelectorAll("[data-hero-cta]")];
  const group = document.querySelector("[data-hero-cta-group]");
  const track = document.querySelector("[data-hero-art-track]");
  const cards = [...document.querySelectorAll("[data-hero-lane] .hero-card")];
  const cat = document.querySelector('[data-hero-lane] img[src*="cat-poster"]');
  const featuredMeta = document.querySelector("[data-hero-lane] .max-w-\\[420px\\]");
  const rule = document.querySelector("[data-hero-rule]");
  const metaRow = document.querySelector("[data-hero-meta]");
  const stage = document.querySelector("[data-hero-stage]");
  const story = document.querySelector("[data-hero-story]");
  const footer = document.querySelector("footer");
  const lines = [...document.querySelectorAll("[data-hero-line]")];
  const bodyRange = body ? document.createRange() : null;
  if (bodyRange && body) bodyRange.selectNodeContents(body);
  const copyStyle = copy ? getComputedStyle(copy) : null;
  const bodyStyle = body ? getComputedStyle(body) : null;
  const groupStyle = group ? getComputedStyle(group) : null;
  const stageStyle = stage ? getComputedStyle(stage) : null;
  const ctaBottom = ctas.length ? Math.max(...ctas.map((cta) => cta.getBoundingClientRect().bottom)) : null;
  const cardTop = cards.length ? Math.min(...cards.map((card) => card.getBoundingClientRect().top)) : null;
  return {
    viewport: `${innerWidth}x${innerHeight}`,
    rootPx: getComputedStyle(document.documentElement).fontSize,
    mode: story?.dataset.heroMode,
    cat: document.querySelector("[data-hero-cat]")?.dataset.cat ?? "none",
    canvases: document.querySelectorAll("[data-hero-cat] canvas").length,
    video: document.querySelectorAll("video").length,
    triggers: window.__heroStory?.triggers?.() ?? null,
    lenis: window.__heroLenis?.instances ?? null,
    docHeight: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    stage: doc(stage),
    stagePadding: stageStyle ? { top: stageStyle.paddingTop, bottom: stageStyle.paddingBottom, left: stageStyle.paddingLeft, right: stageStyle.paddingRight } : null,
    contentWidth: stage ? R(stage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight)) : null,
    copy: rect(copy),
    copyAlign: copyStyle?.textAlign ?? null,
    eyebrow: rect(document.querySelector("[data-hero-eyebrow]")),
    h1: rect(h1),
    h1Font: h1 ? { size: getComputedStyle(h1).fontSize, lineHeight: getComputedStyle(h1).lineHeight, family: getComputedStyle(h1).fontFamily, tracking: getComputedStyle(h1).letterSpacing } : null,
    h1Inner: h1 ? h1.innerText : null,
    h1TextContent: h1 ? h1.textContent.replace(/\s+/g, " ").trim() : null,
    lineTextWidths: lines.map((line) => ({
      text: line.innerText,
      maskDisplay: getComputedStyle(line.parentElement).display,
      width: getComputedStyle(line.parentElement).display === "none" ? 0 : textWidth(line),
      maskHeight: R(line.parentElement.getBoundingClientRect().height),
      lineHeight: R(line.getBoundingClientRect().height),
    })),
    body: rect(body),
    bodyStyle: bodyStyle ? { fontSize: bodyStyle.fontSize, lineHeight: bodyStyle.lineHeight, maxWidth: bodyStyle.maxWidth, textAlign: bodyStyle.textAlign } : null,
    bodyLines: bodyRange ? [...bodyRange.getClientRects()].map((r) => R(r.width)) : [],
    ctas: ctas.map((cta) => ({ label: cta.textContent.replace(/\s+/g, " ").trim(), ...rect(cta) })),
    ctaGroup: group ? { ...rect(group), dir: groupStyle.flexDirection, justify: groupStyle.justifyContent, wrap: groupStyle.flexWrap, rowGap: groupStyle.rowGap, colGap: groupStyle.columnGap } : null,
    ctaBottom: R(ctaBottom),
    track: rect(track),
    trackMargin: track ? getComputedStyle(track).marginTop : null,
    cards: cards.map((card) => ({ ...rect(card), side: card.parentElement?.getAttribute("data-hero-card-side") ?? null, translate: card.parentElement ? getComputedStyle(card.parentElement).translate : null })),
    cardTop: R(cardTop),
    gap: R(cardTop - ctaBottom),
    catPoster: rect(cat),
    featuredMeta: rect(featuredMeta),
    rule: rect(rule),
    metaRow: rect(metaRow),
    navBottom: rect(document.querySelector("header"))?.bottom ?? null,
    footer: doc(footer),
    overlapFooter: (() => {
      const w = doc(story);
      const f = doc(footer);
      return w && f ? R(Math.max(0, w.bottom - f.top)) : null;
    })(),
    projectLinks: document.querySelectorAll('a[href^="/work/"]').length,
    heroCtas: ctas.length,
  };
};

async function capture(browser, w, h, theme, options = {}) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, ...options });
  const page = await context.newPage();
  if (options.rootPx) {
    await page.addInitScript((px) => {
      document.addEventListener("DOMContentLoaded", () => {
        document.documentElement.style.fontSize = `${px}px`;
      });
    }, options.rootPx);
  }
  await page.goto(BASE, { waitUntil: "networkidle" });
  if (options.rootPx) {
    await page.evaluate((px) => {
      document.documentElement.style.fontSize = `${px}px`;
    }, options.rootPx);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(950);
  const data = await page.evaluate(READ);
  const ax = await page.locator("#hero-title").ariaSnapshot();
  const suffix = [theme, options.rootPx ? `text${options.rootPx}` : null, options.suffix].filter(Boolean).join("-");
  const file = `${w}x${h}-${suffix}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  if (data.docHeight > h && options.full !== false) {
    await page.screenshot({ path: path.join(OUT, file.replace(".png", "-full.png")), fullPage: true });
  }
  if (options.keyboard) {
    const order = [];
    for (let i = 0; i < 16; i += 1) {
      await page.keyboard.press("Tab");
      const active = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        return {
          tag: el.tagName,
          text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
          heroCta: el.hasAttribute("data-hero-cta"),
          href: el.getAttribute("href"),
          ring: getComputedStyle(el).boxShadow !== "none",
        };
      });
      order.push(active);
    }
    data.keyboard = order;
  }
  await context.close();
  return { w, h, theme, rootPx: options.rootPx ?? null, suffix: options.suffix ?? null, ax, ...data };
}

(async () => {
  const browser = await chromium.launch(launchOptions());
  const out = [];

  const sizes = [
    ["compact", 320, 568], ["compact", 320, 640], ["compact", 360, 640], ["compact", 360, 800],
    ["compact", 375, 667], ["compact", 375, 812],
    ["standard", 390, 844], ["standard", 393, 852], ["standard", 412, 915], ["standard", 430, 932], ["standard", 440, 956],
    ["wide", 280, 653], ["wide", 480, 800], ["wide", 540, 720], ["wide", 600, 800], ["wide", 767, 1024],
    ["landscape", 568, 320], ["landscape", 667, 375], ["landscape", 720, 360], ["landscape", 767, 430],
    ["tablet", 844, 390], ["tablet", 932, 430], ["tablet", 768, 1024], ["tablet", 1023, 1366],
    ["desktop", 1024, 600], ["desktop", 1024, 768], ["desktop", 1024, 1366], ["desktop", 1440, 900], ["desktop", 1920, 1080],
  ];
  const darkSet = new Set(["320x568", "375x812", "390x844", "430x932", "767x1024", "568x320", "844x390", "768x1024", "1023x1366", "1024x1366", "1440x900"]);

  for (const [group, w, h] of sizes) {
    out.push(await capture(browser, w, h, "light"));
    if (darkSet.has(`${w}x${h}`)) out.push(await capture(browser, w, h, "dark"));
    if (group === "compact" || group === "standard" || group === "wide" || group === "landscape") {
      out[out.length - 1].group = group;
    }
  }

  // Enlarged root text (zoom-equivalent, not actual browser zoom).
  for (const [w, h, root] of [
    [320, 568, 32], [375, 812, 20], [375, 812, 24], [375, 812, 32],
    [430, 932, 20], [430, 932, 24], [430, 932, 32], [480, 800, 32],
    [540, 720, 32], [767, 1024, 20], [767, 1024, 24], [767, 1024, 32],
    [768, 1024, 20], [768, 1024, 24], [768, 1024, 32], [1023, 1366, 32],
    [1024, 1366, 20], [1024, 1366, 24], [1024, 1366, 32],
  ]) {
    out.push(await capture(browser, w, h, "light", { rootPx: root, suffix: "scaled", full: false }));
  }

  // Reduced motion.
  for (const [w, h] of [[320, 568], [375, 812], [430, 932], [767, 1024], [768, 1024], [1440, 900]]) {
    out.push(await capture(browser, w, h, "light", { reducedMotion: "reduce", suffix: "reduce" }));
  }

  // No JavaScript.
  for (const [w, h] of [[320, 568], [375, 812], [430, 932], [767, 1024], [768, 1024]]) {
    out.push(await capture(browser, w, h, "light", { javaScriptEnabled: false, suffix: "nojs" }));
  }

  // Touch / coarse pointer.
  for (const [w, h] of [[320, 568], [375, 812], [430, 932], [767, 1024]]) {
    out.push(await capture(browser, w, h, "light", { hasTouch: true, isMobile: true, suffix: "touch" }));
  }

  // Keyboard order.
  out.push(await capture(browser, 375, 812, "light", { suffix: "keyboard", keyboard: true }));
  out.push(await capture(browser, 834, 1194, "light", { suffix: "keyboard", keyboard: true }));

  // Fractional CSS viewports via a same-origin iframe: media queries use the iframe width.
  for (const width of [767.5, 1023.5, 1024]) {
    const context = await browser.newContext({ viewport: { width: 1300, height: 1000 } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    const result = await page.evaluate(async (frameWidth) => {
      const frame = document.createElement("iframe");
      frame.style.cssText = `position:fixed;left:-9999px;top:0;width:${frameWidth}px;height:1000px;border:0;`;
      frame.src = "/";
      document.body.appendChild(frame);
      await new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
      const doc = frame.contentDocument;
      await doc.fonts.ready;
      await new Promise((resolve) => setTimeout(resolve, 700));
      const copy = doc.querySelector("[data-hero-copy]");
      const body = doc.querySelector("[data-hero-body]");
      const firstLine = doc.querySelector("[data-hero-line]");
      const track = doc.querySelector("[data-hero-art-track]");
      const card = doc.querySelector("[data-hero-card-side]");
      const lines = [...doc.querySelectorAll("[data-hero-line]")];
      const value = {
        innerWidth: frame.contentWindow.innerWidth,
        copyWidth: Math.round(copy.getBoundingClientRect().width * 100) / 100,
        copyAlign: getComputedStyle(copy).textAlign,
        bodyAlign: getComputedStyle(body).textAlign,
        bodyMax: getComputedStyle(body).maxWidth,
        firstLineMask: getComputedStyle(firstLine.parentElement).display,
        hiddenTail: getComputedStyle(lines[2].parentElement).display,
        cardWidth: card ? Math.round(card.getBoundingClientRect().width * 100) / 100 : null,
        trackHeight: track ? Math.round(track.getBoundingClientRect().height * 100) / 100 : null,
      };
      frame.remove();
      return value;
    }, width);
    console.log(`fractional ${width}`, JSON.stringify(result));
    out.push({ fractional: width, ...result });
    await context.close();
  }

  fs.writeFileSync(path.join(OUT, "geometry.json"), JSON.stringify(out, null, 1));
  for (const x of out.filter((r) => !r.suffix && !r.fractional && r.theme === "light")) {
    console.log(`\n## ${x.w}x${x.h} ${x.group ?? "tablet"} mode=${x.mode} cat=${x.cat} doc=${x.docHeight} ox=${x.overflowX}`);
    console.log(`   pad ${JSON.stringify(x.stagePadding)} content=${x.contentWidth} copy ${x.copy?.left}-${x.copy?.right} align=${x.copyAlign}`);
    console.log(`   h1 ${x.h1Font?.size}/${x.h1Font?.lineHeight} t${x.h1?.top} lines=${x.lineTextWidths.map((l) => `${l.text.trim()}[${l.maskDisplay}:${l.width}]`).join(" | ")} inner=${JSON.stringify(x.h1Inner)}`);
    console.log(`   body ${x.body?.left}-${x.body?.right} fs=${x.bodyStyle?.fontSize} max=${x.bodyStyle?.maxWidth} lines=${x.bodyLines.join(",")}`);
    console.log(`   ctas ${x.ctas.map((c) => `${c.label}:${c.width}x${c.height}@${c.top}`).join(" | ")} dir=${x.ctaGroup?.dir} justify=${x.ctaGroup?.justify} group=${x.ctaGroup?.left}-${x.ctaGroup?.right}/${x.ctaGroup?.height}`);
    console.log(`   track mt=${x.trackMargin} ${x.track?.top}-${x.track?.bottom} cards=${x.cards.map((c) => `${c.side}:${c.left}-${c.right}/${c.top}`).join(" | ")} gap=${x.gap}`);
    console.log(`   cat ${x.catPoster?.left}-${x.catPoster?.right}/${x.catPoster?.top} featuredMeta ${x.featuredMeta?.left}-${x.featuredMeta?.right}/${x.featuredMeta?.top} rule=${x.rule?.top} meta=${x.metaRow?.top}-${x.metaRow?.bottom}`);
    console.log(`   nav=${x.navBottom} footer=${x.overlapFooter} ctas=${x.heroCtas} links=${x.projectLinks} triggers=${x.triggers} canvases=${x.canvases} video=${x.video} AX=${x.ax}`);
  }
  await browser.close();
})();
