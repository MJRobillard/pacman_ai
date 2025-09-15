import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const layoutsDir = path.join(process.cwd(), 'public', 'layouts');
    const files = fs.readdirSync(layoutsDir).filter(file => file.endsWith('.lay'));
    
    const layouts = files.map(filename => ({
      filename,
      name: filename.replace('.lay', '').replace(/([A-Z])/g, ' $1').trim(),
      type: getLayoutType(filename)
    }));
    
    return NextResponse.json(layouts);
  } catch (error) {
    console.error('Error reading layouts directory:', error);
    return NextResponse.json({ error: 'Failed to read layouts' }, { status: 500 });
  }
}

function getLayoutType(filename: string): string {
  if (filename.includes('Search')) return 'search';
  if (filename.includes('Corners')) return 'corners';
  if (filename.includes('Classic')) return 'classic';
  return 'maze';
}
