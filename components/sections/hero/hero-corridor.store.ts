/**
 * Master hero story progress.
 *
 * One normalised value for the whole hero narrative. HERO-03's ScrollTrigger
 * writes it; the corridor (HERO-02) and the cat scrubber both read it, so the
 * cards and the mascot can never drift apart and there is no second clock.
 *
 * Kept outside React so a 60fps scroll feed updates the DOM without re-rendering
 * thirteen cards or the canvas.
 */
let progress = 0;
const listeners = new Set<() => void>();

export function setCorridorProgress(next: number) {
  const clamped = Number.isFinite(next) ? Math.min(1, Math.max(0, next)) : 0;
  if (clamped === progress) return;
  progress = clamped;
  listeners.forEach((listener) => listener());
}

export function getCorridorProgress(): number {
  return progress;
}

export function subscribeCorridorProgress(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
