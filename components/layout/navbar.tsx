import Link from "next/link";
import { Logo } from "./logo";
import { MenuTrigger } from "@/components/navigation/menu-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { focusRing, microLabel } from "@/lib/ui";

/**
 * Closed-state header. The Menu trigger and its overlay live together in
 * SiteMenu, which owns the open state without a provider.
 */
export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-[var(--z-nav)]">
      <div className="flex items-center justify-between gap-6 px-6 py-5 md:px-10 md:py-6 lg:px-14 lg:py-9">
        <Link href="/" className={`rounded-md ${focusRing}`}>
          <Logo />
        </Link>

        <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
          <p className={`hidden text-muted-foreground lg:block ${microLabel}`}>
            Independent Creative Studio
          </p>

          <ThemeToggle className="hidden md:inline-flex" />

          <Link
            href="/contact"
            className={`group hidden items-center gap-1.5 rounded-full px-1 py-1 text-foreground transition-colors hover:text-primary md:inline-flex ${microLabel} ${focusRing}`}
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
