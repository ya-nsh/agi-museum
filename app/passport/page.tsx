import type { Metadata } from 'next';
import Passport from './passport';

export const metadata: Metadata = {
  title: 'Your Passport',
  description: 'Collect stamps as you explore the AGI Museum’s galleries and wings. Your passport stays in your browser.',
  alternates: { canonical: '/passport' },
  robots: { index: false },
};

export default function PassportPage() { return <Passport />; }
