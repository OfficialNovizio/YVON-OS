'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { ExternalLink, Plus, Send, CalendarClock, RefreshCw, Mail } from 'lucide-react'
import { useLiveData } from '@/lib/use-live-data'
import type { NewsletterFeed, KitBroadcast, KitSequence, KitGrowthSource, KitDraft, KitAnalytics } from '@/app/api/newsletter/route'

const TABS = ['Audience', 'Compose', 'Broadcasts', 'Sequences', 'Growth', 'Analytics'] as const
type Tab = (typeof TABS)[number]

// ── Fallback data used while loading / on error ────────────────────────

const FALLBACK: NewsletterFeed = {
  total_subscribers: 128,
  new_30d: 12,
  churn_30d: 2,
  subscriber_history: [30, 45, 40, 60, 55, 75, 70, 90, 85, 100, 110, 128],
  segments: [
    { name: 'Newsletter', count: 128, filter: 'tag:newsletter' },
    { name: 'Course waitlist', count: 41, filter: 'tag:course-waitlist' },
    { name: 'App users', count: 63, filter: 'tag:app-user' },
    { name: 'Consulting leads', count: 9, filter: 'tag:consulting' },
    { name: 'Dormant (90d)', count: 11, filter: 'inactive:90d' },
  ],
  draft: {
    issue: 13,
    subject: 'The cockpit, not the dashboard',
    preview_text: 'Why I stopped building dashboards',
    blocks: [
      'Story: the cockpit vs the dashboard',
      'Decision Queue — the 7 things that need me',
      'By Design — ship while you sleep',
      'CTA: reply with your hardest workflow',
    ],
  },
  broadcasts: [
    { id: 'b_13', issue: 13, subject: 'The cockpit, not the dashboard', open_rate: null, click_rate: null, status: 'draft', sent_at: null },
    { id: 'b_12', issue: 12, subject: 'Now I plan with no code', open_rate: 47, click_rate: 6.1, status: 'sent', sent_at: '2026-06-04T10:00:00Z' },
    { id: 'b_11', issue: 11, subject: 'Meet the agent roster', open_rate: 52, click_rate: 9.0, status: 'sent', sent_at: '2026-05-28T10:00:00Z' },
  ],
  top_performer_note: 'Top performer: #11 “Meet the agent roster” at 9.0% click. Single clear CTA + free feature did best — lean into agent-centric next send.',
  sequences: [
    {
      id: 1, name: 'Welcome series', steps: 4, trigger: 'on signup', active: true,
      steps_detail: [
        { step_num: 1, subject: 'Welcome — here is your cockpit' },
        { step_num: 2, subject: 'First 3 things to set up' },
        { step_num: 3, subject: 'How the agents think' },
        { step_num: 4, subject: 'Your first Decision Queue' },
      ],
    },
    {
      id: 2, name: 'New app feature', steps: 3, trigger: 'tag applied', active: true,
      steps_detail: [
        { step_num: 1, subject: 'We shipped something new' },
        { step_num: 2, subject: 'Here is how to use it' },
        { step_num: 3, subject: 'What the data says' },
      ],
    },
    {
      id: 3, name: 'Cart recapture', steps: 2, trigger: 'cart abandoned', active: false,
      steps_detail: [
        { step_num: 1, subject: 'Still thinking about it?' },
        { step_num: 2, subject: 'Last call — your cart expires tonight' },
      ],
    },
  ],
  growth_sources: [
    { source: 'YouTube description link', new_subscribers_30d: 9 },
    { source: 'Course waitlist form', new_subscribers_30d: 1 },
    { source: 'Landing page', new_subscribers_30d: 2 },
    { source: 'By Design in-app capture', new_subscribers_30d: 0 },
  ],
  growth_total_30d: 12,
  analytics: {
    avg_open_rate: 49,
    avg_click_rate: 7.4,
    total_replies: 11,
    total_conversions: 3,
  },
  source: 'mock',
  synced_at: new Date().toISOString(),
  kit_connected: true,
  api_healthy: true,
}

// ── Helpers ────────────────────────────────────────────────────────────

function fmtRate(v: number | null): string {
  if (v == null) return '—'
  return `${v}%`
}

