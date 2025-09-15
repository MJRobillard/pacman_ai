export type Position = { x: number; y: number };

export type LayoutData = {
  name: string;
  width: number;
  height: number;
  walls: Position[];
  food: Position[];
  capsules: Position[];
  pacman: Position;
  ghosts: Array<Position & { scared?: boolean }>;
};

export class DiscreteDistribution<T extends string | number> {
  private counts: Map<T, number> = new Map();

  increment(key: T, amount: number = 1): void {
    const prev = this.counts.get(key) ?? 0;
    this.counts.set(key, prev + amount);
  }

  set(key: T, value: number): void {
    this.counts.set(key, value);
  }

  get(key: T): number {
    return this.counts.get(key) ?? 0;
  }

  keys(): T[] {
    return Array.from(this.counts.keys());
  }

  total(): number {
    let sum = 0;
    for (const v of this.counts.values()) sum += v;
    return sum;
  }

  normalize(): void {
    const total = this.total();
    if (total === 0) return;
    for (const k of this.counts.keys()) {
      this.counts.set(k, (this.counts.get(k) as number) / total);
    }
  }

  sample(rng: () => number = Math.random): T | undefined {
    this.normalize();
    const r = rng();
    let cum = 0;
    for (const [k, v] of this.counts) {
      cum += v;
      if (r <= cum + 1e-12) return k;
    }
    // Fallback in case of floating point issues
    return this.keys()[this.keys().length - 1];
  }

  toObject(): Record<string, number> {
    const obj: Record<string, number> = {};
    for (const [k, v] of this.counts) obj[String(k)] = v;
    return obj;
  }
}

export function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export type InferenceConfig = {
  numParticles: number;
  observationLambda: number; // exponential decay lambda
  noiseRange: number; // e.g., 7
  allowStay: boolean; // allow staying in place during transitions
};

// Observation model configurable; default mirrors CS188 style
export function observationProb(noisyDistance: number | null, pacmanPos: Position, ghostPos: Position, jailPos: Position | null, cfg: InferenceConfig): number {
  // If ghost is in jail, observation must be null
  if (jailPos && ghostPos.x === jailPos.x && ghostPos.y === jailPos.y) {
    return noisyDistance === null ? 1 : 0;
  }
  if (noisyDistance === null) return 0;
  const trueDist = manhattan(pacmanPos, ghostPos);
  const diff = Math.abs(noisyDistance - trueDist);
  if (diff > cfg.noiseRange) return 0;
  return Math.exp(-cfg.observationLambda * diff);
}

export function neighbors(pos: Position, layout: LayoutData, allowStay: boolean): Position[] {
  const deltas = allowStay ? [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 0, y: 0 },
  ] : [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const isWall = (x: number, y: number) => layout.walls.some(w => w.x === x && w.y === y);
  const inside = (x: number, y: number) => x >= 0 && x < layout.width && y >= 0 && y < layout.height;
  const result: Position[] = [];
  for (const d of deltas) {
    const nx = pos.x + d.x;
    const ny = pos.y + d.y;
    if (inside(nx, ny) && !isWall(nx, ny)) result.push({ x: nx, y: ny });
  }
  return result;
}

export class ExactInference {
  private layout: LayoutData;
  private legalPositions: string[]; // encoded as "x,y"
  private beliefs: DiscreteDistribution<string>;
  private cfg: InferenceConfig;

  constructor(layout: LayoutData, cfg?: Partial<InferenceConfig>) {
    this.layout = layout;
    this.legalPositions = this.computeLegalPositions();
    this.beliefs = new DiscreteDistribution<string>();
    this.cfg = {
      numParticles: 800,
      observationLambda: 0.3,
      noiseRange: 7,
      allowStay: true,
      ...(cfg ?? {})
    };
    this.initializeUniformly();
  }

  private computeLegalPositions(): string[] {
    const legal: string[] = [];
    const isWall = (x: number, y: number) => this.layout.walls.some(w => w.x === x && w.y === y);
    for (let y = 0; y < this.layout.height; y++) {
      for (let x = 0; x < this.layout.width; x++) {
        if (!isWall(x, y)) legal.push(`${x},${y}`);
      }
    }
    return legal;
  }

  initializeUniformly(): void {
    const p = 1 / this.legalPositions.length;
    for (const key of this.legalPositions) this.beliefs.set(key, p);
  }

  getBelief(): Record<string, number> {
    return this.beliefs.toObject();
  }

