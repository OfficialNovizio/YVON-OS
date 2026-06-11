// Demo/fallback data for routes that haven't been wired to live Supabase yet.
// Remove individual exports as live data flows in.

export const mockReports = {
  analytics: {
    id: 'demo-analytics',
    title: 'Demo Analytics Report',
    summary: 'This is demo analytics summary. Connect real data sources to replace.',
    createdAt: new Date().toISOString(),
    reportNumber: 0,
  },
  marketing: {
    id: 'demo-marketing',
    title: 'Demo Marketing Report',
    summary: 'This is demo marketing summary. Connect real data sources to replace.',
    createdAt: new Date().toISOString(),
    reportNumber: 0,
  },
  competitor: {
    id: 'demo-competitor',
    title: 'Demo Competitor Report',
    summary: 'This is demo competitor summary. Connect real data sources to replace.',
    createdAt: new Date().toISOString(),
    reportNumber: 0,
  },
}

export const mockBatch = {
  id: 'demo-batch',
  batchNumber: 0,
  status: 'demo',
  createdAt: new Date().toISOString(),
}

export interface MockPitch {
  id: string
  rank: number
  platform: string
  format: string
  category: string
  hookA: string
  hookB: string
  leverPrimary: string
  psychologyScore: number
  system1ScoreA: number
  system1ScoreB: number
  runRecommendation: string
  marketEffect: string
  vsCurrent: string
  viralMechanism: string
  status: string
}

export const mockPitches: MockPitch[] = [
  {
    id: 'demo-pitch-1',
    rank: 1,
    platform: 'instagram',
    format: 'reel',
    category: 'product',
    hookA: 'Demo hook A',
    hookB: 'Demo hook B',
    leverPrimary: 'social_proof',
    psychologyScore: 75,
    system1ScoreA: 72,
    system1ScoreB: 68,
    runRecommendation: 'run_a',
    marketEffect: 'medium',
    vsCurrent: '+15%',
    viralMechanism: 'shareable_moment',
    status: 'pending',
  },
]
