import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { collaborators, entityBySlug } from '@/data/people';
import { PassportVisit, SiteChrome } from '@/components/museum/site-chrome';
import { Footer } from '@/components/museum/closing';
import { ExhibitCardLink } from '@/components/museum/collection';
import { RevealLines } from '@/components/museum/reveal';
import { Lifelines } from '@/components/museum/people/lifelines';
import { eras, eraOf } from '@/lib/museum';

/** A person's or institution's page. A server component; only the chrome, lifelines and cards hydrate. */
export default function PersonView({ slug }: { slug: string }) {
  const ent = entityBySlug(slug)!;
  const others = collaborators(ent);
  const first = ent.exhibits[0], last = ent.exhibits[ent.exhibits.length - 1];
  const galleries = [...new Set(ent.exhibits.map(e => eras[eraOf(e)].numeral))];
  const tracks = [...new Set(ent.exhibits.map(e => e.track))];
  const n = ent.exhibits.length;

  return (
    <>
      <PassportVisit mark="people" />
      <SiteChrome />
      <main className="person">
        <section className="pr-hero shell">
          <nav className="xp-crumbs mono" aria-label="Breadcrumb">
            <Link href="/">MUSEUM</Link><span>/</span><Link href="/people">WHO’S WHO</Link><span>/</span><span aria-current="page">{ent.name.toUpperCase()}</span>
          </nav>
          <p className="mono pr-kind">{ent.kind === 'person' ? 'PERSON' : 'INSTITUTION'} · {n} EXHIBIT{n === 1 ? '' : 'S'}</p>
          <RevealLines as="h1" className="pr-title serif" play lines={[<span key="n">{ent.name}</span>]} />
          {ent.note && <p className="pr-note">{ent.note}</p>}
          <dl className="pr-facts">
            <div><dt className="mono">FIRST APPEARS</dt><dd className="serif">{first.year}</dd><dd><Link href={`/exhibit/${first.id}`}>{first.title}</Link></dd></div>
            {n > 1 && <div><dt className="mono">LAST APPEARS</dt><dd className="serif">{last.year}</dd><dd><Link href={`/exhibit/${last.id}`}>{last.title}</Link></dd></div>}
            <div><dt className="mono">GALLERIES</dt><dd className="serif">{galleries.join(' · ')}</dd><dd>{tracks.join(', ')}</dd></div>
          </dl>
          {n > 1 && <div className="pr-life"><Lifelines rows={[ent]} highlight={ent.slug} /></div>}
        </section>

        <section className="pr-exhibits shell" aria-labelledby="pr-ex-title">
          <p id="pr-ex-title" className="mono pr-label">{n === 1 ? 'THE EXHIBIT' : `THE ${n} EXHIBITS, OLDEST FIRST`}</p>
          <ul className="exhibits grid">
            {ent.exhibits.map(e => <li key={e.id}><ExhibitCardLink e={e} /></li>)}
          </ul>
        </section>

        {others.length > 0 && (
          <section className="pr-others shell" aria-labelledby="pr-others-title">
            <p id="pr-others-title" className="mono pr-label">CREDITED ALONGSIDE</p>
            <ul className="pr-chips">
              {others.map(({ entity, shared }) => (
                <li key={entity.slug}>
                  <Link href={`/people/${entity.slug}`} className={`pr-chip ${entity.kind}`}>
                    <span>{entity.name}</span>
                    {shared > 1 && <span className="mono">×{shared}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="pr-foot shell">
          <Link className="btn btn-ghost" href="/people"><ArrowLeft size={16} /><span>Everyone in the collection</span></Link>
          <Link className="btn btn-line" href="/timeline"><span>Walk the whole timeline</span><ArrowUpRight size={16} /></Link>
        </nav>
      </main>
      <Footer />
    </>
  );
}
