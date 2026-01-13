"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { TopNav } from "./top-nav"
import { CategoryFilters } from "./category-filters"
import { NetworkCanvas } from "./network-canvas"
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
  const [scale, setScale] = useState(1.0)
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
    let timeoutId: NodeJS.Timeout | null = null
    
    const updateDimensions = () => {
      // Usar viewport directamente para asegurar dimensiones correctas
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    
    // Throttle resize para mejor rendimiento
    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        updateDimensions()
        timeoutId = null
      }, 100)
    }
    
    updateDimensions()
    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.removeEventListener("resize", handleResize)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  const {
    scaleNodePosition,
    getPixelPos,
    handleNodeClick,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
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
    zoomTransition,
    setZoomTransition,
    setZoomingFromId,
    setZoomingFromPos,
  })


  const networkTransformStyle = useMemo(() => {
    // Durante zoom activo, deshabilitar transiciones para mejor rendimiento
    const isZoomingActive = Math.abs(scale - 1.0) > 0.1 && !zoomTransition
    
    return {
      transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${scale})`,
      transformOrigin: "0 0",
      willChange: isDragging || zoomTransition || isZoomingActive ? 'transform' : 'auto',
      transition: zoomTransition
        ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        : isDragging || isZoomingActive
          ? "none"
          : "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
      // Optimización: usar contain para mejorar el rendering
      contain: 'layout style paint' as const,
    }
  }, [scale, panOffset, zoomTransition, isDragging])

  // Determinar clase de cursor basada en el estado
  const cursorClass = useMemo(() => {
    if (isZooming || zoomTransition) return "cursor-not-allowed"
    if (isDragging) return "cursor-grabbing"
    return "cursor-grab"
  }, [isDragging, isZooming, zoomTransition])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${cursorClass}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw',
        maxHeight: '100vh',
        maxWidth: '100vw',
        userSelect: isDragging ? 'none' : 'auto',
        WebkitUserSelect: isDragging ? 'none' : 'auto',
        WebkitTouchCallout: 'none',
        touchAction: 'pan-x pan-y pinch-zoom',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
    >
      <TopNav />
      <CategoryFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      <div className="absolute inset-0">
        <NetworkCanvas
          dimensions={dimensions}
          nodePositions={nodePositions}
          activeCategory={activeCategory}
          selectedEventId={selectedEventId}
          scaleNodePosition={scaleNodePosition}
          getPixelPos={getPixelPos}
          scale={scale}
          panOffset={panOffset}
          nearestNodeId={nearestNodeId}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoveredEventId}
        />
      </div>

      {!isZooming && scale > 1.0 && (
        <div className="absolute bottom-4 left-4 text-white/50 text-sm font-mono" style={{ zIndex: 100 }}>
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  )
}
