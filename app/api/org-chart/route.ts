// GET /api/org-chart
// Returns the full agent company hierarchy as a proper org tree.
// 24 agents · 8 departments · reporting lines · flat department tiers

import { NextResponse } from 'next/server'
import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrgChartAgent {
  id: string; name: string; role: string; department: string
  color: string; initials: string; status: string
  skillsCount: number; memoryHealth: number; level: number
  reportsTo: string; memoryAccess: string
  workspaceTags: string[]
}

export interface OrgChartNode {
  agent: OrgChartAgent
  children: OrgChartNode[]
}

export interface OrgChartTier {
  title: string; sub: string
  agents: OrgChartAgent[]         // flat list for card view
  nodes?: OrgChartNode[]           // optional tree for expandable view
}

export interface OrgChartResponse {
  tree: OrgChartNode               // full hierarchy tree
  tiers: OrgChartTier[]             // department-grouped tiers
  totalAgents: number
  departments: number
  workshops: WorkshopInfo[]
}

export interface WorkshopInfo {
  id: string; name: string; icon: string; color: string
  improving: string; agentIds: string[]
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  CEO: '#abc7ff', COO: '#5ee0ff', Command: '#c084fc',
  Technical: '#9db5e7', Marketing: '#5fd0b4',
  Finance: '#fbbf24', Legal: '#f59e0b',
  Psychology: '#ffb693', Research: '#a78bfa', Sense: '#34d399',
}

// ─── Department config (display name, subtitle) ──────────────────────────────

const DEPT_META: Record<string, { label: string; sub: string }> = {
  Executive:   { label: 'Executive Office',    sub: 'CEO · COO — serves you directly' },
  Governance:  { label: 'Governance',          sub: 'Board oversight & risk thresholds' },
  Technical:   { label: 'Technology',          sub: 'Everything that ships — build, deploy, QA' },
  Marketing:   { label: 'Marketing & Growth',  sub: 'Revenue, brand, content, growth' },
  Finance:     { label: 'Finance',             sub: 'Financial intelligence & planning' },
  Legal:       { label: 'Legal & Compliance',  sub: 'Compliance, contracts, guard rails' },
  Psychology:  { label: 'Psychology',          sub: 'Behavioral validation & cognitive bias review' },
  Research:    { label: 'Research',            sub: 'Deep research, synthesis, fact-checking' },
  Sense:       { label: 'Sense & Monitoring',  sub: 'Detection, reconnaissance, tooling' },
}

// ─── Agent registry — every agent with full metadata ─────────────────────────

interface AgentDef {
  id: string; name: string; role: string; department: string
  reportsTo: string; memoryAccess: string
  workspaceTags: string[]; level: number; status: string
}

