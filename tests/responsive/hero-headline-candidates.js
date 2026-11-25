/*
 * Preserved hero QA — originally hero-06c2-candidates.js
 * Headline A/B/C line-width measurement and candidate screenshots.
 *
 * Read-only browser measurement: it never writes project files.
 * Requires a running dev/production server; see tests/README.md.
 */
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");
const fs = require("fs");
const path = require("path");
const BASE = process.env.HERO_BASE_URL || "http://localhost:3100/";
const OUT = out("hero-06c2-candidates");
fs.mkdirSync(OUT, { recursive: true });

// Simulates the intended mobile centring only; headline markup is swapped per candidate.
const CENTER_CSS = `
@media (max-width: 767px) {
  [data-hero-copy] { width: min(100%, 560px) !important; max-width: 560px !important; margin-inline: auto !important; text-align: center !important; }
  [data-hero-body] { max-width: min(40ch, 420px) !important; margin-inline: auto !important; }
  [data-hero-cta-group] { justify-content: center !important; }
  [data-hero-cta-group] > a { min-height: 44px !important; }
  [data-hero-art-track] { margin-top: max(1rem, calc(min(42vw, 220px) * 1.25 - clamp(210px, 28svh, 250px) + 1rem)) !important; }
}
`;

const HEADLINES = {
  "A3": ["Ideas into", "brands that", "move."],
  "B2": ["Ideas into brands", "that move."],
  "C2": ["Ideas into", "brands that move."],
};

(async () => {
  const browser = await chromium.launch(launchOptions());
  const widths = [[280, 653], [320, 568], [360, 800], [375, 812], [390, 844], [430, 932], [480, 800], [540, 720], [767, 1024]];
  for (const [w, h] of widths) {
    for (const theme of ["light", "dark"]) {
      if (theme === "dark" && ![[375, 812], [430, 932], [767, 1024]].some(([a, b]) => a === w && b === h)) continue;
      const context = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
      const page = await context.newPage();
      await page.goto(BASE, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);
      await page.addStyleTag({ content: CENTER_CSS });

      const metrics = await page.evaluate(() => {
        const h1 = document.querySelector("#hero-title");
        const copy = document.querySelector("[data-hero-copy]");
        const style = getComputedStyle(h1);
        const probe = document.createElement("span");
        probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:${style.fontFamily};font-size:${style.fontSize};font-weight:${style.fontWeight};letter-spacing:${style.letterSpacing};line-height:${style.lineHeight};`;
        document.body.appendChild(probe);
        const measure = (text) => {
          probe.textContent = text;
          return Math.round(probe.getBoundingClientRect().width * 100) / 100;
        };
        const res = {
          fontSize: style.fontSize,
          copyWidth: Math.round(copy.getBoundingClientRect().width * 100) / 100,
          contentWidth: document.querySelector("[data-hero-stage]").clientWidth - 48,
          A: [measure("Ideas into"), measure("brands that"), measure("move.")],
          B: [measure("Ideas into brands"), measure("that move.")],
          C: [measure("Ideas into"), measure("brands that move.")],
        };
        probe.remove();
        return res;
      });
      console.log(`${w}x${h} fs=${metrics.fontSize} copy=${metrics.copyWidth} content=${metrics.contentWidth} A=${metrics.A.join("/")} B=${metrics.B.join("/")} C=${metrics.C.join("/")} Breq=${(metrics.B[0] / metrics.contentWidth * 100).toFixed(1)}% Creq=${(metrics.C[1] / metrics.contentWidth * 100).toFixed(1)}%`);

      for (const [key, lines] of Object.entries(HEADLINES)) {
        await page.evaluate(({ lines: L }) => {
          const h1 = document.querySelector("#hero-title");
          h1.innerHTML = L.map((line, i) =>
            `<span class="block overflow-hidden pb-[0.08em]"><span data-hero-line class="block">${line}${i < L.length - 1 ? " " : ""}</span></span>`
          ).join("");
        }, { lines });
        await page.waitForTimeout(120);
        await page.screenshot({ path: path.join(OUT, `${w}x${h}-${theme}-${key}.png`) });
      }
      await context.close();
    }
  }
  console.log("done");
  await browser.close();
})();
