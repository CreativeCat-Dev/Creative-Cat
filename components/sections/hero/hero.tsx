import Image from "next/image";
import Link from "next/link";
import { focusRing, microLabel } from "@/lib/ui";
import { WORK_PROJECT_COUNT, WORK_PROJECTS, type WorkProject } from "@/lib/work";
import { HeroCard } from "./hero-card";
import { HeroCatStage } from "./hero-cat";
import { HeroCorridor } from "./hero-corridor";
import { HeroFeaturedMeta } from "./hero-featured-meta";
import { HeroMotion } from "./hero-motion";
import { HeroStory } from "./hero-story";
import { ServiceRibbon } from "@/components/sections/service-ribbon/service-ribbon";
import { CAT_SOURCE } from "./hero.cat";
import {
  HERO_BODY,
  HERO_CTA_PRIMARY,
  HERO_CTA_SECONDARY,
  HERO_EYEBROW,
  HERO_HEADLINE,
} from "./hero.data";

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
const pad2 = (value: number) => String(value).padStart(2, "0");

const FEATURED_INDEX = 0;
const featured = WORK_PROJECTS[FEATURED_INDEX];
const SUPPORT_INDEX = 4;
const support = WORK_PROJECTS[SUPPORT_INDEX];

const catSizes = "(min-width: 1024px) 1160px, 640px";

function FeaturedMeta({ project, index }: { project: WorkProject; index: number }) {
  return (
    <div className="relative z-10 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className={`text-muted-foreground ${microLabel}`}>Featured work</p>
        <p className="mt-1.5 truncate font-heading text-[21px] leading-none tracking-[-0.01em]">
          {project.name}
        </p>
      </div>
      <p className="shrink-0 font-heading text-[13px] tracking-[0.06em] text-muted-foreground tabular-nums">
        {pad2(index + 1)} / {WORK_PROJECT_COUNT}
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <div
      data-hero-story
      data-hero-mode="static"
      className="relative"
      style={{
        minHeight: "100svh",
        height: "var(--hero-story-h, auto)",
      }}
    >
      <HeroStory />

      <section
        data-hero-stage
        aria-labelledby="hero-title"
        className="sticky top-0 isolate flex min-h-svh flex-col overflow-x-clip px-6 pt-24 pb-6 md:px-10 md:pt-28 md:pb-10 hero-lg:px-14 hero-lg:pt-36 hero-lg:pb-12"
      >
        {/* Theme-aware wash that seats the midnight-lit cat on either surface. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[18%] bottom-0 -z-10 [background:var(--cc-hero-glow)]"
        />

        <HeroMotion>
          {/* Desktop stage: the corridor owns all thirteen cards, the cat sits in
              front of it, and the semantic lane above both. */}
          <div data-hero-desktop className="pointer-events-none absolute inset-x-0 top-0 bottom-[60px] z-0 hidden hero-lg:block [--corridor-w:clamp(268px,23.5vw,342px)]">
            <HeroCorridor />

            <div
              data-hero-featured-anchor
              className="absolute bottom-[calc(var(--corridor-w)*1.25+20px)] w-[var(--corridor-w)]"
            >
              <HeroFeaturedMeta />
            </div>
            <HeroCatStage poster={CAT_SOURCE.posters.settled} startPoster={CAT_SOURCE.posters.start} sizes={catSizes} />
          </div>

          <div data-hero-lane className="relative z-10 flex flex-1 flex-col hero-lg:pointer-events-none">
            <div data-hero-copy className="hero-lg:max-w-[calc(36vw-4rem)] hero-lg:pointer-events-auto">
              <p data-hero-eyebrow className={`text-muted-foreground ${microLabel}`}>
                {HERO_EYEBROW}
              </p>

              <h1
                id="hero-title"
                className="mt-4 font-heading font-medium text-[clamp(40px,11.2vw,56px)] leading-[0.88] tracking-[-0.035em] md:mt-6 hero-lg:text-[clamp(48px,4.75vw,72px)]"
              >
                {HERO_HEADLINE.map((line, index) => (
                  <span
                    key={index}
                    data-hero-compact-tail={line.hideInCompact ? "true" : undefined}
                    className="block overflow-hidden pb-[0.08em]"
                  >
                    <span data-hero-line className="block">
                      {line.segments.map((segment, segmentIndex) => (
                        <span key={segmentIndex} data-hero-compact={segment.compact}>
                          {segment.text}
                        </span>
                      ))}
                      {/* Keeps the accessible name a spaced sentence while the
                          visual breaks stay explicit. */}
                      {index < HERO_HEADLINE.length - 1 ? " " : null}
                    </span>
                  </span>
                ))}
              </h1>

              <p
                data-hero-body
                className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground md:text-base hero-lg:mt-6 hero-lg:max-w-[31ch]"
              >
                {HERO_BODY}
              </p>

              <div data-hero-cta-group className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4 hero-lg:mt-6">
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

            {/* Phone: a shallow track, not a shrunken desktop stage. */}
            <div aria-hidden data-hero-art-track className="relative hero-lg:hidden">
              <div data-hero-card-side="left" className="absolute bottom-0 left-0">
                <HeroCard
                  project={support}
                  sizes="42vw"
                  className="shadow-[0_24px_50px_-36px_rgba(21,14,52,0.5)]"
                />
              </div>
              <div data-hero-card-side="right" className="absolute right-0 bottom-0">
                <HeroCard
                  project={featured}
                  sizes="42vw"
                  className="shadow-[0_28px_60px_-38px_rgba(21,14,52,0.6)]"
                />
              </div>
              <div data-hero-cat-box className="absolute bottom-0 left-1/2 aspect-[16/9] -translate-x-1/2">
                <Image
                  src={CAT_SOURCE.posters.settled}
                  alt=""
                  fill
                  loading="eager"
                  sizes="(min-width: 1024px) 1160px, (min-width: 768px) 640px, 100vw"
                  className="object-contain object-bottom"
                />
              </div>
            </div>

            <div className="mt-4 max-w-[420px] hero-lg:hidden">
              <FeaturedMeta project={featured} index={FEATURED_INDEX} />
            </div>

            <hr data-hero-rule className="mt-5 border-border hero-lg:mt-auto" />
            <div data-hero-meta className="relative">
              <ServiceRibbon />
            </div>
          </div>
        </HeroMotion>
      </section>
    </div>
  );
}
