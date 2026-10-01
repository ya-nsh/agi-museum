'use client';

import { motion, useInView } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { computeLandmarks, computePoints, computeSource, type Landmark } from '@/data/compute';
import { Eyebrow, RevealLines } from './reveal';

const W = 1000, H = 560, M = { l: 70, r: 28, t: 28, b: 46 };
const X0 = 1948, X1 = 2028, Y0 = 0, Y1 = 28;
// Piecewise time axis: 1948–2010 gets 42% of the width, the dense deep-learning
// era gets the rest. The break is marked on the chart.
const BREAK = 2010, SPLIT = 0.42;
const sx = (x: number) => {
  const t = x < BREAK ? ((x - X0) / (BREAK - X0)) * SPLIT : SPLIT + ((x - BREAK) / (X1 - BREAK)) * (1 - SPLIT);
  return M.l + t * (W - M.l - M.r);
};
const sy = (y: number) => H - M.b - ((y - Y0) / (Y1 - Y0)) * (H - M.t - M.b);

function fit(pts: [number, number][]) {
  const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  const b = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  return { b, a: my - b * mx };
}

const sup = (n: number) => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('');
const sciParts = (flop: number) => { const e = Math.floor(Math.log10(flop)); const m = flop / 10 ** e; return m >= 9.95 ? { m: '1', e: e + 1 } : { m: m.toFixed(1).replace(/\.0$/, ''), e }; };
const Sci = ({ v }: { v: number }) => { const { m, e } = sciParts(v); return <>{m}<span className="times">×</span>10<sup>{e}</sup></>; };
const sci = (flop: number) => { const e = Math.floor(Math.log10(flop)); const m = flop / 10 ** e; return `${m >= 9.95 ? '1' : m.toFixed(1).replace(/\.0$/, '')}×10${sup(m >= 9.95 ? e + 1 : e)}`; };

