import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

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
  '/api/route-intent',       // Internal routing classifier (server-to-server)
  '/api/health',          // intentionally public health check
  '/api/social-accounts', // Venture social accounts — read-only, no auth needed
]

/** Rate limit configuration per route type */
const RATE_LIMITS: Record<string, { limit: number; window: number }> = {
  api:    { limit: 60,  window: 60 },   // 60 req/min for API routes
  login:  { limit: 5,   window: 60 },   // 5 req/min for login
  static: { limit: 200, window: 60 },   // 200 req/min for static assets
}

function getRateLimitConfig(pathname: string) {
  if (pathname === '/api/auth/token') return RATE_LIMITS.login
  if (pathname.startsWith('/api/')) return RATE_LIMITS.api
  return RATE_LIMITS.static
}

/**
 * Verify a Supabase access token JWT using jose (HS256).
 * Falls back to exp-only check if SUPABASE_JWT_SECRET is not set.
 */
async function verifyToken(token: string): Promise<boolean> {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (jwtSecret) {
    try {
      const { jwtVerify } = await import('jose')
      const secret = new TextEncoder().encode(jwtSecret)
      const { payload } = await jwtVerify(token, secret)
      const exp = payload.exp as number | undefined
      return !!exp && exp >= Math.floor(Date.now() / 1000)
    } catch {
      return false
    }
  }

  // Fallback: decode-only expiration check (no signature verification)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (payload.exp as number) >= Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rate limiting ──────────────────────────────────────────────────────
  const rl = getRateLimitConfig(pathname)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'anonymous'
  const rlResult = checkRateLimit(`${ip}:${pathname}`, rl.limit, rl.window)

  if (!rlResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rlResult.resetInSeconds),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  // ── Public & self-authed routes ─────────────────────────────────────────
  if (PUBLIC_EXACT.has(pathname)) return NextResponse.next()
  if (SELF_AUTHED_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()

  // ── JWT authentication ─────────────────────────────────────────────────
  const token = request.cookies.get('yvon_auth')?.value

  if (!token || !(await verifyToken(token))) {
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
