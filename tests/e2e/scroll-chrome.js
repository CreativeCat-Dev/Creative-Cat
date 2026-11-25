/*
 * DEL-00 — navbar scroll progress and branded native scrollbar.
 *
 * Read-only measurement. Checks:
 * - progress scaleX at top / middle / bottom against document scroll,
 * - scrollbar custom property at idle and while scrolling,
 * - both themes, reduced motion, no-JS fallback,
 * - menu lock and route-return restoration,
 * - one Lenis instance, no extra hero trigger.
 *
 * Usage: HERO_BASE_URL=http://localhost:3000/ node tests/e2e/scroll-chrome.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const OUT = out("scroll-chrome");

const READ = () => {
  const R = (n) => Math.round(n * 1000) / 1000;
  const bar = document.querySelector("[data-nav-progress]");
  const html = document.documentElement;
  const matrix = bar ? new DOMMatrixReadOnly(getComputedStyle(bar).transform) : null;
  const max = html.scrollHeight - innerHeight;
  return {
    scrollY: R(scrollY),
    max: R(max),
    expected: R(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0),
    scaleX: matrix ? R(matrix.a) : null,
    active: html.hasAttribute("data-scroll-active"),
    thumb: getComputedStyle(html).getPropertyValue("--cc-scrollbar-thumb").trim(),
    inline: html.style.getPropertyValue("--cc-scrollbar-thumb").trim(),
    barColor: bar ? getComputedStyle(bar).backgroundColor : null,
    barHeight: bar ? R(bar.getBoundingClientRect().height) : null,
    barBottom: bar ? R(bar.getBoundingClientRect().bottom) : null,
    navBottom: document.querySelector("header")?.getBoundingClientRect().bottom ?? null,
    overflow: getComputedStyle(html).overflow,
    overflowX: html.scrollWidth > innerWidth + 1,
    lenis: window.__heroLenis?.instances ?? null,
    triggers: window.__heroStory?.triggers?.() ?? null,
  };
};

async function open(browser, width, height, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: options.theme || "light",
    reducedMotion: options.reduced ? "reduce" : "no-preference",
    javaScriptEnabled: options.js !== false,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  if (options.js !== false) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
  }
  return { context, page };
}

(async () => {
  const browser = await chromium.launch(launchOptions());
  const report = {};

  for (const theme of ["light", "dark"]) {
    const { context, page } = await open(browser, 1440, 900, { theme });
    const top = await page.evaluate(READ);

    await page.evaluate(() =>
      window.scrollTo({
        top: (document.documentElement.scrollHeight - innerHeight) / 2,
        behavior: "instant",
      }),
    );
    await page.waitForTimeout(120);
    const active = await page.evaluate(READ);
    await page.waitForTimeout(700);
    const mid = await page.evaluate(READ);

    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
    );
    await page.waitForTimeout(1200);
    const bottom = await page.evaluate(READ);

    report[theme] = { top, active, mid, bottom };
    await context.close();
  }

  {
    const { context, page } = await open(browser, 390, 844);
    await page.evaluate(() =>
      window.scrollTo({
        top: (document.documentElement.scrollHeight - innerHeight) / 2,
        behavior: "instant",
      }),
    );
    await page.waitForTimeout(700);
    report.mobile = await page.evaluate(READ);
    await context.close();
  }

  {
    const { context, page } = await open(browser, 1440, 900, { reduced: true });
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
    await page.waitForTimeout(150);
    report.reduced = await page.evaluate(READ);
    await context.close();
  }

  {
    const { context, page } = await open(browser, 1440, 900, { js: false });
    report.nojs = await page.evaluate(READ);
    report.nojsCss = await page.evaluate(() => {
      const rules = [];
      const walk = (list) => {
        for (const rule of list) {
          if (rule.cssRules) walk(rule.cssRules);
          else if (rule.cssText) rules.push(rule.cssText);
        }
      };
      for (const sheet of document.styleSheets) {
        try {
          walk(sheet.cssRules);
        } catch {}
      }
      const text = rules.join("\n");
      return {
        hasThumb: text.includes("scrollbar-thumb"),
        hasHover: text.includes("scrollbar-thumb:hover"),
        hasActive: text.includes("scrollbar-thumb:active"),
        supports: CSS.supports("selector(::-webkit-scrollbar)"),
      };
    });
    await context.close();
  }

  {
    const { context, page } = await open(browser, 1440, 900);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await page.waitForTimeout(700);
    const before = await page.evaluate(READ);
    await page.locator("[data-menu-trigger]").click();
    await page.waitForTimeout(700);
    const openState = await page.evaluate(READ);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(900);
    report.menu = { before, open: openState, closed: await page.evaluate(READ) };
    await context.close();
  }

  {
    const { context, page } = await open(browser, 1440, 900);
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: "instant" }));
    await page.waitForTimeout(700);
    const before = await page.evaluate(READ);
    await page.locator('header a[href="/contact"]').click();
    await page.waitForURL("**/contact");
    await page.waitForTimeout(700);
    const contact = await page.evaluate(READ);
    await page.goBack();
    await page.waitForURL(BASE);
    await page.waitForTimeout(1000);
    report.navigation = { before, contact, restored: await page.evaluate(READ) };
    await context.close();
  }

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})();
