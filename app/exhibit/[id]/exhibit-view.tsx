import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { accession, eraOf, eras, events, formatDate, neighbours, related, statusNote, statusShort } from '@/lib/museum';
import { ArrowNav, CopyLink, PassportVisit, SiteChrome } from '@/components/museum/site-chrome';
import { Footer } from '@/components/museum/closing';
import { ExhibitCardLink } from '@/components/museum/collection';
import { Art, TURING_CREDIT } from '@/components/museum/art';
import { Reveal, RevealLines } from '@/components/museum/reveal';
import { Sigil } from '@/components/museum/sigil';
import { SpecimenPanel } from '@/components/museum/workshop/specimen';
import { specimensFor } from '@/data/workshop';
import { pairs, pairsFor } from '@/data/pairs';
import { Credits } from '@/components/museum/people/credits';
import { Diptych } from '@/components/museum/pairs/diptych';

/**
 * An exhibit's own page. A server component: the copy is rendered once into the
 * static HTML, and only the interactive pieces (header, search, passport, copy
 * button, specimens, cards) hydrate.
 */
export default function ExhibitView({ id }: { id: string }) {
  const e = events.find(x => x.id === id)!;
  const { prev, next, index } = neighbours(e);
  const era = eras[eraOf(e)];
  const hands = specimensFor(e.id);
  const pendants = pairsFor(e.id);
  const enter = (d: number, y?: string) => ({ '--d': `${d}s`, ...(y ? { '--enter-y': y } : {}) }) as React.CSSProperties;

  return (
    <>
      <PassportVisit exhibit={e.id} />
      <ArrowNav prev={prev ? `/exhibit/${prev.id}` : undefined} next={next ? `/exhibit/${next.id}` : undefined} />
      <SiteChrome />
      <main className={`xp t-${e.track.toLowerCase()}`}>
        <section className="xp-hero shell">
          <nav className="xp-crumbs mono" aria-label="Breadcrumb">
            <Link href="/">MUSEUM</Link><span>/</span><Link href={`/#galleries`}>GALLERY {era.numeral}</Link><span>/</span><span aria-current="page">NO. {accession(e)}</span>
          </nav>
          <div className="xp-grid">
            <div className="xp-plate enter-scale">
              {e.id === 'exhibit-01' && <Art name="turing" className="plate-photo" priority alt="Alan Turing as a student, circa 1928–1929" sizes="(min-width: 900px) 40vw, 100vw" />}
              <div className="plate-top mono"><span>NO. {accession(e)}</span><span>{String(index + 1).padStart(2, '0')} OF {events.length}</span></div>
              <Sigil event={e} draw className="xp-sigil" />
              <div className="xp-year serif">{e.year}</div>
            </div>
            <div className="xp-copy">
              <p className="mono xp-date enter" style={enter(0.2, '0px')}>
                <i className="dot" />{formatDate(e.date).toUpperCase()} · {e.track.toUpperCase()}
              </p>
              <RevealLines as="h1" className="xp-title serif" play delay={0.2} lines={[<span key="t">{e.title}</span>]} />
              <p className="xp-summary">{e.summary}</p>
              <div className="xp-actions enter" style={enter(0.55, '20px')}>
                <a className="btn btn-primary" href={e.source} target="_blank" rel="noreferrer"><span>Read the source</span><ArrowUpRight size={16} /></a>
                <CopyLink />
              </div>
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
            {related(e).map(r => <li key={r.id}><ExhibitCardLink e={r} /></li>)}
          </ul>
        </section>

        <nav className="xp-pager" aria-label="Chronological navigation">
          {prev ? <Link href={`/exhibit/${prev.id}`} className="xp-page prev"><span className="mono"><ArrowLeft size={14} /> PREVIOUS · {prev.year}</span><span className="serif">{prev.title}</span></Link> : <span />}
          {next ? <Link href={`/exhibit/${next.id}`} className="xp-page next"><span className="mono">NEXT · {next.year} <ArrowRight size={14} /></span><span className="serif">{next.title}</span></Link> : <Link href="/timeline" className="xp-page next"><span className="mono">THE END OF THE COLLECTION <ArrowRight size={14} /></span><span className="serif">Walk the whole timeline</span></Link>}
        </nav>
      </main>
      <Footer />
    </>
  );
}
