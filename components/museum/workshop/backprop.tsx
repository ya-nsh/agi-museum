'use client';

import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DATASETS, Net } from './backprop-net';

const GRID = 64;
const SIZE = 400;
const RATES = [0.03, 0.1, 0.3, 1];
const SPEEDS = [1, 5, 25];
const DONE = 0.02;
const HISTORY = 240;

// Class colors: the same teal and coral as the Technology and Ideas threads.
const A = [127, 214, 200], B = [255, 159, 122], BG = [16, 16, 14];

export default function Backprop({ preset = 'xor' }: { preset?: string }) {
  const [dataset, setDataset] = useState(preset in DATASETS ? preset : 'xor');
  const [hidden, setHidden] = useState(4);
  const [rate, setRate] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [net, setNet] = useState(() => new Net(4, `bp-${preset}-4-0`));
  const [losses, setLosses] = useState<number[]>([]);
  const data = useMemo(() => DATASETS[dataset].make(), [dataset]);
  const seed = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  const reset = (h = hidden, d = dataset) => {
    setRunning(false);
    setNet(new Net(h, `bp-${d}-${h}-${++seed.current}`));
    setLosses([]);
  };

  // Repaint the decision field whenever the weights change.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(GRID, GRID);
    const hid = new Float64Array(net.h);
    for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
      const x = (i + 0.5) / GRID * 2 - 1, y = 1 - (j + 0.5) / GRID * 2;
      const { p } = net.forward(x, y, hid);
      // Confidence fades toward the background near the boundary.
      const conf = Math.abs(p - 0.5) * 2, col = p >= 0.5 ? A : B, k = 0.12 + 0.38 * conf;
      const o = (j * GRID + i) * 4;
      for (let ch = 0; ch < 3; ch++) img.data[o + ch] = BG[ch] + (col[ch] - BG[ch]) * k;
      img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [net, losses]);

  const step = useCallback((n: number) => {
    let loss = 0;
    for (let i = 0; i < n; i++) loss = net.train(data, RATES[rate]);
    setLosses(l => [...l.slice(-(HISTORY - 1)), loss]);
    return loss;
  }, [net, data, rate]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      if (step(speed) < DONE) { setRunning(false); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, step, speed]);

  const n = net;
  const loss = losses.at(-1);
  const learned = loss !== undefined && loss < DONE;
  const acc = n.accuracy(data);
  const s = (v: number) => ((v + 1) / 2) * SIZE;
  const maxLoss = Math.max(0.7, ...losses);
  const spark = losses.map((l, i) => `${i ? 'L' : 'M'} ${(i / (HISTORY - 1)) * 200} ${48 - (l / maxLoss) * 46}`).join(' ');

  // Network diagram: line width and color show each weight's size and sign.
  const nx = [24, 130, 236], ny = (i: number, count: number) => 20 + ((i + 0.5) / count) * 160;
  const maxW = Math.max(1, ...Array.from(n.w1, Math.abs), ...Array.from(n.w2, Math.abs));
  const edge = (w: number) => ({ stroke: w >= 0 ? 'var(--tech)' : 'var(--ideas)', strokeWidth: 0.4 + (Math.abs(w) / maxW) * 3.2, opacity: 0.25 + (Math.abs(w) / maxW) * 0.75 });

  return (
    <div className="ws-plane-layout">
      <div className="ws-stage">
        <div className="plane bp-plane">
          <canvas ref={canvas} width={GRID} height={GRID} aria-hidden="true" />
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${data.length} training points. The network classifies ${Math.round(acc * 100)} percent correctly.`}>
            {data.map((p, i) => <circle key={i} cx={s(p.x)} cy={s(-p.y)} r={4.5} className={`bp-pt ${p.t ? 'a' : 'b'}`} />)}
          </svg>
        </div>
        <div className="ws-toolbar">
          <button className={`icon-btn ${running ? 'active' : ''}`} onClick={() => { if (learned) { reset(); setRunning(true); } else setRunning(r => !r); }}>
            {running ? <Pause size={15} /> : <Play size={15} />}{running ? 'Pause' : learned ? 'Train a new network' : n.epoch ? 'Resume' : 'Train'}
          </button>
          <button className="icon-btn" onClick={() => { setRunning(false); step(10); }} disabled={learned}><StepForward size={15} />10 steps</button>
          <button className="icon-btn round" onClick={() => reset()} aria-label="New random weights" title="New random weights"><RotateCcw size={15} /></button>
          <div className="ws-seg small" role="radiogroup" aria-label="Training speed">
            {SPEEDS.map(v => <button key={v} role="radio" aria-checked={speed === v} className={speed === v ? 'on' : ''} onClick={() => setSpeed(v)}>{v}×</button>)}
          </div>
        </div>
      </div>

      <div className="ws-side">
        <p className="mono ws-label">PATTERN</p>
        <div className="chips">
          {Object.entries(DATASETS).map(([k, v]) => <button key={k} className={`chip ${dataset === k ? 'on' : ''}`} onClick={() => { setDataset(k); reset(hidden, k); }}>{v.label}</button>)}
        </div>
        <div className="bp-settings">
          <label><span className="mono">HIDDEN UNITS · {hidden}</span>
            <input type="range" min={1} max={8} value={hidden} onChange={e => { const h = Number(e.target.value); setHidden(h); reset(h); }} />
          </label>
          <label><span className="mono">LEARNING RATE · {RATES[rate]}</span>
            <input type="range" min={0} max={RATES.length - 1} value={rate} onChange={e => setRate(Number(e.target.value))} />
          </label>
        </div>
        <svg viewBox="0 0 260 200" className="bp-net" aria-hidden="true">
          {Array.from({ length: n.h }, (_, j) => (
            <g key={j}>
              {[0, 1].map(k => <line key={k} x1={nx[0]} y1={ny(k, 2)} x2={nx[1]} y2={ny(j, n.h)} {...edge(n.w1[j * 2 + k])} />)}
              <line x1={nx[1]} y1={ny(j, n.h)} x2={nx[2]} y2={100} {...edge(n.w2[j])} />
            </g>
          ))}
          {[0, 1].map(k => <g key={k}><circle cx={nx[0]} cy={ny(k, 2)} r={9} className="bp-node" /><text x={nx[0]} y={ny(k, 2) + 4} textAnchor="middle">{k ? 'y' : 'x'}</text></g>)}
          {Array.from({ length: n.h }, (_, j) => <circle key={j} cx={nx[1]} cy={ny(j, n.h)} r={7} className="bp-node hidden" />)}
          <circle cx={nx[2]} cy={100} r={10} className="bp-node out" />
        </svg>
        <dl className="readout">
          <div><dt className="mono">STEPS</dt><dd className="serif">{n.epoch}</dd></div>
          <div><dt className="mono">ACCURACY</dt><dd className="serif">{Math.round(acc * 100)}%</dd></div>
          <div className="wide"><dt className="mono">LOSS {loss !== undefined ? `· ${loss.toFixed(3)}` : ''}</dt>
            <dd><svg viewBox="0 0 200 50" className="spark" preserveAspectRatio="none" aria-hidden="true"><path d={spark} /></svg></dd></div>
        </dl>
        <p className={`ws-verdict ${learned ? 'good' : ''}`} aria-live="polite">
          {learned ? `Learned in ${n.epoch} steps. The hidden units have carved the plane into regions no single line could make.`
            : n.epoch > 3000 && acc < 0.97 ? `Stuck around ${Math.round(acc * 100)}%. This pattern may need more hidden units. Each one contributes one soft boundary.`
              : 'Teal edges are positive weights, coral are negative. Thicker means stronger.'}
        </p>
      </div>
    </div>
  );
}
