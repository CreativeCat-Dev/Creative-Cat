import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { FluffyCat, LongTailCat, SiameseCat, TabbyCat, TuxedoCat } from "./footer-cats";

/**
 * The wordmark stage: `CREATIVE CAT` set as physical architecture that a small
 * crew of cats inhabits.
 *
 * 1. **Letters are real nodes, not a text run**, and they keep their natural
 *    widths. Every letter is its own span, so "leaning on the first C" is a
 *    position rather than a guess and NF-2B already has its stamping nodes.
 *
 * 2. **Cats are sized in `em` against the stage font-size**, never in `px` or
 *    `vw`, so the wordmark and the crew scale as one object. The failure mode
 *    this avoids is five cats that stay small while the letters grow.
 *
 * 3. **Seats anchor to letters, not to stage coordinates.** A seat names a letter
 *    index and an offset in `em` from that letter's own box, so "over the R/E
 *    boundary" is one number at every viewport. The previous version positioned
 *    against the stage with `calc()` constants, which only worked while there was
 *    one cat and only because that cat happened to sit at an edge.
 *
 *    Consequence worth knowing: a cat lives in one letter's DOM node at every
 *    breakpoint, which is what keeps NF-2C to one behavioural target per cat. It
 *    also means responsive placement may change offsets and visibility, but never
 *    a cat's parent — so the anchor letter is chosen to work at all widths rather
 *    than being moved around per breakpoint.
 *
 * 4. **Depth is paint order against the glyph.** The glyph sits at `z-10`; a
 *    `front` cat is `z-20`, a `behind` cat is `z-0`. Letter wrappers must not
 *    create a stacking context (no `z-index` on the wrapper) or a cat would be
 *    trapped inside its own letter.
 *
 * The horizontal padding is the crew's standing room: the stage is pulled
 * full-bleed and the *type* is inset, so the ground line runs the full width
 * while the cats have a margin to inhabit.
 *
 * Everything here is `aria-hidden`. The brand name is already announced by the
 * footer's `Logo`, so exposing the stage would read "C R E A T I V E" letter by
 * letter to a screen reader, which is worse than silence.
 */

type CatName = "fluffy" | "tuxedo" | "siamese" | "tabby" | "longtail";

type Seat = {
  cat: CatName;
  /** Flat index into the wordmark: CREATIVE is 0–7, CAT is 8–10. */
  letter: number;
  /** Height, in `em` of the stage font-size. One scale per cat, never per breakpoint. */
  size: string;
  /** `ground` stands on the baseline; `cap` stands on the letters' shoulders. */
  anchor: "ground" | "cap";
  /** Horizontal offset in `em` from the letter's own left edge. */
  offset: string;
  /** Extra vertical nudge, for cats that peek from behind a letter. */
  lift?: string;
  /** `front` paints over the letters; `behind` slides under them. */
  depth: "front" | "behind";
  /** Responsive visibility. Absent means visible at every width. */
  show?: string;
};

const CAT_ART = {
  fluffy: FluffyCat,
  tuxedo: TuxedoCat,
  siamese: SiameseCat,
  tabby: TabbyCat,
  longtail: LongTailCat,
} satisfies Record<CatName, (props: { className?: string }) => ReactElement>;

const DEPTH: Record<Seat["depth"], string> = {
  front: "z-20",
  behind: "z-0",
};

const ANCHOR: Record<Seat["anchor"], string> = {
  ground: "bottom-0",
  // The cap line. Measured against the rendered face, not assumed.
  cap: "bottom-[0.7em]",
};

/**
 * On phone the wordmark stacks into two rows, so the first row's box bottom sits
 * one row *above* the ground line. A cat anchored to a CREATIVE letter would
 * float there instead of standing on the floor.
 *
 * Rather than a second magic `bottom` value (which would fight the anchor), the
 * correction is a transform: exactly one row height, and it must stay equal to
 * the `leading-[0.78]` on the stage.
 */
const PHONE_ROW_DROP = "max-md:translate-y-[0.78em]";
/** A cap cat has to fall the row height *plus* the cap line to reach the floor. */
const PHONE_CAP_DROP = "max-md:translate-y-[1.48em]";

/** Cats on the CAT row are already on the ground line when the wordmark stacks. */
function rowCorrection(letter: number, anchor: Seat["anchor"]): string {
  if (letter > 7) return "";
  return anchor === "cap" ? PHONE_CAP_DROP : PHONE_ROW_DROP;
}

const CREATIVE = ["C", "R", "E", "A", "T", "I", "V", "E"];
const CAT = ["C", "A", "T"];

/**
 * Fluffy, re-anchored to the first `C`.
 *
 * Her offset is derived rather than tuned: she is `0.914em` wide at `0.88em`
 * tall, and the seat wants ~12.5% of that width overlapping the `C`, so she
 * starts `0.80em` left of the letter's box. Because both terms are `em`, the
 * relationship holds at every breakpoint — which is what the old
 * `calc(10vw - 0.80em)` and `calc(100% - 12px - 2.80em)` were each approximating
 * for one breakpoint range.
 */
