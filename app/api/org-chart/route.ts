// GET /api/org-chart
// Returns real agent org structure from the .toon/ filesystem.
// Groups agents into 4 tiers + workshop connections to /skill-workshop.
//
// Data source: .toon/memory/agent-department/* (same as /api/agent-ops)

import { NextResponse } from 'next/server'
import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrgChartAgent {
  id: string; name: string; role: string; department: string
  color: string; initials: string
  workspaceTags: string[]; status: 'active' | 'idle' | 'offline'
  reportsTo: string; memoryAccess: string
  skillsCount: number; memoryHealth: number; level: number
}

export interface OrgChartTier {
  title: string; sub: string; agents: OrgChartAgent[]
}

export interface OrgChartResponse {
  tiers: OrgChartTier[]; totalAgents: number; departments: number
  workshops: WorkshopInfo[]
}

export interface WorkshopInfo {
  id: string; name: string; icon: string; color: string
  improving: string; agentIds: string[]
}

// ─── Department colors ────────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  CEO: '#abc7ff', COO: '#5ee0ff', Command: '#abc7ff',
  Technical: '#9db5e7', Marketing: '#5fd0b4',
  Finance: '#8b919f', Legal: '#f59e0b',
  Psychology: '#ffb693', Research: '#c084fc', Sense: '#34d399',
}

const DEPT_REPORTS_TO: Record<string, string> = {
  CEO: 'You', COO: 'Marcus', Command: 'Marcus',
  Technical: 'Diana', Marketing: 'Diana',
  Finance: 'Diana', Legal: 'Marcus',
  Psychology: 'Marcus', Research: 'Kai', Sense: 'Dev',
}

const DEPT_MEMORY: Record<string, string> = {
  CEO: 'full — cross-workspace', COO: 'full — cross-workspace',
  Command: 'full — cross-workspace',
  Technical: 'workspace + cross-WS', Marketing: 'workspace-scoped',
  Finance: 'full — cross-workspace', Legal: 'workspace-scoped',
  Psychology: 'full — cross-workspace', Research: 'workspace-scoped',
  Sense: 'workspace-scoped',
}

const WORKSPACE_TAGS: Record<string, string[]> = {
  CEO: ['all'], COO: ['all'], Command: ['all'],
  Technical: ['all'], Finance: ['all'], Legal: ['all'],
  Psychology: ['all'], Sense: ['all'],
  Marketing: ['novizio', 'hourbour'],
  Research: ['novizio', 'hourbour'],
}

// ─── Workshop definitions ─────────────────────────────────────────────────────

const WORKSHOPS: WorkshopInfo[] = [
  { id: 'william', name: "William's Workshop", icon: '✍️', color: '#a78bfa', improving: 'Copywriting & brand voice', agentIds: ['lena', 'rio', 'nate'] },
  { id: 'leonardo', name: "Leonardo's Workshop", icon: '🎨', color: '#f472b6', improving: 'Image generation & brand kit', agentIds: ['atlas', 'pixel', 'mia'] },
  { id: 'isaac', name: "Isaac's Workshop", icon: '🔬', color: '#34d399', improving: 'Research quality & sources', agentIds: ['kai', 'depth', 'synth', 'vette'] },
  { id: 'nexus', name: "Nexus's Workshop", icon: '💻', color: '#60a5fa', improving: 'Code quality & PR reviews', agentIds: ['dev', 'raj', 'quinn'] },
  { id: 'lena-ws', name: "Lena's Workshop", icon: '💫', color: '#fbbf24', improving: 'Brand strategy & tone', agentIds: ['lena', 'diana'] },
  { id: 'kai-ws', name: "Kai's Workshop", icon: '📊', color: '#fb923c', improving: 'Analytics & intelligence', agentIds: ['kai', 'felix'] },
]

// ─── Tier definitions — which departments go where ────────────────────────────

const TIER_MAP: Record<string, number> = {
  CEO: 0, COO: 0, Command: 0,           // Personal Layer
  Technical: 1,                           // Workspace Masters
  Marketing: 2,                           // Venture Teams
  Finance: 3, Legal: 3, Psychology: 3, Research: 3, Sense: 3, // Specialized
}

