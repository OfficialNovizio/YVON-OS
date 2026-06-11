'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { ExternalLink, Plus, Send, CalendarClock, RefreshCw, Mail } from 'lucide-react'

const TABS = ['Audience', 'Compose', 'Broadcasts', 'Sequences', 'Growth', 'Analytics'] as const
type Tab = (typeof TABS)[number]

export default function NewsletterPage() {
  const [tab, setTab] = useState<Tab>('Compose')
  const [sendOpen, setSendOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Newsletter"
        subtitle="Mission Control → Kit · broadcasts, lifecycle sequences, measured on clicks, replies & conversions."
        actions={
          <>
            <button className="btn-ghost"><ExternalLink size={15} /> Open in Kit</button>
            <button className="btn-accent"><Plus size={15} /> New broadcast</button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge tone="green">Connected to Kit</StatusBadge>
        <StatusBadge tone="muted">API healthy · synced 2m ago</StatusBadge>
        <span className="text-[12px] text-on-surface-variant">Monthly cadence</span>
      </div>

      {/* tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-white/8 pb-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition" style={tab === t ? { background: 'var(--ws-accent)', color: '#06121f' } : { color: '#c1c6d6' }}>{t}</button>
        ))}
      </div>

      {tab === 'Audience' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <Card className="p-4">
            <p className="text-[12px] text-on-surface-variant">Total subscribers</p>
            <p className="text-3xl font-bold text-on-surface">128 <span className="text-sm font-medium text-emerald-400">+12</span></p>
            <div className="mt-3 flex h-24 items-end gap-1">
              {[30, 45, 40, 60, 55, 75, 70, 90, 85, 100, 110, 128].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h / 1.3}%`, background: 'var(--ws-accent)', opacity: 0.4 + i / 24 }} />
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h4 className="mb-2 text-sm font-semibold text-on-surface">By segment</h4>
            {[['Newsletter', 128], ['Course waitlist', 41], ['App users', 63], ['Consulting leads', 9], ['Dormant (90d)', 11]].map(([n, v]) => (
              <div key={n as string} className="flex items-center justify-between border-b border-white/5 py-1.5 text-[12px] last:border-0">
                <span className="text-on-surface-variant">{n}</span><span className="font-semibold text-on-surface">{v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'Compose' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <Card className="p-4">
            <p className="text-[11px] text-on-surface-variant">Issue #13</p>
            <input defaultValue="The cockpit, not the dashboard" className="w-full bg-transparent text-lg font-semibold text-on-surface focus:outline-none" />
            <input defaultValue="Why I stopped building dashboards" className="mt-1 w-full bg-transparent text-[12px] text-on-surface-variant focus:outline-none" placeholder="Preview text" />
            <div className="mt-3 space-y-2">
              {['Story: the cockpit vs the dashboard', 'Decision Queue — the 7 things that need me', 'By Design — ship while you sleep', 'CTA: reply with your hardest workflow'].map((b) => (
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
              <p className="text-sm font-semibold text-on-surface">I stopped building dashboards…</p>
              <p className="mt-1 text-[12px] text-on-surface-variant">…and built a cockpit instead. Here is what changed.</p>
              <button className="btn-accent mt-3 !py-1.5 !text-xs"><Mail size={12} /> Read in Kit</button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'Broadcasts' && (
        <Card className="p-4">
          {[['#13 The cockpit, not the dashboard', '—', '—', 'Draft'], ['#12 Now I plan with no code', '47%', '6.1%', 'Sent'], ['#11 Meet the agent roster', '52%', '9.0%', 'Sent']].map(([t, o, c, s]) => (
            <div key={t as string} className="flex flex-wrap items-center gap-3 border-b border-white/6 py-3 last:border-0">
              <span className="flex-1 text-[13px] text-on-surface">{t}</span>
              <span className="text-[12px] text-on-surface-variant">Open {o}</span>
              <span className="text-[12px] text-on-surface-variant">Click {c}</span>
              <StatusBadge tone={s === 'Sent' ? 'green' : 'yellow'}>{s as string}</StatusBadge>
            </div>
          ))}
          <p className="mt-3 rounded-lg bg-white/[0.03] p-3 text-[12px] text-on-surface-variant">Top performer: #11 “Meet the agent roster” at 9.0% click. Single clear CTA + free feature did best — lean into agent-centric next send.</p>
        </Card>
      )}

      {tab === 'Sequences' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[['Welcome series', '4 steps', 'on signup'], ['New app feature', '3 steps', 'tag applied'], ['Cart recapture', '2 steps', 'cart abandoned']].map(([n, s, trig]) => (
            <Card key={n} hover className="p-4">
              <h4 className="text-sm font-semibold text-on-surface">{n}</h4>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">{s} · {trig}</p>
              <div className="mt-3 space-y-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-on-surface-variant"><span className="h-5 w-5 rounded-full text-center text-[10px] leading-5" style={{ background: 'var(--ws-accent-soft)', color: 'var(--ws-accent)' }}>{i + 1}</span> Email step {i + 1}</div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'Growth' && (
        <Card className="p-4">
          {[['YouTube description link', '+9'], ['Course waitlist form', '+1'], ['Landing page', '+2'], ['By Design in-app capture', '+0']].map(([s, v]) => (
            <div key={s} className="flex items-center justify-between border-b border-white/6 py-2.5 text-[13px] last:border-0">
              <span className="text-on-surface-variant">{s}</span><span className="font-semibold text-emerald-400">{v}</span>
            </div>
          ))}
        </Card>
      )}

      {tab === 'Analytics' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['Opens', '49%'], ['Clicks', '7.4%'], ['Replies', '11'], ['Conversions', '3']].map(([k, v]) => (
            <Card key={k} className="p-4"><p className="text-[12px] text-on-surface-variant">{k}</p><p className="text-2xl font-bold text-on-surface">{v}</p></Card>
          ))}
        </div>
      )}

      <Modal open={sendOpen} onClose={() => setSendOpen(false)} title="Send via Kit" subtitle="Issue #13 · 128 subscribers" footer={<><button className="btn-ghost !py-1.5 !text-xs" onClick={() => setSendOpen(false)}>Cancel</button><button className="btn-accent !py-1.5 !text-xs" onClick={() => setSendOpen(false)}>Confirm in Kit</button></>}>
        <p className="text-[13px] text-on-surface-variant">This sends through the Kit API to 128 subscribers. Send a test to yourself first?</p>
        <button className="btn-ghost mt-3 !py-1.5 !text-xs">Send test to myself</button>
      </Modal>
    </div>
  )
}
