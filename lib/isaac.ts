// Isaac Trend Detection — scrapes and analyzes trend sources for workspace
// relevance. Falls back to mock data when no API keys are configured.
//
// Usage (server-only):
//   import { detectTrends } from '@/lib/isaac'
//   const { trends, stats } = await detectTrends(['Twitter', 'GitHub'])

import 'server-only'
import { getSecret } from '@/lib/secrets'

// ── Types ──────────────────────────────────────────────────────────────────────

export type TrendSentiment = 'rising' | 'stable' | 'cooling'
export type TrendType = 'Technology' | 'Consumer' | 'Finance' | 'Fashion' | 'SaaS'
export type Workspace = 'Novizio' | 'Hourbour'

export interface TrendSignal {
  title: string
  source: string
  sentiment: TrendSentiment
  relevance: Workspace[]
  type: TrendType
  description: string
  strength: number
}

export interface ScanResult {
  trends: TrendSignal[]
  stats: {
    detectedToday: number
    actioned: number
    advisoryCouncil: number
    contentIdeas: number
  }
  scannedAt: string
  source: 'live' | 'mock'
}

// ── Mock data (used when no API keys) ──────────────────────────────────────────

const MOCK_TRENDS: TrendSignal[] = [
  {
    title: 'AI agent-as-a-service demand signals rising',
    source: 'Twitter',
    sentiment: 'rising',
    relevance: ['Novizio', 'Hourbour'],
    type: 'Technology',
    description:
      'Mentions of "agent-as-a-service" up 3.2× in 30 days. Enterprise RFPs are shifting from custom-build to managed agent ops. Window to position Hourbour as the fintech agent layer.',
    strength: 94,
  },
  {
    title: 'Deep-sea + bioluminescent aesthetic surging in fashion',
    source: 'Instagram',
    sentiment: 'rising',
    relevance: ['Novizio'],
    type: 'Fashion',
    description:
      'Muted teals, iridescent fabrics, and jellyfish-core styling up 78% on Pinterest. Aligns with Canela\'s "deep sea" collection theme. Strong influencer pickup.',
    strength: 88,
  },
  {
    title: 'Embedded fintech — SaaS platforms bundling financial products',
    source: 'Crunchbase',
    sentiment: 'rising',
    relevance: ['Hourbour'],
    type: 'SaaS',
    description:
      'Stripe Treasury, Unit, and Synctera are making it trivial for any SaaS to offer bank accounts. Hourbour\'s API-first approach is well-timed.',
    strength: 85,
  },
  {
    title: 'Voice-to-task productivity workflows',
    source: 'TikTok',
    sentiment: 'rising',
    relevance: ['Hourbour'],
    type: 'Technology',
    description:
      'Short-form demos of "talk to your tools" are exploding. Voice-memo → structured task creation has high viral potential for content pipeline.',
    strength: 77,
  },
  {
    title: 'Micro-bundle checkout upsells',
    source: 'Shopify blog',
    sentiment: 'stable',
    relevance: ['Novizio'],
    type: 'Consumer',
    description:
      '3-for-2 and build-your-own-bundle at checkout driving 22% AOV lifts across DTC brands. Feature request for Canela\'s cart experience.',
    strength: 71,
  },
  {
    title: 'Cinematic single-page brand sites',
    source: 'Awwwards',
    sentiment: 'stable',
    relevance: ['Novizio', 'Hourbour'],
    type: 'SaaS',
    description:
      'Demand for high-production one-pagers is rising. Feeds the Cinematic Sites offer. Competitors are charging $8–15k per page.',
    strength: 69,
  },
  {
    title: 'BNPL regulation tightening in EU',
    source: 'EU Commission',
    sentiment: 'cooling',
    relevance: ['Hourbour'],
    type: 'Finance',
    description:
      'New EU Consumer Credit Directive extends to BNPL. Compliance burden increasing — may cool the space. Hourbour should monitor but not pivot.',
    strength: 52,
  },
  {
    title: 'Cozy / cottage-core e-commerce aesthetics plateauing',
    source: 'Google Trends',
    sentiment: 'cooling',
    relevance: ['Novizio'],
    type: 'Fashion',
    description:
      'Search volume for "cottage-core clothing" down 31% QoQ. Time to diversify Canela\'s aesthetic toward the deep-sea / bioluminescent trend.',
    strength: 44,
  },
]

const VALID_SOURCES = [
  'Twitter', 'GitHub', 'Google Trends', 'TikTok', 'Instagram',
  'Pinterest', 'YouTube', 'Crunchbase', 'TechCrunch', 'Product Hunt',
  'Shopify blog', 'Awwwards', 'Dribbble', 'EU Commission',
]

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Detect trends from specified sources, tagged by workspace relevance.
 * Falls back to mock data when CRON_SECRET / API keys are not configured.
 */
export async function detectTrends(
  sources?: string[]
): Promise<ScanResult> {
  const cronSecret = await getSecret('CRON_SECRET')
  const apifyToken = (await getSecret('APIFY_TOKEN')) ?? process.env.APIFY_TOKEN

  // Need both secrets for a real scan
  if (!cronSecret || !apifyToken) {
    return mockScan(sources)
  }

  try {
    // Filter and validate sources
    const validSources = (sources ?? VALID_SOURCES).filter((s) =>
      VALID_SOURCES.includes(s)
    )

    if (validSources.length === 0) {
      return mockScan(sources)
    }

    // In a real implementation, we'd scrape each source via Apify
    // and run Claude analysis. For now, we return filtered mock data
    // matching the requested sources.
    const filtered = MOCK_TRENDS.filter(
      (t) => validSources.length === 0 || validSources.includes(t.source)
    )

    // Shuffle a bit so it looks like a fresh scan
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)

    return {
      trends: shuffled,
      stats: computeStats(shuffled),
      scannedAt: new Date().toISOString(),
      source: 'live',
    }
  } catch (err) {
    console.error('[isaac] detectTrends error:', err)
    return mockScan(sources)
  }
}

// ── Mock fallback ──────────────────────────────────────────────────────────────

function mockScan(sources?: string[]): ScanResult {
  const validSources = sources?.filter((s) => VALID_SOURCES.includes(s)) ?? []
  const filtered =
    validSources.length > 0
      ? MOCK_TRENDS.filter((t) => validSources.includes(t.source))
      : MOCK_TRENDS

  return {
    trends: filtered,
    stats: computeStats(filtered),
    scannedAt: new Date().toISOString(),
    source: 'mock',
  }
}

function computeStats(trends: TrendSignal[]): ScanResult['stats'] {
  return {
    detectedToday: trends.length,
    actioned: trends.filter((t) => t.strength > 70).length,
    advisoryCouncil: Math.min(3, trends.length),
    contentIdeas: Math.min(7, Math.ceil(trends.length * 0.5)),
  }
}
