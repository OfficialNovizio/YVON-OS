'use client'

import { useState, useMemo } from 'react'
import { PageHeader, StatusBadge, Avatar, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useLiveData } from '@/lib/use-live-data'
import { PenSquare, Zap, Send, CornerUpRight, Archive, Clock, Check, Loader2, AlertTriangle, MessageSquare } from 'lucide-react'

// ── Types matching /api/inbox ──

type Account = {
  id: string
  label: string
  name: string
}

type Mail = {
  id: string
  account: string
  from: string
  initials: string
  subject: string
  snippet: string
  tone: 'blue' | 'yellow' | 'red' | 'muted'
  tag: string
  draft: string
}

type Contact = {
  rel: string
  value: string
  notes: string[]
}

type InboxResponse = {
  accounts: Account[]
  mails: Mail[]
  contacts: Record<string, Contact>
}

// ── Mock recent threads ──

type ThreadSummary = {
  subject: string
  date: string
  direction: 'in' | 'out'
}

const MOCK_THREADS: Record<string, ThreadSummary[]> = {
  m1: [
    { subject: 'Re: Cinematic site for the new collection — timeline?', date: '2h ago', direction: 'in' },
    { subject: 'Initial pitch sent — Brightwave scope', date: 'Yesterday', direction: 'out' },
    { subject: 'Portfolio link — fashion cinematic reel', date: 'Jun 8', direction: 'out' },
    { subject: 'Intro from DTC Collective — Maria Solano', date: 'Jun 5', direction: 'in' },
  ],
  m2: [
    { subject: 'Valhalla — closing set at VVVV?', date: '1h ago', direction: 'in' },
    { subject: 'Availability for festival season Q3', date: 'Jun 7', direction: 'out' },
    { subject: 'VVVV 2025 aftermovie — Valhalla highlight', date: 'May 28', direction: 'in' },
  ],
  m3: [
    { subject: 'Revised SaaS retainer agreement', date: '3h ago', direction: 'in' },
    { subject: 'Contract draft v2 — comments inline', date: 'Jun 6', direction: 'out' },
    { subject: 'Retainer scope update — Q2 addendum', date: 'May 30', direction: 'in' },
  ],
  m5: [
    { subject: 'Q3 check-in — portfolio review', date: '1d ago', direction: 'in' },
    { subject: 'Q2 deck + metrics shared', date: 'Jun 2', direction: 'out' },
    { subject: 'Quarterly review — calendar poll', date: 'May 25', direction: 'in' },
  ],
  m6: [
    { subject: 'Re: DJ booking availability — August dates', date: '4h ago', direction: 'in' },
    { subject: 'Café Mantra — residency inquiry follow-up', date: 'Jun 4', direction: 'out' },
    { subject: 'August lineup — initial interest', date: 'May 29', direction: 'in' },
  ],
  m7: [
    { subject: 'AI ops consulting — exploratory call', date: '5h ago', direction: 'in' },
    { subject: 'Agent workflow thread on X — thanks for the link', date: 'Jun 7', direction: 'out' },
    { subject: 'ScaleUp Labs — cold inbound', date: 'Jun 6', direction: 'in' },
  ],
}

// ── Fallback mock data (shown while loading / on error) ──

