import { NAV_ITEMS } from "@/lib/navigation";

export type FooterEntry = {
  label: string;
  href?: string;
};

export const FOOTER_PAGES: readonly FooterEntry[] = NAV_ITEMS.map(({ label, href }) => ({
  label,
  href,
}));

export const FOOTER_CAPABILITIES: readonly FooterEntry[] = [
  { label: "Brand Strategy" },
  { label: "Identity & Design" },
  { label: "Digital Experiences" },
  { label: "Motion & Content" },
  { label: "Web Development" },
  { label: "Digital Growth" },
];

export const FOOTER_COPYRIGHT = "\u00A9 2026 Creative Cat";