const TIER_LABELS = [
  { title: 'Personal Layer', sub: 'Serves you directly · cross-workspace' },
  { title: 'Workspace Masters', sub: 'Shared masters · serve every workspace' },
  { title: 'Venture Teams', sub: 'Per-workspace teams · marketing & growth' },
  { title: 'Specialized', sub: 'Finance, Legal, Research, Psychology, Sense' },
]

// ─── Fallback data (used when .toon filesystem is not available) ─────────────

const FALLBACK_TIERS: OrgChartTier[] = [
  {
    title: 'Personal Layer', sub: 'Serves you directly · cross-workspace',
    agents: [
      { id: 'marcus', name: 'Marcus', role: 'CEO', department: 'CEO', color: '#abc7ff', initials: 'MC', workspaceTags: ['all'], status: 'active', reportsTo: 'You', memoryAccess: 'full — cross-workspace', skillsCount: 14, memoryHealth: 41, level: 1 },
      { id: 'diana', name: 'Diana', role: 'COO', department: 'COO', color: '#5ee0ff', initials: 'DC', workspaceTags: ['all'], status: 'active', reportsTo: 'Marcus', memoryAccess: 'full — cross-workspace', skillsCount: 23, memoryHealth: 35, level: 1 },
    ],
  },
  {
    title: 'Workspace Masters', sub: 'Shared masters · serve every workspace',
    agents: [
      { id: 'dev', name: 'Dev', role: 'Lead Developer', department: 'Technical', color: '#9db5e7', initials: 'DV', workspaceTags: ['all'], status: 'active', reportsTo: 'Diana', memoryAccess: 'workspace + cross-WS', skillsCount: 22, memoryHealth: 24, level: 3 },
      { id: 'raj', name: 'Raj', role: 'Backend Engineer', department: 'Technical', color: '#9db5e7', initials: 'RJ', workspaceTags: ['all'], status: 'active', reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS', skillsCount: 15, memoryHealth: 24, level: 2 },
      { id: 'mia', name: 'Mia', role: 'Frontend Engineer', department: 'Technical', color: '#9db5e7', initials: 'MI', workspaceTags: ['all'], status: 'active', reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS', skillsCount: 17, memoryHealth: 27, level: 2 },
      { id: 'quinn', name: 'Quinn', role: 'QA Engineer', department: 'Technical', color: '#9db5e7', initials: 'QN', workspaceTags: ['all'], status: 'idle', reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS', skillsCount: 17, memoryHealth: 18, level: 2 },
    ],
  },
  {
    title: 'Venture Teams', sub: 'Per-workspace teams · marketing & growth',
    agents: [
      { id: 'kai', name: 'Kai', role: 'Analyst', department: 'Marketing', color: '#5fd0b4', initials: 'KA', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped', skillsCount: 13, memoryHealth: 39, level: 3 },
      { id: 'lena', name: 'Lena', role: 'Brand Strategist', department: 'Marketing', color: '#5fd0b4', initials: 'LN', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Diana', memoryAccess: 'workspace-scoped', skillsCount: 14, memoryHealth: 34, level: 3 },
      { id: 'rio', name: 'Rio', role: 'Ads Manager', department: 'Marketing', color: '#5ee0ff', initials: 'RO', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped', skillsCount: 14, memoryHealth: 19, level: 2 },
      { id: 'nate', name: 'Nate', role: 'Growth Hacker', department: 'Marketing', color: '#5ee0ff', initials: 'NT', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped', skillsCount: 11, memoryHealth: 32, level: 2 },
      { id: 'atlas', name: 'Atlas', role: 'Art Director', department: 'Marketing', color: '#c08bff', initials: 'AT', workspaceTags: ['novizio', 'hourbour'], status: 'active', reportsTo: 'Lena', memoryAccess: 'workspace-scoped', skillsCount: 13, memoryHealth: 16, level: 2 },
      { id: 'pixel', name: 'Pixel', role: 'Production', department: 'Marketing', color: '#c08bff', initials: 'PX', workspaceTags: ['novizio', 'hourbour'], status: 'idle', reportsTo: 'Atlas', memoryAccess: 'workspace-scoped', skillsCount: 12, memoryHealth: 15, level: 2 },
    ],
  },
]

// ─── Scanner ──────────────────────────────────────────────────────────────────

function scanAgents(): OrgChartAgent[] {
  const agentDeptPath = join(process.cwd(), '.toon', 'memory', 'agent-department')
  const agents: OrgChartAgent[] = []

  if (!existsSync(agentDeptPath)) return agents

  const depts = readdirSync(agentDeptPath, { withFileTypes: true }).filter(d => d.isDirectory())

  for (const dept of depts) {
    const deptPath = join(agentDeptPath, dept.name)
    const agentDirs = readdirSync(deptPath, { withFileTypes: true }).filter(a => {
      // Skip special directories that aren't agents
      if (a.name === 'docs' || a.name === 'shared') return false
      return a.isDirectory()
    })

    for (const agentDir of agentDirs) {
      const agentPath = join(deptPath, agentDir.name)
      const manifestPath = join(agentPath, 'manifest.toon')
      const skillsDir = join(agentPath, 'skills')
      const memoryPath = join(agentPath, 'MEMORY.md')

      let role = '', level = 1
      if (existsSync(manifestPath)) {
        try {
          const content = readFileSync(manifestPath, 'utf-8')
          const roleMatch = content.match(/title:\s*(.+)/)
          const levelMatch = content.match(/level:\s*(\d+)/)
          if (roleMatch) role = roleMatch[1].trim()
          if (levelMatch) level = parseInt(levelMatch[1])
        } catch {}
      }

      // Count skills
      let skillsCount = 0
      if (existsSync(skillsDir)) {
        function countSkills(dir: string) {
          if (!existsSync(dir)) return
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
              if (existsSync(join(dir, entry.name, 'SKILL.md'))) skillsCount++
              countSkills(join(dir, entry.name))
            }
          }
        }
        countSkills(skillsDir)
      }

      // Memory health
      let memoryHealth = 0
      if (existsSync(memoryPath)) {
        try {
          const kb = statSync(memoryPath).size / 1024
          memoryHealth = Math.min(100, Math.round((kb / 20) * 100))
        } catch {}
      }

      const name = agentDir.name.charAt(0).toUpperCase() + agentDir.name.slice(1)
      const deptName = dept.name

      agents.push({
        id: agentDir.name,
        name,
        role: role || deptName,
        department: deptName,
        color: DEPT_COLORS[deptName] || '#8b919f',
        initials: name.length > 3 ? name.slice(0, 2).toUpperCase() : name.slice(0, 2),
        workspaceTags: WORKSPACE_TAGS[deptName] || ['all'],
        status: 'idle',
        reportsTo: DEPT_REPORTS_TO[deptName] || 'Marcus',
        memoryAccess: DEPT_MEMORY[deptName] || 'workspace-scoped',
        skillsCount,
        memoryHealth,
        level,
      })
    }
  }

  return agents
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(): Promise<Response> {
  try {
    const allAgents = scanAgents()

    // Fallback: if filesystem scan finds nothing, return static mock data
    // so the UI never shows "0 agents"
    if (allAgents.length === 0) {
      return NextResponse.json({
        tiers: FALLBACK_TIERS,
        totalAgents: 12,
        departments: 4,
        workshops: WORKSHOPS,
      } as OrgChartResponse)
    }

    // Group into tiers
    const tierBuckets: Map<number, OrgChartAgent[]> = new Map()
    for (const a of allAgents) {
      const t = TIER_MAP[a.department] ?? 3
      if (!tierBuckets.has(t)) tierBuckets.set(t, [])
      tierBuckets.get(t)!.push(a)
    }

    const tiers: OrgChartTier[] = []
    for (let i = 0; i < TIER_LABELS.length; i++) {
      const agents = tierBuckets.get(i) || []
      if (agents.length > 0) {
        tiers.push({ ...TIER_LABELS[i], agents })
      }
    }

    // Workshop tier (displayed as a separate section on the page)
    tiers.push({
      title: 'Skill Workshops',
      sub: 'Continuously improves the masters',
      agents: [],
    })

    const departments = new Set(allAgents.map(a => a.department)).size

    return NextResponse.json({
      tiers,
      totalAgents: allAgents.length,
      departments,
      workshops: WORKSHOPS,
    } as OrgChartResponse)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
