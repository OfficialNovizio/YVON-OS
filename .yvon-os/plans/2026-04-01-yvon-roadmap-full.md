# YVON Roadmap — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 13 roadmap priorities — brand sidebar, Kai's decision layer, approval mechanism, daily session logs, brand intelligence pipeline, Scout sidebar, GitHub integration, weekly cost report, and roadmap view on CEO page.

**Architecture:** Next.js 15 App Router + Supabase Postgres for persistence + Anthropic SDK for AI routes. New Supabase tables: `decisions`, `daily_logs`. New API routes under `/app/api/`. New components under `/components/`. All external calls server-side only. No hardcoded colors — CSS variables only.

**Tech Stack:** Next.js 15, TypeScript strict, Tailwind + CSS variables, Supabase (service role server, anon client), Anthropic SDK, GitHub REST API, `@octokit/rest`

**Scout decision:** Keep Scout in sidebar and keep `/scout/page.tsx` — it already exists and is confirmed active.

---

## ⚠️ Scope Note
This plan covers 11 independent subsystems. Each Phase is independently deployable. Build and verify Phase 1 before starting Phase 2. Never start a new Phase with a failing build.

---

## Pre-flight: Read these files before starting any task
- `lib/types.ts` — all existing types
- `lib/db.ts` — all existing Supabase helpers
- `components/Sidebar.tsx` — current sidebar
- `app/ceo/page.tsx` — CEO dashboard
- `app/layout.tsx` — Shell wrapper

---

## Phase 1 — Foundation (P1-A + P1-B)
> **Done when:** Clicking a brand card in sidebar scopes entire app. Project Memory file exists.

---

### Task 1: Supabase Tables — Create `decisions` + `daily_logs`

**Files:**
- Create: `supabase/migrations/001_decisions_daily_logs.sql`

> Run this SQL in the Supabase Dashboard SQL editor. This is not code — it's a migration script.

- [ ] **Step 1: Write the migration SQL**

```sql
-- decisions table: approval workflow
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  decision_text TEXT NOT NULL,
  question TEXT,
  action_taken TEXT CHECK (action_taken IN ('approved', 'rejected', 'deferred')),
  urgency TEXT CHECK (urgency IN ('critical', 'today', 'this-week')) DEFAULT 'this-week',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS decisions_venture_created ON decisions (venture_id, created_at DESC);
CREATE INDEX IF NOT EXISTS decisions_unresolved ON decisions (venture_id) WHERE action_taken IS NULL;

-- daily_logs table: session persistence
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  task TEXT NOT NULL,
  outcome TEXT,
  notes TEXT,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS daily_logs_venture_date ON daily_logs (venture_id, log_date DESC);
```

- [ ] **Step 2: Run migration in Supabase Dashboard**
  - Go to Supabase → SQL Editor → paste + run
  - Verify: both tables appear in Table Editor
  - Expected: `decisions` table + `daily_logs` table with correct columns

- [ ] **Step 3: Commit the SQL file**
```bash
git add supabase/migrations/001_decisions_daily_logs.sql
git commit -m "feat: add decisions and daily_logs Supabase tables"
```

---

### Task 2: Types + DB Helpers for New Tables

**Files:**
- Modify: `lib/types.ts` (add Decision, DailyLog types)
- Modify: `lib/db.ts` (add CRUD helpers for both tables)

- [ ] **Step 1: Add types to `lib/types.ts`**

Add at the end of `lib/types.ts`:

```typescript
// ─── Decisions ────────────────────────────────────────────────────────────────

export type DecisionAction = 'approved' | 'rejected' | 'deferred'
export type DecisionUrgency = 'critical' | 'today' | 'this-week'

export interface Decision {
  id: string
  ventureId: string
  agentId: string
  decisionText: string
  question?: string
  actionTaken?: DecisionAction
  urgency: DecisionUrgency
  resolvedAt?: string
  createdAt: string
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export interface DailyLog {
  id: string
  ventureId: string
  agentId: string
  task: string
  outcome?: string
  notes?: string
  logDate: string
  createdAt: string
}
```

- [ ] **Step 2: Add db helpers to `lib/db.ts`**

Add after the last export in `lib/db.ts`:

```typescript
// ─── Decisions ────────────────────────────────────────────────────────────────

export async function getDecisions(
  ventureId: string,
  opts: { resolved?: boolean; limit?: number } = {}
): Promise<Decision[]> {
  let query = supabase
    .from('decisions')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50)

  if (opts.resolved === false) {
    query = query.is('action_taken', null)
  } else if (opts.resolved === true) {
    query = query.not('action_taken', 'is', null)
  }

  const { data } = await query
  return (data ?? []).map(row => ({
    id: row.id,
    ventureId: row.venture_id,
    agentId: row.agent_id,
    decisionText: row.decision_text,
    question: row.question ?? undefined,
    actionTaken: row.action_taken ?? undefined,
    urgency: row.urgency,
    resolvedAt: row.resolved_at ?? undefined,
    createdAt: row.created_at,
  }))
}

export async function createDecision(
  d: Omit<Decision, 'id' | 'createdAt' | 'resolvedAt' | 'actionTaken'>
): Promise<Decision> {
  const { data, error } = await supabase
    .from('decisions')
    .insert({
      venture_id: d.ventureId,
      agent_id: d.agentId,
      decision_text: d.decisionText,
      question: d.question,
      urgency: d.urgency,
    })
    .select('*')
    .single()
  if (error || !data) throw new Error('Failed to create decision')
  return {
    id: data.id,
    ventureId: data.venture_id,
    agentId: data.agent_id,
    decisionText: data.decision_text,
    question: data.question ?? undefined,
    urgency: data.urgency,
    createdAt: data.created_at,
  }
}

export async function resolveDecision(
  id: string,
  action: DecisionAction
): Promise<void> {
  await supabase
    .from('decisions')
    .update({ action_taken: action, resolved_at: new Date().toISOString() })
    .eq('id', id)
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export async function getDailyLogs(
  ventureId: string,
  opts: { days?: number } = {}
): Promise<DailyLog[]> {
  const since = new Date()
  since.setDate(since.getDate() - (opts.days ?? 7))

  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('venture_id', ventureId)
    .gte('log_date', since.toISOString().split('T')[0])
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false })

  return (data ?? []).map(row => ({
    id: row.id,
    ventureId: row.venture_id,
    agentId: row.agent_id,
    task: row.task,
    outcome: row.outcome ?? undefined,
    notes: row.notes ?? undefined,
    logDate: row.log_date,
    createdAt: row.created_at,
  }))
}

export async function appendDailyLog(
  log: Omit<DailyLog, 'id' | 'createdAt'>
): Promise<void> {
  await supabase.from('daily_logs').insert({
    venture_id: log.ventureId,
    agent_id: log.agentId,
    task: log.task,
    outcome: log.outcome,
    notes: log.notes,
    log_date: log.logDate,
  })
}
```