const ALL_AGENTS: AgentDef[] = [
  // ── EXECUTIVE ──
  { id: 'marcus', name: 'Marcus', role: 'CEO', department: 'CEO',
    reportsTo: 'You', memoryAccess: 'full — cross-workspace',
    workspaceTags: ['all'], level: 1, status: 'active' },
  { id: 'diana', name: 'Diana', role: 'COO', department: 'COO',
    reportsTo: 'Marcus', memoryAccess: 'full — cross-workspace',
    workspaceTags: ['all'], level: 1, status: 'active' },

  // ── GOVERNANCE ──
  { id: 'board', name: 'Board', role: 'Board of Directors', department: 'Command',
    reportsTo: 'You', memoryAccess: 'oversight — cross-workspace',
    workspaceTags: ['all'], level: 0, status: 'active' },

  // ── TECHNICAL ──
  { id: 'dev', name: 'Dev', role: 'Lead Developer', department: 'Technical',
    reportsTo: 'Diana', memoryAccess: 'workspace + cross-WS',
    workspaceTags: ['all'], level: 3, status: 'active' },
  { id: 'raj', name: 'Raj', role: 'Backend Engineer', department: 'Technical',
    reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS',
    workspaceTags: ['all'], level: 2, status: 'active' },
  { id: 'mia', name: 'Mia', role: 'Frontend Engineer', department: 'Technical',
    reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS',
    workspaceTags: ['all'], level: 2, status: 'active' },
  { id: 'quinn', name: 'Quinn', role: 'QA Engineer', department: 'Technical',
    reportsTo: 'Dev', memoryAccess: 'workspace + cross-WS',
    workspaceTags: ['all'], level: 2, status: 'idle' },

  // ── MARKETING ──
  { id: 'lena', name: 'Lena', role: 'Brand Strategist', department: 'Marketing',
    reportsTo: 'Diana', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 3, status: 'active' },
  { id: 'kai', name: 'Kai', role: 'Analyst', department: 'Marketing',
    reportsTo: 'Lena', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 3, status: 'active' },
  { id: 'rio', name: 'Rio', role: 'Ads Manager', department: 'Marketing',
    reportsTo: 'Lena', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 2, status: 'active' },
  { id: 'nate', name: 'Nate', role: 'Growth Hacker', department: 'Marketing',
    reportsTo: 'Lena', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 2, status: 'active' },
  { id: 'atlas', name: 'Atlas', role: 'Art Director', department: 'Marketing',
    reportsTo: 'Lena', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 2, status: 'active' },
  { id: 'pixel', name: 'Pixel', role: 'Production Artist', department: 'Marketing',
    reportsTo: 'Atlas', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 2, status: 'idle' },

  // ── FINANCE ──
  { id: 'felix', name: 'Felix', role: 'Financial Intelligence', department: 'Finance',
    reportsTo: 'Diana', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 3, status: 'active' },

  // ── LEGAL ──
  { id: 'comply', name: 'Comply', role: 'Compliance Officer', department: 'Legal',
    reportsTo: 'Diana', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 2, status: 'active' },
  { id: 'guard', name: 'Guard', role: 'Legal Guardian', department: 'Legal',
    reportsTo: 'Comply', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 2, status: 'active' },
  { id: 'docs', name: 'Docs', role: 'Documentation & Contracts', department: 'Legal',
    reportsTo: 'Comply', memoryAccess: 'workspace-scoped',
    workspaceTags: ['novizio', 'hourbour'], level: 2, status: 'active' },

  // ── PSYCHOLOGY ──
  { id: 'Daniel_Kahneman', name: 'Kahneman', role: 'Cognitive Bias Validator', department: 'Psychology',
    reportsTo: 'Diana', memoryAccess: 'cross-workspace validator',
    workspaceTags: ['all'], level: 3, status: 'active' },

  // ── RESEARCH ──
  { id: 'depth', name: 'Depth', role: 'Deep Researcher', department: 'Research',
    reportsTo: 'Diana', memoryAccess: 'cross-workspace',
    workspaceTags: ['all'], level: 2, status: 'active' },
  { id: 'synth', name: 'Synth', role: 'Synthesis', department: 'Research',
    reportsTo: 'Depth', memoryAccess: 'cross-workspace',
    workspaceTags: ['all'], level: 2, status: 'active' },
  { id: 'vette', name: 'Vette', role: 'Fact-Checker', department: 'Research',
    reportsTo: 'Depth', memoryAccess: 'cross-workspace',
    workspaceTags: ['all'], level: 2, status: 'active' },

  // ── SENSE ──
  { id: 'forge', name: 'Forge', role: 'Toolsmith', department: 'Sense',
    reportsTo: 'Diana', memoryAccess: 'cross-workspace',
    workspaceTags: ['all'], level: 2, status: 'active' },
  { id: 'radar', name: 'Radar', role: 'Monitoring', department: 'Sense',
    reportsTo: 'Forge', memoryAccess: 'cross-workspace',
    workspaceTags: ['all'], level: 2, status: 'active' },
  { id: 'scout', name: 'Scout', role: 'Reconnaissance', department: 'Sense',
    reportsTo: 'Forge', memoryAccess: 'cross-workspace',
    workspaceTags: ['all'], level: 2, status: 'active' },
]

