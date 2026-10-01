'use client';

import Link from 'next/link';
import { ArrowUpRight, Columns2, Footprints, Hand, Hourglass, MapPin, ShoppingBag, Stamp, Users, type LucideIcon } from 'lucide-react';
import { entities } from '@/data/people';
import { pairs } from '@/data/pairs';
import { specimens } from '@/data/workshop';
import { events } from '@/lib/museum';
import { earned, stamps, usePassport } from '@/lib/passport';
import { Eyebrow, Reveal, RevealLines } from './reveal';

type Room = { href: string; room: string; title: string; text: string; icon: LucideIcon; stat: string };

/** A floor plan of the museum's wings, one room per page. */
export function Directory() {
  const got = earned(usePassport()).length;
  const rooms: Room[] = [
    { href: '/timeline', room: 'A', title: 'The long gallery', text: 'Every exhibit in one continuous reading, oldest first.', icon: Footprints, stat: `${events.length} exhibits` },
    { href: '/workshop', room: 'B', title: 'The workshop', text: 'Hands-on reconstructions, from a 1943 neuron to reward hacking.', icon: Hand, stat: `${specimens.length} specimens` },
    { href: '/time-machine', room: 'C', title: 'The time machine', text: 'Stand in any month since 1943 and see only what had happened.', icon: Hourglass, stat: '1943 → 2026' },
    { href: '/people', room: 'D', title: 'Who’s who', text: 'The people and institutions behind the exhibits, and who worked with whom.', icon: Users, stat: `${entities.length} names` },
    { href: '/pairs', room: 'E', title: 'Pendants', text: 'Exhibits from different decades, hung side by side.', icon: Columns2, stat: `${pairs.length} pairs` },
    { href: '/stand', room: 'F', title: 'Where do you stand?', text: 'Eight statements that place you on the map of the debate.', icon: MapPin, stat: '8 statements' },
    { href: '/shop', room: 'G', title: 'The gift shop', text: 'Posters, postcards and a pocket timeline. Everything is free.', icon: ShoppingBag, stat: 'Free' },
    { href: '/passport', room: 'H', title: 'Your passport', text: 'Stamps for every gallery and wing you explore.', icon: Stamp, stat: `${got} / ${stamps.length} stamps` },
  ];
  return (
    <section id="directory" className="directory shell" aria-labelledby="directory-title">
      <div className="section-head">
        <div>
          <Eyebrow index="08">THE DIRECTORY</Eyebrow>
          <RevealLines id="directory-title" className="section-title serif" lines={[<span key="a">More rooms</span>, <span key="b"><em>to explore.</em></span>]} />
        </div>
        <p className="section-lede">The collection is only the main hall. Beyond it are rooms for touching, traveling, comparing and taking a piece of the museum home.</p>
      </div>
      <ul className="floorplan">
        {rooms.map((r, i) => (
          <Reveal as="li" key={r.href} delay={(i % 4) * 0.05}>
            <Link href={r.href} className="room-tile" data-cursor="Enter">
              <span className="room-top mono"><span>ROOM {r.room}</span><span>{r.stat.toUpperCase()}</span></span>
              <r.icon size={26} strokeWidth={1.4} className="room-icon" />
              <span className="room-title serif">{r.title}</span>
              <span className="room-text">{r.text}</span>
              <ArrowUpRight size={16} className="room-arrow" />
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