  observe(noisyDistance: number | null, pacmanPos: Position): void {
    const updated = new DiscreteDistribution<string>();
    for (const key of this.legalPositions) {
      const [x, y] = key.split(',').map(Number);
      const prob = observationProb(noisyDistance, pacmanPos, { x, y }, null, this.cfg);
      updated.set(key, this.beliefs.get(key) * prob);
    }
    if (updated.total() === 0) {
      this.initializeUniformly();
      return;
    }
    updated.normalize();
    this.beliefs = updated;
  }

  elapseTime(): void {
    const newBeliefs = new DiscreteDistribution<string>();
    for (const key of this.legalPositions) {
      const probOld = this.beliefs.get(key);
      if (probOld === 0) continue;
      const [x, y] = key.split(',').map(Number);
      const nbrs = neighbors({ x, y }, this.layout, this.cfg.allowStay);
      const mass = probOld / nbrs.length;
      for (const n of nbrs) newBeliefs.increment(`${n.x},${n.y}`, mass);
    }
    newBeliefs.normalize();
    this.beliefs = newBeliefs;
  }
}

export class ParticleFilter {
  private layout: LayoutData;
  private legalPositions: string[];
  private particles: string[] = [];
  private cfg: InferenceConfig;

  constructor(layout: LayoutData, numParticles: number = 1000, cfg?: Partial<InferenceConfig>) {
    this.layout = layout;
    this.legalPositions = this.computeLegalPositions();
    this.cfg = {
      numParticles: numParticles,
      observationLambda: 0.3,
      noiseRange: 7,
      allowStay: true,
      ...(cfg ?? {})
    };
    this.initializeUniformly();
  }

  private computeLegalPositions(): string[] {
    const legal: string[] = [];
    const isWall = (x: number, y: number) => this.layout.walls.some(w => w.x === x && w.y === y);
    for (let y = 0; y < this.layout.height; y++) {
      for (let x = 0; x < this.layout.width; x++) {
        if (!isWall(x, y)) legal.push(`${x},${y}`);
      }
    }
    return legal;
  }

  initializeUniformly(): void {
    this.particles = [];
    for (let i = 0; i < this.cfg.numParticles; i++) {
      const idx = i % this.legalPositions.length;
      this.particles.push(this.legalPositions[idx]);
    }
    // Shuffle for even spread
    for (let i = this.particles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.particles[i], this.particles[j]] = [this.particles[j], this.particles[i]];
    }
  }

  getBelief(): Record<string, number> {
    const dist = new DiscreteDistribution<string>();
    for (const p of this.particles) dist.increment(p);
    dist.normalize();
    return dist.toObject();
  }

  observe(noisyDistance: number | null, pacmanPos: Position): void {
    const weights = new DiscreteDistribution<number>();
    const encToIndex = new Map<string, number>();
    for (let i = 0; i < this.particles.length; i++) {
      const key = this.particles[i];
      encToIndex.set(key + `#${i}`, i); // make unique key per particle instance
      const [x, y] = key.split(',').map(Number);
      const w = observationProb(noisyDistance, pacmanPos, { x, y }, null, this.cfg);
      weights.set(i, w);
    }
    const total = weights.total();
    if (total === 0) {
      this.initializeUniformly();
      return;
    }
    // Resample
    const newParticles: string[] = [];
    const indexed: Array<{ idx: number; w: number }> = [];
    for (let i = 0; i < this.particles.length; i++) indexed.push({ idx: i, w: weights.get(i) });
    // Build CDF
    const cumulative: number[] = [];
    const order: number[] = [];
    let cum = 0;
    for (const it of indexed) {
      cum += it.w / total;
      cumulative.push(cum);
      order.push(it.idx);
    }
    for (let k = 0; k < this.cfg.numParticles; k++) {
      const r = Math.random();
      const j = lowerBound(cumulative, r);
      newParticles.push(this.particles[order[j]]);
    }
    this.particles = newParticles;
  }

  elapseTime(): void {
    const newParticles: string[] = [];
    for (const p of this.particles) {
      const [x, y] = p.split(',').map(Number);
      const nbrs = neighbors({ x, y }, this.layout, this.cfg.allowStay);
      const choice = nbrs[Math.floor(Math.random() * nbrs.length)];
      newParticles.push(`${choice.x},${choice.y}`);
    }
    this.particles = newParticles;
  }
}

function lowerBound(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1, ans = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] >= target) {
      ans = mid; hi = mid - 1;
    } else lo = mid + 1;
  }
  return ans;
}

