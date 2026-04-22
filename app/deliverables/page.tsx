'use client'

import { useState } from 'react'
import type { DeliverableType } from '@/lib/types'

type SeedDeliverable = {
  id: string
  title: string
  type: DeliverableType
  agentName: string
  agentColor: string
  status: 'draft' | 'review' | 'approved'
  content: string
  date: string
}

const TYPE_META: Record<DeliverableType, { color: string; label: string }> = {
  strategy:    { color: 'var(--am)', label: 'STRATEGY' },
  content:     { color: 'var(--rd)', label: 'CONTENT' },
  report:      { color: 'var(--bl)', label: 'REPORT' },
  design:      { color: 'var(--ac)', label: 'DESIGN' },
  code:        { color: 'var(--gn)', label: 'CODE' },
}

const STATUS_META = {
  draft:    { color: 'var(--di)', label: 'DRAFT' },
  review:   { color: 'var(--am)', label: 'REVIEW' },
  approved: { color: 'var(--gn)', label: 'APPROVED' },
}

const ALL_TYPES: Array<DeliverableType | 'all'> = ['all', 'strategy', 'content', 'report', 'design', 'code']

const SEED_DELIVERABLES: SeedDeliverable[] = [
  {
    id: '1', title: 'Q2 Marketing Strategy — Novizio', type: 'strategy', agentName: 'Alex', agentColor: '#50C090',
    status: 'review', date: '25 Mar',
    content: '## Q2 Marketing Strategy\n\n**Objective:** Grow Instagram following to 35K by June 30.\n\n**Priority Channels:** Instagram (primary), LinkedIn (secondary)\n\n**Content Mix:** 50% Reels, 30% Carousels, 20% Static posts\n\n**Campaign:** Spring Drop — launch week April 15. Full product reveal Reel + 5-post carousel series.\n\n**Budget:** £1,200/month. 70% organic, 30% paid amplification on top-performing Reels.',
  },
  {
    id: '2', title: 'Instagram Reel Scripts — Spring Drop x3', type: 'content', agentName: 'Lena', agentColor: '#60A0E0',
    status: 'approved', date: '24 Mar',
    content: '**Script 1 — Workshop BTS**\nHook: "This took 3 weeks to make — here\'s why."\nBody: Time-lapse of fabric sourcing → cutting → sewing → QC.\nCTA: "Tap to shop the spring drop — link in bio"\n\n**Script 2 — Process Reveal**\nHook: "The process no one shows you."\nBody: Show the pattern-making, fitting, adjustments.\nCTA: "Only 20 pieces per drop — shop now"\n\n**Script 3 — Slow Fashion**\nHook: "Slow fashion, done right."\nBody: Contrast fast fashion waste stats with Novizio\'s approach.\nCTA: "Join the movement — link in bio"',
  },
  {
    id: '3', title: 'Competitor Analysis Report — Q1 2024', type: 'report', agentName: 'Zara', agentColor: '#666666',
    status: 'approved', date: '22 Mar',
    content: '## Competitor Analysis — Q1 2024\n\n**Key Finding:** Novizio leads on engagement rate (4.2%) vs market avg 2.8%. Follower gap vs Brand A (84.2K) is large but closing.\n\n**Content Gaps:** 3 high-opportunity topics uncovered with no competitor coverage: sustainability messaging, customer transformation stories, size inclusivity.\n\n**Recommendation:** 6-week content sprint targeting all 3 gaps. Estimated reach uplift: 15–20%.',
  },
  {
    id: '4', title: 'Hourbour App — Onboarding Flow Redesign Brief', type: 'design', agentName: 'Priya', agentColor: '#888888',
    status: 'draft', date: '26 Mar',
    content: '## Onboarding Redesign Brief\n\n**Problem:** D1 retention is 42% vs industry benchmark 60%. Exit survey shows users abandon at the "Connect your bank" step.\n\n**Hypothesis:** Trust gap. Users don\'t understand why bank connection is required at onboarding.\n\n**Proposed Solution:** Add an optional "Explore First" path — let users see the product before connecting their bank. Progressive data request.\n\n**Success Metric:** D1 retention → 55% within 60 days of launch.',
  },
  {
    id: '5', title: 'Supabase Schema Migration — Phase 3 Tables', type: 'code', agentName: 'Raj', agentColor: '#888888',
    status: 'approved', date: '21 Mar',
    content: 'Migration: 20240321_phase3_tables\n\nTables added: tasks, deliverables, sops, content_suggestions, competitor_content, activity_feed\n\nAll tables include: venture_id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid()\n\nIndexes: idx_tasks_venture_id, idx_deliverables_venture_id, idx_activity_feed_venture_id\n\nStatus: Applied to production. Zero migration errors.',
  },
  {
    id: '6', title: 'LinkedIn Content Calendar — April', type: 'content', agentName: 'Sofia', agentColor: '#60A0E0',
    status: 'approved', date: '20 Mar',
    content: 'Week 1: Thought leadership — "Why we chose slow fashion over fast margins"\nWeek 2: Product drop announcement — Spring collection preview carousel\nWeek 3: Founder Q&A poll — "What does sustainable fashion mean to you?"\nWeek 4: Customer spotlight — transformation story series Part 1',
  },
]

export default function DeliverablesPage() {
  const [items] = useState<SeedDeliverable[]>(SEED_DELIVERABLES)
  const [typeFilter, setTypeFilter] = useState<DeliverableType | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = typeFilter === 'all' ? items : items.filter(d => d.type === typeFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            Deliverables
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            {items.length} total · {items.filter(d => d.status === 'approved').length} approved · {items.filter(d => d.status === 'draft').length} draft
          </p>
        </div>
      </div>

      {/* Type Filter */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {ALL_TYPES.map(t => {
          const meta = t === 'all' ? { color: 'var(--di)', label: 'ALL' } : TYPE_META[t]
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '0.06em',
                padding: '4px 10px',
                background: typeFilter === t ? 'var(--b2)' : 'none',
                border: `1px solid ${typeFilter === t ? 'var(--mi)' : 'var(--b2)'}`,
                color: typeFilter === t ? meta.color : 'var(--di)',
                cursor: 'pointer',
              }}
            >
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Deliverable List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
        {filtered.map(d => {
          const tm = TYPE_META[d.type]
          const sm = STATUS_META[d.status]
          const isExpanded = expandedId === d.id

          return (
            <div key={d.id} style={{ background: 'var(--bg)', borderLeft: `2px solid ${d.agentColor}` }}>
              {/* Row Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
                style={{
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 60px 80px 80px',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: tm.color, border: `1px solid ${tm.color}44`, padding: '2px 6px', textAlign: 'center' }}>
                  {tm.label}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--tx)' }}>{d.title}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: d.agentColor }}>{d.agentName}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)' }}>{d.date}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: sm.color, border: `1px solid ${sm.color}`, padding: '2px 6px', textAlign: 'center' }}>
                  {sm.label}
                </span>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{
                  padding: '0 14px 14px',
                  borderTop: '1px solid var(--b1)',
                  background: 'var(--sf3)',
                }}>
                  <pre style={{
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '12px',
                    color: 'var(--di)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    margin: '12px 0 0',
                    padding: 0,
                    border: 'none',
                    background: 'none',
                  }}>
                    {d.content}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
