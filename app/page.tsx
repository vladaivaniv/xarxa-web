import { RadialNetwork } from "@/components/radial-network"

export default function Home() {
  return (
    <main 
      className="overflow-hidden bg-black"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw',
        maxHeight: '100vh',
        maxWidth: '100vw',
        margin: 0,
        padding: 0,
        display: 'block',
        boxSizing: 'border-box',
      }}
    >
      <RadialNetwork />
    </main>
  )
}