// ─── Workshops ────────────────────────────────────────────────────────────────

const WORKSHOPS: WorkshopInfo[] = [
  { id: 'william', name: "William's Workshop", icon: '✍️', color: '#a78bfa',
    improving: 'Copywriting & brand voice', agentIds: ['lena', 'rio', 'nate'] },
  { id: 'leonardo', name: "Leonardo's Workshop", icon: '🎨', color: '#f472b6',
    improving: 'Image generation & brand kit', agentIds: ['atlas', 'pixel', 'mia'] },
  { id: 'isaac', name: "Isaac's Workshop", icon: '🔬', color: '#34d399',
    improving: 'Research quality & sources', agentIds: ['kai', 'depth', 'synth', 'vette'] },
  { id: 'nexus', name: "Nexus's Workshop", icon: '💻', color: '#60a5fa',
    improving: 'Code quality & PR reviews', agentIds: ['dev', 'raj', 'quinn'] },
  { id: 'lena-ws', name: "Lena's Workshop", icon: '💫', color: '#fbbf24',
    improving: 'Brand strategy & tone', agentIds: ['lena', 'diana'] },
  { id: 'kai-ws', name: "Kai's Workshop", icon: '📊', color: '#fb923c',
    improving: 'Analytics & intelligence', agentIds: ['kai', 'felix'] },
]

// ─── Filesystem scanner ───────────────────────────────────────────────────────

// Agent ID → directory name (some folders use full names)
const ID_TO_DIR: Record<string, string> = {
  Daniel_Kahneman: 'Daniel_Kahneman',
  // most agents use short IDs matching their directory name
}

function scanAgent(def: AgentDef): OrgChartAgent {
  const dirName = ID_TO_DIR[def.id] || def.id
  const basePath = join(process.cwd(), '.toon', 'memory', 'agent-department')
  const agentPath = join(basePath, def.department, dirName)

  let skillsCount = 0
  if (existsSync(agentPath)) {
    const skillsDir = join(agentPath, 'skills')
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
  }

  let memoryHealth = 0
  if (existsSync(agentPath)) {
    const memPath = join(agentPath, 'MEMORY.md')
    if (existsSync(memPath)) {
      try {
        const kb = statSync(memPath).size / 1024
        memoryHealth = Math.min(100, Math.round((kb / 20) * 100))
      } catch {}
    }
  }

  // Override role/level from manifest if available
  let role = def.role, level = def.level
  if (existsSync(agentPath)) {
    const manifestPath = join(agentPath, 'manifest.toon')
    if (existsSync(manifestPath)) {
      try {
        const content = readFileSync(manifestPath, 'utf-8')
        const roleMatch = content.match(/title:\s*(.+)/)
        const levelMatch = content.match(/level:\s*(\d+)/)
        if (roleMatch && roleMatch[1].trim() !== '--') role = roleMatch[1].trim()
        if (levelMatch) level = parseInt(levelMatch[1])
      } catch {}
    }
  }

  return {
    id: def.id, name: def.name, role, department: def.department,
    color: DEPT_COLORS[def.department] || '#8b919f',
    initials: def.name.length > 3 ? def.name.slice(0, 2).toUpperCase() : def.name.slice(0, 2).toUpperCase(),
    skillsCount, memoryHealth, level,
    status: def.status, reportsTo: def.reportsTo,
    memoryAccess: def.memoryAccess, workspaceTags: def.workspaceTags,
  }
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildFullTree(): { tree: OrgChartNode; allAgents: OrgChartAgent[] } {
  // Fresh maps on every call — no module-level state accumulation
  const agentMap = new Map<string, OrgChartAgent>()
  const childrenMap = new Map<string, string[]>()

  for (const def of ALL_AGENTS) {
    const agent = scanAgent(def)
    agentMap.set(def.id, agent)

    const parentId = def.reportsTo === 'You' ? 'root' : def.reportsTo.toLowerCase()
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, [])
    childrenMap.get(parentId)!.push(def.id)
  }

  // Recursively build tree nodes
  function buildNode(id: string): OrgChartNode | null {
    const agent = agentMap.get(id)
    if (!agent) return null

    const childIds = childrenMap.get(id) || []
    const children = childIds
      .map(cid => buildNode(cid))
      .filter(Boolean) as OrgChartNode[]

    return { agent, children }
  }

  const marcusNode = buildNode('marcus')!
  const boardAgent = agentMap.get('board')

  // Collect all unique agents from the tree + board
  const allAgents: OrgChartAgent[] = []

  function collectAll(node: OrgChartNode) {
    allAgents.push(node.agent)
    for (const child of node.children) collectAll(child)
  }
  collectAll(marcusNode)

  // Board is a peer of Marcus at root level
  if (boardAgent) allAgents.push(boardAgent)

  return { tree: marcusNode, allAgents }
}

