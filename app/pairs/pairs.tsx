'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { pairs } from '@/data/pairs';
import { Header } from '@/components/museum/header';
import { CommandPalette } from '@/components/museum/command-palette';
import { Footer } from '@/components/museum/closing';
import { RevealLines } from '@/components/museum/reveal';
import { Diptych } from '@/components/museum/pairs/diptych';
import { passport } from '@/lib/passport';
import type { Event } from '@/lib/museum';

export default function Pairs() {
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  useEffect(() => { passport.mark('pairs'); }, []);
  return (
    <>
      <Header onSearch={() => setPalette(true)} />
      <main className="pairs">
        <section className="pp-hero shell" aria-labelledby="pairs-title">
          <p className="mono pp-kicker">PENDANTS · {pairs.length} PAIRS</p>
          <RevealLines as="h1" id="pairs-title" className="pp-title serif" play lines={[<span key="a">History</span>, <span key="b"><em>rhymes.</em></span>]} />
          <p className="pp-lede">In a gallery, a pendant is a painting made to hang beside another. These are exhibits from different decades hung side by side, because together they say something neither says alone: what changed, and what stubbornly did not.</p>
          <nav className="dp-index" aria-label="Pairs">
            {pairs.map((p, i) => <a key={p.id} href={`#${p.id}`}><span className="mono">{String(i + 1).padStart(2, '0')}</span>{p.title}</a>)}
          </nav>
        </section>
        <div className="shell dp-list">
          {pairs.map((p, i) => <Diptych key={p.id} pair={p} index={i} />)}
        </div>
        <section className="ws-outro shell">
          <p className="mono">A CURATORIAL NOTE</p>
          <h2 className="serif">These pairings are <em>interpretations.</em></h2>
          <p className="pp-fine">Each note draws only on what the two exhibits record. Follow either exhibit to its original source and judge the rhyme for yourself.</p>
          <div className="closing-ctas">
            <Link className="btn btn-ghost" href="/time-machine"><span>Try the time machine</span><ArrowUpRight size={16} /></Link>
          </div>
        </section>
      </main>
      <Footer />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={(e: Event) => router.push(`/exhibit/${e.id}`)} />
    </>
  );
}
