"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { HAS_WORK_DESTINATIONS, WORK_PROJECTS } from "@/lib/work";
import { HeroCard } from "./hero-card";
import {
  corridorFrames,
  endingWeightAt,
  nearestProjectIndex,
  projectLinkEligible,
  type CorridorFrame,
  type CorridorMode,
} from "./hero-corridor.geometry";
import { getHeroNarrativeState, type HeroNarrativeState } from "./hero-narrative";
import { getCorridorProgress, setCorridorProgress, subscribeCorridorProgress } from "./hero-corridor.store";
import { getHeroMode, subscribeHeroMode } from "./hero-mode";
import { HeroProjectLink } from "./hero-project-link";

/**
 * The 13-project corridor, as one coherent 3D track behind the cat.
 *
 * Server-rendered at progress 0 so the approved HERO-01 composition is what a
 * visitor with no JavaScript sees. After hydration the store drives the DOM
 * directly: a progress change reads `corridorFrames` and writes position,
 * transform, opacity and stacking order per card, so a future scroll feed costs
 * one pass over thirteen elements rather than a React render.
 *
 * There is no loop of its own. Nothing here calls requestAnimationFrame; the
 * corridor is an output that waits for `setCorridorProgress` from HERO-03.
 *
 * Decorative by definition: every image is `alt=""` and each card wrapper is
 * `aria-hidden`. HERO-04.1 moved that attribute from the stage to the cards so
 * the focal project's link, when one exists, can sit outside a hidden subtree.
 * While no project has a destination the stage exposes nothing, exactly as
 * before, and the only visible project name in the hero stays in the semantic
 * Featured Work block (a future link carries the name only in its accessible
 * label).
 */

const INITIAL = corridorFrames(0);

/**
 * One responsive question here: `FULL_DEPTH_QUERY` decides whether an already
 * running story draws its whole depth. Below 860px the CTA row and the left lane
 * share a vertical band, so a short desktop switches to the shallow
 * presentation.
 *
 * Whether progress may run at all is not decided here. The effective hero mode
 * comes from `hero-mode.ts`, written once by `HeroStory` after it validates the
 * real content fit. Keeping that decision in one place is what prevents the
 * corridor from running a story the stage has already demoted.
 */
const FULL_DEPTH_QUERY = "(min-width: 1024px) and (min-height: 860px)";

/**
 * Numeric values are pre-formatted to fixed precision. React serialises floats
 * differently on the server than the client does, and an unrounded style string
 * hydrates as a mismatch — these strings are byte-identical on both sides.
 */
function styleOf(frame: CorridorFrame): CSSProperties {
  return {
    left: `${frame.left.toFixed(3)}%`,
    transform: `translate(-50%, 0px) translateZ(${frame.z.toFixed(1)}px) scale(${frame.scale.toFixed(4)}) rotateY(${frame.rotate.toFixed(2)}deg)`,
    opacity: frame.opacity.toFixed(3),
    zIndex: String(Math.round(frame.zIndex)),
    visibility: frame.visible ? "visible" : "hidden",
  };
}

declare global {
  interface Window {
    __heroCorridor?: {
      set: (progress: number) => void;
      get: () => number;
      mode: () => CorridorMode;
      frames: () => CorridorFrame[];
      nearest: () => number;
      narrative: () => HeroNarrativeState;
    };
  }
}

