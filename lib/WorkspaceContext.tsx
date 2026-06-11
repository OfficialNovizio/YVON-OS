'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { WORKSPACE_MAP, type WorkspaceKey, type Workspace } from './workspaces'

const STORAGE_KEY = 'yvon_active_workspace'
const VALID_KEYS: WorkspaceKey[] = ['vibe', 'canela', 'valhalla', 'bydesign', 'novizio', 'hourbour']
const DEFAULT: WorkspaceKey = 'vibe'

function getStoredWorkspace(): WorkspaceKey {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (VALID_KEYS as string[]).includes(stored)) {
      return stored as WorkspaceKey
    }
  } catch { /* localStorage blocked */ }
  return DEFAULT
}

function persistWorkspace(key: WorkspaceKey) {
  try { localStorage.setItem(STORAGE_KEY, key) } catch { /* ignore */ }
}

/** Sync the venture cookie so API routes scope data to the active venture. */
function syncVentureCookie(key: WorkspaceKey) {
  if (typeof document === 'undefined') return
  const ws = WORKSPACE_MAP[key]
  if (ws?.isVenture && ws.ventureSlug) {
    document.cookie = `yvon_active_venture=${ws.ventureSlug};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
  }
}

type Ctx = {
  workspace: Workspace
  setWorkspace: (k: WorkspaceKey) => void
}

const WorkspaceCtx = createContext<Ctx | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<WorkspaceKey>(DEFAULT)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = getStoredWorkspace()
    setKey(stored)
    syncVentureCookie(stored)
    setMounted(true)
  }, [])

  const workspace = WORKSPACE_MAP[key]

  const handleSetWorkspace = (k: WorkspaceKey) => {
    setKey(k)
    persistWorkspace(k)
    syncVentureCookie(k)
  }

  if (!mounted) {
    return (
      <WorkspaceCtx.Provider value={{ workspace: WORKSPACE_MAP[DEFAULT], setWorkspace: handleSetWorkspace }}>
        <div data-workspace={DEFAULT} className="min-h-screen">
          {children}
        </div>
      </WorkspaceCtx.Provider>
    )
  }

  return (
    <WorkspaceCtx.Provider value={{ workspace, setWorkspace: handleSetWorkspace }}>
      <div data-workspace={key} className="min-h-screen">
        {children}
      </div>
    </WorkspaceCtx.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
