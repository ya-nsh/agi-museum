'use client';

import { motion, useScroll, useTransform, useVelocity, useSpring } from 'motion/react';
import { events } from '@/lib/museum';

/** Two counter-running bands of exhibit titles that lean into your scroll speed. */
export function Marquee({ onOpen }: { onOpen: (id: string) => void }) {
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { stiffness: 120, damping: 30 });
  const skew = useTransform(velocity, [-2500, 2500], [-5, 5], { clamp: true });
  const pick = (a: number, b: number) => events.filter((_, i) => i % a === b);
  const rows = [pick(2, 0), pick(2, 1)];
  return (
    <section className="marquee" aria-hidden="true">
      {rows.map((row, r) => (
        <motion.div className={`marquee-row ${r ? 'reverse' : ''}`} key={r} style={{ skewX: skew }}>
          {[0, 1].map(copy => (
            <div className="marquee-track" key={copy}>
              {row.map(e => (
                <button key={e.id} tabIndex={-1} onClick={() => onOpen(e.id)} className="marquee-item" data-cursor="Open">
                  <span className="mono">{e.year}</span>
                  <span className="serif">{e.title}</span>
                  <i className={`star t-${e.track.toLowerCase()}`}>✳</i>
                </button>
              ))}
            </div>
          ))}
        </motion.div>
      ))}
    </section>
  );
}
