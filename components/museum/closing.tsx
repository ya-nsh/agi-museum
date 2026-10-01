'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { statuses } from '@/data/events';
import { events, statusNote, lastYear } from '@/lib/museum';
import { Eyebrow, Reveal, RevealLines } from './reveal';
import { Wordmark } from './header';
import { useMuseum } from './providers';

const TERMS = [
  ['AGI', 'Artificial general intelligence: broad capability across many domains. There is no universally accepted threshold or test.'],
  ['ASI', 'Artificial superintelligence: intelligence substantially beyond human capabilities in most domains.'],
  ['Alignment', 'The work of making AI systems pursue what their designers and users actually intend.'],
  ['Singularity', 'A hypothetical transformation driven by rapidly self-improving technology. A forecast, not an event.'],
  ['e/acc', 'Effective accelerationism: a 2022 movement arguing for rapid, largely unrestricted technological progress.'],
  ['FLOP', 'A floating-point operation, the unit used to count the arithmetic spent training a model.'],
];

export function ReadingRoom() {
  return (
    <section id="guide" className="reading shell" aria-labelledby="reading-title">
      <div className="section-head">
        <div>
          <Eyebrow index="07">THE READING ROOM</Eyebrow>
          <RevealLines id="reading-title" className="section-title serif" lines={[<span key="a">Read the</span>, <span key="b"><em>labels.</em></span>]} />
        </div>
        <p className="section-lede">A benchmark is not a verdict and a forecast is not a fact. Every exhibit carries one of four evidence labels, so you always know what kind of claim you are looking at.</p>
      </div>
      <div className="labels-grid">
        {statuses.map((s, i) => (
          <Reveal key={s} className="label-card" delay={i * 0.08}>
            <span className="mono">{String(events.filter(e => e.status === s).length).padStart(2, '0')} EXHIBITS</span>
            <h3 className="serif">{s}</h3>
            <p>{statusNote[s]}</p>
          </Reveal>
        ))}
      </div>
      <dl className="glossary">
        {TERMS.map(([t, d], i) => (
          <Reveal key={t} className="term" delay={i * 0.05}>
            <dt className="serif">{t}</dt><dd>{d}</dd>
          </Reveal>
        ))}
      </dl>
      <Reveal className="curators-note">
        <span className="mono">CURATORS’ NOTE</span>
        <p>This is a selected collection, not a claim to contain every event in AI history. Approximate dates describe periods; exact dates identify documented events. AGI-era rhetoric is presented as claims, not consensus. Live source pages may change after the collection’s cutoff.</p>
      </Reveal>
    </section>
  );
}

export function Closing() {
  return (
    <section className="closing shell" aria-labelledby="closing-title">
      <p className="mono closing-kicker">THE NEXT EXHIBIT HASN’T HAPPENED YET</p>
      <RevealLines as="h2" id="closing-title" className="closing-title serif" lines={[<span key="a">History is not</span>, <span key="b">a <em>straight line</em><motion.span className="caret" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }} /></span>]} />
      <p className="closing-lede">The collection ends on 9 September {lastYear}. The questions do not.</p>
      <div className="closing-ctas">
        <Link className="btn btn-primary" href="/timeline"><span>Follow the whole thread</span><ArrowUpRight size={16} /></Link>
        <a className="btn btn-ghost" href="https://github.com/ya-nsh/agi-museum" target="_blank" rel="noreferrer"><span>Suggest an exhibit</span><ArrowUpRight size={16} /></a>
      </div>
    </section>
  );
}

export function Footer() {
  const letters = 'AGI MUSEUM'.split('');
  const { scrollTo } = useMuseum();
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand"><Wordmark /><p>An interactive, source-backed museum of the path toward artificial general intelligence. Curated through 9 September {lastYear}.</p></div>
        <nav aria-label="Footer">
          <span className="mono">VISIT</span>
          <Link href="/#galleries">Galleries</Link><Link href="/#collection">Collection</Link><Link href="/timeline">Complete timeline</Link><Link href="/workshop">The workshop</Link><Link href="/#debate">The great debate</Link><Link href="/stand">Where do you stand?</Link>
        </nav>
        <div>
          <span className="mono">COLOPHON</span>
          <p>{events.length} exhibits, each linked to its original source. Compute data from Epoch AI. Portrait of Alan Turing: Turing Digital Archive / Wikimedia Commons, public domain. Gallery artwork generated for this museum.</p>
        </div>
        <div>
          <span className="mono">SOURCE</span>
          <a href="https://github.com/ya-nsh/agi-museum" target="_blank" rel="noreferrer">github.com/ya-nsh/agi-museum <ArrowUpRight size={13} /></a>
          <button className="to-top mono" onClick={() => scrollTo(0, 0)}>BACK TO TOP <ArrowUp size={13} /></button>
        </div>
      </div>
      <div className="footer-giant serif" aria-hidden="true">
        {letters.map((l, i) => (
          <motion.span key={i} initial={{ y: '100%' }} whileInView={{ y: '0%' }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}>{l === ' ' ? ' ' : l}</motion.span>
        ))}
      </div>
    </footer>
  );
}
