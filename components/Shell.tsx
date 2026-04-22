'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import UnifiedControls from '@/components/layout/UnifiedControls'
import { useSpatialReveal } from '@/components/hooks/use-spatial-reveal'
import { useRef } from 'react'

// Other layouts might still use these, but for Spatial we use UnifiedControls
const SidebarUnified = dynamic(() => import('@/components/SidebarUnified'), { ssr: false })
const NavBar = dynamic(() => import('@/components/NavBar'), { ssr: false })

type Props = { children: React.ReactNode }

export default function Shell({ children }: Props) {
  const pathname = usePathname()
  const mainRef = useRef(null)

  // Experimental Spatial Layout for CEO and Agents
  const isSpatial = pathname?.startsWith('/agents/') || pathname === '/ceo'

  if (isSpatial) {
    return (
      <div className="canvas-spatial relative min-h-screen">
        <UnifiedControls />
        <main ref={mainRef}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-deep)]">
      {/* Left Sidebar */}
      <SidebarUnified />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Navigation Bar */}
        <div className="shrink-0 bg-[var(--bg-deep)]" style={{ height: '84px' }}>
          <NavBar />
        </div>

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
