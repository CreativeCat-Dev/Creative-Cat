import { CAT_BEATS, type CatBeat } from "./hero.cat";

/**
 * HERO-03 story configuration: the scroll budget and the cat choreography.
 *
 * This module is data. The controller reads the budget, the cat renderer reads
 * the anchors, and neither owns a second clock — there is one normalised story
 * value (`0 -> 1`) and everything else is a mapping from it.
 */

/**
 * Candidate enhanced-desktop gate.
 *
 * Width and height are both policy inputs. Below 1024px the hero uses the
 * tablet/phone composition; below 600px the complete enhanced stage cannot fit
 * (the arithmetic boundary for the current copy is ~588px, but 588–599 is not a
 * supported design height). Reduced motion is part of the same query, so the
 * story is never measured for a visitor who asked for less movement.
 *
 * This is only the candidate. The effective mode is decided after mount by the
 * story controller, which additionally validates that the real in-flow content
 * fits inside the resolved `100svh` stage. See `hero-mode.ts`.
 */
export const HERO_STORY = {
  media:
    "(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)",
  /**
   * Total scroll height of the hero wrapper, in `svh`. The stage stays ~100svh,
   * so the story travels for the remaining 400svh. Tunable pacing value:
   * HERO-03.1 raised it from 260 to 420 so an ordinary wheel gesture moves
   * through roughly one project instead of several; HERO-04.1 raised it to 500
   * so a project holds for 300px of travel at a 900px viewport instead of 240px.
   * This is the only pacing constant: the wrapper height, the pre-hydration
   * switch and the ScrollTrigger all derive from it. Change the number, nothing
   * else — the corridor, the cat and the anchors are all progress-mapped.
   */
  heightSvh: 500,
  minWidth: 1024,
  minHeight: 600,
} as const;

/** The value the wrapper's `height` resolves against. */
export const HERO_STORY_HEIGHT = `${HERO_STORY.heightSvh}svh`;

/**
 * Pre-hydration height switch, injected into the document head by the root
 * layout.
 *
 * Without it the server page is one viewport tall (the no-JS contract), so a
 * browser restoring a mid-story scroll position would clamp it to 0 and the
 * story would restart behind the visitor's back. Running this during parse —
 * before the browser restores scroll — lets the restored position survive, and
 * there is no one-viewport -> story-budget expansion on an enhanced load.
 *
 * It is generated from `HERO_STORY` so the query and the height cannot drift,
 * and it fails closed: no WebGL, no JS, reduced motion, a narrow viewport or a
 * short viewport all leave the server page exactly as rendered. Content fit
 * cannot be known here — the hero DOM and font metrics do not exist yet — so a
 * candidate viewport may still be corrected to static after hydration.
 */
export const HERO_STORY_INIT = `try{if(window.matchMedia(${JSON.stringify(
  HERO_STORY.media
)}).matches){document.documentElement.style.setProperty("--hero-story-h",${JSON.stringify(
  HERO_STORY_HEIGHT
)})}}catch(e){}`;

/**
 * Hero progress -> cat beat. These are choreography candidates, not brand
 * constants: tuning the story means editing these numbers, never the seek
 * maths. Deliberately independent of the seven corridor emphasis indices even
 * though HERO-04 aligns the two strong side looks with projects 05 and 09:
 * that alignment is a progress-location decision, not a coupling of data.
 *
 * HERO-04 measurement: at the frozen 0.40/0.62 locations the side-look peaks
 * landed on projects 06 and 08. Moving the two peaks to 0.345/0.665 puts them
 * on the 05 and 09 centres (frame 108 at p*12 = 4.14, frame 144 at 7.98) with
 * every other beat untouched.
 *
 * The frames themselves come from `CAT_BEATS`, so no frame index, fps or
 * filename is restated here.
 */
export const CAT_STORY_ANCHORS = [
  { at: 0, beat: "down" },
  { at: 0.12, beat: "downHoldEnd" },
  { at: 0.24, beat: "headUp" },
  { at: 0.345, beat: "firstSide" },
  { at: 0.665, beat: "oppositeSide" },
  { at: 0.78, beat: "returnCenter" },
  { at: 0.9, beat: "eyeContactStart" },
  { at: 0.965, beat: "directViewer" },
  { at: 1, beat: "settled" },
] as const satisfies readonly { at: number; beat: CatBeat }[];

const ANCHOR_FRAMES = CAT_STORY_ANCHORS.map(({ at, beat }) => ({ at, frame: CAT_BEATS[beat] }));

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Desired source frame for a story progress value: piecewise linear between the
 * beats above, rounded to a real source frame so the seek driver always asks
 * for a frame centre. This is the only place progress becomes a frame.
 */
export function catFrameForProgress(progress: number): number {
  const p = clamp01(Number.isFinite(progress) ? progress : 0);
  const first = ANCHOR_FRAMES[0];
  const last = ANCHOR_FRAMES[ANCHOR_FRAMES.length - 1];
  if (p <= first.at) return first.frame;
  if (p >= last.at) return last.frame;

  for (let i = 1; i < ANCHOR_FRAMES.length; i += 1) {
    const b = ANCHOR_FRAMES[i];
    if (p <= b.at) {
      const a = ANCHOR_FRAMES[i - 1];
      const t = (p - a.at) / (b.at - a.at);
      return Math.round(a.frame + (b.frame - a.frame) * t);
    }
  }
  return last.frame;
}
