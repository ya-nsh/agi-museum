import { computePoints } from '@/data/compute';
import { perspectives } from '@/data/perspectives';
import { eras, events, type Event } from './museum';

// Time is counted in months since January of year 0, so 1997-05 is 1997 * 12 + 4.
// Exhibits dated only by year or month count from the start of that period.
export const monthOf = (date: string) => {
  const [y, m] = date.split('-').map(Number);
  return y * 12 + (m ? m - 1 : 0);
};
export const START = monthOf(events[0].date.slice(0, 4));
export const END = monthOf(events[events.length - 1].date);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthLabel = (t: number) => `${MONTHS[t % 12]} ${Math.floor(t / 12)}`;
export const monthKey = (t: number) => `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
export const parseKey = (key: string) => (/^\d{4}-(0[1-9]|1[0-2])$/.test(key) ? Math.min(END, Math.max(START, monthOf(key))) : null);

const eventMonths = events.map(e => monthOf(e.date));

/** Exhibits on or before month t, oldest first. */
export const knownAt = (t: number) => events.filter((_, i) => eventMonths[i] <= t);
export const futureAt = (t: number) => events.filter((_, i) => eventMonths[i] > t);
export const eraAt = (t: number) => Math.max(0, eras.findIndex(r => Math.floor(t / 12) >= r.start && Math.floor(t / 12) <= r.end));

/** The largest training run in the compute dataset published by the end of month t (log10 FLOP). */
export function frontierAt(t: number) {
  const cutoff = (t + 1) / 12;
  let best: number | null = null;
  for (const [year, flop] of computePoints) if (year < cutoff && (best === null || flop > best)) best = flop;
  return best;
}
export const frontierToday = Math.max(...computePoints.map(p => p[1]));

// When each perspective on the debate map first appears in this collection.
// "First appears here" is a statement about the collection, not a claim that
// nobody held the view earlier.
const PERSPECTIVE_DEBUT: Record<string, string> = {
  Alignment: 'exhibit-07',
  'e/acc': 'exhibit-17',
  'Open models': 'exhibit-95',
  Pause: 'exhibit-21',
  'd/acc': 'exhibit-27',
  'National strategy': 'exhibit-29',
};
export const perspectiveDebuts = perspectives.map(p => {
  const e = events.find(x => x.id === PERSPECTIVE_DEBUT[p.name])!;
  return { perspective: p, event: e, month: monthOf(e.date) };
});

/** The most recent forecast or philosophical argument on the shelf at month t. */
export const latestForecastAt = (t: number): Event | undefined =>
  knownAt(t).filter(e => e.status === 'Forecast / philosophy').at(-1);

/** Every month that holds at least one exhibit, for the scrubber's tick marks. */
export const eventTicks = [...new Set(eventMonths)].sort((a, b) => a - b);
