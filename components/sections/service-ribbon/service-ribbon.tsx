"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useEffect, useId, useRef, useState } from "react";
import {
  getRibbonMotionPaused,
  registerRibbonMotion,
  subscribeRibbonMotion,
} from "@/lib/ribbon-motion";
import {
  serviceRibbonMarkup,
  serviceRibbonUnitMarkup,
  SERVICE_RIBBON_LABELS,
} from "./service-ribbon.data";
import {
  clamp,
  offsetPoints,
  smoothPath,
  wavePoints,
  type WaveBump,
  type WaveBounds,
  type WaveSpec,
} from "./service-ribbon.geometry";

/**
 * DEL-00.2 / DEL-00.2A / DEL-00.2C — kinetic service ribbon.
 *
 * Two full-bleed ribbons share one coordinate system. Each band is a thick
 * stroke on a centreline, and its `<textPath>` uses the *same* centreline:
 * deforming the centreline moves the band edge and its text together, never
 * apart.
 *
 * The viewBox is a fixed 1920 x 38 and the SVG uses `slice`, so the responsive
 * wrapper height scales text, band thickness and amplitude uniformly. The
 * mirrored waves share one period and opposite phase, so the ribbons cross at
 * the same x positions and reach their maximum negative space halfway between.
 * Their phase is anchored to the centre of the viewBox, which is also the centre
 * of the `slice` crop, so the peak lobe stays visible at every width.
 *
 * Seamless loop: the text path starts one full service-unit before zero and ends
 * one unit past the right edge. `startOffset` runs 0 → L, where L is the measured
 * length of one unit; at both ends the visible pattern is identical because the
 * string is periodic with L.
 */

const VIEW_W = 1920;
const VIEW_H = 38;
/**
 * DEL-00.2E owner-selected spacious-desktop proportions.
 *
 * The desktop strip is 76px for a 38-unit viewBox, so the rendered scale is
 * exactly 2.0. The owner's CSS-pixel targets therefore convert as:
 *   band 25px / 2.0 = 12.5 units
 *   type 10.5px / 2.0 = 5.25 units (ratio 42% of the band)
 *   clear gap 20px / 2.0 = 10 units
 * The gap comes from the mirrored pair, so 2 × amplitude − band = 10 units and
 * each wave amplitude is 11.25. Short desktop/tablet/mobile keep the same band
 * in user units, which scales down with the strip instead of applying 25px there.
 */
const BAND_WIDTH = 12.5;
const FONT_SIZE = 5.25;
/** Relative tracking, so it scales with the responsive font size in CSS. */
const LETTER_SPACING = "0.12em";
/** Montserrat 500: lighter at 11.5px than 600, without losing legibility. */
const FONT_WEIGHT = 500;
/**
 * `dominant-baseline: middle` centres the font box, but measured cap ink sits
 * high. The nudge is proportional to the type, so it is recalculated for the
 * 5.25-unit font and re-measured against the rendered band at 2x.
 */
const BASELINE_NUDGE = 0.37;
/** Calm, premium drift: ≈61px/s at 1440×900. */
const SPEED = 34;
const DEFAULT_LOOP = 1200;
const DEFAULT_MARKUP = serviceRibbonMarkup(8);

/**
 * Pointer deformation, in SVG user units (≈2.9–4px at 1440×900). The minimum
 * keeps the ripple alive when the pointer sits near the vertical centre; the
 * maximum still fits inside the band bounds at the wave extremes.
 */
const DEFORM_MIN = 0.85;
const DEFORM_MAX = 2.25;
const DEFORM_DURATION = 0.34;
/** The midnight ribbon answers a little later, wider and softer. */
const MIDNIGHT_SHIFT = 16;
const MIDNIGHT_SCALE = 0.8;
const MIDNIGHT_SIGMA_SCALE = 1.35;
const CORAL_SIGMA = 110;

const BAND_HALF = BAND_WIDTH / 2;
const BAND_BOUNDS: WaveBounds = { min: BAND_HALF + 0.2, max: VIEW_H - BAND_HALF - 0.2 };
const EDGE_TOP = -BAND_HALF + 0.8;
const EDGE_BOTTOM = BAND_HALF - 0.8;
const EDGE_BOUNDS: WaveBounds = { min: 0.4, max: VIEW_H - 0.4 };

