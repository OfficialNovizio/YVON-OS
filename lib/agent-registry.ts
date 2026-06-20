// lib/agent-registry.ts — Agent data embedded at build time for Vercel
// During `npm run build`, reads .toon/agents/ and embeds the full roster.
// On Vercel (no .toon/), falls back to this build-time snapshot.
//
// Rebuild snapshot: npx tsx lib/agent-registry.ts

import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'

export interface AgentEntry {
  id: string
  name: string
  role: string
  department: string
  level: number
  skillsCount: number
  memorySize: string
  memoryHealth: number
}

export interface DepartmentEntry {
  name: string
  agentCount: number
  skillsTotal: number
}

export interface AgentRegistry {
  agents: AgentEntry[]
  departments: DepartmentEntry[]
  skillsTotal: number
  generatedAt: string
}

// ═══════════════════════════════════════════════════════════════════

const EMBEDDED: AgentRegistry = {"agents":[{"id":"marcus-ceo","name":"Marcus","role":"--","department":"CEO","level":1,"skillsCount":13,"memorySize":"8 KB","memoryHealth":41},{"id":"diana-coo","name":"Diana","role":"--","department":"COO","level":1,"skillsCount":21,"memorySize":"7 KB","memoryHealth":35},{"id":"board-command","name":"Board","role":"Governance Agent","department":"Command","level":1,"skillsCount":5,"memorySize":"388 B","memoryHealth":2},{"id":"felix-finance","name":"Felix","role":"--","department":"Finance","level":2,"skillsCount":16,"memorySize":"7 KB","memoryHealth":33},{"id":"comply-legal","name":"Comply","role":"Compliance Agent","department":"Legal","level":2,"skillsCount":6,"memorySize":"398 B","memoryHealth":2},{"id":"docs-legal","name":"Docs","role":"Legal Documentation Agent","department":"Legal","level":2,"skillsCount":5,"memorySize":"344 B","memoryHealth":2},{"id":"guard-legal","name":"Guard","role":"IP Protection Agent","department":"Legal","level":2,"skillsCount":5,"memorySize":"414 B","memoryHealth":2},{"id":"atlas-marketing","name":"Atlas","role":"--","department":"Marketing","level":3,"skillsCount":6,"memorySize":"3 KB","memoryHealth":16},{"id":"kai-marketing","name":"Kai","role":"--","department":"Marketing","level":3,"skillsCount":9,"memorySize":"8 KB","memoryHealth":39},{"id":"lena-marketing","name":"Lena","role":"--","department":"Marketing","level":3,"skillsCount":6,"memorySize":"7 KB","memoryHealth":34},{"id":"nate-marketing","name":"Nate","role":"--","department":"Marketing","level":3,"skillsCount":6,"memorySize":"6 KB","memoryHealth":31},{"id":"pixel-marketing","name":"Pixel","role":"--","department":"Marketing","level":3,"skillsCount":9,"memorySize":"3 KB","memoryHealth":15},{"id":"rio-marketing","name":"Rio","role":"--","department":"Marketing","level":3,"skillsCount":5,"memorySize":"4 KB","memoryHealth":19},{"id":"Daniel_Kahneman-psychology","name":"Daniel_Kahneman","role":"Cognitive Bias Validator","department":"Psychology","level":2,"skillsCount":6,"memorySize":"5 KB","memoryHealth":27},{"id":"depth-research","name":"Depth","role":"Deep Research Agent","department":"Research","level":3,"skillsCount":5,"memorySize":"408 B","memoryHealth":2},{"id":"synth-research","name":"Synth","role":"Synthesis Agent","department":"Research","level":3,"skillsCount":5,"memorySize":"360 B","memoryHealth":2},{"id":"vette-research","name":"Vette","role":"Fact Verification Agent","department":"Research","level":3,"skillsCount":5,"memorySize":"411 B","memoryHealth":2},{"id":"forge-sense","name":"Forge","role":"Method Discovery Agent","department":"Sense","level":2,"skillsCount":5,"memorySize":"367 B","memoryHealth":2},{"id":"radar-sense","name":"Radar","role":"Market Intelligence Agent","department":"Sense","level":2,"skillsCount":5,"memorySize":"360 B","memoryHealth":2},{"id":"scout-sense","name":"Scout","role":"Internet Discovery Agent","department":"Sense","level":2,"skillsCount":5,"memorySize":"343 B","memoryHealth":2},{"id":"dev-technical","name":"Dev","role":"--","department":"Technical","level":3,"skillsCount":5,"memorySize":"5 KB","memoryHealth":24},{"id":"mia-technical","name":"Mia","role":"--","department":"Technical","level":3,"skillsCount":3,"memorySize":"5 KB","memoryHealth":27},{"id":"quinn-technical","name":"Quinn","role":"--","department":"Technical","level":3,"skillsCount":5,"memorySize":"4 KB","memoryHealth":19},{"id":"raj-technical","name":"Raj","role":"--","department":"Technical","level":3,"skillsCount":9,"memorySize":"5 KB","memoryHealth":24}],"departments":[{"name":"CEO","agentCount":1,"skillsTotal":13},{"name":"COO","agentCount":1,"skillsTotal":21},{"name":"Command","agentCount":1,"skillsTotal":5},{"name":"Finance","agentCount":1,"skillsTotal":16},{"name":"Legal","agentCount":3,"skillsTotal":16},{"name":"Marketing","agentCount":6,"skillsTotal":41},{"name":"Psychology","agentCount":1,"skillsTotal":6},{"name":"Research","agentCount":3,"skillsTotal":15},{"name":"Sense","agentCount":3,"skillsTotal":15},{"name":"Technical","agentCount":4,"skillsTotal":22}],"skillsTotal":170,"generatedAt":"2026-06-20T07:08:26.331Z"} as const

