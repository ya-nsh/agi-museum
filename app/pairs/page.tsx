import type { Metadata } from 'next';
import Pairs from './pairs';
import { pairs } from '@/data/pairs';

export const metadata: Metadata = {
  title: 'Pendants',
  description: `${pairs.length} pairs of exhibits hung side by side across the decades, from Deep Blue and AlphaGo to the pause letter and a lab that chose to slow down.`,
  alternates: { canonical: '/pairs' },
};

export default function PairsPage() { return <Pairs />; }