const FALLBACK: InboxResponse = {
  accounts: [
    { id: 'personal', label: 'vibe@', name: 'Personal' },
    { id: 'business', label: 'biz@', name: 'Business' },
    { id: 'consulting', label: 'hello@', name: 'Consulting' },
    { id: 'newsletter', label: 'me@', name: 'Newsletter' },
  ],
  mails: [
    { id: 'm1', account: 'personal', from: 'Maria Solano · Brightwave Studio', initials: 'MS', subject: 'Re: Cinematic site for the new collection — timeline?', snippet: 'Hi Maria — thanks for reaching out. A July launch is doable…', tone: 'blue', tag: 'Reply now', draft: 'Hi Maria,\n\nThanks for reaching out — a July launch is absolutely doable. Cinematic single-page sites in this style run €5k depending on scope. The fastest way forward is a quick 20-minute call this week — does Thursday or Friday morning work for you?\n\nBest,\nStark' },
    { id: 'm2', account: 'personal', from: 'Jonas Weber · VVVV Festival', initials: 'JW', subject: 'Valhalla — closing set at VVVV?', snippet: 'We are finalizing the lineup and would love Valhalla for the closing…', tone: 'blue', tag: 'Reply now', draft: 'Hey Jonas,\n\nClosing set sounds amazing — Valhalla would love that. Could you send over the date, stage, and set length? Happy to lock it in once we have the details.\n\nCheers,\nStark' },
    { id: 'm3', account: 'business', from: 'Legal · Hartmann & Vogel', initials: 'HV', subject: 'Revised SaaS retainer agreement', snippet: 'Please find attached the revised retainer with the changes…', tone: 'yellow', tag: 'Escalate', draft: 'Hi — received, thank you. I\'ll review the revised clauses and revert by end of week. Could you confirm the notice period change in section 4?\n\nBest,\nStark' },
    { id: 'm4', account: 'business', from: 'Stripe Billing', initials: 'ST', subject: 'Action required — re: your payout account', snippet: 'We need to verify some details about your payout account…', tone: 'red', tag: 'Flagged', draft: '' },
    { id: 'm5', account: 'business', from: 'Peakbridge Ventures', initials: 'PV', subject: 'Q3 check-in — portfolio review', snippet: 'Hi Stark — we\'d like to schedule the quarterly portfolio review for next week…', tone: 'muted', tag: 'Schedule', draft: 'Hi team,\n\nHappy to do the Q3 review. Thursday or Friday afternoon works best — let me know which slot you prefer and I\'ll confirm.\n\nBest,\nStark' },
    { id: 'm6', account: 'consulting', from: 'Café Mantra · events', initials: 'CM', subject: 'Re: DJ booking availability — August dates', snippet: 'We\'d love to have Valhalla play the August session…', tone: 'muted', tag: 'Reply now', draft: 'Hey — great to hear from you! Valhalla is open for the August session. Could you share the date and set length? Happy to lock it in.\n\nCheers,\nStark' },
    { id: 'm7', account: 'consulting', from: 'Liora Chen · ScaleUp Labs', initials: 'LC', subject: 'AI ops consulting — exploratory call', snippet: 'We saw your agent workflow system and are curious about bringing it in-house…', tone: 'blue', tag: 'Lead', draft: 'Hi Liora,\n\nGreat to hear ScaleUp Labs is interested. Happy to walk through the system — let me know what timezone and preferred day next week, and I\'ll send a calendar invite.\n\nBest,\nStark' },
    { id: 'm8', account: 'newsletter', from: 'Substack Digest', initials: 'SD', subject: 'Your weekly roundup — top 5 reads in AI + business', snippet: 'This week: agent orchestration patterns, a CEO who replaced middle management with AI…', tone: 'muted', tag: 'Read later', draft: '' },
    { id: 'm9', account: 'newsletter', from: 'Fashion United · Insider Brief', initials: 'FU', subject: 'DTC brands pivot to AI-first operations', snippet: 'A growing number of direct-to-consumer brands are restructuring around agentic workflows…', tone: 'muted', tag: 'Read later', draft: '' },
  ],
  contacts: {
    m1: { rel: 'Prospect · warm', value: '~€5k inquiry', notes: ['Fashion drops, cinematic style', 'Prefers Spanish for small talk, English for business', 'Found us via the YouTube description'] },
    m2: { rel: 'Booking · festival', value: 'VVVV closing set', notes: ['Repeat festival partner', 'Prefers minimal email — decisive and fast', 'Closing slot = premium rate'] },
    m3: { rel: 'Vendor · legal', value: 'Retainer', notes: ['Handles all contracts', 'Slow to respond — nudge weekly'] },
    m4: { rel: 'System', value: 'Billing', notes: ['Do not enter credentials here', 'Verify in Stripe dashboard directly'] },
    m5: { rel: 'Investor · quarterly', value: 'Portfolio review', notes: ['Q3 review — prepare numbers', 'Prefers video call, 30 min'] },
    m6: { rel: 'Lead · booking', value: 'Valhalla gig', notes: ['Repeat venue', 'August session'] },
    m7: { rel: 'Lead · inbound', value: 'Consulting inquiry', notes: ['ScaleUp Labs = AI ops consultancy', 'Found via agent workflow thread on X', 'High-value lead — prioritize'] },
    m8: { rel: 'Passive', value: 'Weekly digest', notes: ['Auto-filtered to newsletter folder', 'Skim weekly, no reply needed'] },
    m9: { rel: 'Passive', value: 'Industry news', notes: ['Auto-filtered to newsletter folder', 'DTC + AI trend articles'] },
  },
}

