# Pacman AI Search Visualization

An interactive React application that visualizes different search algorithms used in AI, specifically implemented for Pacman maze navigation. This project demonstrates how various search strategies explore and find paths through mazes with beautiful color-coded visualizations.

## Features

- **Interactive Search Algorithms**: Visualize DFS, BFS, UCS, and A* search algorithms
- **Multiple Maze Layouts**: Choose from different maze complexities (Tiny, Medium, Big)
- **Real-time Animation**: Watch algorithms explore the maze step by step
- **Color-coded Visualization**: 
  - 🔵 Blue gradient: Explored nodes (brighter = explored earlier)
  - 🟡 Yellow: Final path found
  - 🟢 Green: Start position (P)
  - 🔴 Red: Goal position (G)
  - ⚫ Gray: Walls
- **Adjustable Speed**: Control animation speed from instant to slow
- **Performance Metrics**: See path length, nodes expanded, and search progress

## Search Algorithms Implemented

### 1. Depth-First Search (DFS)
- Uses a stack (LIFO) data structure
- Explores as far as possible along each branch before backtracking
- May not find the shortest path
- Good for memory efficiency

### 2. Breadth-First Search (BFS)
- Uses a queue (FIFO) data structure
- Explores all nodes at the present depth level before moving to the next level
- Guarantees finding the shortest path (in terms of number of steps)
- More memory intensive than DFS

### 3. Uniform Cost Search (UCS)
- Uses a priority queue ordered by path cost
- Finds the path with the lowest total cost
- Optimal for finding minimum cost paths
- More computationally expensive

### 4. A* Search
- Uses a priority queue ordered by f(n) = g(n) + h(n)
- g(n) = actual cost from start to current node
- h(n) = heuristic estimate from current node to goal
- Most efficient for finding optimal paths
- Uses Manhattan distance as heuristic

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd pacman_ai
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Select a Maze**: Choose from Tiny, Medium, or Big maze layouts
2. **Pick an Algorithm**: Select DFS, BFS, UCS, or A* search
3. **Adjust Speed**: Use the slider to control animation speed (0ms = instant, 500ms = slow)
4. **Run Search**: Click "Run Search" to start the visualization
5. **Watch the Magic**: Observe how different algorithms explore the maze differently

## Technical Implementation

### Architecture
- **React 19** with TypeScript for type safety
- **Next.js 15** for the framework
- **Tailwind CSS** for styling
- **Custom hooks** for state management

### Key Components
- `PacmanSearch`: Main visualization component that renders the maze
- `SearchControls`: Control panel for algorithm and maze selection
- `SearchState`: Type definitions for search state management

### Search Implementation
Each algorithm is implemented with proper data structures:
- **DFS**: Uses JavaScript array as stack
- **BFS**: Uses JavaScript array as queue
- **UCS**: Uses priority queue with cost-based ordering
- **A***: Uses priority queue with f(n) = g(n) + h(n) ordering

## Educational Value

This visualization helps understand:
- How different search strategies work
- Trade-offs between algorithms (memory vs. optimality)
- The importance of heuristics in A* search
- Graph traversal concepts
- Pathfinding in AI applications

## Maze Format

Mazes are represented as 2D character arrays where:
- `%` = Wall
- `.` = Food (goal)
- `P` = Pacman (start position)
- ` ` = Empty space

## Future Enhancements

- Additional maze layouts
- More complex search problems (corners, food collection)
- Ghost agents and dynamic obstacles
- Performance comparison charts
- Export functionality for search results

## Contributing

Feel free to contribute by:
- Adding new maze layouts
- Implementing additional search algorithms
- Improving the visualization
- Adding new features

## License

This project is for educational purposes and demonstrates AI search algorithms in an interactive format.

## Project Metadata

### Pacman AI Search Visualization

**Short Description**: An application to showcase advanced AI search algorithms through something many know and love: Pacman. Featuring Depth-First Search (DFS), Breadth-First Search (BFS), Uniform Cost Search (UCS), A* Search, and multi-agent strategies like Minimax, Alpha-Beta Pruning, and Expectimax.

**Technologies Used**:
- **Frontend**: React.js, Next.js
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Development Tools**: TypeScript, Node.js, npm
- **Algorithms**: DFS, BFS, UCS, A* Search, Reflex Agent, Minimax, Alpha-Beta Pruning, Expectimax
- **Visualization**: Custom real-time animations for maze exploration