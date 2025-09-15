'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { GhostVisual, PacmanVisual, FoodVisual, CapsuleVisual } from '../../components/GameVisuals';
import { LayoutData, ParticleFilter, ExactInference, computeHeatmap } from '../../utils/ghostbusters';

type Algo = 'Particle' | 'Exact';

type GhostbustersLayout = LayoutData;

function useLayout(name: string) {
  const [data, setData] = useState<GhostbustersLayout | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/multiagent/layouts/${name}`);
      if (!res.ok) return;
      const json = await res.json();
      if (!active) return;
      const layout: GhostbustersLayout = {
        name: json.name,
        width: json.width,
        height: json.height,
        walls: json.walls,
        food: json.food,
        capsules: json.capsules,
        pacman: json.pacman,
        ghosts: json.ghosts,
      };
      setData(layout);
    })();
    return () => { active = false; };
  }, [name]);
  return data;
}

export default function GhostbustersPage() {
  const [layoutName, setLayoutName] = useState<string>('smallClassic');
  const layout = useLayout(layoutName);
  const [algo, setAlgo] = useState<Algo>('Particle');
  const [running, setRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(250);
  const [noisyDist, setNoisyDist] = useState<number | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const pfRef = useRef<ParticleFilter | null>(null);
  const eiRef = useRef<ExactInference | null>(null);
  const [numParticles, setNumParticles] = useState(1000);
  const [obsLambda, setObsLambda] = useState(0.2);
  const [noiseRange, setNoiseRange] = useState(2);
  const [allowStay, setAllowStay] = useState(true);
  const [showGhosts, setShowGhosts] = useState(true);
  const [showFood, setShowFood] = useState(true);
  const [showCapsules, setShowCapsules] = useState(true);

  useEffect(() => {
    if (!layout) return;
    pfRef.current = new ParticleFilter(layout, numParticles, { observationLambda: obsLambda, noiseRange, allowStay });
    eiRef.current = new ExactInference(layout, { observationLambda: obsLambda, noiseRange, allowStay });
    setStepCount(0);
  }, [layout, numParticles, obsLambda, noiseRange, allowStay]);

  useEffect(() => {
    if (!layout) return;
    const ghost = layout.ghosts[0] ?? null;
    if (!ghost) { setNoisyDist(null); return; }
    const trueDist = Math.abs(layout.pacman.x - ghost.x) + Math.abs(layout.pacman.y - ghost.y);
    const noise = Math.floor((Math.random() * (2 * noiseRange + 1)) - noiseRange);
    const nd = Math.max(0, trueDist + noise);
    setNoisyDist(nd);
  }, [layout, stepCount, noiseRange]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (!layout) return;
      if (pfRef.current) {
        pfRef.current.observe(noisyDist, layout.pacman);
        pfRef.current.elapseTime();
      }
      if (eiRef.current) {
        eiRef.current.observe(noisyDist, layout.pacman);
        eiRef.current.elapseTime();
      }
      setStepCount((s) => s + 1);
    }, speedMs);
    return () => clearInterval(id);
  }, [running, speedMs, layout, noisyDist]);

  const belief = useMemo(() => {
    if (!layout) return {} as Record<string, number>;
    if (algo === 'Particle') return pfRef.current?.getBelief() ?? {};
    return eiRef.current?.getBelief() ?? {};
  }, [layout, algo, stepCount]);

  const heatmap = useMemo(() => layout ? computeHeatmap(layout, belief) : [], [layout, belief]);

  return (
    <div className="min-h-screen text-white">
      {/* Header / Nav (aligned with Multi-Agent) */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader
          title="Ghostbusters Inference"
          icon="🎯"
          accentFrom="from-yellow-300"
          accentVia="via-red-300"
          accentTo="to-rose-400"
        />

        {/* Quick Controls Bar */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* Algorithm Selection */}
            <div className="flex items-center gap-3">
              <label className="text-caption font-semibold text-yellow-400 whitespace-nowrap">
                Algorithm:
              </label>
              <select
                value={algo}
                onChange={(e) => setAlgo(e.target.value as Algo)}
                disabled={running}
                className="select-pacman min-w-[160px]"
              >
                <option value="Particle">Particle Filter</option>
                <option value="Exact">Exact Inference</option>
              </select>
            </div>

            {/* Layout Selection */}
            <div className="flex items-center gap-3">
              <label className="text-caption font-semibold text-yellow-400 whitespace-nowrap">
                Layout:
              </label>
              <select
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                disabled={running}
                className="select-pacman min-w-[160px]"
              >
                <option value="smallClassic">Small Classic</option>
                <option value="mediumClassic">Medium Classic</option>
                <option value="testClassic">Test Classic</option>
              </select>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-3">
              <label className="text-caption font-semibold text-yellow-400 whitespace-nowrap">
                Speed:
              </label>
              <input
                type="range"
                min="60"
                max="1000"
                step="50"
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                disabled={running}
                className="slider w-24"
              />
              <span className="text-caption text-gray-400 min-w-[40px]">
                {speedMs}ms
              </span>
            </div>

            {/* Stats Display */}
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-yellow-400">Steps:</span>
              <span className="text-heading text-lg text-green-400 font-bold">{stepCount}</span>
            </div>

            {/* Description */}
            <div className="text-caption text-gray-400">
              {algo === 'Particle' ? `Particle filter with ${numParticles} samples for probabilistic tracking.` : 
               'Exact inference using full probability distribution over all possible ghost positions.'}
            </div>

            {/* Run Button */}
            <button
              onClick={() => setRunning(r => !r)}
              disabled={!layout}
              className="btn-pacman px-8 py-3 ml-auto hidden md:inline-flex"
            >
              {running ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Running...
                </span>
              ) : (
                '🎯 Start Inference'
              )}
            </button>
          </div>
        </div>

        {/* Two-column layout: Board (left) and Settings/Info (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Board Card */}
          <div className="card p-8 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-caption text-gray-400">Layout</div>
                <div className="text-heading text-xl text-yellow-300 font-semibold">{layout?.name || '—'}</div>
              </div>
              <div className="text-sm text-blue-300">Algo: <span className="text-green-400 font-bold">{algo}</span></div>
            </div>

            {/* Board */}
            <div className="flex justify-center mt-2">
              <div className="maze-container">
                {layout && (
                  <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${layout.width}, 1fr)`, gridTemplateRows: `repeat(${layout.height}, 1fr)` }}>
                    {Array.from({ length: layout.height }, (_, y) => (
                      Array.from({ length: layout.width }, (_, x) => {
                        const isWall = layout.walls.some(w => w.x === x && w.y === y);
                        const isPacman = layout.pacman.x === x && layout.pacman.y === y;
                        const isGhost = showGhosts && layout.ghosts.some(g => g.x === x && g.y === y && g.x !== -1 && g.y !== -1);
                        const isFood = showFood && layout.food.some(f => f.x === x && f.y === y);
                        const isCapsule = showCapsules && layout.capsules.some(c => c.x === x && c.y === y);
                        const v = heatmap[y]?.[x] ?? 0;
                        const heat = v > 0 ? Math.min(1, v * 6) : 0;
                        const bg = isWall ? '#1f2937' : heat > 0 ? `rgba(255,0,0,${0.12 + 0.35 * heat})` : 'transparent';
                        return (
                          <div key={`${x}-${y}`} className={`maze-cell ${isWall ? 'wall' : ''}`}
                               style={{ width: '24px', height: '24px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
                            {isPacman ? <PacmanVisual size={24}/> :
                             isGhost ? <GhostVisual size={24} colorIndex={0} isScared={false}/> :
                             isCapsule ? <CapsuleVisual size={24}/> :
                             isFood ? <FoodVisual size={24}/> : null}
                          </div>
                        );
                      })
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Board footer stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <div className="text-caption text-gray-400">Belief mass</div>
                <div className="text-green-400 font-bold">{Object.values(belief).reduce((a, b) => a + b, 0).toFixed(3)}</div>
              </div>
              <div>
                <div className="text-caption text-gray-400">Steps</div>
                <div className="text-yellow-400 font-bold">{stepCount}</div>
              </div>
              <div>
                <div className="text-caption text-gray-400">Noisy distance</div>
                <div className="text-yellow-400 font-bold">{noisyDist ?? 'None'}</div>
              </div>
              <div>
                <div className="text-caption text-gray-400">Cells</div>
                <div className="text-blue-300 font-bold">{layout ? layout.width * layout.height : 0}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Settings + Explanation */}
          <div className="space-y-6">
            {/* Additional Controls Card */}
            <div className="card p-8 space-y-4">
              <div className="text-heading text-2xl text-yellow-400 font-semibold mb-4">Additional Controls</div>
              <div className="flex flex-wrap items-center gap-4">
                <button className="btn-secondary px-4 py-2" onClick={() => setStepCount(s => s + 1)}>Step</button>
                <div className="flex items-center gap-6 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={showGhosts} onChange={e => setShowGhosts(e.target.checked)} /> Show Ghosts</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={showFood} onChange={e => setShowFood(e.target.checked)} /> Show Food</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={showCapsules} onChange={e => setShowCapsules(e.target.checked)} /> Show Capsules</label>
                </div>
              </div>
            </div>

            {/* Settings Card */}
            <div className="card p-8 space-y-4">
              <div className="text-heading text-2xl text-yellow-400 font-semibold mb-4">Inference Settings</div>
              <div className="grid grid-cols-2 gap-6">
                <label className="flex items-center justify-between">
                  <span>Particles</span>
                  <input type="number" className="input-pacman w-28" value={numParticles} min={50} max={10000} step={50} onChange={e => setNumParticles(Number(e.target.value))} />
                </label>
                <label className="flex items-center justify-between">
                  <span>Obs Lambda</span>
                  <input type="number" className="input-pacman w-28" value={obsLambda} min={0.05} max={2} step={0.05} onChange={e => setObsLambda(Number(e.target.value))} />
                </label>
                <label className="flex items-center justify-between">
                  <span>Noise Range</span>
                  <input type="number" className="input-pacman w-28" value={noiseRange} min={0} max={15} step={1} onChange={e => setNoiseRange(Number(e.target.value))} />
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={allowStay} onChange={e => setAllowStay(e.target.checked)} /> Allow Stay
                </label>
              </div>
            </div>

            {/* Explanation Card */}
            <div className="card p-8 space-y-4">
              <div className="text-heading text-2xl text-yellow-400 font-semibold mb-2">How it works</div>
              <div className="text-sm text-blue-200 space-y-3">
                <div>
                  <div className="text-yellow-400 font-semibold mb-1">What you see</div>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Dark cells are walls. Open cells are traversable.</li>
                    <li>Yellow circle is Pacman; colored sprites are true ghost positions.</li>
                    <li>The red heatmap shows belief over the ghost’s location (probability mass per cell).</li>
                  </ul>
                </div>
                <div>
                  <div className="text-yellow-400 font-semibold mb-1">Algorithms</div>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><span className="text-white">Exact</span>: full probability table; Bayes update with observation then spread to neighbors.</li>
                    <li><span className="text-white">Particle</span>: {numParticles} samples; weight by sensor (λ={obsLambda}, noise±{noiseRange}), resample, then move{allowStay ? ' (including stay)' : ''}.</li>
                  </ul>
                </div>
                <div>
                  <div className="text-yellow-400 font-semibold mb-1">Why beliefs differ from sprites</div>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Noisy distance fits many symmetric cells; belief can be multi‑modal.</li>
                    <li>Strict sensors (small noise, larger λ) can collapse weights and trigger resets; more particles help.</li>
                  </ul>
                </div>
                <div>
                  <div className="text-yellow-400 font-semibold mb-1">Real‑world applications</div>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Robot localization and tracking (GPS/LiDAR/IMU).</li>
                    <li>Autonomous driving and radar multi‑target tracking.</li>
                    <li>SLAM and AR/VR head tracking.</li>
                    <li>Signal processing and econometrics (state‑space inference).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sticky Start button */}
      <div className="md:hidden mobile-sticky-start">
        <button
          onClick={() => setRunning(r => !r)}
          disabled={!layout}
          className="btn-pacman w-full py-4 text-xl"
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Running...
            </span>
          ) : (
            '🎯 Start Inference'
          )}
        </button>
      </div>
    </div>
  );
}


