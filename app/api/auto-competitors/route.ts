import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { callFast } from '@/lib/ai-client'

export const runtime = 'nodejs'

// ── Band calculation — 4 tiers now ───────────────────────────────────────────
// micro:    100x–500x  your followers (floor 10K,  cap 50K)
// small:    500x–1000x your followers (floor 50K,  cap 100K)
// stretch:  1000x–5000x (floor 100K, cap 500K)
// anchor:   1M+

function getBands(followers: number) {
  const microMin  = Math.max(followers * 100,  10_000)
  const microMax  = Math.max(followers * 500,  50_000)
  const smallMin  = Math.max(followers * 500,  50_000)
  const smallMax  = Math.max(followers * 1_000, 100_000)
  const stretchMin = Math.max(followers * 1_000, 100_000)
  const stretchMax = Math.max(followers * 5_000, 500_000)
  return { microMin, microMax, smallMin, smallMax, stretchMin, stretchMax }
}

function fmtBand(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  return (n / 1_000).toFixed(0) + 'K'
}

// ── Country-aware fallbacks — now with micro tier ────────────────────────────
interface FallbackSet {
  micro: string[]
  small: string[]
  stretch: string[]
  anchor: string
}

const FALLBACKS: Record<string, FallbackSet> = {
  'fashion e-commerce:IN': {
    micro:    ['The Loom', 'Okhai', 'Karagiri'],
    small:    ['Bunaai', 'Suta', 'Label Ritu Kumar'],
    stretch:  ['Libas', 'Global Desi'],
    anchor:   'FabIndia',
  },
  'fashion e-commerce': {
    micro:    ['Mate the Label', 'Lisa Says Gah', 'Elaluz'],
    small:    ['Staud', 'Reformation', 'Aya Muse'],
    stretch:  ['Ganni', 'Cult Gaia'],
    anchor:   'Zara',
  },
  'fintech:IN': {
    micro:    ['Fi Money', 'Jupiter', 'Niyo'],
    small:    ['Slice', 'Freo', 'OneCard'],
    stretch:  ['Groww', 'Zerodha'],
    anchor:   'Paytm',
  },
  fintech: {
    micro:    ['Lili', 'Klar', 'Suits App'],
    small:    ['Mercury', 'Brex', 'Ramp'],
    stretch:  ['N26', 'Starling Bank'],
    anchor:   'Revolut',
  },
}

