'use client'

import { useState, useMemo } from 'react'
import { PageHeader, Chip, Card, SectionLabel, StatusBadge } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import {
  Search,
  BookOpen,
  FileText,
  Clock,
  Eye,
  Calendar,
  Tag,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Library,
  X,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type DocCategory = 'Architecture' | 'Workflows' | 'Agents' | 'Ventures' | 'Onboarding'

type Doc = {
  id: string
  title: string
  category: DocCategory
  updatedAt: string
  wordCount: number
  author: string
  views: number
  excerpt: string
  content: string
  tags: string[]
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const NOW = new Date()
const fmt = (d: Date) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => fmt(new Date(NOW.getTime() - n * 86400000))

const MOCK_DOCS: Doc[] = [
  {
    id: 'd1',
    title: 'Agent Routing Table & Escalation Protocol',
    category: 'Agents',
    updatedAt: daysAgo(1),
    wordCount: 2840,
    author: 'Dev Lead',
    views: 1247,
    excerpt: 'Complete reference for all 13 agents, their responsibilities, routing keywords, and escalation paths. Updated weekly.',
    tags: ['agents', 'routing', 'architecture'],
    content: `# Agent Routing Table & Escalation Protocol

## Overview

The YVON OS operates with **13 agents** across **4 departments**. Each agent has a defined scope, routing keywords, and escalation path.

## Layer 1 — COMMAND (Direction + Accountability)

### 👑 Marcus — CEO
- **Keywords:** Executive summary, CEO brief, priorities, OKRs, business direction, synthesis, strategy, War Room
- **Outputs:** Strategic summaries, priority rankings, resource allocation decisions
- **Escalation:** Kahneman (for cognitive bias review before major decisions)

### ⚙️ Diana — COO
- **Keywords:** Operations, workflow, process, project plan, milestones, sprint planning, dependencies
- **Outputs:** Sprint plans, milestone tracking, dependency maps

## Layer 2 — BUILD (Everything That Ships)

### 💻 Dev Lead
- **Keywords:** Next.js, API routes, architecture, tech decision, build error, TypeScript, Vercel, deployment
- **Stack:** Next.js 15 · TypeScript · Tailwind · Supabase

### 🔧 Raj — Backend
- **Keywords:** Supabase, database, query, backend API, data model, route.ts, schema, migration

### 🎨 Mia — Frontend
- **Keywords:** React component, UI, Tailwind, layout, CSS, design system, wireframe, UX

### 🧪 Quinn — QA
- **Keywords:** Testing, bug, QA review, lint, build check, edge case, verification, Pulse

## Layer 3 — GROW (Revenue + Insight)

### ✍️ Lena — Brand & Copy
- **Keywords:** Copy, caption, content writing, brand voice, email, ad copy

### 📊 Kai — Analytics
- **Keywords:** Analytics, dashboard, metrics, reporting, market research, competitor analysis

## Escalation Rules

1. Technical decisions > €5k → Marcus review
2. Design changes to core system → Diana + Dev Lead
3. Content/copy for public channels → Lena + Kahneman for bias check
4. Database schema changes → Raj + Dev Lead sign-off`,
  },
  {
    id: 'd2',
    title: 'Decision Queue Workflow & Approval Gates',
    category: 'Workflows',
    updatedAt: daysAgo(3),
    wordCount: 1920,
    author: 'Diana',
    views: 893,
    excerpt: 'How decisions flow through the system — from agent proposal to human approval. Covers all approval gates.',
    tags: ['workflow', 'decisions', 'approvals'],
    content: `# Decision Queue Workflow

## The Decision Lifecycle

Every decision in YVON follows a 6-stage pipeline:

1. **Proposed** — Agent identifies a decision point and drafts the recommendation
2. **Analysis** — Supporting data gathered (by Kai or relevant specialist)
3. **Bias Check** — Kahneman reviews for cognitive biases (if financial or strategic)
4. **Recommendation** — Final draft with rationale, alternatives considered, risk assessment
5. **Approval Gate** — Marcus or Diana reviews and approves/returns/rejects
6. **Executed** — Action taken and logged in the system

## Approval Gates

### Gate 1 — Design Approvals
- Trigger: UI changes, new components, visual identity shifts
- Reviewer: Dev Lead (Mia's work is auto-approved for minor tweaks)
- SLA: 24 hours

### Gate 2 — Content Approvals
- Trigger: Public-facing copy, ads, social posts
- Reviewer: Lena + Kahneman (bias check)
- SLA: 4 hours

### Gate 3 — Financial Approvals
- Trigger: Spend > €500, pricing changes, vendor contracts
- Reviewer: Felix (analysis) → Marcus (approval)
- SLA: 48 hours

### Gate 4 — Architecture Approvals
- Trigger: New services, database changes, API breaking changes
- Reviewer: Dev Lead + Raj
- SLA: 72 hours

## Return Paths

If rejected, decisions return to the proposing agent with Marcus/Diana's notes.`,
  },
  {
    id: 'd3',
    title: 'Supabase Schema v3 — Reference',
    category: 'Architecture',
    updatedAt: daysAgo(5),
    wordCount: 4560,
    author: 'Raj',
    views: 1302,
    excerpt: 'Complete database schema documentation for YVON-OS v3. All tables, relationships, RLS policies, and migration guide.',
    tags: ['database', 'supabase', 'schema', 'rls'],
    content: `# Supabase Schema v3

## Core Tables

### workspaces
- \`id\` — UUID, primary key
- \`name\` — text, not null
- \`slug\` — text, unique, not null
- \`accent\` — text (hex color), default '#abc7ff'
- \`created_at\` — timestamptz

### agents
- \`id\` — UUID, primary key
- \`name\` — text
- \`department\` — text (CEO, Technical, Marketing, Finance)
- \`initials\` — text (2 chars)
- \`personality_prompt\` — text

### tasks
- \`id\` — UUID
- \`workspace_id\` — FK → workspaces
- \`agent_id\` — FK → agents
- \`title\` — text
- \`stage\` — enum: proposed, backlog, week, review, done
- \`priority\` — enum: low, medium, high, critical

### contacts
- \`id\` — UUID
- \`workspace_id\` — FK
- \`name\` — text
- \`email\` — text
- \`relationship\` — enum: client, partner, lead, vendor

## RLS Policies

All tables are scoped by workspace. Each workspace member can only see their workspace's data.`,
  },
  {
    id: 'd4',
    title: 'Brand Voice Guide — YVON OS',
    category: 'Onboarding',
    updatedAt: daysAgo(6),
    wordCount: 2150,
    author: 'Lena',
    views: 756,
    excerpt: 'How YVON communicates — tone, vocabulary, and voice guidelines for every agent and public channel.',
    tags: ['brand', 'voice', 'content', 'style-guide'],
    content: `# Brand Voice Guide

## Core Voice Principles

YVON communicates with **clarity, confidence, and warmth**. We are the operating system for ambitious creators — not a generic SaaS.

### Tone Spectrum
- **Inbox / CRM:** Warm, human, slightly informal
- **Dashboards:** Clear, data-forward, confident
- **Agent comms:** Precise, actionable, trustworthy
- **Public content:** Inspiring, forward-thinking, slightly poetic

### Vocabulary
- **Use:** "operating system", "agents", "workspace", "pipeline", "mission control"
- **Avoid:** "platform", "tool", "solution", "revolutionary"

### Agent Voice Profiles
Each agent has a distinct voice:
- **Marcus:** Direct, strategic, brief — "Here's what matters"
- **Lena:** Warm, evocative, brand-conscious — "Let's make it sing"
- **Dev Lead:** Technical, precise, solution-oriented`,
  },
  {
    id: 'd5',
    title: 'Vercel Deployment Runbook',
    category: 'Architecture',
    updatedAt: daysAgo(8),
    wordCount: 3120,
    author: 'Dev Lead',
    views: 980,
    excerpt: 'Step-by-step guide for deploying YVON-OS to Vercel. Environment variables, build config, preview deployments, and rollback.',
    tags: ['deployment', 'vercel', 'devops'],
    content: `# Vercel Deployment Runbook

## Pre-deployment Checklist
1. \`npm run build\` passes locally
2. All env vars set in Vercel dashboard
3. Database migrations tested on staging
4. Quinn's Pulse check green

## Environment Variables
\`\`\`
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY
\`\`\`

## Deployment Flow
1. Push to \`main\` → triggers production deploy
2. PR → preview deployment with unique URL
3. Production domains configured via \`vercel.json\`

## Rollback Procedure
\`vercel rollback\` from CLI or use Vercel dashboard instant rollback feature.`,
  },
  {
    id: 'd6',
    title: 'Glass UI Design System v2',
    category: 'Architecture',
    updatedAt: daysAgo(2),
    wordCount: 3780,
    author: 'Mia',
    views: 1104,
    excerpt: 'Design tokens, component library, and layout patterns for the YVON Glass UI system. Dark-first, accent-driven.',
    tags: ['design', 'ui', 'css', 'tokens'],
    content: `# Glass UI Design System v2

## Design Tokens

All tokens live in \`globals.css :root\`:
- \`--ws-accent\`: Primary workspace accent color
- \`--ws-accent-soft\`: 14% opacity variant for backgrounds
- \`--ws-glow\`: 35% opacity for borders/glows

## Core Components

### glass-card
Dark translucent card with backdrop blur. Border: 1px rgba(255,255,255,0.07).

### btn-accent
Primary action button. Accent background, dark text.

### chip
Small pill for tags, status, metadata.

### glass-input
Translucent input with focus glow on accent color.

## Layout Principles
- 12-column grid
- Max content width: 1440px
- Sidebar: 260px fixed
- Responsive breakpoints: 768px, 1024px`,
  },
  {
    id: 'd7',
    title: 'Onboarding — New Agent Setup',
    category: 'Onboarding',
    updatedAt: daysAgo(10),
    wordCount: 1650,
    author: 'Diana',
    views: 621,
    excerpt: 'How to create, configure, and deploy a new agent in the YVON ecosystem. Includes personality prompt template.',
    tags: ['agents', 'onboarding', 'setup'],
    content: `# New Agent Setup Guide

## Step 1: Define Scope
- What department? (CEO / Technical / Marketing / Finance)
- What keywords trigger this agent?
- What are its output formats?

## Step 2: Create Personality
Each agent gets a \`MEMORY.md\` file with:
- Role description
- Tone guidelines
- Knowledge base pointers
- Output format specs

## Step 3: Register in Routing Table
Add to \`CLAUDE.md\` routing table with keywords.

## Step 4: API Route
Create \`/api/[agent-name]/route.ts\` with the agent's prompt and model config.

## Step 5: UI Integration
If agent has a dashboard, add to sidebar navigation.`,
  },
  {
    id: 'd8',
    title: 'Competitive Intelligence SOP',
    category: 'Workflows',
    updatedAt: daysAgo(4),
    wordCount: 2340,
    author: 'Kai',
    views: 845,
    excerpt: 'Standard operating procedure for competitive research — data sources, analysis framework, and reporting cadence.',
    tags: ['competitive', 'research', 'analysis'],
    content: `# Competitive Intelligence SOP

## Data Sources
1. **Primary:** Competitor websites, social feeds, job postings, press releases
2. **Secondary:** Industry reports, Crunchbase, LinkedIn Sales Navigator
3. **Signal:** Pricing page changes, new feature launches, hiring spikes

## Analysis Framework
- **Feature Matrix:** Side-by-side comparison of capabilities
- **Positioning Map:** Price vs. feature depth
- **SWOT:** Strengths, Weaknesses, Opportunities, Threats

## Reporting Cadence
- Weekly: Automated competitor monitoring (Kai)
- Monthly: Deep-dive on top 3 competitors
- Quarterly: Full landscape review + strategy update`,
  },
  {
    id: 'd9',
    title: 'Novizio — Venture Playbook',
    category: 'Ventures',
    updatedAt: daysAgo(7),
    wordCount: 2890,
    author: 'Marcus',
    views: 567,
    excerpt: 'Complete venture playbook for Novizio — fashion e-commerce strategy, brand positioning, and go-to-market plan.',
    tags: ['novizio', 'venture', 'ecommerce', 'fashion'],
    content: `# Novizio — Venture Playbook

## Market Position
AI-powered fashion discovery for the Instagram-native generation. Not fast fashion — curated, intelligent, personal.

## Target Audience
- Women 22-35, fashion-forward, digital-native
- Secondary: Men 25-40, streetwear-curious
- Geography: EU first (DE, FR, NL, ES), then US

## Revenue Model
- Commission on marketplace sales (15-20%)
- Premium brand partnerships (flat monthly + rev share)
- Virtual try-on API licensing (B2B)

## Go-to-Market
1. **Phase 1:** Curated drops with 5 brand partners
2. **Phase 2:** AI stylist launch — personalized recommendations
3. **Phase 3:** Virtual try-on — AR integration`,
  },
  {
    id: 'd10',
    title: 'Hourbour — Financial Model',
    category: 'Ventures',
    updatedAt: daysAgo(9),
    wordCount: 3450,
    author: 'Felix',
    views: 489,
    excerpt: 'Financial projections, unit economics, and pricing strategy for Hourbour — the freelancer financial OS.',
    tags: ['hourbour', 'venture', 'fintech', 'finance'],
    content: `# Hourbour — Financial Model

## Pricing Tiers
- **Free:** Basic time tracking, 5 invoices/mo
- **Pro (€12/mo):** Unlimited invoices, expense tracking, bank sync
- **Business (€29/mo):** Team dashboard, multi-currency, priority support

## Unit Economics
- CAC: €18 (content marketing + paid social)
- LTV: €180 (12-month average retention)
- LTV:CAC: 10:1

## Revenue Projections
- Year 1: €45k ARR (1,000 paid users)
- Year 2: €180k ARR (5,000 paid users)
- Year 3: €600k ARR (17,000 paid users)`,
  },
]

const CATEGORIES: DocCategory[] = ['Architecture', 'Workflows', 'Agents', 'Ventures', 'Onboarding']

const CATEGORY_COLORS: Record<DocCategory, string> = {
  Architecture: 'bg-primary/10 text-primary border-primary/25',
  Workflows: 'bg-tertiary/15 text-tertiary border-tertiary/25',
  Agents: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  Ventures: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
  Onboarding: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<DocCategory | 'All'>('All')
  const [sel, setSel] = useState<Doc | null>(null)

  const { data } = useLiveData<{ docs: Doc[]; documentsCount: number }>({
    url: '/api/knowledge-graph',
    mockData: { docs: MOCK_DOCS, documentsCount: MOCK_DOCS.length },
  })
  const docs = data?.docs ?? MOCK_DOCS

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const matchSearch =
        !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        d.tags.some((t) => t.includes(search.toLowerCase()))
      const matchCat = catFilter === 'All' || d.category === catFilter
      return matchSearch && matchCat
    })
  }, [docs, search, catFilter])

  const stats = useMemo(() => {
    const weekAgo = daysAgo(7)
    const sorted = [...docs].sort((a, b) => b.views - a.views)
    return {
      total: docs.length,
      updatedThisWeek: docs.filter((d) => d.updatedAt >= weekAgo).length,
      mostRead: sorted[0]?.title.slice(0, 40) + (sorted[0]?.title.length || 0 > 40 ? '…' : '') || '—',
      mostReadViews: sorted[0]?.views || 0,
    }
  }, [docs])

  return (
    <div>
      <PageHeader
        title="Docs"
        subtitle={`Knowledge base — ${stats.total} documents, agent-authored and human-reviewed.`}
      />

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-3">
        <Card className="flex items-center gap-3 px-4 py-3">
          <Library size={16} className="text-on-surface-variant" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Total docs</p>
            <p className="text-lg font-bold text-on-surface">{stats.total}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <RefreshCw size={16} className="text-primary" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Updated this week</p>
            <p className="text-lg font-bold text-primary">{stats.updatedThisWeek}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <TrendingUp size={16} className="text-emerald-400" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Most read</p>
            <p className="text-sm font-semibold text-emerald-300 max-w-[200px] truncate">{stats.mostRead}</p>
            <p className="text-[10px] text-on-surface-variant/60">{stats.mostReadViews} views</p>
          </div>
        </Card>
      </div>

      {/* ── Search + category filters ─────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search docs by title, content, or tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input !pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCatFilter('All')}
            className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={
              catFilter === 'All'
                ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
            }
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
              style={
                catFilter === c
                  ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                  : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Doc cards ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-[13px] text-on-surface-variant">
            No documents match your search.
          </Card>
        )}
        {filtered.map((d) => (
          <div key={d.id} className="cursor-pointer" onClick={() => setSel(d)}>
          <Card hover className="flex items-center gap-4 p-4">
            {/* Category icon */}
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold"
              style={{ background: 'var(--ws-accent-soft)', color: 'var(--ws-accent)' }}
            >
              {d.category.slice(0, 2).toUpperCase()}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-semibold text-on-surface">{d.title}</h3>
              <p className="mt-0.5 text-[11px] text-on-surface-variant line-clamp-1">{d.excerpt}</p>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[d.category]}`}
                >
                  {d.category}
                </span>
                <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-1">
                  <Clock size={10} /> {d.updatedAt}
                </span>
                <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-1">
                  <FileText size={10} /> {d.wordCount.toLocaleString()} words
                </span>
                <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-1">
                  <Eye size={10} /> {d.views.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Open button */}
            <button className="btn-ghost !py-1 !text-xs shrink-0">
              Read <ArrowUpRight size={12} />
            </button>
          </Card>
          </div>
        ))}
      </div>

      {/* ── Doc Viewer Modal ──────────────────────────────────────────── */}
      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.title}
        subtitle={sel ? `${sel.category} · by ${sel.author} · ${sel.updatedAt} · ${sel.wordCount.toLocaleString()} words` : ''}
        size="xl"
      >
        {sel && (
          <div className="space-y-4">
            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_COLORS[sel.category]}`}>
                {sel.category}
              </span>
              {sel.tags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
              <span className="ml-auto flex items-center gap-1 text-[11px] text-on-surface-variant/60">
                <Eye size={11} /> {sel.views.toLocaleString()} views
              </span>
            </div>

            {/* Excerpt */}
            <p className="text-[13px] text-on-surface-variant italic border-l-2 border-white/10 pl-3">
              {sel.excerpt}
            </p>

            {/* Content */}
            <div className="glass-card-light p-5">
              <div className="prose prose-invert prose-sm max-w-none">
                {sel.content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-lg font-bold text-on-surface mt-6 mb-3 first:mt-0">{line.slice(2)}</h1>
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-base font-semibold text-on-surface mt-5 mb-2">{line.slice(3)}</h2>
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-semibold text-on-surface mt-4 mb-1.5">{line.slice(4)}</h3>
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-semibold text-on-surface mt-4 mb-1.5">{line.slice(4)}</h3>
                  }
                  if (line.startsWith('- ')) {
                    return <li key={i} className="text-[13px] text-on-surface-variant ml-4 list-disc">{line.slice(2)}</li>
                  }
                  if (line.startsWith('1. ') || line.match(/^\d+\. /)) {
                    return <li key={i} className="text-[13px] text-on-surface-variant ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>
                  }
                  if (line.startsWith('```')) {
                    return null // skip code fence markers
                  }
                  if (line.trim() === '') {
                    return <div key={i} className="h-2" />
                  }
                  // Inline code
                  if (line.includes('`')) {
                    const parts = line.split(/(`[^`]+`)/g)
                    return (
                      <p key={i} className="text-[13px] text-on-surface-variant leading-relaxed">
                        {parts.map((part, j) =>
                          part.startsWith('`') && part.endsWith('`') ? (
                            <code key={j} className="bg-white/10 px-1 py-0.5 rounded text-[12px] text-primary">{part.slice(1, -1)}</code>
                          ) : (
                            <span key={j}>{part}</span>
                          )
                        )}
                      </p>
                    )
                  }
                  return <p key={i} className="text-[13px] text-on-surface-variant leading-relaxed">{line}</p>
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
