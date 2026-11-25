/*
 * Preserved hero QA — originally hero-06c2-enlarged.js
 * Root-font enlargement (zoom-equivalent) overflow and clearance matrix.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";

const READ = () => {
  const R = (n) => Math.round(n * 100) / 100;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: R(r.top), bottom: R(r.bottom), left: R(r.left), right: R(r.right), width: R(r.width), height: R(r.height) };
  };
  const body = document.querySelector("[data-hero-body]");
  const ctas = [...document.querySelectorAll("[data-hero-cta]")];
  const cards = [...document.querySelectorAll("[data-hero-lane] .hero-card")];
  const range = body ? document.createRange() : null;
  if (range && body) range.selectNodeContents(body);
  const ctaBottom = ctas.length ? Math.max(...ctas.map((c) => c.getBoundingClientRect().bottom)) : null;
  const cardTop = cards.length ? Math.min(...cards.map((c) => c.getBoundingClientRect().top)) : null;
  return {
    root: getComputedStyle(document.documentElement).fontSize,
    mode: document.querySelector("[data-hero-story]")?.dataset.heroMode,
    copy: rect(document.querySelector("[data-hero-copy]")),
    copyAlign: getComputedStyle(document.querySelector("[data-hero-copy]")).textAlign,
    h1: rect(document.querySelector("#hero-title")),
    h1Inner: document.querySelector("#hero-title").innerText,
    masks: [...document.querySelectorAll("[data-hero-line]")].map((line) => {
      const m = line.parentElement.getBoundingClientRect();
      return { text: line.innerText, display: getComputedStyle(line.parentElement).display, w: R(line.getBoundingClientRect().width), h: R(line.getBoundingClientRect().height), maskH: R(m.height) };
    }),
    body: rect(body),
    bodyMax: getComputedStyle(body).maxWidth,
    bodyFont: getComputedStyle(body).fontSize,
    bodyLines: range ? [...range.getClientRects()].map((r) => R(r.width)) : [],
    group: rect(document.querySelector("[data-hero-cta-group]")),
    groupDir: getComputedStyle(document.querySelector("[data-hero-cta-group]")).flexDirection,
    ctas: ctas.map((c) => ({ label: c.textContent.replace(/\s+/g, " ").trim(), ...rect(c) })),
    ctaBottom: R(ctaBottom),
    track: rect(document.querySelector("[data-hero-art-track]")),
    trackMargin: getComputedStyle(document.querySelector("[data-hero-art-track]")).marginTop,
    cardTop: R(cardTop),
    gap: R(cardTop - ctaBottom),
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    doc: document.documentElement.scrollHeight,
    footerOverlap: (() => {
      const w = document.querySelector("[data-hero-story]").getBoundingClientRect();
      const f = document.querySelector("footer").getBoundingClientRect();
      return R(Math.max(0, w.bottom + scrollY - (f.top + scrollY)));
    })(),
    navBottom: document.querySelector("header")?.getBoundingClientRect().bottom ? R(document.querySelector("header").getBoundingClientRect().bottom) : null,
    eyebrowTop: R(document.querySelector("[data-hero-eyebrow]").getBoundingClientRect().top),
  };
};

(async () => {
  const browser = await chromium.launch(launchOptions());
  const cases = [
    [280, 653, 32], [320, 568, 32], [375, 812, 20], [375, 812, 24], [375, 812, 32],
    [430, 932, 20], [430, 932, 32], [540, 720, 32], [767, 1024, 20], [767, 1024, 32],
    [768, 1024, 20], [768, 1024, 24], [768, 1024, 32],
    [1023, 1366, 32], [1023.5, 1200, 16], [1024, 1366, 20], [1024, 1366, 24], [1024, 1366, 32],
  ];
  for (const [w, h, root] of cases) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate((px) => {
      document.documentElement.style.fontSize = `${px}px`;
    }, root);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    const d = await page.evaluate(READ);
    const wrapped = d.masks.map((m) => (m.display === "none" ? "hidden" : m.maskH > m.h + 2 ? `wrapped(${m.maskH})` : "one"));
    console.log(`## ${w}x${h}@${root} mode=${d.mode} root=${d.root} copy=${d.copy?.left}-${d.copy?.right} (${d.copy?.width}) align=${d.copyAlign}`);
    console.log(`   h1 ${d.h1?.top}-${d.h1?.bottom} ${JSON.stringify(d.h1Inner)} masks=${d.masks.map((m, i) => `${i}:${m.w}x${m.h}/${m.maskH}:${wrapped[i]}`).join(" | ")}`);
    console.log(`   body ${d.body?.left}-${d.body?.right} fs=${d.bodyFont} max=${d.bodyMax} lines=${d.bodyLines.join(",")}`);
    console.log(`   ctas ${d.ctas.map((c) => `${c.label}:${c.width}x${c.height}@${c.top}`).join(" | ")} dir=${d.groupDir} group=${d.group?.left}-${d.group?.right}/${d.group?.height}`);
    console.log(`   track mt=${d.trackMargin} ${d.track?.top}-${d.track?.bottom} cardTop=${d.cardTop} ctaBottom=${d.ctaBottom} gap=${d.gap}`);
    console.log(`   ox=${d.overflowX} doc=${d.doc} footer=${d.footerOverlap} nav=${d.navBottom} eyebrowTop=${d.eyebrowTop}`);
    console.log(`   AX ${await page.locator("#hero-title").ariaSnapshot()}`);
    await context.close();
  }
  await browser.close();
})();
