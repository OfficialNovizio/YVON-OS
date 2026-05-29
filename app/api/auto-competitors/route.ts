import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { callFast } from '@/lib/ai-client'

export const runtime = 'nodejs'

// Dynamic band: competitors should be 500x–1000x our size.
// At 100 followers → 50k–100k benchmark range (exactly what makes sense for seed).
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

// Country-aware fallbacks: keyed as "industry:country" then "industry" then default
const FALLBACKS: Record<string, { benchmark: string[]; stretch: string[]; anchor: string }> = {
  'fashion e-commerce:IN': {
    benchmark: ['Bunaai', 'Suta', 'Label Ritu Kumar'],
    stretch: ['Libas', 'Global Desi'],
    anchor: 'FabIndia',
  },
  'fashion e-commerce': {
    benchmark: ['Rouje', 'By Far', 'Rhode'],
    stretch: ['Reformation', 'Staud'],
    anchor: 'Zara',
  },
  'fintech:IN': {
    benchmark: ['Fi Money', 'Jupiter', 'Slice'],
    stretch: ['Groww', 'Zerodha'],
    anchor: 'Paytm',
  },
  fintech: {
    benchmark: ['Lili', 'Klar', 'Suits App'],
    stretch: ['N26', 'Starling Bank'],
    anchor: 'Revolut',
  },
}

function getFallback(industryKey: string, countryCode: string) {
  return FALLBACKS[`${industryKey}:${countryCode.toUpperCase()}`]
    ?? FALLBACKS[industryKey]
    ?? FALLBACKS['fashion e-commerce']
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', UK: 'United Kingdom',
  IT: 'Italy', FR: 'France', DE: 'Germany', ES: 'Spain',
  CA: 'Canada', AU: 'Australia', IN: 'India', AE: 'UAE', NL: 'Netherlands',
  JP: 'Japan', KR: 'South Korea', SG: 'Singapore', BR: 'Brazil',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      brandName?: string
      industry?: string
      ventureSlug?: string
      currentFollowers?: number
      country?: string
    }

    const { brandName, industry, ventureSlug } = body
    let { currentFollowers = 100, country = 'US' } = body

    if (!brandName) {
      return NextResponse.json({ error: 'brandName required' }, { status: 400 })
    }

    // If ventureSlug provided, pull real data from DB: country + latest follower count
    if (ventureSlug) {
      const { data: venture } = await supabase
        .from('ventures')
        .select('operating_countries')
        .eq('slug', ventureSlug)
        .limit(1)
        .single()

      if (venture?.operating_countries?.length) {
        country = venture.operating_countries[0] as string
      }

      // Sum latest followers across all platforms for this venture
      const { data: snapshots } = await supabase
        .from('social_snapshots')
        .select('followers, platform, scraped_at')
        .eq('venture_slug', ventureSlug)
        .not('followers', 'is', null)
        .order('scraped_at', { ascending: false })

      if (snapshots?.length) {
        // Take the most recent snapshot per platform, sum them
        const latestPerPlatform = new Map<string, number>()
        for (const s of snapshots) {
          if (!latestPerPlatform.has(s.platform)) {
            latestPerPlatform.set(s.platform, s.followers as number)
          }
        }
        const total = Array.from(latestPerPlatform.values()).reduce((a, b) => a + b, 0)
        if (total > 0) currentFollowers = total
      }
    }

    const band = getBand(currentFollowers)
    const industryKey = industry?.toLowerCase() ?? 'fashion e-commerce'
    const countryCode = country.toUpperCase()
    const fallback = getFallback(industryKey, countryCode)
    const countryName = COUNTRY_NAMES[countryCode] ?? country

    const raw = await callFast({
      messages: [{
        role: 'user',
        content: `You are a brand strategist. The brand "${brandName}" currently has approximately ${currentFollowers} social media followers and targets the ${countryName} market.

Find realistic, size-matched competitors in the "${industry ?? 'fashion e-commerce'}" space.

Return ONLY this JSON — no explanation, no markdown:
{
  "benchmark": ["Brand A", "Brand B", "Brand C"],
  "stretch": ["Brand D", "Brand E"],
  "anchor": "Brand F"
}

Rules:
- "benchmark": exactly 3 brands with ${fmtBand(band.min)}–${fmtBand(band.max)} followers — realistic peers that ${brandName} can close the gap on within 12 months. MUST be from or primarily targeting ${countryName}.
- "stretch": exactly 2 brands with ${fmtBand(band.max)}–${fmtBand(band.stretchMax)} followers — visible horizon to study strategy. Same ${countryName} market.
- "anchor": exactly 1 well-known brand with 1M+ followers — directional inspiration only, not a direct competitor
- All brands must be real, active, and in the same niche as "${brandName}"
- Prioritise brands with strong ${countryName} audience and relevance — avoid US-only giants if ${countryName} !== "United States"
- Do NOT include "${brandName}" itself`,
      }],
      maxTokens: 256,
    })

    const match = raw.trim().match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as {
          benchmark?: string[]
          stretch?: string[]
          anchor?: string
        }
        if (parsed.benchmark?.length && parsed.stretch?.length && parsed.anchor) {
          return NextResponse.json({
            benchmark: parsed.benchmark.slice(0, 3),
            stretch: parsed.stretch.slice(0, 2),
            anchor: parsed.anchor,
          })
        }
      } catch { /* fall through */ }
    }

    return NextResponse.json(fallback)
  } catch (err) {
    console.error('[auto-competitors]', err)
    return NextResponse.json(FALLBACKS['fashion e-commerce'], { status: 200 })
  }
}

