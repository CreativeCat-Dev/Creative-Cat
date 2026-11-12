import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { focusRing, microLabel } from "@/lib/ui";
import { FOOTER_CAPABILITIES, FOOTER_PAGES, type FooterEntry } from "./footer.data";

function FooterColumn({ title, items }: { title: string; items: readonly FooterEntry[] }) {
  return (
    <div>
      <h2 className={`text-muted-foreground ${microLabel}`}>{title}</h2>
      <ul className="mt-5 space-y-2.5">
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className={`inline-block rounded-sm text-sm text-foreground transition-colors hover:text-primary ${focusRing}`}
              >
                {item.label}
              </Link>
            ) : (
              <span className="inline-block text-sm text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FooterGrid() {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-[1.4fr_2fr] lg:gap-14">
      <div className="md:col-span-2 lg:col-span-1">
        <Logo className="h-7 md:h-8" />
        <p className={`mt-5 text-muted-foreground ${microLabel}`}>Independent Creative Studio</p>
      </div>

      <nav
        aria-label="Footer"
        className="grid gap-10 sm:grid-cols-2 md:col-span-2 lg:col-span-1"
      >
        <FooterColumn title="Pages" items={FOOTER_PAGES} />
        <FooterColumn title="Capabilities" items={FOOTER_CAPABILITIES} />
      </nav>
    </div>
  );
}
