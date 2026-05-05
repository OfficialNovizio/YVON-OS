/**
 * Gatekeeper — Pre-flight Validation Layer
 * Classifies user intent and routes to the correct agent BEFORE any LLM call.
 * Uses lightweight Haiku model for fast classification.
 */

import type { AgentId, AgentDepartment, RoutingIntent } from './types'

export interface GatekeeperResult {
  targetAgent: AgentId
  department: AgentDepartment
  confidence: number
  reasoning: string
  missingContext: string[]
  suggestedReformulation?: string
}

// ─── Agent Department Mapping ─────────────────────────────────────────────────

const AGENT_DEPARTMENTS: Record<AgentId, AgentDepartment> = {
  'marcus-ceo': 'ceo',
  'diana-coo': 'ceo',
  'dev-lead': 'technical',
  'raj-backend': 'technical',
  'mia-frontend': 'technical',
  'quinn-qa': 'technical',
  'lena-brand': 'marketing',
  'rio-ads': 'marketing',
  'atlas-art-director': 'marketing',
  'pixel-production': 'marketing',
  'kai-analyst': 'marketing',
  'nate-growth': 'marketing',
  'felix-finance': 'finance',
  'daniel-kahneman': 'psychology',
}

// ─── Keyword-Based Intent Patterns ────────────────────────────────────────────

const INTENT_PATTERNS: Array<{
  intent: RoutingIntent
  keywords: string[]
  agents: AgentId[]
}> = [
  // CEO Department
  {
    intent: 'strategy',
    keywords: ['strategy', 'strategic', 'priority', 'priorities', 'business direction', 'executive', 'ceo'],
    agents: ['marcus-ceo', 'diana-coo']
  },
  {
    intent: 'operations',
    keywords: ['operations', 'process', 'workflow', 'sprint', 'planning', 'milestone', 'backlog'],
    agents: ['diana-coo', 'marcus-ceo']
  },
  // Technical Department
  {
    intent: 'technical_backend',
    keywords: ['api', 'endpoint', 'database', 'query', 'schema', 'migration', 'supabase', 'backend', 'server'],
    agents: ['raj-backend', 'dev-lead']
  },
  {
    intent: 'technical_frontend',
    keywords: ['ui', 'component', 'layout', 'css', 'tailwind', 'design', 'page', 'responsive', 'animation', 'react'],
    agents: ['mia-frontend', 'dev-lead']
  },
  {
    intent: 'technical_general',
    keywords: ['architecture', 'refactor', 'code', 'typescript', 'next.js', 'build', 'deploy', 'error', 'bug'],
    agents: ['dev-lead', 'quinn-qa']
  },
  {
    intent: 'qa_review',
    keywords: ['test', 'qa', 'quality', 'review', 'regression', 'edge case', 'verification'],
    agents: ['quinn-qa', 'dev-lead']
  },
  // Marketing Department
  {
    intent: 'marketing_content',
    keywords: ['content', 'caption', 'copy', 'write', 'email', 'newsletter', 'brand voice'],
    agents: ['lena-brand', 'kai-analyst']
  },
  {
    intent: 'social_tactics',
    keywords: ['social', 'instagram', 'linkedin', 'tiktok', 'posting', 'engagement', 'hashtag'],
    agents: ['kai-analyst', 'lena-brand']
  },
  {
    intent: 'advertising',
    keywords: ['ad', 'ads', 'paid', 'meta', 'cpm', 'roas', 'campaign', 'targeting', 'retargeting'],
    agents: ['rio-ads', 'marcus-ceo']
  },
  {
    intent: 'growth_data',
    keywords: ['growth', 'funnel', 'experiment', 'kpi', 'metric', 'analytics', 'data'],
    agents: ['kai-analyst', 'nate-growth']
  },
  {
    intent: 'competitor_intel',
    keywords: ['competitor', 'competitor intel', 'market', 'competitive', 'rival'],
    agents: ['kai-analyst', 'rio-ads']
  },
  {
    intent: 'trending_content',
    keywords: ['trending', 'trend', 'viral', 'trend analysis'],
    agents: ['kai-analyst', 'lena-brand']
  },
  // Finance Department
  {
    intent: 'product_roadmap',
    keywords: ['budget', 'finance', 'revenue', 'cost', 'profit', 'cac', 'ltv', 'mrr', 'roi', 'p&l', 'unit economics'],
    agents: ['felix-finance', 'diana-coo']
  }
]

// ─── Gatekeeper Classification Logic ──────────────────────────────────────────

export function classifyIntent(message: string): {
  intent: RoutingIntent
  agents: AgentId[]
  confidence: number
} {
  const lower = message.toLowerCase()

  let bestMatch = {
    intent: 'strategy' as RoutingIntent,
    agents: ['marcus-ceo', 'diana-coo'] as AgentId[],
    confidence: 0.3 // default fallback
  }

  for (const pattern of INTENT_PATTERNS) {
    const matches = pattern.keywords.filter(kw => lower.includes(kw))
    if (matches.length > 0) {
      const confidence = Math.min(matches.length * 0.2 + 0.3, 0.95)
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          intent: pattern.intent,
          agents: pattern.agents,
          confidence
        }
      }
    }
  }

  return bestMatch
}

// ─── Context Validation ────────────────────────────────────────────────────────

const CONTEXT_REQUIREMENTS: Record<RoutingIntent, string[]> = {
  marketing_content: ['brand'],
  social_tactics: ['brand', 'platform'],
  content_create: ['brand'],
  growth_data: ['metric', 'time period'],
  competitor_intel: ['competitor name'],
  technical_backend: [],
  technical_frontend: [],
  technical_general: [],
  qa_review: ['feature or code'],
  trending_content: [],
  operations: [],
  product_roadmap: [],
  advertising: ['product or offer', 'budget'],
  strategy: [],
}

