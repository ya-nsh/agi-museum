'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { perspectives } from '@/data/perspectives';
import { Eyebrow, RevealLines } from './reveal';

/** An interpretive map of the argument: pace on one axis, where power sits on the other. */
export function Debate() {
  const [sel, setSel] = useState(0);
  const p = perspectives[sel];
  const pos = (v: number) => `${50 + v * 42}%`;

  return (
    <section id="debate" className="debate shell" aria-labelledby="debate-title">
      <div className="section-head">
        <div>
          <Eyebrow index="06">THE GREAT DEBATE</Eyebrow>
          <RevealLines id="debate-title" className="section-title serif" lines={[<span key="a">One technology.</span>, <span key="b"><em>Many futures.</em></span>]} />
        </div>
        <p className="section-lede">The disagreement is about more than speed. It is about control, access, risk, and who gets to decide. Select a perspective on the map.</p>
      </div>

      <div className="debate-layout">
        <div className="map" role="radiogroup" aria-label="Perspectives">
          <span className="axis ax-x" aria-hidden="true" /><span className="axis ax-y" aria-hidden="true" />
          <span className="axis-name mono an-left">← SLOW DOWN</span>
          <span className="axis-name mono an-right">SPEED UP →</span>
          <span className="axis-name mono an-top">POWER DISTRIBUTED ↑</span>
          <span className="axis-name mono an-bottom">↓ POWER WITH STATES & INSTITUTIONS</span>
          <motion.span className="cross cx" aria-hidden="true" animate={{ left: pos(p.x) }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          <motion.span className="cross cy" aria-hidden="true" animate={{ top: pos(-p.y) }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          {perspectives.map((q, i) => (
            <motion.button key={q.name} role="radio" aria-checked={sel === i} className={`node ${sel === i ? 'on' : ''}`} style={{ left: pos(q.x), top: pos(-q.y) }}
              onClick={() => setSel(i)} initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 260, damping: 18 }}>
              <span className="node-dot"><i /></span>
              <span className="node-label">{q.name}</span>
            </motion.button>
          ))}
          <span className="map-note mono">AN INTERPRETIVE MAP, NOT A MEASUREMENT</span>
        </div>

        <div className="perspective-card">
          <AnimatePresence mode="wait">
            <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}>
              <span className="mono pc-index">{String(sel + 1).padStart(2, '0')} / {String(perspectives.length).padStart(2, '0')}</span>
              <h3 className="serif pc-name">{p.name}</h3>
              <p className="pc-title serif"><em>{p.title}</em></p>
              <p className="pc-body">{p.body}</p>
              <dl className="pc-grid">
                <div><dt className="mono">WANTS</dt><dd>{p.wants}</dd></div>
                <div><dt className="mono">FEARS</dt><dd>{p.worries}</dd></div>
              </dl>
              <div className="pc-foot">
                <span>{p.people}</span>
                <a href={p.source} target="_blank" rel="noreferrer" data-cursor="Read">{p.sourceName}<ArrowUpRight size={15} /></a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="debate-foot">
        <p className="nuance">These are overlapping perspectives, not fixed teams. Supporting open models does not make someone e/acc; studying safety does not imply opposing progress.</p>
        <Link className="stand-cta" href="/stand" data-cursor="Begin">
          <span className="mono">INTERACTIVE · 8 STATEMENTS</span>
          <span className="serif">Where do <em>you</em> stand?</span>
          <span className="stand-cta-sub">Answer eight statements and find your own place on this map. <ArrowRight size={15} /></span>
        </Link>
      </div>
    </section>
  );
}
