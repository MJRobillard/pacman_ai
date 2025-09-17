'use client';

import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import MultiagentGame from '../../components/MultiagentGame';
import { GameState, MultiagentAlgorithm, AgentType } from '../../types/multiagent';

// Utilities for standalone playback
interface GameStateCallback {
  (state: GameState): void;
}

async function runMultiagentAlgorithm(
  initialState: GameState,
  algorithm: MultiagentAlgorithm,
  agentType: AgentType,
  speed: number,
  onUpdate: GameStateCallback
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

  const maxSteps = 1000;
  while (!currentState.gameOver && !currentState.won && step < maxSteps) {
    step++;

    const isBackAndForth = (
      currentState.pacman.x === lastLastPacmanPos.x &&
      currentState.pacman.y === lastLastPacmanPos.y &&
      step > 2
    );

    if (isBackAndForth) {
      stuckCounter++;
    } else {
      stuckCounter = Math.max(0, stuckCounter - 1);
    }

    let pacmanAction = await getPacmanAction(currentState, algorithm, agentType, lastPacmanPos, recentPositions);

    if (stuckCounter > 2) {
      const possibleMoves = getPossibleMoves(currentState.pacman, currentState);
      const nonBacktrackMoves = possibleMoves.filter(move => !(move.x === lastPacmanPos.x && move.y === lastPacmanPos.y));
      if (nonBacktrackMoves.length > 0) {
        const randMove = nonBacktrackMoves[Math.floor(Math.random() * nonBacktrackMoves.length)];
        pacmanAction = randMove.action;
        stuckCounter = 0;
      }
    }

    const newPacmanPos = movePacman(currentState.pacman, pacmanAction, currentState);

    let newFood = [...currentState.food];
    let newScore = currentState.score - 1;
    let newCapsules = [...currentState.capsules];

    const foodIndex = newFood.findIndex(f => f.x === newPacmanPos.x && f.y === newPacmanPos.y);
    if (foodIndex !== -1) {
      newFood.splice(foodIndex, 1);
      newScore += 10;
    }

    const capsuleIndex = newCapsules.findIndex(c => c.x === newPacmanPos.x && c.y === newPacmanPos.y);
    if (capsuleIndex !== -1) {
      newCapsules.splice(cycleIndexSafe(capsuleIndex, newCapsules.length), 1);
      newScore += 200;
    }

    let newGhosts = currentState.ghosts.map(ghost => {
      const newScaredTime = Math.max(0, ghost.scaredTime - 1);
      return { ...ghost, scaredTime: capsuleIndex !== -1 ? 40 : newScaredTime, scared: capsuleIndex !== -1 ? true : newScaredTime > 0 };
    });

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
      newGhosts[preMoveEatenGhostIndex] = { ...newGhosts[preMoveEatenGhostIndex], x: -1, y: -1, scared: false, scaredTime: 0 };
    }
    if (preMoveCollision) {
      const newState: GameState = { ...currentState, pacman: newPacmanPos, ghosts: newGhosts, food: newFood, capsules: newCapsules, score: newScore, gameOver: true, won: false };
      updateState(newState);
      if (speed > 0) await sleep(speed);
      break;
    }

    const newGhostPositions = newGhosts.map(ghost => {
      const possibleMoves = getPossibleMoves(ghost, currentState);
      if (ghost.x < 0 || ghost.y < 0 || possibleMoves.length === 0) return ghost;
      const chosen = chooseDirectionalGhostMove(ghost, possibleMoves, newPacmanPos, ghost.scared, 0.8, 0.8);
      return { ...ghost, ...chosen };
    });

    let ghostEaten = false;
    let collision = false;
    let eatenGhostIndex = -1;
    for (let index = 0; index < newGhostPositions.length; index++) {
      const ghost = newGhostPositions[index];
      if (ghost.x === newPacmanPos.x && ghost.y === newPacmanPos.y) {
        if (ghost.scared) {
          ghostEaten = true;
          eatenGhostIndex = index;
          newScore += 200;
        } else {
          collision = true;
        }
      }
    }
    if (ghostEaten && eatenGhostIndex !== -1) {
      newGhostPositions[eatenGhostIndex] = { ...newGhostPositions[eatenGhostIndex], x: -1, y: -1, scared: false, scaredTime: 0 };
    }

    const won = newFood.length === 0;
    const lost = collision || step >= maxSteps;

    const newState: GameState = { ...currentState, pacman: newPacmanPos, ghosts: newGhostPositions, food: newFood, capsules: newCapsules, score: newScore, gameOver: won || lost, won };
    updateState(newState);

    lastLastPacmanPos = { ...lastPacmanPos };
    lastPacmanPos = { ...currentState.pacman };
    recentPositions.unshift({ ...currentState.pacman });
    if (recentPositions.length > 5) recentPositions.pop();

    if (speed > 0) await sleep(speed);
  }

  return currentState;
}