export function validateContext(
  message: string,
  intent: RoutingIntent
): { valid: boolean; missing: string[] } {
  const required = CONTEXT_REQUIREMENTS[intent] || []
  const lower = message.toLowerCase()

  const missing = required.filter(ctx => {
    // Check for common indicators of missing context
    if (ctx === 'brand') return !lower.includes('novizio') && !lower.includes('hourbour')
    if (ctx === 'platform') return !lower.includes('instagram') && !lower.includes('linkedin') && !lower.includes('tiktok')
    if (ctx === 'competitor name') return !lower.includes('competitor') && !lower.includes('rival')
    if (ctx === 'metric') return !lower.includes('metric') && !lower.includes('kpi') && !lower.includes('data')
    if (ctx === 'time period') return !lower.includes('month') && !lower.includes('week') && !lower.includes('quarter')
    if (ctx === 'budget') return !lower.includes('budget') && !lower.includes('spend')
    if (ctx === 'product or offer') return !lower.includes('product') && !lower.includes('offer')
    return false
  })

  return {
    valid: missing.length === 0,
    missing
  }
}

// ─── Main Gatekeeper Function ──────────────────────────────────────────────────

export function gatekeep(
  message: string,
  venture?: string
): GatekeeperResult {
  // Step 1: Classify intent
  const { intent, agents, confidence } = classifyIntent(message)

  // Step 2: Select primary agent
  const targetAgent = agents[0]

  // Step 3: Validate context
  const { valid, missing } = validateContext(message, intent)

  // Step 4: Generate reasoning
  const reasoning = generateReasoning(intent, targetAgent, confidence, missing)

  // Step 5: Suggest reformulation if needed
  const suggestedReformulation = !valid
    ? generateReformulation(message, intent, missing, venture)
    : undefined

  return {
    targetAgent,
    department: AGENT_DEPARTMENTS[targetAgent],
    confidence,
    reasoning,
    missingContext: missing,
    suggestedReformulation
  }
}

// ─── Reasoning Generation ──────────────────────────────────────────────────────

function generateReasoning(
  intent: RoutingIntent,
  agent: AgentId,
  confidence: number,
  missing: string[]
): string {
  const intentDescriptions: Record<RoutingIntent, string> = {
    strategy: 'Executive strategy and priorities',
    marketing_content: 'Content creation and copywriting',
    social_tactics: 'Social media tactics and scheduling',
    content_create: 'Creative content production',
    growth_data: 'Analytics and growth metrics',
    competitor_intel: 'Competitive intelligence and market analysis',
    technical_backend: 'Backend development and APIs',
    technical_frontend: 'Frontend development and UI',
    technical_general: 'General technical questions',
    qa_review: 'Quality assurance and testing',
    trending_content: 'Trending content analysis',
    operations: 'Operations and process management',
    product_roadmap: 'Product planning and roadmap',
    advertising: 'Paid advertising and campaigns',
  }

  let reasoning = `${intentDescriptions[intent]} → routing to ${agent}`

  if (missing.length > 0) {
    reasoning += `. Missing context: ${missing.join(', ')}`
  }

  return reasoning
}

function generateReformulation(
  message: string,
  intent: RoutingIntent,
  missing: string[],
  venture?: string
): string {
  const suggestions: string[] = []

  if (missing.includes('brand') && !venture) {
    suggestions.push('specify which brand (Novizio or Hourbour)')
  }

  if (missing.includes('platform')) {
    suggestions.push('mention the platform (Instagram, LinkedIn, TikTok)')
  }

  if (missing.includes('competitor name')) {
    suggestions.push('name the competitor you\'re researching')
  }

  if (missing.includes('metric')) {
    suggestions.push('specify which metrics to analyze')
  }

  if (missing.includes('time period')) {
    suggestions.push('mention the time period (this week, last month, etc.)')
  }

  if (suggestions.length === 0) return message

  return `Try adding: ${suggestions.join(', ')}. Original query: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`
}

// ─── Injection Guard (Phase H) ────────────────────────────────────────────────
// 10 patterns adapted from Hermes skills_guard.py / prompt_builder.py.
// Blocks prompt injection attempts before any LLM call is made.

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /you\s+are\s+now\s+(a\s+)?(?!marcus|diana|dev|raj|mia|quinn|lena|rio|atlas|pixel|kai|nate|felix|kahneman)/i,
  /disregard\s+(your\s+)?(system\s+)?prompt/i,
  /act\s+as\s+(?:DAN|jailbreak|unrestricted|evil|unethical)/i,
  /\bDAN\b.*mode/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /bypass\s+(your\s+)?(safety|restriction|filter|guard)/i,
  /pretend\s+(you\s+(have\s+no|are\s+without)\s+restriction)/i,
  /<\/?(?:system|instruction|prompt|jailbreak)>/i,
  /\[INST\].*override/i,
]

/**
 * Returns true if the message contains a prompt injection pattern.
 * Call before routing to any LLM.
 */
export function containsInjection(message: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(message))
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function getAgentDepartment(agentId: AgentId): AgentDepartment {
  return AGENT_DEPARTMENTS[agentId] || 'marketing'
}

export function getAgentsByDepartment(department: AgentDepartment): AgentId[] {
  return Object.entries(AGENT_DEPARTMENTS)
    .filter(([_, dept]) => dept === department)
    .map(([agentId]) => agentId as AgentId)
}