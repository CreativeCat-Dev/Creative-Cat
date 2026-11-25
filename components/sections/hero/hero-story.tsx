"use client";

import { useEffect, useLayoutEffect } from "react";
import { getLenis } from "@/lib/lenis";
import { getScrollTrigger } from "@/lib/scroll-trigger";
import { getCorridorProgress, setCorridorProgress } from "./hero-corridor.store";
import { getHeroMode, setHeroMode, type HeroMode } from "./hero-mode";
import {
  captureReadingAnchor,
  resolveReadingAnchor,
  type ReadingAnchor,
} from "./hero-reading-anchor";
import { HERO_STORY, HERO_STORY_HEIGHT } from "./hero-story.config";

/**
 * The one hero clock, and the one effective-mode writer.
 *
 * `HERO_STORY.media` is only a candidate: width, height and reduced motion. It
 * cannot know whether the real copy fits, because enlarged text or different
 * font metrics can grow the stage past the resolved `100svh`. This controller
 * measures the required in-flow content, decides enhanced or static, publishes
 * the result to `hero-mode`, and owns every layout consequence:
 *
 * - enhanced: publish the 500svh height, create the one ScrollTrigger, reconcile
 *   the current document progress, then enable the mode.
 * - static: remove the trigger, publish static, reset progress, remove the
 *   height, refresh the document, then leave the complete static hero.
 *
 * Progress remains exclusively in `hero-corridor.store.ts`. There is no second
 * clock and no general scroll restoration. The only scroll write is a one-shot
 * semantic-anchor correction around an actual footprint change: a demotion
 * collapses the document, native clamping would otherwise move the visitor from
 * the hero into the footer, so the element they were reading is returned to its
 * previous viewport offset once. Compatible loads and same-mode resizes never
 * capture or correct.
 */

type StoryTrigger = InstanceType<ReturnType<typeof getScrollTrigger>>;

/** A captured reading anchor plus the token that owns its single correction. */
type ReadingTransition = {
  token: number;
  anchor: ReadingAnchor | null;
};

type FitDetail = {
  content: number;
  padTop: number;
  padBottom: number;
  required: number;
  available: number;
  navHeight: number;
  navGap: number;
  fits: boolean;
};