export default function InboxPage() {
  // ── Live data hook ──
  const { data, loading, error, source } = useLiveData<InboxResponse>({
    url: '/api/inbox',
    mockData: FALLBACK,
    pollIntervalMs: 30000,
  })

  const accounts = data?.accounts ?? []
  const mails = data?.mails ?? []
  const contacts = data?.contacts ?? {}

  // ── Local state ──
  const [accountFilter, setAccountFilter] = useState('All')
  const [selId, setSelId] = useState('m1')
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<string[]>([])
  const [triage, setTriage] = useState(false)
  const [tIdx, setTIdx] = useState(0)

  // ── Inbox Zero mock state ──
  const [inboxZeroPct] = useState(67)
  const [nextSweepTime] = useState('18:00')

  // ── Derived ──
  const filteredMails = useMemo(
    () => (accountFilter === 'All' ? mails : mails.filter((m) => m.account === accountFilter)),
    [mails, accountFilter],
  )

  const sel = filteredMails.find((m) => m.id === selId)
  const contact = sel ? contacts[sel.id] : undefined
  const threads = sel ? (MOCK_THREADS[sel.id] ?? []) : []

  // Init draft when selected mail changes
  const pick = (m: Mail) => {
    setSelId(m.id)
    setDraft(m.draft)
  }

  // If selection vanishes (e.g. after filter), reset to first
  if (!sel && filteredMails.length > 0) {
    pick(filteredMails[0])
  }

  const send = () => {
    setSent((s) => [...s, selId])
  }

  const tMail = mails[tIdx]

  // ── Derive sender name + company from sel.from ──
  const senderParts = sel?.from ? sel.from.split(' · ') : []
  const senderName = senderParts[0] ?? ''
  const senderCompany = senderParts[1] ?? ''

  // ── Loading state ──
  if (loading && !data) {
    return (
      <div>
        <PageHeader
          title="Inbox"
          subtitle="One surface for four accounts. Agents pre-draft every reply; review, edit and send without leaving Mission Control."
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-on-surface-variant" />
          <span className="ml-3 text-sm text-on-surface-variant">Loading inbox…</span>
        </div>
      </div>
    )
  }

  // ── Error state (with fallback data) ──
  const errorBanner = error ? (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-[12px] text-error">
      <AlertTriangle size={14} />
      <span>API unavailable — showing cached data</span>
    </div>
  ) : null

  // ── No mail selected guard ──
  if (!sel) {
    return (
      <div>
        <PageHeader title="Inbox" subtitle="One surface for four accounts." />
        <p className="text-sm text-on-surface-variant">No emails match this filter.</p>
      </div>
    )
  }

  // ── Render ──
  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="One surface for four accounts. Agents pre-draft every reply; review, edit and send without leaving Mission Control."
        actions={
          <>
            <button className="btn-ghost"><PenSquare size={15} /> Draft email</button>
            <button className="btn-accent" onClick={() => { setTriage(true); setTIdx(0) }}><Zap size={15} /> Triage mode</button>
          </>
        }
      />

      {errorBanner}

      {/* ── Inbox Zero protocol indicator ── */}
      <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusBadge tone="green">Inbox Zero · twice daily</StatusBadge>
            <span className="text-[12px] text-on-surface-variant">
              {inboxZeroPct}% done · next sweep at {nextSweepTime}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant/60">
            {sent.length} sent · {mails.length - sent.length} to clear
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${inboxZeroPct}%`,
              background: 'linear-gradient(90deg, var(--ws-accent), #34d399)',
            }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-on-surface-variant/50">
          <span>Today&apos;s sweep</span>
          <span>{inboxZeroPct}%</span>
        </div>
      </div>

      {/* ── Account filters + source indicator ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-on-surface-variant/60">
          {source === 'live' ? '● Live' : '◌ Cached'}
        </span>
        <span className="text-[12px] text-on-surface-variant">
          {accounts.length} accounts
        </span>
        <div className="ml-auto flex gap-1.5">
          <button
            key="All"
            onClick={() => setAccountFilter('All')}
            className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
            style={accountFilter === 'All' ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' } : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }}
          >
            All
          </button>
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccountFilter(a.id)}
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
              style={accountFilter === a.id ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' } : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_320px]">
        {/* ── Email list ── */}
        <Card className="h-fit overflow-hidden p-0">
          {filteredMails.map((m) => (
            <button
              key={m.id}
              onClick={() => pick(m)}
              className="block w-full border-b border-white/6 p-3 text-left transition last:border-0"
              style={{ background: selId === m.id ? 'var(--ws-accent-soft)' : 'transparent' }}
            >
              <div className="flex items-center gap-2">
                <Avatar initials={m.initials} />
                <span className="flex-1 truncate text-[12px] font-semibold text-on-surface">{m.from}</span>
                {sent.includes(m.id) ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <StatusBadge tone={m.tone}>{m.tag}</StatusBadge>
                )}
              </div>
              <p className="mt-1 truncate text-[12px] text-on-surface">{m.subject}</p>
              <p className="truncate text-[11px] text-on-surface-variant">{m.snippet}</p>
            </button>
          ))}
        </Card>

        {/* ── Reading + inline draft ── */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-on-surface">{sel.subject}</h3>
          <p className="mt-0.5 text-[12px] text-on-surface-variant">{sel.from}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-on-surface-variant">
            {sel.snippet} Lorem context of the original message so you can reply with full memory of the thread.
          </p>

          <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
              <Zap size={12} style={{ color: 'var(--ws-accent)' }} /> Pre-drafted reply — edit inline
            </p>
            {sel.draft ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={7}
                className="w-full resize-none rounded-lg border border-white/8 bg-transparent p-2.5 text-[13px] leading-relaxed text-on-surface focus:border-[var(--ws-glow)] focus:outline-none"
              />
            ) : (
              <p className="rounded-lg bg-error/10 p-3 text-[12px] text-error">
                Agent is unsure — needs your input. Don&apos;t enter credentials; verify in the provider&apos;s dashboard.
              </p>
            )}
            {sel.draft && (
              <div className="mt-2 flex gap-2">
                <button
                  className="btn-accent !py-1.5 !text-xs"
                  onClick={send}
                  disabled={sent.includes(selId)}
                >
                  <Send size={13} /> {sent.includes(selId) ? 'Sent' : 'Send'}
                </button>
                <button className="btn-ghost !py-1.5 !text-xs">
                  <CornerUpRight size={13} /> Escalate to Henry
                </button>
                <button className="btn-ghost !py-1.5 !text-xs">Regenerate</button>
              </div>
            )}
          </div>
        </Card>

        {/* ── Contact intelligence panel (right rail) ── */}
        <Card className="h-fit p-4">
          {/* Sender name + company header */}
          <div className="mb-4">
            <div className="flex items-center gap-2.5">
              <Avatar initials={sel.initials} />
              <div>
                <p className="text-[13px] font-semibold text-on-surface">{senderName}</p>
                {senderCompany && (
                  <p className="text-[11px] text-on-surface-variant/70">{senderCompany}</p>
                )}
              </div>
            </div>
          </div>

          {contact ? (
            <>
              {/* Relationship status + value */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone="blue">{contact.rel}</StatusBadge>
                <StatusBadge tone="muted">{contact.value}</StatusBadge>
              </div>

              {/* Contact memory notes */}
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/60">
                Contact memory
              </p>
              <ul className="space-y-1.5">
                {contact.notes.map((n) => (
                  <li key={n} className="flex gap-2 text-[12px] text-on-surface-variant">
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ background: 'var(--ws-accent)' }}
                    />
                    {n}
                  </li>
                ))}
              </ul>

              {/* Recent threads timeline */}
              {threads.length > 0 && (
                <>
                  <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/60">
                    Recent threads
                  </p>
                  <div className="space-y-2">
                    {threads.map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {/* Timeline dot + line */}
                        <div className="flex flex-col items-center pt-1">
                          <div
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{
                              background: t.direction === 'in'
                                ? 'var(--ws-accent)'
                                : 'var(--ws-accent-soft)',
                            }}
                          />
                          {i < threads.length - 1 && (
                            <div className="mt-0.5 h-full w-px bg-white/[0.08]" style={{ minHeight: 20 }} />
                          )}
                        </div>
                        {/* Thread info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-on-surface-variant leading-snug truncate">
                            {t.subject}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MessageSquare
                              size={11}
                              className="text-on-surface-variant/40 shrink-0"
                            />
                            <span className="text-[10px] text-on-surface-variant/50">
                              {t.date} · {t.direction === 'in' ? 'Received' : 'Sent'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-[12px] text-on-surface-variant">No contact data available.</p>
          )}
        </Card>
      </div>

      {/* ── Triage modal ── */}
      <Modal
        open={triage}
        onClose={() => setTriage(false)}
        title={`Triage · email ${tIdx + 1} of ${mails.length}`}
        subtitle={tMail?.from ?? ''}
        size="lg"
        footer={
          <>
            <button className="btn-ghost !py-1.5 !text-xs"><Clock size={13} /> Defer</button>
            <button className="btn-ghost !py-1.5 !text-xs"><Archive size={13} /> Archive</button>
            <button
              className="btn-accent !py-1.5 !text-xs"
              onClick={() => (tIdx < mails.length - 1 ? setTIdx(tIdx + 1) : setTriage(false))}
            >
              <Send size={13} /> Send &amp; next
            </button>
          </>
        }
      >
        {tMail ? (
          <>
            <h3 className="text-sm font-semibold text-on-surface">{tMail.subject}</h3>
            <p className="mt-2 text-[13px] text-on-surface-variant">{tMail.snippet}</p>
            <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[13px] leading-relaxed text-on-surface">
              {tMail.draft || 'No draft — agent needs your input.'}
            </div>
          </>
        ) : (
          <p className="text-sm text-on-surface-variant">No emails to triage.</p>
        )}
      </Modal>
    </div>
  )
}
