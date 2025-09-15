export type SearchAlgorithm = 'dfs' | 'bfs' | 'ucs' | 'astar';

export interface SearchState {
  visited: Array<{ x: number; y: number }>;
  path: Array<{ x: number; y: number }>;
  expanded: Array<{ x: number; y: number; step: number }>;
  totalSteps: number;
  pathLength: number;
}

export type MultiSearchState = Partial<Record<SearchAlgorithm, SearchState>>;
export type AlgorithmColorMap = Record<SearchAlgorithm, string>;

export interface SearchControlsProps {
  selectedMaze: string;
  selectedAlgorithm: SearchAlgorithm;
  animationSpeed: number;
  isRunning: boolean;
  runAll: boolean;
  onMazeChange: (maze: string) => void;
  onAlgorithmChange: (algorithm: SearchAlgorithm) => void;
  onSpeedChange: (speed: number) => void;
  onRunSearch: () => void;
  onRunAllChange: (runAll: boolean) => void;
  mazeOptions: string[];
}

export interface PacmanSearchProps {
  maze: any; // Will be ParsedLayout
  searchState: SearchState | null;
  isRunning: boolean;
  multiSearchState?: MultiSearchState | null;
}
