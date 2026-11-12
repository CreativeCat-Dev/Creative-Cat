let release: (() => void) | null = null;

/**
 * Locks page scrolling on both html and body, compensating for the scrollbar so
 * the layout does not shift sideways when it disappears.
 *
 * Returns an unlock function, and is safe to call repeatedly: an existing lock is
 * returned rather than stacked.
 *
 * This is the seam for Lenis. When smooth scrolling arrives, the body of this
 * function becomes lenis.stop() / lenis.start() and callers stay unchanged.
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

  const unlock = () => {
    if (release !== unlock) return;
    html.style.overflow = previous.htmlOverflow;
    body.style.overflow = previous.bodyOverflow;
    body.style.paddingRight = previous.bodyPaddingRight;
    release = null;
  };

  release = unlock;
  return unlock;
}
