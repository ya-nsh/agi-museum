'use client';

import type { MotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import { seeded } from '@/lib/museum';
import { useMuseum } from './providers';

const ACCENT = 'rgb(212,247,122)', BONE = 'rgb(237,232,220)';

/**
 * The two nearest neighbours of each point on the unit sphere, as index pairs.
 * Points are binned into a uniform grid and each search widens ring by ring
 * until no unvisited cell can hold anything closer: exact, and close to linear
 * rather than the N² of comparing every pair.
 */
function nearestTwo(pts: Float32Array, n: number) {
  const CELL = 0.2, DIM = Math.ceil(2 / CELL) + 1;
  const cellOf = (v: number) => Math.min(DIM - 1, Math.floor((v + 1) / CELL));
  const buckets = new Map<number, number[]>();
  const key = (x: number, y: number, z: number) => (x * DIM + y) * DIM + z;
  for (let i = 0; i < n; i++) {
    const k = key(cellOf(pts[i * 3]), cellOf(pts[i * 3 + 1]), cellOf(pts[i * 3 + 2]));
    const b = buckets.get(k);
    if (b) b.push(i); else buckets.set(k, [i]);
  }
  const out = new Int32Array(n * 2).fill(-1);
  for (let i = 0; i < n; i++) {
    const cx = cellOf(pts[i * 3]), cy = cellOf(pts[i * 3 + 1]), cz = cellOf(pts[i * 3 + 2]);
    let b1 = -1, b2 = -1, d1 = Infinity, d2 = Infinity;
    for (let r = 0; r < DIM; r++) {
      // Visit only the shell of cells at Chebyshev distance r.
      for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) for (let z = cz - r; z <= cz + r; z++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy), Math.abs(z - cz)) !== r) continue;
        if (x < 0 || y < 0 || z < 0 || x >= DIM || y >= DIM || z >= DIM) continue;
        const b = buckets.get(key(x, y, z));
        if (!b) continue;
        for (const j of b) {
          if (j === i) continue;
          const dx = pts[i * 3] - pts[j * 3], dy = pts[i * 3 + 1] - pts[j * 3 + 1], dz = pts[i * 3 + 2] - pts[j * 3 + 2];
          const d = dx * dx + dy * dy + dz * dz;
          if (d < d1) { d2 = d1; b2 = b1; d1 = d; b1 = j; } else if (d < d2) { d2 = d; b2 = j; }
        }
      }
      // Anything in a farther shell is at least r cells away.
      if (b2 >= 0 && d2 <= (r * CELL) ** 2) break;
    }
    out[i * 2] = b1; out[i * 2 + 1] = b2;
  }
  return out;
}

/**
 * The hero artwork: an 80-column, 12-row IBM punch card whose holes fold into a
 * rotating neural sphere, 1950 becoming 2026. Signals travel along the sphere's
 * edges, and the field bends away from the pointer.
 */
