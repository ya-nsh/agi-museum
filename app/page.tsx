'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { events, type Event } from '@/lib/museum';
import { Closing, Footer, ReadingRoom } from '@/components/museum/closing';
import { Collection } from '@/components/museum/collection';
import { CommandPalette } from '@/components/museum/command-palette';
import { ComputeChart } from '@/components/museum/compute-chart';
import { Debate } from '@/components/museum/debate';
import { Galleries } from '@/components/museum/galleries';
import { Header } from '@/components/museum/header';
import { Hero, Manifesto } from '@/components/museum/hero';
import { Marquee } from '@/components/museum/marquee';
import { OnThisDay } from '@/components/museum/on-this-day';
import { Directory } from '@/components/museum/directory';
import { Preloader } from '@/components/museum/preloader';
import { Pulse } from '@/components/museum/pulse';
import { SectionNav } from '@/components/museum/section-nav';
import { WorkshopTeaser } from '@/components/museum/workshop/teaser';
import { useMuseum } from '@/components/museum/providers';

// The exhibit dialog (and Radix with it) is its own chunk: nothing on first
// paint needs it. It is fetched once the page is idle, or on first open.
const loadDialog = () => import('@/components/museum/exhibit-dialog');
const ExhibitDialog = dynamic(() => loadDialog().then(m => m.ExhibitDialog), { ssr: false });

export default function Museum() {
  const { scrollTo } = useMuseum();
  const [selected, setSelected] = useState<Event | null>(null);
  const [palette, setPalette] = useState(false);
  const [era, setEra] = useState<number | null>(null);

  // Exhibit links (#exhibit-07) open the matching exhibit, and survive reloads.
  useEffect(() => {
    const sync = () => setSelected(events.find(e => `#${e.id}` === location.hash) ?? null);
    sync();
    addEventListener('hashchange', sync);
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2000));
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
    const id = idle(() => { void loadDialog(); });
    return () => { removeEventListener('hashchange', sync); cancelIdle(id); };
  }, []);

  const open = useCallback((e: Event) => {
    setSelected(e);
    history.replaceState(null, '', `#${e.id}`);
  }, []);
  const close = useCallback(() => {
    setSelected(null);
    history.replaceState(null, '', location.pathname + location.search);
  }, []);
  const openId = useCallback((id: string) => { const e = events.find(x => x.id === id); if (e) open(e); }, [open]);
  const enterGallery = useCallback((i: number) => { setEra(i); scrollTo('#collection'); }, [scrollTo]);

  return (
    <>
      <Preloader />
      <a className="skip-link" href="#collection">Skip to the collection</a>
      <Header onSearch={() => setPalette(true)} />
      <main>
        <Hero onOpen={open} />
        <Marquee onOpen={openId} />
        <OnThisDay onOpen={open} />
        <Manifesto />
        <Galleries onEnter={enterGallery} onOpen={open} />
        <Collection era={era} setEra={setEra} onOpen={open} />
        <Pulse onOpen={open} />
        <ComputeChart />
        <WorkshopTeaser />
        <Debate />
        <ReadingRoom />
        <Directory />
        <Closing />
      </main>
      <Footer />
      <SectionNav />
      <ExhibitDialog event={selected} onClose={close} onNavigate={open} />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={open} />
    </>
  );
}
