// Six overlapping perspectives on the pace and governance of advanced AI.
// Map positions are the curators' interpretation, not a measurement:
// x runs from "slow down" (-1) to "speed up" (+1); y runs from
// "power held by states and institutions" (-1) to "power distributed" (+1).
export type Perspective = {
  name: string; title: string; body: string; wants: string; worries: string;
  people: string; source: string; sourceName: string; x: number; y: number;
};

export const perspectives: Perspective[] = [
  {
    name: 'e/acc', title: 'Accelerate the future.',
    body: 'Progress, competition and experimentation are the way forward. Restrictions risk stagnation and concentrating power in the hands of a few.',
    wants: 'Fast, permissionless building and abundant energy and compute.',
    worries: 'Regulatory capture, stagnation and decline.',
    people: 'Beff Jezos · Bayeslord · Marc Andreessen', source: 'https://beff.substack.com/p/notes-on-eacc-principles-and-tenets', sourceName: 'Notes on e/acc principles and tenets',
    x: 0.86, y: 0.34,
  },
  {
    name: 'Alignment', title: 'Make capability controllable.',
    body: 'Build systems whose behavior stays consistent with human intent. Measure risks and strengthen oversight as capabilities grow.',
    wants: 'Evaluations, interpretability and safeguards that scale with capability.',
    worries: 'Systems that pursue the wrong objectives, or that humans can no longer oversee.',
    people: 'AI alignment and safety researchers', source: 'https://www.anthropic.com/company', sourceName: 'A safety-focused lab on its mission',
    x: 0.02, y: -0.12,
  },
  {
    name: 'Pause', title: 'Buy time to get it right.',
    body: 'Pause the most dangerous development until safety and governance catch up. This need not mean stopping all AI research.',
    wants: 'Coordinated limits on frontier training, verified by institutions.',
    worries: 'An irreversible mistake made in a competitive rush.',
    people: 'Future of Life Institute · pause advocates', source: 'https://futureoflife.org/open-letter/pause-giant-ai-experiments/', sourceName: 'Pause Giant AI Experiments: An Open Letter',
    x: -0.84, y: -0.3,
  },
  {
    name: 'd/acc', title: 'Accelerate our defenses.',
    body: 'Favor technologies that support defense, decentralization and democratic resilience, while taking AI risks seriously.',
    wants: 'Differential progress: shields before swords, pluralism over monopoly.',
    worries: 'Both runaway AI and a single actor controlling it.',
    people: 'Vitalik Buterin', source: 'https://vitalik.eth.limo/general/2023/11/27/techno_optimism.html', sourceName: 'My techno-optimism',
    x: 0.36, y: 0.72,
  },
  {
    name: 'Open models', title: 'Distribute the power.',
    body: 'Broader access enables independent research and experimentation. Supporting open models is not the same as membership in e/acc.',
    wants: 'Published weights that anyone can study, adapt and run.',
    worries: 'A future where a handful of companies own intelligence.',
    people: 'Open-model community · Meta', source: 'https://about.fb.com/news/2024/07/open-source-ai-is-the-path-forward/', sourceName: 'Open Source AI Is the Path Forward',
    x: 0.54, y: 0.92,
  },
  {
    name: 'National strategy', title: 'Win the strategic race.',
    body: 'Build domestic AI infrastructure and capabilities while controlling access to strategically sensitive technology.',
    wants: 'Compute, energy and talent at home; export controls abroad.',
    worries: 'A rival state reaching decisive capability first.',
    people: 'Governments and national-security institutions', source: 'https://www.whitehouse.gov/releases/2025/07/white-house-unveils-americas-ai-action-plan/', sourceName: 'America’s AI Action Plan',
    x: 0.72, y: -0.82,
  },
];
