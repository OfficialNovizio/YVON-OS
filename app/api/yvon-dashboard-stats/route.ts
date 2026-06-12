import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Lightweight stats — no heavy deps, works on Vercel serverless
export async function GET() {
  const modules = getModuleStatus()
  const agents = getAgentSummary()
  const toonStats = getToonStats()
  const cieStats = getCieStats()
  const costSummary = getCostSummary()

  return NextResponse.json({
    type: 'stats',
    modules,
    agents,
    toon: toonStats,
    cie: cieStats,
    cost: costSummary,
    connected: true,
    timestamp: Date.now(),
  })
}

function getModuleStatus() {
  const modules: { name: string; connected: boolean; details: string }[] = [
    { name: 'Next.js', connected: true, details: 'v15' },
    { name: 'TypeScript', connected: true, details: 'strict' },
    { name: 'Tailwind', connected: true, details: 'v4' },
    { name: 'Supabase', connected: !!process.env.SUPABASE_URL, details: process.env.SUPABASE_URL ? 'Connected' : 'Not configured' },
    { name: 'DeepSeek', connected: !!process.env.DEEPSEEK_API_KEY, details: 'v4 Pro' },
    { name: 'Graphify', connected: existsSync(join(process.cwd(), 'graphify-out', 'GRAPH_REPORT.md')), details: 'Built-in' },
    { name: 'Codegraph', connected: existsSync(join(process.cwd(), 'graphify-out', 'CODEGRAPH_REPORT.md')), details: 'Built-in' },
    { name: 'Code-Review-Graph', connected: true, details: 'Built-in regex engine' },
    { name: 'Hermes', connected: existsSync(join(process.env.HOME || '/root', '.hermes', 'memories', 'USER.md')), details: 'Agent sync' },
    { name: 'yvon-engine', connected: true, details: 'v1.3.1' },
  ]
  return modules
}

function getAgentSummary() {
  const agents = [
    { agentId: 'marcus-ceo', name: 'Marcus', department: 'CEO', status: 'online' },
    { agentId: 'diana-coo', name: 'Diana', department: 'COO', status: 'online' },
    { agentId: 'dev-lead', name: 'Dev Lead', department: 'Technical', status: 'idle' },
    { agentId: 'raj-backend', name: 'Raj', department: 'Technical', status: 'idle' },
    { agentId: 'mia-frontend', name: 'Mia', department: 'Technical', status: 'idle' },
    { agentId: 'quinn-qa', name: 'Quinn', department: 'Technical', status: 'idle' },
    { agentId: 'kai-analyst', name: 'Kai', department: 'Marketing', status: 'idle' },
    { agentId: 'lena-brand', name: 'Lena', department: 'Marketing', status: 'idle' },
    { agentId: 'rio-ads', name: 'Rio', department: 'Marketing', status: 'idle' },
    { agentId: 'nate-growth', name: 'Nate', department: 'Marketing', status: 'idle' },
    { agentId: 'atlas-art-director', name: 'Atlas', department: 'Marketing', status: 'idle' },
    { agentId: 'pixel-production', name: 'Pixel', department: 'Marketing', status: 'idle' },
    { agentId: 'felix-finance', name: 'Felix', department: 'Finance', status: 'online' },
  ]

  // Try loading yvon-engine metrics if available
  try {
    const engine = require('yvon-engine')
    if (engine.metrics?.getAllAgentActivities) {
      const activities = engine.metrics.getAllAgentActivities()
      if (activities.length > 0) {
        return activities.map((a: any) => ({
          agentId: a.agentId,
          name: a.name || a.agentId,
          department: a.department || 'Unknown',
          status: a.status || 'idle',
        }))
      }
    }
  } catch {}

  return agents
}

function getToonStats() {
  try {
    const engine = require('yvon-engine')
    if (engine.metrics?.getToonStats) {
      return engine.metrics.getToonStats()
    }
  } catch {}
  return { avgSavingsPercent: 84.5, total: 0, totalCostSaved: 0 }
}

function getCieStats() {
  try {
    const engine = require('yvon-engine')
    if (engine.metrics?.getCieStats) {
      return engine.metrics.getCieStats()
    }
  } catch {}
  return { totalTicks: 0, avgLatencyMs: 0, skipRate: 0 }
}

function getCostSummary() {
  try {
    const engine = require('yvon-engine')
    if (engine.metrics?.getCostSummary) {
      return engine.metrics.getCostSummary()
    }
  } catch {}
  return { totalSpent: 0, totalSaved: 0 }
}
