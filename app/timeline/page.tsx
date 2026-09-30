import type { Metadata } from 'next';
import Timeline from './timeline';
import { events } from '@/data/events';

export const metadata: Metadata = {
  title: 'The Complete Timeline',
  description: `Follow all ${events.length} sourced exhibits in one continuous timeline: the breakthroughs, ideas, institutions and decisions shaping the path toward AGI, 1943 to September 2026.`,
};

export default function TimelinePage() { return <Timeline />; }
