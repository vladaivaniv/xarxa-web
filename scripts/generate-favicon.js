const sharp = require('sharp')
const toIco = require('to-ico')
const fs = require('fs')
const path = require('path')

async function generateFavicon() {
  const svgPath = path.join(__dirname, '../app/icon.svg')
  const outputPath = path.join(__dirname, '../app/favicon.ico')
  
  // Tamaños comunes para favicon.ico
  const sizes = [16, 32, 48]
  
  try {
    // Leer el SVG
    const svgBuffer = fs.readFileSync(svgPath)
    
    // Generar PNGs en diferentes tamaños
    const pngBuffers = await Promise.all(
      sizes.map(size =>
        sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    )
    
    // Crear el archivo ICO con múltiples tamaños
    const icoBuffer = await toIco(pngBuffers)
    fs.writeFileSync(outputPath, icoBuffer)
    
    console.log('✅ Favicon.ico generado exitosamente: app/favicon.ico')
    console.log(`   Tamaños incluidos: ${sizes.join('x, ')}x`)
    
  } catch (error) {
    console.error('Error generando favicon:', error)
    process.exit(1)
  }
}

generateFavicon()
