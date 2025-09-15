'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import MultiagentGame from '../../components/MultiagentGame';
import MultiagentControls from '../../components/MultiagentControls';
import { MultiagentAlgorithm, GameState, AgentType, HeuristicWeights } from '../../types/multiagent';

export default function MultiagentPage() {
  const [layouts, setLayouts] = useState<any[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<string>('smallClassic');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<MultiagentAlgorithm>('reflex');
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('ReflexAgent');
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(200);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [heuristics, setHeuristics] = useState<HeuristicWeights>({
    scoreWeight: 1,
    foodLeftPenalty: 5000,
    closestFoodWeight: 120,
    capsuleLeftPenalty: 800,
    closestCapsuleWeight: 1500,
    scaredGhostWeight: 1200,
    ghostDangerPenalty: 2000,
    ghostDangerThreshold: 2,
    revisitPenalty: 5000,
  });
  const [showConfigModal, setShowConfigModal] = useState(false);

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

  // Keep global weights in sync so evaluators use live-tuned values
  useEffect(() => {
    HEURISTIC_WEIGHTS = heuristics as any;
  }, [heuristics]);

  // Handle algorithm change for quick controls
  const handleAlgorithmChange = (algorithm: string) => {
    const algorithms = [
      { value: 'reflex', agent: 'ReflexAgent' },
      { value: 'minimax', agent: 'MinimaxAgent' },
      { value: 'alphabeta', agent: 'AlphaBetaAgent' },
      { value: 'expectimax', agent: 'ExpectimaxAgent' }
    ];
    
    const algo = algorithms.find(a => a.value === algorithm);
    setSelectedAlgorithm(algorithm as any);
    if (algo) {
      setSelectedAgent(algo.agent as any);
    }
  };

  // Load layouts on component mount
  useEffect(() => {
    const loadLayouts = async () => {
      try {
        setLoading(true);
        const loadedLayouts = await loadMultiagentLayouts();
        setLayouts(loadedLayouts);
        if (loadedLayouts.length > 0) {
          setSelectedLayout(loadedLayouts[0].name);
        }
      } catch (error) {
        console.error('Failed to load layouts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadLayouts();
  }, []);

  const runGame = useCallback(async () => {
    if (isRunning || layouts.length === 0) return;
    
    setIsRunning(true);
    setGameOver(false);
    setGameWon(false);
    setScore(0);
    
    const layout = layouts.find(l => l.name === selectedLayout);
    if (!layout) {
      console.error('Layout not found:', selectedLayout);
      setIsRunning(false);
      return;
    }
    
    // Initialize game state
    const initialState: GameState = {
      pacman: { x: layout.pacman.x, y: layout.pacman.y },
      ghosts: layout.ghosts.map((ghost: any) => ({ ...ghost, scared: false, scaredTime: 0 })),
      food: layout.food,
      capsules: layout.capsules || [],
      score: 0,
      walls: layout.walls,
      width: layout.width,
      height: layout.height,
      gameOver: false,
      won: false
    };
    
    setGameState(initialState);
    
    // Run the selected algorithm
    const result = await runMultiagentAlgorithm(
      initialState,
      selectedAlgorithm,
      selectedAgent,
      animationSpeed,
      (newState) => {
        setGameState(newState);
        setScore(newState.score);
        if (newState.gameOver) {
          setGameOver(true);
          setGameWon(newState.won);
          setIsRunning(false);
        }
      }
    );
    
    setGameState(result);
    setScore(result.score);
    setGameOver(true);
    setGameWon(result.won);
    setIsRunning(false);
  }, [selectedLayout, selectedAlgorithm, selectedAgent, animationSpeed, isRunning, layouts]);

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">👻</div>
          <div className="text-2xl text-yellow-400 glow-yellow">Loading Multi-Agent Pacman...</div>
        </div>
      </div>
    );
  }

  const currentLayout = layouts.find(l => l.name === selectedLayout);

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader
          title="Multi‑Agent Pacman AI"
          icon="👻"
          accentFrom="from-purple-300"
          accentVia="via-pink-300"
          accentTo="to-rose-400"
          right={(
            <button
              onClick={() => setShowConfigModal(true)}
              className="btn-secondary px-6 py-3"
            >
              ⚙️ Heuristics
            </button>
          )}
        />

        {/* Quick Controls Bar */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* Algorithm Selection */}
            <div className="flex items-center gap-3">
              <label className="text-caption font-semibold text-purple-400 whitespace-nowrap">
                Strategy:
              </label>
              <select
                value={selectedAlgorithm}
                onChange={(e) => handleAlgorithmChange(e.target.value)}
                disabled={isRunning}
                className="select-pacman min-w-[200px]"
              >
                <option value="reflex">Reflex Agent</option>
                <option value="minimax">Minimax Agent</option>
                <option value="alphabeta">Alpha-Beta Agent</option>
                <option value="expectimax">Expectimax Agent</option>
              </select>
            </div>

            {/* Layout Selection */}
            <div className="flex items-center gap-3">
              <label className="text-caption font-semibold text-purple-400 whitespace-nowrap">
                Layout:
              </label>
              <select
                value={selectedLayout}
                onChange={(e) => setSelectedLayout(e.target.value)}
                disabled={isRunning}
                className="select-pacman min-w-[150px]"
              >
                {layouts.map((layout) => (
                  <option key={layout.name} value={layout.name}>
                    {layout.name.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-3">
              <label className="text-caption font-semibold text-purple-400 whitespace-nowrap">
                Speed:
              </label>
              <input
                type="range"
                min="50"
                max="1000"
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

            {/* Score Display */}
            <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-purple-400">Score:</span>
              <span className="text-heading text-lg text-green-400 font-bold">{score}</span>
            </div>

            {/* Description */}
            <div className="text-caption text-gray-400">
              {selectedAlgorithm === 'reflex' ? 'Simple reactive agent based on immediate rewards.' : 
               selectedAlgorithm === 'minimax' ? 'Adversarial search assuming optimal ghost behavior.' :
               selectedAlgorithm === 'alphabeta' ? 'Optimized minimax with alpha-beta pruning.' :
               'Probabilistic search accounting for random ghost behavior.'}
            </div>

            {/* Run Button */}
            <button
              onClick={runGame}
              disabled={isRunning}
              className="btn-pacman px-8 py-3 ml-auto hidden md:inline-flex"
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Running...
                </span>
              ) : (
                '🎮 Start Game'
              )}
            </button>
          </div>
        </div>
        
        {/* Main Game Area - Full Width */}
        <div className="w-full">
          {currentLayout ? (
            <MultiagentGame
              layout={currentLayout}
              gameState={gameState}
              isRunning={isRunning}
              algorithm={selectedAlgorithm}
            />
          ) : (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <div className="text-heading text-2xl text-gray-400 mb-2">No Layout Selected</div>
              <div className="text-caption">Click Settings to choose a layout</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile sticky Start button */}
      <div className="md:hidden mobile-sticky-start">
        <button
          onClick={runGame}
          disabled={isRunning}
          className="btn-pacman w-full py-4 text-xl"
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Running...
            </span>
          ) : (
            '🎮 Start Game'
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
              <h2 className="text-heading text-2xl text-purple-400">Multi-Agent Configuration</h2>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors p-2 hover:bg-gray-700 rounded-lg modal-close"
              >
                ×
              </button>
            </div>
            <div className="p-6">
            <MultiagentControls
              selectedLayout={selectedLayout}
              selectedAlgorithm={selectedAlgorithm}
              selectedAgent={selectedAgent}
              animationSpeed={animationSpeed}
              isRunning={isRunning}
              score={score}
              gameOver={gameOver}
              gameWon={gameWon}
              onLayoutChange={setSelectedLayout}
              onAlgorithmChange={setSelectedAlgorithm}
              onAgentChange={setSelectedAgent}
              onSpeedChange={setAnimationSpeed}
                onRunGame={() => {
                  runGame();
                  setShowConfigModal(false);
                }}
              layoutOptions={layouts.map(l => l.name)}
              heuristics={heuristics}
              onHeuristicsChange={setHeuristics}
            />
          </div>
          </div>
              </div>
            )}
    </div>
  );
}

// Load multiagent layouts
async function loadMultiagentLayouts() {
  const layouts = [
    'smallClassic',
    'openClassic',
    'contestClassic',
    'originalClassic',
    'capsuleClassic',
    'powerClassic',
    'minimaxClassic',
    'mediumClassic',
    'trappedClassic',
    'trickyClassic',
    'testClassic'
  ];
  
  const loadedLayouts = [];
  
  for (const layoutName of layouts) {
    try {
      const response = await fetch(`/api/multiagent/layouts/${layoutName}`);
      if (response.ok) {
        const layout = await response.json();
        loadedLayouts.push(layout);
      }
    } catch (error) {
      console.warn(`Failed to load layout ${layoutName}:`, error);
    }
  }
  
  return loadedLayouts;
}

// Multiagent algorithm implementations
async function runMultiagentAlgorithm(
  initialState: GameState,
  algorithm: MultiagentAlgorithm,
  agentType: AgentType,
  speed: number,
  onUpdate: (state: GameState) => void
): Promise<GameState> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  let currentState = { ...initialState };
  let step = 0;
  let lastPacmanPos = { ...initialState.pacman };
  let lastLastPacmanPos = { ...initialState.pacman };
  let stuckCounter = 0;
  let recentPositions: {x: number, y: number}[] = [];
  
  const updateState = (newState: GameState) => {
    currentState = newState;
    onUpdate(currentState);
  };
  
  // Run the game loop
  const maxSteps = 1000; // Prevent infinite games
  while (!currentState.gameOver && !currentState.won && step < maxSteps) {
    step++;
    
    // Check for back-and-forth movement
    const isBackAndForth = (
      currentState.pacman.x === lastLastPacmanPos.x && 
      currentState.pacman.y === lastLastPacmanPos.y &&
      step > 2
    );
    
    if (isBackAndForth) {
      stuckCounter++;
      console.log(`Back-and-forth detected! Counter: ${stuckCounter}`);
    } else {
      stuckCounter = Math.max(0, stuckCounter - 1);
    }
    
    // Get Pacman's action based on the selected algorithm
    let pacmanAction = await getPacmanAction(currentState, algorithm, agentType, lastPacmanPos, recentPositions);
    
    // If stuck in back-and-forth, try to break the cycle
    if (stuckCounter > 3) {
      const possibleMoves = getPossibleMoves(currentState.pacman, currentState);
      const lastMove = {
        x: lastPacmanPos.x - currentState.pacman.x,
        y: lastPacmanPos.y - currentState.pacman.y
      };
      
      // Filter out the move that would go back to the previous position
      const nonBacktrackMoves = possibleMoves.filter(move => 
        !(move.x === lastPacmanPos.x && move.y === lastPacmanPos.y)
      );
      
      if (nonBacktrackMoves.length > 0) {
        // Randomly select from non-backtrack moves
        const randMove = nonBacktrackMoves[Math.floor(Math.random() * nonBacktrackMoves.length)];
        pacmanAction = randMove.action;
        console.log('Breaking back-and-forth cycle with random move');
        stuckCounter = 0; // Reset counter
      }
    }
    
    // Move Pacman
    const newPacmanPos = movePacman(currentState.pacman, pacmanAction, currentState);
    
    // Check for food consumption
    let newFood = [...currentState.food];
    let newScore = currentState.score - 1; // Movement cost: -1 point per move
    let newCapsules = [...currentState.capsules];
    
    const foodIndex = newFood.findIndex(f => f.x === newPacmanPos.x && f.y === newPacmanPos.y);
    if (foodIndex !== -1) {
      newFood.splice(foodIndex, 1);
      newScore += 10;
    }
    
    // Check for capsule consumption
    const capsuleIndex = newCapsules.findIndex(c => c.x === newPacmanPos.x && c.y === newPacmanPos.y);
    if (capsuleIndex !== -1) {
      newCapsules.splice(capsuleIndex, 1);
      newScore += 200; // Increased from 50 to 200 points for power pellets
    }
    
    // Update ghost scared timers and make ghosts scared if capsule was eaten
    let newGhosts = currentState.ghosts.map(ghost => {
      const wasScared = ghost.scared;
      const newScaredTime = Math.max(0, ghost.scaredTime - 1);
      
      return {
        ...ghost,
        scaredTime: capsuleIndex !== -1 ? 40 : newScaredTime, // If capsule eaten, set to 40, otherwise decrease
        scared: capsuleIndex !== -1 ? true : newScaredTime > 0 // If capsule eaten, make scared, otherwise check timer
      };
    });
    
    // Collision check immediately after Pacman moves (before ghosts move)
    let preMoveCollision = false;
    let preMoveEatenGhostIndex = -1;
    newGhosts.forEach((ghost, index) => {
      if (ghost.x === newPacmanPos.x && ghost.y === newPacmanPos.y) {
      if (ghost.scared) {
          preMoveEatenGhostIndex = index;
          newScore += 200;
        } else {
          preMoveCollision = true;
        }
      }
    });
    if (preMoveEatenGhostIndex !== -1) {
      newGhosts[preMoveEatenGhostIndex] = {
        ...newGhosts[preMoveEatenGhostIndex],
        x: -1,
        y: -1,
        scared: false,
        scaredTime: 0,
      };
    }
    if (preMoveCollision) {
      const newState: GameState = {
        ...currentState,
        pacman: newPacmanPos,
        ghosts: newGhosts,
        food: newFood,
        capsules: newCapsules,
        score: newScore,
        gameOver: true,
        won: false,
      };
      updateState(newState);
      // Prepare recent position tracking and then skip ghost movement
      lastLastPacmanPos = { ...lastPacmanPos };
      lastPacmanPos = { ...currentState.pacman };
      if (speed > 0) await sleep(speed);
      continue;
    }
    
    // Move ghosts (DirectionalGhost-like policy)
    const newGhostPositions = newGhosts.map(ghost => {
      const possibleMoves = getPossibleMoves(ghost, currentState);
      if (ghost.x < 0 || ghost.y < 0 || possibleMoves.length === 0) return ghost;
      const chosen = chooseDirectionalGhostMove(
        ghost,
        possibleMoves,
        newPacmanPos,
        ghost.scared,
        0.8,
        0.8
      );
      return { ...ghost, ...chosen };
    });
    
    // Check for collisions and ghost eating after ghosts move
    let ghostEaten = false;
    let collision = false;
    let eatenGhostIndex = -1;
    for (let index = 0; index < newGhostPositions.length; index++) {
      const ghost = newGhostPositions[index];
      if (ghost.x === newPacmanPos.x && ghost.y === newPacmanPos.y) {
        if (ghost.scared) {
          ghostEaten = true;
          eatenGhostIndex = index;
          newScore += 200; // Bonus for eating ghost
        } else {
          collision = true;
        }
      }
    }
    
    // Remove eaten ghost from the game
    if (ghostEaten && eatenGhostIndex !== -1) {
      newGhostPositions[eatenGhostIndex] = { 
        ...newGhostPositions[eatenGhostIndex], 
        x: -1, 
        y: -1,
        scared: false,
        scaredTime: 0
      };
      console.log(`Ghost ${eatenGhostIndex} was eaten! +200 points`);
    }
    
    // Check win/lose conditions
    const won = newFood.length === 0;
    const lost = collision || step >= maxSteps; // Also lose if we hit the step limit
    
    const newState: GameState = {
      ...currentState,
      pacman: newPacmanPos,
      ghosts: newGhostPositions,
      food: newFood,
      capsules: newCapsules,
      score: newScore,
      gameOver: won || lost,
      won: won
    };
    
    updateState(newState);
    
    // Update position tracking for back-and-forth detection
    lastLastPacmanPos = { ...lastPacmanPos };
    lastPacmanPos = { ...currentState.pacman };
    
    // Track recent positions (keep last 5 positions)
    recentPositions.unshift({ ...currentState.pacman });
    if (recentPositions.length > 5) {
      recentPositions.pop();
    }
    
    if (speed > 0) await sleep(speed);
  }
  
  return currentState;
}

// Get Pacman's action based on algorithm
async function getPacmanAction(
  state: GameState, 
  algorithm: MultiagentAlgorithm, 
  agentType: AgentType,
  lastPacmanPos?: { x: number; y: number },
  recentPositions: { x: number; y: number }[] = []
): Promise<string> {
  const possibleActions = getPossibleMoves(state.pacman, state);
  
  if (possibleActions.length === 0) return 'Stop';
  
  if (algorithm === 'reflex') {
    return reflexAgent(state, possibleActions, recentPositions, lastPacmanPos);
  } else if (algorithm === 'minimax') {
    return minimaxAgent(state, possibleActions, 2, lastPacmanPos, recentPositions);
  } else if (algorithm === 'alphabeta') {
    return alphaBetaAgent(state, possibleActions, 2, lastPacmanPos, recentPositions);
  } else if (algorithm === 'expectimax') {
    return expectimaxAgent(state, possibleActions, 2, lastPacmanPos, recentPositions);
  }
  
  return possibleActions[0]?.action || 'Stop';
}

// Reflex Agent implementation
function reflexAgent(
  state: GameState,
  actions: any[],
  recentPositions: { x: number; y: number }[] = [],
  lastPacmanPos?: { x: number; y: number }
): string {
  if (actions.length === 0) return 'Stop';
  
  let bestActions: any[] = [];
  let bestScore = -Infinity;
  
  for (const action of actions) {
    const score = evaluateReflexAction(state, action, recentPositions);
    if (score > bestScore) {
      bestScore = score;
      bestActions = [action];
    } else if (Math.abs(score - bestScore) < 0.01) {
      // If scores are very close, consider this action too
      bestActions.push(action);
    }
  }
  
  // Prefer not to backtrack to the last position if alternatives exist
  let candidateActions = bestActions;
  if (lastPacmanPos) {
    const nonBacktrack = bestActions.filter(a => !(a.x === lastPacmanPos.x && a.y === lastPacmanPos.y));
    if (nonBacktrack.length > 0) candidateActions = nonBacktrack;
  }
  // If multiple actions have similar scores, randomly choose one to break ties
  const selectedAction = candidateActions[Math.floor(Math.random() * candidateActions.length)];
  return selectedAction.action;
}

// Minimax Agent implementation
function minimaxAgent(
  state: GameState,
  actions: any[],
  maxDepth: number,
  lastPacmanPos?: { x: number; y: number },
  recentPositions: { x: number; y: number }[] = []
): string {
  if (actions.length === 0) return 'Stop';
  
  let bestAction = actions[0];
  let bestValue = -Infinity;
  
  for (const action of actions) {
    const successor = generateSuccessor(state, 0, action);
    const value = minimaxValue(successor, 1, 0, maxDepth);
    // Apply tiny penalty for immediate backtrack or recent revisits for tie-breaking
    const backtrackPenalty = lastPacmanPos && action.x === lastPacmanPos.x && action.y === lastPacmanPos.y ? 0.0001 : 0;
    const revisitPenalty = recentPositions.some(p => p.x === action.x && p.y === action.y) ? 0.00005 : 0;
    const adjusted = value - backtrackPenalty - revisitPenalty;
    if (adjusted > bestValue) {
      bestValue = value;
      bestAction = action;
    }
  }
  
  return bestAction.action;
}

// Alpha-Beta Agent implementation
function alphaBetaAgent(
  state: GameState,
  actions: any[],
  maxDepth: number,
  lastPacmanPos?: { x: number; y: number },
  recentPositions: { x: number; y: number }[] = []
): string {
  if (actions.length === 0) return 'Stop';
  
  let bestAction = actions[0];
  let bestValue = -Infinity;
  let alpha = -Infinity;
  let beta = Infinity;
  
  for (const action of actions) {
    const successor = generateSuccessor(state, 0, action);
    const value = alphaBetaValue(successor, 1, 0, maxDepth, alpha, beta);
    const backtrackPenalty = lastPacmanPos && action.x === lastPacmanPos.x && action.y === lastPacmanPos.y ? 0.0001 : 0;
    const revisitPenalty = recentPositions.some(p => p.x === action.x && p.y === action.y) ? 0.00005 : 0;
    const adjusted = value - backtrackPenalty - revisitPenalty;
    if (adjusted > bestValue) {
      bestValue = value;
      bestAction = action;
    }
    alpha = Math.max(alpha, bestValue);
  }
  
  return bestAction.action;
}

// Expectimax Agent implementation
function expectimaxAgent(
  state: GameState,
  actions: any[],
  maxDepth: number,
  lastPacmanPos?: { x: number; y: number },
  recentPositions: { x: number; y: number }[] = []
): string {
  if (actions.length === 0) return 'Stop';
  
  let bestAction = actions[0];
  let bestValue = -Infinity;
  
  for (const action of actions) {
    const successor = generateSuccessor(state, 0, action);
    const value = expectimaxValue(successor, 1, 0, maxDepth);
    const backtrackPenalty = lastPacmanPos && action.x === lastPacmanPos.x && action.y === lastPacmanPos.y ? 0.0001 : 0;
    const revisitPenalty = recentPositions.some(p => p.x === action.x && p.y === action.y) ? 0.00005 : 0;
    const adjusted = value - backtrackPenalty - revisitPenalty;
    if (adjusted > bestValue) {
      bestValue = value;
      bestAction = action;
    }
  }
  
  return bestAction.action;
}

// Shared heuristic weights to promote eating all pellets and maximizing score
let HEURISTIC_WEIGHTS = {
  scoreWeight: 1,
  foodLeftPenalty: 500,
  closestFoodWeight: 1200,
  capsuleLeftPenalty: 800,
  closestCapsuleWeight: 1500,
  scaredGhostWeight: 1200,
  ghostDangerPenalty: 2000,
  ghostDangerThreshold: 1,
  revisitPenalty: 50,
};

// Multi-agent helpers modeled after multiAgents.py
function getNumAgents(state: GameState): number {
  return 1 + (state.ghosts?.length || 0);
}

function getLegalActionsForAgent(state: GameState, agentIndex: number): any[] {
  if (agentIndex === 0) {
    return getPossibleMoves(state.pacman, state);
  }
  const ghost = state.ghosts[agentIndex - 1];
  if (!ghost || ghost.x < 0 || ghost.y < 0) return [];
  return getPossibleMoves(ghost, state);
}

function generateSuccessor(state: GameState, agentIndex: number, action: any): GameState {
  const next: GameState = {
    ...state,
    pacman: { ...state.pacman },
    ghosts: state.ghosts.map(g => ({ ...g })),
    food: state.food.map(f => ({ ...f })),
    capsules: state.capsules.map(c => ({ ...c })),
    score: state.score,
  } as GameState;

  if (agentIndex === 0) {
    // Pacman moves
    const newPac = { x: action.x, y: action.y };
    next.pacman = newPac;
    next.score = (next.score ?? 0) - 1; // movement cost

    // Eat food
    const fIdx = next.food.findIndex(f => f.x === newPac.x && f.y === newPac.y);
    if (fIdx !== -1) {
      next.food.splice(fIdx, 1);
      next.score += 10;
    }

    // Eat capsule -> scare ghosts for 40 moves
    const cIdx = next.capsules.findIndex(c => c.x === newPac.x && c.y === newPac.y);
    if (cIdx !== -1) {
      next.capsules.splice(cIdx, 1);
      next.score += 200;
      next.ghosts = next.ghosts.map(g => ({ ...g, scared: true, scaredTime: 40 }));
    } else {
      // decrement timers
      next.ghosts = next.ghosts.map(g => {
        const t = Math.max(0, (g.scaredTime ?? 0) - 1);
        return { ...g, scaredTime: t, scared: t > 0 };
      });
    }

    // Check collisions at Pacman's destination
    for (let i = 0; i < next.ghosts.length; i++) {
      const g = next.ghosts[i];
      if (g.x === newPac.x && g.y === newPac.y) {
        if (g.scared) {
          // eat ghost
          next.score += 200;
          next.ghosts[i] = { ...g, x: -1, y: -1, scared: false, scaredTime: 0 };
        } else {
          // lose
          next.gameOver = true;
          next.won = false;
          return next;
        }
      }
    }

    // Win condition
    if (next.food.length === 0) {
      next.gameOver = true;
      next.won = true;
    }

    return next;
  } else {
    // Ghost moves
    const gi = agentIndex - 1;
    const ghost = next.ghosts[gi];
    if (!ghost || ghost.x < 0 || ghost.y < 0) return next;

    const movedGhost = { ...ghost, x: action.x, y: action.y };
    next.ghosts[gi] = movedGhost;

    // Check collision after ghost moves
    if (movedGhost.x === next.pacman.x && movedGhost.y === next.pacman.y) {
      if (movedGhost.scared) {
        next.score += 200;
        next.ghosts[gi] = { ...movedGhost, x: -1, y: -1, scared: false, scaredTime: 0 };
      } else {
        next.gameOver = true;
        next.won = false;
      }
    }

    return next;
  }
}

function minimaxValue(state: GameState, agentIndex: number, depth: number, maxDepth: number): number {
  if (depth === maxDepth || state.gameOver) {
    return evaluateState(state);
  }
  const numAgents = getNumAgents(state);
  const actions = getLegalActionsForAgent(state, agentIndex);
  const nextAgent = (agentIndex + 1) % numAgents;
  const nextDepth = nextAgent === 0 ? depth + 1 : depth;

  if (actions.length === 0) {
    return minimaxValue(state, nextAgent, nextDepth, maxDepth);
  }

  if (agentIndex === 0) {
    let value = -Infinity;
    for (const a of actions) value = Math.max(value, minimaxValue(generateSuccessor(state, agentIndex, a), nextAgent, nextDepth, maxDepth));
    return value;
  } else {
    let value = Infinity;
    for (const a of actions) value = Math.min(value, minimaxValue(generateSuccessor(state, agentIndex, a), nextAgent, nextDepth, maxDepth));
    return value;
  }
}

function alphaBetaValue(state: GameState, agentIndex: number, depth: number, maxDepth: number, alpha: number, beta: number): number {
  if (depth === maxDepth || state.gameOver) {
    return evaluateState(state);
  }
  const numAgents = getNumAgents(state);
  const actions = getLegalActionsForAgent(state, agentIndex);
  const nextAgent = (agentIndex + 1) % numAgents;
  const nextDepth = nextAgent === 0 ? depth + 1 : depth;

  if (actions.length === 0) {
    return alphaBetaValue(state, nextAgent, nextDepth, maxDepth, alpha, beta);
  }

  if (agentIndex === 0) {
    let value = -Infinity;
    for (const a of actions) {
      value = Math.max(value, alphaBetaValue(generateSuccessor(state, agentIndex, a), nextAgent, nextDepth, maxDepth, alpha, beta));
      if (value > beta) return value;
      alpha = Math.max(alpha, value);
    }
    return value;
  } else {
    let value = Infinity;
    for (const a of actions) {
      value = Math.min(value, alphaBetaValue(generateSuccessor(state, agentIndex, a), nextAgent, nextDepth, maxDepth, alpha, beta));
      if (value < alpha) return value;
      beta = Math.min(beta, value);
    }
    return value;
  }
}

function expectimaxValue(state: GameState, agentIndex: number, depth: number, maxDepth: number): number {
  if (depth === maxDepth || state.gameOver) {
    return evaluateState(state);
  }
  const numAgents = getNumAgents(state);
  const actions = getLegalActionsForAgent(state, agentIndex);
  const nextAgent = (agentIndex + 1) % numAgents;
  const nextDepth = nextAgent === 0 ? depth + 1 : depth;

  if (actions.length === 0) {
    return expectimaxValue(state, nextAgent, nextDepth, maxDepth);
  }

  if (agentIndex === 0) {
    let value = -Infinity;
    for (const a of actions) value = Math.max(value, expectimaxValue(generateSuccessor(state, agentIndex, a), nextAgent, nextDepth, maxDepth));
    return value;
  } else {
    let total = 0;
    for (const a of actions) total += expectimaxValue(generateSuccessor(state, agentIndex, a), nextAgent, nextDepth, maxDepth);
    return total / actions.length;
  }
}

function chooseDirectionalGhostMove(
  ghost: any,
  legalMoves: any[],
  pacmanPos: { x: number; y: number },
  isScared: boolean,
  probAttack = 0.8,
  probScaredFlee = 0.8
) {
  if (legalMoves.length === 0) return ghost;
  const distances = legalMoves.map(m => Math.abs(m.x - pacmanPos.x) + Math.abs(m.y - pacmanPos.y));
  const targetScore = isScared ? Math.max(...distances) : Math.min(...distances);
  const bestMoves = legalMoves.filter((m, i) => distances[i] === targetScore);
  const bestProb = isScared ? probScaredFlee : probAttack;

  // Build distribution
  const n = legalMoves.length;
  const dist = legalMoves.map(() => (1 - bestProb) / n);
  for (let i = 0; i < legalMoves.length; i++) {
    if (bestMoves.includes(legalMoves[i])) dist[i] += bestProb / bestMoves.length;
  }
  // Sample
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < dist.length; i++) {
    acc += dist[i];
    if (r <= acc) return legalMoves[i];
  }
  return legalMoves[legalMoves.length - 1];
}