function getFallback(industryKey: string, countryCode: string): FallbackSet {
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

// ── Venture profile enrichment ───────────────────────────────────────────────

interface VentureProfile {
  name: string
  industry: string
  country: string
  countryName: string
  followers: number
  subcategories: string[]
  brandTier: string
  pricePoint: number
  audience: {
    ageRange: string
    gender: string
    incomeTier: string
    region: string
  }
}

async function resolveVentureProfile(ventureSlug: string, fallbackFollowers: number, fallbackCountry: string): Promise<VentureProfile> {
  let country = fallbackCountry
  let followers = fallbackFollowers
  let subcategories: string[] = []
  let brandTier = ''
  let pricePoint = 0
  let audience = { ageRange: '', gender: '', incomeTier: '', region: 'all' }

  try {
    const { data: venture } = await supabase
      .from('ventures')
      .select('name, operating_countries, market_subcategories, brand_tier, avg_price_point, target_audience')
      .eq('slug', ventureSlug)
      .limit(1)
      .single()

    if (venture) {
      if (venture.operating_countries?.length) {
        country = venture.operating_countries[0] as string
      }
      subcategories = (venture.market_subcategories ?? []) as string[]
      brandTier = (venture.brand_tier ?? '') as string
      pricePoint = (venture.avg_price_point ?? 0) as number

      const ta = venture.target_audience as Record<string, unknown> | null
      if (ta) {
        audience = {
          ageRange: (ta.age_range ?? ta.ageRange ?? '') as string,
          gender: (ta.gender ?? '') as string,
          incomeTier: (ta.income_tier ?? ta.incomeTier ?? '') as string,
          region: (ta.region ?? 'all') as string,
        }
      }

      // Sum latest followers across all platforms
      const { data: snapshots } = await supabase
        .from('social_snapshots')
        .select('followers, platform, captured_at')
        .eq('venture_slug', ventureSlug)
        .not('followers', 'is', null)
        .order('captured_at', { ascending: false })

      if (snapshots?.length) {
        const latestPerPlatform = new Map<string, number>()
        for (const s of snapshots) {
          if (!latestPerPlatform.has(s.platform)) {
            latestPerPlatform.set(s.platform, s.followers as number)
          }
        }
        const total = Array.from(latestPerPlatform.values()).reduce((a, b) => a + b, 0)
        if (total > 0) followers = total
      }
    }
  } catch { /* use defaults */ }

  const countryCode = country.toUpperCase()
  const countryName = COUNTRY_NAMES[countryCode] ?? country
  const industry = ventureSlug === 'hourbour' ? 'fintech' : 'fashion e-commerce'

  return {
    name: ventureSlug === 'hourbour' ? 'Hourbour' : 'Novizio',
    industry,
    country: countryCode,
    countryName,
    followers,
    subcategories,
    brandTier,
    pricePoint,
    audience,
  }
}

function buildVentureContext(profile: VentureProfile): string {
  const parts: string[] = []

  if (profile.subcategories.length > 0) {
    const labels = profile.subcategories
      .map(c => c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .slice(0, 4)
    parts.push(`Product focus: ${labels.join(', ')}`)
  }

  if (profile.brandTier) {
    parts.push(`Brand tier: ${profile.brandTier}`)
  }

  if (profile.pricePoint > 0) {
    parts.push(`Average price point: ~₹${profile.pricePoint.toLocaleString('en-IN')}`)
  }

  if (profile.audience.ageRange) {
    parts.push(`Target age: ${profile.audience.ageRange}`)
  }
  if (profile.audience.gender) {
    parts.push(`Target gender: ${profile.audience.gender}`)
  }
  if (profile.audience.incomeTier) {
    parts.push(`Income tier: ${profile.audience.incomeTier}`)
  }
  if (profile.audience.region && profile.audience.region !== 'all') {
    parts.push(`Region: ${profile.audience.region}`)
  }

  return parts.length > 0 ? `\n\nVenture context for ${profile.name}:\n${parts.join('\n')}` : ''
}

// ─── POST handler ────────────────────────────────────────────────────────────

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

    // Resolve full venture profile when ventureSlug is provided
    let ventureCtx = ''
    if (ventureSlug) {
      const profile = await resolveVentureProfile(ventureSlug, currentFollowers, country)
      country = profile.country
      currentFollowers = profile.followers
      ventureCtx = buildVentureContext(profile)
    }

    const bands = getBands(currentFollowers)
    const industryKey = industry?.toLowerCase() ?? 'fashion e-commerce'
    const countryCode = country.toUpperCase()
    const fallback = getFallback(industryKey, countryCode)
    const countryName = COUNTRY_NAMES[countryCode] ?? country

    const raw = await callFast({
      messages: [{
        role: 'user',
        content: `You are a brand strategist. "${brandName}" has ~${currentFollowers.toLocaleString()} social followers and targets the ${countryName} market.${ventureCtx}

Find realistic, size-matched competitors in ${industry ?? 'fashion e-commerce'}.

Return ONLY this JSON — no explanation, no markdown:
{
  "micro": ["Brand A", "Brand B", "Brand C"],
  "small": ["Brand D", "Brand E", "Brand F"],
  "stretch": ["Brand G", "Brand H"],
  "anchor": "Brand I"
}

Tier rules (sizes are approximate — err on the side of smaller brands):
- "micro": exactly 3 brands with ${fmtBand(bands.microMin)}–${fmtBand(bands.microMax)} followers. These are the closest peers — same niche, same customer profile, similar price point. ${brandName} should be able to match or beat their engagement within 6 months.${ventureCtx ? ' Match the venture context above — same product categories, same price tier, same audience demographics.' : ''}
- "small": exactly 3 brands with ${fmtBand(bands.smallMin)}–${fmtBand(bands.smallMax)} followers. Realistic benchmark peers for a 12-month growth target. Same ${countryName} market.
- "stretch": exactly 2 brands with ${fmtBand(bands.stretchMin)}–${fmtBand(bands.stretchMax)} followers. Visible horizon — study their strategy, but they're ahead of you.
- "anchor": exactly 1 well-known brand with 1M+ followers. Directional inspiration only. Must be in the same industry category.

Critical rules:
- All brands must be real, active, and in the ${industryKey} space
- Prioritise brands with strong ${countryName} audience — avoid US-only giants unless ${countryName} is US
- CRITICAL: Do NOT put 500K+ brands in "micro" or "small". Pick genuinely niche brands
- If venture context mentions specific product categories (e.g., sarees, ethnic wear), prioritise competitors in those same categories
- If a brand tier is specified (e.g., premium, luxury), find similarly-positioned brands
- Do NOT include "${brandName}" itself`,
      }],
      maxTokens: 384,
    })

    const match = raw.trim().match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as {
          micro?: string[]
          small?: string[]
          stretch?: string[]
          anchor?: string
        }
        if (parsed.micro?.length && parsed.small?.length && parsed.stretch?.length && parsed.anchor) {
          return NextResponse.json({
            micro: parsed.micro.slice(0, 3),
            small: parsed.small.slice(0, 3),
            stretch: parsed.stretch.slice(0, 2),
            anchor: parsed.anchor,
          })
        }
      } catch { /* fall through */ }
    }

    // Fallback to static lists
    return NextResponse.json({
      micro: fallback.micro,
      small: fallback.small,
      stretch: fallback.stretch,
      anchor: fallback.anchor,
    })
  } catch (err) {
    console.error('[auto-competitors]', err)
    const fb = FALLBACKS['fashion e-commerce']
    return NextResponse.json({
      micro: fb.micro,
      small: fb.small,
      stretch: fb.stretch,
      anchor: fb.anchor,
    }, { status: 200 })
  }
}
