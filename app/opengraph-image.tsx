import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Dins de la lent - Vlada Ivaniv'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'black',
          position: 'relative',
        }}
      >
        {/* Patrón de fondo con círculos concéntricos */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.3,
          }}
        >
          <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none">
            <circle cx="600" cy="315" r="200" stroke="white" strokeWidth="2" fill="none" opacity="0.5" />
            <circle cx="600" cy="315" r="150" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
            <circle cx="600" cy="315" r="100" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
            <circle cx="600" cy="315" r="50" fill="white" opacity="0.2" />
          </svg>
        </div>
        
        {/* Contenido principal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            zIndex: 1,
          }}
        >
          {/* Icono central */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '120px',
              height: '120px',
            }}
          >
            <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
              <path 
                d="M16 6C9 6 4 12 4 16C4 20 9 26 16 26C23 26 28 20 28 16C28 12 23 6 16 6Z" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none"
              />
              <circle cx="16" cy="16" r="4" fill="white" />
            </svg>
          </div>
          
          {/* Título */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                margin: 0,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Dins de la lent
            </h1>
            <p
              style={{
                fontSize: '28px',
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                margin: 0,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Vlada Ivaniv
            </p>
          </div>
          
          {/* Descripción */}
          <p
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              maxWidth: '900px',
              margin: 0,
              padding: '0 40px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.4',
            }}
          >
            Com les imatges construeixen la manera com mirem, pensem i ens mostrem en el món digital contemporani.
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
