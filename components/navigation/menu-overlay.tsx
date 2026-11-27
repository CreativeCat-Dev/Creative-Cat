"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NAV_ITEMS, isActivePath } from "@/lib/navigation";
import { lockScroll } from "@/lib/scroll-lock";
import { focusRing, microLabel } from "@/lib/ui";
import {
  getRibbonMotionAvailable,
  getRibbonMotionPaused,
  subscribeRibbonMotion,
  toggleRibbonMotion,
} from "@/lib/ribbon-motion";
import {
  getProjectMotionAvailable,
  getProjectMotionPaused,
  subscribeProjectMotion,
  toggleProjectMotion,
} from "@/lib/project-motion";

type MenuOverlayProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
  onClosed: () => void;
};

/**
 * Row type is shared by the real label and the decorative flow track so the two
 * can never drift apart.
 */
const rowType = "font-heading leading-none text-[clamp(2.5rem,min(7vw,9svh),6.5rem)]";

/**
 * The flow track is two identical halves of four copies. Identical halves make
 * `xPercent: -50` land on the same pattern, and `min-w-[100vw]` keeps each half
 * at least as wide as the coral band on any viewport — so the loop has no gap at
 * the trailing edge without measuring anything at runtime.
 */
const MARQUEE_HALVES = [0, 1];
const MARQUEE_COPIES = [0, 1, 2, 3];


