"use client";

import { useRef } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { MenuTrigger } from "@/components/navigation/menu-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useHeaderSurface } from "@/lib/use-header-surface";
import { focusRing, microLabel } from "@/lib/ui";

/**
 * Closed-state header. The Menu trigger and its overlay live together in
 * SiteMenu, which owns the open state without a provider.
 *
 * Surface-aware: when the fixed header geometrically overlaps the midnight
 * footer, the `dark` class pins the bar to its light-on-dark treatment. The
 * logo is `currentColor` and every control consumes semantic tokens, so one
 * class flips the whole bar together — no invert filter, no per-element
 * overrides. Without JavaScript the header simply stays in its light treatment,
 * which is the accepted progressive-enhancement fallback.
 */
export function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const overDark = useHeaderSurface(headerRef);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-[var(--z-nav)] text-foreground ${overDark ? "dark" : ""}`}
    >
      <div className="flex items-center justify-between gap-6 px-6 py-5 md:px-10 md:py-6 lg:px-14 lg:py-9">
        <Link href="/" className={`rounded-md ${focusRing}`}>
          <Logo className="transition-colors duration-200" />
        </Link>

        <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
          <p
            className={`hidden text-muted-foreground transition-colors duration-200 lg:block ${microLabel}`}
          >
            Independent Creative Studio
          </p>

          <ThemeToggle className="hidden md:inline-flex" />

          <Link
            href="/contact"
            className={`group hidden items-center gap-1.5 rounded-full px-1 py-1 text-foreground transition-colors duration-200 hover:text-primary md:inline-flex ${microLabel} ${focusRing}`}
          >
            Let&apos;s talk
            <svg
              viewBox="0 0 10 10"
              aria-hidden
              className="size-2.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              <path
                d="M1 9 9 1M3.5 1H9v5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="square"
              />
            </svg>
          </Link>

          <MenuTrigger />
        </div>
      </div>
    </header>
  );
}
