'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useRef } from 'react';
import { eras, events, firstYear, lastYear, sourceCount } from '@/lib/museum';
import { NeuralField } from './neural-field';
import { CountUp, RevealLines } from './reveal';
import { useMuseum } from './providers';

export function Hero() {
  const { introDone } = useMuseum();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const copyO = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const up = (d: number) => ({ initial: { opacity: 0, y: 24 }, animate: introDone ? { opacity: 1, y: 0 } : undefined, transition: { duration: 1, delay: d, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <NeuralField play={introDone} scroll={scrollYProgress} />
      <div className="hero-vignette" aria-hidden="true" />
      <motion.div className="hero-copy shell" style={{ y: copyY, opacity: copyO }}>
        <motion.p className="hero-kicker mono" {...up(0.1)}><span className="live-dot" /> A HISTORY STILL BEING WRITTEN · EST. {firstYear}</motion.p>
        <RevealLines as="h1" id="hero-title" className="hero-title serif" play={introDone} delay={0.2} stagger={0.12}
          lines={[<span key="a">The making</span>, <span key="b">of <em>intelligence.</em></span>]} />
        <motion.p className="hero-lede" {...up(0.65)}>
          From a question on paper to a world at a threshold: the breakthroughs, the believers and the battles on the road to artificial general intelligence, every one traced to its source.
        </motion.p>
        <motion.div className="hero-ctas" {...up(0.8)}>
          <a className="btn btn-primary" href="#collection" data-cursor="Enter"><span>Enter the collection</span><ArrowDown size={16} /></a>
          <Link className="btn btn-ghost" href="/timeline"><span>Walk the full timeline</span><ArrowUpRight size={16} /></Link>
        </motion.div>
      </motion.div>
      <motion.dl className="hero-stats shell" {...up(1)}>
        <div><dt className="mono">Exhibits</dt><dd className="serif"><CountUp to={events.length} play={introDone} /></dd></div>
        <div><dt className="mono">Years</dt><dd className="serif"><CountUp to={lastYear - firstYear} play={introDone} /></dd></div>
        <div><dt className="mono">Galleries</dt><dd className="serif"><CountUp to={eras.length} pad={2} play={introDone} /></dd></div>
        <div><dt className="mono">Primary sources</dt><dd className="serif"><CountUp to={sourceCount} play={introDone} /></dd></div>
        <div className="fig-caption mono">FIG. 01 — AN 80-COLUMN PUNCH CARD FOLDS INTO A NEURAL SPHERE. MOVE YOUR CURSOR THROUGH IT.</div>
      </motion.dl>
      <motion.div className="scroll-cue mono" initial={{ opacity: 0 }} animate={introDone ? { opacity: 1 } : undefined} transition={{ delay: 1.6 }} aria-hidden="true">
        <span>SCROLL</span><i />
      </motion.div>
    </section>
  );
}

/** A paragraph whose words light up as it moves through the viewport. */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const text = `In 1943, two scientists described a neuron as a piece of logic. Seven years later, Alan Turing asked whether machines could think. This museum follows everything that happened next: the papers and the prototypes, the manifestos and the open letters, the laws and the claims. ${events.length} exhibits, one thread, and a question nobody has finished answering.`;
  const words = text.split(' ');
  const accent = new Set(['neuron', 'think.', 'thread,', 'answering.']);
  return (
    <section className="manifesto shell" aria-label="About the museum">
      <p ref={ref} className="manifesto-text serif">
        {words.map((w, i) => <Word key={i} word={w} range={[i / words.length, (i + 1) / words.length]} progress={scrollYProgress} accent={accent.has(w)} />)}
      </p>
    </section>
  );
}

function Word({ word, range, progress, accent }: { word: string; range: [number, number]; progress: ReturnType<typeof useScroll>['scrollYProgress']; accent: boolean }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return <motion.span className={accent ? 'lit' : undefined} style={{ opacity }}>{word} </motion.span>;
}
