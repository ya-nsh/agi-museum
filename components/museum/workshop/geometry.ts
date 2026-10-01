// Shared helpers for the specimens drawn on the square plane [-1, 1]².

type P = [number, number];
const BOX: P[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

/** Pointer position in plane coordinates (y up), from an SVG whose viewBox is a square. */
export function toPlane(e: { clientX: number; clientY: number }, el: Element) {
  const r = el.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 2 - 1;
  const y = 1 - ((e.clientY - r.top) / r.height) * 2;
  return { x: Math.max(-0.98, Math.min(0.98, x)), y: Math.max(-0.98, Math.min(0.98, y)) };
}

/** The part of the plane where sign · (w1·x + w2·y + b) ≥ 0, as a polygon (Sutherland–Hodgman, one edge). */
export function clipHalfPlane(w1: number, w2: number, b: number, sign: 1 | -1): P[] {
  const f = (p: P) => sign * (w1 * p[0] + w2 * p[1] + b);
  const out: P[] = [];
  for (let i = 0; i < BOX.length; i++) {
    const a = BOX[i], c = BOX[(i + 1) % BOX.length];
    const fa = f(a), fc = f(c);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fc >= 0)) {
      const t = fa / (fa - fc);
      out.push([a[0] + t * (c[0] - a[0]), a[1] + t * (c[1] - a[1])]);
    }
  }
  return out;
}

/** The segment of the line w1·x + w2·y + b = 0 inside the plane, or null if it misses. */
export function lineInBox(w1: number, w2: number, b: number): [P, P] | null {
  const hits: P[] = [];
  const add = (p: P) => { if (Math.abs(p[0]) <= 1.0001 && Math.abs(p[1]) <= 1.0001 && !hits.some(h => Math.hypot(h[0] - p[0], h[1] - p[1]) < 1e-6)) hits.push(p); };
  if (Math.abs(w2) > 1e-9) { add([-1, (-b + w1) / w2]); add([1, (-b - w1) / w2]); }
  if (Math.abs(w1) > 1e-9) { add([(-b + w2) / w1, -1]); add([(-b - w2) / w1, 1]); }
  return hits.length >= 2 ? [hits[0], hits[1]] : null;
}
