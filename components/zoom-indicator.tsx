"use client"

interface ZoomIndicatorProps {
  scale: number
  isZooming: boolean
}

export function ZoomIndicator({ scale, isZooming }: ZoomIndicatorProps) {
  if (isZooming || scale <= 1) return null

  return (
    <div className="absolute bottom-4 left-4 text-white/50 text-sm font-mono" style={{ zIndex: 100 }}>
      {Math.round(scale * 100)}%
    </div>
  )
}
