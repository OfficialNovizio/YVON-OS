'use client'

import { useState, useMemo } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal, Drawer } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  User,
  Calendar,
  ArrowRight,
  Phone,
  Globe,
  Clock,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = 'Lead' | 'Conversation' | 'Proposal/Quote' | 'Negotiation' | 'Won' | 'Lost'

const STAGES: Stage[] = ['Lead', 'Conversation', 'Proposal/Quote', 'Negotiation', 'Won', 'Lost']

interface Deal {
  id: string
  clientName: string
  company: string
  value: number // €
  stage: Stage
  lastContactDate: string
  nextAction: string
  notes: string
  email: string
  phone: string
  source: string
  createdAt: string
}

interface NewDealForm {
  clientName: string
  company: string
  value: string
  notes: string
}

// ─── Stage colour map ────────────────────────────────────────────────────────

const stageColor: Record<Stage, { accent: string; border: string; bg: string; badge: 'blue' | 'yellow' | 'green' | 'red' | 'muted' }> = {
  Lead:              { accent: '#abc7ff', border: 'border-l-[#abc7ff]', bg: 'rgba(171,199,255,0.06)', badge: 'blue' },
  Conversation:      { accent: '#fbbf24', border: 'border-l-amber-400', bg: 'rgba(251,191,36,0.06)', badge: 'yellow' },
  'Proposal/Quote':  { accent: '#c4b5fd', border: 'border-l-violet-400', bg: 'rgba(196,181,253,0.06)', badge: 'muted' },
  Negotiation:       { accent: '#fb923c', border: 'border-l-orange-400', bg: 'rgba(251,146,60,0.07)', badge: 'yellow' },
  Won:               { accent: '#4ade80', border: 'border-l-emerald-400', bg: 'rgba(74,222,128,0.06)', badge: 'green' },
  Lost:              { accent: '#f87171', border: 'border-l-red-400', bg: 'rgba(248,113,113,0.06)', badge: 'red' },
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_DEALS: Deal[] = [
  {
    id: 'd1',
    clientName: 'Maria Solano',
    company: 'Brightwave Studio',
    value: 5000,
    stage: 'Lead',
    lastContactDate: '2026-06-08',
    nextAction: 'Send intro deck',
    notes: 'Inbound from LinkedIn post about agent-as-a-service. Needs cinematic site for July collection launch. Budget confirmed verbally.',
    email: 'maria@brightwave.studio',
    phone: '+34 612 345 678',
    source: 'LinkedIn',
    createdAt: '2026-06-05',
  },
  {
    id: 'd2',
    clientName: 'Tomas R.',
    company: 'Nordic Labs',
    value: 2000,
    stage: 'Conversation',
    lastContactDate: '2026-06-10',
    nextAction: 'Schedule demo call',
    notes: 'Agent-as-a-service retainer discussion. They want AI agent monitoring for their SaaS product. Sent initial capabilities overview.',
    email: 'tomas@nordiclabs.io',
    phone: '+46 70 123 4567',
    source: 'Referral — Kai',
    createdAt: '2026-06-03',
  },
  {
    id: 'd3',
    clientName: 'Lena K.',
    company: 'Café Mantra',
    value: 1200,
    stage: 'Lead',
    lastContactDate: '2026-06-11',
    nextAction: 'Qualify budget',
    notes: 'Inbound from newsletter. Small café chain — 3 locations. Interested in AI booking agent + site refresh.',
    email: 'lena@cafemantra.com',
    phone: '+49 30 555 1234',
    source: 'Newsletter',
    createdAt: '2026-06-11',
  },
  {
    id: 'd4',
    clientName: 'Priya M.',
    company: 'Studio Onyx',
    value: 8000,
    stage: 'Won',
    lastContactDate: '2026-06-01',
    nextAction: 'Onboarding call',
    notes: 'Closed — mission control build. Full-stack dashboard with AI agent orchestration. 8-week timeline. Signed contract.',
    email: 'priya@studioonyx.co',
    phone: '+44 20 7946 0958',
    source: 'Referral — Diana',
    createdAt: '2026-05-15',
  },
  {
    id: 'd5',
    clientName: 'James W.',
    company: 'Thornfield Capital',
    value: 15000,
    stage: 'Proposal/Quote',
    lastContactDate: '2026-06-09',
    nextAction: 'Follow up on proposal',
    notes: 'Enterprise retainer — agent-as-a-service for portfolio monitoring. Sent detailed proposal with 3 tiers. They are reviewing with their CTO.',
    email: 'james@thornfieldcapital.com',
    phone: '+1 212 555 0198',
    source: 'Inbound — Website',
    createdAt: '2026-05-28',
  },
  {
    id: 'd6',
    clientName: 'Sophie D.',
    company: 'Atelier Noir',
    value: 3500,
    stage: 'Conversation',
    lastContactDate: '2026-06-07',
    nextAction: 'Share case studies',
    notes: 'Luxury brand e-commerce. Had 45-min discovery call. Interested in AI stylist + automated product descriptions. Asked for fashion portfolio examples.',
    email: 'sophie@ateliernoir.fr',
    phone: '+33 1 42 68 53 00',
    source: 'Instagram DM',
    createdAt: '2026-06-02',
  },
  {
    id: 'd7',
    clientName: 'Ravi P.',
    company: 'Decimal Analytics',
    value: 4500,
    stage: 'Negotiation',
    lastContactDate: '2026-06-06',
    nextAction: 'Send revised SOW',
    notes: 'Data visualization dashboard. Negotiating scope — they want additional Tableau integration. Revised estimate at €5.2k, awaiting approval.',
    email: 'ravi@decimalanalytics.in',
    phone: '+91 98765 43210',
    source: 'Referral — Raj',
    createdAt: '2026-05-20',
  },
  {
    id: 'd8',
    clientName: 'Carlos V.',
    company: 'Verde Electric',
    value: 6000,
    stage: 'Lost',
    lastContactDate: '2026-05-25',
    nextAction: '—',
    notes: 'Lost to competitor — they went with an in-house team. May revisit in Q4 for consulting retainer. Keep on nurture list.',
    email: 'carlos@verdeelectric.com',
    phone: '+34 93 555 1212',
    source: 'Conference — WebSummit',
    createdAt: '2026-05-10',
  },
  {
    id: 'd9',
    clientName: 'Anna H.',
    company: 'Bloom Health',
    value: 9500,
    stage: 'Proposal/Quote',
    lastContactDate: '2026-06-10',
    nextAction: 'Clarify HIPAA compliance section',
    notes: 'Healthcare SaaS — AI agent for patient intake. Proposal sent, they have compliance questions. Critical deal — would be flagship health vertical case study.',
    email: 'anna@bloomhealth.com',
    phone: '+1 415 555 0172',
    source: 'Cold outreach — Nate',
    createdAt: '2026-05-22',
  },
  {
    id: 'd10',
    clientName: 'Marcus B.',
    company: 'Gridline Games',
    value: 7200,
    stage: 'Negotiation',
    lastContactDate: '2026-06-08',
    nextAction: 'Final pricing call Thursday',
    notes: 'Game studio — real-time player support agent. Negotiating monthly retainer vs project fee. Leaning toward €1.8k/mo retainer. Call scheduled Thursday 3pm.',
    email: 'marcus@gridlinegames.com',
    phone: '+1 310 555 0147',
    source: 'Twitter / X',
    createdAt: '2026-05-27',
  },
]

// ─── Mock relationship history & email threads ────────────────────────────────

const MOCK_HISTORY: Record<string, { date: string; type: string; summary: string }[]> = {
  d1: [
    { date: '2026-06-08', type: 'Email', summary: 'Maria reached out after seeing LinkedIn post about agent-as-a-service retainer offer.' },
    { date: '2026-06-07', type: 'LinkedIn', summary: 'You connected with Maria on LinkedIn. She liked your post about AI agents in fashion.' },
    { date: '2026-06-05', type: 'Form', summary: 'Inbound lead captured via website contact form.' },
  ],
  d2: [
    { date: '2026-06-10', type: 'Call', summary: '30-min discovery call. Tomas wants AI monitoring agents for their SaaS platform.' },
    { date: '2026-06-09', type: 'Email', summary: 'Sent capabilities overview and pricing tiers. Tomas replied positively.' },
    { date: '2026-06-03', type: 'Referral', summary: 'Referred by Kai. Nordic Labs is a former client of Kai\'s analytics consultancy.' },
  ],
  d4: [
    { date: '2026-06-01', type: 'Contract', summary: 'Signed. €8,000 project fee. Mission control dashboard build. 8 weeks.' },
    { date: '2026-05-28', type: 'Call', summary: 'Final negotiation call. Agreed on scope and timeline. Sent contract.' },
    { date: '2026-05-22', type: 'Meeting', summary: 'Second discovery session — Priya brought her CTO. Demoed YVON-OS capabilities.' },
    { date: '2026-05-15', type: 'Referral', summary: 'Referred by Diana. Studio Onyx is a design agency looking to add AI capabilities.' },
  ],
  d5: [
    { date: '2026-06-09', type: 'Email', summary: 'Proposal sent. Three tiers: Starter (€5k), Growth (€10k), Enterprise (€15k).' },
    { date: '2026-06-05', type: 'Call', summary: '45-min discovery call with James and their CTO. Scoped portfolio monitoring agent.' },
    { date: '2026-05-28', type: 'Form', summary: 'High-value inbound via website. Thornfield Capital manages €200M+ AUM.' },
  ],
}

const MOCK_EMAILS: Record<string, { from: string; date: string; preview: string }[]> = {
  d1: [
    { from: 'maria@brightwave.studio', date: 'Jun 8', preview: 'Hi! I saw your post about AI agents for fashion brands. We\'re launching a new collection in July and need a cinematic site. Can we chat?...' },
    { from: 'you@yvon.ai', date: 'Jun 8', preview: 'Thanks for reaching out, Maria! Happy to discuss. Our agent-as-a-service model is perfect for seasonal launches. How about a call this week?...' },
  ],
  d2: [
    { from: 'tomas@nordiclabs.io', date: 'Jun 10', preview: 'Great call earlier. The AI monitoring agent concept is exactly what we need. Can you send over the pricing tiers and timeline?...' },
    { from: 'you@yvon.ai', date: 'Jun 9', preview: 'Thanks Tomas. I\'ve attached our capabilities overview. For the monitoring agent retainer, we typically start at €2k/mo with a 3-month minimum...' },
  ],
  d4: [
    { from: 'priya@studioonyx.co', date: 'Jun 1', preview: 'Signed and returned! We\'re excited to get started on the mission control build. Can we schedule the onboarding call for next week?...' },
    { from: 'you@yvon.ai', date: 'Jun 1', preview: 'Amazing, welcome aboard Priya! I\'ll send the onboarding calendar link. We\'ll start with the discovery workshop and then move into sprints...' },
  ],
  d5: [
    { from: 'james@thornfieldcapital.com', date: 'Jun 10', preview: 'Received the proposal — our CTO is reviewing the Enterprise tier. Quick question on the data integration layer...' },
    { from: 'you@yvon.ai', date: 'Jun 9', preview: 'Hi James — as discussed, here\'s the proposal with three tiers. The Enterprise tier includes dedicated agent instances and priority support...' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEuro(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return k % 1 === 0 ? `€${k}k` : `€${k.toFixed(1)}k`
  }
  return `€${n}`
}

function daysAgo(dateStr: string): string {
  const delta = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (delta === 0) return 'Today'
  if (delta === 1) return 'Yesterday'
  return `${delta}d ago`
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const STAGE_LABEL_MAP: Record<Stage, string> = {
  Lead: 'Lead',
  Conversation: 'Conversation',
  'Proposal/Quote': 'Proposal/Quote',
  Negotiation: 'Negotiation',
  Won: 'Won',
  Lost: 'Lost',
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function ConsultingCRMPage() {
  const { data } = useLiveData<{ deals: Deal[] }>({
    url: '/api/consulting',
    mockData: { deals: SEED_DEALS },
  })

  const [deals, setDeals] = useState<Deal[]>(data?.deals ?? SEED_DEALS)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [showNewDeal, setShowNewDeal] = useState(false)
  const [newDeal, setNewDeal] = useState<NewDealForm>({ clientName: '', company: '', value: '', notes: '' })

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const active = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
    const wonThisMonth = deals.filter((d) => {
      if (d.stage !== 'Won') return false
      const now = new Date()
      const won = new Date(d.lastContactDate)
      return won.getMonth() === now.getMonth() && won.getFullYear() === now.getFullYear()
    })
    const pipelineValue = active.reduce((sum, d) => sum + d.value, 0)
    const avgDeal = active.length > 0 ? Math.round(pipelineValue / active.length) : 0
    return {
      activeDeals: active.length,
      pipelineValue,
      wonThisMonth: wonThisMonth.length,
      wonThisMonthValue: wonThisMonth.reduce((s, d) => s + d.value, 0),
      avgDealSize: avgDeal,
    }
  }, [deals])

  // ── Actions ────────────────────────────────────────────────────────────────

  const moveDeal = (deal: Deal, direction: -1 | 1) => {
    const currentIdx = STAGES.indexOf(deal.stage)
    const nextIdx = Math.max(0, Math.min(STAGES.length - 1, currentIdx + direction))
    const nextStage = STAGES[nextIdx]
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage: nextStage, lastContactDate: new Date().toISOString().slice(0, 10) } : d)))
    setSelectedDeal((prev) => (prev?.id === deal.id ? { ...prev, stage: nextStage } : prev))
  }

  const markWon = (deal: Deal) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, stage: 'Won', lastContactDate: new Date().toISOString().slice(0, 10), nextAction: 'Onboarding' } : d)),
    )
    setSelectedDeal((prev) => (prev?.id === deal.id ? { ...prev, stage: 'Won' } : prev))
  }

  const markLost = (deal: Deal) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, stage: 'Lost', lastContactDate: new Date().toISOString().slice(0, 10), nextAction: 'Revisit in 90 days' } : d)),
    )
    setSelectedDeal((prev) => (prev?.id === deal.id ? { ...prev, stage: 'Lost' } : prev))
  }

  const addDeal = () => {
    const valueNum = parseFloat(newDeal.value) || 0
    if (!newDeal.clientName.trim() || valueNum <= 0) return
    const deal: Deal = {
      id: `d${Date.now()}`,
      clientName: newDeal.clientName.trim(),
      company: newDeal.company.trim() || '—',
      value: valueNum,
      stage: 'Lead',
      lastContactDate: new Date().toISOString().slice(0, 10),
      nextAction: 'Initial outreach',
      notes: newDeal.notes.trim(),
      email: '',
      phone: '',
      source: 'Manual',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setDeals((prev) => [deal, ...prev])
    setNewDeal({ clientName: '', company: '', value: '', notes: '' })
    setShowNewDeal(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <PageHeader
        title="Consulting CRM"
        subtitle="Lead pipeline — manage consulting revenue and the agent-as-a-service retainer offer"
        actions={
          <button className="btn-accent" onClick={() => setShowNewDeal(true)}>
            <Plus size={15} />
            New Deal
          </button>
        }
      />

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/60">
            <Briefcase size={13} />
            Active Deals
          </div>
          <p className="mt-1.5 text-2xl font-bold text-on-surface">{stats.activeDeals}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/60">
            <DollarSign size={13} />
            Pipeline Value
          </div>
          <p className="mt-1.5 text-2xl font-bold text-on-surface">{formatEuro(stats.pipelineValue)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/60">
            <TrendingUp size={13} />
            Won This Month
          </div>
          <p className="mt-1.5 text-2xl font-bold text-emerald-300">
            {stats.wonThisMonth} <span className="text-sm font-medium text-emerald-400/60">{formatEuro(stats.wonThisMonthValue)}</span>
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/60">
            <TrendingUp size={13} />
            Avg Deal Size
          </div>
          <p className="mt-1.5 text-2xl font-bold text-on-surface">{formatEuro(stats.avgDealSize)}</p>
        </Card>
      </div>

      {/* ── Kanban ────────────────────────────────────────────────────── */}
      <div className="scroll-x flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage)
          const color = stageColor[stage]
          return (
            <div key={stage} className="kanban-col" style={{ minWidth: 260 }}>
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-on-surface">
                  <span className="h-2 w-2 rounded-full" style={{ background: color.accent }} />
                  {STAGE_LABEL_MAP[stage]}
                </span>
                <span className="text-[11px] text-on-surface-variant">{stageDeals.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                {stageDeals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal)}
                    className={`kanban-card relative w-full cursor-pointer border-l-[3px] text-left ${color.border}`}
                    style={{ background: color.bg }}
                  >
                    {/* Client name + avatar */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-black/80"
                        style={{ background: color.accent }}
                      >
                        {initials(deal.clientName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-on-surface">{deal.clientName}</p>
                        <p className="truncate text-[11px] text-on-surface-variant">{deal.company}</p>
                      </div>
                    </div>

                    {/* Value + last contact */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[14px] font-bold" style={{ color: color.accent }}>
                        {formatEuro(deal.value)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-on-surface-variant/70">
                        <Clock size={10} />
                        {daysAgo(deal.lastContactDate)}
                      </span>
                    </div>

                    {/* Next action */}
                    <div className="mt-2 flex items-start gap-1.5 text-[11px] text-on-surface-variant/80">
                      <ArrowRight size={11} className="mt-0.5 shrink-0" />
                      <span className="leading-snug">{deal.nextAction}</span>
                    </div>
                  </button>
                ))}

                {stageDeals.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/[0.06] px-3 py-6 text-center text-[12px] text-on-surface-variant/40">
                    No deals
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── New Deal Modal ─────────────────────────────────────────────── */}
      <Modal
        open={showNewDeal}
        onClose={() => {
          setShowNewDeal(false)
          setNewDeal({ clientName: '', company: '', value: '', notes: '' })
        }}
        title="New Deal"
        subtitle="Add a lead to the pipeline"
        size="md"
        footer={
          <>
            <button
              className="btn-ghost !py-2 !text-xs"
              onClick={() => {
                setShowNewDeal(false)
                setNewDeal({ clientName: '', company: '', value: '', notes: '' })
              }}
            >
              Cancel
            </button>
            <button className="btn-accent !py-2 !text-xs" onClick={addDeal} disabled={!newDeal.clientName.trim() || (parseFloat(newDeal.value) || 0) <= 0}>
              <Plus size={13} /> Add Deal
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-on-surface">Client Name *</label>
            <input
              type="text"
              value={newDeal.clientName}
              onChange={(e) => setNewDeal((f) => ({ ...f, clientName: e.target.value }))}
              placeholder="e.g. Maria Solano"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-on-surface">Company</label>
            <input
              type="text"
              value={newDeal.company}
              onChange={(e) => setNewDeal((f) => ({ ...f, company: e.target.value }))}
              placeholder="e.g. Brightwave Studio"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-on-surface">Deal Value (€) *</label>
            <input
              type="number"
              value={newDeal.value}
              onChange={(e) => setNewDeal((f) => ({ ...f, value: e.target.value }))}
              placeholder="e.g. 5000"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-on-surface">Notes</label>
            <textarea
              value={newDeal.notes}
              onChange={(e) => setNewDeal((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Context, source, requirements..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary/40 focus:outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* ── Deal Detail Drawer ──────────────────────────────────────────── */}
      <Drawer
        open={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        title={selectedDeal ? `${selectedDeal.clientName} · ${selectedDeal.company}` : ''}
        footer={
          selectedDeal && (
            <div className="flex w-full flex-wrap items-center gap-2">
              {selectedDeal.stage !== 'Won' && selectedDeal.stage !== 'Lost' && (
                <>
                  <button className="btn-accent !py-2 !text-xs" onClick={() => markWon(selectedDeal)}>
                    <CheckCircle size={13} /> Mark Won
                  </button>
                  <button className="btn-ghost !py-2 !text-xs" onClick={() => markLost(selectedDeal)}>
                    <XCircle size={13} /> Mark Lost
                  </button>
                </>
              )}
              {selectedDeal.stage !== 'Lead' && (
                <button
                  className="btn-ghost !py-2 !text-xs"
                  onClick={() => moveDeal(selectedDeal, -1)}
                  disabled={STAGES.indexOf(selectedDeal.stage) === 0}
                >
                  <ChevronLeft size={13} /> Move Back
                </button>
              )}
              {selectedDeal.stage !== 'Won' && selectedDeal.stage !== 'Lost' && (
                <button className="btn-ghost !py-2 !text-xs" onClick={() => moveDeal(selectedDeal, 1)}>
                  Advance <ChevronRight size={13} />
                </button>
              )}
            </div>
          )
        }
      >
        {selectedDeal && (
          <div className="space-y-5">
            {/* Stage + value badge */}
            <div className="flex items-center justify-between">
              <StatusBadge tone={stageColor[selectedDeal.stage].badge}>
                {STAGE_LABEL_MAP[selectedDeal.stage]}
              </StatusBadge>
              <span className="text-xl font-bold" style={{ color: stageColor[selectedDeal.stage].accent }}>
                {formatEuro(selectedDeal.value)}
              </span>
            </div>

            {/* Client info grid */}
            <div className="space-y-2.5">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/60">Client Info</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedDeal.email && (
                  <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                    <Mail size={13} className="text-on-surface-variant/50" />
                    <span className="truncate text-[12px] text-on-surface-variant">{selectedDeal.email}</span>
                  </div>
                )}
                {selectedDeal.phone && (
                  <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                    <Phone size={13} className="text-on-surface-variant/50" />
                    <span className="truncate text-[12px] text-on-surface-variant">{selectedDeal.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                  <Globe size={13} className="text-on-surface-variant/50" />
                  <span className="truncate text-[12px] text-on-surface-variant">Source: {selectedDeal.source}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                  <Calendar size={13} className="text-on-surface-variant/50" />
                  <span className="truncate text-[12px] text-on-surface-variant">Created {selectedDeal.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Next action */}
            <div>
              <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/60">Next Action</h4>
              <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5">
                <ArrowRight size={13} className="text-primary" />
                <span className="text-[13px] text-on-surface">{selectedDeal.nextAction}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/60">Notes</h4>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3.5 py-2.5 text-[13px] leading-relaxed text-on-surface-variant">
                {selectedDeal.notes}
              </div>
            </div>

            {/* Relationship history */}
            {MOCK_HISTORY[selectedDeal.id] && (
              <div>
                <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/60">Relationship History</h4>
                <div className="space-y-2">
                  {MOCK_HISTORY[selectedDeal.id].map((entry, i) => (
                    <div key={i} className="flex gap-3 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
                      <MessageSquare size={14} className="mt-0.5 shrink-0 text-on-surface-variant/40" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-on-surface-variant/80">{entry.type}</span>
                          <span className="text-[10px] text-on-surface-variant/40">{entry.date}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-snug text-on-surface-variant">{entry.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email thread preview */}
            {MOCK_EMAILS[selectedDeal.id] && (
              <div>
                <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant/60">Email Thread</h4>
                <div className="space-y-2">
                  {MOCK_EMAILS[selectedDeal.id].map((email, i) => (
                    <div key={i} className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3.5 py-2.5">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant/70">
                          <Mail size={11} /> {email.from}
                        </span>
                        <span className="text-[10px] text-on-surface-variant/40">{email.date}</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-on-surface-variant/80 line-clamp-3">{email.preview}</p>
                    </div>
                  ))}
                </div>
                <button className="btn-ghost mt-2 w-full !py-2 !text-xs">
                  <FileText size={13} /> Open Full Thread
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
              <button className="btn-ghost !py-2 !text-xs">
                <Mail size={13} /> Draft Outreach
              </button>
              {selectedDeal.stage !== 'Won' && selectedDeal.stage !== 'Lost' && (
                <button className="btn-ghost !py-2 !text-xs">
                  <FileText size={13} /> Send Proposal
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
