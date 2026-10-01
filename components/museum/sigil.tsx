'use client';

import { motion } from 'motion/react';
import { useMemo } from 'react';
import { seeded, type Event } from '@/lib/museum';

export type Shape = { d: string; w: number; o: number };

/** Build a deterministic, one-of-a-kind accession glyph for an exhibit (paths in a 100 × 100 box). */
export function sigilShapes(e: Event): Shape[] {
  const r = seeded(e.id + e.date);
  const shapes: Shape[] = [];
  const pt = (a: number, rad: number) => `${(50 + Math.cos(a) * rad).toFixed(2)} ${(50 + Math.sin(a) * rad).toFixed(2)}`;
  const circle = (rad: number) => `M ${50 - rad} 50 a ${rad} ${rad} 0 1 0 ${rad * 2} 0 a ${rad} ${rad} 0 1 0 ${-rad * 2} 0`;

  shapes.push({ d: circle(46), w: 0.6, o: 0.55 });

  // Rim ticks: density follows the year within its decade.
  const ticks = 24 + (e.year % 10) * 4;
  let rim = '';
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
    const len = i % 6 === 0 ? 5 : 2 + r() * 2.2;
    rim += `M ${pt(a, 46)} L ${pt(a, 46 - len)} `;
  }
  shapes.push({ d: rim, w: 0.5, o: 0.7 });

  // Track motif.
  if (e.track === 'Technology') {
    let d = '';
    const n = 5;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (r() < 0.35) continue;
      const x = 32 + i * 9, y = 32 + j * 9;
      d += `M ${x - 1.1} ${y} a 1.1 1.1 0 1 0 2.2 0 a 1.1 1.1 0 1 0 -2.2 0 `;
    }
    shapes.push({ d, w: 0.7, o: 0.9 });
  } else if (e.track === 'Ideas') {
    let d = `M ${pt(0, 2)}`;
    const turns = 2.5 + r() * 1.5, start = r() * Math.PI * 2;
    for (let t = 0; t <= 1; t += 0.01) d += ` L ${pt(start + t * turns * Math.PI * 2, 2 + t * 30)}`;
    shapes.push({ d, w: 0.7, o: 0.9 });
  } else if (e.track === 'Institutions') {
    let d = '';
    const rot = r() * Math.PI;
    for (let k = 0; k < 4; k++) {
      const s = 10 + k * 7;
      d += `M ${pt(rot, s)} L ${pt(rot + Math.PI / 2, s)} L ${pt(rot + Math.PI, s)} L ${pt(rot + Math.PI * 1.5, s)} Z `;
    }
    shapes.push({ d, w: 0.7, o: 0.9 });
  } else {
    let d = '';
    for (let k = 1; k <= 4; k++) d += circle(7 * k + r() * 2) + ' ';
    shapes.push({ d, w: 0.6, o: 0.85 });
  }

  // A polygon whose vertex count comes from the accession number.
  const sides = 3 + (Number(e.id.slice(-2)) % 5);
  const rot = r() * Math.PI * 2, rad = 36 + r() * 4;
  let poly = '';
  for (let i = 0; i <= sides; i++) poly += `${i ? 'L' : 'M'} ${pt(rot + (i / sides) * Math.PI * 2, rad)} `;
  shapes.push({ d: poly, w: 0.5, o: 0.5 });

  // An arc marking the month (or the whole year when only the year is known).
  const month = Number(e.date.slice(5, 7)) || 12;
  const a0 = -Math.PI / 2, a1 = a0 + (month / 12) * Math.PI * 2 - 0.001;
  shapes.push({ d: `M ${pt(a0, 41)} A 41 41 0 ${month > 6 ? 1 : 0} 1 ${pt(a1, 41)}`, w: 1.4, o: 1 });

  // Orbiting marker.
  shapes.push({ d: `M ${pt(a1, 41)} m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`, w: 1, o: 1 });
  return shapes;
}

export function Sigil({ event, draw = false, className }: { event: Event; draw?: boolean; className?: string }) {
  const shapes = useMemo(() => sigilShapes(event), [event]);
  return (
    <svg className={`sigil ${className ?? ''}`} viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round">
      {shapes.map((s, i) => draw
        ? <motion.path key={i} d={s.d} strokeWidth={s.w} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: s.o }} transition={{ duration: 1.4, delay: 0.15 + i * 0.12, ease: [0.65, 0, 0.35, 1] }} />
        : <path key={i} d={s.d} strokeWidth={s.w} opacity={s.o} />)}
    </svg>
  );
}
