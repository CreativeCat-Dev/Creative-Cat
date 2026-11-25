import type Lenis from "lenis";

/**
 * The one root Lenis instance, registered where it is created.
 *
 * Lenis is mounted once by `SmoothScrollProvider`, above the whole shell, so
 * every route shares one scroll system. Infrastructure that needs to pause or
 * re-measure it — the menu scroll lock, QA hooks — reads it here instead of
 * importing the provider, which would drag React into non-React modules and
 * couple the shell to the hero.
 *
 * Zero UI, zero React, no animation clock of its own: the instance is owned and
 * ticked by the provider, never by this registry.
 */

let current: Lenis | null = null;
let liveCount = 0;

export function setLenis(instance: Lenis): void {
  if (current === instance) return;
  current = instance;
  liveCount += 1;
}

export function clearLenis(instance: Lenis): void {
  if (current !== instance) return;
  current = null;
  liveCount = Math.max(0, liveCount - 1);
}

export function getLenis(): Lenis | null {
  return current;
}

/** Live instances, for the development hook only. Steady state is 1. */
export function getLenisInstanceCount(): number {
  return liveCount;
}
