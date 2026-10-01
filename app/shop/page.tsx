import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Shop from './shop';

export const metadata: Metadata = pageMetadata({
  title: 'The Gift Shop',
  description: 'Free posters, gallery postcards and a printable pocket timeline, generated from the AGI Museum’s collection.',
  path: '/shop',
});

export default function ShopPage() { return <Shop />; }
