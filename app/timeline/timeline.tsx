'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowUpRight, ChevronDown, Pause, Play } from 'lucide-react';
import { events, eras } from '@/data/events';

export default function Timeline() {
  const [chapter, setChapter] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0);
  const page = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
    const changed = () => setReduced(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-timeline-chapter]'));
      let current = 0;
      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].getBoundingClientRect().top <= 180) current = i;
      }
      setChapter(current);
      const start = document.getElementById('chronology')?.offsetTop ?? 0;
      const length = Math.max(1, document.documentElement.scrollHeight - window.innerHeight - start);
      setProgress(Math.max(0, Math.min(100, ((window.scrollY - start) / length) * 100)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -25px 0px', threshold: 0.05 });
    page.current?.querySelectorAll('.timeline-event').forEach(el => observer.observe(el));
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <div className={`museum timeline-museum ${reduced ? 'still' : ''}`} ref={page} id="timeline-top">
      <a className="skip" href="#chronology">Skip to the complete timeline</a>
      <div className="reading-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <header>
        <Link className="brand" href="/" aria-label="AGI Museum home"><span className="brandmark">a<span>i</span></span><span>AGI<br />MUSEUM</span></Link>
        <nav aria-label="Main navigation"><Link href="/"><ArrowLeft size={15} /> Back to the museum</Link><a href="#chronology">The full timeline</a></nav>
        <button className="motion-control" onClick={() => setReduced(v => !v)} aria-pressed={reduced}>{reduced ? <Play size={14} /> : <Pause size={14} />} {reduced ? 'Motion off' : 'Motion on'}</button>
      </header>

      <main>
        <section className="timeline-hero" aria-labelledby="timeline-heading">
          <img className="timeline-art" src="/intelligence-gallery.png" alt="Conceptual museum installation: a luminous filament connects early computing artifacts to a crystalline sculpture of intelligence" width={1536} height={1024} fetchPriority="high" />
          <div className="timeline-hero-copy">
            <span className="eyebrow">THE COMPLETE COLLECTION / 1950 — 2026</span>
            <h1 id="timeline-heading">Follow the<br /><em>thread.</em></h1>
            <p>Every breakthrough. Every turning point.<br />One continuous journey through the collection.</p>
            <a className="timeline-begin" href="#chronology">Begin in 1950 <ChevronDown size={18} /></a>
          </div>
          <span className="art-caption">A CONTEMPORARY INTERPRETATION · AI-GENERATED ARTWORK</span>
        </section>

        <div className="timeline-overview"><span>{events.length} SOURCED EXHIBITS</span><span>5 CHAPTERS</span><span>CURATED THROUGH 09 SEPTEMBER 2026</span></div>
        <div className="chronology-layout" id="chronology">
          <aside className="chapter-guide" aria-label="Timeline chapters">
            <p className="eyebrow">ON THIS JOURNEY</p>
            <nav aria-label="Jump to a chapter">
              {eras.map((era, i) => <a key={era.title} href={`#chapter-${i + 1}`} className={chapter === i ? 'current' : ''} aria-current={chapter === i ? 'location' : undefined}><span className="chapter-num">0{i + 1}</span><span>{era.title}<small>{era.label}</small></span><ArrowUpRight size={14} /></a>)}
            </nav>
            <div className="timeline-key"><p className="eyebrow">FOUR THREADS</p>{['Technology', 'Ideas', 'Institutions', 'Governance'].map(t => <span key={t}><i className={`dot ${t.toLowerCase()}`} />{t}</span>)}</div>
            <p className="guide-note">History, research, forecasts and company claims each carry their own label.</p>
            <Link className="return-gallery" href="/">Explore the galleries <ArrowUpRight size={15} /></Link>
          </aside>

          <div className="chronology-column">
            {eras.map((era, index) => (
              <section className="timeline-chapter" key={era.title} id={`chapter-${index + 1}`} data-timeline-chapter aria-labelledby={`chapter-title-${index}`}>
                <div className="chapter-heading"><span className="chapter-disc">0{index + 1}</span><div><span className="eyebrow">{era.label}</span><h2 id={`chapter-title-${index}`}>{era.title}</h2><p>{era.description}</p></div></div>
                <ol className="timeline-events" aria-label={`${era.title} exhibits`}>
                  {events.filter(e => e.year >= era.start && e.year <= era.end).map(event => (
                    <li className={`timeline-event ${event.track.toLowerCase()}`} key={event.id} id={event.id}>
                      <span className="timeline-node" aria-hidden="true" />
                      <div className="timeline-date"><time dateTime={event.date}>{event.date}</time><span>{event.id.replace('exhibit-', 'NO. ')}</span></div>
                      <article className="timeline-entry" aria-labelledby={`${event.id}-title`}>
                        <div className="entry-labels"><span><i className={`dot ${event.track.toLowerCase()}`} /> {event.track}</span><span className="evidence-label">{event.status}</span></div>
                        <h3 id={`${event.id}-title`}><a href={`#${event.id}`}>{event.title}</a></h3>
                        <p className="entry-summary">{event.summary}</p>
                        <div className="entry-context"><span className="eyebrow">WHY IT MATTERS</span><p>{event.significance}</p></div>
                        <div className="entry-people"><span className="eyebrow">PEOPLE & INSTITUTIONS</span><p>{event.people}</p></div>
                        <a className="entry-source" href={event.source} target="_blank" rel="noreferrer"><span>{event.sourceName}</span><ArrowUpRight size={18} /></a>
                      </article>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            <div className="timeline-end"><span className="end-node" /><span className="eyebrow">09 SEPTEMBER 2026 / COLLECTION CUTOFF</span><h2>The thread<br /><em>continues.</em></h2><p>The collection ends here. The questions do not.<br />AGI is a contested threshold, not a date carved in stone.</p><Link href="/#debate">Explore the great debate <ArrowUpRight size={18} /></Link></div>
          </div>
        </div>
      </main>
      <footer><Link className="footer-brand" href="/">AGI MUSEUM <ArrowUpRight size={16} /></Link><span>EVERY EXHIBIT, IN CHRONOLOGICAL ORDER</span><a href="#timeline-top">Back to top <ArrowUp size={14} /></a></footer>
    </div>
  );
}
