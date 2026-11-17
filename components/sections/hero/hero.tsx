import Link from "next/link";
import { focusRing, microLabel } from "@/lib/ui";
import { HeroMotion } from "./hero-motion";
import {
  HERO_BODY,
  HERO_CTA_PRIMARY,
  HERO_CTA_SECONDARY,
  HERO_EYEBROW,
  HERO_HEADLINE,
  HERO_REEL_CAPTION,
} from "./hero.data";

/**
 * The same 10x10 arrow the navbar and footer use, kept inline so it inherits
 * `currentColor` and never depends on a font fallback glyph.
 */
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

const ctaLabel = "text-[12px] font-semibold uppercase tracking-[0.14em]";

/**
 * Hero composition. Still a server component: the only client JavaScript in the
 * section is `HeroMotion`, which wraps the content and owns the entrance. The
 * markup below is complete in the server HTML, so it reads correctly without
 * JavaScript and gains no hidden initial state.
 *
 * Layout is one screen tall: the section owns `min-h-svh`, the content column
 * (owned by `HeroMotion`) grows with `flex-1`, and the base rule stays pinned to
 * the bottom of that column. On short laptops the type block — not the aperture
 * — sets the row height, which is why the aperture is width-capped against the
 * viewport rather than height-capped: a `max-height` on an `aspect-ratio` box
 * would flatten it into a wider rectangle.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="flex min-h-svh flex-col px-6 pt-32 pb-8 md:px-10 md:pt-36 md:pb-10 lg:px-14 lg:pb-12"
    >
      <HeroMotion>
        <p data-hero-eyebrow className={`text-muted-foreground ${microLabel}`}>
          {HERO_EYEBROW}
        </p>

        <div className="flex flex-1 flex-col justify-end">
          <div className="grid gap-10 pt-10 lg:grid-cols-12 lg:items-end lg:gap-10">
            <div className="lg:col-span-7">
              {/* The type scale lives on the h1 rather than the inner span so the
                  mask's `pb-[0.08em]` resolves against the headline size. The
                  copy deliberately has no descenders: at `leading-[0.88]` the
                  mask padding is tuned to this three-line statement, and the
                  motion batch owns any future retuning. */}
              <h1
                id="hero-title"
                className="font-heading font-medium text-[clamp(46px,11.2vw,92px)] leading-[0.88] tracking-[-0.035em] lg:text-[clamp(64px,7.2vw,150px)]"
              >
                {HERO_HEADLINE.map((line, index) => (
                  <span key={line} className="block overflow-hidden pb-[0.08em]">
                    <span data-hero-line className="block">
                      {line}
                      {/* Keeps the accessible name a spaced sentence while the
                          visual breaks stay explicit. */}
                      {index < HERO_HEADLINE.length - 1 ? " " : null}
                    </span>
                  </span>
                ))}
              </h1>

              <p
                data-hero-body
                className="mt-8 max-w-[38ch] text-sm leading-relaxed text-muted-foreground md:text-base lg:mt-10"
              >
                {HERO_BODY}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 lg:mt-8">
                <Link
                  href={HERO_CTA_PRIMARY.href}
                  data-hero-cta
                  className={`group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-primary-foreground transition-colors hover:bg-primary/90 ${ctaLabel} ${focusRing}`}
                >
                  {HERO_CTA_PRIMARY.label}
                  <Arrow className="size-2.5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href={HERO_CTA_SECONDARY.href}
                  data-hero-cta
                  className={`group inline-flex items-center gap-2 rounded-full text-foreground transition-colors hover:text-primary ${ctaLabel} ${focusRing}`}
                >
                  {HERO_CTA_SECONDARY.label}
                  <Arrow className="size-2.5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/*
              Media aperture. Geometry is final; the reel is not in the project
              yet, so this is a designed placeholder rather than a fabricated
              poster. When the cat/visor footage arrives it replaces the inner
              surface with <video poster> plus an <Image> fallback at the same
              box — the frame, ratio and caption never move.

              `max-w-[calc(0.75*58svh)]` bounds the *width* so height stays
              derived from the ratio: at 1440x768 this renders 334x445 instead
              of a stretched 420x445. `justify-self-end` keeps it flush to the
              grid's outer edge when the cap is active.
            */}
            <div
              aria-hidden
              data-hero-media
              className="relative aspect-[4/5] w-full max-w-[520px] overflow-hidden rounded-2xl bg-[linear-gradient(155deg,var(--color-brand-midnight)_12%,var(--color-brand-wine)_100%)] ring-1 ring-brand-coral/30 ring-inset lg:col-span-4 lg:col-start-9 lg:aspect-[3/4] lg:max-w-[calc(0.75*58svh)] lg:justify-self-end"
            >
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full border border-white/25 bg-white/5">
                  <svg viewBox="0 0 12 14" aria-hidden className="ml-0.5 size-3 fill-white/70">
                    <path d="M0 0l12 7-12 7z" />
                  </svg>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* The desktop gap is deliberately tighter than the mobile one: at
            1440x768 the type block sets the row height, and the base rule has
            to stay inside the fold or its small text clips at the viewport
            edge.

            The hairline is its own element rather than a `border-t` on the row
            below: the entrance scales it from the left, and a border on the
            flex row would scale the two labels along with it. Spacing is
            unchanged, because 1px + pt-4 is the same box either way. */}
        <hr data-hero-rule className="mt-8 border-border lg:mt-6" />
        <div data-hero-meta className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <p className={`flex items-center gap-2 text-muted-foreground ${microLabel}`}>
            Scroll
            <svg viewBox="0 0 10 10" aria-hidden className="size-2.5">
              <path
                d="M5 1v8M1.5 5.5 5 9l3.5-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="square"
              />
            </svg>
          </p>
          <p className={`text-muted-foreground ${microLabel}`}>{HERO_REEL_CAPTION}</p>
        </div>
      </HeroMotion>
    </section>
  );
}
