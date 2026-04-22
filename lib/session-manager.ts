/**
 * Session Manager Service
 * Centralized service for reading, writing, and managing SESSION.md
 * Replaces direct file access across 31+ reference files
 */

import { promises as fs } from 'fs'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionEntry {
  date: string
  agents: string[]
  task: string
  outcome: string
  nextStep?: string
}

export interface SessionData {
  activeRightNow: {
    status: string
    inProgress: string
    waitingFor: string[]
    nextSessionStart: string
  }
  openDecisions: string[]
  lastSessions: SessionEntry[]
  sipFlags: SipFlag[]
}

export interface SipFlag {
  agentId: string
  sessionCount: number
  flaggedAt: string
  resolved: boolean
}

// ─── Schema Validation ────────────────────────────────────────────────────────

const SESSION_SCHEMA_VERSION = '1.0.0'

export function validateSession(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for required sections
  const requiredSections = ['## Active Right Now', '## Open Decisions', '## Last 5 Sessions']
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      errors.push(`Missing required section: ${section}`)
    }
  }

  // Check for version marker
  if (!content.includes(`SESSION_SCHEMA_VERSION=${SESSION_SCHEMA_VERSION}`)) {
    errors.push(`Missing schema version marker (expected: ${SESSION_SCHEMA_VERSION})`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function migrateSession(content: string): string {
  // Handle format changes gracefully
  let migrated = content

  // Add schema version if missing
  if (!migrated.includes('SESSION_SCHEMA_VERSION=')) {
    migrated = `<!-- SESSION_SCHEMA_VERSION=${SESSION_SCHEMA_VERSION} -->\n` + migrated
  }

  // Ensure session_count exists in agent MEMORY.md files (handled separately)
  // This is for SESSION.md migration only

  return migrated
}

// ─── Core Operations ──────────────────────────────────────────────────────────

const SESSION_PATH = path.join(process.cwd(), '.yvon-os/SESSION.md')

export class SessionManager {
  private static instance: SessionManager
  private listeners: Set<(data: SessionData) => void> = new Set()
  private currentData: SessionData | null = null

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Read and parse SESSION.md
   */
  async read(): Promise<SessionData> {
    try {
      const content = await fs.readFile(SESSION_PATH, 'utf-8')
      const data = this.parse(content)
      this.currentData = data
      return data
    } catch (error) {
      // Return empty structure if file doesn't exist
      return this.createEmptyData()
    }
  }

  /**
   * Update SESSION.md with partial changes
   */
  async update(updates: Partial<SessionData>): Promise<SessionData> {
    const current = await this.read()
    const updated = { ...current, ...updates }

    const content = this.serialize(updated)
    await fs.writeFile(SESSION_PATH, content, 'utf-8')

    this.currentData = updated
    this.notifyListeners(updated)

    return updated
  }

  /**
   * Append a new session entry (maintains max 5 entries)
   */
  async appendSession(entry: SessionEntry): Promise<SessionData> {
    const current = await this.read()

    // Add new entry at beginning
    const newSessions = [entry, ...current.lastSessions].slice(0, 5)

    return this.update({ lastSessions: newSessions })
  }

  /**
   * Flag an agent for SIP distillation
   */
  async flagSIP(agentId: string, sessionCount: number): Promise<SessionData> {
    const current = await this.read()

    // Check if already flagged
    const existingFlag = current.sipFlags.find(f => f.agentId === agentId && !f.resolved)
    if (existingFlag) {
      return current // Already flagged
    }

    const newFlag: SipFlag = {
      agentId,
      sessionCount,
      flaggedAt: new Date().toISOString(),
      resolved: false
    }

    return this.update({
      sipFlags: [newFlag, ...current.sipFlags].slice(0, 20) // Keep last 20 flags
    })
  }

  /**
   * Resolve a SIP flag
   */
  async resolveSIP(agentId: string): Promise<SessionData> {
    const current = await this.read()

    const updatedFlags = current.sipFlags.map(flag =>
      flag.agentId === agentId ? { ...flag, resolved: true } : flag
    )

    return this.update({ sipFlags: updatedFlags })
  }

  /**
   * Subscribe to SESSION.md changes
   */
  subscribe(callback: (data: SessionData) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private parse(content: string): SessionData {
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
    const currentSession: SessionEntry | null = null

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

      // SIP flags (look for [SIP_DUE] or [SIP_SCHEDULED])
      if (trimmed.includes('[SIP_DUE]') || trimmed.includes('[SIP_SCHEDULED]')) {
        const sipMatch = trimmed.match(/\[(?:SIP_DUE|SIP_SCHEDULED)\]\s*(\w+-\w+)\s*has hit\s*(\d+)\s*sessions/)
        if (sipMatch) {
          data.sipFlags.push({
            agentId: sipMatch[1],
            sessionCount: parseInt(sipMatch[2]),
            flaggedAt: new Date().toISOString(),
            resolved: false
          })
        }
      }
    }

    return data
  }

  private serialize(data: SessionData): string {
    return `# SESSION.md — Rolling Session Memory
> Updated at the end of every session. Read at the start of every session.
> Gives continuity without relying on conversation history.
> Keep each entry to 1-2 lines. Maximum 5 sessions shown — oldest drops off when 6th is added.
> SESSION_SCHEMA_VERSION=${SESSION_SCHEMA_VERSION}

---

## Active Right Now
- **Status:** ${data.activeRightNow.status || 'Idle'}
- **In Progress:** ${data.activeRightNow.inProgress || 'Nothing'}
- **Waiting for Stark:**
${data.activeRightNow.waitingFor.map((w, i) => `  ${i + 1}. ${w}`).join('\n') || '  None'}
- **Next session should start with:** ${data.activeRightNow.nextSessionStart || 'Read SESSION.md + ROADMAP.md + relevant agent MEMORY.md'}

---

## Open Decisions (not yet resolved)
${data.openDecisions.map(d => `- [ ] ${d}`).join('\n') || '- [ ] None'}

---

## Last 5 Sessions

| Date | Agent(s) | Task | Outcome | Next Step |
|------|---------|------|---------|-----------|
${data.lastSessions.map(s =>
  `| ${s.date} | ${s.agents.join(', ')} | ${s.task} | ${s.outline || ''} | ${s.nextStep || ''} |`
).join('\n') || '| No sessions yet | | | | |'}

---

## SIP Flags (Pending Distillation)
${data.sipFlags.filter(f => !f.resolved).map(f =>
  `- ⚡ [SIP_DUE] ${f.agentId} has hit ${f.sessionCount} sessions — run SIP distillation`
).join('\n') || '- No pending SIP flags'}

---

## How to Update This File
At the end of each session, the executing agent:
1. Moves "Active Right Now" to the top of the sessions table (newest first)
2. Fills in Date, Agent(s), Task, Outcome, Next Step
3. Drops the oldest row if there are already 5 entries
4. Writes a new "Active Right Now" section if a task is still in progress
`
  }

  private createEmptyData(): SessionData {
    return {
      activeRightNow: {
        status: 'Idle',
        inProgress: 'Nothing',
        waitingFor: [],
        nextSessionStart: 'Read SESSION.md + ROADMAP.md + relevant agent MEMORY.md'
      },
      openDecisions: [],
      lastSessions: [],
      sipFlags: []
    }
  }

  private notifyListeners(data: SessionData): void {
    this.listeners.forEach(callback => callback(data))
  }
}

// ─── Convenience Functions ────────────────────────────────────────────────────

export const sessionManager = SessionManager.getInstance()

export async function readSession(): Promise<SessionData> {
  return sessionManager.read()
}

export async function updateSession(updates: Partial<SessionData>): Promise<SessionData> {
  return sessionManager.update(updates)
}

export async function flagSIP(agentId: string, sessionCount: number): Promise<SessionData> {
  return sessionManager.flagSIP(agentId, sessionCount)
}

export async function resolveSIP(agentId: string): Promise<SessionData> {
  return sessionManager.resolveSIP(agentId)
}
