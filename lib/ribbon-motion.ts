/**
 * DEL-00.2B — one ribbon motion preference shared by the homepage ribbon and the
 * navigation menu.
 *
 * This is intentionally a tiny external store rather than a context/provider or
 * a state library: the ribbon owns its GSAP timeline, and the menu only needs to
 * read and toggle the same boolean. A module store also survives the ribbon's
 * unmount/remount across client navigation, so a user pause is not cancelled by
 * leaving and returning to the homepage.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let paused = false;
let mounted = 0;

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeRibbonMotion(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRibbonMotionPaused(): boolean {
  return paused;
}

export function getRibbonMotionAvailable(): boolean {
  return mounted > 0;
}

export function setRibbonMotionPaused(next: boolean) {
  if (paused === next) return;
  paused = next;
  emit();
}

export function toggleRibbonMotion() {
  setRibbonMotionPaused(!paused);
}

/** Called by the mounted ribbon so the menu only offers the control on pages
 *  where there is actually a ribbon to pause. */
export function registerRibbonMotion(): () => void {
  mounted += 1;
  emit();
  return () => {
    mounted = Math.max(0, mounted - 1);
    emit();
  };
}
