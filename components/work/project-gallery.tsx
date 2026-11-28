import { microLabel } from "@/lib/ui";
import { getWorkProject, getWorkProjectIndex } from "@/lib/work";
import { WorkArchiveMotion } from "./work-archive-motion";
import { getWorkArchiveRows } from "./work-archive.data";
import { WorkProjectCard } from "./work-project-card";
import "./work-archive.css";

/**
 * DEL-01D / DEL-01D.1 / DEL-01D.2 — the Work archive.
 *
 * A theme-aware editorial portfolio that belongs to this route only. It does not
 * reuse the homepage gallery's circular opening or perspective hover: the Work
 * page is calmer and gives every project a stable one-link card.
 *
 * DEL-01D.2 sequences the archive as full-width feature → staggered pair →
 * feature … so each standalone project owns the complete 1200px measure in a
 * controlled cinematic frame while the pairs stay narrow. The sequence is
 * presentation metadata in `work-archive.data.ts`; `WORK_PROJECTS` keeps its
 * canonical order, so visual, DOM and keyboard order agree without re-sorting
 * the collection. No project total is shown and no contact button is repeated
 * here: the shared footer owns the primary contact action, and this route closes
 * with a short editorial statement.
 */
export function ProjectGallery() {
  const rows = getWorkArchiveRows();

  return (
    <div data-work-archive aria-labelledby="work-index-title">
      <header data-work-intro>
        <p className={`flex items-center gap-3 text-muted-foreground ${microLabel}`}>
          <span aria-hidden className="size-[7px] rounded-full bg-primary" />
          Selected Work
        </p>

        <h1
          id="work-index-title"
          className="mt-5 max-w-[10ch] font-heading text-[clamp(42px,6vw,88px)] leading-[0.95] font-medium tracking-[-0.025em] text-foreground"
        >
          Our work<span className="text-primary">.</span>
        </h1>

        <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-muted-foreground md:text-base">
          Distinctive ideas. Thoughtful design. Meaningful experiences.
        </p>
      </header>

      <WorkArchiveMotion>
        <div data-work-gallery>
          {rows.map((group) => (
            <div
              key={group.row}
              data-work-row
              data-work-row-layout={group.layout}
            >
              {group.entries.map((entry) => {
                const project = getWorkProject(entry.slug);
                if (!project) return null;
                // The first feature is above the fold on most desktops.
                const priority = project.slug === "right-sight";
                return (
                  <WorkProjectCard
                    key={project.slug}
                    project={project}
                    entry={entry}
                    index={getWorkProjectIndex(project.slug)}
                    priority={priority}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </WorkArchiveMotion>

      <section data-work-closing aria-labelledby="work-closing-title">
        <p className={`text-muted-foreground ${microLabel}`}>The next chapter</p>
        <h2
          id="work-closing-title"
          className="mt-5 max-w-[12ch] font-heading text-[clamp(30px,4.2vw,56px)] leading-[0.98] font-medium tracking-[-0.025em] text-foreground"
        >
          Your idea could be next<span className="text-primary">.</span>
        </h2>
        <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-muted-foreground md:text-base">
          Every great project begins somewhere.
        </p>
      </section>
    </div>
  );
}
