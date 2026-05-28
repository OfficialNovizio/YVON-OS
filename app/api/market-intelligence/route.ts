import { getVentureBySlug, getAnalyticsHistory, getSocialHistory, insertAnalyticsSnapshot } from '@/lib/db'
import { getAnalyticsReport } from '@/lib/google-analytics'
import type { VentureConfig, BrandTier } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface SegmentRow {
  name: string; tam: number; sam: number; penetration: number; revenue: number; growth: number
}

export interface GeoBreakdown {
  byState: SegmentRow[]
  byCapitals: SegmentRow[]
  byPopularCities: SegmentRow[]
  byAllCities: SegmentRow[]
}

export interface MarketIntelligenceData {
  tamSamSom: TamsamSom
  audienceDemographics: AudienceDemographics
  customerGrowth: CustomerGrowth
  marketDemandIndex: MarketDemandIndex
  whitespaceMatrix: WhitespaceMatrix
  competitivePosition: CompetitivePosition
  forecast: Forecast
  industryGrowth: IndustryGrowth
  signalFeed: SignalFeed
}

interface TamsamSom {
  tam: number; sam: number; som: number; penetrationPct: number;
  segments: SegmentRow[]     // kept for compat — same as byProduct
  byProduct: SegmentRow[]    // one row per venture subcategory
  byAgeGroup: SegmentRow[]   // 5-year age bands
  byGeography: GeoBreakdown  // state / capitals / popular / all-cities
}

export interface PersonaCard {
  name: string
  subtitle: string
  ageBand: string
  incomeTier: string
  topPsychographic: string
  audienceShare: number
  description: string
  trend: 'up' | 'down' | 'stable'
}

interface AudienceDemographics {
  ageBands: { label: string; pct: number; trend: 'up' | 'down' | 'stable' }[]
  incomeTiers: { label: string; pct: number; trend: 'up' | 'down' | 'stable' }[]
  psychographicClusters: { label: string; pct: number; trend: 'up' | 'down' | 'stable' }[]
  genderSplit: { male: number; female: number; other: number }
  crossTab: { ageBand: string; bandShare: number; incomes: { tier: string; pct: number }[] }[]
  personas: PersonaCard[]
}

interface CustomerGrowth {
  actual: number[]; forecast: number[]; required: number[];
  labels: string[]; confidenceLower: number[]; confidenceUpper: number[];
  snapshotTimestamp: string;
  freshness: 'live' | 'stale' | 'estimated' | 'none';
  dataSource: 'ga4' | 'social' | 'estimated';
  kpis: { current: number; momGrowthPct: number; vsTargetPct: number };
}

export interface IndustrySeries {
  name: string
  color: string
  cagr: number
  values: number[]
}

export interface IndustryGrowth {
  years: string[]
  byCategory:   IndustrySeries[]
  byIncomeTier: IndustrySeries[]
  byAgeGroup:   IndustrySeries[]
  byChannel:    IndustrySeries[]   // values are % share (0–100), stack sums ~100
  byGeography:  IndustrySeries[]
  unit: string                     // '₹Bn' or '$Bn'
  dataNote: string
  yourSegmentHighlight: string     // name of series matching the venture's focus
  yourSegmentCAGR: number
}

export interface MarketSignal {
  id: string
  label: string
  status: 'green' | 'amber' | 'red'
  value: string
  detail: string
}

export interface SignalFeed {
  signals: MarketSignal[]
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
  focus: string
  segment: string
  audienceAge: string
  audienceGender: string
  audienceIncome: string
  audienceRegion: string
  allProductLabels: string[]
  isFashion: boolean
  isFintech: boolean
  isSaaS: boolean
  brandTier: BrandTier | null
  avgPricePoint: number      // in INR (0 if not set)
  isPremiumTier: boolean     // premium | luxury | ultra-luxury
  isLuxuryTier: boolean      // luxury | ultra-luxury
  isBudgetTier: boolean      // budget | fast-fashion
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

