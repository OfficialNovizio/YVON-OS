// Content Intelligence Engine — the strategic brain of YVON.
// POST: reads latest department reports → Kai brief → Blue Ocean Scout →
//       Lena 5 pitches → Kahneman audit → ranked proposals → DB write.
//
// Run on cron (48h after competitor report) or manually with CRON_SECRET.

import { cookies } from 'next/headers'
import { callFast, callSynthesis } from '@/lib/ai-client'
import { getLatestReports } from '@/lib/reports'
import {
  getLeverTracker, updateLeverTracker, insertStrategyLog,
  createBatch, updateBatchStatus, insertPitches,
  getLatestBatch, getLatestPitches, updatePitchStatus,
} from '@/lib/intelligence'
import { KAHNEMAN_BATCH_SYSTEM } from '@/lib/kahneman-prompt'
import { getBigIdea } from '@/lib/big-idea'
import { getContentSeries } from '@/lib/content-series'
import { supabase } from '@/lib/supabase'

export const maxDuration = 300  // 5 minutes for full pipeline

// ─── Helpers ────────────────────────────────────────────────────────────────────

function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) return fenceMatch[1].trim()
  const objMatch = raw.match(/\{[\s\S]*\}/)
  if (objMatch) return objMatch[0]
  return raw
}

function getVentureName(ventureId: string): string {
  return ventureId === 'hourbour' ? 'Hourbour' : 'Novizio'
}

function getVentureDesc(ventureId: string): string {
  return ventureId === 'hourbour'
    ? 'fintech SaaS — budgeting & personal finance app'
    : 'fashion e-commerce — premium DTC clothing brand'
}

