'use client';

import { SearchControlsProps } from '../types';

export default function SearchControls({
  selectedMaze,
  selectedAlgorithm,
  animationSpeed,
  isRunning,
  runAll,
  onMazeChange,
  onAlgorithmChange,
  onSpeedChange,
  onRunSearch,
  onRunAllChange,
  mazeOptions
}: SearchControlsProps) {
  const algorithms = [
    { value: 'dfs', label: 'Depth-First Search', description: 'Explores as far as possible along each branch' },
    { value: 'bfs', label: 'Breadth-First Search', description: 'Explores all nodes at the present depth level' },
    { value: 'ucs', label: 'Uniform Cost Search', description: 'Finds the path with lowest total cost' },
    { value: 'astar', label: 'A* Search', description: 'Uses heuristic to find optimal path efficiently' }
  ];

  return (
    <div className="space-y-8">
      
      {/* Maze Selection Card */}
      <div className="space-y-3">
        <label className="block text-caption font-semibold text-yellow-400">
          Select Maze Layout
        </label>
        <select
          value={selectedMaze}
          onChange={(e) => onMazeChange(e.target.value)}
          disabled={isRunning}
          className="select-pacman w-full"
        >
          {mazeOptions.map((maze) => (
            <option key={maze} value={maze}>
              {maze.replace(/([A-Z])/g, ' $1').trim()}
            </option>
          ))}
        </select>
      </div>

      {/* Algorithm Selection Card */}
      <div className="space-y-4">
        <label className="block text-caption font-semibold text-yellow-400">
          Search Algorithm
        </label>
        <div>
          <select
            value={runAll ? 'all' : selectedAlgorithm}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'all') {
                onRunAllChange(true);
              } else {
                onRunAllChange(false);
                onAlgorithmChange(value as any);
              }
            }}
            disabled={isRunning}
            className="select-pacman w-full"
          >
            <option value="all">Run all (compare)</option>
            {algorithms.map((algo) => (
              <option key={algo.value} value={algo.value}>
                {algo.label}
              </option>
            ))}
          </select>
          <div className="mt-2 text-caption text-gray-400 leading-relaxed">
            {runAll
              ? 'Runs DFS, BFS, UCS, and A* simultaneously with distinct colors.'
              : algorithms.find(a => a.value === selectedAlgorithm)?.description}
          </div>
        </div>
      </div>

      {/* Animation Speed Card */}
      <div className="space-y-4">
        <label className="block text-caption font-semibold text-yellow-400">
          Animation Speed: {animationSpeed}ms
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="500"
            step="50"
            value={animationSpeed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            disabled={isRunning}
            className="slider w-full"
          />
          <div className="flex justify-between text-caption text-gray-400">
            <span>Instant</span>
            <span>Slow</span>
          </div>
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={onRunSearch}
        disabled={isRunning}
        className="btn-pacman w-full py-4 text-lg"
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            Running...
          </span>
        ) : (
          (runAll ? 'Run All (Compare)' : 'Run Search')
        )}
      </button>

      {/* Algorithm Info Card */}
      <div className="card p-6 space-y-4">
        <h3 className="text-heading text-lg text-yellow-400">Algorithm Performance</h3>
        <div className="space-y-3">
          {[
            { name: 'DFS', desc: 'Stack-based, memory efficient', complexity: 'O(b^m)' },
            { name: 'BFS', desc: 'Queue-based, finds shortest path', complexity: 'O(b^d)' },
            { name: 'UCS', desc: 'Cost-aware, optimal solution', complexity: 'O(b^C*)' },
            { name: 'A*', desc: 'Heuristic-guided, most efficient', complexity: 'O(b^d)' }
          ].map((algo) => (
            <div key={algo.name} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <div>
                <span className="text-body font-semibold text-yellow-400">{algo.name}</span>
                <div className="text-caption text-gray-400">{algo.desc}</div>
              </div>
              <span className="text-mono text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                {algo.complexity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
