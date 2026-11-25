"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/**
 * Inner composition width and the ultra-wide cap live on this element because it
 * doubles as the GSAP scope root: every entrance target sits inside it, so the
 * selectors below can never reach the navbar, the footer or the menu overlay.
 */
const layout = "relative mx-auto flex w-full max-w-[1920px] flex-1 flex-col";

/**
 * Module scope, evaluated once per document, after the browser has parsed the
 * server HTML: true only when this bundle booted against the server-rendered
 * hero. That is exactly the case the late-hydration gate cares about — the
 * visitor may have read the finished hero before hydration. Landing on another
 * route first and clicking through to `/` gives `false`, so the entrance plays
 * normally there instead of being judged against a much older paint.
 */
const bootedWithServerHero =
  typeof document !== "undefined" && Boolean(document.querySelector("[data-hero-eyebrow]"));

/** The gate is a property of the document's first load, so it runs at most once. */
let entranceDecided = false;

/**
 * If hydration happens this long after first contentful paint, the visitor has
 * already had time to start reading. Rewinding the headline then reads as a
 * glitch, so the finished server state is left alone instead.
 */
const LATE_HYDRATION_BUDGET_MS = 200;

/**
 * Page-entry choreography for the hero, and the only client JavaScript it adds.
 *
 * Three properties are deliberate:
 *
 * 1. Nothing is hidden before hydration. The server HTML paints the finished
 *    hero, and GSAP applies the from-states afterwards. That is the opposite of
 *    the usual "hide in CSS, reveal with JS" pattern, chosen so the hero stays
 *    fully readable without JavaScript and keeps painting as the LCP candidate
 *    at first byte instead of at the end of a reveal.
 * 2. There is no ScrollTrigger here. The hero is above the fold on every
 *    viewport, so this is a load choreography, not a scroll effect; the section
 *    never measures the document.
 * 3. The entrance covers type and rule only. The cat and the project cards are
 *    static at this checkpoint; the scroll story will own them, so nothing here
 *    needs to change when it arrives.
 * 4. The entrance is conditional on hydration speed. If the document hydrated
 *    more than 200ms after first paint, the visitor has already been reading
 *    the finished hero, so nothing is animated on that mount and the server
 *    state is left exactly as it was.
 */
export function HeroMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  /**
   * Per mount, so a preference flip cannot resurrect an entrance that was
   * deliberately suppressed on this mount. A later mount — client navigation
   * back to `/` — starts clean and animates normally.
   */
  const suppressEntrance = useRef(false);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const q = gsap.utils.selector(root);
      const eyebrow = q("[data-hero-eyebrow]");
      const lines = q("[data-hero-line]");
      const body = q("[data-hero-body]");
      const ctas = q("[data-hero-cta]");
      const rule = q("[data-hero-rule]");
      const meta = q("[data-hero-meta]");

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (bootedWithServerHero && !entranceDecided) {
          entranceDecided = true;
          const fcp = performance.getEntriesByName("first-contentful-paint").at(0);
          if (fcp && performance.now() - fcp.startTime > LATE_HYDRATION_BUDGET_MS) {
            suppressEntrance.current = true;
          }
        }

        // Late hydration: leave the server-rendered state untouched. No
        // gsap.set() here — nothing was hidden, so there is nothing to assert.
        if (suppressEntrance.current) return;

        // Overlapped rather than sequential: each tail carries the next head,
        // which keeps the whole entrance at 1.4s while still reading top to
        // bottom. The hero is the quietest of the three signature moments.
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(eyebrow, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5 }, 0)
          .fromTo(lines, { yPercent: 105 }, { yPercent: 0, duration: 0.9, stagger: 0.085 }, 0.05)
          .fromTo(body, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, 0.55)
          .fromTo(
            ctas,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 },
            0.62
          )
          .fromTo(
            rule,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.6, ease: "power2.inOut", transformOrigin: "left center" },
            0.8
          )
          .fromTo(meta, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.45 }, 0.9);

        return () => {
          tl.kill();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // End states are asserted rather than inherited, so flipping the
        // preference mid-session drops the branch above and lands here instead
        // of leaving anything at a from-state.
        gsap.set(eyebrow, { opacity: 1, y: 0 });
        gsap.set(lines, { yPercent: 0 });
        gsap.set(body, { opacity: 1, y: 0 });
        gsap.set(ctas, { opacity: 1, y: 0 });
        gsap.set(rule, { scaleX: 1 });
        gsap.set(meta, { opacity: 1, y: 0 });
      });

      return () => mm.revert();
    },
    { scope }
  );

  return (
    <div ref={scope} data-hero-motion className={layout}>
      {children}
    </div>
  );
}
