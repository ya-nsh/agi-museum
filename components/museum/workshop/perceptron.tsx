'use client';

import Link from 'next/link';
import { Pause, Play, RotateCcw, StepForward, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { seeded } from '@/lib/museum';
import { clipHalfPlane, lineInBox, toPlane } from './geometry';

type Pt = { x: number; y: number; c: 1 | -1 };
type W = { w1: number; w2: number; b: number };

const SIZE = 400;
const RATE = 0.1;
const MAX_EPOCHS = 80;
// Deliberately wrong starting weights, so there is something to watch the rule correct.
const START: W = { w1: 0.6, w2: -0.5, b: 0.1 };

function cluster(r: () => number, cx: number, cy: number, n: number, spread: number, c: 1 | -1): Pt[] {
  return Array.from({ length: n }, () => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * spread;
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, c };
  });
}

const PRESETS: Record<string, { label: string; points: () => Pt[] }> = {
  separable: {
    label: 'Two clusters',
    points: () => { const r = seeded('perceptron-separable'); return [...cluster(r, -0.45, 0.35, 12, 0.32, 1), ...cluster(r, 0.45, -0.35, 12, 0.32, -1)]; },
  },
  diagonal: {
    label: 'Close call',
    points: () => {
      const r = seeded('perceptron-diagonal');
      const pts: Pt[] = [];
      while (pts.length < 30) {
        const x = r() * 1.8 - 0.9, y = r() * 1.8 - 0.9, m = y - 0.4 * x - 0.1;
        if (Math.abs(m) > 0.14) pts.push({ x, y, c: m > 0 ? 1 : -1 });
      }
      return pts;
    },
  },
  xor: {
    label: 'XOR',
    points: () => { const r = seeded('perceptron-xor'); return [...cluster(r, -0.55, 0.55, 6, 0.2, 1), ...cluster(r, 0.55, -0.55, 6, 0.2, 1), ...cluster(r, 0.55, 0.55, 6, 0.2, -1), ...cluster(r, -0.55, -0.55, 6, 0.2, -1)]; },
  },
};

const predict = (w: W, p: Pt) => (w.w1 * p.x + w.w2 * p.y + w.b >= 0 ? 1 : -1);

/** One pass of Rosenblatt's rule: every misclassified point pulls the weights toward itself. */
function epoch(w: W, pts: Pt[]) {
  let next = { ...w }, mistakes = 0;
  const touched: number[] = [];
  pts.forEach((p, i) => {
    if (predict(next, p) === p.c) return;
    mistakes++;
    touched.push(i);
    next = { w1: next.w1 + RATE * p.c * p.x, w2: next.w2 + RATE * p.c * p.y, b: next.b + RATE * p.c };
  });
  return { w: next, mistakes, touched };
}

/** Run the rule far longer than the visitor will, to tell a slow learner from an impossible task. */
function separable(pts: Pt[]) {
  if (pts.every(p => p.c === pts[0]?.c)) return true;
  let w = START;
  for (let i = 0; i < 4000; i++) {
    const r = epoch(w, pts);
    if (r.mistakes === 0) return true;
    w = r.w;
  }
  return false;
}

