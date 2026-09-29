'use client';

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { firstYear, lastYear } from '@/lib/museum';
import { useMuseum } from './providers';

/** Once per session: the years roll from the first exhibit to today, then the curtain lifts. */
export function Preloader() {
  const { introDone, finishIntro, lockScroll } = useMuseum();
  const [done, setDone] = useState(false);
  const year = useMotionValue(firstYear);
  const label = useTransform(year, v => String(Math.round(v)));
  const progress = useTransform(year, [firstYear, lastYear], [0, 1]);
  const show = !introDone && !done;

  useEffect(() => {
    if (introDone) return;
    lockScroll(true);
    let locked = true;
    const c = animate(year, lastYear, { duration: 1.9, ease: [0.7, 0, 0.2, 1] });
    c.then(() => {
      if (!locked) return; // cancelled by cleanup
      locked = false;
      try { sessionStorage.setItem('agi-intro', '1'); } catch { /* storage unavailable */ }
      setDone(true);
      lockScroll(false);
      finishIntro();
    });
    return () => { if (locked) { locked = false; lockScroll(false); } c.stop(); };
  }, [introDone, finishIntro, lockScroll, year]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="preloader" exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1] }} aria-hidden="true">
          <div className="preloader-top mono"><span>AGI MUSEUM</span><span>PERMANENT COLLECTION</span></div>
          <motion.div className="preloader-year" exit={{ y: -80, opacity: 0 }} transition={{ duration: 0.7 }}>{label}</motion.div>
          <div className="preloader-bottom">
            <span className="mono">OPENING THE ARCHIVE</span>
            <div className="preloader-bar"><motion.span style={{ scaleX: progress }} /></div>
            <span className="mono">{firstYear} — {lastYear}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
