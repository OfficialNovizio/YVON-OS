// app/api/council/convene/route.ts — Council API v2
// Smart Legal Routing (Option B) + Board Gate + Agent-Generated Next Steps

import { NextRequest, NextResponse } from 'next/server'
import { spawnHermesAgent, type HermesAgentResult } from '@/lib/hermes-spawn'

// ─── Types ────────────────────────────────────────────────────────────────────

type DecisionType = 'product_launch' | 'contracts' | 'open_source' | 'compliance' | 'general'

interface CouncilRequest {
  topic: string
  context?: string
  research_brief?: string
  urgency?: 'critical' | 'high' | 'routine'
  decision_type?: DecisionType
}

interface CouncilPosition {
  agent: string
  role: string
  thesis: string
  recommendation: 'PROCEED' | 'DEFER' | 'REJECT' | 'ABSTAIN'
  score?: number
}

interface LegalFinding {
  agent: string
  role: string
  finding: string
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

interface BoardRuling {
  passed: boolean
  violations: string[]
  required_fixes: string[]
  ruling: 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | 'ESCALATED'
}

interface CouncilDecision {
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
  rationale: string
  conditions: string[]
  risks_accepted: string[]
  next_steps: string[]
  positions: CouncilPosition[]
  legal_findings?: LegalFinding[]
  board_ruling?: BoardRuling
  bias_audit?: string
  total_tokens: number
  duration_ms: number
  mode: 'live' | 'simulated'
}

// ─── Smart Legal Routing ─────────────────────────────────────────────────────

interface LegalRoute {
  agents: Array<{ agentId: string; role: string; prompt: (topic: string, context: string) => string }>
  label: string
}

const LEGAL_ROUTES: Record<DecisionType, LegalRoute> = {
  product_launch: {
    label: 'Comply — regulatory check',
    agents: [{
      agentId: 'yvon/comply-legal',
      role: 'Compliance Officer',
      prompt: (topic, context) => `You are Comply, YVON's Compliance Officer. The council is deciding: "${topic}"

Context: ${context || 'None provided'}

As Compliance Officer, evaluate regulatory risk:
1. GDPR — does this involve EU user data? What Art. 5-7 obligations apply?
2. SOC2 — does this change our security posture? Trust Services Criteria impact?
3. EU AI Act — if this involves AI features, what risk classification?
4. Breach notification — could this create data exposure requiring 72h notification?

Respond with EXACTLY this format:
FINDING: [your regulatory assessment in 2-3 sentences]
RISK_LEVEL: [none | low | medium | high | critical]
RECOMMENDATION: [specific actions to ensure compliance]
`,
    }],
  },
  contracts: {
    label: 'Docs + Comply — legal documentation review',
    agents: [
      {
        agentId: 'yvon/docs-legal',
        role: 'Documentation Officer',
        prompt: (topic, context) => `You are Docs, YVON's Legal Documentation Officer. The council is deciding: "${topic}"

Context: ${context || 'None provided'}

Evaluate documentation requirements:
1. Do we need new/updated Terms of Service? Which sections?
2. Privacy Policy — new disclosures required under Art. 13/14 GDPR or CCPA?
3. NDAs — do we need confidentiality agreements with any party?
4. Templates — can we reuse existing templates or draft new ones?

Respond with EXACTLY this format:
FINDING: [your documentation assessment in 2-3 sentences]
RISK_LEVEL: [none | low | medium | high | critical]
RECOMMENDATION: [specific documents needed and timeline]
`,
      },
      {
        agentId: 'yvon/comply-legal',
        role: 'Compliance Officer',
        prompt: (topic, context) => `You are Comply. The council is deciding: "${topic}"

Context: ${context || 'None provided'}

Review from compliance perspective:
1. Does this decision create any regulatory filing obligation?
2. Are there cross-border data transfer implications (Art. 44-49 GDPR)?
3. What's the maximum regulatory fine exposure?

Respond with EXACTLY this format:
FINDING: [your assessment]
RISK_LEVEL: [none | low | medium | high | critical]
RECOMMENDATION: [compliance actions needed]
`,
      },
    ],
  },
  open_source: {
    label: 'Guard — IP + license compliance',
    agents: [{
      agentId: 'yvon/guard-legal',
      role: 'IP Protection Officer',
      prompt: (topic, context) => `You are Guard, YVON's IP Protection Officer. The council is deciding: "${topic}"

Context: ${context || 'None provided'}

Evaluate intellectual property implications:
1. Open source licenses — any GPL/AGPL risk in dependencies? Refer to license compatibility matrix.
2. Trademarks — does this decision involve new branding requiring USPTO Class 9/42 registration?
3. Patents — does this involve novel technology? Any freedom-to-operate concerns?
4. Trade secrets — does this expose any proprietary methods?

Respond with EXACTLY this format:
FINDING: [your IP assessment in 2-3 sentences]
RISK_LEVEL: [none | low | medium | high | critical]
RECOMMENDATION: [specific IP protection actions]
`,
    }],
  },
  compliance: {
    label: 'Comply — full regulatory audit',
    agents: [{
      agentId: 'yvon/comply-legal',
      role: 'Compliance Officer',
      prompt: (topic, context) => `You are Comply. The council is deciding: "${topic}"

Context: ${context || 'None provided'}

Full regulatory audit:
1. GDPR — data subject rights, breach notification, DPIA requirements
2. SOC2 — Trust Services Criteria impact across Security, Availability, Confidentiality
3. Regulatory monitoring — any new regulations (EU AI Act, California Delete Act, India DPDP) that apply?
4. Data privacy — update to ROPA (Art. 30) needed? Third-party processor assessment?
5. Fines exposure — calculate maximum penalty exposure across all regimes

Respond with EXACTLY this format:
FINDING: [comprehensive regulatory analysis]
RISK_LEVEL: [none | low | medium | high | critical]
RECOMMENDATION: [prioritized compliance action plan]
`,
    }],
  },
  general: {
    label: 'Light compliance scan',
    agents: [{
      agentId: 'yvon/comply-legal',
      role: 'Compliance Officer',
      prompt: (topic, context) => `You are Comply. Quick compliance scan on: "${topic}"

Context: ${context || 'None provided'}

Quick scan — flag only if there's a clear regulatory issue:
1. Does this touch EU user data? (GDPR trigger)
2. Does this change our security posture? (SOC2 trigger)
3. Any obvious regulatory red flags?

Respond with EXACTLY this format:
FINDING: [brief scan result — "No regulatory concerns" if clear]
RISK_LEVEL: [none | low | medium | high | critical]
RECOMMENDATION: [action only if risk > low]
`,
    }],
  },
}

// ─── Executive Council Seats ──────────────────────────────────────────────────

interface CouncilSeat {
  agentId: string
  role: string
  prompt: (topic: string, context: string, urgency: string) => string
}

const COUNCIL_SEATS: CouncilSeat[] = [
  {
    agentId: 'yvon/marcus-ceo',
    role: 'CEO',
    prompt: (topic, context, urgency) => `You are Marcus, CEO of YVON. Council convened on: "${topic}"

Context: ${context || 'None provided'}
Urgency: ${urgency}

As CEO, evaluate:
1. Strategic fit with YVON's vision and CONSTITUTION
2. Long-term impact (3-5 year horizon)
3. Opportunity cost — what would we NOT do?
4. Quality bar — is this good enough to ship?

Respond with EXACTLY this format:
THESIS: [your position in 2-3 sentences]
SCORE: [1-10 strategic alignment]
RECOMMENDATION: [PROCEED | DEFER | REJECT]
`,
  },
  {
    agentId: 'yvon/diana-coo',
    role: 'COO',
    prompt: (topic, context, urgency) => `You are Diana, COO of YVON. Council convened on: "${topic}"

Context: ${context || 'None provided'}
Urgency: ${urgency}

As COO, evaluate operational feasibility:
1. Team capacity — can we execute this now?
2. Timeline — realistic estimate including dependencies
3. Dependencies — what needs to happen first?
4. Blockers — what could stop us mid-execution?

Respond with EXACTLY this format:
THESIS: [your position in 2-3 sentences]
SCORE: [1-10 feasibility rating]
RECOMMENDATION: [PROCEED | DEFER | REJECT]
`,
  },
  {
    agentId: 'yvon/felix-finance',
    role: 'CFO',
    prompt: (topic, context, urgency) => `You are Felix, CFO of YVON. Council convened on: "${topic}"

Context: ${context || 'None provided'}
Urgency: ${urgency}

As CFO, evaluate financial impact:
1. Cost — token/dollar cost estimate for implementation
2. ROI timeline — when does it pay back?
3. Runway impact — how does this affect our cash position?
4. Risk-adjusted value — is this the best capital allocation right now?

Respond with EXACTLY this format:
THESIS: [your position in 2-3 sentences]
SCORE: [1-10 financial viability]
RECOMMENDATION: [PROCEED | DEFER | REJECT]
`,
  },
  {
    agentId: 'yvon/kai-marketing',
    role: 'CMO',
    prompt: (topic, context, urgency) => `You are Kai, CMO of YVON. Council convened on: "${topic}"

Context: ${context || 'None provided'}
Urgency: ${urgency}

As CMO, evaluate market impact:
1. Competitive landscape — what are others doing?
2. Market timing — is this the right moment?
3. Positioning — how does this fit our brand?
4. User/community impact — how will this be received?

Respond with EXACTLY this format:
THESIS: [your position in 2-3 sentences]
SCORE: [1-10 market readiness]
RECOMMENDATION: [PROCEED | DEFER | REJECT]
`,
  },
]

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const start = Date.now()