function kitConnectedLabel(connected?: boolean, healthy?: boolean): { tone: 'green' | 'yellow' | 'red'; text: string } {
  if (connected && healthy) return { tone: 'green', text: 'Connected to Kit' }
  if (connected && !healthy) return { tone: 'yellow', text: 'Kit API degraded' }
  return { tone: 'red', text: 'Kit not connected' }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins === 1) return '1m ago'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

// ── Page ───────────────────────────────────────────────────────────────

export default function NewsletterPage() {
  const [tab, setTab] = useState<Tab>('Compose')
  const [sendOpen, setSendOpen] = useState(false)

  const { data, loading, refetch } = useLiveData<NewsletterFeed>({
    url: '/api/newsletter',
    mockData: FALLBACK,
    pollIntervalMs: 60000,
  })

  // Always have data thanks to mockData fallback
  const feed = data ?? FALLBACK
  const { total_subscribers, new_30d, subscriber_history, segments, draft, broadcasts, top_performer_note, sequences, growth_sources, analytics } = feed
  const kit = kitConnectedLabel(feed.kit_connected, feed.api_healthy)

  return (
    <div>
      <PageHeader
        title="Newsletter"
        subtitle="Mission Control → Kit · broadcasts, lifecycle sequences, measured on clicks, replies & conversions."
        actions={
          <>
            <button className="btn-ghost" onClick={() => refetch()}><RefreshCw size={15} /> Refresh</button>
            <button className="btn-ghost"><ExternalLink size={15} /> Open in Kit</button>
            <button className="btn-accent"><Plus size={15} /> New broadcast</button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge tone={kit.tone}>{kit.text}</StatusBadge>
        <StatusBadge tone="muted">API healthy · synced {timeAgo(feed.synced_at)}</StatusBadge>
        {loading && <span className="text-[11px] text-on-surface-variant animate-pulse">Refreshing…</span>}
        <span className="text-[12px] text-on-surface-variant">Monthly cadence</span>
      </div>

      {/* tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-white/8 pb-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition" style={tab === t ? { background: 'var(--ws-accent)', color: '#06121f' } : { color: '#c1c6d6' }}>{t}</button>
        ))}
      </div>

      {/* ─── AUDIENCE ─────────────────────────────────────────── */}

      {tab === 'Audience' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <Card className="p-4">
            <p className="text-[12px] text-on-surface-variant">Total subscribers</p>
            <p className="text-3xl font-bold text-on-surface">
              {total_subscribers}{' '}
              {new_30d > 0 && (
                <span className="text-sm font-medium text-emerald-400">+{new_30d}</span>
              )}
            </p>
            <div className="mt-3 flex h-24 items-end gap-1">
              {subscriber_history.map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h / 1.3}%`, background: 'var(--ws-accent)', opacity: 0.4 + i / 24 }} />
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h4 className="mb-2 text-sm font-semibold text-on-surface">By segment</h4>
            {segments.map((s) => (
              <div key={s.name} className="flex items-center justify-between border-b border-white/5 py-1.5 text-[12px] last:border-0">
                <span className="text-on-surface-variant">{s.name}</span><span className="font-semibold text-on-surface">{s.count}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ─── COMPOSE ──────────────────────────────────────────── */}

      {tab === 'Compose' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <Card className="p-4">
            <p className="text-[11px] text-on-surface-variant">Issue #{draft.issue}</p>
            <input defaultValue={draft.subject} className="w-full bg-transparent text-lg font-semibold text-on-surface focus:outline-none" />
            <input defaultValue={draft.preview_text} className="mt-1 w-full bg-transparent text-[12px] text-on-surface-variant focus:outline-none" placeholder="Preview text" />
            <div className="mt-3 space-y-2">
              {draft.blocks.map((b) => (
                <div key={b} className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5 text-[13px] text-on-surface">{b}</div>
              ))}
              <button className="btn-ghost w-full !justify-center !py-1.5 !text-xs"><Plus size={13} /> Add a block</button>
            </div>
            <div className="mt-4 rounded-lg bg-tertiary/10 p-2.5 text-[12px] text-on-surface-variant">
              Posting a send to Kit is an external action. William prepped the draft, but schedule/send is gated until you review.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-accent !py-1.5 !text-xs" onClick={() => setSendOpen(true)}><CalendarClock size={13} /> Approve & schedule</button>
              <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setSendOpen(true)}><Send size={13} /> Approve & send now</button>
              <button className="btn-ghost !py-1.5 !text-xs"><RefreshCw size={13} /> Regenerate copy</button>
            </div>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/60">Live preview</p>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 h-6 w-20 rounded" style={{ background: 'var(--ws-accent)' }} />
              <p className="text-sm font-semibold text-on-surface">{draft.subject}…</p>
              <p className="mt-1 text-[12px] text-on-surface-variant">{draft.preview_text}…</p>
              <button className="btn-accent mt-3 !py-1.5 !text-xs"><Mail size={12} /> Read in Kit</button>
            </div>
          </Card>
        </div>
      )}

      {/* ─── BROADCASTS ───────────────────────────────────────── */}

      {tab === 'Broadcasts' && (
        <Card className="p-4">
          {broadcasts.map((b) => {
            const label = b.status === 'sent'
              ? `#${b.issue} ${b.subject}`
              : `#${b.issue} ${b.subject}`
            const sTone = b.status === 'sent' ? 'green' : b.status === 'sending' ? 'yellow' : 'yellow'
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-3 border-b border-white/6 py-3 last:border-0">
                <span className="flex-1 text-[13px] text-on-surface">{label}</span>
                <span className="text-[12px] text-on-surface-variant">Open {fmtRate(b.open_rate)}</span>
                <span className="text-[12px] text-on-surface-variant">Click {fmtRate(b.click_rate)}</span>
                <StatusBadge tone={sTone}>{b.status === 'sent' ? 'Sent' : b.status === 'sending' ? 'Sending' : 'Draft'}</StatusBadge>
              </div>
            )
          })}
          <p className="mt-3 rounded-lg bg-white/[0.03] p-3 text-[12px] text-on-surface-variant">{top_performer_note}</p>
        </Card>
      )}

      {/* ─── SEQUENCES ────────────────────────────────────────── */}

      {tab === 'Sequences' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {sequences.map((seq) => (
            <Card key={seq.id} hover className="p-4">
              <h4 className="text-sm font-semibold text-on-surface">{seq.name}</h4>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">{seq.steps} steps · {seq.trigger}</p>
              <div className="mt-3 space-y-1.5">
                {seq.steps_detail.map((step) => (
                  <div key={step.step_num} className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                    <span className="h-5 w-5 rounded-full text-center text-[10px] leading-5" style={{ background: 'var(--ws-accent-soft)', color: 'var(--ws-accent)' }}>{step.step_num}</span>
                    {step.subject}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── GROWTH ───────────────────────────────────────────── */}

      {tab === 'Growth' && (
        <Card className="p-4">
          {growth_sources.map((gs) => (
            <div key={gs.source} className="flex items-center justify-between border-b border-white/6 py-2.5 text-[13px] last:border-0">
              <span className="text-on-surface-variant">{gs.source}</span>
              <span className="font-semibold text-emerald-400">+{gs.new_subscribers_30d}</span>
            </div>
          ))}
        </Card>
      )}

      {/* ─── ANALYTICS ────────────────────────────────────────── */}

      {tab === 'Analytics' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {([
            ['Opens', `${analytics.avg_open_rate}%`],
            ['Clicks', `${analytics.avg_click_rate}%`],
            ['Replies', String(analytics.total_replies)],
            ['Conversions', String(analytics.total_conversions)],
          ] as const).map(([k, v]) => (
            <Card key={k} className="p-4"><p className="text-[12px] text-on-surface-variant">{k}</p><p className="text-2xl font-bold text-on-surface">{v}</p></Card>
          ))}
        </div>
      )}

      {/* ─── MODAL ────────────────────────────────────────────── */}

      <Modal open={sendOpen} onClose={() => setSendOpen(false)} title="Send via Kit" subtitle={`Issue #${draft.issue} · ${total_subscribers} subscribers`} footer={<><button className="btn-ghost !py-1.5 !text-xs" onClick={() => setSendOpen(false)}>Cancel</button><button className="btn-accent !py-1.5 !text-xs" onClick={() => setSendOpen(false)}>Confirm in Kit</button></>}>
        <p className="text-[13px] text-on-surface-variant">This sends through the Kit API to {total_subscribers} subscribers. Send a test to yourself first?</p>
        <button className="btn-ghost mt-3 !py-1.5 !text-xs">Send test to myself</button>
      </Modal>
    </div>
  )
}
