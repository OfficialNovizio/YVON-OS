'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

interface TopBarProps {
  sidebarMode: 'full' | 'icons'
  onToggleSidebar?: () => void
  onMobileMenu: () => void
}

// ── All navigable pages (for command palette filtering) ─────────────────────
interface PageEntry {
  label: string
  href: string
  section: string
}

const ALL_PAGES: PageEntry[] = [
  // Command Center
  { label: 'Dashboard Home', href: '/dashboard', section: 'Command Center' },
  { label: 'Decision Queue', href: '/decision-queue', section: 'Command Center' },
  { label: 'Task Board', href: '/task-board', section: 'Command Center' },
  { label: 'Advisory Council', href: '/advisory-council', section: 'Command Center' },
  { label: 'Agents', href: '/agents', section: 'Command Center' },
  { label: 'Org Chart', href: '/org-chart', section: 'Command Center' },
  { label: 'Office', href: '/office', section: 'Command Center' },
  { label: 'Skill Workshop', href: '/skill-workshop', section: 'Command Center' },
  // Long-form
  { label: 'Content Pipeline', href: '/content-pipeline', section: 'Long-form' },
  { label: 'Production Calendar', href: '/production-calendar', section: 'Long-form' },
  { label: 'YouTube Studio', href: '/youtube-studio', section: 'Long-form' },
  { label: 'YouTube Analytics', href: '/youtube-analytics', section: 'Long-form' },
  // Shorts
  { label: 'Short Pipeline', href: '/short-pipeline', section: 'Shorts' },
  { label: 'Shorts', href: '/shorts', section: 'Shorts' },
  // Posts
  { label: 'Social Approvals', href: '/social-approvals', section: 'Posts' },
  { label: 'Scheduler', href: '/scheduler', section: 'Posts' },
  { label: 'Social Analytics', href: '/social-analytics', section: 'Posts' },
  { label: 'Newsletter', href: '/newsletter', section: 'Posts' },
  // Knowledge
  { label: 'Brain & Wiki', href: '/brain-wiki', section: 'Knowledge' },
  { label: 'Asset Lab', href: '/asset-lab', section: 'Knowledge' },
  { label: 'Trend Radar', href: '/trend-radar', section: 'Knowledge' },
  // Build
  { label: 'Idea Feed', href: '/idea-feed', section: 'Build' },
  { label: 'Software Pipeline', href: '/software-pipeline', section: 'Build' },
  // Revenue
  { label: 'Consulting CRM', href: '/consulting-crm', section: 'Revenue' },
  { label: 'Cinematic Sites', href: '/cinematic-sites', section: 'Revenue' },
  // System
  { label: 'Email Inbox', href: '/inbox', section: 'System' },
  { label: 'Settings', href: '/settings', section: 'System' },
  { label: 'Hardware', href: '/hardware', section: 'System' },
  { label: 'Projects', href: '/projects', section: 'System' },
  { label: 'People', href: '/people', section: 'System' },
  { label: 'Docs', href: '/docs', section: 'System' },
  { label: 'Logs', href: '/logs', section: 'System' },
]

// ── Breadcrumb helper ───────────────────────────────────────────────────────
function useBreadcrumb(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return 'Dashboard'
  return parts
    .map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' / ')
}

