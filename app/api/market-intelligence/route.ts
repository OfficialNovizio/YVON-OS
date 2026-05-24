import { getVentureBySlug } from '@/lib/db'
import type { VentureConfig } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface MarketIntelligenceData {
  tamSamSom: TamsamSom
  audienceDemographics: AudienceDemographics
  customerGrowth: CustomerGrowth
  marketDemandIndex: MarketDemandIndex
  whitespaceMatrix: WhitespaceMatrix
  competitivePosition: CompetitivePosition
  forecast: Forecast
}

interface TamsamSom {
  tam: number; sam: number; som: number; penetrationPct: number;
  segments: { name: string; tam: number; sam: number; penetration: number; revenue: number; growth: number }[]
}

interface AudienceDemographics {
  ageBands: { label: string; pct: number; trend: 'up' | 'down' | 'stable' }[]
  incomeTiers: { label: string; pct: number; trend: 'up' | 'down' | 'stable' }[]
  psychographicClusters: { label: string; pct: number; trend: 'up' | 'down' | 'stable' }[]
  genderSplit: { male: number; female: number; other: number }
}

interface CustomerGrowth {
  actual: number[]; forecast: number[]; required: number[];
  labels: string[]; confidenceLower: number[]; confidenceUpper: number[]
}

interface MarketDemandIndex {
  current: number; previous: number; categoryAvg: number; shareCaptured: number;
  byCategory: { name: string; demand: number; share: number; trend: 'up' | 'down' | 'stable' }[]
}

interface WhitespaceMatrix {
  quadrants: {
    priorityInvest: { name: string; revenuePotential: number; trend: 'up' | 'down' | 'stable' }[]
    defend: { name: string; revenuePotential: number; trend: 'up' | 'down' | 'stable' }[]
    monetize: { name: string; revenuePotential: number; trend: 'up' | 'down' | 'stable' }[]
    ignore: { name: string; revenuePotential: number; trend: 'up' | 'down' | 'stable' }[]
  }
}

interface CompetitivePosition {
  shareOfVoice: number; shareOfVoiceTrend: 'up' | 'down' | 'stable';
  competitors: { name: string; sov: number; positioning: string; priceIndex: number; sovTrend: 'up' | 'down' | 'stable'; alert?: string }[]
}

interface Forecast {
  baseRevenue: number[]; bullRevenue: number[]; bearRevenue: number[];
  baseCustomers: number[]; bullCustomers: number[]; bearCustomers: number[];
  labels: string[]; triggerConditions: { scenario: string; condition: string; met: boolean }[]
}

// ─── Market context from saved venture data ────────────────────────────────────

interface MarketContext {
  focus: string        // Human-readable market focus (e.g. "Women's Ethnic Wear")
  segment: string      // Broad industry segment (fashion, fintech, saas, etc.)
  audienceAge: string  // Target age range
  audienceGender: string // Target gender focus
  audienceIncome: string // Target income tier
  audienceRegion: string // Target region type
  isFashion: boolean
  isFintech: boolean
  isSaaS: boolean
}

