"use client"

import { ReactNode, useMemo } from "react"
import { NetworkConnections } from "./network-connections"
import { NetworkNodes } from "./network-nodes"

interface NetworkContainerProps {
  dimensions: { width: number; height: number }
  nodePositions: { x: number; y: number }[]
  activeCategory: string | null
  selectedEventId: number | null
  nearestNodeId: number | null
  scale: number
  zoomTransition: boolean
  isDragging: boolean
  scaleNodePosition: (percentX: number, percentY: number) => { x: number; y: number }
  getPixelPos: (percentX: number, percentY: number) => { x: number; y: number }
  onNodeClick: (id: number) => void
}

export function NetworkContainer({
  dimensions,
  nodePositions,
  activeCategory,
  selectedEventId,
  nearestNodeId,
  scale,
  zoomTransition,
  isDragging,
  scaleNodePosition,
  getPixelPos,
  onNodeClick,
}: NetworkContainerProps) {
  const networkTransformStyle = useMemo(() => {
    const isZoomingActive = Math.abs(scale - 1) > 0.1 && !zoomTransition
    return {
      willChange: isDragging || zoomTransition || isZoomingActive ? 'transform' : 'auto',
      contain: 'layout style paint',
    }
  }, [scale, zoomTransition, isDragging])

  return (
    <div className="absolute inset-0" style={networkTransformStyle}>
      <NetworkConnections
        dimensions={dimensions}
        nodePositions={nodePositions}
        activeCategory={activeCategory}
        selectedEventId={selectedEventId}
        scaleNodePosition={scaleNodePosition}
        getPixelPos={getPixelPos}
        scale={scale}
      />

      <NetworkNodes
        nodePositions={nodePositions}
        scaleNodePosition={scaleNodePosition}
        nearestNodeId={nearestNodeId}
        scale={scale}
        onNodeClick={onNodeClick}
        onNodeHover={() => {}}
      />
    </div>
  )
}
