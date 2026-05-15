# SECURITY.md — Health Check System + Security Architecture
> Implementation plan for the Technical team (Dev, Raj, Mia, Quinn).
> Each section is a task that can be assigned to an agent.

---

## PART 1: HEALTH CHECK SYSTEM

### Overview

A cron-driven `/api/health-check` endpoint that runs every 6 hours, checks everything, and writes results to `requests/pending/` for your review. Nothing auto-fixes.

---

### Task 1.1 — Database Health (assign to Raj)

Build a `/api/health/database` endpoint that checks:

| Check | What it does | Threshold | Alert if |
|-------|-------------|-----------|---------|
| Connection | Pings Supabase with a `SELECT 1` query | < 500ms | Connection timeout or error |
| Migration status | Reads `_migrations` table for pending migrations | 0 pending | Any migration not applied |
| Query performance | Runs a simple query on `social_stats` table | < 200ms | Query takes > 1s |
| Connection pool | Checks active connections vs max | < 80% pool | Approaching connection limit |
| Disk space | Supabase storage usage | < 80% of quota | Nearing storage limit |
| Replication lag | If read replicas configured, checks lag | < 1s | Lag > 5s |

**Implementation:**
```typescript
// /app/api/health/database/route.ts
export async function GET() {
  const results = {
    connection: await pingDatabase(),
    migrations: await checkMigrations(),
    queryPerf: await benchmarkQuery(),
    connections: await checkPool(),
    diskUsage: await getStorageUsage(),
    timestamp: new Date().toISOString(),
  }
  const failed = Object.entries(results).filter(([_, r]) => r.status === 'fail')
  if (failed.length > 0) {
    await writeProposal({
      agent: 'raj-backend',
      type: 'alert',
      summary: `Database health check failed: ${failed.map(f => f[0]).join(', ')}`,
      data: results,
    })
  }
  return Response.json(results)
}
```

**Cron schedule:** Every 6 hours via `vercel.json`:
```json
{ "path": "/api/health/database", "schedule": "0 */6 * * *" }
```

**Est. effort:** Raj — 4 hours

---

### Task 1.2 — Website Uptime (assign to Dev)

Build a `/api/health/website` endpoint that checks:

| Check | What it does | Threshold | Alert if |
|-------|-------------|-----------|---------|
| HTTP status | HEAD request to production URL | 200 | Non-200 response |
| Response time | Measures full page load | < 2s | > 5s |
| SSL expiry | Reads SSL cert expiry date | > 30 days | < 14 days |
| DNS resolution | Checks domain resolves correctly | Matches expected IP | Mismatch or failure |
| Vercel status | Checks Vercel status page for incidents | No incidents | Active incident |
| Deployment status | Checks latest Vercel deployment | Ready | Failed or building > 30min |

**Implementation:**
```typescript
// /app/api/health/website/route.ts
export async function GET() {
  const checks = {
    httpStatus: await checkHttpStatus(process.env.NEXT_PUBLIC_URL),
    responseTime: await measureResponseTime(process.env.NEXT_PUBLIC_URL),
    sslExpiry: await checkSslExpiry(process.env.NEXT_PUBLIC_URL),
    dnsResolution: await checkDns(process.env.NEXT_PUBLIC_URL),
    vercelStatus: await checkVercelStatus(),
    deploymentStatus: await checkLatestDeployment(),
  }
  // ... alert on failures
}
```

**Cron schedule:** Every 30 minutes (HTTP check), every 24 hours (SSL/DNS).

**Est. effort:** Dev — 3 hours

---

### Task 1.3 — Spend Tracking (assign to Raj + Felix)

Build a `/api/health/spend` endpoint that aggregates all costs:

| Check | Data source | Alert if |
|-------|------------|---------|
| Supabase spend | Supabase API (usage endpoint) | > 80% of monthly budget |
| AI token spend | `token_usage` table + current model pricing | > 20% weekly increase |
| Vercel spend | Vercel API (deployment + function costs) | > 80% of monthly budget |
| API keys cost | Resend, Apify, YouTube, etc. | Any unexpected charge |
| Burn rate | Total monthly cost / days * 30 | > monthly budget |
| MoM change | Current month vs last month | > 30% increase without explanation |

**Implementation:** Reads from Supabase `token_usage` table + external API calls. Felix sets budget thresholds, Raj implements the checks.

```typescript
// /app/api/health/spend/route.ts
export async function GET() {
  const tokenCost = await aggregateTokenCosts()
  const supabaseCost = await getSupabaseUsage()
  const vercelCost = await getVercelUsage()
  const burnRate = (tokenCost + supabaseCost + vercelCost) / daysInMonth * 30
  // ... alert on thresholds
}
```

