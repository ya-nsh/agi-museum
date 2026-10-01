'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Eye, Lock, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/museum/header';
import { CommandPalette } from '@/components/museum/command-palette';
import { Footer } from '@/components/museum/closing';
import { Odometer } from '@/components/museum/odometer';
import { RevealLines } from '@/components/museum/reveal';
import { Sigil } from '@/components/museum/sigil';
import { eras, events, formatDate, statusShort, type Event } from '@/lib/museum';
import { passport } from '@/lib/passport';
import {
  END, START, eraAt, eventTicks, frontierAt, frontierToday, futureAt, knownAt, latestForecastAt,
  monthKey, monthLabel, monthOf, parseKey, perspectiveDebuts,
} from '@/lib/time-machine';

const JUMPS = [
  { label: '1950', key: '1950-10' }, { label: '1969', key: '1969-12' }, { label: '1997', key: '1997-05' },
  { label: '2012', key: '2012-12' }, { label: '2017', key: '2017-06' }, { label: 'ChatGPT', key: '2022-11' }, { label: 'Today', key: monthKey(END) },
];
const pct = (t: number) => ((t - START) / (END - START)) * 100;
const pos = (v: number) => `${50 + v * 42}%`;

/** Orders of magnitude, written out for people rather than for scientists. */
function magnitude(n: number) {
  if (n < 0.05) return 'about the same size';
  if (n < 2.5) return `about ${Math.round(10 ** n).toLocaleString('en-US')} times smaller`;
  const k = Math.round(n);
  const words = ['', 'ten', 'a hundred', 'a thousand', 'ten thousand', 'a hundred thousand', 'a million', 'ten million', 'a hundred million', 'a billion', 'ten billion', 'a hundred billion', 'a trillion'];
  return k < words.length ? `about ${words[k]} times smaller` : `about 10^${k} times smaller`;
}

