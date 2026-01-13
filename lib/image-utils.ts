/**
 * Utilidades para manejar imágenes optimizadas
 * Prefiere WebP pero tiene fallback a PNG
 */

export function getOptimizedImagePath(path: string): string {
  return path
}

/**
 * Obtiene la ruta de imagen con basePath y formato optimizado
 */
export function getImagePath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/xarxa-web'
  const optimizedPath = getOptimizedImagePath(path)
  return `${basePath}${optimizedPath}`
}
