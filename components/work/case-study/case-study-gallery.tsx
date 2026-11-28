import Image from "next/image";
import type { CaseStudyMedia, CaseStudyMediaBlock } from "@/lib/case-study";

/**
 * Reusable editorial media renderer.
 *
 * Every frame keeps its source's intrinsic aspect ratio and uses `object-fit:
 * cover` with a matching ratio, so guidelines, typography, logos and screenshots
 * are shown whole rather than cropped. Paired blocks only share a column width;
 * they never share a forced crop. The hero cover is rendered separately and is
 * never duplicated here.
 */

const SIZES = {
  full: "(min-width: 1024px) 880px, 92vw",
  pair: "(min-width: 1024px) 440px, (min-width: 640px) 45vw, 92vw",
  portrait: "(min-width: 1024px) 460px, 80vw",
  "portrait-pair":
    "(min-width: 1024px) 320px, (min-width: 640px) 44vw, 72vw",
} as const;

type MediaLayout = keyof typeof SIZES;

function MediaFigure({
  media,
  layout,
}: {
  media: CaseStudyMedia;
  layout: MediaLayout;
}) {
  return (
    <figure data-case-media={layout}>
      <div
        data-case-media-frame
        style={{ aspectRatio: `${media.width} / ${media.height}` }}
      >
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes={SIZES[layout]}
          className="object-cover"
        />
      </div>
      {media.caption ? (
        <figcaption className="mt-2.5 text-xs leading-snug text-muted-foreground">
          {media.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function CaseStudyGallery({
  blocks,
}: {
  blocks: readonly CaseStudyMediaBlock[];
}) {
  return (
    <div data-case-gallery>
      {blocks.map((block, index) => {
        if (block.layout === "pair" || block.layout === "portrait-pair") {
          return (
            <div
              key={`${block.layout}-${index}`}
              data-case-media-grid={block.layout}
            >
              <MediaFigure media={block.left} layout={block.layout} />
              <MediaFigure media={block.right} layout={block.layout} />
            </div>
          );
        }

        return (
          <div key={`${block.layout}-${index}`} data-case-media-grid={block.layout}>
            <MediaFigure media={block.media} layout={block.layout} />
          </div>
        );
      })}
    </div>
  );
}
