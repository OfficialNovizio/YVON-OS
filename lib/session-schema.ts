/**
 * Session Schema Validation
 * Validates SESSION.md format and provides migration utilities
 */

import { z } from 'zod'

// ─── Schema Definitions ───────────────────────────────────────────────────────

export const SESSION_SCHEMA_VERSION = '1.0.0'

export const SessionEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  agents: z.array(z.string()),
  task: z.string(),
  outcome: z.string(),
  nextStep: z.string().optional()
})

export const SipFlagSchema = z.object({
  agentId: z.string(),
  sessionCount: z.number().int().positive(),
  flaggedAt: z.string().datetime(),
  resolved: z.boolean()
})

export const SessionDataSchema = z.object({
  activeRightNow: z.object({
    status: z.string(),
    inProgress: z.string(),
    waitingFor: z.array(z.string()),
    nextSessionStart: z.string()
  }),
  openDecisions: z.array(z.string()),
  lastSessions: z.array(SessionEntrySchema).max(5),
  sipFlags: z.array(SipFlagSchema).max(20)
})

export type SessionData = z.infer<typeof SessionDataSchema>
export type SessionEntry = z.infer<typeof SessionEntrySchema>
export type SipFlag = z.infer<typeof SipFlagSchema>

// ─── Validation Functions ─────────────────────────────────────────────────────

export function validateSessionContent(content: string): {
  valid: boolean
  errors: string[]
  warnings: string[]
  data: SessionData | null
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for version marker
  if (!content.includes(`SESSION_SCHEMA_VERSION=${SESSION_SCHEMA_VERSION}`)) {
    warnings.push(`Missing schema version marker (expected: ${SESSION_SCHEMA_VERSION})`)
  }

  // Check for required sections
  const requiredSections = [
    '## Active Right Now',
    '## Open Decisions',
    '## Last 5 Sessions'
  ]

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      errors.push(`Missing required section: ${section}`)
    }
  }

  // Try to parse and validate structure
  let data: SessionData | null = null
  try {
    const parsed = parseSessionContent(content)
    const result = SessionDataSchema.safeParse(parsed)

    if (result.success) {
      data = result.data
    } else {
      errors.push(...result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`))
    }
  } catch (error) {
    errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data
  }
}

export function parseSessionContent(content: string): SessionData {
  const lines = content.split('\n')
  const data: SessionData = {
    activeRightNow: {
      status: '',
      inProgress: '',
      waitingFor: [],
      nextSessionStart: ''
    },
    openDecisions: [],
    lastSessions: [],
    sipFlags: []
  }

  let currentSection: string | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    // Section headers
    if (trimmed.startsWith('## ')) {
      currentSection = trimmed
      continue
    }

    // Active Right Now section
    if (currentSection === '## Active Right Now') {
      if (trimmed.startsWith('- **Status:**')) {
        data.activeRightNow.status = trimmed.replace('- **Status:**', '').trim()
      } else if (trimmed.startsWith('- **In Progress:**')) {
        data.activeRightNow.inProgress = trimmed.replace('- **In Progress:**', '').trim()
      } else if (trimmed.startsWith('- **Waiting for Stark:**')) {
        // Parse waiting items
        const waitingMatch = trimmed.match(/\d+\.\s*(.+)/)
        if (waitingMatch) {
          data.activeRightNow.waitingFor.push(waitingMatch[1])
        }
      } else if (trimmed.startsWith('- **Next session should start with:**')) {
        data.activeRightNow.nextSessionStart = trimmed.replace('- **Next session should start with:**', '').trim()
      }
    }

    // Open Decisions section
    if (currentSection === '## Open Decisions') {
      const decisionMatch = trimmed.match(/- \[ \] (.+)/)
      if (decisionMatch) {
        data.openDecisions.push(decisionMatch[1])
      }
    }

    // Last 5 Sessions section (table parsing)
    if (currentSection === '## Last 5 Sessions') {
      if (trimmed.startsWith('|') && !trimmed.includes('------')) {
        const cells = trimmed.split('|').filter(c => c.trim())
        if (cells.length >= 5) {
          const entry: SessionEntry = {
            date: cells[1].trim(),
            agents: cells[2].trim().split(',').map(a => a.trim()),
            task: cells[3].trim(),
            outcome: cells[4].trim(),
            nextStep: cells[5]?.trim()
          }
          data.lastSessions.push(entry)
        }
      }
    }
  }

  return data
}

// ─── Migration Functions ──────────────────────────────────────────────────────

export function migrateSessionContent(content: string): string {
  let migrated = content

  // Add schema version if missing
  if (!migrated.includes('SESSION_SCHEMA_VERSION=')) {
    migrated = `<!-- SESSION_SCHEMA_VERSION=${SESSION_SCHEMA_VERSION} -->\n` + migrated
  }

  // Ensure required sections exist
  const requiredSections = [
    { marker: '## Active Right Now', defaultContent: '## Active Right Now\n- **Status:** Idle\n- **In Progress:** Nothing\n- **Waiting for Stark:** None\n- **Next session should start with:** Read SESSION.md + ROADMAP.md + relevant agent MEMORY.md\n' },
    { marker: '## Open Decisions', defaultContent: '## Open Decisions (not yet resolved)\n- [ ] None\n' },
    { marker: '## Last 5 Sessions', defaultContent: '## Last 5 Sessions\n\n| Date | Agent(s) | Task | Outcome | Next Step |\n|------|---------|------|---------|-----------|\n| No sessions yet | | | | |\n' }
  ]

  for (const section of requiredSections) {
    if (!migrated.includes(section.marker)) {
      migrated += '\n' + section.defaultContent + '\n'
    }
  }

  return migrated
}

export function validateAndMigrate(content: string): {
  migrated: boolean
  content: string
  warnings: string[]
} {
  const warnings: string[] = []
  let migrated = false
  let newContent = content

  // Check version
  if (!content.includes(`SESSION_SCHEMA_VERSION=${SESSION_SCHEMA_VERSION}`)) {
    warnings.push('Schema version missing, adding migration marker')
    newContent = migrateSessionContent(newContent)
    migrated = true
  }

  // Check required sections
  const validation = validateSessionContent(newContent)
  if (!validation.valid) {
    warnings.push(...validation.errors)
    newContent = migrateSessionContent(newContent)
    migrated = true
  }

  return {
    migrated,
    content: newContent,
    warnings
  }
}
