---
name: error-tracking-shared
description: Shared error tracking standard for all YVON agents. Defines structured log format, error classification, HTTP status rules, and no-PII policy. Source of truth referenced by Raj, Dev, Mia, and Quinn.
version: 1.1.0
applies-to: all-technical-agents
---

# Error Tracking — Shared Standard

> Canonical source: `shared/skills/custom/error-tracking/SKILL.md`
> Raj's copy at `Technical/raj/skills/custom/error-tracking/SKILL.md` is the origin — this shared file mirrors it.
> If they conflict, update Raj's file and sync here.

---

## Structured Error Log Format

Every route error MUST follow this shape before logging:

```typescript
interface YVONErrorLog {
  type: 'route_error' | 'auth_error' | 'db_error' | 'external_api_error' | 'validation_error'
  route: string          // '/api/[exact-route-name]'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  message: string        // user-safe message only — NOT err.message
  venture_slug: string   // context for multi-venture debugging, not PII
  timestamp: string      // new Date().toISOString()
  // NEVER include: stack trace, err.message, API keys, email, name, payment info
}
```

**Implementation (copy into any route file that needs error logging):**
```typescript
function logError(error: Partial<YVONErrorLog>) {
  console.error(JSON.stringify({
    type: error.type ?? 'route_error',
    route: error.route,
    method: error.method,
    message: error.message ?? 'An error occurred.',
    venture_slug: error.venture_slug ?? 'unknown',
    timestamp: new Date().toISOString()
  }))
}
```

---

## Error Classification

| Error type | When to use | Log level |
|-----------|------------|-----------|
| `validation_error` | Zod parse failed, bad input | `console.warn` |
| `auth_error` | getUser() failed, session expired | `console.warn` |
| `route_error` | Unexpected error in handler | `console.error` |
| `db_error` | Supabase query failed | `console.error` |
| `external_api_error` | Apify, YouTube, GA4 failure | `console.warn` |

`4xx` errors → WARN (client fault) · `5xx` errors → ERROR (our system fault)

---

## HTTP Status Code Rules

| Scenario | Status |
|----------|--------|
| Zod validation failed | `400` |
| Missing or invalid auth | `401` |
| Authenticated, not authorized | `403` |
| Resource not found | `404` |
| Rate limit exceeded | `429` + `Retry-After` header |
| Unexpected server error | `500` |
| Dependency unavailable | `503` + `Retry-After: 5` |

**Non-negotiable:** Never return `200` with an error body. Never `500` for client input. Never `401` for authorization failure (that is `403`).

---

## No-PII Rule

**Never log:** email, full names, phone, payment data, session/auth tokens, raw API keys, IP addresses.

**Safe to log:** `user_id` (UUID only), `venture_slug`, `route`, `method`, HTTP status code, generic user-safe message.

---

## Route Error Template

```typescript
export async function POST(req: NextRequest) {
  const ventureSlug = req.headers.get('x-venture-slug') ?? 'unknown'
  try {
    // handler logic
  } catch (err) {
    logError({ type: 'route_error', route: '/api/[route]', method: 'POST', message: 'An unexpected error occurred.', venture_slug: ventureSlug })
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}
```

---

## Agent Ownership

| Agent | Role |
|-------|------|
| Raj | Authors error handling in all `/api/` routes |
| Dev | Reviews error handling in architecture review |
| Mia | Handles client-side error states (not server errors) |
| Quinn | Audits error format compliance via `error-log-audit` skill |
