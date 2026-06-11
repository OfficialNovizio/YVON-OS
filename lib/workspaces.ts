export type WorkspaceKey = 'novizio' | 'hourbour'

export type Workspace = {
  key: WorkspaceKey
  name: string
  business: string
  theme: string
  accent: string
  isVenture?: boolean
  ventureSlug?: string
}

export const WORKSPACES: Workspace[] = [
  { key: 'novizio', name: 'Novizio', business: 'Fashion e-commerce', theme: 'Crimson', accent: '#E94560', isVenture: true, ventureSlug: 'novizio' },
  { key: 'hourbour', name: 'Hourbour', business: 'Fintech SaaS', theme: 'Ocean', accent: '#3B82F6', isVenture: true, ventureSlug: 'hourbour' },
]

export const WORKSPACE_MAP: Record<WorkspaceKey, Workspace> = Object.fromEntries(
  WORKSPACES.map((w) => [w.key, w])
) as Record<WorkspaceKey, Workspace>