// ─── POST ───────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { data: vRow } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  const ventureId = (vRow?.id as string | undefined) ?? slug
  const ventureName = getVentureName(slug)
  const ventureDesc = getVentureDesc(slug)

  try {
    // ═════════════════════════════════════════════════════════════════════
    //  PHASE 0 — Read latest department reports + lever tracker + brand DNA
    // ═════════════════════════════════════════════════════════════════════

    const [reports, levers, bigIdea, allSeries] = await Promise.all([
      getLatestReports(ventureId),
      getLeverTracker(ventureName),
      getBigIdea(ventureId),
      getContentSeries(ventureId),
    ])

    const activeSeries = allSeries.filter(s => s.active)
    const bigIdeaContext = bigIdea ? `
BRAND BIG IDEA:
- Brand name meaning: ${bigIdea.brandNameMeaning}
- Ideal person: ${bigIdea.idealPerson}
- Their traits: ${bigIdea.idealPersonTraits}
- What they gather to do: ${bigIdea.gatheringActivity}
- Mission beyond product: ${bigIdea.missionBeyondProduct}
- Primary platform: ${bigIdea.platformFocus}
` : ''

    const seriesContext = activeSeries.length > 0 ? `
ACTIVE CONTENT SERIES (suggest content within or extending these):
${activeSeries.map(s => `- ${s.name} (${s.format}, ${s.frequency}, ${s.platform}, FAN goal: ${s.fanGoal}): ${s.description}`).join('\n')}
` : ''

    // ═════════════════════════════════════════════════════════════════════
    //  PHASE 1 — KAI INTELLIGENCE BRIEF
    // ═════════════════════════════════════════════════════════════════════

    const analyticsSummary = reports.analytics?.summary ?? 'No analytics data available.'
    const marketingSummary = reports.marketing?.summary ?? 'No marketing data available.'
    const competitorSummary = reports.competitor?.summary ?? 'No competitor data available.'

    const kaiBrief = await callFast({
      messages: [{
        role: 'user',
        content: `You are Kai, lead analyst at YVON for ${ventureName} (${ventureDesc}).
${bigIdeaContext}${seriesContext}
Here are the latest department reports:

--- ANALYTICS REPORT ---
${analyticsSummary.slice(0, 800)}

--- MARKETING REPORT ---
${marketingSummary.slice(0, 800)}

--- COMPETITOR REPORT ---
${competitorSummary.slice(0, 800)}

Synthesize these into a single intelligence brief. Suggestions MUST align with the brand's Big Idea and extend the active Content Series. Be decisive. Cite real numbers. No hedging.

Return ONLY valid JSON with no markdown:
{
  "analyticsSignal": "the key analytics takeaway — one sentence, specific number",
  "anomalyFlag": "any >15% delta or 'none'",
  "competitorIntel": [
    {"brand": "Brand Name", "doing": "specific content they're doing", "signal": "engagement metric if available", "gap": "what they're NOT covering", "opportunity": "our specific move"}
  ],
  "ourContentSignal": "pattern from our top/bottom content — what works, what doesn't",
  "unclaimedTerritory": {"name": "territory name", "keywords": ["keyword1"], "saturation": 0-100, "urgency": "HIGH/MEDIUM/LOW"},
  "sprintSignal": "ONE sentence. The single insight driving all 5 pitches."
}`,
      }],
      maxTokens: 800,
    })

    let parsedBrief: Record<string, unknown>
    try { parsedBrief = JSON.parse(extractJson(kaiBrief)) as Record<string, unknown> }
    catch { parsedBrief = { competitorIntel: [], sprintSignal: 'Error parsing brief' } }

    // ═════════════════════════════════════════════════════════════════════
    //  PHASE 2 — BLUE OCEAN SCOUT (Kai + Nate)
    // ═════════════════════════════════════════════════════════════════════

    const blueOcean = await callFast({
      messages: [{
        role: 'user',
        content: `You are Kai (Analytics) + Nate (Growth) — the Blue Ocean Scout for ${ventureName} (${ventureDesc}).

Current intelligence: ${JSON.stringify(parsedBrief).slice(0, 600)}

Generate 2 content ideas that GENUINELY DO NOT EXIST in this category yet.
Format doesn't exist yet. Angle doesn't exist yet. No competitor is doing this.

Rules:
- Name the FORMAT that doesn't exist (not just a topic — a specific format/package)
- Explain why NO competitor has done this (what assumption are we breaking?)
- Name the CULTURAL HOOK that makes it land right NOW
- Name the FIRST-MOVER advantage (what do we lock in by going first?)
- Name the AUDIENCE DEPENDENCY mechanism (Zeigarnik / serialization / participation)
- Name the VIRALITY MECHANISM (L6: emotional contagion / curiosity gap / etc.)

Return ONLY valid JSON:
{
  "ideas": [
    {
      "formatName": "name for this format that doesn't exist yet",
      "whatItIs": "one-sentence description of what you'd actually film/write",
      "whyItDoesntExist": "the category assumption we're breaking",
      "culturalHook": "what's happening in culture right NOW that makes this land",
      "firstMoverAdvantage": "what we lock in permanently by going first",
      "audienceDependency": "the Zeigarnik/serialization mechanism bringing them back",
      "platform": "where this lives natively",
      "viralityMechanism": "named L6 mechanism + why it spreads"
    }
  ]
}`,
      }],
      maxTokens: 800,
    })

    let parsedBlue: Array<Record<string, unknown>> = []
    try {
      const bp = JSON.parse(extractJson(blueOcean)) as Record<string, unknown>
      parsedBlue = (bp.ideas as Array<Record<string, unknown>>) ?? []
    } catch { parsedBlue = [] }

    // ═════════════════════════════════════════════════════════════════════
    //  PHASE 3 — LENA: 5 CONTENT PITCHES
    // ═════════════════════════════════════════════════════════════════════

    const compIntel = (parsedBrief.competitorIntel as Array<Record<string, string>>) ?? []
    const unclaimed = parsedBrief.unclaimedTerritory as Record<string, unknown> ?? {}
    const blueIdeas = parsedBlue

    const compIntelText = compIntel.map((c: Record<string, string>) =>
      `Brand: ${c.brand ?? 'Unknown'}
Doing: ${c.doing ?? 'N/A'}
Signal: ${c.signal ?? 'N/A'}
Gap: ${c.gap ?? 'N/A'}
Opportunity: ${c.opportunity ?? 'N/A'}`
    ).join('\n---\n')

    const blueText = blueIdeas.map((b: Record<string, unknown>) =>
      `Format: ${b.formatName ?? 'Unknown'}
What: ${b.whatItIs ?? 'N/A'}
Why missing: ${b.whyItDoesntExist ?? 'N/A'}
Hook: ${b.culturalHook ?? 'N/A'}
First-mover: ${b.firstMoverAdvantage ?? 'N/A'}
Dependency: ${b.audienceDependency ?? 'N/A'}
Platform: ${b.platform ?? 'N/A'}
Virality: ${b.viralityMechanism ?? 'N/A'}`
    ).join('\n---\n')

    const pitchPrompt = `You are Lena, brand copywriter at YVON for ${ventureName} (${ventureDesc}).

Write 5 complete content pitches. Distribution:
- Pitch 1: Competitor gap — target the first competitor's gap
- Pitch 2: Competitor gap — target the second competitor's gap
- Pitch 3: Unclaimed territory — first-mover content
- Pitch 4: Blue Ocean — first idea that doesn't exist
- Pitch 5: Blue Ocean — second idea that doesn't exist

Sprint signal driving ALL pitches: "${(parsedBrief.sprintSignal as string) ?? 'Make content that spreads'}"

COMPETITOR INTELLIGENCE:
${compIntelText.slice(0, 1000)}

${(unclaimed.name as string) ? `UNCLAIMED TERRITORY: ${JSON.stringify(unclaimed)}` : ''}

BLUE OCEAN IDEAS:
${blueText.slice(0, 1000)}

For EACH pitch, use this exact format:

PITCH [N] — [CATEGORY]
Platform: [platform]
Format: [specific format]
Intelligence: [real competitor brand doing what + their gap OR "No brand has done this"]
Our angle: [one sentence — what makes ours different]
Hook: [exact first line, publish-ready]
Caption: [full caption, publish-ready, brand voice correct, hashtags if appropriate]
Why beats current: [current approach gets X metric → this approach targets Y because Z]
Market effect: [what shifts in user perception/behavior if this lands]
Tactic: [which Tactics Library play]

Write ALL 5 pitches. No extra text before or after.`

    const lenaRaw = await callSynthesis({
      messages: [{ role: 'user', content: pitchPrompt }],
      maxTokens: 3000,
    })

    // Parse out individual pitches from Lena's output
    interface RawPitch {
      raw: string
      category: string
    }
    const pitchBlocks: RawPitch[] = []
    const blocks = lenaRaw.split(/(?:^|\n)PITCH\s*(\d+)\s*—\s*([^\n]+)/i).filter(Boolean)
    // blocks will alternate: [fullMatch, number, category, content, number, category, content...]
    for (let i = 1; i + 2 < blocks.length; i += 3) {
      const category = (blocks[i + 1] as string).trim().toLowerCase()
      const content = (blocks[i + 2] as string).trim()
      if (content.length > 50) {
        pitchBlocks.push({
          raw: `PITCH — ${category.toUpperCase()}\n${content}`,
          category: category.includes('competitor') ? 'competitor_gap'
            : category.includes('territory') ? 'unclaimed_territory'
            : 'blue_ocean',
        })
      }
    }

    // If parsing failed, treat whole output as one block
    if (pitchBlocks.length === 0) {
      pitchBlocks.push({ raw: lenaRaw, category: 'blue_ocean' })
    }

    const pitchTexts = pitchBlocks.map((p, i) => `PITCH ${i + 1} — ${p.category}\n${p.raw}`).join('\n\n===\n\n')

    // ═════════════════════════════════════════════════════════════════════
    //  PHASE 4 — KAHNEMAN PSYCHOLOGY AUDIT
    // ═════════════════════════════════════════════════════════════════════

    const leverContext = levers.map((l) =>
      `Surface: ${l.surface} | Current lever: ${l.lever} | Uses: ${l.usageCount}/3 | Capped: ${l.capped} | History: ${JSON.stringify(l.history)}`
    ).join('\n')

    const kahnemanInput = `Brand: ${ventureName}
Description: ${ventureDesc}
Lever tracker: ${leverContext || 'No lever history yet — all levers available'}

Analyze and score ALL 5 pitches below. Each must get a DIFFERENT primary lever.
Rank by composite score.

${pitchTexts}`

    const rawKahneman = await callSynthesis({
      system: KAHNEMAN_BATCH_SYSTEM,
      messages: [{ role: 'user', content: kahnemanInput }],
      maxTokens: 4000,
    })

    interface KahnemanResult {
      ranked: Array<{
        rank: number
        pitchIndex: number
        proposal: Record<string, unknown>
      }>
    }

    let ranked: KahnemanResult['ranked'] = []
    try {
      const parsedK = JSON.parse(extractJson(rawKahneman)) as KahnemanResult
      ranked = parsedK.ranked ?? []
    } catch {
      // Fallback: assign default rankings
      ranked = pitchBlocks.map((_, i) => ({
        rank: i + 1,
        pitchIndex: i,
        proposal: { primaryLever: 'L6 — Curiosity Gap', runRecommendation: 'A' },
      }))
    }

    // ═════════════════════════════════════════════════════════════════════
    //  PHASE 5 — WRITE TO DATABASE
    // ═════════════════════════════════════════════════════════════════════

    // Create batch referencing source reports
    const batch = await createBatch(
      ventureId,
      reports.analytics?.id ?? null,
      reports.marketing?.id ?? null,
      reports.competitor?.id ?? null,
    )

    // Extract hook/platform from each pitch block (best-effort)
    function extractField(text: string, field: string): string {
      const re = new RegExp(`${field}:\\s*(.+?)(?:\\n|$)`, 'i')
      const m = text.match(re)
      return m?.[1]?.trim() ?? ''
    }

    // Build pitch records and make them insertable
    interface PitchInsert {
      ventureId: string
      batchId: string | null
      rank: number
      platform: string
      format: string
      category: string
      intelligenceSource: string | null
      ourMove: string
      hookA: string
      hookB: string
      leverPrimary: string
      leverA: string
      leverB: string
      psychologyScore: number | null
      system1ScoreA: number | null
      system1ScoreB: number | null
      runRecommendation: string | null
      marketEffect: string | null
      vsCurrent: string | null
      viralMechanism: string | null
      fullProposal: Record<string, unknown> | null
      status: string
      strategyLogId: string | null
    }

    const inserts: PitchInsert[] = []
    const usedSurfaces = new Set<string>()
    const usedLevers = new Set<string>()

    for (const r of ranked) {
      const pitch = pitchBlocks[r.pitchIndex]
      if (!pitch) continue

      const proposal = r.proposal ?? {}
      const primaryLever = (proposal.primaryLever as string) ?? 'L6 — Curiosity Gap'
      const scoreBlock = proposal.scores as Record<string, unknown> ?? {}
      const hookA = (proposal.hookA as Record<string, string>) ?? {}
      const hookB = (proposal.hookB as Record<string, string>) ?? {}
      const platform = extractField(pitch.raw, 'Platform') || 'Instagram'
      const format = extractField(pitch.raw, 'Format') || 'Reel'
      const intelligence = extractField(pitch.raw, 'Intelligence') || null
      const ourMove = extractField(pitch.raw, 'Our angle') || extractField(pitch.raw, 'Hook') || ''
      const hookTextA = hookA.text ?? extractField(pitch.raw, 'Hook')
      const marketEffect = extractField(pitch.raw, 'Market effect') || null
      const vsCurrent = extractField(pitch.raw, 'Why beats current') || null

      // Update lever tracker for this surface
      const surface = platform.toLowerCase()
      if (!usedSurfaces.has(surface) && !usedLevers.has(primaryLever)) {
        try {
          await updateLeverTracker(ventureName, surface, primaryLever)
          usedSurfaces.add(surface)
          usedLevers.add(primaryLever)
        } catch { /* non-fatal */ }
      }

      const logId = await insertStrategyLog(
        ventureName, surface, primaryLever,
        parseInt(primaryLever.match(/L(\d)/)?.[1] ?? '6'),
        hookTextA,
        hookB.text ?? 'A/B variant not generated',
        (proposal.runRecommendation as string) ?? 'A',
      ).catch(() => null)

      inserts.push({
        ventureId,
        batchId: batch.id,
        rank: r.rank,
        platform,
        format,
        category: pitch.category,
        intelligenceSource: intelligence,
        ourMove,
        hookA: hookTextA,
        hookB: hookB.text ?? hookTextA,
        leverPrimary: primaryLever,
        leverA: String(hookA.lever ?? primaryLever),
        leverB: String(hookB.lever ?? primaryLever),
        psychologyScore: typeof scoreBlock.compositePct === 'number' ? scoreBlock.compositePct : null,
        system1ScoreA: hookA.system1Score != null ? Number(hookA.system1Score) : null,
        system1ScoreB: hookB.system1Score != null ? Number(hookB.system1Score) : null,
        runRecommendation: proposal.runRecommendation?.toString() ?? null,
        marketEffect,
        vsCurrent,
        viralMechanism: (proposal.viralMechanism as string) ?? null,
        fullProposal: proposal as Record<string, unknown>,
        status: 'pending',
        strategyLogId: logId,
      })
    }

    // If no ranked came through, create one from each pitch block
    if (inserts.length === 0) {
      for (let i = 0; i < pitchBlocks.length; i++) {
        const p = pitchBlocks[i]
        const platform = extractField(p.raw, 'Platform') || 'Instagram'
        const hook = extractField(p.raw, 'Hook') || ''

        inserts.push({
          ventureId,
          batchId: batch.id,
          rank: i + 1,
          platform,
          format: extractField(p.raw, 'Format') || 'Reel',
          category: p.category,
          intelligenceSource: extractField(p.raw, 'Intelligence') || null,
          ourMove: hook,
          hookA: hook,
          hookB: hook,
          leverPrimary: 'L6 — Curiosity Gap',
          leverA: 'L6 — Curiosity Gap',
          leverB: 'L6 — Curiosity Gap',
          psychologyScore: null,
          system1ScoreA: null,
          system1ScoreB: null,
          runRecommendation: null,
          marketEffect: extractField(p.raw, 'Market effect') || null,
          vsCurrent: extractField(p.raw, 'Why beats current') || null,
          viralMechanism: null,
          fullProposal: null,
          status: 'pending',
          strategyLogId: null,
        })
      }
    }

    await insertPitches(inserts as unknown as Array<Record<string, unknown>>)
    await updateBatchStatus(batch.id, 'complete')

    return Response.json({
      success: true,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      pitchCount: inserts.length,
      message: `Intelligence batch #${batch.batchNumber} complete with ${inserts.length} ranked proposals.`,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

// ─── GET — latest batch + pitches for active venture ───────────────────────────

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { data } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  const ventureId = (data?.id as string | undefined) ?? slug

  const [batch, pitches] = await Promise.all([
    getLatestBatch(ventureId),
    getLatestPitches(ventureId, 5),
  ])

  return Response.json({ ventureId, batch, pitches })
}

// ─── PATCH — update a pitch status (approve / reject / pass) ───────────────────

export async function PATCH(request: Request): Promise<Response> {
  let body: { pitchId: string; status: 'approved' | 'drafted' | 'deployed' | 'passed' }
  try { body = await request.json() as typeof body }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.pitchId || !body.status) {
    return Response.json({ error: 'pitchId and status are required' }, { status: 400 })
  }

  await updatePitchStatus(body.pitchId, body.status)
  return Response.json({ ok: true, pitchId: body.pitchId, status: body.status })
}
