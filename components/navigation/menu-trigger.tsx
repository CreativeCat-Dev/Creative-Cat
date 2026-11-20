"use client";

import { cn } from "@/lib/utils";
import { useMenu } from "./menu-provider";
import { focusRing, microLabel } from "@/lib/ui";

/**
 * The closed-state menu control. It inherits the header's surface foreground
 * rather than setting its own colour, so it stays readable on a white hero and
 * on the midnight footer without per-surface variants.
 *
 * `min-h-11` gives the label a 44px touch target while the visible mark stays a
 * small 11px label with two hairlines — no resting pill.
 */
export function MenuTrigger() {
  const { open, openMenu } = useMenu();

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="site-menu"
      data-menu-trigger
      onClick={openMenu}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 transition-colors duration-200",
        "hover:text-brand-coral",
        microLabel,
        focusRing
      )}
    >
      Menu
      <span aria-hidden className="flex flex-col gap-[3px]">
        <span className="h-px w-3.5 bg-current" />
        <span className="h-px w-3.5 bg-current" />
      </span>
    </button>
  );
}
