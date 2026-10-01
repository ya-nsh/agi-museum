import Link from 'next/link';
import { Fragment } from 'react';
import { creditLinks } from '@/data/people';
import type { Event } from '@/lib/museum';

/** "Warren McCulloch · Walter Pitts", with each name linking to its page in the people index. */
export function Credits({ event, onNavigate }: { event: Event; onNavigate?: () => void }) {
  return (
    <>
      {creditLinks(event).map((c, i) => (
        <Fragment key={c.label}>
          {i > 0 && ' · '}
          {c.slug ? <Link className="credit-link" href={`/people/${c.slug}`} onClick={onNavigate}>{c.label}</Link> : c.label}
        </Fragment>
      ))}
    </>
  );
}
