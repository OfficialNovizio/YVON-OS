import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that bypass auth entirely — they either have their own auth
// mechanism or are part of the auth flow itself.
const PUBLIC_EXACT = new Set(['/login', '/api/auth/token', '/api/auth/logout'])

const SELF_AUTHED_PREFIXES = [
  // Cron routes — verified by CRON_SECRET header, not yvon_auth cookie
  '/api/briefing',
  '/api/calendar-verify',
  '/api/trending',
  '/api/competitor-content',
  '/api/growth/cleanup',
  '/api/content-intelligence',
  '/api/content-performance/measure',
  '/api/cse-reflection',
  '/api/reports/generate',
  '/api/agent-cron',
  // Other self-authenticated routes
  '/api/session-sync',    // GITHUB_TOKEN
  '/api/stripe-webhook',  // Stripe signature
  '/api/linkedin/callback', // OAuth callback (IS the auth flow)
  '/api/linkedin/connect',  // OAuth initiation
  '/api/health',          // intentionally public health check
]

// Decode the JWT payload and check the exp claim without a network round-trip.
// We rely on Supabase signing the token — we are only guarding against
// expired tokens here, not forged ones (the secret never leaves the server).
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (payload.exp as number) < Math.floor(Date.now() / 1000)
  } catch {
    return true
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_EXACT.has(pathname)) return NextResponse.next()
  if (SELF_AUTHED_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = request.cookies.get('yvon_auth')?.value
  const authenticated = !!token && !isTokenExpired(token)

  if (!authenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Exclude Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
}
