import { perspectives, type Perspective } from './perspectives';

// "Where do you stand?" places a visitor on the same interpretive map as the
// six perspectives in the Great Debate. Each statement leans along the map's
// axes: x runs from "slow down" (-1) to "speed up" (+1), y from "power held by
// states and institutions" (-1) to "power distributed" (+1). Agreeing moves the
// visitor along the statement's lean; disagreeing moves them the other way.
// Statements deliberately lean in different directions, so agreeing with
// everything does not push anyone into a corner.
export type Statement = { id: string; text: string; x: number; y: number; exhibit?: string };

export const statements: Statement[] = [
  { id: 'lives', text: 'Faster AI progress will save more lives than it puts at risk.', x: 1, y: 0, exhibit: 'exhibit-18' },
  { id: 'proof', text: 'The most capable models should not be trained until their developers can show they are safe.', x: -1, y: -0.3, exhibit: 'exhibit-21' },
  { id: 'weights', text: 'Powerful model weights should be published so that anyone can study, run and modify them.', x: 0.3, y: 1, exhibit: 'exhibit-31' },
  { id: 'license', text: 'Governments should license the training of the largest AI models.', x: -0.4, y: -1 },
  { id: 'race', text: 'It matters a great deal which country builds the most capable AI first.', x: 0.7, y: -0.8, exhibit: 'exhibit-41' },
  { id: 'nobody', text: 'No single company or government should control the most powerful AI systems.', x: 0, y: 1 },
  { id: 'together', text: 'If the leading labs agreed to slow down together, the world would be safer.', x: -1, y: -0.2, exhibit: 'exhibit-48' },
  { id: 'shields', text: 'We should speed up defensive technology, such as security, biosecurity and verification, rather than slow technology down overall.', x: 0.5, y: 0.5, exhibit: 'exhibit-27' },
];

/** Five-point agreement scale, stored as 0–4; null means the visitor skipped. */
export const SCALE = ['Strongly disagree', 'Disagree', 'Not sure', 'Agree', 'Strongly agree'] as const;
export type Answer = number | null;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * Position after the given answers. Each axis is the weighted agreement divided
 * by the largest possible total on that axis, so an axis only reaches ±1 when
 * every relevant answer is emphatic and consistent.
 */
export function position(answers: Answer[]) {
  let sx = 0, sy = 0, mx = 0, my = 0;
  answers.forEach((a, i) => {
    if (a === null || a === undefined) return;
    const s = statements[i], l = a - 2;
    sx += l * s.x; sy += l * s.y;
    mx += 2 * Math.abs(s.x); my += 2 * Math.abs(s.y);
  });
  return { x: mx ? clamp(sx / mx) : 0, y: my ? clamp(sy / my) : 0 };
}

/** Positions after each successive answer, for drawing the path a visitor took. */
export function trail(answers: Answer[]) {
  return answers.map((_, i) => position(answers.slice(0, i + 1)));
}

export function ranked(p: { x: number; y: number }) {
  // The map spans -1…1 on both axes, so the longest possible distance is 2√2.
  const max = 2 * Math.SQRT2;
  return perspectives
    .map(q => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) }))
    .map(r => ({ ...r, closeness: 1 - r.d / max }))
    .sort((a, b) => a.d - b.d) as { q: Perspective; d: number; closeness: number }[];
}

export function describe(v: number, neg: string, pos: string) {
  const m = Math.abs(v);
  if (m < 0.12) return 'Undecided';
  const side = v < 0 ? neg : pos;
  return m < 0.4 ? `Leans ${side}` : m < 0.7 ? `Favors ${side}` : `Strongly ${side}`;
}

// Answers travel in the URL fragment as one character each: 0–4, or "-" for a skip.
export const encode = (answers: Answer[]) => answers.map(a => (a === null ? '-' : String(a))).join('');
export function decode(s: string): Answer[] | null {
  if (!new RegExp(`^[0-4-]{${statements.length}}$`).test(s)) return null;
  const answers = s.split('').map(c => (c === '-' ? null : Number(c)));
  return answers.some(a => a !== null) ? answers : null;
}
