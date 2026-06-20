// app/api/agent-ops/route.ts — Agent roster, skills, memory health, activity
// Reads from .toon/ filesystem for roster + skills, ToonGine Supabase for live data
// Falls back to embedded agent registry when offline

import { NextResponse } from 'next/server'
import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'
import { getAgentRegistry } from '@/lib/agent-registry'

// Dynamic import — works when toongine IS installed, graceful when not
let toonPlugin: any = null
async function getToonPlugin() {
  if (toonPlugin) return toonPlugin
  try {
    toonPlugin = await import('toongine/plugins/supabase')
  } catch {
    toonPlugin = { isConfigured: () => false }
  }
  return toonPlugin
}

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
  const agentDeptPath = join(process.cwd(), '.toon', 'agents')
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
    const plugin = await getToonPlugin()

    // Layer 1: Filesystem (.toon/agents/)
    let { agents, departments, skillsTotal } = scanAgents()

    // Layer 2: ToonGine Supabase (live agent data)
    if (agents.length === 0 && plugin.isConfigured()) {
      try {
        const toonAgents = await plugin.getAgents()
        if (toonAgents.length > 0) {
          agents = toonAgents.map((a: any) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            department: a.department,
            level: a.level,
            status: a.status || 'idle',
            skillsCount: a.skills_count || 0,
            skills: a.skills || [],
            memorySize: a.memory_size || '0 KB',
            memoryHealth: a.memory_health || 0,
            lastActive: a.last_active || null,
          }))
          const toonDepts = await plugin.getDepartments()
          if (toonDepts.length > 0) {
            departments = toonDepts.map((d: any) => ({
              name: d.name,
              agentCount: d.agent_count || 0,
              skillsTotal: d.skills_total || 0,
            }))
          }
          skillsTotal = agents.reduce((s: number, a: AgentOpsAgent) => s + a.skillsCount, 0)
        }
      } catch {}
    }

    // Layer 3: Embedded registry (static fallback)
    if (agents.length === 0) {
      const registry = getAgentRegistry()
      agents = registry.agents.map((a: any) => ({
        ...a,
        status: 'idle' as const,
        skills: [] as AgentSkill[],
        lastActive: null,
      }))
      departments = registry.departments
      skillsTotal = registry.skillsTotal
    }

    // Activity feed — ToonGine Supabase (real token-tracked activity)
    let activity: ActivityEntry[] = []
    if (plugin.isConfigured()) {
      try {
        const toonActivity = await plugin.getActivity(20)
        activity = toonActivity.map((a: any) => ({
          time: new Date(a.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          agent: a.agent_name || 'Unknown',
          task: a.task || '—',
          tokens: Number(a.tokens) || 0,
          duration: a.duration_sec ? `${Math.round(Number(a.duration_sec))}s` : '—',
          status: a.status || 'completed',
        }))
      } catch {}
    }

    return NextResponse.json({ agents, departments, skillsTotal, activity })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
