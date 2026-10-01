import type { Metadata } from 'next';
import { events } from '@/data/events';

export const SITE_URL = 'https://agi-museum.vercel.app';
export const SITE_TITLE = 'AGI Museum — The making of intelligence';
export const SITE_DESCRIPTION = `An interactive, source-backed museum of the road to artificial general intelligence: ${events.length} exhibits from 1943 to September 2026, spanning breakthroughs, ideas, institutions and governance.`;
export const OG_IMAGE = { url: '/og.jpg', width: 1200, height: 630, alt: 'A luminous filament crossing a dark gallery, from punched paper and vacuum tubes to a crystalline neural sculpture' };

/**
 * Metadata for one page. Next.js replaces (not merges) the openGraph and
 * twitter objects of parent layouts, so every page states them in full here:
 * otherwise a page that sets only its own title loses the share image.
 */
export function pageMetadata({ title, description, path, type = 'website' }: { title: string; description: string; path: string; type?: 'website' | 'article' | 'profile' }): Metadata {
  const full = `${title} — AGI Museum`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: full, description, url: path, images: [OG_IMAGE], type, siteName: 'AGI Museum', locale: 'en_US' },
    twitter: { card: 'summary_large_image', title: full, description, images: [OG_IMAGE] },
  };
}
