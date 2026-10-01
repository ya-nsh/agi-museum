import type { Metadata } from 'next';
import Stand from './stand';

export const metadata: Metadata = {
  title: 'Where Do You Stand?',
  description: 'Eight statements about the pace of AI and who should hold its power. Find your place on the AGI Museum’s map of the acceleration debate, beside e/acc, alignment, pause, d/acc, open models and national strategy.',
  alternates: { canonical: '/stand' },
};

export default function StandPage() { return <Stand />; }