export default function TimeMachine() {
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  const [t, setT] = useState(monthOf('1997-05'));
  const [playing, setPlaying] = useState(false);
  const [peek, setPeek] = useState(false);
  const traveled = useRef(false);

  // Shareable: /time-machine#2016-03 opens on that month.
  useEffect(() => {
    const sync = () => { const v = parseKey(location.hash.slice(1)); if (v !== null) setT(v); };
    sync();
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, []);

  const travel = useCallback((v: number) => {
    const next = Math.min(END, Math.max(START, Math.round(v)));
    setT(next);
    setPeek(false);
    history.replaceState(null, '', `#${monthKey(next)}`);
    if (!traveled.current) { traveled.current = true; passport.mark('time-machine'); }
  }, []);

  const nextTick = useCallback((dir: 1 | -1) => {
    const i = dir > 0 ? eventTicks.find(m => m > t) : [...eventTicks].reverse().find(m => m < t);
    return i ?? (dir > 0 ? END : START);
  }, [t]);

  // Playback hops from one exhibit's month to the next and stops at the present.
  const running = playing && t < END;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => travel(nextTick(1)), 1400);
    return () => clearTimeout(id);
  }, [running, travel, nextTick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea,[role=dialog]')) return;
      if (e.key === 'ArrowRight') travel(nextTick(1));
      if (e.key === 'ArrowLeft') travel(nextTick(-1));
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [travel, nextTick]);

  const known = useMemo(() => knownAt(t), [t]);
  const future = useMemo(() => futureAt(t), [t]);
  const latest = known.at(-1);
  const recent = known.slice(-5, -1).reverse();
  const next = future[0];
  const era = eras[eraAt(t)];
  const frontier = frontierAt(t);
  const forecast = latestForecastAt(t);
  const year = Math.floor(t / 12);
  const monthsAway = next ? monthOf(next.date) - t : 0;

  return (
    <>
      <Header onSearch={() => setPalette(true)} />
      <main className="tm">
        <section className="tm-hero shell" aria-labelledby="tm-title">
          <p className="mono tm-kicker"><span className="live-dot" /> THE TIME MACHINE</p>
          <RevealLines as="h1" id="tm-title" className="tm-title serif" play lines={[<span key="a">Stand in</span>, <span key="b"><em>another year.</em></span>]} />
          <p className="tm-lede">Pick a month and the museum rearranges itself around it: only what had happened, the largest computer run anyone had attempted, the arguments people were making, and everything that was still in the future.</p>
        </section>

        <section className="tm-console shell" aria-label="Choose a month">
          <div className="tm-readout">
            <Odometer value={year} className="tm-year serif" />
            <div>
              <p className="mono tm-month">{monthLabel(t).toUpperCase()}</p>
              <p className="tm-era serif"><em>Gallery {era.numeral}.</em> {era.title}</p>
            </div>
          </div>
          <div className="tm-scrubber">
            <div className="tm-eras" aria-hidden="true">
              {eras.map(e => {
                const a = pct(Math.max(START, e.start * 12)), b = pct(Math.min(END, e.end * 12 + 11));
                // Recent galleries span a year or two; their numerals would collide, and the readout names the current one anyway.
                return <span key={e.numeral} style={{ left: `${a}%`, width: `${b - a}%` }} className={`${e === era ? 'on' : ''} ${b - a < 4 ? 'narrow' : ''}`}><i className="mono">{e.numeral}</i></span>;
              })}
            </div>
            <div className="tm-ticks" aria-hidden="true">
              {eventTicks.map(m => <i key={m} style={{ left: `${pct(m)}%` }} className={m <= t ? 'past' : ''} />)}
              <motion.b className="tm-needle" animate={{ left: `${pct(t)}%` }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} />
            </div>
            <input type="range" min={START} max={END} step={1} value={t} onChange={e => { setPlaying(false); travel(Number(e.target.value)); }}
              aria-label="Month" aria-valuetext={monthLabel(t)} className="tm-range" />
            <div className="tm-scale mono" aria-hidden="true"><span>{Math.floor(START / 12)}</span><span>{Math.floor(END / 12)}</span></div>
          </div>
          <div className="tm-controls">
            <button className="icon-btn round" onClick={() => { setPlaying(false); travel(nextTick(-1)); }} aria-label="Previous exhibit"><SkipBack size={15} /></button>
            <button className={`icon-btn ${running ? 'active' : ''}`} onClick={() => { if (running) { setPlaying(false); return; } if (t >= END) travel(START); setPlaying(true); }}>
              {running ? <Pause size={15} /> : <Play size={15} />}{running ? 'Pause' : 'Play history'}
            </button>
            <button className="icon-btn round" onClick={() => { setPlaying(false); travel(nextTick(1)); }} aria-label="Next exhibit"><SkipForward size={15} /></button>
            <span className="tm-jumps">
              {JUMPS.map(j => <button key={j.key} className={`chip ${monthKey(t) === j.key ? 'on' : ''}`} onClick={() => { setPlaying(false); travel(monthOf(j.key)); }}>{j.label}</button>)}
            </span>
          </div>
        </section>

        <section className="tm-grid shell" aria-live="polite">
          <article className="tm-card tm-news">
            <p className="mono tm-label">THE LATEST NEWS, AS OF {monthLabel(t).toUpperCase()}</p>
            {latest ? (
              <>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={latest.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                    <Link href={`/exhibit/${latest.id}`} className={`tm-headline t-${latest.track.toLowerCase()}`}>
                      <Sigil event={latest} className="tm-sigil" />
                      <span className="mono"><i className="dot" />{formatDate(latest.date).toUpperCase()} · {statusShort[latest.status].toUpperCase()}</span>
                      <span className="serif">{latest.title}</span>
                      <span className="tm-summary">{latest.summary}</span>
                    </Link>
                  </motion.div>
                </AnimatePresence>
                {recent.length > 0 && (
                  <ul className="tm-recent">
                    {recent.map(e => <li key={e.id}><Link href={`/exhibit/${e.id}`}><span className="mono">{e.year}</span>{e.title}</Link></li>)}
                  </ul>
                )}
              </>
            ) : <p className="tm-empty serif">Nothing in the collection has happened yet. The first exhibit arrives in {monthLabel(monthOf(events[0].date))}.</p>}
          </article>

          <article className="tm-card">
            <p className="mono tm-label">THE COLLECTION THEN</p>
            <p className="tm-big serif">{known.length}<span> / {events.length}</span></p>
            <div className="tm-bar" aria-hidden="true"><motion.i animate={{ width: `${(known.length / events.length) * 100}%` }} transition={{ type: 'spring', stiffness: 140, damping: 26 }} /></div>
            <p className="tm-note">{future.length ? `${future.length} exhibit${future.length === 1 ? ' has' : 's have'} not happened yet.` : 'Every exhibit has happened. This is the present.'}</p>
            {next && (
              <div className="tm-sealed">
                <p className="mono">{peek ? <Eye size={13} /> : <Lock size={13} />} NEXT · IN {monthsAway} MONTH{monthsAway === 1 ? '' : 'S'}</p>
                {peek
                  ? <Link href={`/exhibit/${next.id}`} className="serif">{next.title} <ArrowUpRight size={14} /></Link>
                  : <button className="text-btn" onClick={() => setPeek(true)}>Sealed until {monthLabel(monthOf(next.date))}. Peek at the future?</button>}
              </div>
            )}
          </article>

          <article className="tm-card">
            <p className="mono tm-label">THE LARGEST TRAINING RUN ON RECORD</p>
            {frontier !== null ? (
              <>
                <p className="tm-big serif">10<sup>{frontier.toFixed(1)}</sup><span> FLOP</span></p>
                <p className="tm-note">{frontierToday - frontier < 0.05 ? 'This is the frontier at the collection’s cutoff.' : `Compared with the largest run by September 2026, ${magnitude(frontierToday - frontier)}.`}</p>
              </>
            ) : <p className="tm-note">No notable training runs on record yet. The first entry in the compute dataset dates from 1950.</p>}
            <Link className="tm-more mono" href="/#compute">THE COMPUTE CLIMB <ArrowUpRight size={12} /></Link>
          </article>

          <article className="tm-card tm-debate">
            <p className="mono tm-label">THE DEBATE THEN</p>
            <div className="map tm-map" aria-label="Perspectives present in the collection by this month">
              <span className="axis ax-x" aria-hidden="true" /><span className="axis ax-y" aria-hidden="true" />
              {perspectiveDebuts.map(({ perspective: p, month }) => (
                <span key={p.name} className={`node ${month <= t ? 'on-map' : 'not-yet'}`} style={{ left: pos(p.x), top: pos(-p.y) }}>
                  <span className="node-dot"><i /></span><span className="node-label">{p.name}</span>
                </span>
              ))}
            </div>
            <p className="tm-note">
              {(() => {
                const present = perspectiveDebuts.filter(d => d.month <= t);
                const upcoming = perspectiveDebuts.filter(d => d.month > t).sort((a, b) => a.month - b.month)[0];
                return present.length === 0
                  ? `None of the six perspectives on the map appears in the collection yet.${upcoming ? ` The first, ${upcoming.perspective.name}, arrives in ${upcoming.event.year}.` : ''}`
                  : `${present.length} of 6 perspectives appear in the collection by now.${upcoming ? ` Next to arrive: ${upcoming.perspective.name} (${upcoming.event.year}).` : ''}`;
              })()}
            </p>
          </article>

          <article className="tm-card">
            <p className="mono tm-label">THE NEWEST PREDICTION ON THE SHELF</p>
            {forecast ? (
              <Link href={`/exhibit/${forecast.id}`} className="tm-forecast">
                <span className="mono">{forecast.year} · {forecast.people.split('·')[0].trim()}</span>
                <span className="serif">{forecast.title}</span>
                <span className="tm-summary">{forecast.summary}</span>
              </Link>
            ) : <p className="tm-note">No forecasts or philosophical arguments in the collection yet.</p>}
          </article>

          <article className="tm-card">
            <p className="mono tm-label">THE MOOD OF THE GALLERY</p>
            <p className="tm-era-desc serif"><em>{era.description}</em></p>
            <p className="tm-note">{era.essay}</p>
          </article>
        </section>
        <p className="tm-fine shell">Exhibits dated only by year or by month count from the start of that period. “First appears in the collection” is a statement about this museum, not a claim that nobody held a view earlier. Compute figures come from Epoch AI’s dataset of notable models, retrieved 30 September 2026. Use ← and → to hop between exhibits.</p>
      </main>
      <Footer />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={(e: Event) => router.push(`/exhibit/${e.id}`)} />
    </>
  );
}

