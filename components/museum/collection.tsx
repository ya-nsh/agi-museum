'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownWideNarrow, ArrowUpRight, ArrowUpWideNarrow, LayoutGrid, List, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { statuses, tracks, type Track } from '@/data/events';
import { specimensFor } from '@/data/workshop';
import { usePassport } from '@/lib/passport';
import { accession, eraOf, eras, events, formatDate, statusShort, type Event } from '@/lib/museum';
import { Art } from './art';
import { Sigil } from './sigil';
import { Eyebrow, RevealLines } from './reveal';

const PAGE = 12;

export function Collection({ era, setEra, onOpen }: { era: number | null; setEra: (i: number | null) => void; onOpen: (e: Event) => void }) {
  const [track, setTrack] = useState<Track | null>(null);
  const [status, setStatus] = useState<Event['status'] | null>(null);
  const [query, setQuery] = useState('');
  const [newest, setNewest] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = events.filter(e =>
      (era === null || eraOf(e) === era) && (!track || e.track === track) && (!status || e.status === status) &&
      (!q || `${e.title} ${e.summary} ${e.people} ${e.date} ${e.sourceName}`.toLowerCase().includes(q)));
    return newest ? [...list].reverse() : list;
  }, [era, track, status, query, newest]);

  const shown = filtered.slice(0, limit);
  const reset = () => { setEra(null); setTrack(null); setStatus(null); setQuery(''); setLimit(PAGE); };
  const dirty = era !== null || track || status || query;
  const trackCount = (t: Track) => events.filter(e => (era === null || eraOf(e) === era) && e.track === t).length;

  return (
    <section id="collection" className="collection shell" aria-labelledby="collection-title">
      <div className="section-head">
        <div>
          <Eyebrow index="02">THE PERMANENT COLLECTION</Eyebrow>
          <RevealLines id="collection-title" className="section-title serif" lines={[<span key="a">Every exhibit,</span>, <span key="b"><em>open</em> to inspection.</span>]} />
        </div>
        <p className="section-lede">Filter by gallery, thread or kind of evidence. Open any object to read why it matters, who was involved, and the original source.</p>
      </div>

      <div className="controls" role="group" aria-label="Filter the collection">
        <div className="control-row">
          <div className="chips" role="group" aria-label="Gallery">
            <Chip on={era === null} onClick={() => { setEra(null); setLimit(PAGE); }}>All galleries</Chip>
            {eras.map((e, i) => <Chip key={e.title} on={era === i} onClick={() => { setEra(era === i ? null : i); setLimit(PAGE); }} title={`${e.title}, ${e.label}`}><span className="serif chip-num">{e.numeral}</span><span className="chip-long">{e.title}</span></Chip>)}
          </div>
          <label className="filter-search">
            <Search size={15} />
            <input value={query} onChange={e => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="Filter by name, person, year" aria-label="Filter exhibits" />
            {query && <button onClick={() => setQuery('')} aria-label="Clear filter"><X size={14} /></button>}
          </label>
        </div>
        <div className="control-row">
          <div className="chips" role="group" aria-label="Thread">
            {tracks.map(t => (
              <Chip key={t} on={track === t} onClick={() => { setTrack(track === t ? null : t); setLimit(PAGE); }}>
                <i className={`dot t-${t.toLowerCase()}`} />{t}<sup className="mono">{trackCount(t)}</sup>
              </Chip>
            ))}
            <span className="chip-divider" />
            <select className="status-select mono" value={status ?? ''} onChange={e => { setStatus((e.target.value || null) as Event['status'] | null); setLimit(PAGE); }} aria-label="Evidence type">
              <option value="">ALL EVIDENCE</option>
              {statuses.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="view-tools">
            <span className="result-count mono" aria-live="polite"><AnimatePresence mode="popLayout" initial={false}><motion.b key={filtered.length} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>{String(filtered.length).padStart(2, '0')}</motion.b></AnimatePresence> / {events.length}</span>
            <button className="icon-btn" onClick={() => setNewest(v => !v)} aria-label={newest ? 'Sort oldest first' : 'Sort newest first'} title={newest ? 'Newest first' : 'Oldest first'}>{newest ? <ArrowUpWideNarrow size={16} /> : <ArrowDownWideNarrow size={16} />}</button>
            <div className="seg" role="radiogroup" aria-label="Layout">
              <button role="radio" aria-checked={view === 'grid'} className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={15} /></button>
              <button role="radio" aria-checked={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="List view"><List size={15} /></button>
            </div>
          </div>
        </div>
      </div>

      <p className="filter-summary" aria-live="polite">
        Showing <b>{filtered.length}</b> {filtered.length === 1 ? 'exhibit' : 'exhibits'}
        {track && <> on the <b className={`t-${track.toLowerCase()} tint`}>{track}</b> thread</>}
        {status && <> labeled <b>{status.toLowerCase()}</b></>}
        {era !== null && <> in <b>Gallery {eras[era].numeral}: {eras[era].title}</b></>}
        {query.trim() && <> matching <b>“{query.trim()}”</b></>}
        {newest ? ', newest first.' : ', oldest first.'}
      </p>

      {shown.length ? (
        <ul className={`exhibits ${view}`}>
          {/* initial={false}: cards are in the server HTML and stay visible on hydration;
              only filtering, sorting and "show more" animate. Position-only layout
              animation never scales (and so never re-rasterizes) a card. */}
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((e, i) => (
              <motion.li key={e.id} layout="position" initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.6, delay: Math.min(i % PAGE, 11) * 0.035, ease: [0.22, 1, 0.36, 1] }}>
                {view === 'grid' ? <ExhibitCard e={e} onOpen={onOpen} /> : <ExhibitRow e={e} onOpen={onOpen} />}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <motion.div className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="serif">Nothing in the archive matches.</p>
          <button className="btn btn-line" onClick={reset}><span>Reset all filters</span></button>
        </motion.div>
      )}

      <div className="collection-foot">
        {filtered.length > limit && <button className="btn btn-ghost" onClick={() => setLimit(l => l + PAGE * 2)}><span>Show more exhibits</span><span className="mono">+{Math.min(PAGE * 2, filtered.length - limit)}</span></button>}
        {filtered.length > limit && <button className="text-btn mono" onClick={() => setLimit(filtered.length)}>SHOW ALL {filtered.length}</button>}
        {dirty && <button className="text-btn mono" onClick={reset}>CLEAR FILTERS</button>}
      </div>
    </section>
  );
}

function Chip({ on, children, ...rest }: { on: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`chip ${on ? 'on' : ''}`} aria-pressed={on} {...rest}>
      {on && <motion.span className="chip-bg" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} />}
      <span className="chip-label">{children}</span>
    </button>
  );
}

