"use client"

import { memo, useRef, useEffect, useMemo, useCallback } from "react"
import { events, eventsById } from "@/lib/network-data"

interface NetworkCanvasProps {
  dimensions: { width: number; height: number }
  nodePositions: { x: number; y: number }[]
  activeCategory: string | null
  selectedEventId: number | null
  scaleNodePosition: (percentX: number, percentY: number) => { x: number; y: number }
  getPixelPos: (percentX: number, percentY: number) => { x: number; y: number }
  scale: number
  nearestNodeId: number | null
  onNodeClick: (id: number) => void
  onNodeHover: (id: number | null) => void
}

export const NetworkCanvas = memo(function NetworkCanvas({
  dimensions,
  nodePositions,
  activeCategory,
  selectedEventId,
  scaleNodePosition,
  getPixelPos,
  scale,
  nearestNodeId,
  onNodeClick,
  onNodeHover,
}: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesCache = useRef<Map<number, HTMLImageElement>>(new Map())
  const hoveredNodeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  // Líneas eliminadas - solo mostramos imágenes/nodos

  // Definir drawCanvas antes de cargar imágenes
  const drawCanvasRef = useRef<(() => void) | null>(null)

  // Calcular tamaño del nodo según el viewport (sin afectar por scale)
  // El zoom viene del transform CSS del contenedor padre, no del tamaño del nodo
  const getNodeSize = useCallback(() => {
    const baseSize = Math.min(dimensions.width, dimensions.height) * 0.1
    const minSize = 50
    const maxSize = 140
    // No multiplicar por scale - el zoom viene del transform CSS
    return Math.max(minSize, Math.min(maxSize, baseSize))
  }, [dimensions])

  // Dibujar en el canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { 
      alpha: true,
      desynchronized: true, // Mejor rendimiento
      willReadFrequently: false
    })
    if (!ctx) return

    // Configurar canvas para alta resolución (retina displays)
    // Usar dimensions directamente - estas son las dimensiones del viewport sin transform CSS
    const dpr = devicePixelRatio
    const displayWidth = Math.max(1, dimensions.width)
    const displayHeight = Math.max(1, dimensions.height)
    
    // Solo redimensionar si es necesario
    if (canvasSizeRef.current.width !== displayWidth || canvasSizeRef.current.height !== displayHeight) {
      const actualWidth = displayWidth * dpr
      const actualHeight = displayHeight * dpr
      canvas.width = actualWidth
      canvas.height = actualHeight
      canvasSizeRef.current = { width: displayWidth, height: displayHeight }
      // Asegurar que el tamaño CSS coincida (sin DPR para el estilo)
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
    }
    
    // Resetear transformación y aplicar escala DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    
    // Configurar renderizado de alta calidad
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    // Limpiar canvas - usar las dimensiones de display (sin DPR ya que estamos escalados)
    ctx.clearRect(0, 0, displayWidth, displayHeight)

    const nodeSize = getNodeSize()

    // Dibujar nodos (líneas eliminadas)
    // Las posiciones se calculan usando getPixelPos que ya considera dimensions
    // El transform CSS del contenedor padre manejará el zoom/pan visual
    // IMPORTANTE: Las imágenes siempre se dibujan en las mismas coordenadas relativas
    // El transform CSS del padre (scale/translate) se encarga del zoom visual
    const currentHovered = hoveredNodeRef.current
    for (const event of events) {
      const eventData = eventsById.get(event.id)
      if (!eventData || eventData.idx >= nodePositions.length) continue

      const pos = nodePositions[eventData.idx]
      const scaledPos = scaleNodePosition(pos.x, pos.y)
      const nodePos = getPixelPos(scaledPos.x, scaledPos.y)

      const img = imagesCache.current.get(event.id)
      if (!img) continue

      const isSelected = selectedEventId === event.id
      const isNearest = nearestNodeId === event.id && scale > 1.5
      const isHovered = currentHovered === event.id

      // Calcular tamaño del nodo (más grande si está seleccionado/hovered)
      let drawSize = nodeSize
      let glowSize = 0
      if (isSelected || isNearest || isHovered) {
        drawSize = nodeSize * 1.15
        glowSize = isSelected || isNearest ? 8 : 4
      }

      // Dibujar anillo con glow si está seleccionado o nearest
      if (isSelected || isNearest) {
        ctx.save()
        // Glow exterior
        ctx.shadowColor = "rgba(255, 255, 255, 0.6)"
        ctx.shadowBlur = glowSize
        ctx.beginPath()
        ctx.arc(nodePos.x, nodePos.y, drawSize / 2 + 4, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"
        ctx.lineWidth = 2.5
        ctx.stroke()
        ctx.restore()
      }

      // Dibujar imagen del nodo con mejor calidad
      ctx.save()
      
      // Añadir sombra sutil para profundidad
      if (isHovered || isSelected || isNearest) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
        ctx.shadowBlur = 12
        ctx.shadowOffsetY = 4
      }
      
      ctx.beginPath()
      ctx.arc(nodePos.x, nodePos.y, drawSize / 2, 0, Math.PI * 2)
      ctx.clip()

      // Mejor calidad de imagen con anti-aliasing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Calcular posición para centrar la imagen
      const imgX = nodePos.x - drawSize / 2
      const imgY = nodePos.y - drawSize / 2

      ctx.drawImage(img, imgX, imgY, drawSize, drawSize)
      ctx.restore()
      
      // Reset shadow
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    }
  }, [
    dimensions,
    nodePositions,
    scaleNodePosition,
    getPixelPos,
    getNodeSize,
    scale,
    selectedEventId,
    nearestNodeId,
    devicePixelRatio,
  ])

  // Guardar referencia para usar en otros efectos
  useEffect(() => {
    drawCanvasRef.current = drawCanvas
  }, [drawCanvas])

  // Cargar imágenes de los nodos
  useEffect(() => {
    const loadImages = async () => {
      for (const event of events) {
        if (imagesCache.current.has(event.id)) continue

        const img = new Image()
        img.crossOrigin = "anonymous"
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            imagesCache.current.set(event.id, img)
            resolve()
          }
          img.onerror = () => {
            // Si falla la carga, crear una imagen placeholder
            const placeholder = new Image()
            placeholder.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Crect fill='%23333' width='128' height='128'/%3E%3C/svg%3E"
            placeholder.onload = () => {
              imagesCache.current.set(event.id, placeholder)
              resolve()
            }
            placeholder.onerror = () => resolve() // Si incluso el placeholder falla, continuar
          }
          img.src = event.image
        })
      }
      // Forzar re-render después de cargar imágenes
      if (drawCanvasRef.current) {
        requestAnimationFrame(() => drawCanvasRef.current?.())
      }
    }

    loadImages()
  }, [])

  // Re-dibujar cuando cambian las dependencias (con debouncing)
  // Incluir scale explícitamente para asegurar redibujado durante zoom
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      drawCanvas()
      animationFrameRef.current = null
    })
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [drawCanvas, scale, dimensions.width, dimensions.height])

  // Detectar qué nodo está bajo el cursor
  // Nota: Las coordenadas vienen del evento del mouse, que ya están en el espacio del canvas
  const getNodeAtPosition = useCallback(
    (x: number, y: number): number | null => {
      const nodeSize = getNodeSize()
      const nodeRadius = nodeSize / 2

      for (const event of events) {
        const eventData = eventsById.get(event.id)
        if (!eventData || eventData.idx >= nodePositions.length) continue

        const pos = nodePositions[eventData.idx]
        const scaledPos = scaleNodePosition(pos.x, pos.y)
        const nodePos = getPixelPos(scaledPos.x, scaledPos.y)

        const dx = x - nodePos.x
        const dy = y - nodePos.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Aumentar el radio de detección ligeramente para mejor UX
        if (distance <= nodeRadius * 1.2) {
          return event.id
        }
      }

      return null
    },
    [nodePositions, scaleNodePosition, getPixelPos, getNodeSize],
  )

  // Throttle para hover (mejor rendimiento)
  const hoverThrottleRef = useRef<number | null>(null)
  
  // Manejar eventos del mouse
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      if (hoverThrottleRef.current) {
        cancelAnimationFrame(hoverThrottleRef.current)
      }

      hoverThrottleRef.current = requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect()
        // Convertir coordenadas del viewport a coordenadas del canvas
        // El canvas usa dimensions.width/height, pero getBoundingClientRect puede diferir por el transform CSS
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top
        
        // Escalar si hay diferencia entre rect y dimensions (debido a transform CSS)
        if (rect.width > 0 && rect.height > 0) {
          x = x * (dimensions.width / rect.width)
          y = y * (dimensions.height / rect.height)
        }

        const nodeId = getNodeAtPosition(x, y)
        if (nodeId !== hoveredNodeRef.current) {
          hoveredNodeRef.current = nodeId
          onNodeHover(nodeId)
          // Re-dibujar para mostrar el hover
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }
          animationFrameRef.current = requestAnimationFrame(() => {
            drawCanvas()
            animationFrameRef.current = null
          })
        }
        hoverThrottleRef.current = null
      })
    },
    [getNodeAtPosition, onNodeHover, drawCanvas, dimensions],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      // Convertir coordenadas del viewport a coordenadas del canvas
      let x = e.clientX - rect.left
      let y = e.clientY - rect.top
      
      // Escalar si hay diferencia entre rect y dimensions (debido a transform CSS)
      if (rect.width > 0 && rect.height > 0) {
        x = x * (dimensions.width / rect.width)
        y = y * (dimensions.height / rect.height)
      }

      const nodeId = getNodeAtPosition(x, y)
      if (nodeId !== null) {
        onNodeClick(nodeId)
      }
    },
    [getNodeAtPosition, onNodeClick, dimensions],
  )

  const handleMouseLeave = useCallback(() => {
    hoveredNodeRef.current = null
    onNodeHover(null)
    if (hoverThrottleRef.current) {
      cancelAnimationFrame(hoverThrottleRef.current)
      hoverThrottleRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      drawCanvas()
      animationFrameRef.current = null
    })
  }, [onNodeHover, drawCanvas])

  if (dimensions.width === 0 || dimensions.height === 0) return null

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute top-0 left-0"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        zIndex: 1,
        pointerEvents: 'auto',
        imageRendering: 'auto',
        touchAction: 'none',
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    />
  )
})
