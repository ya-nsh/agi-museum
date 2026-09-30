import { events, eras, eraOf, type Event } from '@/data/events';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Dates are stored as 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD'; format only the precision we have. */
export function formatDate(date: string, short = false) {
  const [y, m, d] = date.split('-');
  if (!m) return y;
  const month = short ? MONTHS[Number(m) - 1].slice(0, 3) : MONTHS[Number(m) - 1];
  return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
}

export const accession = (e: Event) => e.id.replace('exhibit-', '');
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-');

export const statusShort: Record<Event['status'], string> = {
  'Historical event': 'Archive',
  'Research finding': 'Research',
  'Forecast / philosophy': 'Perspective',
  'Company claim': 'Reported claim',
};

export const statusNote: Record<Event['status'], string> = {
  'Historical event': 'Something that demonstrably happened: a meeting, a release, a law, a match.',
  'Research finding': 'A published result. Findings can be superseded, narrowed or contested.',
  'Forecast / philosophy': 'An argument, prediction or worldview. Influential is not the same as correct.',
  'Company claim': 'Reported by the organization that made it, pending independent verification.',
};

export function neighbours(e: Event) {
  const i = events.indexOf(e);
  return { prev: events[i - 1] ?? null, next: events[i + 1] ?? null, index: i };
}

/** Related exhibits: same thread, nearest in time, excluding the exhibit itself. */
export function related(e: Event, count = 3) {
  return events
    .filter(x => x !== e && x.track === e.track)
    .map(x => ({ x, d: Math.abs(x.year - e.year) + (eraOf(x) === eraOf(e) ? 0 : 3) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map(r => r.x);
}

export const firstYear = events[0].year;
export const lastYear = events[events.length - 1].year;
export const sourceCount = new Set(events.map(e => e.source)).size;
export const spanYears = lastYear - firstYear;

export function eraEvents(i: number) {
  return events.filter(e => eraOf(e) === i);
}

/** Small deterministic PRNG, so generative artwork is identical on server and client. */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function inWords(n: number) {
  if (n < 20) return NUMBER_WORDS[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + NUMBER_WORDS[n % 10] : '');
  return String(n);
}

export { events, eras, eraOf };
export type { Event };
