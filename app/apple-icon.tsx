import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export const alt = 'Dins de la lent apple icon'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'black',
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" fill="black" rx="6"/>
          <path 
            d="M16 6C9 6 4 12 4 16C4 20 9 26 16 26C23 26 28 20 28 16C28 12 23 6 16 6Z" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
          <circle cx="16" cy="16" r="4" fill="white"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
