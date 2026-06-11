// YVON OS middleware — minimal pass-through.
// No auth gate; the dashboard is served directly.
// Rate limiting and CSP headers are handled by next.config.ts.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Pass through all requests — YVON OS is an internal dashboard
  return NextResponse.next()
}

// Only match page routes (not static assets, _next, favicon, etc.)
export const config = {
  matcher: ['/((?!_next|static|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)'],
}
