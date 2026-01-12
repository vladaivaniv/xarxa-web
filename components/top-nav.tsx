"use client"

import { ArrowLeft, Search } from "lucide-react"

interface TopNavProps {
  onBackClick?: () => void
}

export function TopNav({ onBackClick }: TopNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      {/* Back Arrow */}
      <button
        onClick={onBackClick}
        className="text-white/70 hover:text-white transition-colors duration-300"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <div className="absolute left-1/2 -translate-x-1/2">
        <h1 className="text-white text-2xl font-bold tracking-tight lowercase">foam</h1>
      </div>

      {/* Search */}
      <button className="text-white/70 hover:text-white transition-colors duration-300" aria-label="Search">
        <Search className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </nav>
  )
}
