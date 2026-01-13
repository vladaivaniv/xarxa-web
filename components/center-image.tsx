"use client"

import { memo } from "react"
import Image from "next/image"

interface Event {
  id: number
  title: string
  category: string
  image: string
}

interface CenterImageProps {
  event: Event
  position: { x: number; y: number; scale: number }
}

export const CenterImage = memo(function CenterImage({ event, position }: CenterImageProps) {
  return (
    <div
      className="absolute transition-all duration-700 ease-out will-change-transform"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate3d(-50%, -50%, 0)",
      }}
    >
      {/* Red guide lines for focus state */}
      <div className="absolute -inset-4">
        {/* Top left corner */}
        <div className="absolute top-0 left-0 w-8 h-[1px] bg-red-500/60" />
        <div className="absolute top-0 left-0 w-[1px] h-8 bg-red-500/60" />

        {/* Top right corner */}
        <div className="absolute top-0 right-0 w-8 h-[1px] bg-red-500/60" />
        <div className="absolute top-0 right-0 w-[1px] h-8 bg-red-500/60" />

        {/* Bottom left corner */}
        <div className="absolute bottom-0 left-0 w-8 h-[1px] bg-red-500/60" />
        <div className="absolute bottom-0 left-0 w-[1px] h-8 bg-red-500/60" />

        {/* Bottom right corner */}
        <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-red-500/60" />
        <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-red-500/60" />
      </div>

      {/* Main Image */}
      <div className="relative w-64 h-80 md:w-72 md:h-96 overflow-hidden">
        <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" priority />
      </div>
    </div>
  )
})
