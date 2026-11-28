import { WORK_PROJECTS } from "@/lib/work";

/**
 * DEL-01A — the homepage Selected Projects composition.
 *
 * This is a presentation layer only. Every name, category, slug and artwork
 * still comes from `lib/work.ts`; this module records the local homepage order,
 * layout, aspect ratio and the small amount of factual caption copy the
 * reference calls for. It never reorders the canonical collection.
 *
 * The order below is a *homepage* edit of the same seven projects. The Work
 * index keeps the canonical order and all thirteen projects.
 *
 * Captions are deliberately conservative. Tags reuse published taxonomy
 * (Branding / Social Media) or the service labels already visible on the live
 * portfolio (Brand identity / Education / Print design / Brand collateral /
 * Lifestyle). Descriptions only describe what the supplied artwork shows; no
 * scope, stack, metric, year or client claim is invented.
 */

export type SelectedWorkLayout =
  | "opening"
  | "left-1"
  | "right-1"
  | "feature-right"
  | "left-2"
  | "right-2"
  | "closing";

export type SelectedWorkVariant = "opening" | "perspective";

export type SelectedWorkEntry = {
  slug: string;
  layout: SelectedWorkLayout;
  /**
   * The opening project keeps the DEL-01A lift/zoom hover and circular reveal.
   * Every subsequent card uses the DEL-01B 3D artwork-panel perspective.
   */
  variant: SelectedWorkVariant;
  /** CSS aspect-ratio for this presentation. */
  aspect: string;
  sizes: string;
  description: string;
  tags: readonly string[];
};

export const SELECTED_WORK: readonly SelectedWorkEntry[] = [
  {
    slug: "zero",
    layout: "opening",
    variant: "opening",
    aspect: "2 / 1",
    sizes: "(min-width: 1600px) 1400px, (min-width: 1024px) 84vw, 94vw",
    // The owner-supplied 1672x941 cover fills the opening without matte bands.
    description: "Brand identity artwork for Zero.",
    tags: ["Branding"],
  },
  {
    slug: "right-sight",
    layout: "left-1",
    variant: "perspective",
    aspect: "1 / 1",
    sizes: "(min-width: 1024px) 52vw, (min-width: 768px) 46vw, 94vw",
    description:
      "Brand identity and education collateral, from brand kit to lanyards.",
    tags: ["Brand identity", "Education"],
  },
  {
    slug: "exciting-sundarban",
    layout: "right-1",
    variant: "perspective",
    aspect: "1 / 1",
    sizes: "(min-width: 1024px) 42vw, (min-width: 768px) 46vw, 94vw",
    description: "Brand identity artwork for Exciting Sundarban.",
    tags: ["Branding"],
  },
  {
    slug: "splash-shine",
    layout: "feature-right",
    variant: "perspective",
    aspect: "1 / 1",
    sizes: "(min-width: 1024px) 68vw, 94vw",
    description: "Print design and brand collateral for Splash n Shine Carwash.",
    tags: ["Print design", "Brand collateral"],
  },
  {
    slug: "gdri",
    layout: "left-2",
    variant: "perspective",
    aspect: "1 / 1",
    sizes: "(min-width: 1024px) 46vw, (min-width: 768px) 46vw, 94vw",
    description:
      "Brand identity for the Global Development & Research Initiative.",
    tags: ["Branding"],
  },
  {
    slug: "project-we",
    layout: "right-2",
    variant: "perspective",
    aspect: "1 / 1",
    sizes: "(min-width: 1024px) 32vw, (min-width: 768px) 46vw, 94vw",
    description: "Social media artwork from the Project WE education story.",
    tags: ["Social media"],
  },
  {
    slug: "urbancut",
    layout: "closing",
    variant: "perspective",
    aspect: "1 / 1",
    sizes: "(min-width: 1024px) 68vw, 94vw",
    description: "Brand identity and lifestyle imagery for Urbancut Salon.",
    tags: ["Brand identity", "Lifestyle"],
  },
];

// Fail the build if a slug ever leaves the canonical collection, rather than
// silently rendering six projects. This module is build-time data.
for (const entry of SELECTED_WORK) {
  if (!WORK_PROJECTS.some((project) => project.slug === entry.slug)) {
    throw new Error(
      `Selected Work references an unpublished project slug: ${entry.slug}`,
    );
  }
}
