/**
 * SIP (Skill Improvement Protocol) Manager
 * Automates SIP triggering, scheduling, and execution
 */

import { promises as fs } from 'fs'
import path from 'path'
import { sessionManager, flagSIP } from './session-manager'

// ─── Configuration ────────────────────────────────────────────────────────────

export interface SipConfig {
  triggerInterval: number // sessions between SIP triggers
  maxPendingSips: number
  autoRemindHours: number
}

export const SIP_CONFIG: SipConfig = {
  triggerInterval: 5, // Every 5 sessions
  maxPendingSips: 3, // Max 3 pending SIPs per agent
  autoRemindHours: 24 // Remind every 24 hours if not resolved
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SipTask {
  agentId: string
  sessionCount: number
  flaggedAt: string
  dueBy: string
  resolved: boolean
  resolvedAt?: string
  priority: 'low' | 'medium' | 'high'
}

export interface SipStats {
  totalTriggered: number
  totalResolved: number
  pending: number
  overdue: number
  averageResolutionTime: number // hours
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Check if SIP should be triggered for an agent
 */
export function shouldTriggerSip(sessionCount: number): boolean {
  return sessionCount > 0 && sessionCount % SIP_CONFIG.triggerInterval === 0
}

/**
 * Calculate SIP due date
 */
export function calculateSipDueDate(flaggedAt: string): string {
  const flaggedDate = new Date(flaggedAt)
  flaggedDate.setHours(flaggedDate.getHours() + SIP_CONFIG.autoRemindHours)
  return flaggedDate.toISOString()
}

/**
 * Get SIP priority based on age
 */
export function getSipPriority(flaggedAt: string, sessionCount: number): 'low' | 'medium' | 'high' {
  const flaggedDate = new Date(flaggedAt)
  const hoursSinceFlag = (Date.now() - flaggedDate.getTime()) / (1000 * 60 * 60)

  if (hoursSinceFlag > 48) return 'high'
  if (hoursSinceFlag > 24) return 'medium'
  return 'low'
}

/**
 * Flag agent for SIP distillation
 */
export async function scheduleSip(agentId: string, sessionCount: number): Promise<SipTask> {
  const flaggedAt = new Date().toISOString()
  const dueBy = calculateSipDueDate(flaggedAt)

  const task: SipTask = {
    agentId,
    sessionCount,
    flaggedAt,
    dueBy,
    resolved: false,
    priority: getSipPriority(flaggedAt, sessionCount)
  }

  // Update SESSION.md with SIP flag
  await flagSIP(agentId, sessionCount)

  // Update agent's MEMORY.md
  await updateAgentMemoryWithSip(agentId, sessionCount)

  return task
}

/**
 * Update agent's MEMORY.md with SIP scheduled flag
 */
async function updateAgentMemoryWithSip(agentId: string, sessionCount: number): Promise<void> {
  const agentMemoryPath = path.join(
    process.cwd(),
    'departments',
    getAgentDepartment(agentId),
    agentId,
    'MEMORY.md'
  )

  try {
    let content = await fs.readFile(agentMemoryPath, 'utf-8')

    // Check if already flagged
    if (!content.includes('[SIP_SCHEDULED]')) {
      // Add to Status section
      if (content.includes('## Status')) {
        content = content.replace(
          '## Status',
          `## Status\n> ⚡ [SIP_SCHEDULED] Run SIP distillation (session ${sessionCount}) — due in 24h`
        )
      } else {
        // Add at top if no Status section
        content = `## Status\n> ⚡ [SIP_SCHEDULED] Run SIP distillation (session ${sessionCount}) — due in 24h\n\n` + content
      }

      await fs.writeFile(agentMemoryPath, content, 'utf-8')
    }
  } catch (error) {
    // File might not exist yet, non-fatal
    console.warn(`Could not update MEMORY.md for ${agentId}:`, error)
  }
}

/**
 * Get agent department from ID
 */
function getAgentDepartment(agentId: string): string {
  const departmentMap: Record<string, string> = {
    'marcus-ceo': 'executive',
    'diana-coo': 'executive',
    'dev-lead': 'technical',
    'raj-backend': 'technical',
    'mia-frontend': 'technical',
    'quinn-qa': 'technical',
    'lena-brand': 'marketing',
    'rio-ads': 'marketing',
    'atlas-art-director': 'marketing',
    'pixel-production': 'marketing',
    'kai-analyst': 'analytics',
    'nate-growth': 'analytics',
    'felix-finance': 'operations',
    'stark-growth': 'personal'
  }
  return departmentMap[agentId] || 'personal'
}

/**
 * Resolve SIP for an agent
 */
export async function resolveSip(agentId: string): Promise<void> {
  const agentMemoryPath = path.join(
    process.cwd(),
    'departments',
    getAgentDepartment(agentId),
    agentId,
    'MEMORY.md'
  )

  try {
    let content = await fs.readFile(agentMemoryPath, 'utf-8')

    // Remove SIP_SCHEDULED flag
    content = content.replace(/\n?> ⚡ \[SIP_SCHEDULED\].*\n?/g, '')

    await fs.writeFile(agentMemoryPath, content, 'utf-8')

    // Update SESSION.md
    await sessionManager.resolveSIP(agentId)
  } catch (error) {
    console.warn(`Could not resolve SIP for ${agentId}:`, error)
  }
}

/**
 * Get pending SIP tasks for all agents
 */
export async function getPendingSips(): Promise<SipTask[]> {
  const sessionData = await sessionManager.read()
  const pendingFlags = sessionData.sipFlags.filter(f => !f.resolved)

  return pendingFlags.map(flag => ({
    agentId: flag.agentId,
    sessionCount: flag.sessionCount,
    flaggedAt: flag.flaggedAt,
    dueBy: calculateSipDueDate(flag.flaggedAt),
    resolved: false,
    priority: getSipPriority(flag.flaggedAt, flag.sessionCount)
  }))
}

/**
 * Get overdue SIP tasks
 */
export async function getOverdueSips(): Promise<SipTask[]> {
  const pending = await getPendingSips()
  const now = new Date()

  return pending.filter(task => new Date(task.dueBy) < now)
}

/**
 * Generate SIP report
 */
export async function generateSipReport(): Promise<{
  timestamp: string
  pending: SipTask[]
  overdue: SipTask[]
  stats: SipStats
}> {
  const pending = await getPendingSips()
  const overdue = await getOverdueSips()

  const stats: SipStats = {
    totalTriggered: pending.length + overdue.length,
    totalResolved: 0, // Would need to track resolved count
    pending: pending.length,
    overdue: overdue.length,
    averageResolutionTime: 0 // Would need historical data
  }

  return {
    timestamp: new Date().toISOString(),
    pending,
    overdue,
    stats
  }
}

/**
 * Auto-remind agents with pending SIPs
 */
export async function sendSipReminders(): Promise<string[]> {
  const overdue = await getOverdueSips()
  const reminders: string[] = []

  for (const task of overdue) {
    const reminder = `⚠️ SIP OVERDUE: ${task.agentId} — session ${task.sessionCount} — flagged ${task.flaggedAt}`
    reminders.push(reminder)
  }

  return reminders
}
