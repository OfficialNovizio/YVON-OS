'use client'

import { useState, useMemo } from 'react'
import { PageHeader, StatusBadge, Chip, Card, SectionLabel } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import {
  Github,
  ExternalLink,
  Layers,
  Clock,
  Users,
  GitCommit,
  Calendar,
  CheckCircle2,
  Wrench,
  Sparkles,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type ProjectStatus = 'Active' | 'Planning' | 'Completed'

type ActivityEvent = {
  date: string
  action: string
  agent: string
}

type Project = {
  id: string
  name: string
  workspace: string
  kind: string
  theme: string
  status: ProjectStatus
  tone: 'blue' | 'green' | 'muted' | 'yellow'
  progress: number
  githubUrl?: string
  vercelUrl?: string
  description: string
  techStack: string[]
  team: { name: string; role: string }[]
  recentActivity: ActivityEvent[]
  lastUpdated: string
  completedAt?: string
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const NOW = new Date()
const fmt = (d: Date) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => fmt(new Date(NOW.getTime() - n * 86400000))

const MOCK_PROJECTS: Project[] = [
  {
    id: '1', name: 'Vibe with AI', workspace: 'vibe', kind: 'Main brand', theme: 'Glass neon',
    status: 'Active', tone: 'blue', progress: 72,
    githubUrl: 'https://github.com/yvon-os/vibe-web',
    vercelUrl: 'https://vibe.yvon.ai',
    description: 'Flagship brand site and AI demo platform showcasing the full YVON agent ecosystem. Includes the Mission Control dashboard, agent routing table, and interactive Glass UI demo.',
    techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Vercel', 'OpenAI'],
    team: [
      { name: 'Dev Lead', role: 'Architecture + API routes' },
      { name: 'Mia', role: 'Frontend + Glass UI' },
      { name: 'Raj', role: 'Supabase schema + migrations' },
      { name: 'Quinn', role: 'QA + Pulse monitoring' },
    ],
    recentActivity: [
      { date: daysAgo(0), action: 'Deployed header glass morphing v2 to production', agent: 'NX' },
      { date: daysAgo(1), action: 'Approved 3 new animation components in review', agent: 'SC' },
      { date: daysAgo(3), action: 'Added Supabase RLS policies for workspace scoping', agent: 'LE' },
    ],
    lastUpdated: daysAgo(0),
  },
  {
    id: '2', name: 'Canela', workspace: 'canela', kind: 'E-commerce', theme: 'Deep sea',
    status: 'Active', tone: 'green', progress: 61,
    githubUrl: 'https://github.com/yvon-os/canela-store',
    description: 'Full-featured e-commerce platform for Nordic Labs. Custom checkout flow with Stripe integration, inventory management, and a headless CMS backend.',
    techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Stripe', 'Supabase', 'Redis'],
    team: [
      { name: 'Raj', role: 'Backend + payment integration' },
      { name: 'Mia', role: 'Storefront UI + cart UX' },
      { name: 'Felix', role: 'Pricing engine + tax logic' },
    ],
    recentActivity: [
      { date: daysAgo(1), action: 'Checkout flow optimization — 23% conversion lift', agent: 'NX' },
      { date: daysAgo(4), action: 'Inventory sync webhook implemented for 3PL', agent: 'LE' },
      { date: daysAgo(7), action: 'Sprint review — product variant system done', agent: 'SC' },
    ],
    lastUpdated: daysAgo(1),
  },
  {
    id: '3', name: 'Valhalla', workspace: 'valhalla', kind: 'Music', theme: 'Techno',
    status: 'Active', tone: 'muted', progress: 48,
    githubUrl: 'https://github.com/yvon-os/valhalla-club',
    description: 'Music venue and event booking platform. Artist profiles, event calendar, ticketing, and a real-time crowd vibe meter for live events.',
    techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'WebSockets', 'Supabase'],
    team: [
      { name: 'Dev Lead', role: 'Real-time infrastructure' },
      { name: 'Lena', role: 'Event copy + artist bios' },
      { name: 'Atlas', role: 'Visual identity + stage visuals' },
    ],
    recentActivity: [
      { date: daysAgo(2), action: 'Crowd vibe meter prototype — WebSocket data stream live', agent: 'NX' },
      { date: daysAgo(5), action: 'Artist onboarding flow completed', agent: 'SC' },
      { date: daysAgo(8), action: 'Ticket QR code generation + scanning API', agent: 'LE' },
    ],
    lastUpdated: daysAgo(2),
  },
  {
    id: '4', name: 'By Design', workspace: 'bydesign', kind: 'App / agency', theme: 'Glass neon',
    status: 'Active', tone: 'blue', progress: 55,
    githubUrl: 'https://github.com/yvon-os/bydesign-app',
    description: 'Agency OS — client portal with project dashboards, approval workflows, asset library, and automated client reporting. White-label ready.',
    techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Resend', 'Vercel'],
    team: [
      { name: 'Mia', role: 'Client portal UX' },
      { name: 'Raj', role: 'Multi-tenant architecture' },
      { name: 'Kai', role: 'Analytics + client reporting' },
    ],
    recentActivity: [
      { date: daysAgo(1), action: 'Client approval workflow — review stage implemented', agent: 'NX' },
      { date: daysAgo(3), action: 'White-label theming system for client portals', agent: 'SC' },
      { date: daysAgo(6), action: 'Automated client PDF report generation', agent: 'LE' },
    ],
    lastUpdated: daysAgo(1),
  },
  {
    id: '5', name: 'Novizio', workspace: 'novizio', kind: 'Fashion e-commerce', theme: 'Crimson glass',
    status: 'Planning', tone: 'yellow', progress: 18,
    githubUrl: 'https://github.com/yvon-os/novizio',
    description: 'AI-powered fashion e-commerce platform. Virtual try-on, style recommendations, trend-driven collections, and a social shopping experience.',
    techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Python/FastAPI', 'Supabase', 'Stable Diffusion'],
    team: [
      { name: 'Dev Lead', role: 'Architecture + AI pipeline' },
      { name: 'Lena', role: 'Brand voice + product copy' },
      { name: 'Atlas', role: 'Visual identity + lookbooks' },
      { name: 'Kai', role: 'Trend analysis + recommendation engine' },
    ],
    recentActivity: [
      { date: daysAgo(4), action: 'Architecture review — microservices vs monolith decision', agent: 'NX' },
      { date: daysAgo(9), action: 'Mood board and visual identity exploration', agent: 'SC' },
      { date: daysAgo(14), action: 'Initial project brief approved by Marcus', agent: 'WM' },
    ],
    lastUpdated: daysAgo(4),
  },
  {
    id: '6', name: 'Hourbour', workspace: 'hourbour', kind: 'Fintech SaaS', theme: 'Steel blue',
    status: 'Planning', tone: 'blue', progress: 35,
    githubUrl: 'https://github.com/yvon-os/hourbour',
    description: 'Freelancer financial OS — time tracking, invoicing, expense management, and tax estimation. Integrated with major EU and US bank APIs.',
    techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Plaid', 'Stripe Connect'],
    team: [
      { name: 'Raj', role: 'Fintech backend + bank APIs' },
      { name: 'Felix', role: 'Financial modeling + tax logic' },
      { name: 'Mia', role: 'Dashboard UX + mobile layouts' },
    ],
    recentActivity: [
      { date: daysAgo(2), action: 'Plaid sandbox integration — bank linking prototype', agent: 'LE' },
      { date: daysAgo(6), action: 'Invoice PDF generation with tax calculations', agent: 'NX' },
      { date: daysAgo(10), action: 'Market research — 12 competitor feature matrix', agent: 'IS' },
    ],
    lastUpdated: daysAgo(2),
  },
  {
    id: '7', name: 'YVON Docs Portal', workspace: 'vibe', kind: 'Documentation', theme: 'Default',
    status: 'Completed', tone: 'green', progress: 100,
    githubUrl: 'https://github.com/yvon-os/docs',
    vercelUrl: 'https://docs.yvon.ai',
    description: 'Internal and partner-facing documentation portal. Agent-authored SOPs, architecture decision records, onboarding guides, and API reference.',
    techStack: ['Next.js 15', 'MDX', 'Tailwind CSS', 'Vercel'],
    team: [
      { name: 'Dev Lead', role: 'MDX pipeline + search' },
      { name: 'Lena', role: 'Content structure + voice' },
    ],
    recentActivity: [
      { date: daysAgo(12), action: 'MVP shipped — 150+ docs migrated from Notion', agent: 'NX' },
      { date: daysAgo(20), action: 'Search indexing with Algolia implemented', agent: 'LE' },
    ],
    lastUpdated: daysAgo(12),
    completedAt: daysAgo(12),
  },
  {
    id: '8', name: 'Social Pipeline v2', workspace: 'vibe', kind: 'Marketing tool', theme: 'Default',
    status: 'Completed', tone: 'green', progress: 100,
    description: 'Automated social media content pipeline. AI-generated post concepts, approval workflow, scheduling across LinkedIn/Twitter/Instagram, and analytics.',
    techStack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Supabase', 'OpenAI'],
    team: [
      { name: 'Rio', role: 'Scheduling engine + platform APIs' },
      { name: 'Lena', role: 'Content templates + brand voice' },
      { name: 'Kai', role: 'Analytics dashboard' },
    ],
    recentActivity: [
      { date: daysAgo(25), action: 'v2 shipped — multi-platform scheduling + analytics', agent: 'NX' },
      { date: daysAgo(40), action: 'AI content generation pipeline trained on brand voice', agent: 'SC' },
    ],
    lastUpdated: daysAgo(30),
    completedAt: daysAgo(25),
  },
]

const STATUS_TONES: Record<ProjectStatus, 'blue' | 'green' | 'yellow'> = {
  Active: 'blue',
  Planning: 'yellow',
  Completed: 'green',
}

type SortKey = 'status' | 'name' | 'lastUpdated'

// ── Component ──────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [sort, setSort] = useState<SortKey>('lastUpdated')
  const [sel, setSel] = useState<Project | null>(null)

  const { data } = useLiveData<{ projects: Project[] }>({
    url: '/api/projects',
    mockData: { projects: MOCK_PROJECTS },
  })
  const projects = data?.projects ?? MOCK_PROJECTS

  const sorted = useMemo(() => {
    const list = [...projects]
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'lastUpdated') list.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    if (sort === 'status') {
      const order: Record<ProjectStatus, number> = { Active: 0, Planning: 1, Completed: 2 }
      list.sort((a, b) => order[a.status] - order[b.status])
    }
    return list
  }, [projects, sort])

  const stats = useMemo(() => {
    const thisYear = new Date().getFullYear().toString()
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === 'Active').length,
      completedThisYear: projects.filter((p) => p.status === 'Completed' && p.completedAt?.startsWith(thisYear)).length,
    }
  }, [projects])

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Your portfolio of workspaces. Partners get a login scoped to one; you keep the overview."
      />

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-3">
        <Card className="flex items-center gap-3 px-4 py-3">
          <Layers size={16} className="text-on-surface-variant" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Total projects</p>
            <p className="text-lg font-bold text-on-surface">{stats.total}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <Sparkles size={16} className="text-primary" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Active</p>
            <p className="text-lg font-bold text-primary">{stats.active}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Completed this year</p>
            <p className="text-lg font-bold text-emerald-300">{stats.completedThisYear}</p>
          </div>
        </Card>
      </div>

      {/* ── Sort controls ─────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
          <ArrowUpDown size={12} /> Sort:
        </span>
        {(['status', 'name', 'lastUpdated'] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={
              sort === key
                ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
            }
          >
            {key === 'lastUpdated' ? 'Last updated' : key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Project cards grid ────────────────────────────────────────── */}
      <div className="responsive-grid">
        {sorted.map((p) => (
         <div key={p.id} className="cursor-pointer" onClick={() => setSel(p)}>
         <Card hover className="flex flex-col p-4">
            {/* Gradient banner */}
            <div
              className="mb-3 h-20 rounded-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--ws-accent-soft), transparent)' }}
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-on-surface truncate">{p.name}</h3>
                <p className="text-[11px] text-on-surface-variant">
                  {p.kind} · {p.theme}
                </p>
              </div>
              <StatusBadge tone={STATUS_TONES[p.status]}>{p.status}</StatusBadge>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${p.progress}%`, background: 'var(--ws-accent)' }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Chip>{p.workspace}</Chip>
              <span className="text-[11px] text-on-surface-variant">{p.progress}%</span>
            </div>

            {/* Links row */}
            <div className="mt-3 flex items-center gap-2 border-t border-white/6 pt-3">
              {p.githubUrl && (
                <a
                  href={p.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="btn-ghost !py-1 !text-[10px] !gap-1"
                >
                  <Github size={12} /> Code
                </a>
              )}
              {p.vercelUrl && (
                <a
                  href={p.vercelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="btn-ghost !py-1 !text-[10px] !gap-1"
                >
                  <ExternalLink size={12} /> Live
                </a>
              )}
            </div>
          </Card>
          </div>
        ))}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.name}
        subtitle={sel ? `${sel.kind} · ${sel.workspace} — ${sel.status}` : ''}
        size="lg"
        footer={
          <>
            {sel?.githubUrl && (
              <a href={sel.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-1.5 !text-xs !gap-1.5">
                <Github size={13} /> GitHub
              </a>
            )}
            {sel?.vercelUrl && (
              <a href={sel.vercelUrl} target="_blank" rel="noopener noreferrer" className="btn-accent !py-1.5 !text-xs !gap-1.5">
                <ExternalLink size={13} /> Open
              </a>
            )}
          </>
        }
      >
        {sel && (
          <div className="space-y-5">
            {/* Progress bar + status */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-on-surface-variant">Progress</span>
                <StatusBadge tone={STATUS_TONES[sel.status]}>{sel.status}</StatusBadge>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${sel.progress}%`, background: 'var(--ws-accent)' }}
                />
              </div>
              <p className="mt-1 text-[10px] text-on-surface-variant/60">{sel.progress}% complete</p>
            </div>

            {/* Description */}
            <div>
              <SectionLabel>Description</SectionLabel>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">{sel.description}</p>
            </div>

            {/* Tech stack */}
            <div>
              <SectionLabel>Tech Stack</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {sel.techStack.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            </div>

            {/* Team */}
            <div>
              <SectionLabel>Team</SectionLabel>
              <div className="space-y-1.5">
                {sel.team.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <Users size={12} className="text-on-surface-variant/40" />
                    <span className="font-medium text-on-surface">{m.name}</span>
                    <span className="text-on-surface-variant">— {m.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div>
              <SectionLabel>Recent Activity</SectionLabel>
              <div className="space-y-2">
                {sel.recentActivity.map((a, i) => (
                  <div key={i} className="glass-card-light p-3 flex gap-3">
                    <Calendar size={12} className="mt-0.5 shrink-0 text-on-surface-variant/40" />
                    <div className="min-w-0">
                      <p className="text-[12px] text-on-surface-variant">{a.action}</p>
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-[10px] text-on-surface-variant/50">{a.date}</span>
                        <span className="text-[10px] text-on-surface-variant/50">· Agent {a.agent}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {sel.completedAt && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                <CheckCircle2 size={13} />
                Completed on {sel.completedAt}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
