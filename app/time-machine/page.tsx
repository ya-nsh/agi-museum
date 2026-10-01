import type { Metadata } from 'next';
import TimeMachine from './time-machine';

export const metadata: Metadata = {
  title: 'The Time Machine',
  description: 'Pick any month from 1943 to September 2026 and see the AGI Museum as it stood then: the latest news, the largest training run, the perspectives in the debate, and what was still in the future.',
  alternates: { canonical: '/time-machine' },
};

export default function TimeMachinePage() { return <TimeMachine />; }
