'use client';

import { Award, CalendarDays, Columns2, FileSearch, Footprints, Hand, Hourglass, MapPin, ShoppingBag, Users, type LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { eras, seeded } from '@/lib/museum';
import type { Stamp } from '@/lib/passport';

const ICONS: Record<string, LucideIcon> = {
  timeline: Footprints, workshop: Hand, stand: MapPin, 'time-machine': Hourglass, people: Users,
  pairs: Columns2, evidence: FileSearch, today: CalendarDays, shop: ShoppingBag, completist: Award,
};

/** A rubber stamp: ring text, a center mark and an uneven, inky texture. Unearned stamps are a dashed outline. */
export function StampMark({ stamp, earned, size = 132 }: { stamp: Stamp; earned: boolean; size?: number }) {
  const uid = useId().replace(/:/g, '');
  const r = seeded(stamp.id);
  const tilt = earned ? (r() * 2 - 1) * 14 : 0;
  const Icon = ICONS[stamp.id];
  const ring = `${stamp.title.toUpperCase()} · AGI MUSEUM · `;
  return (
    <svg className={`stamp ${earned ? 'earned' : 'ghost'}`} width={size} height={size} viewBox="0 0 120 120" role="img"
      aria-label={`${stamp.title}: ${earned ? 'stamped' : 'not yet stamped'}`} style={{ color: earned ? stamp.ink : undefined, rotate: `${tilt}deg` }}>
      <defs>
        <path id={`ring-${uid}`} d="M 60 60 m -42 0 a 42 42 0 1 1 84 0 a 42 42 0 1 1 -84 0" />
        {earned && (
          <>
            {/* Ink: wobble the edges, then knock out speckles where the stamp missed the paper. */}
            <filter id={`ink-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(r() * 100)} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d" />
              <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="3" seed={Math.floor(r() * 100)} result="speck" />
              <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="mask" />
              <feComposite in="d" in2="mask" operator="in" />
            </filter>
          </>
        )}
      </defs>
      <g filter={earned ? `url(#ink-${uid})` : undefined} fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="56" strokeWidth={earned ? 3 : 1.2} strokeDasharray={earned ? undefined : '4 5'} />
        <circle cx="60" cy="60" r="50" strokeWidth="1" opacity={earned ? 1 : 0.5} />
        <circle cx="60" cy="60" r="33" strokeWidth="1.2" opacity={earned ? 1 : 0.5} />
        <text fill="currentColor" stroke="none" fontFamily="var(--font-mono), monospace" fontSize="8.2" letterSpacing="1.6" fontWeight={500}>
          {/* Fit the ring text to the full circumference (2π · 42 ≈ 264). */}
          <textPath href={`#ring-${uid}`} textLength={262} lengthAdjust="spacing">{ring}</textPath>
        </text>
        {stamp.gallery !== undefined ? (
          <text x="60" y="71" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-serif), Georgia, serif" fontStyle="italic" fontSize="34">{eras[stamp.gallery].numeral}</text>
        ) : Icon ? (
          <Icon x={44} y={44} width={32} height={32} strokeWidth={1.6} />
        ) : null}
      </g>
    </svg>
  );
}
