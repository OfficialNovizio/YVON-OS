import { cookies } from 'next/headers'
import { toon } from 'yvon-engine/toon'
import { getActiveVentureSlug } from '@/lib/venture-context'
import { getVentureBySlug } from '@/lib/db'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const slug = getActiveVentureSlug(cookieStore)
  const config = await getVentureBySlug(slug)
  if (!config) {
  // TOON response format — auto-injected by yvon-engine
  const acceptHeader = request.headers.get('accept') || ''
  if (acceptHeader.includes('application/toon') || acceptHeader.includes('text/toon')) {
    const toonResult = toon.api(data, 'ts')
    return new Response(toonResult, { headers: { 'Content-Type': 'application/toon' } })
  }


    return Response.json({ error: 'Venture not found' }, { status: 404 })
  }
  return Response.json(config)
}
