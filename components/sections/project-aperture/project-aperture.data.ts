/**
 * Next Level Projects — the Creative Cat showreel.
 *
 * DEL-00.3C replaces the DEL-00.3A/B four-image slideshow with the owner's
 * approved cinematic reel. The asset is copied byte-for-byte into
 * `public/video/` and never re-encoded by the app:
 *
 * - `creative-cat-showreel.mp4` — 1920x1080, 9.42s, 24fps, H.264, silent.
 *   SHA-256 38098de3c2cdeb161673747b143a4e41d3a023dd182abcb1d884ff0a115257e4
 * - `creative-cat-showreel-poster.webp` — the opening branded title card,
 *   extracted from that same video at 0.08s (no new artwork).
 *
 * The four authentic project artworks from DEL-00.3A/B
 * (`public/work/<slug>/glimpse.jpg` and the Splash Shine `aperture.jpg`) are
 * intentionally left on disk for the future portfolio; they are simply no
 * longer part of this section.
 *
 * The caption is portfolio-level and stable. It describes the studio's
 * capabilities, not the footage as verified client work.
 */

export const SHOWREEL = {
  src: "/video/creative-cat-showreel.mp4",
  poster: "/video/creative-cat-showreel-poster.webp",
  width: 1920,
  height: 1080,
  duration: 9.42,
  posterAlt:
    "Creative Cat showreel title card — the Creative Cat logo on midnight purple.",
  caption: {
    eyebrow: "01 / The Creative Cat Showreel",
    line: "Creativity in motion.",
    copy: "Strategy. Design. Technology. Motion.",
  },
} as const;
