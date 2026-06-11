'use client'

import { useState, useMemo } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Drawer } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import {
  Monitor,
  Image,
  Calendar,
  Clock,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Camera,
  Euro,
  Zap,
  Layers,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
type SiteStage = 'inquiry' | 'scoped' | 'in-production' | 'delivered'

type CinematicProject = {
  id: string
  clientName: string
  company: string
  siteType: string
  value: number
  deadline: string
  stage: SiteStage
  heroUrl?: string
  description: string
  timeline: { label: string; date: string; done: boolean }[]
  notes?: string
}

type CinematicSitesData = {
  projects: CinematicProject[]
  assetLab: { id: string; title: string; thumbnailUrl: string; brand: string }[]
}

// ── Stage config ─────────────────────────────────────────────────────────────
const STAGES: { key: SiteStage; label: string; icon: typeof Zap; color: string; tone: 'yellow' | 'blue' | 'green' | 'muted' }[] = [
  { key: 'inquiry', label: 'Inquiry', icon: Zap, color: '#ffb693', tone: 'yellow' },
  { key: 'scoped', label: 'Scoped', icon: Layers, color: '#abc7ff', tone: 'blue' },
  { key: 'in-production', label: 'In Production', icon: Monitor, color: '#c08bff', tone: 'muted' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: '#4ade80', tone: 'green' },
]

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PROJECTS: CinematicProject[] = [
  {
    id: 'cs1',
    clientName: 'Maria Santos',
    company: 'Onyx Studio',
    siteType: 'Portfolio',
    value: 4200,
    deadline: '2026-06-20',
    stage: 'in-production',
    description: 'Full cinematic one-pager with 3D product viewer and custom glass-morphism design language. Includes CMS integration for portfolio updates.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-05-10', done: true },
      { label: 'Scope agreed', date: '2026-05-15', done: true },
      { label: 'Design draft sent', date: '2026-05-28', done: true },
      { label: 'Development started', date: '2026-06-01', done: true },
      { label: 'Client review', date: '2026-06-14', done: false },
      { label: 'Go live', date: '2026-06-20', done: false },
    ],
    notes: 'Client requested additional animation on the landing hero section. Approved with +€300 scope adjustment.',
  },
  {
    id: 'cs2',
    clientName: 'Elena Voss',
    company: 'Canela',
    siteType: 'E-commerce collection',
    value: 8500,
    deadline: '2026-07-05',
    stage: 'scoped',
    description: 'E-commerce site with AI-powered bundle builder. Shopify headless with custom React storefront. Includes product configurator and AR preview.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-05-22', done: true },
      { label: 'Discovery call', date: '2026-05-28', done: true },
      { label: 'Scope agreed', date: '2026-06-05', done: true },
      { label: 'Design kickoff', date: '2026-06-12', done: false },
      { label: 'Development start', date: '2026-06-19', done: false },
      { label: 'Go live', date: '2026-07-05', done: false },
    ],
  },
  {
    id: 'cs3',
    clientName: 'James Bright',
    company: 'Brightwave Studio',
    siteType: 'Landing page',
    value: 2800,
    deadline: '2026-06-18',
    stage: 'in-production',
    description: 'Portfolio + booking site with glass-morphism design. Single-page app with smooth scroll navigation and integrated Calendly booking.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-05-30', done: true },
      { label: 'Scope agreed', date: '2026-06-02', done: true },
      { label: 'Design draft', date: '2026-06-08', done: true },
      { label: 'In development', date: '2026-06-10', done: true },
      { label: 'QA review', date: '2026-06-15', done: false },
      { label: 'Go live', date: '2026-06-18', done: false },
    ],
  },
  {
    id: 'cs4',
    clientName: 'Alex Rivera',
    company: 'Valhalla Tools',
    siteType: 'SaaS landing',
    value: 6200,
    deadline: '2026-07-15',
    stage: 'inquiry',
    description: 'SaaS marketing site with interactive demo builder. Multi-page with blog, docs, and pricing tiers. Needs custom illustration set.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-06-08', done: true },
      { label: 'Discovery call', date: '2026-06-12', done: false },
      { label: 'Scope proposal', date: '2026-06-16', done: false },
      { label: 'Design kickoff', date: '2026-06-20', done: false },
      { label: 'Development', date: '2026-07-01', done: false },
      { label: 'Go live', date: '2026-07-15', done: false },
    ],
  },
  {
    id: 'cs5',
    clientName: 'Nina Park',
    company: 'By Design Studio',
    siteType: 'Portfolio',
    value: 3800,
    deadline: '2026-05-28',
    stage: 'delivered',
    description: 'Photography portfolio with masonry grid and lightbox. Custom CMS integration for easy uploads. Cinematic transitions between gallery views.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-04-10', done: true },
      { label: 'Scope agreed', date: '2026-04-15', done: true },
      { label: 'Design draft', date: '2026-04-25', done: true },
      { label: 'Development', date: '2026-05-05', done: true },
      { label: 'Client review', date: '2026-05-20', done: true },
      { label: 'Delivered', date: '2026-05-28', done: true },
    ],
    notes: 'Client ecstatic. Already discussing phase 2 (e-commerce add-on).',
  },
  {
    id: 'cs6',
    clientName: 'Derek Holm',
    company: 'Nordic Supply Co',
    siteType: 'E-commerce collection',
    value: 11000,
    deadline: '2026-08-01',
    stage: 'scoped',
    description: 'Full headless commerce rebuild from Shopify to custom Next.js storefront. Multi-currency, multi-language, with AI search and recommendations.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-05-15', done: true },
      { label: 'Discovery workshops', date: '2026-05-25', done: true },
      { label: 'Scope agreed', date: '2026-06-05', done: true },
      { label: 'Architecture plan', date: '2026-06-15', done: false },
      { label: 'Development sprint 1', date: '2026-07-01', done: false },
      { label: 'Go live', date: '2026-08-01', done: false },
    ],
  },
  {
    id: 'cs7',
    clientName: 'Sara Kim',
    company: 'Lumen Health',
    siteType: 'Landing page',
    value: 3500,
    deadline: '2026-06-25',
    stage: 'in-production',
    description: 'Health-tech landing page with animated statistics dashboard preview. Scroll-triggered animations and parallax sections.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-05-20', done: true },
      { label: 'Scope agreed', date: '2026-05-28', done: true },
      { label: 'Design signed off', date: '2026-06-05', done: true },
      { label: 'In development', date: '2026-06-08', done: true },
      { label: 'Internal QA', date: '2026-06-18', done: false },
      { label: 'Go live', date: '2026-06-25', done: false },
    ],
  },
  {
    id: 'cs8',
    clientName: 'Tomás Reyes',
    company: 'Reyes Architecture',
    siteType: 'Portfolio',
    value: 5100,
    deadline: '2026-05-15',
    stage: 'delivered',
    description: 'Architecture firm portfolio with project case studies and 3D model embeds. Dark academic aesthetic with serif typography.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-03-01', done: true },
      { label: 'Scope agreed', date: '2026-03-10', done: true },
      { label: 'Design draft', date: '2026-03-25', done: true },
      { label: 'Development', date: '2026-04-10', done: true },
      { label: 'Revisions', date: '2026-05-01', done: true },
      { label: 'Delivered', date: '2026-05-15', done: true },
    ],
  },
  {
    id: 'cs9',
    clientName: 'Priya Mehta',
    company: 'Saffron Kitchen',
    siteType: 'Landing page',
    value: 2200,
    deadline: '2026-07-10',
    stage: 'inquiry',
    description: 'Restaurant landing page with online ordering integration and Instagram feed embed. Warm, earthy design with cinematic food photography.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-06-07', done: true },
      { label: 'Discovery call', date: '2026-06-14', done: false },
      { label: 'Scope proposal', date: '2026-06-18', done: false },
      { label: 'Design', date: '2026-06-25', done: false },
      { label: 'Development', date: '2026-07-03', done: false },
      { label: 'Go live', date: '2026-07-10', done: false },
    ],
  },
  {
    id: 'cs10',
    clientName: 'Marcus Cole',
    company: 'Hourbour',
    siteType: 'SaaS landing',
    value: 9500,
    deadline: '2026-07-20',
    stage: 'scoped',
    description: 'Fintech SaaS landing with interactive product demo, ROI calculator widget, and case study hub. Dark mode with neon accent palette.',
    heroUrl: '',
    timeline: [
      { label: 'Inquiry received', date: '2026-05-28', done: true },
      { label: 'Stakeholder workshops', date: '2026-06-04', done: true },
      { label: 'Scope agreed', date: '2026-06-10', done: true },
      { label: 'Wireframes', date: '2026-06-18', done: false },
      { label: 'Development', date: '2026-07-01', done: false },
      { label: 'Go live', date: '2026-07-20', done: false },
    ],
  },
]

