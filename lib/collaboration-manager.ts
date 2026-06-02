/**
 * Collaboration Manager
 * Enhances agent collaboration with routing intelligence, handoff protocols,
 * and conflict resolution
 */

import { getAgent, AGENTS } from './agents'
import type { AgentId, RoutingResult } from './types'

// ─── Configuration ────────────────────────────────────────────────────────────

export interface CollaborationConfig {
  maxSpecialists: number
  minConfidence: number
  handoffThreshold: number
}

export const COLLAB_CONFIG: CollaborationConfig = {
  maxSpecialists: 4,
  minConfidence: 0.7,
  handoffThreshold: 0.5
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentCollaboration {
  agentId: AgentId
  role: string
  department: string
  canCollaborateWith: AgentId[]
  dependencies: string[]
  autonomyLevel: 1 | 2 | 3
}

export interface RoutingHistory {
  query: string
  selectedAgents: AgentId[]
  timestamp: string
  userFeedback?: 'good' | 'bad' | 'neutral'
  successScore?: number
}

export interface HandoffRequest {
  fromAgent: AgentId
  toAgent: AgentId
  reason: string
  context: string
  timestamp: string
}

// ─── Collaboration Graph ──────────────────────────────────────────────────────

export const COLLABORATION_GRAPH: Record<AgentId, AgentCollaboration> = {
  'marcus-ceo': {
    agentId: 'marcus-ceo',
    role: 'Chief Executive Officer',
    department: 'ceo',
    canCollaborateWith: ['diana-coo', 'lena-brand', 'kai-analyst'],
    dependencies: [],
    autonomyLevel: 1
  },
  'diana-coo': {
    agentId: 'diana-coo',
    role: 'Chief Operating Officer',
    department: 'ceo',
    canCollaborateWith: ['marcus-ceo', 'dev-lead', 'kai-analyst'],
    dependencies: [],
    autonomyLevel: 1
  },
  'dev-lead': {
    agentId: 'dev-lead',
    role: 'Lead Developer',
    department: 'technical',
    canCollaborateWith: ['raj-backend', 'mia-frontend', 'quinn-qa', 'diana-coo'],
    dependencies: ['raj-backend', 'mia-frontend'],
    autonomyLevel: 1
  },
  'raj-backend': {
    agentId: 'raj-backend',
    role: 'Backend Developer',
    department: 'technical',
    canCollaborateWith: ['dev-lead', 'mia-frontend'],
    dependencies: [],
    autonomyLevel: 2
  },
  'mia-frontend': {
    agentId: 'mia-frontend',
    role: 'Frontend Developer',
    department: 'technical',
    canCollaborateWith: ['dev-lead', 'raj-backend'],
    dependencies: [],
    autonomyLevel: 2
  },
  'quinn-qa': {
    agentId: 'quinn-qa',
    role: 'QA Engineer',
    department: 'technical',
    canCollaborateWith: ['dev-lead', 'raj-backend', 'mia-frontend'],
    dependencies: [],
    autonomyLevel: 2
  },
  'lena-brand': {
    agentId: 'lena-brand',
    role: 'Brand Strategist',
    department: 'marketing',
    canCollaborateWith: ['marcus-ceo', 'atlas-art-director', 'kai-analyst'],
    dependencies: [],
    autonomyLevel: 2
  },
  'rio-ads': {
    agentId: 'rio-ads',
    role: 'Ads Specialist',
    department: 'marketing',
    canCollaborateWith: ['marcus-ceo', 'lena-brand'],
    dependencies: [],
    autonomyLevel: 2
  },
  'atlas-art-director': {
    agentId: 'atlas-art-director',
    role: 'Art Director',
    department: 'marketing',
    canCollaborateWith: ['lena-brand', 'pixel-production'],
    dependencies: ['pixel-production'],
    autonomyLevel: 2
  },
  'pixel-production': {
    agentId: 'pixel-production',
    role: 'Production Specialist',
    department: 'marketing',
    canCollaborateWith: ['atlas-art-director'],
    dependencies: [],
    autonomyLevel: 2
  },
  'kai-analyst': {
    agentId: 'kai-analyst',
    role: 'Lead Analyst',
    department: 'marketing',
    canCollaborateWith: ['marcus-ceo', 'nate-growth', 'lena-brand'],
    dependencies: [],
    autonomyLevel: 1
  },
  'nate-growth': {
    agentId: 'nate-growth',
    role: 'Growth Specialist',
    department: 'marketing',
    canCollaborateWith: ['kai-analyst', 'marcus-ceo'],
    dependencies: [],
    autonomyLevel: 2
  },
  'felix-finance': {
    agentId: 'felix-finance',
    role: 'Finance Manager',
    department: 'finance',
    canCollaborateWith: ['diana-coo', 'marcus-ceo'],
    dependencies: [],
    autonomyLevel: 2
  },
  'daniel-kahneman': {
    agentId: 'daniel-kahneman',
    role: 'Behavioral Economist',
    department: 'psychology',
    canCollaborateWith: ['marcus-ceo', 'lena-brand', 'rio-ads', 'kai-analyst', 'nate-growth', 'felix-finance'],
    dependencies: [],
    autonomyLevel: 2
  }
}

// ─── Routing Intelligence ─────────────────────────────────────────────────────

/**
 * Calculate routing confidence based on query analysis
 */
export function calculateRoutingConfidence(
  query: string,
  selectedAgents: AgentId[]
): number {
  // Simple heuristic: more specific queries = higher confidence
  const queryLength = query.length
  const wordCount = query.split(/\s+/).length

  // Longer, more specific queries get higher confidence
  let confidence = 0.5 + Math.min(wordCount / 20, 0.4) // Cap at 0.9

  // Adjust based on agent specialization match
  const keywords = query.toLowerCase().split(/\s+/)
  const deptKeywords: Record<string, string[]> = {
    technical: ['api', 'code', 'build', 'error', 'typescript', 'supabase', 'database', 'backend', 'frontend'],
    marketing: ['content', 'brand', 'social', 'creative', 'copy', 'ads', 'data', 'metric', 'analytics', 'growth', 'kpi', 'trend'],
    ceo: ['strategy', 'priority', 'decision', 'plan', 'operations', 'process', 'workflow'],
    finance: ['budget', 'finance', 'revenue', 'cost', 'profit', 'cac', 'ltv', 'mrr', 'roi']
  }

  for (const agentId of selectedAgents) {
    const agent = COLLABORATION_GRAPH[agentId]
    if (agent) {
      const agentKeywords = deptKeywords[agent.department] || []
      const matches = keywords.filter(k => agentKeywords.includes(k))
      if (matches.length > 0) {
        confidence += 0.1
      }
    }
  }

  return Math.min(confidence, 1.0)
}

/**
 * Recommend agent collaboration based on query
 */
export function recommendCollaboration(
  primaryAgent: AgentId,
  query: string
): AgentId[] {
  const collab = COLLABORATION_GRAPH[primaryAgent]
  if (!collab) return []

  // Find agents who can collaborate with primary
  const potentialPartners = collab.canCollaborateWith

  // Score each partner based on query relevance
  const scoredPartners = potentialPartners.map(partnerId => {
    const partner = COLLABORATION_GRAPH[partnerId]
    if (!partner) return { agentId: partnerId, score: 0 }

    // Simple keyword matching
    const keywords = query.toLowerCase().split(/\s+/)
    const deptKeywords: Record<string, string[]> = {
      technical: ['api', 'code', 'build', 'error', 'typescript', 'supabase', 'database', 'backend', 'frontend'],
      marketing: ['content', 'brand', 'social', 'creative', 'copy', 'ads', 'data', 'metric', 'analytics', 'growth', 'kpi', 'trend'],
      ceo: ['strategy', 'priority', 'decision', 'plan', 'operations', 'process', 'workflow'],
      finance: ['budget', 'finance', 'revenue', 'cost', 'profit', 'cac', 'ltv', 'mrr', 'roi']
    }

    const partnerKeywords = deptKeywords[partner.department] || []
    const matches = keywords.filter(k => partnerKeywords.includes(k))

    return {
      agentId: partnerId,
      score: matches.length / Math.max(keywords.length, 1)
    }
  })

  // Return top 2 partners
  return scoredPartners
    .sort((a, b) => b.score - a.score)
    .slice(0, COLLAB_CONFIG.maxSpecialists - 1)
    .map(p => p.agentId)
}

// ─── Handoff Protocol ─────────────────────────────────────────────────────────

export class HandoffManager {
  private history: HandoffRequest[] = []

  /**
   * Request handoff from one agent to another
   */
  requestHandoff(
    fromAgent: AgentId,
    toAgent: AgentId,
    reason: string,
    context: string
  ): HandoffRequest {
    const request: HandoffRequest = {
      fromAgent,
      toAgent,
      reason,
      context,
      timestamp: new Date().toISOString()
    }

    this.history.push(request)

    // Keep only last 100 handoffs
    if (this.history.length > 100) {
      this.history = this.history.slice(-100)
    }

    return request
  }

  /**
   * Get handoff history for an agent
   */
  getAgentHistory(agentId: AgentId): HandoffRequest[] {
    return this.history.filter(
      h => h.fromAgent === agentId || h.toAgent === agentId
    )
  }

  /**
   * Check if handoff pattern is emerging
   */
  detectHandoffPattern(agentId: AgentId, threshold: number = 3): string[] {
    const history = this.getAgentHistory(agentId)
    const patterns: Record<string, number> = {}

    history.forEach(h => {
      const pattern = `${h.fromAgent}->${h.toAgent}`
      patterns[pattern] = (patterns[pattern] || 0) + 1
    })

    return Object.entries(patterns)
      .filter(([_, count]) => count >= threshold)
      .map(([pattern]) => pattern)
  }
}

export const handoffManager = new HandoffManager()

// ─── Autonomy Levels ──────────────────────────────────────────────────────────

export function getAutonomyLevel(agentId: AgentId): 1 | 2 | 3 {
  return COLLABORATION_GRAPH[agentId]?.autonomyLevel || 2
}

export function canActAutonomously(agentId: AgentId, taskType: string): boolean {
  const level = getAutonomyLevel(agentId)

  // Level 1: Fully autonomous (technical errors, data tasks)
  if (level === 1) return true

  // Level 2: Draft + review (content generation)
  if (level === 2) {
    const autonomousTasks = ['data_fetch', 'error_fix', 'code_review']
    return autonomousTasks.includes(taskType)
  }

  // Level 3: Consult only (strategy, budget)
  return false
}

// ─── Conflict Resolution ──────────────────────────────────────────────────────

export interface Conflict {
  agents: AgentId[]
  topic: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
}

export class ConflictResolver {
  private conflicts: Conflict[] = []

  /**
   * Record a conflict between agents
   */
  recordConflict(agents: AgentId[], topic: string, severity: 'low' | 'medium' | 'high'): Conflict {
    const conflict: Conflict = {
      agents,
      topic,
      severity,
      timestamp: new Date().toISOString()
    }

    this.conflicts.push(conflict)
    return conflict
  }

  /**
   * Resolve conflict by escalating to higher authority
   */
  resolveConflict(conflict: Conflict): string {
    // Determine escalation path based on conflict type
    if (conflict.topic.includes('strategy') || conflict.topic.includes('priority')) {
      return 'Escalate to Marcus (CEO) for final decision'
    }

    if (conflict.topic.includes('technical')) {
      return 'Escalate to Dev Lead for technical arbitration'
    }

    if (conflict.topic.includes('budget') || conflict.topic.includes('resource')) {
      return 'Escalate to Diana (COO) for resource allocation'
    }

    return 'Escalate to executive layer for resolution'
  }

  /**
   * Get active conflicts
   */
  getActiveConflicts(): Conflict[] {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return this.conflicts.filter(c => new Date(c.timestamp) > oneWeekAgo)
  }
}

export const conflictResolver = new ConflictResolver()
