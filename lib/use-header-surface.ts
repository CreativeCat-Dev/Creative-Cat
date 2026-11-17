"use client";

import { useLayoutEffect, useSyncExternalStore, type RefObject } from "react";
import { usePathname } from "next/navigation";

let headerEl: HTMLElement | null = null;
let overDark = false;
const listeners = new Set<() => void>();

function setOverDark(next: boolean): void {
  if (overDark === next) return;
  overDark = next;
  listeners.forEach((listener) => listener());
}

function measure(): void {
  const footer = document.querySelector<HTMLElement>("[data-footer]");
  const next =
    Boolean(headerEl && footer) &&
    (() => {
      const header = headerEl!.getBoundingClientRect();
      const footerRect = footer!.getBoundingClientRect();
      return footerRect.top < header.bottom && footerRect.bottom > header.top;
    })();
  setOverDark(next);
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

const getSnapshot = (): boolean => overDark;

export function useHeaderSurface(ref: RefObject<HTMLElement | null>): boolean {
  const pathname = usePathname();
  const overDarkValue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useLayoutEffect(() => {
    const el = ref.current;
    headerEl = el;
    // Synchronous first measurement avoids a one-frame stale state if the page
    // loads with a restored scroll position already on the footer.
    measure();
    return () => {
      if (headerEl === el) headerEl = null;
    };
  }, [ref, pathname]);

  return overDarkValue;
}
