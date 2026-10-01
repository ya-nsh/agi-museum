'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Download, Link2, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { perspectives, type Perspective } from '@/data/perspectives';
import { SCALE, decode, describe, encode, position, ranked, statements, trail, type Answer } from '@/data/stance';
import { Header } from '@/components/museum/header';
import { CommandPalette } from '@/components/museum/command-palette';
import { Footer } from '@/components/museum/closing';
import { RevealLines } from '@/components/museum/reveal';
import { useMuseum } from '@/components/museum/providers';
import { accession, events, type Event } from '@/lib/museum';

type Stage = 'intro' | 'quiz' | 'result';
const pos = (v: number) => `${50 + v * 42}%`;
// Remembers the visitor's own result for this session, so reloading it is not mistaken for a shared link.
const OWN_KEY = 'agi-stand-own';
const PACE = ['slowing down', 'speeding up'] as const;
const POWER = ['power with states and institutions', 'distributing power'] as const;

/** The debate map with the visitor's dot and the path their answers traced. */
function StanceMap({ answers, focus, onFocus, compact, hideMe }: { answers: Answer[]; focus?: string | null; onFocus?: (name: string) => void; compact?: boolean; hideMe?: boolean }) {
  const steps = trail(answers);
  const answered = answers.some(a => a !== null && a !== undefined);
  const me = position(answers);
  const pts = [{ x: 0, y: 0 }, ...steps].map(p => `${50 + p.x * 42},${50 - p.y * 42}`).join(' ');
  return (
    <div className={`map stance-map ${compact ? 'compact' : ''}`}>
      <span className="axis ax-x" aria-hidden="true" /><span className="axis ax-y" aria-hidden="true" />
      <span className="axis-name mono an-left">← SLOW DOWN</span>
      <span className="axis-name mono an-right">SPEED UP →</span>
      <span className="axis-name mono an-top">POWER DISTRIBUTED ↑</span>
      <span className="axis-name mono an-bottom">↓ POWER WITH STATES & INSTITUTIONS</span>
      <svg className="stance-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {answered && <polyline points={pts} vectorEffect="non-scaling-stroke" />}
      </svg>
      {perspectives.map(q => (
        <button key={q.name} className={`node ${focus === q.name ? 'on' : ''}`} style={{ left: pos(q.x), top: pos(-q.y) }} onClick={() => onFocus?.(q.name)} tabIndex={onFocus ? 0 : -1} aria-pressed={focus === q.name}>
          <span className="node-dot"><i /></span>
          <span className="node-label">{q.name}</span>
        </button>
      ))}
      {!hideMe && <motion.span className={`stance-you ${answered ? '' : 'idle'}`} initial={false} animate={{ left: pos(me.x), top: pos(-me.y) }} transition={{ type: 'spring', stiffness: 110, damping: 16 }} role="img" aria-label={`Your position: ${describe(me.x, ...PACE)}, ${describe(me.y, ...POWER)}`}>
        <i /><b className="mono">YOU</b>
      </motion.span>}
    </div>
  );
}