// Helper functions
function getPossibleMoves(position: {x: number, y: number}, state: GameState) {
  const moves = [
    { x: position.x, y: position.y - 1, action: 'North' },
    { x: position.x + 1, y: position.y, action: 'East' },
    { x: position.x, y: position.y + 1, action: 'South' },
    { x: position.x - 1, y: position.y, action: 'West' }
  ];
  
  return moves.filter(move => 
    move.x >= 0 && move.x < state.width &&
    move.y >= 0 && move.y < state.height &&
    !state.walls.some(wall => wall.x === move.x && wall.y === move.y)
  );
}

function movePacman(pacman: {x: number, y: number}, action: string, state: GameState) {
  const moves = {
    'North': { x: pacman.x, y: pacman.y - 1 },
    'South': { x: pacman.x, y: pacman.y + 1 },
    'East': { x: pacman.x + 1, y: pacman.y },
    'West': { x: pacman.x - 1, y: pacman.y },
    'Stop': { x: pacman.x, y: pacman.y }
  };
  
  return moves[action as keyof typeof moves] || pacman;
}

function evaluateReflexAction(
  state: GameState,
  action: any,
  recentPositions: { x: number; y: number }[] = []
): number {
  // Discourage Stop
  if (action.action === 'Stop') return -Infinity;

  const successor = simulateAction(state, action);
  if (successor.food.length === 0) return Infinity;

  const weights = HEURISTIC_WEIGHTS;
  const newPos = successor.pacman;

  // Score
  let value = (successor.score ?? 0) * weights.scoreWeight;

  // Remaining food penalty and proximity reward
  value -= successor.food.length * weights.foodLeftPenalty;
  if (successor.food.length > 0) {
    const foodDistances = successor.food.map(food =>
    Math.abs(newPos.x - food.x) + Math.abs(newPos.y - food.y)
  );
    const closestFood = Math.max(1, Math.min(...foodDistances));
    value += (weights.closestFoodWeight / closestFood);
  }

  // Capsules
  value -= successor.capsules.length * weights.capsuleLeftPenalty;
  if (successor.capsules.length > 0) {
    const capsuleDistances = successor.capsules.map(c =>
      Math.abs(newPos.x - c.x) + Math.abs(newPos.y - c.y)
    );
    const closestCapsule = Math.max(1, Math.min(...capsuleDistances));
    value += (weights.closestCapsuleWeight / closestCapsule);
  }

  // Scared ghosts (chase)
  const scaredGhosts = successor.ghosts.filter(g => g.scared && g.x >= 0 && g.y >= 0);
  if (scaredGhosts.length > 0) {
    const dists = scaredGhosts.map(g => Math.abs(newPos.x - g.x) + Math.abs(newPos.y - g.y));
    const closest = Math.max(1, Math.min(...dists));
    value += (weights.scaredGhostWeight / closest);
  }

  // Unscared ghosts (avoid)
  const unscaredGhosts = successor.ghosts.filter(g => !g.scared && g.x >= 0 && g.y >= 0);
  if (unscaredGhosts.length > 0) {
    const dMin = Math.min(...unscaredGhosts.map(g => Math.abs(newPos.x - g.x) + Math.abs(newPos.y - g.y)));
    if (dMin <= weights.ghostDangerThreshold) {
      value -= weights.ghostDangerPenalty;
    }
  }

  // Small penalty for revisiting very recent positions (discourage cycles)
  const revisitCount = recentPositions.filter(p => p.x === newPos.x && p.y === newPos.y).length;
  value -= revisitCount * (HEURISTIC_WEIGHTS.revisitPenalty * 0.1);

  return value;
}

