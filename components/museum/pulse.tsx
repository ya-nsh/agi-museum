'use client';

import { motion, useInView } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { tracks } from '@/data/events';
import { eras, events, firstYear, formatDate, lastYear, type Event } from '@/lib/museum';
import { Eyebrow, RevealLines } from './reveal';

/** Every exhibit as a block in its year: the shape of the collection is the story. */
export function Pulse({ onOpen }: { onOpen: (e: Event) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const [hover, setHover] = useState<Event | null>(null);
  const years = useMemo(() => Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i), []);
  const byYear = useMemo(() => {
    const m = new Map<number, Event[]>();
    for (const e of events) m.set(e.year, [...(m.get(e.year) ?? []), e]);
    return m;
  }, []);
  const recent = events.filter(e => e.year >= 2022).length;
  const share = Math.round((recent / events.length) * 100);
  const peak = [...byYear.entries()].sort((a, b) => b[1].length - a[1].length)[0];

  return (
    <section className="pulse shell" aria-labelledby="pulse-title">
      <div className="section-head">
        <div>
          <Eyebrow index="03">THE SHAPE OF THE ARCHIVE</Eyebrow>
          <RevealLines id="pulse-title" className="section-title serif" lines={[<span key="a">Decades of quiet.</span>, <span key="b">Then, <em>everything.</em></span>]} />
        </div>
        <div className="pulse-facts">
          <p><strong className="serif">{share}<span className="pct">%</span></strong><span>of the collection dates from 2022 or later.</span></p>
          <p><strong className="serif">{peak[0]}</strong><span>is the densest year, with {peak[1].length} exhibits.</span></p>
        </div>
      </div>

      <div className="pulse-readout mono" aria-live="polite">
        {hover ? <><i className={`dot t-${hover.track.toLowerCase()}`} /><span>{formatDate(hover.date).toUpperCase()}</span><b className="serif">{hover.title}</b><span className="ro-hint">CLICK TO OPEN</span></> : <span>HOVER A BLOCK TO READ IT · EACH BLOCK IS ONE EXHIBIT</span>}
      </div>

      <div className="pulse-scroller" data-lenis-prevent>
        <div className="pulse-chart" ref={ref} style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }} onPointerLeave={() => setHover(null)}>
          {years.map((y, col) => (
            <div className="pulse-col" key={y}>
              {(byYear.get(y) ?? []).map((e, k) => (
                <motion.button key={e.id} tabIndex={-1} aria-hidden="true" className={`pulse-block t-${e.track.toLowerCase()} ${hover === e ? 'on' : ''}`}
                  initial={{ scaleY: 0, opacity: 0 }} animate={seen ? { scaleY: 1, opacity: 1 } : undefined}
                  transition={{ delay: col * 0.012 + k * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  onPointerEnter={() => setHover(e)} onFocus={() => setHover(e)} onClick={() => onOpen(e)} />
              ))}
              {y % 10 === 0 && <span className="pulse-tick mono">{y}</span>}
            </div>
          ))}
        </div>
        <div className="pulse-eras" style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }} aria-hidden="true">
          {eras.map(e => <span key={e.title} className="mono" style={{ gridColumn: `${e.start - firstYear + 1} / ${e.end - firstYear + 2}` }}>{e.numeral}</span>)}
        </div>
      </div>
      <div className="legend mono">{tracks.map(t => <span key={t}><i className={`dot t-${t.toLowerCase()}`} />{t.toUpperCase()}</span>)}</div>
    </section>
  );
}