  // Resolve ALL subcategory labels (not capped at 3) for product breakdown
  const allProductLabels = cats
    .map(c => LABELS[c] ?? c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .filter((v, i, arr) => arr.indexOf(v) === i) // dedupe

  const brandTier = venture.brandTier ?? null
  const premiumTiers: BrandTier[] = ['premium', 'luxury', 'ultra-luxury']
  const luxuryTiers: BrandTier[]  = ['luxury', 'ultra-luxury']
  const budgetTiers: BrandTier[]  = ['budget', 'fast-fashion']

  return {
    focus,
    segment: isFintech ? 'fintech' : isSaaS ? 'saas' : 'fashion',
    audienceAge: ageLabel,
    audienceGender: genderLabel,
    audienceIncome: incomeLabel,
    audienceRegion: ta.region ?? 'all',
    allProductLabels,
    isFashion: !isFintech && !isSaaS,
    isFintech,
    isSaaS,
    brandTier,
    avgPricePoint: venture.avgPricePoint ?? 0,
    isPremiumTier: brandTier != null && premiumTiers.includes(brandTier),
    isLuxuryTier:  brandTier != null && luxuryTiers.includes(brandTier),
    isBudgetTier:  brandTier != null && budgetTiers.includes(brandTier),
  }
}

// ─── Parameter-driven generators ──────────────────────────────────────────────

// Fixed 5-year age bucket table: 15-20, 21-25, 26-30, 31-35, 36-40, 41-45, 46-50, 51-55, 56-60
const AGE_BUCKETS: { lo: number; hi: number }[] = [
  { lo: 15, hi: 20 }, { lo: 21, hi: 25 }, { lo: 26, hi: 30 },
  { lo: 31, hi: 35 }, { lo: 36, hi: 40 }, { lo: 41, hi: 45 },
  { lo: 46, hi: 50 }, { lo: 51, hi: 55 }, { lo: 56, hi: 60 },
]

// Parse age range like "25-40" into 5-year buckets that overlap the range
function parseAgeBands(range: string): { label: string; weight: number }[] {
  const match = range.match(/(\d+)\s*[-–]\s*(\d+)/)
  const rangeStart = match ? parseInt(match[1]) : 25
  const rangeEnd   = match ? parseInt(match[2]) : 40

  const inRange = AGE_BUCKETS.filter(b => b.lo <= rangeEnd && b.hi >= rangeStart)
  if (inRange.length === 0) return [{ label: range, weight: 1 }]

  const center = rangeStart + (rangeEnd - rangeStart) * 0.35
  const rawWeights = inRange.map(b => {
    const mid  = (b.lo + b.hi) / 2
    const dist = Math.abs(mid - center)
    return Math.max(0.05, 1 - dist / Math.max(1, rangeEnd - rangeStart))
  })
  const total = rawWeights.reduce((s, w) => s + w, 0)
  return inRange.map((b, i) => ({
    label:  `${b.lo}–${b.hi}`,
    weight: rawWeights[i] / total,
  }))
}

// ─── Geographic city/state data tables ────────────────────────────────────────
// Each entry: tamWeight (fraction of country TAM), penetration %, YoY growth %, samRatio

interface GeoEntry {
  city: string
  state: string
  isCapital: boolean       // state/province capital
  isPopular: boolean       // top commercial city (top ~15)
  tamWeight: number
  penRate: number
  growth: number
  samRatio: number
}

const GEO_IN: GeoEntry[] = [
  { city: 'Mumbai',       state: 'Maharashtra',    isCapital: true,  isPopular: true,  tamWeight: 0.120, penRate: 6.8, growth: 15.2, samRatio: 0.32 },
  { city: 'Delhi NCR',    state: 'Delhi',          isCapital: true,  isPopular: true,  tamWeight: 0.110, penRate: 7.2, growth: 16.4, samRatio: 0.32 },
  { city: 'Bangalore',    state: 'Karnataka',      isCapital: true,  isPopular: true,  tamWeight: 0.090, penRate: 8.1, growth: 22.3, samRatio: 0.35 },
  { city: 'Hyderabad',    state: 'Telangana',      isCapital: true,  isPopular: true,  tamWeight: 0.080, penRate: 7.5, growth: 19.1, samRatio: 0.33 },
  { city: 'Chennai',      state: 'Tamil Nadu',     isCapital: true,  isPopular: true,  tamWeight: 0.070, penRate: 6.4, growth: 14.2, samRatio: 0.31 },
  { city: 'Pune',         state: 'Maharashtra',    isCapital: false, isPopular: true,  tamWeight: 0.060, penRate: 8.8, growth: 20.5, samRatio: 0.36 },
  { city: 'Kolkata',      state: 'West Bengal',    isCapital: true,  isPopular: true,  tamWeight: 0.050, penRate: 5.1, growth: 11.3, samRatio: 0.28 },
  { city: 'Ahmedabad',    state: 'Gujarat',        isCapital: false, isPopular: true,  tamWeight: 0.050, penRate: 5.8, growth: 15.8, samRatio: 0.30 },
  { city: 'Jaipur',       state: 'Rajasthan',      isCapital: true,  isPopular: true,  tamWeight: 0.040, penRate: 5.5, growth: 17.9, samRatio: 0.29 },
  { city: 'Surat',        state: 'Gujarat',        isCapital: false, isPopular: true,  tamWeight: 0.030, penRate: 4.8, growth: 14.6, samRatio: 0.28 },
  { city: 'Chandigarh',   state: 'Punjab/Haryana', isCapital: true,  isPopular: true,  tamWeight: 0.025, penRate: 9.2, growth: 21.4, samRatio: 0.38 },
  { city: 'Ludhiana',     state: 'Punjab',         isCapital: false, isPopular: true,  tamWeight: 0.022, penRate: 7.4, growth: 17.1, samRatio: 0.32 },
  { city: 'Lucknow',      state: 'Uttar Pradesh',  isCapital: true,  isPopular: true,  tamWeight: 0.030, penRate: 4.5, growth: 13.8, samRatio: 0.27 },
  { city: 'Indore',       state: 'Madhya Pradesh', isCapital: false, isPopular: true,  tamWeight: 0.022, penRate: 5.2, growth: 15.6, samRatio: 0.29 },
  { city: 'Kochi',        state: 'Kerala',         isCapital: false, isPopular: true,  tamWeight: 0.018, penRate: 6.2, growth: 18.3, samRatio: 0.31 },
  { city: 'Nagpur',       state: 'Maharashtra',    isCapital: false, isPopular: false, tamWeight: 0.018, penRate: 5.0, growth: 14.2, samRatio: 0.28 },
  { city: 'Bhopal',       state: 'Madhya Pradesh', isCapital: true,  isPopular: false, tamWeight: 0.016, penRate: 4.8, growth: 13.9, samRatio: 0.27 },
  { city: 'Thiruvananthapuram', state: 'Kerala',   isCapital: true,  isPopular: false, tamWeight: 0.014, penRate: 5.8, growth: 16.2, samRatio: 0.30 },
  { city: 'Coimbatore',   state: 'Tamil Nadu',     isCapital: false, isPopular: false, tamWeight: 0.016, penRate: 5.4, growth: 16.2, samRatio: 0.30 },
  { city: 'Vadodara',     state: 'Gujarat',        isCapital: false, isPopular: false, tamWeight: 0.015, penRate: 4.6, growth: 14.8, samRatio: 0.27 },
  { city: 'Patna',        state: 'Bihar',          isCapital: true,  isPopular: false, tamWeight: 0.014, penRate: 3.8, growth: 11.5, samRatio: 0.24 },
  { city: 'Ranchi',       state: 'Jharkhand',      isCapital: true,  isPopular: false, tamWeight: 0.010, penRate: 3.5, growth: 12.1, samRatio: 0.23 },
  { city: 'Dehradun',     state: 'Uttarakhand',    isCapital: true,  isPopular: false, tamWeight: 0.010, penRate: 5.1, growth: 17.4, samRatio: 0.29 },
  { city: 'Raipur',       state: 'Chhattisgarh',   isCapital: true,  isPopular: false, tamWeight: 0.009, penRate: 3.6, growth: 12.8, samRatio: 0.24 },
  { city: 'Amritsar',     state: 'Punjab',         isCapital: false, isPopular: false, tamWeight: 0.012, penRate: 6.5, growth: 15.8, samRatio: 0.31 },
  { city: 'Guwahati',     state: 'Assam',          isCapital: false, isPopular: false, tamWeight: 0.009, penRate: 3.4, growth: 13.6, samRatio: 0.24 },
  { city: 'Bhubaneswar',  state: 'Odisha',         isCapital: true,  isPopular: false, tamWeight: 0.010, penRate: 3.9, growth: 14.1, samRatio: 0.25 },
  { city: 'Visakhapatnam',state: 'Andhra Pradesh', isCapital: false, isPopular: false, tamWeight: 0.013, penRate: 4.8, growth: 15.3, samRatio: 0.28 },
]

const GEO_US: GeoEntry[] = [
  { city: 'New York City',   state: 'New York',     isCapital: false, isPopular: true,  tamWeight: 0.130, penRate: 8.2, growth: 12.4, samRatio: 0.38 },
  { city: 'Los Angeles',     state: 'California',   isCapital: false, isPopular: true,  tamWeight: 0.110, penRate: 7.8, growth: 14.1, samRatio: 0.36 },
  { city: 'Chicago',         state: 'Illinois',     isCapital: false, isPopular: true,  tamWeight: 0.072, penRate: 6.9, growth: 11.2, samRatio: 0.34 },
  { city: 'Houston',         state: 'Texas',        isCapital: false, isPopular: true,  tamWeight: 0.065, penRate: 6.4, growth: 13.8, samRatio: 0.32 },
  { city: 'Phoenix',         state: 'Arizona',      isCapital: true,  isPopular: true,  tamWeight: 0.048, penRate: 5.8, growth: 15.6, samRatio: 0.30 },
  { city: 'Philadelphia',    state: 'Pennsylvania', isCapital: false, isPopular: true,  tamWeight: 0.045, penRate: 6.1, growth: 10.8, samRatio: 0.32 },
  { city: 'San Antonio',     state: 'Texas',        isCapital: false, isPopular: true,  tamWeight: 0.038, penRate: 5.2, growth: 12.4, samRatio: 0.29 },
  { city: 'San Diego',       state: 'California',   isCapital: false, isPopular: true,  tamWeight: 0.040, penRate: 6.8, growth: 13.2, samRatio: 0.34 },
  { city: 'Dallas',          state: 'Texas',        isCapital: false, isPopular: true,  tamWeight: 0.058, penRate: 6.5, growth: 14.8, samRatio: 0.33 },
  { city: 'Austin',          state: 'Texas',        isCapital: true,  isPopular: true,  tamWeight: 0.042, penRate: 7.4, growth: 18.2, samRatio: 0.36 },
  { city: 'San Francisco',   state: 'California',   isCapital: false, isPopular: true,  tamWeight: 0.050, penRate: 8.8, growth: 11.4, samRatio: 0.40 },
  { city: 'Seattle',         state: 'Washington',   isCapital: false, isPopular: true,  tamWeight: 0.044, penRate: 8.1, growth: 14.6, samRatio: 0.38 },
  { city: 'Denver',          state: 'Colorado',     isCapital: true,  isPopular: true,  tamWeight: 0.038, penRate: 7.2, growth: 16.8, samRatio: 0.35 },
  { city: 'Nashville',       state: 'Tennessee',    isCapital: true,  isPopular: true,  tamWeight: 0.030, penRate: 6.4, growth: 17.4, samRatio: 0.33 },
  { city: 'Atlanta',         state: 'Georgia',      isCapital: true,  isPopular: true,  tamWeight: 0.048, penRate: 6.8, growth: 15.2, samRatio: 0.34 },
  { city: 'Miami',           state: 'Florida',      isCapital: false, isPopular: false, tamWeight: 0.050, penRate: 7.6, growth: 14.8, samRatio: 0.36 },
  { city: 'Boston',          state: 'Massachusetts',isCapital: true,  isPopular: false, tamWeight: 0.044, penRate: 8.4, growth: 11.6, samRatio: 0.38 },
  { city: 'Minneapolis',     state: 'Minnesota',    isCapital: false, isPopular: false, tamWeight: 0.028, penRate: 6.2, growth: 12.8, samRatio: 0.32 },
  { city: 'Sacramento',      state: 'California',   isCapital: true,  isPopular: false, tamWeight: 0.025, penRate: 5.8, growth: 13.4, samRatio: 0.30 },
  { city: 'Albany',          state: 'New York',     isCapital: true,  isPopular: false, tamWeight: 0.012, penRate: 5.2, growth: 10.2, samRatio: 0.28 },
  { city: 'Columbus',        state: 'Ohio',         isCapital: true,  isPopular: false, tamWeight: 0.028, penRate: 5.6, growth: 13.1, samRatio: 0.30 },
  { city: 'Charlotte',       state: 'North Carolina',isCapital: false,isPopular: false, tamWeight: 0.030, penRate: 6.1, growth: 15.8, samRatio: 0.32 },
]

const GEO_GB: GeoEntry[] = [
  { city: 'London',        state: 'England (SE)', isCapital: true,  isPopular: true,  tamWeight: 0.280, penRate: 9.4, growth: 11.2, samRatio: 0.42 },
  { city: 'Birmingham',    state: 'England (W Midlands)', isCapital: false, isPopular: true,  tamWeight: 0.088, penRate: 6.8, growth: 13.4, samRatio: 0.33 },
  { city: 'Manchester',    state: 'England (NW)',  isCapital: false, isPopular: true,  tamWeight: 0.082, penRate: 7.2, growth: 14.8, samRatio: 0.34 },
  { city: 'Leeds',         state: 'England (Yorks)', isCapital: false,isPopular: true,  tamWeight: 0.055, penRate: 6.4, growth: 12.6, samRatio: 0.31 },
  { city: 'Glasgow',       state: 'Scotland',     isCapital: false, isPopular: true,  tamWeight: 0.060, penRate: 6.1, growth: 12.2, samRatio: 0.30 },
  { city: 'Edinburgh',     state: 'Scotland',     isCapital: true,  isPopular: true,  tamWeight: 0.048, penRate: 7.8, growth: 13.6, samRatio: 0.36 },
  { city: 'Bristol',       state: 'England (SW)', isCapital: false, isPopular: true,  tamWeight: 0.042, penRate: 7.4, growth: 15.2, samRatio: 0.35 },
  { city: 'Cardiff',       state: 'Wales',        isCapital: true,  isPopular: true,  tamWeight: 0.034, penRate: 5.8, growth: 11.8, samRatio: 0.29 },
  { city: 'Liverpool',     state: 'England (NW)', isCapital: false, isPopular: false, tamWeight: 0.038, penRate: 6.2, growth: 12.4, samRatio: 0.30 },
  { city: 'Sheffield',     state: 'England (Yorks)', isCapital: false,isPopular: false, tamWeight: 0.034, penRate: 5.6, growth: 11.6, samRatio: 0.28 },
  { city: 'Belfast',       state: 'N. Ireland',   isCapital: true,  isPopular: false, tamWeight: 0.024, penRate: 5.4, growth: 10.8, samRatio: 0.27 },
  { city: 'Nottingham',    state: 'England (E Midlands)',isCapital: false,isPopular: false, tamWeight: 0.028, penRate: 5.8, growth: 12.8, samRatio: 0.29 },
  { city: 'Newcastle',     state: 'England (NE)', isCapital: false, isPopular: false, tamWeight: 0.026, penRate: 5.4, growth: 11.4, samRatio: 0.28 },
]

// Generic fallback for countries without a specific table
function getGeoFallback(countries: string[]): GeoEntry[] {
  const entries: GeoEntry[] = []
  const weights = [0.38, 0.26, 0.20, 0.10, 0.06]
  countries.slice(0, 5).forEach((country, i) => {
    entries.push({
      city: country, state: country, isCapital: true, isPopular: true,
      tamWeight: weights[i] ?? 0.08, penRate: 5.0 + i, growth: 14.0 - i, samRatio: 0.30,
    })
  })
  if (entries.length === 0) {
    return [
      { city: 'Urban Core',  state: 'Primary Market', isCapital: true,  isPopular: true,  tamWeight: 0.50, penRate: 6.8, growth: 14.2, samRatio: 0.34 },
      { city: 'Suburban',    state: 'Secondary Market',isCapital: false, isPopular: true,  tamWeight: 0.30, penRate: 4.8, growth: 12.1, samRatio: 0.28 },
      { city: 'Rural',       state: 'Tertiary Market', isCapital: false, isPopular: false, tamWeight: 0.20, penRate: 2.8, growth: 9.4,  samRatio: 0.20 },
    ]
  }
  return entries
}

// Build all 4 geo views from the city entries
function buildGeoBreakdown(entries: GeoEntry[], totalTam: number, totalSam: number): GeoBreakdown {
  function toRow(e: GeoEntry): SegmentRow {
    const tam = Math.round(totalTam * e.tamWeight / 1_000_000) * 1_000_000
    const sam = Math.round(tam * e.samRatio / 1_000_000) * 1_000_000
    const revenue = Math.round(sam * (e.penRate / 100) / 1_000_000) * 1_000_000
    return { name: e.city, tam, sam, penetration: e.penRate, revenue, growth: e.growth }
  }

  // By State — aggregate city entries per state
  const stateMap = new Map<string, { tam: number; sam: number; revArr: number[]; penArr: number[]; growthArr: number[] }>()
  for (const e of entries) {
    if (!stateMap.has(e.state)) stateMap.set(e.state, { tam: 0, sam: 0, revArr: [], penArr: [], growthArr: [] })
    const s = stateMap.get(e.state)!
    const tam = Math.round(totalTam * e.tamWeight / 1_000_000) * 1_000_000
    const sam = Math.round(tam * e.samRatio / 1_000_000) * 1_000_000
    s.tam += tam
    s.sam += sam
    s.revArr.push(Math.round(sam * (e.penRate / 100) / 1_000_000) * 1_000_000)
    s.penArr.push(e.penRate)
    s.growthArr.push(e.growth)
  }
  const byState: SegmentRow[] = Array.from(stateMap.entries())
    .map(([name, v]) => ({
      name,
      tam: v.tam,
      sam: v.sam,
      revenue: v.revArr.reduce((a, b) => a + b, 0),
      penetration: v.penArr.reduce((a, b) => a + b, 0) / v.penArr.length,
      growth: v.growthArr.reduce((a, b) => a + b, 0) / v.growthArr.length,
    }))
    .sort((a, b) => b.tam - a.tam)

  const byCapitals      = entries.filter(e => e.isCapital).sort((a, b) => b.tamWeight - a.tamWeight).map(toRow)
  const byPopularCities = entries.filter(e => e.isPopular).sort((a, b) => b.tamWeight - a.tamWeight).map(toRow)
  const byAllCities     = [...entries].sort((a, b) => b.tamWeight - a.tamWeight).map(toRow)

  return { byState, byCapitals, byPopularCities, byAllCities }
}

// Select the right city table based on primary country
function getGeoBreakdownFull(countries: string[], totalTam: number, totalSam: number): GeoBreakdown {
  const primary = (countries[0] ?? 'US').toUpperCase()
  const entries = primary === 'IN' ? GEO_IN
    : primary === 'US' ? GEO_US
    : primary === 'GB' ? GEO_GB
    : getGeoFallback(countries)
  return buildGeoBreakdown(entries, totalTam, totalSam)
}

// ─── Base TAM lookup ───────────────────────────────────────────────────────────

const BASE_TAM_FASHION: Record<string, number> = {
  'Sarees': 4_800_000_000, 'Lehengas': 3_400_000_000, 'Salwar Kameez': 2_800_000_000,
  'Churidar': 1_600_000_000, 'Anarkali': 1_900_000_000, 'Ethnic Gowns': 1_200_000_000,
  'Indo-Western': 1_500_000_000, 'Dresses': 3_600_000_000, 'Tops': 2_400_000_000,
  'Trousers': 1_800_000_000, "Women's Jeans": 2_200_000_000, "Men's Jeans": 4_800_000_000,
  "Women's Shorts": 900_000_000, "Women's Blazers": 1_100_000_000, 'Jumpsuits': 800_000_000,
  'Co-ord Sets': 1_300_000_000, "Women's Activewear": 2_600_000_000,
  'Sherwanis': 1_800_000_000, 'Kurtas': 2_200_000_000, 'Kurta Pajama': 1_400_000_000,
  'Bandhgala': 900_000_000, 'Shirts': 3_800_000_000, 'T-Shirts': 4_200_000_000,
  "Men's Trousers": 2_000_000_000, "Men's Blazers": 1_500_000_000, 'Suits': 1_200_000_000,
  "Women's Western Wear": 8_000_000_000, "Women's Ethnic Wear": 9_500_000_000,
  "Men's Western Wear": 7_000_000_000, "Men's Ethnic Wear": 4_500_000_000,
  "Women's": 12_000_000_000, "Men's": 8_000_000_000, "Kids'": 3_000_000_000,
  'Accessories': 2_500_000_000, 'Jewelry': 5_000_000_000, 'Bags': 3_200_000_000,
  'Footwear': 6_000_000_000, 'Sneakers': 4_500_000_000, 'Beauty': 4_000_000_000,
  'Skincare': 3_500_000_000, 'Activewear': 3_800_000_000,
}
const DEFAULT_FASHION_TAM = 3_000_000_000

const PEN_RATES    = [6.2, 4.8, 3.5, 7.1, 5.3, 2.9, 8.1, 3.8, 5.8, 4.1]
const GROWTH_RATES = [18.6, 14.2, 22.8, 12.4, 24.1, 9.8, 21.3, 16.5, 19.2, 13.7]

// Core TAM/SAM/SOM — generates three separate breakdowns: byProduct, byAgeGroup, byGeography
function getTamsamSom(ctx: MarketContext, countries: string[]): TamsamSom {
  const m = Math.max(1, countries.length)
  const incomeMultiplier = ctx.audienceIncome === 'luxury' ? 0.25 : ctx.audienceIncome === 'premium' ? 0.35 : ctx.audienceIncome === 'aspirational' ? 0.28 : 0.12
  const regionMultiplier = ctx.audienceRegion === 'urban' ? 0.6 : ctx.audienceRegion === 'suburban' ? 0.3 : ctx.audienceRegion === 'rural' ? 0.1 : 1.0

  const ageBands = parseAgeBands(ctx.audienceAge)

  // Helper: build age rows from a total TAM/SAM pair
  function buildAgeRows(totalTam: number, totalSam: number): SegmentRow[] {
    return ageBands.map((band, ai) => {
      const tam = Math.round(totalTam * band.weight / 1_000_000) * 1_000_000
      const sam = Math.round(totalSam * band.weight / 1_000_000) * 1_000_000
      const penetration = PEN_RATES[ai % PEN_RATES.length]
      return { name: band.label, tam, sam, penetration, revenue: Math.round(sam * (penetration / 100) / 1_000_000) * 1_000_000, growth: GROWTH_RATES[(ai + 2) % GROWTH_RATES.length] }
    })
  }

  // ── Fashion ─────────────────────────────────────────────────────────────────
  if (ctx.isFashion) {
    const productList = ctx.allProductLabels.length > 0
      ? ctx.allProductLabels
      : ["Women's Ethnic Wear", "Women's Western Wear"]

    const byProduct: SegmentRow[] = productList.map((product, pi) => {
      const baseTam = BASE_TAM_FASHION[product] ?? DEFAULT_FASHION_TAM
      const tam     = Math.round(baseTam * incomeMultiplier * regionMultiplier * m / 1_000_000) * 1_000_000
      const sam     = Math.round(tam * 0.30 / 1_000_000) * 1_000_000
      const penetration = PEN_RATES[pi % PEN_RATES.length]
      return { name: product, tam, sam, penetration, revenue: Math.round(sam * (penetration / 100) / 1_000_000) * 1_000_000, growth: GROWTH_RATES[pi % GROWTH_RATES.length] }
    })

    const totalTam = byProduct.reduce((s, r) => s + r.tam, 0)
    const totalSam = byProduct.reduce((s, r) => s + r.sam, 0)
    const totalSom = Math.round(totalSam * 0.1 / 1_000_000) * 1_000_000

    return {
      tam: totalTam, sam: totalSam, som: totalSom, penetrationPct: 5.0,
      segments: byProduct, byProduct,
      byAgeGroup: buildAgeRows(totalTam, totalSam),
      byGeography: getGeoBreakdownFull(countries, totalTam, totalSam),
    }
  }

  // ── Fintech ──────────────────────────────────────────────────────────────────
  if (ctx.isFintech) {
    const finProducts = ctx.allProductLabels.length > 0
      ? ctx.allProductLabels
      : ['Budgeting & Saving', 'Micro-Investing', 'Fintech Education', 'BNPL']
    const finPens   = [6.2, 4.8, 3.5, 7.1]
    const finGrowth = [14.3, 22.1, 8.7, 31.2]

    const byProduct: SegmentRow[] = finProducts.map((name, i) => {
      const tam = Math.round(12_000_000_000 * incomeMultiplier * regionMultiplier * m / 1_000_000) * 1_000_000
      const sam = Math.round(tam * 0.20 / 1_000_000) * 1_000_000
      const penetration = finPens[i % finPens.length]
      return { name, tam, sam, penetration, revenue: Math.round(sam * (penetration / 100) / 1_000_000) * 1_000_000, growth: finGrowth[i % finGrowth.length] }
    })
    const totalTam = byProduct.reduce((s, r) => s + r.tam, 0)
    const totalSam = byProduct.reduce((s, r) => s + r.sam, 0)

    return {
      tam: totalTam, sam: totalSam, som: byProduct.reduce((s, r) => s + r.revenue, 0), penetrationPct: 5.0,
      segments: byProduct, byProduct,
      byAgeGroup: buildAgeRows(totalTam, totalSam),
      byGeography: getGeoBreakdownFull(countries, totalTam, totalSam),
    }
  }

  // ── SaaS ─────────────────────────────────────────────────────────────────────
  const saasProducts = ctx.allProductLabels.length > 0
    ? ctx.allProductLabels
    : ['Core Platform', 'Add-on Modules', 'Enterprise Tier', 'Marketplace']
  const saasPens   = [3.1, 1.8, 2.5, 1.2]
  const saasGrowth = [16.8, 24.5, 12.3, 31.8]

  const byProduct: SegmentRow[] = saasProducts.map((name, i) => {
    const tam = Math.round(40_000_000_000 * incomeMultiplier * regionMultiplier * m / 1_000_000) * 1_000_000
    const sam = Math.round(tam * 0.20 / 1_000_000) * 1_000_000
    const penetration = saasPens[i % saasPens.length]
    return { name, tam, sam, penetration, revenue: Math.round(sam * (penetration / 100) / 1_000_000) * 1_000_000, growth: saasGrowth[i % saasGrowth.length] }
  })
  const totalTam = byProduct.reduce((s, r) => s + r.tam, 0)
  const totalSam = byProduct.reduce((s, r) => s + r.sam, 0)

  return {
    tam: totalTam, sam: totalSam, som: byProduct.reduce((s, r) => s + r.revenue, 0), penetrationPct: 2.3,
    segments: byProduct, byProduct,
    byAgeGroup: buildAgeRows(totalTam, totalSam),
    byGeography: getGeoBreakdownFull(countries, totalTam, totalSam),
  }
}

// Audience demographics — derived from target audience config
function getAudienceDemographics(ctx: MarketContext): AudienceDemographics {
  const parsedBands = parseAgeBands(ctx.audienceAge)
  const isWomenFocused = ctx.audienceGender === 'Female' || ctx.isFashion
  const isPremium = ctx.audienceIncome === 'premium' || ctx.audienceIncome === 'luxury'
  const isLuxury = ctx.audienceIncome === 'luxury'

  // 5-year bands, normalised to 100%
  const totalWeight = parsedBands.reduce((s, b) => s + b.weight, 0)
  const allAgeBands = parsedBands
    .map((b, i) => ({
      label: b.label,
      pct: Math.round((b.weight / totalWeight) * 100),
      trend: (i === 0 ? 'up' : i === parsedBands.length - 1 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
    }))
    .filter(b => b.pct >= 3)

  const isUrban = ctx.audienceRegion === 'urban'
  const isRural = ctx.audienceRegion === 'rural'
  // INR household income tiers, split weighted by tier × region
  const incomeTiers = [
    {
      label: 'Mass (<₹3L)',
      pct: isLuxury ? 3 : isPremium ? (isUrban ? 5 : 10) : isUrban ? 12 : 22,
      trend: 'down' as const,
    },
    {
      label: 'Aspirational (₹3–8L)',
      pct: isLuxury ? 10 : isPremium ? (isUrban ? 18 : 26) : isUrban ? 32 : 40,
      trend: 'stable' as const,
    },
    {
      label: 'Premium (₹8–20L)',
      pct: isLuxury ? 38 : isPremium ? (isUrban ? 48 : 42) : isUrban ? 34 : isRural ? 20 : 28,
      trend: 'up' as const,
    },
    {
      label: 'Luxury (₹20L+)',
      pct: isLuxury ? 49 : isPremium ? (isUrban ? 29 : 22) : isUrban ? 22 : 10,
      trend: 'up' as const,
    },
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

  // Cross-tab: income distribution within each age band
  // Younger cohorts skew Aspirational; mid-range skews Premium; 36+ skews Luxury on premium brands
  function bandIncomes(bandLabel: string): { tier: string; pct: number }[] {
    const match = bandLabel.match(/(\d+)/)
    const lo = match ? parseInt(match[1]) : 25
    let mass: number, asp: number, prem: number, lux: number
    if (isPremium || isLuxury) {
      if (lo <= 20)      { mass = 28; asp = 44; prem = 22; lux = 6 }
      else if (lo <= 25) { mass = 18; asp = 38; prem = 32; lux = 12 }
      else if (lo <= 30) { mass = 10; asp = 28; prem = 42; lux = 20 }
      else if (lo <= 35) { mass = 8;  asp = 20; prem = 44; lux = 28 }
      else if (lo <= 40) { mass = 7;  asp = 18; prem = 46; lux = 29 }
      else               { mass = 10; asp = 22; prem = 42; lux = 26 }
    } else {
      if (lo <= 20)      { mass = 45; asp = 35; prem = 16; lux = 4 }
      else if (lo <= 25) { mass = 38; asp = 38; prem = 18; lux = 6 }
      else if (lo <= 30) { mass = 30; asp = 36; prem = 24; lux = 10 }
      else if (lo <= 35) { mass = 25; asp = 35; prem = 28; lux = 12 }
      else if (lo <= 40) { mass = 22; asp = 34; prem = 30; lux = 14 }
      else               { mass = 25; asp = 36; prem = 28; lux = 11 }
    }
    return [
      { tier: 'Mass', pct: mass },
      { tier: 'Aspirational', pct: asp },
      { tier: 'Premium', pct: prem },
      { tier: 'Luxury', pct: lux },
    ]
  }

  const crossTab = allAgeBands.map(band => ({
    ageBand: band.label,
    bandShare: band.pct,
    incomes: bandIncomes(band.label),
  }))

  // Personas — 4 derived cohorts from dominant cross-tab segments
  const personas: PersonaCard[] = ctx.isFashion && isWomenFocused
    ? [
        { name: 'The Style Seeker', subtitle: 'Urban Millennial', ageBand: '26–30', incomeTier: 'Premium', topPsychographic: 'Trend-Seeker', audienceShare: 24, description: 'Shops 2× monthly, driven by influencer drops and festival capsules. High mobile conversion rate.', trend: 'up' },
        { name: 'The Occasion Dresser', subtitle: 'Working Professional', ageBand: '31–35', incomeTier: 'Premium', topPsychographic: 'Quality-First', audienceShare: 21, description: 'Purchases statement pieces for weddings and corporate events. Prioritizes fit and premium fabric.', trend: 'stable' },
        { name: 'The Classic Bride', subtitle: 'Pre-Wedding Buyer', ageBand: '21–25', incomeTier: 'Aspirational', topPsychographic: 'Brand-Loyal', audienceShare: 18, description: 'Planning an ethnic trousseau. High-value seasonal buyer who responds well to curated collections.', trend: 'up' },
        { name: 'The Luxury Loyalist', subtitle: 'Affluent Shopper', ageBand: '36–40', incomeTier: 'Luxury', topPsychographic: 'Quality-First', audienceShare: 14, description: 'Designer-forward, event-driven purchase cycle. Low price sensitivity and high lifetime value.', trend: 'stable' },
      ]
    : ctx.isFashion
    ? [
        { name: 'The Urban Trendsetter', subtitle: 'Style-Conscious Male', ageBand: '26–30', incomeTier: 'Premium', topPsychographic: 'Trend-Seeker', audienceShare: 26, description: 'Fashion-forward buyer who follows global trends and shops online for statement pieces.', trend: 'up' },
        { name: 'The Corporate Professional', subtitle: 'Office-First Buyer', ageBand: '31–35', incomeTier: 'Premium', topPsychographic: 'Quality-First', audienceShare: 22, description: 'Invests in quality formal and business-casual wear. Brand loyalty is high once trust is earned.', trend: 'stable' },
        { name: 'The Festival-Goer', subtitle: 'Occasion Buyer', ageBand: '21–25', incomeTier: 'Aspirational', topPsychographic: 'Value-Conscious', audienceShare: 19, description: 'Budget-aware but appearance-conscious. Buys for events, responds strongly to sale windows.', trend: 'up' },
        { name: 'The Premium Traditionalist', subtitle: 'Ethnic Wear Enthusiast', ageBand: '36–40', incomeTier: 'Luxury', topPsychographic: 'Brand-Loyal', audienceShare: 12, description: 'Ethnic-first wardrobe. Buys premium sherwanis and kurtas for family and religious occasions.', trend: 'stable' },
      ]
    : ctx.isFintech
    ? [
        { name: 'The First Saver', subtitle: 'Young Adult', ageBand: '21–25', incomeTier: 'Aspirational', topPsychographic: 'Early Adopter', audienceShare: 28, description: 'Just started earning, motivated to save and invest but overwhelmed by financial complexity.', trend: 'up' },
        { name: 'The Career Builder', subtitle: 'Mid-Career Professional', ageBand: '26–30', incomeTier: 'Premium', topPsychographic: 'Quality-First', audienceShare: 24, description: 'Growing income, wants smart financial tools that match their professional ambition.', trend: 'up' },
        { name: 'The Debt-Free Driver', subtitle: 'Lifestyle Optimizer', ageBand: '31–35', incomeTier: 'Premium', topPsychographic: 'Value-Conscious', audienceShare: 20, description: 'Focused on clearing debt and building an emergency fund. Feature-driven, not brand-driven.', trend: 'stable' },
        { name: 'The Wealth Builder', subtitle: 'Experienced Earner', ageBand: '36–40', incomeTier: 'Luxury', topPsychographic: 'Quality-First', audienceShare: 15, description: 'Seeks premium financial planning and investment tracking tools. Very low churn once onboarded.', trend: 'stable' },
      ]
    : [
        { name: 'The Growth Hacker', subtitle: 'Startup Operator', ageBand: '26–30', incomeTier: 'Aspirational', topPsychographic: 'Early Adopter', audienceShare: 27, description: 'Moves fast, needs tools that scale. Converts quickly but churns if value not proven in 30 days.', trend: 'up' },
        { name: 'The Operations Lead', subtitle: 'Mid-Market Manager', ageBand: '31–35', incomeTier: 'Premium', topPsychographic: 'Quality-First', audienceShare: 23, description: 'Values workflow efficiency and reporting. Champions the tool internally once value is proven.', trend: 'up' },
        { name: 'The Budget Guardian', subtitle: 'SMB Owner', ageBand: '36–40', incomeTier: 'Aspirational', topPsychographic: 'Value-Conscious', audienceShare: 19, description: 'ROI-first evaluator. Needs a clear cost-benefit case before committing to an annual contract.', trend: 'stable' },
        { name: 'The Enterprise Champion', subtitle: 'Senior Executive', ageBand: '41–45', incomeTier: 'Luxury', topPsychographic: 'Brand-Loyal', audienceShare: 14, description: 'Drives enterprise adoption. Cares about vendor stability, integrations, and SLA commitments.', trend: 'stable' },
      ]

  return {
    ageBands: allAgeBands,
    incomeTiers,
    psychographicClusters,
    genderSplit: isWomenFocused
      ? (ctx.audienceGender === 'Female' ? { male: 0, female: 97, other: 3 } : { male: 10, female: 87, other: 3 })
      : { male: 48, female: 48, other: 4 },
    crossTab,
    personas,
  }
}

async function getCustomerGrowth(ctx: MarketContext, ventureId: string, ga4PropertyId?: string): Promise<CustomerGrowth> {
  const now = new Date()
  const N = 60 // 5 years of monthly data

  // Dynamic N-month labels ending at current month
  const labels: string[] = []
  const monthStarts: Date[] = []
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(d.toLocaleString('en-US', { month: 'short' }) + " '" + String(d.getFullYear()).slice(2))
    monthStarts.push(d)
  }

  // Assign timestamped snapshots to monthly buckets — takes the max value per month
  function buildMonthlyArray<T extends { capturedAt: string }>(
    snapshots: T[],
    extract: (s: T) => number | null
  ): number[] {
    return monthStarts.map(monthStart => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59)
      const inMonth = snapshots.filter(s => {
        const d = new Date(s.capturedAt)
        return d >= monthStart && d <= monthEnd
      })
      if (inMonth.length === 0) return -1
      const vals = inMonth.map(extract).filter((v): v is number => v !== null)
      return vals.length > 0 ? Math.max(...vals) : -1
    })
  }

