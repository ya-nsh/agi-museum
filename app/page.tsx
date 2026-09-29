'use client';

import { useCallback, useEffect, useState } from 'react';
import { events, type Event } from '@/lib/museum';
import { Closing, Footer, ReadingRoom } from '@/components/museum/closing';
import { Collection } from '@/components/museum/collection';
import { CommandPalette } from '@/components/museum/command-palette';
import { ComputeChart } from '@/components/museum/compute-chart';
import { Debate } from '@/components/museum/debate';
import { ExhibitDialog } from '@/components/museum/exhibit-dialog';
import { Galleries } from '@/components/museum/galleries';
import { Header } from '@/components/museum/header';
import { Hero, Manifesto } from '@/components/museum/hero';
import { Marquee } from '@/components/museum/marquee';
import { Preloader } from '@/components/museum/preloader';
import { Pulse } from '@/components/museum/pulse';
import { useMuseum } from '@/components/museum/providers';

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
    return () => removeEventListener('hashchange', sync);
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
        <Hero />
        <Marquee onOpen={openId} />
        <Manifesto />
        <Galleries onEnter={enterGallery} onOpen={open} />
        <Collection era={era} setEra={setEra} onOpen={open} />
        <Pulse onOpen={open} />
        <ComputeChart />
        <Debate />
        <ReadingRoom />
        <Closing />
      </main>
      <Footer />
      <ExhibitDialog event={selected} onClose={close} onNavigate={open} />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={open} />
    </>
  );
}