- [ ] **Step 3: Add missing imports to `lib/db.ts`**

At the top of `lib/db.ts`, ensure the import line includes the new types:
```typescript
import type {
  // ... existing imports ...
  Decision,
  DecisionAction,
  DailyLog,
} from '@/lib/types'
```

- [ ] **Step 4: Run TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 5: Commit**
```bash
git add lib/types.ts lib/db.ts
git commit -m "feat: add Decision and DailyLog types + db helpers"
```

---

### Task 3: Brand Sidebar — Venture Cards + Venture Cookie Writer

**What this does:** Replace the current plain text "Brands" link in the Sidebar with actual brand cards. Clicking a brand card sets the `yvon_active_venture` cookie and highlights the active brand. Scout stays in Quick Access.

**Files:**
- Modify: `components/Sidebar.tsx`
- Create: `app/api/set-venture/route.ts`

- [ ] **Step 1: Create `app/api/set-venture/route.ts`**

```typescript
import { cookies } from 'next/headers'

export async function POST(request: Request): Promise<Response> {
  let ventureSlug: string
  try {
    const body = await request.json() as { ventureSlug?: string }
    ventureSlug = body.ventureSlug ?? ''
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!ventureSlug) {
    return Response.json({ error: 'ventureSlug is required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set('yvon_active_venture', ventureSlug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false, // must be readable client-side for VentureSwitcher
    sameSite: 'lax',
  })

  return Response.json({ ok: true, ventureSlug })
}
```

- [ ] **Step 2: Create `components/BrandCard.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'

interface BrandCardProps {
  slug: string
  name: string
  color: string
  active: boolean
}

export default function BrandCard({ slug, name, color, active }: BrandCardProps) {
  const router = useRouter()

  async function handleClick() {
    await fetch('/api/set-venture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventureSlug: slug }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      aria-pressed={active}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '8px 12px',
        background: active ? 'var(--b2)' : 'none',
        border: `1px solid ${active ? color : 'transparent'}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '11px',
          color: active ? 'var(--br)' : 'var(--tx)',
          letterSpacing: '0.04em',
        }}
      >
        {name}
      </span>
      {active && (
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '8px',
            color: color,
            letterSpacing: '0.08em',
          }}
        >
          ACTIVE
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 3: Update `components/Sidebar.tsx` — add brands section and keep Scout**

Replace the existing `QUICK_ACCESS` array and add a `BRANDS` constant at the top:

```typescript
const BRANDS = [
  { slug: 'novizio',  name: 'Novizio',  color: 'var(--br)' },
  { slug: 'hourbour', name: 'Hourbour', color: '#4A6A9A' },
]

const QUICK_ACCESS = [
  { label: 'War Room',  href: '/war-room' },
  { label: 'CEO Inbox', href: '/inbox' },
  { label: 'Scout',     href: '/scout' },
  { label: 'Team',      href: '/team' },
  { label: 'Settings',  href: '/settings' },
]
```

The `Sidebar` component must become a client component to read the active venture cookie. Update the component signature:

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BrandCard from '@/components/BrandCard'

// ... BRANDS, DASHBOARDS, QUICK_ACCESS, AGENTS constants ...

export default function Sidebar() {
  const pathname = usePathname()
  const [activeVenture, setActiveVenture] = useState('novizio')

  useEffect(() => {
    // Read cookie client-side
    const match = document.cookie.match(/yvon_active_venture=([^;]+)/)
    if (match) setActiveVenture(match[1])
  }, [])

  return (
    <aside className="shell-sidebar">
      <SectionLabel>Brands</SectionLabel>
      {BRANDS.map(b => (
        <BrandCard
          key={b.slug}
          slug={b.slug}
          name={b.name}
          color={b.color}
          active={activeVenture === b.slug}
        />
      ))}

      <SectionLabel>Dashboards</SectionLabel>
      {DASHBOARDS.map(d => {
        const active = pathname === d.href || pathname.startsWith(d.href + '/')
        return (
          <Link key={d.href} href={d.href} style={{ textDecoration: 'none' }}>
            <div className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}>
              {d.label}
            </div>
          </Link>
        )
      })}

      <SectionLabel>Quick Access</SectionLabel>
      {QUICK_ACCESS.map(d => {
        const active = pathname === d.href
        return (
          <Link key={d.href} href={d.href} style={{ textDecoration: 'none' }}>
            <div className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}>
              {d.label}
            </div>
          </Link>
        )
      })}

      <SectionLabel>AI Team</SectionLabel>
      {AGENTS.map(a => (
        <Link key={a.id} href={`/agents/${a.id}`} style={{ textDecoration: 'none' }}>
          <div className="sidebar-item" style={{ gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px' }}>{a.name}</span>
            <span style={{ fontSize: '10px', color: 'var(--mu)', marginLeft: 'auto' }}>{a.role}</span>
          </div>
        </Link>
      ))}

      <div style={{ height: '24px' }} />
    </aside>
  )
}
```

Also remove 'Personal' from QUICK_ACCESS (keep Scout).

- [ ] **Step 4: Run TypeScript + lint check**
```bash
npx tsc --noEmit && npm run lint
```
Expected: 0 errors

- [ ] **Step 5: Manual browser test**
  - Start dev server: `npm run dev`
  - Go to `localhost:3000`
  - Click "Hourbour" brand card → verify card shows ACTIVE badge
  - Refresh page → verify Hourbour still shows as active
  - Click "Novizio" → verify switches back

- [ ] **Step 6: Commit**
```bash
git add components/Sidebar.tsx components/BrandCard.tsx app/api/set-venture/route.ts
git commit -m "feat: brand sidebar with clickable venture cards + venture cookie writer"
```

---

### Task 4: Project Memory File (P1-B)

**What this does:** Creates the project-memory directory and initial PROJECT-MEMORY.md file. This is a protocol file — not application code.

**Files:**
- Create: `project-memory/PROJECT-MEMORY.md`

- [ ] **Step 1: Create `project-memory/PROJECT-MEMORY.md`**

```markdown
# YVON Project Memory
> Append at every session close. Session start: scan for agents relevant to today's task.
> Format: [YYYY-MM-DD] | [agent-id] | [task] | [outcome] | [notes]

