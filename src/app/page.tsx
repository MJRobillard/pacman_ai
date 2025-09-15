'use client';

import { useState, useEffect, useCallback } from 'react';
import PacmanSearch from '../components/PacmanSearch';
import SearchControls from '../components/SearchControls';
import PageHeader from '../components/PageHeader';
import { SearchAlgorithm, SearchState, MultiSearchState, AlgorithmColorMap } from '../types';
import { ParsedLayout, loadAllLayouts } from '../utils/layoutParser';

export default function Home() {
  const [layouts, setLayouts] = useState<ParsedLayout[]>([]);
  const [selectedMaze, setSelectedMaze] = useState<string>('mediumSearch');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SearchAlgorithm>('dfs');
  const [isRunning, setIsRunning] = useState(false);
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [multiSearchState, setMultiSearchState] = useState<MultiSearchState | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(100);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [runAll, setRunAll] = useState<boolean>(true);

  // Handle modal keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showConfigModal) {
        setShowConfigModal(false);
      }
    };

    if (showConfigModal) {
      document.body.classList.add('modal-open');
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [showConfigModal]);

  // Load layouts on component mount
  useEffect(() => {
    const loadLayouts = async () => {
      try {
        setLoading(true);
        const loadedLayouts = await loadAllLayouts();
        setLayouts(loadedLayouts);
        if (loadedLayouts.length > 0) {
          const preferred = loadedLayouts.find(l => l.name === 'mediumSearch');
          setSelectedMaze(preferred ? preferred.name : loadedLayouts[0].name);
        }
      } catch (error) {
        console.error('Failed to load layouts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadLayouts();
  }, []);

  const runSearch = useCallback(async () => {
    if (isRunning || layouts.length === 0) return;
    
    setIsRunning(true);
    setSearchState(null);
    setMultiSearchState(null);
    
    const maze = layouts.find(l => l.name === selectedMaze);
    if (!maze) {
      console.error('Maze not found:', selectedMaze);
      setIsRunning(false);
      return;
    }
    
    if (runAll) {
      const algorithms: SearchAlgorithm[] = ['dfs', 'bfs', 'ucs', 'astar'];
      const initial: MultiSearchState = {};
      for (const algo of algorithms) {
        initial[algo] = { visited: [], path: [], expanded: [], totalSteps: 0, pathLength: 0 };
      }
      setMultiSearchState(initial);

      await Promise.all(
        algorithms.map(async (algo) => {
          const result = await performSearchWithProgress(
            maze,
            algo,
            animationSpeed,
            (progress) => {
              setMultiSearchState(prev => ({ ...(prev || {}), [algo]: progress }));
            }
          );
          setMultiSearchState(prev => ({ ...(prev || {}), [algo]: result }));
        })
      );
    } else {
      const result = await performSearchWithProgress(
        maze,
        selectedAlgorithm,
        animationSpeed,
        (progress) => setSearchState(progress)
      );
      setSearchState(result);
    }

    setIsRunning(false);
  }, [selectedMaze, selectedAlgorithm, animationSpeed, isRunning, layouts, runAll]);

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <div className="text-2xl text-yellow-400 glow-yellow">Loading Pacman Layouts...</div>
        </div>
      </div>
    );
  }

  const currentMaze = layouts.find(l => l.name === selectedMaze);

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader
          title="Pacman AI Search"
          icon="🎮"
          right={(
            <button
              onClick={() => setShowConfigModal(true)}
              className="btn-secondary px-6 py-3"
            >
              ⚙️ Hueristics
            </button>
          )}
        />

        {/* Quick Controls Bar */}
        <div className="card p-4 mb-8">
          <div className="flex flex-wrap items-center gap-6">
            {/* Algorithm Selection */}
            <div className="flex items-center gap-3">
              <label className="text-caption font-semibold text-yellow-400 whitespace-nowrap">
                Algorithm:
              </label>
              <select
                value={runAll ? 'all' : selectedAlgorithm}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    setRunAll(true);
                  } else {
                    setRunAll(false);
                    setSelectedAlgorithm(value as any);
                  }
                }}
                disabled={isRunning}
                className="select-pacman min-w-[220px]"
              >
                <option value="all">Run all (compare)</option>
                <option value="dfs">Depth-First Search</option>
                <option value="bfs">Breadth-First Search</option>
                <option value="ucs">Uniform Cost Search</option>
                <option value="astar">A* Search</option>
              </select>
            </div>

            {/* Maze Selection */}
            <div className="flex items-center gap-3">
              <label className="text-caption font-semibold text-yellow-400 whitespace-nowrap">
                Maze:
              </label>
              <select
                value={selectedMaze}
                onChange={(e) => setSelectedMaze(e.target.value)}
                disabled={isRunning}
                className="select-pacman min-w-[150px]"
              >
                {layouts.map((maze) => (
                  <option key={maze.name} value={maze.name}>
                    {maze.name.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-3">
              <label className="text-caption font-semibold text-yellow-400 whitespace-nowrap">
                Speed:
              </label>
              <input
                type="range"
                min="0"
                max="500"
                step="50"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                disabled={isRunning}
                className="slider w-24"
              />
              <span className="text-caption text-gray-400 min-w-[40px]">
                {animationSpeed}ms
              </span>
            </div>

            {/* Description */}
            <div className="text-caption text-gray-400">
              {runAll ? 'Compare DFS, BFS, UCS, and A* simultaneously.' : 'Run the selected algorithm.'}
            </div>

            {/* Run Button */}
            <button
              onClick={runSearch}
              disabled={isRunning}
              className="btn-pacman px-8 py-3 ml-auto hidden md:inline-flex"
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Running...
                </span>
              ) : (
                (runAll ? '🚀 Run All (Compare)' : '🚀 Start')
              )}
            </button>
          </div>
        </div>
        
        {/* Main Game Area - Full Width */}
        <div className="w-full">
          {currentMaze ? (
            <PacmanSearch
              maze={currentMaze}
              searchState={searchState}
              isRunning={isRunning}
              multiSearchState={multiSearchState}
            />
          ) : (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <div className="text-heading text-2xl text-gray-400 mb-2">No Maze Selected</div>
              <div className="text-caption">Click Settings to choose a maze layout</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile sticky Start button */}
      <div className="md:hidden mobile-sticky-start">
        <button
          onClick={runSearch}
          disabled={isRunning}
          className="btn-pacman w-full py-4 text-xl"
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Running...
            </span>
          ) : (
            (runAll ? '🚀 Run All (Compare)' : '🚀 Start')
          )}
        </button>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50 modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfigModal(false);
            }
          }}
        >
          <div className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modal-content">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-heading text-2xl text-yellow-400">Search Configuration</h2>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors p-2 hover:bg-gray-700 rounded-lg modal-close"
              >
                ×
              </button>
            </div>
            <div className="p-6">
            <SearchControls
              selectedMaze={selectedMaze}
              selectedAlgorithm={selectedAlgorithm}
              animationSpeed={animationSpeed}
              isRunning={isRunning}
              runAll={runAll}
              onMazeChange={setSelectedMaze}
              onAlgorithmChange={setSelectedAlgorithm}
              onSpeedChange={setAnimationSpeed}
                onRunSearch={() => {
                  runSearch();
                  setShowConfigModal(false);
                }}
              onRunAllChange={setRunAll}
              mazeOptions={layouts.map(l => l.name)}
            />
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Search algorithm implementations with real-time progress
async function performSearchWithProgress(
  maze: ParsedLayout, 
  algorithm: SearchAlgorithm, 
  speed: number,
  onProgress: (state: SearchState) => void
): Promise<SearchState> {
  const visited: Set<string> = new Set();
  const path: Array<{x: number, y: number}> = [];
  const expanded: Array<{x: number, y: number, step: number}> = [];
  let step = 0;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const updateProgress = () => {
    onProgress({
      visited: Array.from(visited).map(key => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      }),
      path,
      expanded: [...expanded],
      totalSteps: step,
      pathLength: path.length - 1
    });
  };

  const getNeighbors = (x: number, y: number) => {
    const directions = [
      { dx: 0, dy: -1, action: 'North' },
      { dx: 1, dy: 0, action: 'East' },
      { dx: 0, dy: 1, action: 'South' },
      { dx: -1, dy: 0, action: 'West' }
    ];
    
    return directions
      .map(({ dx, dy, action }) => ({
        x: x + dx,
        y: y + dy,
        action
      }))
      .filter(({ x: nx, y: ny }) => 
        nx >= 0 && nx < maze.layout[0].length &&
        ny >= 0 && ny < maze.layout.length &&
        maze.layout[ny][nx] !== '%'
      );
  };

  const reconstructPath = (parent: Map<string, {x: number, y: number, action: string}>, goal: {x: number, y: number}) => {
    const path: Array<{x: number, y: number}> = [];
    let current = goal;
    
    while (current) {
      path.unshift(current);
      const parentKey = `${current.x},${current.y}`;
      const parentInfo = parent.get(parentKey);
      if (parentInfo) {
        current = { x: parentInfo.x, y: parentInfo.y };
      } else {
        break;
      }
    }
    
    return path;
  };

  const key = (x: number, y: number) => `${x},${y}`;

  if (algorithm === 'dfs') {
    const stack: Array<{x: number, y: number, parent: {x: number, y: number} | null}> = [];
    const parent = new Map<string, {x: number, y: number, action: string}>();
    
    stack.push({ x: maze.start.x, y: maze.start.y, parent: null });
    
    while (stack.length > 0) {
      const { x, y, parent: p } = stack.pop()!;
      const currentKey = key(x, y);
      
      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      expanded.push({ x, y, step: step++ });
      
      // Update progress after each expansion
      updateProgress();
      
      if (p) {
        const parentKey = key(p.x, p.y);
        parent.set(currentKey, { x: p.x, y: p.y, action: 'move' });
      }
      
      if (x === maze.goal.x && y === maze.goal.y) {
        path.push(...reconstructPath(parent, { x, y }));
        updateProgress(); // Final update with path
        break;
      }
      
      const neighbors = getNeighbors(x, y);
      for (const neighbor of neighbors) {
        const neighborKey = key(neighbor.x, neighbor.y);
        if (!visited.has(neighborKey)) {
          stack.push({ x: neighbor.x, y: neighbor.y, parent: { x, y } });
        }
      }
      
      if (speed > 0) await sleep(speed);
    }
  } else if (algorithm === 'bfs') {
    const queue: Array<{x: number, y: number, parent: {x: number, y: number} | null}> = [];
    const parent = new Map<string, {x: number, y: number, action: string}>();
    
    queue.push({ x: maze.start.x, y: maze.start.y, parent: null });
    
    while (queue.length > 0) {
      const { x, y, parent: p } = queue.shift()!;
      const currentKey = key(x, y);
      
      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      expanded.push({ x, y, step: step++ });
      
      // Update progress after each expansion
      updateProgress();
      
      if (p) {
        const parentKey = key(p.x, p.y);
        parent.set(currentKey, { x: p.x, y: p.y, action: 'move' });
      }
      
      if (x === maze.goal.x && y === maze.goal.y) {
        path.push(...reconstructPath(parent, { x, y }));
        updateProgress(); // Final update with path
        break;
      }
      
      const neighbors = getNeighbors(x, y);
      for (const neighbor of neighbors) {
        const neighborKey = key(neighbor.x, neighbor.y);
        if (!visited.has(neighborKey)) {
          queue.push({ x: neighbor.x, y: neighbor.y, parent: { x, y } });
        }
      }
      
      if (speed > 0) await sleep(speed);
    }
  } else if (algorithm === 'ucs') {
    const pq: Array<{x: number, y: number, cost: number, parent: {x: number, y: number} | null}> = [];
    const parent = new Map<string, {x: number, y: number, action: string}>();
    const costs = new Map<string, number>();
    
    pq.push({ x: maze.start.x, y: maze.start.y, cost: 0, parent: null });
    costs.set(key(maze.start.x, maze.start.y), 0);
    
    while (pq.length > 0) {
      pq.sort((a, b) => a.cost - b.cost);
      const { x, y, cost, parent: p } = pq.shift()!;
      const currentKey = key(x, y);
      
      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      expanded.push({ x, y, step: step++ });
      
      // Update progress after each expansion
      updateProgress();
      
      if (p) {
        parent.set(currentKey, { x: p.x, y: p.y, action: 'move' });
      }
      
      if (x === maze.goal.x && y === maze.goal.y) {
        path.push(...reconstructPath(parent, { x, y }));
        updateProgress(); // Final update with path
        break;
      }
      
      const neighbors = getNeighbors(x, y);
      for (const neighbor of neighbors) {
        const neighborKey = key(neighbor.x, neighbor.y);
        const newCost = cost + 1;
        
        if (!costs.has(neighborKey) || newCost < costs.get(neighborKey)!) {
          costs.set(neighborKey, newCost);
          pq.push({ x: neighbor.x, y: neighbor.y, cost: newCost, parent: { x, y } });
        }
      }
      
      if (speed > 0) await sleep(speed);
    }
  } else if (algorithm === 'astar') {
    const pq: Array<{x: number, y: number, cost: number, heuristic: number, parent: {x: number, y: number} | null}> = [];
    const parent = new Map<string, {x: number, y: number, action: string}>();
    const costs = new Map<string, number>();
    
    const heuristic = (x: number, y: number) => 
      Math.abs(x - maze.goal.x) + Math.abs(y - maze.goal.y);
    
    pq.push({ 
      x: maze.start.x, 
      y: maze.start.y, 
      cost: 0, 
      heuristic: heuristic(maze.start.x, maze.start.y),
      parent: null 
    });
    costs.set(key(maze.start.x, maze.start.y), 0);
    
    while (pq.length > 0) {
      pq.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
      const { x, y, cost, parent: p } = pq.shift()!;
      const currentKey = key(x, y);
      
      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      expanded.push({ x, y, step: step++ });
      
      // Update progress after each expansion
      updateProgress();
      
      if (p) {
        parent.set(currentKey, { x: p.x, y: p.y, action: 'move' });
      }
      
      if (x === maze.goal.x && y === maze.goal.y) {
        path.push(...reconstructPath(parent, { x, y }));
        updateProgress(); // Final update with path
        break;
      }
      
      const neighbors = getNeighbors(x, y);
      for (const neighbor of neighbors) {
        const neighborKey = key(neighbor.x, neighbor.y);
        const newCost = cost + 1;
        
        if (!costs.has(neighborKey) || newCost < costs.get(neighborKey)!) {
          costs.set(neighborKey, newCost);
          pq.push({ 
            x: neighbor.x, 
            y: neighbor.y, 
            cost: newCost, 
            heuristic: heuristic(neighbor.x, neighbor.y),
            parent: { x, y } 
          });
        }
      }
      
      if (speed > 0) await sleep(speed);
    }
  }

  return {
    visited: Array.from(visited).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    }),
    path,
    expanded,
    totalSteps: step,
    pathLength: path.length - 1
  };
}
