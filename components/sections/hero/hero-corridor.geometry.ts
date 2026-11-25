import { WORK_PROJECTS } from "@/lib/work";

/**
 * Corridor geometry: the whole 13-project sequence as a deterministic function
 * of one normalised progress value.
 *
 * Nothing here animates and nothing here holds state. The scroll story feeds the
 * same progress value, and HERO-04's narrative layer reads `nearestProjectIndex`
 * from it, so the corridor never computes a second timeline of its own.
 *
 * Coordinate model. Each card carries a signed distance `d` from the focal
 * position, measured in collection steps: `d = index - progress * (N - 1)`. So
 * `d = 0` is the featured card, `d = 1` is the next project waiting in the left
 * lane, positive `d` recedes toward the vanishing point, and negative `d` is a
 * card that has just passed and is retiring.
 *
 * Because adjacent cards are exactly one step apart, every progress value has
 * exactly one card with `|d| <= 0.5` — the same window `nearestProjectIndex`
 * rounds into. `KEYS` holds the right lane across that whole window, so the
 * project the metadata names is always the card sitting in the focal lane. A
 * card arrives at the lane at `d = 0.5`, holds until `d = -0.5`, then slides out
 * to the right while the next card lands on top of it.
 *
 * Depth states, interpolated from the table below:
 *
 *   FAR          d 2.4 - 3.4    small, deep, converging on the vanishing point
 *   APPROACHING  d 1.2 - 2.4    swinging out toward the left lane
 *   SUPPORT      d 0.85 - 1.2   left lane at 20% (22.4vw), readable
 *   CROSSING     d 0.5 - 0.85   sweeping right behind the cat
 *   FOCAL        d -0.5 - 0.5   right lane at 74% (72.2vw), full size
 *   RETIRING     d -1.0 - -0.5  sliding right and fading
 *
 * The cat always renders above the corridor, so "behind the cat" is a layering
 * fact rather than a z-index negotiation here.
 *
 * Stacking. `nearestProjectIndex` owns the top of the corridor unconditionally.
 * At a handoff two cards occupy the identical box — the arriving card at
 * `d = +0.5` and the leaving card at `d = -0.5` — so graded depth values can tie
 * and let DOM order decide which project paints. The focal card is therefore
 * given a reserved stacking value nothing else can reach, and the swap lands on
 * the exact frame the two boxes coincide, so the cut has no visible jump.
 *
 * Two presentations, one story. `full` draws the whole path. `shallow` is the
 * short-desktop presentation: below 860px viewport height the CTA row and the
 * left lane share a vertical band, so the support lane and the far tail are
 * dropped and a crossing card fades out below 42% (fully drawn from 52%, which
 * is behind the character). A short desktop still runs the complete 01 -> 13
 * story; only the depth around the focal slot is reduced.
 *
 * `enhance` (0 at progress 0, 1 by progress 0.02) gates the depth tail and the
 * emphasis lift. It exists so progress 0 — the server-rendered, no-JS and
 * reduced-motion state — is exactly the approved HERO-01 composition: two cards
 * and nothing else. The corridor opens up as soon as the story starts.
 */

/** Editorial emphasis beats, as zero-based indices into WORK_PROJECTS. */
export const CORRIDOR_EMPHASIS = [0, 2, 4, 6, 8, 10, 12] as const;

const EMPHASIS = new Set<number>(CORRIDOR_EMPHASIS);

/** Whether a project belongs to the editorial emphasis set. */
export function isEmphasisIndex(index: number): boolean {
  return EMPHASIS.has(index);
}

/**
 * `full` draws the whole path; `shallow` is the short-desktop presentation
 * described above. The mode changes what is drawn, never what progress means.
 */
export type CorridorMode = "full" | "shallow";

/** Where a card sits in the story. Presentation keys off this, not off `x`. */
export type CorridorLane = "focal" | "crossing" | "support" | "tail" | "retiring";

