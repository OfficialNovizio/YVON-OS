/**
 * /api/inbox
 *
 * GET  → Returns inbox data for 4 email accounts with pre-drafted replies.
 *
 * Response: { accounts: Account[], mails: Mail[], contacts: Record<string, Contact> }
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

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

const ACCOUNTS: Account[] = [
  { id: 'personal', label: 'vibe@', name: 'Personal' },
  { id: 'business', label: 'biz@', name: 'Business' },
  { id: 'consulting', label: 'hello@', name: 'Consulting' },
  { id: 'newsletter', label: 'me@', name: 'Newsletter' },
]

const MAILS: Mail[] = [
  // --- Personal (vibe@) ---
  {
    id: 'm1',
    account: 'personal',
    from: 'Maria Solano · Brightwave Studio',
    initials: 'MS',
    subject: 'Re: Cinematic site for the new collection — timeline?',
    snippet:
      'Hi Maria — thanks for reaching out. A July launch is doable…',
    tone: 'blue',
    tag: 'Reply now',
    draft:
      'Hi Maria,\n\nThanks for reaching out — a July launch is absolutely doable. Cinematic single-page sites in this style run €5k depending on scope. The fastest way forward is a quick 20-minute call this week — does Thursday or Friday morning work for you?\n\nBest,\nStark',
  },
  {
    id: 'm2',
    account: 'personal',
    from: 'Jonas Weber · VVVV Festival',
    initials: 'JW',
    subject: 'Valhalla — closing set at VVVV?',
    snippet:
      'We are finalizing the lineup and would love Valhalla for the closing…',
    tone: 'blue',
    tag: 'Reply now',
    draft:
      'Hey Jonas,\n\nClosing set sounds amazing — Valhalla would love that. Could you send over the date, stage, and set length? Happy to lock it in once we have the details.\n\nCheers,\nStark',
  },

  // --- Business (biz@) ---
  {
    id: 'm3',
    account: 'business',
    from: 'Legal · Hartmann & Vogel',
    initials: 'HV',
    subject: 'Revised SaaS retainer agreement',
    snippet:
      'Please find attached the revised retainer with the changes…',
    tone: 'yellow',
    tag: 'Escalate',
    draft:
      'Hi — received, thank you. I’ll review the revised clauses and revert by end of week. Could you confirm the notice period change in section 4?\n\nBest,\nStark',
  },
  {
    id: 'm4',
    account: 'business',
    from: 'Stripe Billing',
    initials: 'ST',
    subject: 'Action required — re: your payout account',
    snippet:
      'We need to verify some details about your payout account…',
    tone: 'red',
    tag: 'Flagged',
    draft: '',
  },
  {
    id: 'm5',
    account: 'business',
    from: 'Peakbridge Ventures',
    initials: 'PV',
    subject: 'Q3 check-in — portfolio review',
    snippet:
      'Hi Stark — we’d like to schedule the quarterly portfolio review for next week…',
    tone: 'muted',
    tag: 'Schedule',
    draft:
      'Hi team,\n\nHappy to do the Q3 review. Thursday or Friday afternoon works best — let me know which slot you prefer and I’ll confirm.\n\nBest,\nStark',
  },

  // --- Consulting (hello@) ---
  {
    id: 'm6',
    account: 'consulting',
    from: 'Café Mantra · events',
    initials: 'CM',
    subject: 'Re: DJ booking availability — August dates',
    snippet:
      'We’d love to have Valhalla play the August session…',
    tone: 'muted',
    tag: 'Reply now',
    draft:
      'Hey — great to hear from you! Valhalla is open for the August session. Could you share the date and set length? Happy to lock it in.\n\nCheers,\nStark',
  },
  {
    id: 'm7',
    account: 'consulting',
    from: 'Liora Chen · ScaleUp Labs',
    initials: 'LC',
    subject: 'AI ops consulting — exploratory call',
    snippet:
      'We saw your agent workflow system and are curious about bringing it in-house…',
    tone: 'blue',
    tag: 'Lead',
    draft:
      'Hi Liora,\n\nGreat to hear ScaleUp Labs is interested. Happy to walk through the system — let me know what timezone and preferred day next week, and I’ll send a calendar invite.\n\nBest,\nStark',
  },

  // --- Newsletter (me@) ---
  {
    id: 'm8',
    account: 'newsletter',
    from: 'Substack Digest',
    initials: 'SD',
    subject: 'Your weekly roundup — top 5 reads in AI + business',
    snippet:
      'This week: agent orchestration patterns, a CEO who replaced middle management with AI…',
    tone: 'muted',
    tag: 'Read later',
    draft: '',
  },
  {
    id: 'm9',
    account: 'newsletter',
    from: 'Fashion United · Insider Brief',
    initials: 'FU',
    subject: 'DTC brands pivot to AI-first operations',
    snippet:
      'A growing number of direct-to-consumer brands are restructuring around agentic workflows…',
    tone: 'muted',
    tag: 'Read later',
    draft: '',
  },
]

const CONTACTS: Record<string, Contact> = {
  m1: {
    rel: 'Prospect · warm',
    value: '~€5k inquiry',
    notes: [
      'Fashion drops, cinematic style',
      'Prefers Spanish for small talk, English for business',
      'Found us via the YouTube description',
    ],
  },
  m2: {
    rel: 'Booking · festival',
    value: 'VVVV closing set',
    notes: [
      'Repeat festival partner',
      'Prefers minimal email — decisive and fast',
      'Closing slot = premium rate',
    ],
  },
  m3: {
    rel: 'Vendor · legal',
    value: 'Retainer',
    notes: [
      'Handles all contracts',
      'Slow to respond — nudge weekly',
    ],
  },
  m4: {
    rel: 'System',
    value: 'Billing',
    notes: [
      'Do not enter credentials here',
      'Verify in Stripe dashboard directly',
    ],
  },
  m5: {
    rel: 'Investor · quarterly',
    value: 'Portfolio review',
    notes: [
      'Q3 review — prepare numbers',
      'Prefers video call, 30 min',
    ],
  },
  m6: {
    rel: 'Lead · booking',
    value: 'Valhalla gig',
    notes: [
      'Repeat venue',
      'August session',
    ],
  },
  m7: {
    rel: 'Lead · inbound',
    value: 'Consulting inquiry',
    notes: [
      'ScaleUp Labs = AI ops consultancy',
      'Found via agent workflow thread on X',
      'High-value lead — prioritize',
    ],
  },
  m8: {
    rel: 'Passive',
    value: 'Weekly digest',
    notes: [
      'Auto-filtered to newsletter folder',
      'Skim weekly, no reply needed',
    ],
  },
  m9: {
    rel: 'Passive',
    value: 'Industry news',
    notes: [
      'Auto-filtered to newsletter folder',
      'DTC + AI trend articles',
    ],
  },
}

export async function GET() {
  try {
    return NextResponse.json({
      accounts: ACCOUNTS,
      mails: MAILS,
      contacts: CONTACTS,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[inbox GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
