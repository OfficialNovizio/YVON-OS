/**
 * Enhanced Memory API with automatic SKILLS.md updates
 * POST /api/memory/enhanced
 *
 * Automatically analyzes session patterns and updates SKILLS.md when needed
 */

import { NextRequest } from 'next/server'
import { skillsManager } from '@/lib/skills-manager'
import { monitoring } from '@/lib/monitoring'
import { sessionManager } from '@/lib/session-manager'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const dynamic = 'force-dynamic'

interface EnhancedMemoryRequest {
  agentId: string
  task: string
  outcome: string
  errors?: Array<{
    message: string
    context?: string
    timestamp?: string
  }>
}

interface EnhancedMemoryResponse {
  success: boolean
  agentId: string
  sessionLogged: boolean
  skillsUpdated: boolean
  skillsChanges?: {
    additions: string[]
    removals: string[]
    compression: boolean
  }
  validation?: {
    valid: boolean
    errors: string[]
    warnings: string[]
  }
  monitoring?: {
    metricRecorded: boolean
    alertTriggered: boolean
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let body: EnhancedMemoryRequest
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { agentId, task, outcome, errors = [] } = body

  if (!agentId || !task || !outcome) {
    return Response.json({ error: 'agentId, task, and outcome are required' }, { status: 400 })
  }

  const response: EnhancedMemoryResponse = {
    success: false,
    agentId,
    sessionLogged: false,
    skillsUpdated: false
  }

  try {
    // Step 1: Log session to MEMORY.md (using existing API)
    const memoryResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, task, outcome })
    })

    if (memoryResponse.ok) {
      response.sessionLogged = true
    }

    // Step 2: Analyze errors and determine if SKILLS.md update needed
    let needsSkillsUpdate = errors.length > 0

    if (!needsSkillsUpdate && client) {
      // Use AI to determine if patterns emerged during session
      const analysis = await analyzeSessionPatterns(agentId, task, outcome)
      needsSkillsUpdate = analysis.needsUpdate
    }

    // Step 3: Update SKILLS.md if needed
    if (needsSkillsUpdate) {
      const skillsUpdate = await updateSkillsBasedOnSession(agentId, task, outcome, errors)
      response.skillsUpdated = skillsUpdate.success
      response.skillsChanges = skillsUpdate.changes
      response.validation = skillsUpdate.validation
    }

    // Step 4: Record monitoring metrics
    monitoring.recordMetric('session_completed', 1, { agentId })
    if (errors.length > 0) {
      monitoring.recordMetric('session_errors', errors.length, { agentId })
    }

    response.monitoring = {
      metricRecorded: true,
      alertTriggered: errors.length > 0
    }

    response.success = true

    return Response.json(response)
  } catch (error) {
    monitoring.error('Enhanced memory API failed', { agentId, error: String(error) })
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

/**
 * Analyze session patterns to determine if SKILLS.md update is needed
 */
async function analyzeSessionPatterns(
  agentId: string,
  task: string,
  outcome: string
): Promise<{ needsUpdate: boolean; pattern?: string }> {
  try {
    const analysisPrompt = `
You are analyzing a session to determine if SKILLS.md needs updating.

Agent: ${agentId}
Task: ${task}
Outcome: ${outcome}

Analyze if this session revealed:
1. A new pattern that should be added to SKILLS.md
2. An existing pattern that should be removed or updated
3. A workflow improvement that should be documented

Return JSON:
{
  "needsUpdate": boolean,
  "pattern": string (optional - what pattern emerged),
  "reason": string (optional - why update is needed)
}
`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: analysisPrompt }]
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    const result = JSON.parse(raw)

    return { needsUpdate: result.needsUpdate || false, pattern: result.pattern }
  } catch (error) {
    monitoring.warn('Failed to analyze session patterns', { error: String(error) })
    return { needsUpdate: false }
  }
}

/**
 * Update SKILLS.md based on session analysis
 */
async function updateSkillsBasedOnSession(
  agentId: string,
  task: string,
  outcome: string,
  errors: Array<{ message: string; context?: string }>
): Promise<{
  success: boolean
  changes?: { additions: string[]; removals: string[]; compression: boolean }
  validation?: { valid: boolean; errors: string[]; warnings: string[] }
}> {
  try {
    // Analyze errors to extract patterns
    const errorPatterns = errors.map(e => e.message).join(', ')

    // Generate SKILLS.md update based on session
    const skillsPrompt = `
You are generating a SKILLS.md update for agent ${agentId} based on recent session.

Session details:
- Task: ${task}
- Outcome: ${outcome}
- Errors: ${errorPatterns || 'None'}

Analyze if any patterns should be added or removed from SKILLS.md.

Return JSON:
{
  "addPattern": string (optional - pattern to add),
  "removePattern": string (optional - pattern to remove),
  "reason": string (explanation for changes)
}
`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: skillsPrompt }]
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    const result = JSON.parse(raw)

    // Apply changes if any
    if (result.addPattern || result.removePattern) {
      const update = await skillsManager.applySipDistillation(agentId, result)

      monitoring.info(`SKILLS.md updated for ${agentId}`, {
        additions: update.additions,
        removals: update.removals,
        compression: update.compression
      })

      return {
        success: true,
        changes: {
          additions: update.additions,
          removals: update.removals,
          compression: update.compression
        },
        validation: update.validation
      }
    }

    return { success: true }
  } catch (error) {
    monitoring.error('Failed to update SKILLS.md', { agentId, error: String(error) })
    return { success: false }
  }
}

export async function GET() {
  // Return enhanced memory stats
  try {
    const health = await monitoring.checkSystemHealth()
    const validation = await skillsManager.batchValidate()

    return Response.json({
      timestamp: new Date().toISOString(),
      health,
      skillsValidation: validation,
      note: 'Use POST to update memory and auto-update SKILLS.md'
    })
  } catch (error) {
    return Response.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
