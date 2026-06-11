// YVON OS production middleware — auth gate + rate limiting + CORS.
//
// Protects all /api/* routes except /api/health and /api/auth/*.
// CRON_SECRET allows full bypass for scheduled agent cron jobs.
// Dashboard access requires x-api-key or Bearer token matching SUPABASE_SERVICE_ROLE_KEY.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, API_RATE_LIMITS } from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CRON_SECRET = process.env.CRON_SECRET
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ALLOWED_ORIGINS = ['https://yvon.in', 'http://localhost:3000']

/** API paths that are publicly accessible (no auth required). */
const PUBLIC_API_PATHS = ['/api/health', '/api/auth']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))
}

/** Extract the client IP from standard proxy headers. */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

/** Authorize if the Authorization header matches CRON_SECRET (direct or Bearer). */
function isCronAuthorized(request: NextRequest): boolean {
  if (!CRON_SECRET) return false
  const auth = request.headers.get('authorization')
  if (!auth) return false
  return auth === CRON_SECRET || auth === `Bearer ${CRON_SECRET}`
}

/** Authorize if x-api-key or Authorization Bearer matches SUPABASE_SERVICE_ROLE_KEY. */
function isTokenAuthorized(request: NextRequest): boolean {
  if (!SUPABASE_SERVICE_ROLE_KEY) return false

  const apiKey = request.headers.get('x-api-key')
  if (apiKey === SUPABASE_SERVICE_ROLE_KEY) return true

  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) return true

  return false
}

/** Apply CORS headers to a response when the origin is allowed. */
function setCorsHeaders(response: NextResponse, origin: string | null): void {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-api-key',
  )
  response.headers.set('Access-Control-Max-Age', '86400')
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // CORS preflight — respond immediately
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    setCorsHeaders(response, origin)
    return response
  }

  // --- API route protection ---
  const isApiRoute = pathname.startsWith('/api/')

  if (isApiRoute) {
    // Allow public API paths through without auth
    if (isPublicApiPath(pathname)) {
      const response = NextResponse.next()
      setCorsHeaders(response, origin)
      return response
    }

    // 1. CRON_SECRET bypass — full access for agent cron jobs
    if (isCronAuthorized(request)) {
      const response = NextResponse.next()
      setCorsHeaders(response, origin)
      return response
    }

    // 2. Token auth — dashboard / programmatic access
    if (!isTokenAuthorized(request)) {
      const ip = getClientIp(request)
      console.log(
        `[AUTH FAIL] ${request.method} ${pathname} — IP: ${ip} — no valid token`,
      )
      const response = new NextResponse(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Valid API key or token required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      )
      setCorsHeaders(response, origin)
      return response
    }

    // 3. Rate limiting — per-IP on selected endpoints
    const ip = getClientIp(request)
    const rateLimitResult = checkRateLimit(ip, pathname, API_RATE_LIMITS)

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000,
      )
      console.log(
        `[RATE LIMIT] ${request.method} ${pathname} — IP: ${ip} — limit exceeded`,
      )
      const response = new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
          },
        },
      )
      setCorsHeaders(response, origin)
      return response
    }
  }

  // Pass through all non-API requests (pages, static, etc.)
  const response = NextResponse.next()
  setCorsHeaders(response, origin)
  return response
}

// ---------------------------------------------------------------------------
// Matcher — excludes Next.js internal assets and static files
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)',
  ],
}
