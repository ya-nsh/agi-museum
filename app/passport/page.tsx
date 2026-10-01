import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Passport from './passport';

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Your Passport',
    description: 'Collect stamps as you explore the AGI Museum’s galleries and wings. Your passport stays in your browser.',
    path: '/passport',
  }),
  robots: { index: false },
};

export default function PassportPage() { return <Passport />; }
