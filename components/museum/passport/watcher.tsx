'use client';

import { useEffect, useRef } from 'react';
import { events } from '@/lib/museum';
import { earned, passport, usePassport } from '@/lib/passport';
import { useMuseum } from '../providers';

const sources = new Set(events.map(e => e.source));

/**
 * Runs once per page: counts clicks on original sources toward the evidence
 * stamp and announces each newly earned stamp with a toast.
 */
export function PassportWatcher() {
  const state = usePassport();
  const { toast } = useMuseum();
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    // The stored passport at load is the baseline, not news. Read it from the
    // store directly: the first render uses the empty server snapshot.
    known.current ??= new Set(earned(passport.get()).map(s => s.id));
    for (const s of earned(state)) {
      if (known.current.has(s.id)) continue;
      known.current.add(s.id);
      toast(`Passport stamped: ${s.title}`);
    }
  }, [state, toast]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]');
      const href = a?.getAttribute('href');
      if (href && sources.has(href)) passport.mark(`source:${href}`);
    };
    // Capture, so links inside dialogs that stop propagation still count.
    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    return () => { document.removeEventListener('click', onClick, true); document.removeEventListener('auxclick', onClick, true); };
  }, []);

  return null;
}
