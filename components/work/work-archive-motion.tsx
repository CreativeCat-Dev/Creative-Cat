"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import { getScrollTrigger } from "@/lib/scroll-trigger";

/**
 * DEL-01D — restrained Work archive entrance.
 *
 * Each card fades and rises 40px once as it first enters the viewport. This is
 * deliberately not the homepage's scrubbed whole-card choreography: no pin, no
 * second Lenis, no circular clip and no continuous loop. The artwork stays the
 * subject and the page remains easy to browse.
 *
 * Reduced motion creates no triggers at all, so the cards are complete and
 * untransformed immediately. Without JavaScript the server markup is already
 * complete for the same reason.
 */
export function WorkArchiveMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        getScrollTrigger();
        const cards = gsap.utils.toArray<HTMLElement>("[data-work-card]", root);

        cards.forEach((card) => {
          gsap.from(card, {
            y: 40,
            autoAlpha: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
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
    <div ref={scope} data-work-motion>
      {children}
    </div>
  );
}
