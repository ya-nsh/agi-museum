'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { pairEvents, partnerIn, type Pair } from '@/data/pairs';
import { accession, formatDate, type Event } from '@/lib/museum';
import { Reveal } from '../reveal';
import { Sigil } from '../sigil';

function Panel({ e, side }: { e: Event; side: 'left' | 'right' }) {
  return (
    <Link href={`/exhibit/${e.id}`} className={`dp-panel ${side} t-${e.track.toLowerCase()}`} data-cursor="View">
      <span className="dp-top mono"><span>NO. {accession(e)}</span><span>{formatDate(e.date, true).toUpperCase()}</span></span>
      <Sigil event={e} className="dp-sigil" />
      <span className="dp-year serif">{e.year}</span>
      <span className="dp-title serif">{e.title}</span>
      <span className="dp-summary">{e.summary}</span>
      <span className="dp-open mono">VIEW EXHIBIT <ArrowUpRight size={13} /></span>
    </Link>
  );
}

/** Two exhibits hung as a pair, with the curator's note between them. */
export function Diptych({ pair, index }: { pair: Pair; index: number }) {
  const [a, b] = pairEvents(pair);
  const gap = b.year - a.year;
  return (
    <Reveal as="section" className="diptych" id={pair.id} aria-labelledby={`${pair.id}-title`}>
      <Panel e={a} side="left" />
      <div className="dp-middle">
        <span className="mono dp-num">PENDANT {String(index + 1).padStart(2, '0')}</span>
        <span className="dp-gap" aria-label={`${gap} years apart`}><i /><b className="serif">{gap}</b><span className="mono">YEAR{gap === 1 ? '' : 'S'} APART</span><i /></span>
        <h2 id={`${pair.id}-title`} className="serif dp-name">{pair.title}</h2>
        <p className="dp-note">{pair.note}</p>
        <dl className="dp-compare">
          <div><dt className="mono">WHAT CHANGED</dt><dd>{pair.changed}</dd></div>
          <div><dt className="mono">WHAT DIDN’T</dt><dd>{pair.same}</dd></div>
        </dl>
      </div>
      <Panel e={b} side="right" />
    </Reveal>
  );
}

/** A compact pointer from one exhibit to its pendant. */
export function PendantLink({ pair, exhibitId, onNavigate }: { pair: Pair; exhibitId: string; onNavigate?: () => void }) {
  const other = partnerIn(pair, exhibitId);
  return (
    <Link href={`/pairs#${pair.id}`} className="source-card pendant-card" onClick={onNavigate} data-cursor="Compare">
      <span className="mono">HUNG AS A PAIR WITH NO. {accession(other)} · {other.year}</span>
      <strong className="serif">{pair.title}</strong>
      <span className="source-host mono">{other.title.toUpperCase()}</span>
      <ArrowUpRight className="source-arrow" size={22} />
    </Link>
  );
}
