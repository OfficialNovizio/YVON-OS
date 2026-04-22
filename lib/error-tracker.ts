/**
 * Error Tracking and Auto-Fix System
 * Tracks recurring errors and suggests auto-fixes
 */

import { promises as fs } from 'fs'
import path from 'path'
import { monitoring } from './monitoring'

// ─── Configuration ────────────────────────────────────────────────────────────

export interface ErrorTrackerConfig {
  maxPatternAgeDays: number
  minFrequencyForPattern: number
  autoFixThreshold: number
}

export const ERROR_TRACKER_CONFIG: ErrorTrackerConfig = {
  maxPatternAgeDays: 30,
  minFrequencyForPattern: 2,
  autoFixThreshold: 0.7 // 70% confidence for auto-fix
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ErrorEntry {
  id: string
  timestamp: string
  agentId: string
  context: string
  message: string
  stack?: string
  resolved: boolean
  autoFixed: boolean
}

export interface ErrorPattern {
  id: string
  pattern: string
  frequency: number
  firstSeen: string
  lastSeen: string
  suggestedFix: string
  autoFixEnabled: boolean
  autoFixConfidence: number
}

export interface ErrorReport {
  timestamp: string
  totalErrors: number
  unresolvedErrors: number
  patterns: ErrorPattern[]
  recommendations: string[]
}

// ─── Core Error Tracker ───────────────────────────────────────────────────────

export class ErrorTracker {
  private errorsFile: string
  private patternsFile: string
  private errors: ErrorEntry[] = []
  private patterns: ErrorPattern[] = []

  constructor() {
    const trackingDir = path.join(process.cwd(), '.yvon-os', 'error-tracking')
    this.errorsFile = path.join(trackingDir, 'errors.json')
    this.patternsFile = path.join(trackingDir, 'patterns.json')

    this.initTrackingDir(trackingDir)
  }

  private async initTrackingDir(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true })
      await this.loadExistingData()
    } catch (error) {
      console.warn('Failed to initialize error tracking:', error)
    }
  }

  private async loadExistingData(): Promise<void> {
    try {
      const errorsContent = await fs.readFile(this.errorsFile, 'utf-8')
      this.errors = JSON.parse(errorsContent)
    } catch {
      this.errors = []
    }

    try {
      const patternsContent = await fs.readFile(this.patternsFile, 'utf-8')
      this.patterns = JSON.parse(patternsContent)
    } catch {
      this.patterns = []
    }
  }

  // ─── Error Recording ─────────────────────────────────────────────────────────

  recordError(
    agentId: string,
    message: string,
    context: Record<string, unknown> = {}
  ): ErrorEntry {
    const error: ErrorEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      agentId,
      context: JSON.stringify(context),
      message,
      stack: context.stack as string,
      resolved: false,
      autoFixed: false
    }

    this.errors.push(error)
    this.saveErrors()

    // Update patterns
    this.updatePatterns(error)

    monitoring.error(`Error recorded: ${message}`, { agentId, context })

    return error
  }

  /**
   * Analyze error patterns and generate fixes
   */
  private updatePatterns(error: ErrorEntry): void {
    const normalizedMessage = this.normalizeErrorMessage(error.message)

    let pattern = this.patterns.find(p => p.pattern === normalizedMessage)

    if (pattern) {
      // Update existing pattern
      pattern.frequency++
      pattern.lastSeen = error.timestamp
    } else {
      // Create new pattern
      pattern = {
        id: `pattern_${Date.now()}`,
        pattern: normalizedMessage,
        frequency: 1,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        suggestedFix: this.suggestFix(normalizedMessage),
        autoFixEnabled: false,
        autoFixConfidence: 0
      }
      this.patterns.push(pattern)
    }

    // Update auto-fix confidence based on frequency
    if (pattern.frequency >= ERROR_TRACKER_CONFIG.minFrequencyForPattern) {
      pattern.autoFixConfidence = Math.min(pattern.frequency / 10, 1)
      pattern.autoFixEnabled = pattern.autoFixConfidence >= ERROR_TRACKER_CONFIG.autoFixThreshold
    }

    this.savePatterns()
  }

  /**
   * Normalize error message for pattern matching
   */
  private normalizeErrorMessage(message: string): string {
    // Remove variable values and timestamps
    return message
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]')
      .replace(/\d+/g, '[NUMBER]')
      .replace(/'[^']*'/g, '[STRING]')
      .replace(/"[^"]*"/g, '[STRING]')
      .replace(/\b[a-f0-9]{8,}/gi, '[ID]')
      .trim()
  }

  /**
   * Suggest fix for error pattern
   */
  private suggestFix(message: string): string {
    const fixMap: Record<string, string> = {
      'API key not set': 'Check environment variables and restart server',
      'Connection timeout': 'Check network connectivity and retry',
      'Invalid JSON': 'Validate request body format',
      'File not found': 'Check file path and permissions',
      'Permission denied': 'Check file permissions and ownership'
    }

    for (const [pattern, fix] of Object.entries(fixMap)) {
      if (message.toLowerCase().includes(pattern.toLowerCase())) {
        return fix
      }
    }

    return 'Review logs and check documentation'
  }

  // ─── Error Resolution ────────────────────────────────────────────────────────

  resolveError(errorId: string, resolvedBy?: string): boolean {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      this.saveErrors()
      monitoring.info(`Error resolved: ${error.message}`, { errorId, resolvedBy })
      return true
    }
    return false
  }

  markAsAutoFixed(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.autoFixed = true
      error.resolved = true
      this.saveErrors()
      monitoring.info(`Error auto-fixed: ${error.message}`, { errorId })
      return true
    }
    return false
  }

  // ─── Pattern Management ──────────────────────────────────────────────────────

  getPatterns(): ErrorPattern[] {
    const cutoff = Date.now() - (ERROR_TRACKER_CONFIG.maxPatternAgeDays * 24 * 60 * 60 * 1000)
    return this.patterns.filter(p => new Date(p.lastSeen).getTime() > cutoff)
  }

  getAutoFixablePatterns(): ErrorPattern[] {
    return this.patterns.filter(p => p.autoFixEnabled && p.autoFixConfidence >= ERROR_TRACKER_CONFIG.autoFixThreshold)
  }

  enableAutoFix(patternId: string, fix: string): boolean {
    const pattern = this.patterns.find(p => p.id === patternId)
    if (pattern) {
      pattern.autoFixEnabled = true
      pattern.suggestedFix = fix
      this.savePatterns()
      return true
    }
    return false
  }

  // ─── Reporting ───────────────────────────────────────────────────────────────

  async generateReport(): Promise<ErrorReport> {
    const unresolvedErrors = this.errors.filter(e => !e.resolved)
    const patterns = this.getPatterns()
    const autoFixable = this.getAutoFixablePatterns()

    const recommendations: string[] = []

    if (autoFixable.length > 0) {
      recommendations.push(`Enable auto-fix for ${autoFixable.length} recurring patterns`)
    }

    if (unresolvedErrors.length > 10) {
      recommendations.push(`High number of unresolved errors (${unresolvedErrors.length}) - investigate root cause`)
    }

    if (patterns.some(p => p.frequency > 5)) {
      recommendations.push('Some errors occurring frequently - consider adding to SKILLS.md Never Again section')
    }

    return {
      timestamp: new Date().toISOString(),
      totalErrors: this.errors.length,
      unresolvedErrors: unresolvedErrors.length,
      patterns,
      recommendations
    }
  }

  // ─── Save Operations ─────────────────────────────────────────────────────────

  private async saveErrors(): Promise<void> {
    try {
      await fs.writeFile(this.errorsFile, JSON.stringify(this.errors, null, 2))
    } catch (error) {
      console.warn('Failed to save errors:', error)
    }
  }

  private async savePatterns(): Promise<void> {
    try {
      await fs.writeFile(this.patternsFile, JSON.stringify(this.patterns, null, 2))
    } catch (error) {
      console.warn('Failed to save patterns:', error)
    }
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

export const errorTracker = new ErrorTracker()
