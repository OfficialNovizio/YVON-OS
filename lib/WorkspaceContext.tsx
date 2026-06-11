'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { WORKSPACE_MAP, type WorkspaceKey, type Workspace } from './workspaces'

const STORAGE_KEY = 'yvon_active_workspace'
const VALID_KEYS: WorkspaceKey[] = ['vibe', 'canela', 'valhalla', 'bydesign']
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

type Ctx = {
  workspace: Workspace
  setWorkspace: (k: WorkspaceKey) => void
}

const WorkspaceCtx = createContext<Ctx | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<WorkspaceKey>(DEFAULT)
  const [mounted, setMounted] = useState(false)

  // Restore persisted workspace on mount
  useEffect(() => {
    setKey(getStoredWorkspace())
    setMounted(true)
  }, [])

  const workspace = WORKSPACE_MAP[key]

  const handleSetWorkspace = (k: WorkspaceKey) => {
    setKey(k)
    persistWorkspace(k)
  }

  // Prevent hydration mismatch by rendering with default until client mount
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
