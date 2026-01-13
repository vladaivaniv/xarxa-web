"use client"

import { memo, useMemo, useCallback } from "react"
import { eventsById, generateConnectionsByCategory } from "@/lib/network-data"
import { getThemeColor } from "@/lib/theme-colors"

interface NetworkConnectionsProps {
  dimensions: { width: number; height: number }
  nodePositions: { x: number; y: number }[]
  activeCategory: string | null
  selectedEventId: number | null
  scaleNodePosition: (percentX: number, percentY: number) => { x: number; y: number }
  getPixelPos: (percentX: number, percentY: number) => { x: number; y: number }
  scale: number
}

export const NetworkConnections = memo(function NetworkConnections({
  dimensions,
  nodePositions,
  activeCategory,
  selectedEventId,
  scaleNodePosition,
  getPixelPos,
  scale,
}: NetworkConnectionsProps) {
  const redConnections = useMemo(() => generateConnectionsByCategory(), [])

  const shouldLineBeRed = useCallback(
    (fromId: number, toId: number, category: string): boolean => {
      if (activeCategory === category) {
        return true
      }

      if (selectedEventId !== null) {
        const selectedData = eventsById.get(selectedEventId)
        if (selectedData && selectedData.event.category === category) {
          return fromId === selectedEventId || toId === selectedEventId
        }
      }

      return false
    },
    [activeCategory, selectedEventId],
  )

  if (dimensions.width === 0) return null

  // El SVG debe cubrir todo el espacio, no solo el viewport visible
  // Usar un viewBox que cubra todo el rango posible de posiciones
  // Considerando que los nodos pueden estar entre 0-100% en ambas dimensiones
  const svgWidth = dimensions.width
  const svgHeight = dimensions.height

  // Solo renderizar conexiones visibles o relevantes cuando el zoom es bajo
  const visibleConnections = useMemo(() => {
    if (scale > 0.7) {
      // En zoom bajo, mostrar solo conexiones activas o de categoría seleccionada
      if (activeCategory || selectedEventId) {
        return redConnections.filter(([from, to]) => {
          const fromData = eventsById.get(from)
          const toData = eventsById.get(to)
          if (!fromData || !toData) return false
          
          if (activeCategory) {
            return fromData.event.category === activeCategory || toData.event.category === activeCategory
          }
          
          if (selectedEventId) {
            return from === selectedEventId || to === selectedEventId
          }
          
          return false
        })
      }
      // Si no hay filtro activo y zoom bajo, mostrar menos conexiones
      return redConnections.slice(0, Math.floor(redConnections.length * 0.3))
    }
    // En zoom alto, mostrar todas las conexiones
    return redConnections
  }, [redConnections, activeCategory, selectedEventId, scale])

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none" 
      style={{ 
        zIndex: 1,
        overflow: 'visible',
        willChange: 'transform'
      }}
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {visibleConnections.map(([from, to], i) => {
        const fromData = eventsById.get(from)
        const toData = eventsById.get(to)
        if (!fromData || !toData) return null

        const fromEvent = fromData.event
        const toEvent = toData.event

        if (fromEvent.category !== toEvent.category) return null

        const category = fromEvent.category

        const fromScaled = scaleNodePosition(nodePositions[fromData.idx].x, nodePositions[fromData.idx].y)
        const toScaled = scaleNodePosition(nodePositions[toData.idx].x, nodePositions[toData.idx].y)
        const fromPos = getPixelPos(fromScaled.x, fromScaled.y)
        const toPos = getPixelPos(toScaled.x, toScaled.y)
        
        // Asegurar que las líneas se dibujen incluso si las posiciones están fuera del viewport
        // Las líneas deben ser visibles siempre que ambos nodos existan

        const isRed = shouldLineBeRed(from, to, category)
        const lineColor = isRed ? getThemeColor(category) : "#9ca3af"
        const lineOpacity = isRed ? "0.9" : "0.5"
        const strokeWidth = isRed ? "2.5" : "1.2"

        return (
          <line
            key={`connection-${i}`}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            opacity={lineOpacity}
            strokeLinecap="round"
            filter={isRed ? "url(#glow)" : undefined}
            className="transition-all duration-300"
          />
        )
      })}
    </svg>
  )
})
