// GET /api/venture
import { cookies } from 'next/headers'
import { toon } from 'toongine/toon'
import { getActiveVentureSlug } from '@/lib/venture-context'
import { getVentureBySlug } from '@/lib/db'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const slug = getActiveVentureSlug(cookieStore)
  const config = await getVentureBySlug(slug)
  if (!config) {
    return Response.json({ error: 'Venture not found' }, { status: 404 })
  }
  return Response.json(config)
}