declare global {
  interface Window {
    __heroStory?: {
      get: () => number;
      enabled: () => boolean;
      mode: () => HeroMode;
      /** Scroll to a story position so the real ScrollTrigger drives progress. */
      scrollTo: (progress: number) => void;
      info: () => Record<string, number | string | boolean | null>;
      /** Hero-owned ScrollTriggers. Must be 1 in enhanced mode, 0 in static. */
      triggers: () => number;
      fit: () => (FitDetail & { mode: HeroMode; candidate: boolean }) | null;
    };
  }
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The navbar is `md:py-5` (1.25rem per side) unscrolled and `md:py-4` (1rem)
 * scrolled. A stable reference removes the live padding and adds the unscrolled
 * padding back, so the eligibility verdict cannot flip while the user scrolls
 * and the navbar finishes its 240ms transition.
 */
const NAV_UNSCROLLED_PADDING_REM = 1.25;

/** Target cat/navbar clearance for an enhanced stage. */
const MIN_NAV_GAP = 24;
/** Promotion needs a little more room than staying enhanced. */
const PROMOTE_MARGIN = 2;
/**
 * Floating-point tolerance for the keep-enhanced comparison.
 *
 * This is deliberate sub-pixel slack, not exact equality. A required height
 * within 1px of the viewport can keep enhanced mode with a stage up to ~1px
 * taller than the viewport, so the native sticky release can begin up to ~1px
 * early. Measured synthetic boundary cases add 12.5px and 13px of content and
 * produce 0.062px and 0.562px of overrun; no supported natural composition
 * approaches that. The invariant is exact at whole pixels, not mathematically
 * exact at fractional-pixel boundaries.
 */
const MEASURE_TOLERANCE = 1;

/** A preserved anchor may drift this far before one corrective scroll is made. */
const ANCHOR_TOLERANCE = 1;

/**
 * Generation guard. Every mounted controller owns one generation; a cleanup or
 * a stale async continuation can never clear a newer controller's state.
 */
let activeGeneration = 0;

export function HeroStory() {
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const generation = ++activeGeneration;
    const root = document.documentElement;
    const wrapper = document.querySelector<HTMLElement>("[data-hero-story]");
    const stage = wrapper?.querySelector<HTMLElement>("[data-hero-stage]") ?? null;
    const lane = wrapper?.querySelector<HTMLElement>("[data-hero-lane]") ?? null;
    const copy = wrapper?.querySelector<HTMLElement>("[data-hero-copy]") ?? null;
    const metaRow = wrapper?.querySelector<HTMLElement>("[data-hero-meta]") ?? null;
    const rule = wrapper?.querySelector<HTMLElement>("[data-hero-rule]") ?? null;
    const desktop = wrapper?.querySelector<HTMLElement>("[data-hero-desktop]") ?? null;
    const nav = document.querySelector<HTMLElement>("header");
    if (!wrapper || !stage || !lane || !copy || !metaRow || !rule) return;

    const ScrollTrigger = getScrollTrigger();
    const media = window.matchMedia(HERO_STORY.media);
    let trigger: StoryTrigger | null = null;
    let disposed = false;
    let lastFit: FitDetail | null = null;
    let lastRefreshKey = "";
    let raf = 0;
    let transitionSeq = 0;

    const isCurrent = () => !disposed && generation === activeGeneration;

    const rootPx = () => parseFloat(getComputedStyle(root).fontSize) || 16;

    /**
     * The stage's own `min-h-svh` resolves to the exact viewport reference the
     * layout uses. Fall back to a one-shot probe only if a browser reports the
     * computed value unreduced.
     */
    const resolvedViewportHeight = () => {
      const resolved = parseFloat(getComputedStyle(stage).minHeight);
      if (Number.isFinite(resolved) && resolved > 0) return resolved;
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none;contain:strict;";
      document.body.appendChild(probe);
      const height = probe.getBoundingClientRect().height;
      probe.remove();
      return height || window.innerHeight;
    };

    const navReferenceHeight = () => {
      if (!nav) return 0;
      const shell = nav.querySelector<HTMLElement>(".nav-shell");
      const navHeight = nav.getBoundingClientRect().height;
      if (!shell) return navHeight;
      const style = getComputedStyle(shell);
      const padding =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      if (!Number.isFinite(padding)) return navHeight;
      return navHeight - padding + 2 * NAV_UNSCROLLED_PADDING_REM * rootPx();
    };

    const measure = (): FitDetail | null => {
      // Hidden preserved pages and tab-hidden documents have no reliable
      // geometry. Keep the current mode rather than demoting on a 0x0 read.
      if (document.visibilityState === "hidden") return null;
      if (stage.getClientRects().length === 0) return null;
      const copyRect = copy.getBoundingClientRect();
      if (copyRect.width <= 0 || copyRect.height <= 0) return null;

      const style = getComputedStyle(stage);
      const padTop = parseFloat(style.paddingTop);
      const padBottom = parseFloat(style.paddingBottom);
      if (!Number.isFinite(padTop) || !Number.isFinite(padBottom)) return null;

      // Required in-flow content only: copy block, base rule and bottom
      // metadata. The rule's `hero-lg:mt-auto` is flex-distributed free space, not
      // required content, so its margins are never added. The meta row's own
      // padding is part of its border box.
      const content =
        copyRect.height +
        rule.getBoundingClientRect().height +
        metaRow.getBoundingClientRect().height;

      const available = resolvedViewportHeight();
      const navHeight = navReferenceHeight();
      const navGap = padTop - navHeight;
      const required = content + padTop + padBottom;
      const enhanced = getHeroMode() === "enhanced";

      const fits = enhanced
        ? required <= available + MEASURE_TOLERANCE && navGap >= MIN_NAV_GAP
        : required + PROMOTE_MARGIN <= available &&
          navGap >= MIN_NAV_GAP + PROMOTE_MARGIN;

      return {
        content,
        padTop,
        padBottom,
        required,
        available,
        navHeight,
        navGap,
        fits,
      };
    };

    const viewportKey = () =>
      `${window.innerWidth}x${resolvedViewportHeight()}`;

    /**
     * Capture happens before the footprint changes; finish happens after the
     * height, trigger and refresh have settled. The token makes the pair
     * one-shot even if a ResizeObserver, font callback or visibility event
     * schedules another evaluation before the frame paints.
     */
    const beginReadingTransition = (): ReadingTransition => ({
      token: ++transitionSeq,
      anchor: captureReadingAnchor(wrapper),
    });

    const finishReadingTransition = (transition: ReadingTransition | null) => {
      if (!transition || transition.token !== transitionSeq) return;
      if (!isCurrent()) return;
      // A hidden document has no reliable geometry and a preserved page must
      // not move while the visitor is elsewhere.
      if (document.visibilityState !== "visible") return;
      if (stage.getClientRects().length === 0) return;

      const anchor = resolveReadingAnchor(transition.anchor);
      if (!anchor) return;

      const rect = anchor.element.getBoundingClientRect();
      const documentTop = rect.top + window.scrollY;
      const max = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const target = Math.min(max, Math.max(0, documentTop - anchor.viewportTop));
      if (Math.abs(target - window.scrollY) <= ANCHOR_TOLERANCE) return;

      // Native scroll is already clamped to the fresh document geometry. The
      // one Lenis instance is re-synchronised afterwards rather than asked for
      // a second scroll, so a stale target or limit cannot animate away from it.
      window.scrollTo({ top: target, behavior: "instant" });
      getLenis()?.resize();
    };

    const enable = (): StoryTrigger => {
      // Height first: the trigger must measure the enhanced document.
      root.style.setProperty("--hero-story-h", HERO_STORY_HEIGHT);
      const active =
        trigger ??
        ScrollTrigger.create({
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => setCorridorProgress(self.progress),
          onRefresh: (self) => setCorridorProgress(self.progress),
        });
      trigger = active;
      ScrollTrigger.refresh();
      lastRefreshKey = viewportKey();
      return active;
    };

    const disable = () => {
      if (trigger) {
        trigger.kill();
        trigger = null;
      }
      // Consumers go static before the document collapses, so no live layer or
      // narrative is left animating a story that no longer exists.
      setHeroMode("static");
      wrapper.dataset.heroMode = "static";
      setCorridorProgress(0);
      root.style.removeProperty("--hero-story-h");
      lastRefreshKey = "";
      ScrollTrigger.refresh();
    };

    const apply = (next: HeroMode, fit: FitDetail | null) => {
      if (!isCurrent()) return;
      lastFit = fit;
      if (next === "enhanced") {
        if (getHeroMode() !== "enhanced" || !trigger) {
          // A pre-hydration 500svh already owns the document footprint, so a
          // compatible restored coordinate must not be corrected. Only an
          // expansion from static has reading context to move.
          const publishedHeight =
            root.style.getPropertyValue("--hero-story-h") !== "";
          const transition = publishedHeight
            ? null
            : beginReadingTransition();
          const activeTrigger = enable();
          finishReadingTransition(transition);
          // The correction may have moved the document; reconcile the trigger
          // and publish the actual progress before consumers mount.
          ScrollTrigger.update();
          setCorridorProgress(activeTrigger.progress);
          setHeroMode("enhanced");
          wrapper.dataset.heroMode = "enhanced";
        } else if (viewportKey() !== lastRefreshKey) {
          // The story is still valid but its scroll range moved. Refresh once,
          // then publish the actual progress rather than a remembered value.
          ScrollTrigger.refresh();
          lastRefreshKey = viewportKey();
          setCorridorProgress(trigger.progress);
        }
        wrapper.dataset.heroFit = fit ? "true" : "unknown";
        return;
      }

      // The pre-hydration head script may already have published 500svh even
      // though this controller never ran `enable()`. Static must remove any
      // published height, not only collapse an enhanced -> static transition,
      // otherwise a first-evaluation demotion leaves a dead 500svh wrapper.
      const publishedHeight = root.style.getPropertyValue("--hero-story-h");
      if (getHeroMode() !== "static" || trigger !== null || publishedHeight !== "") {
        const transition = beginReadingTransition();
        disable();
        finishReadingTransition(transition);
      }
      wrapper.dataset.heroFit = fit ? "false" : "unknown";
    };

    const evaluate = () => {
      if (!isCurrent()) return;
      if (!media.matches) {
        lastFit = null;
        apply("static", null);
        wrapper.dataset.heroFit = "candidate-off";
        return;
      }
      // Browser text-size settings move Tailwind's rem-based `lg` breakpoint,
      // so the candidate width can match while the CSS still paints the
      // tablet/phone composition. The enhanced story needs the desktop cluster
      // it was designed around; without it, static is the honest mode.
      if (!desktop || getComputedStyle(desktop).display === "none") {
        lastFit = null;
        apply("static", null);
        wrapper.dataset.heroFit = "composition-tablet";
        return;
      }
      const fit = measure();
      // A transient zero-size read (preserved page, display:none, tab hidden)
      // must not demote a healthy hero. Wait for the next visible event.
      if (!fit) return;
      apply(fit.fits ? "enhanced" : "static", fit);
    };

    const schedule = () => {
      if (!isCurrent() || raf !== 0) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        evaluate();
      });
    };

    const onCandidateChange = () => schedule();
    const onResize = () => schedule();
    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule();
    };
    const onPageShow = () => schedule();

    // First decision before paint. The head script may already have published
    // 500svh; an over-tall candidate is corrected here.
    evaluate();

    media.addEventListener("change", onCandidateChange);
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => schedule());
    observer?.observe(copy);
    observer?.observe(metaRow);

    // Fonts can change the copy's line count. Re-measure once they settle.
    document.fonts?.ready.then(() => schedule()).catch(() => {});

    let api: NonNullable<Window["__heroStory"]> | null = null;
    if (process.env.NODE_ENV !== "production") {
      api = {
        get: getCorridorProgress,
        enabled: () => getHeroMode() === "enhanced",
        mode: () => getHeroMode(),
        scrollTo: (progress) => {
          const clamped = Math.min(1, Math.max(0, progress));
          const top = trigger
            ? trigger.start + (trigger.end - trigger.start) * clamped
            : 0;
          // Move the document itself. Lenis, when present, only gets us there
          // instantly; progress still comes from the ScrollTrigger above.
          const lenis = getLenis();
          if (lenis) {
            lenis.scrollTo(top, { immediate: true, force: true });
          } else {
            window.scrollTo({ top, behavior: "instant" });
          }
        },
        info: () => ({
          progress: +getCorridorProgress().toFixed(4),
          scrollY: +window.scrollY.toFixed(1),
          start: trigger ? +trigger.start.toFixed(1) : null,
          end: trigger ? +trigger.end.toFixed(1) : null,
          travel: trigger ? +(trigger.end - trigger.start).toFixed(1) : null,
          triggerProgress: trigger ? +trigger.progress.toFixed(4) : null,
          height:
            getComputedStyle(root).getPropertyValue("--hero-story-h").trim() ||
            "default",
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          mode: getHeroMode(),
          candidate: media.matches,
          composition: desktop
            ? getComputedStyle(desktop).display !== "none"
            : false,
          required: lastFit ? +lastFit.required.toFixed(2) : null,
          navGap: lastFit ? +lastFit.navGap.toFixed(2) : null,
        }),
        triggers: () => {
          return ScrollTrigger.getAll().filter(
            (instance) => instance.trigger === wrapper
          ).length;
        },
        fit: () =>
          lastFit
            ? { ...lastFit, mode: getHeroMode(), candidate: media.matches }
            : null,
      };
      window.__heroStory = api;
    }

    return () => {
      // Local resources belong to this generation even if a newer controller
      // already owns the shared store, height and document refresh.
      disposed = true;
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
      observer?.disconnect();
      media.removeEventListener("change", onCandidateChange);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      if (trigger) {
        trigger.kill();
        trigger = null;
      }
      if (
        process.env.NODE_ENV !== "production" &&
        api &&
        window.__heroStory === api
      ) {
        delete window.__heroStory;
      }

      // A newer controller already owns the shared state; only its cleanup may
      // clear it. This guard no longer skips this generation's own disposal.
      if (generation !== activeGeneration) return;
      setHeroMode("static");
      wrapper.dataset.heroMode = "static";
      setCorridorProgress(0);
      root.style.removeProperty("--hero-story-h");
      lastFit = null;
      lastRefreshKey = "";
      wrapper.dataset.heroFit = "candidate-off";
      ScrollTrigger.refresh();
    };
  }, []);

  return null;
}
