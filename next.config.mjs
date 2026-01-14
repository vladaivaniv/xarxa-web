/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'], // Preferir WebP (mejor compatibilidad)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true, // Requerido para exportación estática (las imágenes ya están optimizadas)
    remotePatterns: [],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Manejar errores de manera más robusta
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Configuración para evitar errores 500
  reactStrictMode: true,
  // Configuración para exportación estática (GitHub Pages)
  output: 'export',
  basePath: '/xarxa-web',
  assetPrefix: '/xarxa-web',
  trailingSlash: true,
}

export default nextConfig