export function HeroCorridor() {
  const cards = useRef<Array<HTMLDivElement | null>>([]);
  const stage = useRef<HTMLDivElement | null>(null);
  /** The focal project's link layer, present only when a destination exists. */
  const linkLayer = useRef<HTMLDivElement | null>(null);
  /** The presentation currently painted, so QA reads the same mode as the DOM. */
  const mode = useRef<CorridorMode>("full");

  useEffect(() => {
    const depth = window.matchMedia(FULL_DEPTH_QUERY);

    const write = (progress: number, next: CorridorMode, running: boolean) => {
      const frames = corridorFrames(progress, next);
      const ending = endingWeightAt(progress);
      frames.forEach((frame, index) => {
        const el = cards.current[index];
        if (!el) return;
        const style = styleOf(frame);
        el.style.left = style.left as string;
        el.style.transform = style.transform as string;
        el.style.opacity = style.opacity as string;
        el.style.zIndex = style.zIndex as string;
        el.style.visibility = style.visibility as string;
        // The decorative cue is a CSS reflection of this one number; there is
        // no separate animation clock for emphasis.
        el.style.setProperty("--hero-emphasis", frame.emphasisWeight.toFixed(3));
        el.dataset.emphasis = frame.emphasis ? "true" : "false";
        el.dataset.emphasisWeight = frame.emphasisWeight.toFixed(3);
        el.dataset.focal = frame.focal ? "true" : "false";
        el.dataset.visible = frame.visible ? "true" : "false";
        el.dataset.lane = frame.lane;
      });
      mode.current = next;
      if (stage.current) {
        stage.current.dataset.mode = next;
        stage.current.style.setProperty("--hero-ending", ending.toFixed(3));
        stage.current.dataset.ending = ending.toFixed(3);
      }

      // Focal project link. It carries the focal card's own transform, so the
      // link box is the card box without a second geometry path. `hidden` is
      // driven by the story's running state, not by React: tablet, reduced
      // motion and no-JS therefore never gain a focusable project link. The
      // pointer only becomes eligible while the card is settled at the focal
      // plane; keyboard focus stays on the current focal project.
      const layer = linkLayer.current;
      if (layer) {
        const focalFrame = frames.find((frame) => frame.focal) ?? frames[0];
        const style = styleOf(focalFrame);
        layer.style.left = style.left as string;
        layer.style.transform = style.transform as string;
        layer.style.opacity = style.opacity as string;
        layer.style.zIndex = String(Math.round(focalFrame.zIndex) + 1);
        layer.style.visibility = style.visibility as string;
        if (layer.hidden === running) layer.hidden = !running;
        const eligible = projectLinkEligible(
          focalFrame,
          Boolean(WORK_PROJECTS[focalFrame.index].href)
        )
          ? "true"
          : "false";
        if (layer.dataset.eligible !== eligible) layer.dataset.eligible = eligible;
      }
    };

    /**
     * The effective mode decides whether the story runs. Static means progress
     * 0 — the server-rendered composition — not "the shallow story".
     */
    const sync = () => {
      const running = getHeroMode() === "enhanced";
      const next: CorridorMode = running && !depth.matches ? "shallow" : "full";
      write(running ? getCorridorProgress() : 0, next, running);
    };

    sync();
    const unsubscribe = subscribeCorridorProgress(sync);
    const unsubscribeMode = subscribeHeroMode(sync);
    depth.addEventListener("change", sync);

    return () => {
      unsubscribe();
      unsubscribeMode();
      depth.removeEventListener("change", sync);
    };
  }, []);

  /**
   * Development-only progress hook. The corridor has no play loop and no visible
   * control: this exists so deterministic QA states can be captured, and it is
   * absent from a production build. HERO-03 replaces it with the scroll feed.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    window.__heroCorridor = {
      set: setCorridorProgress,
      get: getCorridorProgress,
      mode: () => mode.current,
      frames: () => corridorFrames(getCorridorProgress(), mode.current),
      nearest: () => nearestProjectIndex(getCorridorProgress()),
      narrative: () => getHeroNarrativeState(getCorridorProgress()),
    };
    return () => {
      delete window.__heroCorridor;
    };
  }, []);

  return (
    <div
      ref={stage}
      data-hero-corridor
      data-mode="full"
      className="absolute inset-0 [perspective:2000px] [perspective-origin:50%_58%] [@media(min-width:1024px)_and_(max-height:859px)]:[&>[data-lane=support]]:hidden [@media(min-width:1024px)_and_(max-height:859px)]:[&>[data-lane=tail]]:hidden"
    >
      {WORK_PROJECTS.map((project, index) => {
        const frame = INITIAL[index];
        return (
          <div
            key={project.slug}
            ref={(el) => {
              cards.current[index] = el;
            }}
            aria-hidden
            className="absolute bottom-0 w-[var(--corridor-w)] origin-bottom will-change-transform"
            style={styleOf(frame)}
            data-corridor-index={index}
            data-focal={frame.focal ? "true" : "false"}
            data-emphasis={frame.emphasis ? "true" : "false"}
            data-visible={frame.visible ? "true" : "false"}
            data-lane={frame.lane}
          >
            <HeroCard
              project={project}
              sizes="(min-width: 1024px) 342px, 60vw"
              className="shadow-[0_40px_90px_-55px_rgba(21,14,52,0.7)]"
            />
          </div>
        );
      })}

      {/* One interaction for the whole corridor. Absent entirely until a project
          has a published destination, which is the shipped state today. */}
      {HAS_WORK_DESTINATIONS ? (
        <div
          ref={linkLayer}
          hidden
          data-hero-project-layer
          data-eligible="false"
          className="absolute bottom-0 aspect-[4/5] w-[var(--corridor-w)] origin-bottom"
        >
          <HeroProjectLink />
        </div>
      ) : null}
    </div>
  );
}
