"use client"

import type React from "react"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { TopNav } from "./top-nav"
import { CategoryFilters } from "./category-filters"
import { EventMeta } from "./event-meta"

// Event data with images
const events = [
  {
    id: 1,
    title: "Foam Forward Tour Mous Lamrabat",
    category: "tours",
    image: "/moroccan-woman-on-horse-desert-colorful-cloak.jpg",
  },
  {
    id: 2,
    title: "David Bowie Exhibition",
    category: "exhibition",
    image: "/david-bowie-black-and-white-portrait-with-arms-spr.jpg",
  },
  {
    id: 3,
    title: "Members Preview Night",
    category: "for-members",
    image: "/young-woman-with-camera-in-green-field.jpg",
  },
  {
    id: 4,
    title: "Swimming in Art",
    category: "exhibition",
    image: "/person-swimming-in-pool-black-and-white.jpg",
  },
  {
    id: 5,
    title: "Architecture Tour",
    category: "tours",
    image: "/brutalist-concrete-sculpture-abstract.jpg",
  },
  {
    id: 6,
    title: "Living Room Sessions",
    category: "event",
    image: "/vintage-living-room-with-armchair-warm-lighting.jpg",
  },
  {
    id: 7,
    title: "Gallery Opening",
    category: "exhibition",
    image: "/modern-white-art-gallery-interior.jpg",
  },
  {
    id: 8,
    title: "Still Life Workshop",
    category: "workshop",
    image: "/still-life-photography-setup-flowers-vase.jpg",
  },
  {
    id: 9,
    title: "Summer Crowd Event",
    category: "event",
    image: "/crowd-at-summer-music-festival.jpg",
  },
  {
    id: 10,
    title: "Abstract Forms",
    category: "exhibition",
    image: "/abstract-geometric-white-paper-sculpture.jpg",
  },
]

// Fixed organic positions for nodes (percentage based)
// These create the scattered web-like layout seen in the reference
const nodePositions = [
  { x: 38, y: 22 }, // Top center-left (horse/main)
  { x: 62, y: 12 }, // Top right (Bowie)
  { x: 12, y: 32 }, // Left side
  { x: 55, y: 52 }, // Center right
  { x: 78, y: 42 }, // Far right
  { x: 30, y: 62 }, // Lower left
  { x: 70, y: 68 }, // Lower right
  { x: 8, y: 72 }, // Bottom left corner
  { x: 92, y: 8 }, // Top right corner
  { x: 85, y: 85 }, // Bottom right
]

// Define which nodes connect to each other for the red web
const redConnections = [
  [1, 3],
  [1, 4],
  [1, 6],
  [1, 9],
  [2, 4],
  [2, 5],
  [2, 7],
  [2, 9],
  [3, 5],
  [3, 6],
  [3, 7],
  [4, 5],
  [4, 6],
  [4, 7],
  [5, 6],
  [5, 7],
  [5, 9],
  [6, 7],
  [6, 9],
  [7, 9],
  [3, 7],
  [4, 9],
  [5, 9],
]

