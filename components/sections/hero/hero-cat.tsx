"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { CAT_SOURCE } from "./hero.cat";
import { createCatScrubber, type CatScrubberStats } from "./hero-cat.scrubber";
import { createCatKeyer, type CatKeyer, type CatSnapshot } from "./hero-cat.shader";
import { getCorridorProgress, subscribeCorridorProgress } from "./hero-corridor.store";
import {
  getHeroMode,
  getHeroModeServerSnapshot,
  subscribeHeroMode,
} from "./hero-mode";
import { catFrameForProgress } from "./hero-story.config";

/**
 * The hero cat layer: approved poster first, keyed canvas once it is genuinely
 * ready.
 *
 * HERO-04 adds one derived still: the opening (frame 0) keyed frame, used only
 * while the enhanced desktop story is at its start. Without it the server's
 * settled poster would visibly morph into the down pose during enhancement.
 * The settled poster remains the fallback for reduced motion, static layouts,
 * WebGL failure and any non-zero restored position.
 *
 * The live layer is a `<video>` that only ever supplies frames and a `<canvas>`
 * that draws the accepted HERO-00b matte over the hero background. The raw video
 * is never visible, so a green frame can never be exposed: the canvas stays at
 * opacity 0 until the first keyed frame has actually been drawn.
 *
 * All layers are the same 1280x720 frame in the same box, so a swap cannot move
 * the cat by a pixel. The swaps are DOM writes rather than React state: they
 * happen inside the callback that produced the pixels and must not wait for a
 * render.
 */

declare global {
  interface Window {
    __heroCat?: {
      status: () => "live" | "poster";
      /** Which still is painted while the canvas is not: `start`, `settled`, or `canvas`. */
      poster: () => "start" | "settled" | "canvas";
      desired: () => number;
      presented: () => number;
      draws: () => number;
      stats: () => CatScrubberStats;
      reset: () => void;
      latency: () => number[];
      snapshot: () => CatSnapshot | null;
      size: () => [number, number];
      bench: (iterations?: number) => number | null;
    };
  }
}

