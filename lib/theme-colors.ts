export const themeColors = {
  xarxes: "#dc2626",
  hiperrealitat: "#3b82f6",
  poder: "#f59e0b",
  aturat: "#10b981",
} as const

export const themeColorsHover = {
  xarxes: "rgba(220, 38, 38, 0.3)",
  hiperrealitat: "rgba(59, 130, 246, 0.3)",
  poder: "rgba(245, 158, 11, 0.3)",
  aturat: "rgba(16, 185, 129, 0.3)",
} as const

export const getThemeColor = (category: string): string => {
  return themeColors[category as keyof typeof themeColors] || "#dc2626"
}

export const getThemeColorHover = (category: string): string => {
  return themeColorsHover[category as keyof typeof themeColorsHover] || "rgba(255, 255, 255, 0.3)"
}

export const nodeSpreadFactor: number = 1.4
