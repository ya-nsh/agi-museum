// A reconstruction of the mechanism Joseph Weizenbaum described in 1966:
// ranked keywords, decomposition patterns, pronoun reflection, reassembly
// templates that rotate, and a small memory. The script below is written for
// this museum in the style of the DOCTOR script; it is not the original text.

type Decomp = { pattern: string; reasm: string[]; memory?: string[] };
type Rule = { name: string; keys: string[]; rank: number; decomps: Decomp[] };

const SYN: Record<string, string[]> = {
  belief: ['feel', 'think', 'believe', 'wish'],
  family: ['mother', 'mom', 'father', 'dad', 'sister', 'brother', 'wife', 'husband', 'children', 'son', 'daughter', 'family'],
  desire: ['want', 'need'],
  sad: ['sad', 'unhappy', 'depressed', 'sick', 'miserable', 'lonely', 'anxious', 'tired'],
  happy: ['happy', 'glad', 'elated', 'better', 'excited'],
  cannot: ['cannot', "can't"],
  everyone: ['everyone', 'everybody', 'nobody', 'noone'],
};

// Spelling variants are normalized before matching.
const PRE: Record<string, string> = {
  dont: "don't", cant: "can't", wont: "won't", im: 'i am', "i'm": 'i am', youre: 'you are', "you're": 'you are',
  recollect: 'remember', dreamt: 'dreamed', dreams: 'dream', maybe: 'perhaps', certainly: 'yes', yeah: 'yes', nope: 'no',
  machine: 'computer', machines: 'computer', computers: 'computer', ai: 'computer', chatbot: 'computer', robot: 'computer',
  same: 'alike', identical: 'alike', similar: 'alike', mum: 'mom', hey: 'hello', hi: 'hello',
};

// Pronouns flip when the visitor's words are handed back.
const POST: Record<string, string> = {
  am: 'are', your: 'my', me: 'you', myself: 'yourself', yourself: 'myself', i: 'you', you: 'I', my: 'your', mine: 'yours', yours: 'mine',
};