## How to use
At session close: append one line per active agent.
At session start: search this file for the keyword of today's task. Load only matching agents.

## Log
<!-- append below this line -->
| 2026-04-01 | all-agents | Personality profiles + self-improvement protocol | Shipped | All 13 SKILLS.md + MEMORY.md updated |
```

- [ ] **Step 2: Commit**
```bash
git add project-memory/PROJECT-MEMORY.md
git commit -m "feat: create project memory file for selective agent loading"
```

---

## Phase 2 — Intelligence Layer (P2-A + P2-B)
> **Done when:** Every analytics/social page shows a "Kai's Read" card with data → insight → action.

---

### Task 5: Kai's Read API Route

**What this does:** POST endpoint that takes raw metrics for a venture, runs them through Kai's system prompt, and returns 3-line analysis: what happened / why it matters / what to do.

**Files:**
- Create: `app/api/kai-read/route.ts`

- [ ] **Step 1: Create `app/api/kai-read/route.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { getAgent } from '@/lib/agents'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let body: { metrics?: Record<string, unknown>; ventureId?: string; ventureName?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { metrics = {}, ventureId = 'novizio', ventureName = 'Novizio' } = body

  const kai = getAgent('kai-analyst')
  if (!kai) return Response.json({ error: 'Kai agent not found' }, { status: 500 })

  const prompt = `${kai.systemPrompt}

You are reviewing the latest metrics for ${ventureName}.

DATA:
${JSON.stringify(metrics, null, 2)}

Return a JSON object with exactly these keys:
{
  "what": "one sentence: what happened in the data",
  "why": "one sentence: why this matters",
  "action": "one sentence: the single most important action to take",
  "confidence": "high" | "medium" | "low"
}

Return ONLY valid JSON. No markdown, no explanation.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return Response.json({ error: 'AI returned invalid JSON', raw }, { status: 502 })
    }

    return Response.json(parsed)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Commit**
```bash
git add app/api/kai-read/route.ts
git commit -m "feat: /api/kai-read — Kai analysis endpoint for decision layer"
```

---

### Task 6: KaiRead Component

**What this does:** A reusable card component that calls `/api/kai-read` with the page's current metrics and renders the 3-line analysis.

**Files:**
- Create: `components/KaiRead.tsx`
- Modify: `app/analytics/page.tsx` (add KaiRead card)

- [ ] **Step 1: Create `components/KaiRead.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'

interface KaiReadProps {
  metrics: Record<string, unknown>
  ventureId: string
  ventureName: string
}

interface KaiAnalysis {
  what: string
  why: string
  action: string
  confidence: 'high' | 'medium' | 'low'
}

const CONFIDENCE_COLOR = {
  high: 'var(--gn)',
  medium: 'var(--am)',
  low: 'var(--rd)',
}

export default function KaiRead({ metrics, ventureId, ventureName }: KaiReadProps) {
  const [analysis, setAnalysis] = useState<KaiAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (Object.keys(metrics).length === 0) return
    void fetchAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventureId])

  async function fetchAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/kai-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, ventureId, ventureName }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json() as KaiAnalysis
      setAnalysis(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(59,130,246,0.04)',
      border: '1px solid rgba(59,130,246,0.2)',
      padding: '16px 18px',
      marginBottom: '20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '9px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#3B82F6',
        }}>
          Kai&apos;s Read
        </div>
        <button
          onClick={fetchAnalysis}
          disabled={loading}
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '9px',
            letterSpacing: '0.08em',
            background: 'none',
            border: '1px solid var(--b2)',
            color: 'var(--di)',
            padding: '3px 8px',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Analysing...' : 'Refresh →'}
        </button>
      </div>

      {/* Content */}
      {loading && !analysis && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)' }}>
          Kai is reading the data...
        </div>
      )}

      {error && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--rd)' }}>
          {error}
        </div>
      )}

      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px', alignItems: 'start' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', paddingTop: '2px' }}>WHAT</span>
            <span style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.6 }}>{analysis.what}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px', alignItems: 'start' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', paddingTop: '2px' }}>WHY</span>
            <span style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.6 }}>{analysis.why}</span>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px', alignItems: 'start',
            borderTop: '1px solid var(--b1)', paddingTop: '8px',
          }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#3B82F6', paddingTop: '2px' }}>DO</span>
            <span style={{ fontSize: '12px', color: 'var(--br)', lineHeight: 1.6, fontWeight: 500 }}>
              {analysis.action}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '8px',
              color: CONFIDENCE_COLOR[analysis.confidence],
              letterSpacing: '0.08em',
            }}>
              {analysis.confidence.toUpperCase()} CONFIDENCE
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire KaiRead into `app/analytics/page.tsx`**

At the top of the analytics page data section, add:
```tsx
<KaiRead
  metrics={analyticsData ?? {}}
  ventureId={ventureId}
  ventureName={ventureName}
/>
```
Import: `import KaiRead from '@/components/KaiRead'`

> Note: Check what variable names the analytics page already uses for its data. Map the existing data object to the `metrics` prop.

- [ ] **Step 3: TypeScript check + lint**
```bash
npx tsc --noEmit && npm run lint
```
Expected: 0 errors

- [ ] **Step 4: Browser test**
  - Navigate to `/analytics`
  - Verify Kai's Read card appears at top
  - Verify "Refresh →" button calls `/api/kai-read` and updates card
  - Verify loading state shows "Analysing..."

- [ ] **Step 5: Commit**
```bash
git add components/KaiRead.tsx app/analytics/page.tsx
git commit -m "feat: KaiRead component — data → insight → action card on analytics page"
```

