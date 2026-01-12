"use client"

interface ConnectionLinesProps {
  centerPosition: { x: number; y: number }
  nodePositions: { x: number; y: number }[]
}

// Line rendering logic: SVG lines connect center image to each surrounding node
// Lines are drawn from the center point to each node's position
// Uses viewBox="0 0 100 100" for percentage-based positioning

export function ConnectionLines({ centerPosition, nodePositions }: ConnectionLinesProps) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Gradient for subtle line effect */}
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.15)" />
          <stop offset="100%" stopColor="rgba(239, 68, 68, 0.3)" />
        </linearGradient>
      </defs>

      {nodePositions.map((pos, index) => (
        <line
          key={index}
          x1={centerPosition.x}
          y1={centerPosition.y}
          x2={pos.x}
          y2={pos.y}
          stroke="url(#lineGradient)"
          strokeWidth="0.08"
          className="transition-all duration-700 ease-out"
        />
      ))}
    </svg>
  )
}
