/*
 * Preserved hero QA — originally hero-06c2-baseline.js
 * HERO-06C.2 viewport-by-viewport geometry snapshot.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");
const fs = require("fs");
const path = require("path");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";
const OUT = out("hero-06c2-baseline");
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
  const copy = document.querySelector("[data-hero-copy]");
  const headline = document.querySelector("#hero-title");
  const body = document.querySelector("[data-hero-body]");
  const ctas = [...document.querySelectorAll("[data-hero-cta]")];
  const ctaGroup = document.querySelector("[data-hero-cta-group]");
  const track = document.querySelector("[data-hero-art-track]");
  const cards = [...document.querySelectorAll("[data-hero-lane] .hero-card")];
  const catPoster = document.querySelector('[data-hero-lane] img[src*="cat-poster"]');
  const featuredMeta = document.querySelector("[data-hero-lane] .max-w-\\[420px\\]");
  const rule = document.querySelector("[data-hero-rule]");
  const metaRow = document.querySelector("[data-hero-meta]");
  const stage = document.querySelector("[data-hero-stage]");
  const story = document.querySelector("[data-hero-story]");
  const footer = document.querySelector("footer");
  const bodyRange = body ? document.createRange() : null;
  if (bodyRange && body) bodyRange.selectNodeContents(body);
  const copyStyle = copy ? getComputedStyle(copy) : null;
  const bodyStyle = body ? getComputedStyle(body) : null;
  const ctaGroupStyle = ctaGroup ? getComputedStyle(ctaGroup) : null;
  const lines = [...document.querySelectorAll("[data-hero-line]")];
  return {
    viewport: `${innerWidth}x${innerHeight}`,
    rootPx: getComputedStyle(document.documentElement).fontSize,
    mode: story?.dataset.heroMode,
    cat: document.querySelector("[data-hero-cat]")?.dataset.cat ?? "none",
    canvases: document.querySelectorAll("[data-hero-cat] canvas").length,
    video: document.querySelectorAll("video").length,
    triggers: window.__heroStory?.triggers?.() ?? null,
    lenis: window.__heroLenis?.instances ?? null,
    scrollY: R(scrollY),
    docHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    stage: doc(stage),
    stagePadding: stage ? { top: getComputedStyle(stage).paddingTop, bottom: getComputedStyle(stage).paddingBottom, left: getComputedStyle(stage).paddingLeft, right: getComputedStyle(stage).paddingRight } : null,
    copy: rect(copy),
    copyStyle: copyStyle ? { textAlign: copyStyle.textAlign, width: copyStyle.width, maxWidth: copyStyle.maxWidth } : null,
    eyebrow: rect(document.querySelector("[data-hero-eyebrow]")),
    headline: rect(headline),
    headlineFont: headline ? { size: getComputedStyle(headline).fontSize, lineHeight: getComputedStyle(headline).lineHeight, family: getComputedStyle(headline).fontFamily } : null,
    headlineInnerText: headline ? headline.innerText : null,
    headlineTextContent: headline ? headline.textContent.replace(/\s+/g, " ").trim() : null,
    lines: lines.map((line) => ({
      text: line.innerText,
      lineDisplay: line.parentElement ? getComputedStyle(line.parentElement).display : null,
      ...rect(line),
    })),
    body: rect(body),
    bodyStyle: bodyStyle ? { fontFamily: bodyStyle.fontFamily, fontSize: bodyStyle.fontSize, lineHeight: bodyStyle.lineHeight, maxWidth: bodyStyle.maxWidth, textAlign: bodyStyle.textAlign } : null,
    bodyLines: bodyRange ? [...bodyRange.getClientRects()].map((r) => ({ top: R(r.top), width: R(r.width) })) : [],
    ctas: ctas.map((cta) => ({ label: cta.textContent.replace(/\s+/g, " ").trim(), ...rect(cta) })),
    ctaGroup: ctaGroup ? { ...rect(ctaGroup), justify: ctaGroupStyle.justifyContent, flexWrap: ctaGroupStyle.flexWrap, rowGap: ctaGroupStyle.rowGap, colGap: ctaGroupStyle.columnGap } : null,
    ctaBottom: ctas.length ? R(Math.max(...ctas.map((cta) => cta.getBoundingClientRect().bottom))) : null,
    track: rect(track),
    cards: cards.map((card) => ({ ...rect(card), fit: card.querySelector("img[data-nimg]")?.getAttribute("src") ?? null })),
    cardTop: cards.length ? R(Math.min(...cards.map((card) => card.getBoundingClientRect().top))) : null,
    catPoster: rect(catPoster),
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

(async () => {
  const browser = await chromium.launch(launchOptions());
  const out = [];
  const sizes = [
    ["compact", 320, 568], ["compact", 320, 640], ["compact", 360, 640], ["compact", 360, 800],
    ["compact", 375, 667], ["compact", 375, 812],
    ["standard", 390, 844], ["standard", 393, 852], ["standard", 412, 915], ["standard", 430, 932], ["standard", 440, 956],
    ["wide", 280, 653], ["wide", 480, 800], ["wide", 540, 720], ["wide", 600, 800], ["wide", 767, 1024],
    ["landscape", 568, 320], ["landscape", 667, 375], ["landscape", 720, 360], ["landscape", 767, 430],
    ["tablet", 844, 390], ["tablet", 932, 430],
    ["boundary", 768, 1024], ["boundary", 1023, 1366], ["boundary", 1024, 1366],
    ["desktop", 1024, 600], ["desktop", 1024, 768], ["desktop", 1440, 900], ["desktop", 1920, 1080],
  ];
  for (const [group, w, h] of sizes) {
    for (const theme of ["light", "dark"]) {
      if (theme === "dark" && ![[320, 568], [390, 844], [430, 932], [767, 1024], [568, 320], [844, 390], [1024, 1366]].some(([a, b]) => a === w && b === h)) continue;
      const context = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
      const page = await context.newPage();
      await page.goto(BASE, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(900);
      const data = await page.evaluate(READ);
      const ax = await page.locator("#hero-title").ariaSnapshot();
      await page.screenshot({ path: path.join(OUT, `${group}-${w}x${h}-${theme}.png`) });
      if (data.docHeight > h) {
        await page.screenshot({ path: path.join(OUT, `${group}-${w}x${h}-${theme}-full.png`), fullPage: true });
      }
      out.push({ group, w, h, theme, ax, ...data });
      await context.close();
    }
  }
  fs.writeFileSync(path.join(OUT, "geometry.json"), JSON.stringify(out, null, 1));
  for (const x of out.filter((r) => r.theme === "light")) {
    const gap = x.cardTop == null ? null : Math.round((x.cardTop - x.ctaBottom) * 100) / 100;
    console.log(`## ${x.w}x${x.h} ${x.group} mode=${x.mode} cat=${x.cat} track=${x.track?.height} doc=${x.docHeight} ox=${x.overflowX} ax=${x.ax}`);
    console.log(`   pad ${JSON.stringify(x.stagePadding)} copy ${x.copy?.left}-${x.copy?.right} align=${x.copyStyle?.textAlign}`);
    console.log(`   h1 ${x.headline?.top}-${x.headline?.bottom} ${x.headlineFont?.size}/${x.headlineFont?.lineHeight} "${x.headlineInnerText}" lines=${x.lines.map((l) => `${l.text.trim()}[${l.lineDisplay}] ${l.width}`).join(" | ")}`);
    console.log(`   body ${x.body?.left}-${x.body?.right} fs=${x.bodyStyle?.fontSize} maxW=${x.bodyStyle?.maxWidth} lines=${x.bodyLines.map((l) => l.width).join(",")}`);
    console.log(`   ctas ${x.ctas.map((c) => `${c.label}:${c.width}x${c.height}@${c.top}`).join(" | ")} group=${x.ctaGroup?.left}-${x.ctaGroup?.right} justify=${x.ctaGroup?.justify} wrap=${x.ctaGroup?.flexWrap} gaps=${x.ctaGroup?.rowGap}/${x.ctaGroup?.colGap}`);
    console.log(`   cards ${x.cards.map((c) => `${c.left}-${c.right}/${c.top}-${c.bottom}`).join(" | ")} cardTop=${x.cardTop} ctaBottom=${x.ctaBottom} gap=${gap}`);
    console.log(`   cat ${x.catPoster?.left}-${x.catPoster?.right}/${x.catPoster?.top}-${x.catPoster?.bottom} featuredMeta ${x.featuredMeta?.left}-${x.featuredMeta?.right}/${x.featuredMeta?.top}`);
    console.log(`   rule ${x.rule?.top} meta ${x.metaRow?.top}-${x.metaRow?.bottom} nav=${x.navBottom} footer=${x.overlapFooter} links=${x.projectLinks} ctas=${x.heroCtas} triggers=${x.triggers} canvases=${x.canvases} video=${x.video}`);
  }
  await browser.close();
})();
