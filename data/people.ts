import { events, type Event } from './events';

// The people and institutions behind the collection, derived from each
// exhibit's "people" field. A small curated layer merges aliases, separates
// people from institutions and drops placeholders such as "signatories".

export type EntityKind = 'person' | 'institution';
export type Entity = { slug: string; name: string; kind: EntityKind; note?: string; exhibits: Event[] };

// Credits that describe a crowd rather than a nameable participant.
const PLACEHOLDERS = new Set([
  'founding team', 'research coauthors', 'signatories', 'conference participants', 'scenario authors',
  'academic collaborators', 'IMO coordinators', 'national authorities', 'US federal agencies',
  'Researchers', 'developers', 'policymakers', 'the public', 'international expert advisory panel',
  'e/acc community', 'Effective altruism community', 'ECMWF data contributors', 'Participating governments',
]);

// Different spellings of the same participant. Pseudonyms are merged only
// where the collection itself documents the identity (exhibit 28).
const ALIASES: Record<string, string> = {
  DeepMind: 'Google DeepMind',
  'Google DeepMind researchers': 'Google DeepMind',
  'AlphaFold team': 'Google DeepMind',
  'AlphaEvolve team': 'Google DeepMind',
  'AlphaMissense researchers': 'Google DeepMind',
  'AlphaProof and AlphaGeometry teams': 'Google DeepMind',
  'OpenAI researchers': 'OpenAI',
  'OpenAI research team': 'OpenAI',
  'OpenAI board and employees': 'OpenAI',
  'Anthropic Institute': 'Anthropic',
  'Meta AI': 'Meta',
  Google: 'Google Research',
  'IBM Research': 'IBM',
  'IBM Deep Blue team': 'IBM',
  'Sir James Lighthill': 'James Lighthill',
  'Beff Jezos': 'Guillaume Verdon',
  BasedBeffJezos: 'Guillaume Verdon',
  'US administration': 'The White House',
  'European Commission': 'European Union',
};

const NOTES: Record<string, string> = {
  'Google DeepMind': 'Credited as DeepMind before its 2023 merger with Google Brain.',
  'Guillaume Verdon': 'Also credited under the pseudonyms Beff Jezos and BasedBeffJezos.',
  'European Union': 'Includes credits to the European Commission.',
  'The White House': 'Includes credits to the US administration.',
  OpenAI: 'Includes credits to its researchers, research team, board and employees.',
  Anthropic: 'Includes credits to the Anthropic Institute.',
  IBM: 'Includes IBM Research and the Deep Blue team.',
};

const INSTITUTIONS = new Set([
  'Google DeepMind', 'OpenAI', 'Anthropic', 'Meta', 'Google Research', 'IBM', 'MIT', 'Bell Labs', 'CCRU',
  'Cornell Aeronautical Laboratory', 'UK Science Research Council', 'Université de Montréal', 'Future of Life Institute',
  'Center for AI Safety', 'Stability AI', 'CompVis at LMU Munich', 'Runway', 'The White House', 'UK AI Safety Summit',
  'Isomorphic Labs', 'European Union', 'California legislature', 'Royal Swedish Academy of Sciences', 'Redwood Research',
  'DeepSeek', 'SoftBank', 'Oracle', 'MGX', 'METR', 'AI Futures Project',
]);

export const slugify = (name: string) =>
  name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const canonical = (raw: string) => ALIASES[raw] ?? raw;

/** The canonical credits on one exhibit, in order, without placeholders or duplicates. */
export function creditsOf(e: Event): string[] {
  const out: string[] = [];
  for (const raw of e.people.split('·').map(s => s.trim()).filter(Boolean)) {
    if (PLACEHOLDERS.has(raw)) continue;
    const name = canonical(raw);
    if (!out.includes(name)) out.push(name);
  }
  return out;
}

function build() {
  const map = new Map<string, Entity>();
  for (const e of events) {
    for (const name of creditsOf(e)) {
      let ent = map.get(name);
      if (!ent) {
        ent = { slug: slugify(name), name, kind: INSTITUTIONS.has(name) ? 'institution' : 'person', note: NOTES[name], exhibits: [] };
        map.set(name, ent);
      }
      ent.exhibits.push(e);
    }
  }
  return [...map.values()].sort((a, b) => b.exhibits.length - a.exhibits.length || a.name.localeCompare(b.name));
}

export const entities: Entity[] = build();
const bySlug = new Map(entities.map(e => [e.slug, e]));
const byName = new Map(entities.map(e => [e.name, e]));
export const entityBySlug = (slug: string) => bySlug.get(slug);
export const entityByName = (name: string) => byName.get(canonical(name));

/** Who shares exhibits with this entity, and how often. */
export function collaborators(ent: Entity) {
  const counts = new Map<Entity, number>();
  for (const e of ent.exhibits) {
    for (const name of creditsOf(e)) {
      const other = byName.get(name);
      if (other && other !== ent) counts.set(other, (counts.get(other) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([entity, shared]) => ({ entity, shared }))
    .sort((a, b) => b.shared - a.shared || a.entity.name.localeCompare(b.entity.name));
}

/** Surname-first sort key for people; institutions sort by their name. */
export const sortKey = (ent: Entity) => {
  if (ent.kind === 'institution') return ent.name.replace(/^The /, '').toLowerCase();
  const parts = ent.name.split(' ');
  return (parts.length > 1 ? `${parts[parts.length - 1]} ${parts.slice(0, -1).join(' ')}` : ent.name).toLowerCase();
};

/** An exhibit's credits as written, each linked to its entity when it has one. */
export function creditLinks(e: Event): { label: string; slug?: string }[] {
  return e.people.split('·').map(s => s.trim()).filter(Boolean).map(raw => {
    if (PLACEHOLDERS.has(raw)) return { label: raw };
    return { label: raw, slug: byName.get(canonical(raw))?.slug };
  });
}
