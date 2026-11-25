/**
 * Scroll-to-frame seek driver for the cat master.
 *
 * The source is a single GOP, so every seek decodes. The only policy that stays
 * honest under a fast scroll is "latest desired frame wins": at most one seek
 * is in flight, a newer desire replaces the queued one instead of stacking, and
 * the next seek is issued the moment the current one resolves.
 *
 * It never calls `play()`. The video is a frame source: `currentTime` is the
 * only thing written to it.
 */

import { CAT_SOURCE, catFrameTime } from "./hero.cat";

/** Samples kept for percentiles; the scrub can run for a long time. */
const LATENCY_WINDOW = 400;
/** If a seek never reports back, re-arm rather than issue a second request. */
const SEEK_WATCHDOG_MS = 500;

export type CatScrubberStats = {
  seeksIssued: number;
  framesPresented: number;
  maxInFlight: number;
  inFlight: boolean;
  desiredFrame: number;
  presentedFrame: number;
  latencyP50: number | null;
  latencyP95: number | null;
  latencyMax: number | null;
  /** Longest the canvas kept an old frame while the desired frame was moving. */
  longestStaleMs: number | null;
  /** Last desire -> matching frame, i.e. how long the pose took to catch up. */
  settleMs: number | null;
};

export type CatScrubber = {
  attach(): void;
  setDesiredFrame(frame: number): void;
  /** Re-draw the current frame without seeking (canvas restore, first paint). */
  repaint(): void;
  stats(): CatScrubberStats;
  /** Raw seek latencies, for per-phase measurement in QA. */
  latencySamples(): number[];
  /** Zero the counters so a scripted phase can be measured on its own. */
  reset(): void;
  dispose(): void;
};

export function createCatScrubber({
  video,
  onFrame,
}: {
  video: HTMLVideoElement;
  onFrame: () => void;
}): CatScrubber {
  const fps = CAT_SOURCE.fps;
  const maxFrame = CAT_SOURCE.frames - 1;
  /** Half a frame: closer than this and the video is already on the pose. */
  const HALF_FRAME = 0.5 / fps;

  const latency: number[] = [];

  let desired = 0;
  let presented = -1;
  let ready = false;
  let attached = false;
  let disposed = false;

  let inFlight = false;
  let seekStarted = 0;
  let watchdog = 0;

  let seeksIssued = 0;
  let framesPresented = 0;
  /** Structural: the boolean gate below means this can never exceed 1. */
  let maxInFlight = 0;

  let longestStale = 0;
  let settle: number | null = null;
  let lastDesiredAt = 0;
  let desiredSince = 0;

  const frameAt = (time: number) => Math.round(time * fps - 0.5);

  function present() {
    const raw = frameAt(video.currentTime);
    const frame = Math.max(0, Math.min(maxFrame, raw));
    const now = performance.now();
    const wasSeeking = seekStarted !== 0;

    // The number that matters for smoothness: how long the canvas kept an old
    // frame *after* the story first asked for another one.
    if (desiredSince) {
      const lag = now - desiredSince;
      if (lag > longestStale) longestStale = lag;
      desiredSince = 0;
    }

    presented = frame;
    framesPresented += 1;
    if (wasSeeking) {
      latency.push(now - seekStarted);
      if (latency.length > LATENCY_WINDOW) latency.shift();
      seekStarted = 0;
    }
    // Time from the last desire to the frame that satisfies it.
    if (frame === desired && lastDesiredAt) settle = now - lastDesiredAt;

    onFrame();
  }

  function clearWatchdog() {
    if (watchdog) {
      window.clearTimeout(watchdog);
      watchdog = 0;
    }
  }

  function armWatchdog() {
    clearWatchdog();
    watchdog = window.setTimeout(() => {
      watchdog = 0;
      if (!inFlight || disposed) return;
      // A genuine seek can take a while; only give up on a *missed* event.
      if (video.seeking) {
        armWatchdog();
        return;
      }
      inFlight = false;
      present();
      pump();
    }, SEEK_WATCHDOG_MS);
  }

  function pump() {
    if (disposed || !ready || inFlight) return;
    const target = catFrameTime(desired);
    if (Math.abs(video.currentTime - target) < HALF_FRAME) {
      if (presented !== desired && video.readyState >= 2) present();
      return;
    }
    inFlight = true;
    maxInFlight = Math.max(maxInFlight, 1);
    seekStarted = performance.now();
    seeksIssued += 1;
    armWatchdog();
    try {
      video.currentTime = target;
    } catch {
      inFlight = false;
      clearWatchdog();
    }
  }

  const onSeeked = () => {
    if (disposed) return;
    clearWatchdog();
    inFlight = false;
    present();
    pump();
  };

  const onMetadata = () => {
    if (disposed) return;
    ready = video.readyState >= 1;
    if (ready) pump();
  };

  const onError = () => {
    ready = false;
  };

  return {
    attach() {
      if (attached || disposed) return;
      attached = true;
      video.addEventListener("loadedmetadata", onMetadata);
      video.addEventListener("seeked", onSeeked);
      video.addEventListener("error", onError);
      if (video.readyState >= 1) {
        ready = true;
        pump();
      }
    },
    setDesiredFrame(frame) {
      if (disposed) return;
      const next = Math.max(0, Math.min(maxFrame, Math.round(frame)));
      if (next !== desired) {
        desired = next;
        lastDesiredAt = performance.now();
        if (!desiredSince) desiredSince = lastDesiredAt;
      }
      pump();
    },
    repaint() {
      if (!disposed) onFrame();
    },
    stats() {
      const sorted = latency.slice().sort((a, b) => a - b);
      const at = (q: number) => (sorted.length ? +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))].toFixed(1) : null);
      return {
        seeksIssued,
        framesPresented,
        maxInFlight,
        inFlight,
        desiredFrame: desired,
        presentedFrame: presented,
        latencyP50: at(0.5),
        latencyP95: at(0.95),
        latencyMax: sorted.length ? +sorted[sorted.length - 1].toFixed(1) : null,
        longestStaleMs: longestStale ? +longestStale.toFixed(1) : null,
        settleMs: settle === null ? null : +settle.toFixed(1),
      };
    },
    latencySamples() {
      return latency.slice();
    },
    reset() {
      seeksIssued = 0;
      framesPresented = 0;
      maxInFlight = 0;
      latency.length = 0;
      longestStale = 0;
      settle = null;
      lastDesiredAt = 0;
      desiredSince = 0;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearWatchdog();
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    },
  };
}
