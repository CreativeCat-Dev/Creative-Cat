/*
 * DEL-01D â€” intelligent navbar visibility.
 *
 * Read-only verification against the running site. Checks:
 * - visible at the top and through the 80px threshold,
 * - hides on sustained downward scroll and reveals on upward scroll,
 * - preserves state when scrolling stops,
 * - ignores direction jitter below the 8px tolerance,
 * - reveals for the menu, menu closing, keyboard focus and route changes,
 * - keeps the progress line moving with the bar while hidden,
 * - keeps the section surface correct on /work in both themes,
 * - reduced motion and no-JS keep the bar visible,
 * - mobile touch scrolling drives the same behaviour.
 *
 * Usage: HERO_BASE_URL=http://localhost:3000/ node tests/e2e/navbar-visibility.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { chromium, launchOptions } = require("../lib/playwright");
const { out } = require("../lib/paths");

const BASE = process.env.HERO_BASE_URL || "http://localhost:3000/";
const OUT = out("navbar-visibility");

const failures = [];
const report = {};

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const READ = () => {
  const header = document.querySelector("header[data-surface]");
  const bar = document.querySelector("[data-nav-progress]");
  const html = document.documentElement;
  const headerRect = header?.getBoundingClientRect();
  const barRect = bar?.getBoundingClientRect();
  const matrix = header
    ? new DOMMatrixReadOnly(getComputedStyle(header).transform)
    : null;
  const barMatrix = bar
    ? new DOMMatrixReadOnly(getComputedStyle(bar).transform)
    : null;
  const max = html.scrollHeight - innerHeight;
  return {
    scrollY: Math.round(scrollY),
    headerTop: headerRect ? +headerRect.top.toFixed(2) : null,
    headerBottom: headerRect ? +headerRect.bottom.toFixed(2) : null,
    headerHeight: headerRect ? +headerRect.height.toFixed(2) : null,
    headerY: matrix ? +matrix.m42.toFixed(2) : null,
    surface: header?.getAttribute("data-surface") ?? null,
    color: header ? getComputedStyle(header).color : null,
    barScaleX: barMatrix ? +barMatrix.a.toFixed(4) : null,
    barBottom: barRect ? +barRect.bottom.toFixed(2) : null,
    expectedScale: max > 0 ? +(Math.min(1, Math.max(0, scrollY / max))).toFixed(4) : 0,
    menuOpen: document.querySelector("[data-menu-panel]")?.getAttribute("aria-hidden") === "false",
    overflowX: html.scrollWidth > innerWidth + 1,
  };
};

async function open(browser, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1440, height: 900 },
    colorScheme: options.theme || "light",
    reducedMotion: options.reduced ? "reduce" : "no-preference",
    javaScriptEnabled: options.js !== false,
    hasTouch: options.touch || false,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(options.url || BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  return { context, page, errors };
}

const scrollTo = async (page, top, wait = 700) => {
  await page.evaluate((value) => {
    const lenis = window.__heroLenis?.instance?.();
    if (lenis) lenis.scrollTo(value, { immediate: true, force: true });
    else window.scrollTo({ top: value, behavior: "instant" });
  }, top);
  await page.waitForTimeout(wait);
};

const isVisible = (state) =>
  state.headerTop !== null && Math.abs(state.headerTop) < 2;
const isHidden = (state) =>
  state.headerTop !== null &&
  state.headerHeight !== null &&
  Math.abs(state.headerTop + state.headerHeight) < 3;

(async () => {
  const browser = await chromium.launch(launchOptions());

  // Desktop home: top, threshold, hide, stop, reveal, jitter.
  {
    const { context, page, errors } = await open(browser);
    const top = await page.evaluate(READ);
    check(isVisible(top) && top.headerY === 0, "home: not visible at top");

    await scrollTo(page, 60, 500);
    const threshold = await page.evaluate(READ);
    check(isVisible(threshold), "home: hid inside the 80px top zone");

    await scrollTo(page, 900, 500);
    const hidden = await page.evaluate(READ);
    check(isHidden(hidden), `home: did not hide (${hidden.headerTop})`);

    await page.waitForTimeout(500);
    const stopped = await page.evaluate(READ);
    check(isHidden(stopped), "home: stopping scroll changed visibility");

    await scrollTo(page, 760, 500);
    const revealed = await page.evaluate(READ);
    check(isVisible(revealed), "home: did not reveal on upward scroll");

    // Small jitter below the 8px tolerance must not move the bar.
    const jitter = [];
    for (const top of [762, 760, 765, 761]) {
      await page.evaluate((value) => window.scrollTo(0, value), top);
      await page.waitForTimeout(80);
      jitter.push(await page.evaluate(READ));
    }
    check(
      jitter.every((state) => Math.abs(state.headerY) < 0.5),
      `home: jitter flickered (${jitter.map((state) => state.headerY)})`,
    );

    await scrollTo(page, 1300, 500);
    check(isHidden(await page.evaluate(READ)), "home: large downward scroll did not hide");
    await scrollTo(page, 1294, 500);
    check(
      isHidden(await page.evaluate(READ)),
      "home: sub-tolerance upward jitter revealed the bar",
    );

    // The progress line travels with the bar and still tracks the document.
    await scrollTo(page, 1800, 700);
    const hiddenProgress = await page.evaluate(READ);
    check(isHidden(hiddenProgress), "home: bar visible during progress check");
    check(
      Math.abs(hiddenProgress.barScaleX - hiddenProgress.expectedScale) < 0.03,
      `home: progress ${hiddenProgress.barScaleX} vs ${hiddenProgress.expectedScale}`,
    );
    check(
      Math.abs(hiddenProgress.barBottom - hiddenProgress.headerBottom) < 1.5,
      `home: progress line did not travel with the bar (${hiddenProgress.barBottom}/${hiddenProgress.headerBottom})`,
    );

    // Rapid large reversals must settle in a whole state, never a partial
    // transform or two competing tweens.
    for (let index = 0; index < 6; index += 1) {
      await page.evaluate(
        (value) => window.scrollTo(0, value),
        index % 2 === 0 ? 2100 : 1600,
      );
      await page.waitForTimeout(110);
    }
    await scrollTo(page, 1850, 700);
    const rapidSettled = await page.evaluate(READ);
    check(
      isVisible(rapidSettled) || isHidden(rapidSettled),
      `home: rapid reversal left a partial bar (${rapidSettled.headerTop}/${rapidSettled.headerHeight})`,
    );
    await scrollTo(page, 1500, 600);
    check(isVisible(await page.evaluate(READ)), "home: rapid reversal did not recover upward");

    report.home = { top, threshold, hidden, stopped, revealed, jitter, hiddenProgress, rapidSettled };
    check(errors.length === 0, `home: console/page errors: ${errors.join(" | ")}`);
    await page.screenshot({ path: path.join(OUT, "home-hidden.png") });
    await context.close();
  }

  // Menu open/close, focus reveal and route lifecycle.
  {
    const { context, page, errors } = await open(browser);
    await scrollTo(page, 1400, 700);
    check(isHidden(await page.evaluate(READ)), "exceptions: setup did not hide");

    // The trigger is offscreen while hidden, so a real user reaches it by
    // keyboard focus (which must reveal) or by scrolling up. Exercise both.
    await page.evaluate(() => document.querySelector("[data-menu-trigger]")?.focus());
    await page.waitForTimeout(500);
    check(isVisible(await page.evaluate(READ)), "exceptions: focus did not reveal the bar");
    await page.locator("[data-menu-trigger]").click();
    await page.waitForTimeout(500);
    const menuOpen = await page.evaluate(READ);
    check(isVisible(menuOpen) && menuOpen.menuOpen, "exceptions: menu did not reveal the bar");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const menuClosing = await page.evaluate(READ);
    check(isVisible(menuClosing), "exceptions: bar hid while the menu was closing");

    await page.waitForTimeout(1000);
    const menuClosed = await page.evaluate(READ);
    check(isVisible(menuClosed), "exceptions: bar did not stay visible after menu close");

    await scrollTo(page, 2200, 700);
    check(isHidden(await page.evaluate(READ)), "exceptions: did not hide before focus");
    await page.evaluate(() => document.querySelector("header a")?.focus());
    await page.waitForTimeout(500);
    const focusReveal = await page.evaluate(READ);
    check(isVisible(focusReveal), "exceptions: keyboard focus did not reveal the bar");

    await scrollTo(page, 2600, 700);
    check(isHidden(await page.evaluate(READ)), "exceptions: did not hide before route change");
    // The offscreen link is not pointer-reachable while hidden; invoke the
    // same client navigation the link performs to test the route lifecycle.
    await page.evaluate(() => {
      document.querySelector('header a[href="/contact"]')?.click();
    });
    await page.waitForURL("**/contact");
    await page.waitForTimeout(800);
    const routeChange = await page.evaluate(READ);
    check(isVisible(routeChange), "exceptions: route change left the bar hidden");

    report.exceptions = { menuOpen, menuClosing, menuClosed, focusReveal, routeChange };
    check(errors.length === 0, `exceptions: console/page errors: ${errors.join(" | ")}`);
    await context.close();
  }

  // Work page: the same behaviour on the theme-following surface (DEL-01D.1).
  {
    const { context, page, errors } = await open(browser, {
      url: new URL("/work", BASE).href,
    });
    const top = await page.evaluate(READ);
    check(top.surface === "inherit", `work: surface ${top.surface}`);
    check(top.color === "rgb(21, 14, 52)", `work: light ink ${top.color}`);
    check(isVisible(top), "work: not visible at top");

    await scrollTo(page, 1300, 600);
    const hidden = await page.evaluate(READ);
    check(isHidden(hidden), "work: did not hide");
    check(
      hidden.surface === "inherit" && hidden.color === "rgb(21, 14, 52)",
      "work: hidden surface changed",
    );

    await scrollTo(page, 1100, 600);
    const revealed = await page.evaluate(READ);
    check(isVisible(revealed), "work: did not reveal");
    check(
      revealed.surface === "inherit" && revealed.color === "rgb(21, 14, 52)",
      `work: revealed surface ${revealed.surface}/${revealed.color}`,
    );
    check(revealed.overflowX === false, "work: horizontal overflow");

    report.work = { top, hidden, revealed };
    check(errors.length === 0, `work: console/page errors: ${errors.join(" | ")}`);
    await page.screenshot({ path: path.join(OUT, "work-revealed.png") });
    await context.close();
  }

  // Work page in dark theme: the navbar is dark and readable, and the same
  // hide/reveal behaviour is unchanged.
  {
    const { context, page, errors } = await open(browser, {
      url: new URL("/work", BASE).href,
      theme: "dark",
    });
    const top = await page.evaluate(READ);
    check(top.surface === "inherit" && top.color === "rgb(255, 255, 255)", `work-dark: surface ${top.surface}/${top.color}`);

    await scrollTo(page, 1300, 600);
    const hidden = await page.evaluate(READ);
    check(isHidden(hidden), "work-dark: did not hide");
    check(hidden.surface === "inherit" && hidden.color === "rgb(255, 255, 255)", "work-dark: hidden surface changed");

    await scrollTo(page, 1100, 600);
    const revealed = await page.evaluate(READ);
    check(isVisible(revealed), "work-dark: did not reveal");
    check(
      revealed.surface === "inherit" && revealed.color === "rgb(255, 255, 255)",
      `work-dark: revealed surface ${revealed.surface}/${revealed.color}`,
    );

    report.workDark = { top, hidden, revealed };
    check(errors.length === 0, `work-dark: console/page errors: ${errors.join(" | ")}`);
    await page.screenshot({ path: path.join(OUT, "work-dark-revealed.png") });
    await context.close();
  }

  // Reduced motion: the bar never hides.
  {
    const { context, page } = await open(browser, { reduced: true });
    await scrollTo(page, 1600, 700);
    const reduced = await page.evaluate(READ);
    check(isVisible(reduced), "reduced: navbar hidden");
    report.reduced = reduced;
    await context.close();
  }

  // No JavaScript: native scroll, server-rendered bar stays visible.
  {
    const { context, page } = await open(browser, { js: false });
    await page.mouse.wheel(0, 1600);
    await page.waitForTimeout(700);
    const nojs = await page.evaluate(READ);
    check(isVisible(nojs), "no-js: navbar not visible after native scroll");
    report.nojs = nojs;
    await context.close();
  }

  // Mobile touch: a real swipe must drive the same hide/reveal.
  {
    const { context, page, errors } = await open(browser, {
      viewport: { width: 390, height: 844 },
      touch: true,
    });
    const client = await context.newCDPSession(page);
    const swipe = async (fromY, toY, steps = 8) => {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 195, y: fromY }],
      });
      for (let index = 1; index <= steps; index += 1) {
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            { x: 195, y: Math.round(fromY + ((toY - fromY) * index) / steps) },
          ],
        });
        await page.waitForTimeout(28);
      }
      await client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await page.waitForTimeout(700);
    };

    await swipe(720, 180);
    const touchHidden = await page.evaluate(READ);
    check(touchHidden.scrollY > 300, `mobile: swipe did not scroll (${touchHidden.scrollY})`);
    check(isHidden(touchHidden), `mobile: swipe down did not hide (${touchHidden.headerTop})`);

    await swipe(180, 720);
    const touchRevealed = await page.evaluate(READ);
    check(isVisible(touchRevealed), "mobile: swipe up did not reveal");

    report.mobile = { touchHidden, touchRevealed };
    check(errors.length === 0, `mobile: console/page errors: ${errors.join(" | ")}`);
    await context.close();
  }

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ failures, report }, null, 1));
  console.log(JSON.stringify({ failures, report }, null, 1));
  await browser.close();
  if (failures.length > 0) process.exitCode = 1;
})();