// ── Component ───────────────────────────────────────────────────────────────
export function TopBar({ sidebarMode: _, onToggleSidebar: _t, onMobileMenu }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { workspace } = useWorkspace()
  const breadcrumb = useBreadcrumb(pathname)

  // ── Command palette state ─────────────────────────────────────────────────
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1) // -1 = "Ask Henry" row
  const inputRef = useRef<HTMLInputElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)

  // Filter pages by query
  const filteredPages = useMemo(() => {
    if (!query.trim()) return ALL_PAGES
    const q = query.toLowerCase()
    return ALL_PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.section.toLowerCase().includes(q)
    )
  }, [query])

  // Reset state when opening/closing
  const openPalette = useCallback(() => {
    setPaletteOpen(true)
    setQuery('')
    setActiveIndex(-1)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const closePalette = useCallback(() => {
    setPaletteOpen(false)
    setQuery('')
    setActiveIndex(-1)
  }, [])

  // ── Ctrl+K / Cmd+K global listener ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openPalette])

  // ── Click outside to close ────────────────────────────────────────────────
  useEffect(() => {
    if (!paletteOpen) return
    const handler = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        closePalette()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [paletteOpen, closePalette])

  // ── Navigation actions ────────────────────────────────────────────────────
  const navigateTo = useCallback(
    (href: string) => {
      router.push(href)
      closePalette()
    },
    [router, closePalette]
  )

  const handleAskHenry = useCallback(() => {
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/advisory-council?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/advisory-council')
    }
    closePalette()
  }, [query, router, closePalette])

  // ── Keyboard navigation within palette ────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Total items = filtered pages + 1 "Ask Henry" row
    const totalItems = filteredPages.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i < totalItems - 1 ? i + 1 : i))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i > -1 ? i - 1 : i))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < totalItems) {
          navigateTo(filteredPages[activeIndex].href)
        } else if (totalItems > 0) {
          // If something is typed, treat as Ask Henry
          handleAskHenry()
        }
        break
      case 'Escape':
        e.preventDefault()
        closePalette()
        break
    }
  }

  return (
    <header className="h-14 shrink-0 flex items-center gap-3 px-3 sm:px-4 border-b border-white/[0.06] bg-background/80 backdrop-blur-md sticky top-0 z-40">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenu}
        className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.06] transition text-on-surface-variant"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-[22px]">menu</span>
      </button>

      {/* Venture / Workspace switcher pill */}
      <div className="w-48 shrink-0">
        <WorkspaceSwitcher />
      </div>

      {/* Breadcrumb */}
      <span className="text-white/[0.2] text-xs hidden sm:inline">/</span>
      <span className="text-on-surface font-medium truncate hidden sm:inline text-sm">{breadcrumb}</span>

      {/* Global search / command palette */}
      <div className="hidden sm:flex items-center flex-1 justify-center mx-2" ref={paletteRef}>
        <div className="relative w-full max-w-md">
          {/* Search trigger / input */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-text ${
              paletteOpen
                ? 'border-accent/40 bg-white/[0.04] ring-1 ring-accent/20'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
            }`}
            onClick={() => !paletteOpen && openPalette()}
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask Henry or jump anywhere…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(-1)
              }}
              onFocus={() => setPaletteOpen(true)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-xs text-on-surface placeholder:text-on-surface-variant w-full"
            />
            <kbd className="hidden lg:inline text-[10px] text-on-surface-variant border border-white/[0.1] rounded px-1.5 py-0.5 leading-none shrink-0">
              ⌘K
            </kbd>
          </div>

          {/* Command palette dropdown */}
          {paletteOpen && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#0a1628]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
              {/* Results list */}
              <div className="max-h-[320px] overflow-y-auto no-scrollbar py-1">
                {filteredPages.length === 0 && query.trim() && (
                  <div className="px-4 py-3 text-xs text-on-surface-variant text-center">
                    No pages found for &ldquo;{query}&rdquo;
                  </div>
                )}

                {filteredPages.map((page, i) => (
                  <button
                    key={page.href}
                    onClick={() => navigateTo(page.href)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      activeIndex === i
                        ? 'bg-accent/10 text-accent'
                        : 'text-on-surface hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] shrink-0 text-on-surface-variant">
                      arrow_forward
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium block truncate">{page.label}</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant/60 shrink-0">
                      {page.section}
                    </span>
                  </button>
                ))}
              </div>

              {/* Ask Henry footer */}
              <div className="border-t border-white/[0.06]">
                <button
                  onClick={handleAskHenry}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    activeIndex === -1
                      ? 'bg-accent/10 text-accent'
                      : 'text-on-surface-variant hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    psychology
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium block">
                      {query.trim() ? (
                        <>
                          Ask Henry: &ldquo;<span className="text-on-surface">{query.trim()}</span>&rdquo;
                        </>
                      ) : (
                        'Ask Henry a question…'
                      )}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/60">
                      Opens Advisory Council
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[14px] shrink-0 text-on-surface-variant/40">
                    open_in_new
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System status */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="live-dot" />
          <span>System healthy</span>
        </div>
        <span className="text-white/[0.15]">·</span>
        <span>13 agents live</span>
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] shrink-0 flex items-center justify-center text-xs font-medium text-on-surface-variant">
        N
      </div>
    </header>
  )
}
