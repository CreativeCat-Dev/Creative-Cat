import { microLabel } from "@/lib/ui";
import { FooterBackToTop } from "./footer-back-to-top";
import { FooterCta } from "./footer-cta";
import { FOOTER_COPYRIGHT } from "./footer.data";
import { FooterGrid } from "./footer-grid";

/**
 * Always-branded closing section: the `dark` class pins the surface to midnight
 * in both themes, exactly like the navigation overlay, so the footer does not
 * introduce a second colour system.
 *
 * No entrance animation and no hidden initial states: content is fully visible
 * without JavaScript. Motion arrives in a separate batch.
 */
export function Footer() {
  return (
    <footer className="dark bg-background text-foreground">
      <div className="flex flex-col gap-12 px-6 pt-16 pb-8 md:gap-14 md:px-10 md:pt-20 lg:px-14 lg:pt-28">
        <FooterCta />

        <hr className="border-border" />

        <FooterGrid />

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <p className={`text-muted-foreground ${microLabel}`}>{FOOTER_COPYRIGHT}</p>
          <FooterBackToTop />
        </div>
      </div>
    </footer>
  );
}
