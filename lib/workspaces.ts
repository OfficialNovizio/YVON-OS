export type WorkspaceKey = 'vibe' | 'canela' | 'valhalla' | 'bydesign'

export type Workspace = {
  key: WorkspaceKey
  name: string
  business: string
  theme: string
  accent: string
}

export const WORKSPACES: Workspace[] = [
  { key: 'vibe', name: 'Vibe with AI', business: 'Main brand', theme: 'Default', accent: '#abc7ff' },
  { key: 'canela', name: 'Canela', business: 'E-commerce shop', theme: 'Deep sea', accent: '#5fd0b4' },
  { key: 'valhalla', name: 'Valhalla', business: 'Music business', theme: 'Techno', accent: '#c08bff' },
  { key: 'bydesign', name: 'By Design', business: 'App / agency', theme: 'Glass neon', accent: '#5ee0ff' },
]

export const WORKSPACE_MAP: Record<WorkspaceKey, Workspace> = Object.fromEntries(
  WORKSPACES.map((w) => [w.key, w])
) as Record<WorkspaceKey, Workspace>