---

### Task 7: WebSearch Tool Wiring into `/api/claude`

**What this does:** Agents with `webSearch: true` in their config get the `web_search_20250305` Anthropic tool wired into their API calls. Marcus, Kai, Rio, Felix are the 4 search-enabled agents.

**Files:**
- Modify: `lib/types.ts` (add `webSearch` to AgentConfig)
- Modify: `lib/agents.ts` (set `webSearch: true` on 4 agents)
- Modify: `app/api/claude/route.ts` (conditionally add tool)

- [ ] **Step 1: Add `webSearch` to `AgentConfig` in `lib/types.ts`**

In the `AgentConfig` interface, add:
```typescript
export interface AgentConfig {
  // ... existing fields ...
  webSearch?: boolean
}
```

- [ ] **Step 2: Add `webSearch: true` to 4 agents in `lib/agents.ts`**

Find each of the 4 agents and add the property:
- `marcus-ceo`: add `webSearch: true`
- `kai-analyst`: add `webSearch: true`
- `rio-ads`: add `webSearch: true`
- `felix-finance`: add `webSearch: true`

- [ ] **Step 3: Read `app/api/claude/route.ts` to understand current structure**

Read the file before modifying it.

- [ ] **Step 4: Modify `app/api/claude/route.ts` to add web search tool**

In the route handler, after resolving the agent config, add tool injection:

```typescript
import { getAgent } from '@/lib/agents'

// In the handler, after getting agentId:
const agentConfig = agentId ? getAgent(agentId as AgentId) : null
const useWebSearch = agentConfig?.webSearch === true

// When building the messages.create call, conditionally add tools:
const createParams: Parameters<typeof client.messages.create>[0] = {
  model,
  max_tokens: 2048,
  system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
  messages: [{ role: 'user', content: userMessage }],
  ...(useWebSearch && {
    tools: [{
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 3,
    }],
  }),
  stream: true,
}
```

> IMPORTANT: The `web_search_20250305` tool is an Anthropic-native tool. It does not require an external API key. It is only available on Sonnet models. Verify the agent's model is `claude-sonnet-4-6` before enabling.

- [ ] **Step 5: Handle tool_use blocks in the SSE stream**

The stream response must handle both `text_delta` and `tool_result` event types when web search is active. Ensure the existing stream handler forwards only text to the client (tool_use/tool_result blocks are handled server-side by the Anthropic SDK in streaming mode).

- [ ] **Step 6: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 7: Browser test**
  - Open `/agents/marcus-ceo`
  - Ask: "What is the current benchmark CAC for DTC fashion brands?"
  - Verify Marcus responds with cited web data (not hallucinated)
  - Check network tab: confirm `/api/claude` called with tool params

- [ ] **Step 8: Commit**
```bash
git add lib/types.ts lib/agents.ts app/api/claude/route.ts
git commit -m "feat: web search tool wired into /api/claude for 4 WebSearch-enabled agents"
```

---

## Phase 3 — Action & Approval (P3-A + P3-B)
> **Done when:** You can approve a decision in /inbox and it's logged to Supabase.

---

### Task 8: Decisions API Route

**Files:**
- Create: `app/api/decisions/route.ts`

- [ ] **Step 1: Create `app/api/decisions/route.ts`**

```typescript
import { getDecisions, createDecision, resolveDecision } from '@/lib/db'
import type { DecisionAction, DecisionUrgency } from '@/lib/types'
import { cookies } from 'next/headers'

export async function GET(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { searchParams } = new URL(request.url)
  const resolved = searchParams.get('resolved')

  try {
    const decisions = await getDecisions(ventureId, {
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      limit: 20,
    })
    return Response.json({ decisions })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: {
    agentId?: string
    decisionText?: string
    question?: string
    urgency?: DecisionUrgency
  }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.agentId || !body.decisionText) {
    return Response.json({ error: 'agentId and decisionText are required' }, { status: 400 })
  }

  try {
    const decision = await createDecision({
      ventureId,
      agentId: body.agentId,
      decisionText: body.decisionText,
      question: body.question,
      urgency: body.urgency ?? 'this-week',
    })
    return Response.json({ decision })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function PATCH(request: Request): Promise<Response> {
  let body: { id?: string; action?: DecisionAction }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.id || !body.action) {
    return Response.json({ error: 'id and action are required' }, { status: 400 })
  }

  const validActions: DecisionAction[] = ['approved', 'rejected', 'deferred']
  if (!validActions.includes(body.action)) {
    return Response.json({ error: 'action must be approved, rejected, or deferred' }, { status: 400 })
  }

  try {
    await resolveDecision(body.id, body.action)
    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add app/api/decisions/route.ts
git commit -m "feat: /api/decisions CRUD route — GET, POST, PATCH (approve/reject/defer)"
```

---

### Task 9: DecisionCard Component + Wire into CEO Page

**Files:**
- Create: `components/DecisionCard.tsx`
- Modify: `app/ceo/page.tsx` (replace static decisions with live Supabase decisions)

- [ ] **Step 1: Create `components/DecisionCard.tsx`**

