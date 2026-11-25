"use client";

import gsap from "gsap";
import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";
import { getLenisInstanceCount, clearLenis, setLenis } from "@/lib/lenis";
import { isScrollLocked } from "@/lib/scroll-lock";
import { getScrollTrigger } from "@/lib/scroll-trigger";

const LENIS_OPTIONS = {
  lerp: 0.09,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  syncTouch: false,
  anchors: true,
  respectReducedMotion: true,
  stopInertiaOnNavigate: true,
  autoRaf: false,
} as const;

declare global {
  interface Window {
    __heroLenis?: {
      velocity: number;
      animatedScroll: number;
      targetScroll: number;
      progress: number;
      isScrolling: boolean | "native" | "smooth";
      isStopped: boolean;
      prefersReducedMotion: boolean;
      instances: number;
      instance: () => unknown;
    };
  }
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={LENIS_OPTIONS} autoRaf={false}>
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  );
}

function LenisGsapBridge() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const ScrollTrigger = getScrollTrigger();
    const tick = (time: number) => lenis.raf(time * 1000);
    const update = () => ScrollTrigger.update();

    lenis.on("scroll", update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenis);

    if (isScrollLocked()) lenis.stop();

    ScrollTrigger.update();

    if (process.env.NODE_ENV !== "production") {
      window.__heroLenis = {
        get velocity() {
          return +lenis.velocity.toFixed(1);
        },
        get animatedScroll() {
          return +lenis.animatedScroll.toFixed(1);
        },
        get targetScroll() {
          return +lenis.targetScroll.toFixed(1);
        },
        get progress() {
          return +lenis.progress.toFixed(4);
        },
        get isScrolling() {
          return lenis.isScrolling;
        },
        get isStopped() {
          return lenis.isStopped;
        },
        get prefersReducedMotion() {
          return lenis.prefersReducedMotion;
        },
        get instances() {
          return getLenisInstanceCount();
        },
        instance: () => lenis,
      };
    }

    return () => {
      gsap.ticker.remove(tick);
      lenis.off("scroll", update);
      gsap.ticker.lagSmoothing(500, 33);
      clearLenis(lenis);
      if (process.env.NODE_ENV !== "production") delete window.__heroLenis;
    };
  }, [lenis]);

  return null;
}
