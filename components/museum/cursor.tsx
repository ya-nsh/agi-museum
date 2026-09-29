'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useState } from 'react';
import { useMuseum } from './providers';

/** A quiet two-part cursor: an exact dot and a trailing ring that grows over interactive things. */
export function Cursor() {
  const { reduced } = useMuseum();
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<{ hover: boolean; label: string; down: boolean; hidden: boolean }>({ hover: false, label: '', down: false, hidden: true });
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 });

  useEffect(() => {
    const fine = matchMedia('(pointer: fine) and (hover: hover)');
    const sync = () => setEnabled(fine.matches && !reduced);
    sync();
    fine.addEventListener('change', sync);
    return () => fine.removeEventListener('change', sync);
  }, [reduced]);

  useEffect(() => {
    document.documentElement.classList.toggle('has-cursor', enabled);
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX); y.set(e.clientY);
      const t = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('a,button,[role=button],input,select,label,[data-cursor]');
      const label = t?.dataset.cursor ?? '';
      const hover = !!t && t.tagName !== 'INPUT';
      setState(s => (s.hover === hover && s.label === label && !s.hidden ? s : { ...s, hover, label, hidden: false }));
    };
    const down = () => setState(s => ({ ...s, down: true }));
    const up = () => setState(s => ({ ...s, down: false }));
    const leave = () => setState(s => ({ ...s, hidden: true }));
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', down);
    addEventListener('pointerup', up);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerdown', down);
      removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.classList.remove('has-cursor');
    };
  }, [enabled, x, y]);

  if (!enabled) return null;
  const size = state.label ? 88 : state.hover ? 46 : 26;
  return (
    <div className={`cursor ${state.hidden ? 'is-hidden' : ''}`} aria-hidden="true">
      <motion.div className="cursor-dot" style={{ x, y }} animate={{ scale: state.hover ? 0 : state.down ? 0.6 : 1 }} />
      <motion.div className={`cursor-ring ${state.label ? 'has-label' : ''}`} style={{ x: rx, y: ry }} animate={{ width: size, height: size, scale: state.down ? 0.85 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
        {state.label && <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>{state.label}</motion.span>}
      </motion.div>
    </div>
  );
}
