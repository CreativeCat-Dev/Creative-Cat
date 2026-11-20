import Link from "next/link";
import { cn } from "@/lib/utils";
import { focusRing, microLabel } from "@/lib/ui";

const control = cn(
  "group inline-flex min-h-11 shrink-0 items-center gap-2 transition-colors duration-200",
  "hover:text-brand-coral",
  microLabel,
  focusRing
);

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className={className}>
      <path
        d="M1 9 9 1M3.5 1H9v5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function FooterCta() {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
      <div>
        <p data-footer-eyebrow className={`text-muted-foreground ${microLabel}`}>
          Have a project in mind?
        </p>

        <p
          data-footer-cta-line
          className="mt-4 font-heading text-[clamp(26px,2.7vw,42px)] font-medium uppercase leading-[1.02] tracking-[-0.03em] text-foreground"
        >
          Let&apos;s create something great
        </p>
      </div>

      <Link href="/contact" className={control}>
        Let&apos;s talk
        <Arrow className="size-2.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
