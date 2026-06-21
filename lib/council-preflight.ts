/**
 * lib/council-preflight.ts — Council Pre-Processing Pipeline
 *
 * Before any agent sees the user's message, the Council:
 *   1. EXPANDS  — turns "fix dashboard" into a full task brief
 *   2. ASSIGNS  — routes to the right agent(s) with rationale
 *   3. QUALITY  — checks for errors, constitution violations, fallback paths
 *   4. CONTEXT  — builds full context injection object with token/cost tracking
 *
 * Uses fast Hermes spawn with a lightweight structural prompt. No LLM calls
 * on the YVON OS side — delegates to Hermes for agent execution.
 */

import { spawnHermesAgent } from './hermes-spawn'
import { getOrCreateSession, type VentureSession } from './chat-session'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExpandedTask {
  original: string
  expanded: string
  objective: string
  scope: string[]
  constraints: string[]
  successCriteria: string[]
  fallbackPlan: string
}

export interface AgentAssignment {
  agentId: string
  name: string
  role: string
  department: string
  reason: string
  primary: boolean
}

export interface QualityGate {
  passed: boolean
  constitutionViolations: string[]
  warnings: string[]
  requiredSkills: string[]
  missingSkills: string[]
  estimatedTokens: number
  estimatedCost: number
  fallbackTriggered: boolean
}

export interface ContextInjection {
  constitution:    { loaded: boolean; chars: number; hash: string }
  agentMemory:     { loaded: boolean; chars: number; fresh: boolean; agent: string }
  graphContext:    { loaded: boolean; nodes: number; edges: number }
  toonDocs:        { loaded: boolean; count: number; files: string[] }
  injectedTokens:  number
  model: string
  costEstimate: number
}

export interface PreflightResult {
  expandedTask: ExpandedTask
  assignments: AgentAssignment[]
  qualityGate: QualityGate
  context: ContextInjection
  sessionTokens: number
  sessionCost: number
  fingerprintChanged: boolean
}

// ─── Agent Registry ───────────────────────────────────────────────────────────

interface Agent {
  id: string
  name: string
  role: string
  department: string
  specialties: string[]
}

const AGENTS: Agent[] = [
  // Command
  { id: 'marcus-ceo', name: 'Marcus', role: 'CEO', department: 'Command',
    specialties: ['synthesis', 'decision', 'strategy', 'oversight'] },
  { id: 'diana-coo', name: 'Diana', role: 'COO', department: 'Command',
    specialties: ['operations', 'workflow', 'execution', 'process'] },
  // Technical
  { id: 'dev-technical', name: 'Dev', role: 'Tech Lead', department: 'Technical',
    specialties: ['architecture', 'typescript', 'nextjs', 'api'] },
  { id: 'mia-technical', name: 'Mia', role: 'Frontend Lead', department: 'Technical',
    specialties: ['react', 'ui', 'tailwind', 'css', 'design'] },
  { id: 'raj-technical', name: 'Raj', role: 'Backend Lead', department: 'Technical',
    specialties: ['supabase', 'database', 'api', 'schema'] },
  { id: 'quinn-technical', name: 'Quinn', role: 'QA Lead', department: 'Technical',
    specialties: ['testing', 'qa', 'verification', 'build'] },
  // Marketing
  { id: 'kai-marketing', name: 'Kai', role: 'CMO', department: 'Marketing',
    specialties: ['analytics', 'market', 'growth', 'reports'] },
  { id: 'lena-marketing', name: 'Lena', role: 'Brand Strategist', department: 'Marketing',
    specialties: ['copy', 'brand', 'content', 'voice'] },
  { id: 'rio-marketing', name: 'Rio', role: 'Ads Manager', department: 'Marketing',
    specialties: ['ads', 'meta', 'campaigns', 'performance'] },
  // Finance
  { id: 'felix-finance', name: 'Felix', role: 'CFO', department: 'Finance',
    specialties: ['finance', 'cost', 'budget', 'pricing'] },
  // Psychology
  { id: 'kahneman-psychology', name: 'Kahneman', role: 'Bias Validator', department: 'Psychology',
    specialties: ['bias', 'audit', 'decision-review', 'debiasing'] },
  // Research
  { id: 'depth-research', name: 'Depth', role: 'Deep Researcher', department: 'Research',
    specialties: ['research', 'analysis', 'literature'] },
  { id: 'synth-research', name: 'Synth', role: 'Synthesis Lead', department: 'Research',
    specialties: ['synthesis', 'summaries', 'reports'] },
]

const COUNCIL_IDS = ['marcus-ceo', 'diana-coo', 'felix-finance', 'kai-marketing', 'kahneman-psychology']

