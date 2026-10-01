'use client';

import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { events, formatDate, type Event } from '@/lib/museum';
import { passport } from '@/lib/passport';
import { Sigil } from './sigil';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY = 86400000;

// Only exhibits with an exact day have anniversaries.
const dated = events.filter(e => /^\d{4}-\d{2}-\d{2}$/.test(e.date)).map(e => {
  const [, m, d] = e.date.split('-').map(Number);
  return { e, m, d };
});

/** Midnight today, local time, as a number so the snapshot compares by value. Refreshes once a minute. */
const subscribeDay = (cb: () => void) => { const id = setInterval(cb, 60000); return () => clearInterval(id); };
const todayStamp = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(); };

function nextAnniversary(today: Date) {
  let best: { e: Event; days: number } | null = null;
  for (const { e, m, d } of dated) {
    let when = new Date(today.getFullYear(), m - 1, d);
    // 29 February rolls to 1 March in other years; that is close enough for a placard.
    if (when.getTime() <= today.getTime()) when = new Date(today.getFullYear() + 1, m - 1, d);
    const days = Math.round((when.getTime() - today.getTime()) / DAY);
    if (!best || days < best.days) best = { e, days };
  }
  return best;
}

/** A placard for the anniversaries in the collection, with a strip of this month's dated exhibits. */
export function OnThisDay({ onOpen }: { onOpen: (e: Event) => void }) {
  const stamp = useSyncExternalStore(subscribeDay, todayStamp, () => null);
  if (stamp === null) return <section id="today" className="otd shell otd-pending" aria-hidden="true" />;

  const today = new Date(stamp);
  const m = today.getMonth() + 1, d = today.getDate(), y = today.getFullYear();
  const exact = dated.filter(x => x.m === m && x.d === d).map(x => x.e);
  const next = exact.length ? null : nextAnniversary(today);
  const month = dated.filter(x => x.m === m);
  const days = new Date(y, m, 0).getDate();
  const open = (e: Event) => { passport.mark('today'); onOpen(e); };
  const feature = exact[0] ?? next?.e;

  return (
    <section id="today" className="otd shell" aria-labelledby="otd-title">
      <div className="otd-label">
        <p className="mono"><span className="live-dot" /> ON THIS DAY</p>
        <p id="otd-title" className="otd-date serif">{d} {MONTHS[m - 1]}</p>
      </div>
      {feature && (
        <button className={`otd-feature t-${feature.track.toLowerCase()}`} onClick={() => open(feature)} data-cursor="Open">
          <Sigil event={feature} className="otd-sigil" />
          <span className="otd-copy">
            <span className="mono otd-when">
              {exact.length ? `${y - feature.year} YEARS AGO TODAY · ${feature.year}` : `NOTHING IN THE COLLECTION HAPPENED TODAY · NEXT ANNIVERSARY IN ${next!.days} DAY${next!.days === 1 ? '' : 'S'}`}
            </span>
            <span className="otd-title serif">{feature.title}</span>
            <span className="otd-summary">{exact.length ? feature.summary : `${formatDate(feature.date)}. ${feature.summary}`}</span>
          </span>
          <ArrowUpRight size={20} className="otd-arrow" />
        </button>
      )}
      {exact.length > 1 && (
        <ul className="otd-more">
          {exact.slice(1).map(e => <li key={e.id}><button onClick={() => open(e)}><span className="mono">{e.year}</span>{e.title}</button></li>)}
        </ul>
      )}
      <div className="otd-strip" aria-label={`Dated exhibits in ${MONTHS[m - 1]}`}>
        {Array.from({ length: days }, (_, i) => {
          const hits = month.filter(x => x.d === i + 1).map(x => x.e);
          const isToday = i + 1 === d;
          return (
            <span key={i} className={`otd-day ${isToday ? 'today' : ''} ${hits.length ? 'has' : ''}`}>
              {hits.length
                ? <button onClick={() => open(hits[0])} title={hits.map(h => `${h.year} · ${h.title}`).join('\n')} aria-label={`${i + 1} ${MONTHS[m - 1]}: ${hits.map(h => h.title).join(', ')}`}>
                    <motion.i initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.015 }} />
                  </button>
                : <i aria-hidden="true" />}
              <b className="mono" aria-hidden="true">{i + 1}</b>
            </span>
          );
        })}
      </div>
    </section>
  );
}