  let freshness: 'live' | 'stale' | 'none' = 'none'
  let dataSource: 'ga4' | 'social' | 'estimated' = 'estimated'
  let snapshotTimestamp = now.toISOString()
  let rawMonthly: number[] = Array(N).fill(-1)

  // 1 — GA4 analytics snapshots (sessions = website visitor proxy)
  try {
    const history = await getAnalyticsHistory(ventureId, 365 * 5 + 30)
    const points = history.filter(s => typeof (s.data.sessions ?? s.data.totalSessions) === 'number')
    if (points.length > 0) {
      dataSource = 'ga4'
      snapshotTimestamp = points[points.length - 1].capturedAt
      const ageH = (now.getTime() - new Date(snapshotTimestamp).getTime()) / (1000 * 60 * 60)
      freshness = ageH < 24 ? 'live' : 'stale'
      rawMonthly = buildMonthlyArray(points, s => {
        const v = s.data.sessions ?? s.data.totalSessions
        return typeof v === 'number' ? v : null
      })
    }
  } catch { /* fall through to social */ }

  // 1b — Live GA4 fetch when no snapshots exist but property is configured
  if (freshness === 'none' && ga4PropertyId) {
    try {
      const report = await getAnalyticsReport(ga4PropertyId)
      if (typeof report.sessions === 'number' && report.sessions > 0) {
        dataSource = 'ga4'
        snapshotTimestamp = now.toISOString()
        freshness = 'live'
        rawMonthly[11] = report.sessions
        try { await insertAnalyticsSnapshot(ventureId, report as unknown as Record<string, unknown>) } catch { /* non-fatal */ }
      }
    } catch { /* fall through to social */ }
  }

