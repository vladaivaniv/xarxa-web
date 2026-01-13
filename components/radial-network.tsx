"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { TopNav } from "./top-nav"
import { CategoryFilters } from "./category-filters"
import { NetworkConnections } from "./network-connections"
import { NetworkNodes } from "./network-nodes"
import { useNetworkInteractions } from "@/hooks/use-network-interactions"
import { events, initialNodePositions, eventsById } from "@/lib/network-data"

export function RadialNetwork() {
  // Helper para verificar si localStorage está disponible y accesible
  const isLocalStorageAvailable = (): boolean => {
    try {
      if (typeof window === 'undefined') return false
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  const [nodePositions, setNodePositions] = useState<typeof initialNodePositions>(initialNodePositions)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomingFromId, setZoomingFromId] = useState<number | null>(null)
  const [zoomingFromPos, setZoomingFromPos] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(0.6)
  const [nearestNodeId, setNearestNodeId] = useState<number | null>(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [zoomTransition, setZoomTransition] = useState(false)


  const filteredEvents = useMemo(() => {
    if (!activeCategory) return events
    return events.filter((e) => e.category === activeCategory)
  }, [activeCategory])

  // Cargar posiciones desde localStorage al montar el componente
  useEffect(() => {
    if (!isLocalStorageAvailable()) return

    try {
      const saved = localStorage.getItem('nodePositions')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === initialNodePositions.length) {
          setNodePositions(parsed)
        }
      }
    } catch (e) {
      console.error('Error loading node positions:', e)
    }
  }, [])

  // Guardar posiciones en localStorage cuando cambien (con debounce para mejor rendimiento)
  useEffect(() => {
    if (!isLocalStorageAvailable()) return

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('nodePositions', JSON.stringify(nodePositions))
      } catch (e) {
        console.error('Error saving node positions:', e)
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [nodePositions])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const {
    scaleNodePosition,
    getPixelPos,
    handleNodeClick,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDragging,
  } = useNetworkInteractions({
    dimensions,
    scale,
    panOffset,
    nodePositions,
    setScale,
    setPanOffset,
    isZooming,
    setIsZooming,
    selectedEventId,
    setSelectedEventId,
    setNearestNodeId,
    setZoomTransition,
    setZoomingFromId,
    setZoomingFromPos,
  })


  const networkTransformStyle = useMemo(() => {
    return {
      transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${scale})`,
      transformOrigin: "0 0",
      willChange: isDragging || zoomTransition ? 'transform' : 'auto',
      transition: zoomTransition
        ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        : isDragging
          ? "none"
          : "transform 0.1s ease-out",
    }
  }, [scale, panOffset, zoomTransition, isDragging])

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <TopNav />
      <CategoryFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

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
          onNodeClick={handleNodeClick}
          onNodeHover={setHoveredEventId}
        />
      </div>

      {!isZooming && scale > 0.6 && (
        <div className="absolute bottom-4 left-4 text-white/50 text-sm font-mono" style={{ zIndex: 100 }}>
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  )
}
