import type { Metadata } from 'next';
import Shop from './shop';

export const metadata: Metadata = {
  title: 'The Gift Shop',
  description: 'Free posters, gallery postcards and a printable pocket timeline, generated from the AGI Museum’s collection.',
  alternates: { canonical: '/shop' },
};

export default function ShopPage() { return <Shop />; }
