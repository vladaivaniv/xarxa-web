"use client"

import { memo, useRef, useEffect, useMemo, useCallback } from "react"
import { events, eventsById, generateConnectionsByCategory } from "@/lib/network-data"

interface NetworkCanvasProps {
  dimensions: { width: number; height: number }
  nodePositions: { x: number; y: number }[]
  activeCategory: string | null
  selectedEventId: number | null
  scaleNodePosition: (percentX: number, percentY: number) => { x: number; y: number }
  getPixelPos: (percentX: number, percentY: number) => { x: number; y: number }
  scale: number
  panOffset: { x: number; y: number }
  nearestNodeId: number | null
  onNodeClick: (id: number, mousePos?: { x: number; y: number }) => void
  onNodeHover: (id: number | null) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseUp?: (e: React.MouseEvent) => void
}

export const NetworkCanvas = memo(function NetworkCanvas({
  dimensions,
  nodePositions,
  activeCategory,
  selectedEventId,
  scaleNodePosition,
  getPixelPos,
  scale,
  panOffset,
  nearestNodeId,
  onNodeClick,
  onNodeHover,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesCache = useRef<Map<number, HTMLImageElement>>(new Map())
  const hoveredNodeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const floatAnimationRef = useRef<number | null>(null)
  const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const animationTimeRef = useRef<number>(0)

  // Líneas eliminadas - solo mostramos imágenes/nodos

  // Definir drawCanvas antes de cargar imágenes
  const drawCanvasRef = useRef<(() => void) | null>(null)

  // Generar conexiones por categoría (líneas entre nodos del mismo tipo)
  const connections = useMemo(() => generateConnectionsByCategory(), [])

  // Calcular tamaño del nodo según el viewport (sin afectar por scale)
  // El zoom viene del transform CSS del contenedor padre, no del tamaño del nodo
  const getNodeSize = useCallback(() => {
    const baseSize = Math.min(dimensions.width, dimensions.height) * 0.1
    const minSize = 50
    const maxSize = 140
    // No multiplicar por scale - el zoom viene del transform CSS
    return Math.max(minSize, Math.min(maxSize, baseSize))
  }, [dimensions])

  // Calcular offset de movimiento suave para cada nodo
  const getNodeFloatOffset = useCallback((nodeId: number) => {
    const time = animationTimeRef.current
    // Usar el ID del nodo como fase única para que cada nodo se mueva de forma diferente
    const phase = nodeId * 0.8
    // Movimiento más amplio y suave: amplitud entre 20-30 píxeles
    const baseAmplitude = 20 + (nodeId % 5) * 2 // Variar amplitud entre 20-30px
    const speed1 = 0.0015 // Velocidad principal suave
    const speed2 = 0.0008 // Velocidad secundaria para movimiento orgánico
    const speed3 = 0.0004 // Velocidad terciaria para micro-movimientos
    
    // Combinar múltiples ondas para movimiento más suave, orgánico y natural
    const wave1X = Math.sin(time * speed1 + phase) * baseAmplitude
    const wave1Y = Math.cos(time * speed1 + phase * 1.4) * baseAmplitude
    const wave2X = Math.sin(time * speed2 + phase * 2.3) * (baseAmplitude * 0.5)
    const wave2Y = Math.cos(time * speed2 + phase * 1.8) * (baseAmplitude * 0.5)
    const wave3X = Math.sin(time * speed3 + phase * 3.1) * (baseAmplitude * 0.25)
    const wave3Y = Math.cos(time * speed3 + phase * 2.5) * (baseAmplitude * 0.25)
    
    // Combinar todas las ondas para movimiento fluido y natural
    return {
      x: wave1X + wave2X + wave3X,
      y: wave1Y + wave2Y + wave3Y,
    }
  }, [])

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
    
    // Aplicar zoom y pan directamente en el canvas
    // Simular el comportamiento del CSS transform: translate3d(panOffset) scale(scale)
    // Orden: primero translate, luego scale (para que el scale se aplique alrededor del origen del translate)
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(scale, scale)

    const nodeSize = getNodeSize()
    const currentHovered = hoveredNodeRef.current

    // Dibujar líneas entre nodos de la misma categoría
    for (const [fromId, toId] of connections) {
      const fromEvent = eventsById.get(fromId)
      const toEvent = eventsById.get(toId)
      
      if (!fromEvent || !toEvent || fromEvent.idx >= nodePositions.length || toEvent.idx >= nodePositions.length) {
        continue
      }
      
      // Determinar si esta línea está conectada al nodo seleccionado o en hover
      const isConnectedToSelected = selectedEventId !== null && (fromId === selectedEventId || toId === selectedEventId)
      const isConnectedToHovered = currentHovered !== null && (fromId === currentHovered || toId === currentHovered)
      // Determinar si esta línea está conectada a un nodo de la categoría activa
      const isConnectedToActiveCategory = activeCategory !== null && 
        (fromEvent.event.category === activeCategory || toEvent.event.category === activeCategory)
      const isHighlighted = isConnectedToSelected || isConnectedToHovered || isConnectedToActiveCategory
      
      // Establecer color y ancho según si está conectada al nodo seleccionado o en hover
      if (isHighlighted) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.6)" // Rojo con más opacidad para líneas seleccionadas/hovered
        ctx.lineWidth = 2
      } else {
        ctx.strokeStyle = "rgba(128, 128, 128, 0.3)" // Gris con transparencia
        ctx.lineWidth = 1
      }
      
      const fromPos = nodePositions[fromEvent.idx]
      const toPos = nodePositions[toEvent.idx]
      
      const fromScaledPos = scaleNodePosition(fromPos.x, fromPos.y)
      const toScaledPos = scaleNodePosition(toPos.x, toPos.y)
      
      const fromBasePixelPos = getPixelPos(fromScaledPos.x, fromScaledPos.y)
      const toBasePixelPos = getPixelPos(toScaledPos.x, toScaledPos.y)
      
      // Aplicar offset de movimiento suave a las líneas también (solo si no hay zoom)
      const fromFloatOffset = (selectedEventId === fromId || scale > 1.0) ? { x: 0, y: 0 } : getNodeFloatOffset(fromId)
      const toFloatOffset = (selectedEventId === toId || scale > 1.0) ? { x: 0, y: 0 } : getNodeFloatOffset(toId)
      
      const fromPixelPos = {
        x: fromBasePixelPos.x + fromFloatOffset.x,
        y: fromBasePixelPos.y + fromFloatOffset.y,
      }
      const toPixelPos = {
        x: toBasePixelPos.x + toFloatOffset.x,
        y: toBasePixelPos.y + toFloatOffset.y,
      }
      
      // Dibujar línea entre los dos nodos
      ctx.beginPath()
      ctx.moveTo(fromPixelPos.x, fromPixelPos.y)
      ctx.lineTo(toPixelPos.x, toPixelPos.y)
      ctx.stroke()
    }

    // Dibujar nodos
    // Las posiciones se calculan usando getPixelPos que ya considera dimensions
    // El transform CSS del contenedor padre manejará el zoom/pan visual
    // IMPORTANTE: Las imágenes siempre se dibujan en las mismas coordenadas relativas
    // El transform CSS del padre (scale/translate) se encarga del zoom visual
    for (const event of events) {
      const eventData = eventsById.get(event.id)
      if (!eventData || eventData.idx >= nodePositions.length) continue

      const pos = nodePositions[eventData.idx]
      const scaledPos = scaleNodePosition(pos.x, pos.y)
      const baseNodePos = getPixelPos(scaledPos.x, scaledPos.y)
      
      const isSelected = selectedEventId === event.id
      const isNearest = nearestNodeId === event.id && scale > 1.5
      const isHovered = currentHovered === event.id
      
      // Aplicar offset de movimiento suave (solo si no está seleccionado o en zoom)
      const floatOffset = (isSelected || scale > 1.0) ? { x: 0, y: 0 } : getNodeFloatOffset(event.id)
      const nodePos = {
        x: baseNodePos.x + floatOffset.x,
        y: baseNodePos.y + floatOffset.y,
      }

      const img = imagesCache.current.get(event.id)
      if (!img) continue

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
    
    // Restaurar transformación (deshacer scale y translate)
    ctx.restore()
  }, [
    dimensions,
    nodePositions,
    scaleNodePosition,
    getPixelPos,
    getNodeSize,
    scale,
    panOffset,
    selectedEventId,
    activeCategory,
    nearestNodeId,
    devicePixelRatio,
    connections,
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

  // Actualizar tiempo de animación continuamente para el movimiento de los nodos
  useEffect(() => {
    let startTime = Date.now()
    let lastFrameTime = performance.now()
    
    const animate = (currentTime: number) => {
      // Usar tiempo relativo desde el inicio para movimiento más suave
      const elapsed = currentTime - startTime
      animationTimeRef.current = elapsed
      
      // Calcular delta time para interpolación suave
      const deltaTime = currentTime - lastFrameTime
      lastFrameTime = currentTime
      
      // Redibujar canvas para actualizar posiciones
      if (drawCanvasRef.current) {
        drawCanvasRef.current()
      }
      
      // Solo continuar animando si no hay zoom activo (para mejor rendimiento)
      if (scale <= 1.0) {
        floatAnimationRef.current = requestAnimationFrame(animate)
      }
    }
    
    // Iniciar animación solo si no hay zoom activo
    if (scale <= 1.0) {
      startTime = Date.now()
      lastFrameTime = performance.now()
      floatAnimationRef.current = requestAnimationFrame(animate)
    }
    
    return () => {
      if (floatAnimationRef.current !== null) {
        cancelAnimationFrame(floatAnimationRef.current)
        floatAnimationRef.current = null
      }
    }
  }, [scale])

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
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      let x = e.clientX - rect.left
      let y = e.clientY - rect.top
      x = (x - panOffset.x) / scale
      y = (y - panOffset.y) / scale

      const nodeId = getNodeAtPosition(x, y)
      
      // Si hay un nodo bajo el cursor, no hacer pan (el click se manejará en handleClick)
      if (nodeId !== null) {
        return
      }

      // Si no hay nodo, permitir pan pasando el evento al contenedor
      if (onMouseDown) {
        onMouseDown(e as unknown as React.MouseEvent)
      }
    },
    [getNodeAtPosition, panOffset, scale, onMouseDown],
  )

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
        // Ahora el zoom y pan se aplican en el canvas, así que convertimos directamente
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top
        
        // Convertir de coordenadas de vista (sin transform) a coordenadas del canvas transformado
        // El canvas tiene translate(panOffset) y scale(scale) aplicados
        // Inverso: (x - panOffset) / scale
        x = (x - panOffset.x) / scale
        y = (y - panOffset.y) / scale

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

      // También permitir pan si no hay nodo bajo el cursor
      // onMouseMove del contenedor se llamará para pan cuando sea necesario
      if (onMouseMove) {
        onMouseMove(e as unknown as React.MouseEvent)
      }
    },
    [getNodeAtPosition, onNodeHover, drawCanvas, dimensions, panOffset, scale, onMouseMove],
  )

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (onMouseUp) {
        onMouseUp(e as unknown as React.MouseEvent)
      }
    },
    [onMouseUp],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      // Convertir coordenadas del viewport a coordenadas del canvas
      // Ahora el zoom y pan se aplican en el canvas, así que convertimos directamente
      let x = e.clientX - rect.left
      let y = e.clientY - rect.top
      
      // Guardar la posición del mouse en coordenadas de vista (sin transform)
      const mouseX = x
      const mouseY = y
      
      // Convertir de coordenadas de vista (sin transform) a coordenadas del canvas transformado
      // El canvas tiene translate(panOffset) y scale(scale) aplicados
      // Inverso: (x - panOffset) / scale
      x = (x - panOffset.x) / scale
      y = (y - panOffset.y) / scale

      const nodeId = getNodeAtPosition(x, y)
      if (nodeId !== null) {
        onNodeClick(nodeId, { x: mouseX, y: mouseY })
      }
    },
    [getNodeAtPosition, onNodeClick, dimensions, panOffset, scale],
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
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    />
  )
})
