import type { Metadata } from 'next';
import Handout from './handout';

export const metadata: Metadata = {
  title: 'The Pocket Timeline',
  description: 'Every exhibit in the AGI Museum on one printable sheet, grouped by gallery, with dates and evidence labels.',
  alternates: { canonical: '/shop/handout' },
};

export default function HandoutPage() { return <Handout />; }
