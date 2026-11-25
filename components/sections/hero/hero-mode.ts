/**
 * Effective hero mode, outside React.
 *
 * `HERO_STORY.media` is only a candidate: it knows the viewport shape, not the
 * real copy. Enlarged text or different font metrics can still make the
 * complete stage taller than the resolved `100svh`, so `HeroStory` measures the
 * in-flow content and publishes the one effective mode here.
 *
 * This store deliberately carries no animation state. Normalized story progress
 * stays in `hero-corridor.store.ts`; this module has no DOM, timers, clocks,
 * scroll or WebGL. `HeroStory` is the only writer; every consumer reads or
 * subscribes. The server snapshot is always static because the server renders
 * the complete static hero.
 */

export type HeroMode = "enhanced" | "static";

let mode: HeroMode = "static";
const listeners = new Set<() => void>();

export function getHeroMode(): HeroMode {
  return mode;
}

/** Publish the effective mode. Only `HeroStory` calls this. */
export function setHeroMode(next: HeroMode): void {
  if (next === mode) return;
  mode = next;
  listeners.forEach((listener) => listener());
}

export function subscribeHeroMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stable snapshot for `useSyncExternalStore` during hydration. */
export function getHeroModeServerSnapshot(): HeroMode {
  return "static";
}

declare global {
  interface Window {
    __heroMode?: {
      mode: () => HeroMode;
      listeners: () => number;
    };
  }
}

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  window.__heroMode = {
    mode: getHeroMode,
    listeners: () => listeners.size,
  };
}