export function ComputeChart() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -25% 0px' });
  const [hover, setHover] = useState<Landmark | null>(null);

  const { early, modern } = useMemo(() => {
    const e = fit(computePoints.filter(p => p[0] < 2010)), m = fit(computePoints.filter(p => p[0] >= 2010));
    return { early: { ...e, from: 1950, to: 2010 }, modern: { ...m, from: 2010, to: 2026.8 } };
  }, []);
  const line = (f: { a: number; b: number; from: number; to: number }) => `M ${sx(f.from)} ${sy(f.a + f.b * f.from)} L ${sx(f.to)} ${sy(f.a + f.b * f.to)}`;
  const perYear = 10 ** modern.b, doubling = (12 * Math.log10(2)) / early.b;
  const first = computeLandmarks[1], last = computeLandmarks[computeLandmarks.length - 1];
  const ratio = last.flop / first.flop;

  return (
    <section id="compute" className="compute shell" aria-labelledby="compute-title">
      <div className="section-head">
        <div>
          <Eyebrow index="04">THE COMPUTE CLIMB</Eyebrow>
          <RevealLines id="compute-title" className="section-title serif" lines={[<span key="a">Twenty-five orders</span>, <span key="b">of <em>magnitude.</em></span>]} />
        </div>
        <p className="section-lede">Each dot is a notable AI model, placed by the arithmetic spent training it. The vertical axis is logarithmic: every gridline is ten thousand times the one below. Hover or tab to the highlighted models for details.</p>
      </div>

      <div className="compute-layout">
        <div className="chart-frame" ref={ref}>
          <div className="chart-scroll" data-lenis-prevent>
            <svg viewBox={`0 0 ${W} ${H}`} className={`chart ${seen ? 'on' : ''}`} role="group" aria-label="Training compute of notable AI models, 1950 to 2026" aria-describedby="compute-desc">
              <desc id="compute-desc">Scatter plot of training compute for {computePoints.length} notable AI models from 1950 to 2026 on a logarithmic scale, rising from about 40 operations to about 10 to the 27th. Growth accelerates sharply after 2010.</desc>
              {Array.from({ length: Y1 / 4 + 1 }, (_, i) => i * 4).map(y => (
                <g key={y} className="grid" aria-hidden="true">
                  <line x1={M.l} x2={W - M.r} y1={sy(y)} y2={sy(y)} />
                  <text x={M.l - 12} y={sy(y) + 4} textAnchor="end">10{sup(y)}</text>
                </g>
              ))}
              {[1950, 1960, 1970, 1980, 1990, 2000, 2010, 2014, 2018, 2022, 2026].map(x => (
                <text key={x} aria-hidden="true" className="axis-x" x={sx(x)} y={H - M.b + 26} textAnchor="middle">{x}</text>
              ))}
              <text aria-hidden="true" className="axis-label" x={M.l} y={M.t - 10}>TRAINING COMPUTE (FLOP)</text>
              <rect aria-hidden="true" className="era-band" x={sx(2010)} y={M.t} width={sx(2028) - sx(2010)} height={H - M.t - M.b} />
              <text aria-hidden="true" className="axis-label" x={sx(2010) + 10} y={H - M.b - 12}>DEEP LEARNING ERA</text>
              <g className="scale-break" aria-hidden="true"><line x1={sx(BREAK)} x2={sx(BREAK)} y1={M.t} y2={H - M.b} /><text x={sx(BREAK) + 10} y={M.t + 14}>TIME SCALE WIDENS ×{(((1 - SPLIT) / (X1 - BREAK)) / (SPLIT / (BREAK - X0))).toFixed(1)}</text></g>

              <g className="points" aria-hidden="true">
                {computePoints.map(([x, y], i) => (
                  <circle key={i} cx={sx(x)} cy={sy(y)} r={2.2} style={{ animationDelay: `${((sx(x) - M.l) / (W - M.l - M.r)) * 1.6}s` }} />
                ))}
              </g>
              <motion.path aria-hidden="true" className="trend early" d={line(early)} initial={{ pathLength: 0 }} animate={seen ? { pathLength: 1 } : undefined} transition={{ duration: 1.4, delay: 0.6, ease: 'easeInOut' }} />
              <motion.path aria-hidden="true" className="trend modern" d={line(modern)} initial={{ pathLength: 0 }} animate={seen ? { pathLength: 1 } : undefined} transition={{ duration: 1, delay: 1.9, ease: 'easeOut' }} />

              {computeLandmarks.map(l => {
                const x = sx(l.year), y = sy(Math.log10(l.flop));
                const pos = l.label ?? (x > W * 0.8 ? 'left' : 'right');
                const tx = pos === 'left' ? x - 12 : pos === 'right' ? x + 12 : x;
                const ty = pos === 'above' ? y - 14 : pos === 'below' ? y + 22 : y + 4;
                return (
                  <motion.g key={l.name} className={`landmark ${hover === l ? 'on' : ''}`} initial={{ opacity: 0 }} animate={seen ? { opacity: 1 } : undefined} transition={{ delay: 0.4 + ((sx(l.year) - M.l) / (W - M.l - M.r)) * 1.8 }}
                    onPointerEnter={() => setHover(l)} onPointerLeave={() => setHover(null)}
                    tabIndex={0} role="img" aria-label={`${l.name}, ${l.org}, ${Math.floor(l.year)}: about ${sci(l.flop)} FLOP of training compute (${l.confidence})`}
                    onFocus={() => setHover(l)} onBlur={() => setHover(h => (h === l ? null : h))}>
                    <circle className="hit" cx={x} cy={y} r={16} />
                    <circle className="ring" cx={x} cy={y} r={7} />
                    <circle className="core" cx={x} cy={y} r={3.4} />
                    <text className={l.label ? undefined : 'quiet'} x={tx} y={ty} textAnchor={pos === 'left' ? 'end' : pos === 'right' ? 'start' : 'middle'}>{l.name}</text>
                  </motion.g>
                );
              })}
              {hover && (() => {
                const x = sx(hover.year), y = sy(Math.log10(hover.flop));
                const left = x > W * 0.62, bw = 230;
                return (
                  <g className="tooltip" aria-hidden="true" transform={`translate(${left ? x - bw - 18 : x + 18} ${Math.max(M.t, y - 70)})`} pointerEvents="none">
                    <rect width={bw} height={78} rx={2} />
                    <text x={14} y={24} className="tt-name">{hover.name}</text>
                    <text x={14} y={44}>{hover.org} · {Math.floor(hover.year)}</text>
                    <text x={14} y={64} className="tt-flop">≈ {sci(hover.flop)} FLOP · {hover.confidence.toUpperCase()}</text>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
        <aside className="compute-facts">
          <div><strong className="serif">{perYear.toFixed(1)}<span className="times">×</span></strong><span>growth per year in training compute since 2010, fitted across the models shown.</span></div>
          <div><strong className="serif">~{Math.round(doubling)} mo</strong><span>doubling time before 2010, roughly the pace of Moore’s law.</span></div>
          <div><strong className="serif"><Sci v={ratio} /></strong><span>times more compute for {last.name} ({Math.floor(last.year)}) than the {first.name} ({Math.floor(first.year)}).</span></div>
          <a className="source-inline mono" href={computeSource} target="_blank" rel="noreferrer">DATA: EPOCH AI, NOTABLE AI MODELS · RETRIEVED 30 SEP 2026 <ArrowUpRight size={13} /></a>
          <p className="fineprint">Recent frontier values are mostly third-party estimates labeled Likely or Speculative by Epoch AI. Compute is an input, not a measure of intelligence.</p>
        </aside>
      </div>
    </section>
  );
}
