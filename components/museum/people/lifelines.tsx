'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { Entity } from '@/data/people';
import { formatDate } from '@/lib/museum';

// Most of the collection is recent, so the axis gives 1943–2010 about a third
// of the width and 2010–2027 the rest. The ticks make the break visible.
const BREAK = 2010, SPLIT = 0.36;
const decimal = (date: string) => { const [y, m] = date.split('-').map(Number); return y + (m ? (m - 0.5) / 12 : 0.5); };
export const xOf = (date: string) => {
  const y = decimal(date);
  return y < BREAK ? ((y - 1940) / (BREAK - 1940)) * SPLIT : SPLIT + ((y - BREAK) / (2027 - BREAK)) * (1 - SPLIT);
};
const TICKS = [1950, 1970, 1990, 2010, 2015, 2020, 2025];

/** One row per person or institution: a line from first to last appearance, a dot for each exhibit. */
export function Lifelines({ rows, highlight }: { rows: Entity[]; highlight?: string }) {
  const [hover, setHover] = useState<{ row: string; label: string; x: number } | null>(null);
  return (
    <div className="lifelines" role="list">
      <div className="ll-axis mono" aria-hidden="true">
        {TICKS.map(y => <span key={y} style={{ left: `${xOf(String(y)) * 100}%` }} className={y === BREAK ? 'break' : ''}>{y}</span>)}
      </div>
      {rows.map((ent, i) => {
        const xs = ent.exhibits.map(e => xOf(e.date));
        const a = Math.min(...xs), b = Math.max(...xs);
        const first = ent.exhibits[0].year, last = ent.exhibits[ent.exhibits.length - 1].year;
        return (
          <div key={ent.slug} role="listitem" className={`ll-row ${ent.kind} ${highlight === ent.slug ? 'on' : ''}`}>
            <Link href={`/people/${ent.slug}`} className="ll-name">
              <span>{ent.name}</span>
              <span className="mono">{ent.exhibits.length} · {first === last ? first : `${first}–${String(last).slice(2)}`}</span>
            </Link>
            <div className="ll-track">
              {TICKS.map(y => <i key={y} className="ll-grid" style={{ left: `${xOf(String(y)) * 100}%` }} aria-hidden="true" />)}
              <motion.span className="ll-line" style={{ left: `${a * 100}%` }} initial={{ width: 0 }} whileInView={{ width: `${(b - a) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: Math.min(i, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }} />
              {ent.exhibits.map((e, k) => (
                <Link key={e.id} href={`/exhibit/${e.id}`} className={`ll-dot t-${e.track.toLowerCase()}`} style={{ left: `${xs[k] * 100}%` }}
                  aria-label={`${ent.name}: ${e.title}, ${formatDate(e.date)}`}
                  onPointerEnter={() => setHover({ row: ent.slug, label: `${e.year} · ${e.title}`, x: xs[k] })} onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover({ row: ent.slug, label: `${e.year} · ${e.title}`, x: xs[k] })} onBlur={() => setHover(null)} />
              ))}
              {hover?.row === ent.slug && <span className={`ll-tip ${hover.x > 0.6 ? 'left' : ''}`} style={{ left: `${hover.x * 100}%` }}>{hover.label}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
