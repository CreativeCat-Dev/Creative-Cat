import type {
  CrewMember,
  DoodleKind,
  FooterAction,
  FooterColumn,
} from "@/components/ui/doodle-crew-footer";
import DoodleCrewFooter from "@/components/ui/doodle-crew-footer";
import { Logo } from "@/components/layout/logo";
import { FOOTER_CAPABILITIES, FOOTER_COPYRIGHT, FOOTER_PAGES } from "./footer.data";

/**
 * The site footer, rendered by the finished Doodle Crew Footer.
 *
 * The component draws its own `<footer>` landmark, so this module only wraps it
 * in the shell that carries the header-surface contract. Wrapping it in a second
 * `<footer>` would give the document two landmarks for one region.
 *
 * The footer follows the page theme through CSS only. Its palette is a set of
 * `--cc-footer-*` variables declared on `:root` and `.dark`, so toggling the
 * theme class recolours the live footer instantly: no React theme state, no
 * remount, no replayed entrance and no reset crew, gaze or speech state.
 *
 * `data-header-surface="inherit"` is the theme-following mode: the navbar takes
 * the page foreground, which is exactly what sits behind it in either theme.
 *
 * `brandMark` passes the site's own `Logo` in place of the component's demo
 * badge, so the footer carries the same identity as the navbar without this
 * component ever importing the navbar.
 *
 * Everything else here is configuration, not implementation: doodles, crew
 * roles and seats come from the finished component; copy, link columns and
 * actions come from this site's own footer data.
 */

// The Creative Cat palette, resolved in CSS per theme. The component derives
// every muted tone, hairline and shadow from these, so light mode is white
// paper with midnight ink and dark mode is the approved midnight surface.
const BRAND = {
  background: "var(--cc-footer-bg)",
  ink: "var(--cc-footer-ink)",
  accent: "var(--cc-footer-accent)",
  depth: "var(--cc-footer-depth)",
  // The coral CTA is coral in both themes, so its label is always midnight.
  onAccent: "var(--cc-footer-on-accent)",
};

const COLUMNS: FooterColumn[] = [
  {
    title: "01 / Pages",
    links: FOOTER_PAGES.map(({ label, href }) => ({ label, href })),
  },
  {
    title: "02 / Capabilities",
    links: FOOTER_CAPABILITIES.map(({ label, href }) => ({ label, href })),
  },
];

const ACTIONS: FooterAction[] = [
  { label: "Let's talk", href: "/contact", icon: "mail", variant: "solid" },
  { label: "See our work", href: "/work", icon: "target", variant: "outline" },
];

// Art direction for the drifting ink, from the reference demo.
const DOODLES: DoodleKind[] = [
  "megaphone",
  "chart",
  "target",
  "bulb",
  "hashtag",
  "mail",
  "coin",
  "heart",
];

/**
 * Five crew members, every one of them a cat: the drawing set's `artist`,
 * `cat`, `sleeper`, `filmmaker` and `coder` roles all share the same seated cat
 * body. The reference demo's `mushroom` sat at letter 2; it is replaced by the
 * built-in `cat` role with its own default name and line, which keeps the seat,
 * offset and scale the demo had tuned for that letter.
 */
const CREW: CrewMember[] = [
  {
    kind: "artist",
    letter: 0,
    offset: -0.3,
    flip: true,
    name: "Bruno",
    says: "Hold still. I'm sketching you.",
  },
  {
    kind: "cat",
    letter: 2,
    seat: "front",
    offset: 0.12,
    scale: 0.95,
    name: "Patch",
    says: "Arr. Nice cursor.",
  },
  {
    kind: "sleeper",
    letter: 4,
    name: "Pip",
    says: "Zzz… Q4 campaign… zzz.",
  },
  {
    kind: "filmmaker",
    letter: 7,
    offset: 0.4,
    scale: 0.85,
    name: "Juno",
    says: "And… action!",
  },
  {
    kind: "coder",
    letter: 11,
    offset: 0.4,
    scale: 0.9,
    name: "Boo",
    says: "Shh. Shipping.",
  },
];

export function Footer() {
  return (
    <div data-footer data-header-surface="inherit">
      <DoodleCrewFooter
        wordmark="CREATIVE CAT"
        brandMark={<Logo className="h-9 w-auto md:h-10" />}
        blurb="Independent Creative Studio"
        tagline="Let's create something great"
        copyright={FOOTER_COPYRIGHT}
        columns={COLUMNS}
        actions={ACTIONS}
        legal={[]}
        socials={[]}
        palette={BRAND}
        doodles={DOODLES}
        crew={CREW}
      />
    </div>
  );
}
