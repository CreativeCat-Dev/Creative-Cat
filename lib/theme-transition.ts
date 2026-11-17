const DURATION_MS = 500;
const EASING = "cubic-bezier(0.76, 0, 0.24, 1)";

const STATE_ATTRIBUTE = "data-theme-transition";
const CLIP_PROPERTY = "--theme-transition-clip-from";

type Origin = {
  x: number;
  y: number;
};

let running = false;

export function startThemeTransition(origin: Origin, apply: () => void): void {
  if (running) return;

  if (
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    apply();
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  const cx = `${(origin.x / width) * 100}%`;
  const cy = `${(origin.y / height) * 100}%`;

  const radius = Math.hypot(
    Math.max(origin.x, width - origin.x),
    Math.max(origin.y, height - origin.y)
  );
  const radiusPercent = (radius / (Math.hypot(width, height) / Math.SQRT2)) * 100;

  const clipPath = [`circle(0% at ${cx} ${cy})`, `circle(${radiusPercent}% at ${cx} ${cy})`];

  const root = document.documentElement;
  let settled = false;
  let timer = 0;

  const cleanup = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    running = false;
    root.removeAttribute(STATE_ATTRIBUTE);
    root.style.removeProperty(CLIP_PROPERTY);
  };

  running = true;
  root.setAttribute(STATE_ATTRIBUTE, "active");
  root.style.setProperty(CLIP_PROPERTY, clipPath[0]);
  timer = window.setTimeout(cleanup, DURATION_MS + 400);

  try {
    const transition = document.startViewTransition(() => {
      apply();
    });

    transition.finished.then(cleanup, cleanup);

    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath },
          {
            duration: DURATION_MS,
            easing: EASING,
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      }, cleanup)
      .catch(cleanup);
  } catch {
    cleanup();
    apply();
  }
}
