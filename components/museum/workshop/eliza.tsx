'use client';

import { AnimatePresence, motion } from 'motion/react';
import { CornerDownLeft, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMuseum } from '../providers';
import { Eliza as Engine, GREETING, type Trace } from './eliza-engine';

type Line = { id: number; who: 'eliza' | 'you'; text: string; trace?: Trace };

const noop = () => {};
const PROMPTS = ['Men are all alike.', 'My mother takes care of me.', 'I am unhappy.', 'I think you are not listening.', 'Do computers frighten you?', 'I need some help.'];

function Typed({ text, instant, onDone }: { text: string; instant: boolean; onDone: () => void }) {
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (n >= text.length) { onDone(); return; }
    const t = setTimeout(() => setN(v => v + 1), 26);
    return () => clearTimeout(t);
  }, [n, text, onDone]);
  return <>{text.slice(0, n)}{n < text.length && <span className="tty-cursor" aria-hidden="true" />}</>;
}

function Curtain({ t }: { t: Trace }) {
  if (t.kind === 'none') return <p><b>NO KEYWORD FOUND.</b> Falls back to a stock line: “{t.template}”</p>;
  if (t.kind === 'memory') return <p><b>NO KEYWORD FOUND.</b> Recalls something stored earlier from a sentence with “my”: “{t.template}”</p>;
  return (
    <>
      <p><b>KEYWORD</b> “{t.keyword}” <span>rank {t.rank}</span>{t.via && <span> · reached via “{t.via}”</span>}</p>
      <p><b>PATTERN</b> <code>{t.pattern}</code></p>
      {t.parts.map(p => <p key={p.index}><b>PART ({p.index})</b> “{p.text}” <span>→ reflected →</span> “{p.reflected}”</p>)}
      <p><b>TEMPLATE</b> <code>{t.template}</code></p>
      {t.remembered && <p><b>MEMORY</b> stored for later: “{t.remembered}”</p>}
    </>
  );
}

export default function Eliza() {
  const { reduced } = useMuseum();
  const engine = useRef(new Engine());
  const id = useRef(1);
  const [lines, setLines] = useState<Line[]>([{ id: 0, who: 'eliza', text: GREETING }]);
  const [typing, setTyping] = useState(0);
  const [draft, setDraft] = useState('');
  const [curtain, setCurtain] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const done = useCallback(() => setTyping(-1), []);

  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); }, [lines, curtain, reduced]);

  const send = (text: string) => {
    const clean = text.trim().slice(0, 240);
    if (!clean) return;
    const r = engine.current.reply(clean);
    const you: Line = { id: id.current++, who: 'you', text: clean };
    const her: Line = { id: id.current++, who: 'eliza', text: r.text, trace: r.trace };
    setLines(l => [...l, you, her]);
    setTyping(her.id);
    setDraft('');
  };
  const reset = () => { engine.current = new Engine(); setLines([{ id: 0, who: 'eliza', text: GREETING }]); setTyping(0); };
  const exchanges = lines.filter(l => l.who === 'you').length;

  return (
    <div className="ws-eliza">
      <div className="tty">
        <div className="tty-head mono">
          <span><i className="tty-led" /> DOCTOR · A RECONSTRUCTION</span>
          <span className="tty-tools">
            <button className={`tty-toggle ${curtain ? 'on' : ''}`} onClick={() => setCurtain(c => !c)} aria-pressed={curtain}>
              {curtain ? <EyeOff size={14} /> : <Eye size={14} />} BEHIND THE CURTAIN
            </button>
            <button onClick={reset} aria-label="Start a new session" title="New session"><RotateCcw size={14} /></button>
          </span>
        </div>
        <div className="tty-log" ref={log} data-lenis-prevent role="log" aria-live="polite" aria-label="Conversation with ELIZA">
          {lines.map(l => (
            <div key={l.id} className={`tty-line ${l.who}`}>
              <span className="tty-who mono">{l.who === 'eliza' ? 'ELIZA' : 'YOU'}</span>
              <p>{l.who === 'eliza' ? <Typed text={l.text.toUpperCase()} instant={reduced || l.id !== typing} onDone={l.id === typing ? done : noop} /> : l.text}</p>
              <AnimatePresence initial={false}>
                {curtain && l.trace && (l.id !== typing) && (
                  <motion.div className="tty-trace" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                    <Curtain t={l.trace} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <form className="tty-input" onSubmit={e => { e.preventDefault(); send(draft); }}>
          <span className="mono" aria-hidden="true">&gt;</span>
          <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type to ELIZA…" aria-label="Your message to ELIZA" maxLength={240} autoComplete="off" />
          <button type="submit" className="icon-btn round" aria-label="Send" disabled={!draft.trim()}><CornerDownLeft size={15} /></button>
        </form>
      </div>
      <div className="ws-side">
        <p className="mono ws-label">OR SAY</p>
        <div className="chips">
          {PROMPTS.map(p => <button key={p} className="chip" onClick={() => send(p)}>{p}</button>)}
        </div>
        <p className="ws-verdict" aria-live="polite">
          {exchanges === 0 ? 'ELIZA holds no facts about the world. Every reply is assembled from your own words.'
            : curtain ? 'Every reply is one pattern match and one template. Nothing else is going on.'
              : exchanges >= 3 ? 'Does it feel like listening? Open “Behind the curtain” to see how each reply was made.'
                : 'Keep talking. Try mentioning your family, a dream or a computer.'}
        </p>
      </div>
    </div>
  );
}
