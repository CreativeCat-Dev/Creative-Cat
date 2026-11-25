import { getLenis } from "./lenis";
import { scheduleRefresh } from "./scroll-trigger";

let release: (() => void) | null = null;

/** Whether a caller currently holds the document lock (used by the Lenis bridge). */
export function isScrollLocked(): boolean {
  return release !== null;
}

/**
 * Locks page scrolling on both html and body, compensating for the scrollbar so
 * the layout does not shift sideways when it disappears.
 *
 * Returns an unlock function, and is safe to call repeatedly: an existing lock is
 * returned rather than stacked.
 *
 * Lenis is stopped alongside the native lock rather than replacing it. The
 * overflow lock is the guarantee — it still works if Lenis failed to mount, on
 * reduced motion, and in no-JS fallbacks — while `lenis.stop()` prevents the
 * smooth scroller from banking wheel distance that would be spent in one jump
 * when the menu closes.
 */
export function lockScroll(): () => void {
  if (release) return release;

  const html = document.documentElement;
  const body = document.body;
  const scrollbarWidth = window.innerWidth - html.clientWidth;
  const previous = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
  };

  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }

  getLenis()?.stop();

  const unlock = () => {
    if (release !== unlock) return;
    html.style.overflow = previous.htmlOverflow;
    body.style.overflow = previous.bodyOverflow;
    body.style.paddingRight = previous.bodyPaddingRight;
    release = null;

    const lenis = getLenis();
    if (lenis) {
      lenis.start();
      // The lock changes the client width (scrollbar) and therefore the scroll
      // limit; re-measure before anything asks where the page is.
      lenis.resize();
    }
    // Releasing the lock can shift every ScrollTrigger start/end, so measure
    // once the layout has been restored.
    scheduleRefresh();
  };

  release = unlock;
  return unlock;
}
