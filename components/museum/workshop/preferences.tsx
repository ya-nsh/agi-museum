'use client';

import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { seeded } from '@/lib/museum';

// Each shape is six numbers in [0, 1]. The reward model only ever sees those
// six features, never the picture and never a rule.
type Theta = number[];
const FEATURES = ['More petals', 'Spikier', 'Wobblier', 'Bigger', 'Bolder line', 'Warmer color'];
const D = FEATURES.length;

const TEAL = [127, 214, 200], CORAL = [255, 159, 122];
const PRESSURE = [
  { label: 'Gentle', n: 8, range: 1, note: 'Best of 8 shapes, all within the range you have judged.' },
  { label: 'Strong', n: 96, range: 1, note: 'Best of 96 shapes, all within the range you have judged.' },
  { label: 'Extreme', n: 600, range: 2.6, note: 'Best of 600 shapes, allowed to go far beyond anything you have judged.' },
];

function path(t: Theta) {
  const petals = Math.max(1, Math.round(3 + t[0] * 6));
  const spike = t[1] * 0.55, wobble = t[2] * 0.3, size = 0.45 + t[3] * 0.45;
  let d = '';
  for (let i = 0; i <= 360; i++) {
    const a = (i / 360) * Math.PI * 2;
    const r = size * (1 - spike * 0.5 + spike * 0.5 * Math.cos(petals * a) + wobble * Math.sin((petals * 2 + 1) * a)) * 44;
    d += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`;
  }
  return d + 'Z';
}

function color(t: Theta) {
  const k = t[5];
  const c = TEAL.map((v, i) => Math.round(Math.max(0, Math.min(255, v + (CORAL[i] - v) * k))));
  return `rgb(${c.join(' ')})`;
}

function Glyph({ t, label }: { t: Theta; label?: string }) {
  const c = color(t);
  return (
    <svg viewBox="0 0 100 100" className="pref-glyph" role="img" aria-label={label}>
      <path d={path(t)} fill={c} fillOpacity={0.12} stroke={c} strokeWidth={0.6 + t[4] * 2.6} strokeLinejoin="round" />
    </svg>
  );
}

const sample = (r: () => number, range = 1): Theta => Array.from({ length: D }, () => 0.5 + (r() - 0.5) * range);
const reward = (w: number[], t: Theta) => t.reduce((s, v, i) => s + w[i] * (v - 0.5), 0);
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export default function Preferences() {
  const [rng] = useState(() => seeded('preferences'));
  const draw = (range = 1) => sample(rng, range);
  const [w, setW] = useState<number[]>(() => Array(D).fill(0));
  // The first pair comes from its own seed, so it is identical on the server and in the browser.
  const [pair, setPair] = useState<[Theta, Theta]>(() => { const r = seeded('preferences-first'); return [sample(r), sample(r)]; });
  const [count, setCount] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [last, setLast] = useState<{ agreed: boolean } | null>(null);

  /** Ask about the pair the model is least sure of, from a handful of random pairs. */
  const nextPair = (weights: number[]): [Theta, Theta] => {
    let best: [Theta, Theta] = [draw(), draw()], gap = Infinity;
    for (let i = 0; i < 12; i++) {
      const a = draw(), b = draw(), g = Math.abs(reward(weights, a) - reward(weights, b));
      if (g < gap) { gap = g; best = [a, b]; }
    }
    return best;
  };

  const choose = (winner: 0 | 1 | null) => {
    if (winner !== null) {
      const [a, b] = winner === 0 ? pair : [pair[1], pair[0]];
      // Bradley–Terry: P(a preferred to b) = σ(r(a) − r(b)); one gradient step on the log-likelihood.
      const p = sigmoid(reward(w, a) - reward(w, b));
      setLast({ agreed: p >= 0.5 });
      const next = w.map((wi, i) => (wi + 2.5 * (1 - p) * (a[i] - b[i])) * 0.995);
      setW(next);
      setCount(c => c + 1);
      setPair(nextPair(next));
    } else {
      setLast(null);
      setPair(nextPair(w));
    }
  };

  const reset = () => { setW(Array(D).fill(0)); setCount(0); setLast(null); setPressure(0); setPair([draw(), draw()]); };

  // The "policy": best-of-N sampling against the learned reward.
  const guess = useMemo(() => {
    const cfg = PRESSURE[pressure];
    const r = seeded(`guess-${pressure}-${count}`);
    let best: Theta = Array(D).fill(0.5), score = -Infinity;
    for (let i = 0; i < cfg.n; i++) {
      const t = sample(r, cfg.range);
      const s = reward(w, t);
      if (s > score) { score = s; best = t; }
    }
    return { t: best, score };
  }, [w, pressure, count]);

  const maxW = Math.max(0.5, ...w.map(Math.abs));
  const offDistribution = guess.t.some(v => v < -0.02 || v > 1.02);

  return (
    <div className="ws-pref">
      <div className="ws-stage">
        <p className="mono ws-label">WHICH DO YOU PREFER? · {count} {count === 1 ? 'CHOICE' : 'CHOICES'}</p>
        <div className="pref-pair">
          {pair.map((t, i) => (
            <button key={i} className="pref-option" onClick={() => choose(i as 0 | 1)} aria-label={`Prefer the ${i ? 'right' : 'left'} shape`}>
              <AnimatePresence mode="wait">
                <motion.span key={`${count}-${t.join()}`} initial={{ opacity: 0, scale: 0.85, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35 }}>
                  <Glyph t={t} />
                </motion.span>
              </AnimatePresence>
              <span className="mono pref-score">MODEL’S SCORE {reward(w, t).toFixed(2)}</span>
            </button>
          ))}
        </div>
        <div className="ws-toolbar">
          <button className="icon-btn" onClick={() => choose(null)}>Can’t decide</button>
          <button className="icon-btn round" onClick={reset} aria-label="Forget everything and start again" title="Start again"><RotateCcw size={15} /></button>
          {last && <span className="pref-last mono" aria-live="polite">{last.agreed ? 'THE MODEL PREDICTED THAT' : 'THAT SURPRISED THE MODEL'}</span>}
        </div>
        <div className="pref-reward">
          <p className="mono ws-label">WHAT THE REWARD MODEL THINKS YOU LIKE</p>
          {FEATURES.map((f, i) => (
            <div key={f} className="pref-bar">
              <span>{f}</span>
              <span className="pref-track"><motion.i className={w[i] >= 0 ? 'pos' : 'neg'} animate={{ width: `${(Math.abs(w[i]) / maxW) * 50}%`, left: w[i] >= 0 ? '50%' : `${50 - (Math.abs(w[i]) / maxW) * 50}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} /></span>
            </div>
          ))}
        </div>
      </div>

      <div className="ws-side">
        <p className="mono ws-label">ITS BEST GUESS FOR YOU</p>
        <div className={`pref-guess ${offDistribution ? 'hacked' : ''}`}>
          <Glyph t={guess.t} label="The shape the optimizer chose as your favorite" />
          <span className="mono">REWARD {guess.score.toFixed(2)}</span>
        </div>
        <p className="mono ws-label">OPTIMIZATION PRESSURE</p>
        <div className="ws-seg" role="radiogroup" aria-label="Optimization pressure">
          {PRESSURE.map((p, i) => <button key={p.label} role="radio" aria-checked={pressure === i} className={pressure === i ? 'on' : ''} onClick={() => setPressure(i)}>{p.label}</button>)}
        </div>
        <p className="pref-note">{PRESSURE[pressure].note}</p>
        <p className={`ws-verdict ${offDistribution ? 'warn' : ''}`} aria-live="polite">
          {count === 0 ? 'The model starts knowing nothing. Every choice you make is one comparison it can learn from.'
            : offDistribution ? 'The reward model rates this higher than anything you have seen. But it learned only from shapes in the normal range, and out here it is extrapolating. Do you actually like it? That gap is reward hacking.'
              : count < 6 ? 'A few more choices. The machine picks the pairs it is least sure about.'
                : 'You never wrote a rule, yet the guess drifts toward your taste. Now try Extreme pressure.'}
        </p>
      </div>
    </div>
  );
}
