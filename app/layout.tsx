import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Dins de la lent - Vlada Ivaniv",
    template: "%s | Dins de la lent"
  },
  description: "Com les imatges construeixen la manera com mirem, pensem i ens mostrem en el món digital contemporani.",
  keywords: ["imatges", "xarxes", "digital", "art", "contemporani", "Vlada Ivaniv", "visual", "redes sociales"],
  authors: [{ name: "Vlada Ivaniv", url: "https://www.instagram.com/vladaa.design/" }],
  creator: "Vlada Ivaniv",
  publisher: "Vlada Ivaniv",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://xarxa-web.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ca_ES',
    url: '/',
    title: 'Dins de la lent - Vlada Ivaniv',
    description: 'Com les imatges construeixen la manera com mirem, pensem i ens mostrem en el món digital contemporani.',
    siteName: 'Dins de la lent',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Dins de la lent - Vlada Ivaniv',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dins de la lent - Vlada Ivaniv',
    description: 'Com les imatges construeixen la manera com mirem, pensem i ens mostrem en el món digital contemporani.',
    creator: '@vladaa.design',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ca">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
