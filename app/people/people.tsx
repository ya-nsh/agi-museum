'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { entities, sortKey, type EntityKind } from '@/data/people';
import { Header } from '@/components/museum/header';
import { CommandPalette } from '@/components/museum/command-palette';
import { Footer } from '@/components/museum/closing';
import { Eyebrow, RevealLines } from '@/components/museum/reveal';
import { Lifelines } from '@/components/museum/people/lifelines';
import { passport } from '@/lib/passport';
import type { Event } from '@/lib/museum';

type Filter = 'all' | EntityKind;
const people = entities.filter(e => e.kind === 'person');
const institutions = entities.filter(e => e.kind === 'institution');
const recurring = entities.filter(e => e.exhibits.length > 1);
const byFirstAppearance = (a: typeof entities[number], b: typeof entities[number]) =>
  a.exhibits[0].date.localeCompare(b.exhibits[0].date) || b.exhibits.length - a.exhibits.length;

export default function People() {
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  const [lens, setLens] = useState<Filter>('person');
  const [q, setQ] = useState('');
  useEffect(() => { passport.mark('people'); }, []);

  const rows = useMemo(() => recurring.filter(e => lens === 'all' || e.kind === lens).sort(byFirstAppearance), [lens]);
  const index = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = entities.filter(e => (lens === 'all' || e.kind === lens) && (!term || e.name.toLowerCase().includes(term)))
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    const groups = new Map<string, typeof list>();
    for (const e of list) {
      const letter = sortKey(e)[0].toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : '#';
      groups.set(key, [...(groups.get(key) ?? []), e]);
    }
    return [...groups.entries()];
  }, [lens, q]);

  const lenses: { id: Filter; label: string; n: number }[] = [
    { id: 'person', label: 'People', n: people.length },
    { id: 'institution', label: 'Institutions', n: institutions.length },
    { id: 'all', label: 'Everyone', n: entities.length },
  ];

  return (
    <>
      <Header onSearch={() => setPalette(true)} />
      <main className="people">
        <section className="pp-hero shell" aria-labelledby="pp-title">
          <p className="mono pp-kicker">THE PEOPLE · {people.length} PEOPLE AND {institutions.length} INSTITUTIONS</p>
          <RevealLines as="h1" id="pp-title" className="pp-title serif" play lines={[<span key="a">Who’s</span>, <span key="b"><em>who.</em></span>]} />
          <p className="pp-lede">Everyone credited on an exhibit, gathered in one place. Some names appear once, at a single turning point. Others return again and again across decades. Follow a name to see every exhibit it belongs to, and who else was in the room.</p>
          <div className="ws-seg pp-lens" role="radiogroup" aria-label="Show">
            {lenses.map(l => <button key={l.id} role="radio" aria-checked={lens === l.id} className={lens === l.id ? 'on' : ''} onClick={() => setLens(l.id)}>{l.label}<span className="mono">{l.n}</span></button>)}
          </div>
        </section>

        <section className="pp-lives shell" aria-labelledby="lives-title">
          <div className="section-head">
            <div>
              <Eyebrow>RECURRING NAMES</Eyebrow>
              <RevealLines id="lives-title" className="section-title serif" lines={[<span key="a">Lives in</span>, <span key="b"><em>the collection.</em></span>]} />
            </div>
            <p className="section-lede">Each line runs from a name’s first appearance to its last, with a dot for every exhibit. The axis gives the crowded years after 2010 more room.</p>
          </div>
          <Lifelines rows={rows} />
        </section>

        <section className="pp-index shell" aria-labelledby="index-title">
          <div className="pp-index-head">
            <h2 id="index-title" className="serif">The index</h2>
            <label className="pp-search">
              <Search size={15} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a name" aria-label="Find a name" />
            </label>
          </div>
          {index.length === 0 && <p className="pp-none">No one matches “{q}”.</p>}
          <div className="pp-letters">
            {index.map(([letter, list]) => (
              <section key={letter} className="pp-letter" aria-label={letter}>
                <h3 className="serif">{letter}</h3>
                <ul>
                  {list.map(e => (
                    <li key={e.slug}>
                      <Link href={`/people/${e.slug}`}>
                        <span>{e.name}</span>
                        <span className="mono">{e.kind === 'institution' ? 'INST · ' : ''}{e.exhibits.length}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={(e: Event) => router.push(`/exhibit/${e.id}`)} />
    </>
  );
}
