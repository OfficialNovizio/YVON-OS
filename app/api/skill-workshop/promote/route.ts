// POST /api/skill-workshop/promote
// Writes a successful training pattern to the agent's SKILL.md file.
// This permanently improves the agent by saving the production-proven instruction.

import { NextResponse } from 'next/server'
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface PromoteRequest {
  workshopId: string
  agentName: string    // display name e.g. 'Lena'
  prompt: string
  output: string
  score: number
  areasImproved: string[]
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: PromoteRequest = await request.json()
    const { workshopId, agentName, prompt, output, score, areasImproved } = body

    if (!workshopId || !agentName || !prompt) {
      return NextResponse.json({ error: 'workshopId, agentName, and prompt are required' }, { status: 400 })
    }

    if (score < 80) {
      return NextResponse.json({ error: 'Score must be ≥ 80 to promote' }, { status: 400 })
    }

    // Find the agent directory
    const agentNameLower = agentName.toLowerCase()
    const basePath = join(process.cwd(), '.toon', 'agents')

    if (!existsSync(basePath)) {
      return NextResponse.json({ error: 'Agent department directory not found' }, { status: 500 })
    }

    let agentPath = ''
    let deptName = ''
    for (const dept of readdirSync(basePath, { withFileTypes: true }).filter(d => d.isDirectory())) {
      const candidate = join(basePath, dept.name, agentNameLower)
      if (existsSync(candidate)) {
        agentPath = candidate
        deptName = dept.name
        break
      }
      // Also try with underscores (e.g., Daniel_Kahneman → daniel_kahneman)
      const candidateUnderscore = join(basePath, dept.name, agentNameLower.replace(/\s+/g, '_'))
      if (existsSync(candidateUnderscore)) {
        agentPath = candidateUnderscore
        deptName = dept.name
        break
      }
    }

    if (!agentPath) {
      // Agent directory not found in filesystem — create a workshop skills file instead
      const workshopSkillsDir = join(process.cwd(), '.toon', 'memory', 'workshop-skills', agentNameLower)
      mkdirSync(workshopSkillsDir, { recursive: true })

      const skillContent = `# Workshop Skill — ${agentName} (${workshopId})

## Training Prompt
${prompt}

## Proven Output Pattern
${output.slice(0, 500)}

## Quality Score
${score}%

## Areas Improved
${areasImproved.map(a => `- ${a}`).join('\n')}

## Promoted
${new Date().toISOString()}

---
*This skill was promoted from the Skill Workshop. It represents a production-proven pattern.*
`
      writeFileSync(join(workshopSkillsDir, 'SKILL.md'), skillContent)
      return NextResponse.json({
        success: true,
        message: `Skill saved to workshop-skills/${agentNameLower}/SKILL.md`,
        path: `workshop-skills/${agentNameLower}`,
      })
    }

    // Find or create a workshop skills directory in the agent's skills
    const skillsDir = join(agentPath, 'skills', 'workshop-promoted')
    mkdirSync(skillsDir, { recursive: true })

    // Create a skill file for this promotion
    const skillFileName = workshopId + '-' + Date.now() + '.md'
    const skillContent = `# ${workshopId.charAt(0).toUpperCase() + workshopId.slice(1)} Workshop — Promoted Skill

## Department
${deptName}

## Agent
${agentName}

## Training Prompt
${prompt}

## Proven Output Pattern
${output.slice(0, 800)}

## Quality Score
${score}%

## Areas Improved
${areasImproved.map(a => `- ${a}`).join('\n')}

## Promoted
${new Date().toISOString()}

## Usage
When the agent encounters a similar task, reference this pattern as the proven approach.
Adjust for context while preserving the core quality markers identified during training.
`
    writeFileSync(join(skillsDir, skillFileName), skillContent)

    return NextResponse.json({
      success: true,
      message: `Skill promoted to ${deptName}/${agentNameLower}/skills/workshop-promoted/${skillFileName}`,
      path: `${deptName}/${agentNameLower}/skills/workshop-promoted/${skillFileName}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Promotion failed' }, { status: 500 })
  }
}
