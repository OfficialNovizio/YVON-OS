/**
 * Routing Feedback Loop System
 * Learns from user feedback to improve agent routing accuracy
 */

import { promises as fs } from 'fs'
import path from 'path'
import { monitoring } from './monitoring'
import type { AgentId } from './types'

// ─── Configuration ────────────────────────────────────────────────────────────

export interface RoutingFeedbackConfig {
  minSamplesForLearning: number
  confidenceThreshold: number
  feedbackRetentionDays: number
}

export const ROUTING_FEEDBACK_CONFIG: RoutingFeedbackConfig = {
  minSamplesForLearning: 10,
  confidenceThreshold: 0.8,
  feedbackRetentionDays: 90
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoutingFeedback {
  id: string
  timestamp: string
  query: string
  selectedAgents: AgentId[]
  feedback: 'good' | 'bad' | 'neutral'
  confidence: number
  suggestedAgents?: AgentId[]
  notes?: string
}

export interface RoutingPattern {
  queryPattern: string
  successfulAgents: AgentId[]
  failureCount: number
  successCount: number
  confidence: number
  lastUsed: string
}

export interface RoutingOptimization {
  timestamp: string
  changes: Array<{
    intent: string
    oldAgents: AgentId[]
    newAgents: AgentId[]
    reason: string
  }>
  accuracyBefore: number
  accuracyAfter: number
}

// ─── Core Routing Feedback Service ────────────────────────────────────────────

export class RoutingFeedbackService {
  private feedbackFile: string
  private patternsFile: string
  private optimizationFile: string
  private feedback: RoutingFeedback[] = []
  private patterns: RoutingPattern[] = []

  constructor() {
    const feedbackDir = path.join(process.cwd(), '.yvon-os', 'routing-feedback')
    this.feedbackFile = path.join(feedbackDir, 'feedback.json')
    this.patternsFile = path.join(feedbackDir, 'patterns.json')
    this.optimizationFile = path.join(feedbackDir, 'optimizations.json')

    this.initFeedbackDir(feedbackDir)
  }

  private async initFeedbackDir(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true })
      await this.loadExistingData()
    } catch (error) {
      console.warn('Failed to initialize routing feedback:', error)
    }
  }

  private async loadExistingData(): Promise<void> {
    try {
      const feedbackContent = await fs.readFile(this.feedbackFile, 'utf-8')
      this.feedback = JSON.parse(feedbackContent)
    } catch {
      this.feedback = []
    }

    try {
      const patternsContent = await fs.readFile(this.patternsFile, 'utf-8')
      this.patterns = JSON.parse(patternsContent)
    } catch {
      this.patterns = []
    }
  }

  // ─── Feedback Recording ──────────────────────────────────────────────────────

  recordFeedback(
    query: string,
    selectedAgents: AgentId[],
    feedback: 'good' | 'bad' | 'neutral',
    suggestedAgents?: AgentId[],
    notes?: string
  ): RoutingFeedback {
    const entry: RoutingFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      query,
      selectedAgents,
      feedback,
      confidence: this.calculateConfidence(query, selectedAgents),
      suggestedAgents,
      notes
    }

    this.feedback.push(entry)
    this.saveFeedback()

    // Update patterns
    this.updatePatterns(entry)

    monitoring.info(`Routing feedback recorded: ${feedback}`, { query, selectedAgents })

    return entry
  }

  /**
   * Calculate routing confidence based on query analysis
   */
  private calculateConfidence(query: string, agents: AgentId[]): number {
    const queryWords = query.toLowerCase().split(/\s+/)
    const agentKeywords: Record<string, string[]> = {
      'technical': ['api', 'code', 'build', 'error', 'typescript', 'supabase', 'backend', 'frontend'],
      'marketing': ['content', 'brand', 'social', 'creative', 'copy', 'ads'],
      'analytics': ['data', 'metric', 'analytics', 'growth', 'kpi', 'report'],
      'executive': ['strategy', 'priority', 'decision', 'plan', 'ceo', 'coo'],
      'operations': ['process', 'workflow', 'budget', 'planning', 'finance']
    }

    let matches = 0
    agents.forEach(agentId => {
      const layer = this.getAgentLayer(agentId)
      const keywords = agentKeywords[layer] || []
      matches += queryWords.filter(w => keywords.includes(w)).length
    })

    return Math.min(matches / Math.max(queryWords.length, 1), 1)
  }

  private getAgentLayer(agentId: AgentId): string {
    const layerMap: Record<string, string> = {
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
    return layerMap[agentId] || 'personal'
  }

  // ─── Pattern Learning ────────────────────────────────────────────────────────

  private updatePatterns(feedback: RoutingFeedback): void {
    const normalizedQuery = this.normalizeQuery(feedback.query)

    let pattern = this.patterns.find(p => p.queryPattern === normalizedQuery)

    if (pattern) {
      // Update existing pattern
      if (feedback.feedback === 'good') {
        pattern.successCount++
        // Update successful agents (weighted)
        feedback.selectedAgents.forEach(agent => {
          if (!pattern.successfulAgents.includes(agent)) {
            pattern.successfulAgents.push(agent)
          }
        })
      } else {
        pattern.failureCount++
      }
      pattern.lastUsed = feedback.timestamp
    } else {
      // Create new pattern
      pattern = {
        queryPattern: normalizedQuery,
        successfulAgents: feedback.feedback === 'good' ? feedback.selectedAgents : [],
        failureCount: feedback.feedback === 'bad' ? 1 : 0,
        successCount: feedback.feedback === 'good' ? 1 : 0,
        confidence: 0.5,
        lastUsed: feedback.timestamp
      }
      this.patterns.push(pattern)
    }

    // Update confidence
    const total = pattern.successCount + pattern.failureCount
    if (total >= ROUTING_FEEDBACK_CONFIG.minSamplesForLearning) {
      pattern.confidence = pattern.successCount / total
    }

    this.savePatterns()
  }

  private normalizeQuery(query: string): string {
    // Normalize query for pattern matching
    return query
      .toLowerCase()
      .replace(/\d+/g, '[NUMBER]')
      .replace(/\b[a-f0-9]{8,}/gi, '[ID]')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // ─── Routing Optimization ────────────────────────────────────────────────────

  async optimizeRouting(): Promise<RoutingOptimization> {
    const changes: Array<{
      intent: string
      oldAgents: AgentId[]
      newAgents: AgentId[]
      reason: string
    }> = []

    // Analyze patterns and suggest improvements
    const patterns = this.getPatterns()

    for (const pattern of patterns) {
      if (pattern.confidence < ROUTING_FEEDBACK_CONFIG.confidenceThreshold && pattern.successCount > 5) {
        // Pattern has low confidence despite many samples - needs optimization
        const bestAgents = pattern.successfulAgents
          .sort((a, b) => {
            const aCount = this.getAgentSuccessCount(a, pattern.queryPattern)
            const bCount = this.getAgentSuccessCount(b, pattern.queryPattern)
            return bCount - aCount
          })
          .slice(0, 2)

        if (bestAgents.length > 0) {
          changes.push({
            intent: pattern.queryPattern,
            oldAgents: pattern.successfulAgents,
            newAgents: bestAgents,
            reason: `Low confidence (${pattern.confidence.toFixed(2)}) with ${pattern.successCount} samples`
          })
        }
      }
    }

    // Calculate accuracy improvements
    const accuracyBefore = this.calculateOverallAccuracy()
    const accuracyAfter = accuracyBefore + (changes.length * 0.01) // Estimate improvement

    const optimization: RoutingOptimization = {
      timestamp: new Date().toISOString(),
      changes,
      accuracyBefore,
      accuracyAfter
    }

    // Save optimization
    try {
      const optimizations: RoutingOptimization[] = []
      try {
        const content = await fs.readFile(this.optimizationFile, 'utf-8')
        optimizations.push(...JSON.parse(content))
      } catch {
        // No existing optimizations
      }

      optimizations.push(optimization)
      await fs.writeFile(this.optimizationFile, JSON.stringify(optimizations, null, 2))
    } catch (error) {
      monitoring.warn('Failed to save routing optimization', { error: String(error) })
    }

    monitoring.info(`Routing optimization completed: ${changes.length} changes`, {
      accuracyBefore,
      accuracyAfter
    })

    return optimization
  }

  private getAgentSuccessCount(agentId: AgentId, queryPattern: string): number {
    return this.feedback.filter(f =>
      f.selectedAgents.includes(agentId) &&
      f.feedback === 'good' &&
      this.normalizeQuery(f.query) === queryPattern
    ).length
  }

  private calculateOverallAccuracy(): number {
    const recentFeedback = this.feedback.filter(f =>
      new Date(f.timestamp).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    )

    if (recentFeedback.length === 0) return 0.5 // Default

    const goodCount = recentFeedback.filter(f => f.feedback === 'good').length
    return goodCount / recentFeedback.length
  }

  // ─── Query Suggestion ────────────────────────────────────────────────────────

  suggestAgents(query: string): AgentId[] {
    const normalizedQuery = this.normalizeQuery(query)
    const pattern = this.patterns.find(p => p.queryPattern === normalizedQuery)

    if (pattern && pattern.confidence >= ROUTING_FEEDBACK_CONFIG.confidenceThreshold) {
      return pattern.successfulAgents
    }

    // No confident pattern found - return empty to use default routing
    return []
  }

  // ─── Reporting ───────────────────────────────────────────────────────────────

  async generateReport(): Promise<{
    timestamp: string
    totalFeedback: number
    recentFeedback: number
    patterns: number
    overallAccuracy: number
    topPatterns: Array<{
      pattern: string
      confidence: number
      successRate: number
      agents: AgentId[]
    }>
  }> {
    const recentFeedback = this.feedback.filter(f =>
      new Date(f.timestamp).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
    )

    const topPatterns = this.patterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)
      .map(p => ({
        pattern: p.queryPattern,
        confidence: p.confidence,
        successRate: p.successCount / (p.successCount + p.failureCount),
        agents: p.successfulAgents
      }))

    return {
      timestamp: new Date().toISOString(),
      totalFeedback: this.feedback.length,
      recentFeedback: recentFeedback.length,
      patterns: this.patterns.length,
      overallAccuracy: this.calculateOverallAccuracy(),
      topPatterns
    }
  }

  // ─── Save Operations ─────────────────────────────────────────────────────────

  private async saveFeedback(): Promise<void> {
    try {
      await fs.writeFile(this.feedbackFile, JSON.stringify(this.feedback, null, 2))
    } catch (error) {
      console.warn('Failed to save feedback:', error)
    }
  }

  private async savePatterns(): Promise<void> {
    try {
      await fs.writeFile(this.patternsFile, JSON.stringify(this.patterns, null, 2))
    } catch (error) {
      console.warn('Failed to save patterns:', error)
    }
  }

  getPatterns(): RoutingPattern[] {
    const cutoff = Date.now() - (ROUTING_FEEDBACK_CONFIG.feedbackRetentionDays * 24 * 60 * 60 * 1000)
    return this.patterns.filter(p => new Date(p.lastUsed).getTime() > cutoff)
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

export const routingFeedback = new RoutingFeedbackService()
