'use client';

import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { tracks } from '@/data/events';
import { eraEvents, eras, inWords, spanYears, type Event } from '@/lib/museum';
import { Eyebrow, RevealLines } from './reveal';
import { useMuseum } from './providers';

/** Six galleries on a horizontal track, driven by vertical scroll on wide screens. */
export function Galleries({ onEnter, onOpen }: { onEnter: (i: number) => void; onOpen: (e: Event) => void }) {
  const { reduced } = useMuseum();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, v => -v * dist);
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const measure = () => {
      const wide = innerWidth >= 960 && !reduced;
      setPinned(wide);
      setDist(wide && track.current ? Math.max(0, track.current.scrollWidth - innerWidth) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    addEventListener('resize', measure);
    return () => { ro.disconnect(); removeEventListener('resize', measure); };
  }, [reduced]);

  useMotionValueEvent(scrollYProgress, 'change', v => setActive(Math.min(eras.length - 1, Math.max(0, Math.round(v * (eras.length) - 0.35)))));

  return (
    <section id="galleries" ref={section} className={`galleries ${pinned ? 'is-pinned' : ''}`} style={pinned ? { height: `calc(100vh + ${dist}px)` } : undefined} aria-labelledby="galleries-title">
      <div className="galleries-sticky">
        <motion.div className="galleries-track" ref={track} style={pinned ? { x } : undefined}>
          <div className="gallery-intro">
            <Eyebrow index="01">THE GALLERIES</Eyebrow>
            <RevealLines id="galleries-title" className="section-title serif" lines={[<span key="a">Six rooms.</span>, <span key="b"><em>{inWords(spanYears).replace(/^./, c => c.toUpperCase())}</em> years.</span>]} />
            <p className="section-lede">The collection is hung in chronological rooms, from the first formal model of a neuron to the claims of this autumn. {pinned ? 'Keep scrolling to walk through them.' : 'Scroll through them below.'}</p>
            {pinned && <div className="walk-hint mono"><span>WALK THIS WAY</span><ArrowDownRight size={16} /></div>}
          </div>
          {eras.map((era, i) => <GalleryPanel key={era.title} i={i} x={x} pinned={pinned} onEnter={onEnter} onOpen={onOpen} />)}
        </motion.div>
        {pinned && (
          <div className="galleries-progress shell">
            {eras.map((e, i) => <span key={e.title} className={`mono ${i === active ? 'on' : ''}`}>{e.numeral}<small>{e.title}</small></span>)}
            <motion.i style={{ scaleX: bar }} />
          </div>
        )}
      </div>
    </section>
  );
}

function GalleryPanel({ i, x, pinned, onEnter, onOpen }: { i: number; x: MotionValue<number>; pinned: boolean; onEnter: (i: number) => void; onOpen: (e: Event) => void }) {
  const era = eras[i];
  const list = useMemo(() => eraEvents(i), [i]);
  const shift = useTransform(x, v => v * -0.12 - i * 20);
  const highlights = [list[0], list[Math.floor(list.length / 2)], list[list.length - 1]].filter((e, k, a) => a.indexOf(e) === k);
  const counts = tracks.map(t => ({ t, n: list.filter(e => e.track === t).length }));
  const dots = useMemo(() => {
    // Place each exhibit at its fractional date, stacking into lanes only when dots would touch.
    const span = era.end + 1 - era.start, lanes: number[] = [];
    return list.map(e => {
      const [, m = '6', d = '15'] = e.date.split('-');
      const x = ((e.year + (Number(m) - 1) / 12 + (Number(d) - 1) / 365 - era.start) / span) * 100;
      let lane = lanes.findIndex(last => x - last > 2.2);
      if (lane < 0) lane = lanes.length < 5 ? lanes.length : lanes.indexOf(Math.min(...lanes));
      lanes[lane] = x;
      return { e, x, lane };
    });
  }, [list, era]);

  return (
    <motion.article className={`gallery-panel g-${i + 1}`} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.9 }}>
      <motion.span className="panel-numeral serif" style={pinned ? { x: shift } : undefined} aria-hidden="true">{era.numeral}</motion.span>
      {i === 0 && <img className="panel-art" src="/alan-turing.jpg" alt="" width={675} height={919} />}
      {i === eras.length - 1 && <img className="panel-art wide" src="/intelligence-gallery.png" alt="" width={1536} height={1024} />}
      <div className="panel-head">
        <span className="mono">GALLERY {era.numeral} · {era.label}</span>
        <h3 className="serif">{era.title}</h3>
        <p className="panel-desc serif"><em>{era.description}</em></p>
      </div>
      <p className="panel-essay">{era.essay}</p>
      <div className="panel-constellation" aria-hidden="true">
        {dots.map(d => <i key={d.e.id} className={`t-${d.e.track.toLowerCase()}`} style={{ left: `${d.x}%`, bottom: `${d.lane * 9 + 4}px` }} />)}
        <span className="mono">{era.start}</span><span className="mono">{era.end}</span>
      </div>
      <div className="panel-meta">
        <div className="panel-count"><strong className="serif">{list.length}</strong><span className="mono">EXHIBITS</span></div>
        <div className="panel-bars">
          {counts.map(c => <span key={c.t} title={`${c.t}: ${c.n}`} className={`t-${c.t.toLowerCase()}`} style={{ flexGrow: c.n }} />)}
        </div>
      </div>
      <ul className="panel-highlights">
        {highlights.map(e => <li key={e.id}><button onClick={() => onOpen(e)} data-cursor="Open"><span className="mono">{e.year}</span>{e.title}<ArrowUpRight size={14} /></button></li>)}
      </ul>
      <button className="btn btn-line" onClick={() => onEnter(i)}><span>Enter gallery {era.numeral}</span><ArrowDownRight size={16} /></button>
    </motion.article>
  );
}
