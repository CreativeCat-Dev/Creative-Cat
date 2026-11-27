"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { getLenis } from "@/lib/lenis";
import { getScrollTrigger, scheduleRefresh } from "@/lib/scroll-trigger";
import {
  getProjectMotionPaused,
  registerProjectMotion,
  subscribeProjectMotion,
} from "@/lib/project-motion";
import { SHOWREEL } from "./project-aperture.data";
import "./project-aperture.css";

/**
 * Next Level Projects — the kinetic masthead with a continuous showreel
 * aperture.
 *
 * DEL-00.3A replaced DEL-00.3's full-stage aperture with the owner's reference
 * masthead. DEL-00.3B combined the two. DEL-00.3C keeps that architecture and
 * replaces the four-image slideshow with one persistent Creative Cat video:
 *
 * 1. One section-local ScrollTrigger scrubs the entrance. NEXT LEVEL enters from
 *    the left and PROJECTS from the right with the demo's `(1 - progress)^2`
 *    displacement; both settle and hold.
 * 2. The same trigger then releases the aperture. The shared media layer is
 *    clipped to the measured capsule slider rectangle. As the clip opens, the
 *    showreel's camera transform settles from the capsule crop to the full stage,
 *    the headline fragments part and fade, the ring fades, and the stable
 *    portfolio caption is read in.
 * 3. The video is a single `<video>` element. It is muted, looping and
 *    independent of scroll: the aperture only changes clip-path and the camera
 *    transform, never `currentTime`, never playback state. It keeps playing
 *    through the expansion and the reverse contraction.
 * 4. A 120px coral lens clones the aligned masthead and is disabled as soon as
 *    the aperture starts moving or the pointer enters the video capsule.
 *
 * Static-first: the server HTML is the aligned masthead, the branded poster and
 * the caption. No-JS and reduced motion keep exactly that, with no runway, no
 * sticky stage, no playback and no lens. There is one h2 named "Next Level
 * Projects"; the visual rows are decorative.
 */

const ENTRANCE_RATIO = 0.3;
const LENS_SIZE = 120;
const LENS_RADIUS = LENS_SIZE / 2;
/* A sub-pixel overscan keeps the transformed video covering the clip edge. */
const SHOWREEL_OVERSCAN = 1.002;

/* Normalised aperture phases, tuned against the measured trigger range. */
const CLIP_END = 0.62;
const CAMERA_END = 0.6;
const RING_FADE_END = 0.16;
const PART_START = 0.06;
const PART_END = 0.42;
const PART_FADE_START = 0.04;
const PART_FADE_END = 0.32;
const SCRIM_START = 0.42;
const SCRIM_END = 0.7;
const CAPTION_START = 0.68;
const CAPTION_END = 0.86;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

type StageMode = "enhanced" | "static";

type ApertureGeometry = {
  stageWidth: number;
  stageHeight: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  radius: number;
  centerX: number;
  centerY: number;
  restScale: number;
};

type NextLevelApi = {
  progress: () => number;
  scrollTo: (progress: number) => void;
  triggers: () => number;
  setPaused: (paused: boolean) => void;
  mode: () => StageMode;
  info: () => Record<string, unknown>;
};

declare global {
  interface Window {
    __nextLevelProjects?: NextLevelApi;
  }
}

const CAPTION_WORDS = SHOWREEL.caption.line.split(/\s+/).filter(Boolean);

