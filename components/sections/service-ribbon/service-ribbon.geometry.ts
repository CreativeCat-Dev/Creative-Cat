/**
 * DEL-00.2 / DEL-00.2A — pure geometry for the kinetic service ribbon.
 *
 * The band is a thick stroke on the centreline and the text uses the same
 * centreline, so a deformation can never move the band away from its text.
 * Coordinates are SVG user units in a 1920 x 38 viewBox; the rendered height
 * scales the whole ribbon uniformly through `preserveAspectRatio="slice"`.
 */

export type Point = { x: number; y: number };

export type WaveSpec = {
  baseY: number;
  amplitude: number;
  period: number;
  phase: number;
};

export type WaveBump = {
  x: number;
  amplitude: number;
  sigma: number;
};

export type WaveBounds = {
  min: number;
  max: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Sampled centreline. The final sample lands exactly on `to`. */
export function wavePoints(
  spec: WaveSpec,
  from: number,
  to: number,
  bump: WaveBump | null = null,
  bounds: WaveBounds = { min: 1.5, max: 30.5 },
  step = 24,
): Point[] {
  const points: Point[] = [];
  const span = to - from;
  const count = Math.max(2, Math.ceil(span / step));
  const actualStep = span / count;

  for (let index = 0; index <= count; index += 1) {
    const x = from + actualStep * index;
    let y = spec.baseY + Math.sin((x / spec.period) * Math.PI * 2 + spec.phase) * spec.amplitude;

    if (bump && bump.amplitude !== 0) {
      const distance = (x - bump.x) / bump.sigma;
      y += bump.amplitude * Math.exp(-distance * distance);
    }

    points.push({ x, y: clamp(y, bounds.min, bounds.max) });
  }

  return points;
}

/** Catmull-Rom samples to a smooth cubic path. */
export function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${round(points[0].x)} ${round(points[0].y)}`;

  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)}`;
  }

  return d;
}

/** Vertical offset copy, used for the satin edge highlights. */
export function offsetPoints(
  points: Point[],
  dy: number,
  bounds: WaveBounds = { min: 0.5, max: 31.5 },
): Point[] {
  return points.map((point) => ({
    x: point.x,
    y: clamp(point.y + dy, bounds.min, bounds.max),
  }));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
