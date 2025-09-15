'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PacmanSearchProps, SearchAlgorithm } from '../types';
import { PacmanVisual, GoalVisual, FoodVisual, PathVisual, ExploredVisual } from './GameVisuals';

export default function PacmanSearch({ maze, searchState, isRunning, multiSearchState = null }: PacmanSearchProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPath, setShowPath] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [cellSize, setCellSize] = useState<number>(24);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const algorithms: SearchAlgorithm[] = ['dfs', 'bfs', 'ucs', 'astar'];
  const algoColors: Record<SearchAlgorithm, { explore: string; path: string; label: string }> = {
    dfs: { explore: '#F59E0B', path: '#FCD34D', label: 'Depth-First Search' },
    bfs: { explore: '#60A5FA', path: '#3B82F6', label: 'Breadth-First Search' },
    ucs: { explore: '#34D399', path: '#10B981', label: 'Uniform Cost Search' },
    astar: { explore: '#A78BFA', path: '#8B5CF6', label: 'A* Search' }
  };

  useEffect(() => {
    if (multiSearchState) {
      const maxStep = algorithms.reduce((acc, algo) => {
        const s = multiSearchState[algo];
        return Math.max(acc, s ? s.expanded.length : 0);
      }, 0);
      setCurrentStep(maxStep);
      if (!isRunning) setShowCompleteModal(true);
      setShowPath(false);
      return;
    }

    if (searchState) {
      if (isRunning) {
        setCurrentStep(searchState.expanded.length);
        setShowPath(false);
        setShowCompleteModal(false);
      } else {
        setCurrentStep(searchState.expanded.length);
        setShowPath(false);
        setShowCompleteModal(true);
      }
    }
  }, [searchState, multiSearchState, isRunning]);

  // Keep the maze fitting within view by calculating a responsive cell size
  useEffect(() => {
    const recalcCellSize = () => {
      if (!maze) return;
      const columns = maze.layout[0]?.length || 1;
      const rows = maze.layout.length || 1;
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      // Use a vertical budget based on viewport minus approximate header/controls
      const verticalBudget = Math.max(300, window.innerHeight - 360);
      const sizeByWidth = Math.floor((containerWidth - 32) / columns); // account for padding
      const sizeByHeight = Math.floor((verticalBudget - 32) / rows);
      const computed = Math.max(8, Math.min(28, Math.min(sizeByWidth, sizeByHeight)));
      setCellSize(computed);
    };

    recalcCellSize();
    window.addEventListener('resize', recalcCellSize);
    return () => window.removeEventListener('resize', recalcCellSize);
  }, [maze]);

  const getCellClasses = (x: number, y: number) => {
    const isWall = maze.layout[y][x] === '%';
    const isStart = x === maze.start.x && y === maze.start.y;
    const isGoal = x === maze.goal.x && y === maze.goal.y;
    const isVisited = !multiSearchState && searchState?.visited.some(v => v.x === x && v.y === y);
    const isExpanded = !multiSearchState && searchState?.expanded.slice(0, currentStep).some(e => e.x === x && e.y === y);
    const isPath = !multiSearchState && showPath && searchState?.path.some(p => p.x === x && p.y === y);

    let classes = 'maze-cell';
    
    if (isWall) {
      classes += ' wall';
    } else if (isPath) {
      classes += ' path';
    } else if (isStart) {
      classes += ' start';
    } else if (isGoal) {
      classes += ' goal';
    } else if (isExpanded) {
      classes += ' explored';
      // Add timing class based on when it was expanded
      const expandedStep = searchState?.expanded.find(e => e.x === x && e.y === y)?.step || 0;
      const maxSteps = searchState?.expanded.length || 1;
      const stepRatio = expandedStep / maxSteps;
      if (stepRatio < 0.3) {
        classes += ' early';
      } else if (stepRatio > 0.7) {
        classes += ' late';
      }
    } else if (isVisited) {
      classes += ' explored';
    }

    return classes;
  };

  const getCellContent = (x: number, y: number) => {
    const isStart = x === maze.start.x && y === maze.start.y;
    const isGoal = x === maze.goal.x && y === maze.goal.y;
    const isPathSingle = !multiSearchState && showPath && searchState?.path.some(p => p.x === x && p.y === y);
    const isExpandedSingle = !multiSearchState && searchState?.expanded.slice(0, currentStep).some(e => e.x === x && e.y === y);
    const isFood = maze.layout[y][x] === '.';

    const layers: React.ReactNode[] = [];

    // Multi-search overlays
    if (multiSearchState) {
      for (const algo of algorithms) {
        const state = multiSearchState[algo];
        if (!state) continue;
        const inExpanded = state.expanded.some(e => e.x === x && e.y === y);
        if (inExpanded) {
          const expandedStep = state.expanded.find(e => e.x === x && e.y === y)?.step || 0;
          const maxSteps = Math.max(1, state.expanded.length);
          const stepRatio = expandedStep / maxSteps;
          layers.push(
            <div key={`exp-${algo}`} style={{ position: 'absolute', inset: 0 }}>
              <ExploredVisual size={24} stepRatio={stepRatio} baseColor={algoColors[algo].explore} />
            </div>
          );
        }
      }

      if (showPath) {
        for (const algo of algorithms) {
          const state = multiSearchState[algo];
          if (!state) continue;
          const inPath = state.path.some(p => p.x === x && p.y === y);
          if (inPath) {
            layers.push(
              <div key={`path-${algo}`} style={{ position: 'absolute', inset: 0 }}>
                <PathVisual size={24} color={algoColors[algo].path} />
              </div>
            );
          }
        }
      }
    } else {
      // Single search mode
      if (isPathSingle) layers.push(<PathVisual key="path-single" size={24} />);
      if (isExpandedSingle) {
        const expandedStep = searchState?.expanded.find(e => e.x === x && e.y === y)?.step || 0;
        const maxSteps = searchState?.expanded.length || 1;
        const stepRatio = expandedStep / maxSteps;
        layers.push(<ExploredVisual key="exp-single" size={24} stepRatio={stepRatio} />);
      }
    }

    if (isFood) layers.push(<FoodVisual key="food" size={24} />);
    if (isGoal) layers.push(<GoalVisual key="goal" size={24} />);
    if (isStart) layers.push(<PacmanVisual key="start" size={24} />);

    return layers;
  };

  if (!maze) return null;

  return (
    <div className="card-elevated p-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <div className="space-y-1">
          <h2 className="text-heading text-2xl text-yellow-400">{maze.name}</h2>
          <p className="text-caption">Search algorithm visualization</p>
        </div>
        
        {(searchState || multiSearchState) && (
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-heading text-xl text-blue-400">{currentStep}</div>
              <div className="text-caption">Steps</div>
            </div>
            <div className="text-center">
              <div className="text-heading text-xl text-green-400">{multiSearchState ? '-' : searchState?.pathLength}</div>
              <div className="text-caption">Path Length</div>
            </div>
            <div className="text-center">
              <div className="text-heading text-xl text-purple-400">{multiSearchState ? '-' : (searchState?.expanded.length || 0)}</div>
              <div className="text-caption">Explored</div>
            </div>
          </div>
        )}
      </div>

      {/* Maze Grid - Responsive sizing to avoid scroll */}
      <div className="flex justify-center mb-6">
        <div ref={containerRef} className="maze-container p-4 md:p-8 flex justify-center" style={{ width: '100%' }}>
          <div 
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${maze.layout[0].length}, var(--cell-size))`,
              gridTemplateRows: `repeat(${maze.layout.length}, var(--cell-size))`,
              // @ts-ignore custom property type
              ['--cell-size' as any]: `${cellSize}px`
            }}
          >
            {maze.layout.map((row: string, y: number) =>
              row.split('').map((cell: string, x: number) => (
                <div
                  key={`${x}-${y}`}
                  className={getCellClasses(x, y)}
                  style={{ 
                    width: `${cellSize}px`, 
                    height: `${cellSize}px`,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {getCellContent(x, y)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        <div className="legend-item">
          <div className="w-10 h-10 flex items-center justify-center">
            <PacmanVisual size={36} />
          </div>
          <span className="text-yellow-400">Start (Pacman)</span>
        </div>
        <div className="legend-item">
          <div className="w-10 h-10 flex items-center justify-center">
            <GoalVisual size={36} />
          </div>
          <span className="text-red-400">Goal</span>
        </div>

        {multiSearchState ? (
          <>
            {algorithms.map(algo => (
              <div key={`legend-${algo}`} className="legend-item">
                <div className="w-10 h-10 flex items-center justify-center">
                  <PathVisual size={36} color={algoColors[algo].path} />
                </div>
                <span className="text-white">{algoColors[algo].label}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="legend-item">
              <div className="w-10 h-10 flex items-center justify-center">
                <PathVisual size={36} />
              </div>
              <span className="text-yellow-400">Path</span>
            </div>
            <div className="legend-item">
              <div className="w-10 h-10 flex items-center justify-center">
                <ExploredVisual size={36} stepRatio={0.5} />
              </div>
              <span className="text-blue-400">Explored</span>
            </div>
          </>
        )}

        <div className="legend-item">
          <div className="w-10 h-10 flex items-center justify-center">
            <FoodVisual size={36} />
          </div>
          <span className="text-white">Food</span>
        </div>
      </div>

      {/* Progress Section */}
      {(searchState || multiSearchState) && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-heading text-lg text-gray-300">Search Progress</span>
            <span className="text-mono text-lg text-yellow-400 font-semibold">
              {multiSearchState
                ? '—'
                : Math.round((currentStep / (searchState?.expanded.length || 1)) * 100) + '%'}
            </span>
          </div>
          <div className="progress-bar w-full">
            <div
              className="progress-fill"
              style={{ width: multiSearchState ? '0%' : `${(currentStep / (searchState?.expanded.length || 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      <div className="mt-8 text-center">
        {isRunning && (
          <div className="status-badge status-badge-warning">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>Searching... {multiSearchState ? 'multiple algorithms' : `${searchState?.expanded.length || 0} nodes explored`}</span>
          </div>
        )}
        {(searchState || multiSearchState) && !isRunning && !showPath && (
          <div className="status-badge status-badge-info">
            <span>⏸️</span>
            <span>Search paused</span>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {(searchState || multiSearchState) && showCompleteModal && (
        <div className="modal-overlay flex items-center justify-center">
          <div className="modal-content rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2 text-yellow-400">Path Found!</h3>
            {!multiSearchState ? (
              <p className="text-gray-200 mb-4">Length: <span className="text-yellow-300 font-semibold">{searchState?.pathLength}</span> steps</p>
            ) : (
              <div className="text-gray-200 mb-4 space-y-1">
                {algorithms.map(algo => (
                  <div key={`res-${algo}`} className="flex items-center justify-between">
                    <span className="text-white">{algoColors[algo].label}</span>
                    <span className="text-yellow-300 font-semibold">{multiSearchState?.[algo]?.pathLength ?? '-'}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                className="btn-secondary px-4 py-2"
                onClick={() => setShowCompleteModal(false)}
              >
                Close
              </button>
              <button
                className="btn-pacman px-4 py-2"
                onClick={() => { setShowPath(true); setShowCompleteModal(false); }}
              >
                View Path
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