const SEATS: Seat[] = [
  {
    cat: "fluffy",
    letter: 0,
    size: "h-[0.88em]",
    anchor: "ground",
    offset: "-left-[0.80em]",
    depth: "front",
  },
  {
    /*
      Over the R/E boundary, standing on the letters' shoulders. He is the only
      cat that needs the tablet breakpoint to be *cleaner* than desktop, so he is
      the one dropped below 1280.
    */
    cat: "tuxedo",
    letter: 1,
    size: "h-[0.72em]",
    anchor: "cap",
    offset: "left-[0.15em]",
    depth: "front",
    show: "hidden xl:block",
  },
  {
    /*
      Over the T/I boundary. Smallest in the crew by a wide margin — 0.60em
      against Fluffy's 0.88 — so the hierarchy reads without anyone being told.
    */
    cat: "tabby",
    letter: 4,
    size: "h-[0.60em]",
    anchor: "cap",
    offset: "left-[0.10em]",
    depth: "front",
  },
  {
    /*
      Behind the A of CAT, sunk 0.30em below the cap line so her lower body is
      covered by the letter instead of floating above it. She sits at z-0, so the
      glyph's own ink does the masking.
    */
    cat: "siamese",
    letter: 9,
    size: "h-[0.78em]",
    anchor: "cap",
    offset: "left-[-0.12em]",
    lift: "translate-y-[0.42em]",
    depth: "behind",
    show: "hidden md:block",
  },
  {
    /*
      Right of the final T. Her tail is the composition's right-hand gesture, so
      she hangs into the type's inset margin — about 0.75em of it, which fits
      inside the 10vw inset from 768 up.
    */
    cat: "longtail",
    letter: 10,
    size: "h-[0.98em]",
    anchor: "ground",
    offset: "left-[0.22em]",
    depth: "front",
    // Three cats at 768 keeps `CAT` readable; she returns at 1024 where the type
    // gives her room again.
    show: "hidden lg:block",
  },
];

function seatsFor(letter: number): Seat[] {
  return SEATS.filter((seat) => seat.letter === letter);
}

/**
 * One wordmark letter. The wrapper is `relative` but carries no `z-index`, so it
 * is a containing block for its cats without becoming a stacking context.
 */
function Letter({ char, index }: { char: string; index: number }) {
  const seats = seatsFor(index);

  return (
    <span className="relative inline-block font-heading font-medium">
      <span className="relative z-10 inline-block">{char}</span>

      {seats.map((seat) => {
        const Art = CAT_ART[seat.cat];

        return (
          <Art
            key={seat.cat}
            className={cn(
              "pointer-events-none absolute w-auto",
              DEPTH[seat.depth],
              ANCHOR[seat.anchor],
              rowCorrection(seat.letter, seat.anchor),
              seat.size,
              seat.offset,
              seat.lift,
              seat.show
            )}
          />
        );
      })}
    </span>
  );
}

export function FooterCatStage() {
  return (
    <div
      aria-hidden="true"
      data-footer-stage
      className="-mx-6 select-none md:-mx-10 lg:-mx-14"
    >
      {/*
        Font-size lives here, not on the rows, because the seats are `em`-sized
        descendants of the letters.

        `pl` is the standing room for the cat at the first C: on phone it has to
        be at least her offset (0.80em) plus a margin, or the footer's overflow
        clip cuts her in half. Paying for that room means a smaller phone
        wordmark — approved, because the cat/letter relationship is the point of
        the stage and CREATIVE's natural width is 4.868em, so the phone
        constraint is 5.788em <= viewport - 12px, which 16.2vw satisfies from
        320 up.
      */}
      <div className="relative pl-[0.92em] pr-3 text-[16.2vw] leading-[0.78] md:pl-[10vw] md:pr-[10vw] md:pt-[0.95em] md:text-[min(11.4vw,220px)]">
        <div className="flex flex-col md:flex-row md:items-end">
          <div className="flex tracking-[-0.045em] text-[#F4F0FB]">
            {CREATIVE.map((char, index) => (
              <Letter key={`creative-${index}`} char={char} index={index} />
            ))}
          </div>

          {/*
            The two words are separate groups so the phone lockup can stack them
            and right-align the second, while desktop keeps one line with a word
            space sized in `em`.
          */}
          <div className="flex justify-end tracking-[-0.045em] text-[#F4F0FB] md:ml-[0.26em] md:justify-start">
            {CAT.map((char, index) => (
              <Letter key={`cat-${index}`} char={char} index={8 + index} />
            ))}
          </div>
        </div>

        {/* The ground. It is layout, not animation: NF-2B may draw it on. */}
        <div data-footer-rule className="h-px origin-left bg-white/12" />
      </div>
    </div>
  );
}
