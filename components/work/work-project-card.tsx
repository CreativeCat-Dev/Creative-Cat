import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WorkProject } from "@/lib/work";
import type { WorkArchiveEntry, WorkArchiveLayout } from "./work-archive.data";

/**
 * One Work archive card.
 *
 * The whole card is one semantic link. Artwork, name, description and tags stay
 * visually connected; there is no nested button and no second destination.
 *
 * Paired cards keep the canonical artwork ratio, so `object-fit: cover` has
 * nothing to crop. Full-width features receive a cinematic frame from the
 * archive data (`--work-feature-aspect` / `--work-feature-position`) at desktop
 * widths and fall back to the native ratio below 768px, where the complete
 * artwork matters more than width. Hover and keyboard focus scale only the image
 * inside that stationary, clipped frame.
 */

const FEATURE_SIZES = "(min-width: 1328px) 1200px, (min-width: 768px) 91vw, 90vw";

const SIZES: Record<WorkArchiveLayout, string> = {
  feature: FEATURE_SIZES,
  closing: FEATURE_SIZES,
  "pair-left": "(min-width: 1280px) 33vw, (min-width: 768px) 46vw, 92vw",
  "pair-right": "(min-width: 1280px) 33vw, (min-width: 768px) 46vw, 92vw",
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden>
      <path
        d="M1.4 8.6 8.6 1.4M3.2 1.4h5.4v5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}

type WorkProjectCardProps = {
  project: WorkProject;
  entry: WorkArchiveEntry;
  index: number;
  priority?: boolean;
};

export function WorkProjectCard({
  project,
  entry,
  index,
  priority = false,
}: WorkProjectCardProps) {
  const alt = `${project.name} project artwork`;
  const aspect = `${project.width} / ${project.height}`;
  const tags = entry.tags;
  const frameStyle = {
    "--work-native-aspect": aspect,
    ...(entry.featureFit
      ? {
          "--work-feature-aspect": entry.featureFit.aspect,
          "--work-feature-position": entry.featureFit.position,
        }
      : {}),
  } as CSSProperties;

  return (
    <article
      data-work-card
      data-work-item
      data-work-layout={entry.layout}
      data-work-shape={project.width > project.height ? "wide" : "square"}
      data-work-position={index}
      data-work-slug={project.slug}
      className="min-w-0"
    >
      <Link
        href={project.href ?? "/work"}
        aria-label={`View ${project.name} project`}
        data-work-link
        className={cn("group block rounded-[clamp(10px,1vw,14px)] outline-none")}
      >
        <div
          data-work-frame
          style={frameStyle}
          className="relative overflow-hidden rounded-[clamp(10px,1vw,14px)] bg-muted"
        >
          <Image
            data-work-image
            src={project.src}
            alt={alt}
            fill
            sizes={SIZES[entry.layout]}
            priority={priority}
            draggable={false}
            className="object-cover"
            style={
              // Features are positioned by the responsive stylesheet; the
              // native-pair fallback still respects any canonical focal point.
              !entry.featureFit && project.objectPosition
                ? { objectPosition: project.objectPosition }
                : undefined
            }
          />
          <span aria-hidden data-work-ring />
        </div>

        <div data-work-caption>
          <div data-work-heading>
            <h2 data-work-name>{project.name}</h2>
            <span aria-hidden data-work-arrow>
              <ArrowIcon />
            </span>
          </div>

          <p data-work-description>{entry.description}</p>

          {tags.length > 0 ? (
            <ul data-work-tags aria-label={`${project.name} services`}>
              {tags.map((tag) => (
                <li key={tag} data-work-tag>
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
