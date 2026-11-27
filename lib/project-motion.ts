/**
 * DEL-00.3A — one showreel motion preference, shared by the Next Level
 * Projects video and the navigation menu.
 *
 * This deliberately mirrors `lib/ribbon-motion.ts`: a tiny external store rather
 * than a provider, because the section owns its video lifecycle and the menu
 * only needs to read and toggle the same boolean. Keeping it separate from the
 * ribbon preference means pausing the ribbon does not silently freeze the
 * showreel, and a page without the section never offers the control.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let paused = false;
let mounted = 0;

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeProjectMotion(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getProjectMotionPaused(): boolean {
  return paused;
}

export function getProjectMotionAvailable(): boolean {
  return mounted > 0;
}

export function setProjectMotionPaused(next: boolean) {
  if (paused === next) return;
  paused = next;
  emit();
}

export function toggleProjectMotion() {
  setProjectMotionPaused(!paused);
}

/** Called by the mounted section so the menu only offers the control on pages
 *  where a slideshow actually exists. */
export function registerProjectMotion(): () => void {
  mounted += 1;
  emit();
  return () => {
    mounted = Math.max(0, mounted - 1);
    emit();
  };
}