// Label map for subcategory values → display names
const LABELS: Record<string, string> = {
  saree: 'Sarees', lehenga: 'Lehengas', 'salwar-kameez': 'Salwar Kameez',
  churidar: 'Churidar', anarkali: 'Anarkali', 'ethnic-gown': 'Ethnic Gowns',
  'indo-western': 'Indo-Western', 'western-dress': 'Dresses',
  top: 'Tops', trouser: 'Trousers', 'jeans-womens': "Women's Jeans",
  'jeans-mens': "Men's Jeans", 'shorts-womens': "Women's Shorts",
  'blazer-womens': "Women's Blazers", jumpsuit: 'Jumpsuits',
  'co-ord': 'Co-ord Sets', 'activewear-womens': "Women's Activewear",
  sherwani: 'Sherwanis', kurta: 'Kurtas', 'kurta-pajama': 'Kurta Pajama',
  bandhgala: 'Bandhgala', dhoti: 'Dhotis', shirt: 'Shirts',
  't-shirt': 'T-Shirts', 'trouser-mens': "Men's Trousers",
  'blazer-mens': "Men's Blazers", suit: 'Suits',
  'western-womenswear': "Women's Western Wear", 'ethnic-womenswear': "Women's Ethnic Wear",
  'western-menswear': "Men's Western Wear", 'ethnic-menswear': "Men's Ethnic Wear",
  womenswear: "Women's", menswear: "Men's", kidswear: "Kids'",
  accessories: 'Accessories', jewelry: 'Jewelry', bags: 'Bags',
  watches: 'Watches', belts: 'Belts', scarves: 'Scarves',
  footwear: 'Footwear', sneakers: 'Sneakers', boots: 'Boots',
  sandals: 'Sandals', 'formal-shoes': 'Formal Shoes', heels: 'Heels',
  flats: 'Flats', beauty: 'Beauty', skincare: 'Skincare', makeup: 'Makeup',
  fragrance: 'Fragrance', haircare: 'Haircare',
  unisex: 'Unisex', 'home-living': 'Home & Living',
  activewear: 'Activewear', swimwear: 'Swimwear', lingerie: 'Lingerie',
}

function buildContext(venture: VentureConfig): MarketContext {
  const cats = venture.marketSubcategories ?? []
  const ta = venture.targetAudience ?? {}
  const slug = venture.slug

  // Detect segment from brand type + categories
  const isFintech = slug === 'hourbour' || cats.some(c => ['fintech', 'saas > fintech'].includes(c))
  const isSaaS = slug === 'hourbour' || venture.brandType === 'saas' || cats.some(c => c.startsWith('saas >'))

  // Resolve a human-readable focus label from the most specific leaf categories
  const leafCats = cats.filter(c => c.includes('>') || !Object.keys(LABELS).some(k =>
    k !== c && cats.includes(k) && c.startsWith(k)
  ))
  // Pick the most specific leaf label
  const leafLabels = leafCats.map(c => LABELS[c] ?? c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))

  const ageLabel = ta.ageRange ?? '25–40'
  const genderLabel = ta.gender === 'female' ? 'Female' : ta.gender === 'male' ? 'Male' : 'All'
  const incomeLabel = ta.incomeTier ?? 'premium'

  // Build focus string from leaf labels
  const focus = leafLabels.length > 0
    ? leafLabels.slice(0, 3).join(', ') + (leafLabels.length > 3 ? ' & more' : '')
    : isFintech ? 'Fintech' : isSaaS ? 'SaaS' : 'Fashion & Lifestyle'

  return {
    focus,
    segment: isFintech ? 'fintech' : isSaaS ? 'saas' : 'fashion',
    audienceAge: ageLabel,
    audienceGender: genderLabel,
    audienceIncome: incomeLabel,
    audienceRegion: ta.region ?? 'all',
    isFashion: !isFintech && !isSaaS,
    isFintech,
    isSaaS,
  }
}

// ─── Parameter-driven generators ──────────────────────────────────────────────

// Parse age range like "25-40" into bands
function parseAgeBands(range: string): { label: string; weight: number }[] {
  const match = range.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (match) {
    const start = parseInt(match[1]), end = parseInt(match[2])
    const size = end - start
    if (size <= 5) return [{ label: range, weight: 1 }]
    if (size <= 10) return [
      { label: `${start}–${start + Math.floor(size / 2)}`, weight: 0.55 },
      { label: `${start + Math.floor(size / 2) + 1}–${end}`, weight: 0.45 },
    ]
    // Spread across 3 bands
    const third = Math.round(size / 3)
    return [
      { label: `${start}–${start + third}`, weight: 0.4 },
      { label: `${start + third + 1}–${start + third * 2}`, weight: 0.35 },
      { label: `${start + third * 2 + 1}–${end}`, weight: 0.25 },
    ]
  }
  return [{ label: range || '25–40', weight: 1 }]
}

