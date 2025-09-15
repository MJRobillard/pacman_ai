'use client';

import { MultiagentControlsProps } from '../types/multiagent';

export default function MultiagentControls({
  selectedLayout,
  selectedAlgorithm,
  selectedAgent,
  animationSpeed,
  isRunning,
  score,
  gameOver,
  gameWon,
  onLayoutChange,
  onAlgorithmChange,
  onAgentChange,
  onSpeedChange,
  onRunGame,
  layoutOptions,
  heuristics,
  onHeuristicsChange,
}: MultiagentControlsProps) {
  const algorithms = [
    { 
      value: 'reflex', 
      label: 'Reflex Agent (Q1)', 
      description: 'Greedy evaluation of score, pellets, capsules, and ghost safety',
      ghostModel: 'No explicit ghost model; reacts to immediate features',
      agent: 'ReflexAgent'
    },
    { 
      value: 'minimax', 
      label: 'Minimax Agent (Q2)', 
      description: 'Adversarial search that plans several plies ahead',
      ghostModel: 'Ghosts modeled as optimal minimizers',
      agent: 'MinimaxAgent'
    },
    { 
      value: 'alphabeta', 
      label: 'Alpha-Beta Agent (Q3)', 
      description: 'Minimax with alpha-beta pruning for efficiency',
      ghostModel: 'Ghosts modeled as optimal minimizers',
      agent: 'AlphaBetaAgent'
    },
    { 
      value: 'expectimax', 
      label: 'Expectimax Agent (Q4)', 
      description: 'Search using expected values rather than min',
      ghostModel: 'Ghosts modeled as uniformly random over legal moves',
      agent: 'ExpectimaxAgent'
    }
  ];

  const handleAlgorithmChange = (algorithm: string) => {
    const algo = algorithms.find(a => a.value === algorithm);
    onAlgorithmChange(algorithm as any);
    if (algo) {
      onAgentChange(algo.agent as any);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Game Status Card */}
      <div className="card p-6 space-y-4">
        <h3 className="text-heading text-lg text-yellow-400">Game Status</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-body text-gray-300">Score:</span>
            <span className="text-heading text-xl text-green-400">{score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-body text-gray-300">Status:</span>
            <span className={`status-badge ${
              gameWon ? 'status-badge-success' : 
              gameOver ? 'status-badge-error' : 
              isRunning ? 'status-badge-warning' : 'status-badge-info'
            }`}>
              {gameWon ? 'Won!' : gameOver ? 'Lost!' : isRunning ? 'Running...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Layout Selection Card */}
      <div className="space-y-3">
        <label className="block text-caption font-semibold text-yellow-400">
          Select Layout
        </label>
        <select
          value={selectedLayout}
          onChange={(e) => onLayoutChange(e.target.value)}
          disabled={isRunning}
          className="select-pacman w-full"
        >
          {layoutOptions.map((layout) => (
            <option key={layout} value={layout}>
              {layout.replace(/([A-Z])/g, ' $1').trim()}
            </option>
          ))}
        </select>
      </div>

      {/* Heuristics Card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-heading text-lg text-yellow-400">Heuristics (Advanced)</h3>
          <span className="status-badge status-badge-info text-xs">Live‑tunable</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {([
            ['scoreWeight', 'Score weight'],
            ['foodLeftPenalty', 'Penalty per remaining food'],
            ['closestFoodWeight', 'Reward 1/d to closest food'],
            ['capsuleLeftPenalty', 'Penalty per remaining capsule'],
            ['closestCapsuleWeight', 'Reward 1/d to closest capsule'],
            ['scaredGhostWeight', 'Reward 1/d to scared ghost'],
            ['ghostDangerPenalty', 'Penalty if near ghost'],
            ['ghostDangerThreshold', 'Ghost danger distance'],
            ['revisitPenalty', 'Penalty for revisits'],
          ] as const).map(([key, label]) => (
            <label key={key} className="space-y-2">
              <span className="text-caption text-gray-300">{label}</span>
              <input
                type="number"
                step="1"
                value={(heuristics as any)[key]}
                onChange={(e) => onHeuristicsChange({ ...heuristics, [key]: Number(e.target.value) } as any)}
                disabled={isRunning}
                className="input-pacman w-full"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Pacman Strategy Selection Card */}
      <div className="space-y-4">
        <label className="block text-caption font-semibold text-yellow-400">
          Pacman Strategy
        </label>
        <select
          value={selectedAlgorithm}
          onChange={(e) => handleAlgorithmChange(e.target.value)}
          disabled={isRunning}
          className="select-pacman w-full"
        >
          {algorithms.map((algo) => (
            <option key={algo.value} value={algo.value}>
              {algo.label}
            </option>
          ))}
        </select>
        <div className="text-caption text-gray-300 space-y-1">
          <p>{algorithms.find(a => a.value === selectedAlgorithm)?.description}</p>
          <p><span className="text-gray-500">Ghost model:</span> {algorithms.find(a => a.value === selectedAlgorithm)?.ghostModel}</p>
        </div>
      </div>

      {/* Agent Type Card */}
      <div className="space-y-3">
        <label className="block text-caption font-semibold text-yellow-400">
          Agent Type
        </label>
        <select
          value={selectedAgent}
          onChange={(e) => onAgentChange(e.target.value as any)}
          disabled={isRunning}
          className="select-pacman w-full"
        >
          {algorithms.map((algo) => (
            <option key={algo.agent} value={algo.agent}>
              {algo.agent}
            </option>
          ))}
        </select>
      </div>

      {/* Animation Speed Card */}
      <div className="space-y-4">
        <label className="block text-caption font-semibold text-yellow-400">
          Animation Speed: {animationSpeed}ms
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={animationSpeed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            disabled={isRunning}
            className="slider w-full"
          />
          <div className="flex justify-between text-caption text-gray-400">
            <span>Fast</span>
            <span>Slow</span>
          </div>
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={onRunGame}
        disabled={isRunning}
        className="btn-pacman w-full py-4 text-lg"
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            Running...
          </span>
        ) : (
          '🎮 Start Game'
        )}
      </button>

      {/* Algorithm Info Card */}
      <div className="card p-6 space-y-4">
        <h3 className="text-heading text-lg text-yellow-400">Algorithm Performance</h3>
        <div className="space-y-3 text-body text-gray-200">
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-body font-semibold text-yellow-400 mb-1">Reflex Agent</div>
            <div className="text-caption">Greedy evaluation of score, pellets, capsules, and ghost safety. No adversarial modeling.</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-body font-semibold text-yellow-400 mb-1">Minimax</div>
            <div className="text-caption">Plans assuming ghosts play optimally (Pacman maximizes, ghosts minimize).</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-body font-semibold text-yellow-400 mb-1">Alpha-Beta</div>
            <div className="text-caption">Minimax with pruning for efficiency (same ghost assumption).</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-body font-semibold text-yellow-400 mb-1">Expectimax</div>
            <div className="text-caption">Plans using expected values when ghosts are modeled as uniformly random.</div>
          </div>
          <div className="text-caption text-gray-400 bg-gray-800/50 p-3 rounded-lg">
            <strong>Note:</strong> In-game ghosts use a DirectionalGhost policy (rush Pacman, flee when scared; attack=0.8, flee=0.8). This may differ from the Expectimax random-ghost assumption.
          </div>
        </div>
      </div>
    </div>
  );
}
