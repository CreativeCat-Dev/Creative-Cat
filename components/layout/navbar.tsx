"use client";

import { useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { MenuTrigger } from "@/components/navigation/menu-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useHeaderSurface, type HeaderSurface } from "@/lib/use-header-surface";
import { focusRing, microLabel } from "@/lib/ui";
import { NavbarScroll } from "./navbar-scroll";

const SURFACE_CLASS: Record<HeaderSurface, string> = {
  light: "nav-surface-light",
  dark: "nav-surface-dark",
  coral: "nav-surface-dark",
  inherit: "nav-surface-inherit",
};

const studioLabel =
  "text-[10px] font-medium uppercase tracking-[0.24em] opacity-[0.62]";

const control = cn(
  "inline-flex min-h-11 items-center transition-colors duration-200",
  "hover:text-brand-coral",
  microLabel,
  focusRing
);

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className={className}>
      <path
        d="M1 9 9 1M3.5 1H9v5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const { surface, scrolled } = useHeaderSurface(headerRef);

  return (
    <header
      ref={headerRef}
      data-surface={surface}
      className={cn(
        "fixed inset-x-0 top-0 z-[var(--z-nav)]",
        SURFACE_CLASS[surface]
      )}
    >
      <div
        data-scrolled={scrolled ? "" : undefined}
        className={cn(
          "nav-shell flex items-center justify-between gap-4 px-5",
          "md:gap-6 md:px-9 lg:px-12 xl:px-16 2xl:px-20",
          scrolled ? "py-2 md:py-4" : "py-3 md:py-5"
        )}
      >
        <Link
          href="/"
          className={cn(
            "inline-flex min-h-11 items-center",
            focusRing
          )}
        >
          <Logo />
        </Link>

        <div className="flex items-center gap-3 md:gap-5 lg:gap-7">
          <p className={cn("hidden xl:block", studioLabel)}>
            Independent Creative Studio
          </p>

          <ThemeToggle className="hidden text-current md:inline-flex" />

          <Link
            href="/contact"
            className={cn(control, "group hidden gap-1.5 md:inline-flex")}
          >
            Let&apos;s talk
            <Arrow className="size-2.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>

          <MenuTrigger />
        </div>
      </div>
      <NavbarScroll />
    </header>
  );
}
