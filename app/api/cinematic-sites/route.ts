type Site = { id: string; name: string; client: string; url: string; status: 'live' | 'building'; description?: string }

const MOCK: Site[] = [
  { id: 's1', name: 'Studio Onyx', client: 'Onyx Studio', url: 'https://studio-onyx.com', status: 'live', description: 'Full cinematic one-pager with 3D product viewer' },
  { id: 's2', name: 'Brightwave', client: 'Brightwave Studio', url: '#', status: 'building', description: 'Portfolio + booking site with glass-morphism design' },
  { id: 's3', name: 'Canela Store', client: 'Canela', url: 'https://canela.shop', status: 'live', description: 'E-commerce with AI-powered bundle builder' },
]

export async function GET(): Promise<Response> {
  return Response.json({ sites: MOCK, totalLive: 2, totalBuilding: 1, source: 'mock' })
}