  // 2 — Instagram followers as proxy (if no GA4 data)
  if (freshness === 'none') {
    try {
      const social = await getSocialHistory(ventureId, 'instagram', 365 * 5 + 30)
      const points = social.filter(s =>
        typeof (s.data.followersCount ?? s.data.followers ?? s.data.follower_count) === 'number'
      )
      if (points.length > 0) {
        dataSource = 'social'
        snapshotTimestamp = points[points.length - 1].capturedAt
        const ageH = (now.getTime() - new Date(snapshotTimestamp).getTime()) / (1000 * 60 * 60)
        freshness = ageH < 24 ? 'live' : 'stale'
        rawMonthly = buildMonthlyArray(points, s => {
          const v = s.data.followersCount ?? s.data.followers ?? s.data.follower_count
          return typeof v === 'number' ? v : null
        })
      }
    } catch { /* fall through to estimated */ }
  }

  // 3 — Estimated fallback (no real data in Supabase yet)
  if (freshness === 'none') {
    const isNiche = ctx.focus.includes('Saree') || ctx.focus.includes('Leheng') || ctx.focus.includes('Sherwani')
    const base = ctx.isSaaS ? 4200 : ctx.isFintech ? 1200 : isNiche ? 560 : 8400
    const mRate = ctx.isSaaS ? 0.04 : ctx.isFintech ? 0.12 : isNiche ? 0.045 : 0.055
    const act = monthStarts.map((_, i) => Math.round(base * Math.pow(1 + mRate, i)))
    const req = monthStarts.map((_, i) => Math.round(base * Math.pow(1 + mRate * 1.2, i)))
    const fct = act.map((v, i) => i < N - 4 ? v : Math.round(act[N - 5] * Math.pow(1 + mRate * 1.15, i - (N - 5))))
    return {
      actual: act, forecast: fct, required: req, labels,
      confidenceLower: fct.map(v => Math.round(v * 0.88)),
      confidenceUpper: fct.map(v => Math.round(v * 1.12)),
      snapshotTimestamp, freshness: ga4PropertyId ? 'estimated' : 'none', dataSource: 'estimated',
      kpis: { current: 0, momGrowthPct: 0, vsTargetPct: 0 },
    }
  }

