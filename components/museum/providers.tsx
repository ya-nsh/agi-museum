'use client';

import Lenis from 'lenis';
import { MotionConfig } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

type Ctx = {
  /** True when the visitor's OS asks for reduced motion or they switched motion off. */
  reduced: boolean;
  toggleMotion: () => void;
  /** Smoothly scroll to an element, selector or y-offset (respects reduced motion). */
  scrollTo: (target: string | HTMLElement | number, offset?: number) => void;
  /** Freeze page scrolling while an overlay is open. */
  lockScroll: (locked: boolean) => void;
  introDone: boolean;
  finishIntro: () => void;
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
const noopSubscribe = () => () => {};

export function Providers({ children }: { children: React.ReactNode }) {
  const systemReduced = useSyncExternalStore(subscribeReduced, () => matchMedia(REDUCED_QUERY).matches, () => false);
  const userOff = useSyncExternalStore(motionStore.subscribe, motionStore.get, () => false);
  // The inline head script marks repeat visits in this session, so the intro runs once.
  const introSeen = useSyncExternalStore(noopSubscribe, () => document.documentElement.dataset.intro === 'seen', () => false);
  const [introFinished, setIntroFinished] = useState(false);
  const lenis = useRef<Lenis | null>(null);
  const locks = useRef(0);
  const reduced = systemReduced || userOff;
  const introDone = introFinished || introSeen || reduced;

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    if (reduced) return;
    const l = new Lenis({ autoRaf: true, lerp: 0.1, prevent: node => !!node.closest?.('[data-lenis-prevent]') });
    lenis.current = l;
    if (locks.current > 0) l.stop();
    return () => { l.destroy(); lenis.current = null; };
  }, [reduced]);

  const toggleMotion = useCallback(() => motionStore.set(!motionStore.get()), []);

  const scrollTo = useCallback((target: string | HTMLElement | number, offset = -72) => {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (el === null) return;
    if (lenis.current) { lenis.current.scrollTo(el, { offset, duration: 1.4, force: true }); return; }
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
    if (on) lenis.current?.stop(); else lenis.current?.start();
  }, []);

  const finishIntro = useCallback(() => setIntroFinished(true), []);

  const value = useMemo(() => ({ reduced, toggleMotion, scrollTo, lockScroll, introDone, finishIntro }), [reduced, toggleMotion, scrollTo, lockScroll, introDone, finishIntro]);

  return (
    <MuseumCtx.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'} transition={{ ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </MotionConfig>
    </MuseumCtx.Provider>
  );
}
