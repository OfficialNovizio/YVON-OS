type Deal = { id: string; name: string; company: string; value: number; stage: string; tone: 'blue' | 'green' | 'yellow' | 'muted' }

const MOCK: Deal[] = [
  { id: 'd1', name: 'Mission Control build', company: 'Studio Onyx', value: 8000, stage: 'Won', tone: 'green' },
  { id: 'd2', name: 'Cinematic site', company: 'Brightwave Studio', value: 5000, stage: 'Proposal', tone: 'blue' },
  { id: 'd3', name: 'Agent retainer', company: 'Nordic Labs', value: 24000, stage: 'Negotiation', tone: 'yellow' },
]

export async function GET(): Promise<Response> {
  try {
    return Response.json({ deals: MOCK, activeDeals: 3, totalValue: 37000, source: 'mock' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ deals: [], source: 'error', error: msg }, { status: 200 })
  }
}
