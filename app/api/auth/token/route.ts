import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

// Cookie lifetime matches Supabase default access token expiry (1 hour).
// When the cookie expires, middleware redirects to /login, which re-issues
// the cookie if a valid Supabase session still exists in the browser.
const COOKIE_MAX_AGE = 60 * 60

export async function POST(request: Request): Promise<Response> {
  let body: { accessToken?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { accessToken } = body
  if (!accessToken) {
    return Response.json({ error: 'accessToken is required' }, { status: 400 })
  }

  // Verify the token is a real, active Supabase session
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('yvon_auth', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return Response.json({ ok: true })
}
