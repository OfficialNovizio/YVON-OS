'use client'

import { useState, useMemo } from 'react'
import { PageHeader, StatusBadge, Avatar, Chip, Card, SectionLabel } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import {
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  MessageSquare,
  Clock,
  UserPlus,
  Users,
  Activity,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Pencil,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type RelationTag = 'Client' | 'Partner' | 'Lead' | 'Vendor'
type Interaction = { date: string; type: 'email' | 'call' | 'meeting' | 'note'; summary: string; agent?: string }

type Person = {
  id: string
  name: string
  company: string
  role: string
  email: string
  phone?: string
  workspace: string
  rel: RelationTag
  tone: 'blue' | 'green' | 'muted' | 'yellow'
  lastContact: string
  notes: string[]
  interactions: Interaction[]
  avatarColor?: string
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const NOW = new Date()
const fmt = (d: Date) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => fmt(new Date(NOW.getTime() - n * 86400000))

const MOCK_PEOPLE: Person[] = [
  {
    id: 'p1', name: 'Maria Solano', company: 'Brightwave Studio', role: 'Creative Director',
    email: 'maria@brightwave.studio', phone: '+34 612 345 678', workspace: 'vibe',
    rel: 'Lead', tone: 'blue', lastContact: daysAgo(2),
    notes: ['€5k cinematic site inquiry', 'Prefers Spanish for small talk', 'Found us via YouTube'],
    interactions: [
      { date: daysAgo(2), type: 'email', summary: 'Sent project brief — cinematic brand site, 6 pages', agent: 'WM' },
      { date: daysAgo(5), type: 'call', summary: 'Initial discovery call — budget €4-6k, timeline 6 weeks', agent: 'WM' },
      { date: daysAgo(8), type: 'note', summary: 'Referred by Tomas R. from Nordic Labs', agent: 'KX' },
    ],
    avatarColor: '#5ee0ff',
  },
  {
    id: 'p2', name: 'Tomas R.', company: 'Nordic Labs', role: 'CTO & Co-founder',
    email: 'tomas@nordiclabs.io', workspace: 'canela',
    rel: 'Client', tone: 'green', lastContact: daysAgo(1),
    notes: ['€2k/mo retainer — e-commerce platform', 'Technical founder, prefers Slack', 'Strong referral source'],
    interactions: [
      { date: daysAgo(1), type: 'meeting', summary: 'Sprint review — Canela checkout flow approved', agent: 'NX' },
      { date: daysAgo(4), type: 'email', summary: 'Requested API docs for inventory sync', agent: 'LE' },
      { date: daysAgo(7), type: 'call', summary: 'Monthly strategy sync — Q3 roadmap planning', agent: 'WM' },
    ],
    avatarColor: '#5fd0b4',
  },
  {
    id: 'p3', name: 'Priya M.', company: 'Studio Onyx', role: 'Founder & CEO',
    email: 'priya@studioonyx.co', workspace: 'vibe',
    rel: 'Client', tone: 'green', lastContact: daysAgo(0),
    notes: ['€8k mission control build', 'Top referral source — 3 inbound leads this quarter', 'Loves the glass aesthetic'],
    interactions: [
      { date: daysAgo(0), type: 'meeting', summary: 'Final delivery — Mission Control dashboard handoff', agent: 'NX' },
      { date: daysAgo(3), type: 'email', summary: 'Approved final designs, requested 2 minor tweaks', agent: 'SC' },
      { date: daysAgo(6), type: 'note', summary: 'Introduced us to Hourbour team', agent: 'KX' },
    ],
    avatarColor: '#abc7ff',
  },
  {
    id: 'p4', name: 'Lena K.', company: 'Café Mantra', role: 'Owner',
    email: 'lena@cafemantra.com', workspace: 'valhalla',
    rel: 'Lead', tone: 'muted', lastContact: daysAgo(6),
    notes: ['Newsletter signup — warm lead', 'Valhalla booking interest for events', 'Small budget but high-taste'],
    interactions: [
      { date: daysAgo(6), type: 'email', summary: 'Replied to newsletter — interested in event booking system', agent: 'WM' },
      { date: daysAgo(14), type: 'note', summary: 'Signed up via Valhalla landing page', agent: 'IS' },
    ],
  },
  {
    id: 'p5', name: 'David Chen', company: 'Horizon VC', role: 'Partner',
    email: 'david@horizonvc.com', phone: '+1 415 890 1234', workspace: 'bydesign',
    rel: 'Partner', tone: 'blue', lastContact: daysAgo(3),
    notes: ['Strategic partnership — co-marketing for portfolio companies', '€15k annual retainer on the table', 'Wants dedicated agent pipeline'],
    interactions: [
      { date: daysAgo(3), type: 'meeting', summary: 'Partnership proposal — co-branded AI pipeline for portfolio', agent: 'WM' },
      { date: daysAgo(10), type: 'call', summary: 'Intro call — impressed by Vibe with AI demo', agent: 'KX' },
      { date: daysAgo(15), type: 'email', summary: 'Reached out via LinkedIn after seeing our post', agent: 'IS' },
    ],
    avatarColor: '#c08bff',
  },
  {
    id: 'p6', name: 'Sarah Mitchell', company: 'CloudDeploy GmbH', role: 'VP Engineering',
    email: 'sarah@clouddeploy.de', workspace: 'canela',
    rel: 'Vendor', tone: 'muted', lastContact: daysAgo(9),
    notes: ['Infrastructure partner — €500/mo bare metal', 'Dedicated support SLA', 'Migration to their new Frankfurt DC in Q4'],
    interactions: [
      { date: daysAgo(9), type: 'email', summary: 'Quarterly infrastructure review — 99.97% uptime', agent: 'NX' },
      { date: daysAgo(30), type: 'call', summary: 'Negotiated reserved instances — 22% cost reduction', agent: 'NX' },
    ],
    avatarColor: '#6b7280',
  },
  {
    id: 'p7', name: 'Alex Rivera', company: 'TikTok Creative', role: 'Content Strategist',
    email: 'alex@ttcreative.io', workspace: 'vibe',
    rel: 'Lead', tone: 'yellow', lastContact: daysAgo(1),
    notes: ['Hot lead — €12k social media pipeline', '10-person team, needs agency-style workflow', 'Urgent: wants proposal by Friday'],
    interactions: [
      { date: daysAgo(1), type: 'call', summary: 'Urgent discovery — needs social pipeline for 3 brands', agent: 'SC' },
      { date: daysAgo(4), type: 'email', summary: 'Sent portfolio + case studies', agent: 'SC' },
    ],
    avatarColor: '#f59e0b',
  },
  {
    id: 'p8', name: 'Yuki Tanaka', company: 'Zen Studios', role: 'Creative Producer',
    email: 'yuki@zenstudios.jp', workspace: 'valhalla',
    rel: 'Partner', tone: 'green', lastContact: daysAgo(5),
    notes: ['Music production partner for Valhalla', 'Co-producing 3 tracks for launch', 'Revenue share model — 70/30'],
    interactions: [
      { date: daysAgo(5), type: 'meeting', summary: 'Track review — "Neon Tide" final mix approved', agent: 'SC' },
      { date: daysAgo(12), type: 'call', summary: 'Studio session planning — 4 tracks for Q3', agent: 'SC' },
      { date: daysAgo(20), type: 'note', summary: 'Met at Berlin Music Tech conference', agent: 'IS' },
    ],
    avatarColor: '#c08bff',
  },
  {
    id: 'p9', name: 'Marcus Webb', company: 'Webb & Co Legal', role: 'Managing Partner',
    email: 'marcus@webbco.legal', workspace: 'bydesign',
    rel: 'Vendor', tone: 'muted', lastContact: daysAgo(14),
    notes: ['Legal counsel — €300/hr retainer', 'Reviewing all client contracts', 'IP strategy for AI-generated content'],
    interactions: [
      { date: daysAgo(14), type: 'email', summary: 'Reviewed Horizon VC partnership agreement', agent: 'WM' },
      { date: daysAgo(28), type: 'meeting', summary: 'Quarterly legal audit — all contracts compliant', agent: 'WM' },
    ],
  },
  {
    id: 'p10', name: 'Nia Okafor', company: 'AfriTech Ventures', role: 'Investment Director',
    email: 'nia@afritech.vc', workspace: 'canela',
    rel: 'Lead', tone: 'blue', lastContact: daysAgo(7),
    notes: ['Enterprise lead — €50k platform build', 'Needs multi-tenant dashboard for 12 portfolio companies', 'Slow decision cycle — board approval needed'],
    interactions: [
      { date: daysAgo(7), type: 'call', summary: 'Demo call — loved the agent routing + glass UI', agent: 'NX' },
      { date: daysAgo(10), type: 'email', summary: 'Sent enterprise pricing + architecture overview', agent: 'LE' },
    ],
    avatarColor: '#5fd0b4',
  },
]

const WORKSPACES = ['All', 'vibe', 'canela', 'valhalla', 'bydesign']
const REL_COLORS: Record<RelationTag, string> = {
  Client: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  Partner: 'bg-primary/10 text-primary border-primary/25',
  Lead: 'bg-tertiary/15 text-tertiary border-tertiary/25',
  Vendor: 'bg-white/5 text-on-surface-variant border-white/10',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isActiveThisMonth(p: Person): boolean {
  const d = new Date(p.lastContact)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function isNewThisWeek(p: Person): boolean {
  const d = new Date(p.lastContact)
  const weekAgo = new Date(NOW.getTime() - 7 * 86400000)
  return d >= weekAgo
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const [search, setSearch] = useState('')
  const [wsFilter, setWsFilter] = useState('All')
  const [sel, setSel] = useState<Person | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { data } = useLiveData<{ people: Person[] }>({
    url: '/api/people',
    mockData: { people: MOCK_PEOPLE },
  })
  const people = data?.people ?? MOCK_PEOPLE

  const filtered = useMemo(() => {
    return people.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
      const matchWs = wsFilter === 'All' || p.workspace === wsFilter
      return matchSearch && matchWs
    })
  }, [people, search, wsFilter])

  const stats = useMemo(() => ({
    total: people.length,
    activeThisMonth: people.filter(isActiveThisMonth).length,
    newThisWeek: people.filter(isNewThisWeek).length,
  }), [people])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      <PageHeader
        title="People"
        subtitle="The humans in your world — partners, clients and leads. The relationship layer behind Inbox and CRM."
      />

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-3">
        <Card className="flex items-center gap-3 px-4 py-3">
          <Users size={16} className="text-on-surface-variant" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Total contacts</p>
            <p className="text-lg font-bold text-on-surface">{stats.total}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <Activity size={16} className="text-emerald-400" />
          <div>
            <p className="text-[11px] text-on-surface-variant">Active this month</p>
            <p className="text-lg font-bold text-emerald-300">{stats.activeThisMonth}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <UserPlus size={16} className="text-primary" />
          <div>
            <p className="text-[11px] text-on-surface-variant">New this week</p>
            <p className="text-lg font-bold text-primary">{stats.newThisWeek}</p>
          </div>
        </Card>
      </div>

      {/* ── Search + filters ──────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name, company, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input !pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {WORKSPACES.map((ws) => (
            <button
              key={ws}
              onClick={() => setWsFilter(ws)}
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
              style={
                wsFilter === ws
                  ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' }
                  : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }
              }
            >
              {ws === 'All' ? 'All workspaces' : ws}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contact cards ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[13px] text-on-surface-variant">
            No contacts match your filters.
          </div>
        )}
        {filtered.map((p) => {
          const open = expanded.has(p.id)
          return (
            <div
              key={p.id}
              className="border-b border-white/6 last:border-0"
            >
              {/* Row */}
              <button
                onClick={() => setSel(p)}
                className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/[0.03]"
              >
                <Avatar initials={p.name.slice(0, 2)} color={p.avatarColor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-on-surface truncate">{p.name}</p>
                    <Chip accent>{p.workspace}</Chip>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {p.role} · {p.company}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-on-surface-variant/60">
                    {p.lastContact}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${REL_COLORS[p.rel]}`}
                  >
                    {p.rel}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(p.id) }}
                  className="btn-ghost !p-1.5"
                >
                  {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              </button>

              {/* Expanded panel */}
              {open && (
                <div className="border-t border-white/6 bg-white/[0.015] px-4 py-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Contact info */}
                    <div>
                      <SectionLabel>Contact</SectionLabel>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                          <Mail size={12} /> {p.email}
                        </div>
                        {p.phone && (
                          <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                            <Phone size={12} /> {p.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                          <Building2 size={12} /> {p.company}
                        </div>
                      </div>
                    </div>
                    {/* Notes */}
                    <div>
                      <SectionLabel>Notes</SectionLabel>
                      <ul className="space-y-1">
                        {p.notes.map((n, i) => (
                          <li key={i} className="flex gap-2 text-[12px] text-on-surface-variant">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--ws-accent)' }} />
                            {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Interaction timeline */}
                  {p.interactions.length > 0 && (
                    <div className="mt-4">
                      <SectionLabel>Recent Interactions</SectionLabel>
                      <div className="space-y-2">
                        {p.interactions.slice(0, 5).map((ix, i) => (
                          <div key={i} className="flex gap-3 text-[12px]">
                            <span className="mt-0.5 shrink-0 text-[10px] font-mono text-on-surface-variant/50 w-16">
                              {ix.date.slice(5)}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                {ix.type === 'email' && <Mail size={10} className="text-on-surface-variant/40" />}
                                {ix.type === 'call' && <Phone size={10} className="text-on-surface-variant/40" />}
                                {ix.type === 'meeting' && <CalendarDays size={10} className="text-on-surface-variant/40" />}
                                {ix.type === 'note' && <Pencil size={10} className="text-on-surface-variant/40" />}
                                <span className="text-on-surface-variant">{ix.summary}</span>
                              </div>
                              {ix.agent && (
                                <span className="text-[10px] text-on-surface-variant/40">Agent {ix.agent}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </Card>

      {/* ── Detail modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.name}
        subtitle={sel ? `${sel.role} · ${sel.company} — ${sel.workspace}` : ''}
        size="lg"
        footer={
          <>
            <button className="btn-ghost !py-1.5 !text-xs">
              <ExternalLink size={13} /> View deal
            </button>
            <button className="btn-accent !py-1.5 !text-xs">
              <Mail size={13} /> Email
            </button>
          </>
        }
      >
        {sel && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar initials={sel.name.slice(0, 2)} color={sel.avatarColor} />
              <div>
                <p className="text-[13px] font-semibold text-on-surface">{sel.name}</p>
                <p className="text-[11px] text-on-surface-variant">{sel.email}</p>
              </div>
              <span className={`ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${REL_COLORS[sel.rel]}`}>
                {sel.rel}
              </span>
            </div>

            <div>
              <SectionLabel>Contact Info</SectionLabel>
              <Card className="!rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-[12px] text-on-surface-variant"><Mail size={12} /> {sel.email}</div>
                {sel.phone && <div className="flex items-center gap-2 text-[12px] text-on-surface-variant"><Phone size={12} /> {sel.phone}</div>}
                <div className="flex items-center gap-2 text-[12px] text-on-surface-variant"><Building2 size={12} /> {sel.company}</div>
                <div className="flex items-center gap-2 text-[12px] text-on-surface-variant"><Clock size={12} /> Last contact: {sel.lastContact}</div>
              </Card>
            </div>

            <div>
              <SectionLabel>Notes</SectionLabel>
              <ul className="space-y-1.5">
                {sel.notes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-on-surface-variant">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--ws-accent)' }} />
                    {n}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <SectionLabel>Interaction History</SectionLabel>
              <div className="space-y-2">
                {sel.interactions.map((ix, i) => (
                  <Card key={i} className="!rounded-xl !p-3 flex gap-3">
                    <span className="mt-0.5 shrink-0 text-[10px] font-mono text-on-surface-variant/50">
                      {ix.date}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        {ix.type === 'email' && <Mail size={11} className="text-on-surface-variant/40" />}
                        {ix.type === 'call' && <Phone size={11} className="text-on-surface-variant/40" />}
                        {ix.type === 'meeting' && <CalendarDays size={11} className="text-on-surface-variant/40" />}
                        {ix.type === 'note' && <Pencil size={11} className="text-on-surface-variant/40" />}
                        <span className="text-[12px] font-medium text-on-surface capitalize">{ix.type}</span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-on-surface-variant">{ix.summary}</p>
                      {ix.agent && <p className="mt-0.5 text-[10px] text-on-surface-variant/50">Agent {ix.agent}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