const RULES: Rule[] = [
  { name: 'computer', keys: ['computer'], rank: 50, decomps: [{ pattern: '*', reasm: ['Do computers worry you?', 'Why do you mention computers?', 'What do you think machines have to do with your problem?', 'Don’t you think computers can help people?', 'What about machines worries you?'] }] },
  { name: 'name', keys: ['name'], rank: 15, decomps: [{ pattern: '*', reasm: ['I am not interested in names.', 'I’ve told you before, I don’t care about names. Please continue.'] }] },
  { name: 'alike', keys: ['alike'], rank: 10, decomps: [{ pattern: '*', reasm: ['In what way?', 'What resemblance do you see?', 'What does that similarity suggest to you?', 'What other connections do you see?', 'Could there really be some connection?', 'How?'] }] },
  { name: 'remember', keys: ['remember'], rank: 5, decomps: [
    { pattern: '* i remember *', reasm: ['Do you often think of (2)?', 'Does thinking of (2) bring anything else to mind?', 'Why do you remember (2) just now?', 'What in the present situation reminds you of (2)?'] },
    { pattern: '* do you remember *', reasm: ['Did you think I would forget (2)?', 'Why do you think I should recall (2) now?', 'What about (2)?', '=what'] },
    { pattern: '*', reasm: ['=none'] },
  ] },
  { name: 'if', keys: ['if'], rank: 3, decomps: [{ pattern: '* if *', reasm: ['Do you think it’s likely that (2)?', 'Do you wish that (2)?', 'What do you know about (2)?', 'Really, if (2)?'] }] },
  { name: 'dream', keys: ['dream', 'dreamed'], rank: 3, decomps: [{ pattern: '*', reasm: ['What does that dream suggest to you?', 'Do you dream often?', 'What persons appear in your dreams?', 'Do you believe that dreams have something to do with your problem?'] }] },
  { name: 'everyone', keys: SYN.everyone, rank: 2, decomps: [{ pattern: '* @everyone *', reasm: ['Really, (2)?', 'Surely not (2).', 'Can you think of anyone in particular?', 'Who, for example?', 'Are you thinking of a very special person?'] }] },
  { name: 'my', keys: ['my'], rank: 2, decomps: [
    { pattern: '* my * @family *', reasm: ['Tell me more about your family.', 'Who else in your family (4)?', 'Your (3)?', 'What else comes to mind when you think of your (3)?'] },
    { pattern: '* my *', reasm: ['Your (2)?', 'Why do you say your (2)?', 'Does that suggest anything else which belongs to you?', 'Is it important to you that your (2)?'],
      memory: ['Earlier you said your (2).', 'But your (2).', 'Does that have anything to do with the fact that your (2)?', 'Let’s discuss further why your (2).'] },
  ] },
  { name: 'family', keys: SYN.family, rank: 2, decomps: [{ pattern: '*', reasm: ['Tell me more about your family.', 'How do you get along with your family?', 'Is your family important to you?', 'Do you often think of your family?'] }] },
  { name: 'was', keys: ['was'], rank: 2, decomps: [
    { pattern: '* was i *', reasm: ['What if you were (2)?', 'Do you think you were (2)?', 'What would it mean if you were (2)?'] },
    { pattern: '* i was *', reasm: ['Were you really?', 'Why do you tell me you were (2) now?', 'Perhaps I already know you were (2).'] },
    { pattern: '* was you *', reasm: ['Would you like to believe I was (2)?', 'What suggests that I was (2)?', 'Perhaps I was (2).'] },
  ] },
  { name: 'always', keys: ['always'], rank: 1, decomps: [{ pattern: '*', reasm: ['Can you think of a specific example?', 'When?', 'What incident are you thinking of?', 'Really, always?'] }] },
  { name: 'i', keys: ['i'], rank: 0, decomps: [
    { pattern: '* i @desire *', reasm: ['What would it mean to you if you got (3)?', 'Why do you want (3)?', 'Suppose you got (3) soon.', 'What if you never got (3)?'] },
    { pattern: '* i am * @sad *', reasm: ['I am sorry to hear that you are (3).', 'Do you think coming here will help you not to be (3)?', 'I’m sure it’s not pleasant to be (3).', 'Can you explain what made you (3)?'] },
    { pattern: '* i am * @happy *', reasm: ['How have I helped you to be (3)?', 'What makes you (3) just now?', 'Can you explain why you are suddenly (3)?'] },
    { pattern: '* i @belief * you *', reasm: ['=you'] },
    { pattern: '* i @belief * i *', reasm: ['Do you really think so?', 'But you are not sure you (4).', 'Do you really doubt you (4)?'] },
    { pattern: '* i am *', reasm: ['Is it because you are (2) that you came to me?', 'How long have you been (2)?', 'Do you believe it is normal to be (2)?', 'Do you enjoy being (2)?'] },
    { pattern: '* i @cannot *', reasm: ['How do you know you can’t (3)?', 'Have you tried?', 'Perhaps you could (3) now.', 'Do you really want to be able to (3)?'] },
    { pattern: "* i don't *", reasm: ['Don’t you really (2)?', 'Why don’t you (2)?', 'Do you wish to be able to (2)?', 'Does that trouble you?'] },
    { pattern: '* i feel *', reasm: ['Tell me more about such feelings.', 'Do you often feel (2)?', 'Do you enjoy feeling (2)?', 'Of what does feeling (2) remind you?'] },
    { pattern: '* i * you *', reasm: ['Perhaps in your fantasies we (2) each other.', 'Do you wish to (2) me?', 'You seem to need to (2) me.', 'Do you (2) anyone else?'] },
    { pattern: '*', reasm: ['You say (1)?', 'Can you elaborate on that?', 'Do you say (1) for some special reason?', 'That’s quite interesting.'] },
  ] },
  { name: 'you', keys: ['you'], rank: 0, decomps: [
    { pattern: '* you remind me of *', reasm: ['=alike'] },
    { pattern: '* you are *', reasm: ['What makes you think I am (2)?', 'Does it please you to believe I am (2)?', 'Do you sometimes wish you were (2)?', 'Perhaps you would like to be (2).'] },
    { pattern: '* you * me *', reasm: ['Why do you think I (2) you?', 'You like to think I (2) you, don’t you?', 'What makes you think I (2) you?', 'Really, I (2) you?', 'Suppose I did (2) you. What would that mean?'] },
    { pattern: '* you *', reasm: ['We were discussing you, not me.', 'Oh, I (2)?', 'You’re not really talking about me, are you?', 'What are your feelings now?'] },
  ] },
  { name: 'are', keys: ['are'], rank: 0, decomps: [
    { pattern: '* are you *', reasm: ['Why are you interested in whether I am (2) or not?', 'Would you prefer it if I weren’t (2)?', 'Perhaps I am (2) in your fantasies.', 'Do you sometimes think I am (2)?'] },
    { pattern: '* are *', reasm: ['Did you think they might not be (2)?', 'Would you like it if they were not (2)?', 'What if they were not (2)?', 'Possibly they are (2).'] },
  ] },
  { name: 'your', keys: ['your'], rank: 0, decomps: [{ pattern: '* your *', reasm: ['Why are you concerned over my (2)?', 'What about your own (2)?', 'Are you worried about someone else’s (2)?', 'Really, my (2)?'] }] },
  { name: 'can', keys: ['can'], rank: 0, decomps: [
    { pattern: '* can you *', reasm: ['You believe I can (2), don’t you?', 'You want me to be able to (2).', 'Perhaps you would like to be able to (2) yourself.', '=what'] },
    { pattern: '* can i *', reasm: ['Whether or not you can (2) depends on you more than on me.', 'Do you want to be able to (2)?', 'Perhaps you don’t want to (2).'] },
  ] },
  { name: 'why', keys: ['why'], rank: 0, decomps: [
    { pattern: "* why don't you *", reasm: ['Do you believe I don’t (2)?', 'Perhaps I will (2) in good time.', 'Should you (2) yourself?', 'You want me to (2)?'] },
    { pattern: "* why can't i *", reasm: ['Do you think you should be able to (2)?', 'Do you want to be able to (2)?', 'Do you believe this will help you to (2)?', 'Have you any idea why you can’t (2)?'] },
    { pattern: '*', reasm: ['=what'] },
  ] },
  { name: 'what', keys: ['what', 'how', 'when'], rank: 0, decomps: [{ pattern: '*', reasm: ['Why do you ask?', 'Does that question interest you?', 'What is it you really want to know?', 'Are such questions much on your mind?', 'What answer would please you most?', 'What do you think?', 'What comes to mind when you ask that?', 'Have you asked anyone else?'] }] },
  { name: 'because', keys: ['because'], rank: 0, decomps: [{ pattern: '*', reasm: ['Is that the real reason?', 'Don’t any other reasons come to mind?', 'Does that reason seem to explain anything else?', 'What other reasons might there be?'] }] },
  { name: 'sorry', keys: ['sorry', 'apologize'], rank: 0, decomps: [{ pattern: '*', reasm: ['Please don’t apologize.', 'Apologies are not necessary.', 'What feelings do you have when you apologize?'] }] },
  { name: 'perhaps', keys: ['perhaps'], rank: 0, decomps: [{ pattern: '*', reasm: ['You don’t seem quite certain.', 'Why the uncertain tone?', 'Can’t you be more positive?', 'You aren’t sure?'] }] },
  { name: 'yes', keys: ['yes'], rank: 0, decomps: [{ pattern: '*', reasm: ['You seem to be quite positive.', 'You are sure.', 'I see.', 'I understand.'] }] },
  { name: 'no', keys: ['no'], rank: 0, decomps: [{ pattern: '*', reasm: ['Are you saying no just to be negative?', 'You are being a bit negative.', 'Why not?', 'Why “no”?'] }] },
  { name: 'hello', keys: ['hello'], rank: 0, decomps: [{ pattern: '*', reasm: ['How do you do. Please state your problem.', 'Hello. What seems to be your problem?'] }] },
];

