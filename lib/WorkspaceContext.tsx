'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { WORKSPACE_MAP, type WorkspaceKey, type Workspace } from './workspaces'

type Ctx = {
  workspace: Workspace
  setWorkspace: (k: WorkspaceKey) => void
}

const WorkspaceCtx = createContext<Ctx | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<WorkspaceKey>('vibe')
  const workspace = WORKSPACE_MAP[key]
  return (
    <WorkspaceCtx.Provider value={{ workspace, setWorkspace: setKey }}>
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
