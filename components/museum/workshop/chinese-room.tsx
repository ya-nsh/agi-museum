'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Delete, Languages, RotateCcw, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { seeded } from '@/lib/museum';

// Simple Mandarin exchanges. The replies are written without punctuation so
// that only characters need to be copied from the tray.
const RULES = [
  { q: '你好吗', a: '我很好谢谢', qEn: 'How are you?', aEn: 'I’m very well, thank you.' },
  { q: '你会说中文吗', a: '我说得很流利', qEn: 'Can you speak Chinese?', aEn: 'I speak it very fluently.' },
  { q: '你明白我的问题吗', a: '当然明白', qEn: 'Do you understand my question?', aEn: 'Of course I understand.' },
  { q: '今天天气怎么样', a: '今天天气很好', qEn: 'What’s the weather like today?', aEn: 'The weather is lovely today.' },
  { q: '你是人还是机器', a: '这个问题很有意思', qEn: 'Are you a person or a machine?', aEn: 'That is a very interesting question.' },
];
const ALL_CHARS = [...new Set(RULES.flatMap(r => [...r.a]))];

const VERDICTS = [
  (s: number) => `A perfect reply${s > 40 ? ', if a little slow' : ''}. Whoever is in there speaks Chinese.`,
  () => 'Fluent again. There must be a native speaker in that room.',
  () => 'Flawless. The person inside clearly understands every word.',
  () => 'Word-perfect. I would swear they grew up in Beijing.',
  () => 'Five for five. Nobody could answer like that without understanding.',
];

/** Fisher–Yates with a seeded generator, so the tray is identical on server and client. */
function shuffle<T>(items: T[], r: () => number) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function trayFor(round: number, answer: string) {
  const r = seeded(`room-${round}`);
  const decoys = shuffle(ALL_CHARS.filter(c => !answer.includes(c)), r).slice(0, 6);
  return shuffle([...new Set([...answer]), ...decoys], r);
}

export default function ChineseRoom() {
  const order = useMemo(() => [0, 3, 1, 4, 2], []);
  const [round, setRound] = useState(0);
  const [reply, setReply] = useState('');
  const [wrong, setWrong] = useState(false);
  const [log, setLog] = useState<{ rule: number; seconds: number }[]>([]);
  const [translate, setTranslate] = useState(false);
  const started = useRef(0);
  const finished = round >= order.length;
  const rule = RULES[order[Math.min(round, order.length - 1)]];
  const tray = useMemo(() => trayFor(round, rule.a), [round, rule.a]);

  // The clock starts at the first tap of each round, not when the slip appears off-screen.
  useEffect(() => { started.current = 0; }, [round]);
  // Event timestamps share performance.now()'s clock.
  const tap = (c: string, at: number) => {
    if (!started.current) started.current = at;
    setWrong(false);
    setReply(r => (r.length < 12 ? r + c : r));
  };

  const pass = (at: number) => {
    if (reply !== rule.a) { setWrong(true); return; }
    const seconds = (at - (started.current || at)) / 1000;
    setLog(l => [...l, { rule: order[round], seconds }]);
    setReply('');
    setWrong(false);
    setRound(r => r + 1);
  };
  const restart = () => { setRound(0); setReply(''); setLog([]); setWrong(false); setTranslate(false); };
  const last = log[log.length - 1];

  return (
    <div className="ws-room">
      <div className="room">
        <div className="room-outside">
          <p className="mono ws-label">OUTSIDE THE DOOR</p>
          <AnimatePresence mode="wait">
            <motion.p key={log.length} className="room-verdict serif" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-live="polite">
              {last ? `“${VERDICTS[log.length - 1](last.seconds)}”` : '“Let’s see if anyone in there understands Chinese.”'}
            </motion.p>
          </AnimatePresence>
          {log.length > 0 && <p className="room-time mono">LAST REPLY TOOK {last.seconds.toFixed(1)} S · {log.length} / {order.length} ANSWERED</p>}
        </div>

        {!finished ? (
          <div className="room-inside">
            <div className="room-slip">
              <p className="mono ws-label">SLIP UNDER THE DOOR</p>
              <motion.p key={round} className="slip-text" lang="zh-Hans" initial={{ x: -30, opacity: 0, rotate: -3 }} animate={{ x: 0, opacity: 1, rotate: -1 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>{rule.q}</motion.p>
              {translate && <p className="slip-en">{rule.qEn}</p>}
            </div>
            <div className="room-compose">
              <p className="mono ws-label">YOUR REPLY</p>
              <p className={`compose-box ${wrong ? 'wrong' : ''}`} lang="zh-Hans" aria-live="polite">{reply || <span className="compose-empty">Tap characters from the tray</span>}</p>
              <div className="tray" role="group" aria-label="Tray of characters">
                {tray.map(c => <button key={c} lang="zh-Hans" onClick={e => tap(c, e.timeStamp)}>{c}</button>)}
              </div>
              <div className="ws-toolbar">
                <button className="icon-btn" onClick={() => { setWrong(false); setReply(r => r.slice(0, -1)); }} disabled={!reply}><Delete size={15} />Erase</button>
                <button className="icon-btn active" onClick={e => pass(e.timeStamp)} disabled={!reply}><Send size={15} />Pass it out</button>
              </div>
              {wrong && <p className="room-warn">That doesn’t match the rulebook. Compare the shapes again, one character at a time.</p>}
            </div>
          </div>
        ) : (
          <div className="room-inside room-done">
            <p className="serif room-done-title">You answered five questions in perfect Chinese.</p>
            <p>Did you understand any of them? Searle’s claim is that a computer running a program is in exactly your position: it follows rules for shuffling symbols, and syntax alone is not meaning.</p>
            <div className="ws-toolbar">
              <button className={`icon-btn ${translate ? 'active' : ''}`} onClick={() => setTranslate(t => !t)}><Languages size={15} />{translate ? 'Hide translation' : 'Reveal what you said'}</button>
              <button className="icon-btn" onClick={restart}><RotateCcw size={15} />Go back in</button>
            </div>
            {translate && (
              <ul className="room-transcript">
                {log.map(l => (
                  <li key={l.rule}><span lang="zh-Hans">{RULES[l.rule].q}</span><span>{RULES[l.rule].qEn}</span><span lang="zh-Hans">{RULES[l.rule].a}</span><span>{RULES[l.rule].aEn}</span></li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="ws-side">
        <p className="mono ws-label">THE RULEBOOK</p>
        <ol className="rulebook">
          {RULES.map((r, i) => (
            <li key={i}>
              <span className="mono">IF THE SLIP READS</span>
              <span className="rb-glyph" lang="zh-Hans">{r.q}</span>
              <span className="mono">WRITE</span>
              <span className="rb-glyph" lang="zh-Hans">{r.a}</span>
              {translate && <span className="rb-en">{r.qEn} → {r.aEn}</span>}
            </li>
          ))}
        </ol>
        {!finished && <button className="text-btn" onClick={() => setTranslate(t => !t)}>{translate ? 'Hide the English' : 'Cheat: show the English'}</button>}
      </div>
    </div>
  );
}
