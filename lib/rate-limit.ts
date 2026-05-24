/**
 * lib/rate-limit.ts — In-memory sliding window rate limiter for Edge Middleware.
 *
 * This is a **best-effort** guard for Vercel serverless. Each instance has its
 * own isolated memory, so at high concurrency the actual limit is ~instanceCount × limit.
 *
 * For exact limits in production, replace with Upstash Redis:
 *   https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *   const { Ratelimit } = await import('@upstash/ratelimit')
 *   const { Redis } = await import('@upstash/redis')
 *   export const rateLimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(10, '10 s'),
 *   })
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Auto-cleanup stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 300_000)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

/**
 * @param key — Unique identifier (IP, userId, route+ip, etc.)
 * @param limit — Max requests in the window
 * @param windowSeconds — Sliding window duration
 */
export function checkRateLimit(
  key: string,
  limit = 60,
  windowSeconds = 60,
): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetInSeconds: windowSeconds }
  }

  entry.count += 1
  const remaining = Math.max(0, limit - entry.count)
  const resetInSeconds = Math.max(0, Math.ceil((entry.resetAt - now) / 1000))

  return {
    allowed: entry.count <= limit,
    remaining,
    resetInSeconds,
  }
}

/**
 * Higher-order middleware wrapper for API routes.
 *
 * Usage:
 *   import { withRateLimit } from '@/lib/rate-limit'
 *   export const GET = withRateLimit(60, 60)(async (req) => { ... })
 */
export function withRateLimit(limit = 60, windowSeconds = 60) {
  return function <T extends Request>(
    handler: (req: T, ...args: unknown[]) => Promise<Response>,
  ) {
    return async (req: T, ...args: unknown[]): Promise<Response> => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? 'anonymous'
      const route = new URL(req.url).pathname
      const result = checkRateLimit(`${ip}:${route}`, limit, windowSeconds)

      if (!result.allowed) {
        return Response.json(
          { error: 'Too many requests' },
          {
            status: 429,
            headers: {
              'Retry-After': String(result.resetInSeconds),
              'X-RateLimit-Remaining': '0',
            },
          },
        )
      }

      return handler(req, ...args)
    }
  }
}