export function NeuralField({ play, scroll }: { play: boolean; scroll?: MotionValue<number> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMuseum();
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; }, [play]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const ROWS = 12;
    let COLS = 80;
    let N = 0, W = 0, H = 0, dpr = 1, cardW = 0, cardH = 0;
    let card: Float32Array, sphere: Float32Array, punched: Uint8Array, edges: Uint16Array;
    const rnd = seeded('punch-card-1950');

    function build() {
      COLS = W < 720 ? 36 : 80;
      N = COLS * ROWS;
      card = new Float32Array(N * 2);
      sphere = new Float32Array(N * 3);
      punched = new Uint8Array(N);
      // Card: 80 columns x 12 rows, with a card's 7⅜ × 3¼ inch proportions.
      const cw = 2.5, ch = cw * (3.25 / 7.375) * (COLS === 80 ? 1 : 1.9);
      cardW = cw; cardH = ch;
      for (let i = 0; i < N; i++) {
        const c = i % COLS, r = Math.floor(i / COLS);
        card[i * 2] = -cw / 2 + (c + 0.5) * (cw / COLS);
        card[i * 2 + 1] = -ch / 2 + (r + 0.5) * (ch / ROWS);
        punched[i] = rnd() < (r < 3 ? 0.18 : 0.1) ? 1 : 0;
      }
      // Sphere: a Fibonacci lattice, re-ordered into 12 latitude bands so that
      // each card row wraps into one band and the fold reads as continuous.
      const pts: [number, number, number][] = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), p = i * golden;
        pts.push([Math.cos(p) * rad, y, Math.sin(p) * rad]);
      }
      pts.sort((a, b) => a[1] - b[1]);
      for (let r = 0; r < ROWS; r++) {
        const band = pts.slice(r * COLS, (r + 1) * COLS).sort((a, b) => Math.atan2(a[2], a[0]) - Math.atan2(b[2], b[0]));
        band.forEach((p, c) => sphere.set(p, (r * COLS + c) * 3));
      }
      // Two nearest neighbours per node: a sparse, legible network.
      const list: number[] = [];
      const seen = new Set<number>();
      const near = nearestTwo(sphere, N);
      for (let i = 0; i < N; i++) {
        for (const j of [near[i * 2], near[i * 2 + 1]]) {
          const key = Math.min(i, j) * 4096 + Math.max(i, j);
          if (j >= 0 && !seen.has(key)) { seen.add(key); list.push(i, j); }
        }
      }
      edges = Uint16Array.from(list);
      adjacency = Array.from({ length: N }, () => [] as number[]);
      for (let e = 0; e < edges.length / 2; e++) { adjacency[edges[e * 2]].push(e); adjacency[edges[e * 2 + 1]].push(e); }
      pulses = Array.from({ length: W < 720 ? 8 : 16 }, () => ({ e: Math.floor(Math.random() * (edges.length / 2)), t: Math.random(), dir: 1, v: 0.6 + Math.random() * 0.9 }));
    }

    let adjacency: number[][] = [];
    let pulses: { e: number; t: number; dir: number; v: number }[] = [];
    const sx = new Float32Array(1400), sy = new Float32Array(1400), sz = new Float32Array(1400);
    // A signal's glow, drawn once and stamped with globalAlpha, instead of a new
    // radial gradient per signal per frame.
    let glow: HTMLCanvasElement | null = null;
    function makeGlow() {
      glow = document.createElement('canvas');
      glow.width = glow.height = Math.ceil(18 * dpr);
      const g = glow.getContext('2d')!, r = glow.width / 2;
      const grad = g.createRadialGradient(r, r, 0, r, r, r);
      grad.addColorStop(0, 'rgba(212,247,122,0.9)');
      grad.addColorStop(1, 'rgba(212,247,122,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, glow.width, glow.height);
    }

    function resize() {
      const r = cv!.getBoundingClientRect();
      const prevCols = COLS;
      W = r.width; H = r.height;
      dpr = Math.min(2, devicePixelRatio || 1);
      cv!.width = Math.round(W * dpr); cv!.height = Math.round(H * dpr);
      makeGlow();
      if (!N || (W < 720 ? 36 : 80) !== prevCols) build();
    }

    const pointer = { x: -9999, y: -9999, tx: 0, ty: 0, sx: 0, sy: 0 };
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      pointer.tx = (pointer.x / W - 0.5); pointer.ty = (pointer.y / H - 0.5);
    };
    const onLeave = () => { pointer.x = pointer.y = -9999; pointer.tx = pointer.ty = 0; };

    let raf = 0, last = performance.now(), rot = 0, morphStart = -1, visible = true;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function frame(now: number, still = false) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playRef.current && morphStart < 0) morphStart = now + 350;
      const m = still ? 1 : morphStart < 0 ? 0 : ease(Math.min(1, Math.max(0, (now - morphStart) / 2600)));
      const appear = still ? 1 : Math.min(1, morphStart < 0 ? 0.35 : 0.35 + (now - morphStart + 350) / 900);
      const s = scroll?.get() ?? 0;
      rot += dt * (0.1 + 0.25 * (1 - m) * m);
      pointer.sx += (pointer.tx - pointer.sx) * 0.05; pointer.sy += (pointer.ty - pointer.sy) * 0.05;

      const mobile = W < 720;
      const cx = mobile ? W * 0.5 : W * 0.68, cy = mobile ? H * 0.42 : H * 0.5;
      const R = Math.min(W * (mobile ? 0.42 : 0.3), H * 0.36) * (1 + s * 0.55);
      const ay = rot + pointer.sx * 0.9, ax = -0.28 + pointer.sy * 0.5;
      const cay = Math.cos(ay * m), say = Math.sin(ay * m), cax = Math.cos(ax * m), sax = Math.sin(ax * m);

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, W, H);

      for (let i = 0; i < N; i++) {
        const px = sphere[i * 3], py = sphere[i * 3 + 1], pz = sphere[i * 3 + 2];
        // rotate Y then X
        const x1 = px * cay + pz * say, z1 = -px * say + pz * cay;
        const y2 = py * cax - z1 * sax, z2 = py * sax + z1 * cax;
        const wave = Math.sin(card[i * 2] * 3 + now / 900) * 0.04 * (1 - m);
        const X = card[i * 2] * (1 - m) + x1 * m, Y = card[i * 2 + 1] * (1 - m) + y2 * m, Z = wave * (1 - m) + z2 * m;
        const f = 2.8 / (2.8 - Z);
        let x = cx + X * R * f, y = cy + Y * R * f;
        const dx = x - pointer.x, dy = y - pointer.y, dd = dx * dx + dy * dy;
        if (dd < 12100 && dd > 0.0001) { const d = Math.sqrt(dd), push = (1 - d / 110) ** 2 * 26; x += (dx / d) * push; y += (dy / d) * push; }
        sx[i] = x; sy[i] = y; sz[i] = Z;
      }

      const fade = appear * (1 - s * 0.85);
      // The card itself: a thin outline with the IBM card's clipped corner.
      if (m < 1) {
        const a = (1 - m) ** 2 * 0.5 * fade, px = R * 0.07;
        const l = cx - (cardW / 2) * R - px, r = cx + (cardW / 2) * R + px, t = cy - (cardH / 2) * R - px, b = cy + (cardH / 2) * R + px, cut = px * 1.6;
        ctx!.beginPath();
        ctx!.moveTo(l + cut, t); ctx!.lineTo(r, t); ctx!.lineTo(r, b); ctx!.lineTo(l, b); ctx!.lineTo(l, t + cut); ctx!.closePath();
        ctx!.strokeStyle = `rgba(237,232,220,${a})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
        ctx!.fillStyle = `rgba(237,232,220,${a * 0.06})`;
        ctx!.fill();
      }
      // Edges, bucketed by depth so each bucket is a single stroke.
      if (m > 0.35) {
        const ea = (m - 0.35) / 0.65;
        for (let b = 0; b < 3; b++) {
          ctx!.beginPath();
          for (let e = 0; e < edges.length; e += 2) {
            const a = edges[e], c = edges[e + 1];
            const z = (sz[a] + sz[c]) / 2;
            if ((z < -0.33 ? 0 : z < 0.33 ? 1 : 2) !== b) continue;
            ctx!.moveTo(sx[a], sy[a]); ctx!.lineTo(sx[c], sy[c]);
          }
          ctx!.strokeStyle = `rgba(237,232,220,${(0.04 + b * 0.07) * ea * fade})`;
          ctx!.lineWidth = 0.6;
          ctx!.stroke();
        }
      }

      // Nodes / punch holes. Two solid colours with per-node globalAlpha, so no
      // colour strings are built or parsed per node.
      let ink = '';
      for (let i = 0; i < N; i++) {
        const depth = (sz[i] + 1) / 2;
        const holeA = punched[i] ? 0.95 : 0.2, sphereA = 0.18 + depth * 0.75;
        const w = (punched[i] ? 2.4 : 1.6) * (1 - m) + (0.9 + depth * 1.6) * m;
        const h = (punched[i] ? 5.2 : 1.6) * (1 - m) + (0.9 + depth * 1.6) * m;
        const want = punched[i] && m < 0.6 ? ACCENT : BONE;
        if (want !== ink) { ctx!.fillStyle = want; ink = want; }
        ctx!.globalAlpha = (holeA * (1 - m) + sphereA * m) * fade;
        ctx!.fillRect(sx[i] - w / 2, sy[i] - h / 2, w, h);
      }
      ctx!.globalAlpha = 1;

      // Signals travelling along the network.
      if (m > 0.6 && edges.length) {
        const pa = ((m - 0.6) / 0.4) * fade;
        for (const p of pulses) {
          if (!still) p.t += dt * p.v;
          if (p.t >= 1) {
            const end = edges[p.e * 2 + (p.dir > 0 ? 1 : 0)];
            const options = adjacency[end].filter(e => e !== p.e);
            p.e = options.length ? options[Math.floor(Math.random() * options.length)] : Math.floor(Math.random() * (edges.length / 2));
            p.dir = edges[p.e * 2] === end ? 1 : -1;
            p.t = 0;
          }
          const a = edges[p.e * 2], c = edges[p.e * 2 + 1];
          const [from, to] = p.dir > 0 ? [a, c] : [c, a];
          const x = sx[from] + (sx[to] - sx[from]) * p.t, y = sy[from] + (sy[to] - sy[from]) * p.t;
          const depth = ((sz[from] + sz[to]) / 2 + 1) / 2;
          ctx!.globalAlpha = pa * depth;
          ctx!.drawImage(glow!, x - 9, y - 9, 18, 18);
        }
        ctx!.globalAlpha = 1;
      }
    }

    const loop = (now: number) => { frame(now); raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0; };
    const start = () => { if (!raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(loop); } };

    resize();
    const ro = new ResizeObserver(() => { resize(); if (reduced) frame(performance.now(), true); });
    ro.observe(cv);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }, { threshold: 0 });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) start(); };
    document.addEventListener('visibilitychange', onVis);
    addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    if (reduced) frame(performance.now(), true); else start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced, scroll]);

  return <canvas ref={canvas} className="neural-field" aria-hidden="true" />;
}
