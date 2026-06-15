// app/api/agent-ops/route.ts — Agent roster, skills, memory health, activity
// Reads from .toon/ filesystem for roster + skills, Supabase for activity
// Falls back gracefully when Supabase tables aren't populated yet

import { NextResponse } from 'next/server'
import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

interface AgentSkill { name: string; category: string }

interface AgentOpsAgent {
  id: string; name: string; role: string; department: string; level: number
  status: 'active' | 'idle' | 'offline'
  skillsCount: number; skills: AgentSkill[]; memorySize: string; memoryHealth: number
  lastActive: string | null
}

interface ActivityEntry {
  time: string; agent: string; task: string; tokens: number; duration: string; status: string
}

function scanAgents(): { agents: AgentOpsAgent[]; departments: { name: string; agentCount: number; skillsTotal: number }[]; skillsTotal: number } {
  const agentDeptPath = join(process.cwd(), '.toon', 'memory', 'agent-department')
  const agents: AgentOpsAgent[] = []
  const deptMap = new Map<string, { agentCount: number; skillsTotal: number }>()

  if (existsSync(agentDeptPath)) {
    const depts = readdirSync(agentDeptPath, { withFileTypes: true }).filter(d => d.isDirectory())

    for (const dept of depts) {
      const deptPath = join(agentDeptPath, dept.name)
      const agentDirs = readdirSync(deptPath, { withFileTypes: true }).filter(a => a.isDirectory())
      let deptSkillsTotal = 0

      for (const agentDir of agentDirs) {
        const agentPath = join(deptPath, agentDir.name)
        const manifestPath = join(agentPath, 'manifest.toon')
        const skillsDir = join(agentPath, 'skills')

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

        const skills: AgentSkill[] = []
        if (existsSync(skillsDir)) {
          function scanSkills(dir: string, category: string) {
            if (!existsSync(dir)) return
            const entries = readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
              if (entry.isDirectory()) {
                const skillMdPath = join(dir, entry.name, 'SKILL.md')
                if (existsSync(skillMdPath)) skills.push({ name: entry.name, category })
                scanSkills(join(dir, entry.name), category)
              }
            }
          }
          for (const cat of ['custom', 'operating-system', 'marketplace', 'executive-operations']) {
            scanSkills(join(skillsDir, cat), cat)
          }
        }

        const memoryPath = join(agentPath, 'MEMORY.md')
        let memorySize = '0 KB', memoryHealth = 0
        if (existsSync(memoryPath)) {
          try {
            const stats = statSync(memoryPath)
            const kb = stats.size / 1024
            memorySize = kb < 1 ? `${(kb * 1024).toFixed(0)} B` : `${kb.toFixed(0)} KB`
            memoryHealth = Math.min(100, Math.round((kb / 20) * 100))
          } catch {}
        }

        deptSkillsTotal += skills.length
        agents.push({
          id: `${agentDir.name}-${dept.name.toLowerCase()}`,
          name: agentDir.name.charAt(0).toUpperCase() + agentDir.name.slice(1),
          role: role || '—',
          department: dept.name,
          level,
          status: 'idle',
          skillsCount: skills.length,
          skills,
          memorySize,
          memoryHealth,
          lastActive: null,
        })
      }
      deptMap.set(dept.name, { agentCount: agentDirs.length, skillsTotal: deptSkillsTotal })
    }
  }

  const departments = Array.from(deptMap.entries()).map(([name, data]) => ({ name, ...data }))
  return { agents, departments, skillsTotal: agents.reduce((s, a) => s + a.skillsCount, 0) }
}

export async function GET(): Promise<Response> {
  try {
    // Agent roster from .toon/ filesystem (real, deployed in bundle)
    const { agents, departments, skillsTotal } = scanAgents()

    // Activity feed from Supabase (live, written by Hermes cron)
    const activity: ActivityEntry[] = []
    try {
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: liveActivity } = await supabase
        .from('agent_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (liveActivity && Array.isArray(liveActivity)) {
        for (const a of liveActivity) {
          activity.push({
            time: new Date(a.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            agent: a.agent_name,
            task: a.task,
            tokens: Number(a.tokens),
            duration: a.duration_sec ? `${Math.round(Number(a.duration_sec))}s` : '—',
            status: a.status || 'completed',
          })
        }
      }
    } catch {}

    return NextResponse.json({ agents, departments, skillsTotal, activity })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