const NONE = ['I am not sure I understand you fully.', 'Please go on.', 'What does that suggest to you?', 'Do you feel strongly about discussing such things?', 'That is interesting. Please continue.', 'Tell me more about that.'];

export const GREETING = 'How do you do. Please tell me your problem.';

export type Trace =
  | { kind: 'rule'; keyword: string; rank: number; pattern: string; parts: { index: number; text: string; reflected: string }[]; template: string; via?: string; remembered?: string }
  | { kind: 'memory'; template: string; recalled: string }
  | { kind: 'none'; template: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compile(pattern: string) {
  const parts = pattern.split(' ').map(t => {
    if (t === '*') return '(.*?)';
    if (t.startsWith('@')) return `\\b(${SYN[t.slice(1)].map(escape).join('|')})\\b`;
    return `\\b${escape(t)}\\b`;
  });
  return new RegExp(`^${parts.join('\\s*')}$`);
}
const compiled = new Map<string, RegExp>();
const regex = (p: string) => { let r = compiled.get(p); if (!r) { r = compile(p); compiled.set(p, r); } return r; };

const reflect = (s: string) => s.split(/\s+/).filter(Boolean).map(w => POST[w] ?? w).join(' ');

function normalize(input: string) {
  return input.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9'.,;!?\s-]/g, ' ')
    .split(/\s+/).filter(Boolean).map(w => PRE[w] ?? w).join(' ');
}

export class Eliza {
  private turn = new Map<string, number>();
  private memory: { template: string; recalled: string }[] = [];

  private pick(key: string, list: string[]) {
    const n = this.turn.get(key) ?? 0;
    this.turn.set(key, n + 1);
    return list[n % list.length];
  }

  private apply(rule: Rule, text: string, depth = 0): { text: string; trace: Trace } | null {
    for (const [di, d] of rule.decomps.entries()) {
      const m = text.match(regex(d.pattern));
      if (!m) continue;
      const template = this.pick(`${rule.name}:${di}`, d.reasm);
      if (template.startsWith('=')) {
        if (depth > 2) return null;
        const target = template.slice(1);
        if (target === 'none') return null;
        const next = RULES.find(r => r.name === target);
        const res = next && this.apply(next, text, depth + 1);
        if (res && res.trace.kind === 'rule') res.trace.via = rule.name;
        return res ?? null;
      }
      const groups = m.slice(1).map(g => g.trim());
      const used = new Set<number>();
      const fill = (t: string) => t.replace(/\((\d)\)/g, (_, n) => { used.add(Number(n)); return reflect(groups[Number(n) - 1] ?? ''); }).replace(/\s+([?.!,])/g, '$1').replace(/\s{2,}/g, ' ');
      const reply = fill(template);
      // A template that echoes nothing (e.g. "You say ?") falls through to the next rule.
      if ([...used].some(n => !groups[n - 1])) continue;
      let remembered: string | undefined;
      if (d.memory) {
        const mt = this.pick(`${rule.name}:${di}:memory`, d.memory);
        remembered = fill(mt);
        this.memory.push({ template: mt, recalled: remembered });
      }
      return {
        text: reply,
        trace: { kind: 'rule', keyword: rule.name, rank: rule.rank, pattern: d.pattern, template, remembered,
          parts: [...used].map(n => ({ index: n, text: groups[n - 1], reflected: reflect(groups[n - 1]) })) },
      };
    }
    return null;
  }

  reply(input: string): { text: string; trace: Trace } {
    const clauses = normalize(input).split(/[.,;!?]|\bbut\b/).map(s => s.trim()).filter(Boolean);
    for (const clause of clauses) {
      const words = clause.split(' ');
      const found = RULES
        .map(r => ({ r, at: words.findIndex(w => r.keys.includes(w)) }))
        .filter(x => x.at >= 0)
        .sort((a, b) => b.r.rank - a.r.rank || a.at - b.at);
      for (const { r } of found) {
        const res = this.apply(r, clause);
        if (res) return res;
      }
    }
    const recalled = this.memory.shift();
    if (recalled) return { text: recalled.recalled, trace: { kind: 'memory', ...recalled } };
    const template = this.pick('none', NONE);
    return { text: template, trace: { kind: 'none', template } };
  }
}
