'use client'

import { useState } from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { WORKSPACES, WORKSPACE_MAP } from '@/lib/workspaces'
import { useWorkspace } from '@/lib/WorkspaceContext'

export function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const isVenture = WORKSPACE_MAP[workspace.key]?.isVenture

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left transition hover:bg-white/[0.06]"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: workspace.accent }} />
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
              {isVenture ? 'Venture' : 'Workspace'}
            </span>
            <span className="block text-sm font-semibold text-on-surface truncate">{workspace.name}</span>
          </span>
        </span>
        <ChevronsUpDown size={15} className="text-on-surface-variant shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-white/10 bg-surface-container shadow-2xl max-h-[340px] overflow-y-auto">
            {WORKSPACES.map((w) => (
              <button
                key={w.key}
                onClick={() => {
                  setWorkspace(w.key)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-white/5"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: w.accent }} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-on-surface truncate">
                      {w.name}
                      {w.isVenture && <span className="ml-1.5 text-[10px] text-on-surface-variant/50">(venture)</span>}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant truncate">
                      {w.business} · {w.theme}
                    </span>
                  </span>
                </span>
                {w.key === workspace.key && <Check size={15} className="shrink-0" style={{ color: 'var(--ws-accent)' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
