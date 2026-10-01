import { sigilShapes } from '@/components/museum/sigil';
import type { Event } from './museum';

// Helpers for artwork drawn on a canvas so visitors can save it as an image.

export const TRACK_INK: Record<Event['track'], { night: string; paper: string }> = {
  Technology: { night: '#7fd6c8', paper: '#1f6f63' },
  Ideas: { night: '#ff9f7a', paper: '#a8432a' },
  Institutions: { night: '#f4d06f', paper: '#8a6a12' },
  Governance: { night: '#c4a8ff', paper: '#5b3fa0' },
};

/** The page's own font stacks, so canvas text matches the site. Waits for web fonts to load. */
export async function siteFonts() {
  await document.fonts.ready;
  const css = getComputedStyle(document.documentElement);
  return {
    serif: css.getPropertyValue('--font-serif').trim() || 'Georgia, serif',
    sans: css.getPropertyValue('--font-sans').trim() || 'system-ui, sans-serif',
    mono: css.getPropertyValue('--font-mono').trim() || 'monospace',
  };
}

/** Stroke an exhibit's sigil into a square of the given size. */
export function drawSigil(g: CanvasRenderingContext2D, e: Event, x: number, y: number, size: number, color: string) {
  g.save();
  g.translate(x, y);
  g.scale(size / 100, size / 100);
  g.strokeStyle = color;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const s of sigilShapes(e)) {
    g.globalAlpha = s.o;
    g.lineWidth = s.w;
    g.stroke(new Path2D(s.d));
  }
  g.restore();
}

/** Break text into lines no wider than maxWidth in the current font. */
export function wrap(g: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Save a canvas as a PNG download. */
export function download(canvas: HTMLCanvasElement, filename: string) {
  return new Promise<boolean>(resolve => {
    canvas.toBlob(blob => {
      if (!blob) { resolve(false); return; }
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: filename });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve(true);
    }, 'image/png');
  });
}