export function RadialNetwork() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomingFromId, setZoomingFromId] = useState<number | null>(null)
  const [zoomingFromPos, setZoomingFromPos] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const [scale, setScale] = useState(1)
  const [origin, setOrigin] = useState({ x: 50, y: 50 }) // percentage based
  const [nearestNodeId, setNearestNodeId] = useState<number | null>(null)
  const zoomThreshold = 2.5 // Scale at which we enter focused view

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [zoomTransition, setZoomTransition] = useState(false)

  const filteredEvents = useMemo(() => {
    if (!activeCategory) return events
    return events.filter((e) => e.category === activeCategory)
  }, [activeCategory])

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

  const findNearestNode = useCallback(
    (cursorX: number, cursorY: number) => {
      if (dimensions.width === 0) return null

      const adjustedX = (cursorX - panOffset.x) / scale
      const adjustedY = (cursorY - panOffset.y) / scale

      const cursorPercentX = (adjustedX / dimensions.width) * 100
      const cursorPercentY = (adjustedY / dimensions.height) * 100

      let nearestId: number | null = null
      let minDist = Number.POSITIVE_INFINITY

      filteredEvents.forEach((event) => {
        const idx = events.findIndex((e) => e.id === event.id)
        if (idx === -1 || idx >= nodePositions.length) return

        const pos = nodePositions[idx]
        const dist = Math.sqrt(Math.pow(pos.x - cursorPercentX, 2) + Math.pow(pos.y - cursorPercentY, 2))

        if (dist < minDist) {
          minDist = dist
          nearestId = event.id
        }
      })

      return nearestId
    },
    [dimensions, filteredEvents, scale, panOffset],
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isZooming) return
      e.preventDefault()

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      // Calculate new scale
      const delta = -e.deltaY * 0.002
      const newScale = Math.max(0.5, Math.min(5, scale + delta * scale))

      if (newScale !== scale) {
        // Calculate the point under cursor in world coordinates
        const worldX = (cursorX - panOffset.x) / scale
        const worldY = (cursorY - panOffset.y) / scale

        // Calculate new pan offset to keep the point under cursor
        const newPanX = cursorX - worldX * newScale
        const newPanY = cursorY - worldY * newScale

        setPanOffset({ x: newPanX, y: newPanY })
      }

      // Find nearest node when zooming in
      if (newScale > 1.5) {
        const nearest = findNearestNode(cursorX, cursorY)
        setNearestNodeId(nearest)
      } else {
        setNearestNodeId(null)
      }

      // If zooming in past threshold and we have a nearest node, enter focused view
      if (newScale >= zoomThreshold && !selectedEventId && nearestNodeId) {
        enterFocusedView(nearestNodeId)
        return
      }

      // If zooming out from focused view
      if (selectedEventId && newScale < 1) {
        handleZoomOut()
        return
      }

      // If in focused view, allow zoom out
      if (selectedEventId) {
        if (scale > 0.6 && newScale <= 0.6) {
          handleZoomOut()
          return
        }
        setScale(newScale)
        return
      }

      setScale(newScale)
    },
    [scale, selectedEventId, isZooming, dimensions, findNearestNode, nearestNodeId, panOffset],
  )

  const enterFocusedView = useCallback(
    (id: number) => {
      const idx = events.findIndex((e) => e.id === id)
      if (idx === -1 || idx >= nodePositions.length) return

      const pos = nodePositions[idx]
      const nodePixelX = (pos.x / 100) * dimensions.width
      const nodePixelY = (pos.y / 100) * dimensions.height

      // Calculate the pan offset needed to center this node
      const targetPanX = dimensions.width / 2 - nodePixelX * 4
      const targetPanY = dimensions.height / 2 - nodePixelY * 4

      setZoomingFromId(id)
      setZoomingFromPos({ x: nodePixelX, y: nodePixelY })
      setIsZooming(true)
      setZoomTransition(true)

      // Animate zoom to the node position
      setScale(4)
      setPanOffset({ x: targetPanX, y: targetPanY })

      setTimeout(() => {
        setSelectedEventId(id)
        setIsZooming(false)
        setZoomTransition(false)
        setZoomingFromId(null)
        setZoomingFromPos(null)
        setScale(1)
        setPanOffset({ x: 0, y: 0 })
        setNearestNodeId(null)
      }, 500)
    },
    [dimensions],
  )

  const selectedEvent = selectedEventId ? events.find((e) => e.id === selectedEventId) : null

  const handleNodeClick = useCallback(
    (id: number) => {
      enterFocusedView(id)
    },
    [enterFocusedView],
  )

  const handleZoomOut = useCallback(() => {
    if (selectedEventId) {
      const idx = events.findIndex((e) => e.id === selectedEventId)
      if (idx !== -1 && idx < nodePositions.length) {
        const pos = nodePositions[idx]
        const nodePixelX = (pos.x / 100) * dimensions.width
        const nodePixelY = (pos.y / 100) * dimensions.height

        setZoomingFromId(selectedEventId)
        setZoomingFromPos({ x: nodePixelX, y: nodePixelY })
        setIsZooming(true)
        setZoomTransition(true)
        setSelectedEventId(null)

        // Start zoomed in at the node position, then zoom out
        const startPanX = dimensions.width / 2 - nodePixelX * 4
        const startPanY = dimensions.height / 2 - nodePixelY * 4
        setScale(4)
        setPanOffset({ x: startPanX, y: startPanY })

        // Small delay then animate to scale 1
        requestAnimationFrame(() => {
          setTimeout(() => {
            setScale(1)
            setPanOffset({ x: 0, y: 0 })
          }, 50)
        })

        setTimeout(() => {
          setIsZooming(false)
          setZoomTransition(false)
          setZoomingFromId(null)
          setZoomingFromPos(null)
          setNearestNodeId(null)
        }, 550)
      } else {
        setSelectedEventId(null)
        setScale(1)
        setPanOffset({ x: 0, y: 0 })
      }
    }
  }, [selectedEventId, dimensions])

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (selectedEvent && e.target === e.currentTarget) {
        handleZoomOut()
      }
    },
    [selectedEvent, handleZoomOut],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (selectedEventId || isZooming) return
      if (scale > 1) {
        setIsDragging(true)
        setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      }
    },
    [scale, panOffset, selectedEventId, isZooming],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const getPixelPos = (percentX: number, percentY: number) => ({
    x: (percentX / 100) * dimensions.width,
    y: (percentY / 100) * dimensions.height,
  })

  const getEdgePoints = () => {
    const points = []
    const numLines = 16
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2
      const distance = Math.max(dimensions.width, dimensions.height)
      points.push({
        x: dimensions.width / 2 + Math.cos(angle) * distance,
        y: dimensions.height / 2 + Math.sin(angle) * distance,
      })
    }
    return points
  }

  const networkTransformStyle = useMemo(() => {
    if (selectedEventId && !isZooming) return {}
    return {
      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
      transformOrigin: "0 0",
      transition: zoomTransition
        ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        : isDragging
          ? "none"
          : "transform 0.1s ease-out",
    }
  }, [scale, panOffset, selectedEventId, isZooming, zoomTransition, isDragging])

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${scale > 1 && !selectedEventId ? "cursor-grab" : ""} ${isDragging ? "cursor-grabbing" : ""}`}
      onClick={handleBackgroundClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Navigation */}
      <TopNav onBackClick={selectedEvent ? handleZoomOut : undefined} />

      {/* Category Filters */}
      <CategoryFilters activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {!selectedEventId && (
        <div className="absolute inset-0" style={networkTransformStyle}>
          {/* SVG Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {/* Network view: Red web connections between nodes */}
            {dimensions.width > 0 && (
              <>
                {/* Red connections between nodes */}
                {redConnections.map(([from, to], i) => {
                  const fromEvent = filteredEvents.find((e) => e.id === from)
                  const toEvent = filteredEvents.find((e) => e.id === to)
                  if (!fromEvent || !toEvent) return null

                  const fromIdx = events.findIndex((e) => e.id === from)
                  const toIdx = events.findIndex((e) => e.id === to)
                  if (fromIdx === -1 || toIdx === -1) return null

                  const fromPos = getPixelPos(nodePositions[fromIdx].x, nodePositions[fromIdx].y)
                  const toPos = getPixelPos(nodePositions[toIdx].x, nodePositions[toIdx].y)

                  return (
                    <line
                      key={`red-${i}`}
                      x1={fromPos.x}
                      y1={fromPos.y}
                      x2={toPos.x}
                      y2={toPos.y}
                      stroke="#dc2626"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                  )
                })}

                {/* Gray lines from hovered node OR nearest node when zooming */}
                {(hoveredEventId || nearestNodeId) && (
                  <>
                    {filteredEvents.map((event) => {
                      const activeNodeId = hoveredEventId || nearestNodeId
                      if (event.id === activeNodeId) return null
                      const fromIdx = events.findIndex((e) => e.id === activeNodeId)
                      const toIdx = events.findIndex((e) => e.id === event.id)
                      if (fromIdx === -1 || toIdx === -1) return null

                      const fromPos = getPixelPos(nodePositions[fromIdx].x, nodePositions[fromIdx].y)
                      const toPos = getPixelPos(nodePositions[toIdx].x, nodePositions[toIdx].y)

                      return (
                        <line
                          key={`gray-${event.id}`}
                          x1={fromPos.x}
                          y1={fromPos.y}
                          x2={toPos.x}
                          y2={toPos.y}
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="1"
                        />
                      )
                    })}
                  </>
                )}
              </>
            )}
          </svg>

          {/* Image Nodes - Network View */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            {filteredEvents.map((event) => {
              const idx = events.findIndex((e) => e.id === event.id)
              if (idx === -1 || idx >= nodePositions.length) return null
              const pos = nodePositions[idx]

              const isNearest = nearestNodeId === event.id && scale > 1.5

              return (
                <button
                  key={event.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:z-10 ${
                    isNearest ? "ring-2 ring-white ring-opacity-80 z-20" : ""
                  }`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNodeClick(event.id)
                  }}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                >
                  <div className="relative">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className={`w-20 h-16 md:w-28 md:h-24 lg:w-32 lg:h-28 object-cover transition-transform duration-300 hover:scale-110 ${
                        isNearest ? "scale-110" : ""
                      }`}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Focused View - Large Center Image */}
      {selectedEvent && !isZooming && (
        <>
          {/* Radial lines from center */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {getEdgePoints().map((point, i) => (
              <line
                key={`radial-${i}`}
                x1={dimensions.width / 2}
                y1={dimensions.height / 2}
                x2={point.x}
                y2={point.y}
                stroke="#dc2626"
                strokeWidth="1"
                opacity="0.9"
              />
            ))}
          </svg>

          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 2 }}
            onClick={handleBackgroundClick}
          >
            <div
              className="relative cursor-zoom-out"
              onClick={(e) => {
                e.stopPropagation()
                handleZoomOut()
              }}
            >
              <img
                src={selectedEvent.image || "/placeholder.svg"}
                alt={selectedEvent.title}
                className="max-w-[320px] md:max-w-[400px] lg:max-w-[500px] max-h-[60vh] object-contain"
              />
            </div>
          </div>
        </>
      )}

      {/* Event Metadata - Only show in focused view */}
      {selectedEvent && !isZooming && <EventMeta event={selectedEvent} />}

      {!selectedEvent && !isZooming && scale !== 1 && (
        <div className="absolute bottom-4 left-4 text-white/50 text-sm font-mono" style={{ zIndex: 100 }}>
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  )
}
