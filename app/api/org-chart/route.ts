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
