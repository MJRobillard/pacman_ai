export interface ParsedLayout {
  name: string;
  layout: string[];
  start: { x: number; y: number };
  goal: { x: number; y: number };
  width: number;
  height: number;
  type: 'maze' | 'search' | 'corners' | 'classic';
}

export function parseLayoutFile(content: string, filename: string): ParsedLayout {
  const lines = content.trim().split('\n').filter(line => line.length > 0);
  const height = lines.length;
  const width = lines[0].length;
  
  let start = { x: 0, y: 0 };
  let goal = { x: 0, y: 0 };
  let hasGoal = false;
  
  // Find Pacman (P) and goal (.)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (lines[y][x] === 'P') {
        start = { x, y };
      } else if (lines[y][x] === '.') {
        if (!hasGoal) {
          goal = { x, y };
          hasGoal = true;
        }
      }
    }
  }
  
  // If no explicit goal, find the first dot or use bottom-left corner
  if (!hasGoal) {
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        if (lines[y][x] === '.') {
          goal = { x, y };
          hasGoal = true;
          break;
        }
      }
      if (hasGoal) break;
    }
    
    // If still no goal, use bottom-left corner
    if (!hasGoal) {
      goal = { x: 1, y: height - 2 };
    }
  }
  
  // Determine layout type based on filename
  let type: 'maze' | 'search' | 'corners' | 'classic' = 'maze';
  if (filename.includes('Search')) type = 'search';
  else if (filename.includes('Corners')) type = 'corners';
  else if (filename.includes('Classic')) type = 'classic';
  
  return {
    name: filename.replace('.lay', '').replace(/([A-Z])/g, ' $1').trim(),
    layout: lines,
    start,
    goal,
    width,
    height,
    type
  };
}

export async function loadLayout(filename: string): Promise<ParsedLayout> {
  try {
    const response = await fetch(`/layouts/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load layout: ${filename}`);
    }
    const content = await response.text();
    return parseLayoutFile(content, filename);
  } catch (error) {
    console.error(`Error loading layout ${filename}:`, error);
    throw error;
  }
}

export async function loadAllLayouts(): Promise<ParsedLayout[]> {
  try {
    // Get list of available layouts from API
    const response = await fetch('/api/layouts');
    if (!response.ok) {
      throw new Error('Failed to fetch layout list');
    }
    
    const layoutFiles = await response.json();
    const layouts: ParsedLayout[] = [];
    
    for (const layoutFile of layoutFiles) {
      try {
        const layout = await loadLayout(layoutFile.filename);
        layouts.push(layout);
      } catch (error) {
        console.warn(`Could not load ${layoutFile.filename}:`, error);
      }
    }
    
    return layouts;
  } catch (error) {
    console.error('Error loading layouts:', error);
    
    // Fallback: return hardcoded list of known layouts
    const knownLayouts = [
      'tinyMaze.lay',
      'mediumMaze.lay', 
      'bigMaze.lay',
      'openMaze.lay',
      'tinySearch.lay',
      'mediumSearch.lay',
      'bigSearch.lay',
      'tinyCorners.lay',
      'mediumCorners.lay',
      'bigCorners.lay'
    ];
    
    const layouts: ParsedLayout[] = [];
    for (const filename of knownLayouts) {
      try {
        const layout = await loadLayout(filename);
        layouts.push(layout);
      } catch (error) {
        console.warn(`Could not load ${filename}:`, error);
      }
    }
    return layouts;
  }
}
