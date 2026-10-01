'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Download, Printer, Shuffle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/museum/header';
import { CommandPalette } from '@/components/museum/command-palette';
import { Footer } from '@/components/museum/closing';
import { Reveal, RevealLines } from '@/components/museum/reveal';
import { useMuseum } from '@/components/museum/providers';
import { TRACK_INK, download, drawSigil, siteFonts, wrap } from '@/lib/canvas-art';
import { accession, eraEvents, eraOf, eras, events, formatDate, statusShort, type Event } from '@/lib/museum';
import { passport } from '@/lib/passport';

type Theme = 'night' | 'paper';
type Fonts = Awaited<ReturnType<typeof siteFonts>>;
const BG: Record<Theme, string> = { night: '#0b0b0a', paper: '#ede8dc' };
const INK: Record<Theme, string> = { night: '#ede8dc', paper: '#141412' };
const DIM: Record<Theme, string> = { night: '#7b766c', paper: '#6b665c' };

/** A 3:4 poster for one exhibit, drawn at print resolution (2400 × 3200). */
function drawPoster(c: HTMLCanvasElement, e: Event, theme: Theme, f: Fonts) {
  const W = 2400, H = 3200, M = 180;
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const ink = TRACK_INK[e.track][theme];
  g.fillStyle = BG[theme]; g.fillRect(0, 0, W, H);
  // A faint glow behind the sigil.
  const glow = g.createRadialGradient(W / 2, 1150, 0, W / 2, 1150, 1000);
  glow.addColorStop(0, theme === 'night' ? `${ink}26` : `${ink}14`); glow.addColorStop(1, `${ink}00`);
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.fillStyle = DIM[theme]; g.font = `500 44px ${f.mono}`; g.textBaseline = 'alphabetic';
  g.textAlign = 'left'; g.fillText('AGI MUSEUM', M, M + 20);
  g.textAlign = 'right'; g.fillText(`NO. ${accession(e)} · GALLERY ${eras[eraOf(e)].numeral}`, W - M, M + 20);
  drawSigil(g, e, W / 2 - 800, 350, 1600, ink);
  g.textAlign = 'left'; g.fillStyle = INK[theme];
  g.font = `italic 400px ${f.serif}`; g.fillText(String(e.year), M - 12, 2380);
  g.font = `120px ${f.serif}`;
  wrap(g, e.title, W - M * 2).slice(0, 3).forEach((line, i) => g.fillText(line, M, 2580 + i * 132));
  g.strokeStyle = DIM[theme]; g.globalAlpha = 0.5; g.lineWidth = 2;
  g.beginPath(); g.moveTo(M, H - M - 90); g.lineTo(W - M, H - M - 90); g.stroke(); g.globalAlpha = 1;
  g.fillStyle = ink; g.font = `500 42px ${f.mono}`;
  const meta = `${formatDate(e.date).toUpperCase()} · ${e.track.toUpperCase()} · ${statusShort[e.status].toUpperCase()}`;
  const url = `AGI-MUSEUM.VERCEL.APP/EXHIBIT/${e.id.toUpperCase()}`;
  g.fillText(meta, M, H - M);
  // Long dates and labels would run into the address, so it moves above the rule.
  const fits = g.measureText(meta).width + g.measureText(url).width + 80 <= W - M * 2;
  g.fillStyle = DIM[theme]; g.textAlign = 'right';
  g.fillText(url, W - M, fits ? H - M : H - M - 130);
}

/** A 3:2 postcard that gathers every sigil in one gallery. */
function drawPostcard(c: HTMLCanvasElement, gallery: number, f: Fonts) {
  const W = 1800, H = 1200;
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const era = eras[gallery], list = eraEvents(gallery);
  g.fillStyle = '#10100e'; g.fillRect(0, 0, W, H);
  const cols = Math.ceil(Math.sqrt(list.length * 1.6)), rows = Math.ceil(list.length / cols);
  const gridX = 860, gridY = 110, cell = Math.min((W - gridX - 90) / cols, (H - 220) / rows);
  list.forEach((e, i) => {
    const x = gridX + (i % cols) * cell, y = gridY + Math.floor(i / cols) * cell;
    drawSigil(g, e, x + cell * 0.08, y + cell * 0.08, cell * 0.84, TRACK_INK[e.track].night);
  });
  g.fillStyle = '#d4f77a'; g.font = `500 30px ${f.mono}`; g.textAlign = 'left';
  g.fillText(`GALLERY ${era.numeral} · ${era.label}`, 90, 170);
  g.fillStyle = '#ede8dc'; g.font = `italic 128px ${f.serif}`;
  wrap(g, era.title, 700).forEach((line, i) => g.fillText(line, 84, 330 + i * 130));
  g.fillStyle = '#dcd7ca'; g.font = `34px ${f.serif}`;
  wrap(g, era.description, 680).forEach((line, i) => g.fillText(line, 90, 700 + i * 46));
  g.fillStyle = '#7b766c'; g.font = `500 26px ${f.mono}`;
  g.fillText(`${list.length} EXHIBITS · GREETINGS FROM THE AGI MUSEUM`, 90, H - 90);
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag mono"><i aria-hidden="true" />{children}</span>;
}