// Core TAM/SAM/SOM — generated from parameter cross-product
function getTamsamSom(ctx: MarketContext, countries: string[]): TamsamSom {
  const m = Math.max(1, countries.length)

  // Build segment matrix: demographic band × product focus
  const ageBands = parseAgeBands(ctx.audienceAge)
  const incomeMultiplier = ctx.audienceIncome === 'luxury' ? 0.25 : ctx.audienceIncome === 'premium' ? 0.35 : ctx.audienceIncome === 'aspirational' ? 0.28 : 0.12
  const regionMultiplier = ctx.audienceRegion === 'urban' ? 0.6 : ctx.audienceRegion === 'suburban' ? 0.3 : ctx.audienceRegion === 'rural' ? 0.1 : 1

  if (ctx.isFashion) {
    // Products: use subcategory leaf labels, fall back to generic
    const products = ctx.focus.split(', ').filter(p => p.length < 30 && !p.includes('&'))
    const productList = products.length > 0 ? products : ["Women's Wear", "Ethnic Wear"]

    // Base TAM per product (varies by category)
    const baseTamByProduct: Record<string, number> = {
      'Sarees': 4800000000, 'Lehengas': 3400000000, 'Salwar Kameez': 2800000000,
      'Kurtas': 2200000000, 'Sherwanis': 1800000000, 'Dresses': 3600000000,
      'Tops': 2400000000, 'Jeans': 5200000000,
    }
    const defaultTam = 3000000000

    const segments = productList.flatMap((product, pi) => {
      const baseTam = baseTamByProduct[product] || defaultTam
      return ageBands.map((band, ai) => {
        const ageWeight = band.weight
        const idx = pi * ageBands.length + ai
        const tam = Math.round(baseTam * ageWeight * incomeMultiplier * regionMultiplier * m / 1000000) * 1000000
        const sam = Math.round(tam * 0.3 / 1000000) * 1000000
        const penetration = [6.2, 4.8, 3.5, 7.1, 5.3, 2.9][idx % 6]
        const revenue = Math.round(sam * (penetration / 100) / 1000000) * 1000000
        const growth = [18.6, 14.2, 22.8, 12.4, 24.1, 9.8][idx % 6]
        const demoSuffix = ctx.audienceIncome && ctx.audienceRegion
          ? `||${band.label}||${ctx.audienceIncome}||${ctx.audienceRegion}`
          : `||${band.label}||${ctx.audienceIncome || 'all'}||${ctx.audienceRegion || 'all'}`
        return {
          name: `${product}${demoSuffix}`,
          tam, sam, penetration, revenue, growth,
        }
      })
    })

    const totalTam = segments.reduce((s, seg) => s + seg.tam, 0)
    const totalSam = segments.reduce((s, seg) => s + seg.sam, 0)
    const totalSom = Math.round(totalSam * 0.1 / 1000000) * 1000000

    return { tam: totalTam, sam: totalSam, som: totalSom, penetrationPct: 5.0, segments }
  }

  if (ctx.isFintech) {
    const finProducts = ['Budgeting & Saving', 'Micro-Investing', 'Fintech Education', 'BNPL']
    const finPens = [6.2, 4.8, 3.5, 7.1]
    const finGrowth = [14.3, 22.1, 8.7, 31.2]
    const segments = finProducts.map((name, i) => {
      const tam = Math.round(12000000000 * incomeMultiplier * regionMultiplier * m / 1000000) * 1000000
      const sam = Math.round(tam * 0.2 / 1000000) * 1000000
      const penetration = finPens[i % finPens.length]
      const revenue = Math.round(sam * (penetration / 100) / 1000000) * 1000000
      return { name: `${name}||all||${ctx.audienceIncome || 'all'}||${ctx.audienceRegion || 'all'}`, tam, sam, penetration, revenue, growth: finGrowth[i % finGrowth.length] }
    })
    return {
      tam: segments.reduce((s, seg) => s + seg.tam, 0),
      sam: segments.reduce((s, seg) => s + seg.sam, 0),
      som: segments.reduce((s, seg) => s + seg.revenue, 0),
      penetrationPct: 5.0, segments,
    }
  }

  // SaaS
  const saasProducts = ['Core Platform', 'Add-on Modules', 'Enterprise Tier', 'Marketplace']
  const saasPens = [3.1, 1.8, 2.5, 1.2]
  const saasGrowth = [16.8, 24.5, 12.3, 31.8]
  const segments = saasProducts.map((name, i) => {
    const tam = Math.round(40000000000 * incomeMultiplier * regionMultiplier * m / 1000000) * 1000000
    const sam = Math.round(tam * 0.2 / 1000000) * 1000000
    const penetration = saasPens[i % saasPens.length]
    const revenue = Math.round(sam * (penetration / 100) / 1000000) * 1000000
    return { name: `${name}||all||${ctx.audienceIncome || 'all'}||${ctx.audienceRegion || 'all'}`, tam, sam, penetration, revenue, growth: saasGrowth[i % saasGrowth.length] }
  })
  return {
    tam: segments.reduce((s, seg) => s + seg.tam, 0),
    sam: segments.reduce((s, seg) => s + seg.sam, 0),
    som: segments.reduce((s, seg) => s + seg.revenue, 0),
    penetrationPct: 2.3, segments,
  }
}

