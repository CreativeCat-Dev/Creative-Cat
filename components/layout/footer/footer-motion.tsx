"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { getScrollTrigger, scheduleRefresh } from "@/lib/scroll-trigger";

const layout =
  "mx-auto flex w-full max-w-[1920px] flex-col gap-12 px-6 pt-16 pb-8 md:gap-14 md:px-10 md:pt-20 lg:px-14 lg:pt-28";

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
      const rule = q("[data-footer-rule]");
      const groups = q("[data-footer-group]");
      const rows = q("[data-footer-row]");
      const bottom = q("[data-footer-bottom]");
      const stage = q("[data-footer-stage]");

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const alreadyOnScreen = root.getBoundingClientRect().top < window.innerHeight - 120;
        if (alreadyOnScreen) return;

        const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

        tl.fromTo(eyebrow, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 }, 0)
          .fromTo(
            ctaLines,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.09 },
            0.06
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
          .fromTo(stage, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, 0.7)
          .fromTo(bottom, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45 }, 1);

        const trigger = getScrollTrigger().create({
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
        gsap.set(eyebrow, { opacity: 1, y: 0 });
        gsap.set(ctaLines, { opacity: 1, y: 0 });
        gsap.set(rule, { scaleX: 1 });
        gsap.set(groups, { opacity: 1, y: 0 });
        gsap.set(rows, { opacity: 1, y: 0 });
        gsap.set(stage, { opacity: 1, y: 0 });
        gsap.set(bottom, { opacity: 1, y: 0 });
      });

      return () => mm.revert();
    },
    { scope }
  );

  useEffect(() => {
    scheduleRefresh();
  }, [pathname]);

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
