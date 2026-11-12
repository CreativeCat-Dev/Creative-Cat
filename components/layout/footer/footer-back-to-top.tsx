"use client";

import { focusRing, microLabel } from "@/lib/ui";

/**
 * Client island so the rest of the footer can stay a server component.
 * Respects reduced motion at click time, and is the seam that later routes
 * through Lenis instead of window.scrollTo.
 */
export function FooterBackToTop() {
  const handleClick = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group inline-flex items-center gap-2 rounded-full px-1 py-1 text-foreground transition-colors hover:text-primary ${microLabel} ${focusRing}`}
    >
      Back to top
      <svg
        viewBox="0 0 10 10"
        aria-hidden
        className="size-2.5 transition-transform duration-200 group-hover:-translate-y-0.5"
      >
        <path
          d="M5 9V1M1.5 4.5 5 1l3.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}
