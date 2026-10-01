'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ComponentType } from 'react';
import { specimens, type Specimen, type SpecimenSlug } from '@/data/workshop';
import { accession, events } from '@/lib/museum';
import { passport } from '@/lib/passport';
import { Reveal } from '../reveal';

const loading = () => <div className="sp-loading mono" aria-hidden="true">SETTING UP THE SPECIMEN…</div>;

// Each specimen is its own chunk, so an exhibit page only loads the one it shows.
const STAGES: Record<SpecimenSlug, ComponentType<{ preset?: string }>> = {
  neuron: dynamic(() => import('./neuron'), { loading }),
  perceptron: dynamic(() => import('./perceptron'), { loading }),
  eliza: dynamic(() => import('./eliza'), { loading }),
  'chinese-room': dynamic(() => import('./chinese-room'), { loading }),
  backprop: dynamic(() => import('./backprop'), { loading }),
  preferences: dynamic(() => import('./preferences'), { loading }),
};

export const exhibitOf = (s: Specimen) => events.find(e => e.id === s.exhibit)!;
export const specimenNumber = (s: Specimen) => String(specimens.indexOf(s) + 1).padStart(2, '0');

/** A framed, labeled hands-on specimen: the stage plus what it shows and what it leaves out. */
export function SpecimenPanel({ specimen, preset, id, exhibitLink = true }: { specimen: Specimen; preset?: string; id?: string; exhibitLink?: boolean }) {
  const e = exhibitOf(specimen);
  const Stage = STAGES[specimen.slug];
  const touch = () => passport.mark(`workshop:${specimen.slug}`);
  return (
    <section id={id ?? specimen.slug} className={`specimen t-${e.track.toLowerCase()}`} aria-labelledby={`${id ?? specimen.slug}-title`}>
      <header className="sp-head">
        <div>
          <p className="mono sp-kicker"><i className="dot" />SPECIMEN {specimenNumber(specimen)} · NO. {accession(e)} · {e.year}</p>
          <h3 id={`${id ?? specimen.slug}-title`} className="serif sp-title">{specimen.title}</h3>
        </div>
        <div className="sp-intro">
          <p>{specimen.instructions}</p>
          {exhibitLink && <Link className="sp-exhibit mono" href={`/exhibit/${e.id}`}>FROM EXHIBIT {accession(e)} · {e.title.toUpperCase()} <ArrowUpRight size={13} /></Link>}
        </div>
      </header>
      {/* Any interaction with the stage counts toward the workshop stamp. */}
      <div className="sp-stage" onPointerDownCapture={touch} onKeyDownCapture={touch}><Stage preset={preset} /></div>
      <footer className="sp-notes">
        <Reveal className="sp-note"><p className="mono">WHAT IT SHOWS</p><p>{specimen.shows}</p></Reveal>
        <Reveal className="sp-note" delay={0.08}><p className="mono">WHAT IT SIMPLIFIES</p><p>{specimen.simplifies}</p></Reveal>
      </footer>
    </section>
  );
}

/** Small line drawings that stand in for each specimen in indexes and teasers. */
export function SpecimenArt({ slug }: { slug: SpecimenSlug }) {
  const common = { viewBox: '0 0 120 80', className: 'sp-art', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const };
  switch (slug) {
    case 'neuron':
      return <svg {...common}><circle cx="20" cy="24" r="7" /><circle cx="20" cy="56" r="7" className="fill" /><path d="M27 26 L56 38 M27 54 L56 42" /><circle cx="66" cy="40" r="12" className="fill-soft" /><path d="M78 40 H100" /><circle cx="106" cy="40" r="5" className="fill" /></svg>;
    case 'perceptron':
      return <svg {...common}><path d="M14 70 L106 10" strokeDasharray="3 3" />{[[24, 20], [36, 32], [20, 40], [46, 18]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.2" className="fill" />)}{[[80, 60], [94, 48], [70, 70], [100, 66]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.2" />)}</svg>;
    case 'eliza':
      return <svg {...common}><rect x="12" y="10" width="96" height="60" rx="3" /><path d="M22 28 H70 M22 40 H86 M22 52 H44" /><path d="M50 52 H56" className="blink" strokeWidth="3" /></svg>;
    case 'chinese-room':
      return <svg {...common}><rect x="30" y="8" width="60" height="64" /><path d="M60 72 V52 M50 72 H70" /><text x="60" y="40" textAnchor="middle" fontSize="22" fill="currentColor" stroke="none" lang="zh-Hans">字</text><path d="M4 66 L26 66" strokeDasharray="2 3" /><path d="M94 66 L116 66" strokeDasharray="2 3" /></svg>;
    case 'backprop':
      return <svg {...common}>{[24, 56].map(y => [16, 32, 48, 64].map(y2 => <path key={`${y}-${y2}`} d={`M18 ${y} L60 ${y2}`} opacity="0.5" />))}{[16, 32, 48, 64].map(y => <path key={y} d={`M60 ${y} L102 40`} opacity="0.5" />)}{[24, 56].map(y => <circle key={y} cx="18" cy={y} r="4" className="fill" />)}{[16, 32, 48, 64].map(y => <circle key={y} cx="60" cy={y} r="4" className="fill-soft" />)}<circle cx="102" cy="40" r="5" className="fill" /><path d="M96 70 Q60 80 24 70" className="back" /></svg>;
    case 'preferences':
      return <svg {...common}><path d="M34 22 l6 12 l13 1 l-10 8 l4 13 l-13 -7 l-13 7 l4 -13 l-10 -8 l13 -1 z" /><circle cx="86" cy="40" r="17" /><path d="M56 66 L64 66" /><path d="M52 74 H68" opacity="0.4" /></svg>;
  }
}
