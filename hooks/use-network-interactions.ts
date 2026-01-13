import { useState, useCallback, useRef, useMemo } from "react"
import type React from "react"
import { events, eventsById } from "@/lib/network-data"
import { nodeSpreadFactor } from "@/lib/theme-colors"

interface UseNetworkInteractionsProps {
  dimensions: { width: number; height: number }
  scale: number
  panOffset: { x: number; y: number }
  nodePositions: { x: number; y: number }[]
  setScale: (scale: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  isZooming: boolean
  setIsZooming: (zooming: boolean) => void
  selectedEventId: number | null
  setSelectedEventId: (id: number | null) => void
  setNearestNodeId: (id: number | null) => void
  setZoomTransition: (transition: boolean) => void
  setZoomingFromId: (id: number | null) => void
  setZoomingFromPos: (pos: { x: number; y: number } | null) => void
}

export function useNetworkInteractions({
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
}: UseNetworkInteractionsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const mouseMoveTimeoutRef = useRef<number | null>(null)
  const wheelTimeoutRef = useRef<number | null>(null)

  const scaleNodePosition = useCallback((percentX: number, percentY: number) => {
    const centerX = 50
    const centerY = 50
    const scaledX = centerX + (percentX - centerX) * nodeSpreadFactor
    const scaledY = centerY + (percentY - centerY) * nodeSpreadFactor
    return { x: scaledX, y: scaledY }
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

      events.forEach((event) => {
        const eventData = eventsById.get(event.id)
        if (!eventData || eventData.idx >= nodePositions.length) return

        const pos = nodePositions[eventData.idx]
        const scaledPos = scaleNodePosition(pos.x, pos.y)
        const dist = Math.sqrt(Math.pow(scaledPos.x - cursorPercentX, 2) + Math.pow(scaledPos.y - cursorPercentY, 2))

        if (dist < minDist) {
          minDist = dist
          nearestId = event.id
        }
      })

      return nearestId
    },
    [dimensions, scale, panOffset, scaleNodePosition, nodePositions],
  )

  const getPixelPos = useCallback(
    (percentX: number, percentY: number) => ({
      x: (percentX / 100) * dimensions.width,
      y: (percentY / 100) * dimensions.height,
    }),
    [dimensions],
  )

  const handleNodeClick = useCallback(
    (id: number) => {
      if (scale > 0.6 && selectedEventId === id) {
        setIsZooming(true)
        setZoomTransition(true)
        setScale(0.6)
        setPanOffset({ x: 0, y: 0 })
        setSelectedEventId(null)
        setNearestNodeId(null)

        setTimeout(() => {
          setIsZooming(false)
          setZoomTransition(false)
          setZoomingFromId(null)
          setZoomingFromPos(null)
        }, 500)
        return
      }

      const eventData = eventsById.get(id)
      if (!eventData || eventData.idx >= nodePositions.length) return

      const pos = nodePositions[eventData.idx]
      const scaledPos = scaleNodePosition(pos.x, pos.y)
      const nodePixelX = (scaledPos.x / 100) * dimensions.width
      const nodePixelY = (scaledPos.y / 100) * dimensions.height

      const targetPanX = dimensions.width / 2 - nodePixelX * 4
      const targetPanY = dimensions.height / 2 - nodePixelY * 4

      setZoomingFromId(id)
      setZoomingFromPos({ x: nodePixelX, y: nodePixelY })
      setIsZooming(true)
      setZoomTransition(true)
      setSelectedEventId(id)

      setScale(4)
      setPanOffset({ x: targetPanX, y: targetPanY })

      setTimeout(() => {
        setIsZooming(false)
        setZoomTransition(false)
        setZoomingFromId(null)
        setZoomingFromPos(null)
        setNearestNodeId(null)
      }, 500)
    },
    [dimensions, scale, selectedEventId, scaleNodePosition, nodePositions, setIsZooming, setZoomTransition, setScale, setPanOffset, setSelectedEventId, setNearestNodeId, setZoomingFromId, setZoomingFromPos],
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isZooming) return
      e.preventDefault()

      // Guardar referencias antes del requestAnimationFrame
      const currentTarget = e.currentTarget as HTMLElement | null
      if (!currentTarget) return

      const rect = currentTarget.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      if (wheelTimeoutRef.current) {
        cancelAnimationFrame(wheelTimeoutRef.current)
      }

      wheelTimeoutRef.current = requestAnimationFrame(() => {
        const delta = -e.deltaY * 0.002
        const newScale = Math.max(0.5, Math.min(5, scale + delta * scale))

        if (newScale !== scale) {
          const worldX = (cursorX - panOffset.x) / scale
          const worldY = (cursorY - panOffset.y) / scale

          const newPanX = cursorX - worldX * newScale
          const newPanY = cursorY - worldY * newScale

          setPanOffset({ x: newPanX, y: newPanY })
        }

        if (newScale > 1.5) {
          const nearest = findNearestNode(cursorX, cursorY)
          setNearestNodeId(nearest)
        } else {
          setNearestNodeId(null)
        }

        setScale(newScale)
      })
    },
    [scale, isZooming, findNearestNode, panOffset, setScale, setPanOffset, setNearestNodeId],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isZooming) return
      setIsDragging(true)
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    },
    [panOffset, isZooming],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      if (mouseMoveTimeoutRef.current) {
        cancelAnimationFrame(mouseMoveTimeoutRef.current)
      }

      mouseMoveTimeoutRef.current = requestAnimationFrame(() => {
        setPanOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      })
    },
    [isDragging, dragStart, setPanOffset],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  return {
    scaleNodePosition,
    getPixelPos,
    handleNodeClick,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDragging,
    findNearestNode,
  }
}
