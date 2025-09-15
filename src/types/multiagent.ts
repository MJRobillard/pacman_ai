export type MultiagentAlgorithm = 'reflex' | 'minimax' | 'alphabeta' | 'expectimax';
export type AgentType = 'ReflexAgent' | 'MinimaxAgent' | 'AlphaBetaAgent' | 'ExpectimaxAgent';

export interface Position {
  x: number;
  y: number;
}

export interface Ghost {
  x: number;
  y: number;
  scared: boolean;
  scaredTime: number;
}

export interface GameState {
  pacman: Position;
  ghosts: Ghost[];
  food: Position[];
  capsules: Position[];
  score: number;
  walls: Position[];
  width: number;
  height: number;
  gameOver: boolean;
  won: boolean;
}

export interface MultiagentLayout {
  name: string;
  width: number;
  height: number;
  pacman: Position;
  ghosts: Position[];
  food: Position[];
  capsules: Position[];
  walls: Position[];
  layout: string[][];
}

export interface MultiagentControlsProps {
  selectedLayout: string;
  selectedAlgorithm: MultiagentAlgorithm;
  selectedAgent: AgentType;
  animationSpeed: number;
  isRunning: boolean;
  score: number;
  gameOver: boolean;
  gameWon: boolean;
  onLayoutChange: (layout: string) => void;
  onAlgorithmChange: (algorithm: MultiagentAlgorithm) => void;
  onAgentChange: (agent: AgentType) => void;
  onSpeedChange: (speed: number) => void;
  onRunGame: () => void;
  layoutOptions: string[];
  heuristics: HeuristicWeights;
  onHeuristicsChange: (weights: HeuristicWeights) => void;
}

export interface MultiagentGameProps {
  layout: MultiagentLayout;
  gameState: GameState | null;
  isRunning: boolean;
  algorithm: MultiagentAlgorithm;
}

export interface HeuristicWeights {
  scoreWeight: number;
  foodLeftPenalty: number;
  closestFoodWeight: number;
  capsuleLeftPenalty: number;
  closestCapsuleWeight: number;
  scaredGhostWeight: number;
  ghostDangerPenalty: number;
  ghostDangerThreshold: number;
  revisitPenalty: number;
}