export function MenuOverlay({ open, onClose, onNavigate, onClosed }: MenuOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(open);
  const callbacks = useRef({ onClose, onClosed });
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const ribbonPaused = useSyncExternalStore(
    subscribeRibbonMotion,
    getRibbonMotionPaused,
    () => false,
  );
  const ribbonAvailable = useSyncExternalStore(
    subscribeRibbonMotion,
    getRibbonMotionAvailable,
    () => false,
  );
  const projectPaused = useSyncExternalStore(
    subscribeProjectMotion,
    getProjectMotionPaused,
    () => false,
  );
  const projectAvailable = useSyncExternalStore(
    subscribeProjectMotion,
    getProjectMotionAvailable,
    () => false,
  );
  /**
   * Set by the fine-pointer motion branch. Closing the overlay calls it so a
   * reopened menu never inherits a frozen phase from the previous hover.
   */
  const resetMarquees = useRef<(() => void) | null>(null);

  useEffect(() => {
    openRef.current = open;
    callbacks.current = { onClose, onClosed };
  }, [open, onClose, onClosed]);

  /**
   * One timeline, built once per motion preference and driven with
   * play()/reverse() so rapid open/close never rebuilds or restarts tweens.
   */
  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;

      const rows = Array.from(panel.querySelectorAll("[data-menu-row-inner]"));
      const head = panel.querySelector("[data-menu-head]");
      const foot = panel.querySelector("[data-menu-foot]");

      const onCompleteState = () => {
        gsap.set(panel, { autoAlpha: 0 });
        // Rewind while the panel is invisible: doing it any earlier would be seen
        // against the still-retracting coral band.
        resetMarquees.current?.();
        callbacks.current.onClosed();
      };

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ paused: true, onReverseComplete: onCompleteState });

        tl.set(panel, { autoAlpha: 1 })
          .fromTo(
            panel,
            { yPercent: 100 },
            { yPercent: 0, duration: 0.72, ease: "power4.out" },
            0
          )
          // opacity (not autoAlpha) so the entrance targets stay focusable from
          // the first frame; visibility: hidden would swallow the initial focus.
          .fromTo(
            head,
            { opacity: 0, y: -16 },
            { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
            0.16
          )
          .fromTo(
            rows,
            { yPercent: 115 },
            { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: 0.07 },
            0.24
          )
          .fromTo(
            foot,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
            0.5
          );

        // If a motion preference flips while the menu is open, land on the end
        // state instead of leaving an empty panel.
        if (openRef.current) tl.progress(1, false);

        timeline.current = tl;
        return () => {
          timeline.current = null;
          tl.kill();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const tl = gsap.timeline({ paused: true, onReverseComplete: onCompleteState });

        // Visibility is state, not motion: assert it at t=0 so the fade below is
        // opacity-only and the entrance stays focusable on its first frame.
        tl.set(panel, { autoAlpha: 1 }).fromTo(
          panel,
          { opacity: 0 },
          { opacity: 1, duration: 0.18, ease: "none" },
          0
        );

        if (openRef.current) tl.progress(1, false);

        timeline.current = tl;
        return () => {
          timeline.current = null;
          tl.kill();
        };
      });

      /**
       * Coral flow track. Motion only: the band's wipe and the static label's
       * fade are CSS, so without JavaScript the row still looks finished instead
       * of showing a coral bar across every line.
       *
       * The reduced-motion state needs no branch here: the CSS transitions drop
       * out, the band appears at its end state, and the track simply never moves.
       */
      mm.add(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const rows = Array.from(panel.querySelectorAll<HTMLElement>("[data-menu-row]"));
          const tweens: gsap.core.Tween[] = [];
          const cleanups: Array<() => void> = [];

          for (const row of rows) {
            const track = row.querySelector<HTMLElement>("[data-menu-marquee]");
            if (!track) continue;

            // Built once per row and never rebuilt: hovering only plays or pauses.
            const tween = gsap.to(track, {
              xPercent: -50,
              duration: 16,
              ease: "none",
              repeat: -1,
              paused: true,
            });
            tweens.push(tween);

            let rewind: gsap.core.Tween | null = null;

            const onEnter = () => {
              // A pending rewind would snap the track to 0 mid-wipe.
              rewind?.kill();
              rewind = null;
              tween.play();
            };

            const onLeave = () => {
              tween.pause();
              // The band takes 450ms to retract; rewinding inside that window
              // would be visible, so the reset waits it out.
              rewind = gsap.delayedCall(0.5, () => {
                tween.pause(0);
                rewind = null;
              });
            };

            row.addEventListener("pointerenter", onEnter);
            row.addEventListener("pointerleave", onLeave);

            cleanups.push(() => {
              row.removeEventListener("pointerenter", onEnter);
              row.removeEventListener("pointerleave", onLeave);
              rewind?.kill();
            });
          }

          resetMarquees.current = () => {
            for (const tween of tweens) tween.pause(0);
          };

          return () => {
            cleanups.forEach((cleanup) => cleanup());
            resetMarquees.current = null;
            for (const tween of tweens) tween.kill();
          };
        }
      );

      return () => mm.revert();
    },
    { scope: panelRef }
  );

  useEffect(() => {
    const tl = timeline.current;
    const panel = panelRef.current;
    if (!tl || !panel) return;

    if (open) {
      // A paused timeline applies its t=0 `.set()` on the next GSAP tick, so the
      // panel would still be `visibility: hidden` when the focus effect below
      // runs. Assert visibility synchronously, then animate.
      gsap.set(panel, { autoAlpha: 1 });
      tl.play();
    } else if (tl.progress() > 0) {
      tl.reverse();
    }
  }, [open]);

  // Scroll lock, owned by the open state so it can never be left behind.
  useEffect(() => {
    if (!open) return;
    return lockScroll();
  }, [open]);

  // Move focus into the panel on open, restore it on close. The panel is made
  // visible synchronously by the play effect above, so Close can take focus in
  // the same commit. A delayed focus raced the entrance and silently no-op'd.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
  }, [open]);

  // Escape closes regardless of which element inside the panel holds focus.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        callbacks.current.onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!panel.contains(active)) {
      // Focus escaped somehow: pull it back, direction-agnostic.
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /**
   * Real <Link>s: only an unmodified primary click is intercepted, so modified
   * clicks, middle-click and the context menu keep native behaviour.
   */
  const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate(href);
    onClose();
  };

  return (
    <div
      ref={panelRef}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      inert={!open}
      data-menu-panel
      onKeyDown={handleKeyDown}
      className="dark invisible fixed inset-0 z-[var(--z-overlay)] flex h-[100svh] flex-col bg-background text-foreground opacity-0"
    >
      <div
        data-menu-head
        className="flex items-center justify-between px-6 py-5 md:px-10 md:py-6 lg:px-14 lg:py-9"
      >
        <Logo />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className={`group inline-flex items-center gap-2 rounded-full px-1 py-1 text-foreground transition-colors hover:text-primary ${microLabel} ${focusRing}`}
        >
          Close
          <span aria-hidden className="relative block size-3.5">
            <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 rotate-45 bg-current" />
            <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 -rotate-45 bg-current" />
          </span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col justify-center px-6 md:px-10 lg:px-14">
        <ul>
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href} className="border-t border-border last:border-b">
                <Link
                  href={item.href}
                  onClick={(event) => handleNavigate(event, item.href)}
                  aria-current={active ? "page" : undefined}
                  data-menu-row
                  className="group relative isolate flex items-baseline gap-4 py-3 outline-none md:gap-8 md:py-4 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {/*
                    Coral band, clipped to the row and starting at the label column so
                    the flowing words never cross the "01" index. `isolate` on the link
                    is what keeps `-z-10` local: without it the band would paint behind
                    the overlay's own background instead of behind the label.

                    The fill and the label fade are CSS because they must be invisible
                    without JavaScript; a bar of coral on every row is what a
                    JS-revealed band would leave behind if hydration ever failed.
                  */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 left-12 -z-10 select-none overflow-hidden md:left-16"
                  >
                    <span className="absolute inset-0 origin-left scale-x-0 bg-primary motion-safe:transition-transform motion-safe:duration-[450ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] pointer-fine:group-hover:scale-x-100" />

                    {/*
                      Midnight text on the midnight panel: the track is invisible until
                      the coral slides under it, so no opacity juggling is needed. GSAP
                      owns only its horizontal position.

                      `relative z-10` is a paint-order fix, not decoration. The fill is
                      absolutely positioned, so without a stacking rule it paints above
                      this static flex child — invisible only because GSAP's transform
                      happens to promote the track. Under reduced motion no tween exists,
                      so the band would read as an empty coral bar.
                    */}
                    <span
                      data-menu-marquee
                      className={`relative z-10 flex h-full w-max items-center whitespace-nowrap text-primary-foreground ${rowType}`}
                    >
                      {MARQUEE_HALVES.map((half) => (
                        <span
                          key={half}
                          className="flex w-max min-w-[100vw] shrink-0 items-center justify-between gap-[0.45em] px-[0.22em]"
                        >
                          {MARQUEE_COPIES.map((copy) => (
                            <span key={copy}>{item.label}</span>
                          ))}
                        </span>
                      ))}
                    </span>
                  </span>

                  <span className={`w-8 text-muted-foreground ${microLabel}`}>{item.index}</span>
                  <span className="overflow-hidden pb-[0.06em]">
                    <span
                      data-menu-row-inner
                      className={`block ${rowType} motion-safe:transition-opacity motion-safe:duration-200 pointer-fine:group-hover:opacity-0`}
                    >
                      {item.label}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`ml-auto size-1.5 rounded-full motion-safe:transition-opacity motion-safe:duration-200 pointer-fine:group-hover:opacity-0 ${
                      active ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div data-menu-foot className="px-6 pb-8 md:px-10 lg:px-14">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <Link
            href="/contact"
            onClick={(event) => handleNavigate(event, "/contact")}
            className={`inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-foreground transition-colors hover:text-primary ${microLabel} ${focusRing}`}
          >
            Let&apos;s create something
          </Link>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {ribbonAvailable ? (
              <button
                type="button"
                role="switch"
                aria-checked={!ribbonPaused}
                aria-label="Service ribbon motion"
                onClick={toggleRibbonMotion}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-muted-foreground transition-colors hover:text-primary motion-reduce:hidden ${microLabel} ${focusRing}`}
              >
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${
                    ribbonPaused ? "bg-muted-foreground/40" : "bg-primary"
                  }`}
                />
                <span aria-hidden>Ribbon motion</span>
                <span aria-hidden className="text-muted-foreground/60">
                  {ribbonPaused ? "Paused" : "On"}
                </span>
              </button>
            ) : null}
            {projectAvailable ? (
              <button
                type="button"
                role="switch"
                aria-checked={!projectPaused}
                aria-label="Showreel motion"
                onClick={toggleProjectMotion}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-muted-foreground transition-colors hover:text-primary motion-reduce:hidden ${microLabel} ${focusRing}`}
              >
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${
                    projectPaused ? "bg-muted-foreground/40" : "bg-primary"
                  }`}
                />
                <span aria-hidden>Showreel motion</span>
                <span aria-hidden className="text-muted-foreground/60">
                  {projectPaused ? "Paused" : "On"}
                </span>
              </button>
            ) : null}
            <span className={`hidden text-muted-foreground md:block ${microLabel}`}>
              Independent Creative Studio
            </span>
            <ThemeToggle animated={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
