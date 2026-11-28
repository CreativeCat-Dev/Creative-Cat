"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { getScrollTrigger } from "@/lib/scroll-trigger";

/**
 * DEL-02 — restrained case-study entrance.
 *
 * Headings, media and the next-project block rise 28px and fade once as they
 * first enter the viewport. This reuses the existing GSAP/ScrollTrigger
 * lifecycle and the root Lenis instance; there is no pin, no extra runways and
 * no second RAF loop. Reduced motion creates no triggers, and without
 * JavaScript the server markup is already complete and untransformed.
 */
export function CaseStudyMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        getScrollTrigger();
        const targets = gsap.utils.toArray<HTMLElement>(
          "[data-case-reveal]",
          root,
        );

        targets.forEach((target) => {
          gsap.from(target, {
            y: 28,
            autoAlpha: 0,
            duration: 0.65,
            ease: "power3.out",
            scrollTrigger: {
              trigger: target,
              start: "top 92%",
              once: true,
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} data-case-motion>
      {children}
    </div>
  );
}
