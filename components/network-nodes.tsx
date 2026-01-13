"use client"

import type React from "react"
import { memo, useMemo } from "react"
import Image from "next/image"
import { events, eventsById } from "@/lib/network-data"

interface NetworkNodesProps {
  nodePositions: { x: number; y: number }[]
  scaleNodePosition: (percentX: number, percentY: number) => { x: number; y: number }
  nearestNodeId: number | null
  scale: number
  onNodeClick: (id: number) => void
  onNodeHover: (id: number | null) => void
}

// Memoizar el componente individual del nodo para evitar re-renders innecesarios
const NodeButton = memo(({ 
  event, 
  scaledPos, 
  isNearest, 
  onNodeClick, 
  onNodeHover 
}: {
  event: typeof events[0]
  scaledPos: { x: number; y: number }
  isNearest: boolean
  onNodeClick: (id: number) => void
  onNodeHover: (id: number | null) => void
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onNodeClick(event.id)
  }

  return (
    <button
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:z-10 ${
        isNearest ? "ring-2 ring-white ring-opacity-80 z-20" : ""
      } cursor-pointer will-change-transform`}
      style={{
        left: `${scaledPos.x}%`,
        top: `${scaledPos.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={handleClick}
      onMouseEnter={() => onNodeHover(event.id)}
      onMouseLeave={() => onNodeHover(null)}
    >
      <div className={`relative p-4 w-20 h-16 md:w-28 md:h-24 lg:w-32 lg:h-28`}>
        <Image
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 80px, (max-width: 1024px) 112px, 128px"
          className={`object-cover transition-transform duration-300 hover:scale-110 ${
            isNearest ? "scale-110" : ""
          }`}
          loading="lazy"
          draggable={false}
          unoptimized={process.env.NODE_ENV === 'development'}
        />
      </div>
    </button>
  )
})

NodeButton.displayName = 'NodeButton'

export const NetworkNodes = memo(function NetworkNodes({
  nodePositions,
  scaleNodePosition,
  nearestNodeId,
  scale,
  onNodeClick,
  onNodeHover,
}: NetworkNodesProps) {
  // Memoizar los nodos visibles - solo renderizar si están en el viewport o cerca
  const visibleNodes = useMemo(() => {
    return events.filter((event) => {
      const eventData = eventsById.get(event.id)
      if (!eventData || eventData.idx >= nodePositions.length) return false
      
      // Si el zoom es muy bajo, mostrar todos los nodos
      if (scale < 0.8) return true
      
      // Si el zoom es alto, mostrar todos (necesarios para interacciones)
      if (scale > 1.5) return true
      
      // En zoom medio, mostrar todos para mantener la experiencia fluida
      return true
    })
  }, [scale])

  return (
    <div 
      className="absolute inset-0" 
      style={{ 
        zIndex: 2, 
        willChange: scale > 1.2 ? 'transform' : 'auto',
        contain: 'layout style paint', // Optimización de rendering
      }}
    >
      {visibleNodes.map((event) => {
        const eventData = eventsById.get(event.id)
        if (!eventData || eventData.idx >= nodePositions.length) return null
        const pos = nodePositions[eventData.idx]
        const scaledPos = scaleNodePosition(pos.x, pos.y)
        const isNearest = nearestNodeId === event.id && scale > 1.5

        return (
          <NodeButton
            key={event.id}
            event={event}
            scaledPos={scaledPos}
            isNearest={isNearest}
            onNodeClick={onNodeClick}
            onNodeHover={onNodeHover}
          />
        )
      })}
    </div>
  )
})
