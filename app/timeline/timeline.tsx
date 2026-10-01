'use client';

import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';
import { tracks, type Track } from '@/data/events';
import { accession, eraEvents, eras, events, firstYear, formatDate, lastYear, sourceCount, statusShort, type Event } from '@/lib/museum';
import { Header } from '@/components/museum/header';
import { CommandPalette } from '@/components/museum/command-palette';
import { Footer } from '@/components/museum/closing';
import { RevealLines } from '@/components/museum/reveal';
import { Sigil } from '@/components/museum/sigil';
import { useMuseum } from '@/components/museum/providers';
import { Odometer } from '@/components/museum/odometer';
import { passport } from '@/lib/passport';
import { Art } from '@/components/museum/art';

export default function Timeline() {
  const { scrollTo } = useMuseum();
  const [palette, setPalette] = useState(false);
  const [focus, setFocus] = useState<Track | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [reading, setReading] = useState<Event>(events[0]);
  const hero = useRef<HTMLElement>(null);
  const column = useRef<HTMLDivElement>(null);

  const { scrollYProgress: heroP } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const artScale = useTransform(heroP, [0, 1], [1.02, 1.22]);
  const artY = useTransform(heroP, [0, 1], ['0%', '18%']);
  const copyY = useTransform(heroP, [0, 1], ['0%', '40%']);
  const { scrollYProgress } = useScroll({ target: column, offset: ['start 0.5', 'end 0.6'] });
  const spine = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const pct = useTransform(scrollYProgress, v => `${Math.round(v * 100)}%`);

  // The exhibit crossing the middle of the screen drives the "now reading" counter.
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      const hit = entries.find(en => en.isIntersecting);
      const e = hit && events.find(x => x.id === hit.target.id);
      // Reading an exhibit here counts as seeing it.
      if (e) { setReading(e); passport.seeExhibit(e.id); }
    }, { rootMargin: '-45% 0px -54% 0px' });
    document.querySelectorAll('.tl-event').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => { passport.mark('timeline'); }, []);

  const jump = (e: Event) => {
    const el = document.getElementById(e.id);
    if (!el) return;
    history.replaceState(null, '', `#${e.id}`);
    scrollTo(el, -innerHeight * 0.25);
    setFlash(e.id);
    setTimeout(() => setFlash(null), 2400);
  };

  return (
    <>
      <a className="skip-link" href="#chronology">Skip to the timeline</a>
      <Header current="Timeline" onSearch={() => setPalette(true)} />
      <main className="tl">
        <section className="tl-hero" ref={hero} aria-labelledby="tl-title">
          <Art name="gallery" img={motion.img} priority sizes="100vw" className="tl-art" alt="Conceptual museum installation: a luminous filament connects early computing artifacts to a crystalline sculpture of intelligence" style={{ scale: artScale, y: artY }} />
          <div className="tl-hero-shade" aria-hidden="true" />
          <motion.div className="tl-hero-copy shell" style={{ y: copyY }}>
            <p className="mono tl-kicker enter" style={{ '--d': '0.2s', '--enter-y': '0px' } as React.CSSProperties}>THE COMPLETE COLLECTION · {firstYear} — {lastYear}</p>
            <RevealLines as="h1" id="tl-title" className="tl-title serif" play delay={0.25} stagger={0.12} lines={[<span key="a">Follow the</span>, <span key="b"><em>thread.</em></span>]} />
            {/* The lede is the page's largest text, so it is painted as-is in the first frame. */}
            <p className="tl-lede">
              Every breakthrough, every turning point, every claim, in one continuous reading. {events.length} exhibits, oldest first, each with its context and its source.
            </p>
            <a href="#chronology" className="btn btn-primary enter" style={{ '--d': '0.65s', '--enter-y': '20px' } as React.CSSProperties}>
              <span>Begin in {firstYear}</span><ArrowDown size={16} />
            </a>
          </motion.div>
          <span className="tl-art-caption mono">A CONTEMPORARY INTERPRETATION · AI-GENERATED ARTWORK</span>
        </section>

        <div className="paper">
          <div className="tl-bar">
            <div className="shell tl-bar-inner">
              <div className="tl-threads" role="group" aria-label="Highlight a thread">
                <span className="mono">HIGHLIGHT</span>
                {tracks.map(t => (
                  <button key={t} className={`tl-thread t-${t.toLowerCase()} ${focus === t ? 'on' : ''}`} aria-pressed={focus === t} onClick={() => setFocus(focus === t ? null : t)}>
                    <i className="dot" />{t}<sup className="mono">{events.filter(e => e.track === t).length}</sup>
                  </button>
                ))}
              </div>
              <div className="tl-now-compact mono" aria-hidden="true"><Odometer value={reading.year} /><span>{reading.title}</span></div>
              <div className="tl-meta mono"><span>{events.length} EXHIBITS · {sourceCount} SOURCES</span><span className="tl-pct">READ <motion.b>{pct}</motion.b></span></div>
            </div>
            <motion.i className="tl-bar-progress" style={{ scaleX: scrollYProgress }} />
          </div>

          <div className="shell tl-layout" id="chronology">
            <aside className="tl-rail" aria-label="Chapters">
              <p className="mono tl-rail-label">SIX CHAPTERS</p>
              <ChapterNav />
              <div className={`tl-now t-${reading.track.toLowerCase()}`} aria-live="off">
                <p className="mono">NOW READING · NO. {accession(reading)}</p>
                <Odometer value={reading.year} className="tl-now-year serif" />
                <a href={`#${reading.id}`} className="tl-now-title">{reading.title}</a>
                <span className="mono tl-now-track"><i className="dot" />{reading.track.toUpperCase()}</span>
              </div>
              <div className="tl-rail-note">
                <p className="mono">EVERY EXHIBIT IS LABELED</p>
                <p>History, research, perspectives and company claims each carry their own label. Press <kbd>/</kbd> to search.</p>
              </div>
            </aside>

            <div className="tl-col" ref={column} data-focus={focus ?? undefined}>
              <div className="tl-spine" aria-hidden="true"><motion.i style={{ scaleY: spine }} /></div>
              <Chapters flash={flash} />
              <div className="tl-end">
                <span className="tl-end-node" aria-hidden="true" />
                <p className="mono">9 SEPTEMBER {lastYear} · COLLECTION CUTOFF</p>
                <RevealLines as="h2" className="serif" lines={[<span key="a">The thread</span>, <span key="b"><em>continues.</em></span>]} />
                <p>The collection ends here. The questions do not. AGI is a contested threshold, not a date carved in stone.</p>
                <Link className="btn btn-dark" href="/#debate"><span>Explore the great debate</span><ArrowUpRight size={16} /></Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={jump} />
    </>
  );
}

