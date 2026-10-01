import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { entities, entityBySlug } from '@/data/people';
import { pageMetadata } from '@/lib/seo';
import PersonView from './person-view';

export const dynamicParams = false;
export function generateStaticParams() {
  return entities.map(e => ({ slug: e.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ent = entityBySlug(slug);
  if (!ent) return {};
  const n = ent.exhibits.length;
  const description = `${ent.name} appears in ${n} exhibit${n === 1 ? '' : 's'} at the AGI Museum: ${ent.exhibits.map(e => `${e.title} (${e.year})`).join('; ')}.`;
  return pageMetadata({ title: ent.name, description, path: `/people/${ent.slug}`, type: ent.kind === 'person' ? 'profile' : 'website' });
}

export default async function PersonPage({ params }: Props) {
  const { slug } = await params;
  if (!entityBySlug(slug)) notFound();
  return <PersonView slug={slug} />;
}
