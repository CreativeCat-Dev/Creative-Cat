import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CaseStudy, CaseStudyTypography } from "@/lib/case-study";
import { focusRing, microLabel } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { WorkProject } from "@/lib/work";
import { CaseStudyGallery } from "./case-study/case-study-gallery";
import { CaseStudyMotion } from "./case-study/case-study-motion";
import { ColorPalette } from "./case-study/color-palette";
import { CopyProjectLink } from "./case-study/copy-project-link";
import "./case-study/case-study.css";

/**
 * DEL-02 — one canonical project case study.
 *
 * The page is data-driven from `lib/case-study.ts`; the canonical project,
 * cover and Next Project still come from `lib/work.ts`. The complete cover opens
 * the narrative (never the Work archive's cinematic crop), the information rail
 * is native sticky, and every optional section disappears when its content does
 * not exist. No project total is shown on this route.
 */

type ProjectDetailProps = {
  project: WorkProject;
  study: CaseStudy;
  next: WorkProject;
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-border pt-5">
      <h2 className="font-heading text-[clamp(28px,3.2vw,44px)] leading-[1.02] font-medium tracking-[-0.02em]">
        {children}
      </h2>
    </div>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      data-case-prose
      className="mt-6 max-w-[64ch] space-y-4 text-[15px] leading-[1.75] text-foreground/80 md:text-base"
    >
      {children}
    </div>
  );
}

