import { WORK_PROJECTS } from "@/lib/work";

/**
 * DEL-01D / DEL-01D.1 / DEL-01D.2 — the Work archive's editorial composition.
 *
 * This is presentation metadata only. Names, categories, links and artwork
 * still come from the single canonical collection in `lib/work.ts`; the list
 * below never reorders that collection, it only decides how `/work` sequences
 * and frames it. Descriptions either reuse the verified copy already shipped on
 * the homepage gallery or describe only what the supplied artwork shows. Tags
 * reuse the published taxonomy or the service labels already visible on the live
 * portfolio. No scope, stack, metric, year, client or outcome is invented.
 *
 * The desktop rhythm repeats deliberately:
 *
 *   full-width feature → staggered pair → full-width feature → …
 *
 * Each row states its own composition so the DOM stays in reading order and no
 * card is selected by `nth-child`. Visual, DOM and keyboard order therefore
 * agree, and every row group is also the accessibility reading order.
 *
 * DEL-01D.2 gives the five standalone projects the whole 1200px measure in a
 * controlled cinematic frame instead of their native ratio. That is a deliberate
 * crop inside a stationary frame, not a distortion:
 *
 * - square 1254x1254 sources use a 15:7 frame (1200x560 at desktop),
 * - landscape 1672x941 sources use a 30:11 frame (1200x440 at desktop),
 * - `featurePosition` is the artwork-specific vertical focal point, chosen after
 *   inspecting each cover so the logo, subject and brand typography survive.
 *
 * The frame falls back to the native ratio below 768px, where the complete
 * artwork matters more than cinematic width.
 */

export type WorkArchiveLayout =
  | "feature"
  | "pair-left"
  | "pair-right"
  | "closing";

export type WorkArchiveFeatureFit = {
  /** Desktop cinematic frame, as a CSS `aspect-ratio` value. */
  aspect: string;
  /** Desktop `object-position`; the vertical focal point of the crop. */
  position: string;
};

export type WorkArchiveEntry = {
  slug: string;
  layout: WorkArchiveLayout;
  /** Visual row; a staggered pair shares one row. */
  row: number;
  description: string;
  tags: readonly string[];
  /** Present only on standalone full-width features and the closing feature. */
  featureFit?: WorkArchiveFeatureFit;
};

export const WORK_ARCHIVE: readonly WorkArchiveEntry[] = [
  {
    slug: "right-sight",
    layout: "feature",
    row: 1,
    description:
      "Brand identity and education collateral, from brand kit to lanyards.",
    tags: ["Brand identity", "Education"],
    // Square source: bias slightly above centre so the badge portraits, brand
    // kit wordmark and guideline book all remain inside the 15:7 crop.
    featureFit: { aspect: "15 / 7", position: "50% 38%" },
  },
  {
    slug: "exciting-sundarban",
    layout: "pair-left",
    row: 2,
    description: "Brand identity artwork for Exciting Sundarban.",
    tags: ["Branding"],
  },
  {
    slug: "splash-shine",
    layout: "pair-right",
    row: 2,
    description: "Print design and brand collateral for Splash n Shine Carwash.",
    tags: ["Print design", "Brand collateral"],
  },
  {
    slug: "zero",
    layout: "feature",
    row: 3,
    description: "Brand identity artwork for Zero.",
    tags: ["Branding"],
    // Landscape source: a near-centre focal point keeps the ZERO wordmark on
    // the orange disc while retaining both planetary arcs.
    featureFit: { aspect: "30 / 11", position: "50% 45%" },
  },
  {
    slug: "gdri",
    layout: "pair-left",
    row: 4,
    description:
      "Brand identity for the Global Development & Research Initiative.",
    tags: ["Branding"],
  },
  {
    slug: "project-we",
    layout: "pair-right",
    row: 4,
    description: "Social media artwork from the Project WE education story.",
    tags: ["Social media"],
  },
  {
    slug: "zero-blind-spots",
    layout: "feature",
    row: 5,
    description: "Project artwork for Zero Blind Spots.",
    tags: [],
    // Landscape source: keeps the wordmark and the full camera lens in frame.
    featureFit: { aspect: "30 / 11", position: "50% 45%" },
  },
  {
    slug: "dipakkhik",
    layout: "pair-left",
    row: 6,
    description: "Brand identity artwork for Dipakkhik.",
    tags: ["Branding"],
  },
  {
    slug: "urbancut",
    layout: "pair-right",
    row: 6,
    description: "Brand identity and lifestyle imagery for Urbancut Salon.",
    tags: ["Brand identity", "Lifestyle"],
  },
  {
    slug: "oralshine",
    layout: "feature",
    row: 7,
    description: "Brand identity artwork for OralShine.",
    tags: ["Branding"],
    // Square source with the logo and headline in the upper third: the crop
    // starts high so both survive while the smiling subject still anchors it.
    featureFit: { aspect: "15 / 7", position: "50% 17%" },
  },
  {
    slug: "flex",
    layout: "pair-left",
    row: 8,
    description: "Brand identity artwork for FLEX.",
    tags: ["Branding"],
  },
  {
    slug: "elegantic",
    layout: "pair-right",
    row: 8,
    description: "Brand identity artwork for Elegantic.",
    tags: ["Branding"],
  },
  {
    slug: "yogic-rhythm",
    layout: "closing",
    row: 9,
    description: "Social media artwork for Yogic Rhythm.",
    tags: ["Social media"],
    // The subject's head and hands sit high in the source; a centre crop would
    // decapitate the composition, so the focal point is raised to keep the
    // figure, the moon and the wordmark together.
    featureFit: { aspect: "30 / 11", position: "50% 35%" },
  },
];

export type WorkArchiveRow = {
  row: number;
  layout: WorkArchiveLayout;
  entries: readonly WorkArchiveEntry[];
};

/**
 * Group the presentation sequence into visual rows without changing canonical
 * data. The build fails if the archive ever drifts from the collection or
 * repeats a project, rather than silently dropping a card.
 */
export function getWorkArchiveRows(): readonly WorkArchiveRow[] {
  const seen = new Set<string>();
  const rows = new Map<number, WorkArchiveEntry[]>();

  for (const entry of WORK_ARCHIVE) {
    if (!WORK_PROJECTS.some((project) => project.slug === entry.slug)) {
      throw new Error(`Work archive references an unpublished slug: ${entry.slug}`);
    }
    if (seen.has(entry.slug)) {
      throw new Error(`Work archive repeats a project: ${entry.slug}`);
    }
    seen.add(entry.slug);

    const bucket = rows.get(entry.row);
    if (bucket) bucket.push(entry);
    else rows.set(entry.row, [entry]);
  }

  if (seen.size !== WORK_PROJECTS.length) {
    throw new Error(
      `Work archive lists ${seen.size} of ${WORK_PROJECTS.length} canonical projects.`,
    );
  }

  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([row, entries]) => ({
      row,
      layout: entries[0].layout,
      entries,
    }));
}
