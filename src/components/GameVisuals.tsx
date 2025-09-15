'use client';

import React from 'react';

// Ghost colors from the original Python implementation
const GHOST_COLORS = [
  '#E60000', // Red
  '#4D99E6', // Blue  
  '#FA6900', // Orange
  '#1ABFBF', // Green
  '#FF9900', // Yellow
  '#6600E6'  // Purple
];

const SCARED_COLOR = '#FFFFFF'; // White when scared
const PACMAN_COLOR = '#FFFF3D'; // Yellow

// Ghost shape coordinates (scaled for SVG)
const GHOST_SHAPE = [
  { x: 0, y: 0.3 },
  { x: 0.25, y: 0.75 },
  { x: 0.5, y: 0.3 },
  { x: 0.75, y: 0.75 },
  { x: 0.75, y: -0.5 },
  { x: 0.5, y: -0.75 },
  { x: -0.5, y: -0.75 },
  { x: -0.75, y: -0.5 },
  { x: -0.75, y: 0.75 },
  { x: -0.5, y: 0.3 },
  { x: -0.25, y: 0.75 }
];

interface PacmanProps {
  size?: number;
}

export const PacmanVisual: React.FC<PacmanProps> = ({ size = 24 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = Math.floor(size * 0.4);

  const mouthAngleDeg = 40; // total angle of the mouth opening
  const half = mouthAngleDeg / 2;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const startAngle = toRad(half);
  const endAngle = toRad(360 - half);

  const x1 = centerX + radius * Math.cos(startAngle);
  const y1 = centerY + radius * Math.sin(startAngle);
  const x2 = centerX + radius * Math.cos(endAngle);
  const y2 = centerY + radius * Math.sin(endAngle);

  // Build a single path for Pac-Man body (circle minus wedge)
  // Large-arc-flag = 1 to take the long way around (360 - mouthAngle)
  // Sweep flag = 1 for clockwise direction
  const bodyPath = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2} Z`;

  // Eye position
  const eyeR = Math.max(1, Math.floor(size * 0.04));
  const eyeX = centerX + radius * 0.15;
  const eyeY = centerY - radius * 0.35;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', height: '100%' }}
      shapeRendering="geometricPrecision"
    >
      <path
        d={bodyPath}
        fill={PACMAN_COLOR}
        stroke="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={eyeX} cy={eyeY} r={eyeR} fill="#000000" />
    </svg>
  );
};

interface GhostProps {
  size?: number;
  colorIndex?: number;
  isScared?: boolean;
}

export const GhostVisual: React.FC<GhostProps> = ({ size = 24, colorIndex = 0, isScared = false }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const scale = size * 0.6;
  
  const color = isScared ? SCARED_COLOR : GHOST_COLORS[colorIndex % GHOST_COLORS.length];
  
  // Convert ghost shape to SVG path
  const pathData = GHOST_SHAPE.map((point, index) => {
    const x = centerX + point.x * scale;
    const y = centerY + point.y * scale;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') + ' Z';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Ghost body */}
      <path
        d={pathData}
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
      {/* Scared ghost has different eyes */}
      {isScared ? (
        <>
          {/* Scared eyes - X shape */}
          <line
            x1={centerX - scale * 0.25}
            y1={centerY - scale * 0.25}
            x2={centerX - scale * 0.15}
            y2={centerY - scale * 0.15}
            stroke="black"
            strokeWidth="2"
          />
          <line
            x1={centerX - scale * 0.15}
            y1={centerY - scale * 0.25}
            x2={centerX - scale * 0.25}
            y2={centerY - scale * 0.15}
            stroke="black"
            strokeWidth="2"
          />
          <line
            x1={centerX + scale * 0.15}
            y1={centerY - scale * 0.25}
            x2={centerX + scale * 0.25}
            y2={centerY - scale * 0.15}
            stroke="black"
            strokeWidth="2"
          />
          <line
            x1={centerX + scale * 0.25}
            y1={centerY - scale * 0.25}
            x2={centerX + scale * 0.15}
            y2={centerY - scale * 0.15}
            stroke="black"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          {/* Normal eyes */}
          <circle
            cx={centerX - scale * 0.2}
            cy={centerY - scale * 0.2}
            r={scale * 0.15}
            fill="white"
          />
          <circle
            cx={centerX + scale * 0.2}
            cy={centerY - scale * 0.2}
            r={scale * 0.15}
            fill="white"
          />
          {/* Ghost pupils */}
          <circle
            cx={centerX - scale * 0.2}
            cy={centerY - scale * 0.2}
            r={scale * 0.06}
            fill="black"
          />
          <circle
            cx={centerX + scale * 0.2}
            cy={centerY - scale * 0.2}
            r={scale * 0.06}
            fill="black"
          />
        </>
      )}
    </svg>
  );
};

interface FoodProps {
  size?: number;
}

export const FoodVisual: React.FC<FoodProps> = ({ size = 24 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.03; // Slightly larger food pellet
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', height: '100%' }}
    >
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="0"
      />
    </svg>
  );
};

interface CapsuleProps {
  size?: number;
}

export const CapsuleVisual: React.FC<CapsuleProps> = ({ size = 24 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.08; // Slightly larger power pellet
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', height: '100%' }}
    >
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="0"
      />
    </svg>
  );
};

interface PathProps {
  size?: number;
  color?: string;
}

export const PathVisual: React.FC<PathProps> = ({ size = 24, color = '#FFFF00' }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.2;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', height: '100%' }}
    >
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill={color}
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
};

interface ExploredProps {
  size?: number;
  stepRatio?: number;
  baseColor?: string; // hex like #4D99E6
}

export const ExploredVisual: React.FC<ExploredProps> = ({ size = 24, stepRatio = 0.5, baseColor = '#4D99E6' }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const innerRadius = size * 0.12;
  const outerRadius = size * 0.38;
  
  // Color intensity based on when it was explored
  const intensity = Math.max(0.25, 1 - stepRatio);
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  };
  const base = hexToRgb(baseColor);
  const outerAlpha = 0.22 * intensity;
  const innerAlpha = 0.6 * intensity;
  const outerColor = `rgba(${base.r}, ${base.g}, ${base.b}, ${outerAlpha})`;
  const innerColor = `rgba(${base.r}, ${base.g}, ${base.b}, ${innerAlpha})`;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* soft outer glow */}
      <circle
        cx={centerX}
        cy={centerY}
        r={outerRadius}
        fill={outerColor}
        stroke="none"
      />
      {/* brighter inner core */}
      <circle
        cx={centerX}
        cy={centerY}
        r={innerRadius}
        fill={innerColor}
        stroke="none"
      />
    </svg>
  );
};

interface GoalProps {
  size?: number;
}

export const GoalVisual: React.FC<GoalProps> = ({ size = 24 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Outer ring */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke="#FF0000"
        strokeWidth="3"
      />
      {/* Inner circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius * 0.6}
        fill="#FF0000"
        stroke="#FF0000"
        strokeWidth="1"
      />
      {/* Star shape in center */}
      <polygon
        points={`${centerX},${centerY - radius * 0.4} ${centerX + radius * 0.15},${centerY - radius * 0.15} ${centerX + radius * 0.4},${centerY - radius * 0.15} ${centerX + radius * 0.2},${centerY + radius * 0.1} ${centerX + radius * 0.3},${centerY + radius * 0.3} ${centerX},${centerY + radius * 0.2} ${centerX - radius * 0.3},${centerY + radius * 0.3} ${centerX - radius * 0.2},${centerY + radius * 0.1} ${centerX - radius * 0.4},${centerY - radius * 0.15} ${centerX - radius * 0.15},${centerY - radius * 0.15}`}
        fill="white"
        stroke="white"
        strokeWidth="1"
      />
    </svg>
  );
};
