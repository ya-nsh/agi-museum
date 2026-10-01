'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect } from 'react';
import { eraEvents, eras, events, formatDate, lastYear, sourceCount, statusShort } from '@/lib/museum';
import { passport } from '@/lib/passport';

/** A single printable sheet: every exhibit, grouped by gallery. Designed for paper first. */
export default function Handout() {
  useEffect(() => {
    const onPrint = () => passport.mark('shop');
    addEventListener('beforeprint', onPrint);
    return () => removeEventListener('beforeprint', onPrint);
  }, []);
  return (
    <div className="handout-page">
      <div className="handout-bar">
        <Link href="/shop" className="icon-btn"><ArrowLeft size={15} />Back to the shop</Link>
        <button className="icon-btn active" onClick={() => print()}><Printer size={15} />Print or save as PDF</button>
      </div>
      <article className="handout">
        <header className="ho-head">
          <div>
            <p className="ho-kicker">AGI MUSEUM · THE POCKET TIMELINE</p>
            <h1>The making of intelligence, 1943–{lastYear}</h1>
          </div>
          <p className="ho-meta">{events.length} exhibits · {sourceCount} primary sources · curated through 9 September {lastYear}</p>
        </header>
        <p className="ho-key"><b>Archive</b> happened · <b>Research</b> published result · <b>Perspective</b> argument or forecast · <b>Reported claim</b> by the organization itself</p>
        <div className="ho-cols">
          {eras.map((era, i) => (
            <section key={era.numeral} className="ho-era">
              <h2><span>{era.numeral}</span> {era.title} <small>{era.label}</small></h2>
              <ol>
                {eraEvents(i).map(e => (
                  <li key={e.id}>
                    <span className="ho-date">{formatDate(e.date, true)}</span>
                    <span className="ho-title">{e.title}</span>
                    <span className="ho-label">{statusShort[e.status]}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
        <footer className="ho-foot">agi-museum.vercel.app · Every exhibit links to its original source. Forecasts and company claims are labeled as such.</footer>
      </article>
    </div>
  );
}
