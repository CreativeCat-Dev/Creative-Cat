import { WORK_PROJECTS, WORK_PROJECT_COUNT, type WorkProject } from "@/lib/work";
import type { CatBeat } from "./hero.cat";
import {
  CORRIDOR_EMPHASIS,
  emphasisWeightAt,
  endingWeightAt,
  isEmphasisIndex,
  nearestProjectIndex,
  storyEnhance,
} from "./hero-corridor.geometry";
import { CAT_STORY_ANCHORS, catFrameForProgress } from "./hero-story.config";

/**
 * HERO-04's single interpretation layer.
 *
 * Raw hero progress enters, editorial state leaves. Nothing here owns a clock,
 * writes the DOM or animates: the corridor already renders from the same
 * progress, the cat already scrubs from the same mapping, and metadata only
 * needs to know when the nearest project changes.
 *
 * Every value is derived. Project names are never restated here — the
 * collection in `lib/work.ts` is the only source of truth — and neither the
 * nearest-project formula nor the emphasis set is duplicated.
 */

export type CatPhase =
  | "down"
  | "rising"
  | "turning"
  | "firstSide"
  | "oppositeSide"
  | "returning"
  | "eyeContact"
  | "direct"
  | "settled";

/** The editorial reading of each frozen cat beat. */
const PHASE_OF_BEAT: Record<CatBeat, CatPhase> = {
  down: "down",
  downHoldEnd: "rising",
  headUp: "turning",
  firstSide: "firstSide",
  oppositeSide: "oppositeSide",
  returnCenter: "returning",
  eyeContactStart: "eyeContact",
  directViewer: "direct",
  settled: "settled",
};

export type HeroNarrativeState = {
  /** Clamped master progress, 0..1. */
  progress: number;
  /** The project owning the focal stack, 0-based. */
  nearestProjectIndex: number;
  currentProject: WorkProject;
  /** 1-based collection position, the counter numerator. */
  collectionPosition: number;
  collectionSize: number;
  /** The emphasis beat currently inside its envelope, or null. */
  emphasisIndex: number | null;
  /** Effective envelope weight, already gated by the story's opening. */
  emphasisWeight: number;
  /** Whether the current project belongs to the editorial emphasis set. */
  isEmphasisProject: boolean;
  /** Frozen source frame the cat is asked to present. */
  catFrame: number;
  catPhase: CatPhase;
  /** 0 until 0.90, smooth to 1 at 0.985. */
  endingWeight: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/**
 * The narrative phase of the cat, from the same anchor table the scrub uses.
 * This labels where the story is; it never decides a frame.
 */
export function catPhaseAt(progress: number): CatPhase {
  const p = clamp01(progress);
  if (p >= 1) return "settled";
  let beat: CatBeat = CAT_STORY_ANCHORS[0].beat;
  for (const anchor of CAT_STORY_ANCHORS) {
    if (p >= anchor.at) beat = anchor.beat;
    else break;
  }
  return PHASE_OF_BEAT[beat];
}

/**
 * The emphasis beat whose envelope covers this progress, if any. At most one
 * can be active because the emphasis beats are two steps apart and the reach is
 * 0.35 steps.
 */
function activeEmphasis(position: number): { index: number; weight: number } | null {
  let best: { index: number; weight: number } | null = null;
  for (const index of CORRIDOR_EMPHASIS) {
    const weight = emphasisWeightAt(index - position);
    if (weight > 0 && (!best || weight > best.weight)) best = { index, weight };
  }
  return best;
}

export function getHeroNarrativeState(progress: number): HeroNarrativeState {
  const p = clamp01(progress);
  const nearest = nearestProjectIndex(p);
  const emphasis = activeEmphasis(p * (WORK_PROJECT_COUNT - 1));
  // The corridor's opening gate keeps progress 0 identical to HERO-01; the
  // narrative reports the same effective weight the card actually carries.
  const opened = storyEnhance(p);
  const emphasisWeight = emphasis ? emphasis.weight * opened : 0;

  return {
    progress: p,
    nearestProjectIndex: nearest,
    currentProject: WORK_PROJECTS[nearest],
    collectionPosition: nearest + 1,
    collectionSize: WORK_PROJECT_COUNT,
    emphasisIndex: emphasisWeight > 0 && emphasis ? emphasis.index : null,
    emphasisWeight,
    isEmphasisProject: isEmphasisIndex(nearest),
    catFrame: catFrameForProgress(p),
    catPhase: catPhaseAt(p),
    endingWeight: endingWeightAt(p),
  };
}
