import { cookies } from 'next/headers'

export async function POST(request: Request): Promise<Response> {
  let ventureSlug: string
  try {
    const body = await request.json() as { ventureSlug?: string }
    ventureSlug = body.ventureSlug ?? ''
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!ventureSlug) {
    return Response.json({ error: 'ventureSlug is required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set('yvon_active_venture', ventureSlug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false, // must be readable client-side for VentureSwitcher
    sameSite: 'lax',
  })

  return Response.json({ ok: true, ventureSlug })
}
