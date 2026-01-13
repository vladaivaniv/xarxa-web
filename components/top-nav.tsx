"use client"

import { ArrowLeft, Search } from "lucide-react"

interface TopNavProps {
  onBackClick?: () => void
}

export function TopNav({ onBackClick }: TopNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      <div className="absolute left-1/2 -translate-x-1/2">
        <h1 className="text-white text-2xl font-bold tracking-tight lowercase">Xarxa</h1>
      </div>
    </nav>
  )
}