// Audience demographics — derived from target audience config
function getAudienceDemographics(ctx: MarketContext): AudienceDemographics {
  const parsedBands = parseAgeBands(ctx.audienceAge)
  const isWomenFocused = ctx.audienceGender === 'Female' || ctx.isFashion
  const isPremium = ctx.audienceIncome === 'premium' || ctx.audienceIncome === 'luxury'

  // Use parsed bands, fill remaining with minor percentages
  const usedLabels = parsedBands.map(b => b.label)
  const allAgeBands = [
    ...parsedBands.map((b, i) => ({ label: b.label, pct: Math.round(b.weight * (isWomenFocused ? 70 : 60)), trend: i === 0 ? 'up' as const : 'stable' as const })),
    ...(usedLabels.length <= 2 ? [
      { label: '41–50', pct: 15, trend: 'down' as const },
      { label: '50+', pct: 8, trend: 'down' as const },
    ] : []),
  ].filter(b => b.pct > 5).slice(0, 5)

  const incomeTiers = [
    { label: 'Mass (<$40K)', pct: isPremium ? 8 : 18, trend: 'down' as const },
    { label: 'Aspirational ($40–70K)', pct: isPremium ? 22 : 32, trend: 'stable' as const },
    { label: 'Premium ($70–120K)', pct: isPremium ? 44 : 30, trend: 'up' as const },
    { label: 'Luxury ($120K+)', pct: isPremium ? 26 : 20, trend: 'up' as const },
  ]

  const psychographicClusters = isWomenFocused
    ? [
        { label: 'Quality-First', pct: 30, trend: 'up' as const },
        { label: 'Trend-Seeker', pct: 26, trend: 'up' as const },
        { label: 'Brand-Loyal', pct: 20, trend: 'stable' as const },
        { label: 'Value-Conscious', pct: 14, trend: 'down' as const },
        { label: 'Early Adopter', pct: 10, trend: 'down' as const },
      ]
    : [
        { label: 'Trend-Seeker', pct: 24, trend: 'up' as const },
        { label: 'Quality-First', pct: 24, trend: 'up' as const },
        { label: 'Value-Conscious', pct: 22, trend: 'stable' as const },
        { label: 'Brand-Loyal', pct: 18, trend: 'stable' as const },
        { label: 'Early Adopter', pct: 12, trend: 'down' as const },
      ]

  return {
    ageBands: allAgeBands,
    incomeTiers,
    psychographicClusters,
    genderSplit: isWomenFocused
      ? (ctx.audienceGender === 'Female' ? { male: 0, female: 97, other: 3 } : { male: 10, female: 87, other: 3 })
      : { male: 48, female: 48, other: 4 },
  }
}