```typescript
'use client'

import type { Decision, DecisionAction } from '@/lib/types'

interface DecisionCardProps {
  decision: Decision
  onAction: (id: string, action: DecisionAction) => void
  resolving?: boolean
}

const URGENCY_COLOR: Record<string, string> = {
  critical: 'var(--rd)',
  today: 'var(--am)',
  'this-week': 'var(--bl)',
}

const URGENCY_LABEL: Record<string, string> = {
  critical: 'ACT NOW',
  today: 'TODAY',
  'this-week': 'THIS WEEK',
}

export default function DecisionCard({ decision, onAction, resolving }: DecisionCardProps) {
  const resolved = !!decision.actionTaken
  const color = URGENCY_COLOR[decision.urgency] ?? 'var(--di)'

  return (
    <div
      style={{
        background: 'var(--sf)',
        border: '1px solid var(--b1)',
        borderLeft: `3px solid ${color}`,
        padding: '18px 20px',
        opacity: resolved ? 0.45 : 1,
        transition: 'opacity 0.35s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', color }}>
            {URGENCY_LABEL[decision.urgency]}
          </span>
          <span style={{ color: 'var(--b3)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>
            {decision.agentId.replace('-', ' ').toUpperCase()}
          </span>
        </div>
        {resolved && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--gn)' }}>
            ✓ {decision.actionTaken}
          </span>
        )}
      </div>

      {/* Text */}
      <div style={{ fontSize: '13px', color: 'var(--tx)', lineHeight: 1.65, marginBottom: '10px' }}>
        {decision.decisionText}
      </div>

      {/* Question */}
      {decision.question && (
        <div style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
          color: 'var(--br)', marginBottom: resolved ? 0 : '14px',
          letterSpacing: '0.02em',
        }}>
          → {decision.question}
        </div>
      )}

      {/* Action buttons */}
      {!resolved && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['approved', 'deferred', 'rejected'] as DecisionAction[]).map(action => (
            <button
              key={action}
              onClick={() => onAction(decision.id, action)}
              disabled={resolving}
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                letterSpacing: '0.06em',
                padding: '6px 14px',
                background: action === 'approved' ? 'var(--b2)' : 'none',
                border: `1px solid ${action === 'approved' ? 'var(--b3)' : 'var(--b2)'}`,
                color: action === 'approved' ? 'var(--br)' : action === 'rejected' ? 'var(--rd)' : 'var(--di)',
                cursor: resolving ? 'default' : 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `app/ceo/page.tsx` — replace static DECISIONS with live Supabase data**

Add a `useEffect` to fetch decisions from `/api/decisions?resolved=false` on mount:

```typescript
// Replace static DECISIONS constant usage with:
const [decisions, setDecisions] = useState<Decision[]>([])
const [resolving, setResolving] = useState(false)

useEffect(() => {
  void fetchDecisions()
}, [])

async function fetchDecisions() {
  try {
    const res = await fetch('/api/decisions?resolved=false')
    const data = await res.json() as { decisions: Decision[] }
    setDecisions(data.decisions ?? [])
  } catch { /* keep existing static fallback */ }
}

async function handleDecisionAction(id: string, action: DecisionAction) {
  setResolving(true)
  try {
    await fetch('/api/decisions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    await fetchDecisions()
  } finally {
    setResolving(false)
  }
}
```

Replace the static Decision cards in the JSX with:
```tsx
{decisions.length === 0 ? (
  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--mu)', padding: '16px 0' }}>
    No pending decisions.
  </div>
) : decisions.map(d => (
  <DecisionCard
    key={d.id}
    decision={d}
    onAction={handleDecisionAction}
    resolving={resolving}
  />
))}
```

- [ ] **Step 3: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Browser test**
  - Go to `/ceo`
  - Decision Queue should load from Supabase (empty initially — that's correct)
  - Manually insert a test row in Supabase: `INSERT INTO decisions (venture_id, agent_id, decision_text, urgency) VALUES ('novizio', 'kai-analyst', 'Test decision', 'today');`
  - Refresh page — verify card appears
  - Click "approved" — verify card fades out + Supabase row updated

- [ ] **Step 5: Commit**
```bash
git add components/DecisionCard.tsx app/ceo/page.tsx
git commit -m "feat: DecisionCard component + live decisions from Supabase on CEO page"
```

---

### Task 10: Agent Log API Route + Daily Session Persistence (P3-B)

**Files:**
- Create: `app/api/agent-log/route.ts`

- [ ] **Step 1: Create `app/api/agent-log/route.ts`**

```typescript
import { appendDailyLog, getDailyLogs } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') ?? '7', 10)

  try {
    const logs = await getDailyLogs(ventureId, { days })
    return Response.json({ logs })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: {
    agentId?: string
    task?: string
    outcome?: string
    notes?: string
    logDate?: string
  }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.agentId || !body.task) {
    return Response.json({ error: 'agentId and task are required' }, { status: 400 })
  }

  try {
    await appendDailyLog({
      ventureId,
      agentId: body.agentId,
      task: body.task,
      outcome: body.outcome,
      notes: body.notes,
      logDate: body.logDate ?? new Date().toISOString().split('T')[0],
    })
    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add app/api/agent-log/route.ts
git commit -m "feat: /api/agent-log — daily session log GET + POST to Supabase"
```

---

## Phase 4 — Content Intelligence (P4-A + P4-B)
> **Done when:** One click on /creative generates a content brief from real social data. Scout stays in sidebar.

---

### Task 11: Brand Intelligence Pipeline API

**What this does:** Fetches latest social stats for the active venture, runs Kai analysis, then Lena generates content brief. One endpoint, three AI calls, one output.

**Files:**
- Create: `app/api/brand-intelligence/route.ts`

- [ ] **Step 1: Create `app/api/brand-intelligence/route.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { getSocialStats } from '@/lib/db'
import { getAgent } from '@/lib/agents'
import { cookies } from 'next/headers'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: { ventureName?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    body = {}
  }
  const ventureName = body.ventureName ?? 'Novizio'

  // Step 1: Fetch social stats
  const [ig, yt, li] = await Promise.all([
    getSocialStats(ventureId, 'instagram').catch(() => null),
    getSocialStats(ventureId, 'youtube').catch(() => null),
    getSocialStats(ventureId, 'linkedin').catch(() => null),
  ])

  const socialData = { instagram: ig, youtube: yt, linkedin: li }

  // Step 2: Kai reads the data
  const kai = getAgent('kai-analyst')!
  const kaiResponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `${kai.systemPrompt}

Analyse this social data for ${ventureName} and return JSON:
${JSON.stringify(socialData, null, 2)}

Return: { "topInsight": "one sentence", "contentOpportunity": "one sentence", "urgency": "high|medium|low" }
Return ONLY valid JSON.`,
    }],
  })

  let kaiInsight: { topInsight: string; contentOpportunity: string; urgency: string } = {
    topInsight: 'Insufficient data for analysis.',
    contentOpportunity: 'Refresh social stats to get content recommendations.',
    urgency: 'low',
  }
  try {
    const raw = kaiResponse.content[0]?.type === 'text' ? kaiResponse.content[0].text : '{}'
    kaiInsight = JSON.parse(raw) as typeof kaiInsight
  } catch { /* keep default */ }

  // Step 3: Lena drafts content brief
  const lena = getAgent('lena-brand')!
  const lenaResponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `${lena.systemPrompt}

Venture: ${ventureName}
Kai's insight: ${kaiInsight.topInsight}
Content opportunity: ${kaiInsight.contentOpportunity}

Generate a content brief as JSON:
{
  "headline": "content hook/headline",
  "format": "reel | carousel | post",
  "platform": "instagram | linkedin",
  "angle": "the core narrative angle in one sentence",
  "caption": "full ready-to-post caption",
  "cta": "call to action"
}
Return ONLY valid JSON.`,
    }],
  })

  let brief: Record<string, string> = {}
  try {
    const raw = lenaResponse.content[0]?.type === 'text' ? lenaResponse.content[0].text : '{}'
    brief = JSON.parse(raw) as Record<string, string>
  } catch { /* keep empty */ }

  return Response.json({
    socialData,
    kaiInsight,
    brief,
    generatedAt: new Date().toISOString(),
  })
}
```

- [ ] **Step 2: Add "Generate Brief" button to `app/creative/page.tsx` (or equivalent creative page)**

Read the creative page first. Add a section that calls `/api/brand-intelligence` and renders the result.

```tsx
// Add to creative page:
const [intelligence, setIntelligence] = useState<BrandIntelligence | null>(null)
const [generating, setGenerating] = useState(false)

