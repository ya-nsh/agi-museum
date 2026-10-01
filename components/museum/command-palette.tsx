'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { Event } from '@/lib/museum';

const loadDialog = () => import('./palette-dialog');
const PaletteDialog = dynamic(() => loadDialog().then(m => m.PaletteDialog), { ssr: false });

/**
 * Search the whole collection from anywhere with ⌘K / Ctrl+K or "/". Only the
 * shortcut lives here: the dialog (Radix, the search code) is its own chunk,
 * fetched when the browser is idle or on first use.
 */
export function CommandPalette({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (v: boolean) => void; onSelect: (e: Event) => void }) {
  // Mount the dialog on first open and keep it, so closing can animate out.
  const [wanted, setWanted] = useState(open);
  if (open && !wanted) setWanted(true);

  // The shortcut handler is registered once and reads the latest props.
  const latest = useRef({ open, onOpenChange });
  useEffect(() => { latest.current = { open, onOpenChange }; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input,textarea,[contenteditable=true]');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        latest.current.onOpenChange(!latest.current.open);
      }
    };
    addEventListener('keydown', onKey);
    // Warm the chunk once the page has settled, so the first open is instant.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2000));
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
    const id = idle(() => { void loadDialog(); });
    return () => { removeEventListener('keydown', onKey); cancelIdle(id); };
  }, []);

  return wanted ? <PaletteDialog open={open} onOpenChange={onOpenChange} onSelect={onSelect} /> : null;
}
