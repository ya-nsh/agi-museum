import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Stand from './stand';

export const metadata: Metadata = pageMetadata({
  title: 'Where Do You Stand?',
  description: 'Eight statements about the pace of AI and who should hold its power. Find your place on the AGI Museum’s map of the acceleration debate, beside e/acc, alignment, pause, d/acc, open models and national strategy.',
  path: '/stand',
});

export default function StandPage() { return <Stand />; }