function getCustomerGrowth(_ctx: MarketContext): CustomerGrowth {
  const labels = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  // Use smaller base numbers for niche categories, larger for broad
  const isNiche = _ctx.focus.includes('Saree') || _ctx.focus.includes('Leheng') || _ctx.focus.includes('Sherwani')
  if (isNiche) {
    const actual =   [560, 620, 700, 810, 920, 1050, 1180, 1320, 1450, 1580, 1720, 1880]
    const forecast = [560, 620, 700, 810, 920, 1050, 1180, 1320, 1500, 1700, 1920, 2150]
    const required = [560, 680, 800, 950, 1100, 1280, 1450, 1620, 1800, 1980, 2180, 2400]
    return { actual, forecast, required, labels,
      confidenceLower: forecast.map(v => Math.round(v * 0.85)),
      confidenceUpper: forecast.map(v => Math.round(v * 1.15)),
    }
  }
  if (_ctx.isFintech) {
    const actual =   [1200, 1450, 1620, 1980, 2340, 2810, 3250, 3800, 4100, 4450, 4900, 5200]
    const forecast = [1200, 1450, 1620, 1980, 2340, 2810, 3250, 3800, 4450, 5100, 5800, 6500]
    const required = [1200, 1500, 1850, 2200, 2600, 3000, 3400, 3900, 4400, 5000, 5700, 6500]
    return { actual, forecast, required, labels,
      confidenceLower: forecast.map(v => Math.round(v * 0.85)),
      confidenceUpper: forecast.map(v => Math.round(v * 1.15)),
    }
  }
  // Fashion
  const actual =   [8400, 8900, 9200, 10100, 10800, 11800, 12500, 13400, 14000, 14800, 15500, 16200]
  const forecast = [8400, 8900, 9200, 10100, 10800, 11800, 12500, 13400, 14600, 15800, 17100, 18400]
  const required = [8400, 9200, 10000, 11000, 12000, 13100, 14200, 15300, 16400, 17500, 18600, 20000]
  return { actual, forecast, required, labels,
    confidenceLower: forecast.map(v => Math.round(v * 0.88)),
    confidenceUpper: forecast.map(v => Math.round(v * 1.12)),
  }
}

function getMarketDemandIndex(ctx: MarketContext): MarketDemandIndex {
  if (ctx.isFashion) {
    const hasWomen = ctx.focus.includes('Women') || ctx.focus.includes('Saree') || ctx.focus.includes('Leheng')
    const hasMen = ctx.focus.includes('Men')
    const items = [
      ...(hasWomen || (!hasWomen && !hasMen) ? [
        { name: `${ctx.focus}`, demand: 84, share: 26, trend: 'up' as const },
        { name: 'Wedding Collection', demand: 78, share: 18, trend: 'up' as const },
      ] : []),
      ...(hasMen ? [
        { name: `${ctx.focus}`, demand: 72, share: 14, trend: 'up' as const },
      ] : []),
      { name: 'Sustainable Materials', demand: 76, share: 22, trend: 'up' as const },
      { name: 'Festive Wear', demand: 82, share: 31, trend: 'up' as const },
      { name: 'Contemporary Fusion', demand: 65, share: 12, trend: 'stable' as const },
    ]
    return { current: 76, previous: 68, categoryAvg: 62, shareCaptured: 22.5, byCategory: items.slice(0, 4) }
  }
  if (ctx.isFintech) {
    return { current: 68, previous: 61, categoryAvg: 55, shareCaptured: 18.4,
      byCategory: [
        { name: 'Budgeting Apps', demand: 74, share: 22, trend: 'up' as const },
        { name: 'Micro-Investing', demand: 82, share: 14, trend: 'up' as const },
        { name: 'Fintech Education', demand: 61, share: 26, trend: 'stable' as const },
        { name: 'BNPL Services', demand: 44, share: 8, trend: 'down' as const },
      ] }
  }
  return { current: 82, previous: 76, categoryAvg: 68, shareCaptured: 14.2,
    byCategory: [
      { name: 'CRM Platform', demand: 88, share: 18, trend: 'up' as const },
      { name: 'Analytics & BI', demand: 76, share: 12, trend: 'up' as const },
      { name: 'DevOps Tools', demand: 64, share: 9, trend: 'stable' as const },
      { name: 'Marketing Automation', demand: 92, share: 21, trend: 'up' as const },
    ] }
}