function minimax(state: GameState, depth: number, isMaximizing: boolean): number {
  if (depth === 0 || state.gameOver) {
    return evaluateState(state);
  }
  
  if (isMaximizing) {
    // Pacman's turn
    const actions = getPossibleMoves(state.pacman, state);
    let maxScore = -Infinity;
    
    for (const action of actions) {
      const newState = simulateAction(state, action);
      const score = minimax(newState, depth - 1, false);
      maxScore = Math.max(maxScore, score);
    }
    
    return maxScore;
  } else {
    // Ghosts' turn
    let minScore = Infinity;
    
    for (const ghost of state.ghosts) {
      const actions = getPossibleMoves(ghost, state);
      for (const action of actions) {
        const newState = simulateGhostAction(state, ghost, action);
        const score = minimax(newState, depth - 1, true);
        minScore = Math.min(minScore, score);
      }
    }
    
    return minScore;
  }
}

function alphaBeta(state: GameState, depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
  if (depth === 0 || state.gameOver) {
    return evaluateState(state);
  }
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    const actions = getPossibleMoves(state.pacman, state);
    
    for (const action of actions) {
      const newState = simulateAction(state, action);
      const score = alphaBeta(newState, depth - 1, false, alpha, beta);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) break;
    }
    
    return maxScore;
  } else {
    let minScore = Infinity;
    
    for (const ghost of state.ghosts) {
      const actions = getPossibleMoves(ghost, state);
      for (const action of actions) {
        const newState = simulateGhostAction(state, ghost, action);
        const score = alphaBeta(newState, depth - 1, true, alpha, beta);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, minScore);
        if (beta <= alpha) break;
      }
    }
    
    return minScore;
  }
}

