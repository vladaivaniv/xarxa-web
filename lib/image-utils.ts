/**
 * Utilidades para manejar imágenes optimizadas
 * Prefiere WebP pero tiene fallback a PNG
 */

export function getOptimizedImagePath(path: string): string {
  // Si ya es WebP, devolverlo tal cual
  if (path.endsWith('.webp')) {
    return path
  }
  
  // Si es PNG, intentar usar WebP
  if (path.endsWith('.png')) {
    return path.replace(/\.png$/i, '.webp')
  }
  
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