export function HeroCatStage({
  poster,
  startPoster,
  sizes,
}: {
  poster: string;
  startPoster: string;
  sizes: string;
}) {
  /**
   * Effective hero mode, not the candidate media query: the live layer mounts
   * only when the measured composition actually fits. The server snapshot is
   * static, so the server and the first client render both paint the poster.
   */
  const live =
    useSyncExternalStore(
      subscribeHeroMode,
      getHeroMode,
      getHeroModeServerSnapshot
    ) === "enhanced";

  const stageRef = useRef<HTMLDivElement | null>(null);
  const posterRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!live) return;
    const stage = stageRef.current;
    const posterLayer = posterRef.current;
    const startLayer = startRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!stage || !posterLayer || !video || !canvas) return;

    let keyer: CatKeyer | null = null;
    try {
      keyer = createCatKeyer(canvas, CAT_SOURCE.width, CAT_SOURCE.height);
    } catch {
      keyer = null;
    }
    if (!keyer) {
      // WebGL failure keeps the approved settled poster, never the opening
      // still: the fallback must be the static composition.
      if (startLayer) {
        startLayer.style.transition = "none";
        startLayer.style.opacity = "0";
        startLayer.style.display = "none";
      }
      posterLayer.style.transition = "none";
      posterLayer.style.opacity = "1";
      stage.dataset.cat = "poster";
      stage.dataset.poster = "settled";
      if (process.env.NODE_ENV !== "production") {
        console.warn("[hero] cat canvas unavailable; keeping the approved poster");
      }
      return;
    }

    let disposed = false;
    let ready = false;
    let draws = 0;
    /**
     * The opening still is only correct while the story is at its start. A
     * restored mid-story position gets the settled fallback until the canvas
     * arrives, because a still cannot represent the current frame.
     */
    let startActive = getCorridorProgress() < 0.002;

    const setStart = (visible: boolean) => {
      if (!startLayer) return;
      startLayer.style.transition = "none";
      startLayer.style.opacity = visible ? "1" : "0";
      startLayer.style.display = visible ? "block" : "none";
      // The settled poster sits underneath; it must not show through the
      // transparent parts of the opening still.
      posterLayer.style.transition = "none";
      posterLayer.style.opacity = visible ? "0" : "1";
      stage.dataset.poster = visible ? "start" : "settled";
    };

    const showPoster = () => {
      ready = false;
      if (startLayer) {
        startLayer.style.transition = "none";
        startLayer.style.opacity = "0";
        startLayer.style.display = "none";
      }
      posterLayer.style.transition = "none";
      posterLayer.style.opacity = "1";
      canvas.style.opacity = "0";
      stage.dataset.cat = "poster";
      stage.dataset.poster = "settled";
    };

    const showCanvas = () => {
      if (ready) return;
      ready = true;
      const fading = startActive ? startLayer : posterLayer;
      if (fading) {
        fading.style.transition = "opacity 320ms ease";
        fading.style.opacity = "0";
      }
      canvas.style.opacity = "1";
      stage.dataset.cat = "live";
      stage.dataset.poster = "canvas";
      // From here on the settled poster is the only valid fallback.
      startActive = false;
    };

    setStart(startActive);

    const draw = () => {
      if (disposed || !keyer || video.seeking || video.readyState < 2) return;
      // A seek can resolve while the context is lost. The renderer rejects that
      // submission, so the canvas must stay hidden: showing it here would reveal
      // a blank layer and make the cat disappear until the context is restored.
      if (!keyer.draw(video)) {
        showPoster();
        return;
      }
      draws += 1;
      showCanvas();
    };

    /**
     * Draw the frame that just resolved, in the same task.
     *
     * The scrubber starts its next seek as soon as the current one resolves, so
     * deferring the upload by even one animation frame would find the video
     * seeking again (readyState 1) and drop the frame. `seeked` means the frame
     * is decoded and `currentTime` names it, which is exactly what texImage2D
     * needs.
     */
    const flush = () => {
      if (!disposed) draw();
    };

    const scrubber = createCatScrubber({ video, onFrame: flush });

    /**
     * One story value, two consumers. The cat never reads scroll: it follows the
     * same progress the corridor renders from.
     */
    const unsubscribe = subscribeCorridorProgress(() => {
      const progress = getCorridorProgress();
      // Left the opening before the first keyed frame: the opening still is no
      // longer the truthful fallback, so use the approved settled poster.
      if (!ready && startActive && progress > 0.002) {
        startActive = false;
        setStart(false);
      }
      scrubber.setDesiredFrame(catFrameForProgress(progress));
    });
    // Start from whatever the story already is — a restored scroll position must
    // not be undone by an initial seek to the first pose.
    scrubber.setDesiredFrame(catFrameForProgress(getCorridorProgress()));
    scrubber.attach();

    const onLost = (event: Event) => {
      // Prevent default so the browser may restore the context; until it does,
      // the poster is the only thing on screen.
      event.preventDefault();
      showPoster();
    };

    const onRestored = () => {
      // The old program and textures died with the context; build a new keyer on
      // the same canvas and repaint the current pose.
      keyer = createCatKeyer(canvas, CAT_SOURCE.width, CAT_SOURCE.height);
      if (keyer) scrubber.repaint();
    };

    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    if (process.env.NODE_ENV !== "production") {
      window.__heroCat = {
        status: () => (stage.dataset.cat === "live" ? "live" : "poster"),
        poster: () => {
          const state = stage.dataset.poster;
          return state === "start" ? "start" : state === "canvas" ? "canvas" : "settled";
        },
        desired: () => scrubber.stats().desiredFrame,
        presented: () => scrubber.stats().presentedFrame,
        draws: () => draws,
        stats: () => scrubber.stats(),
        reset: () => scrubber.reset(),
        latency: () => scrubber.latencySamples(),
        snapshot: (): CatSnapshot | null => (keyer ? keyer.snapshot(video) : null),
        size: () => [canvas.width, canvas.height],
        /**
         * QA only: average cost of one full keyed draw, GPU included. The final
         * 1px read forces the driver to finish, so the number cannot be flattered
         * by queued work.
         */
        bench: (iterations = 8) => {
          if (!keyer) return null;
          const gl = canvas.getContext("webgl");
          const started = performance.now();
          for (let i = 0; i < iterations; i += 1) {
            // A lost context cannot be timed meaningfully; report no result.
            if (!keyer.draw(video)) return null;
          }
          if (gl) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
          return +((performance.now() - started) / iterations).toFixed(2);
        },
      };
    }

    return () => {
      disposed = true;
      unsubscribe();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      scrubber.dispose();
      // Remove the handlers before disposing so a late restore cannot rebuild a
      // renderer this generation no longer owns. The context itself stays alive
      // for the next setup on this preserved canvas.
      keyer?.dispose();
      showPoster();
      if (process.env.NODE_ENV !== "production") delete window.__heroCat;
    };
  }, [live]);

  return (
    <div
      ref={stageRef}
      data-hero-cat
      data-cat="poster"
      data-poster="settled"
      /*
       * Optical anchor, cat only. The desktop stage reserves a 60px bottom gap;
       * HERO-06B.3 recalibrated the drop from the retired 14–18px clamp after
       * measuring the keyed matte silhouette at all nine CAT_BEATS. The bottom
       * silhouette is constant across poses, so a 25.5px base puts it 1px above
       * the base rule at every desktop width. The drop is defined in
       * `app/globals.css` and follows the rem-scaled metadata row, because that
       * row moves the rule up at enlarged text. Size and horizontal centre are
       * unchanged.
       */
      className="absolute left-1/2 aspect-[16/9] h-[clamp(430px,72.3svh,651px)] -translate-x-1/2 bottom-[calc(var(--hero-cat-drop)*-1)]"
    >
      <div ref={posterRef} className="absolute inset-0" style={{ opacity: 1 }}>
        <Image
          src={poster}
          alt=""
          fill
          preload
          loading="eager"
          sizes={sizes}
          className="object-contain object-bottom"
        />
      </div>

      {live ? (
        <>
          {/* Opening still, enhanced desktop only: the down pose the story starts
              on, so enhancement does not morph the settled poster into frame 0. */}
          <div ref={startRef} className="absolute inset-0" style={{ opacity: 1 }}>
            <Image
              src={startPoster}
              alt=""
              fill
              preload
              loading="eager"
              sizes={sizes}
              className="object-contain object-bottom"
            />
          </div>
          {/* Frame source only: muted, paused, one pixel, never painted. */}
          <video
            ref={videoRef}
            src={CAT_SOURCE.src}
            muted
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
            disablePictureInPicture
            className="pointer-events-none absolute top-0 left-0 h-px w-px opacity-0"
          />
          <canvas
            ref={canvasRef}
            aria-hidden
            data-hero-cat-canvas
            className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300"
            style={{ opacity: 0 }}
          />
        </>
      ) : null}
    </div>
  );
}
