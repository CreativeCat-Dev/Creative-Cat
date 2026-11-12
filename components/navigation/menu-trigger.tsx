"use client";

import { useMenu } from "./menu-provider";
import { focusRing, microLabel } from "@/lib/ui";

export function MenuTrigger() {
  const { open, openMenu } = useMenu();

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="site-menu"
      data-menu-trigger
      onClick={openMenu}
      className={`inline-flex items-center gap-2 rounded-full px-1 py-1 text-foreground transition-colors hover:text-primary ${microLabel} ${focusRing}`}
    >
      Menu
      <span aria-hidden className="flex flex-col gap-[3px]">
        <span className="h-px w-3.5 bg-current" />
        <span className="h-px w-3.5 bg-current" />
      </span>
    </button>
  );
}