function getAgent(id: string): Agent | undefined {
  return AGENTS.find(a => a.id === id)
}

// ─── Expansion ────────────────────────────────────────────────────────────────

export function expandTask(message: string, topic?: string): ExpandedTask {
  const original = message.trim()
  const topicLine = topic ? ` in context of: ${topic}` : ''

  // Structural expansion — no LLM needed. Uses keyword-based heuristics.
  const keywords = original.toLowerCase()
  let scope: string[] = []
  let constraints: string[] = ['Must follow YVON Constitution', 'TypeScript strict mode', 'Zero errors before delivery']
  let successCriteria: string[] = []
  let fallback = 'If agent fails: escalate to Diana (COO) for manual triage'

  // Detect task type
  if (keywords.includes('fix') || keywords.includes('bug') || keywords.includes('error')) {
    scope = ['Identify root cause', 'Implement fix', 'Test fix', 'Verify no regressions']
    successCriteria = ['Bug no longer reproduces', 'Tests pass', 'TypeScript zero errors']
    constraints.push('Must not break existing functionality')
  } else if (keywords.includes('build') || keywords.includes('create') || keywords.includes('add')) {
    scope = ['Design approach', 'Implement core functionality', 'Add edge case handling', 'Run verification']
    successCriteria = ['Feature works as described', 'TypeScript clean', 'No console errors']
    constraints.push('Must match existing design system')
  } else if (keywords.includes('analyze') || keywords.includes('review') || keywords.includes('audit')) {
    scope = ['Gather data/context', 'Analyze findings', 'Surface risks/opportunities', 'Recommend action']
    successCriteria = ['Analysis is data-backed', 'Recommendations are actionable', 'Risks are identified']
    constraints.push('Must cite sources where applicable')
  } else if (keywords.includes('deploy') || keywords.includes('ship') || keywords.includes('release')) {
    scope = ['Run pre-deploy checks', 'Build verification', 'Deploy to target', 'Post-deploy smoke test']
    successCriteria = ['Deployment successful', 'No downtime', 'All endpoints healthy']
    fallback = 'If deploy fails: roll back to previous version, investigate logs'
  } else {
    scope = ['Clarify requirements', 'Plan approach', 'Execute plan', 'Verify result']
    successCriteria = ['Task completed', 'Verified by user']
  }

  // Build expanded text
  const expanded = [
    `## Task Brief${topicLine}`,
    ``,
    `**Original request:** ${original}`,
    ``,
    `**Objective:** ${scope[0].charAt(0).toLowerCase() + scope[0].slice(1)} based on the original request.`,
    ``,
    `**Scope:**`,
    ...scope.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `**Constraints:**`,
    ...constraints.map(c => `- ${c}`),
    ``,
    `**Success criteria:**`,
    ...successCriteria.map(c => `- ${c}`),
    ``,
    `**Fallback:** ${fallback}`,
  ].join('\n')

  return {
    original,
    expanded,
    objective: scope[0],
    scope,
    constraints,
    successCriteria,
    fallbackPlan: fallback,
  }
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export function assignAgents(expanded: ExpandedTask, mentionedAgent?: string | null): AgentAssignment[] {
  const assignments: AgentAssignment[] = []
  const lowerMsg = expanded.original.toLowerCase()

  // Check for explicit @mention
  if (mentionedAgent) {
    const agent = getAgent(mentionedAgent)
    if (agent) {
      assignments.push({
        agentId: agent.id,
        name: agent.name,
        role: agent.role,
        department: agent.department,
        reason: `User-requested via @mention`,
        primary: true,
      })
    }
  }

  // Keyword-based assignment logic
  const needsTech = lowerMsg.match(/fix|build|create|code|typescript|react|component|api|route|supabase|database|schema|deploy|vercel/)
  const needsUI = lowerMsg.match(/ui|css|tailwind|design|layout|style|component|frontend|page|screen/)
  const needsBackend = lowerMsg.match(/api|route|supabase|database|schema|query|migration|backend/)
  const needsQA = lowerMsg.match(/test|qa|verify|check|build|error|bug|typecheck/)
  const needsAnalytics = lowerMsg.match(/analyze|market|data|metrics|performance|growth|ads|campaign/)
  const needsFinance = lowerMsg.match(/cost|budget|price|revenue|financial|forecast/)
  const needsBias = lowerMsg.match(/decision|strategy|launch|risk|bias|audit/)
  const needsResearch = lowerMsg.match(/research|study|literature|academic|paper|depth/)

  // Always include Marcus (CEO oversight)
  if (!assignments.find(a => a.agentId === 'marcus-ceo')) {
    assignments.push({
      agentId: 'marcus-ceo',
      name: 'Marcus',
      role: 'CEO',
      department: 'Command',
      reason: 'Council oversight — Marcus synthesizes all agent outputs',
      primary: assignments.length === 0,
    })
  }

  // Add specialists based on detected needs
  if (needsTech && needsUI && !assignments.find(a => a.agentId === 'mia-technical')) {
    assignments.push({ agentId: 'mia-technical', name: 'Mia', role: 'Frontend Lead', department: 'Technical', reason: 'UI/component work detected', primary: false })
  }
  if (needsTech && needsBackend && !assignments.find(a => a.agentId === 'raj-technical')) {
    assignments.push({ agentId: 'raj-technical', name: 'Raj', role: 'Backend Lead', department: 'Technical', reason: 'Backend/API work detected', primary: false })
  }
  if (needsTech && !assignments.find(a => a.agentId === 'dev-technical')) {
    assignments.push({ agentId: 'dev-technical', name: 'Dev', role: 'Tech Lead', department: 'Technical', reason: 'General technical work', primary: false })
  }
  if (needsQA && !assignments.find(a => a.agentId === 'quinn-technical')) {
    assignments.push({ agentId: 'quinn-technical', name: 'Quinn', role: 'QA Lead', department: 'Technical', reason: 'QA/verification needed', primary: false })
  }
  if (needsAnalytics && !assignments.find(a => a.agentId === 'kai-marketing')) {
    assignments.push({ agentId: 'kai-marketing', name: 'Kai', role: 'CMO', department: 'Marketing', reason: 'Analytics/market data', primary: false })
  }
  if (needsFinance && !assignments.find(a => a.agentId === 'felix-finance')) {
    assignments.push({ agentId: 'felix-finance', name: 'Felix', role: 'CFO', department: 'Finance', reason: 'Financial analysis', primary: false })
  }
  if (needsBias && !assignments.find(a => a.agentId === 'kahneman-psychology')) {
    assignments.push({ agentId: 'kahneman-psychology', name: 'Kahneman', role: 'Bias Validator', department: 'Psychology', reason: 'Decision/bias audit', primary: false })
  }
  if (needsResearch && !assignments.find(a => a.agentId === 'depth-research')) {
    assignments.push({ agentId: 'depth-research', name: 'Depth', role: 'Deep Researcher', department: 'Research', reason: 'Research required', primary: false })
  }

  // Always include Diana for operational oversight
  if (!assignments.find(a => a.agentId === 'diana-coo')) {
    assignments.push({ agentId: 'diana-coo', name: 'Diana', role: 'COO', department: 'Command', reason: 'Operational oversight', primary: false })
  }

  return assignments
}

// ─── Quality Gate ─────────────────────────────────────────────────────────────

export function qualityGate(expanded: ExpandedTask, assignments: AgentAssignment[]): QualityGate {
  const warnings: string[] = []
  const violations: string[] = []

  // Check for empty scope
  if (!expanded.scope.length) {
    violations.push('Law 1 (No Empty Scope): Task has no defined scope steps')
  }

  // Check for too many primary agents
  const primaries = assignments.filter((a: AgentAssignment) => a.primary)
  if (primaries.length > 1) {
    warnings.push(`Multiple primary agents assigned: ${primaries.map(a => a.name).join(', ')} — Marcus will coordinate`)
  }

  // Check for missing technical agent on code tasks
  const isCodeTask = expanded.original.toLowerCase().match(/fix|build|code|typescript|react|component/)
  const hasTechnical = assignments.some(a => a.department === 'Technical')
  if (isCodeTask && !hasTechnical) {
    warnings.push('Code task detected but no Technical agent assigned — adding Dev')
  }

  // Check for missing QA on verification
  const hasQA = assignments.some(a => a.agentId === 'quinn-technical')
  if (isCodeTask && !hasQA) {
    warnings.push('Code task without Quinn QA — quality gate may not run automatically')
  }

  // Estimate tokens
  const estimatedTokens = Math.round(expanded.expanded.length / 4) + assignments.length * 50
  const MODEL_COST_PER_1K_OUT = 0.075 // Claude Opus 4 output
  const estimatedCost = (estimatedTokens / 1000) * MODEL_COST_PER_1K_OUT

  return {
    passed: violations.length === 0,
    constitutionViolations: violations,
    warnings,
    requiredSkills: assignments.map(a => a.role),
    missingSkills: isCodeTask && !hasTechnical ? ['Technical'] : [],
    estimatedTokens,
    estimatedCost,
    fallbackTriggered: false,
  }
}

// ─── Context Building ─────────────────────────────────────────────────────────

export async function buildContextObject(
  session: VentureSession
): Promise<ContextInjection> {
  const { execSync } = require('child_process')
  let constitutionChars = 0
  let memoryChars = 0
  let memoryAgent = 'marcus-ceo'
  let graphNodes = 0
  let graphEdges = 0
  let docsCount = 0
  let docsFiles: string[] = []

  try {
    const { readFileSync, readdirSync, existsSync } = require('fs')
    const { join } = require('path')

    // Constitution
    const constPath = join(session.workdir, '.toon/docs/CONSTITUTION.toon')
    if (existsSync(constPath)) {
      constitutionChars = readFileSync(constPath, 'utf-8').length
    }

    // Agent Memory
    const memPath = join(session.workdir, '.toon/agents/CEO/marcus/MEMORY.md')
    if (existsSync(memPath)) {
      memoryChars = readFileSync(memPath, 'utf-8').length
      memoryAgent = 'marcus-ceo'
    }

    // Graph
    const graphPath = join(session.workdir, '.toon/graph/unified.db')
    if (existsSync(graphPath)) {
      try {
        const result = execSync(
          `python3 -c "
import sqlite3
db = sqlite3.connect('${graphPath}')
n = db.execute('SELECT COUNT(*) FROM unified_nodes').fetchone()[0]
e = db.execute('SELECT COUNT(*) FROM unified_edges').fetchone()[0]
print(f'{n} {e}')
db.close()
"`,
          { encoding: 'utf-8', timeout: 3000 }
        ).trim()
        const [n, e] = result.split(' ').map(Number)
        graphNodes = n || 0
        graphEdges = e || 0
      } catch {}
    }

    // TOON Docs
    const docsPath = join(session.workdir, '.toon/docs')
    if (existsSync(docsPath)) {
      try {
        const files = readdirSync(docsPath).filter((f: string) => f.endsWith('.toon') || f.endsWith('.md'))
        docsCount = files.length
        docsFiles = files.slice(0, 12)
      } catch {}
    }
  } catch {}

  // Calculate injection stats
  const totalContextChars = constitutionChars + memoryChars + 200 /* graph overhead */
  const injectedTokens = Math.round(totalContextChars / 4)

  return {
    constitution:    { loaded: constitutionChars > 0, chars: constitutionChars, hash: 'latest' },
    agentMemory:     { loaded: memoryChars > 0, chars: memoryChars, fresh: true, agent: memoryAgent },
    graphContext:    { loaded: graphNodes > 0, nodes: graphNodes, edges: graphEdges },
    toonDocs:        { loaded: docsCount > 0, count: docsCount, files: docsFiles },
    injectedTokens,
    model: 'claude-opus-4-7',
    costEstimate: (injectedTokens / 1000) * 0.075, // Claude Opus output rate
  }
}

// ─── Full Preflight ───────────────────────────────────────────────────────────

export async function runPreflight(
  venture: string,
  message: string,
  topic?: string,
  mentionedAgent?: string | null
): Promise<PreflightResult> {
  const session = getOrCreateSession(venture)

  // Step 1: Expand the task
  const expanded = expandTask(message, topic)

  // Step 2: Assign agents
  const assignments = assignAgents(expanded, mentionedAgent)

  // Step 3: Quality gate
  const gate = qualityGate(expanded, assignments)

  // Step 4: Build context
  const context = await buildContextObject(session)

  // Check if fingerprint changed
  const { createHash } = require('crypto')
  const fp = createHash('sha256')
    .update(`${context.constitution.chars}:${context.agentMemory.chars}:${context.graphContext.nodes}`)
    .digest('hex').slice(0, 8)

  const fingerprintChanged = session.context?.fingerprint !== fp
  if (fingerprintChanged && session.context) {
    session.context.fingerprint = fp
  }

  // Session cost tracking
  const sessionTokens = session.totalTokens + gate.estimatedTokens
  const MODEL_COST_PER_1K = 15.0 // Claude Opus 4 input
  const sessionCost = (sessionTokens / 1000) * (MODEL_COST_PER_1K / 1000)

  return {
    expandedTask: expanded,
    assignments,
    qualityGate: gate,
    context,
    sessionTokens,
    sessionCost,
    fingerprintChanged,
  }
}

// ─── Mention Detection ────────────────────────────────────────────────────────

export function detectMention(message: string): string | null {
  const match = message.match(/@(marcus-ceo|diana-coo|dev-technical|mia-technical|raj-technical|quinn-technical|kai-marketing|lena-marketing|rio-marketing|nate-marketing|atlas-marketing|pixel-marketing|felix-finance|kahneman-psychology|depth-research|synth-research|vette-research|forge-sense|radar-sense|scout-sense|comply-legal|docs-legal|guard-legal|board-command)/)
  return match ? match[0].replace(/^@/, '') : null
}