function getWhitespaceMatrix(ctx: MarketContext): WhitespaceMatrix {
  if (ctx.isFashion) {
    const focus = ctx.focus
    return { quadrants: {
      priorityInvest: [
        { name: `Premium ${focus}`, revenuePotential: 4200000, trend: 'up' as const },
        { name: `${focus} Rental Service`, revenuePotential: 2800000, trend: 'up' as const },
      ],
      defend: [
        { name: `Core ${focus} Line`, revenuePotential: 8200000, trend: 'up' as const },
        { name: `${focus} Accessories`, revenuePotential: 3500000, trend: 'stable' as const },
      ],
      monetize: [
        { name: `${focus} Styling Consultation`, revenuePotential: 1200000, trend: 'stable' as const },
      ],
      ignore: [
        { name: 'Mass Market Basics', revenuePotential: 0, trend: 'stable' as const },
      ],
    }}
  }
  if (ctx.isFintech) {
    return { quadrants: {
      priorityInvest: [
        { name: 'AI Budget Coaching', revenuePotential: 3400000, trend: 'up' as const },
        { name: 'Teen Financial Literacy', revenuePotential: 2100000, trend: 'up' as const },
      ],
      defend: [
        { name: 'Round-Up Savings', revenuePotential: 4800000, trend: 'stable' as const },
        { name: 'Subscription Tracking', revenuePotential: 1800000, trend: 'down' as const },
      ],
      monetize: [
        { name: 'Premium Insights Tier', revenuePotential: 1200000, trend: 'up' as const },
      ],
      ignore: [
        { name: 'Credit Score Monitoring', revenuePotential: 600000, trend: 'stable' as const },
      ],
    }}
  }
  return { quadrants: {
    priorityInvest: [
      { name: 'AI-Powered Automation', revenuePotential: 5600000, trend: 'up' as const },
      { name: 'Vertical-Specific Solution', revenuePotential: 3800000, trend: 'up' as const },
    ],
    defend: [
      { name: 'Core Platform', revenuePotential: 12000000, trend: 'up' as const },
      { name: 'Enterprise Tier', revenuePotential: 4500000, trend: 'stable' as const },
    ],
    monetize: [
      { name: 'Usage-Based Pricing', revenuePotential: 1800000, trend: 'stable' as const },
    ],
    ignore: [
      { name: 'On-Premise Deployment', revenuePotential: 0, trend: 'stable' as const },
    ],
  }}
}

function getCompetitivePosition(ctx: MarketContext): CompetitivePosition {
  if (ctx.isFashion) {
    const hasWomen = ctx.focus.includes('Women') || ctx.focus.includes('Saree') || ctx.focus.includes('Leheng') || ctx.focus.includes('Female')
    const competitors = hasWomen
      ? [
          { name: 'Pernia\'s Pop-Up', sov: 22.4, positioning: 'Designer ethnic wear marketplace', priceIndex: 120, sovTrend: 'stable' as const, alert: undefined },
          { name: 'Meesho', sov: 18.2, positioning: 'Budget ethnic & fusion wear', priceIndex: 45, sovTrend: 'up' as const, alert: 'Expanding premium segment' },
          { name: 'Taneira (Tata)', sov: 14.8, positioning: 'Premium handloom & ethnic', priceIndex: 110, sovTrend: 'stable' as const },
          { name: 'Biba', sov: 12.1, positioning: 'Contemporary ethnic wear', priceIndex: 80, sovTrend: 'up' as const },
        ]
      : [
          { name: 'Myntra', sov: 32.0, positioning: 'Fashion marketplace', priceIndex: 100, sovTrend: 'down' as const },
          { name: 'Ajio', sov: 18.5, positioning: 'Trend-focused fashion', priceIndex: 85, sovTrend: 'stable' as const },
          { name: 'Westside', sov: 14.2, positioning: 'Value fashion retail', priceIndex: 75, sovTrend: 'stable' as const },
        ]
    return { shareOfVoice: 18.5, shareOfVoiceTrend: 'up', competitors }
  }
  if (ctx.isFintech) {
    return { shareOfVoice: 14.2, shareOfVoiceTrend: 'up',
      competitors: [
        { name: 'Mint', sov: 28.2, positioning: 'All-in-one budgeting', priceIndex: 0, sovTrend: 'down' as const },
        { name: 'YNAB', sov: 22.4, positioning: 'Zero-based budgeting', priceIndex: 85, sovTrend: 'stable' as const },
        { name: 'Copilot', sov: 18.1, positioning: 'Premium UX finance', priceIndex: 120, sovTrend: 'up' as const, alert: 'Launched Gen Z campaign 2 weeks ago' },
      ] }
  }
  return { shareOfVoice: 12.8, shareOfVoiceTrend: 'up',
    competitors: [
      { name: 'Salesforce', sov: 34.2, positioning: 'Enterprise CRM leader', priceIndex: 150, sovTrend: 'stable' as const },
      { name: 'HubSpot', sov: 28.4, positioning: 'Mid-market CRM & marketing', priceIndex: 100, sovTrend: 'up' as const },
      { name: 'Zoho', sov: 15.1, positioning: 'Budget SaaS suite', priceIndex: 40, sovTrend: 'up' as const, alert: 'New AI features launched' },
    ] }
}

