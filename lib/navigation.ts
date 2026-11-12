export type NavItem = {
  index: string;
  label: string;
  href: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { index: "01", label: "Work", href: "/work" },
  { index: "02", label: "Services", href: "/services" },
  { index: "03", label: "About", href: "/about" },
  { index: "04", label: "Contact", href: "/contact" },
];

/**
 * Active-link test for the primary routes.
 *
 * Prefix matching keeps "Work" active on "/work/[slug]". The root case is
 * special-cased so "/" does not match every pathname.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
