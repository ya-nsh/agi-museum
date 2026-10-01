import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Handout from './handout';

export const metadata: Metadata = pageMetadata({
  title: 'The Pocket Timeline',
  description: 'Every exhibit in the AGI Museum on one printable sheet, grouped by gallery, with dates and evidence labels.',
  path: '/shop/handout',
});

export default function HandoutPage() { return <Handout />; }
