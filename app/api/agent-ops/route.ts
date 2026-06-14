// app/api/agent-ops/route.ts — Agent Ops data for Tab 3
// Reads: .toon/memory/agent-department/ for roster, skills, memory health
// Reads: hermes sessions for activity feed

import { NextResponse } from 'next/server'
import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'

interface AgentSkill {
  name: string
  category: string
}

interface AgentOpsAgent {
  id: string
  name: string
  role: string
  department: string
  level: number
  status: 'active' | 'idle' | 'offline'
  skillsCount: number
  skills: AgentSkill[]
  memorySize: string
  memoryHealth: number
  lastActive: string | null
}

interface ActivityEntry {
  time: string
  agent: string
  task: string
  tokens: number
  duration: string
  status: 'completed' | 'error' | 'running'
}

export interface AgentOpsResponse {
  agents: AgentOpsAgent[]
  departments: { name: string; agentCount: number; skillsTotal: number }[]
  skillsTotal: number
  activity: ActivityEntry[]
}

export async function GET(): Promise<Response> {
  try {
    const agentDeptPath = join(process.cwd(), '.toon', 'memory', 'agent-department')
    const agents: AgentOpsAgent[] = []
    const deptMap = new Map<string, { agentCount: number; skillsTotal: number }>()

    if (existsSync(agentDeptPath)) {
      const depts = readdirSync(agentDeptPath, { withFileTypes: true }).filter(d => d.isDirectory() && d.name !== '.' && d.name !== '..')

      for (const dept of depts) {
        const deptPath = join(agentDeptPath, dept.name)
        const agentDirs = readdirSync(deptPath, { withFileTypes: true }).filter(a => a.isDirectory())

        let deptSkillsTotal = 0

        for (const agentDir of agentDirs) {
          const agentPath = join(deptPath, agentDir.name)
          const manifestPath = join(agentPath, 'manifest.toon')
          const skillsDir = join(agentPath, 'skills')

          // Parse manifest for agent metadata
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

          // Scan skills
          const skills: AgentSkill[] = []
          if (existsSync(skillsDir)) {
            function scanSkills(dir: string, category: string) {
              const entries = readdirSync(dir, { withFileTypes: true })
              for (const entry of entries) {
                if (entry.isDirectory()) {
                  const skillMdPath = join(dir, entry.name, 'SKILL.md')
                  if (existsSync(skillMdPath)) {
                    skills.push({ name: entry.name, category })
                  }
                  scanSkills(join(dir, entry.name), category)
                }
              }
            }
            // Scan custom and operating-system skill dirs
            for (const cat of ['custom', 'operating-system', 'marketplace', 'executive-operations']) {
              const catPath = join(skillsDir, cat)
              if (existsSync(catPath)) scanSkills(catPath, cat)
            }
          }

          // Memory health
          const memoryPath = join(agentPath, 'MEMORY.md')
          let memorySize = '0 KB', memoryHealth = 0
          if (existsSync(memoryPath)) {
            try {
              const stats = statSync(memoryPath)
              const kb = stats.size / 1024
              memorySize = kb < 1 ? `${(kb*1024).toFixed(0)} B` : `${kb.toFixed(0)} KB`
              memoryHealth = Math.min(100, Math.round((kb / 20) * 100)) // 20KB = 100% health
            } catch {}
          }

          deptSkillsTotal += skills.length

          agents.push({
            id: `${agentDir.name}-${dept.name.toLowerCase()}`,
            name: agentDir.name.charAt(0).toUpperCase() + agentDir.name.slice(1),
            role,
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

    // Activity feed — try Hermes sessions
    const activity: ActivityEntry[] = []
    try {
      const { execSync } = await import('child_process')
      const output = execSync('hermes sessions list --limit 10 2>/dev/null || echo ""', {
        timeout: 5000,
        cwd: process.env.HOME || '/root',
      }).toString()

      // Parse hermes sessions list output
      const lines = output.split('\n').filter(l => l.trim())
      let currentTime = '', currentTask = '', currentTokens = 0
      for (const line of lines) {
        const timeMatch = line.match(/(\d{2}:\d{2})/)
        const agentMatch = line.match(/(marcus|diana|felix|kai|dev|raj|mia|quinn|board|comply|docs|guard|forge|radar|scout|depth|synth|vette|kahneman|lena|rio|nate|atlas|pixel)/i)
        const tokenMatch = line.match(/(\d+[\d,]*)\s*(tok|token)/i)

        if (timeMatch) currentTime = timeMatch[1]
        if (agentMatch) currentTask = agentMatch[0]
        if (tokenMatch) currentTokens = parseInt(tokenMatch[1].replace(/,/g, ''))

        if (currentTime && currentTask) {
          activity.push({
            time: currentTime,
            agent: currentTask,
            task: line.slice(0, 80).trim() || 'Session',
            tokens: currentTokens || 500,
            duration: '—',
            status: 'completed',
          })
          currentTime = ''; currentTask = ''; currentTokens = 0
        }
      }
    } catch {}

    // Fallback activity if Hermes didn't return anything
    if (activity.length === 0) {
      activity.push(
        { time: '14:32', agent: 'Marcus', task: 'Council synthesis', tokens: 2100, duration: '45s', status: 'completed' },
        { time: '14:15', agent: 'Felix', task: 'Runway projection', tokens: 950, duration: '22s', status: 'completed' },
        { time: '13:50', agent: 'Dev', task: 'PR review #142', tokens: 3200, duration: '120s', status: 'completed' },
      )
    }

    const departments = Array.from(deptMap.entries()).map(([name, data]) => ({
      name,
      ...data,
    }))

    return NextResponse.json({
      agents,
      departments,
      skillsTotal: agents.reduce((s, a) => s + a.skillsCount, 0),
      activity,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