/** A 1200 × 630 image of the result, drawn on a canvas so it can be saved and shared. */
async function drawCard(answers: Answer[]) {
  await document.fonts.ready;
  const css = getComputedStyle(document.documentElement);
  const serif = css.getPropertyValue('--font-serif').trim() || 'Georgia, serif';
  const mono = css.getPropertyValue('--font-mono').trim() || 'monospace';
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 630;
  const g = c.getContext('2d')!;
  const me = position(answers), near = ranked(me)[0];
  g.fillStyle = '#0b0b0a'; g.fillRect(0, 0, 1200, 630);
  // Map
  const M = { x: 60, y: 55, s: 520 };
  const px = (v: number) => M.x + M.s / 2 + v * M.s * 0.42, py = (v: number) => M.y + M.s / 2 - v * M.s * 0.42;
  g.strokeStyle = 'rgba(237,232,220,0.08)'; g.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    g.beginPath(); g.moveTo(M.x + (i * M.s) / 10, M.y); g.lineTo(M.x + (i * M.s) / 10, M.y + M.s); g.stroke();
    g.beginPath(); g.moveTo(M.x, M.y + (i * M.s) / 10); g.lineTo(M.x + M.s, M.y + (i * M.s) / 10); g.stroke();
  }
  g.strokeStyle = 'rgba(237,232,220,0.25)';
  g.beginPath(); g.moveTo(M.x, M.y + M.s / 2); g.lineTo(M.x + M.s, M.y + M.s / 2); g.moveTo(M.x + M.s / 2, M.y); g.lineTo(M.x + M.s / 2, M.y + M.s); g.stroke();
  g.font = `500 13px ${mono}`; g.fillStyle = '#7b766c';
  g.textAlign = 'left'; g.fillText('← SLOW DOWN', M.x + 8, M.y + M.s / 2 - 10);
  g.textAlign = 'right'; g.fillText('SPEED UP →', M.x + M.s - 8, M.y + M.s / 2 - 10);
  g.textAlign = 'center'; g.fillText('POWER DISTRIBUTED ↑', M.x + M.s / 2, M.y + 20); g.fillText('↓ POWER WITH STATES & INSTITUTIONS', M.x + M.s / 2, M.y + M.s - 10);
  g.font = `15px ${mono}`;
  for (const q of perspectives) {
    const x = px(q.x), y = py(q.y), on = q.name === near.q.name;
    g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fillStyle = on ? '#d4f77a' : '#0b0b0a'; g.fill();
    g.strokeStyle = on ? '#d4f77a' : '#dcd7ca'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = on ? '#d4f77a' : '#aba598'; g.fillText(q.name, x, y + 26);
  }
  const mx = px(me.x), my = py(me.y);
  const glow = g.createRadialGradient(mx, my, 0, mx, my, 46);
  glow.addColorStop(0, 'rgba(212,247,122,0.45)'); glow.addColorStop(1, 'rgba(212,247,122,0)');
  g.fillStyle = glow; g.beginPath(); g.arc(mx, my, 46, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(mx, my, 10, 0, Math.PI * 2); g.fillStyle = '#d4f77a'; g.fill();
  // Text
  g.textAlign = 'left';
  g.font = `500 15px ${mono}`; g.fillStyle = '#d4f77a'; g.fillText('WHERE I STAND · AGI MUSEUM', 650, 110);
  g.font = `italic 34px ${serif}`; g.fillStyle = '#aba598'; g.fillText('Closest to', 650, 190);
  g.font = `italic 92px ${serif}`; g.fillStyle = '#ede8dc'; g.fillText(near.q.name, 646, 280);
  g.font = `28px ${serif}`; g.fillStyle = '#d4f77a'; g.fillText(near.q.title, 650, 330);
  g.font = `20px ${serif}`; g.fillStyle = '#dcd7ca';
  g.fillText(`Pace: ${describe(me.x, ...PACE).toLowerCase()}`, 650, 400);
  g.fillText(`Power: ${describe(me.y, ...POWER).toLowerCase()}`, 650, 434);
  g.font = `500 14px ${mono}`; g.fillStyle = '#7b766c';
  g.fillText('AN INTERPRETIVE MAP, NOT A MEASUREMENT', 650, 540);
  g.fillText('AGI-MUSEUM.VERCEL.APP/STAND', 650, 566);
  return new Promise<Blob | null>(res => c.toBlob(res, 'image/png'));
}