// ─── Tier builder (flat department groups) ────────────────────────────────────

// Grouping: which departments map to which display tiers
const TIER_GROUPS: { tierId: string; depts: string[] }[] = [
  { tierId: 'Executive',  depts: ['CEO', 'COO'] },
  { tierId: 'Governance', depts: ['Command'] },
  { tierId: 'Technical',  depts: ['Technical'] },
  { tierId: 'Marketing',  depts: ['Marketing'] },
  { tierId: 'Finance',    depts: ['Finance'] },
  { tierId: 'Legal',      depts: ['Legal'] },
  { tierId: 'Psychology', depts: ['Psychology'] },
  { tierId: 'Research',   depts: ['Research'] },
  { tierId: 'Sense',      depts: ['Sense'] },
]

function buildTiers(agents: OrgChartAgent[]): OrgChartTier[] {
  const tiers: OrgChartTier[] = []

  for (const group of TIER_GROUPS) {
    const tierAgents = agents.filter(a => group.depts.includes(a.department))
    if (tierAgents.length === 0) continue

    const meta = DEPT_META[group.tierId] || { label: group.tierId, sub: '' }
    tiers.push({
      title: meta.label,
      sub: `${meta.sub} · ${tierAgents.length} agent${tierAgents.length !== 1 ? 's' : ''}`,
      agents: tierAgents,
    })
  }

  return tiers
}

// ─── Fallback (when filesystem scan fails) ────────────────────────────────────

function buildFallbackAgents(): OrgChartAgent[] {
  return ALL_AGENTS.map(def => ({
    id: def.id, name: def.name, role: def.role, department: def.department,
    color: DEPT_COLORS[def.department] || '#8b919f',
    initials: def.name.length > 3 ? def.name.slice(0, 2).toUpperCase() : def.name.slice(0, 2).toUpperCase(),
    skillsCount: 0, memoryHealth: 50, level: def.level,
    status: def.status, reportsTo: def.reportsTo,
    memoryAccess: def.memoryAccess, workspaceTags: def.workspaceTags,
  }))
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(): Promise<Response> {
  try {
    const { tree, allAgents } = buildFullTree()

    const tiers = buildTiers(allAgents)
    const departments = new Set(allAgents.map(a => a.department)).size

    return NextResponse.json({
      tree,
      tiers,
      totalAgents: allAgents.length,
      departments,
      workshops: WORKSHOPS,
    } as OrgChartResponse)
  } catch (err: any) {
    console.error('Org chart error:', err)
    const fallbackAgents = buildFallbackAgents()
    return NextResponse.json({
      tree: { agent: fallbackAgents[0], children: [] },
      tiers: buildTiers(fallbackAgents),
      totalAgents: fallbackAgents.length,
      departments: new Set(fallbackAgents.map(a => a.department)).size,
      workshops: WORKSHOPS,
    } as OrgChartResponse)
  }
}