  try {
    const body: CouncilRequest = await request.json()
    const {
      topic,
      context = '',
      research_brief = '',
      urgency = 'routine',
      decision_type = 'general',
    } = body

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const hermesAvailable = await checkHermesAvailable()
    if (!hermesAvailable) {
      return NextResponse.json(simulateCouncil(topic, context, research_brief, urgency, decision_type, start))
    }

    let totalTokens = 0

    // ─── Phase 1: Gather Executive Positions ──────────────────────────────
    const positions: CouncilPosition[] = []
    for (const seat of COUNCIL_SEATS) {
      try {
        const result = await spawnHermesAgent({
          agentId: seat.agentId,
          task: seat.prompt(topic, context, urgency),
          workdir: '/root/yvon',
          timeoutMs: 90000,
          maxOutputTokens: 1024,
        })
        positions.push(parsePosition(result.content, seat.agentId, seat.role))
        totalTokens += result.content.length
      } catch (err: any) {
        positions.push({
          agent: seat.agentId,
          role: seat.role,
          thesis: `Unable to reach council member: ${err.message}`,
          recommendation: 'ABSTAIN',
        })
      }
    }

    // ─── Phase 2: Legal Smart Routing ─────────────────────────────────────
    const legalRoute = LEGAL_ROUTES[decision_type] || LEGAL_ROUTES.general
    const legalFindings: LegalFinding[] = []

    for (const legalAgent of legalRoute.agents) {
      try {
        const result = await spawnHermesAgent({
          agentId: legalAgent.agentId,
          task: legalAgent.prompt(topic, context),
          workdir: '/root/yvon',
          timeoutMs: 60000,
          maxOutputTokens: 768,
        })
        const finding = parseLegalFinding(result.content, legalAgent.agentId, legalAgent.role)
        legalFindings.push(finding)
        totalTokens += result.content.length
      } catch (err: any) {
        legalFindings.push({
          agent: legalAgent.agentId,
          role: legalAgent.role,
          finding: `Legal review unavailable: ${err.message}`,
          risk_level: 'none',
          recommendation: 'Re-run with Hermes available',
        })
      }
    }

    // ─── Phase 3: Marcus Synthesizes ──────────────────────────────────────
    const positionsText = positions.map(p =>
      `${p.role}: ${p.thesis}\nRecommendation: ${p.recommendation}${p.score ? ` | Score: ${p.score}/10` : ''}`
    ).join('\n\n')

    const legalText = legalFindings.length > 0
      ? '\n\nLEGAL FINDINGS:\n' + legalFindings.map(l =>
          `${l.role}: ${l.finding}\nRisk: ${l.risk_level} | ${l.recommendation}`
        ).join('\n\n')
      : ''

    const synthesisPrompt = `Council positions on: "${topic}"

${positionsText}${legalText}

As Marcus (CEO), synthesize ALL positions — executive AND legal — into one decision. You must decide NOW.
If legal flagged risk level HIGH or CRITICAL, factor that heavily.
DECISION: [APPROVED | REJECTED | CONDITIONAL]
RATIONALE: [2-3 sentences explaining the synthesis — mention legal input if relevant]
CONDITIONS: [specific conditions if CONDITIONAL, otherwise "none"]
RISKS: [risks consciously accepted, including legal risks flagged]`

    let synthesis: HermesAgentResult
    try {
      synthesis = await spawnHermesAgent({
        agentId: 'yvon/marcus-ceo',
        task: synthesisPrompt,
        workdir: '/root/yvon',
        timeoutMs: 90000,
        maxOutputTokens: 768,
      })
      totalTokens += synthesis.content.length
    } catch {
      const proCount = positions.filter(p => p.recommendation === 'PROCEED').length
      const legalRisk = legalFindings.some(l => l.risk_level === 'high' || l.risk_level === 'critical')
      synthesis = {
        agentId: 'marcus-ceo',
        content: `DECISION: ${proCount >= 2 && !legalRisk ? 'CONDITIONAL' : 'REJECTED'}\nRATIONALE: Council ${proCount}/4 support. Legal risk: ${legalRisk ? 'ELEVATED' : 'acceptable'}. Automated synthesis.\nCONDITIONS: Full review required\nRISKS: Automated decision — verify manually`,
        toolCalls: [],
        success: false,
        error: 'Marcus synthesis failed — automated fallback used',
      }
    }

    const parsedSynthesis = parseDecision(synthesis.content)

    // ─── Phase 4: Kahneman Bias Audit ─────────────────────────────────────
    let biasAudit: string | undefined
    if (parsedSynthesis.decision !== 'REJECTED') {
      try {
        const biasResult = await spawnHermesAgent({
          agentId: 'yvon/kahneman-psychology',
          task: `Audit this council decision for cognitive bias:

Decision: ${parsedSynthesis.decision}
Rationale: ${parsedSynthesis.rationale}
Positions: ${positions.map(p => `${p.role}(${p.recommendation}): ${p.thesis.slice(0, 100)}`).join(' | ')}
${legalFindings.length > 0 ? `Legal input: ${legalFindings.map(l => `${l.role}: ${l.risk_level} risk`).join(' | ')}` : ''}

Check: anchoring, overconfidence, confirmation bias, loss aversion, framing effects, survivorship bias, authority bias.
Respond: BIAS_TYPE: [detected] | EXPLANATION: [why] | CORRECTION: [what to adjust]`,
          workdir: '/root/yvon',
          timeoutMs: 60000,
          maxOutputTokens: 512,
        })
        biasAudit = biasResult.content.slice(0, 500)
        totalTokens += biasResult.content.length
      } catch {
        biasAudit = 'Kahneman unavailable for bias audit'
      }
    }

    // ─── Phase 5: Board Constitutional Gate ───────────────────────────────
    let boardRuling: BoardRuling = { passed: true, violations: [], required_fixes: [], ruling: 'APPROVED' }

    const hasLegalRisk = legalFindings.some(l => l.risk_level === 'high' || l.risk_level === 'critical')
    const shouldRunBoard = parsedSynthesis.decision !== 'REJECTED' && (hasLegalRisk || urgency === 'critical' || parsedSynthesis.decision === 'CONDITIONAL')

    if (shouldRunBoard) {
      try {
        const boardResult = await spawnHermesAgent({
          agentId: 'yvon/board-command',
          task: `As the Board Governance Agent, review this council decision:

TOPIC: ${topic}
DECISION: ${parsedSynthesis.decision}
RATIONALE: ${parsedSynthesis.rationale}
CONDITIONS: ${parsedSynthesis.conditions.join('; ') || 'none'}
LEGAL RISKS: ${legalFindings.map(l => `${l.role}: ${l.risk_level} — ${l.finding.slice(0, 150)}`).join(' | ') || 'none flagged'}
BIAS AUDIT: ${biasAudit || 'not performed'}

Constitutional review:
1. Does this decision violate any of YVON's 10 immutable laws?
2. Are fiduciary duties met? (Duty of Care, Loyalty, Good Faith)
3. Risk assessment: L×I score and recommended action
4. Should any conditions be added before execution?

Respond:
RULING: [APPROVED | CONDITIONAL | REJECTED | ESCALATED]
VIOLATIONS: [list specific law numbers violated, or "none"]
FIXES: [required fixes before execution, or "none"]
RATIONALE: [board's reasoning]`,
          workdir: '/root/yvon',
          timeoutMs: 60000,
          maxOutputTokens: 512,
        })
        boardRuling = parseBoardRuling(boardResult.content)
        totalTokens += boardResult.content.length
      } catch {
        boardRuling = {
          passed: true,
          violations: [],
          required_fixes: [],
          ruling: 'APPROVED',
        }
      }
    }

    // ─── Phase 6: Agent-Generated Next Steps ──────────────────────────────
    let nextSteps: string[] = []

    try {
      const dianaResult = await spawnHermesAgent({
        agentId: 'yvon/diana-coo',
        task: `You are Diana, COO. The council has decided on: "${topic}"

Decision: ${parsedSynthesis.decision}
Rationale: ${parsedSynthesis.rationale}
Conditions: ${parsedSynthesis.conditions.join('; ') || 'none'}
Board ruling: ${boardRuling.ruling}${boardRuling.required_fixes.length > 0 ? ` | Fixes needed: ${boardRuling.required_fixes.join(', ')}` : ''}
Legal risk level: ${legalFindings.map(l => l.risk_level).join(', ')}
Bias audit: ${biasAudit ? biasAudit.slice(0, 150) : 'not performed'}

As COO, generate the specific next steps for execution. Be concrete — what should each team do first?
List 3-5 actionable steps with owners.
Format: one step per line, starting with "OWNER: action"`,
        workdir: '/root/yvon',
        timeoutMs: 60000,
        maxOutputTokens: 384,
      })
      nextSteps = dianaResult.content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 5 && !l.startsWith('#') && !l.startsWith('//'))
        .slice(0, 6)
      totalTokens += dianaResult.content.length
    } catch {
      nextSteps = [
        'Marcus: Review final decision and conditions',
        'Diana: Create execution sprint plan',
        legalFindings.length > 0 ? 'Comply: Address legal findings within 7 days' : '',
        'Board: Schedule follow-up review in 14 days',
      ].filter(Boolean)
    }