  // 4 — Fill gaps in actual via forward-carry; pre-start months = 0
  const actual: number[] = [...rawMonthly]
  let lastKnown = -1
  for (let i = 0; i < N; i++) {
    if (actual[i] >= 0) { lastKnown = actual[i] }
    else if (lastKnown >= 0) { actual[i] = lastKnown }
    else { actual[i] = 0 }
  }

  // 5 — Required trajectory from first non-zero value
  const firstNZ = actual.findIndex(v => v > 0)
  const baseVal = firstNZ >= 0 ? actual[firstNZ] : 1000
  const annualTarget = ctx.isFintech ? 0.18 : ctx.isSaaS ? 0.15 : 0.12
  const required = monthStarts.map((_, i) => {
    const steps = Math.max(0, i - Math.max(0, firstNZ))
    return Math.round(baseVal * Math.pow(1 + annualTarget / 12, steps))
  })

  // 6 — Forecast: continuation from last actual at monthly growth rate
  const lastVal = actual[N - 1] || baseVal
  const monthlyGR = ctx.isFintech ? 0.055 : ctx.isFashion ? 0.045 : 0.04
  const forecast = actual.map((v, i) => {
    if (v > 0) return v
    return Math.round(lastVal * Math.pow(1 + monthlyGR, i - (N - 1)))
  })

