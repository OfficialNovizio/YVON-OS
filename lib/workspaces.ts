export type WorkspaceKey = 'vibe' | 'canela' | 'valhalla' | 'bydesign' | 'novizio' | 'hourbour'

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
  { key: 'vibe', name: 'Vibe with AI', business: 'Main brand', theme: 'Default', accent: '#abc7ff' },
  { key: 'canela', name: 'Canela', business: 'E-commerce shop', theme: 'Deep sea', accent: '#5fd0b4' },
  { key: 'valhalla', name: 'Valhalla', business: 'Music business', theme: 'Techno', accent: '#c08bff' },
  { key: 'bydesign', name: 'By Design', business: 'App / agency', theme: 'Glass neon', accent: '#5ee0ff' },
  // Real ventures — switching to these also syncs the yvon_active_venture cookie
  { key: 'novizio', name: 'Novizio', business: 'Fashion e-commerce', theme: 'Crimson', accent: '#E94560', isVenture: true, ventureSlug: 'novizio' },
  { key: 'hourbour', name: 'Hourbour', business: 'Fintech SaaS', theme: 'Ocean', accent: '#3B82F6', isVenture: true, ventureSlug: 'hourbour' },
]

export const WORKSPACE_MAP: Record<WorkspaceKey, Workspace> = Object.fromEntries(
  WORKSPACES.map((w) => [w.key, w])
) as Record<WorkspaceKey, Workspace>
