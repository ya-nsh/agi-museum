'use client';

import { motion } from 'motion/react';
import { Check, Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMuseum } from '../providers';

type Link = 'excite' | 'inhibit' | 'off';
type Unit = { links: [Link, Link]; threshold: number };
const CYCLE: Record<Link, Link> = { excite: 'inhibit', inhibit: 'off', off: 'excite' };
const LINK_NAME: Record<Link, string> = { excite: 'Excitatory', inhibit: 'Inhibitory', off: 'Not connected' };
const ROWS: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]];

/** McCulloch–Pitts: any active inhibitory input vetoes; otherwise fire when excitation reaches the threshold. */
function fires(u: Unit, inputs: [number, number]) {
  let sum = 0;
  for (let i = 0; i < 2; i++) {
    if (!inputs[i] || u.links[i] === 'off') continue;
    if (u.links[i] === 'inhibit') return 0;
    sum++;
  }
  return sum >= u.threshold ? 1 : 0;
}

const GOALS = [
  { name: 'AND', table: [0, 0, 0, 1] },
  { name: 'OR', table: [0, 1, 1, 1] },
  { name: 'NOT A', table: [1, 1, 0, 0] },
  { name: 'A AND NOT B', table: [0, 0, 1, 0] },
  { name: 'NOR', table: [1, 0, 0, 0] },
  { name: 'XOR', table: [0, 1, 1, 0], impossible: true },
];

const IN_Y = [92, 208];
const SOMA = { x: 330, y: 150, r: 46 };

