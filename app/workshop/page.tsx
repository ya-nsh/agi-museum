import type { Metadata } from 'next';
import Workshop from './workshop';

export const metadata: Metadata = {
  title: 'The Workshop',
  description: 'Hands-on reconstructions from the AGI Museum: wire a 1943 logical neuron, train a perceptron, talk to ELIZA, sit in the Chinese Room, watch backpropagation learn and teach a machine your taste.',
  alternates: { canonical: '/workshop' },
};

export default function WorkshopPage() { return <Workshop />; }
