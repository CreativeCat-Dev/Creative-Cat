"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { microLabel } from "@/lib/ui";
import { WORK_PROJECTS, type WorkProject } from "@/lib/work";
import { nearestProjectIndex } from "./hero-corridor.geometry";
import { getCorridorProgress, subscribeCorridorProgress } from "./hero-corridor.store";

/**
 * The focal project's one interaction, as a real link.
 *
 * HERO-04.1 lands this architecture dark: no project has a published
 * destination yet, so `HAS_WORK_DESTINATIONS` is false and the corridor never
 * mounts this component. It is written now so the moment `lib/work.ts` gains an
 * `href`, the focal card offers "View project" with no further code.
 *
 * Content follows the focal owner only — the same `nearestProjectIndex()` the
 * metadata and the corridor use — and React commits only when that index
 * changes, so a 60fps scroll cannot re-render this. Eligibility (settled inside
 * ±0.15 steps) is a DOM attribute written by the corridor; hover and focus are
 * pure CSS. Nothing here listens to the pointer, stops Lenis or owns a clock.
 *
 * The link is keyed by slug: when focal ownership changes, the old anchor is
 * removed rather than re-pointed at another project, so a held focus can never
 * activate the wrong destination. Focus falls back to the document, which is
 * the honest outcome when the control itself ceases to exist.
 */

const FIRST = WORK_PROJECTS[0];

export function HeroProjectLink() {
  const [project, setProject] = useState<WorkProject>(FIRST);

  useEffect(() => {
    const sync = () => {
      const next = WORK_PROJECTS[nearestProjectIndex(getCorridorProgress())];
      // Same object reference while the index holds, so React bails out.
      setProject((prev) => (prev.slug === next.slug ? prev : next));
    };
    sync();
    return subscribeCorridorProgress(sync);
  }, []);

  if (!project.href) return null;

  return (
    <Link
      key={project.slug}
      href={project.href}
      data-hero-project-link
      aria-label={`View ${project.name} project`}
      className="group absolute inset-y-[3%] right-[3%] left-[22%] rounded-[16px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* Scrim over the readable core: enough to seat the CTA, never a recolour. */}
      <span
        aria-hidden
        data-hero-project-scrim
        className="pointer-events-none absolute inset-0 rounded-[16px] bg-[#150E34]/[0.12] dark:bg-[#150E34]/[0.2]"
      />
      <span
        aria-hidden
        data-hero-project-cue
        className="pointer-events-none absolute top-1/2 left-1/2 grid size-[clamp(96px,7.2vw,112px)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_20px_45px_-28px_rgba(21,14,52,0.85)]"
      >
        <span className="flex flex-col items-center gap-1">
          <span className={`${microLabel} text-center leading-[1.4]`}>
            View
            <br />
            Project
          </span>
          <span className="text-[15px] leading-none">↗</span>
        </span>
      </span>
    </Link>
  );
}
