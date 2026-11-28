import Image from "next/image";
import Link from "next/link";
import { focusRing, microLabel } from "@/lib/ui";
import { WORK_PROJECT_COUNT, type WorkProject } from "@/lib/work";

/**
 * One project showcase, resolved from the canonical collection.
 *
 * There is no invented case-study copy: shipped metadata is the project name,
 * its published category (when one exists) and its canonical position. The
 * authentic artwork is shown whole at its intrinsic aspect ratio — the detail
 * view never crops the work. Navigation is Back to Work plus the canonical next
 * project (wrapping 13 -> 01).
 */

const pad2 = (value: number) => String(value).padStart(2, "0");

function Arrow({ direction = "out" }: { direction?: "out" | "back" }) {
  if (direction === "back") {
    return (
      <svg viewBox="0 0 10 10" aria-hidden className="size-3">
        <path
          d="M8.6 5H1.4M4.6 1.8 1.4 5l3.2 3.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="square"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 10 10" aria-hidden className="size-3.5">
      <path
        d="M1.4 8.6 8.6 1.4M3.2 1.4h5.4v5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="square"
      />
    </svg>
  );
}

type ProjectDetailProps = {
  project: WorkProject;
  index: number;
  next: WorkProject;
};

export function ProjectDetail({ project, index, next }: ProjectDetailProps) {
  const position = pad2(index + 1);
  const alt = project.category
    ? `${project.name} — ${project.category} project artwork`
    : `${project.name} project artwork`;
  // The owner-supplied covers are 1254px or wider, so the showcase can use the
  // established 1120px measure without magnifying a thumbnail.
  const artworkWidth = Math.min(1120, Math.round(project.width * 0.9));

  return (
    <article data-project-detail data-project-slug={project.slug}>
      <header data-project-header>
        <Link
          href="/work"
          className={`inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary ${microLabel} ${focusRing}`}
        >
          <Arrow direction="back" />
          Back to Work
        </Link>

        <p className={`mt-10 text-primary ${microLabel}`}>
          Selected Work / {position} of {WORK_PROJECT_COUNT}
        </p>

        <h1 className="mt-4 max-w-[16ch] font-heading text-[clamp(44px,7.4vw,110px)] leading-[0.92] font-medium tracking-[-0.025em]">
          {project.name}
        </h1>

        {project.category ? (
          <p className={`mt-6 text-muted-foreground ${microLabel}`}>
            {project.category}
          </p>
        ) : null}
      </header>

      <figure data-project-artwork className="mt-12 md:mt-16">
        <div
          className="relative mx-auto w-full overflow-hidden rounded-[clamp(8px,1vw,16px)] bg-muted"
          style={{
            aspectRatio: `${project.width} / ${project.height}`,
            maxWidth: `${artworkWidth}px`,
          }}
        >
          <Image
            src={project.src}
            alt={alt}
            fill
            priority
            sizes="(min-width: 1280px) 1120px, (min-width: 768px) 88vw, 92vw"
            className="object-cover"
            style={
              project.objectPosition
                ? { objectPosition: project.objectPosition }
                : undefined
            }
          />
        </div>
      </figure>

      <div
        data-project-meta
        className="mt-10 grid grid-cols-2 gap-6 border-y border-border py-6 md:max-w-xl"
      >
        <div>
          <p className={`text-muted-foreground ${microLabel}`}>Category</p>
          <p className="mt-2 text-sm">
            {project.category ?? "Selected project"}
          </p>
        </div>
        <div>
          <p className={`text-muted-foreground ${microLabel}`}>Collection</p>
          <p className="mt-2 text-sm tabular-nums">
            {position} / {WORK_PROJECT_COUNT}
          </p>
        </div>
      </div>

      <nav aria-label="Project navigation" className="mt-12 md:mt-16">
        {next.href ? (
          <Link
            href={next.href}
            data-project-next
            className={`group flex items-end justify-between gap-6 rounded-[clamp(8px,1vw,14px)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50`}
            aria-label={`Next project: ${next.name}`}
          >
            <span className="min-w-0">
              <span className={`block text-muted-foreground ${microLabel}`}>
                Next Project
              </span>
              <span className="mt-3 block font-heading text-[clamp(30px,4.4vw,58px)] leading-[1] font-medium tracking-[-0.02em] transition-colors group-hover:text-primary">
                {next.name}
              </span>
              {next.category ? (
                <span className={`mt-3 block text-muted-foreground ${microLabel}`}>
                  {next.category}
                </span>
              ) : null}
            </span>

            <span
              aria-hidden
              className="grid size-[clamp(46px,4vw,58px)] shrink-0 place-items-center rounded-full bg-foreground text-background transition-[background-color,color,transform] duration-300 group-hover:rotate-45 group-hover:bg-primary group-hover:text-primary-foreground group-focus-visible:rotate-45 group-focus-visible:bg-primary group-focus-visible:text-primary-foreground motion-reduce:transition-none"
            >
              <Arrow />
            </span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
