"use client";

import { useLayoutEffect, useSyncExternalStore, type RefObject } from "react";
import { usePathname } from "next/navigation";

/**
 * Declarative surface contract for the fixed header.
 *
 * Sections declare `data-header-surface="light" | "dark" | "coral" | "inherit"`;
 * the header samples whichever of them covers its vertical centre and takes
 * that foreground. This replaces the previous "does the header overlap the
 * footer" test, which could not describe any section other than the footer.
 *
 * NF-2 replaced the temporary fallback that treated `[data-footer]` as an
 * implicit dark surface. The footer now declares its surface like every other
 * section, so this hook has exactly one rule and no special cases. `inherit` is
 * the theme-following declaration used by the footer, which is light in the
 * light theme and midnight in the dark one.
 *
 * With no declaration anywhere, the header **inherits the theme foreground**
 * rather than assuming a light page: the homepage canvas is `bg-background`,
 * which is midnight in dark theme, so forcing midnight text there would render
 * an invisible header. Declared surfaces still win over the theme.
 *
 * Both snapshots are primitives returned from module-level functions, so
 * `useSyncExternalStore` never sees a changed value unless the state moved.
 */

export type HeaderSurface = "light" | "dark" | "coral" | "inherit";

const SCROLL_THRESHOLD = 24;

let headerEl: HTMLElement | null = null;
let surface: HeaderSurface = "inherit";
let scrolled = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function setSurface(next: HeaderSurface): void {
  if (surface === next) return;
  surface = next;
  notify();
}

function setScrolled(next: boolean): void {
  if (scrolled === next) return;
  scrolled = next;
  notify();
}

function isSurface(value: string | null): value is HeaderSurface {
  return value === "light" || value === "dark" || value === "coral" || value === "inherit";
}

function measure(): void {
  setScrolled(window.scrollY > SCROLL_THRESHOLD);

  const header = headerEl?.getBoundingClientRect();
  if (!header) {
    setSurface("inherit");
    return;
  }

  /*
   * DEL-01D: the navbar can translate above the viewport while scrolling down.
   * Sampling its current rect would then probe whatever section happens to sit
   * at the top of the screen behind the hidden bar. The bar is fixed at top-0,
   * so the stable intended band is measured from the viewport top; height is
   * unaffected by the visibility transform.
   */
  const probe = header.height / 2;
  // No declaration: follow the theme rather than assume a light canvas.
  let next: HeaderSurface = "inherit";

  // Document order: the last element covering the probe is the one painted on
  // top, which is what "visually topmost" means for stacked sections.
  const sections = document.querySelectorAll<HTMLElement>("[data-header-surface]");

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top > probe || rect.bottom < probe) return;

    const declared = section.getAttribute("data-header-surface");
    if (isSurface(declared)) next = declared;
  });

  setSurface(next);
}

let raf = 0;
function scheduleMeasure(): void {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    measure();
  });
}

let attached = false;
function attach(): void {
  if (attached) return;
  attached = true;
  window.addEventListener("scroll", scheduleMeasure, { passive: true });
  window.addEventListener("resize", scheduleMeasure, { passive: true });
  document.fonts?.ready.then(scheduleMeasure).catch(() => {});
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  attach();
  return () => {
    listeners.delete(listener);
  };
}

const getSurface = (): HeaderSurface => surface;
const getScrolled = (): boolean => scrolled;

export function useHeaderSurface(ref: RefObject<HTMLElement | null>): {
  surface: HeaderSurface;
  scrolled: boolean;
} {
  const pathname = usePathname();
  const surfaceValue = useSyncExternalStore(subscribe, getSurface, getSurface);
  const scrolledValue = useSyncExternalStore(subscribe, getScrolled, getScrolled);

  useLayoutEffect(() => {
    const el = ref.current;
    headerEl = el;
    // Synchronous first measurement avoids a one-frame stale state when the
    // page loads with a restored scroll position already on the footer.
    measure();
    return () => {
      if (headerEl === el) headerEl = null;
    };
  }, [ref, pathname]);

  return { surface: surfaceValue, scrolled: scrolledValue };
}
