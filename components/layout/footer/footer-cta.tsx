import Link from "next/link";
import { focusRing, microLabel } from "@/lib/ui";

/**
 * Footer hero moment. Two masked lines reveal the copy as blocks in the motion
 * batch; on narrow viewports the lines wrap naturally rather than being split
 * into separate elements, which would force four lines on desktop too.
 */
export function FooterCta() {
  const line =
    "block font-heading uppercase leading-[0.9] tracking-[-0.01em] transition-colors group-hover:text-primary text-[clamp(2.75rem,min(8vw,11svh),7.5rem)]";

  return (
    <div>
      <p className={`text-muted-foreground ${microLabel}`}>Have a project in mind?</p>

      <h2 className="mt-5 md:mt-7">
        <Link href="/contact" className={`group block rounded-sm ${focusRing}`}>
          <span className="block overflow-hidden pb-[0.08em]">
            <span className={line}>Let&apos;s create</span>
          </span>
          <span className="block overflow-hidden pb-[0.08em]">
            <span className={line}>
              Something{" "}
              <span className="whitespace-nowrap">
                great
                <svg
                  viewBox="0 0 10 10"
                  aria-hidden
                  className="ml-[0.12em] inline-block size-[0.42em] align-baseline transition-transform duration-200 group-hover:-translate-y-[0.06em] group-hover:translate-x-[0.06em]"
                >
                  <path
                    d="M1 9 9 1M3.5 1H9v5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="square"
                  />
                </svg>
              </span>
            </span>
          </span>
        </Link>
      </h2>
    </div>
  );
}
