'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { specimens } from '@/data/workshop';
import { Eyebrow, Reveal, RevealLines } from '../reveal';
import { SpecimenArt, exhibitOf, specimenNumber } from './specimen';

/** The home page's door into the workshop: one tile per hands-on specimen. */
export function WorkshopTeaser() {
  return (
    <section id="workshop" className="ws-teaser shell" aria-labelledby="workshop-teaser-title">
      <div className="section-head">
        <div>
          <Eyebrow index="05">THE WORKSHOP</Eyebrow>
          <RevealLines id="workshop-teaser-title" className="section-title serif" lines={[<span key="a">Please</span>, <span key="b"><em>touch.</em></span>]} />
        </div>
        <p className="section-lede">Some exhibits are more than labels. Wire a 1943 neuron, train a perceptron until it fails, talk to ELIZA, sit in the Chinese Room and teach a machine your taste. Each one is a small, honest reconstruction that runs in your browser.</p>
      </div>
      <ul className="ws-tiles">
        {specimens.map((s, i) => {
          const e = exhibitOf(s);
          return (
            <Reveal as="li" key={s.slug} delay={(i % 3) * 0.06} className={`t-${e.track.toLowerCase()}`}>
              <Link href={`/workshop#${s.slug}`} className="ws-tile" data-cursor="Try">
                <span className="ws-tile-top mono"><span>SPECIMEN {specimenNumber(s)}</span><span>{e.year}</span></span>
                <SpecimenArt slug={s.slug} />
                <span className="ws-tile-title serif">{s.title}</span>
                <span className="ws-tile-foot mono">{s.verb.toUpperCase()} <ArrowUpRight size={14} /></span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
      <div className="ws-teaser-foot">
        <Link className="btn btn-line" href="/workshop"><span>Enter the workshop</span><ArrowUpRight size={16} /></Link>
      </div>
    </section>
  );
}
