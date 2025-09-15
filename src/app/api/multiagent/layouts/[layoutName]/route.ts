import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ layoutName: string }> }
) {
  try {
    const { layoutName } = await params;
    const layoutPath = path.join(process.cwd(), 'public', 'multiagent-layouts', `${layoutName}.lay`);
    
    if (!fs.existsSync(layoutPath)) {
      return NextResponse.json({ error: 'Layout not found' }, { status: 404 });
    }
    
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    const lines = layoutContent.trim().split('\n');
    
    const height = lines.length;
    const width = lines[0].length;
    
    const pacman = { x: 0, y: 0 };
    const ghosts: Array<{ x: number; y: number }> = [];
    const food: Array<{ x: number; y: number }> = [];
    const capsules: Array<{ x: number; y: number }> = [];
    const walls: Array<{ x: number; y: number }> = [];
    const layout: string[][] = [];
    
    // Parse the layout
    for (let y = 0; y < lines.length; y++) {
      const line = lines[y];
      const row: string[] = [];
      
      for (let x = 0; x < line.length; x++) {
        const char = line[x];
        row.push(char);
        
        switch (char) {
          case 'P':
            pacman.x = x;
            pacman.y = y;
            break;
          case 'G':
            ghosts.push({ x, y });
            break;
          case '.':
            food.push({ x, y });
            break;
          case 'o':
            capsules.push({ x, y });
            break;
          case '%':
            walls.push({ x, y });
            break;
        }
      }
      
      layout.push(row);
    }
    
    const parsedLayout = {
      name: layoutName,
      width,
      height,
      pacman,
      ghosts,
      food,
      capsules,
      walls,
      layout
    };
    
    return NextResponse.json(parsedLayout);
  } catch (error) {
    console.error('Error parsing layout:', error);
    return NextResponse.json({ error: 'Failed to parse layout' }, { status: 500 });
  }
}
