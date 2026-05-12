/**
 * POST /api/social-intelligence
 * Kai's Social Situation Report — brief + diagnosis + prescription + Kahneman check.
 * Handles zero-state (no data yet) gracefully — still provides actionable guidance.
 */

import { callSynthesis } from '@/lib/ai-client'

interface PlatformMetric {
  platform: string
  followers: number
  engagementRate: number
  reach: number
  conversionRate: number
  growthVelocity: number
  connected: boolean
}

interface CompetitorBenchmark {
  name: string
  platform: string
  followers: number
  engagementRate: number
}

interface RequestBody {
  venture: string
  industry: string
  platforms: PlatformMetric[]
  competitors: CompetitorBenchmark[]
}

export interface SocialIntelligenceResponse {
  brief: {
    situation: string
    diagnosis: string
    action: string
  }
  prescription: Array<{
    rank: number
    action: string
    rationale: string
    agent: string
    impact: string
    priority: 'critical' | 'high' | 'medium'
  }>
  kahneman: {
    hasWarning: boolean
    warning?: string
  }
  confidence: 'high' | 'medium' | 'low'
  isZeroState: boolean
}

export async function POST(request: Request): Promise<Response> {
  let body: RequestBody
  try {
    body = await request.json() as RequestBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { venture = 'Novizio', industry = 'fashion e-commerce', platforms = [], competitors = [] } = body

  const connectedPlatforms = platforms.filter(p => p.connected)
  const isZeroState = connectedPlatforms.length === 0
  const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0)
  const avgEngRate = connectedPlatforms.length
    ? (connectedPlatforms.reduce((sum, p) => sum + p.engagementRate, 0) / connectedPlatforms.length).toFixed(2)
    : '0'

  const platformSummary = platforms.map(p =>
    p.connected
      ? `${p.platform}: ${p.followers.toLocaleString()} followers, ${p.engagementRate}% eng rate, ${p.conversionRate}% conv rate, growth: ${p.growthVelocity > 0 ? '+' : ''}${p.growthVelocity}% MoM`
      : `${p.platform}: not connected yet`
  ).join('\n')

  const competitorSummary = competitors.length > 0
    ? competitors.map(c => `${c.name} on ${c.platform}: ${c.followers.toLocaleString()} followers, ${c.engagementRate}% eng rate`).join('\n')
    : 'No competitor data provided — use industry benchmarks for the sector.'

  const prompt = `You are Kai, the analytics agent for YVON — an AI operating system for brand intelligence.

VENTURE: ${venture} (${industry})
TOTAL FOLLOWERS ACROSS ALL PLATFORMS: ${totalFollowers.toLocaleString()}
AVG ENGAGEMENT RATE: ${avgEngRate}%
ZERO STATE: ${isZeroState ? 'YES — no platforms connected yet' : 'NO'}

PLATFORM DATA:
${platformSummary}

COMPETITOR BENCHMARKS:
${competitorSummary}

${isZeroState ? `IMPORTANT: This brand has NO social presence tracked yet. Your brief should be a launch guide — where to start, why, and what the first 30 days should look like. Be specific and actionable, not generic.` : ''}

Generate a JSON response with this exact structure:
{
  "brief": {
    "situation": "1-2 sentences: what is the current social media situation for ${venture}. Be specific with numbers.",
    "diagnosis": "1-2 sentences: the root cause or key pattern driving this situation. Reference specific platform or competitor data.",
    "action": "1 sentence: the single most important action to take RIGHT NOW. Be specific — name the platform, format, and why."
  },
  "prescription": [
    {
      "rank": 1,
      "action": "Specific action to take this week",
      "rationale": "Why this action, backed by the data above",
      "agent": "lena|rio|nate|atlas|kai",
      "impact": "Expected outcome (be specific: e.g. +34% reach, $X CAC reduction)",
      "priority": "critical|high|medium"
    },
    {
      "rank": 2,
      "action": "Second action",
      "rationale": "Why",
      "agent": "lena|rio|nate|atlas|kai",
      "impact": "Expected outcome",
      "priority": "high|medium"
    },
    {
      "rank": 3,
      "action": "Third action",
      "rationale": "Why",
      "agent": "lena|nate|atlas|kai|rio",
      "impact": "Expected outcome",
      "priority": "medium"
    }
  ],
  "kahneman": {
    "hasWarning": true or false,
    "warning": "If hasWarning is true: 1 sentence flagging a potential cognitive bias or data misinterpretation risk. E.g. confirmation bias, availability heuristic, regression to mean. If false, omit this field."
  },
  "confidence": "high if 3+ platforms have data, medium if 1-2, low if zero state"
}

Rules:
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- At zero state, the prescription should be a launch sequence (platform 1 → 2 → 3)
- Always reference specific competitors or benchmarks in the rationale
- The kahneman warning should feel like a behavioral economist speaking, not a disclaimer`

  try {
    const raw = await callSynthesis({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
    })

    let parsed: Omit<SocialIntelligenceResponse, 'isZeroState'>
    try {
      parsed = JSON.parse(raw) as typeof parsed
    } catch {
      return Response.json({ error: 'Kai returned invalid JSON', raw }, { status: 502 })
    }

    return Response.json({ ...parsed, isZeroState } satisfies SocialIntelligenceResponse)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
