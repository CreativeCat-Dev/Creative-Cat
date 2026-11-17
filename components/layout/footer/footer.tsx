import { microLabel } from "@/lib/ui";
import { FooterBackToTop } from "./footer-back-to-top";
import { FooterCta } from "./footer-cta";
import { FOOTER_COPYRIGHT } from "./footer.data";
import { FooterGrid } from "./footer-grid";
import { FooterMotion } from "./footer-motion";

/**
 * Always-branded closing section: the `dark` class pins the surface to midnight
 * in both themes, exactly like the navigation overlay, so the footer does not
 * introduce a second colour system.
 *
 * The oversized wordmark is a print watermark, not a heading. It sits in its own
 * band between the grid and the bottom bar rather than behind the columns: a
 * band that adds real height cannot collide with the lists, which an absolutely
 * positioned element could only avoid by shrinking. Negative margins push it
 * past the section padding so the word runs near full-bleed, and
 * `overflow-x-clip` on the footer crops what is left over.
 *
 * The composition is capped at 1920px inside a full-bleed surface. The cap sits
 * on the motion root, which already owns the horizontal padding, so a 2560px
 * monitor renders exactly the 1920px layout centred on midnight rather than a
 * stretched one; the watermark is centred type, so it is unaffected.
 *
 * The markup below is the finished footer. `FooterMotion` adds the entrance
 * after hydration and is the only client JavaScript in the section; nothing here
 * is hidden by CSS, so the footer is complete without JavaScript.
 */
export function Footer() {
  return (
    <footer data-footer className="dark overflow-x-clip bg-background text-foreground">
      <FooterMotion>
        <FooterCta />

        <hr data-footer-rule className="border-border" />

        <FooterGrid />

        {/*
          Hidden below `md`: the stacked mobile composition has no room for a
          band this tall, and the mobile layout drops it by design. The motion
          hook sits on the span, not the band, because the span is the element
          that carries the resting opacity.
        */}
        <div
          aria-hidden
          className="pointer-events-none -mx-6 hidden select-none md:-mx-10 md:block lg:-mx-14"
        >
          <span
            data-footer-watermark
            className="block whitespace-nowrap text-center font-heading text-[clamp(90px,13vw,250px)] font-medium uppercase leading-[0.78] tracking-[-0.03em] text-white opacity-[0.065]"
          >
            Creative Cat
          </span>
        </div>

        <div
          data-footer-bottom
          className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6"
        >
          <p className={`text-muted-foreground/70 ${microLabel}`}>{FOOTER_COPYRIGHT}</p>
          <FooterBackToTop />
        </div>
      </FooterMotion>
    </footer>
  );
}
