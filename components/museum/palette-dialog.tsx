'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Dialog } from 'radix-ui';
import { ArrowUpRight, CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { events, formatDate, accession, type Event } from '@/lib/museum';
import { useMuseum } from './providers';

function score(e: Event, terms: string[]) {
  const title = e.title.toLowerCase();
  const hay = `${e.title} ${e.summary} ${e.people} ${e.date} ${e.track} ${e.sourceName}`.toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (!hay.includes(t)) return -1;
    s += title.startsWith(t) ? 6 : title.includes(t) ? 4 : e.people.toLowerCase().includes(t) ? 2 : 1;
  }
  return s;
}

/**
 * The search dialog itself, loaded on demand by <CommandPalette>. The query
 * lives in <PaletteBody>, which unmounts on close, so every opening starts fresh.
 */
export function PaletteDialog({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (v: boolean) => void; onSelect: (e: Event) => void }) {
  const { lockScroll } = useMuseum();

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    return () => lockScroll(false);
  }, [open, lockScroll]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div className="palette" data-lenis-prevent initial={{ opacity: 0, y: -24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
                <PaletteBody onChoose={e => { onOpenChange(false); onSelect(e); }} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function PaletteBody({ onChoose }: { onChoose: (e: Event) => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [...events].reverse().slice(0, 8);
    return events.map(e => ({ e, s: score(e, terms) })).filter(r => r.s >= 0).sort((a, b) => b.s - a.s).slice(0, 12).map(r => r.e);
  }, [q]);

  useEffect(() => { list.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [active]);

  const choose = (e: Event | undefined) => { if (e) onChoose(e); };

  return (
    <>
      <Dialog.Title className="sr-only">Search the collection</Dialog.Title>
      <label className="palette-input">
        <Search size={18} />
        <input autoFocus value={q} onChange={e => { setQ(e.target.value); setActive(0); }} placeholder="Search exhibits, people, years…" aria-label="Search exhibits"
          role="combobox" aria-expanded aria-controls="palette-results" aria-activedescendant={results[active] ? `pal-${results[active].id}` : undefined}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
            if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
          }} />
        <kbd>esc</kbd>
      </label>
      <p className="palette-hint mono">{q ? `${results.length} ${results.length === 1 ? 'MATCH' : 'MATCHES'}` : 'MOST RECENT EXHIBITS'}</p>
      <ul id="palette-results" role="listbox" ref={list}>
        {results.map((e, i) => (
          <li key={e.id} id={`pal-${e.id}`} role="option" aria-selected={i === active} className={i === active ? 'active' : ''} onMouseMove={() => setActive(i)} onClick={() => choose(e)}>
            <i className={`dot t-${e.track.toLowerCase()}`} />
            <span className="pal-year serif">{e.year}</span>
            <span className="pal-title">{e.title}<small>{formatDate(e.date)} · {e.track}</small></span>
            <span className="pal-no mono">{accession(e)}</span>
            {i === active ? <CornerDownLeft size={15} /> : <ArrowUpRight size={15} />}
          </li>
        ))}
        {!results.length && <li className="pal-empty">Nothing in the archive matches “{q}”.</li>}
      </ul>
      <div className="palette-foot mono"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>⌘</kbd><kbd>K</kbd> toggle</span></div>
    </>
  );
}
