// YVON OS production middleware — auth gate + rate limiting + CORS.
//
// GET requests from the app's own origin are allowed on read-public APIs.
// CRON_SECRET allows full bypass for scheduled agent cron jobs.
// State-changing methods (POST/PUT/DELETE) and external callers require token auth.

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
const PUBLIC_API_PATHS = ['/api/health', '/api/auth', '/api/agent-ops', '/api/yvon-dashboard-stats']

/** APIs that require token auth only for state-changing methods (POST/PUT/PATCH/DELETE).
 *  GET requests from allowed origins pass through — the client just reads data. */
const READ_PUBLIC_APIS = [
  '/api/dashboard',
  '/api/decision-queue',
  '/api/task-board',
  '/api/social-approvals',
  '/api/people',
  '/api/projects',
  '/api/org-chart',
  '/api/scheduler',
  '/api/logs',
  '/api/content-feed',
  '/api/social-stats',
  '/api/token-usage',
  '/api/deepseek-balance',
  '/api/activity',
  '/api/agent-memory',
  '/api/agent-personality',
  '/api/agent-session-memory',
  '/api/agent-status',
  '/api/agent-log',
  '/api/settings',
  '/api/ventures',
  '/api/deliverables',
  '/api/decisions',
  '/api/insights',
  '/api/brand-health',
  '/api/brand-score',
  '/api/brand-intelligence',
  '/api/content-performance',
  '/api/industry-radar',
  '/api/market-intelligence',
  '/api/council',
  '/api/yvon-config',
  '/api/skills',
  '/api/session-sync',
  '/api/skill-workshop',
]

function isReadPublicApi(pathname: string): boolean {
  return READ_PUBLIC_APIS.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
}

/** Check if the request comes from the app's own frontend (trusted origin). */
function isOwnOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const isAllowedOrigin = (o: string | null): boolean => !!o && ALLOWED_ORIGINS.some((allowed) => o.startsWith(allowed))
  return isAllowedOrigin(origin) || isAllowedOrigin(referer)
}

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

    // 2. Read-public APIs — allow GET requests from the app's own frontend
    if (isReadPublicApi(pathname) && request.method === 'GET' && isOwnOrigin(request)) {
      const response = NextResponse.next()
      setCorsHeaders(response, origin)
      return response
    }

    // 3. Token auth — required for state-changing methods or external callers
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

    // 4. Rate limiting — per-IP on selected endpoints
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