function expectimax(state: GameState, depth: number, isMaximizing: boolean): number {
  if (depth === 0 || state.gameOver) {
    return evaluateState(state);
  }
  
  if (isMaximizing) {
    // Pacman's turn
    const actions = getPossibleMoves(state.pacman, state);
    let maxScore = -Infinity;
    
    for (const action of actions) {
      const newState = simulateAction(state, action);
      const score = expectimax(newState, depth - 1, false);
      maxScore = Math.max(maxScore, score);
    }
    
    return maxScore;
  } else {
    // Ghosts' turn (expectation)
    let totalScore = 0;
    let actionCount = 0;
    
    for (const ghost of state.ghosts) {
      const actions = getPossibleMoves(ghost, state);
      for (const action of actions) {
        const newState = simulateGhostAction(state, ghost, action);
        const score = expectimax(newState, depth - 1, true);
        totalScore += score;
        actionCount++;
      }
    }
    
    return actionCount > 0 ? totalScore / actionCount : 0;
  }
}

function simulateAction(state: GameState, action: any): GameState {
  // Move Pacman
  const newPacmanPos = action;
  
  // Check for food consumption
  let newFood = [...state.food];
  let newScore = state.score - 1; // Movement cost
  let newCapsules = [...state.capsules];

  const foodIndex = newFood.findIndex(f => f.x === newPacmanPos.x && f.y === newPacmanPos.y);
  if (foodIndex !== -1) {
    newFood.splice(foodIndex, 1);
    newScore += 10;
  }

  // Check for capsule consumption
  const capsuleIndex = newCapsules.findIndex(c => c.x === newPacmanPos.x && c.y === newPacmanPos.y);
  if (capsuleIndex !== -1) {
    newCapsules.splice(capsuleIndex, 1);
    newScore += 200; // Increased from 50 to 200 points for power pellets
  }

  // Update ghost scared timers
  const newGhosts = state.ghosts.map(ghost => {
    const wasScared = ghost.scared;
    const newScaredTime = Math.max(0, ghost.scaredTime - 1);

    return {
      ...ghost,
      scaredTime: capsuleIndex !== -1 ? 40 : newScaredTime, // If capsule eaten, set to 40, otherwise decrease
      scared: capsuleIndex !== -1 ? true : newScaredTime > 0 // If capsule eaten, make scared, otherwise check timer
    };
  });

  // Check win/lose conditions
  const won = newFood.length === 0;
  const lost = false; // Don't check collisions in simulation

  return {
    ...state,
    pacman: newPacmanPos,
    food: newFood,
    capsules: newCapsules,
    ghosts: newGhosts,
    score: newScore,
    won,
    gameOver: won || lost
  };
}