async function generateBrief() {
  setGenerating(true)
  try {
    const res = await fetch('/api/brand-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventureName: activeName }),
    })
    const data = await res.json() as BrandIntelligence
    setIntelligence(data)
  } finally {
    setGenerating(false)
  }
}
```

- [ ] **Step 3: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**
```bash
git add app/api/brand-intelligence/route.ts app/creative/page.tsx
git commit -m "feat: brand intelligence pipeline — social stats → Kai insight → Lena content brief"
```

---

### Task 12: Confirm Scout Page Works (P4-B)

**What this does:** Scout already exists at `/scout/page.tsx` and is already in Sidebar Quick Access. Verify it's fully functional.

- [ ] **Step 1: Navigate to `/scout`**
  - Verify page loads without errors
  - Verify it reads active venture (check for `yvon_active_venture` cookie usage)
  - If venture context is missing: add `useEffect` to read cookie and pass ventureId to Kai

- [ ] **Step 2: Verify Scout is in Sidebar**
  - Check `QUICK_ACCESS` array in `components/Sidebar.tsx` includes `{ label: 'Scout', href: '/scout' }`
  - Confirm it wasn't accidentally removed in Task 3

- [ ] **Step 3: Commit if any fixes needed**
```bash
git add app/scout/page.tsx components/Sidebar.tsx
git commit -m "fix: confirm Scout page active and venture-scoped"
```

---

## Phase 5 — Autonomy (P5-A)
> **Done when:** Dev can read a GitHub repo, propose a code fix diff in /technical, and Stark approves it which triggers a push.

---

### Task 13: GitHub Integration — Read + Propose + Push with Approval Gate

**Files:**
- Create: `app/api/github/route.ts`
- Modify: `app/technical/page.tsx` (add "Propose Change" panel)

**Environment variable required:** `GITHUB_TOKEN` (Personal Access Token with repo scope) — add to `.env.local` and Vercel environment.

- [ ] **Step 1: Add `GITHUB_TOKEN` to `.env.local`**
```
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO_OWNER=your-github-username
GITHUB_REPO_NAME=YVON
```

- [ ] **Step 2: Create `app/api/github/route.ts`**

```typescript
import { Octokit } from '@octokit/rest'

function getOctokit() {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set')
  return new Octokit({ auth: process.env.GITHUB_TOKEN })
}

const OWNER = process.env.GITHUB_REPO_OWNER ?? ''
const REPO  = process.env.GITHUB_REPO_NAME ?? ''

// GET: read file content from repo
export async function GET(request: Request): Promise<Response> {
  if (!process.env.GITHUB_TOKEN) {
    return Response.json({ error: 'GITHUB_TOKEN not set' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') ?? ''
  if (!path) return Response.json({ error: 'path is required' }, { status: 400 })

  try {
    const octokit = getOctokit()
    const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path })

    if ('content' in data && typeof data.content === 'string') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      return Response.json({ path, content, sha: data.sha })
    }
    return Response.json({ error: 'Not a file' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

// POST: propose a change (creates branch + returns diff preview — does NOT push yet)
export async function POST(request: Request): Promise<Response> {
  if (!process.env.GITHUB_TOKEN) {
    return Response.json({ error: 'GITHUB_TOKEN not set' }, { status: 500 })
  }

  let body: {
    path?: string
    originalContent?: string
    proposedContent?: string
    commitMessage?: string
    branchName?: string
  }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.path || !body.proposedContent || !body.commitMessage) {
    return Response.json({ error: 'path, proposedContent, commitMessage required' }, { status: 400 })
  }

  // Return proposal for Stark to review — does NOT create branch yet
  const diff = generateDiff(body.originalContent ?? '', body.proposedContent)

  return Response.json({
    proposal: {
      path: body.path,
      proposedContent: body.proposedContent,
      diff,
      commitMessage: body.commitMessage,
      branchName: body.branchName ?? `yvon-ai/${Date.now()}`,
    },
    status: 'pending_approval',
  })
}

// PATCH: Stark approves — actually creates branch and commits
export async function PATCH(request: Request): Promise<Response> {
  if (!process.env.GITHUB_TOKEN) {
    return Response.json({ error: 'GITHUB_TOKEN not set' }, { status: 500 })
  }

  let body: {
    path?: string
    proposedContent?: string
    commitMessage?: string
    branchName?: string
    fileSha?: string
  }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.path || !body.proposedContent || !body.commitMessage) {
    return Response.json({ error: 'path, proposedContent, commitMessage required' }, { status: 400 })
  }

  try {
    const octokit = getOctokit()
    const branchName = body.branchName ?? `yvon-ai/${Date.now()}`

    // Get main branch SHA
    const { data: ref } = await octokit.git.getRef({
      owner: OWNER, repo: REPO, ref: 'heads/main',
    })
    const mainSha = ref.object.sha

    // Create branch
    await octokit.git.createRef({
      owner: OWNER, repo: REPO,
      ref: `refs/heads/${branchName}`,
      sha: mainSha,
    })

    // Commit file to new branch
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO,
      path: body.path,
      message: body.commitMessage,
      content: Buffer.from(body.proposedContent).toString('base64'),
      branch: branchName,
      ...(body.fileSha && { sha: body.fileSha }),
    })

    // Open PR
    const { data: pr } = await octokit.pulls.create({
      owner: OWNER, repo: REPO,
      title: body.commitMessage,
      head: branchName,
      base: 'main',
      body: `Auto-proposed by YVON AI Dev team.\n\n**Approved by Stark** via YVON Dashboard.`,
    })

    return Response.json({ ok: true, prUrl: pr.html_url, branch: branchName })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

function generateDiff(original: string, proposed: string): string {
  const oldLines = original.split('\n')
  const newLines = proposed.split('\n')
  const lines: string[] = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i]
    const n = newLines[i]
    if (o === n) {
      lines.push(`  ${o ?? ''}`)
    } else {
      if (o !== undefined) lines.push(`- ${o}`)
      if (n !== undefined) lines.push(`+ ${n}`)
    }
  }
  return lines.join('\n')
}
```

- [ ] **Step 3: Install `@octokit/rest`**
```bash
npm install @octokit/rest
```

- [ ] **Step 4: Add `GITHUB_TOKEN` to `.env.local` reference file**

Add to `reference/ENV.md`:
```
GITHUB_TOKEN=              # GitHub PAT (repo scope) — for Dev agent GitHub integration
GITHUB_REPO_OWNER=         # GitHub username/org
GITHUB_REPO_NAME=YVON      # Repo name
```

- [ ] **Step 5: Add GitHub Propose panel to `/technical` page**

Read `app/technical/page.tsx` first. Add a "Dev Proposal" tab or section:

```tsx
// GitHub proposal section
const [proposal, setProposal] = useState<GitHubProposal | null>(null)

