"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { getScrollTrigger, scheduleRefresh } from "@/lib/scroll-trigger";

/**
 * Section padding and the ultra-wide cap live on this element because it doubles
 * as the GSAP scope root: everything the entrance animates sits inside it, so the
 * selectors below can never reach outside the footer.
 */
const layout =
  "mx-auto flex w-full max-w-[1920px] flex-col gap-12 px-6 pt-16 pb-8 md:gap-14 md:px-10 md:pt-20 lg:px-14 lg:pt-28";

/**
 * Entrance choreography for the footer, and the only client JavaScript it adds.
 *
 * Three guarantees shape the implementation:
 *
 * 1. The server HTML is fully visible and carries no hidden state, so a visitor
 *    without JavaScript sees the finished footer. The from-states are applied by
 *    GSAP after hydration, never by CSS.
 * 2. One ScrollTrigger, one timeline, no scrub, no pin, no loop. `once: true`
 *    plus an explicit `onEnter` means the entrance can fire at most once for the
 *    life of the mounted footer, so client-side navigation cannot replay it.
 * 3. Content already on screen at boot is left alone. The footer starts below the
 *    fold on every route, so this only catches restored scroll positions and
 *    short pages — the cases where applying a from-state would make visible
 *    content vanish and slide back in.
 */
export function FooterMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const q = gsap.utils.selector(root);
      const eyebrow = q("[data-footer-eyebrow]");
      const ctaLines = q("[data-footer-cta-line]");
      const disc = q("[data-footer-disc]");
      const rule = q("[data-footer-rule]");
      const groups = q("[data-footer-group]");
      const rows = q("[data-footer-row]");
      const bottom = q("[data-footer-bottom]");

      const watermark = root.querySelector<HTMLElement>("[data-footer-watermark]");
      // The resting strength is a design value owned by CSS. Reading it here
      // keeps the watermark's opacity in one place instead of duplicating 0.065
      // into the motion code, where it would silently drift.
      const watermarkOpacity = watermark
        ? Number.parseFloat(getComputedStyle(watermark).opacity) || 0.065
        : 0.065;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const alreadyOnScreen = root.getBoundingClientRect().top < window.innerHeight - 120;
        if (alreadyOnScreen) return;

        // Overlapped rather than sequential: the tail of one tween carries the
        // head of the next, which is what keeps the whole thing near 1.5s while
        // still reading top to bottom.
        const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

        tl.fromTo(eyebrow, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 }, 0)
          .fromTo(
            ctaLines,
            { yPercent: 105 },
            { yPercent: 0, duration: 0.8, stagger: 0.09 },
            0.06
          )
          .fromTo(
            disc,
            { opacity: 0, scale: 0.82, rotate: -7 },
            { opacity: 1, scale: 1, rotate: 0, duration: 0.65 },
            0.14
          )
          .fromTo(
            rule,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.7, ease: "power2.inOut", transformOrigin: "left center" },
            0.38
          )
          .fromTo(
            groups,
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.07 },
            0.46
          )
          .fromTo(
            rows,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.025 },
            0.58
          )
          .fromTo(
            watermark,
            { opacity: 0, y: 18 },
            { opacity: watermarkOpacity, y: 0, duration: 0.8 },
            0.7
          )
          .fromTo(bottom, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45 }, 1);

        const trigger = getScrollTrigger().create({
          // Fires when the footer's top edge reaches 92% of the viewport, so the
          // entrance starts just before the CTA becomes readable.
          trigger: root,
          start: "top 92%",
          once: true,
          onEnter: () => tl.play(),
        });

        return () => {
          tl.kill();
          trigger.kill();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // End states are asserted rather than inherited. If the preference flips
        // mid-entrance, matchMedia reverts the branch above — dropping every
        // inline from-state — and these values are what the footer lands on.
        gsap.set(eyebrow, { opacity: 1, y: 0 });
        gsap.set(ctaLines, { yPercent: 0 });
        gsap.set(disc, { opacity: 1, scale: 1, rotate: 0 });
        gsap.set(rule, { scaleX: 1 });
        gsap.set(groups, { opacity: 1, y: 0 });
        gsap.set(rows, { opacity: 1, y: 0 });
        gsap.set(watermark, { opacity: watermarkOpacity, y: 0 });
        gsap.set(bottom, { opacity: 1, y: 0 });
      });

      return () => mm.revert();
    },
    { scope }
  );

  // Route changes keep the same footer instance, so the trigger is never rebuilt;
  // its measured start position still has to follow the new page height.
  useEffect(() => {
    scheduleRefresh();
  }, [pathname]);

  // Late font swaps change the headline's height, and with it the footer's
  // distance from the top of the document.
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) scheduleRefresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={scope} data-footer-motion className={layout}>
      {children}
    </div>
  );
}
