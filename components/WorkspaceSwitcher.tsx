'use client'

import { useState, useEffect } from 'react'
import { ChevronsUpDown, Check, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { WORKSPACE_MAP } from '@/lib/workspaces'

interface Venture {
  slug: string
  name: string
  color: string
  pending?: number
}

// Color → accent mapping for the live dot
const VENTURE_ACCENTS: Record<string, string> = {
  'yvon-os': '#6366F1',
  novizio: '#E94560',
  hourbour: '#3B82F6',
}

export function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [ventures, setVentures] = useState<Venture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ventures')
      .then((r) => r.json())
      .then((data: Venture[]) => {
        if (Array.isArray(data)) {
          setVentures(
            data.map((v) => ({
              slug: v.slug,
              name: v.name,
              color: v.color ?? VENTURE_ACCENTS[v.slug] ?? '#6366f1',
              pending: v.pending ?? 0,
            })),
          )
        }
      })
      .catch(() => {
        // Fallback to hardcoded workspaces
        setVentures([
          { slug: 'yvon-os', name: 'YVON OS', color: '#6366F1' },
          { slug: 'novizio', name: 'Novizio', color: '#E94560' },
          { slug: 'hourbour', name: 'Hourbour', color: '#3B82F6' },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const currentVenture = ventures.find((v) => v.slug === workspace.key)
  const displayName = currentVenture?.name ?? workspace.name
  const displayColor = currentVenture?.color ?? workspace.accent

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left transition hover:bg-white/[0.06]"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: displayColor }}
          />
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
              {workspace.key === 'yvon-os' ? 'Workspace' : 'Venture'}
            </span>
            <span className="block text-sm font-semibold text-on-surface truncate">
              {loading ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Loading…
                </span>
              ) : (
                displayName
              )}
            </span>
          </span>
        </span>
        <ChevronsUpDown size={15} className="text-on-surface-variant shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-white/10 bg-surface-container shadow-2xl max-h-[340px] overflow-y-auto">
            {ventures.length === 0 && !loading && (
              <div className="px-3 py-4 text-center text-xs text-on-surface-variant">
                No ventures found
              </div>
            )}
            {ventures.map((v) => (
              <button
                key={v.slug}
                onClick={() => {
                  setWorkspace(v.slug as any)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-white/5"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: v.color }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-on-surface truncate">
                      {v.name}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant truncate">
                      {v.slug}
                    </span>
                  </span>
                </span>
                {v.slug === workspace.key && (
                  <Check size={15} className="shrink-0" style={{ color: 'var(--ws-accent)' }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