export default function Neuron() {
  const { reduced } = useMuseum();
  const [inputs, setInputs] = useState<[number, number]>([1, 0]);
  const [unit, setUnit] = useState<Unit>({ links: ['excite', 'off'], threshold: 1 });
  const [goal, setGoal] = useState(0);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);

  const table = useMemo(() => ROWS.map(r => fires(unit, r)), [unit]);
  const out = fires(unit, inputs);
  const current = ROWS.findIndex(r => r[0] === inputs[0] && r[1] === inputs[1]);
  const g = GOALS[goal];
  const matches = table.every((v, i) => v === g.table[i]);

  const change = (u: Unit) => {
    setUnit(u);
    setAttempts(a => a + 1);
    const t = ROWS.map(r => fires(u, r));
    const hit = GOALS.find(x => x.table.every((v, i) => v === t[i]));
    if (hit) setSolved(s => (s.has(hit.name) ? s : new Set(s).add(hit.name)));
  };
  const toggleInput = (i: number) => setInputs(v => (i === 0 ? [v[0] ? 0 : 1, v[1]] : [v[0], v[1] ? 0 : 1]));
  const cycleLink = (i: number) => change({ ...unit, links: unit.links.map((l, j) => (j === i ? CYCLE[l] : l)) as [Link, Link] });
  const setThreshold = (t: number) => change({ ...unit, threshold: Math.max(0, Math.min(2, t)) });
  const key = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };

  return (
    <div className="ws-neuron">
      <div className="ws-stage">
        <svg viewBox="0 0 560 300" className="nn-svg" role="group" aria-label="A McCulloch–Pitts neuron with two inputs">
          <defs>
            <marker id="nn-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {[0, 1].map(i => {
            const l = unit.links[i];
            const active = inputs[i] === 1 && l !== 'off';
            const x1 = 104, y1 = IN_Y[i];
            const ang = Math.atan2(SOMA.y - y1, SOMA.x - x1);
            const x2 = SOMA.x - Math.cos(ang) * (SOMA.r + 8), y2 = SOMA.y - Math.sin(ang) * (SOMA.r + 8);
            const mid = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
            return (
              <g key={i} className={`nn-link ${l} ${active ? 'live' : ''}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={l === 'excite' ? 'url(#nn-arrow)' : undefined} />
                {l === 'inhibit' && <circle cx={x2} cy={y2} r={6} className="nn-inhib" />}
                {active && !reduced && (
                  <motion.circle r={4} className="nn-pulse" initial={{ cx: x1, cy: y1, opacity: 0 }} animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeIn', delay: i * 0.25 }} />
                )}
                <g className="nn-chip" role="button" tabIndex={0} aria-label={`Connection from input ${'AB'[i]}: ${LINK_NAME[l]}. Activate to change.`}
                  onClick={() => cycleLink(i)} onKeyDown={key(() => cycleLink(i))} transform={`translate(${mid.x} ${mid.y + (i ? 24 : -24)})`}>
                  <rect x={-50} y={-13} width={100} height={26} rx={13} />
                  <text textAnchor="middle" dy="4.5">{l === 'excite' ? '+ excite' : l === 'inhibit' ? '− inhibit' : 'off'}</text>
                </g>
              </g>
            );
          })}
          {[0, 1].map(i => (
            <g key={i} className={`nn-input ${inputs[i] ? 'on' : ''}`} role="switch" aria-checked={inputs[i] === 1} tabIndex={0}
              aria-label={`Input ${'AB'[i]}`} onClick={() => toggleInput(i)} onKeyDown={key(() => toggleInput(i))}>
              <circle cx={70} cy={IN_Y[i]} r={32} />
              <text x={70} y={IN_Y[i] - 4} textAnchor="middle" className="nn-name">{'AB'[i]}</text>
              <text x={70} y={IN_Y[i] + 15} textAnchor="middle" className="nn-val">{inputs[i]}</text>
            </g>
          ))}
          <g className={`nn-soma ${out ? 'on' : ''}`}>
            <motion.circle cx={SOMA.x} cy={SOMA.y} r={SOMA.r} animate={{ scale: out && !reduced ? [1, 1.05, 1] : 1 }} transition={{ duration: 1.2, repeat: out ? Infinity : 0 }} style={{ transformOrigin: `${SOMA.x}px ${SOMA.y}px` }} />
            <text x={SOMA.x} y={SOMA.y - 6} textAnchor="middle" className="nn-theta">θ = {unit.threshold}</text>
            <text x={SOMA.x} y={SOMA.y + 16} textAnchor="middle" className="nn-sub">threshold</text>
          </g>
          <line x1={SOMA.x + SOMA.r} y1={SOMA.y} x2={468} y2={SOMA.y} className={`nn-axon ${out ? 'on' : ''}`} />
          <g className={`nn-out ${out ? 'on' : ''}`}>
            <circle cx={500} cy={SOMA.y} r={30} />
            <text x={500} y={SOMA.y + 7} textAnchor="middle">{out}</text>
            <text x={500} y={SOMA.y + 52} textAnchor="middle" className="nn-sub">{out ? 'FIRES' : 'SILENT'}</text>
          </g>
        </svg>
        <div className="nn-controls">
          <span className="mono">THRESHOLD</span>
          <button className="icon-btn round" onClick={() => setThreshold(unit.threshold - 1)} disabled={unit.threshold === 0} aria-label="Lower threshold"><Minus size={15} /></button>
          <span className="nn-tval serif" aria-live="polite">{unit.threshold}</span>
          <button className="icon-btn round" onClick={() => setThreshold(unit.threshold + 1)} disabled={unit.threshold === 2} aria-label="Raise threshold"><Plus size={15} /></button>
          <span className="nn-hint">Tap inputs to switch them. Tap a connection to change its type.</span>
        </div>
      </div>

      <div className="ws-side">
        <p className="mono ws-label">BUILD A GATE</p>
        <div className="nn-goals" role="radiogroup" aria-label="Target gate">
          {GOALS.map((x, i) => (
            <button key={x.name} role="radio" aria-checked={goal === i} className={`chip ${goal === i ? 'on' : ''} ${solved.has(x.name) ? 'solved' : ''}`} onClick={() => setGoal(i)}>
              {solved.has(x.name) && <Check size={13} />}{x.name}
            </button>
          ))}
        </div>
        <table className="nn-table">
          <thead><tr><th>A</th><th>B</th><th>Your unit</th><th>{g.name}</th></tr></thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} className={i === current ? 'current' : ''} onClick={() => setInputs(r)}>
                <td>{r[0]}</td><td>{r[1]}</td>
                <td className={table[i] ? 'hi' : ''}>{table[i]}</td>
                <td className={table[i] === g.table[i] ? 'ok' : 'bad'}>{g.table[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={`ws-verdict ${matches ? 'good' : ''}`} aria-live="polite">
          {matches ? <><Check size={15} /> Your neuron computes {g.name}.</>
            : g.impossible && attempts > 0 ? 'No setting of a single unit produces XOR. Its true cases cannot be separated from the others by one threshold. McCulloch and Pitts’ answer was a network of units.'
              : `${table.filter((v, i) => v !== g.table[i]).length} of 4 rows still differ.`}
        </p>
        <p className="ws-score mono">{solved.size} / {GOALS.length - 1} POSSIBLE GATES BUILT</p>
      </div>
    </div>
  );
}
