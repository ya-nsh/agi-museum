'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowUpRight, Download, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Header } from '@/components/museum/header';
import { CommandPalette } from '@/components/museum/command-palette';
import { Footer } from '@/components/museum/closing';
import { RevealLines } from '@/components/museum/reveal';
import { Sigil } from '@/components/museum/sigil';
import { useMuseum } from '@/components/museum/providers';
import { StampMark } from '@/components/museum/passport/stamp';
import { download, siteFonts } from '@/lib/canvas-art';
import { eraEvents, eraOf, eras, events, type Event } from '@/lib/museum';
import { earned, passport, progress, stamps, usePassport, type PassportState } from '@/lib/passport';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };

/** A 1600 × 640 ticket stub: perforation, admission text and the visitor's tally. */
async function drawTicket(s: PassportState) {
  const f = await siteFonts();
  const c = document.createElement('canvas');
  const W = 1600, H = 640, STUB = 1180;
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const got = earned(s);
  g.fillStyle = '#ede8dc'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#141412'; g.fillRect(STUB, 0, W - STUB, H);
  // Perforation.
  g.fillStyle = '#0b0b0a';
  for (let y = 16; y < H; y += 32) { g.beginPath(); g.arc(STUB, y, 7, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#5b5a52'; g.font = `500 26px ${f.mono}`; g.textAlign = 'left';
  g.fillText('AGI MUSEUM · THE MAKING OF INTELLIGENCE', 80, 96);
  g.fillStyle = '#141412'; g.font = `italic 150px ${f.serif}`; g.fillText('Admit one.', 74, 270);
  g.font = `34px ${f.serif}`; g.fillStyle = '#3a3934';
  g.fillText(`Visiting since ${s.since ? longDate(s.since) : 'today'}`, 80, 340);
  const stats = [[String(s.seen.length), 'EXHIBITS OPENED'], [String(got.length), `OF ${stamps.length} STAMPS`], [String(eras.filter((_, i) => eraEvents(i).some(e => s.seen.includes(e.id))).length), 'GALLERIES VISITED']];
  stats.forEach(([n, label], i) => {
    const x = 80 + i * 340;
    g.fillStyle = '#141412'; g.font = `110px ${f.serif}`; g.fillText(n, x, 500);
    g.fillStyle = '#5b5a52'; g.font = `500 22px ${f.mono}`; g.fillText(label, x, 545);
  });
  // The stub: a ring of colored dots, one per stamp.
  const cx = STUB + (W - STUB) / 2, cy = 270;
  stamps.forEach((st, i) => {
    const a = (i / stamps.length) * Math.PI * 2 - Math.PI / 2;
    const has = got.includes(st);
    g.beginPath(); g.arc(cx + Math.cos(a) * 130, cy + Math.sin(a) * 130, has ? 13 : 9, 0, Math.PI * 2);
    if (has) { g.fillStyle = st.ink; g.fill(); } else { g.strokeStyle = '#5b5a52'; g.lineWidth = 2; g.stroke(); }
  });
  g.fillStyle = '#d4f77a'; g.font = `italic 96px ${f.serif}`; g.textAlign = 'center'; g.fillText(String(got.length), cx, cy + 32);
  g.fillStyle = '#aba598'; g.font = `500 22px ${f.mono}`; g.fillText('STAMPS', cx, cy + 74);
  g.fillText('AGI-MUSEUM.VERCEL.APP', cx, H - 60);
  return c;
}

export default function Passport() {
  const router = useRouter();
  const { toast } = useMuseum();
  const [palette, setPalette] = useState(false);
  const s = usePassport();
  const got = earned(s);
  const seen = events.filter(e => s.seen.includes(e.id));
  // Suggestions: the first unseen exhibits in the galleries with the fewest visits.
  const suggestions = eras.map((_, i) => eraEvents(i))
    .map(list => ({ list, unseen: list.filter(e => !s.seen.includes(e.id)) }))
    .filter(x => x.unseen.length)
    .sort((a, b) => (a.list.length - a.unseen.length) - (b.list.length - b.unseen.length))
    .flatMap(x => x.unseen.slice(0, 1)).slice(0, 4);

  const ticket = async () => {
    const c = await drawTicket(s);
    if (await download(c, 'agi-museum-ticket.png')) { passport.mark('shop'); toast('Your ticket stub is saved'); }
    else toast('Could not create the image');
  };
  const reset = () => {
    if (confirm('Clear your passport? Your stamps and visit history in this browser will be erased.')) { passport.reset(); toast('Passport cleared'); }
  };

  return (
    <>
      <Header onSearch={() => setPalette(true)} />
      <main className="passport">
        <section className="pp-hero shell" aria-labelledby="passport-title">
          <p className="mono pp-kicker">YOUR PASSPORT · {got.length} OF {stamps.length} STAMPS{s.since ? ` · SINCE ${longDate(s.since).toUpperCase()}` : ''}</p>
          <RevealLines as="h1" id="passport-title" className="pp-title serif" play lines={[<span key="a">Your</span>, <span key="b"><em>passport.</em></span>]} />
          <p className="pp-lede">Collect a stamp for each gallery you explore and for every wing you visit. Your passport lives only in this browser: nothing is sent anywhere, and you can clear it at any time.</p>
          <div className="pass-progress" aria-hidden="true"><motion.i initial={{ width: 0 }} animate={{ width: `${(got.length / stamps.length) * 100}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} /></div>
        </section>

        <section className="shell" aria-label="Stamps">
          <div className="pass-book">
          {stamps.map(st => {
            const p = progress(s, st), done = p >= st.need;
            return (
              <Link key={st.id} href={st.href} className={`pass-slot ${done ? 'done' : ''}`}>
                <StampMark stamp={st} earned={done} />
                <span className="serif pass-name">{st.title}</span>
                <span className="pass-sub">{st.sub}</span>
                <span className="mono pass-count">{done ? 'STAMPED' : `${p} / ${st.need}`}</span>
              </Link>
            );
          })}
          </div>
        </section>

        <section className="pass-more shell">
          <div className="pass-col">
            <p className="mono pr-label">{suggestions.length ? 'WHERE TO GO NEXT' : 'YOU HAVE SEEN EVERYTHING'}</p>
            <ul className="pass-next">
              {suggestions.map(e => (
                <li key={e.id}><Link href={`/exhibit/${e.id}`} className={`t-${e.track.toLowerCase()}`}><Sigil event={e} className="pass-sigil" /><span><span className="mono">{e.year} · GALLERY {eras[eraOf(e)].numeral}</span><span className="serif">{e.title}</span></span><ArrowUpRight size={15} /></Link></li>
              ))}
            </ul>
          </div>
          <div className="pass-col">
            <p className="mono pr-label">TAKE A KEEPSAKE</p>
            <p className="pass-copy">A ticket stub printed with your tally: exhibits opened, galleries visited and the stamps you have collected so far.</p>
            <div className="ws-toolbar">
              <button className="btn btn-primary" onClick={ticket}><span>Download your ticket</span><Download size={16} /></button>
              <button className="btn btn-text" onClick={reset}><RotateCcw size={16} /><span>Clear passport</span></button>
            </div>
          </div>
        </section>

        {seen.length > 0 && (
          <section className="pass-seen shell" aria-labelledby="seen-title">
            <p id="seen-title" className="mono pr-label">EXHIBITS YOU HAVE OPENED · {seen.length} / {events.length}</p>
            <ul className="pass-sigils">
              {seen.map(e => <li key={e.id}><Link href={`/exhibit/${e.id}`} className={`t-${e.track.toLowerCase()}`} title={`${e.year} · ${e.title}`} aria-label={`${e.year}: ${e.title}`}><Sigil event={e} /></Link></li>)}
            </ul>
          </section>
        )}
      </main>
      <Footer />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={(e: Event) => router.push(`/exhibit/${e.id}`)} />
    </>
  );
}
