// Hands-on specimens: small working reconstructions of ideas in the collection.
// Each belongs to an exhibit (and may also appear on related ones). Every
// specimen states what it demonstrates and what it simplifies, in the same
// spirit as the collection's evidence labels.
export type SpecimenSlug = 'neuron' | 'perceptron' | 'eliza' | 'chinese-room' | 'backprop' | 'preferences';

export type Specimen = {
  slug: SpecimenSlug;
  /** The exhibit this specimen reconstructs. */
  exhibit: string;
  /** Other exhibits that show the specimen, with an optional preset. */
  also?: { exhibit: string; preset: string }[];
  title: string;
  verb: string;
  instructions: string;
  shows: string;
  simplifies: string;
};

export const specimens: Specimen[] = [
  {
    slug: 'neuron', exhibit: 'exhibit-69',
    title: 'Wire a logical neuron', verb: 'Wire it',
    instructions: 'Switch the inputs on and off, make each connection excitatory or inhibitory, and set the threshold. Then try to build each logic gate on the list.',
    shows: 'McCulloch and Pitts’ unit fires when enough excitatory inputs are active and no inhibitory input is. That is enough to build AND, OR and NOT, and networks of such units can compute any logical function.',
    simplifies: 'Real neurons are analog, noisy and far more complex. The 1943 model has no learning at all: someone has to set every connection by hand.',
  },
  {
    slug: 'perceptron', exhibit: 'exhibit-70', also: [{ exhibit: 'exhibit-72', preset: 'xor' }],
    title: 'Train a perceptron', verb: 'Train it',
    instructions: 'Click the plane to place examples, choosing a class first. Then train and watch the line move each time it misclassifies a point. Load the XOR pattern to see where it fails.',
    shows: 'Rosenblatt’s rule nudges the weights toward every example it gets wrong. If a straight line can separate the classes, the perceptron is guaranteed to find one.',
    simplifies: 'A single unit can only draw one straight line. It can never learn XOR, the limit that Minsky and Papert analyzed in 1969. The 1958 Mark I was a machine of motors and photocells, not a web page.',
  },
  {
    slug: 'eliza', exhibit: 'exhibit-71',
    title: 'Talk to ELIZA', verb: 'Talk to it',
    instructions: 'Tell the therapist what is on your mind. Then open “Behind the curtain” to see the keyword, pattern and template behind every reply.',
    shows: 'ELIZA finds a ranked keyword, matches a pattern around it, swaps the pronouns in your own words and drops them into a template. It has no model of meaning, yet it can feel attentive.',
    simplifies: 'This is a new reconstruction in the style of Weizenbaum’s DOCTOR script, not his original code or script. Weizenbaum was disturbed by how readily people confided in the program.',
  },
  {
    slug: 'chinese-room', exhibit: 'exhibit-74',
    title: 'Sit in the Chinese Room', verb: 'Enter the room',
    instructions: 'A slip of Chinese comes under the door. Find its rule in the rulebook and copy the reply, character by character, from the tray. You do not need to read Chinese. That is the point.',
    shows: 'By following rules, you can produce answers that look fluent to someone outside without understanding either the question or your reply. Searle argued that running a program is no different.',
    simplifies: 'Searle’s thought experiment remains contested. The “systems reply” holds that the room as a whole might understand, even if the person inside does not. A five-rule book is a toy, not a program that could pass a real conversation.',
  },
  {
    slug: 'backprop', exhibit: 'exhibit-75', also: [{ exhibit: 'exhibit-72', preset: 'xor' }],
    title: 'Watch backpropagation learn', verb: 'Run it',
    instructions: 'Press play. Errors flow backward through a small network, and the colored field shows what it currently believes. Change the pattern, the number of hidden units or the learning rate, and try again.',
    shows: 'A hidden layer lets a network build its own intermediate features. Together they bend the boundary into shapes no single perceptron can draw, including the XOR pattern.',
    simplifies: 'This network has at most eight hidden units and trains on a few dozen points. Modern models use the same principle, gradient descent through many layers, with billions of parameters.',
  },
  {
    slug: 'preferences', exhibit: 'exhibit-84',
    title: 'Teach a machine your taste', verb: 'Teach it',
    instructions: 'Pick the shape you prefer in each pair. The machine never sees a rule, only your choices. Watch its best guess of what you want evolve, then turn up the optimization pressure.',
    shows: 'A reward model learns from pairwise comparisons alone. A generator then optimizes against it. The same loop, at a much larger scale, underlies RLHF.',
    simplifies: 'The reward model here is linear over six hand-picked features. Push the optimizer too hard and it finds shapes the model never saw you judge: a small picture of reward hacking.',
  },
];

/** Every specimen shown on an exhibit, primary first. */
export const specimensFor = (exhibitId: string) =>
  specimens.flatMap(s => s.exhibit === exhibitId ? [{ specimen: s, preset: undefined as string | undefined }]
    : (s.also ?? []).filter(a => a.exhibit === exhibitId).map(a => ({ specimen: s, preset: a.preset as string | undefined })));
