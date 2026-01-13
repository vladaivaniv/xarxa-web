#!/usr/bin/env node

/**
 * Script para optimizar imágenes PNG a WebP
 * Reduce el tamaño de las imágenes manteniendo buena calidad
 */

const fs = require('fs')
const path = require('path')

// Verificar si sharp está disponible
let sharp
try {
  sharp = require('sharp')
} catch (e) {
  console.error('❌ Error: sharp no está instalado.')
  console.log('📦 Instalando sharp...')
  console.log('   Ejecuta: pnpm add -D sharp')
  process.exit(1)
}

const PUBLIC_DIR = path.join(__dirname, '../public')
const QUALITY = 85 // Calidad WebP (0-100)
const MAX_WIDTH = 1920 // Ancho máximo

async function convertPngToWebp(inputPath, outputPath) {
  try {
    const stats = await fs.promises.stat(inputPath)
    const originalSize = stats.size

    await sharp(inputPath)
      .resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: QUALITY })
      .toFile(outputPath)

    const newStats = await fs.promises.stat(outputPath)
    const newSize = newStats.size
    const reduction = ((1 - newSize / originalSize) * 100).toFixed(1)

    return {
      originalSize,
      newSize,
      reduction: parseFloat(reduction),
      success: true,
    }
  } catch (error) {
    console.error(`Error procesando ${inputPath}:`, error.message)
    return { success: false, error: error.message }
  }
}

async function processDirectory(dirPath, relativePath = '') {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
  const results = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const relPath = path.join(relativePath, entry.name)

    if (entry.isDirectory()) {
      // Procesar subdirectorios recursivamente
      const subResults = await processDirectory(fullPath, relPath)
      results.push(...subResults)
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      // Convertir PNG a WebP
      const webpName = entry.name.replace(/\.png$/i, '.webp')
      const webpPath = path.join(dirPath, webpName)
      const relWebpPath = path.join(relativePath, webpName)

      // Solo convertir si el WebP no existe o es más antiguo que el PNG
      let shouldConvert = true
      try {
        const pngStats = await fs.promises.stat(fullPath)
        const webpStats = await fs.promises.stat(webpPath)
        if (webpStats.mtime > pngStats.mtime) {
          shouldConvert = false
        }
      } catch {
        // WebP no existe, convertir
      }

      if (shouldConvert) {
        console.log(`🔄 Convirtiendo: ${relPath} → ${relWebpPath}`)
        const result = await convertPngToWebp(fullPath, webpPath)
        if (result.success) {
          const sizeMB = (result.originalSize / 1024 / 1024).toFixed(2)
          const newSizeMB = (result.newSize / 1024 / 1024).toFixed(2)
          console.log(
            `   ✅ ${sizeMB}MB → ${newSizeMB}MB (${result.reduction}% reducción)`
          )
          results.push({
            file: relPath,
            originalSize: result.originalSize,
            newSize: result.newSize,
            reduction: result.reduction,
          })
        }
      } else {
        console.log(`⏭️  Omitiendo (ya existe): ${relWebpPath}`)
      }
    }
  }

  return results
}

async function main() {
  console.log('🚀 Iniciando optimización de imágenes...\n')
  console.log(`📁 Directorio: ${PUBLIC_DIR}`)
  console.log(`⚙️  Configuración:`)
  console.log(`   - Formato: WebP`)
  console.log(`   - Calidad: ${QUALITY}%`)
  console.log(`   - Ancho máximo: ${MAX_WIDTH}px`)
  console.log('')

  const results = await processDirectory(PUBLIC_DIR)

  if (results.length === 0) {
    console.log('\n✨ Todas las imágenes ya están optimizadas.')
    return
  }

  console.log('\n📊 Resumen:')
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0)
  const totalNew = results.reduce((sum, r) => sum + r.newSize, 0)
  const totalReduction = ((1 - totalNew / totalOriginal) * 100).toFixed(1)

  console.log(`   Archivos procesados: ${results.length}`)
  console.log(
    `   Tamaño original: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB`
  )
  console.log(`   Tamaño nuevo: ${(totalNew / 1024 / 1024).toFixed(2)}MB`)
  console.log(`   Reducción total: ${totalReduction}%`)
  console.log(
    `   Espacio ahorrado: ${((totalOriginal - totalNew) / 1024 / 1024).toFixed(2)}MB`
  )
  console.log('\n✅ Optimización completada!')
}

main().catch((error) => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
