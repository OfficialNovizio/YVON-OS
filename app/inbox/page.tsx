'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Avatar, Card } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { PenSquare, Zap, Send, CornerUpRight, Archive, Clock, Check } from 'lucide-react'

const ACCOUNTS = ['All', 'vibe@', 'hello@', 'me@', 'biz@']

type Mail = {
  id: string
  from: string
  initials: string
  subject: string
  snippet: string
  tone: 'blue' | 'yellow' | 'red' | 'muted'
  tag: string
  draft: string
}

const MAILS: Mail[] = [
  { id: 'm1', from: 'Maria Solano · Brightwave Studio', initials: 'MS', subject: 'Re: Cinematic site for the new collection — timeline?', snippet: 'Hi Maria — thanks for reaching out. A July launch is doable…', tone: 'blue', tag: 'Reply now', draft: 'Hi Maria,\n\nThanks for reaching out — a July launch is absolutely doable. Cinematic single-page sites in this style run €5k depending on scope. The fastest way forward is a quick 20-minute call this week — does Thursday or Friday morning work for you?\n\nBest,\nStark' },
  { id: 'm2', from: 'Legal · Hartmann & Vogel', initials: 'HV', subject: 'Revised SaaS retainer agreement', snippet: 'Please find attached the revised retainer with the changes…', tone: 'yellow', tag: 'Escalate', draft: 'Hi — received, thank you. I’ll review the revised clauses and revert by end of week. Could you confirm the notice period change in section 4?\n\nBest,\nStark' },
  { id: 'm3', from: 'Stripe Billing', initials: 'ST', subject: 'Action required — re: your payout account', snippet: 'We need to verify some details about your payout account…', tone: 'red', tag: 'Flagged', draft: '' },
  { id: 'm4', from: 'Café Mantra · events', initials: 'CM', subject: 'Re: DJ booking availability — August dates', snippet: 'We’d love to have Valhalla play the August session…', tone: 'muted', tag: 'Reply now', draft: 'Hey — great to hear from you! Valhalla is open for the August session. Could you share the date and set length? Happy to lock it in.\n\nCheers,\nStark' },
]

const CONTACT: Record<string, { rel: string; value: string; notes: string[] }> = {
  m1: { rel: 'Prospect · warm', value: '~€5k inquiry', notes: ['Fashion drops, cinematic style', 'Prefers Spanish for small talk, English for business', 'Found us via the YouTube description'] },
  m2: { rel: 'Vendor · legal', value: 'Retainer', notes: ['Handles all contracts', 'Slow to respond — nudge weekly'] },
  m3: { rel: 'System', value: 'Billing', notes: ['Do not enter credentials here', 'Verify in Stripe dashboard directly'] },
  m4: { rel: 'Lead · booking', value: 'Valhalla gig', notes: ['Repeat venue', 'August session'] },
}

