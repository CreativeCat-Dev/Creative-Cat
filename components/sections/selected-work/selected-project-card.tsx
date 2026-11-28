import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { WorkProject } from "@/lib/work";
import type {
  SelectedWorkEntry,
  SelectedWorkVariant,
} from "./selected-work.data";

/**
 * One homepage Selected Projects card.
 *
 * Two explicit presentation variants:
 *
 * - `opening` (Zero) keeps the DEL-01A circular reveal, lift/zoom hover, arrow
 *   action and exact DOM. No perspective wrapper or handler is rendered.
 * - `perspective` (the other six) wraps the artwork panel in a CSS perspective
 *   context; GSAP rotates the panel on fine-pointer hover while the caption and
 *   tags stay stationary.
 *
 * Transform ownership for the perspective variant:
 *
 *   1. `[data-sw-card]`       — existing GSAP whole-card scroll movement.
 *   2. `[data-sw-perspective]` — CSS perspective context only.
 *   3. `[data-sw-panel]`      — GSAP rotateY / rotateX hover.
 *   4. `[data-sw-parallax]`   — existing GSAP inner drift.
 *   5. `[data-sw-action]`     — CSS colour / scale / icon transition.
 *
 * The whole card remains one semantic link; the action circle is decorative.
 */

function ArrowIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden>
      <path
        d="M1.4 8.6 8.6 1.4M3.2 1.4h5.4v5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="square"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden>
      <path
        d="M6 1.25v9.5M1.25 6h9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}

type SelectedProjectCardProps = {
  project: WorkProject;
  entry: SelectedWorkEntry;
  priority?: boolean;
};

export function SelectedProjectCard({
  project,
  entry,
  priority = false,
}: SelectedProjectCardProps) {
  const alt = `${project.name} project artwork`;
  const variant: SelectedWorkVariant = entry.variant;
  const isPerspective = variant === "perspective";

  const mediaStyle = {
    "--sw-aspect": entry.aspect,
  } as CSSProperties;

  const media = (
    <div data-sw-media style={mediaStyle}>
      <div data-sw-parallax>
        <Image
          data-sw-image
          src={project.src}
          alt={alt}
          fill
          sizes={entry.sizes}
          priority={priority}
          draggable={false}
          style={{
            objectFit: "cover",
            objectPosition: project.objectPosition ?? "center",
          }}
        />
      </div>

      <span
        data-sw-action
        data-sw-action-icon={isPerspective ? "plus" : "arrow"}
        aria-hidden
      >
        {isPerspective ? <PlusIcon /> : <ArrowIcon />}
      </span>
    </div>
  );

  return (
    <article
      data-sw-card
      data-sw-variant={variant}
      data-sw-slug={project.slug}
    >
      <Link
        href={project.href ?? "/work"}
        aria-label={`View ${project.name} project`}
        data-sw-link
      >
        <div data-sw-shell>
          {isPerspective ? (
            <div data-sw-perspective>
              <div data-sw-panel>{media}</div>
            </div>
          ) : (
            media
          )}

          <div data-sw-info>
            <div data-sw-head>
              <h3 data-sw-name>{project.name}</h3>
              <p data-sw-tags>
                {entry.tags.map((tag, index) => (
                  <span key={tag} data-sw-tag>
                    {index > 0 ? (
                      <span aria-hidden data-sw-tag-sep>
                        /
                      </span>
                    ) : null}
                    {tag}
                  </span>
                ))}
              </p>
            </div>
            <p data-sw-desc>{entry.description}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}
