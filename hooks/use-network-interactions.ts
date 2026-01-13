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
  zoomTransition: boolean
  setZoomTransition: (transition: boolean) => void
  setZoomingFromId: (id: number | null) => void
  setZoomingFromPos: (pos: { x: number; y: number } | null) => void
  setActiveCategory: (category: string | null) => void
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
  zoomTransition,
  setZoomTransition,
  setZoomingFromId,
  setZoomingFromPos,
  setActiveCategory,
}: UseNetworkInteractionsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const mouseMoveTimeoutRef = useRef<number | null>(null)
  const wheelTimeoutRef = useRef<number | null>(null)
  const panStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null)
  const DRAG_THRESHOLD = 5 // Píxeles mínimos para considerar drag

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
    (id: number, mousePos?: { x: number; y: number }) => {
      // Desactivar el filtro de categoría cuando se hace clic en un nodo
      setActiveCategory(null)

      if (scale > 1.0 && selectedEventId === id) {
        setIsZooming(true)
        setZoomTransition(true)
        
        // Si tenemos la posición del mouse, calcular el nuevo panOffset para mantener el punto bajo el cursor
        let newPanOffset = { x: 0, y: 0 }
        
        if (mousePos) {
          // Calcular la posición del cursor en el espacio del "mundo" (coordenadas sin transform)
          // Con el scale actual (4.0), calcular qué punto del mundo está bajo el cursor
          const worldX = (mousePos.x - panOffset.x) / scale
          const worldY = (mousePos.y - panOffset.y) / scale
          
          // Calcular nuevo panOffset para mantener el mismo punto del mundo bajo el cursor
          // Después del zoom out a scale 1.0, queremos que el mismo punto del mundo permanezca en la misma posición visual
          // Formula: newPan = cursor - world * newScale
          newPanOffset = {
            x: mousePos.x - worldX * 1.0,
            y: mousePos.y - worldY * 1.0,
          }
        }
        
        setScale(1.0)
        setPanOffset(newPanOffset)
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

      // Usar scale para controlar el tamaño de la imagen seleccionada (no del canvas completo)
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
    [dimensions, scale, selectedEventId, scaleNodePosition, nodePositions, setIsZooming, setZoomTransition, setScale, setPanOffset, setSelectedEventId, setNearestNodeId, setZoomingFromId, setZoomingFromPos, setActiveCategory, panOffset],
  )

  // Calcular límites de pan basados en scale y dimensions
  const getPanLimits = useCallback(() => {
    // Permitir pan sin límites cuando scale <= 1 (el usuario puede explorar libremente)
    // Cuando scale > 1, limitar el pan para que no se vea espacio vacío
    if (scale <= 1) {
      // Límites muy grandes para permitir pan libre
      const largeLimit = 10000
      return { minX: -largeLimit, maxX: largeLimit, minY: -largeLimit, maxY: largeLimit }
    }
    // Calcular cuánto espacio extra hay cuando se hace zoom
    const extraWidth = (dimensions.width * (scale - 1)) / 2
    const extraHeight = (dimensions.height * (scale - 1)) / 2
    return {
      minX: -extraWidth,
      maxX: extraWidth,
      minY: -extraHeight,
      maxY: extraHeight,
    }
  }, [dimensions, scale])

  // Aplicar límites a panOffset
  const applyPanLimits = useCallback(
    (newOffset: { x: number; y: number }) => {
      const limits = getPanLimits()
      return {
        x: Math.max(limits.minX, Math.min(limits.maxX, newOffset.x)),
        y: Math.max(limits.minY, Math.min(limits.maxY, newOffset.y)),
      }
    },
    [getPanLimits],
  )

  // Throttle para wheel events - más agresivo durante zoom
  const lastWheelTimeRef = useRef(0)
  const isZoomingRef = useRef(false)
  const WHEEL_THROTTLE_MS = 8 // ~120fps durante zoom para mejor responsividad
  const nearestNodeThrottleRef = useRef<number | null>(null)

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isZooming || zoomTransition) return
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
      // Obtener posición del cursor relativa al contenedor
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      if (wheelTimeoutRef.current) {
        cancelAnimationFrame(wheelTimeoutRef.current)
      }

      isZoomingRef.current = true

      wheelTimeoutRef.current = requestAnimationFrame(() => {
        const delta = -e.deltaY * 0.001 // Reducido de 0.002 a 0.001 para zoom más suave y lento
        const newScale = Math.max(0.5, Math.min(5, scale + delta * scale))

        if (Math.abs(newScale - scale) > 0.001) {
          // Calcular la posición del cursor en el espacio del "mundo" (coordenadas sin transform)
          // El mundo es el espacio de coordenadas del canvas antes de aplicar scale y translate
          // Esto representa la posición real del contenido que está bajo el cursor
          const worldX = (cursorX - panOffset.x) / scale
          const worldY = (cursorY - panOffset.y) / scale

          // Calcular nuevo panOffset para mantener el mismo punto del mundo bajo el cursor
          // Después del zoom, queremos que el mismo punto del mundo permanezca en la misma posición visual
          // Formula: newPan = cursor - world * newScale
          const newPanX = cursorX - worldX * newScale
          const newPanY = cursorY - worldY * newScale

          // Aplicar límites usando el nuevo scale para calcular límites correctos
          // Necesitamos calcular límites temporalmente con el newScale
          const tempExtraWidth = (dimensions.width * (newScale - 1)) / 2
          const tempExtraHeight = (dimensions.height * (newScale - 1)) / 2
          const tempLimits = newScale <= 1 
            ? { minX: 0, maxX: 0, minY: 0, maxY: 0 }
            : {
                minX: -tempExtraWidth,
                maxX: tempExtraWidth,
                minY: -tempExtraHeight,
                maxY: tempExtraHeight,
              }
          
          const limitedOffset = {
            x: Math.max(tempLimits.minX, Math.min(tempLimits.maxX, newPanX)),
            y: Math.max(tempLimits.minY, Math.min(tempLimits.maxY, newPanY)),
          }
          
          setPanOffset(limitedOffset)
          setScale(newScale)
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
      })
    },
    [scale, isZooming, zoomTransition, findNearestNode, panOffset, setScale, setPanOffset, setNearestNodeId, applyPanLimits, dimensions],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isZooming || zoomTransition) return
      // Guardar posición inicial del mouse y del panOffset actual
      setDragStartPos({ x: e.clientX, y: e.clientY })
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      }
      setHasMoved(false)
      // No activar isDragging todavía - esperar a que se mueva más del threshold
    },
    [panOffset, isZooming, zoomTransition],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Si no hay drag iniciado, verificar si debemos iniciarlo
      if (!isDragging && dragStartPos.x !== 0 && dragStartPos.y !== 0) {
        const dx = Math.abs(e.clientX - dragStartPos.x)
        const dy = Math.abs(e.clientY - dragStartPos.y)
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Si el movimiento supera el threshold, activar drag
        if (distance > DRAG_THRESHOLD) {
          setIsDragging(true)
          setHasMoved(true)
          // Prevenir selección de texto
          e.preventDefault()
        }
        return
      }

      if (!isDragging) return

      // Prevenir selección de texto durante drag
      e.preventDefault()

      if (mouseMoveTimeoutRef.current) {
        cancelAnimationFrame(mouseMoveTimeoutRef.current)
      }

      mouseMoveTimeoutRef.current = requestAnimationFrame(() => {
        if (!panStartRef.current) return
        
        // Calcular el desplazamiento del mouse desde el inicio del pan
        const deltaX = e.clientX - panStartRef.current.mouseX
        const deltaY = e.clientY - panStartRef.current.mouseY
        
        // ctx.translate(panOffset.x, panOffset.y) con panOffset.x positivo mueve el contenido a la derecha
        // Cuando arrastras a la izquierda (deltaX negativo), quieres ver MÁS contenido a la izquierda
        // Esto significa que el contenido debe moverse a la izquierda (panOffset.x debe disminuir)
        // Por lo tanto, usamos el mismo signo: panOffset.x disminuye cuando deltaX es negativo
        const newOffset = {
          x: panStartRef.current.panX + deltaX,
          y: panStartRef.current.panY + deltaY,
        }
        // Aplicar límites de pan
        const limitedOffset = applyPanLimits(newOffset)
        setPanOffset(limitedOffset)
      })
    },
    [isDragging, dragStartPos, setPanOffset, applyPanLimits],
  )

  const handleMouseUp = useCallback(() => {
    // Si no hubo movimiento significativo, permitir click normal
    // El click se manejará por el componente hijo si es necesario
    setIsDragging(false)
    setHasMoved(false)
    setDragStartPos({ x: 0, y: 0 })
    panStartRef.current = null
  }, [])

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isZooming || zoomTransition) return
      if (e.touches.length !== 1) return // Solo manejar un dedo
      
      const touch = e.touches[0]
      setDragStartPos({ x: touch.clientX, y: touch.clientY })
      panStartRef.current = {
        mouseX: touch.clientX,
        mouseY: touch.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      }
      setHasMoved(false)
    },
    [panOffset, isZooming, zoomTransition],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return
      e.preventDefault() // Prevenir scroll

      const touch = e.touches[0]

      // Si no hay drag iniciado, verificar si debemos iniciarlo
      if (!isDragging && dragStartPos.x !== 0 && dragStartPos.y !== 0) {
        const dx = Math.abs(touch.clientX - dragStartPos.x)
        const dy = Math.abs(touch.clientY - dragStartPos.y)
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Si el movimiento supera el threshold, activar drag
        if (distance > DRAG_THRESHOLD) {
          setIsDragging(true)
          setHasMoved(true)
        }
        return
      }

      if (!isDragging) return

      if (mouseMoveTimeoutRef.current) {
        cancelAnimationFrame(mouseMoveTimeoutRef.current)
      }

      mouseMoveTimeoutRef.current = requestAnimationFrame(() => {
        if (!panStartRef.current) return
        
        const deltaX = touch.clientX - panStartRef.current.mouseX
        const deltaY = touch.clientY - panStartRef.current.mouseY
        
        // Mismo signo (igual que en handleMouseMove)
        const newOffset = {
          x: panStartRef.current.panX + deltaX,
          y: panStartRef.current.panY + deltaY,
        }
        // Aplicar límites de pan
        const limitedOffset = applyPanLimits(newOffset)
        setPanOffset(limitedOffset)
      })
    },
    [isDragging, dragStartPos, setPanOffset, applyPanLimits],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setHasMoved(false)
    setDragStartPos({ x: 0, y: 0 })
    panStartRef.current = null
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
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging,
    findNearestNode,
  }
}
