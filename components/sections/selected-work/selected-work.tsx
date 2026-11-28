"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { getLenis } from "@/lib/lenis";
import { getScrollTrigger } from "@/lib/scroll-trigger";
import { getWorkProject } from "@/lib/work";
import { SelectedProjectCard } from "./selected-project-card";
import {
  SELECTED_WORK,
  type SelectedWorkLayout,
} from "./selected-work.data";
import "./selected-work.css";

/**
 * Development-only hook for deterministic QA and the delivery recording.
 * Absent from a production build; no visible UI and no production behaviour.
 */
type SelectedWorkApi = {
  scrollTo: (slug: string) => void;
  triggers: () => number;
  motion: () => string | undefined;
  reveal: (slug: string) => string | null;
};

declare global {
  interface Window {
    __selectedWork?: SelectedWorkApi;
  }
}

/**
 * DEL-01A — Immersive homepage Selected Projects.
 *
 * The gallery follows the showreel aperture directly and starts with the Zero
 * artwork inside a small circular clip. Scroll expands that circle into the
 * complete rectangular project, then the remaining six projects settle into an
 * asymmetric editorial composition.
 *
 * Motion ownership:
 *
 * - `[data-sw-card]` receives the scrubbed whole-card entrance (y / x / rotate),
 *   so artwork, name, description, tags and action circle travel together.
 * - `[data-sw-media]` receives the scrubbed circular clip on the opening card.
 * - `[data-sw-parallax]` receives the restrained internal image drift.
 * - `[data-sw-shell]` and `[data-sw-image]` receive the CSS hover/focus lift and
 *   zoom. No two systems write the same transform.
 *
 * Everything is scroll-linked; there is no toggle-driven entrance, no pin, no
 * second Lenis instance, no independent RAF loop and no per-frame React state.
 * Reduced motion creates no triggers and no clip, so the gallery is immediately
 * complete. The same is true before hydration and without JavaScript.
 */

const CARD_MOTION: Record<
  SelectedWorkLayout,
  { y: number; x: number; rotate: number }
> = {
  opening: { y: 120, x: 0, rotate: -2.4 },
  "left-1": { y: 120, x: -72, rotate: -3.6 },
  "right-1": { y: 140, x: 66, rotate: 3.6 },
  "feature-right": { y: 120, x: 80, rotate: 3.2 },
  "left-2": { y: 120, x: -60, rotate: -3.2 },
  "right-2": { y: 140, x: 60, rotate: 3.6 },
  closing: { y: 130, x: 0, rotate: -2.2 },
};

const OPENING_START = "top 60%";
const OPENING_END = "top 18%";
const CARD_START = "top bottom";
const CARD_END = "top 55%";

/** DEL-01B artwork-panel perspective for the six subsequent projects. */
const PERSPECTIVE_ROTATE_Y = -8;
const PERSPECTIVE_ROTATE_X = 1.5;

