import { NAV_ITEMS } from "@/lib/navigation";

export type FooterEntry = {
  label: string;
  href?: string;
};

/** Pages reuse the navigation source of truth; `index` is menu-only. */
export const FOOTER_PAGES: readonly FooterEntry[] = NAV_ITEMS.map(({ label, href }) => ({
  label,
  href,
}));

/**
 * Capability names come from context/07_CONTENT_MODEL.md.
 *
 * Deliberately not links: no per-capability destination exists yet, and pointing
 * six entries at /services would be six duplicate targets. They become links when
 * capability anchors or pages exist.
 */
export const FOOTER_CAPABILITIES: readonly FooterEntry[] = [
  { label: "Brand Strategy" },
  { label: "Identity & Design" },
  { label: "Digital Experiences" },
  { label: "Motion & Content" },
  { label: "Web Development" },
  { label: "Digital Growth" },
];

/**
 * Hardcoded rather than computed: the site is statically rendered, so a runtime
 * date call would only appear dynamic while being frozen at build time.
 */
export const FOOTER_COPYRIGHT = "\u00A9 2026 Creative Cat";