const MOCK_ASSET_LAB = [
  { id: 'al1', title: 'Onyx Studio — dusk hero', thumbnailUrl: '', brand: 'Onyx Studio' },
  { id: 'al2', title: 'Canela — autumn drop hero', thumbnailUrl: '', brand: 'Canela' },
  { id: 'al3', title: 'Valhalla — dark forge', thumbnailUrl: '', brand: 'Valhalla Tools' },
  { id: 'al4', title: 'Brightwave — glass light', thumbnailUrl: '', brand: 'Brightwave Studio' },
  { id: 'al5', title: 'Hourbour — neon gridscape', thumbnailUrl: '', brand: 'Hourbour' },
  { id: 'al6', title: 'Nordic Supply — fjord hero', thumbnailUrl: '', brand: 'Nordic Supply Co' },
]

const FALLBACK: CinematicSitesData = {
  projects: MOCK_PROJECTS,
  assetLab: MOCK_ASSET_LAB,
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

// ── Sub-components ──────────────────────────────────────────────────────────
function HeroPlaceholder({ clientName, company }: { clientName: string; company: string }) {
  const initials = (company || clientName).slice(0, 2).toUpperCase()
  const hue = (initials.charCodeAt(0) * 31 + initials.charCodeAt(1) * 17) % 360
  return (
    <div
      className="relative flex h-36 items-center justify-center overflow-hidden rounded-lg"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 30%, 18%), hsl(${(hue + 40) % 360}, 20%, 10%))`,
      }}
    >
      <span className="text-4xl font-extrabold text-white/10">{initials}</span>
      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/50 backdrop-blur-sm">
        <Camera size={10} /> hero pending
      </div>
    </div>
  )
}

function StageBadge({ stage }: { stage: SiteStage }) {
  const cfg = STAGES.find((s) => s.key === stage)!
  const tones: Record<SiteStage, 'yellow' | 'blue' | 'muted' | 'green'> = {
    inquiry: 'yellow',
    scoped: 'blue',
    'in-production': 'muted',
    delivered: 'green',
  }
  return <StatusBadge tone={tones[stage]}>{cfg.label}</StatusBadge>
}

function ProjectCard({
  project,
  onClick,
}: {
  project: CinematicProject
  onClick: () => void
}) {
  const isUrgent = project.stage !== 'delivered' && daysUntil(project.deadline) <= 7

  return (
    <div className="kanban-card cursor-pointer" onClick={onClick}>
      {/* Hero image placeholder */}
      <HeroPlaceholder clientName={project.clientName} company={project.company} />

      {/* Card body */}
      <div className="mt-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-[13px] font-semibold text-on-surface">{project.clientName}</h4>
            <p className="truncate text-[11px] text-on-surface-variant/60">{project.company}</p>
          </div>
          <StageBadge stage={project.stage} />
        </div>

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-3 text-[11px] text-on-surface-variant">
          <span className="flex items-center gap-1 truncate">
            <Monitor size={11} className="shrink-0" /> {project.siteType}
          </span>
        </div>

        {/* Value + deadline */}
        <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
          <span className="text-[12px] font-semibold text-on-surface">{formatEur(project.value)}</span>
          <span className={`flex items-center gap-1 text-[11px] ${isUrgent ? 'text-error' : 'text-on-surface-variant'}`}>
            <Clock size={11} />
            {formatDate(project.deadline)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CinematicSitesPage() {
  const { data } = useLiveData<CinematicSitesData>({
    url: '/api/cinematic-sites',
    mockData: FALLBACK,
    pollIntervalMs: 60000,
  })

  const [selected, setSelected] = useState<CinematicProject | null>(null)

  const projects = data?.projects ?? MOCK_PROJECTS
  const assetLab = data?.assetLab ?? MOCK_ASSET_LAB

  // ── Computed stats ──
  const stats = useMemo(() => {
    const active = projects.filter((p) => p.stage !== 'delivered')
    const delivered = projects.filter((p) => p.stage === 'delivered')
    const thisYear = delivered.filter((p) => new Date(p.deadline).getFullYear() === new Date().getFullYear())
    const totalRevenue = projects.reduce((sum, p) => sum + p.value, 0)
    const avgValue = projects.length > 0 ? Math.round(totalRevenue / projects.length) : 0
    return {
      activeCount: active.length,
      totalRevenue,
      deliveredThisYear: thisYear.length,
      avgValue,
    }
  }, [projects])

  // ── Group by stage ──
  const columns = useMemo(() => {
    return STAGES.map((stage) => ({
      ...stage,
      projects: projects.filter((p) => p.stage === stage.key),
    }))
  }, [projects])

  // ── Upcoming deadlines ──
  const upcomingDeadlines = useMemo(() => {
    return projects
      .filter((p) => p.stage !== 'delivered')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 6)
  }, [projects])

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Cinematic Sites"
        subtitle="Client website builds — cinematic sites produced for clients, from inquiry to delivery. High-end one-pagers, portfolios, and e-commerce experiences."
        actions={
          <button className="btn-accent">
            <ArrowRight size={15} /> New Project
          </button>
        }
      />

      {/* ── Top Stats ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
            <Zap size={13} /> Active
          </div>
          <p className="mt-1.5 text-2xl font-extrabold text-on-surface">{stats.activeCount}</p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">projects in pipeline</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
            <Euro size={13} /> Total Revenue
          </div>
          <p className="mt-1.5 text-2xl font-extrabold text-on-surface">{formatEur(stats.totalRevenue)}</p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">across all projects</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
            <CheckCircle size={13} /> Delivered
          </div>
          <p className="mt-1.5 text-2xl font-extrabold text-on-surface">{stats.deliveredThisYear}</p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">sites this year</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
            <Layers size={13} /> Avg Value
          </div>
          <p className="mt-1.5 text-2xl font-extrabold text-on-surface">{formatEur(stats.avgValue)}</p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">per project</p>
        </Card>
      </div>

      {/* ── Layout: Board + Right Rail ── */}
      <div className="flex flex-col gap-5 xl:flex-row">
        {/* ── Project Board ── */}
        <div className="min-w-0 flex-1">
          <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
            {columns.map((col) => {
              const Icon = col.icon
              return (
                <div key={col.key} className="kanban-col min-w-[250px] flex-1">
                  {/* Column header */}
                  <div className="mb-2.5 flex items-center justify-between px-1">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-on-surface">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: col.color }} />
                      <Icon size={14} className="text-on-surface-variant/50" />
                      {col.label}
                    </span>
                    <span className="text-[11px] font-semibold text-on-surface-variant/50">{col.projects.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5">
                    {col.projects.length === 0 && (
                      <p className="py-6 text-center text-[11px] text-on-surface-variant/40 italic">No projects</p>
                    )}
                    {col.projects.map((project) => (
                      <ProjectCard key={project.id} project={project} onClick={() => setSelected(project)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right Rail ── */}
        <aside className="w-full shrink-0 space-y-4 xl:w-72">
          {/* Asset Lab — Ready Imagery */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Image size={15} className="text-on-surface-variant/60" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
                Asset Lab — ready imagery
              </h3>
            </div>
            <div className="space-y-2">
              {assetLab.slice(0, 6).map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-2 transition hover:border-white/10 hover:bg-white/[0.06]"
                >
                  {/* Thumbnail */}
                  <div
                    className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md"
                    style={{
                      background: `linear-gradient(135deg, hsl(${(asset.title.length * 47) % 360}, 28%, 20%), hsl(${(asset.title.length * 73) % 360}, 18%, 12%))`,
                    }}
                  >
                    <Camera size={13} className="text-white/15" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-on-surface">{asset.title}</p>
                    <p className="truncate text-[10px] text-on-surface-variant/50">{asset.brand}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-ghost mt-3 w-full !py-1.5 !text-[11px]">
              <ExternalLink size={11} /> View all in Asset Lab
            </button>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-on-surface-variant/60" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
                Upcoming deadlines
              </h3>
            </div>
            <div className="space-y-2">
              {upcomingDeadlines.length === 0 && (
                <p className="py-3 text-center text-[11px] text-on-surface-variant/40 italic">No upcoming deadlines</p>
              )}
              {upcomingDeadlines.map((p) => {
                const days = daysUntil(p.deadline)
                const urgent = days <= 7
                const overdue = days < 0
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 transition hover:border-white/10 hover:bg-white/[0.06] cursor-pointer"
                    onClick={() => setSelected(p)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-on-surface">{p.clientName}</p>
                      <p className="truncate text-[10px] text-on-surface-variant/50">{p.company}</p>
                    </div>
                    <span
                      className={`ml-2 shrink-0 text-[11px] font-semibold ${
                        overdue ? 'text-error' : urgent ? 'text-tertiary' : 'text-on-surface-variant'
                      }`}
                    >
                      {overdue ? `${Math.abs(days)}d late` : `${days}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </aside>
      </div>

      {/* ── Detail Drawer ── */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.company ?? 'Project Detail'}
      >
        {selected && (
          <div className="space-y-5">
            {/* Hero */}
            <HeroPlaceholder clientName={selected.clientName} company={selected.company} />

            {/* Client + type */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-on-surface">{selected.clientName}</h3>
                  <p className="mt-0.5 text-[12px] text-on-surface-variant">{selected.company}</p>
                </div>
                <StageBadge stage={selected.stage} />
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">Site Type</p>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-on-surface">
                  <Monitor size={12} className="text-on-surface-variant/50" />
                  {selected.siteType}
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">Value</p>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-on-surface">
                  <Euro size={12} className="text-on-surface-variant/50" />
                  {formatEur(selected.value)}
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">Deadline</p>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-on-surface">
                  <Calendar size={12} className="text-on-surface-variant/50" />
                  {formatDate(selected.deadline)}
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">Days Left</p>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-on-surface">
                  <Clock size={12} className="text-on-surface-variant/50" />
                  {selected.stage === 'delivered' ? '—' : `${daysUntil(selected.deadline)} days`}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/50">Description</h4>
              <p className="text-[12px] leading-relaxed text-on-surface-variant">{selected.description}</p>
            </div>

            {/* Notes */}
            {selected.notes && (
              <div className="rounded-lg border border-tertiary/15 bg-tertiary/[0.04] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary/60">Notes</p>
                <p className="mt-1 text-[12px] leading-relaxed text-tertiary/80">{selected.notes}</p>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/50">Timeline</h4>
              <div className="relative ml-1.5 space-y-0 border-l border-white/8 pl-3">
                {selected.timeline.map((step, i) => (
                  <div key={i} className="relative pb-2 last:pb-0">
                    <span
                      className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                        step.done
                          ? 'border-emerald-400 bg-emerald-400'
                          : 'border-white/15 bg-transparent'
                      }`}
                    />
                    <p
                      className={`text-[12px] font-medium ${
                        step.done ? 'text-on-surface' : 'text-on-surface-variant/50'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/40">{formatDate(step.date)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Asset Lab integration */}
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center gap-2">
                <Image size={14} className="text-on-surface-variant/60" />
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
                  Asset Lab — hero imagery
                </h4>
              </div>
              <p className="mb-2 text-[11px] text-on-surface-variant/60">
                Hero images generated by Leonardo. Ready for review in Asset Lab.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="flex aspect-video items-center justify-center rounded-md border border-white/5"
                    style={{
                      background: `linear-gradient(135deg, hsl(${(selected.company.length * n * 37) % 360}, 25%, 16%), hsl(${(selected.company.length * n * 53) % 360}, 15%, 10%))`,
                    }}
                  >
                    <Camera size={16} className="text-white/12" />
                  </div>
                ))}
              </div>
              <button className="btn-ghost mt-2 w-full !py-1.5 !text-[11px]">
                <ExternalLink size={11} /> Open in Asset Lab
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button className="btn-ghost w-full !justify-start !text-[12px]">
                <Monitor size={14} />
                View in Software Pipeline
              </button>
              <button className="btn-ghost w-full !justify-start !text-[12px]">
                <ArrowRight size={14} />
                Contact client
              </button>
              {selected.stage !== 'delivered' && (
                <button className="btn-accent w-full !justify-center !text-[12px]">
                  <CheckCircle size={14} />
                  Mark delivered
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