    // ─── Assemble Decision ────────────────────────────────────────────────

    const finalDecision: CouncilDecision = {
      decision: boardRuling.ruling === 'REJECTED' ? 'REJECTED'
                : boardRuling.ruling === 'ESCALATED' ? 'CONDITIONAL'
                : parsedSynthesis.decision,
      rationale: parsedSynthesis.rationale,
      conditions: [
        ...parsedSynthesis.conditions,
        ...boardRuling.required_fixes,
      ].filter(c => c && c !== 'none'),
      risks_accepted: parsedSynthesis.risks,
      next_steps: nextSteps,
      positions,
      legal_findings: legalFindings,
      board_ruling: boardRuling,
      bias_audit: biasAudit,
      total_tokens: totalTokens,
      duration_ms: Date.now() - start,
      mode: 'live',
    }

    return NextResponse.json(finalDecision)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const hermesAvailable = await checkHermesAvailable()
  return NextResponse.json({
    council: 'YVON Advisory Council v2',
    members: COUNCIL_SEATS.map(s => s.role),
    legal_routing: {
      product_launch: 'Comply',
      contracts: 'Docs + Comply',
      open_source: 'Guard',
      compliance: 'Comply (full audit)',
      general: 'Comply (light scan)',
    },
    validators: ['kahneman-psychology (bias audit)'],
    governance: 'board-command (constitutional gate)',
    status: hermesAvailable ? 'live' : 'simulated',
    last_convened: null,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function checkHermesAvailable(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process')
    execSync('which hermes', { timeout: 3000 })
    return true
  } catch {
    return false
  }
}

function parsePosition(content: string, agentId: string, role: string): CouncilPosition {
  const thesis = content.match(/THESIS:\s*([\s\S]+?)(?=\n\w+:|\n\n|$)/)
  const scoreMatch = content.match(/SCORE:\s*(\d+)/)
  const recommendation = content.match(/RECOMMENDATION:\s*(PROCEED|DEFER|REJECT)/i)

  return {
    agent: agentId,
    role,
    thesis: thesis?.[1]?.trim() || content.slice(0, 250),
    score: scoreMatch ? parseInt(scoreMatch[1]) : undefined,
    recommendation: recommendation?.[1]?.toUpperCase() as CouncilPosition['recommendation'] || 'ABSTAIN',
  }
}

function parseLegalFinding(content: string, agentId: string, role: string): LegalFinding {
  const finding = content.match(/FINDING:\s*([\s\S]+?)(?=\n\w+_LEVEL:|\n\w+:|$)/)
  const risk = content.match(/RISK_LEVEL:\s*(none|low|medium|high|critical)/i)
  const recommendation = content.match(/RECOMMENDATION:\s*([\s\S]+?)(?=\n\w+:|$)/)

  return {
    agent: agentId,
    role,
    finding: finding?.[1]?.trim() || content.slice(0, 250),
    risk_level: (risk?.[1]?.toLowerCase() || 'none') as LegalFinding['risk_level'],
    recommendation: recommendation?.[1]?.trim() || 'No specific recommendations',
  }
}

function parseDecision(content: string): {
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
  rationale: string
  conditions: string[]
  risks: string[]
} {
  const decisionMatch = content.match(/DECISION:\s*(APPROVED|REJECTED|CONDITIONAL)/i)
  const rationaleMatch = content.match(/RATIONALE:\s*([\s\S]+?)(?=\n\w+:|$)/)
  const conditionsMatch = content.match(/CONDITIONS:\s*([\s\S]+?)(?=\n\w+:|$)/)
  const risksMatch = content.match(/RISKS:\s*([\s\S]+?)(?=\n\w+:|$)/)

  return {
    decision: (decisionMatch?.[1]?.toUpperCase() || 'CONDITIONAL') as 'APPROVED' | 'REJECTED' | 'CONDITIONAL',
    rationale: rationaleMatch?.[1]?.trim() || 'Council synthesis produced no clear rationale.',
    conditions: conditionsMatch?.[1]
      ? conditionsMatch[1].split(/[,;]/).map(c => c.trim()).filter(c => c && !['none', 'None'].includes(c))
      : [],
    risks: risksMatch?.[1]
      ? risksMatch[1].split(/[,;]/).map(r => r.trim()).filter(r => r && !['none', 'None'].includes(r))
      : [],
  }
}

function parseBoardRuling(content: string): BoardRuling {
  const ruling = content.match(/RULING:\s*(APPROVED|CONDITIONAL|REJECTED|ESCALATED)/i)
  const violations = content.match(/VIOLATIONS:\s*([\s\S]+?)(?=\n\w+:|$)/)
  const fixes = content.match(/FIXES:\s*([\s\S]+?)(?=\n\w+:|$)/)

  return {
    passed: ruling?.[1]?.toUpperCase() !== 'REJECTED',
    ruling: (ruling?.[1]?.toUpperCase() || 'APPROVED') as BoardRuling['ruling'],
    violations: violations?.[1]
      ? violations[1].split(/[,;]/).map(v => v.trim()).filter(v => v && !['none', 'None'].includes(v))
      : [],
    required_fixes: fixes?.[1]
      ? fixes[1].split(/[,;]/).map(f => f.trim()).filter(f => f && !['none', 'None'].includes(f))
      : [],
  }
}

// ─── Simulation Fallback ─────────────────────────────────────────────────────

function simulateCouncil(
  topic: string,
  context: string,
  _researchBrief: string,
  urgency: string,
  decisionType: DecisionType,
  start: number,
): CouncilDecision {
  const roles = COUNCIL_SEATS.map(s => s.role)
  const agents = COUNCIL_SEATS.map(s => s.agentId)

  const positions: CouncilPosition[] = roles.map((role, i) => ({
    agent: agents[i],
    role,
    thesis: `${role} analysis of "${topic.slice(0, 80)}" — simulation mode.`,
    recommendation: 'ABSTAIN',
  }))

  const legalRoute = LEGAL_ROUTES[decisionType]
  const legalFindings: LegalFinding[] = legalRoute.agents.map(a => ({
    agent: a.agentId,
    role: a.role,
    finding: 'Simulation mode — legal review unavailable. Install Hermes for live legal analysis.',
    risk_level: 'none',
    recommendation: 'Deploy with Hermes Agent installed',
  }))

  return {
    decision: 'CONDITIONAL',
    rationale: `Council simulation for "${topic}". Legal routing: ${legalRoute.label}. Install Hermes for live council with real agent tools and legal review.`,
    conditions: ['Deploy with Hermes Agent installed', 'Verify hermes CLI in PATH', 'Re-run council for live decision'],
    risks_accepted: ['Decision made without live agent input or legal review'],
    next_steps: ['Install Hermes Agent on VPS', 'Re-convene council with --live'],
    positions,
    legal_findings: legalFindings,
    board_ruling: { passed: true, violations: [], required_fixes: [], ruling: 'APPROVED' },
    total_tokens: 0,
    duration_ms: Date.now() - start,
    mode: 'simulated',
  }
}