// ═══════════════════════════════════════════════════════════════════

// Runtime accessor — uses embedded snapshot (works on Vercel with no .toon/)
export function getAgentRegistry(): AgentRegistry {
  return EMBEDDED as unknown as AgentRegistry
}

// CLI: regenerate the embedded snapshot from .toon/agents/
if (require.main === module) {
  const fs = require('fs')
  const agentDeptPath = join(process.cwd(), '.toon', 'agents')

  if (!existsSync(agentDeptPath)) {
    console.log('  ⚠️  No .toon/agents/ found — install toongine first: npm install github:OfficialNovizio/ToonGine')
    process.exit(0)
  }

  // Extract from filesystem
  const agents: AgentEntry[] = []
  const deptMap = new Map<string, { agentCount: number; skillsTotal: number }>()
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
        for (const cat of ['custom', 'operating-system', 'marketplace', 'executive-operations']) {
          countSkills(join(skillsDir, cat))
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

      deptSkillsTotal += skillsCount
      agents.push({
        id: `${agentDir.name}-${dept.name.toLowerCase()}`,
        name: agentDir.name.charAt(0).toUpperCase() + agentDir.name.slice(1),
        role: role || '—',
        department: dept.name,
        level,
        skillsCount,
        memorySize,
        memoryHealth,
      })
    }
    deptMap.set(dept.name, { agentCount: agentDirs.length, skillsTotal: deptSkillsTotal })
  }

  const departments = Array.from(deptMap.entries()).map(([name, data]) => ({ name, ...data }))
  const snapshot: AgentRegistry = {
    agents,
    departments,
    skillsTotal: agents.reduce((s, a) => s + a.skillsCount, 0),
    generatedAt: new Date().toISOString(),
  }

  // Replace the EMBEDDED object in this file between markers
  const filePath = __filename
  const content = fs.readFileSync(filePath, 'utf-8')
  const marker = '// ═══════════════════════════════════════════════════════════════════'
  const lines = content.split('\n')

  let marker1 = -1, marker2 = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(marker)) {
      if (marker1 === -1) marker1 = i
      else { marker2 = i; break }
    }
  }

  if (marker1 >= 0 && marker2 > marker1) {
    const before = lines.slice(0, marker1 + 1)
    const after = lines.slice(marker2)
    const embedLine = `const EMBEDDED: AgentRegistry = ${JSON.stringify(snapshot)} as const`
    const newContent = [...before, '', embedLine, '', ...after].join('\n')
    fs.writeFileSync(filePath, newContent, 'utf-8')
    console.log(`  ✅ Agent registry snapshot updated: ${agents.length} agents`)
  } else {
    console.error('  ❌ Could not find embed markers in file')
    process.exit(1)
  }
}
