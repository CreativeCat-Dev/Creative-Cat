/**
 * Footer-only cat illustrations.
 *
 * These are wordmark-stage doodle characters, **not** the canonical Rive mascot:
 * nothing here is shared with `rive/`, and no Rive file is opened to draw them.
 *
 * ## Drawing approach
 *
 * Hand-authored contour, not constructed geometry. The outline is a single
 * path with deliberately uneven cheeks, two small cheek tufts that sit at
 * different heights, ears that are not the same shape, and a body whose flanks
 * do not mirror. It is drawn the way the reference characters are: one confident
 * outside line, a few interior marks, and no attempt at mathematical smoothness.
 *
 * Layering, back to front: tail, body, head, face. The head is a separate mass
 * painted over the body, so its outline crossing the chest *is* the neck line —
 * a single merged silhouette would lose the chest entirely.
 *
 * ## Line weight
 *
 * Three weights, not one. The exterior contour is heaviest because it has to
 * separate a near-white cat from near-white type; facial lines are lighter; fur
 * marks are lightest. Uniform strokes are what make a drawing look like an icon.
 *
 * ## Family grammar
 *
 * - flat fills only, no gradients, no shadows, no texture (texture is a later pass)
 * - one eye grammar: an outlined white plus a **separate pupil dot**, so NF-2C can
 *   move the pupil without rebuilding the eye
 * - coral used once per character, on the nose
 * - no whiskers: those belong to the mascot's locked art direction
 *
 * The API is deliberately dumb. Each component renders a `viewBox`-only SVG and
 * takes a className; the seat in `footer-cat-stage.tsx` sets the height in `em`,
 * so the wordmark's font-size scales the cat with the letters instead of the
 * viewport.
 */

/** Shared palette, exported so the stage can document itself against it. */
export const CAT_FUR = "#F2EEF9";
export const CAT_SHADE = "#E4DDF3";
export const CAT_MARK = "#B6AFCB";
export const CAT_INK = "#150E34";
export const CAT_ACCENT = "#FF1C43";
/** Siamese points. Readable on fur, never used as a silhouette against the page. */
export const CAT_WINE = "#631339";

/**
 * Three weights, in viewBox units. Tuned for a 0.88em cat: at 1440 that is a
 * ~145px cat, so these land near 4 / 2.3 / 1.7 px.
 */
const INK_EXTERIOR = 6;
const INK_FACE = 3.4;
const INK_FUR = 2.4;

type CatProps = {
  className?: string;
};

/**
 * Fluffy: oversized head, compact body, bold tail, mildly mischievous.
 *
 * Proportions are illustration proportions, not anatomy: the head including
 * cheeks is wider than the haunches, the ears are prominent, and the tail is
 * large enough to be part of the silhouette rather than an appendage.
 *
 * Asymmetry is deliberate and small — a taller near ear, a lower far ear, two
 * cheek tufts at different heights, one eye a little larger, both pupils offset
 * to the same side, and a mouth that smirks instead of smiling.
 */