export type CorridorFrame = {
  index: number;
  /** Signed distance from the focal position, in collection steps. */
  d: number;
  /** Card centre as a percentage of the corridor width. */
  left: number;
  /** translateZ in px. */
  z: number;
  scale: number;
  /** rotateY in degrees, a small perspective cue. */
  rotate: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  focal: boolean;
  emphasis: boolean;
  /** Smooth editorial emphasis envelope at this frame, 0..1. */
  emphasisWeight: number;
  lane: CorridorLane;
};

type Key = { d: number; left: number; z: number; scale: number; opacity: number };

/**
 * Depth keyframes. `left` is the card centre in percent of the corridor width,
 * so the focal lane lands on the approved HERO-01 position (74% of the content
 * box = 72.2vw) and the support lane on 20% (22.4vw). Sizes are authored per
 * state rather than derived from z alone: the support card is deliberately a
 * smaller card on the same depth plane, which perspective alone cannot express
 * without also pulling it toward the centre.
 *
 * The focal stretch is flat on purpose (z 0, scale 1, left 74), which is what
 * keeps the approved static card geometry exact at progress 0.
 */
const KEYS: readonly Key[] = [
  // Retiring: slides out to the right and recedes.
  { d: -1.0, left: 102, z: -240, scale: 0.88, opacity: 0 },
  { d: -0.85, left: 95, z: -150, scale: 0.91, opacity: 0.05 },
  { d: -0.7, left: 84, z: -70, scale: 0.96, opacity: 0.25 },
  { d: -0.58, left: 77, z: -20, scale: 0.99, opacity: 0.6 },
  // Focal slot: the nearest project owns the right lane for its whole step.
  { d: -0.5, left: 74, z: 0, scale: 1, opacity: 1 },
  { d: 0, left: 74, z: 0, scale: 1, opacity: 1 },
  { d: 0.5, left: 74, z: 0, scale: 1, opacity: 1 },
  // Sweep across, behind the cat, toward the right lane.
  { d: 0.62, left: 54, z: 0, scale: 0.82, opacity: 0.99 },
  { d: 0.74, left: 34, z: 0, scale: 0.62, opacity: 0.97 },
  // Support lane, then the swing out toward the vanishing point.
  { d: 0.88, left: 20, z: 0, scale: 0.468, opacity: 0.98 },
  { d: 1.0, left: 20, z: 0, scale: 0.468, opacity: 1 },
  { d: 1.2, left: 21, z: -70, scale: 0.45, opacity: 0.88 },
  { d: 1.6, left: 25, z: -240, scale: 0.42, opacity: 0.62 },
  { d: 2.1, left: 32, z: -520, scale: 0.38, opacity: 0.38 },
  { d: 2.7, left: 40, z: -900, scale: 0.34, opacity: 0.16 },
  { d: 3.4, left: 48, z: -1400, scale: 0.3, opacity: 0 },
];

/** Depth tail + emphasis lift fade in over the first 2% of the story. */
const ENHANCE_END = 0.02;
/** Cards further out than this are the depth tail the static state omits. */
const TAIL_FROM = 1.05;

/**
 * Emphasis envelope. The editorial beat is held across a small plateau and
 * eases out to nothing before the neighbouring project's centre, so the card
 * feels briefly held without any scroll stop. At a half-step the weight is zero,
 * which is exactly where two cards share the focal box.
 */
const EMPHASIS_PLATEAU = 0.15;
const EMPHASIS_REACH = 0.35;

/**
 * Emphasis lean, in px of translateZ. Positive is toward the camera: CSS
 * perspective makes negative translateZ recede, so a negative value here would
 * have been the opposite of what the contract describes. At the 2000px
 * perspective this projects as a small growth, the smallest offset that still
 * reads as depth rather than as a duplicate scale change.
 */
const EMPHASIS_NEAR = 20;
const EMPHASIS_SCALE = 0.04;
const EMPHASIS_OPACITY = 0.035;

/**
 * Ending calm. As the story closes, the retiring cards and the far tail calm
 * down by at most 30% so the final eye-contact composition has less noise. The
 * focal project, its readable media and the approaching support card are never
 * reduced, so project 13 can still arrive at full presence.
 */