export default function Shop() {
  const router = useRouter();
  const { toast } = useMuseum();
  const [palette, setPalette] = useState(false);
  const [exhibit, setExhibit] = useState(events.find(e => e.id === 'exhibit-01')!);
  const [theme, setTheme] = useState<Theme>('night');
  const poster = useRef<HTMLCanvasElement>(null);
  const cards = useRef<(HTMLCanvasElement | null)[]>([]);

  // Drawing waits for the web fonts; a newer selection discards an older pending draw.
  useEffect(() => {
    let live = true;
    void siteFonts().then(f => { if (live && poster.current) drawPoster(poster.current, exhibit, theme, f); });
    return () => { live = false; };
  }, [exhibit, theme]);
  useEffect(() => {
    let live = true;
    void siteFonts().then(f => { if (live) cards.current.forEach((c, i) => { if (c) drawPostcard(c, i, f); }); });
    return () => { live = false; };
  }, []);

  const save = async (c: HTMLCanvasElement | null, name: string) => {
    if (!c) return;
    if (await download(c, name)) { passport.mark('shop'); toast('Saved. Thank you for visiting the shop'); }
    else toast('Could not create the image');
  };

  return (
    <>
      <Header onSearch={() => setPalette(true)} />
      <main className="shop">
        <section className="pp-hero shell" aria-labelledby="shop-title">
          <p className="mono pp-kicker">THE GIFT SHOP · EVERYTHING IS FREE</p>
          <RevealLines as="h1" id="shop-title" className="pp-title serif" play lines={[<span key="a">Exit through</span>, <span key="b"><em>the gift shop.</em></span>]} />
          <p className="pp-lede">Posters, postcards and a printable pocket timeline, generated from the collection itself. Nothing is for sale: every item downloads straight to your device, at print resolution.</p>
        </section>

        <section className="shop-shelf shell" aria-labelledby="poster-title">
          <div className="shelf-art poster-frame">
            <canvas ref={poster} className={`poster-canvas ${theme}`} aria-label={`Poster for exhibit ${accession(exhibit)}, ${exhibit.title}`} role="img" />
          </div>
          <div className="shelf-copy">
            <Tag>FREE · 2400 × 3200 PNG</Tag>
            <h2 id="poster-title" className="serif shelf-title">The accession poster</h2>
            <p className="shelf-lede">Every exhibit has a sigil generated from its date, thread and accession number, and no two are alike. Pick one and take it home.</p>
            <label className="shelf-field">
              <span className="mono">EXHIBIT</span>
              <select value={exhibit.id} onChange={e => setExhibit(events.find(x => x.id === e.target.value)!)}>
                {eras.map((era, i) => (
                  <optgroup key={era.numeral} label={`Gallery ${era.numeral} · ${era.title}`}>
                    {eraEvents(i).map(e => <option key={e.id} value={e.id}>{e.year} · {e.title}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="ws-toolbar">
              <div className="ws-seg" role="radiogroup" aria-label="Paper">
                {(['night', 'paper'] as Theme[]).map(t => <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>{t === 'night' ? 'Night' : 'Paper'}</button>)}
              </div>
              <button className="icon-btn round" onClick={() => setExhibit(events[Math.floor(Math.random() * events.length)])} aria-label="Pick a random exhibit" title="Surprise me"><Shuffle size={15} /></button>
            </div>
            <button className="btn btn-primary" onClick={() => save(poster.current, `agi-museum-${exhibit.id}-${theme}.png`)}><span>Download the poster</span><Download size={16} /></button>
          </div>
        </section>

        <section className="shop-cards shell" aria-labelledby="cards-title">
          <div className="shelf-head">
            <Tag>FREE · 1800 × 1200 PNG</Tag>
            <h2 id="cards-title" className="serif shelf-title">Postcards from the galleries</h2>
            <p className="shelf-lede">One for each gallery, gathering the sigils of every exhibit inside it.</p>
          </div>
          <ul className="postcards">
            {eras.map((era, i) => (
              <Reveal as="li" key={era.numeral} delay={(i % 3) * 0.06}>
                <button className="postcard" onClick={() => save(cards.current[i], `agi-museum-gallery-${era.numeral}.png`)} aria-label={`Download the postcard for Gallery ${era.numeral}, ${era.title}`} data-cursor="Save">
                  <canvas ref={el => { cards.current[i] = el; }} aria-hidden="true" />
                  <span className="postcard-foot"><span className="mono">GALLERY {era.numeral}</span><span className="serif">{era.title}</span><Download size={15} /></span>
                </button>
              </Reveal>
            ))}
          </ul>
        </section>

        <section className="shop-shelf shop-more shell" aria-label="More to take home">
          <Link href="/shop/handout" className="shop-item">
            <Tag>FREE · PRINT AT HOME</Tag>
            <Printer size={28} />
            <span className="serif">The pocket timeline</span>
            <span>All {events.length} exhibits on one sheet of paper, grouped by gallery, with their evidence labels.</span>
            <span className="mono shop-go">OPEN AND PRINT <ArrowUpRight size={13} /></span>
          </Link>
          <Link href="/passport" className="shop-item">
            <Tag>FREE · EARNED, NOT BOUGHT</Tag>
            <span className="shop-ticket mono" aria-hidden="true">ADMIT ONE</span>
            <span className="serif">Your ticket stub</span>
            <span>A keepsake of your visit, printed with the stamps in your passport.</span>
            <span className="mono shop-go">TO YOUR PASSPORT <ArrowUpRight size={13} /></span>
          </Link>
          <Link href="/stand" className="shop-item">
            <Tag>FREE · ONE PER OPINION</Tag>
            <span className="shop-dot" aria-hidden="true" />
            <span className="serif">Where I stand</span>
            <span>A card that places you on the museum’s map of the acceleration debate.</span>
            <span className="mono shop-go">TAKE A STAND <ArrowUpRight size={13} /></span>
          </Link>
        </section>
      </main>
      <Footer />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={(e: Event) => router.push(`/exhibit/${e.id}`)} />
    </>
  );
}