function TypographyStudy({ typography }: { typography: CaseStudyTypography }) {
  return (
    <div data-case-typography className="mt-10 border-t border-border pt-6">
      <p className={`text-muted-foreground ${microLabel}`}>Typography</p>

      <div className="mt-4">
        {typography.families.map((family) => (
          <div
            key={family.name}
            className="grid gap-1 border-b border-border py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6"
          >
            <p className="text-sm font-medium">{family.name}</p>
            <div>
              <p className="text-sm">{family.role}</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                {family.note}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[14px] border border-border bg-muted/40 p-6 md:p-8">
        <p className="font-heading text-[clamp(34px,5vw,62px)] leading-[0.95] font-medium tracking-[-0.02em]">
          Aa Bb Cc Dd Ee
        </p>
        <p className="mt-5 font-heading text-[clamp(15px,2vw,24px)] leading-[1.35] font-normal tracking-[0.01em] break-words">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ
          <br />
          abcdefghijklmnopqrstuvwxyz
        </p>
        <p className="mt-3 font-heading text-[clamp(24px,3.4vw,42px)] leading-none font-medium tracking-[0.02em]">
          0123456789
        </p>
        <p className="mt-3 font-heading text-[clamp(15px,2vw,24px)] leading-none font-normal tracking-[0.04em]">
          @ # $ % &amp; * ( ) ? ! / —
        </p>
        <p className="mt-5 max-w-[58ch] text-xs leading-relaxed text-muted-foreground">
          Clash Display specimen rendered with the site&apos;s bundled font.
          Waterfall Regular and Metropolis are listed as specified in the brand
          guide but are not bundled with this site.
        </p>
      </div>

      <p className="mt-3 max-w-[64ch] text-xs leading-relaxed text-muted-foreground">
        {typography.note}
      </p>
    </div>
  );
}

export function ProjectDetail({ project, study, next }: ProjectDetailProps) {
  const alt = project.category
    ? `${project.name} — ${project.category} project artwork`
    : `${project.name} project artwork`;

  const sections = [
    { id: "overview", label: "Overview" },
    ...(study.workScope && study.services.length > 0
      ? [{ id: "work-scope", label: "Work Scope" }]
      : []),
    ...(study.challenge ? [{ id: "challenges", label: "Challenges" }] : []),
    { id: "creative-direction", label: "Creative Direction" },
    { id: "style-guide", label: "Style Guide" },
    ...(study.gallery.length > 0
      ? [{ id: "gallery", label: "Project Gallery" }]
      : []),
    ...(study.outcome ? [{ id: "outcomes", label: "Outcome" }] : []),
  ];

  return (
    <CaseStudyMotion>
      <article
        data-project-detail
        data-case-study
        data-project-slug={project.slug}
      >
        <header data-case-header data-case-reveal>
          <Link
            href="/work"
            className={cn(
              "inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary",
              microLabel,
              focusRing,
            )}
          >
            <ArrowLeft size={12} weight="bold" aria-hidden />
            Back to Work
          </Link>

          <p className={`mt-10 text-primary ${microLabel}`}>
            Selected Work{study.category ? ` / ${study.category}` : ""}
          </p>

          <h1 className="mt-4 max-w-[18ch] font-heading text-[clamp(44px,7vw,104px)] leading-[0.92] font-medium tracking-[-0.025em]">
            {project.name}
          </h1>

          <p className="mt-6 max-w-[58ch] text-[clamp(17px,1.5vw,21px)] leading-[1.55] text-foreground/75">
            {study.introduction}
          </p>
        </header>

        <div data-case-grid>
          <aside data-case-sidebar aria-label="Project information">
            <div data-case-sticky>
              <p className={`text-muted-foreground ${microLabel}`}>
                Project information
              </p>

              <dl data-project-meta className="mt-5">
                {study.client ? (
                  <div className="border-t border-border py-3">
                    <dt className={`text-muted-foreground ${microLabel}`}>
                      Client
                    </dt>
                    <dd className="mt-2 text-sm leading-snug">{study.client}</dd>
                  </div>
                ) : null}

                {study.industry ? (
                  <div className="border-t border-border py-3">
                    <dt className={`text-muted-foreground ${microLabel}`}>
                      Sector
                    </dt>
                    <dd className="mt-2 text-sm leading-snug">
                      {study.industry}
                    </dd>
                  </div>
                ) : null}

                {study.category ? (
                  <div className="border-t border-border py-3">
                    <dt className={`text-muted-foreground ${microLabel}`}>
                      Category
                    </dt>
                    <dd className="mt-2 text-sm leading-snug">
                      {study.category}
                    </dd>
                  </div>
                ) : null}

                {study.services.length > 0 ? (
                  <div className="border-t border-border py-3">
                    <dt className={`text-muted-foreground ${microLabel}`}>
                      Services
                    </dt>
                    <dd className="mt-2">
                      <ul className="space-y-1.5 text-xs leading-snug">
                        {study.services.map((service) => (
                          <li key={service}>{service}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ) : null}

                {study.deliverables.length > 0 ? (
                  <div className="border-y border-border py-3">
                    <dt className={`text-muted-foreground ${microLabel}`}>
                      Deliverables
                    </dt>
                    <dd className="mt-2">
                      <ul className="space-y-1.5 text-xs leading-snug">
                        {study.deliverables.map((deliverable) => (
                          <li key={deliverable}>{deliverable}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <nav aria-label="Case study sections" className="mt-7">
                <p className={`text-muted-foreground ${microLabel}`}>
                  Contents
                </p>
                <ul className="mt-3 space-y-2">
                  {sections.map((section, index) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={cn(
                          "group flex items-baseline gap-3 text-xs text-muted-foreground transition-colors hover:text-primary",
                          focusRing,
                        )}
                      >
                        <span className="text-[10px] tabular-nums opacity-60">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <CopyProjectLink />
            </div>
          </aside>

          <div data-case-main>
            <figure data-case-hero data-case-reveal>
              <div
                data-case-hero-frame
                style={{
                  aspectRatio: `${project.width} / ${project.height}`,
                }}
              >
                <Image
                  src={project.src}
                  alt={alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 900px, 92vw"
                  className="object-cover"
                  style={
                    project.objectPosition
                      ? { objectPosition: project.objectPosition }
                      : undefined
                  }
                />
              </div>
              <figcaption className="mt-3 text-xs text-muted-foreground">
                Canonical project artwork
              </figcaption>
            </figure>

            <section id="overview" data-case-section data-case-reveal>
              <SectionTitle>About the Project</SectionTitle>
              <Prose>
                {study.overview.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </Prose>
            </section>

            {study.workScope && study.services.length > 0 ? (
              <section id="work-scope" data-case-section data-case-reveal>
                <SectionTitle>Work Scope</SectionTitle>
                <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)] md:gap-12">
                  <p className="max-w-[58ch] text-[15px] leading-[1.75] text-foreground/80 md:text-base">
                    {study.workScope}
                  </p>
                  <ul className="border-t border-border">
                    {study.services.map((service) => (
                      <li
                        key={service}
                        className="border-b border-border py-2.5 text-sm leading-snug"
                      >
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}

            {study.challenge ? (
              <section id="challenges" data-case-section data-case-reveal>
                <SectionTitle>Challenges</SectionTitle>
                <div className="mt-6 grid gap-px overflow-hidden rounded-[14px] border border-border bg-border md:grid-cols-2">
                  <div className="bg-background p-6">
                    <p className={`text-muted-foreground ${microLabel}`}>
                      Challenge
                    </p>
                    <p className="mt-3 text-sm leading-relaxed">
                      {study.challenge.challenge}
                    </p>
                  </div>
                  <div className="bg-background p-6">
                    <p className={`text-muted-foreground ${microLabel}`}>
                      Approach
                    </p>
                    <p className="mt-3 text-sm leading-relaxed">
                      {study.challenge.approach}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <section id="creative-direction" data-case-section data-case-reveal>
              <SectionTitle>Creative Direction</SectionTitle>
              <Prose>
                {study.creativeDirection.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </Prose>
            </section>

            <section id="style-guide" data-case-section data-case-reveal>
              <SectionTitle>Style Guide</SectionTitle>

              <div className="mt-6">
                <p className={`text-muted-foreground ${microLabel}`}>
                  Colour Palette
                </p>
                <div className="mt-4">
                  <ColorPalette
                    swatches={study.palette}
                    note={study.paletteNote}
                  />
                </div>
              </div>

              {study.typography ? (
                <TypographyStudy typography={study.typography} />
              ) : null}

              <div className="mt-10">
                <p className={`text-muted-foreground ${microLabel}`}>
                  {study.typography ? "Identity Notes" : "Lettering & Identity"}
                </p>
                <dl className="mt-4 grid gap-px overflow-hidden rounded-[14px] border border-border bg-border sm:grid-cols-2">
                  {study.identityNotes.map((note) => (
                    <div key={note.label} className="bg-background p-5">
                      <dt className={`text-muted-foreground ${microLabel}`}>
                        {note.label}
                      </dt>
                      <dd className="mt-2 text-sm leading-snug">{note.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            {study.gallery.length > 0 ? (
              <section id="gallery" data-case-section data-case-reveal>
                <SectionTitle>Project Gallery</SectionTitle>
                <div className="mt-6">
                  <CaseStudyGallery blocks={study.gallery} />
                </div>
              </section>
            ) : null}

            {study.outcome ? (
              <section id="outcomes" data-case-section data-case-reveal>
                <SectionTitle>Outcome</SectionTitle>
                <p className={`mt-6 text-muted-foreground ${microLabel}`}>
                  Published outcome
                </p>
                <p className="mt-3 max-w-[52ch] font-heading text-[clamp(22px,2.6vw,34px)] leading-[1.3] font-medium tracking-[-0.01em]">
                  {study.outcome}
                </p>
              </section>
            ) : null}

            <footer
              data-case-sources
              className="mt-20 border-t border-border pt-6"
            >
              <p className={`text-muted-foreground ${microLabel}`}>
                Sources &amp; notes
              </p>
              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                {study.sources.map((source) => (
                  <li key={source.label}>
                    {source.href ? (
                      <a
                        href={source.href}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 underline-offset-3 transition-colors hover:text-primary hover:underline",
                          focusRing,
                        )}
                      >
                        {source.label}
                        <ArrowUpRight size={11} aria-hidden />
                      </a>
                    ) : (
                      source.label
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-4 max-w-[72ch] text-xs leading-relaxed text-muted-foreground">
                {study.verification}. Client names, service lists and project
                descriptions follow the published Creative Cat portfolio record;
                sector labels are editorial classifications. Palette provenance is
                marked on each swatch. The canonical cover is a Creative Cat
                presentation asset, not a photograph of completed deliverables.
              </p>
            </footer>
          </div>
        </div>

        <nav
          aria-label="Project navigation"
          data-case-next
          data-case-reveal
          className="mt-24 border-t border-border pt-8 md:mt-32"
        >
          <Link
            href={next.href ?? "/work"}
            data-project-next
            aria-label={`Next project: ${next.name}`}
            className={cn(
              "group block rounded-[clamp(10px,1vw,16px)] outline-none",
              focusRing,
            )}
          >
            <div data-case-next-card>
              <div className="min-w-0">
                <span className={`block text-muted-foreground ${microLabel}`}>
                  Next Project
                </span>
                <span className="mt-3 block font-heading text-[clamp(34px,5vw,64px)] leading-[0.98] font-medium tracking-[-0.025em] transition-colors group-hover:text-primary">
                  {next.name}
                </span>
                {next.category ? (
                  <span
                    className={`mt-3 block text-muted-foreground ${microLabel}`}
                  >
                    {next.category}
                  </span>
                ) : null}

                <span
                  aria-hidden
                  className="mt-7 grid size-[clamp(46px,4vw,58px)] place-items-center rounded-full bg-foreground text-background transition-[background-color,color,transform] duration-300 group-hover:rotate-45 group-hover:bg-primary group-hover:text-primary-foreground group-focus-visible:rotate-45 group-focus-visible:bg-primary group-focus-visible:text-primary-foreground motion-reduce:transition-none"
                >
                  <ArrowUpRight size={18} weight="bold" />
                </span>
              </div>

              <div data-case-next-media>
                <Image
                  src={next.src}
                  alt={`${next.name} project artwork`}
                  fill
                  sizes="(min-width: 1024px) 380px, 92vw"
                  className="object-cover"
                  style={
                    next.objectPosition
                      ? { objectPosition: next.objectPosition }
                      : undefined
                  }
                />
              </div>
            </div>
          </Link>
        </nav>
      </article>
    </CaseStudyMotion>
  );
}
