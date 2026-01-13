"use client"

import type React from "react"
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

export function NetworkNodes({
  nodePositions,
  scaleNodePosition,
  nearestNodeId,
  scale,
  onNodeClick,
  onNodeHover,
}: NetworkNodesProps) {
  return (
    <div className="absolute inset-0" style={{ zIndex: 2 }}>
      {events.map((event) => {
        const eventData = eventsById.get(event.id)
        if (!eventData || eventData.idx >= nodePositions.length) return null
        const pos = nodePositions[eventData.idx]
        const scaledPos = scaleNodePosition(pos.x, pos.y)

        const isNearest = nearestNodeId === event.id && scale > 1.5

        return (
          <button
            key={event.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:z-10 ${
              isNearest ? "ring-2 ring-white ring-opacity-80 z-20" : ""
            } cursor-pointer`}
            style={{
              left: `${scaledPos.x}%`,
              top: `${scaledPos.y}%`,
              transition: undefined,
            }}
            onClick={(e) => {
              e.stopPropagation()
              onNodeClick(event.id)
            }}
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
      })}
    </div>
  )
}
