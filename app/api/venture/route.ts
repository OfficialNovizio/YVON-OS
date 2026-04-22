import { cookies } from 'next/headers'
import { getActiveVentureSlug, getVentureConfig } from '@/lib/venture-context'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const slug = getActiveVentureSlug(cookieStore)
  const config = getVentureConfig(slug)
  return Response.json(config)
}
