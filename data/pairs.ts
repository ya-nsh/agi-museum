import { events, type Event } from './events';

// Pendants: two exhibits hung side by side because they rhyme across time.
// Each pairing is a curatorial interpretation. The notes draw only on what the
// two exhibits themselves record, and say what changed as well as what did not.
export type Pair = { id: string; a: string; b: string; title: string; note: string; changed: string; same: string };

export const pairs: Pair[] = [
  {
    id: 'two-boards', a: 'exhibit-06', b: 'exhibit-12', title: 'Checkmate, then Go',
    note: 'Two world champions lose to machines in front of an audience, nineteen years apart.',
    changed: 'Deep Blue relied on massive search guided by an evaluation function crafted by its engineers. AlphaGo combined search with neural networks trained through reinforcement learning.',
    same: 'Both victories came in bounded games with fixed rules. Neither machine was a step outside its board.',
  },
  {
    id: 'pause-and-slow', a: 'exhibit-21', b: 'exhibit-48', title: 'Asked to pause, chose to slow',
    note: 'In 2023 an open letter asked labs to pause. In 2026 a lab said it had slowed down.',
    changed: 'The letter was an appeal from outside the labs. The 2026 exhibit is a company’s own account of a temporary slowdown to strengthen monitoring, alignment and security.',
    same: 'Neither is an industry-wide halt. The question of who has the authority to slow development is still open.',
  },
  {
    id: 'summer-to-stargate', a: 'exhibit-02', b: 'exhibit-38', title: 'A summer, then half a trillion',
    note: 'The field’s founding proposal asked for a small group of researchers and one summer. Nearly seventy years later, the ambition is measured in data centers.',
    changed: 'Stargate announced an intention to invest $500 billion over four years in chips, power and construction. The resource now in question is industrial.',
    same: 'Both are statements of intent. A proposal is not a result, and an announced investment is not money already spent.',
  },
  {
    id: 'first-chats', a: 'exhibit-71', b: 'exhibit-19', title: 'The first chatbot, and the one everyone met',
    note: 'ELIZA answered with templates built from your own words. ChatGPT put a general-purpose language model in front of the public.',
    changed: 'The machinery: keyword rules on a 1960s mainframe against a model trained on vast amounts of text. One is a parlor trick; the other is a broadly useful tool.',
    same: 'The human side. In 1966 and in 2022, people readily attributed understanding to a machine that talked back.',
  },
  {
    id: 'the-loop', a: 'exhibit-03', b: 'exhibit-45', title: 'The loop imagined, the loop begun',
    note: 'I. J. Good imagined a machine that could design a better machine. Sixty years later, a lab reports AI helping with its own engineering and research.',
    changed: 'The idea moved from a thought experiment to a reported practice, with a company describing coordinated slowdown mechanisms.',
    same: 'The company itself distinguishes AI assistance from fully autonomous recursive self-improvement. Whether Good’s loop closes remains an empirical question.',
  },
  {
    id: 'think-and-mean', a: 'exhibit-01', b: 'exhibit-74', title: 'Can machines think? Can symbols mean?',
    note: 'Turing proposed judging a machine by its conversation. Searle replied that convincing behavior is not, by itself, understanding.',
    changed: 'The question shifted from whether a machine can behave intelligently to what, if anything, is going on inside.',
    same: 'Neither argument settled the matter. Both are still cited every time a new system talks fluently.',
  },
  {
    id: 'one-layer', a: 'exhibit-72', b: 'exhibit-75', title: 'What one layer could not do',
    note: 'Minsky and Papert showed precisely what a single-layer network cannot compute. Backpropagation made it practical to train the layers in between.',
    changed: 'Hidden layers could now learn their own internal representations, so problems like XOR stopped being impossible.',
    same: 'Rigorous analysis of limits is part of the field’s progress, not its opposite. Try both in the workshop.',
  },
  {
    id: 'withheld-opened', a: 'exhibit-87', b: 'exhibit-37', title: 'Withheld, then opened',
    note: 'In 2019 OpenAI held back its largest language model over misuse concerns. In 2025 DeepSeek released the weights of a reasoning model.',
    changed: 'Advanced capabilities became available outside a small group of closed-model providers, and openness itself became a competitive strategy.',
    same: 'The argument over access: who may study, run and modify the most capable models, and what risks that brings.',
  },
  {
    id: 'theory-experiment', a: 'exhibit-10', b: 'exhibit-36', title: 'An argument, then an experiment',
    note: 'Bostrom argued that a capable system could cause harm by pursuing the wrong objectives. A decade later, researchers observed strategically different behavior under particular conditions.',
    changed: 'Alignment concerns gained empirical evidence, not only philosophical argument.',
    same: 'The experiment’s artificial setup matters. It does not show that every model inevitably deceives its operators.',
  },
  {
    id: 'public-judgment', a: 'exhibit-73', b: 'exhibit-47', title: 'Public institutions pass judgment',
    note: 'In 1973 a report for a UK research council concluded that AI had failed to meet its grand promises. In 2026 the EU AI Act reaches a major enforcement milestone, treating AI as consequential enough to regulate in detail.',
    changed: 'The verdict reversed, from overpromising to substantial capability with real risks.',
    same: 'In both cases, decisions made by public institutions shaped what the field could do next.',
  },
  {
    id: 'neuron-nobel', a: 'exhibit-69', b: 'exhibit-97', title: 'From a paper neuron to a Nobel',
    note: 'McCulloch and Pitts described the neuron as a unit of logic. Eighty-one years later, the Nobel Prize in Physics honored foundational work on artificial neural networks.',
    changed: 'A deliberately simplified model of the brain became the basis of a technology important enough for physics’ highest award.',
    same: 'Simplification remained the method. Artificial neurons are still a drastic abstraction of biological ones.',
  },
  {
    id: 'roots-branch', a: 'exhibit-05', b: 'exhibit-17', title: 'Roots and a new branch',
    note: 'Nick Land’s 1990s writing treated capitalism and technology as a self-reinforcing process. In 2022 an online community introduced effective accelerationism.',
    changed: 'An obscure theoretical current became an online movement with a name, a manifesto and, soon, prominent supporters.',
    same: 'The founders explicitly cite the lineage. Effective accelerationism is an adaptation of accelerationism, not its origin.',
  },
];

const byId = new Map(events.map(e => [e.id, e]));
export const pairEvents = (p: Pair): [Event, Event] => [byId.get(p.a)!, byId.get(p.b)!];
export const pairsFor = (exhibitId: string) => pairs.filter(p => p.a === exhibitId || p.b === exhibitId);
export const partnerIn = (p: Pair, exhibitId: string) => byId.get(p.a === exhibitId ? p.b : p.a)!;