async function approveProposal() {
  if (!proposal) return
  const res = await fetch('/api/github', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proposal),
  })
  const data = await res.json() as { prUrl: string }
  window.open(data.prUrl, '_blank')
}
```

Render the diff preview + Approve button when `proposal` is set.

- [ ] **Step 6: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 7: Test**
  - POST to `/api/github` with a test path + proposed content
  - Verify proposal object returns with diff
  - PATCH with the proposal — verify branch + PR created in GitHub
  - Verify no changes happen without the PATCH (proposal is non-destructive)

- [ ] **Step 8: Commit**
```bash
git add app/api/github/route.ts app/technical/page.tsx reference/ENV.md package.json package-lock.json
git commit -m "feat: GitHub integration — read/propose/approve-push with safety gate"
```

---

## Phase 6 — Financial Visibility (P6-A)
> **Done when:** Felix delivers weekly API cost report in Monday CEO brief.

---

### Task 14: Weekly API Cost API Route

**What this does:** Aggregates token usage from the `token_usage` Supabase table (already being written to) and returns weekly totals by service.

**Files:**
- Create: `app/api/api-costs/route.ts`
- Modify: `app/api/briefing/route.ts` (add cost section to Monday brief)

- [ ] **Step 1: Create `app/api/api-costs/route.ts`**

```typescript
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') ?? '7', 10)

  const since = new Date()
  since.setDate(since.getDate() - days)

  try {
    const { data, error } = await supabase
      .from('token_usage')
      .select('model, route, input_tokens, output_tokens, cache_read_tokens, cost_usd, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = data ?? []

    // Aggregate by model
    const byModel: Record<string, { calls: number; inputTokens: number; outputTokens: number; costUsd: number }> = {}
    let totalCost = 0

    for (const row of rows) {
      const m = row.model as string
      if (!byModel[m]) byModel[m] = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 }
      byModel[m].calls++
      byModel[m].inputTokens += (row.input_tokens as number) ?? 0
      byModel[m].outputTokens += (row.output_tokens as number) ?? 0
      byModel[m].costUsd += (row.cost_usd as number) ?? 0
      totalCost += (row.cost_usd as number) ?? 0
    }

    return Response.json({
      period: `last_${days}_days`,
      totalCostUsd: Math.round(totalCost * 10000) / 10000,
      totalCalls: rows.length,
      byModel,
      since: since.toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
```

- [ ] **Step 2: Read `app/api/briefing/route.ts`**

Read the briefing route first to understand its structure.

- [ ] **Step 3: Add cost section to Monday CEO brief**

In `app/api/briefing/route.ts`, before generating the brief content, add cost data fetch on Mondays:

```typescript
// Inside briefing generation, detect if it's Monday
const isMonday = new Date().getDay() === 1

let costSection = ''
if (isMonday) {
  try {
    const costsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/api-costs?days=7`)
    const costs = await costsRes.json() as { totalCostUsd: number; totalCalls: number }
    costSection = `\n\nAPI COSTS (last 7 days): $${costs.totalCostUsd.toFixed(4)} across ${costs.totalCalls} calls.`
  } catch { /* non-critical — skip cost section if unavailable */ }
}
```

Append `costSection` to the brief prompt.

- [ ] **Step 4: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 5: Test**
  - Hit `GET /api/api-costs?days=7`
  - Verify JSON response with `totalCostUsd`, `byModel`
  - Verify Monday brief includes cost section

- [ ] **Step 6: Commit**
```bash
git add app/api/api-costs/route.ts app/api/briefing/route.ts
git commit -m "feat: weekly API cost report — /api/api-costs + Monday CEO brief integration"
```

---

## Phase 7 — Roadmap View (P7-A)
> **Done when:** CEO page shows a "Roadmap Pulse" section with top 3 in-flight items + pending decisions count.

---

### Task 15: Roadmap API Route + CEO Page Section

**What this does:** Reads roadmap items from a Supabase table (or parses ROADMAP.md for initial data). Surfaces top 3 in-flight items + pending decision count on CEO page.

**Files:**
- Create: `supabase/migrations/002_roadmap_items.sql`
- Create: `app/api/roadmap/route.ts`
- Modify: `app/ceo/page.tsx` (add Roadmap Pulse section)

- [ ] **Step 1: Create roadmap_items table migration**

```sql
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  priority TEXT NOT NULL,        -- e.g. 'P1-A', 'P2-B'
  status TEXT NOT NULL DEFAULT 'scoped' CHECK (status IN ('scoped', 'in-flight', 'shipped')),
  dri TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with current roadmap state
INSERT INTO roadmap_items (title, priority, status, dri) VALUES
  ('Brand Sidebar + Venture Scoping', 'P1-A', 'shipped', 'Mia + Raj'),
  ('Project Memory + Selective Loading', 'P1-B', 'shipped', 'Stark'),
  ('Data → Decision Layer', 'P2-A', 'in-flight', 'Kai + Mia'),
  ('Agent WebSearch + Contradiction', 'P2-B', 'in-flight', 'Dev'),
  ('Approval Mechanism in /inbox', 'P3-A', 'in-flight', 'Raj + Mia'),
  ('Daily Session Persistence', 'P3-B', 'scoped', 'Raj'),
  ('Brand Intelligence Pipeline', 'P4-A', 'scoped', 'Kai + Lena + Atlas'),
  ('Sidebar Quick Access + Scout', 'P4-B', 'shipped', 'Mia'),
  ('GitHub Integration', 'P5-A', 'in-flight', 'Dev + Raj'),
  ('Weekly API Cost Report', 'P6-A', 'in-flight', 'Felix + Raj'),
  ('Roadmap View on CEO Page', 'P7-A', 'in-flight', 'Mia + Raj');
```

Run in Supabase Dashboard SQL Editor.

- [ ] **Step 2: Create `app/api/roadmap/route.ts`**

```typescript
import { supabase } from '@/lib/supabase'

export interface RoadmapItem {
  id: string
  title: string
  priority: string
  status: 'scoped' | 'in-flight' | 'shipped'
  dri?: string
  updatedAt: string
}

export async function GET(): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .order('priority', { ascending: true })

    if (error) throw error

    const items: RoadmapItem[] = (data ?? []).map(row => ({
      id: row.id,
      title: row.title,
      priority: row.priority,
      status: row.status as RoadmapItem['status'],
      dri: row.dri ?? undefined,
      updatedAt: row.updated_at,
    }))

    return Response.json({ items })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function PATCH(request: Request): Promise<Response> {
  let body: { id?: string; status?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.id || !body.status) {
    return Response.json({ error: 'id and status required' }, { status: 400 })
  }

  const valid = ['scoped', 'in-flight', 'shipped']
  if (!valid.includes(body.status)) {
    return Response.json({ error: 'status must be scoped, in-flight, or shipped' }, { status: 400 })
  }

  try {
    await supabase
      .from('roadmap_items')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', body.id)
    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
```

- [ ] **Step 3: Add Roadmap Pulse section to `app/ceo/page.tsx`**

Add a `useEffect` to fetch in-flight items:

```typescript
const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([])

useEffect(() => {
  void fetch('/api/roadmap')
    .then(r => r.json())
    .then((d: { items: RoadmapItem[] }) => {
      setRoadmapItems(d.items.filter(i => i.status === 'in-flight').slice(0, 3))
    })
    .catch(() => {})
}, [])
```

Add the Roadmap Pulse section in the right column, above Team Activity:

```tsx
{/* Roadmap Pulse */}
{roadmapItems.length > 0 && (
  <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '18px' }}>
    <SH>Roadmap Pulse — In Flight</SH>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {roadmapItems.map(item => (
        <div key={item.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 10px', background: 'var(--b1)',
          borderLeft: '2px solid var(--am)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--am)', marginBottom: '2px' }}>
              {item.priority}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--tx)' }}>{item.title}</div>
          </div>
          {item.dri && (
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>
              {item.dri}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 4: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 5: Browser test**
  - Navigate to CEO page
  - Verify "Roadmap Pulse — In Flight" section shows 3 items
  - Verify decision count in page header is live from Supabase

- [ ] **Step 6: Commit**
```bash
git add supabase/migrations/002_roadmap_items.sql app/api/roadmap/route.ts app/ceo/page.tsx
git commit -m "feat: roadmap_items table + /api/roadmap + Roadmap Pulse on CEO page"
```

---

## Phase 8 — Final Build Gate

### Task 16: Full Build + Lint Verification

- [ ] **Step 1: Run full TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 2: Run lint**
```bash
npm run lint
```
Expected: 0 warnings

- [ ] **Step 3: Update ROADMAP.md to reflect shipped items**

Mark items shipped in `.yvon-os/ROADMAP.md`:
- P1-A: Brand Sidebar → **Shipped**
- P1-B: Project Memory → **Shipped**
- P2-A: Decision Layer → **Shipped**
- P2-B: WebSearch → **Shipped**
- P3-A: Approval mechanism → **Shipped**
- P3-B: Daily logs → **Shipped**
- P4-A: Brand intelligence → **Shipped**
- P4-B: Scout sidebar → **Shipped** (was already working)
- P5-A: GitHub integration → **Shipped**
- P6-A: Weekly cost report → **Shipped**
- P7-A: Roadmap view → **Shipped**

- [ ] **Step 4: Update SESSION.md**

- [ ] **Step 5: Final commit**
```bash
git add .yvon-os/ROADMAP.md .yvon-os/SESSION.md
git commit -m "chore: update roadmap + session log — all 13 points shipped"
```

---

## Environment Variables Required (add to .env.local + Vercel)

```
# Already existing
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APIFY_TOKEN=
YOUTUBE_API_KEY=
RESEND_API_KEY=
BRIEFING_EMAIL=
GOOGLE_SA_JSON=
CRON_SECRET=

# New for Phase 5
GITHUB_TOKEN=              # PAT with repo scope
GITHUB_REPO_OWNER=         # GitHub username
GITHUB_REPO_NAME=YVON
```

---

## Supabase Tables Summary

| Table | Created In | Purpose |
|-------|-----------|---------|
| `decisions` | Task 1 | Approval workflow — CEO decision queue |
| `daily_logs` | Task 1 | Agent session log persistence |
| `roadmap_items` | Task 15 | In-flight roadmap display on CEO page |

---

## Package Dependencies

| Package | Why | Install |
|---------|-----|---------|
| `@octokit/rest` | GitHub API client (Task 13) | `npm install @octokit/rest` |