export function NextLevelProjects() {
  const rootRef = useRef<HTMLElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const pauseControllerRef = useRef<((paused: boolean) => void) | null>(null);
  const paused = useSyncExternalStore(
    subscribeProjectMotion,
    getProjectMotionPaused,
    () => false,
  );

  // The menu switch and the video talk through this ref, so toggling the
  // preference never rebuilds the section or its ScrollTrigger.
  useEffect(() => {
    pauseControllerRef.current?.(paused);
  }, [paused]);

  // Offer the menu control only where the showreel actually exists. Reduced
  // motion has no playback, so the control is withdrawn (and re-offered if the
  // preference changes).
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let unregister: (() => void) | null = null;

    const sync = () => {
      if (query.matches) {
        unregister?.();
        unregister = null;
        return;
      }
      if (!unregister) unregister = registerProjectMotion();
    };

    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      unregister?.();
    };
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      const lens = lensRef.current;
      if (!root || !lens) return;

      const stage = root.querySelector<HTMLElement>("[data-nlp-stage]");
      const title = root.querySelector<HTMLElement>("[data-nlp-title]");
      const topLine = root.querySelector<HTMLElement>('[data-nlp-line="top"]');
      const bottomLine = root.querySelector<HTMLElement>('[data-nlp-line="bottom"]');
      const capsule = root.querySelector<HTMLElement>("[data-nlp-capsule]");
      const slider = root.querySelector<HTMLElement>("[data-nlp-slider]");
      const media = root.querySelector<HTMLElement>("[data-nlp-media]");
      const showreel = root.querySelector<HTMLElement>("[data-nlp-showreel]");
      const video = root.querySelector<HTMLVideoElement>("[data-nlp-video]");
      const caption = root.querySelector<HTMLElement>("[data-nlp-caption]");
      const scrim = root.querySelector<HTMLElement>("[data-nlp-scrim]");
      const fragmentNext = root.querySelector<HTMLElement>('[data-nlp-fragment="next"]');
      const fragmentLevel = root.querySelector<HTMLElement>('[data-nlp-fragment="level"]');
      const fragmentPr = root.querySelector<HTMLElement>('[data-nlp-fragment="pr"]');
      const fragmentJects = root.querySelector<HTMLElement>('[data-nlp-fragment="jects"]');
      const staticFigure = root.querySelector<HTMLElement>("[data-nlp-static]");

      if (
        !stage ||
        !title ||
        !topLine ||
        !bottomLine ||
        !capsule ||
        !slider ||
        !media ||
        !showreel ||
        !video ||
        !caption ||
        !scrim ||
        !fragmentNext ||
        !fragmentLevel ||
        !fragmentPr ||
        !fragmentJects
      ) {
        return;
      }

      const fragments = [fragmentNext, fragmentLevel, fragmentPr, fragmentJects];

      const ScrollTrigger = getScrollTrigger();
      const enhancedQuery = window.matchMedia(
        "(min-width: 1024px) and (min-height: 560px)",
      );
      const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const finePointerQuery = window.matchMedia("(pointer: fine)");

      let disposed = false;
      let layoutFrame = 0;
      let modeFrame = 0;
      let lastAlignWidth = -1;
      let progress = 0;
      let apertureA = 0;
      let mode: StageMode = "static";
      let apertureStart = 0.42;
      let entranceEnd = 0.3;
      let titleOffset = 0;
      let geometry: ApertureGeometry | null = null;
      let triggerRange: { start: number; end: number } | null = null;
      let storyTween: gsap.core.Tween | null = null;
      let lensActive = false;

      let cloneTitle: HTMLElement | null = null;
      let cloneTop: HTMLElement | null = null;
      let cloneBottom: HTMLElement | null = null;

      let playback: {
        sync: () => void;
        state: () => Record<string, unknown>;
        dispose: () => void;
      } | null = null;
      let lensController: {
        setDisabled: (disabled: boolean) => void;
        dispose: () => void;
      } | null = null;

      const triggerCount = () =>
        ScrollTrigger.getAll().filter((instance) => instance.trigger === root).length;

      const readBottomOffset = () => {
        const transform = getComputedStyle(bottomLine).transform;
        if (!transform || transform === "none") return 0;
        try {
          return new DOMMatrixReadOnly(transform).m41 || 0;
        } catch {
          return 0;
        }
      };

      /**
       * The capsule is the measured opening. It sits inside the PROJECTS row, so
       * its page position includes that row's entrance translation. Reading the
       * actual transform keeps the clip attached while both rows converge, and
       * subtracting that translation gives the rest geometry used by the
       * aperture.
       */
      const measureGeometry = () => {
        if (mode !== "enhanced") return;

        const stageRect = stage.getBoundingClientRect();
        const sliderRect = slider.getBoundingClientRect();
        if (stageRect.width <= 0 || stageRect.height <= 0 || sliderRect.width <= 0) {
          return;
        }

        const offset = readBottomOffset();
        const left = sliderRect.left - stageRect.left - offset;
        const top = sliderRect.top - stageRect.top;

        geometry = {
          stageWidth: stageRect.width,
          stageHeight: stageRect.height,
          top,
          left,
          right: stageRect.width - left - sliderRect.width,
          bottom: stageRect.height - top - sliderRect.height,
          radius: sliderRect.height / 2,
          centerX: left + sliderRect.width / 2,
          centerY: top + sliderRect.height / 2,
          restScale: sliderRect.width / stageRect.width,
        };

        titleOffset = title.getBoundingClientRect().top - stageRect.top;
      };

      /**
       * Match the visible width of both rows. The PROJECTS row is shorter at the
       * same size, so its font size is solved from the measured widths. The top
       * row is grown or shrunk to fill the available measure, which is what keeps
       * the composition edge-to-edge with 0.01em tracking instead of forcing the
       * fit with negative tracking.
       */
      const alignMasthead = () => {
        const available = title.clientWidth;
        if (available <= 0) return;

        const base = parseFloat(getComputedStyle(title).fontSize);
        if (!Number.isFinite(base) || base <= 0) return;

        topLine.style.fontSize = `${base}px`;
        const naturalTop = topLine.getBoundingClientRect().width;
        if (naturalTop <= 0) return;

        const fit = available / naturalTop;
        const topSize = base * fit;
        topLine.style.fontSize = `${topSize.toFixed(2)}px`;

        const target = topLine.getBoundingClientRect().width;
        bottomLine.style.fontSize = `${topSize.toFixed(2)}px`;
        const naturalBottom = bottomLine.getBoundingClientRect().width;

        let bottomSize = topSize;
        if (naturalBottom > 0) {
          bottomSize = topSize * (target / naturalBottom);
          bottomLine.style.fontSize = `${bottomSize.toFixed(2)}px`;

          const actual = bottomLine.getBoundingClientRect().width;
          if (actual > 0 && Math.abs(actual - target) > 0.5) {
            bottomSize *= target / actual;
            bottomLine.style.fontSize = `${bottomSize.toFixed(2)}px`;
          }
        }

        lastAlignWidth = available;

        if (cloneTitle) {
          // The clone must span the real h2's content box, not the fitted row
          // width: both rows are centred inside it. Using `target` here would
          // shift the clone left by the centring slack.
          cloneTitle.style.width = `${available}px`;
          if (cloneTop) cloneTop.style.fontSize = topLine.style.fontSize;
          if (cloneBottom) cloneBottom.style.fontSize = bottomLine.style.fontSize;
          if (lensActive) positionClone();
        }
      };

      /**
       * The lens holds a real clone of the heading. The clone is positioned so
       * its page-space origin is the real masthead's origin: the lens is
       * translated by (x, y) with a -50% self-offset, so the clone's local
       * offset is `rect - (x - radius)`. Font sizes and row transforms are
       * copied on every alignment/scroll update, which is what makes the white
       * fragments line up exactly with the dark ones underneath.
       */
      const positionClone = () => {
        if (!cloneTitle) return;
        const rect = title.getBoundingClientRect();
        const x = Number(gsap.getProperty(lens, "x")) || 0;
        const y = Number(gsap.getProperty(lens, "y")) || 0;
        cloneTitle.style.left = `${rect.left - x + LENS_RADIUS}px`;
        cloneTitle.style.top = `${rect.top - y + LENS_RADIUS}px`;
      };

      const createClone = () => {
        if (cloneTitle) return;

        const copy = title.cloneNode(true) as HTMLElement;
        copy.removeAttribute("id");
        copy.removeAttribute("aria-labelledby");
        copy.setAttribute("aria-hidden", "true");
        copy.querySelector(".sr-only")?.remove();
        copy.style.position = "absolute";
        copy.style.margin = "0";
        copy.style.width = `${title.getBoundingClientRect().width}px`;

        // The clone contains the static poster, never the video: one decoder,
        // one playback surface.
        copy.querySelector("video")?.remove();
        lens.replaceChildren(copy);
        cloneTitle = copy;
        cloneTop = copy.querySelector<HTMLElement>('[data-nlp-line="top"]');
        cloneBottom = copy.querySelector<HTMLElement>('[data-nlp-line="bottom"]');

        if (cloneTop) cloneTop.style.fontSize = topLine.style.fontSize;
        if (cloneBottom) cloneBottom.style.fontSize = bottomLine.style.fontSize;

        if (cloneTop) cloneTop.style.transform = topLine.style.transform;
        if (cloneBottom) cloneBottom.style.transform = bottomLine.style.transform;
      };

      /* ---------------------------------------------------------------- playback */

      /**
       * One video element, one lifecycle.
       *
       * The source is not requested until the section approaches the viewport.
       * Playback is a native `play()`/`pause()` decision driven by visibility,
       * document state, the menu preference and reduced motion. Scroll progress
       * never touches the video: the aperture only clips and transforms it.
       *
       * `pause()` keeps `currentTime`, so a paused reel resumes exactly where it
       * stopped. A rejected `play()` (autoplay policy, interruption) is caught;
       * the poster stays visible until a real frame is available.
       */
      const startPlayback = () => {
        let near = false;
        let visible = false;
        let stopped = false;
        let sourceRequested = false;

        const canPlay = () =>
          !stopped &&
          visible &&
          !document.hidden &&
          !getProjectMotionPaused() &&
          !reducedMotionQuery.matches;

        const requestSource = () => {
          if (sourceRequested) return;
          sourceRequested = true;
          video.muted = true;
          // The poster covers the element until the first decoded frame.
          video.preload = "auto";
          video.src = SHOWREEL.src;
          video.load();
        };

        const pause = () => {
          if (!video.paused) video.pause();
        };

        const sync = () => {
          if (!canPlay()) {
            pause();
            return;
          }

          requestSource();
          if (!video.paused) return;

          video.muted = true;
          // `play()` can reject after a route change, an autoplay policy or a
          // pause that lands while it is pending. The poster/last frame stays
          // and the next lifecycle event retries; nothing restarts or seeks.
          const attempt = video.play();
          if (attempt) attempt.catch(() => {});
        };

        const nearObserver =
          typeof IntersectionObserver === "undefined"
            ? null
            : new IntersectionObserver(
                (entries) => {
                  near = entries.some((entry) => entry.isIntersecting);
                  if (near) requestSource();
                },
                { rootMargin: "300px 0px", threshold: 0 },
              );
        nearObserver?.observe(root);

        const visibleObserver =
          typeof IntersectionObserver === "undefined"
            ? null
            : new IntersectionObserver(
                (entries) => {
                  visible = entries.some((entry) => entry.isIntersecting);
                  sync();
                },
                { threshold: 0.05 },
              );
        visibleObserver?.observe(root);

        const onVisibilityChange = () => sync();
        const onPageShow = () => sync();

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pageshow", onPageShow);

        return {
          sync,
          state: () => ({
            near,
            visible,
            canPlay: canPlay(),
            sourceRequested,
          }),
          dispose: () => {
            stopped = true;
            nearObserver?.disconnect();
            visibleObserver?.disconnect();
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("pageshow", onPageShow);
            pause();
          },
        };
      };

      /* --------------------------------------------------------------------- lens */

      /** Decorative pointer lens. Fine pointers and motion only. */
      const startLens = () => {
        if (!finePointerQuery.matches) {
          return { setDisabled: () => {}, dispose: () => {} };
        }

        createClone();

        // The lens is centred on the pointer. GSAP owns every transform
        // component, so the initial offset is set here rather than in CSS.
        gsap.set(lens, {
          xPercent: -50,
          yPercent: -50,
          x: -LENS_SIZE,
          y: -LENS_SIZE,
          scale: 0.2,
          opacity: 0,
        });

        let active = false;
        let disabled = false;
        let follow: gsap.core.Tween | null = null;
        let fade: gsap.core.Tween | null = null;
        const pointer = { x: -LENS_SIZE, y: -LENS_SIZE };

        const apply = () => {
          gsap.set(lens, { x: pointer.x, y: pointer.y });
          positionClone();
        };

        const show = (event: PointerEvent) => {
          if (disabled) return;

          if (!active) {
            active = true;
            lensActive = true;
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            gsap.set(lens, { x: pointer.x, y: pointer.y });
            lens.style.visibility = "visible";
            positionClone();
            fade?.kill();
            fade = gsap.to(lens, {
              opacity: 1,
              scale: 1,
              duration: 0.24,
              ease: "power2.out",
              overwrite: "auto",
            });
          }

          follow?.kill();
          follow = gsap.to(pointer, {
            x: event.clientX,
            y: event.clientY,
            duration: 0.24,
            ease: "power3.out",
            overwrite: true,
            onUpdate: apply,
          });
        };

        const hide = () => {
          if (!active) return;
          active = false;
          lensActive = false;
          follow?.kill();
          follow = null;
          fade?.kill();
          fade = gsap.to(lens, {
            opacity: 0,
            scale: 0.2,
            duration: 0.16,
            ease: "power2.in",
            overwrite: "auto",
            onComplete: () => {
              if (!active) lens.style.visibility = "hidden";
            },
          });
        };

        const onPointerMove = (event: PointerEvent) => {
          if (event.pointerType === "touch") return;
          // The capsule is the live video window; the lens must not cover it
          // with a still, so it hides as soon as the pointer enters it.
          const target = event.target;
          if (target instanceof Element && target.closest("[data-nlp-capsule]")) {
            hide();
            return;
          }
          show(event);
        };

        title.addEventListener("pointermove", onPointerMove);
        title.addEventListener("pointerleave", hide);
        title.addEventListener("pointercancel", hide);
        window.addEventListener("scroll", hide, { passive: true });
        window.addEventListener("blur", hide);

        return {
          setDisabled: (next: boolean) => {
            if (disabled === next) return;
            disabled = next;
            if (disabled) hide();
          },
          dispose: () => {
            title.removeEventListener("pointermove", onPointerMove);
            title.removeEventListener("pointerleave", hide);
            title.removeEventListener("pointercancel", hide);
            window.removeEventListener("scroll", hide);
            window.removeEventListener("blur", hide);

            follow?.kill();
            fade?.kill();
            lensActive = false;
            lens.style.visibility = "hidden";
            gsap.set(lens, { opacity: 0, scale: 0.2 });
            lens.replaceChildren();
            cloneTitle = null;
            cloneTop = null;
            cloneBottom = null;
          },
        };
      };

      /* ------------------------------------------------------------------- story */

      const computeTriggerRange = () => {
        const sectionRect = root.getBoundingClientRect();
        const sectionTop = sectionRect.top + window.scrollY;
        const sectionBottom = sectionRect.bottom + window.scrollY;
        const stageRect = stage.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        const offset = Math.max(0, titleRect.top - stageRect.top);
        const viewport = window.innerHeight;

        return {
          start: sectionTop + offset - viewport * 0.94,
          end: sectionBottom - viewport,
          offset,
        };
      };

      const updatePhases = (range: { start: number; end: number; offset: number }) => {
        const total = Math.max(1, range.end - range.start);
        titleOffset = range.offset;
        const rawStart = (window.innerHeight * 0.94 - range.offset) / total;
        apertureStart = Math.min(0.65, Math.max(0.25, rawStart));
        entranceEnd = Math.max(0.08, apertureStart * 0.72);
      };

      const apply = (value: number) => {
        const raw = clamp01(value);
        progress = raw;

        if (mode !== "enhanced" || !geometry) return;

        const ep = entranceEnd > 0 ? clamp01(raw / entranceEnd) : 1;
        const offset = (1 - ep) ** 2 * window.innerWidth * ENTRANCE_RATIO;
        const a = clamp01((raw - apertureStart) / Math.max(0.0001, 1 - apertureStart));
        apertureA = a;

        const reveal = easeInOutCubic(clamp01(a / CLIP_END));
        const camera = easeInOutCubic(clamp01(a / CAMERA_END));
        const part = easeInOutCubic(
          clamp01((a - PART_START) / (PART_END - PART_START)),
        );
        const fade = 1 - clamp01((a - PART_FADE_START) / (PART_FADE_END - PART_FADE_START));
        const lift = -window.innerHeight * 0.06 * part;

        // Entrance: opposing rows. Aperture: the top row lifts while its two
        // fragments spread; PROJECTS' letters part away from the capsule.
        topLine.style.transform = `translate3d(${-offset.toFixed(2)}px, ${lift.toFixed(
          2,
        )}px, 0px)`;
        bottomLine.style.transform = `translate3d(${offset.toFixed(2)}px, 0px, 0px)`;

        if (cloneTop) cloneTop.style.transform = topLine.style.transform;
        if (cloneBottom) cloneBottom.style.transform = bottomLine.style.transform;

        const topSpread = window.innerWidth * 0.11 * part;
        const bottomSpread = window.innerWidth * 0.32 * part;

        fragmentNext.style.transform = `translate3d(${-topSpread.toFixed(2)}px, 0px, 0px)`;
        fragmentLevel.style.transform = `translate3d(${topSpread.toFixed(2)}px, 0px, 0px)`;
        fragmentPr.style.transform = `translate3d(${-bottomSpread.toFixed(2)}px, 0px, 0px)`;
        fragmentJects.style.transform = `translate3d(${bottomSpread.toFixed(2)}px, 0px, 0px)`;

        for (const fragment of fragments) {
          fragment.style.opacity = fade.toFixed(3);
        }

        capsule.style.opacity = (1 - clamp01(a / RING_FADE_END)).toFixed(3);

        // The media clip is the measured capsule rectangle scaled toward the
        // stage edges. It is applied to the full-stage layer, independently of
        // the video, which simply fills the showreel.
        const inverse = 1 - reveal;
        const clipLeft = Math.max(0, geometry.left + offset) * inverse;
        const clipRight = Math.max(0, geometry.right - offset) * inverse;
        const clipTop = geometry.top * inverse;
        const clipBottom = geometry.bottom * inverse;
        const radius = geometry.radius * inverse;

        media.style.clipPath = `inset(${clipTop.toFixed(2)}px ${clipRight.toFixed(
          2,
        )}px ${clipBottom.toFixed(2)}px ${clipLeft.toFixed(
          2,
        )}px round ${radius.toFixed(2)}px)`;

        // Cinematic release: the same showreel scales from the capsule crop to
        // 1x and settles at the stage centre. It is fully 1x before the clip is
        // fully open, and the small overscan guarantees no uncovered edge.
        const restX = geometry.centerX + offset - geometry.stageWidth / 2;
        const restY = geometry.centerY - geometry.stageHeight / 2;
        const scale =
          (geometry.restScale + (1 - geometry.restScale) * camera) * SHOWREEL_OVERSCAN;

        showreel.style.transform = `translate3d(${(restX * (1 - camera)).toFixed(
          2,
        )}px, ${(restY * (1 - camera)).toFixed(2)}px, 0px) scale(${scale.toFixed(5)})`;

        const read = clamp01((a - CAPTION_START) / (CAPTION_END - CAPTION_START));
        caption.style.setProperty("--nlp-caption-opacity", clamp01(read * 8).toFixed(3));
        caption.style.setProperty("--nlp-caption-q", read.toFixed(4));
        scrim.style.opacity = clamp01(
          (a - SCRIM_START) / (SCRIM_END - SCRIM_START),
        ).toFixed(3);

        // The video is never paused or seeked here on purpose: playback is
        // independent of the aperture, so it keeps running through the reveal.
        lensController?.setDisabled(a > 0.02);
      };

      const clearInline = () => {
        topLine.style.removeProperty("transform");
        bottomLine.style.removeProperty("transform");
        for (const fragment of fragments) {
          fragment.style.removeProperty("transform");
          fragment.style.removeProperty("opacity");
        }
        capsule.style.removeProperty("opacity");
        media.style.removeProperty("clip-path");
        showreel.style.removeProperty("transform");
        caption.style.removeProperty("--nlp-caption-opacity");
        caption.style.removeProperty("--nlp-caption-q");
        scrim.style.removeProperty("opacity");
        if (cloneTop) cloneTop.style.removeProperty("transform");
        if (cloneBottom) cloneBottom.style.removeProperty("transform");

        progress = 0;
        apertureA = 0;
        lensController?.setDisabled(false);
      };

      const teardownStory = () => {
        if (!storyTween) return;
        storyTween.scrollTrigger?.kill();
        storyTween.kill();
        storyTween = null;
        triggerRange = null;
      };

      const setupStory = () => {
        if (storyTween) return;

        const state = { value: 0 };
        const initial = computeTriggerRange();
        updatePhases(initial);

        const tween = gsap.to(state, {
          value: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: () => computeTriggerRange().start,
            end: () => computeTriggerRange().end,
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: (self) => {
              const range = computeTriggerRange();
              updatePhases(range);
              triggerRange = { start: self.start, end: self.end };
              measureGeometry();
              apply(self.progress);
            },
          },
          onUpdate: () => apply(state.value),
        });

        storyTween = tween;
        const trigger = tween.scrollTrigger;
        if (trigger) {
          triggerRange = { start: trigger.start, end: trigger.end };
          measureGeometry();
          apply(trigger.progress);
        }
      };

      const ensureMotion = (enabled: boolean) => {
        if (!enabled) {
          if (playback) {
            playback.dispose();
            playback = null;
            pauseControllerRef.current = null;
          }
          if (lensController) {
            lensController.dispose();
            lensController = null;
          }
          return;
        }

        if (!playback) {
          playback = startPlayback();
          pauseControllerRef.current = () => playback?.sync();
        }

        if (!finePointerQuery.matches) {
          lensController?.dispose();
          lensController = null;
        } else if (!lensController) {
          lensController = startLens();
        }
      };

      const applyMode = () => {
        if (disposed) return;

        const reduced = reducedMotionQuery.matches;
        const enhanced = enhancedQuery.matches && !reduced;
        const nextMode: StageMode = enhanced ? "enhanced" : "static";

        mode = nextMode;
        ensureMotion(!reduced);

        root.dataset.nlpMode = nextMode;
        root.dataset.nlpMotion = reduced ? "off" : "on";

        if (enhanced) {
          clearInline();
          alignMasthead();
          measureGeometry();
          setupStory();
        } else {
          teardownStory();
          clearInline();
          alignMasthead();
        }

        // Playback conditions depend on mode changes (reduced motion), so ask
        // for a fresh sync after the layout is settled.
        playback?.sync();
        scheduleRefresh();
      };

      const scheduleMode = () => {
        if (disposed || modeFrame) return;
        modeFrame = window.requestAnimationFrame(() => {
          modeFrame = 0;
          applyMode();
        });
      };

      const scheduleLayout = () => {
        if (disposed || layoutFrame) return;
        layoutFrame = window.requestAnimationFrame(() => {
          layoutFrame = 0;
          if (Math.abs(title.clientWidth - lastAlignWidth) >= 0.5) {
            alignMasthead();
          }
          measureGeometry();
          if (mode === "enhanced") apply(progress);
          scheduleRefresh();
        });
      };

      enhancedQuery.addEventListener("change", scheduleMode);
      reducedMotionQuery.addEventListener("change", scheduleMode);
      finePointerQuery.addEventListener("change", scheduleMode);

      const resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => scheduleLayout());
      resizeObserver?.observe(stage);
      resizeObserver?.observe(title);

      document.fonts?.ready
        .then(() => {
          if (disposed) return;
          alignMasthead();
          measureGeometry();
          if (mode === "enhanced") apply(progress);
          scheduleRefresh();
        })
        .catch(() => {
          // A font failure leaves the CSS fallback metrics in place; the
          // measured alignment simply never runs. Nothing else to recover.
        });

      // First measurement before paint. The server HTML is already the aligned
      // static composition; this only promotes it to the measured aperture.
      applyMode();

      if (process.env.NODE_ENV !== "production") {
        const api: NextLevelApi = {
          progress: () => +progress.toFixed(4),
          scrollTo: (value) => {
            if (!triggerRange) return;
            const top =
              triggerRange.start +
              (triggerRange.end - triggerRange.start) * clamp01(value);
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
            else window.scrollTo({ top, behavior: "instant" });
          },
          triggers: triggerCount,
          setPaused: (value) => pauseControllerRef.current?.(value),
          mode: () => mode,
          info: () => {
            const sectionRect = root.getBoundingClientRect();
            const titleRect = title.getBoundingClientRect();
            const topRect = topLine.getBoundingClientRect();
            const bottomRect = bottomLine.getBoundingClientRect();
            const capsuleRect = capsule.getBoundingClientRect();
            const mediaRect = media.getBoundingClientRect();
            const lensRect = lens.getBoundingClientRect();
            const cloneRect = cloneTop?.getBoundingClientRect();
            const clonePoster = lens.querySelector<HTMLImageElement>(
              "[data-nlp-capsule-poster]",
            );
            const capsulePoster = slider.querySelector<HTMLImageElement>(
              "[data-nlp-capsule-poster]",
            );
            const capsuleStyle = getComputedStyle(capsule);
            const topStyle = getComputedStyle(topLine);
            const bottomStyle = getComputedStyle(bottomLine);
            const showreelStyle = getComputedStyle(showreel);
            const videoStyle = getComputedStyle(video);

            return {
              mode,
              progress: +progress.toFixed(4),
              aperture: {
                a: +apertureA.toFixed(4),
                start: +apertureStart.toFixed(4),
                entranceEnd: +entranceEnd.toFixed(4),
                titleOffset: +titleOffset.toFixed(1),
              },
              trigger: triggerRange,
              triggers: triggerCount(),
              section: {
                top: +(sectionRect.top + window.scrollY).toFixed(1),
                height: +sectionRect.height.toFixed(1),
              },
              rows: {
                top: +topRect.width.toFixed(1),
                bottom: +bottomRect.width.toFixed(1),
                topTransform: topStyle.transform,
                bottomTransform: bottomStyle.transform,
                topOpacity: topStyle.opacity,
                bottomOpacity: bottomStyle.opacity,
                topColor: topStyle.color,
                bottomColor: bottomStyle.color,
              },
              capsule: {
                width: +capsuleRect.width.toFixed(1),
                height: +capsuleRect.height.toFixed(1),
                borderColor: capsuleStyle.borderTopColor,
                background: capsuleStyle.backgroundColor,
                opacity: +(Number(capsuleStyle.opacity) || 0).toFixed(3),
                posterVisibility: capsulePoster
                  ? getComputedStyle(capsulePoster).visibility
                  : null,
              },
              media: {
                display: getComputedStyle(media).display,
                clipPath: getComputedStyle(media).clipPath,
                rect: {
                  width: +mediaRect.width.toFixed(1),
                  height: +mediaRect.height.toFixed(1),
                },
                transform: showreelStyle.transform,
                videoDisplay: videoStyle.display,
                videoFit: videoStyle.objectFit,
                videoRect: {
                  width: +video.getBoundingClientRect().width.toFixed(1),
                  height: +video.getBoundingClientRect().height.toFixed(1),
                },
              },
              video: {
                count: root.querySelectorAll("video").length,
                src: video.getAttribute("src"),
                poster: video.getAttribute("poster"),
                paused: video.paused,
                muted: video.muted,
                loop: video.loop,
                playsInline: video.playsInline,
                readyState: video.readyState,
                currentTime: +video.currentTime.toFixed(3),
                display: videoStyle.display,
                covers: videoStyle.objectFit,
              },
              playback: playback?.state() ?? null,
              figure: {
                display: staticFigure ? getComputedStyle(staticFigure).display : null,
                height: staticFigure
                  ? +staticFigure.getBoundingClientRect().height.toFixed(1)
                  : null,
              },
              caption: {
                position: getComputedStyle(caption).position,
                opacity: +(Number(getComputedStyle(caption).opacity) || 0).toFixed(3),
                q:
                  Number.parseFloat(
                    getComputedStyle(caption).getPropertyValue("--nlp-caption-q"),
                  ) || 0,
                scrim: +(Number(getComputedStyle(scrim).opacity) || 0).toFixed(3),
              },
              lens: {
                active: lensActive,
                visibility: getComputedStyle(lens).visibility,
                opacity: +(Number(gsap.getProperty(lens, "opacity")) || 0).toFixed(3),
                width: +lensRect.width.toFixed(1),
                baseWidth: lens.offsetWidth,
                baseHeight: lens.offsetHeight,
                background: getComputedStyle(lens).backgroundColor,
                cloneDelta: cloneRect
                  ? {
                      left: +(cloneRect.left - topRect.left).toFixed(2),
                      top: +(cloneRect.top - topRect.top).toFixed(2),
                    }
                  : null,
                cloneFilter: clonePoster ? getComputedStyle(clonePoster).filter : null,
                cloneVideoCount: lens.querySelectorAll("video").length,
              },
              paused: getProjectMotionPaused(),
              reduced: reducedMotionQuery.matches,
              height: +titleRect.height.toFixed(1),
              topFont: topStyle.fontSize,
              bottomFont: bottomStyle.fontSize,
              overflow:
                document.documentElement.scrollWidth > window.innerWidth + 1,
            };
          },
        };

        window.__nextLevelProjects = api;
      }

      return () => {
        disposed = true;
        if (layoutFrame) {
          cancelAnimationFrame(layoutFrame);
          layoutFrame = 0;
        }
        if (modeFrame) {
          cancelAnimationFrame(modeFrame);
          modeFrame = 0;
        }

        enhancedQuery.removeEventListener("change", scheduleMode);
        reducedMotionQuery.removeEventListener("change", scheduleMode);
        finePointerQuery.removeEventListener("change", scheduleMode);
        resizeObserver?.disconnect();

        teardownStory();
        playback?.dispose();
        playback = null;
        lensController?.dispose();
        lensController = null;
        pauseControllerRef.current = null;

        root.removeAttribute("data-nlp-mode");
        root.removeAttribute("data-nlp-motion");

        if (
          process.env.NODE_ENV !== "production" &&
          window.__nextLevelProjects &&
          window.__nextLevelProjects.triggers === triggerCount
        ) {
          delete window.__nextLevelProjects;
        }

        ScrollTrigger.refresh();
      };
    },
    { scope: rootRef },
  );

  return (
    <>
      <section
        ref={rootRef}
        data-next-level
        data-header-surface="inherit"
        aria-labelledby="next-level-projects-title"
      >
        <div data-nlp-stage>
          <div data-nlp-masthead>
            <h2 id="next-level-projects-title" data-nlp-title>
              <span className="sr-only">Next Level Projects</span>
              <span aria-hidden data-nlp-lines>
                <span data-nlp-line="top">
                  <span data-nlp-fragment="next">NEXT</span>
                  <span data-nlp-fragment="level">LEVEL</span>
                </span>
                <span data-nlp-line="bottom">
                  <span data-nlp-fragment="pr">PR</span>
                  <span data-nlp-capsule>
                    <span data-nlp-slider>
                      {/* The capsule shows the branded poster. Enhanced mode
                          hides it and reveals the shared video through the
                          same measured rectangle. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        data-nlp-capsule-poster
                        src={SHOWREEL.poster}
                        alt=""
                        width={SHOWREEL.width}
                        height={SHOWREEL.height}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </span>
                  </span>
                  <span data-nlp-fragment="jects">JECTS</span>
                </span>
              </span>
            </h2>
          </div>

          {/*
           * One shared media layer. At rest it is clipped to the measured
           * capsule slider; the aperture only changes its clip and the
           * showreel's camera transform. The video keeps playing throughout and
           * is never cloned or replaced. On tablet/mobile the same layer sits
           * in normal flow below the masthead.
           */}
          <div data-nlp-media aria-hidden="true">
            <div data-nlp-showreel>
              <video
                data-nlp-video
                className="nlp-video"
                poster={SHOWREEL.poster}
                width={SHOWREEL.width}
                height={SHOWREEL.height}
                muted
                loop
                playsInline
                preload="none"
                tabIndex={-1}
                disablePictureInPicture
                aria-hidden="true"
              />
            </div>
          </div>

          <div data-nlp-scrim aria-hidden="true" />

          {/*
           * Static/no-JS artwork. With motion the shared video replaces it; on
           * reduced motion and without JavaScript it stays as the visible
           * branded poster.
           */}
          <figure data-nlp-static>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SHOWREEL.poster}
              alt={SHOWREEL.posterAlt}
              width={SHOWREEL.width}
              height={SHOWREEL.height}
              loading="lazy"
              decoding="async"
            />
          </figure>

          <div data-nlp-caption>
            <p className="nlp-caption__eyebrow">{SHOWREEL.caption.eyebrow}</p>
            <p className="nlp-caption__line">
              <span className="sr-only">{SHOWREEL.caption.line}</span>
              <span aria-hidden>
                {CAPTION_WORDS.map((word, index) => (
                  <span
                    // Words repeat; position is identity.
                    key={`${word}-${index}`}
                    data-nlp-word
                    style={
                      {
                        "--nlp-word-index": index,
                        "--nlp-word-count": CAPTION_WORDS.length,
                      } as CSSProperties
                    }
                  >
                    {word}{" "}
                  </span>
                ))}
              </span>
            </p>
            <div className="nlp-caption__meta">
              <p className="nlp-caption__copy">{SHOWREEL.caption.copy}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sibling, not a descendant: the section's clipping can never clip the
          fixed lens, and the menu overlay stays above it. */}
      <div ref={lensRef} data-nlp-lens aria-hidden />
    </>
  );
}
