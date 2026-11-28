"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/clipboard";
import type { CaseStudySwatch } from "@/lib/case-study";

/**
 * Interactive project palette.
 *
 * Each swatch is a real button: pointer and keyboard users can copy its HEX
 * value, and the result is announced politely. The colour chip picks its own
 * ink from the swatch luminance so light and dark project colours both stay
 * readable. None of these colours write to Creative Cat's global theme tokens.
 */

function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const value =
    clean.length === 3
      ? clean
          .split("")
          .map((character) => character + character)
          .join("")
      : clean;
  const number = Number.parseInt(value, 16);
  if (!Number.isFinite(number) || value.length !== 6) return 0;

  const channels = [
    (number >> 16) & 255,
    (number >> 8) & 255,
    number & 255,
  ].map((channel) => {
    const normalised = channel / 255;
    return normalised <= 0.03928
      ? normalised / 12.92
      : ((normalised + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(a: number, b: number): number {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Whichever of the site inks reads more clearly on the swatch. */
function inkFor(hex: string): string {
  const luminance = relativeLuminance(hex);
  const onMidnight = contrastRatio(luminance, 0.013);
  const onWhite = contrastRatio(luminance, 1);
  return onMidnight >= onWhite ? "#150E34" : "#FFFFFF";
}

type ColorPaletteProps = {
  swatches: readonly CaseStudySwatch[];
  note: string;
};

export function ColorPalette({ swatches, note }: ColorPaletteProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy(swatch: CaseStudySwatch) {
    try {
      await copyText(swatch.hex);
      setCopied(swatch.hex);
      setFailed(null);
    } catch {
      setCopied(null);
      setFailed(swatch.hex);
    }

    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopied(null);
      setFailed(null);
    }, 1800);
  }

  const status = copied
    ? `Copied ${copied}`
    : failed
      ? `Could not copy ${failed}`
      : "";

  return (
    <div data-case-palette>
      <ul data-case-palette-grid>
        {swatches.map((swatch) => {
          const ink = inkFor(swatch.hex);
          const isCopied = copied === swatch.hex;
          const isFailed = failed === swatch.hex;

          return (
            <li key={`${swatch.name}-${swatch.hex}`}>
              <button
                type="button"
                onClick={() => handleCopy(swatch)}
                aria-label={`Copy ${swatch.name} HEX ${swatch.hex}`}
                className={cn(
                  "group block w-full rounded-[14px] border border-border bg-card p-2 text-left transition-colors",
                  "hover:border-primary/60 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                )}
              >
                <span
                  className="flex h-[112px] flex-col justify-between rounded-[9px] p-3 sm:h-[128px]"
                  style={{ backgroundColor: swatch.hex, color: ink }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium tracking-[0.16em] uppercase opacity-75">
                      {swatch.provenance}
                    </span>
                    <span className="grid size-6 place-items-center rounded-full border border-current/25">
                      {isCopied ? (
                        <Check size={13} weight="bold" aria-hidden />
                      ) : (
                        <Copy size={13} aria-hidden />
                      )}
                    </span>
                  </span>
                  <span className="font-heading text-[clamp(17px,1.4vw,22px)] leading-none font-medium tracking-[-0.01em]">
                    {swatch.hex}
                  </span>
                </span>

                <span className="mt-3 block px-1 pb-1">
                  <span className="block text-sm leading-tight font-medium">
                    {swatch.name}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                    {swatch.role}
                  </span>
                  <span className="mt-1 block text-[10px] leading-snug text-muted-foreground/80">
                    {isCopied
                      ? "Copied to clipboard"
                      : isFailed
                        ? "Copy failed — select the HEX above"
                        : "Click to copy HEX"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p aria-live="polite" className="sr-only">
        {status}
      </p>

      <p className="mt-4 max-w-[62ch] text-xs leading-relaxed text-muted-foreground">
        {note}
      </p>
    </div>
  );
}
