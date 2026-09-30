'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog } from 'radix-ui';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Link2, Pause, Play, Shuffle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { accession, eraOf, events, eras, formatDate, neighbours, related, statusNote, statusShort, type Event } from '@/lib/museum';
import { Sigil } from './sigil';
import { useMuseum } from './providers';

export const TURING_CREDIT = 'https://commons.wikimedia.org/wiki/File:Alan_Turing_Aged_16.jpg';

export function ExhibitDialog({ event, onClose, onNavigate }: { event: Event | null; onClose: () => void; onNavigate: (e: Event) => void }) {
  const { lockScroll, toast } = useMuseum();
  const [dir, setDir] = useState(1);
  const [copied, setCopied] = useState(false);
  const [touring, setTouring] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const open = !!event;

  useEffect(() => { if (!open) return; lockScroll(true); return () => lockScroll(false); }, [open, lockScroll]);
  const close = () => { setTouring(false); onClose(); };
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [event]);

  const go = (target: Event | null, d: number, keepTour = false) => {
    if (!target) return;
    if (!keepTour) setTouring(false);
    setDir(d); setCopied(false); onNavigate(target);
  };
  const surprise = () => {
    if (!event) return;
    let r = event;
    while (r === event) r = events[Math.floor(Math.random() * events.length)];
    go(r, r.date > event.date ? 1 : -1);
  };
  const nb = event ? neighbours(event) : null;

  useEffect(() => {
    if (!nb) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea')) return;
      if (e.key === 'ArrowRight') go(nb.next, 1);
      if (e.key === 'ArrowLeft') go(nb.prev, -1);
      if (e.key === ' ' && !(e.target as HTMLElement)?.closest?.('button,a')) { e.preventDefault(); setTouring(t => !t); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const copy = async () => {
    if (!event) return;
    const url = `${location.origin}/exhibit/${event.id}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); toast('Link copied to clipboard'); setTimeout(() => setCopied(false), 1800); } catch { location.hash = event.id; toast('Link is in your address bar'); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) close(); }}>
      <AnimatePresence>
        {event && nb && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount onOpenAutoFocus={ev => { ev.preventDefault(); (ev.currentTarget as HTMLElement | null)?.focus(); }}>
              <motion.div className={`exhibit-dialog t-${event.track.toLowerCase()}`} initial={{ opacity: 0, y: 60, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                style={{ touchAction: 'pan-y' }}
                onPanEnd={(_, info) => {
                  if (Math.abs(info.offset.x) < 70 || Math.abs(info.offset.x) < Math.abs(info.offset.y) * 1.5) return;
                  if (info.offset.x < 0) go(nb.next, 1); else go(nb.prev, -1);
                }}>
                <div className="dialog-progress" aria-hidden="true">
                  <motion.i className="chrono" animate={{ scaleX: (nb.index + 1) / events.length }} transition={{ type: 'spring', stiffness: 120, damping: 24 }} />
                  {touring && nb.next && (
                    <motion.i key={event.id} className="tour" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 9, ease: 'linear' }}
                      onAnimationComplete={() => go(nb.next, 1, true)} />
                  )}
                </div>
                <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                  <motion.aside key={event.id + '-plate'} className="plate" custom={dir}
                    variants={{ enter: (d: number) => ({ opacity: 0, x: d * 40 }), center: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: d * -40 }) }}
                    initial="enter" animate="center" exit="exit" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                    {event.id === 'exhibit-01' && <img className="plate-photo" src="/alan-turing.jpg" alt="Alan Turing as a student, circa 1928–1929" width={675} height={919} />}
                    <div className="plate-top mono"><span>NO. {accession(event)}</span><span>GALLERY {eras[eraOf(event)].numeral}</span></div>
                    <Sigil event={event} draw className="plate-sigil" />
                    <div className="plate-year serif">{event.year}</div>
                    <div className="plate-foot mono"><span><i className={`dot t-${event.track.toLowerCase()}`} />{event.track.toUpperCase()}</span><span>{statusShort[event.status].toUpperCase()}</span></div>
                  </motion.aside>
                </AnimatePresence>
                <div className="dialog-body" ref={scroller} data-lenis-prevent>
                  <div className="dialog-actions">
                    <button onClick={() => setTouring(t => !t)} className={`icon-btn ${touring ? 'active' : ''}`} aria-pressed={touring} disabled={!nb.next} title="Autoplay through the collection (space)">
                      {touring ? <Pause size={15} /> : <Play size={15} />}<span>{touring ? 'Pause tour' : 'Guided tour'}</span>
                    </button>
                    <button onClick={surprise} className="icon-btn round" aria-label="Show a random exhibit" title="Surprise me"><Shuffle size={15} /></button>
                    <button onClick={copy} className="icon-btn" aria-label="Copy link to this exhibit">{copied ? <Check size={16} /> : <Link2 size={16} />}<span>{copied ? 'Copied' : 'Copy link'}</span></button>
                    <Dialog.Close className="icon-btn round" aria-label="Close exhibit"><X size={18} /></Dialog.Close>
                  </div>
                  <AnimatePresence mode="wait" custom={dir} initial={false}>
                    <motion.div key={event.id} custom={dir}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                      <p className="dialog-date mono">{formatDate(event.date).toUpperCase()}</p>
                      <Dialog.Title className="dialog-title serif">{event.title}</Dialog.Title>
                      <Dialog.Description className="dialog-summary">{event.summary}</Dialog.Description>
                      <div className="dialog-section">
                        <h3 className="mono">WHY IT BELONGS HERE</h3>
                        <p>{event.significance}</p>
                      </div>
                      <div className="dialog-grid">
                        <div><h3 className="mono">PEOPLE & INSTITUTIONS</h3><p>{event.people}</p></div>
                        <div><h3 className="mono">EVIDENCE LABEL</h3><p><span className="status-chip">{event.status}</span><br /><small>{statusNote[event.status]}</small></p></div>
                      </div>
                      <a className="source-card" href={event.source} target="_blank" rel="noreferrer" data-cursor="Source">
                        <span className="mono">FOLLOW THE EVIDENCE</span>
                        <strong className="serif">{event.sourceName}</strong>
                        <span className="source-host mono">{new URL(event.source).hostname.replace('www.', '')}</span>
                        <ArrowUpRight className="source-arrow" size={22} />
                      </a>
                      {event.id === 'exhibit-01' && <p className="credit">Archival portrait: Alan Turing, c. 1928–1929. Turing Digital Archive / <a href={TURING_CREDIT} target="_blank" rel="noreferrer">Wikimedia Commons</a>. Public domain; the photograph predates the 1950 paper.</p>}
                      <div className="dialog-related">
                        <h3 className="mono">ALSO ON THIS THREAD</h3>
                        {related(event).map(r => (
                          <button key={r.id} onClick={() => go(r, r.date > event.date ? 1 : -1)}>
                            <span className="serif">{r.year}</span><span>{r.title}</span><ArrowUpRight size={15} />
                          </button>
                        ))}
                      </div>
                      <Link className="full-page-link mono" href={`/exhibit/${event.id}`}>OPEN THE FULL EXHIBIT PAGE <ArrowUpRight size={14} /></Link>
                    </motion.div>
                  </AnimatePresence>
                  <p className="swipe-hint mono" aria-hidden="true">SWIPE ← → TO BROWSE</p>
                  <nav className="dialog-nav" aria-label="Chronological navigation">
                    <button disabled={!nb.prev} onClick={() => go(nb.prev, -1)}><ArrowLeft size={16} /><span><small className="mono">PREVIOUS</small>{nb.prev?.title ?? 'Start of the collection'}</span></button>
                    <span className="mono">{String(nb.index + 1).padStart(2, '0')}<i>/</i>{events.length}</span>
                    <button disabled={!nb.next} onClick={() => go(nb.next, 1)}><span><small className="mono">NEXT</small>{nb.next?.title ?? 'The thread continues'}</span><ArrowRight size={16} /></button>
                  </nav>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
