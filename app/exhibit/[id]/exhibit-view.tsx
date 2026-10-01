'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { accession, eraOf, eras, events, formatDate, neighbours, related, statusNote, statusShort, type Event } from '@/lib/museum';
import { Header } from '@/components/museum/header';
import { CommandPalette } from '@/components/museum/command-palette';
import { Footer } from '@/components/museum/closing';
import { ExhibitCard } from '@/components/museum/collection';
import { TURING_CREDIT } from '@/components/museum/exhibit-dialog';
import { Reveal, RevealLines } from '@/components/museum/reveal';
import { Sigil } from '@/components/museum/sigil';
import { SpecimenPanel } from '@/components/museum/workshop/specimen';
import { specimensFor } from '@/data/workshop';
import { pairs, pairsFor } from '@/data/pairs';
import { passport } from '@/lib/passport';
import { Credits } from '@/components/museum/people/credits';
import { Diptych } from '@/components/museum/pairs/diptych';

export default function ExhibitView({ id }: { id: string }) {
  const e = events.find(x => x.id === id)!;
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  const [copied, setCopied] = useState(false);
  const { prev, next, index } = neighbours(e);
  const era = eras[eraOf(e)];
  const go = (x: Event) => router.push(`/exhibit/${x.id}`);
  const hands = specimensFor(e.id);
  const pendants = pairsFor(e.id);
  useEffect(() => { passport.seeExhibit(e.id); }, [e.id]);

  useEffect(() => {
    const onKey = (k: KeyboardEvent) => {
      if ((k.target as HTMLElement)?.closest?.('input,textarea,[role=dialog]')) return;
      if (k.key === 'ArrowLeft' && prev) go(prev);
      if (k.key === 'ArrowRight' && next) go(next);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard unavailable */ }
  };

  return (
    <>
      <Header onSearch={() => setPalette(true)} />
      <main className={`xp t-${e.track.toLowerCase()}`}>
        <section className="xp-hero shell">
          <nav className="xp-crumbs mono" aria-label="Breadcrumb">
            <Link href="/">MUSEUM</Link><span>/</span><Link href={`/#galleries`}>GALLERY {era.numeral}</Link><span>/</span><span aria-current="page">NO. {accession(e)}</span>
          </nav>
          <div className="xp-grid">
            <motion.div className="xp-plate" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
              {e.id === 'exhibit-01' && <img className="plate-photo" src="/alan-turing.jpg" alt="Alan Turing as a student, circa 1928–1929" width={675} height={919} />}
              <div className="plate-top mono"><span>NO. {accession(e)}</span><span>{String(index + 1).padStart(2, '0')} OF {events.length}</span></div>
              <Sigil event={e} draw className="xp-sigil" />
              <div className="xp-year serif">{e.year}</div>
            </motion.div>
            <div className="xp-copy">
              <motion.p className="mono xp-date" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <i className="dot" />{formatDate(e.date).toUpperCase()} · {e.track.toUpperCase()}
              </motion.p>
              <RevealLines as="h1" className="xp-title serif" play delay={0.2} lines={[<span key="t">{e.title}</span>]} />
              <motion.p className="xp-summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9 }}>{e.summary}</motion.p>
              <motion.div className="xp-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.9 }}>
                <a className="btn btn-primary" href={e.source} target="_blank" rel="noreferrer"><span>Read the source</span><ArrowUpRight size={16} /></a>
                <button className="btn btn-ghost" onClick={copy}><span>{copied ? 'Link copied' : 'Copy link'}</span>{copied ? <Check size={16} /> : <Link2 size={16} />}</button>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="xp-body shell">
          <Reveal className="xp-block xp-why">
            <p className="mono">WHY IT BELONGS HERE</p>
            <p className="serif">{e.significance}</p>
          </Reveal>
          <div className="xp-facts">
            <Reveal className="xp-fact" delay={0.05}><p className="mono">PEOPLE & INSTITUTIONS</p><p><Credits event={e} /></p></Reveal>
            <Reveal className="xp-fact" delay={0.1}><p className="mono">EVIDENCE</p><p><span className="status-chip">{statusShort[e.status]}</span></p><p className="xp-note">{statusNote[e.status]}</p></Reveal>
            <Reveal className="xp-fact" delay={0.15}><p className="mono">GALLERY</p><p>{era.numeral}. {era.title}</p><p className="xp-note">{era.label} · {era.description}</p></Reveal>
            <Reveal className="xp-fact" delay={0.2}><p className="mono">ORIGINAL SOURCE</p><a href={e.source} target="_blank" rel="noreferrer">{e.sourceName} <ArrowUpRight size={14} /></a><p className="xp-note">{new URL(e.source).hostname.replace('www.', '')}</p></Reveal>
          </div>
          {e.id === 'exhibit-01' && <p className="credit">Archival portrait: Alan Turing, c. 1928–1929. Turing Digital Archive / <a href={TURING_CREDIT} target="_blank" rel="noreferrer">Wikimedia Commons</a>. Public domain; the photograph predates the 1950 paper.</p>}
        </section>

        {hands.length > 0 && (
          <div id="hands-on" className="xp-hands shell">
            <p className="mono xp-hands-label">HANDS-ON · {hands.length === 1 ? 'TRY IT YOURSELF' : `${hands.length} SPECIMENS FOR THIS EXHIBIT`}</p>
            {hands.map(h => <SpecimenPanel key={h.specimen.slug} specimen={h.specimen} preset={h.preset} exhibitLink={h.specimen.exhibit !== e.id} />)}
          </div>
        )}

        {pendants.length > 0 && (
          <div className="xp-pendants shell">
            <p className="mono xp-hands-label">HUNG AS A PAIR · <Link href="/pairs">ALL PENDANTS</Link></p>
            {pendants.map(p => <Diptych key={p.id} pair={p} index={pairs.indexOf(p)} />)}
          </div>
        )}

        <section className="xp-related shell" aria-labelledby="related-title">
          <p className="mono" id="related-title">ALSO ON THE {e.track.toUpperCase()} THREAD</p>
          <ul className="exhibits grid">
            {related(e).map(r => <li key={r.id}><ExhibitCard e={r} onOpen={go} /></li>)}
          </ul>
        </section>

        <nav className="xp-pager" aria-label="Chronological navigation">
          {prev ? <Link href={`/exhibit/${prev.id}`} className="xp-page prev"><span className="mono"><ArrowLeft size={14} /> PREVIOUS · {prev.year}</span><span className="serif">{prev.title}</span></Link> : <span />}
          {next ? <Link href={`/exhibit/${next.id}`} className="xp-page next"><span className="mono">NEXT · {next.year} <ArrowRight size={14} /></span><span className="serif">{next.title}</span></Link> : <Link href="/timeline" className="xp-page next"><span className="mono">THE END OF THE COLLECTION <ArrowRight size={14} /></span><span className="serif">Walk the whole timeline</span></Link>}
        </nav>
      </main>
      <Footer />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={go} />
    </>
  );
}
