import { NextRequest } from 'next/server'

type Person = { id: string; name: string; rel: string; tone: 'blue' | 'green' | 'muted'; company: string; notes: string[] }

const MOCK: Person[] = [
  { id: 'p1', name: 'Maria Solano', rel: 'Prospect · warm', tone: 'blue', company: 'Brightwave Studio', notes: ['€5k cinematic site inquiry', 'Prefers Spanish for small talk', 'Found us via YouTube'] },
  { id: 'p2', name: 'Tomas R.', rel: 'Client', tone: 'green', company: 'Nordic Labs', notes: ['€2k/mo retainer', 'Technical founder'] },
  { id: 'p3', name: 'Priya M.', rel: 'Client · won', tone: 'green', company: 'Studio Onyx', notes: ['€8k mission control build', 'Referral source'] },
  { id: 'p4', name: 'Lena K.', rel: 'Lead', tone: 'muted', company: 'Café Mantra', notes: ['Newsletter signup', 'Valhalla booking interest'] },
]

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return Response.json({ people: MOCK, source: 'mock' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ people: [], source: 'error', error: msg }, { status: 200 })
  }
}
