'use client';

import { AnimatePresence, motion, useScroll, useSpring, useMotionValueEvent } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { useActiveSection } from './use-active-section';
import { useMuseum } from './providers';

export const HOME_SECTIONS = [
  { id: 'galleries', label: 'Galleries' },
  { id: 'collection', label: 'Collection' },
  { id: 'archive', label: 'The archive' },
  { id: 'compute', label: 'Compute' },
  { id: 'debate', label: 'Debate' },
  { id: 'guide', label: 'Reading room' },
];

/** A quiet table of contents pinned to the right edge of the home page. */
export function SectionNav() {
  const active = useActiveSection(HOME_SECTIONS.map(s => s.id));
  const { scrollTo } = useMuseum();
  const index = HOME_SECTIONS.findIndex(s => s.id === active);
  return (
    <AnimatePresence>
      {active && active !== 'galleries' && (
        <motion.nav className="section-nav" aria-label="Sections on this page" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.5 }}>
          <span className="sn-track" aria-hidden="true"><motion.i animate={{ scaleY: (index + 1) / HOME_SECTIONS.length }} transition={{ type: 'spring', stiffness: 160, damping: 26 }} /></span>
          {HOME_SECTIONS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'on' : ''} aria-current={active === s.id ? 'location' : undefined}
              onClick={e => { e.preventDefault(); scrollTo(`#${s.id}`); }}>
              <span className="sn-label">{s.label}</span>
              <span className="sn-num mono">{String(i + 1).padStart(2, '0')}</span>
            </a>
          ))}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

/** Back to top, with a ring that fills as you read. */
export function ScrollTop() {
  const { scrollYProgress, scrollY } = useScroll();
  const ring = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const [show, setShow] = useState(false);
  const { scrollTo } = useMuseum();
  useMotionValueEvent(scrollY, 'change', y => setShow(y > 900));
  return (
    <AnimatePresence>
      {show && (
        <motion.button className="scroll-top" onClick={() => scrollTo(0, 0)} aria-label="Back to top" data-cursor="Top"
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" className="st-bg" /><motion.circle cx="24" cy="24" r="22" className="st-ring" style={{ pathLength: ring }} /></svg>
          <ArrowUp size={17} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
