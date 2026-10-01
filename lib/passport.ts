import { useSyncExternalStore } from 'react';
import { eras, eraOf, events } from './museum';

// The visitor's passport lives only in this browser. It records which exhibits
// were opened and which wings were visited, and turns them into stamps.

export type PassportState = { seen: string[]; marks: string[]; since: string | null };
export type Mark = 'timeline' | 'stand' | 'time-machine' | 'people' | 'pairs' | 'shop' | 'today' | `workshop:${string}` | `source:${string}`;

const KEY = 'agi-museum-passport';
const EMPTY: PassportState = { seen: [], marks: [], since: null };
const listeners = new Set<() => void>();
let cache: PassportState | null = null;

function load(): PassportState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && Array.isArray(raw.seen) && Array.isArray(raw.marks)) {
      return { seen: raw.seen.filter((x: unknown) => typeof x === 'string'), marks: raw.marks.filter((x: unknown) => typeof x === 'string'), since: typeof raw.since === 'string' ? raw.since : null };
    }
  } catch { /* storage unavailable or corrupted */ }
  return EMPTY;
}

function save(next: PassportState) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  listeners.forEach(cb => cb());
}

const get = () => (cache ??= load());

function update(fn: (s: PassportState) => PassportState) {
  const prev = get();
  const next = fn(prev);
  if (next !== prev) save({ ...next, since: next.since ?? new Date().toISOString().slice(0, 10) });
}

export const passport = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    // Another tab updated the passport.
    const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) { cache = null; cb(); } };
    addEventListener('storage', onStorage);
    return () => { listeners.delete(cb); removeEventListener('storage', onStorage); };
  },
  get,
  seeExhibit(id: string) { update(s => (s.seen.includes(id) ? s : { ...s, seen: [...s.seen, id] })); },
  mark(m: Mark) { update(s => (s.marks.includes(m) ? s : { ...s, marks: [...s.marks, m] })); },
  reset() { save(EMPTY); },
};

export const usePassport = () => useSyncExternalStore(passport.subscribe, passport.get, () => EMPTY);

export type Stamp = { id: string; title: string; sub: string; need: number; href: string; gallery?: number; ink: string };
const GALLERY_INKS = ['#d4f77a', '#f4d06f', '#7fd6c8', '#ff9f7a', '#c4a8ff', '#ede8dc'];

export const stamps: Stamp[] = [
  ...eras.map((e, i) => ({ id: `gallery-${i + 1}`, title: `Gallery ${e.numeral}`, sub: e.title, need: 3, href: '/#galleries', gallery: i, ink: GALLERY_INKS[i] })),
  { id: 'timeline', title: 'The long walk', sub: 'Entered the complete timeline', need: 1, href: '/timeline', ink: '#ede8dc' },
  { id: 'workshop', title: 'Workshop', sub: 'Tried three hands-on specimens', need: 3, href: '/workshop', ink: '#7fd6c8' },
  { id: 'stand', title: 'Took a stand', sub: 'Placed yourself on the debate map', need: 1, href: '/stand', ink: '#d4f77a' },
  { id: 'time-machine', title: 'Time traveler', sub: 'Visited the past in the time machine', need: 1, href: '/time-machine', ink: '#c4a8ff' },
  { id: 'people', title: 'Who’s who', sub: 'Met the people behind the exhibits', need: 1, href: '/people', ink: '#f4d06f' },
  { id: 'pairs', title: 'Pendants', sub: 'Compared exhibits side by side', need: 1, href: '/pairs', ink: '#ff9f7a' },
  { id: 'evidence', title: 'Follow the evidence', sub: 'Opened five original sources', need: 5, href: '/#collection', ink: '#7fd6c8' },
  { id: 'today', title: 'On this day', sub: 'Opened an anniversary exhibit', need: 1, href: '/#today', ink: '#f4d06f' },
  { id: 'shop', title: 'Gift shop', sub: 'Took something home', need: 1, href: '/shop', ink: '#ff9f7a' },
  { id: 'completist', title: 'The whole collection', sub: `Opened all ${events.length} exhibits`, need: events.length, href: '/timeline', ink: '#d4f77a' },
];

const eraIndex = new Map(events.map(e => [e.id, eraOf(e)]));

/** How far along each stamp is, from 0 to its requirement. */
export function progress(s: PassportState, stamp: Stamp) {
  const count = (prefix: string) => s.marks.filter(m => m.startsWith(prefix)).length;
  const valid = s.seen.filter(id => eraIndex.has(id));
  let n: number;
  if (stamp.gallery !== undefined) n = valid.filter(id => eraIndex.get(id) === stamp.gallery).length;
  else if (stamp.id === 'workshop') n = count('workshop:');
  else if (stamp.id === 'evidence') n = count('source:');
  else if (stamp.id === 'completist') n = valid.length;
  else n = s.marks.includes(stamp.id) ? 1 : 0;
  return Math.min(n, stamp.need);
}

export const earned = (s: PassportState) => stamps.filter(st => progress(s, st) >= st.need);
