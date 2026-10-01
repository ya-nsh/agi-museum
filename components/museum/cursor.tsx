'use client';

import { motion, useMotionValue, useSpring, type MotionStyle } from 'motion/react';
import { useEffect, useState } from 'react';
import { useMuseum } from './providers';

const RING = 88;

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

  // Magnetic buttons: primary actions lean toward the pointer.
  useEffect(() => {
    if (!enabled) return;
    let current: HTMLElement | null = null;
    const release = () => { if (current) { current.style.removeProperty('--mx-t'); current.style.removeProperty('--my-t'); current = null; } };
    const move = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('.btn, .magnetic');
      if (el !== current) release();
      if (!el) return;
      current = el;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.setProperty('--mx-t', `${dx * 10}px`);
      el.style.setProperty('--my-t', `${dy * 8}px`);
    };
    addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', release);
    return () => { release(); removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', release); };
  }, [enabled]);

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
    const down = () => setState(s => (s.down ? s : { ...s, down: true }));
    const up = () => setState(s => (s.down ? { ...s, down: false } : s));
    const leave = () => setState(s => (s.hidden ? s : { ...s, hidden: true }));
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
  // The ring is drawn at its largest size and scaled down, so growing it is a
  // compositor-only transform rather than a width/height layout every frame.
  // Its border is thickened by the inverse scale to stay a 1px hairline.
  const scale = (state.label ? RING : state.hover ? 46 : 26) / RING;
  return (
    <div className={`cursor ${state.hidden ? 'is-hidden' : ''}`} aria-hidden="true">
      <motion.div className="cursor-dot" style={{ x, y }} animate={{ scale: state.hover ? 0 : state.down ? 0.6 : 1 }} />
      <motion.div className="cursor-ring" style={{ x: rx, y: ry }}>
        <motion.div className={`cursor-ring-shape ${state.label ? 'has-label' : ''}`} style={{ '--bw': `${1 / scale}px` } as MotionStyle}
          animate={{ scale: scale * (state.down ? 0.85 : 1) }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
          {state.label && <span>{state.label}</span>}
        </motion.div>
      </motion.div>
    </div>
  );
}
