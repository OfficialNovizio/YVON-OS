// GET /api/newsletter
// Returns Kit-mocked newsletter data for the Newsletter Mission Control page.
//
// Sources: Kit API (mocked for now — wire Kit API key when ready).
// Provides: subscribers, campaigns, sequences, drafts, growth sources, analytics.
//
// Data shape mirrors Kit's REST API conventions:
//   - subscribers endpoint → audience + segments
//   - broadcasts endpoint → past campaigns
//   - sequences endpoint → lifecycle automations
//   - draft endpoint → current compose state

export type KitSubscriber = {
  id: number
  email: string
  first_name: string
  state: 'active' | 'inactive'
  created_at: string
}

export type KitSegment = {
  name: string
  count: number
  filter: string
}

export type KitBroadcast = {
  id: string
  subject: string
  open_rate: number | null   // percent, e.g. 47
  click_rate: number | null  // percent, e.g. 6.1
  status: 'draft' | 'sent' | 'sending'
  sent_at: string | null
  issue: number
}

export type KitSequence = {
  id: number
  name: string
  steps: number
  trigger: string
  active: boolean
  steps_detail: { step_num: number; subject: string }[]
}

export type KitGrowthSource = {
  source: string
  new_subscribers_30d: number
}

export type KitDraft = {
  issue: number
  subject: string
  preview_text: string
  blocks: string[]
}

export type KitAnalytics = {
  avg_open_rate: number   // percent
  avg_click_rate: number  // percent
  total_replies: number
  total_conversions: number
}

export type NewsletterFeed = {
  // Audience
  total_subscribers: number
  new_30d: number
  churn_30d: number
  subscriber_history: number[] // 12 months of counts
  segments: KitSegment[]

  // Compose
  draft: KitDraft

  // Broadcasts
  broadcasts: KitBroadcast[]
  top_performer_note: string

  // Sequences
  sequences: KitSequence[]

  // Growth
  growth_sources: KitGrowthSource[]
  growth_total_30d: number

  // Analytics
  analytics: KitAnalytics

  // Meta
  source: 'mock'
  synced_at: string
  kit_connected: boolean
  api_healthy: boolean
}

export async function GET(): Promise<Response> {
  // ── Kit connection check ──────────────────────────────────────────────
  const kitToken = process.env.KIT_API_KEY
  const kitConnected = Boolean(kitToken)

  // In production, this would call Kit's REST API:
  //   https://api.kit.com/v4/subscribers
  //   https://api.kit.com/v4/broadcasts
  //   https://api.kit.com/v4/sequences
  // For now, return realistic mock data mirroring Kit's response shape.

  const feed: NewsletterFeed = {
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
      {
        id: 'b_13',
        issue: 13,
        subject: 'The cockpit, not the dashboard',
        open_rate: null,
        click_rate: null,
        status: 'draft',
        sent_at: null,
      },
      {
        id: 'b_12',
        issue: 12,
        subject: 'Now I plan with no code',
        open_rate: 47,
        click_rate: 6.1,
        status: 'sent',
        sent_at: '2026-06-04T10:00:00Z',
      },
      {
        id: 'b_11',
        issue: 11,
        subject: 'Meet the agent roster',
        open_rate: 52,
        click_rate: 9.0,
        status: 'sent',
        sent_at: '2026-05-28T10:00:00Z',
      },
    ],
    top_performer_note:
      'Top performer: #11 “Meet the agent roster” at 9.0% click. Single clear CTA + free feature did best — lean into agent-centric next send.',

    sequences: [
      {
        id: 1,
        name: 'Welcome series',
        steps: 4,
        trigger: 'on signup',
        active: true,
        steps_detail: [
          { step_num: 1, subject: 'Welcome — here is your cockpit' },
          { step_num: 2, subject: 'First 3 things to set up' },
          { step_num: 3, subject: 'How the agents think' },
          { step_num: 4, subject: 'Your first Decision Queue' },
        ],
      },
      {
        id: 2,
        name: 'New app feature',
        steps: 3,
        trigger: 'tag applied',
        active: true,
        steps_detail: [
          { step_num: 1, subject: 'We shipped something new' },
          { step_num: 2, subject: 'Here is how to use it' },
          { step_num: 3, subject: 'What the data says' },
        ],
      },
      {
        id: 3,
        name: 'Cart recapture',
        steps: 2,
        trigger: 'cart abandoned',
        active: false,
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
    kit_connected: kitConnected,
    api_healthy: true,
  }

  // Add kit_connected to response so the frontend can show a device-status badge
  return Response.json(feed)
}
