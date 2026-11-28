"use client";

import gsap from "gsap";
import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type RefObject } from "react";

/**
 * DEL-00 / DEL-00.1 / DEL-01D — global scroll chrome.
 *
 * One passive document-scroll observer drives three delivery effects:
 *
 * 1. the 2px coral navbar progress line (`scaleX`, left origin),
 * 2. the native scrollbar thumb colour, animated through the
 *    `--cc-scrollbar-thumb` custom property, and
 * 3. the DEL-01D navbar direction visibility.
 *
 * Lenis is the one scroll system: it scrolls the document, so the same
 * `scroll` event covers smooth wheel, native touch, scrollbar dragging, keyboard
 * paging and restored positions. `useLenis` adds Lenis' own notification when it
 * is present; both paths call the same handler and the rAF guard collapses them
 * to one measurement per frame. There is no second Lenis instance, no
 * ScrollTrigger, no continuous loop and no hero store dependency.
 *
 * Visibility is a deliberate state machine, not a tween per event: accumulated
 * movement must cross an 8px tolerance before the direction flips, and GSAP is
 * only asked to animate when the hidden/visible state actually changes. The
 * navbar stays visible near the top, while the menu is open or retracting, while
 * focus is inside it, and through route/restoration changes.
 */

const IDLE_AFTER_MS = 160;
const IDLE = "#FF1C43";
const ACTIVE = "#D91438";

/** Keep the bar visible through the first 80px of the document. */
const HIDE_FROM_TOP = 80;
/** Accumulated movement before a direction is trusted. */
const DIRECTION_TOLERANCE = 8;
const HIDE_DURATION = 0.32;
const REVEAL_DURATION = 0.4;
/** The menu overlay takes ~720ms to retract; keep the bar alive through it. */
const MENU_CLOSE_GRACE_MS = 820;

type NavbarScrollProps = {
  headerRef: RefObject<HTMLElement | null>;
  menuOpen: boolean;
};

export function NavbarScroll({ headerRef, menuOpen }: NavbarScrollProps) {
  const barRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const lenis = useLenis();

  /** Visibility controls owned by the running effect, used by menu changes. */
  const menuOpenRef = useRef(menuOpen);
  const revealRef = useRef<(() => void) | null>(null);
  const menuCloseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
    if (menuOpen) revealRef.current?.();
    else menuCloseRef.current?.();
  }, [menuOpen]);

  useEffect(() => {
    const bar = barRef.current;
    const header = headerRef.current;
    if (!bar) return;

    const root = document.documentElement;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const progressTo = gsap.quickTo(bar, "scaleX", {
      duration: 0.16,
      ease: "power1.out",
    });

    let frame = 0;
    let idleTimer = 0;
    let active = false;
    /** Only a real scroll event may change direction visibility. */
    let pendingDirection = false;

    // Visibility state. `lastY` and `accum` are reset on restoration/resize so
    // layout-induced scroll adjustments never read as user direction.
    let hidden = false;
    let lastY = 0;
    let accum = 0;
    let revealUntil = 0;

    const readScrollY = () => {
      const max = Math.max(0, root.scrollHeight - window.innerHeight);
      return Math.min(max, Math.max(0, window.scrollY));
    };

    const resetTracking = () => {
      lastY = readScrollY();
      accum = 0;
    };

    const setHidden = (next: boolean) => {
      if (!header) return;

      // Reduced motion keeps the bar visible; no transform is ever written.
      if (motionQuery.matches) {
        if (hidden) {
          hidden = false;
          gsap.set(header, { yPercent: 0 });
        }
        return;
      }

      if (hidden === next) return;
      hidden = next;

      gsap.to(header, {
        yPercent: next ? -100 : 0,
        duration: next ? HIDE_DURATION : REVEAL_DURATION,
        ease: "power3.out",
        overwrite: true,
      });
    };

    const reveal = () => {
      accum = 0;
      lastY = readScrollY();
      setHidden(false);
    };

    const decideVisibility = () => {
      if (!header) return;

      const y = readScrollY();
      const delta = y - lastY;
      lastY = y;

      if (y <= HIDE_FROM_TOP) {
        accum = 0;
        setHidden(false);
        return;
      }

      if (
        menuOpenRef.current ||
        performance.now() < revealUntil ||
        motionQuery.matches
      ) {
        accum = 0;
        setHidden(false);
        return;
      }

      accum += delta;
      if (accum > DIRECTION_TOLERANCE) {
        accum = 0;
        setHidden(true);
      } else if (accum < -DIRECTION_TOLERANCE) {
        accum = 0;
        setHidden(false);
      }
    };

    const progress = () => {
      const max = root.scrollHeight - window.innerHeight;
      if (max <= 0) return 0;
      return Math.min(1, Math.max(0, window.scrollY / max));
    };

    const paint = () => {
      frame = 0;
      const value = progress();
      // Reduced motion follows the scroll exactly instead of easing behind it.
      if (motionQuery.matches) gsap.set(bar, { scaleX: value });
      else progressTo(value);
      // A resize/observer pass may refresh progress without pretending the
      // resulting position adjustment was a user direction change.
      if (pendingDirection) {
        pendingDirection = false;
        decideVisibility();
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };

    const onResize = () => {
      pendingDirection = false;
      resetTracking();
      schedule();
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
        duration: motionQuery.matches ? 0 : next ? 0.18 : 0.5,
        ease: next ? "power2.out" : "power2.inOut",
        overwrite: "auto",
      });
    };

    const onScroll = () => {
      pendingDirection = true;
      schedule();
      if (!active) setActive(true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setActive(false), IDLE_AFTER_MS);
    };

    const onPageShow = () => {
      pendingDirection = false;
      reveal();
      snap();
      schedule();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!header) return;
      const target = event.target as Node | null;
      if (target && header.contains(target)) reveal();
    };

    const onMotionChange = () => {
      if (motionQuery.matches) reveal();
    };

    const onMenuClose = () => {
      resetTracking();
      revealUntil = performance.now() + MENU_CLOSE_GRACE_MS;
      reveal();
    };

    revealRef.current = reveal;
    menuCloseRef.current = onMenuClose;

    // A fresh mount or a new route starts visible, then follows the visitor.
    resetTracking();
    reveal();
    snap();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPageShow);
    document.addEventListener("focusin", onFocusIn);
    motionQuery.addEventListener("change", onMotionChange);
    lenis?.on("scroll", onScroll);
    document.fonts?.ready.then(snap).catch(() => {});

    // Late layout (images, fonts) changes the maximum scroll without a scroll or
    // resize event. Refresh the progress bar, but keep direction tracking: a
    // body-size change must not swallow the delta of the scroll that is already
    // in flight. Aspect ratios are fixed in markup, so covers settle without
    // moving the document.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPageShow);
      document.removeEventListener("focusin", onFocusIn);
      motionQuery.removeEventListener("change", onMotionChange);
      lenis?.off("scroll", onScroll);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      gsap.killTweensOf(bar);
      gsap.killTweensOf(root);
      if (header) {
        gsap.killTweensOf(header);
        gsap.set(header, { clearProps: "transform" });
      }
      if (revealRef.current === reveal) revealRef.current = null;
      if (menuCloseRef.current === onMenuClose) menuCloseRef.current = null;
      root.removeAttribute("data-scroll-active");
      root.style.removeProperty("--cc-scrollbar-thumb");
    };
  }, [pathname, lenis, headerRef]);

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
