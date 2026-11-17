/**
 * Hero copy lives here so the composition reads as layout and the words stay
 * editable in one place. The eyebrow is stored in sentence case because the
 * shared `microLabel` treatment uppercases it.
 */

export const HERO_EYEBROW = "Design · Branding · Motion · Development";

/**
 * Three explicit lines rather than one wrapping string: the headline is the
 * largest type on the site and its breaks are a composition decision, not
 * something the viewport should decide. Each entry renders inside its own
 * overflow mask, which is what the motion batch will animate.
 */
export const HERO_HEADLINE = ["Ideas into", "brands that", "move."] as const;

export const HERO_BODY =
  "We shape ideas into distinctive brands and digital experiences through strategy, design, motion, and development.";

export type HeroCta = {
  label: string;
  href: string;
};

export const HERO_CTA_PRIMARY: HeroCta = { label: "Start a project", href: "/contact" };
export const HERO_CTA_SECONDARY: HeroCta = { label: "View selected work", href: "/work" };

/** Caption for the media aperture, aligned under its column in the base rule. */
export const HERO_REEL_CAPTION = "Studio reel — 2026";