function cycleIndexSafe(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

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
  }
  return possibleActions[0]?.action || 'Stop';
}

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
      bestActions.push(action);
    }
  }
  let candidateActions = bestActions;
  if (lastPacmanPos) {
    const nonBacktrack = bestActions.filter(a => !(a.x === lastPacmanPos.x && a.y === lastPacmanPos.y));
    if (nonBacktrack.length > 0) candidateActions = nonBacktrack;
  }
  const selected = candidateActions[Math.floor(Math.random() * candidateActions.length)] || actions[0];
  return selected.action;
}

function simulateAction(state: GameState, action: any): GameState {
  const newPacmanPos = action;
  let newFood = [...state.food];
  let newScore = (state.score ?? 0) - 1;
  let newCapsules = [...state.capsules];
  const foodIndex = newFood.findIndex(f => f.x === newPacmanPos.x && f.y === newPacmanPos.y);
  if (foodIndex !== -1) {
    newFood.splice(foodIndex, 1);
    newScore += 10;
  }
  const capsuleIndex = newCapsules.findIndex(c => c.x === newPacmanPos.x && c.y === newPacmanPos.y);
  if (capsuleIndex !== -1) {
    newCapsules.splice(capsuleIndex, 1);
    newScore += 200;
  }
  const newGhosts = state.ghosts.map(ghost => {
    const newScaredTime = Math.max(0, (ghost.scaredTime ?? 0) - 1);
    return { ...ghost, scaredTime: capsuleIndex !== -1 ? 40 : newScaredTime, scared: capsuleIndex !== -1 ? true : newScaredTime > 0 };
  });
  return { ...state, pacman: newPacmanPos, food: newFood, capsules: newCapsules, ghosts: newGhosts, score: newScore } as GameState;
}

function evaluateReflexAction(
  state: GameState,
  action: any,
  recentPositions: { x: number; y: number }[] = []
): number {
  if (action.action === 'Stop') return -Infinity;
  const successor = simulateAction(state, action);
  if (successor.food.length === 0) return Infinity;
  const newPos = successor.pacman;
  let value = (successor.score ?? 0);
  value -= successor.food.length * 5000;
  if (successor.food.length > 0) {
    const foodDistances = successor.food.map(f => Math.abs(newPos.x - f.x) + Math.abs(newPos.y - f.y));
    const closestFood = Math.max(1, Math.min(...foodDistances));
    value += 120 / closestFood;
  }
  value -= successor.capsules.length * 800;
  if (successor.capsules.length > 0) {
    const capsuleDistances = successor.capsules.map(c => Math.abs(newPos.x - c.x) + Math.abs(newPos.y - c.y));
    const closestCapsule = Math.max(1, Math.min(...capsuleDistances));
    value += 1500 / closestCapsule;
  }
  const scaredGhosts = successor.ghosts.filter(g => g.scared && g.x >= 0 && g.y >= 0);
  if (scaredGhosts.length > 0) {
    const dists = scaredGhosts.map(g => Math.abs(newPos.x - g.x) + Math.abs(newPos.y - g.y));
    const closest = Math.max(1, Math.min(...dists));
    value += 1200 / closest;
  }
  const unscaredGhosts = successor.ghosts.filter(g => !g.scared && g.x >= 0 && g.y >= 0);
  if (unscaredGhosts.length > 0) {
    const dMin = Math.min(...unscaredGhosts.map(g => Math.abs(newPos.x - g.x) + Math.abs(newPos.y - g.y)));
    if (dMin <= 2) {
      value -= 2000;
    }
  }
  const revisitCount = recentPositions.filter(p => p.x === newPos.x && p.y === newPos.y).length;
  value -= revisitCount * 5000;
  return value;
}

