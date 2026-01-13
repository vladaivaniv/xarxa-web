"use client"

import { memo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Event {
  id: number
  title: string
  category: string
  image: string
}

interface ImageNodeProps {
  event: Event
  position: { x: number; y: number; scale: number }
  onClick: () => void
  isFaded: boolean
}

export const ImageNode = memo(function ImageNode({ event, position, onClick, isFaded }: ImageNodeProps) {
  // Calculate size based on scale
  const baseWidth = 140
  const baseHeight = 180
  const width = baseWidth * position.scale
  const height = baseHeight * position.scale

  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute transition-all duration-700 ease-out group",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate3d(-50%, -50%, 0)",
        width: `${width}px`,
        height: `${height}px`,
        willChange: 'transform',
      }}
      aria-label={`Select ${event.title}`}
    >
      <div
        className={cn(
          "relative w-full h-full  transition-all duration-500",
          isFaded ? "opacity-50" : "opacity-100",
          "group-hover:opacity-100 group-hover:scale-105",
        )}
      >
        <Image
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 140px, 140px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Subtle glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </button>
  )
})
