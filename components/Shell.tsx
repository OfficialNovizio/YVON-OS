'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

// ── Responsive context ────────────────────────────────────────────────────────
type SidebarMode = 'full' | 'icons'

interface ShellContextValue {
  sidebarMode: SidebarMode
  setSidebarMode: (m: SidebarMode) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
}

const ShellContext = createContext<ShellContextValue>({
  sidebarMode: 'full',
  setSidebarMode: () => {},
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
})

export function useShell() {
  return useContext(ShellContext)
}

// ── Shell component ───────────────────────────────────────────────────────────
export function Shell({ children }: { children: ReactNode }) {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('full')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu on route change (Listen for popstate / clicked links)
  useEffect(() => {
    const close = () => setMobileMenuOpen(false)
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-screen bg-background text-on-surface">
        <div className="hidden md:block w-60 shrink-0" />
        <div className="flex-1 flex flex-col">
          <div className="h-14" />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    )
  }

  return (
    <ShellContext.Provider value={{ sidebarMode, setSidebarMode, mobileMenuOpen, setMobileMenuOpen }}>
      <div className="flex h-screen bg-background text-on-surface overflow-hidden">
        {/* ── Desktop sidebar (hidden on mobile, collapses on tablet) ──────── */}
        <aside
          className={`
            hidden md:flex shrink-0 flex-col
            ${sidebarMode === 'full' ? 'w-60' : 'w-[72px]'}
            transition-all duration-200
            border-r border-white/[0.06]
          `}
        >
          <Sidebar
            mode={sidebarMode}
            onToggle={() => setSidebarMode(sidebarMode === 'full' ? 'icons' : 'full')}
          />
        </aside>

        {/* ── Mobile sidebar overlay ────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Slide-over panel */}
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0c0c0c] border-r border-white/[0.08] shadow-2xl animate-slide-in">
              <Sidebar
                mode="full"
                onToggle={() => setMobileMenuOpen(false)}
                mobileClose={() => setMobileMenuOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* ── Main content area ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            sidebarMode={sidebarMode}
            onToggleSidebar={() => setSidebarMode(sidebarMode === 'full' ? 'icons' : 'full')}
            onMobileMenu={() => setMobileMenuOpen(true)}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ShellContext.Provider>
  )
}
