// GET /api/org-chart
// Returns the agent org structure grouped by tier with avatar URLs, roles, and workspace tags.
// 13 agents across 4 departments mapped to the 4-tier org chart layout.
//
// Tiers:
//   1. Personal Layer   → Command (CEO/COO) — serves you directly
//   2. Workspace Masters → Technical — shared masters that serve every workspace
//   3. Venture Teams     → Marketing — per-workspace teams reporting to workspace heads
//   4. Skill Workshops   → Finance — continuously improves the masters

export interface OrgChartAgent {
  id: string
  name: string
  role: string
  department: string
  color: string
  avatar?: string
  workspaceTags: string[]
  status: 'active' | 'idle' | 'offline'
  reportsTo: string
  memoryAccess: string
}

export interface OrgChartTier {
  title: string
  sub: string
  agents: OrgChartAgent[]
}

export interface OrgChartResponse {
  tiers: OrgChartTier[]
  totalAgents: number
  departments: number
}

const AVATAR_BASE = '/avatars/agents'

const TIERS: OrgChartTier[] = [
  {
    title: 'Personal Layer',
    sub: 'Serves you directly · cross-workspace',
    agents: [
      {
        id: 'marcus',
        name: 'Marcus',
        role: 'CEO',
        department: 'Command',
        color: '#abc7ff',
        avatar: `${AVATAR_BASE}/marcus-ceo.svg`,
        workspaceTags: ['all'],
        status: 'active',
        reportsTo: 'You',
        memoryAccess: 'full — cross-workspace',
      },
      {
        id: 'diana',
        name: 'Diana',
        role: 'COO',
        department: 'Command',
        color: '#5ee0ff',
        avatar: `${AVATAR_BASE}/diana-coo.svg`,
        workspaceTags: ['all'],
        status: 'active',
        reportsTo: 'Marcus',
        memoryAccess: 'full — cross-workspace',
      },
    ],
  },
  {
    title: 'Workspace Masters',
    sub: 'Shared masters · serve every workspace',
    agents: [
      {
        id: 'dev',
        name: 'Dev',
        role: 'Lead Developer',
        department: 'Technical',
        color: '#9db5e7',
        avatar: `${AVATAR_BASE}/dev-lead.svg`,
        workspaceTags: ['all'],
        status: 'active',
        reportsTo: 'Diana',
        memoryAccess: 'workspace + cross-WS',
      },
      {
        id: 'raj',
        name: 'Raj',
        role: 'Backend Engineer',
        department: 'Technical',
        color: '#9db5e7',
        avatar: `${AVATAR_BASE}/raj-backend.svg`,
        workspaceTags: ['all'],
        status: 'active',
        reportsTo: 'Dev',
        memoryAccess: 'workspace + cross-WS',
      },
      {
        id: 'mia',
        name: 'Mia',
        role: 'Frontend Engineer',
        department: 'Technical',
        color: '#9db5e7',
        avatar: `${AVATAR_BASE}/mia-frontend.svg`,
        workspaceTags: ['all'],
        status: 'active',
        reportsTo: 'Dev',
        memoryAccess: 'workspace + cross-WS',
      },
      {
        id: 'quinn',
        name: 'Quinn',
        role: 'QA Engineer',
        department: 'Technical',
        color: '#9db5e7',
        avatar: `${AVATAR_BASE}/quinn-qa.svg`,
        workspaceTags: ['all'],
        status: 'idle',
        reportsTo: 'Dev',
        memoryAccess: 'workspace + cross-WS',
      },
    ],
  },
  {
    title: 'Venture Teams',
    sub: 'Report to their workspace head',
    agents: [
      {
        id: 'kai',
        name: 'Kai',
        role: 'Analyst',
        department: 'Marketing',
        color: '#5fd0b4',
        avatar: `${AVATAR_BASE}/kai-analyst.svg`,
        workspaceTags: ['novizio', 'hourbour'],
        status: 'active',
        reportsTo: 'Lena',
        memoryAccess: 'workspace-scoped',
      },
      {
        id: 'lena',
        name: 'Lena',
        role: 'Brand Strategist',
        department: 'Marketing',
        color: '#5fd0b4',
        avatar: `${AVATAR_BASE}/lena-brand.svg`,
        workspaceTags: ['novizio', 'hourbour'],
        status: 'active',
        reportsTo: 'Diana',
        memoryAccess: 'workspace-scoped',
      },
      {
        id: 'rio',
        name: 'Rio',
        role: 'Ads Manager',
        department: 'Marketing',
        color: '#5ee0ff',
        avatar: `${AVATAR_BASE}/rio-ads.svg`,
        workspaceTags: ['novizio', 'hourbour'],
        status: 'active',
        reportsTo: 'Lena',
        memoryAccess: 'workspace-scoped',
      },
      {
        id: 'nate',
        name: 'Nate',
        role: 'Growth Hacker',
        department: 'Marketing',
        color: '#5ee0ff',
        avatar: `${AVATAR_BASE}/nate-growth.svg`,
        workspaceTags: ['novizio', 'hourbour'],
        status: 'active',
        reportsTo: 'Lena',
        memoryAccess: 'workspace-scoped',
      },
      {
        id: 'atlas',
        name: 'Atlas',
        role: 'Art Director',
        department: 'Marketing',
        color: '#c08bff',
        avatar: `${AVATAR_BASE}/atlas-art-director.svg`,
        workspaceTags: ['novizio', 'hourbour'],
        status: 'active',
        reportsTo: 'Lena',
        memoryAccess: 'workspace-scoped',
      },
      {
        id: 'pixel',
        name: 'Pixel',
        role: 'Production',
        department: 'Marketing',
        color: '#c08bff',
        avatar: `${AVATAR_BASE}/pixel-production.svg`,
        workspaceTags: ['novizio', 'hourbour'],
        status: 'idle',
        reportsTo: 'Atlas',
        memoryAccess: 'workspace-scoped',
      },
    ],
  },
  {
    title: 'Skill Workshops',
    sub: 'Continuously improves the masters',
    agents: [
      {
        id: 'felix',
        name: 'Felix',
        role: 'Finance Officer',
        department: 'Finance',
        color: '#8b919f',
        avatar: `${AVATAR_BASE}/felix-finance.svg`,
        workspaceTags: ['all'],
        status: 'active',
        reportsTo: 'Diana',
        memoryAccess: 'full — cross-workspace',
      },
    ],
  },
]

export async function GET(): Promise<Response> {
  try {
    const totalAgents = TIERS.reduce((sum, t) => sum + t.agents.length, 0)
    const departments = new Set(TIERS.flatMap((t) => t.agents.map((a) => a.department))).size

    const response: OrgChartResponse = {
      tiers: TIERS,
      totalAgents,
      departments,
    }

    return Response.json(response)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