/**
 * The chapter index in the rail. Its progress bars are written straight to the
 * DOM on scroll, and only a change of chapter re-renders it, so scrolling never
 * re-renders the exhibits.
 */
function ChapterNav() {
  const [chapter, setChapter] = useState(0);
  const bars = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'));
    let raf = 0;
    const update = () => {
      raf = 0;
      const mark = innerHeight * 0.4;
      let current = 0;
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.top <= mark) current = i;
        const bar = bars.current[i];
        if (bar) bar.style.transform = `scaleY(${Math.min(1, Math.max(0, (mark - r.top) / r.height))})`;
      });
      setChapter(current);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, []);

  return (
    <nav>
      {eras.map((era, i) => (
        <a key={era.title} href={`#chapter-${i + 1}`} className={chapter === i ? 'current' : ''} aria-current={chapter === i ? 'location' : undefined}>
          <span className="serif rail-num">{era.numeral}</span>
          <span className="rail-text">{era.title}<small className="mono">{era.label}</small></span>
          <span className="rail-bar"><i ref={el => { bars.current[i] = el; }} style={{ transform: 'scaleY(0)' }} /></span>
        </a>
      ))}
    </nav>
  );
}

/** All six chapters and their exhibits: about 3,500 elements, rendered once. */
const Chapters = memo(function Chapters({ flash }: { flash: string | null }) {
  return eras.map((era, ci) => (
    <section key={era.title} id={`chapter-${ci + 1}`} className="tl-chapter" data-chapter aria-labelledby={`ch-${ci}`}>
      <header className="tl-chapter-head">
        <span className="tl-chapter-node serif" aria-hidden="true">{era.numeral}</span>
        <div>
          <p className="mono">CHAPTER {era.numeral} · {era.label} · {eraEvents(ci).length} EXHIBITS</p>
          <RevealLines as="h2" className="serif" lines={[<span id={`ch-${ci}`} key="t">{era.title}</span>]} />
          <p className="tl-chapter-desc serif"><em>{era.description}</em></p>
          <p className="tl-chapter-essay">{era.essay}</p>
        </div>
      </header>
      <ol className="tl-events">
        {eraEvents(ci).map(e => <TimelineEvent key={e.id} e={e} flash={flash === e.id} />)}
      </ol>
    </section>
  ));
});

const TimelineEvent = memo(function TimelineEvent({ e, flash }: { e: Event; flash: boolean }) {
  return (
    <motion.li id={e.id} className={`tl-event t-${e.track.toLowerCase()} ${flash ? 'flash' : ''}`}
      initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -8% 0px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
      <div className="tl-date">
        <time className="serif tl-year" dateTime={e.date}>{e.year}</time>
        {e.date.length > 4 && <span className="mono">{formatDate(e.date, true).toUpperCase()}</span>}
      </div>
      <span className="tl-node" aria-hidden="true" />
      <article className="tl-card" aria-labelledby={`${e.id}-t`}>
        <div className="tl-card-top mono">
          <span><i className="dot" />{e.track.toUpperCase()}</span>
          <span className="tl-status">{statusShort[e.status].toUpperCase()}</span>
          <span>NO. {accession(e)}</span>
        </div>
        <Sigil event={e} className="tl-sigil" />
        <h3 id={`${e.id}-t`} className="serif"><Link href={`/exhibit/${e.id}`}>{e.title}</Link></h3>
        <p className="tl-summary">{e.summary}</p>
        <div className="tl-why"><p className="mono">WHY IT MATTERS</p><p>{e.significance}</p></div>
        <p className="tl-people"><span className="mono">PEOPLE & INSTITUTIONS</span>{e.people}</p>
        <a className="tl-source" href={e.source} target="_blank" rel="noreferrer" data-cursor="Source"><span>{e.sourceName}</span><ArrowUpRight size={17} /></a>
      </article>
    </motion.li>
  );
});
