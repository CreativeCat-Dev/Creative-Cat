"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NAV_ITEMS, isActivePath } from "@/lib/navigation";
import { lockScroll } from "@/lib/scroll-lock";
import { focusRing, microLabel } from "@/lib/ui";

type MenuOverlayProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
  onClosed: () => void;
};


export function MenuOverlay({ open, onClose, onNavigate, onClosed }: MenuOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(open);
  const callbacks = useRef({ onClose, onClosed });
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

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
          .fromTo(
            head,
            { autoAlpha: 0, y: -16 },
            { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
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
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
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

        tl.fromTo(
          panel,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.18, ease: "none" },
          0
        );

        if (openRef.current) tl.progress(1, false);

        timeline.current = tl;
        return () => {
          timeline.current = null;
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: panelRef }
  );

  useEffect(() => {
    const tl = timeline.current;
    if (!tl) return;
    if (open) tl.play();
    else if (tl.progress() > 0) tl.reverse();
  }, [open]);

  // Scroll lock, owned by the open state so it can never be left behind.
  useEffect(() => {
    if (!open) return;
    return lockScroll();
  }, [open]);

  // Move focus into the panel on open, restore it on close.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const id = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(id);
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

    if (event.shiftKey && (active === first || !panel.contains(active))) {
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
                  className="group flex items-baseline gap-4 py-3 outline-none md:gap-8 md:py-4 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className={`w-8 text-muted-foreground ${microLabel}`}>{item.index}</span>
                  <span className="overflow-hidden pb-[0.06em]">
                    <span
                      data-menu-row-inner
                      className="block font-heading leading-none text-[clamp(2.5rem,min(7vw,9svh),6.5rem)] transition-colors group-hover:text-primary"
                    >
                      {item.label}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`ml-auto size-1.5 rounded-full transition-colors ${
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

          <div className="flex items-center gap-4">
            <span className={`hidden text-muted-foreground md:block ${microLabel}`}>
              Independent Creative Studio
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