  // 7 — KPIs
  const current = actual[N - 1] || actual.find(v => v > 0) || 0
  const prev    = actual[N - 2] || 0
  const momGrowthPct = prev > 0 ? Math.round(((current - prev) / prev) * 1000) / 10 : 0
  const reqCurrent   = required[N - 1] || 0
  const vsTargetPct  = reqCurrent > 0
    ? Math.round(((current - reqCurrent) / reqCurrent) * 1000) / 10
    : 0

  return {
    actual, forecast, required, labels,
    confidenceLower: forecast.map(v => Math.round(v * 0.88)),
    confidenceUpper: forecast.map(v => Math.round(v * 1.12)),
    snapshotTimestamp, freshness, dataSource,
    kpis: { current, momGrowthPct, vsTargetPct },
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
  const now = new Date()
  const labels: string[] = []
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    labels.push(d.toLocaleString('en-US', { month: 'short' }) + " '" + String(d.getFullYear()).slice(2))
  }
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

// ─── Industry Growth ────────────────────────────────────────────────────────────
// Research-based estimates. Sources: IBEF India Fashion Report 2024, Wazir Advisors,
// Redseer Consumer Report 2024, McKinsey India Fashion 2023.

function getIndustryGrowth(ctx: MarketContext): IndustryGrowth {
  const YEARS = ['2020', '2021', '2022', '2023', '2024']

  if (!ctx.isFashion) {
    return {
      years: YEARS, byCategory: [], byIncomeTier: [], byAgeGroup: [], byChannel: [], byGeography: [],
      unit: '$Bn', dataNote: 'Industry growth data scoped to fashion ventures.',
      yourSegmentHighlight: '', yourSegmentCAGR: 0,
    }
  }

  const byCategory: IndustrySeries[] = [
    { name: 'Ethnic Wear',         color: '#3b82f6', cagr: 8.3,  values: [1600, 1480, 1750, 1980, 2200] },
    { name: 'Western Wear',        color: '#8b5cf6', cagr: 11.3, values: [900,  780,  1020, 1240, 1380] },
    { name: 'Fusion/Contemporary', color: '#06b6d4', cagr: 20.1, values: [280,  260,  370,  480,  580]  },
    { name: 'Activewear',          color: '#10b981', cagr: 26.4, values: [180,  210,  280,  380,  460]  },
    { name: 'Formal Wear',         color: '#6b7280', cagr: 7.0,  values: [320,  220,  350,  400,  420]  },
  ]

  const byIncomeTier: IndustrySeries[] = [
    { name: 'Luxury (₹20L+)',       color: '#a78bfa', cagr: 28.5, values: [180,  210,  300,  400,  490]  },
    { name: 'Premium (₹8–20L)',     color: '#3b82f6', cagr: 16.7, values: [420,  390,  510,  650,  780]  },
    { name: 'Aspirational (₹3–8L)', color: '#06b6d4', cagr: 11.4, values: [780,  700,  890,  1050, 1200] },
    { name: 'Mass (<₹3L)',          color: '#94a3b8', cagr: 4.9,  values: [1800, 1620, 1850, 2050, 2180] },
  ]

  const byAgeGroup: IndustrySeries[] = [
    { name: '25–34', color: '#3b82f6', cagr: 13.1, values: [1100, 1020, 1280, 1560, 1800] },
    { name: '35–44', color: '#8b5cf6', cagr: 10.2, values: [780,  700,  870,  1020, 1150] },
    { name: '18–24', color: '#06b6d4', cagr: 11.5, values: [480,  460,  540,  640,  740]  },
    { name: '45–54', color: '#f59e0b', cagr: 6.2,  values: [520,  460,  540,  610,  660]  },
    { name: '55+',   color: '#94a3b8', cagr: 5.0,  values: [280,  250,  290,  320,  340]  },
  ]

  // Channel: % share of total market (offline declining, online growing)
  const byChannel: IndustrySeries[] = [
    { name: 'Offline Retail', color: '#6b7280', cagr: -9.0,  values: [85, 77, 71, 64, 58] },
    { name: 'Marketplace',    color: '#3b82f6', cagr: 22.7,  values: [11, 16, 19, 22, 25] },
    { name: 'Online D2C',     color: '#10b981', cagr: 43.6,  values: [4,  7,  10, 14, 17] },
  ]

  const byGeography: IndustrySeries[] = [
    { name: 'Tier 2 Cities', color: '#10b981', cagr: 13.3, values: [820, 760,  950,  1150, 1350] },
    { name: 'Tier 1 Cities', color: '#3b82f6', cagr: 12.8, values: [780, 700,  900,  1080, 1260] },
    { name: 'Metro (Top 6)', color: '#8b5cf6', cagr: 8.4,  values: [980, 820,  1020, 1200, 1350] },
    { name: 'Tier 3+',       color: '#94a3b8', cagr: 8.7,  values: [680, 630,  750,  870,  950]  },
  ]

  const f = ctx.focus.toLowerCase()
  let yourSegmentHighlight = 'Ethnic Wear'
  let yourSegmentCAGR = 8.3
  if (f.includes('active') || f.includes('sport'))    { yourSegmentHighlight = 'Activewear';          yourSegmentCAGR = 26.4 }
  else if (f.includes('formal') || f.includes('suit')) { yourSegmentHighlight = 'Formal Wear';         yourSegmentCAGR = 7.0  }
  else if (f.includes('fusion') || f.includes('indo')) { yourSegmentHighlight = 'Fusion/Contemporary'; yourSegmentCAGR = 20.1 }
  else if (f.includes('western') || f.includes('dress') || f.includes('jeans')) { yourSegmentHighlight = 'Western Wear'; yourSegmentCAGR = 11.3 }

  return {
    years: YEARS, byCategory, byIncomeTier, byAgeGroup, byChannel, byGeography,
    unit: '₹Bn',
    dataNote: 'Research-based estimates · IBEF India Fashion Report, Wazir Advisors, Redseer 2024',
    yourSegmentHighlight, yourSegmentCAGR,
  }
}

// ─── Signal Feed ─────────────────────────────────────────────────────────────────

function getSignalFeed(ctx: MarketContext): SignalFeed {
  const now = new Date()
  const month = now.getMonth() + 1

  // Wedding season: Oct–Nov (post-monsoon), Feb–Apr (spring). Off: Jun–Aug.
  const isPeakWedding = [10, 11, 2, 3, 4].includes(month)
  const isOffSeason   = [6, 7, 8].includes(month)

  // Category CAGR from industry data
  const f = ctx.focus.toLowerCase()
  const categoryCAGR = ctx.isFashion ? (
    f.includes('active') || f.includes('sport') ? 26.4 :
    f.includes('fusion') || f.includes('indo')  ? 20.1 :
    f.includes('western') || f.includes('jeans') ? 11.3 :
    8.3
  ) : ctx.isFintech ? 18.0 : 15.0

  // Tier competition density
  type DensityEntry = { status: 'green' | 'amber' | 'red'; value: string; detail: string }
  const densityMap: Record<BrandTier, DensityEntry> = {
    'budget':       { status: 'red',   value: 'Very Dense', detail: 'Meesho, Amazon Basics dominate. Price alone is not a moat.' },
    'fast-fashion': { status: 'red',   value: 'Dense',      detail: 'Myntra, Ajio, Zara compete heavily. Brand story is the differentiator.' },
    'mid-market':   { status: 'amber', value: 'Moderate',   detail: 'Room for loyal segments. Focus on product quality and community.' },
    'contemporary': { status: 'amber', value: 'Moderate',   detail: 'Growing segment with emerging D2C brands. Speed to market matters.' },
    'premium':      { status: 'green', value: 'Selective',  detail: 'Fewer than 20 credible D2C players in premium ethnic. First-mover advantage available.' },
    'luxury':       { status: 'green', value: 'Sparse',     detail: 'Under 8 established luxury ethnic D2C brands. High-margin, high-barrier segment.' },
    'ultra-luxury': { status: 'green', value: 'Very Sparse','detail': 'Couture territory. 3–5 established names. Brand credibility is everything.' },
  }
  const tier = ctx.brandTier ?? 'contemporary'
  const density = densityMap[tier]

  // Price premium defence
  const tierAvgPrice: Record<BrandTier, number> = {
    'budget': 600, 'fast-fashion': 1700, 'mid-market': 3600,
    'contemporary': 7000, 'premium': 15000, 'luxury': 40000, 'ultra-luxury': 80000,
  }
  const benchmark = tierAvgPrice[tier] ?? 7000
  const brandPrice = ctx.avgPricePoint
  let priceStatus: 'green' | 'amber' | 'red' = 'amber'
  let priceValue = 'Not set'
  let priceDetail = 'Set your average price point in Settings → Market Positioning to activate this signal.'
  if (brandPrice > 0) {
    const pct = ((brandPrice - benchmark) / benchmark) * 100
    if (pct >= 0)    { priceStatus = 'green'; priceValue = `${pct.toFixed(0)}% above tier avg`; priceDetail = `₹${brandPrice.toLocaleString()} vs tier avg ₹${benchmark.toLocaleString()}. Premium positioning intact.` }
    else if (pct > -15) { priceStatus = 'amber'; priceValue = `${Math.abs(pct).toFixed(0)}% below tier avg`; priceDetail = `Slightly below tier average. Monitor whether this is intentional positioning or margin pressure.` }
    else             { priceStatus = 'red';   priceValue = `${Math.abs(pct).toFixed(0)}% below tier avg`; priceDetail = `Pricing gap vs tier average is wide. Risk of consumers perceiving a lower-tier repositioning.` }
  }

  return {
    signals: [
      {
        id: 'wedding_season', label: 'Wedding Season',
        status: isPeakWedding ? 'green' : isOffSeason ? 'red' : 'amber',
        value:  isPeakWedding ? 'Peak Window' : isOffSeason ? 'Off Season' : 'Approaching',
        detail: isPeakWedding
          ? 'Prime wedding & festive window open. Maximise paid spend and inventory depth now.'
          : isOffSeason
          ? 'Low-demand monsoon window. Focus on content production and inventory preparation.'
          : 'Season approaching within 2 months. Begin campaign ramp-up and inventory staging.',
      },
      {
        id: 'category_momentum', label: 'Category Momentum',
        status: categoryCAGR >= 15 ? 'green' : categoryCAGR >= 8 ? 'amber' : 'red',
        value: `${categoryCAGR}% CAGR`,
        detail: `Your primary category is growing at ${categoryCAGR}% per year (2020–2024). ${categoryCAGR >= 15 ? 'Strong market tailwind — expanding faster than overall fashion.' : categoryCAGR >= 8 ? 'Steady growth, below the fast-growth segments (Activewear, Fusion).' : 'Below-average category growth. Adjacent category expansion recommended.'}`,
      },
      {
        id: 'tier_density', label: 'Tier Competition',
        status: density.status, value: density.value, detail: density.detail,
      },
      {
        id: 'price_premium', label: 'Price Positioning',
        status: priceStatus, value: priceValue, detail: priceDetail,
      },
      {
        id: 'channel_health', label: 'D2C Channel',
        status: 'amber',
        value: 'Connect GA4',
        detail: 'Online D2C is growing at 43.6% CAGR in India. Add your Google service account credentials to track your own DTC share.',
      },
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
    if (includeAll === 'all' || includeAll === 'growth') data.customerGrowth = await getCustomerGrowth(ctx, venture.id, venture.ga4PropertyId || undefined)
    if (includeAll === 'all' || includeAll === 'demand') data.marketDemandIndex = getMarketDemandIndex(ctx)
    if (includeAll === 'all' || includeAll === 'whitespace') data.whitespaceMatrix = getWhitespaceMatrix(ctx)
    if (includeAll === 'all' || includeAll === 'competitive') data.competitivePosition = getCompetitivePosition(ctx)
    if (includeAll === 'all' || includeAll === 'forecast') data.forecast = getForecast(ctx)
    if (includeAll === 'all' || includeAll === 'industry') data.industryGrowth = getIndustryGrowth(ctx)
    if (includeAll === 'all' || includeAll === 'signals')  data.signalFeed     = getSignalFeed(ctx)

    return Response.json({
      venture: ventureSlug,
      countries: usedCountries,
      snapshotDate: new Date().toISOString().split('T')[0],
      targetAudience: venture.targetAudience ?? null,
      marketSubcategories: venture.marketSubcategories ?? [],
      marketFocus: ctx.focus,
      brandTier: ctx.brandTier,
      avgPricePoint: ctx.avgPricePoint,
      data,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