function simulateGhostAction(state: GameState, ghost: any, action: any): GameState {
  const newGhosts = state.ghosts.map(g => 
    g === ghost ? { ...g, ...action } : g
  );
  
  return {
    ...state,
    ghosts: newGhosts
  };
}

function evaluateState(state: GameState, recentPositions: {x: number, y: number}[] = []): number {
  if (state.won) return Infinity; // ultimate goal achieved
  if (state.gameOver && !state.won) return -Infinity;

  const w = HEURISTIC_WEIGHTS;
  const pac = state.pacman;
  let value = (state.score ?? 0) * w.scoreWeight;

  // Strongly prefer fewer remaining pellets and capsules
  value -= state.food.length * w.foodLeftPenalty;
  value -= state.capsules.length * w.capsuleLeftPenalty;

  // Closest food
  if (state.food.length > 0) {
    const d = Math.max(1, Math.min(...state.food.map(f => Math.abs(pac.x - f.x) + Math.abs(pac.y - f.y))));
    value += w.closestFoodWeight / d;
  }

  // Closest capsule
  if (state.capsules.length > 0) {
    const d = Math.max(1, Math.min(...state.capsules.map(c => Math.abs(pac.x - c.x) + Math.abs(pac.y - c.y))));
    value += w.closestCapsuleWeight / d;
  }

  // Scared ghosts (chase)
  const scared = state.ghosts.filter(g => g.scared && g.x >= 0 && g.y >= 0);
  if (scared.length > 0) {
    const d = Math.max(1, Math.min(...scared.map(g => Math.abs(pac.x - g.x) + Math.abs(pac.y - g.y))));
    value += w.scaredGhostWeight / d;
  }

  // Unscared ghosts (avoid hard danger)
  const threats = state.ghosts.filter(g => !g.scared && g.x >= 0 && g.y >= 0);
  if (threats.length > 0) {
    const dMin = Math.min(...threats.map(g => Math.abs(pac.x - g.x) + Math.abs(pac.y - g.y)));
    if (dMin <= w.ghostDangerThreshold) value -= w.ghostDangerPenalty;
  }

  // Discourage revisiting very recent locations
  const revisits = recentPositions.filter(pos => pos.x === pac.x && pos.y === pac.y).length;
  value -= revisits * w.revisitPenalty;

  return value;
}
