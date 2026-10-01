import type { MetadataRoute } from 'next';
import { events } from '@/data/events';
import { entities } from '@/data/people';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

const WINGS = ['/timeline', '/workshop', '/time-machine', '/people', '/pairs', '/stand', '/shop', '/shop/handout'];

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE_URL}${path}`;
  return [
    { url: url('/'), changeFrequency: 'weekly', priority: 1 },
    ...WINGS.map(path => ({ url: url(path), changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...events.map(e => ({ url: url(`/exhibit/${e.id}`), changeFrequency: 'yearly' as const, priority: 0.6 })),
    ...entities.map(e => ({ url: url(`/people/${e.slug}`), changeFrequency: 'yearly' as const, priority: 0.4 })),
  ];
}