const ENDING_FROM = 0.9;
const ENDING_TO = 0.985;
const ENDING_DIM = 0.3;

/**
 * Short-desktop band. A crossing card is fully transparent at or below 42% of
 * the corridor width and fully drawn from 52% upward. Both boundaries sit under
 * the character, so the fade in shallow mode is never visible in open space —
 * it happens exactly where the full-depth path already hides the card.
 */
const SHALLOW_FROM = 42;
const SHALLOW_TO = 52;

/**
 * Reserved stacking value for the focal card. Every other card lands in
 * 66…100, so `nearestProjectIndex` can never be overpainted by a neighbour.
 */
const FOCAL_Z = 1000;

/**
 * Focal interaction window, in collection steps. A project link only becomes
 * pointer-interactive while its card is settled inside ±0.15 of the focal plane
 * (45px of travel at the 500svh budget), so a fast scroll cannot strobe a CTA
 * across every passing project. This is geometry, not a timer: no debounce, no
 * second state machine.
 */
export const PROJECT_LINK_SETTLE_STEPS = 0.15;

/**
 * The one rule for whether the focal card may offer a project link. Ownership
 * comes from the same `focal` flag the corridor paints and the counter reads;
 * a destination is required, so a project without a published page is never
 * interactive. Emphasis membership is deliberately irrelevant here.
 */
