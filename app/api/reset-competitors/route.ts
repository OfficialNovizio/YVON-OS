/**
 * POST /api/reset-competitors
 * Wipes all competitor data for a venture, then runs tiered discovery fresh.
 *
 * Clears: competitors (→ cascades to competitor_metrics, competitor_socials)
 *         competitor_snapshots (venture_id-scoped, not cascaded)
 *
 * Then: calls auto-competitors for tier-appropriate brands, runs pipeline.
 *
 * Body: { ventureSlug }
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { runCompetitorPipeline } from '@/lib/competitor-pipeline'
import { callFast } from '@/lib/ai-client'

export const runtime = 'nodejs'
export const maxDuration = 180

// Fallbacks keyed by "slug:country" first, then "slug", then default
const FALLBACK: Record<string, { benchmark: string[]; stretch: string[]; anchor: string }> = {
  'novizio:IN':  { benchmark: ['Bunaai', 'Suta', 'Label Ritu Kumar'], stretch: ['Libas', 'Global Desi'], anchor: 'FabIndia' },
  novizio:       { benchmark: ['Rouje', 'By Far', 'Rhode'], stretch: ['Reformation', 'Staud'], anchor: 'Zara' },
  'hourbour:IN': { benchmark: ['Fi Money', 'Jupiter', 'Slice'], stretch: ['Groww', 'Zerodha'], anchor: 'Paytm' },
  hourbour:      { benchmark: ['Lili', 'Klar', 'Suits App'], stretch: ['N26', 'Starling Bank'], anchor: 'Revolut' },
}

function getFallback(slug: string, countryCode: string) {
  return FALLBACK[`${slug}:${countryCode.toUpperCase()}`] ?? FALLBACK[slug] ?? FALLBACK.novizio
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', UK: 'United Kingdom',
  IT: 'Italy', FR: 'France', DE: 'Germany', ES: 'Spain',
  CA: 'Canada', AU: 'Australia', IN: 'India', AE: 'UAE', NL: 'Netherlands',
  JP: 'Japan', KR: 'South Korea', SG: 'Singapore', BR: 'Brazil',
}

function getBand(followers: number) {
  const min = Math.max(followers * 500, 5_000)
  const max = Math.max(followers * 1_000, 10_000)
  const stretchMax = Math.max(followers * 5_000, 100_000)
  return { min, max, stretchMax }
}

function fmtBand(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  return (n / 1_000).toFixed(0) + 'K'
}

export async function POST(req: NextRequest) {
  let body: { ventureSlug?: string }
  try { body = await req.json() as typeof body }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { ventureSlug } = body
  if (!ventureSlug) return NextResponse.json({ error: 'ventureSlug required' }, { status: 400 })

  // Resolve venture (include operating_countries for country-aware discovery)
  const { data: ventures } = await supabase
    .from('ventures').select('id, operating_countries').eq('slug', ventureSlug).limit(1)
  const ventureId = (ventures?.[0] as any)?.id as string | undefined
  if (!ventureId) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

  // Determine primary market country
  const rawCountry = ((ventures?.[0] as any)?.operating_countries?.[0] as string | undefined) ?? 'US'
  const countryName = COUNTRY_NAMES[rawCountry.toUpperCase()] ?? rawCountry

  // Get current follower count for size-matched discovery
  let currentFollowers = 100
  const { data: snapshots } = await supabase
    .from('social_snapshots')
    .select('followers, platform, scraped_at')
    .eq('venture_slug', ventureSlug)
    .not('followers', 'is', null)
    .order('scraped_at', { ascending: false })

  if (snapshots?.length) {
    const latestPerPlatform = new Map<string, number>()
    for (const s of snapshots) {
      if (!latestPerPlatform.has((s as any).platform)) {
        latestPerPlatform.set((s as any).platform, (s as any).followers as number)
      }
    }
    const total = Array.from(latestPerPlatform.values()).reduce((a, b) => a + b, 0)
    if (total > 0) currentFollowers = total
  }

  const band = getBand(currentFollowers)

  // ── 1. Clear all existing competitor data ───────────────────────────────────

  // competitor_snapshots uses venture_id directly — delete first
  await supabase
    .from('competitor_snapshots')
    .delete()
    .eq('venture_id', ventureId)

  // competitors delete cascades to competitor_metrics + competitor_socials
  await supabase
    .from('competitors')
    .delete()
    .eq('venture_id', ventureId)

  // ── 2. Discover fresh tier-appropriate brands ───────────────────────────────

  const ventureName = ventureSlug === 'hourbour' ? 'Hourbour' : 'Novizio'
  const industry    = ventureSlug === 'hourbour' ? 'fintech' : 'fashion e-commerce'
  const fallback    = getFallback(ventureSlug, rawCountry)

  let tieredBrands: Array<{ brandName: string; tier: 'benchmark' | 'stretch' | 'anchor' }>

  try {
    const raw = await callFast({
      messages: [{
        role: 'user',
        content: `You are a brand strategist. The brand "${ventureName}" currently has approximately ${currentFollowers} social media followers and targets the ${countryName} market. It operates in the "${industry}" space.

Find realistic, size-matched competitors.

Return ONLY this JSON — no explanation, no markdown:
{
  "benchmark": ["Brand A", "Brand B", "Brand C"],
  "stretch": ["Brand D", "Brand E"],
  "anchor": "Brand F"
}

Rules:
- "benchmark": exactly 3 brands with ${fmtBand(band.min)}–${fmtBand(band.max)} followers — realistic peers to close the gap on in 12 months. MUST be from or primarily targeting ${countryName}. Exclude global giants.
- "stretch": exactly 2 brands with ${fmtBand(band.max)}–${fmtBand(band.stretchMax)} followers — visible horizon to study strategy. Same ${countryName} market.
- "anchor": exactly 1 well-known brand with 1M+ followers — directional reference only, not a direct competitor
- All brands must be real, active, and in the same niche as "${ventureName}"
- Prioritise brands with strong ${countryName} audience — avoid US-only brands if market is not United States`,
      }],
      maxTokens: 256,
    })

    const match = raw.trim().match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0]) as { benchmark?: string[]; stretch?: string[]; anchor?: string }
      if (parsed.benchmark?.length && parsed.stretch?.length && parsed.anchor) {
        tieredBrands = [
          ...parsed.benchmark.slice(0, 3).map(n => ({ brandName: n, tier: 'benchmark' as const })),
          ...parsed.stretch.slice(0, 2).map(n  => ({ brandName: n, tier: 'stretch' as const })),
          { brandName: parsed.anchor, tier: 'anchor' as const },
        ]
      } else {
        throw new Error('Incomplete AI response')
      }
    } else {
      throw new Error('No JSON in AI response')
    }
  } catch {
    tieredBrands = [
      ...fallback.benchmark.map(n => ({ brandName: n, tier: 'benchmark' as const })),
      ...fallback.stretch.map(n   => ({ brandName: n, tier: 'stretch' as const })),
      { brandName: fallback.anchor, tier: 'anchor' as const },
    ]
  }

  // ── 3. Run pipeline ─────────────────────────────────────────────────────────

  try {
    const results = await runCompetitorPipeline(ventureId, tieredBrands)
    return NextResponse.json({
      cleared: true,
      discovered: tieredBrands.map(b => b.brandName),
      results,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Pipeline failed'
    console.error('[reset-competitors]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
