import Image from "next/image";
import type { WorkProject } from "@/lib/work";
import { cn } from "@/lib/utils";

/**
 * One project card, as it appears in the hero corridor.
 *
 * Geometry is fixed for every project: a 4:5 outer card. The artwork now fills
 * that card edge to edge. `cover` assets crop into the portrait box; `contain`
 * assets keep their complete square composition over an artwork-matched blurred
 * extension, so logo-heavy covers never expose a pale letterbox strip.
 *
 * The only readable chrome is a 1px glass rim and inner highlight in
 * `app/globals.css`; the project name and counter live in real HTML beside the
 * card. DEL-01D removed the focal project interaction, so the card has no hover
 * push-in, no scrim and no hidden activation target: it is decorative artwork.
 */
export function HeroCard({
  project,
  priority = false,
  sizes,
  className,
}: {
  project: WorkProject;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  const contained = project.fit === "contain";
  const objectPosition = project.objectPosition
    ? { objectPosition: project.objectPosition }
    : undefined;

  return (
    <div
      className={cn(
        "hero-card relative aspect-[4/5] overflow-hidden rounded-[20px]",
        className
      )}
    >
      <div className="absolute inset-[1px] overflow-hidden rounded-[19px]">
        {/* Artwork-matched extension for square/logo-heavy covers. It is a
            separate decorative copy, not a blur over the readable artwork. */}
        {contained ? (
          <div
            aria-hidden
            data-hero-card-fill
            className="pointer-events-none absolute inset-0"
          >
            <Image
              src={project.src}
              alt=""
              fill
              sizes={sizes}
              className="scale-110 object-cover opacity-90 blur-[18px] brightness-[0.92] saturate-[1.05] dark:opacity-80 dark:brightness-[0.78]"
            />
          </div>
        ) : null}

        <div data-hero-card-art className="absolute inset-0 overflow-hidden">
          <Image
            src={project.src}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className={contained ? "object-contain" : "object-cover"}
            style={objectPosition}
          />
        </div>
      </div>
    </div>
  );
}
