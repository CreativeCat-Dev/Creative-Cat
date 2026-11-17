import Link from "next/link";
import { focusRing, microLabel } from "@/lib/ui";

/**
 * Footer hero moment. One anchor wraps the headline and the desktop "Let's talk"
 * disc, so the whole block is a single tab stop with a single destination; the
 * disc is a <span> because the anchor is the only control.
 *
 * Each line is still wrapped in an `overflow-hidden` mask with `pb-[0.08em]` so
 * the motion batch can slide it out from behind the mask. That padding keeps
 * descenders from being clipped at `leading-[0.92]`; verify it still holds if
 * the leading tightens.
 *
 * The inline arrow is mobile-only: on desktop the disc carries it.
 */
export function FooterCta() {
  const line =
    "block font-heading font-medium uppercase leading-[0.92] tracking-[-0.045em] lg:leading-[0.88] text-[clamp(42px,7.8vw,150px)]";

  return (
    <div>
      <p data-footer-eyebrow className={`text-muted-foreground ${microLabel}`}>
        Have a project in mind?
      </p>

      <Link
        href="/contact"
        className={`group mt-5 block rounded-sm md:mt-7 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-6 ${focusRing}`}
      >
        <h2 className="lg:col-span-10">
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-footer-cta-line className={line}>
              Let&apos;s create
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-footer-cta-line className={line}>
              Something{" "}
              <span className="whitespace-nowrap">
                great
                <svg
                  viewBox="0 0 10 10"
                  aria-hidden
                  className="ml-[0.12em] inline-block size-[0.42em] align-baseline transition-transform duration-200 group-hover:-translate-y-[0.06em] group-hover:translate-x-[0.06em] lg:hidden"
                >
                  <path
                    d="M1 9 9 1M3.5 1H9v5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="square"
                  />
                </svg>
              </span>
            </span>
          </span>
        </h2>

        {/*
          The border is `foreground/40`, not `border-border`: the latter is 12%
          white in the forced-dark footer (1.39:1) and cannot be what identifies
          an interactive surface. 40% clears 3:1 at 3.79:1.
        */}
        <span
          data-footer-disc
          className="hidden size-[clamp(112px,9vw,140px)] flex-col items-center justify-center gap-1.5 rounded-full border border-foreground/40 text-center text-foreground transition-colors duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground group-focus-visible:border-primary group-focus-visible:bg-primary group-focus-visible:text-primary-foreground lg:col-start-11 lg:col-span-2 lg:flex lg:justify-self-end">
          <span className={microLabel}>Let&apos;s talk</span>
          <svg
            viewBox="0 0 10 10"
            aria-hidden
            className="size-3 transition-transform duration-200 group-hover:-translate-y-[2px] group-hover:translate-x-[2px] group-focus-visible:-translate-y-[2px] group-focus-visible:translate-x-[2px]"
          >
            <path
              d="M1 9 9 1M3.5 1H9v5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
            />
          </svg>
        </span>
      </Link>
    </div>
  );
}
