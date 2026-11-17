import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { focusRing, microLabel } from "@/lib/ui";
import { FOOTER_CAPABILITIES, FOOTER_PAGES, type FooterEntry } from "./footer.data";

/**
 * Pages link treatment. The arrow is always in the layout and only fades in, so
 * hovering never reflows the row. Colour and opacity transitions are kept; the
 * two position changes are gated behind `motion-safe`, which makes reduced
 * motion get the end state instantly instead of a lift.
 */
function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className={`group/link inline-flex items-baseline gap-1.5 rounded-sm text-sm text-foreground ${focusRing}`}
    >
      <span className="relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-primary group-hover/link:after:scale-x-100 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover/link:-translate-y-0.5 motion-safe:after:transition-transform motion-safe:after:duration-200">
        {children}
      </span>

      <svg
        viewBox="0 0 10 10"
        aria-hidden
        className="size-2.5 opacity-0 transition-opacity duration-200 group-focus-visible/link:opacity-100 group-hover/link:opacity-100 motion-safe:duration-200 motion-safe:group-hover/link:-translate-y-[1px] motion-safe:group-hover/link:translate-x-[3px] motion-safe:transition-[opacity,transform]"
      >
        <path
          d="M1 9 9 1M3.5 1H9v5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="square"
        />
      </svg>
    </Link>
  );
}

type FooterColumnProps = {
  /** Decorative section number; hidden from assistive tech. */
  number: string;
  title: string;
  items: readonly FooterEntry[];
  /** Flow the list into two columns on wide screens, reading down then across. */
  split?: boolean;
};

function FooterColumn({ number, title, items, split = false }: FooterColumnProps) {
  return (
    <div>
      <h2 className={`text-muted-foreground ${microLabel}`}>
        <span aria-hidden className="mr-2">
          {number} /
        </span>
        {title}
      </h2>

      {/*
        `grid-flow-col` + explicit rows fills the list down the first column and
        then across, which is the reading order the composition implies. A plain
        two-column grid would fill row-wise and pair the wrong entries.
      */}
      <ul
        className={`mt-5 flex flex-col gap-2.5 ${
          split ? "lg:grid lg:grid-flow-col lg:grid-rows-3 lg:gap-x-10" : ""
        }`}
      >
        {items.map((item) => (
          <li key={item.label} data-footer-row>
            {item.href ? (
              <FooterLink href={item.href}>{item.label}</FooterLink>
            ) : (
              <span className="inline-block text-sm text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Three areas at 40 / 20 / 40 on wide screens: the brand gets the room, Pages
 * stays compact, Capabilities splits into two internal columns so it stops
 * reading as one long list.
 *
 * The two lists stay inside a single `nav` landmark; the outer 4fr/6fr split and
 * the inner 1fr/2fr split are what produce the 40/20/40 ratio without a third
 * grid track.
 */
export function FooterGrid() {
  return (
    <div className="grid lg:grid-cols-[4fr_6fr] lg:gap-14 sm:gap-10 md:gap-12">
      <div data-footer-group className="pb-8 sm:pb-0">
        <Logo className="h-11 md:h-12 lg:h-14" />
        <p className={`mt-5 text-muted-foreground ${microLabel}`}>Independent Creative Studio</p>
      </div>

      <nav
        aria-label="Footer"
        className="grid border-t border-border pt-8 sm:border-t-0 sm:pt-0 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1fr_2fr]"
      >
        <div data-footer-group className="pb-8 sm:pb-0">
          <FooterColumn number="01" title="Pages" items={FOOTER_PAGES} />
        </div>

        <div
          data-footer-group
          className="border-t border-border pt-8 sm:border-t-0 sm:pt-0"
        >
          <FooterColumn number="02" title="Capabilities" items={FOOTER_CAPABILITIES} split />
        </div>
      </nav>
    </div>
  );
}