export function computeHeatmap(layout: LayoutData, belief: Record<string, number>): number[][] {
  const heat: number[][] = Array.from({ length: layout.height }, () => Array(layout.width).fill(0));
  for (const [key, p] of Object.entries(belief)) {
    const [xStr, yStr] = key.split(',');
    const x = Number(xStr), y = Number(yStr);
    heat[y][x] = p;
  }
  return heat;
}

// Joint particle filter for multiple ghosts
export class JointParticleFilter {
  private layout: LayoutData;
  private legalPositions: string[];
  private particles: string[] = [];
  private numGhosts: number;
  private cfg: InferenceConfig;

  constructor(layout: LayoutData, numGhosts: number, cfg?: Partial<InferenceConfig>) {
    this.layout = layout;
    this.legalPositions = this.computeLegalPositions();
    this.numGhosts = numGhosts;
    this.cfg = {
      numParticles: 1000,
      observationLambda: 0.3,
      noiseRange: 7,
      allowStay: true,
      ...(cfg ?? {})
    };
    this.initializeUniformly();
  }

  private computeLegalPositions(): string[] {
    const legal: string[] = [];
    const isWall = (x: number, y: number) => this.layout.walls.some(w => w.x === x && w.y === y);
    for (let y = 0; y < this.layout.height; y++) {
      for (let x = 0; x < this.layout.width; x++) {
        if (!isWall(x, y)) legal.push(`${x},${y}`);
      }
    }
    return legal;
  }

  private jail(i: number): Position { return { x: -1, y: -1 }; }

  initializeUniformly(): void {
    // Cartesian product of legal positions for numGhosts
    const all: string[] = [];
    const recurse = (depth: number, acc: string[]) => {
      if (depth === this.numGhosts) {
        all.push(acc.join('|'));
        return;
      }
      for (const p of this.legalPositions) recurse(depth + 1, [...acc, p]);
    };
    recurse(0, []);
    // shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    this.particles = [];
    for (let i = 0; i < this.cfg.numParticles; i++) {
      const idx = i % all.length;
      this.particles.push(all[idx]);
    }
  }

  private parseTuple(enc: string): Position[] {
    return enc.split('|').map(tok => {
      const [x, y] = tok.split(',').map(Number);
      return { x, y };
    });
  }

  private formatTuple(poses: Position[]): string {
    return poses.map(p => `${p.x},${p.y}`).join('|');
  }

  getMarginal(ghostIndex: number): Record<string, number> {
    const dist = new DiscreteDistribution<string>();
    for (const enc of this.particles) {
      const poses = this.parseTuple(enc);
      const p = poses[ghostIndex];
      dist.increment(`${p.x},${p.y}`);
    }
    dist.normalize();
    return dist.toObject();
  }

  observeUpdate(noisyDistances: Array<number | null>, pacmanPos: Position): void {
    const weights = new DiscreteDistribution<number>();
    for (let i = 0; i < this.particles.length; i++) {
      const enc = this.particles[i];
      const poses = this.parseTuple(enc);
      let w = 1;
      for (let g = 0; g < this.numGhosts; g++) {
        const jailPos = this.jail(g);
        const prob = observationProb(noisyDistances[g] ?? null, pacmanPos, poses[g], jailPos, this.cfg);
        w *= prob;
      }
      weights.set(i, w);
    }
    if (weights.total() === 0) {
      this.initializeUniformly();
      return;
    }
    // Resample by index CDF
    const newParticles: string[] = [];
    const cumulative: number[] = [];
    const order: number[] = [];
    let total = weights.total();
    let cum = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const w = weights.get(i) / total;
      cum += w;
      cumulative.push(cum);
      order.push(i);
    }
    for (let k = 0; k < this.cfg.numParticles; k++) {
      const r = Math.random();
      const j = lowerBound(cumulative, r);
      newParticles.push(this.particles[order[j]]);
    }
    this.particles = newParticles;
  }

  elapseTime(): void {
    const newParticles: string[] = [];
    for (const enc of this.particles) {
      const prev = this.parseTuple(enc);
      const next: Position[] = [];
      for (let g = 0; g < this.numGhosts; g++) {
        const nbrs = neighbors(prev[g], this.layout, this.cfg.allowStay);
        const choice = nbrs[Math.floor(Math.random() * nbrs.length)];
        next.push(choice);
      }
      newParticles.push(this.formatTuple(next));
    }
    this.particles = newParticles;
  }
}


