import { useState, useCallback, useRef, useMemo, useEffect } from "react"
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

  // Throttle para findNearestNode - solo calcular cada 50ms
  const findNearestNodeThrottleRef = useRef<number | null>(null)
  const lastNearestNodeRef = useRef<{ x: number; y: number; result: number | null } | null>(null)

  const findNearestNode = useCallback(
    (cursorX: number, cursorY: number) => {
      if (dimensions.width === 0) return null
      
      // Si el cursor no se ha movido mucho, devolver el resultado anterior
      if (lastNearestNodeRef.current) {
        const dx = Math.abs(cursorX - lastNearestNodeRef.current.x)
        const dy = Math.abs(cursorY - lastNearestNodeRef.current.y)
        if (dx < 5 && dy < 5) {
          return lastNearestNodeRef.current.result
        }
      }

      // Throttle: solo calcular cada 50ms
      if (findNearestNodeThrottleRef.current !== null) {
        return lastNearestNodeRef.current?.result || null
      }

      findNearestNodeThrottleRef.current = window.setTimeout(() => {
        findNearestNodeThrottleRef.current = null
      }, 50)

      const adjustedX = (cursorX - panOffset.x) / scale
      const adjustedY = (cursorY - panOffset.y) / scale

      const cursorPercentX = (adjustedX / dimensions.width) * 100
      const cursorPercentY = (adjustedY / dimensions.height) * 100

      let nearestId: number | null = null
      let minDist = Number.POSITIVE_INFINITY
      const searchRadius = 10 // Solo buscar nodos dentro de 10% de distancia

      events.forEach((event) => {
        const eventData = eventsById.get(event.id)
        if (!eventData || eventData.idx >= nodePositions.length) return

        const pos = nodePositions[eventData.idx]
        const scaledPos = scaleNodePosition(pos.x, pos.y)
        const dx = scaledPos.x - cursorPercentX
        const dy = scaledPos.y - cursorPercentY
        
        // Early exit si está fuera del radio de búsqueda
        if (Math.abs(dx) > searchRadius || Math.abs(dy) > searchRadius) return
        
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < minDist) {
          minDist = dist
          nearestId = event.id
        }
      })

      lastNearestNodeRef.current = { x: cursorX, y: cursorY, result: nearestId }
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

  // Throttle para wheel events - más agresivo durante zoom
  const lastWheelTimeRef = useRef(0)
  const isZoomingRef = useRef(false)
  const WHEEL_THROTTLE_MS = 8 // ~120fps durante zoom para mejor responsividad
  const nearestNodeThrottleRef = useRef<number | null>(null)

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isZooming) return
      e.preventDefault()

      const now = Date.now()
      // Throttle más agresivo para reducir cálculos
      if (now - lastWheelTimeRef.current < WHEEL_THROTTLE_MS) {
        return
      }
      lastWheelTimeRef.current = now

      // Guardar referencias antes del requestAnimationFrame
      const currentTarget = e.currentTarget as HTMLElement | null
      if (!currentTarget) return

      const rect = currentTarget.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      if (wheelTimeoutRef.current) {
        cancelAnimationFrame(wheelTimeoutRef.current)
      }

      isZoomingRef.current = true

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

        // Deshabilitar cálculo de nearest node durante zoom activo para mejor rendimiento
        // Solo calcular cuando el zoom se estabiliza
        if (nearestNodeThrottleRef.current) {
          clearTimeout(nearestNodeThrottleRef.current)
        }

        nearestNodeThrottleRef.current = window.setTimeout(() => {
          isZoomingRef.current = false
          // Solo calcular nearest node si el zoom es alto y está estable
          if (newScale > 1.5) {
            const nearest = findNearestNode(cursorX, cursorY)
            setNearestNodeId(nearest)
          } else {
            setNearestNodeId(null)
          }
        }, 150) // Esperar 150ms después del último zoom

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

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (mouseMoveTimeoutRef.current) {
        cancelAnimationFrame(mouseMoveTimeoutRef.current)
      }
      if (wheelTimeoutRef.current) {
        cancelAnimationFrame(wheelTimeoutRef.current)
      }
      if (findNearestNodeThrottleRef.current) {
        clearTimeout(findNearestNodeThrottleRef.current)
      }
      if (nearestNodeThrottleRef.current) {
        clearTimeout(nearestNodeThrottleRef.current)
      }
    }
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
