type Project = { id: string; name: string; status: 'active' | 'paused' | 'completed'; venture: string; progress: number }

const MOCK: Project[] = [
  { id: 'pj1', name: 'YVON OS · Mission Control', status: 'active', venture: 'YVON', progress: 85 },
  { id: 'pj2', name: 'Canela · e-commerce launch', status: 'active', venture: 'Canela', progress: 62 },
  { id: 'pj3', name: 'Hourbour · fintech MVP', status: 'paused', venture: 'Hourbour', progress: 40 },
  { id: 'pj4', name: 'Valhalla · booking engine', status: 'completed', venture: 'Valhalla', progress: 100 },
]

export async function GET(): Promise<Response> {
  return Response.json({ projects: MOCK, source: 'mock' })
}