function getForecast(ctx: MarketContext): Forecast {
  const labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']
  if (ctx.isFashion) {
    const isNiche = ctx.focus.includes('Saree') || ctx.focus.includes('Leheng') || ctx.focus.includes('Sherwani')
    if (isNiche) {
      return {
        baseRevenue:   [140, 160, 180, 200, 220, 240, 260, 290, 320, 350, 380, 420].map(v => v * 1000),
        bullRevenue:   [140, 170, 200, 240, 280, 320, 360, 400, 440, 480, 520, 580].map(v => v * 1000),
        bearRevenue:   [140, 150, 155, 165, 170, 180, 185, 195, 200, 210, 220, 230].map(v => v * 1000),
        baseCustomers:   [1320, 1450, 1580, 1720, 1880, 2050, 2200, 2400, 2600, 2800, 3050, 3300],
        bullCustomers:   [1320, 1500, 1720, 2000, 2300, 2600, 2900, 3200, 3500, 3800, 4200, 4600],
        bearCustomers:   [1320, 1400, 1450, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900],
        labels, triggerConditions: [
          { scenario: 'Bull', condition: `${ctx.focus} demand index > 75 for 3 weeks`, met: true },
          { scenario: 'Bull', condition: 'Festive season conversion uplift >20%', met: false },
          { scenario: 'Bear', condition: 'New competitor enters premium segment', met: false },
          { scenario: 'Bear', condition: 'Raw material cost increase >15%', met: false },
        ],
      }
    }
    return {
      baseRevenue:   [2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800, 4100, 4300, 4600, 4900].map(v => v * 1000),
      bullRevenue:   [2400, 2800, 3200, 3800, 4400, 5000, 5600, 6200, 6800, 7400, 8000, 8800].map(v => v * 1000),
      bearRevenue:   [2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500].map(v => v * 1000),
      baseCustomers:   [13400, 14000, 14800, 15500, 16200, 17000, 17800, 18600, 19500, 20400, 21400, 22400],
      bullCustomers:   [13400, 14500, 15800, 17400, 19200, 21000, 22800, 24800, 26800, 29000, 31400, 34000],
      bearCustomers:   [13400, 13800, 14100, 14500, 14800, 15100, 15400, 15700, 16000, 16300, 16600, 17000],
      labels, triggerConditions: [
        { scenario: 'Bull', condition: 'Market Demand Index > 75 for 3 consecutive weeks', met: true },
        { scenario: 'Bull', condition: `${ctx.focus} segment >$80K MRR`, met: false },
        { scenario: 'Bear', condition: 'Competitor campaign gains >5% SoV', met: false },
        { scenario: 'Bear', condition: 'Demand Index drops >15% in 2 weeks', met: false },
      ],
    }
  }
  if (ctx.isFintech) {
    return {
      baseRevenue:   [320, 340, 370, 410, 440, 480, 510, 540, 580, 620, 670, 720].map(v => v * 1000),
      bullRevenue:   [320, 360, 410, 480, 540, 610, 680, 740, 810, 880, 960, 1050].map(v => v * 1000),
      bearRevenue:   [320, 330, 340, 360, 370, 380, 390, 410, 420, 430, 450, 470].map(v => v * 1000),
      baseCustomers:   [3800, 4100, 4450, 4900, 5200, 5600, 6000, 6400, 6900, 7400, 8000, 8600],
      bullCustomers:   [3800, 4200, 4800, 5600, 6400, 7200, 8000, 8800, 9600, 10500, 11400, 12500],
      bearCustomers:   [3800, 4000, 4100, 4300, 4400, 4500, 4600, 4800, 4900, 5000, 5100, 5300],
      labels, triggerConditions: [
        { scenario: 'Bull', condition: 'Market Demand Index > 70 for 3 consecutive weeks', met: true },
        { scenario: 'Bull', condition: 'Competitive SoV crosses 20%', met: false },
        { scenario: 'Bear', condition: 'Competitor enters core segment', met: false },
        { scenario: 'Bear', condition: 'Demand Index drops >15% in 2 weeks', met: false },
      ],
    }
  }
  // SaaS
  return {
    baseRevenue:   [560, 610, 670, 740, 810, 890, 980, 1080, 1180, 1300, 1420, 1560].map(v => v * 1000),
    bullRevenue:   [560, 640, 740, 860, 1000, 1150, 1300, 1480, 1650, 1840, 2050, 2280].map(v => v * 1000),
    bearRevenue:   [560, 590, 620, 650, 680, 710, 740, 770, 800, 830, 860, 890].map(v => v * 1000),
    baseCustomers:   [4200, 4600, 5100, 5600, 6200, 6800, 7500, 8200, 9000, 9900, 10800, 11800],
    bullCustomers:   [4200, 4800, 5600, 6600, 7800, 9000, 10200, 11500, 12800, 14200, 15800, 17600],
    bearCustomers:   [4200, 4400, 4600, 4800, 5000, 5200, 5400, 5600, 5800, 6000, 6200, 6400],
    labels, triggerConditions: [
      { scenario: 'Bull', condition: 'Enterprise deal pipeline >$2M', met: false },
      { scenario: 'Bull', condition: 'Market Demand Index > 78 for 3 weeks', met: true },
      { scenario: 'Bear', condition: 'Churn rate exceeds 5%', met: false },
      { scenario: 'Bear', condition: 'New competitor with VC funding enters market', met: false },
    ],
  }
}