**Est. effort:** Raj 3h + Felix 2h

---

### Task 1.4 — Repository Health (assign to Dev)

Build a `/api/health/repository` endpoint that checks:

| Check | What it does | Alert if |
|-------|-------------|---------|
| Open PRs age | Lists PRs older than 7 days | Any PR > 14 days without activity |
| Build status | Latest commit build status | Failed build on main |
| Dependency audit | `npm audit` results | Critical vulnerabilities |
| Branch hygiene | Checks for stale branches (> 30 days) | > 5 stale branches |
| Merge conflicts | Checks if PRs have conflicts | Any PR with conflicts |

**Implementation:** Uses GitHub API (`gh` CLI or REST API):
```typescript
const prs = await fetch('https://api.github.com/repos/{owner}/{repo}/pulls')
const audits = await exec('npm audit --json')
// ... parse and alert
```

**Est. effort:** Dev — 3 hours

---

### Task 1.5 — Consolidated Health Dashboard (assign to Mia)

Build a UI page at `/screens/health` that shows all checks in a dashboard:

| Section | Data from | Variant |
|---------|-----------|---------|
| Database status | `/api/health/database` | V1 cards (pass) / V3 cards (fail) |
| Website status | `/api/health/website` | V1 cards (pass) / V3 cards (fail) |
| Spend overview | `/api/health/spend` | V2 Azure Tint |
| Repo health | `/api/health/repository` | V1 cards |
| Recent alerts | All endpoints | V4 Prism (resolved) / V3 (active) |

**Est. effort:** Mia — 6 hours

---

### Task 1.6 — Alert Thresholds & Notification (assign to Dev)

Configure when and how alerts fire:

| Severity | Condition | Channel |
|----------|-----------|---------|
| 🔴 Critical | Website down, DB unreachable, spend > 90% | Immediate → requests/pending/ + email (Resend) |
| 🟡 Warning | Response time > 3s, SSL < 14 days, budget > 80% | Daily digest |
| 🔵 Info | New migrations pending, old PRs, dependency updates | Weekly digest |

**Notification delivery for now:** All alerts write to `requests/pending/{severity}-{timestamp}.json`. Email delivery via Resend can be enabled later.

---

## PART 2: SECURITY ARCHITECTURE

### Overview

Current security posture assessment + what needs to be built. Each item is a task for the Technical team.

---

### Task 2.1 — Database Security (assign to Raj)

| Item | Current status | Action needed | Priority |
|------|---------------|---------------|----------|
| **RLS policies** | ✅ Partial — some tables have RLS, needs audit | Full RLS audit on all tables | P1 |
| **Service role key** | ✅ Server-side only, never in client | Verify no client bundle leak | P1 |
| **Anon key restrictions** | ⚠️ Anon key has SELECT on some tables | Restrict anon key to minimum required | P1 |
| **SQL injection** | ✅ Using Supabase JS client (parameterized) | Verify raw queries in migrations | P2 |
| **Connection pooling** | ⚠️ Supabase default pool only | Configure pgBouncer for production | P2 |
| **Backup schedule** | ⚠️ Supabase daily backups default | Verify point-in-time recovery is enabled | P1 |
| **Data encryption at rest** | ✅ Supabase encrypts at rest (AES-256) | Verify compliance | P3 |
| **Column-level encryption** | ❌ PII data not encrypted at column level | Encrypt PII (emails, names) using pgcrypto | P2 |
| **Audit logging** | ❌ No query audit trail | Enable Supabase audit logs or pg_audit | P2 |

**RLS Policy Template** (for each table):
```sql
-- Example: users table
CREATE POLICY "Users can only access own data"
  ON users
  FOR ALL
  USING (auth.uid() = id);

-- Example: venture data
CREATE POLICY "Agents can read active venture"
  ON social_stats
  FOR SELECT
  USING (venture_id = current_setting('app.current_venture'));
```

**Est. effort:** Raj — 8 hours

---

### Task 2.2 — API Security (assign to Dev)

| Item | Current status | Action needed | Priority |
|------|---------------|---------------|----------|
| **Rate limiting** | ❌ No rate limiting on any route | Add rate limiting to `/api/*` routes | P1 |
| **CORS configuration** | ⚠️ Default Next.js CORS | Explicit allowlist for production | P1 |
| **Input validation** | ⚠️ Basic validation on some routes | Zod schemas on all API routes | P1 |
| **Request size limits** | ✅ Vercel default 4.5MB | Verify sufficient for your use case | P3 |
| **API key rotation** | ❌ Keys never rotated | Monthly rotation schedule + script | P2 |
| **Auth middleware** | ❌ No auth guard on API routes | Add AuthGuard wrapper to sensitive routes | P1 |
| **CSRF protection** | ✅ Next.js built-in with Server Actions | Verify for custom routes | P2 |

