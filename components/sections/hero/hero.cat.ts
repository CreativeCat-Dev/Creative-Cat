/**
 * The approved hero motion master and its poster derivatives: the only place
 * their paths or metadata are declared. Everything that touches the cat — the
 * shader probe, seek instrumentation, the poster capture and the HERO-03 scrub —
 * reads this object instead of restating a filename.
 *
 * The v2 identity is deliberate. The owner replaced the suited cat with the
 * blue-hoodie/goggles character, so the video and both posters use versioned
 * filenames. Reusing an old URL would let a cached suit survive a deploy.
 *
 * This module deliberately imports nothing. Node's native type stripping can
 * then load it directly from a dev-time script, so QA tooling consumes the real
 * constant rather than a copy of it, and paths cannot drift between the app and
 * the harness.
 *
 * The master must not be re-encoded in place; derivatives are separate artifacts
 * under `public/work/hero/`. The PNG posters are captured from this master with
 * the accepted chroma-key renderer at frames 0 and 239.
 *
 * Measured from the container itself: 240 samples at a constant delta of 3750
 * ticks over a 90000 Hz timescale — exactly 24 fps for 10 s.
 */
export const CAT_SOURCE = {
  src: "/video/creative-cat-hero-v2.mp4",
  width: 1280,
  height: 720,
  fps: 24,
  frames: 240,
  duration: 10,
  posters: {
    start: "/work/hero/cat-poster-start-v2.png",
    settled: "/work/hero/cat-poster-v2.png",
  },
} as const;

/**
 * The accepted poses, as frame indices. Frame index is the canonical
 * coordinate: a time is always derived from it, never stored beside it, so the
 * table cannot drift from the source's frame rate.
 *
 * Re-verified against the v2 blue-hoodie/goggles master at every anchor in both
 * traversal directions; the values are unchanged. The goggles hide literal eye
 * contact, so `eyeContactStart` and `directViewer` describe the final frontal
 * attention poses rather than a visible gaze. Identifiers are kept for the
 * existing scrubber and story mapping.
 */
export const CAT_BEATS = {
  down: 0,
  downHoldEnd: 48,
  headUp: 72,
  firstSide: 108,
  oppositeSide: 144,
  returnCenter: 180,
  eyeContactStart: 210,
  directViewer: 228,
  settled: 239,
} as const;

export type CatBeat = keyof typeof CAT_BEATS;

/**
 * Centre of a frame. Seeks land mid-frame so a request for pose 108 can never
 * round back to 107 and present the previous pose.
 */
export function catFrameTime(frame: number): number {
  const clamped = Math.min(CAT_SOURCE.frames - 1, Math.max(0, Math.round(frame)));
  return (clamped + 0.5) / CAT_SOURCE.fps;
}

/** Seekable time for a named beat — the only way a consumer should ask for one. */
export function catBeatTime(beat: CatBeat): number {
  return catFrameTime(CAT_BEATS[beat]);
}

/** Normalised source geometry, for callers that only need the frame box. */
export type CatSource = typeof CAT_SOURCE;
