import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { events } from '@/data/events';
import { formatDate } from '@/lib/museum';
import ExhibitView from './exhibit-view';

export const dynamicParams = false;
export function generateStaticParams() {
  return events.map(e => ({ id: e.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const e = events.find(x => x.id === id);
  if (!e) return {};
  const title = `${e.title} (${e.year})`;
  return {
    title,
    description: e.summary,
    openGraph: { title: `${title} — AGI Museum`, description: `${formatDate(e.date)} · ${e.track} · ${e.status}. ${e.summary}`, type: 'article' },
    alternates: { canonical: `/exhibit/${e.id}` },
  };
}

export default async function ExhibitPage({ params }: Props) {
  const { id } = await params;
  if (!events.some(e => e.id === id)) notFound();
  return <ExhibitView id={id} />;
}