**Rate limiting implementation:**
```typescript
// /lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})
```

**Input validation (Zod):**
```typescript
import { z } from 'zod'

const HealthCheckSchema = z.object({
  endpoint: z.enum(['database', 'website', 'spend', 'repository']),
  timeframe: z.string().regex(/^\d+[hdwm]$/).optional(),
})
```

**Est. effort:** Dev — 6 hours

---

### Task 2.3 — Authentication & Access Control (assign to Dev + Raj)

| Item | Current status | Action needed | Priority |
|------|---------------|---------------|----------|
| **Auth provider** | ⚠️ Basic auth route exists | Integrate Supabase Auth (email + OAuth) | P1 |
| **Session management** | ❌ No session persistence | JWT + refresh token flow | P1 |
| **MFA** | ❌ Not configured | Enable Supabase MFA | P2 |
| **Role-based access** | ❌ No admin/user distinction | Add roles table + middleware | P2 |
| **API key auth for cron** | ⚠️ CRON_SECRET exists but not enforced everywhere | Apply Bearer token check to all cron routes | P1 |
| **OAuth providers** | ❌ Google/GitHub login not configured | Add OAuth for team access | P2 |

**Auth flow:**
```
User → Login (email/Google/GitHub) → Supabase Auth → JWT
                                                    ↓
Browser sends JWT with every request → AuthGuard middleware validates
                                                    ↓
                                                   API route
```

**Est. effort:** Dev 8h + Raj 4h

---

### Task 2.4 — Network & Infrastructure Security (assign to Dev)

| Item | Current status | Action needed | Priority |
|------|---------------|---------------|----------|
| **Vercel WAF** | ✅ Vercel provides basic WAF | Verify rules are applied | P2 |
| **Supabase network restrictions** | ❌ Not configured | Restrict Supabase to Vercel IPs only | P1 |
| **DDoS protection** | ✅ Vercel provides basic DDoS | Verify settings | P2 |
| **CSP headers** | ❌ No Content-Security-Policy | Add CSP headers in next.config.js | P1 |
| **HTTPS enforcement** | ✅ Vercel auto-enforces HTTPS | Verify HSTS header | P2 |
| **Environment variable encryption** | ✅ Vercel encrypts env vars | Verify no plaintext keys in code | P1 |
| **Secrets management** | ⚠️ Vercel env vars + .env.local | Move to Vercel Secrets or 1Password | P2 |

**CSP Headers (next.config.js):**
```javascript
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed for Next.js
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co https://api.anthropic.com",
]
```

**Est. effort:** Dev — 4 hours

---

### Task 2.5 — Dependency & Supply Chain Security (assign to Dev + Quinn)

| Item | Current status | Action needed | Priority |
|------|---------------|---------------|----------|
| **Dependabot** | ❌ Not configured | Enable Dependabot in GitHub repo settings | P1 |
| **npm audit** | ❌ Not in CI | Add `npm audit` to build pipeline | P1 |
| **Snyk or similar** | ❌ Not configured | Evaluate Snyk for continuous scanning | P2 |
| **Lock file verification** | ⚠️ package-lock.json exists but not verified | Add lockfile check to CI | P2 |
| **Outdated deps** | ❌ No regular review | Monthly dependency review assigned to Quinn | P2 |

**Dependabot config (`.github/dependabot.yml`):**
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

**Est. effort:** Dev 2h + Quinn 2h monthly

---

### Task 2.6 — Monitoring & Incident Response (assign to Dev)

| Item | Current status | Action needed | Priority |
|------|---------------|---------------|----------|
| **Error logging** | ⚠️ Basic console.log in some routes | Add structured logging to all API routes | P1 |
| **Alerting** | ❌ No alert notification channel | Configure email alerts via Resend | P2 |
| **Incident response plan** | ❌ No documented process | Create IR doc in reference/ | P2 |
| **Postmortem process** | ❌ No postmortem template | Create template in reference/ | P3 |
| **Uptime monitoring** | ❌ No external uptime checker | Set up BetterUptime or Pingdom free tier | P1 |

**Structured logging:**
```typescript
// /lib/logger.ts
export function log(level: 'info' | 'warn' | 'error', context: string, data?: any) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    data,
  }
  // Write to Supabase logs table + console
  console.log(JSON.stringify(entry))
}
```

**Est. effort:** Dev — 6 hours

---

