"use client"

import { cn } from "@/lib/utils"

const categories = [
  { id: "aturat", label: "Atura't" },
  { id: "hiperrealitat", label: "Hiperrealitat" },
  { id: "poder", label: "Poder" },
  { id: "xarxes", label: "Xarxes" },
]

interface CategoryFiltersProps {
  activeCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export function CategoryFilters({ activeCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
      {categories.map((category) => {
        const isActive = activeCategory === category.id

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(isActive ? null : category.id)}
            className={cn(
              "px-4 py-1.5 text-sm tracking-wide rounded-full transition-all duration-300",
              isActive
                ? "border border-red-500 text-red-500"
                : "border border-white/40 text-white hover:border-white/60",
            )}
          >
            {category.label}
          </button>
        )
      })}
    </div>
  )
}
