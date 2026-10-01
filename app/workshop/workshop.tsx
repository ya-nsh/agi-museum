'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { specimens } from '@/data/workshop';
import { Header } from '@/components/museum/header';
import { CommandPalette } from '@/components/museum/command-palette';
import { Footer } from '@/components/museum/closing';
import { Reveal, RevealLines } from '@/components/museum/reveal';
import { SpecimenArt, SpecimenPanel, exhibitOf, specimenNumber } from '@/components/museum/workshop/specimen';
import type { Event } from '@/lib/museum';

export default function Workshop() {
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  return (
    <>
      <Header onSearch={() => setPalette(true)} current="Workshop" />
      <main className="workshop">
        <section className="ws-hero shell" aria-labelledby="workshop-title">
          <p className="mono ws-hero-kicker"><span className="live-dot" /> THE WORKSHOP · {specimens.length} HANDS-ON SPECIMENS</p>
          <RevealLines as="h1" id="workshop-title" className="ws-hero-title serif" play lines={[<span key="a">Please</span>, <span key="b"><em>touch.</em></span>]} />
          <div className="ws-hero-foot">
            <p className="ws-hero-lede">Most museums keep the machines behind glass. These are small working reconstructions of ideas from the collection, from a 1943 logical neuron to the preference learning behind modern chat models. Each one runs entirely in your browser and says plainly what it simplifies.</p>
            <a className="btn btn-ghost" href="#specimens"><span>Start at the beginning</span><ArrowDown size={16} /></a>
          </div>
          <ol className="ws-index" id="specimens">
            {specimens.map((s, i) => {
              const e = exhibitOf(s);
              return (
                <Reveal as="li" key={s.slug} delay={i * 0.05} className={`t-${e.track.toLowerCase()}`}>
                  <a href={`#${s.slug}`}>
                    <SpecimenArt slug={s.slug} />
                    <span className="mono">{specimenNumber(s)} · {e.year}</span>
                    <span className="serif">{s.title}</span>
                  </a>
                </Reveal>
              );
            })}
          </ol>
        </section>
        <div className="shell ws-list">
          {specimens.map(s => <SpecimenPanel key={s.slug} specimen={s} />)}
        </div>
        <section className="ws-outro shell">
          <p className="mono">NEXT DOOR</p>
          <h2 className="serif">You have touched the machines. <em>Where do you stand on them?</em></h2>
          <div className="closing-ctas">
            <Link className="btn btn-primary" href="/stand"><span>Find your place on the map</span><ArrowUpRight size={16} /></Link>
            <Link className="btn btn-ghost" href="/timeline"><span>Walk the whole timeline</span><ArrowUpRight size={16} /></Link>
          </div>
        </section>
      </main>
      <Footer />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={(e: Event) => router.push(`/exhibit/${e.id}`)} />
    </>
  );
}
