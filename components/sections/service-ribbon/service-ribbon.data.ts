/**
 * DEL-00.2 / DEL-00.2A — service ribbon content.
 *
 * One ordered source for the seven services. The Services page should import
 * this array rather than duplicating the labels. The decorative ribbon text is
 * uppercase because it is display typography, not prose.
 */

export const SERVICE_RIBBON_LABELS = [
  "Strategy & Consulting",
  "Brand Identity",
  "UI/UX & Web Development",
  "CRM Solutions",
  "Graphic Design",
  "Video & Motion",
  "SEO & Performance Marketing",
] as const;

export const SERVICE_RIBBON_STAR = "✦";

/** Star relative size: a small separator, not a headline glyph. */
export const SERVICE_RIBBON_STAR_SCALE = 0.62;

/**
 * One full cycle as SVG markup: every label followed by a smaller star tspan,
 * units separated by two spaces, and a trailing gap. This markup is the server
 * and no-JavaScript presentation too, so the refined separator is present before
 * hydration. `&#160;` keeps the gaps in every browser under
 * `xml:space="preserve"`.
 */
export function serviceRibbonUnitMarkup(): string {
  const star = `<tspan font-size="${SERVICE_RIBBON_STAR_SCALE}em">${SERVICE_RIBBON_STAR}</tspan>`;
  return `${SERVICE_RIBBON_LABELS.map((label) => `${label.toUpperCase()}&#160;${star}`).join(
    "&#160;&#160;",
  )}&#160;&#160;`;
}

export function serviceRibbonMarkup(repeat: number): string {
  return serviceRibbonUnitMarkup().repeat(Math.max(1, Math.floor(repeat)));
}