export function SelectedWork() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      // Register ScrollTrigger once through the shared helper. The root Lenis
      // provider already feeds ScrollTrigger.update().
      const ScrollTrigger = getScrollTrigger();

      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const setMotion = (reduced: boolean) => {
        root.dataset.swMotion = reduced ? "off" : "on";
      };
      setMotion(motionQuery.matches);
      const onMotionChange = (event: MediaQueryListEvent) => {
        setMotion(event.matches);
      };
      motionQuery.addEventListener("change", onMotionChange);

      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 1024px)",
          tablet: "(min-width: 768px)",
        },
        (context) => {
          if (!context.conditions?.motion) return;

          const isDesktop = Boolean(context.conditions.desktop);
          const isTablet = Boolean(context.conditions.tablet);

          const opening = root.querySelector<HTMLElement>(
            '[data-sw-item="opening"]',
          );
          const openingMedia = opening?.querySelector<HTMLElement>(
            "[data-sw-media]",
          );

          if (opening && openingMedia) {
            const openingInfo = opening.querySelector<HTMLElement>(
              "[data-sw-info]",
            );
            const startRadius = () =>
              Math.min(92, Math.max(28, Math.round(window.innerWidth * 0.052)));
            // Measure the untransformed box: the card may be rotated by its
            // entrance tween when ScrollTrigger refreshes.
            const endRadius = () =>
              Math.hypot(
                openingMedia.offsetWidth,
                openingMedia.offsetHeight,
              ) /
                2 +
              8;

            const openingTimeline = gsap.timeline({
              scrollTrigger: {
                trigger: opening,
                start: OPENING_START,
                end: OPENING_END,
                scrub: 0.55,
                invalidateOnRefresh: true,
              },
            });

            openingTimeline.fromTo(
              openingMedia,
              { clipPath: () => `circle(${startRadius()}px at 50% 50%)` },
              {
                clipPath: () => `circle(${endRadius()}px at 50% 50%)`,
                ease: "none",
                duration: 1,
              },
              0,
            );

            // The caption arrives with the artwork rather than before it. It
            // contains no focusable element, so nothing interactive is hidden:
            // the whole card is the link.
            if (openingInfo) {
              openingTimeline.fromTo(
                openingInfo,
                { y: 22, autoAlpha: 0 },
                {
                  y: 0,
                  autoAlpha: 1,
                  duration: 0.22,
                  ease: "power1.out",
                },
                0.74,
              );
            }
          }

          const items = Array.from(
            root.querySelectorAll<HTMLElement>("[data-sw-item]"),
          );

          items.forEach((item) => {
            const layout = item.dataset.swItem as SelectedWorkLayout;
            const motion = CARD_MOTION[layout];
            const card = item.querySelector<HTMLElement>("[data-sw-card]");
            if (!motion || !card) return;

            const strength = isDesktop ? 1 : isTablet ? 0.55 : 0.32;
            const x = isDesktop
              ? motion.x
              : isTablet
                ? Math.round(motion.x * 0.5)
                : 0;
            const rotate = isDesktop
              ? motion.rotate
              : isTablet
                ? motion.rotate * 0.55
                : 0;

            // The grid item stays untransformed so ScrollTrigger's cached
            // start/end always describe the layout box, not the card's current
            // entrance offset. The card itself carries the movement.
            gsap.fromTo(
              card,
              { y: Math.round(motion.y * strength), x, rotate },
              {
                y: 0,
                x: 0,
                rotate: 0,
                ease: "none",
                scrollTrigger: {
                  trigger: item,
                  start: CARD_START,
                  end: CARD_END,
                  scrub: 0.65,
                  invalidateOnRefresh: true,
                },
              },
            );

            // Internal drift is secondary and desktop-only. The wrapper has its
            // own overscan, and the image zoom stays a CSS property.
            if (isDesktop) {
              const parallax = item.querySelector<HTMLElement>(
                "[data-sw-parallax]",
              );
              if (parallax) {
                gsap.fromTo(
                  parallax,
                  { yPercent: -2.8 },
                  {
                    yPercent: 2.8,
                    ease: "none",
                    scrollTrigger: {
                      trigger: item,
                      start: "top bottom",
                      end: "bottom top",
                      scrub: 0.5,
                    },
                  },
                );
              }
            }
          });
        },
      );

      /*
       * DEL-01B — perspective artwork hover for the six subsequent projects.
       *
       * The opening Zero card never has a `[data-sw-panel]`, so this query cannot
       * attach to it. Fine pointers only, motion allowed only, and only the
       * hovered card's panel receives the rotation. Captions live outside the
       * panel and therefore stay stationary.
       */
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          fine: "(hover: hover) and (pointer: fine)",
        },
        (context) => {
          if (!context.conditions?.motion || !context.conditions?.fine) return;

          const bindings: Array<{
            card: HTMLElement;
            panel: HTMLElement;
            enter: () => void;
            leave: () => void;
          }> = [];

          root
            .querySelectorAll<HTMLElement>('[data-sw-variant="perspective"]')
            .forEach((card) => {
              const panel = card.querySelector<HTMLElement>("[data-sw-panel]");
              if (!panel) return;

              const enter = () => {
                gsap.to(panel, {
                  rotateY: PERSPECTIVE_ROTATE_Y,
                  rotateX: PERSPECTIVE_ROTATE_X,
                  duration: 0.55,
                  ease: "power3.out",
                  overwrite: "auto",
                });
              };

              const leave = () => {
                gsap.to(panel, {
                  rotateY: 0,
                  rotateX: 0,
                  duration: 0.65,
                  ease: "power3.out",
                  overwrite: "auto",
                });
              };

              card.addEventListener("pointerenter", enter);
              card.addEventListener("pointerleave", leave);
              bindings.push({ card, panel, enter, leave });
            });

          return () => {
            bindings.forEach(({ card, panel, enter, leave }) => {
              card.removeEventListener("pointerenter", enter);
              card.removeEventListener("pointerleave", leave);
              gsap.killTweensOf(panel);
              panel.style.transform = "";
            });
          };
        },
      );

      if (process.env.NODE_ENV !== "production") {
        window.__selectedWork = {
          scrollTo: (slug: string) => {
            const item = root.querySelector<HTMLElement>(
              `[data-sw-slug="${slug}"]`,
            );
            if (!item) return;
            const top =
              item.getBoundingClientRect().top +
              window.scrollY -
              window.innerHeight * 0.18;
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
            else window.scrollTo({ top, behavior: "instant" });
          },
          triggers: () =>
            ScrollTrigger.getAll().filter((trigger) => {
              const element = trigger.trigger;
              return element instanceof Element && root.contains(element);
            }).length,
          motion: () => root.dataset.swMotion,
          reveal: (slug: string) => {
            const media = root.querySelector<HTMLElement>(
              `[data-sw-slug="${slug}"] [data-sw-media]`,
            );
            return media ? getComputedStyle(media).clipPath : null;
          },
        };
      }

      return () => {
        motionQuery.removeEventListener("change", onMotionChange);
        mm.revert();
        delete root.dataset.swMotion;
        if (process.env.NODE_ENV !== "production") {
          delete window.__selectedWork;
        }
      };
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      id="selected-work"
      data-selected-work
      data-header-surface="inherit"
      aria-labelledby="selected-work-title"
    >
      <h2 id="selected-work-title" className="sr-only">
        Selected projects
      </h2>

      <div data-sw-inner>
        <div data-sw-gallery>
          {SELECTED_WORK.map((entry) => {
            const project = getWorkProject(entry.slug);
            if (!project) return null;

            return (
              <div
                key={entry.slug}
                data-sw-item={entry.layout}
                data-sw-slug={entry.slug}
              >
                <SelectedProjectCard project={project} entry={entry} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
