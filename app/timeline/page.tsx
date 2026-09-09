import type { Metadata } from 'next';
import Timeline from './timeline';
export const metadata: Metadata = {
  title: 'The Complete Timeline — AGI Museum',
  description: 'Follow all 51 sourced exhibits in one continuous vertical timeline: the breakthroughs, ideas, institutions and decisions shaping the path toward AGI, 1950–September 9, 2026.',
};
export default function TimelinePage() { return <Timeline />; }
