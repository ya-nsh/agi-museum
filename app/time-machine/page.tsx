import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import TimeMachine from './time-machine';

export const metadata: Metadata = pageMetadata({
  title: 'The Time Machine',
  description: 'Pick any month from 1943 to September 2026 and see the AGI Museum as it stood then: the latest news, the largest training run, the perspectives in the debate, and what was still in the future.',
  path: '/time-machine',
});

export default function TimeMachinePage() { return <TimeMachine />; }