export function FluffyCat({ className }: CatProps) {
  return (
    <svg
      viewBox="0 0 212 204"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      fill="none"
    >
      {/*
        Tail, behind everything: one bold crescent. Thick where it leaves the
        haunch, tapering to a soft tip near her ear height. The gap between the
        tail's inner edge and her flank is what stops it reading as a handle.
      */}
      <path
        d="M128 200C184 192 202 148 184 108C178 98 168 100 166 110C163 146 156 176 132 196Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/*
        One silhouette: skull, both ears, both cheeks, neck and body in a single
        path. Two masses with strokes always produced either a shelf or a collar
        across the chest, because the head's outline has to cross the body
        somewhere. Here the neck is the *shape* — the contour narrows from cheek
        width to shoulder width — so there is no line to read as clothing.
      */}
      <path
        d="M32 78C34 72 38 66 40 62C42 54 43 48 44 44L50 6C51 2 55 1 58 5L70 26C78 20 88 17 96 18C104 19 110 20 114 22L128 2C130-2 135-1 137 4L144 32C147 40 149 50 150 60C152 66 156 72 162 80C166 86 164 92 158 94C152 96 146 100 142 108C139 114 137 120 137 126C141 138 144 154 145 168C146 182 145 194 142 204L98 204C96 198 94 196 92 196C90 196 88 198 86 204L48 204C45 192 44 178 46 166C47 154 51 142 56 130C58 122 60 118 60 114C54 108 46 102 38 96C30 92 28 86 32 78Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
      />

      {/* Inner ears: lavender, sitting inside the part of each ear that clears the skull. */}
      <path d="M54 40 56 14 68 28Z" fill={CAT_MARK} opacity="0.5" />
      <path d="M124 26 128 8 136 28Z" fill={CAT_MARK} opacity="0.5" />

      {/*
        Eyes: eye white plus a separate pupil. The far eye is a touch smaller and
        both pupils sit right of centre, so she is looking off to one side rather
        than staring at the viewer.
      */}
      <ellipse
        cx="78"
        cy="74"
        rx="11.5"
        ry="12"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
      />
      <circle data-cat-pupil cx="80.5" cy="75" r="5.2" fill={CAT_INK} />

      <ellipse
        cx="122"
        cy="75"
        rx="10.5"
        ry="11.5"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
      />
      <circle data-cat-pupil cx="124.5" cy="76" r="5" fill={CAT_INK} />

      {/* One brow only. Two would make the face symmetrical and lose the attitude. */}
      <path
        d="M112 55C117 51 124 50 130 52"
        stroke={CAT_INK}
        strokeWidth={INK_FUR}
        strokeLinecap="round"
      />

      <path
        d="M94 88 106 88 100 96Z"
        fill={CAT_ACCENT}
        stroke={CAT_ACCENT}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M90 99C95 105 103 106 108 100"
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
        strokeLinecap="round"
      />

      {/*
        Two toe marks at most, at the lightest weight: the feet are already
        separated by the contour cut, and any more lines read as a spider.
      */}
      <path
        d="M68 197C67 200 67 202 67 204M122 197C123 200 123 202 123 204"
        stroke={CAT_INK}
        strokeWidth={INK_FUR}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Tuxedo: upright, composed, slightly proud.
 *
 * The family's ink rule inverts here. Every other cat is fur with a midnight
 * keyline; a midnight coat on a midnight page would vanish, and a midnight
 * keyline over near-white type would vanish too. So his exterior is CAT_MARK —
 * a mid tone that separates against both grounds with one stable rule — and his
 * interior marks invert to fur, because on him the coat *is* the ink colour.
 *
 * He is narrower and straighter than Fluffy on purpose: the silhouette should
 * say "upright" before the face is read.
 */
export function TuxedoCat({ className }: CatProps) {
  return (
    <svg
      viewBox="0 0 168 204"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      fill="none"
    >
      {/* Compact tail, tucked against the hip: thick at the root, tapering. */}
      <path
        d="M132 198C150 196 160 186 158 170L146 168C148 182 142 190 128 190Z"
        fill={CAT_INK}
        stroke={CAT_MARK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
      />

      {/*
        One silhouette, shoulders to ground almost straight: the upright posture
        is the shape, not a line. Taller, pointier ears than Fluffy's — with a
        narrow skull they are what stop a dark mass reading as a bear.
      */}
      <path
        d="M50 82C52 72 56 62 62 54C63 48 62 44 60 40L58 4L86 24C96 18 107 16 116 18C123 19 128 21 132 24L138 4L156 36C161 44 163 54 163 66C163 74 161 82 157 86C153 94 150 102 149 108C141 118 134 126 132 136C141 152 149 168 150 184C151 196 149 202 146 204L39 204C36 202 34 196 34 184C35 168 43 150 53 134C51 126 52 118 54 108C47 98 50 90 50 82Z"
        fill={CAT_INK}
        stroke={CAT_MARK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
      />

      {/*
        The shirt front. The V at the neck is the tuxedo cue; the first pass was a
        wide rounded oval, which read as a penguin's belly. Narrow enough that the
        coat still owns the silhouette.
      */}
      <path
        d="M88 104 96 116 104 104C112 118 116 140 115 160C114 176 110 186 104 190C98 194 90 194 86 190C82 176 80 158 81 140C82 122 84 112 88 104Z"
        fill={CAT_FUR}
      />

      {/* Muzzle, held clear of the bib by a band of coat. */}
      <ellipse cx="96" cy="82" rx="14" ry="10" fill={CAT_FUR} />

      {/* Inner ears read as fur on a dark skull. */}
      <path d="M66 30 68 8 82 26Z" fill={CAT_FUR} opacity="0.9" />
      <path d="M130 22 134 4 140 26Z" fill={CAT_FUR} opacity="0.9" />

      {/*
        Eyes: fur whites on a midnight face, ink pupils. No rim — the family's rim
        exists to separate a light eye from a light face, and there is no light
        face here. Narrower than Fluffy's, which is where "composed" comes from.
      */}
      <ellipse cx="76" cy="64" rx="9.5" ry="8.5" fill={CAT_FUR} />
      <circle data-cat-pupil cx="77.5" cy="65" r="4.1" fill={CAT_INK} />
      <ellipse cx="114" cy="64" rx="9" ry="8" fill={CAT_FUR} />
      <circle data-cat-pupil cx="115.5" cy="65" r="3.9" fill={CAT_INK} />

      <path
        d="M91 78 101 78 96 85Z"
        fill={CAT_ACCENT}
        stroke={CAT_ACCENT}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M88 90C92 95 100 95 104 89"
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
        strokeLinecap="round"
      />

      {/* White socks: two graphic paws, no rings, no boots. */}
      <path d="M42 204C42 195 50 190 60 190C70 190 77 195 77 204Z" fill={CAT_FUR} />
      <path d="M95 204C95 195 103 190 113 190C123 190 130 195 130 204Z" fill={CAT_FUR} />
    </svg>
  );
}

/**
 * Siamese: curious, watchful, clever.
 *
 * Narrower than Tuxedo and much narrower than Fluffy, with a long neck and long
 * pointed ears. Wine is used only on fur — ear tips, an eye mask, the tail tip —
 * never as silhouette, because #631339 against midnight is about 1.9:1 and would
 * simply disappear.
 */
export function SiameseCat({ className }: CatProps) {
  return (
    <svg
      viewBox="0 0 168 204"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      fill="none"
    >
      {/* Long tail, behind: thinner than Fluffy's, ending in a wine tip. */}
      <path
        d="M126 196C154 194 168 176 164 152L154 150C156 170 148 182 124 184Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
      />
      <path d="M164 152C166 160 160 168 154 150Z" fill={CAT_WINE} />

      {/* One silhouette: narrow skull, long neck, slim seated body. */}
      <path
        d="M54 72C56 62 60 52 66 44C64 34 62 22 62 10C62 6 66 4 69 8L82 30C88 24 97 22 105 24L117 6C119 2 123 4 123 8C123 20 121 32 119 42C125 50 129 60 131 72C132 80 131 86 128 90C125 98 123 106 123 112C127 126 131 146 131 164C131 182 129 196 125 204L43 204C39 196 37 182 37 164C37 146 41 126 45 112C45 106 43 98 40 90C43 86 52 80 54 72Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
      />

      {/*
        Points live on the extremities only — ear tips and the tail — and stay
        small. Larger wine wedges read as red horns, and a wine patch around the
        mouth read as an open mouth at footer scale.
      */}
      <path d="M65 16 69 11 75 22 70 23Z" fill={CAT_WINE} />
      <path d="M118 13 121 10 120 23 116 21Z" fill={CAT_WINE} />

      {/*
        Almond eyes, the family construction with a lens instead of an ellipse.
        The far eye is a degree narrower, which reads as "sizing you up".
      */}
      <path
        d="M70 64C74 57 82 57 86 64C82 71 74 71 70 64Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
        strokeLinejoin="round"
      />
      <circle data-cat-pupil cx="78.5" cy="64" r="3.4" fill={CAT_INK} />

      <path
        d="M104 63C107.5 57 115 57 118.5 63C115 69 107.5 69 104 63Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
        strokeLinejoin="round"
      />
      <circle data-cat-pupil cx="111.5" cy="63" r="3.1" fill={CAT_INK} />

      <path
        d="M92 80 100 80 96 86Z"
        fill={CAT_ACCENT}
        stroke={CAT_ACCENT}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M90 92C93 96 99 96 102 91"
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
        strokeLinecap="round"
      />

      {/* Wine front paws: the last of the points, and they stop the lower body
          reading as a blank column. */}
      <path d="M60 204C60 197 65 193 70 193C75 193 79 197 79 204Z" fill={CAT_WINE} />
      <path d="M113 204C113 197 117 193 122 193C127 193 132 197 132 204Z" fill={CAT_WINE} />


      {/* Paws: two toe marks only, at the mouth's weight, not its own shapes. */}
      <path
        d="M62 196C61 199 61 202 61 204M104 196C105 199 105 202 105 204"
        stroke={CAT_INK}
        strokeWidth={INK_FUR}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Tabby: the kitten. Smallest in the crew, oversized head, short legs.
 *
 * The proportion is the character: head wider than the hips, and the only cat in
 * the family with markings — three forehead stripes and a coral collar, which is
 * also the family's second coral accent after Fluffy's nose.
 */
export function TabbyCat({ className }: CatProps) {
  return (
    <svg
      viewBox="0 0 152 190"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      fill="none"
    >
      {/* Kitten tail: short, thick, flicked up. */}
      <path
        d="M108 184C130 184 140 172 136 156L127 154C129 168 123 174 106 174Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
      />

      {/* One silhouette: big skull, tiny torso, short legs. */}
      <path
        d="M34 72C36 62 40 52 46 44L42 12C43 8 47 7 50 11L62 28C70 22 82 20 93 22L103 6C105 2 110 3 111 7L115 36C123 44 127 58 126 72C125 80 123 86 119 90C116 98 115 106 115 112C119 128 122 146 122 160C122 174 120 184 117 190L35 190C32 184 30 174 30 160C30 146 33 128 37 112C37 106 36 98 39 90C36 86 33 80 34 72Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
      />

      {/*
        Tabby marks: three short dashes on the forehead plus two cheek ticks. A
        zigzag across the brow read as a tiara, and three long vertical strokes
        read as scratches; short dashes are the only version that reads as fur.
      */}
      <path
        d="M71 45 69 53M80 43 80 51M89 45 91 53"
        stroke={CAT_INK}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M58 66 64 68M118 66 112 68"
        stroke={CAT_INK}
        strokeWidth={INK_FUR}
        strokeLinecap="round"
      />

      {/*
        Coral collar with a tag: the family's second coral accent. Sits right
        under the chin at the actual neck, thin enough not to read as a sash.
      */}
      <path d="M64 96C76 103 94 103 106 96L106 103C94 110 76 110 64 103Z" fill={CAT_ACCENT} />
      <circle cx="85" cy="107" r="3.2" fill={CAT_ACCENT} />

      {/* Wide kitten eyes: same construction, biggest pupils in the crew. */}
      <ellipse
        cx="72"
        cy="64"
        rx="11"
        ry="11.5"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
      />
      <circle data-cat-pupil cx="74" cy="65" r="5.4" fill={CAT_INK} />

      <ellipse
        cx="104"
        cy="64"
        rx="10.5"
        ry="11"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
      />
      <circle data-cat-pupil cx="106" cy="65" r="5.1" fill={CAT_INK} />

      <path
        d="M84 78 94 78 89 85Z"
        fill={CAT_ACCENT}
        stroke={CAT_ACCENT}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M80 90C84 96 94 96 98 90"
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
        strokeLinecap="round"
      />

      <path
        d="M52 182C51 185 51 188 51 190M108 182C109 185 109 188 109 190"
        stroke={CAT_INK}
        strokeWidth={INK_FUR}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Long-tail: elegant, relaxed, slightly aloof.
 *
 * The tallest cat in the crew and the narrowest, with the smallest head. Her
 * tail is the family's one large graphic gesture: a single arc from the hip to
 * head height that defines the right edge of the composition. No hook, no
 * spiral — the tip simply tapers off.
 *
 * Scale is 0.98em, taller than Fluffy, and the hierarchy still holds because
 * mass is silhouette area: Fluffy's head is nearly twice as wide.
 */
export function LongTailCat({ className }: CatProps) {
  return (
    <svg
      viewBox="0 0 216 210"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      fill="none"
    >
      {/*
        The tail. Thick where it leaves the haunch, narrowing over the whole arc,
        ending blunt. The gap it leaves against her flank is what makes it read
        as a tail instead of a handle.
      */}
      <path
        d="M144 188C192 196 216 162 208 122L196 118C176 142 158 166 142 176Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
      />

      {/* One silhouette: tall, narrow, long neck, small head. */}
      <path
        d="M78 62C80 54 84 46 90 40L86 12C87 8 91 7 94 11L104 30C110 26 119 26 125 29L133 10C135 6 139 8 140 12L143 40C149 48 152 58 151 68C150 76 148 82 145 86C142 94 141 102 141 110C145 126 148 146 148 166C148 186 146 200 143 210L61 210C58 200 56 186 56 166C56 146 59 126 63 110C63 102 62 94 59 86C63 80 76 72 78 62Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_EXTERIOR}
        strokeLinejoin="round"
      />

      {/* Small, neat inner ears. */}
      <path d="M90 34 92 16 100 28Z" fill={CAT_MARK} opacity="0.5" />
      <path d="M130 32 133 16 138 30Z" fill={CAT_MARK} opacity="0.5" />

      {/* Calm eyes: half-lidded, so the lid shape carries the aloofness. */}
      <path
        d="M70 60C74 55 82 55 86 59C82 66 74 66 70 60Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
        strokeLinejoin="round"
      />
      <path d="M69 58 87 58" stroke={CAT_INK} strokeWidth={INK_FACE} strokeLinecap="round" />
      <circle data-cat-pupil cx="78" cy="60" r="3.2" fill={CAT_INK} />

      <path
        d="M104 59C108 54 116 54 120 59C116 66 108 66 104 59Z"
        fill={CAT_FUR}
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
        strokeLinejoin="round"
      />
      <path d="M103 57 121 57" stroke={CAT_INK} strokeWidth={INK_FACE} strokeLinecap="round" />
      <circle data-cat-pupil cx="112" cy="59" r="3" fill={CAT_INK} />

      <path
        d="M92 76 100 76 96 82Z"
        fill={CAT_ACCENT}
        stroke={CAT_ACCENT}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M90 88C93 92 99 92 102 88"
        stroke={CAT_INK}
        strokeWidth={INK_FACE}
        strokeLinecap="round"
      />

      <path
        d="M76 202C75 205 75 208 75 210M120 202C121 205 121 208 121 210"
        stroke={CAT_INK}
        strokeWidth={INK_FUR}
        strokeLinecap="round"
      />
    </svg>
  );
}
