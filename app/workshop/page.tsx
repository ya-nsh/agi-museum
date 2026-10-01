import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Workshop from './workshop';

export const metadata: Metadata = pageMetadata({
  title: 'The Workshop',
  description: 'Hands-on reconstructions from the AGI Museum: wire a 1943 logical neuron, train a perceptron, talk to ELIZA, sit in the Chinese Room, watch backpropagation learn and teach a machine your taste.',
  path: '/workshop',
});

export default function WorkshopPage() { return <Workshop />; }