export function ExhibitCard({ e, onOpen }: { e: Event; onOpen: (e: Event) => void }) {
  const seen = usePassport().seen.includes(e.id);
  const move = (ev: React.PointerEvent<HTMLButtonElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
    ev.currentTarget.style.setProperty('--mx', `${px * 100}%`);
    ev.currentTarget.style.setProperty('--my', `${py * 100}%`);
    ev.currentTarget.style.setProperty('--rx', `${(0.5 - py) * 5}deg`);
    ev.currentTarget.style.setProperty('--ry', `${(px - 0.5) * 6}deg`);
  };
  const leave = (ev: React.PointerEvent<HTMLButtonElement>) => { ev.currentTarget.style.setProperty('--rx', '0deg'); ev.currentTarget.style.setProperty('--ry', '0deg'); };
  return (
    <button className={`card t-${e.track.toLowerCase()} ${e.id === 'exhibit-01' ? 'has-photo' : ''}`} onClick={() => onOpen(e)} onPointerMove={move} onPointerLeave={leave} data-cursor="View">
      <span className="card-glow" aria-hidden="true" />
      {e.id === 'exhibit-01' && <Art name="turing" className="card-photo" alt="" sizes="(min-width: 700px) 420px, 100vw" />}
      <span className="card-top mono"><span>NO. {accession(e)}{seen && <b className="card-seen" title="In your passport"> · SEEN</b>}</span><span>{statusShort[e.status].toUpperCase()}</span></span>
      <span className="card-art">
        <span className="card-year serif">{e.year}</span>
        <Sigil event={e} className="card-sigil" />
      </span>
      <span className="card-body">
        <span className="card-meta mono"><i className={`dot t-${e.track.toLowerCase()}`} />{e.track.toUpperCase()} · {formatDate(e.date, true).toUpperCase()}</span>
        <span className="card-title serif">{e.title}</span>
        <span className="card-summary">{e.summary}</span>
      </span>
      <span className="card-foot mono"><span>GALLERY {eras[eraOf(e)].numeral}{specimensFor(e.id).length > 0 && <b className="card-hands"> · HANDS-ON</b>}</span><span className="card-open">EXPLORE <ArrowUpRight size={14} /></span></span>
    </button>
  );
}

/** An exhibit card that opens the exhibit's own page (for server-rendered lists). */
export function ExhibitCardLink({ e }: { e: Event }) {
  const router = useRouter();
  return <ExhibitCard e={e} onOpen={() => router.push(`/exhibit/${e.id}`)} />;
}

function ExhibitRow({ e, onOpen }: { e: Event; onOpen: (e: Event) => void }) {
  return (
    <button className={`row t-${e.track.toLowerCase()}`} onClick={() => onOpen(e)} data-cursor="View">
      <span className="row-year serif">{e.year}</span>
      <span className="row-title"><span className="serif">{e.title}</span><small>{e.summary}</small></span>
      <span className="row-track mono"><i className={`dot t-${e.track.toLowerCase()}`} />{e.track}</span>
      <span className="row-status mono">{statusShort[e.status]}</span>
      <ArrowUpRight size={18} className="row-arrow" />
    </button>
  );
}
