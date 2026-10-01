import { seeded } from '@/lib/museum';

export type Sample = { x: number; y: number; t: 0 | 1 };

/**
 * A 2 → H → 1 network: tanh hidden units, a sigmoid output and cross-entropy
 * loss, trained by full-batch gradient descent with momentum. Small enough to
 * read in one sitting, which is the point.
 */
export class Net {
  readonly h: number;
  w1: Float64Array; b1: Float64Array; w2: Float64Array; b2 = 0;
  private v1: Float64Array; private vb1: Float64Array; private v2: Float64Array; private vb2 = 0;
  epoch = 0;

  constructor(hidden: number, seed: string) {
    this.h = hidden;
    const r = seeded(seed);
    // Xavier-style initialization keeps tanh units away from saturation.
    const g = () => (r() * 2 - 1) * Math.sqrt(6 / (2 + hidden));
    this.w1 = Float64Array.from({ length: hidden * 2 }, g);
    this.b1 = Float64Array.from({ length: hidden }, () => (r() * 2 - 1) * 0.1);
    this.w2 = Float64Array.from({ length: hidden }, () => (r() * 2 - 1) * Math.sqrt(6 / (hidden + 1)));
    this.v1 = new Float64Array(hidden * 2); this.vb1 = new Float64Array(hidden); this.v2 = new Float64Array(hidden);
  }

  /** Hidden activations and output probability for one point. */
  forward(x: number, y: number, hidden = new Float64Array(this.h)) {
    let z = this.b2;
    for (let j = 0; j < this.h; j++) {
      const a = Math.tanh(this.w1[j * 2] * x + this.w1[j * 2 + 1] * y + this.b1[j]);
      hidden[j] = a;
      z += this.w2[j] * a;
    }
    return { p: 1 / (1 + Math.exp(-z)), hidden };
  }

  /** One step of backpropagation over the whole dataset; returns the mean loss before the step. */
  train(data: Sample[], rate: number, momentum = 0.9) {
    const g1 = new Float64Array(this.h * 2), gb1 = new Float64Array(this.h), g2 = new Float64Array(this.h);
    let gb2 = 0, loss = 0;
    const hid = new Float64Array(this.h);
    for (const s of data) {
      const { p } = this.forward(s.x, s.y, hid);
      loss -= s.t ? Math.log(Math.max(p, 1e-12)) : Math.log(Math.max(1 - p, 1e-12));
      // Sigmoid + cross-entropy: the error at the output is simply p − t.
      const d = p - s.t;
      gb2 += d;
      for (let j = 0; j < this.h; j++) {
        g2[j] += d * hid[j];
        // The error flows back through w2 and the tanh derivative (1 − a²).
        const dh = d * this.w2[j] * (1 - hid[j] * hid[j]);
        g1[j * 2] += dh * s.x; g1[j * 2 + 1] += dh * s.y; gb1[j] += dh;
      }
    }
    const n = data.length;
    const upd = (w: Float64Array, v: Float64Array, g: Float64Array) => {
      for (let i = 0; i < w.length; i++) { v[i] = momentum * v[i] - rate * (g[i] / n); w[i] += v[i]; }
    };
    upd(this.w1, this.v1, g1); upd(this.b1, this.vb1, gb1); upd(this.w2, this.v2, g2);
    this.vb2 = momentum * this.vb2 - rate * (gb2 / n); this.b2 += this.vb2;
    this.epoch++;
    return loss / n;
  }

  accuracy(data: Sample[]) {
    return data.filter(s => (this.forward(s.x, s.y).p >= 0.5 ? 1 : 0) === s.t).length / data.length;
  }
}

export const DATASETS: Record<string, { label: string; make: () => Sample[] }> = {
  xor: {
    label: 'XOR',
    make: () => {
      const r = seeded('bp-xor');
      return Array.from({ length: 80 }, (_, i) => {
        const sx = i % 2 ? 1 : -1, sy = (i >> 1) % 2 ? 1 : -1;
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.28;
        return { x: sx * 0.5 + Math.cos(a) * d, y: sy * 0.5 + Math.sin(a) * d, t: (sx !== sy ? 1 : 0) as 0 | 1 };
      });
    },
  },
  ring: {
    label: 'Ring',
    make: () => {
      const r = seeded('bp-ring');
      return Array.from({ length: 90 }, (_, i) => {
        const inner = i % 2 === 0, a = r() * Math.PI * 2;
        const d = inner ? Math.sqrt(r()) * 0.35 : 0.6 + r() * 0.3;
        return { x: Math.cos(a) * d, y: Math.sin(a) * d, t: (inner ? 1 : 0) as 0 | 1 };
      });
    },
  },
  spiral: {
    label: 'Spiral',
    make: () => {
      const r = seeded('bp-spiral');
      return Array.from({ length: 120 }, (_, i) => {
        const arm = i % 2, k = Math.floor(i / 2) / 60;
        const a = k * Math.PI * 2.2 + arm * Math.PI, d = 0.12 + k * 0.8;
        return { x: Math.cos(a) * d + (r() - 0.5) * 0.06, y: Math.sin(a) * d + (r() - 0.5) * 0.06, t: arm as 0 | 1 };
      });
    },
  },
};