export function projectLinkEligible(
  frame: Pick<CorridorFrame, "focal" | "d">,
  hasDestination: boolean
): boolean {
  return frame.focal && hasDestination && Math.abs(frame.d) <= PROJECT_LINK_SETTLE_STEPS;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/**
 * The 0 -> 1 gate that keeps progress 0 pixel-identical to HERO-01. Everything
 * that would lift or decorate a card is multiplied by it.
 */
export function storyEnhance(progress: number): number {
  return smoothstep(clamp01(progress) / ENHANCE_END);
}

/**
 * Smooth emphasis envelope around an editorial beat, by distance in collection
 * steps: 1 inside the plateau, easing to 0 at the reach. Symmetric, so reverse
 * scroll sees exactly the same values.
 */
export function emphasisWeightAt(distance: number): number {
  const d = Math.abs(distance);
  if (d <= EMPHASIS_PLATEAU) return 1;
  if (d >= EMPHASIS_REACH) return 0;
  return 1 - smoothstep((d - EMPHASIS_PLATEAU) / (EMPHASIS_REACH - EMPHASIS_PLATEAU));
}

/**
 * Ending calm, 0 until 0.90 then smooth to 1 at 0.985. The final project keeps
 * its emphasis; only surrounding noise is touched.
 */
export function endingWeightAt(progress: number): number {
  return smoothstep((clamp01(progress) - ENDING_FROM) / (ENDING_TO - ENDING_FROM));
}

/** Deterministic per-project jitter so cards never travel identical rails. */
function jitter(seed: number, salt: number): number {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function sample(d: number): Key {
  if (d <= KEYS[0].d) return KEYS[0];
  for (let i = 1; i < KEYS.length; i += 1) {
    const b = KEYS[i];
    if (d <= b.d) {
      const a = KEYS[i - 1];
      const t = (d - a.d) / (b.d - a.d);
      // Smoothstep keeps scale and x from kinking at a keyframe.
      const e = t * t * (3 - 2 * t);
      return {
        d,
        left: a.left + (b.left - a.left) * e,
        z: a.z + (b.z - a.z) * e,
        scale: a.scale + (b.scale - a.scale) * e,
        opacity: a.opacity + (b.opacity - a.opacity) * e,
      };
    }
  }
  return KEYS[KEYS.length - 1];
}

/**
 * Classify a card by position in the story. The thresholds are the same numbers
 * `KEYS` uses, so a lane name and the keyframe it describes cannot drift apart.
 */
function laneOf(index: number, nearest: number, d: number): CorridorLane {
  if (index === nearest) return "focal";
  if (d >= 1.2) return "tail";
  if (d >= 0.85) return "support";
  if (d >= 0.5) return "crossing";
  return "retiring";
}

/**
 * The project nearest the focal plane. Continuous, monotonic and derived from
 * the same progress value the corridor renders from — this is the number the
 * featured metadata will follow in HERO-04.
 *
 * `Math.round` is exactly the `|d| <= 0.5` window the geometry holds at the
 * focal lane, so this index and the visible focal card cannot disagree.
 */
export function nearestProjectIndex(progress: number): number {
  const last = WORK_PROJECTS.length - 1;
  return Math.min(last, Math.max(0, Math.round(clamp01(progress) * last)));
}

export function corridorFrames(progress: number, mode: CorridorMode = "full"): CorridorFrame[] {
  const last = WORK_PROJECTS.length - 1;
  const clamped = clamp01(progress);
  const position = clamped * last;
  const enhance = storyEnhance(clamped);
  const ending = endingWeightAt(clamped);
  const nearest = Math.round(position);
  const shallow = mode === "shallow";

  return WORK_PROJECTS.map((_, index) => {
    const d = index - position;
    const key = sample(d);
    const lane = laneOf(index, nearest, d);

    // Emphasis is data, not navigation: it sharpens the moment a card is near
    // the focal plane and never reorders anything. Gated by `enhance` so the
    // approved static composition keeps its exact measurements.
    const emphasis = EMPHASIS.has(index);
    const weight = emphasis ? emphasisWeightAt(d) * enhance : 0;

    const tail = d > TAIL_FROM ? enhance : 1;
    // Jitter is confined to the far tail: the two lanes that HERO-01 approved
    // must measure exactly, so no per-card noise is allowed near the focal
    // plane. This is what keeps the static composition pixel-faithful.
    const far = d > TAIL_FROM ? smoothstep((d - TAIL_FROM) / 0.35) * enhance : 0;

    const left = key.left + (jitter(index, 1) - 0.5) * 2 * far;
    const z = key.z + EMPHASIS_NEAR * weight + (jitter(index, 2) - 0.5) * 40 * far;
    // Cards are flat-on while they occupy either readable lane, so the lanes
    // measure exactly the HERO-01 boxes. The turn only returns as a card leaves
    // the lane for the sweep or the fade-out.
    const turn =
      d > 1
        ? smoothstep((d - 1) / 0.35)
        : d < -0.5
          ? smoothstep((-0.5 - d) / 0.3)
          : 0;
    const rotate = turn * (50 - left) * 0.1;
    const scale = key.scale * (1 + EMPHASIS_SCALE * weight);

    // Shallow mode keeps only the cards that live at or right of the character;
    // the left support lane and the far tail are the two that collide with the
    // CTA row on a short desktop. Progress itself is untouched.
    const band = shallow && (lane === "support" || lane === "tail") ? 0 : 1;
    const edge =
      shallow && band > 0
        ? smoothstep((left - SHALLOW_FROM) / (SHALLOW_TO - SHALLOW_FROM))
        : 1;
    // Retired cards and the far tail calm down at the end. The focal card and
    // the approaching support card are excluded, so project 13 arrives at full
    // presence and the final focal plate is never dimmed.
    const calm = d < -0.5 || d > 1.2 ? 1 - ENDING_DIM * ending : 1;
    const opacity = Math.min(1, key.opacity + EMPHASIS_OPACITY * weight) * tail * band * edge * calm;

    return {
      index,
      d,
      left,
      z,
      scale,
      rotate,
      opacity,
      // The nearest card owns the focal slot unconditionally: at a handoff its
      // neighbour shares the same box, so DOM order must never decide this.
      zIndex: index === nearest ? FOCAL_Z : 100 - Math.round(Math.abs(d) * 10),
      visible: opacity > 0.02,
      focal: index === nearest,
      emphasis,
      emphasisWeight: weight,
      lane,
    };
  });
}