export default function Perceptron({ preset = 'separable' }: { preset?: string }) {
  const [points, setPoints] = useState<Pt[]>(() => (PRESETS[preset] ?? PRESETS.separable).points());
  const [w, setW] = useState<W>(START);
  const [history, setHistory] = useState<number[]>([]);
  const [touched, setTouched] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [cls, setCls] = useState<1 | -1>(1);
  const [active, setActive] = useState(preset in PRESETS ? preset : 'separable');
  const svg = useRef<SVGSVGElement>(null);

  const errors = points.filter(p => predict(w, p) !== p.c).length;
  const converged = history.length > 0 && errors === 0;
  const gaveUp = history.length >= MAX_EPOCHS && errors > 0;
  const possible = useMemo(() => (gaveUp ? separable(points) : true), [gaveUp, points]);

  const step = useCallback(() => {
    const r = epoch(w, points);
    setW(r.w);
    setTouched(r.touched);
    setHistory(h => [...h, r.mistakes]);
    return r;
  }, [w, points]);

  // Training pauses itself once it converges or reaches the epoch limit.
  const training = running && !converged && !gaveUp && points.length > 0;
  useEffect(() => {
    if (!training) return;
    const t = setTimeout(step, 320);
    return () => clearTimeout(t);
  }, [training, step]);
  const toggle = () => {
    if (training) { setRunning(false); return; }
    if (converged) resetWeights(); else if (gaveUp) setHistory([]);
    setRunning(true);
  };

  const resetWeights = () => { setW(START); setHistory([]); setTouched([]); setRunning(false); };
  const load = (k: string) => { setActive(k); setPoints(PRESETS[k].points()); resetWeights(); };
  const add = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = toPlane(e, svg.current!);
    const c = e.shiftKey ? (-cls as 1 | -1) : cls;
    setPoints(ps => [...ps, { ...p, c }]);
    setActive('');
    setHistory([]);
  };

  const s = (v: number) => ((v + 1) / 2) * SIZE;
  const pos = clipHalfPlane(w.w1, w.w2, w.b, 1);
  const neg = clipHalfPlane(w.w1, w.w2, w.b, -1);
  const line = lineInBox(w.w1, w.w2, w.b);
  const poly = (ps: [number, number][]) => ps.map(([x, y]) => `${s(x)},${s(-y)}`).join(' ');
  const maxBar = Math.max(1, ...history);

  return (
    <div className="ws-plane-layout">
      <div className="ws-stage">
        <svg ref={svg} viewBox={`0 0 ${SIZE} ${SIZE}`} className="plane" onPointerDown={add} role="img"
          aria-label={`A plane with ${points.length} examples. The perceptron currently misclassifies ${errors}.`}>
          {pos.length > 2 && <polygon points={poly(pos)} className="region a" />}
          {neg.length > 2 && <polygon points={poly(neg)} className="region b" />}
          <line x1={0} y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} className="plane-axis" />
          <line x1={SIZE / 2} y1={0} x2={SIZE / 2} y2={SIZE} className="plane-axis" />
          {line && <line x1={s(line[0][0])} y1={s(-line[0][1])} x2={s(line[1][0])} y2={s(-line[1][1])} className="boundary" />}
          {points.map((p, i) => {
            const wrong = predict(w, p) !== p.c;
            return (
              <g key={i} transform={`translate(${s(p.x)} ${s(-p.y)})`} className={`pt ${p.c === 1 ? 'a' : 'b'} ${wrong ? 'wrong' : ''} ${touched.includes(i) ? 'touched' : ''}`}>
                {wrong && <circle r={11} className="pt-ring" />}
                <circle r={5.5} />
              </g>
            );
          })}
        </svg>
        <div className="ws-toolbar">
          <div className="ws-seg" role="radiogroup" aria-label="Class of new points">
            <button role="radio" aria-checked={cls === 1} className={cls === 1 ? 'on' : ''} onClick={() => setCls(1)}><i className="sw a" />Class A</button>
            <button role="radio" aria-checked={cls === -1} className={cls === -1 ? 'on' : ''} onClick={() => setCls(-1)}><i className="sw b" />Class B</button>
          </div>
          <button className={`icon-btn ${training ? 'active' : ''}`} onClick={toggle} disabled={points.length === 0}>
            {training ? <Pause size={15} /> : <Play size={15} />}{training ? 'Pause' : converged ? 'Train again' : gaveUp ? 'Keep training' : 'Train'}
          </button>
          <button className="icon-btn" onClick={() => { setRunning(false); step(); }} disabled={points.length === 0 || converged}><StepForward size={15} />One epoch</button>
          <button className="icon-btn round" onClick={resetWeights} aria-label="Reset the weights" title="Reset weights"><RotateCcw size={15} /></button>
          <button className="icon-btn round" onClick={() => { setPoints([]); setActive(''); resetWeights(); }} aria-label="Clear all points" title="Clear points"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="ws-side">
        <p className="mono ws-label">PATTERNS</p>
        <div className="chips">
          {Object.entries(PRESETS).map(([k, v]) => <button key={k} className={`chip ${active === k ? 'on' : ''}`} onClick={() => load(k)}>{v.label}</button>)}
        </div>
        <dl className="readout">
          <div><dt className="mono">EPOCH</dt><dd className="serif">{history.length}</dd></div>
          <div><dt className="mono">MISTAKES</dt><dd className="serif">{errors}</dd></div>
          <div className="wide"><dt className="mono">WEIGHTS</dt><dd className="mono">w₁ {w.w1.toFixed(2)} · w₂ {w.w2.toFixed(2)} · b {w.b.toFixed(2)}</dd></div>
        </dl>
        <p className="mono ws-label">MISTAKES PER EPOCH</p>
        <div className="bars" aria-hidden="true">
          {history.slice(-MAX_EPOCHS).map((m, i) => <i key={i} style={{ height: `${(m / maxBar) * 100}%` }} className={m === 0 ? 'zero' : ''} />)}
          {history.length === 0 && <span className="bars-empty">Train to see the error fall</span>}
        </div>
        <p className={`ws-verdict ${converged ? 'good' : ''}`} aria-live="polite">
          {converged ? `Converged after ${history.length} epoch${history.length === 1 ? '' : 's'}. A straight line separates the classes, so the rule was guaranteed to find one.`
            : gaveUp && possible ? `Still ${errors} wrong after ${MAX_EPOCHS} epochs, but a separating line does exist. Keep training: the narrower the gap, the longer the rule takes.`
            : gaveUp ? <>Still {errors} wrong after {MAX_EPOCHS} epochs. No straight line can separate these points, so the line keeps swinging. This is the limit behind <Link href="/exhibit/exhibit-72">exhibit 72</Link>. A <Link href="/workshop#backprop">hidden layer</Link> solves it.</>
              : points.length === 0 ? 'Click the plane to place examples. Shift-click places the other class.'
                : 'Ringed points are misclassified. Each one pulls the line toward itself.'}
        </p>
      </div>
    </div>
  );
}