export default function InboxPage() {
  const [account, setAccount] = useState('All')
  const [selId, setSelId] = useState('m1')
  const [draft, setDraft] = useState(MAILS[0].draft)
  const [sent, setSent] = useState<string[]>([])
  const [triage, setTriage] = useState(false)
  const [tIdx, setTIdx] = useState(0)

  const sel = MAILS.find((m) => m.id === selId)!
  const pick = (m: Mail) => { setSelId(m.id); setDraft(m.draft) }
  const send = () => { setSent((s) => [...s, selId]); }

  const tMail = MAILS[tIdx]

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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge tone="green">Inbox-zero protocol · twice daily</StatusBadge>
        <span className="text-[12px] text-on-surface-variant">{sent.length} sent · {MAILS.length - sent.length} to clear · 4 accounts</span>
        <div className="ml-auto flex gap-1.5">
          {ACCOUNTS.map((a) => (
            <button key={a} onClick={() => setAccount(a)} className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={account === a ? { background: 'var(--ws-accent-soft)', borderColor: 'var(--ws-glow)', color: 'var(--ws-accent)' } : { borderColor: 'rgba(255,255,255,0.08)', color: '#c1c6d6' }}>{a}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_280px]">
        {/* list */}
        <Card className="h-fit overflow-hidden p-0">
          {MAILS.map((m) => (
            <button key={m.id} onClick={() => pick(m)} className="block w-full border-b border-white/6 p-3 text-left transition last:border-0" style={{ background: selId === m.id ? 'var(--ws-accent-soft)' : 'transparent' }}>
              <div className="flex items-center gap-2">
                <Avatar initials={m.initials} />
                <span className="flex-1 truncate text-[12px] font-semibold text-on-surface">{m.from}</span>
                {sent.includes(m.id) ? <Check size={13} className="text-emerald-400" /> : <StatusBadge tone={m.tone}>{m.tag}</StatusBadge>}
              </div>
              <p className="mt-1 truncate text-[12px] text-on-surface">{m.subject}</p>
              <p className="truncate text-[11px] text-on-surface-variant">{m.snippet}</p>
            </button>
          ))}
        </Card>

        {/* reading + draft */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-on-surface">{sel.subject}</h3>
          <p className="mt-0.5 text-[12px] text-on-surface-variant">{sel.from}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-on-surface-variant">{sel.snippet} Lorem context of the original message so you can reply with full memory of the thread.</p>

          <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant"><Zap size={12} style={{ color: 'var(--ws-accent)' }} /> Pre-drafted reply — edit inline</p>
            {sel.draft ? (
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={7} className="w-full resize-none rounded-lg border border-white/8 bg-transparent p-2.5 text-[13px] leading-relaxed text-on-surface focus:border-[var(--ws-glow)] focus:outline-none" />
            ) : (
              <p className="rounded-lg bg-error/10 p-3 text-[12px] text-error">Agent is unsure — needs your input. Don’t enter credentials; verify in the provider’s dashboard.</p>
            )}
            {sel.draft && (
              <div className="mt-2 flex gap-2">
                <button className="btn-accent !py-1.5 !text-xs" onClick={send} disabled={sent.includes(selId)}>
                  <Send size={13} /> {sent.includes(selId) ? 'Sent' : 'Send'}
                </button>
                <button className="btn-ghost !py-1.5 !text-xs"><CornerUpRight size={13} /> Escalate to Henry</button>
                <button className="btn-ghost !py-1.5 !text-xs">Regenerate</button>
              </div>
            )}
          </div>
        </Card>

        {/* contact panel */}
        <Card className="h-fit p-4">
          <h4 className="mb-1 text-sm font-semibold text-on-surface">What we know about {sel.from.split(' · ')[0]}</h4>
          <div className="mb-3 flex items-center gap-2">
            <StatusBadge tone="blue">{CONTACT[selId].rel}</StatusBadge>
            <StatusBadge tone="muted">{CONTACT[selId].value}</StatusBadge>
          </div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/60">Contact memory</p>
          <ul className="space-y-1.5">
            {CONTACT[selId].notes.map((n) => (
              <li key={n} className="flex gap-2 text-[12px] text-on-surface-variant"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--ws-accent)' }} />{n}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* triage */}
      <Modal
        open={triage}
        onClose={() => setTriage(false)}
        title={`Triage · email ${tIdx + 1} of ${MAILS.length}`}
        subtitle={tMail.from}
        size="lg"
        footer={
          <>
            <button className="btn-ghost !py-1.5 !text-xs"><Clock size={13} /> Defer</button>
            <button className="btn-ghost !py-1.5 !text-xs"><Archive size={13} /> Archive</button>
            <button className="btn-accent !py-1.5 !text-xs" onClick={() => (tIdx < MAILS.length - 1 ? setTIdx(tIdx + 1) : setTriage(false))}>
              <Send size={13} /> Send & next
            </button>
          </>
        }
      >
        <h3 className="text-sm font-semibold text-on-surface">{tMail.subject}</h3>
        <p className="mt-2 text-[13px] text-on-surface-variant">{tMail.snippet}</p>
        <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[13px] leading-relaxed text-on-surface">
          {tMail.draft || 'No draft — agent needs your input.'}
        </div>
      </Modal>
    </div>
  )
}