function getNumAgents(state: GameState): number {
  return 1 + (state.ghosts?.length || 0);
}

function getLegalActionsForAgent(state: GameState, agentIndex: number): any[] {
  if (agentIndex === 0) return getPossibleMoves(state.pacman, state);
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
    const newPac = { x: action.x, y: action.y };
    next.pacman = newPac;
    next.score = (next.score ?? 0) - 1;
    const fIdx = next.food.findIndex(f => f.x === newPac.x && f.y === newPac.y);
    if (fIdx !== -1) {
      next.food.splice(fIdx, 1);
      next.score += 10;
    }
    const cIdx = next.capsules.findIndex(c => c.x === newPac.x && c.y === newPac.y);
    if (cIdx !== -1) {
      next.capsules.splice(cIdx, 1);
      next.score += 200;
      next.ghosts = next.ghosts.map(g => ({ ...g, scared: true, scaredTime: 40 }));
    } else {
      next.ghosts = next.ghosts.map(g => {
        const t = Math.max(0, (g.scaredTime ?? 0) - 1);
        return { ...g, scaredTime: t, scared: t > 0 };
      });
    }
    for (let i = 0; i < next.ghosts.length; i++) {
      const g = next.ghosts[i];
      if (g.x === newPac.x && g.y === newPac.y) {
        if (g.scared) {
          next.score += 200;
          next.ghosts[i] = { ...g, x: -1, y: -1, scared: false, scaredTime: 0 };
        } else {
          next.gameOver = true;
          next.won = false;
          return next;
        }
      }
    }
    if (next.food.length === 0) {
      next.gameOver = true;
      next.won = true;
    }
    return next;
  } else {
    const gi = agentIndex - 1;
    const ghost = next.ghosts[gi];
    if (!ghost || ghost.x < 0 || ghost.y < 0) return next;
    const movedGhost = { ...ghost, x: action.x, y: action.y };
    next.ghosts[gi] = movedGhost;
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
  const n = legalMoves.length;
  const dist = legalMoves.map(() => (1 - bestProb) / n);
  for (let i = 0; i < legalMoves.length; i++) {
    if (bestMoves.includes(legalMoves[i])) dist[i] += bestProb / bestMoves.length;
  }
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < dist.length; i++) {
    acc += dist[i];
    if (r <= acc) return legalMoves[i];
  }
  return legalMoves[legalMoves.length - 1];
}

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
  } as const;
  return (moves as any)[action] || pacman;
}

function evaluateState(state: GameState): number {
  if (state.won) return Infinity;
  if (state.gameOver && !state.won) return -Infinity;
  const pac = state.pacman;
  let value = (state.score ?? 0);
  value -= state.food.length * 500;
  value -= state.capsules.length * 800;
  if (state.food.length > 0) {
    const d = Math.max(1, Math.min(...state.food.map(f => Math.abs(pac.x - f.x) + Math.abs(pac.y - f.y))));
    value += 1200 / d;
  }
  if (state.capsules.length > 0) {
    const d = Math.max(1, Math.min(...state.capsules.map(c => Math.abs(pac.x - c.x) + Math.abs(pac.y - c.y))));
    value += 1500 / d;
  }
  const scared = state.ghosts.filter(g => g.scared && g.x >= 0 && g.y >= 0);
  if (scared.length > 0) {
    const d = Math.max(1, Math.min(...scared.map(g => Math.abs(pac.x - g.x) + Math.abs(pac.y - g.y))));
    value += 1200 / d;
  }
  const threats = state.ghosts.filter(g => !g.scared && g.x >= 0 && g.y >= 0);
  if (threats.length > 0) {
    const dMin = Math.min(...threats.map(g => Math.abs(pac.x - g.x) + Math.abs(pac.y - g.y)));
    if (dMin <= 1) value -= 2000;
  }
  return value;
}

// Global variable for heuristic weights
let HEURISTIC_WEIGHTS: any = {};