/**
 * Mirrored waves: one period, opposite phase, peak separation centred on the
 * viewBox. `cos` peaks at x = 0, 960, 1920, so the centred lobe of the 1440
 * crop is the top/bottom extreme and both visible crossings (x 720 / 1200) are
 * symmetric about it. 2 × 11.25 − 12.5 = 10 units of clear gap, which is the
 * owner's 20px at the 76px strip (2.0 scale).
 */
const CORAL: WaveSpec = {
  baseY: 19,
  amplitude: 11.25,
  period: 960,
  phase: Math.PI / 2,
};
const MIDNIGHT: WaveSpec = {
  baseY: 19,
  amplitude: 11.25,
  period: 960,
  phase: -Math.PI / 2,
};

const DEFAULT_CORAL_BAND = smoothPath(wavePoints(CORAL, 0, VIEW_W, null, BAND_BOUNDS));
const DEFAULT_MIDNIGHT_BAND = smoothPath(wavePoints(MIDNIGHT, 0, VIEW_W, null, BAND_BOUNDS));
const DEFAULT_CORAL_EDGE_TOP = smoothPath(
  offsetPoints(wavePoints(CORAL, 0, VIEW_W, null, BAND_BOUNDS), EDGE_TOP, EDGE_BOUNDS),
);
const DEFAULT_CORAL_EDGE_BOTTOM = smoothPath(
  offsetPoints(wavePoints(CORAL, 0, VIEW_W, null, BAND_BOUNDS), EDGE_BOTTOM, EDGE_BOUNDS),
);
const DEFAULT_MIDNIGHT_EDGE_TOP = smoothPath(
  offsetPoints(wavePoints(MIDNIGHT, 0, VIEW_W, null, BAND_BOUNDS), EDGE_TOP, EDGE_BOUNDS),
);
const DEFAULT_MIDNIGHT_EDGE_BOTTOM = smoothPath(
  offsetPoints(wavePoints(MIDNIGHT, 0, VIEW_W, null, BAND_BOUNDS), EDGE_BOTTOM, EDGE_BOUNDS),
);
const DEFAULT_CORAL_TEXT = smoothPath(
  wavePoints(CORAL, -DEFAULT_LOOP, VIEW_W + DEFAULT_LOOP, null, BAND_BOUNDS),
);
const DEFAULT_MIDNIGHT_TEXT = smoothPath(
  wavePoints(MIDNIGHT, -DEFAULT_LOOP, VIEW_W + DEFAULT_LOOP, null, BAND_BOUNDS),
);

type RibbonDeform = {
  x: number;
  /** Signed vertical displacement of the coral centreline, in user units. */
  amount: number;
  /** 0 → 1 pointer shine strength. */
  shine: number;
};

type RibbonState = {
  timeline: gsap.core.Timeline | null;
  loop: number;
  deform: RibbonDeform;
  pointer: { x: number; y: number } | null;
  hover: boolean;
  inView: boolean;
  userPaused: boolean;
  raf: number;
};