export default function Stand() {
  const router = useRouter();
  const { toast, scrollTo } = useMuseum();
  const [palette, setPalette] = useState(false);
  const [stage, setStage] = useState<Stage>('intro');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [q, setQ] = useState(0);
  const [shared, setShared] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  // A shared link (#r=31402413) opens straight onto that result.
  useEffect(() => {
    const sync = () => {
      const m = location.hash.match(/^#r=(.+)$/);
      const a = m ? decode(m[1]) : null;
      if (!a) return;
      let own = false;
      try { own = sessionStorage.getItem(OWN_KEY) === m![1]; } catch { /* storage unavailable */ }
      setAnswers(a); setStage('result'); setShared(!own); setFocus(null);
    };
    sync();
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, []);

  const start = () => { setAnswers([]); setQ(0); setShared(false); setFocus(null); setStage('quiz'); history.replaceState(null, '', location.pathname); scrollTo(0, 0); };
  const answer = useCallback((a: Answer) => {
    const next = [...answers];
    next[q] = a;
    setAnswers(next);
    if (q + 1 < statements.length) { setQ(q + 1); return; }
    setStage('result');
    history.replaceState(null, '', `#r=${encode(next)}`);
    try { sessionStorage.setItem(OWN_KEY, encode(next)); } catch { /* storage unavailable */ }
    scrollTo(0, 0);
  }, [answers, q, scrollTo]);

  // Number keys 1–5 answer, S skips, ← goes back.
  useEffect(() => {
    if (stage !== 'quiz') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea,[role=dialog]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 5) answer(n - 1);
      else if (e.key.toLowerCase() === 's') answer(null);
      else if (e.key === 'ArrowLeft' && q > 0) setQ(q - 1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [stage, answer, q]);

  const me = position(answers);
  const order = ranked(me);
  const answeredCount = answers.filter(a => a !== null && a !== undefined).length;
  const undecided = stage === 'result' && Math.hypot(me.x, me.y) < 0.12;
  const focused: Perspective = perspectives.find(p => p.name === focus) ?? order[0]?.q ?? perspectives[0];

  const copy = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#r=${encode(answers)}`); toast('Link to your result copied'); } catch { toast('Copying is not available in this browser'); }
  };
  const download = async () => {
    const blob = await drawCard(answers);
    if (!blob) { toast('Could not create the image'); return; }
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'agi-museum-where-i-stand.png' });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <Header onSearch={() => setPalette(true)} />
      <main className="stand">
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.section key="intro" className="stand-intro shell" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} aria-labelledby="stand-title">
              <div>
                <p className="mono stand-kicker">THE GREAT DEBATE · INTERACTIVE</p>
                <RevealLines as="h1" id="stand-title" className="stand-title serif" play lines={[<span key="a">Where do</span>, <span key="b"><em>you</em> stand?</span>]} />
                <p className="stand-lede">Eight statements about the pace of AI and who should hold its power. Answer each one and watch your position move across the same map the museum uses for e/acc, alignment, pause, d/acc, open models and national strategy.</p>
                <div className="hero-ctas">
                  <button className="btn btn-primary" onClick={start}><span>Begin</span><ArrowRight size={16} /></button>
                  <Link className="btn btn-ghost" href="/#debate"><span>Read the perspectives first</span><ArrowUpRight size={16} /></Link>
                </div>
                <p className="stand-fine">Takes about two minutes. Your answers stay in your browser: nothing is stored or sent anywhere. The statements and map positions are the curators’ interpretation, not a validated survey instrument.</p>
              </div>
              <StanceMap answers={[]} hideMe />
            </motion.section>
          )}

          {stage === 'quiz' && (
            <motion.section key="quiz" className="stand-quiz shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="polite">
              <div className="quiz-main">
                <div className="quiz-progress" aria-hidden="true">
                  {statements.map((s, i) => <i key={s.id} className={i < q ? 'done' : i === q ? 'now' : ''} />)}
                </div>
                <p className="mono quiz-count">STATEMENT {q + 1} OF {statements.length}</p>
                <AnimatePresence mode="wait">
                  <motion.h2 key={q} className="quiz-statement serif" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                    “{statements[q].text}”
                  </motion.h2>
                </AnimatePresence>
                <div className="quiz-scale" role="radiogroup" aria-label="How much do you agree?">
                  {SCALE.map((label, i) => (
                    <button key={label} role="radio" aria-checked={answers[q] === i} className={`scale-btn s${i} ${answers[q] === i ? 'on' : ''}`} onClick={() => answer(i)}>
                      <span className="scale-mark" aria-hidden="true" /><span>{label}</span><kbd>{i + 1}</kbd>
                    </button>
                  ))}
                </div>
                <div className="quiz-nav">
                  <button className="text-btn" onClick={() => setQ(q - 1)} disabled={q === 0}><ArrowLeft size={14} /> Previous</button>
                  <button className="text-btn" onClick={() => answer(null)}>Skip this one</button>
                </div>
              </div>
              <div className="quiz-side">
                <StanceMap answers={answers.slice(0, q)} compact />
                <p className="mono quiz-where">{answers.slice(0, q).some(a => a !== null) ? `${describe(position(answers.slice(0, q)).x, ...PACE).toUpperCase()} · ${describe(position(answers.slice(0, q)).y, ...POWER).toUpperCase()}` : 'YOUR DOT WILL MOVE AS YOU ANSWER'}</p>
              </div>
            </motion.section>
          )}

          {stage === 'result' && (
            <motion.section key="result" className="stand-result shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-labelledby="result-title">
              {shared && (
                <div className="shared-banner">
                  <span className="mono">A SHARED RESULT</span>
                  <p>Someone placed themselves here. Where would you land?</p>
                  <button className="btn btn-primary" onClick={start}><span>Take it yourself</span><ArrowRight size={16} /></button>
                </div>
              )}
              <div className="result-head">
                <p className="mono stand-kicker">{shared ? 'THEIR POSITION' : 'YOUR POSITION'} · {answeredCount} OF {statements.length} ANSWERED</p>
                {undecided
                  ? <RevealLines as="h1" id="result-title" className="result-title serif" play lines={[<span key="a">Right in the</span>, <span key="b"><em>middle.</em></span>]} />
                  : <RevealLines as="h1" id="result-title" className="result-title serif" play lines={[<span key="a">Closest to</span>, <span key="b"><em>{order[0].q.name}.</em></span>]} />}
                <dl className="result-axes">
                  <div><dt className="mono">PACE</dt><dd className="serif">{describe(me.x, ...PACE)}</dd><dd className="axis-bar"><i style={{ left: pos(me.x) }} /></dd></div>
                  <div><dt className="mono">POWER</dt><dd className="serif">{describe(me.y, ...POWER)}</dd><dd className="axis-bar"><i style={{ left: pos(me.y) }} /></dd></div>
                </dl>
              </div>

              <div className="result-layout">
                <StanceMap answers={answers} focus={focused.name} onFocus={setFocus} />
                <div className="result-side">
                  <ol className="closeness">
                    {order.map(r => (
                      <li key={r.q.name}>
                        <button className={focused.name === r.q.name ? 'on' : ''} onClick={() => setFocus(r.q.name)}>
                          <span>{r.q.name}</span>
                          <span className="close-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${Math.round(r.closeness * 100)}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} /></span>
                          <span className="mono">{Math.round(r.closeness * 100)}%</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <AnimatePresence mode="wait">
                    <motion.div key={focused.name} className="perspective-card stance-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <h3 className="serif pc-name">{focused.name}</h3>
                      <p className="pc-title serif"><em>{focused.title}</em></p>
                      <p className="pc-body">{focused.body}</p>
                      <dl className="pc-grid">
                        <div><dt className="mono">WANTS</dt><dd>{focused.wants}</dd></div>
                        <div><dt className="mono">FEARS</dt><dd>{focused.worries}</dd></div>
                      </dl>
                      <div className="pc-foot"><span>{focused.people}</span><a href={focused.source} target="_blank" rel="noreferrer">{focused.sourceName}<ArrowUpRight size={15} /></a></div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="result-actions">
                {!shared && <button className="btn btn-primary" onClick={copy}><span>Copy a link to this result</span><Link2 size={16} /></button>}
                <button className="btn btn-ghost" onClick={download}><span>Save as image</span><Download size={16} /></button>
                <button className="btn btn-ghost" onClick={start}><span>{shared ? 'Take it yourself' : 'Start again'}</span><RotateCcw size={16} /></button>
              </div>

              <section className="result-answers" aria-labelledby="answers-title">
                <p className="mono" id="answers-title">{shared ? 'THEIR ANSWERS' : 'YOUR ANSWERS'}, AND WHERE TO READ MORE</p>
                <ol>
                  {statements.map((s, i) => {
                    const ex = s.exhibit ? events.find(e => e.id === s.exhibit) : undefined;
                    const a = answers[i];
                    return (
                      <li key={s.id}>
                        <span className="mono ra-num">{String(i + 1).padStart(2, '0')}</span>
                        <p className="serif">{s.text}</p>
                        <span className={`ra-answer ${a === null || a === undefined ? 'skip' : a > 2 ? 'agree' : a < 2 ? 'disagree' : ''}`}>{a === null || a === undefined ? 'Skipped' : SCALE[a]}</span>
                        {ex ? <Link className="ra-link mono" href={`/exhibit/${ex.id}`}>NO. {accession(ex)} · {ex.title} <ArrowUpRight size={12} /></Link> : <span />}
                      </li>
                    );
                  })}
                </ol>
                <p className="stand-fine"><Check size={13} /> Positions come from weighting each answer along the map’s two axes. The map, the statements and their weights are the curators’ interpretation of an argument, not a measurement of a person. Overlapping views are normal: most people borrow from several perspectives.</p>
              </section>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
      <Footer />
      <CommandPalette open={palette} onOpenChange={setPalette} onSelect={(e: Event) => router.push(`/exhibit/${e.id}`)} />
    </>
  );
}
