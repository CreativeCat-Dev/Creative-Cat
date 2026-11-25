/**
 * The project collection, in canonical order.
 *
 * Array order *is* the `01 / 13 → 13 / 13` order shown by the hero corridor and
 * by anything else that later consumes this collection, so the list is never
 * re-sorted at a call site. There is no separate index field to drift out of
 * step with it.
 *
 * Asset policy for HERO-00a: the supplied covers were moved into
 * `public/work/<slug>/cover.png` byte-for-byte — no crop, resize or recompress.
 * They are 424–463 px square, all fully opaque (the alpha channel exists but is
 * unused), so the corridor's 4:5 card cannot be filled without a decision:
 *
 * - `fit: "cover"` fills the 4:5 card and crops ~10% of each side. Used only
 *   where the crop lands on flat brand colour or decorative framing.
 * - `fit: "contain"` shows the artwork whole over an artwork-matched blurred
 *   extension painted by `HeroCard`, so the card remains edge-to-edge without
 *   cropping logos, project names or other edge-critical type.
 *
 * `category` comes from the published portfolio where it exists. `year` is null
 * everywhere because no project year is published; do not guess one.
 *
 * Resolution note for later: these are presentation covers at roughly 430 px.
 * At a 300–360 px card they are fine at 1×, and visibly soft on a 2× display.
 * Higher-resolution covers remain an outstanding asset task, not a blocker.
 */

export type WorkFit = "cover" | "contain";

export type WorkProject = {
  /** URL-safe identity, also the asset folder name. */
  slug: string;
  name: string;
  category: string | null;
  year: number | null;
  src: string;
  /** Intrinsic pixel size of the supplied file. */
  width: number;
  height: number;
  fit: WorkFit;
  /** Only set where a centred crop would lose the subject. */
  objectPosition?: string;
  /**
   * Published project destination. Optional on purpose: the hero may only offer
   * "View project" where a real page exists, and no route is invented for the
   * others. Unset for every project until WEB-04 publishes case studies, which
   * is why the hero's focal interaction currently renders nothing.
   */
  href?: string;
};

export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    slug: "right-sight",
    name: "Right Sight",
    category: "Branding",
    year: null,
    src: "/work/right-sight/cover.png",
    width: 428,
    height: 438,
    fit: "contain",
  },
  {
    slug: "zero",
    name: "Zero",
    category: "Branding",
    year: null,
    src: "/work/zero/cover.png",
    width: 424,
    height: 418,
    fit: "cover",
  },
  {
    slug: "exciting-sundarban",
    name: "Exciting Sundarban",
    category: "Branding",
    year: null,
    src: "/work/exciting-sundarban/cover.png",
    width: 431,
    height: 431,
    fit: "cover",
  },
  {
    slug: "splash-shine",
    name: "Splash Shine",
    category: "Branding",
    year: null,
    src: "/work/splash-shine/cover.png",
    width: 427,
    height: 431,
    fit: "contain",
  },
  {
    slug: "gdri",
    name: "GDRI",
    category: "Branding",
    year: null,
    src: "/work/gdri/cover.png",
    width: 435,
    height: 432,
    fit: "contain",
  },
  {
    slug: "project-we",
    name: "Project WE",
    category: "Social Media",
    year: null,
    src: "/work/project-we/cover.png",
    width: 443,
    height: 451,
    fit: "contain",
  },
  {
    slug: "zero-blind-spots",
    name: "Zero Blind Spots",
    // Not in the published collection, so no category is asserted.
    category: null,
    year: null,
    src: "/work/zero-blind-spots/cover.png",
    width: 460,
    height: 457,
    fit: "contain",
  },
  {
    slug: "dipakkhik",
    name: "Dipakkhik",
    category: "Branding",
    year: null,
    src: "/work/dipakkhik/cover.png",
    width: 437,
    height: 411,
    fit: "contain",
  },
  {
    slug: "urbancut",
    name: "Urbancut",
    category: "Branding",
    year: null,
    src: "/work/urbancut/cover.png",
    width: 463,
    height: 459,
    fit: "cover",
  },
  {
    slug: "oralshine",
    name: "OralShine",
    category: "Branding",
    year: null,
    src: "/work/oralshine/cover.png",
    width: 432,
    height: 434,
    fit: "contain",
  },
  {
    slug: "flex",
    name: "FLEX",
    category: "Branding",
    year: null,
    src: "/work/flex/cover.png",
    width: 431,
    height: 434,
    fit: "cover",
  },
  {
    slug: "elegantic",
    name: "Elegantic",
    category: "Branding",
    year: null,
    src: "/work/elegantic/cover.png",
    width: 442,
    height: 431,
    fit: "cover",
  },
  {
    slug: "yogic-rhythm",
    name: "Yogic Rhythm",
    category: "Social Media",
    year: null,
    src: "/work/yogic-rhythm/cover.png",
    width: 445,
    height: 442,
    fit: "contain",
  },
];

/** Number of projects in the collection — the denominator of the hero counter. */
export const WORK_PROJECT_COUNT = WORK_PROJECTS.length;

/**
 * Whether the collection has any published destination at all.
 *
 * The hero reads this once to decide whether the focal interaction layer exists.
 * With no destinations it renders no layer, no anchor and no CTA, so the shipped
 * DOM cannot contain a dead link or an extra tab stop.
 */
export const HAS_WORK_DESTINATIONS = WORK_PROJECTS.some((project) => Boolean(project.href));
