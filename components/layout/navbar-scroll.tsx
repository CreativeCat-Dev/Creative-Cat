"use client";

import gsap from "gsap";
import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * DEL-00 / DEL-00.1 — global scroll chrome.
 *
 * One passive document-scroll observer drives both delivery effects:
 *
 * 1. the 2px coral navbar progress line (`scaleX`, left origin), and
 * 2. the native scrollbar thumb colour, animated through the
 *    `--cc-scrollbar-thumb` custom property.
 *
 * Lenis is the one scroll system: it scrolls the document, so the same
 * `scroll` event covers smooth wheel, native touch, scrollbar dragging, keyboard
 * paging and restored positions. `useLenis` adds Lenis' own notification when it
 * is present; both paths call the same handler and the rAF guard collapses them
 * to one measurement per frame. There is no second Lenis instance, no
 * ScrollTrigger, no continuous loop and no hero store dependency.
 *
 * Activity, not every event, owns the colour tween: the first scroll starts the
 * deeper-coral tween, a 160ms quiet period returns to the coral idle colour. The
 * rAF is only scheduled by events, never self-sustaining.
 */

const IDLE_AFTER_MS = 160;
const IDLE = "#FF1C43";
const ACTIVE = "#D91438";

export function NavbarScroll() {
  const barRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progressTo = gsap.quickTo(bar, "scaleX", {
      duration: 0.16,
      ease: "power1.out",
    });

    let frame = 0;
    let idleTimer = 0;
    let active = false;

    const progress = () => {
      const max = root.scrollHeight - window.innerHeight;
      if (max <= 0) return 0;
      return Math.min(1, Math.max(0, window.scrollY / max));
    };

    const paint = () => {
      frame = 0;
      const value = progress();
      // Reduced motion follows the scroll exactly instead of easing behind it.
      if (reduced) gsap.set(bar, { scaleX: value });
      else progressTo(value);
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };

    const snap = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      gsap.set(bar, { scaleX: progress() });
    };

    const setActive = (next: boolean) => {
      if (active === next) return;
      active = next;
      root.toggleAttribute("data-scroll-active", next);
      gsap.to(root, {
        "--cc-scrollbar-thumb": next ? ACTIVE : IDLE,
        duration: reduced ? 0 : next ? 0.18 : 0.5,
        ease: next ? "power2.out" : "power2.inOut",
        overwrite: "auto",
      });
    };

    const onScroll = () => {
      schedule();
      if (!active) setActive(true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setActive(false), IDLE_AFTER_MS);
    };

    const onPageShow = () => {
      snap();
      schedule();
    };

    snap();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pageshow", onPageShow);
    lenis?.on("scroll", onScroll);
    document.fonts?.ready.then(snap).catch(() => {});

    // Late layout (images, fonts, a new route's content) changes the maximum
    // scroll without a scroll or resize event.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", onPageShow);
      lenis?.off("scroll", onScroll);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      gsap.killTweensOf(bar);
      gsap.killTweensOf(root);
      root.removeAttribute("data-scroll-active");
      root.style.removeProperty("--cc-scrollbar-thumb");
    };
  }, [pathname, lenis]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
    >
      <span
        ref={barRef}
        data-nav-progress
        style={{ transform: "scaleX(0)" }}
        className="block h-full w-full origin-left bg-brand-coral will-change-transform"
      />
    </div>
  );
}
