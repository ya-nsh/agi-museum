import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import People from './people';
import { entities } from '@/data/people';

export const metadata: Metadata = pageMetadata({
  title: 'Who’s Who',
  description: `The ${entities.length} people and institutions credited across the AGI Museum, from Warren McCulloch to the frontier labs, with the exhibits each appears in.`,
  path: '/people',
});

export default function PeoplePage() { return <People />; }