// ─── Route ──────────────────────────────────────────────────────────────────────

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const ventureSlug = searchParams.get('venture') ?? 'novizio'
  const countriesParam = searchParams.get('countries') ?? ''
  const countries = countriesParam ? countriesParam.split(',').filter(Boolean) : ['US']
  const includeAll = searchParams.get('include') ?? 'all'

  try {
    const venture = await getVentureBySlug(ventureSlug)
    if (!venture) {
      return Response.json({ error: 'Venture not found' }, { status: 404 })
    }

    const usedCountries = countries.length > 0 ? countries : (venture.operatingCountries ?? ['US'])
    const ctx = buildContext(venture)

    const data: Partial<MarketIntelligenceData> = {}

    if (includeAll === 'all' || includeAll === 'tam-sam-som') data.tamSamSom = getTamsamSom(ctx, usedCountries)
    if (includeAll === 'all' || includeAll === 'audience') data.audienceDemographics = getAudienceDemographics(ctx)
    if (includeAll === 'all' || includeAll === 'growth') data.customerGrowth = getCustomerGrowth(ctx)
    if (includeAll === 'all' || includeAll === 'demand') data.marketDemandIndex = getMarketDemandIndex(ctx)
    if (includeAll === 'all' || includeAll === 'whitespace') data.whitespaceMatrix = getWhitespaceMatrix(ctx)
    if (includeAll === 'all' || includeAll === 'competitive') data.competitivePosition = getCompetitivePosition(ctx)
    if (includeAll === 'all' || includeAll === 'forecast') data.forecast = getForecast(ctx)

    return Response.json({
      venture: ventureSlug,
      countries: usedCountries,
      snapshotDate: new Date().toISOString().split('T')[0],
      targetAudience: venture.targetAudience ?? null,
      marketSubcategories: venture.marketSubcategories ?? [],
      marketFocus: ctx.focus,
      data,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
