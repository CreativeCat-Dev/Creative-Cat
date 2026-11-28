/**
 * The project collection, in canonical order.
 *
 * Array order *is* the `01 / 13 → 13 / 13` order shown by the hero corridor and
 * by anything else that later consumes this collection, so the list is never
 * re-sorted at a call site. There is no separate index field to drift out of
 * step with it.
 *
 * Asset policy (DEL-01C): each project has exactly one authoritative
 * `public/work/<slug>/cover.png`, supplied byte-for-byte by the owner. Ten are
 * 1254x1254 squares; Zero, Zero Blind Spots and Yogic Rhythm are 1672x941.
 * `src` is the canonical `coverSrc(slug)` URL, including the artwork revision
 * that invalidates a stale optimizer cache entry. No consumer overrides it and
 * no second artwork collection exists.
 *
 * The hero corridor still presents every cover inside a fixed 4:5 card, so
 * `fit` records the one presentation decision that artwork needs there:
 *
 * - `fit: "cover"` fills the 4:5 card and crops the sides.
 * - `fit: "contain"` shows the artwork whole over an artwork-matched blurred
 *   extension painted by `HeroCard`.
 *
 * That is presentation geometry, not source identity. The Work index and the
 * project showcase use the actual `width` / `height` and never crop.
 *
 * `category` comes from the published portfolio where it exists. `year` is null
 * everywhere because no project year is published; do not guess one.
 */

import { coverSrc } from "./artwork";

export type WorkFit = "cover" | "contain";

export type WorkProject = {
  /** URL-safe identity, also the asset folder name. */
  slug: string;
  name: string;
  category: string | null;
  year: number | null;
  /** Canonical cover URL, revisioned in `lib/artwork.ts`. */
  src: string;
  /** Intrinsic pixel size of the canonical cover. */
  width: number;
  height: number;
  /** Hero card filling policy only. Never used to crop the archive/detail. */
  fit: WorkFit;
  /** Only set where a centred crop would lose the subject. */
  objectPosition?: string;
  /**
   * The published project page. Every canonical project has a real
   * `/work/[slug]` showcase. No route is invented for a slug that is not in
   * this collection.
   */
  href?: string;
};

export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    slug: "right-sight",
    name: "Right Sight",
    category: "Branding",
    year: null,
    src: coverSrc("right-sight"),
    width: 1254,
    height: 1254,
    fit: "contain",
    href: "/work/right-sight",
  },
  {
    slug: "zero",
    name: "Zero",
    category: "Branding",
    year: null,
    src: coverSrc("zero"),
    width: 1672,
    height: 941,
    fit: "cover",
    href: "/work/zero",
  },
  {
    slug: "exciting-sundarban",
    name: "Exciting Sundarban",
    category: "Branding",
    year: null,
    src: coverSrc("exciting-sundarban"),
    width: 1254,
    height: 1254,
    fit: "cover",
    href: "/work/exciting-sundarban",
  },
  {
    slug: "splash-shine",
    name: "Splash Shine",
    category: "Branding",
    year: null,
    src: coverSrc("splash-shine"),
    width: 1254,
    height: 1254,
    fit: "contain",
    href: "/work/splash-shine",
  },
  {
    slug: "gdri",
    name: "GDRI",
    category: "Branding",
    year: null,
    src: coverSrc("gdri"),
    width: 1254,
    height: 1254,
    fit: "contain",
    href: "/work/gdri",
  },
  {
    slug: "project-we",
    name: "Project WE",
    category: "Social Media",
    year: null,
    src: coverSrc("project-we"),
    width: 1254,
    height: 1254,
    fit: "contain",
    href: "/work/project-we",
  },
  {
    slug: "zero-blind-spots",
    name: "Zero Blind Spots",
    // Not in the published collection, so no category is asserted.
    category: null,
    year: null,
    src: coverSrc("zero-blind-spots"),
    width: 1672,
    height: 941,
    fit: "contain",
    href: "/work/zero-blind-spots",
  },
  {
    slug: "dipakkhik",
    name: "Dipakkhik",
    category: "Branding",
    year: null,
    src: coverSrc("dipakkhik"),
    width: 1254,
    height: 1254,
    fit: "contain",
    href: "/work/dipakkhik",
  },
  {
    slug: "urbancut",
    name: "Urbancut",
    category: "Branding",
    year: null,
    src: coverSrc("urbancut"),
    width: 1254,
    height: 1254,
    fit: "cover",
    href: "/work/urbancut",
  },
  {
    slug: "oralshine",
    name: "OralShine",
    category: "Branding",
    year: null,
    src: coverSrc("oralshine"),
    width: 1254,
    height: 1254,
    fit: "contain",
    href: "/work/oralshine",
  },
  {
    slug: "flex",
    name: "FLEX",
    category: "Branding",
    year: null,
    src: coverSrc("flex"),
    width: 1254,
    height: 1254,
    fit: "cover",
    href: "/work/flex",
  },
  {
    slug: "elegantic",
    name: "Elegantic",
    category: "Branding",
    year: null,
    src: coverSrc("elegantic"),
    width: 1254,
    height: 1254,
    fit: "cover",
    href: "/work/elegantic",
  },
  {
    slug: "yogic-rhythm",
    name: "Yogic Rhythm",
    category: "Social Media",
    year: null,
    src: coverSrc("yogic-rhythm"),
    width: 1672,
    height: 941,
    fit: "contain",
    href: "/work/yogic-rhythm",
  },
];

/** Number of projects in the collection — the denominator of the hero counter. */
export const WORK_PROJECT_COUNT = WORK_PROJECTS.length;

/** Resolve one canonical project by slug. Case-sensitive, like the route. */
export function getWorkProject(slug: string): WorkProject | undefined {
  return WORK_PROJECTS.find((project) => project.slug === slug);
}

/** Canonical position of a project, or -1 when the slug is not published. */
export function getWorkProjectIndex(slug: string): number {
  return WORK_PROJECTS.findIndex((project) => project.slug === slug);
}

/**
 * The next project in canonical order, wrapping 13 -> 01.
 *
 * The project showcase uses this so "Next Project" never invents an order and
 * every valid showcase has a destination.
 */
export function getNextWorkProject(slug: string): WorkProject {
  const index = getWorkProjectIndex(slug);
  if (index < 0) return WORK_PROJECTS[0];
  return WORK_PROJECTS[(index + 1) % WORK_PROJECTS.length];
}
