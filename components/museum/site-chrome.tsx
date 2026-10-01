'use client';

import { useRouter } from 'next/navigation';
import { Check, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Event } from '@/lib/museum';
import { passport, type Mark } from '@/lib/passport';
import { CommandPalette } from './command-palette';
import { Header } from './header';

/**
 * The header and search for server-rendered pages: choosing a result opens
 * that exhibit's page. The page itself stays a server component.
 */
export function SiteChrome({ current }: { current?: string }) {
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  return (
    <>
      <Header current={current} onSearch={() => setPalette(true)} />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={(e: Event) => router.push(`/exhibit/${e.id}`)} />
    </>
  );
}

/** Records a visit in the passport: an exhibit seen, or a wing visited. */
export function PassportVisit({ exhibit, mark }: { exhibit?: string; mark?: Mark }) {
  useEffect(() => { if (exhibit) passport.seeExhibit(exhibit); }, [exhibit]);
  useEffect(() => { if (mark) passport.mark(mark); }, [mark]);
  return null;
}

/** ← and → step through the chronology, unless focus is in a field or dialog. */
export function ArrowNav({ prev, next }: { prev?: string; next?: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (k: KeyboardEvent) => {
      if (k.defaultPrevented || (k.target as HTMLElement)?.closest?.('input,textarea,[role=dialog]')) return;
      if (k.key === 'ArrowLeft' && prev) router.push(prev);
      if (k.key === 'ArrowRight' && next) router.push(next);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [prev, next, router]);
  return null;
}

/** Copies the page's address, confirming in place. */
export function CopyLink() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard unavailable */ }
  };
  return (
    <button className="btn btn-ghost" onClick={copy}><span>{copied ? 'Link copied' : 'Copy link'}</span>{copied ? <Check size={16} /> : <Link2 size={16} />}</button>
  );
}
