// GET /api/skill-workshop
// Returns workshop training data: stats, agent progress, recent runs, improvement queue.
// Reads training history from Supabase training_runs table, agent skills from filesystem.

import { NextResponse } from 'next/server'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainingRun {
  id: number; timestamp: string; prompt: string; score: number
  passed: boolean; areasImproved: string[]; modelUsed: string
}

interface WorkshopAgent {
  id: string; name: string; initials: string; department: string
  workshopTitle: string; description: string
  accentColor: string; accentBg: string
  level: number; progressPercent: number
  skillsCount: number
  recentRuns: TrainingRun[]
}

interface WorkshopData {
  agents: WorkshopAgent[]
  stats: {
    totalRunsThisWeek: number; skillsPromoted: number
    activeSessions: number; averageScore: number
  }
  improvementQueue: {
    agentName: string; skillName: string; score: number
    threshold: number; lastAttempted: string; workshopId: string
  }[]
}

// ─── Workshop definitions ─────────────────────────────────────────────────────

interface WorkshopDef {
  id: string; name: string; icon: string; color: string
  accentBg: string; improving: string
  agentIds: string[]  // filesystem agent ids (lowercase dir names)
}

const WORKSHOPS: WorkshopDef[] = [
  { id: 'william', name: 'William', icon: '✍️', color: '#a78bfa', accentBg: 'rgba(167,139,250,0.12)', improving: 'Better copywriting & brand voice', agentIds: ['lena', 'rio', 'nate'] },
  { id: 'leonardo', name: 'Leonardo', icon: '🎨', color: '#f472b6', accentBg: 'rgba(244,114,182,0.12)', improving: 'Better image generation & brand kit', agentIds: ['atlas', 'pixel', 'mia'] },
  { id: 'isaac', name: 'Isaac', icon: '🔬', color: '#34d399', accentBg: 'rgba(52,211,153,0.12)', improving: 'Better research quality & sources', agentIds: ['kai', 'depth', 'synth', 'vette'] },
  { id: 'nexus', name: 'Nexus', icon: '💻', color: '#60a5fa', accentBg: 'rgba(96,165,250,0.12)', improving: 'Better code quality & PR reviews', agentIds: ['dev', 'raj', 'quinn'] },
  { id: 'lena-ws', name: 'Lena', icon: '💫', color: '#fbbf24', accentBg: 'rgba(251,191,36,0.12)', improving: 'Better brand strategy & tone', agentIds: ['lena', 'diana'] },
  { id: 'kai-ws', name: 'Kai', icon: '📊', color: '#fb923c', accentBg: 'rgba(251,146,60,0.12)', improving: 'Better analytics & intelligence', agentIds: ['kai', 'felix'] },
]

const WORKSHOP_TITLES: Record<string, string> = {
  william: 'Copywriting Workshop',
  leonardo: 'Image Workshop',
  isaac: 'Research Workshop',
  nexus: 'Code Workshop',
  'lena-ws': 'Brand Workshop',
  'kai-ws': 'Analytics Workshop',
}

// ─── Agent name lookup ────────────────────────────────────────────────────────

function getAgentNameMap(): Map<string, { name: string; dept: string }> {
  const map = new Map<string, { name: string; dept: string }>()
  const basePath = join(process.cwd(), '.toon', 'memory', 'agent-department')
  if (!existsSync(basePath)) return map

  for (const dept of readdirSync(basePath, { withFileTypes: true }).filter(d => d.isDirectory())) {
    const deptPath = join(basePath, dept.name)
    if (!existsSync(deptPath)) continue
    for (const agent of readdirSync(deptPath, { withFileTypes: true }).filter(a => a.isDirectory())) {
      map.set(agent.name, {
        name: agent.name.charAt(0).toUpperCase() + agent.name.slice(1),
        dept: dept.name,
      })
    }
  }
  return map
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(): Promise<Response> {
  try {
    const agentMap = getAgentNameMap()
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch recent training runs from Supabase
    let allRuns: any[] = []
    try {
      const { data } = await supabase
        .from('training_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) allRuns = data
    } catch {}

    // Fetch this week's runs
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const weekRuns = allRuns.filter(r => r.created_at >= weekAgo)
    const promotedCount = weekRuns.filter(r => r.passed && r.score >= 80).length

    // Build workshop agents
    const agents: WorkshopAgent[] = WORKSHOPS.map(ws => {
      const wsRuns = allRuns.filter(r => r.workshop_id === ws.id)
      const recentRuns: TrainingRun[] = wsRuns.slice(0, 5).map(r => ({
        id: r.id,
        timestamp: timeAgo(r.created_at),
        prompt: r.prompt?.slice(0, 80) || '—',
        score: Number(r.score) || 0,
        passed: Boolean(r.passed),
        areasImproved: Array.isArray(r.areas_improved) ? r.areas_improved : [],
        modelUsed: r.model_used || 'deepseek-chat',
      }))

      // Calculate progress from pass rate
      const passRate = wsRuns.length > 0
        ? Math.round((wsRuns.filter(r => r.passed).length / wsRuns.length) * 100)
        : 0

      // Count skills from filesystem for agents in this workshop
      let skillsCount = 0
      for (const aid of ws.agentIds) {
        const info = agentMap.get(aid)
        if (info) {
          const skillsDir = join(process.cwd(), '.toon', 'memory', 'agent-department', info.dept, aid, 'skills')
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
      }

      return {
        id: ws.id,
        name: ws.name,
        initials: ws.name.slice(0, 2),
        department: 'Workshop',
        workshopTitle: WORKSHOP_TITLES[ws.id] || `${ws.name}'s Workshop`,
        description: ws.improving,
        accentColor: ws.color,
        accentBg: ws.accentBg,
        level: wsRuns.length > 10 ? 4 : wsRuns.length > 5 ? 3 : wsRuns.length > 0 ? 2 : 1,
        progressPercent: passRate,
        skillsCount,
        recentRuns,
      }
    })

    // Stats
    const stats = {
      totalRunsThisWeek: weekRuns.length,
      skillsPromoted: promotedCount,
      activeSessions: 0,
      averageScore: weekRuns.length > 0
        ? Math.round(weekRuns.reduce((s: number, r: any) => s + (Number(r.score) || 0), 0) / weekRuns.length)
        : 0,
    }

    // Improvement queue: runs below 80 that haven't been retried in 24h
    const threshold = 80
    const now = Date.now()
    const improvementQueue = allRuns
      .filter(r => !r.passed && (Number(r.score) || 0) < threshold)
      .filter(r => now - new Date(r.created_at).getTime() > 3600000) // older than 1h
      .slice(0, 5)
      .map((r, idx) => ({
        agentName: agentMap.get(r.agent_name?.toLowerCase())?.name || r.agent_name || 'Unknown',
        skillName: r.prompt?.slice(0, 40) || 'Unknown skill',
        score: Number(r.score) || 0,
        threshold,
        lastAttempted: timeAgo(r.created_at),
        workshopId: r.workshop_id,
      }))

    return NextResponse.json({
      agents,
      stats,
      improvementQueue,
    } as WorkshopData)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  if (!iso) return '—'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${diff < 7200 ? '' : 's'} ago`
  return `${Math.floor(diff / 86400)} day${diff < 172800 ? '' : 's'} ago`
}
