'use client';

import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useMuseum } from './providers';

const EASE = [0.22, 1, 0.36, 1] as const;

type LinesProps = {
  lines: React.ReactNode[]; className?: string; delay?: number; as?: 'h1' | 'h2' | 'h3' | 'p'; stagger?: number; id?: string;
};

/**
 * Headline lines that rise out of a mask, one after another. With `play` they
 * rise as the page loads, driven by CSS so the headline never waits for
 * hydration; otherwise they rise the first time they scroll into view.
 */
export function RevealLines({ play, ...props }: LinesProps & { play?: boolean }) {
  return play ? <LinesOnLoad {...props} /> : <LinesInView {...props} />;
}

function LinesOnLoad({ lines, className, delay = 0, as: Tag = 'h2', stagger = 0.09, id }: LinesProps) {
  return (
    <Tag className={`${className ?? ''} lines-enter`} id={id} style={{ '--d': `${delay}s`, '--stagger': `${stagger}s` } as React.CSSProperties}>
      {lines.map((line, i) => (
        <span className="line-mask" key={i}>
          <span className="line-inner" style={{ '--i': i } as React.CSSProperties}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

function LinesInView({ lines, className, delay = 0, as: Tag = 'h2', stagger = 0.09, id }: LinesProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  return (
    <Tag ref={ref} className={className} id={id}>
      {lines.map((line, i) => (
        <span className="line-mask" key={i}>
          <motion.span className="line-inner" initial={{ y: '108%', rotate: 2.5 }} animate={seen ? { y: '0%', rotate: 0 } : undefined} transition={{ duration: 1.15, delay: delay + i * stagger, ease: EASE }}>
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Fade-and-rise on first view. Opacity and transform only: both stay on the compositor. */
export function Reveal({ children, className, delay = 0, y = 28, as = 'div', ...rest }: {
  children: React.ReactNode; className?: string; delay?: number; y?: number; as?: 'div' | 'section' | 'p' | 'li' | 'span';
} & React.HTMLAttributes<HTMLElement>) {
  const M = motion[as] as typeof motion.div;
  return (
    <M className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ duration: 0.9, delay, ease: EASE }} {...(rest as object)}>
      {children}
    </M>
  );
}

/** Number that counts up the first time it scrolls into view. */
export function CountUp({ to, from = 0, duration = 1.6, className, pad = 0, play }: { to: number; from?: number; duration?: number; className?: string; pad?: number; play?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const { reduced } = useMuseum();
  const v = useMotionValue(from);
  const text = useTransform(v, n => String(Math.round(n)).padStart(pad, '0'));
  useEffect(() => {
    if (!(play ?? seen)) return;
    if (reduced) { v.set(to); return; }
    const c = animate(v, to, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [play, seen, to, duration, reduced, v]);
  return <motion.span ref={ref} className={className}>{text}</motion.span>;
}

/** Section eyebrow with an index number and a line that draws itself in. */
export function Eyebrow({ index, children, className }: { index?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`eyebrow-row ${className ?? ''}`}>
      {index && <span className="mono idx">{index}</span>}
      <motion.span className="rule" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }} />
      <span className="mono">{children}</span>
    </div>
  );
}