### Task 2.7 — Data Privacy & Compliance (assign to Raj + Marcus)

| Item | Current status | Action needed | Priority |
|------|---------------|---------------|----------|
| **PII inventory** | ❌ No PII map | Document what PII is stored and where | P1 |
| **Data retention** | ❌ No retention policy | Define how long data is kept | P1 |
| **GDPR compliance** | ❌ No consent mechanism | Add cookie consent + data deletion flow | P2 |
| **Data export** | ❌ No user data export | Build `/api/export/user-data` | P2 |
| **Audit trail** | ❌ No admin action log | Log all admin/data-modifying operations | P2 |

---

## PART 3: IMPLEMENTATION ROADMAP

### Phase 1 — Foundation (Week 1)

| Day | Task | Assignee |
|-----|------|----------|
| Mon | DB health check endpoint + RLS audit | Raj |
| Mon | Rate limiting + input validation on API routes | Dev |
| Tue | Website uptime check endpoint | Dev |
| Tue | CSP headers + auth middleware | Dev |
| Wed | Spend tracking endpoint | Raj |
| Wed | Dependabot + npm audit in CI | Dev |
| Thu | Consolidated health dashboard UI | Mia |
| Thu | Supabase network restriction + backup config | Raj |
| Fri | Auth integration (Supabase Auth) | Dev + Raj |
| Fri | Review + deploy all Phase 1 | Quinn |

### Phase 2 — Hardening (Week 2)

| Day | Task | Assignee |
|-----|------|----------|
| Mon | Repository health check | Dev |
| Mon | PII encryption at column level | Raj |
| Tue | Structured logging across all API routes | Dev |
| Tue | Uptime monitoring service (BetterUptime) | Dev |
| Wed | Role-based access control | Raj |
| Wed | Alert notification via Resend | Dev |
| Thu | OAuth providers (Google/GitHub) | Dev |
| Thu | Data retention + export flows | Raj |
| Fri | Full penetration test review | Quinn |
| Fri | Document incident response plan | Dev |

### Phase 3 — Continuous (Ongoing)

| Frequency | Task | Assignee |
|-----------|------|----------|
| Daily | Health check runs (automated) | — |
| Weekly | Dependency review + audit | Quinn |
| Monthly | API key rotation | Dev |
| Monthly | Budget review vs actual spend | Felix |
| Quarterly | Full RLS + security review | Raj |
| Quarterly | Penetration test | Quinn + Dev |

---

## PART 4: AGENT ASSIGNMENT SUMMARY

| Agent | Phase 1 | Phase 2 | Phase 3 |
|-------|---------|---------|---------|
| **Dev** | Rate limiting, uptime check, CSP headers, auth middleware, Dependabot, CI | Repo health, structured logging, uptime monitor, alerts, OAuth, IR doc | Key rotation, weekly audit |
| **Raj** | DB health, RLS audit, spend tracking, Supabase network, backups, Auth | Column encryption, RBAC, data retention, data export | Monthly budget review |
| **Mia** | Health dashboard UI | — | — |
| **Quinn** | Review + deploy phase 1 | Penetration test, security review | Dependency audit |
| **Felix** | — | — | Monthly budget vs actual |

---

## PART 5: COST ESTIMATE

| Service | Cost | Purpose |
|---------|------|---------|
| BetterUptime (free tier) | Free | External uptime monitoring |
| Upstash Redis (free tier) | Free | Rate limiting storage |
| Supabase (included in plan) | $0 | DB health (already paid for) |
| Vercel (included in plan) | $0 | Health endpoints (already hosting) |
| GitHub Dependabot | Free | Dependency scanning |
| Resend (free tier) | Free | 100 emails/day for alerts |

**Total additional cost: $0** — everything fits in existing free tiers.

---

## PART 6: SECURITY QUICK REFERENCE

| Area | ✅ Protected | ⚠️ Needs Work | ❌ Missing |
|------|------------|---------------|-----------|
| Data in transit | HTTPS (Vercel) | HSTS headers | — |
| Data at rest | Supabase AES-256 | — | Column-level PII encryption |
| Auth | — | Basic auth exists | Full Supabase Auth + MFA |
| API keys | Server-side only | — | Rotation schedule |
| Rate limiting | — | — | No rate limiting |
| SQL injection | Supabase client | — | Raw queries in migrations |
| XSS | Next.js built-in | — | — |
| CSP | — | — | No CSP headers |
| RLS | Partial | Full audit needed | — |
| Backups | Supabase daily | Point-in-time recovery | — |
| Dependency audit | — | — | No Dependabot or npm audit |
| Incident response | — | — | No documented process |
