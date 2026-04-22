/**
 * SKILLS.md Manager Service
 * Automatically updates agent SKILLS.md files based on session patterns
 */

import { promises as fs } from 'fs'
import path from 'path'
import { monitoring } from './monitoring'

// ─── Configuration ────────────────────────────────────────────────────────────

export interface SkillsConfig {
  maxSkillsFileSize: number // KB
  maxDistillationLogEntries: number
  compressionThreshold: number // days
}

export const SKILLS_CONFIG: SkillsConfig = {
  maxSkillsFileSize: 50, // KB
  maxDistillationLogEntries: 100,
  compressionThreshold: 30 // days
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DistillationEntry {
  timestamp: string
  agentId: string
  action: 'add' | 'remove' | 'update'
  pattern: string
  reason: string
}

export interface SkillsUpdate {
  agentId: string
  timestamp: string
  additions: string[]
  removals: string[]
  compression: boolean
  validation: {
    valid: boolean
    errors: string[]
    warnings: string[]
  }
}

export interface ErrorPattern {
  pattern: string
  frequency: number
  lastOccurred: string
  suggestedFix: string
}

// ─── Core Skills Manager ──────────────────────────────────────────────────────

export class SkillsManager {
  private departmentsDir: string

  constructor() {
    this.departmentsDir = path.join(process.cwd(), 'departments')
  }

  /**
   * Get SKILLS.md path for an agent
   */
  getSkillsPath(agentId: string): string {
    const department = this.getAgentDepartment(agentId)
    return path.join(this.departmentsDir, department, agentId, 'SKILLS.md')
  }

  /**
   * Get agent department from ID
   */
  getAgentDepartment(agentId: string): string {
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
   * Read SKILLS.md content
   */
  async readSkills(agentId: string): Promise<string> {
    const skillsPath = this.getSkillsPath(agentId)
    try {
      return await fs.readFile(skillsPath, 'utf-8')
    } catch (error) {
      monitoring.error(`Failed to read SKILLS.md for ${agentId}`, { error: String(error) })
      throw error
    }
  }

  /**
   * Write SKILLS.md content
   */
  async writeSkills(agentId: string, content: string): Promise<void> {
    const skillsPath = this.getSkillsPath(agentId)
    try {
      await fs.writeFile(skillsPath, content, 'utf-8')
      monitoring.info(`Updated SKILLS.md for ${agentId}`)
    } catch (error) {
      monitoring.error(`Failed to write SKILLS.md for ${agentId}`, { error: String(error) })
      throw error
    }
  }

  /**
   * Add new pattern to SKILLS.md
   */
  async addPattern(agentId: string, pattern: string, reason: string): Promise<SkillsUpdate> {
    const content = await this.readSkills(agentId)
    const lines = content.split('\n')

    // Find Distillation Log section
    const distillationIndex = lines.findIndex(l => l.includes('## Distillation Log'))
    let insertIndex = lines.length

    if (distillationIndex !== -1) {
      // Insert before Distillation Log
      insertIndex = distillationIndex
    }

    // Insert new pattern
    lines.splice(insertIndex, 0, pattern)

    // Update distillation log
    const updatedContent = this.updateDistillationLog(
      lines.join('\n'),
      agentId,
      'add',
      pattern,
      reason
    )

    await this.writeSkills(agentId, updatedContent)

    return {
      agentId,
      timestamp: new Date().toISOString(),
      additions: [pattern],
      removals: [],
      compression: false,
      validation: await this.validateSkills(updatedContent)
    }
  }

  /**
   * Remove pattern from SKILLS.md
   */
  async removePattern(agentId: string, pattern: string, reason: string): Promise<SkillsUpdate> {
    const content = await this.readSkills(agentId)
    const lines = content.split('\n')

    // Find and remove pattern
    const patternIndex = lines.findIndex(l => l.includes(pattern))
    let removed: string[] = []

    if (patternIndex !== -1) {
      removed = [lines[patternIndex]]
      lines.splice(patternIndex, 1)
    }

    // Update distillation log
    const updatedContent = this.updateDistillationLog(
      lines.join('\n'),
      agentId,
      'remove',
      pattern,
      reason
    )

    await this.writeSkills(agentId, updatedContent)

    return {
      agentId,
      timestamp: new Date().toISOString(),
      additions: [],
      removals: removed,
      compression: false,
      validation: await this.validateSkills(updatedContent)
    }
  }

  /**
   * Compress old entries in SKILLS.md
   */
  async compressSkills(agentId: string): Promise<SkillsUpdate> {
    const content = await this.readSkills(agentId)
    const lines = content.split('\n')

    let compressionCount = 0
    const compressedLines = lines.map(line => {
      // Check if line contains old pattern (heuristic: looks for date patterns or TODO markers)
      if (line.includes('TODO') || line.includes('FIXME') || line.includes('OLD_')) {
        compressionCount++
        return line.replace(/\s*\(.*\)\s*$/, '') + ' (compressed)'
      }
      return line
    })

    const updatedContent = compressedLines.join('\n')

    await this.writeSkills(agentId, updatedContent)

    return {
      agentId,
      timestamp: new Date().toISOString(),
      additions: [],
      removals: [],
      compression: compressionCount > 0,
      validation: await this.validateSkills(updatedContent)
    }
  }

  /**
   * Apply SIP distillation to SKILLS.md
   */
  async applySipDistillation(
    agentId: string,
    distillation: {
      addPattern?: string
      removePattern?: string
      reason?: string
    }
  ): Promise<SkillsUpdate> {
    const updates: SkillsUpdate = {
      agentId,
      timestamp: new Date().toISOString(),
      additions: [],
      removals: [],
      compression: false,
      validation: { valid: true, errors: [], warnings: [] }
    }

    // Add new pattern if provided
    if (distillation.addPattern) {
      const addResult = await this.addPattern(
        agentId,
        distillation.addPattern,
        distillation.reason || 'SIP distillation'
      )
      updates.additions = addResult.additions
    }

    // Remove old pattern if provided
    if (distillation.removePattern) {
      const removeResult = await this.removePattern(
        agentId,
        distillation.removePattern,
        distillation.reason || 'SIP distillation'
      )
      updates.removals = removeResult.removals
    }

    // Compress if token count would increase
    const currentSize = (await this.readSkills(agentId)).length / 1024
    if (currentSize > SKILLS_CONFIG.maxSkillsFileSize) {
      const compressResult = await this.compressSkills(agentId)
      updates.compression = compressResult.compression
    }

    return updates
  }

  /**
   * Validate SKILLS.md content
   */
  async validateSkills(content: string): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for required sections
    const requiredSections = ['## Identity', '## Load Triggers', '## Responsibilities']
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        warnings.push(`Missing recommended section: ${section}`)
      }
    }

    // Check for distillation log
    if (!content.includes('## Distillation Log')) {
      warnings.push('Missing Distillation Log section')
    }

    // Check file size
    const sizeKB = content.length / 1024
    if (sizeKB > SKILLS_CONFIG.maxSkillsFileSize) {
      errors.push(`File size too large: ${sizeKB.toFixed(1)}KB (max: ${SKILLS_CONFIG.maxSkillsFileSize}KB)`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Update distillation log entry
   */
  private updateDistillationLog(
    content: string,
    agentId: string,
    action: 'add' | 'remove' | 'update',
    pattern: string,
    reason: string
  ): string {
    const lines = content.split('\n')
    const distillationIndex = lines.findIndex(l => l.includes('## Distillation Log'))

    if (distillationIndex === -1) {
      // Add distillation log section
      lines.push('')
      lines.push('## Distillation Log')
      lines.push('| Date | Action | Pattern | Reason |')
      lines.push('|------|--------|---------|--------|')
    }

    // Find the table and add new entry
    const tableIndex = lines.findIndex(l => l.includes('|------|--------|---------|--------|'))
    if (tableIndex !== -1) {
      const date = new Date().toISOString().split('T')[0]
      const shortPattern = pattern.length > 50 ? pattern.substring(0, 47) + '...' : pattern
      const newEntry = `| ${date} | ${action} | ${shortPattern} | ${reason} |`

      lines.splice(tableIndex + 1, 0, newEntry)

      // Keep only last N entries
      const entries: string[] = []
      for (let i = tableIndex + 2; i < lines.length; i++) {
        if (lines[i].startsWith('|') && !lines[i].includes('------')) {
          entries.push(lines[i])
        }
      }

      // Remove old entries if too many
      if (entries.length > SKILLS_CONFIG.maxDistillationLogEntries) {
        const toRemove = entries.length - SKILLS_CONFIG.maxDistillationLogEntries
        for (let i = 0; i < toRemove; i++) {
          const index = lines.indexOf(entries[i])
          if (index !== -1) {
            lines.splice(index, 1)
          }
        }
      }
    }

    return lines.join('\n')
  }

  /**
   * Get all agent SKILLS.md files
   */
  async getAllSkillsFiles(): Promise<Array<{ agentId: string; path: string }>> {
    const results: Array<{ agentId: string; path: string }> = []

    for (const department of ['executive', 'technical', 'marketing', 'analytics', 'operations', 'personal']) {
      const deptDir = path.join(this.departmentsDir, department)
      try {
        const items = await fs.readdir(deptDir, { withFileTypes: true })
        for (const item of items) {
          if (item.isDirectory()) {
            const skillsPath = path.join(deptDir, item.name, 'SKILLS.md')
            try {
              await fs.access(skillsPath)
              results.push({ agentId: item.name, path: skillsPath })
            } catch {
              // SKILLS.md doesn't exist for this agent
            }
          }
        }
      } catch {
        // Department directory doesn't exist
      }
    }

    return results
  }

  /**
   * Batch validate all SKILLS.md files
   */
  async batchValidate(): Promise<{
    total: number
    valid: number
    invalid: Array<{ agentId: string; errors: string[] }>
  }> {
    const files = await this.getAllSkillsFiles()
    const invalid: Array<{ agentId: string; errors: string[] }> = []

    for (const file of files) {
      try {
        const content = await fs.readFile(file.path, 'utf-8')
        const validation = await this.validateSkills(content)

        if (!validation.valid) {
          invalid.push({ agentId: file.agentId, errors: validation.errors })
        }
      } catch (error) {
        invalid.push({ agentId: file.agentId, errors: [`Failed to read: ${error}`] })
      }
    }

    return {
      total: files.length,
      valid: files.length - invalid.length,
      invalid
    }
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

export const skillsManager = new SkillsManager()
