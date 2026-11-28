"use client";

import { Check, LinkSimple } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { focusRing } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Copy the current case-study URL. The button is the only client interaction in
 * the information rail; without JavaScript the URL is still visible in the
 * browser and every section anchor continues to work.
 */
export function CopyProjectLink() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy() {
    try {
      await copyText(window.location.href);
      setState("copied");
    } catch {
      setState("failed");
    }

    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <div className="mt-7 border-t border-border pt-5">
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "inline-flex items-center gap-2 text-xs font-medium tracking-[0.02em] text-muted-foreground transition-colors hover:text-primary",
          focusRing,
        )}
      >
        {state === "copied" ? (
          <Check size={14} weight="bold" aria-hidden />
        ) : (
          <LinkSimple size={14} aria-hidden />
        )}
        {state === "copied"
          ? "Link copied"
          : state === "failed"
            ? "Copy failed"
            : "Copy project link"}
      </button>
      <p aria-live="polite" className="sr-only">
        {state === "copied"
          ? "Project link copied"
          : state === "failed"
            ? "Could not copy the project link"
            : ""}
      </p>
    </div>
  );
}
