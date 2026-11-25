/**
 * Hero copy lives here so the composition reads as layout and the words stay
 * editable in one place. The eyebrow is stored in sentence case because the
 * shared `microLabel` treatment uppercases it.
 */

export const HERO_EYEBROW = "Design · Branding · Motion · Development";

/**
 * The headline is a composition decision, not something the viewport should
 * decide, so every break is explicit. Desktop reads as three lines. The centred
 * compact composition — phones from 375px and the 768–1023px tablet band —
 * reads "Ideas into brands" / "that move."; below 375px the three-line form
 * returns because the joined first line no longer fits the content width.
 *
 * A segment can be shown or hidden only inside the compact band. That keeps one
 * headline, one accessible h1 and one set of overflow masks: there is no
 * duplicate hidden heading and the entrance still targets the same lines.
 * `hideInCompact` removes a whole line from the compact composition.
 */
export type HeroHeadlineSegment = {
  text: string;
  compact?: "show" | "hide";
};

export type HeroHeadlineLine = {
  segments: readonly HeroHeadlineSegment[];
  hideInCompact?: boolean;
};

export const HERO_HEADLINE: readonly HeroHeadlineLine[] = [
  {
    segments: [{ text: "Ideas into" }, { text: " brands", compact: "show" }],
  },
  {
    segments: [
      { text: "brands ", compact: "hide" },
      { text: "that" },
      { text: " move.", compact: "show" },
    ],
  },
  {
    segments: [{ text: "move." }],
    hideInCompact: true,
  },
];

export const HERO_BODY =
  "We shape ideas into distinctive brands and digital experiences through strategy, design, motion, and development.";

export type HeroCta = {
  label: string;
  href: string;
};

export const HERO_CTA_PRIMARY: HeroCta = { label: "Start a project", href: "/contact" };
export const HERO_CTA_SECONDARY: HeroCta = { label: "View selected work", href: "/work" };
