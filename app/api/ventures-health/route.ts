// app/api/ventures-health/route.ts — v5
// OS agents (no venture param) → Settings page
// Venture agents (?venture=novizio) → Agents tab in sidebar

import { NextRequest, NextResponse } from 'next/server'
import { PROJECTS, ProjectConfig } from '@/lib/projects'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function safeRead(filePath: string): string | null {
  try { return fs.readFileSync(filePath, 'utf-8') } catch { return null }
}

function safeJson(filePath: string): any | null {
  try { return JSON.parse(safeRead(filePath) || '') } catch { return null }
}

function countAgents(agentsDir: string): { total: number; departments: Record<string, number>; agents: any[] } {
  const departments: Record<string, number> = {}
  const agents: any[] = []
  try {
    for (const dept of fs.readdirSync(agentsDir)) {
      const deptPath = path.join(agentsDir, dept)
      if (!fs.statSync(deptPath).isDirectory()) continue
      let count = 0
      for (const agent of fs.readdirSync(deptPath)) {
        const agentPath = path.join(deptPath, agent)
        if (fs.statSync(agentPath).isDirectory()) {
          count++
          const memory = safeRead(path.join(agentPath, 'MEMORY.md'))
          const skills = fs.readdirSync(agentPath).filter(f => f.endsWith('.md') || f === 'SKILL.md')
          agents.push({
            name: agent,
            role: dept,
            department: dept,
            status: 'active',
            skillsCount: skills.length,
            memoryHealth: memory ? Math.min(100, Math.round(memory.length / 100)) : 0,
          })
        }
      }
      if (count > 0) departments[dept] = count
    }
  } catch {}
  return { total: agents.length, departments, agents }
}

function readLocalToon(projectPath: string) {
  const config = safeJson(path.join(projectPath, '.toon', 'config.json'))
  const agentsDir = path.join(projectPath, '.toon', 'agents')
  const { total, departments, agents } = countAgents(agentsDir)
  const graphify = safeRead(path.join(projectPath, '.toon', 'graphify', 'GRAPH_REPORT.md'))
  const codegraph = safeRead(path.join(projectPath, '.toon', 'codegraph', 'CODEGRAPH_REPORT.md'))
  const hasClaudeMD = !!safeRead(path.join(projectPath, 'CLAUDE.md'))
  return {
    venture,
    agentsTotal: total,
    departments,
    agents,
    graphs: {
      graphify: graphify ? `${(graphify.length / 1024).toFixed(1)} KB` : 'not built',
      codegraph: codegraph ? `${(codegraph.length / 1024).toFixed(1)} KB` : 'not built',
    },
    checks: {
      agents: total > 0,
      graphify: !!graphify,
      codegraph: !!codegraph,
      claudeMD: hasClaudeMD,
    },
  }
}

async function fetchGitHubToon(owner: string, repo: string, branch: string) {
  const token = process.env.GITHUB_TOKEN || process.env.YVON_GITHUB_TOKEN
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' }
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const configRes = await fetch(
      { headers }
    )
    const configData = configRes.ok ? await configRes.json() : null
    const config = configData?.content
      ? JSON.parse(Buffer.from(configData.content, 'base64').toString())
      : null

    // Fetch agent tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    )
    const treeData = treeRes.ok ? await treeRes.json() : null
    const agentPaths = (treeData?.tree || [])
      .map((t: any) => t.path)

    const departments: Record<string, number> = {}
    const agents: any[] = []
    const seen = new Set<string>()
    for (const p of agentPaths) {
      const parts = p.split('/')
      if (parts.length >= 4) {
        const dept = parts[2]
        const agent = parts[3]
        const key = `${dept}/${agent}`
        if (!seen.has(key)) {
          seen.add(key)
          departments[dept] = (departments[dept] || 0) + 1
          agents.push({ name: agent, role: dept, department: dept, status: 'active', skillsCount: 0, memoryHealth: 0 })
        }
      }
    }

    return {
      venture: repo,
      agentsTotal: agents.length,
      departments,
      agents,
      graphs: { graphify: 'unknown', codegraph: 'unknown' },
      checks: { agents: agents.length > 0, graphify: false, codegraph: false, claudeMD: false },
      source: 'github',
    }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const ventureParam = req.nextUrl.searchParams.get('venture') || ''

  // ── OS Agents (no venture param) → Settings page ──────────────────────
  if (!ventureParam) {
    const cwd = process.cwd()
    const local = readLocalToon(cwd)
    return NextResponse.json({
      initialized: local.agentsTotal > 0,
      venture: 'YVON OS',
      source: 'local',
      kpi: {
        score: 85,
        status: 'healthy',
        tokensTotal: 0, costTotal: 0, sessionsTotal: 0,
        avgTokensPerCall: 0, avgCostPerCall: 0,
        agentsActive: local.agentsTotal,
        agentsTotal: local.agentsTotal,
        lastCheck: new Date().toISOString(),
      },
      ...local,
      hourlyBurn: [], leaderboard: [], issues: { total: 0, critical: 0, high: 0, open: 0 },
      providers: [], activity: [],
    })
  }

  // ── Venture Agents → Agents tab ───────────────────────────────────────
  const project = PROJECTS.find(p => p.id === ventureParam)
  if (!project) {
    return NextResponse.json({ initialized: false, error: `Unknown venture: ${ventureParam}` })
  }

  // Try local path first
  if (project.localPath && fs.existsSync(project.localPath)) {
    const local = readLocalToon(project.localPath)
    return NextResponse.json({
      initialized: local.agentsTotal > 0,
      venture: ventureParam,
      source: 'local',
      kpi: {
        score: 85, status: 'healthy',
        tokensTotal: 0, costTotal: 0, sessionsTotal: 0,
        avgTokensPerCall: 0, avgCostPerCall: 0,
        agentsActive: local.agentsTotal,
        agentsTotal: local.agentsTotal,
        lastCheck: new Date().toISOString(),
      },
      ...local,
      hourlyBurn: [], leaderboard: [], issues: { total: 0, critical: 0, high: 0, open: 0 },
      providers: [], activity: [],
    })
  }

  // Fall back to GitHub API
  const [owner, repo] = project.githubRepo.split('/')
  const github = await fetchGitHubToon(owner, repo, project.mainBranch)
  if (github) {
    return NextResponse.json({
      initialized: true,
      venture: ventureParam,
      source: 'github',
      kpi: {
        score: 85, status: 'healthy',
        tokensTotal: 0, costTotal: 0, sessionsTotal: 0,
        avgTokensPerCall: 0, avgCostPerCall: 0,
        agentsActive: github.agentsTotal,
        agentsTotal: github.agentsTotal,
        lastCheck: new Date().toISOString(),
      },
      ...github,
      hourlyBurn: [], leaderboard: [], issues: { total: 0, critical: 0, high: 0, open: 0 },
      providers: [], activity: [],
    })
  }

  return NextResponse.json({
    initialized: false,
    venture: ventureParam,
    kpi: null,
  })
}