export default function DemoPage() {
  const [layout, setLayout] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(150);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  
  // Constant zoom level - adjust this value to change the layout size
  const ZOOM_LEVEL = 18;

  // Load the mediumClassic layout on mount
  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/multiagent/layouts/mediumClassic`);
        if (response.ok) {
          const l = await response.json();
          setLayout(l);
        }
      } catch (e) {
        console.error('Failed to load mediumClassic:', e);
      }
    };
    load();
  }, []);

  // Start the game whenever layout is available or when a round increments
  useEffect(() => {
    if (!layout) return;
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, round]);

  const startNewGame = useCallback(async () => {
    if (!layout || isRunning) return;
    setIsRunning(true);
    setScore(0);

    const initialState: GameState = {
      pacman: { x: layout.pacman.x, y: layout.pacman.y },
      ghosts: layout.ghosts.map((g: any) => ({ ...g, scared: false, scaredTime: 0 })),
      food: layout.food,
      capsules: layout.capsules || [],
      score: 0,
      walls: layout.walls,
      width: layout.width,
      height: layout.height,
      gameOver: false,
      won: false,
    };

    setGameState(initialState);

    const result = await runMultiagentAlgorithm(
      initialState,
      'reflex',
      'ReflexAgent',
      animationSpeed,
      (newState) => {
        setGameState(newState);
        setScore(newState.score);
        if (newState.gameOver) {
          setIsRunning(false);
          // brief pause then restart next round
          setTimeout(() => setRound((r) => r + 1), 1000);
        }
      }
    );

    setGameState(result);
    setScore(result.score);
    setIsRunning(false);
    setTimeout(() => setRound((r) => r + 1), 1000);
  }, [layout, isRunning, animationSpeed]);

  return (
    <div className="min-h-screen text-white">


      {/* Demo Stats Header */}
      <div className="bg-black/40 backdrop-blur border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6 justify-end w-full">
          </div>
          <div className="flex items-center gap-3">
              <span className="text-caption font-semibold text-purple-200">Score</span>
              <span className="text-heading text-lg text-green-400 font-bold">{score}</span>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <nav className="mb-6">
          <h1 className="text-3xl font-bold text-yellow-400 glow-yellow">Pacman AI</h1>
        </nav>
        {/* Demo Info Header */}
        <div className="mb-6">
          <PageHeader
            title="Autoplay Demo (Medium Classic)"
            icon=""
            accentFrom="from-purple-300"
            accentVia="via-pink-300"
            accentTo="to-rose-400"
            right={null}
          />
<p style={{ marginTop: '0.75rem', fontSize: '1rem', fontWeight: '600', color: '#F3F4F6', fontStyle: 'italic', padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid rgba(55, 65, 81, 0.5)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', background: 'linear-gradient(to right, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8), rgba(0, 0, 0, 0.8))' }}>
  <span style={{ display: 'block', color: '#F87171' }}>Reflex Agents</span>
  <span style={{ display: 'block', marginLeft: '0.75rem', color: '#E5E7EB' }}>Your college roommate who only knows one move in Super Smash Bros.</span>

  <span style={{ display: 'block', marginTop: '0.75rem', color: '#4ADE80' }}>Expectimax Agents</span>
  <span style={{ display: 'block', marginLeft: '0.75rem', color: '#E5E7EB' }}>The wombo combo 3 steps ahead reigning champions, check out the multiagent page to see</span>
  <a href="/multiagent" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginLeft: '0.75rem', marginTop: '0.5rem', color: '#4ADE80', textDecoration: 'underline' }}>Visit Multiagent Page</a>
</p>
        </div>

        {/* Info strip */}

        {/* Main Game Area */}
        <div className="flex flex-col items-center w-auto mx-auto">
          {layout ? (
            <MultiagentGame
              layout={layout}
              gameState={gameState}
              isRunning={isRunning}
              algorithm={'reflex' as MultiagentAlgorithm}
              cellSize={ZOOM_LEVEL}
              verticalLegend={true}
            />
          ) : (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">Loading...</div>
              <div className="text-heading text-2xl text-gray-400 mb-2">Loading mediumClassic</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
