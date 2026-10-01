'use client';

import Lenis from 'lenis';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

type Ctx = {
  /** True when the visitor's OS asks for reduced motion or they switched motion off. */
  reduced: boolean;
  toggleMotion: () => void;
  /** Smoothly scroll to an element, selector or y-offset (respects reduced motion). */
  scrollTo: (target: string | HTMLElement | number, offset?: number) => void;
  /** Freeze page scrolling while an overlay is open. */
  lockScroll: (locked: boolean) => void;
  /** False only while the home page's first-visit intro curtain is still down. */
  introDone: boolean;
  /** Show a short confirmation message at the bottom of the screen. */
  toast: (message: string) => void;
};

const MuseumCtx = createContext<Ctx | null>(null);
export const useMuseum = () => {
  const c = useContext(MuseumCtx);
  if (!c) throw new Error('useMuseum must be used inside <Providers>');
  return c;
};

const MOTION_KEY = 'agi-museum-motion';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

// External stores read through useSyncExternalStore: server snapshots are the
// defaults, and the client value is picked up right after hydration.
const motionListeners = new Set<() => void>();
const motionStore = {
  subscribe(cb: () => void) {
    motionListeners.add(cb);
    addEventListener('storage', cb);
    return () => { motionListeners.delete(cb); removeEventListener('storage', cb); };
  },
  get() { try { return localStorage.getItem(MOTION_KEY) === 'off'; } catch { return false; } },
  set(off: boolean) {
    try { localStorage.setItem(MOTION_KEY, off ? 'off' : 'on'); } catch { /* storage unavailable */ }
    motionListeners.forEach(cb => cb());
  },
};
const subscribeReduced = (cb: () => void) => {
  const m = matchMedia(REDUCED_QUERY);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

// The intro curtain is pure CSS (see .preloader in globals.css), so it plays
// from first paint whether or not the JavaScript has arrived. The head script
// in app/layout.tsx sets data-intro="play" when it will run; this mirrors its
// timing so the hero canvas, counters and smooth scrolling start as it lifts.
const INTRO_LIFT_MS = 1000;
const introLifted = () => document.documentElement.dataset.intro !== 'play' || performance.now() >= INTRO_LIFT_MS;
const subscribeIntro = (cb: () => void) => {
  const t = setTimeout(cb, Math.max(0, INTRO_LIFT_MS - performance.now()));
  return () => clearTimeout(t);
};

export function Providers({ children }: { children: React.ReactNode }) {
  const systemReduced = useSyncExternalStore(subscribeReduced, () => matchMedia(REDUCED_QUERY).matches, () => false);
  const userOff = useSyncExternalStore(motionStore.subscribe, motionStore.get, () => false);
  const lifted = useSyncExternalStore(subscribeIntro, introLifted, () => false);
  const lenis = useRef<Lenis | null>(null);
  const wakeLenis = useRef(() => {});
  const locks = useRef(0);
  const reduced = systemReduced || userOff;
  const introDone = lifted || reduced;

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    if (reduced) return;
    // Lenis only needs frames while it is gliding. Its autoRaf would keep a
    // requestAnimationFrame loop alive forever, so the page could never idle;
    // instead the loop wakes on wheel input or a programmatic scroll and stops
    // once the glide settles. Lenis gets its own clock that only advances while
    // the loop runs, so a glide never starts with a huge time step.
    const l = new Lenis({ autoRaf: false, lerp: 0.1, prevent: node => !!node.closest?.('[data-lenis-prevent]') });
    let frame = 0, last = 0, clock = 0;
    const tick = (t: number) => {
      clock += last ? Math.min(t - last, 64) : 16;
      last = t;
      l.raf(clock);
      frame = l.isScrolling === 'smooth' ? requestAnimationFrame(tick) : 0;
      if (!frame) last = 0;
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const offVirtual = l.on('virtual-scroll', wake);
    lenis.current = l;
    wakeLenis.current = wake;
    if (locks.current > 0 || !introLifted()) l.stop();
    return () => { offVirtual(); cancelAnimationFrame(frame); l.destroy(); lenis.current = null; wakeLenis.current = () => {}; };
  }, [reduced]);

  // Smooth scrolling stays parked while the intro curtain is down.
  useEffect(() => { if (lifted && locks.current === 0) lenis.current?.start(); }, [lifted]);

  const toggleMotion = useCallback(() => motionStore.set(!motionStore.get()), []);

  const scrollTo = useCallback((target: string | HTMLElement | number, offset = -72) => {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (el === null) return;
    if (lenis.current) { lenis.current.scrollTo(el, { offset, duration: 1.4, force: true }); wakeLenis.current(); return; }
    const y = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: 'instant' });
  }, []);

  // Same-page anchors glide instead of jumping. Links to ids that do not exist
  // (such as #exhibit-07 on the home page) fall through to hashchange handlers.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      const id = a?.getAttribute('href')?.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      scrollTo(el);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [scrollTo]);

  const lockScroll = useCallback((locked: boolean) => {
    locks.current = Math.max(0, locks.current + (locked ? 1 : -1));
    const on = locks.current > 0;
    document.documentElement.classList.toggle('scroll-locked', on);
    if (on) lenis.current?.stop(); else if (introLifted()) lenis.current?.start();
  }, []);

  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const toastId = useRef(0);
  const toast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts(t => [...t.slice(-2), { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2400);
  }, []);

  const value = useMemo(() => ({ reduced, toggleMotion, scrollTo, lockScroll, introDone, toast }), [reduced, toggleMotion, scrollTo, lockScroll, introDone, toast]);

  return (
    <MuseumCtx.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'} transition={{ ease: [0.22, 1, 0.36, 1] }}>
        {children}
        <div className="toasts" role="status" aria-live="polite">
          <AnimatePresence>
            {toasts.map(t => (
              <motion.div key={t.id} className="toast" layout initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.95 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
                <span className="toast-dot" />{t.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </MuseumCtx.Provider>
  );
}
