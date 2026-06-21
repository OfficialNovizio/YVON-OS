// app/api/ventures-health/route.ts — v4 local-first
// Reads from local .toon/ directory (created by npx toongine init)
// Falls back to Supabase if credentials are configured

import { NextRequest, NextResponse } from 'next/server'
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
          const skills = fs.readdirSync(agentPath).filter(f => f.endsWith('.md'))
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
      departments[dept] = count
    }
  } catch {}
  return { total: agents.length, departments, agents }
}

function getGraphStats(cwd: string) {
  const graphifyReport = safeRead(path.join(cwd, '.toon', 'graphify', 'GRAPH_REPORT.md'))
  const codegraphReport = safeRead(path.join(cwd, '.toon', 'codegraph', 'CODEGRAPH_REPORT.md'))
  return {
    graphifySize: graphifyReport?.length || 0,
    codegraphSize: codegraphReport?.length || 0,
    hasGraphify: !!graphifyReport,
    hasCodegraph: !!codegraphReport,
  }
}

export async function GET(req: NextRequest) {
  const cwd = process.cwd()
  const config = safeJson(path.join(cwd, '.toon', 'config.json'))
  const toongineConfig = safeJson(path.join(cwd, 'toongine.config.json'))

  const venture = config?.venture || toongineConfig?.venture || 'yvon'
  const agentsDir = path.join(cwd, '.toon', 'agents')
  const { total: agentsTotal, departments, agents } = countAgents(agentsDir)
  const graphs = getGraphStats(cwd)

  const hasClaudeMD = !!safeRead(path.join(cwd, 'CLAUDE.md'))
  const hasHermes = !!safeRead(path.join(require('os').homedir(), '.hermes', 'memories', 'USER.md'))

  // Try Supabase for live data
  let supabaseData = null
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase.from('toongine_activity_log').select('*').limit(10)
    if (data?.length) supabaseData = data
  } catch {}

  return NextResponse.json({
    initialized: true,
    venture,
    source: supabaseData ? 'supabase' : 'local',
    kpi: {
      score: 85,
      status: 'healthy',
      tokensTotal: supabaseData ? (supabaseData as any).reduce((s: number, a: any) => s + (a.tokens_in || 0) + (a.tokens_out || 0), 0) : 0,
      costTotal: 0,
      sessionsTotal: supabaseData?.length || 0,
      avgTokensPerCall: 0,
      avgCostPerCall: 0,
      agentsActive: agentsTotal,
      agentsTotal,
      lastCheck: new Date().toISOString(),
    },
    hourlyBurn: [],
    leaderboard: [],
    agents,
    departments: Object.entries(departments).map(([name, agentCount]) => ({ name, agentCount })),
    issues: { total: 0, critical: 0, high: 0, open: 0 },
    providers: [],
    activity: [],
    graphs: {
      graphify: graphs.hasGraphify ? `${(graphs.graphifySize / 1024).toFixed(1)} KB` : 'not built',
      codegraph: graphs.hasCodegraph ? `${(graphs.codegraphSize / 1024).toFixed(1)} KB` : 'not built',
    },
    checks: {
      agents: agentsTotal > 0,
      graphify: graphs.hasGraphify,
      codegraph: graphs.hasCodegraph,
      claudeMD: hasClaudeMD,
      hermes: hasHermes,
    },
  })
}
