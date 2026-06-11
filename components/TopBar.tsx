'use client'

import { usePathname } from 'next/navigation'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { WORKSPACES } from '@/lib/workspaces'
import type { WorkspaceKey } from '@/lib/workspaces'

interface TopBarProps {
  sidebarMode: 'full' | 'icons'
  onToggleSidebar?: () => void
  onMobileMenu: () => void
}

// ── Breadcrumb builder ───────────────────────────────────────────────────────
function useBreadcrumb(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return 'Dashboard'
  return parts
    .map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' / ')
}

// ── Component ────────────────────────────────────────────────────────────────
export function TopBar({ sidebarMode: _, onToggleSidebar: _t, onMobileMenu }: TopBarProps) {
  const pathname = usePathname()
  const { workspace } = useWorkspace()
  const breadcrumb = useBreadcrumb(pathname)
  const wsLabel = WORKSPACES.find((w: { key: WorkspaceKey }) => w.key === workspace.key)?.name ?? workspace.key

  return (
    <header className="h-14 shrink-0 flex items-center gap-3 px-3 sm:px-4 border-b border-white/[0.06] bg-background/80 backdrop-blur-md sticky top-0 z-40">
      {/* ── Mobile hamburger ───────────────────────────────────────────────── */}
      <button
        onClick={onMobileMenu}
        className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.06] transition text-on-surface-variant"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-[22px]">menu</span>
      </button>

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
        <span className="text-on-surface-variant text-xs font-medium truncate">
          {wsLabel}
        </span>
        <span className="text-white/[0.2] text-xs">/</span>
        <span className="text-on-surface font-medium truncate">{breadcrumb}</span>
      </div>

      {/* ── Global search ──────────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] max-w-xs flex-1 mx-4">
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
          search
        </span>
        <input
          type="text"
          placeholder="Ask Marcus or jump anywhere…"
          className="bg-transparent border-none outline-none text-xs text-on-surface placeholder:text-on-surface-variant w-full"
        />
        <kbd className="hidden lg:inline text-[10px] text-on-surface-variant border border-white/[0.1] rounded px-1.5 py-0.5 leading-none">
          ⌘K
        </kbd>
      </div>

      {/* ── System status ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="live-dot" />
          <span>System healthy</span>
        </div>
        <span className="text-white/[0.15]">·</span>
        <span>12 agents live</span>
      </div>

      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] shrink-0 flex items-center justify-center text-xs font-medium text-on-surface-variant">
        N
      </div>
    </header>
  )
}
