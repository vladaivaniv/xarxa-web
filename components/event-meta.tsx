"use client"

import { ArrowRight } from "lucide-react"

interface Event {
  id: number
  title: string
  category: string
  image: string
}

interface EventMetaProps {
  event: Event
}

export function EventMeta({ event }: EventMetaProps) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-4">
      <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded px-6 py-3 flex items-center gap-8 min-w-[400px]">
        {/* Event title */}
        <h2 className="text-white text-sm font-light tracking-wide flex-1">{event.title}</h2>

        {/* CTA Link with arrow */}
        <a
          href="#"
          className="inline-flex items-center gap-3 text-white/80 hover:text-white text-sm transition-colors duration-300 group whitespace-nowrap"
        >
          <span>view events</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1} />
        </a>
      </div>
    </div>
  )
}