export function ServiceRibbon() {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const coralBandRef = useRef<SVGPathElement>(null);
  const coralSheenRef = useRef<SVGPathElement>(null);
  const coralShineRef = useRef<SVGPathElement>(null);
  const coralShineGradientRef = useRef<SVGRadialGradientElement>(null);
  const coralEdgeTopRef = useRef<SVGPathElement>(null);
  const coralEdgeBottomRef = useRef<SVGPathElement>(null);
  const coralMaskRef = useRef<SVGPathElement>(null);
  const midnightBandRef = useRef<SVGPathElement>(null);
  const midnightSheenRef = useRef<SVGPathElement>(null);
  const midnightShineRef = useRef<SVGPathElement>(null);
  const midnightShineGradientRef = useRef<SVGRadialGradientElement>(null);
  const midnightEdgeTopRef = useRef<SVGPathElement>(null);
  const midnightEdgeBottomRef = useRef<SVGPathElement>(null);
  const coralTextPathRef = useRef<SVGPathElement>(null);
  const midnightTextPathRef = useRef<SVGPathElement>(null);
  const coralTextRef = useRef<SVGTextPathElement>(null);
  const midnightTextRef = useRef<SVGTextPathElement>(null);
  const [markup, setMarkup] = useState(DEFAULT_MARKUP);

  useEffect(() => registerRibbonMotion(), []);

  useGSAP(
    () => {
      const root = rootRef.current;
      const svg = svgRef.current;
      if (!root || !svg) return;

      const state: RibbonState = {
        timeline: null,
        loop: DEFAULT_LOOP,
        deform: { x: VIEW_W / 2, amount: 0, shine: 0 },
        pointer: null,
        hover: false,
        inView: true,
        userPaused: getRibbonMotionPaused(),
        raf: 0,
      };

      /**
       * The two ribbons share the pointer position but not the deformation: the
       * midnight lobe is shifted, wider and shallower, so the pair ripples
       * instead of bending as one rigid shape.
       */
      const coralBump = (): WaveBump | null =>
        state.deform.amount === 0
          ? null
          : { x: state.deform.x, amplitude: state.deform.amount, sigma: CORAL_SIGMA };

      const midnightBump = (): WaveBump | null =>
        state.deform.amount === 0
          ? null
          : {
              x: state.deform.x + MIDNIGHT_SHIFT,
              amplitude: state.deform.amount * MIDNIGHT_SCALE,
              sigma: CORAL_SIGMA * MIDNIGHT_SIGMA_SCALE,
            };

      const draw = () => {
        const coralBumpValue = coralBump();
        const midnightBumpValue = midnightBump();
        const coral = wavePoints(CORAL, 0, VIEW_W, coralBumpValue, BAND_BOUNDS);
        const midnight = wavePoints(MIDNIGHT, 0, VIEW_W, midnightBumpValue, BAND_BOUNDS);
        const coralPath = smoothPath(coral);
        const midnightPath = smoothPath(midnight);

        coralBandRef.current?.setAttribute("d", coralPath);
        coralSheenRef.current?.setAttribute("d", coralPath);
        coralShineRef.current?.setAttribute("d", coralPath);
        coralMaskRef.current?.setAttribute("d", coralPath);
        coralEdgeTopRef.current?.setAttribute(
          "d",
          smoothPath(offsetPoints(coral, EDGE_TOP, EDGE_BOUNDS)),
        );
        coralEdgeBottomRef.current?.setAttribute(
          "d",
          smoothPath(offsetPoints(coral, EDGE_BOTTOM, EDGE_BOUNDS)),
        );
        midnightBandRef.current?.setAttribute("d", midnightPath);
        midnightSheenRef.current?.setAttribute("d", midnightPath);
        midnightShineRef.current?.setAttribute("d", midnightPath);
        midnightEdgeTopRef.current?.setAttribute(
          "d",
          smoothPath(offsetPoints(midnight, EDGE_TOP, EDGE_BOUNDS)),
        );
        midnightEdgeBottomRef.current?.setAttribute(
          "d",
          smoothPath(offsetPoints(midnight, EDGE_BOTTOM, EDGE_BOUNDS)),
        );

        coralTextPathRef.current?.setAttribute(
          "d",
          smoothPath(wavePoints(CORAL, -state.loop, VIEW_W + state.loop, coralBumpValue, BAND_BOUNDS)),
        );
        midnightTextPathRef.current?.setAttribute(
          "d",
          smoothPath(
            wavePoints(MIDNIGHT, -state.loop, VIEW_W + state.loop, midnightBumpValue, BAND_BOUNDS),
          ),
        );

        // Restrained pointer shine: a soft radial highlight that travels with the
        // deformation. No filter, no blur pass, no extra compositing layer.
        const shine = clamp(state.deform.shine, 0, 1);
        coralShineGradientRef.current?.setAttribute("cx", String(state.deform.x));
        midnightShineGradientRef.current?.setAttribute(
          "cx",
          String(state.deform.x + MIDNIGHT_SHIFT),
        );
        coralShineRef.current?.setAttribute("opacity", (shine * 0.5).toFixed(3));
        midnightShineRef.current?.setAttribute("opacity", (shine * 0.38).toFixed(3));
      };

      const measureLoop = (): number => {
        const textElement = svg.querySelector("text");
        const probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
        const style = textElement ? getComputedStyle(textElement) : null;

        if (style) {
          probe.style.fontFamily = style.fontFamily;
          probe.style.fontWeight = style.fontWeight;
          probe.style.fontSize = style.fontSize;
          probe.style.letterSpacing = style.letterSpacing;
        }
        probe.style.visibility = "hidden";
        probe.setAttribute("xml:space", "preserve");
        probe.innerHTML = serviceRibbonUnitMarkup();
        svg.appendChild(probe);

        const width = probe.getComputedTextLength();
        probe.remove();

        return width > 80 ? width : DEFAULT_LOOP;
      };

      const setText = (loop: number) => {
        const repeats = clamp(Math.ceil((VIEW_W + 2 * loop) / loop) + 1, 4, 24);
        setMarkup(serviceRibbonMarkup(repeats));
      };

      const prepare = (): number => {
        const loop = measureLoop();
        state.loop = loop;
        setText(loop);
        draw();
        root.dataset.ribbonLoop = loop.toFixed(2);
        return loop;
      };

      const sync = () => {
        if (!state.timeline) return;
        state.timeline.paused(state.userPaused || !state.inView || document.hidden);
      };

      /**
       * Hover is not part of the gate: a fine-pointer move *is* the proof of
       * hover, so requiring it first would deadlock the interaction.
       */
      const canDeform = () => !state.userPaused && state.inView && !document.hidden;

      /**
       * A single spring-like follow. `overwrite` kills the previous follow or the
       * elastic recovery, so a fast re-entry can never share control of the same
       * value with a stale tween.
       */
      const followPointer = () => {
        state.raf = 0;
        const pointer = state.pointer;
        if (!pointer) return;
        const matrix = svg.getScreenCTM();
        if (!matrix) return;

        const point = svg.createSVGPoint();
        point.x = pointer.x;
        point.y = pointer.y;
        const local = point.matrixTransform(matrix.inverse());

        // Signed offset from the strip's vertical centre: above the centre the
        // ribbons lift, below they dip. The sign is no longer discarded.
        const offset = clamp((local.y - VIEW_H / 2) / (VIEW_H / 2), -1, 1);
        const direction = offset < 0 ? -1 : 1;
        const magnitude = DEFORM_MIN + (DEFORM_MAX - DEFORM_MIN) * Math.abs(offset);

        gsap.to(state.deform, {
          x: clamp(local.x, -200, VIEW_W + 200),
          amount: direction * magnitude,
          shine: 1,
          duration: DEFORM_DURATION,
          ease: "power3.out",
          overwrite: "auto",
          onUpdate: draw,
        });
      };

      const recover = () => {
        if (state.raf) cancelAnimationFrame(state.raf);
        state.raf = 0;
        // The amplitude springs back with a short elastic settle; the shine
        // fades on its own shorter curve so its overshoot cannot flicker.
        gsap.to(state.deform, {
          amount: 0,
          duration: 1.05,
          ease: "elastic.out(1, 0.8)",
          overwrite: "auto",
          onUpdate: draw,
        });
        gsap.to(state.deform, {
          shine: 0,
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto",
          onUpdate: draw,
        });
      };

      const isFinePointerEvent = (event: PointerEvent) =>
        event.pointerType !== "touch" && event.pointerType !== "";

      const startTimeline = (loop: number) => {
        state.timeline?.kill();
        const timeline = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });

        if (coralTextRef.current) {
          timeline.fromTo(
            coralTextRef.current,
            { attr: { startOffset: 0 } },
            { attr: { startOffset: loop }, duration: loop / SPEED },
            0,
          );
        }
        if (midnightTextRef.current) {
          timeline.fromTo(
            midnightTextRef.current,
            { attr: { startOffset: loop } },
            { attr: { startOffset: 0 }, duration: loop / SPEED },
            0,
          );
        }

        state.timeline = timeline;
        timeline.timeScale(state.hover ? 0.35 : 1);
        sync();
      };

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let alive = true;
        let resizeTimer = 0;
        const loop = prepare();
        startTimeline(loop);
        root.dataset.ribbonReady = "true";

        /**
         * The menu owns the preference toggle; the ribbon only listens. A user
         * pause is never cleared by hover, visibility or route restoration, and
         * the paused state also releases any pointer deformation.
         */
        const unsubscribeMotion = subscribeRibbonMotion(() => {
          state.userPaused = getRibbonMotionPaused();
          sync();
          if (state.userPaused) {
            state.pointer = null;
            recover();
          }
        });

        const slowDown = () => {
          if (state.timeline) {
            gsap.to(state.timeline, { timeScale: 0.35, duration: 0.3, overwrite: true });
          }
        };

        const speedUp = () => {
          if (state.timeline) {
            gsap.to(state.timeline, { timeScale: 1, duration: 0.5, overwrite: true });
          }
        };

        const onMove = (event: PointerEvent) => {
          if (!isFinePointerEvent(event) || !canDeform()) return;
          if (!state.hover) {
            state.hover = true;
            slowDown();
          }
          state.pointer = { x: event.clientX, y: event.clientY };
          if (!state.raf) state.raf = requestAnimationFrame(followPointer);
        };

        const release = () => {
          state.pointer = null;
          recover();
        };

        const onLeave = () => {
          state.hover = false;
          release();
          speedUp();
        };

        const finePointer = window.matchMedia("(pointer: fine)").matches;
        if (finePointer) {
          root.addEventListener("pointermove", onMove);
          root.addEventListener("pointerleave", onLeave);
          root.addEventListener("pointerenter", slowDown);
          root.addEventListener("pointercancel", onLeave);
        }

        const observer = new IntersectionObserver(
          (entries) => {
            state.inView = entries[0]?.isIntersecting ?? true;
            sync();
            if (!state.inView) {
              state.hover = false;
              release();
            }
          },
          { rootMargin: "120px" },
        );
        observer.observe(root);

        const onVisibility = () => {
          sync();
          if (document.hidden) {
            state.hover = false;
            release();
          }
        };
        document.addEventListener("visibilitychange", onVisibility);

        const onFontsReady = () => {
          if (!alive) return;
          const previous = state.loop;
          const next = prepare();
          if (Math.abs(next - previous) > 0.5) startTimeline(next);
        };
        document.fonts?.ready.then(onFontsReady).catch(() => {});

        /**
         * The type size is responsive, so the measured unit changes when the
         * window crosses a height breakpoint. Re-measure once the resize settles
         * instead of letting a stale loop length leave a seam.
         */
        const onResize = () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            if (!alive) return;
            const previous = state.loop;
            const next = prepare();
            if (Math.abs(next - previous) > 0.5) startTimeline(next);
          }, 220);
        };
        window.addEventListener("resize", onResize);

        return () => {
          alive = false;
          window.clearTimeout(resizeTimer);
          window.removeEventListener("resize", onResize);
          observer.disconnect();
          document.removeEventListener("visibilitychange", onVisibility);
          root.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
          root.removeEventListener("pointerenter", slowDown);
          root.removeEventListener("pointercancel", onLeave);
          if (state.raf) cancelAnimationFrame(state.raf);
          gsap.killTweensOf(state.deform);
          gsap.killTweensOf(root);
          state.timeline?.kill();
          state.timeline = null;
          unsubscribeMotion();
          root.removeAttribute("data-ribbon-ready");
          root.removeAttribute("data-ribbon-loop");
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        prepare();
        if (coralTextRef.current) coralTextRef.current.setAttribute("startOffset", "0");
        if (midnightTextRef.current) midnightTextRef.current.setAttribute("startOffset", "0");
        return () => {
          gsap.killTweensOf(state.deform);
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      data-service-ribbon
      className="pointer-events-auto relative -mx-6 h-full overflow-hidden md:-mx-10 hero-lg:-mx-14"
    >
      <ul className="sr-only">
        {SERVICE_RIBBON_LABELS.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>

      <svg
        ref={svgRef}
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={`${uid}-coral`} x1="0" y1="0" x2="0" y2={VIEW_H} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF3557" />
            <stop offset="14%" stopColor="#FF1C43" />
            <stop offset="55%" stopColor="#D91438" />
            <stop offset="100%" stopColor="#A50F2D" />
          </linearGradient>
          <linearGradient id={`${uid}-midnight`} x1="0" y1="0" x2="0" y2={VIEW_H} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B2477" />
            <stop offset="24%" stopColor="#241656" />
            <stop offset="66%" stopColor="#1A1140" />
            <stop offset="100%" stopColor="#120C2C" />
          </linearGradient>
          <linearGradient id={`${uid}-coral-sheen`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="38%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="68%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-midnight-sheen`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="72%" stopColor="#FFFFFF" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          {/*
            DEL-00.2C pointer shine: one soft radial gradient per ribbon whose
            centre is nudged along the pointer x. It is a stroke, not a filter,
            so it costs no blur pass and never touches the text.
          */}
          <radialGradient
            ref={coralShineGradientRef}
            id={`${uid}-coral-pointer`}
            gradientUnits="userSpaceOnUse"
            cx={VIEW_W / 2}
            cy={VIEW_H / 2}
            r={210}
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
            <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            ref={midnightShineGradientRef}
            id={`${uid}-midnight-pointer`}
            gradientUnits="userSpaceOnUse"
            cx={VIEW_W / 2}
            cy={VIEW_H / 2}
            r={240}
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
            <stop offset="52%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          {/*
            The coral ribbon passes over the midnight one with a clean knockout
            gap, so the two text lines never collide where the waves cross. The
            black stroke follows the same centreline the coral band draws.
          */}
          <mask
            id={`${uid}-midnight-mask`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={VIEW_W}
            height={VIEW_H}
          >
            <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="white" />
            <path
              ref={coralMaskRef}
              d={DEFAULT_CORAL_BAND}
              fill="none"
              stroke="black"
              strokeWidth={BAND_WIDTH + 2}
            />
          </mask>
        </defs>

        {/* Midnight band, under the coral band. */}
        <g mask={`url(#${uid}-midnight-mask)`}>
          <path
            ref={midnightBandRef}
            data-ribbon-band="midnight"
            d={DEFAULT_MIDNIGHT_BAND}
            fill="none"
            stroke={`url(#${uid}-midnight)`}
            strokeWidth={BAND_WIDTH}
          />
          <path
            ref={midnightEdgeTopRef}
            d={DEFAULT_MIDNIGHT_EDGE_TOP}
            fill="none"
            stroke="rgb(255 255 255 / 0.26)"
            strokeWidth={0.7}
          />
          <path
            ref={midnightEdgeBottomRef}
            d={DEFAULT_MIDNIGHT_EDGE_BOTTOM}
            fill="none"
            stroke="rgb(0 0 0 / 0.24)"
            strokeWidth={0.9}
          />
          <path
            ref={midnightSheenRef}
            d={DEFAULT_MIDNIGHT_BAND}
            fill="none"
            stroke={`url(#${uid}-midnight-sheen)`}
            strokeWidth={BAND_WIDTH * 0.44}
            opacity={0.55}
          />
          <path
            ref={midnightShineRef}
            data-ribbon-shine="midnight"
            d={DEFAULT_MIDNIGHT_BAND}
            fill="none"
            stroke={`url(#${uid}-midnight-pointer)`}
            strokeWidth={BAND_WIDTH * 0.7}
            opacity={0}
          />
          <path
            ref={midnightTextPathRef}
            id={`${uid}-midnight-text`}
            d={DEFAULT_MIDNIGHT_TEXT}
            fill="none"
            stroke="none"
          />
          <text
            className="fill-white font-sans"
            fontSize={FONT_SIZE}
            fontWeight={FONT_WEIGHT}
            letterSpacing={LETTER_SPACING}
            dominantBaseline="middle"
            dy={BASELINE_NUDGE}
            xmlSpace="preserve"
          >
            <textPath
              ref={midnightTextRef}
              href={`#${uid}-midnight-text`}
              startOffset={0}
              dangerouslySetInnerHTML={{ __html: markup }}
            />
          </text>
        </g>

        {/* Coral foreground band and its text. */}
        <path
          ref={coralBandRef}
          data-ribbon-band="coral"
          d={DEFAULT_CORAL_BAND}
          fill="none"
          stroke={`url(#${uid}-coral)`}
          strokeWidth={BAND_WIDTH}
        />
        <path
          ref={coralEdgeTopRef}
          d={DEFAULT_CORAL_EDGE_TOP}
          fill="none"
          stroke="rgb(255 255 255 / 0.4)"
          strokeWidth={0.7}
        />
        <path
          ref={coralEdgeBottomRef}
          d={DEFAULT_CORAL_EDGE_BOTTOM}
          fill="none"
          stroke="rgb(0 0 0 / 0.2)"
          strokeWidth={0.9}
        />
        <path
          ref={coralSheenRef}
          d={DEFAULT_CORAL_BAND}
          fill="none"
          stroke={`url(#${uid}-coral-sheen)`}
          strokeWidth={BAND_WIDTH * 0.44}
          opacity={0.7}
        />
        <path
          ref={coralShineRef}
          data-ribbon-shine="coral"
          d={DEFAULT_CORAL_BAND}
          fill="none"
          stroke={`url(#${uid}-coral-pointer)`}
          strokeWidth={BAND_WIDTH * 0.7}
          opacity={0}
        />
        <path
          ref={coralTextPathRef}
          id={`${uid}-coral-text`}
          d={DEFAULT_CORAL_TEXT}
          fill="none"
          stroke="none"
        />
        <text
          className="fill-white font-sans"
          fontSize={FONT_SIZE}
          fontWeight={FONT_WEIGHT}
          letterSpacing={LETTER_SPACING}
          dominantBaseline="middle"
          dy={BASELINE_NUDGE}
          paintOrder="stroke"
          stroke="rgb(52 6 22 / 0.3)"
          strokeWidth={0.22}
          xmlSpace="preserve"
        >
          <textPath
            ref={coralTextRef}
            href={`#${uid}-coral-text`}
            startOffset={0}
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        </text>
      </svg>
    </div>
  );
}
