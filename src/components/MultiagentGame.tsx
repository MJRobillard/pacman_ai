'use client';

import { useState, useEffect, useRef } from 'react';
import { MultiagentGameProps } from '../types/multiagent';
import { PacmanVisual, GhostVisual, FoodVisual, CapsuleVisual } from './GameVisuals';

export default function MultiagentGame({ layout, gameState, isRunning, algorithm, cellSize: propCellSize }: MultiagentGameProps) {
  const [showGhosts, setShowGhosts] = useState(true);
  const [showFood, setShowFood] = useState(true);
  const [showCapsules, setShowCapsules] = useState(true);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<HTMLDivElement | null>(null);
  const [cellSize, setCellSize] = useState<number>(24);
  const [scale, setScale] = useState<number>(1);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panState = useRef<{ panning: boolean; lastX: number; lastY: number; pinchDist: number; startScale: number }>({ panning: false, lastX: 0, lastY: 0, pinchDist: 0, startScale: 1 });

  // Debug logging
  console.log('MultiagentGame render - gameState:', gameState);
  console.log('MultiagentGame render - layout:', layout);

  // Fixed cell sizing: use provided cellSize or default
  useEffect(() => {
    if (propCellSize !== undefined) {
      setCellSize(propCellSize);
    } else {
      setCellSize(32); // Fixed default size
    }
  }, [propCellSize]);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!transformRef.current) return;
      if (!e.ctrlKey && Math.abs(e.deltaY) < 30) return; // avoid accidental
      e.preventDefault();
      const rect = transformRef.current.getBoundingClientRect();
      const originX = e.clientX - rect.left;
      const originY = e.clientY - rect.top;
      const zoomFactor = Math.exp(-e.deltaY * 0.0015);
      const newScale = Math.max(0.6, Math.min(2.5, scale * zoomFactor));
      const k = newScale / scale;
      // translate to keep pointer position stable
      const newTranslate = {
        x: originX - k * (originX - translate.x),
        y: originY - k * (originY - translate.y),
      };
      setScale(newScale);
      setTranslate(newTranslate);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel as any);
  }, [scale, translate]);

  // Pointer pan
  useEffect(() => {
    const view = containerRef.current;
    if (!view) return;
    const onPointerDown = (e: PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      panState.current.panning = true;
      panState.current.lastX = e.clientX;
      panState.current.lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!panState.current.panning) return;
      const dx = e.clientX - panState.current.lastX;
      const dy = e.clientY - panState.current.lastY;
      panState.current.lastX = e.clientX;
      panState.current.lastY = e.clientY;
      setTranslate(t => ({ x: t.x + dx, y: t.y + dy }));
    };
    const onPointerUp = () => { panState.current.panning = false; };
    view.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      view.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  // Touch pinch zoom
  useEffect(() => {
    const view = containerRef.current;
    if (!view) return;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        panState.current.pinchDist = Math.hypot(dx, dy);
        panState.current.startScale = scale;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / Math.max(1, panState.current.pinchDist);
        const newScale = Math.max(0.6, Math.min(2.5, panState.current.startScale * factor));
        setScale(newScale);
      }
    };
    view.addEventListener('touchstart', onTouchStart, { passive: true });
    view.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      view.removeEventListener('touchstart', onTouchStart);
      view.removeEventListener('touchmove', onTouchMove as any);
    };
  }, [scale]);

  const getCellClasses = (x: number, y: number) => {
    const isWall = layout.walls.some(wall => wall.x === x && wall.y === y);
    const isPacman = gameState?.pacman.x === x && gameState?.pacman.y === y;
    const isGhost = showGhosts && gameState?.ghosts.some(ghost => ghost.x === x && ghost.y === y);
    const isFood = showFood && gameState?.food.some(food => food.x === x && food.y === y);
    const isCapsule = showCapsules && gameState?.capsules.some(capsule => capsule.x === x && capsule.y === y);

    let classes = 'maze-cell';
    
    if (isWall) {
      classes += ' wall';
    } else if (isPacman) {
      classes += ' pacman-cell';
    } else if (isGhost) {
      classes += ' ghost-cell';
    } else if (isCapsule) {
      classes += ' capsule-cell';
    } else if (isFood) {
      classes += ' food-cell';
    }

    return classes;
  };


  const getCellContent = (x: number, y: number) => {
    const isPacman = gameState?.pacman.x === x && gameState?.pacman.y === y;
    const isGhost = showGhosts && gameState?.ghosts.some(ghost => ghost.x === x && ghost.y === y && ghost.x !== -1 && ghost.y !== -1);
    const isFood = showFood && gameState?.food.some(food => food.x === x && food.y === y);
    const isCapsule = showCapsules && gameState?.capsules.some(capsule => capsule.x === x && capsule.y === y);

    if (isPacman) {
      console.log('Rendering Pacman at', x, y);
      return <PacmanVisual size={Math.max(8, Math.floor(cellSize * 0.9))} />;
    }
    if (isGhost) {
      const ghost = gameState?.ghosts.find(g => g.x === x && g.y === y && g.x !== -1 && g.y !== -1);
      const ghostIndex = gameState?.ghosts.findIndex(g => g.x === x && g.y === y && g.x !== -1 && g.y !== -1) || 0;
      console.log('Rendering Ghost at', x, y, 'scared:', ghost?.scared);
      return <GhostVisual size={Math.max(8, Math.floor(cellSize * 0.9))} colorIndex={ghostIndex} isScared={ghost?.scared || false} />;
    }
    if (isCapsule) {
      console.log('Rendering Capsule at', x, y);
      return <CapsuleVisual size={Math.max(6, Math.floor(cellSize * 0.6))} />;
    }
    if (isFood) {
      console.log('Rendering Food at', x, y);
      return <FoodVisual size={Math.max(6, Math.floor(cellSize * 0.5))} />;
    }
    return null;
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${reduceMotion ? 'reduce-motion' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-yellow-400 glow-yellow">
          {layout.name.replace(/([A-Z])/g, ' $1').trim()}
        </h2>
        <div className="text-sm text-blue-300">
          <div>Algorithm: <span className="text-green-400 font-bold">{algorithm}</span></div>
          <div>Score: <span className="text-yellow-400 font-bold">{gameState?.score || 0}</span></div>
        </div>
      </div>

      {/* Game Board with Zoom & Pan */}
      <div className="flex justify-center mb-6">
        <div className="maze-container">
          <div
            ref={containerRef}
            className="board-viewport"
            style={{ 
              touchAction: 'none',
              width: `${layout.width * cellSize}px`,
              height: `${layout.height * cellSize}px`,
              maxWidth: '800px',
              maxHeight: '600px'
            }}
          >
            <div
              ref={transformRef}
              className="board-transform"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: '0 0'
              }}
            >
              <div 
                className="grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${layout.width}, ${cellSize}px)`,
                  gridTemplateRows: `repeat(${layout.height}, ${cellSize}px)`,
                  width: `${layout.width * cellSize}px`,
                  height: `${layout.height * cellSize}px`
                }}
              >
                {Array.from({ length: layout.height }, (_, y) =>
                  Array.from({ length: layout.width }, (_, x) => (
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
        </div>
      </div>

      {/* Compact stats row under board */}
      <div className="flex items-center justify-center gap-8 text-xl mb-6" aria-label="Summary stats">
        <div className="flex items-center gap-3"><span className="text-green-400 font-bold">{gameState?.food.length ?? 0}</span></div>
        <div className="flex items-center gap-3"><span className="text-blue-300 font-bold">{gameState?.capsules.length ?? 0}</span></div>
        <div className="flex items-center gap-3"><span className="text-red-400 font-bold">{gameState ? gameState.ghosts.filter(g => g.x !== -1 && g.y !== -1).length : 0}</span></div>
      </div>

      {/* Details accordion */}
      <details className="card p-4">
        <summary className="cursor-pointer text-yellow-400 font-semibold">Details</summary>
        {gameState && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
            <div>
              <span className="text-blue-300">Food Remaining</span>
              <div className="text-green-400 font-bold">{gameState.food.length}</div>
            </div>
            <div>
              <span className="text-blue-300">Capsules Remaining</span>
              <div className="text-yellow-400 font-bold">{gameState.capsules.length}</div>
            </div>
            <div>
              <span className="text-blue-300">Active Ghosts</span>
              <div className="text-red-400 font-bold">{gameState.ghosts.filter(g => g.x !== -1 && g.y !== -1).length}</div>
            </div>
            <div>
              <span className="text-blue-300">Scared Ghosts</span>
              <div className="text-white font-bold">{gameState.ghosts.filter(g => g.scared && g.x !== -1 && g.y !== -1).length}</div>
            </div>
            <div>
              <span className="text-blue-300">Status</span>
              <div className={`font-bold ${
                gameState.won ? 'text-green-400' : 
                gameState.gameOver ? 'text-red-400' : 
                'text-yellow-400'
              }`}>
                {gameState.won ? 'Won!' : gameState.gameOver ? 'Lost!' : 'Playing'}
              </div>
            </div>
          </div>
        )}
      </details>


      {/* Legend */}
      <div className="grid grid-cols-5 gap-6 text-sm mt-6">
        <div className="legend-item">
          <div className="w-6 h-6 flex items-center justify-center">
            <PacmanVisual size={24} />
          </div>
          <span className="text-yellow-400 font-bold">Pacman</span>
        </div>
        <div className="legend-item">
          <div className="w-6 h-6 flex items-center justify-center">
            <GhostVisual size={24} colorIndex={0} />
          </div>
          <span className="text-red-400 font-bold">Ghost</span>
        </div>
        <div className="legend-item">
          <div className="w-6 h-6 flex items-center justify-center">
            <GhostVisual size={24} colorIndex={0} isScared={true} />
          </div>
          <span className="text-white font-bold">Scared Ghost</span>
        </div>
        <div className="legend-item">
          <div className="w-6 h-6 flex items-center justify-center">
            <FoodVisual size={24} />
          </div>
          <span className="text-yellow-400 font-bold">Food</span>
        </div>
        <div className="legend-item">
          <div className="w-6 h-6 flex items-center justify-center">
            <CapsuleVisual size={24} />
          </div>
          <span className="text-yellow-400 font-bold">Capsule</span>
        </div>
      </div>

      {/* Bottom sheet toggle */}
      <button
        className="fixed bottom-6 right-6 z-40 btn-secondary px-4 py-3 text-sm md:text-base"
        onClick={() => setBottomSheetOpen(true)}
        aria-label="Open options"
      >
        Options
      </button>

      {/* Bottom Sheet */}
      {bottomSheetOpen && (
        <div className="bottom-sheet-overlay" onClick={() => setBottomSheetOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-heading text-xl text-yellow-400 font-semibold">Display & Accessibility</div>
              <button className="btn-secondary px-3 py-2" onClick={() => setBottomSheetOpen(false)}>Close</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="toggle-row">
                <span>Show Ghosts</span>
                <input type="checkbox" className="toggle-switch" checked={showGhosts} onChange={e => setShowGhosts(e.target.checked)} />
              </label>
              <label className="toggle-row">
                <span>Show Food</span>
                <input type="checkbox" className="toggle-switch" checked={showFood} onChange={e => setShowFood(e.target.checked)} />
              </label>
              <label className="toggle-row">
                <span>Show Capsules</span>
                <input type="checkbox" className="toggle-switch" checked={showCapsules} onChange={e => setShowCapsules(e.target.checked)} />
              </label>
              <label className="toggle-row">
                <span>Minimal animations</span>
                <input type="checkbox" className="toggle-switch" checked={reduceMotion} onChange={e => setReduceMotion(e.target.checked)} />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}