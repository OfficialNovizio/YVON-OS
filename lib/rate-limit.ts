// In-memory rate limiter for Next.js middleware.
// Tracks requests per IP with a 60-second sliding window.
// Auto-cleanup runs every 60s to prevent memory leaks from stale entries.

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  /** Window duration in milliseconds */
  windowMs: number
  /** Maximum requests allowed within the window */
  maxRequests: number
}

const store = new Map<string, RateLimitEntry>()

// Auto-cleanup every 60s — removes entries whose window has expired.
const CLEANUP_INTERVAL = 60_000

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup(): void {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of Array.from(store.entries())) {
      if (now >= entry.resetTime) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

/**
 * Check whether a request from `ip` to `path` should be rate-limited.
 *
 * Returns `allowed: true` when no matching config exists or the request
 * is within limits. Returns `allowed: false` with retry metadata when
 * the limit has been exceeded.
 */
export function checkRateLimit(
  ip: string,
  path: string,
  configs: Record<string, RateLimitConfig>,
): { allowed: boolean; remaining: number; resetTime: number } {
  ensureCleanup()

  // Longest-prefix match so /api/claude/xyz is covered by /api/claude config
  let matchedConfig: RateLimitConfig | undefined
  let matchedPrefix = ''
  for (const prefix of Object.keys(configs)) {
    if (path.startsWith(prefix) && prefix.length > matchedPrefix.length) {
      matchedConfig = configs[prefix]
      matchedPrefix = prefix
    }
  }

  if (!matchedConfig) {
    return { allowed: true, remaining: -1, resetTime: 0 }
  }

  const key = `${ip}:${matchedPrefix}`
  const now = Date.now()
  const entry = store.get(key)

  // New window — first request in this period
  if (!entry || now >= entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + matchedConfig.windowMs,
    }
    store.set(key, newEntry)
    return {
      allowed: true,
      remaining: matchedConfig.maxRequests - 1,
      resetTime: newEntry.resetTime,
    }
  }

  // Existing window — increment
  entry.count++

  if (entry.count > matchedConfig.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    allowed: true,
    remaining: matchedConfig.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/** Pre-configured rate limits for API routes. */
export const API_RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/claude': { windowMs: 60_000, maxRequests: 60 },
  '/api/settings': { windowMs: 60_000, maxRequests: 30 },
}
