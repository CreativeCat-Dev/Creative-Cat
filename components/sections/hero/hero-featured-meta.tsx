"use client";

import { useEffect, useRef, useState } from "react";
import { WORK_PROJECTS } from "@/lib/work";
import { microLabel } from "@/lib/ui";
import { getHeroNarrativeState } from "./hero-narrative";
import { getCorridorProgress, subscribeCorridorProgress } from "./hero-corridor.store";
import { getHeroMode, subscribeHeroMode } from "./hero-mode";

/**
 * Semantic Featured Work metadata, bound to the corridor.
 *
 * The store feeds this at scroll rate, but React only commits when the nearest
 * project changes: at most twelve times across the whole story. The visible
 * transition is a pair of short CSS animations, not a timeline and not a clock —
 * 80ms out, a 100ms settle in, latest index wins.
 *
 * Exactly one copy is semantic. The outgoing layer is `aria-hidden` and exists
 * only for the 180ms handoff, so the accessibility tree never holds two project
 * names and no live region announces the journey.
 */

const pad2 = (value: number) => String(value).padStart(2, "0");

type MetaSnapshot = { index: number; name: string };

const FIRST: MetaSnapshot = { index: 0, name: WORK_PROJECTS[0].name };

/** Kept slightly longer than the outgoing animation so the node can finish. */
const OUTGOING_MS = 190;

export function HeroFeaturedMeta() {
  const [current, setCurrent] = useState<MetaSnapshot>(FIRST);
  const [outgoing, setOutgoing] = useState<MetaSnapshot | null>(null);
  /** No entry animation on first paint; only on an actual project change. */
  const [hasChanged, setHasChanged] = useState(false);

  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const mountedAt = performance.now();
    /** The effective story mode, so mode flips are silent. */
    let storyActive = getHeroMode() === "enhanced";
    /** A restored page reconciles silently; only user-driven changes animate. */
    const interacted = { current: false };
    const markInteracted = () => {
      interacted.current = true;
    };

    const clearOutgoing = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setOutgoing(null);
    };

    const sync = () => {
      const active = getHeroMode() === "enhanced";
      const modeChanged = active !== storyActive;
      storyActive = active;

      // A disabled story (reduced motion, tablet, failed enhancement) is always
      // the static 01 state; it must never animate a narrative it isn't running.
      if (!active) {
        indexRef.current = 0;
        setCurrent(FIRST);
        setHasChanged(false);
        clearOutgoing();
        return;
      }

      const next = getHeroNarrativeState(getCorridorProgress());
      const index = next.nearestProjectIndex;
      if (index === indexRef.current) return;

      // On a restored mid-story load the controller publishes the real index
      // shortly after mount. That first reconciliation must be silent: the
      // server's Right Sight may be replaced, but it must not play a 180ms
      // crossfade at load. A media/resize mode change is silent for the same
      // reason. User input arms the animation immediately.
      const silent = modeChanged || (!interacted.current && performance.now() - mountedAt < 1000);
      const previousIndex = indexRef.current;
      indexRef.current = index;
      setCurrent({ index, name: next.currentProject.name });

      if (silent) {
        setHasChanged(false);
        clearOutgoing();
        return;
      }

      // Latest wins: replace the outgoing snapshot rather than queueing a
      // sequence, so a fast flick can never replay every project it passed.
      const previous = { index: previousIndex, name: WORK_PROJECTS[previousIndex].name };
      setOutgoing(previous);
      setHasChanged(true);

      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        setOutgoing(null);
      }, OUTGOING_MS);
    };

    const inputOptions: AddEventListenerOptions = { passive: true };
    window.addEventListener("wheel", markInteracted, inputOptions);
    window.addEventListener("touchstart", markInteracted, inputOptions);
    window.addEventListener("keydown", markInteracted, inputOptions);
    window.addEventListener("pointerdown", markInteracted, inputOptions);

    sync();
    const unsubscribe = subscribeCorridorProgress(sync);
    const unsubscribeMode = subscribeHeroMode(sync);
    return () => {
      unsubscribe();
      unsubscribeMode();
      window.removeEventListener("wheel", markInteracted);
      window.removeEventListener("touchstart", markInteracted);
      window.removeEventListener("keydown", markInteracted);
      window.removeEventListener("pointerdown", markInteracted);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const incomingClass = hasChanged ? "hero-meta-in" : undefined;
  const outgoingClass = "hero-meta-out";

  return (
    <div data-hero-featured-meta className="relative z-10 flex items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className={`text-muted-foreground ${microLabel}`}>Featured work</p>

        {/* Fixed box: changing the title never moves the card or the counter. */}
        <div className="relative mt-1.5 h-[21px] overflow-hidden text-[21px] leading-none">
          {outgoing ? (
            <p
              key={`out-${outgoing.index}`}
              aria-hidden
              className={`${outgoingClass} absolute inset-x-0 top-0 truncate font-heading tracking-[-0.01em]`}
            >
              {outgoing.name}
            </p>
          ) : null}
          <p
            key={`in-${current.index}`}
            data-hero-meta-name
            className={`${incomingClass ?? ""} truncate font-heading tracking-[-0.01em]`}
          >
            {current.name}
          </p>
        </div>
      </div>

      <div className="relative h-[13px] w-[46px] shrink-0 text-right text-[13px] leading-none">
        {outgoing ? (
          <p
            key={`out-count-${outgoing.index}`}
            aria-hidden
            className={`${outgoingClass} absolute top-0 right-0 font-heading tracking-[0.06em] text-muted-foreground tabular-nums`}
          >
            {pad2(outgoing.index + 1)}
          </p>
        ) : null}
        <p
          key={`in-count-${current.index}`}
          data-hero-meta-count
          className={`${incomingClass ?? ""} font-heading tracking-[0.06em] text-muted-foreground tabular-nums`}
        >
          {pad2(current.index + 1)}
        </p>
      </div>
    </div>
  );
}
