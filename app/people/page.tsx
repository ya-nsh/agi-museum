import type { Metadata } from 'next';
import People from './people';
import { entities } from '@/data/people';

export const metadata: Metadata = {
  title: 'Who’s Who',
  description: `The ${entities.length} people and institutions credited across the AGI Museum, from Warren McCulloch to the frontier labs, with the exhibits each appears in.`,
  alternates: { canonical: '/people' },
};

export default function PeoplePage() { return <People />; }
