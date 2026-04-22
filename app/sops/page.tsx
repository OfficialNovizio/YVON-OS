'use client'

import { useState } from 'react'
import type { SopCategory } from '@/lib/types'

type SeedSop = {
  id: string
  title: string
  category: SopCategory
  agentName: string
  agentColor: string
  content: string
  updatedAt: string
}

const CATEGORIES: Array<SopCategory | 'all'> = ['all', 'marketing', 'technical', 'operations', 'design', 'finance', 'general']

const CATEGORY_COLORS: Record<SopCategory, string> = {
  marketing:  'var(--rd)',
  technical:  'var(--gn)',
  operations: 'var(--bl)',
  design:     'var(--ac)',
  finance:    'var(--am)',
  general:    'var(--di)',
}

const SEED_SOPS: SeedSop[] = [
  {
    id: '1', title: 'Instagram Post Approval Process', category: 'marketing', agentName: 'Diana', agentColor: '#9070D0', updatedAt: '25 Mar',
    content: `## Instagram Post Approval Process\n\n**Owner:** Sofia (Social Media)\n**Reviewer:** Alex (Marketing Director)\n\n### Steps\n\n1. **Draft** — Sofia creates caption + visual direction in Content pipeline\n2. **Brand check** — Lena reviews copy against brand voice guidelines (24h SLA)\n3. **Director approval** — Alex signs off on strategic alignment (48h SLA)\n4. **Schedule** — Sofia schedules via native Instagram tools\n5. **Log** — Add to content calendar with post type, hashtag set, and target engagement\n\n### Rejection Criteria\n- Off-brand tone (too casual or too corporate)\n- No clear CTA\n- Hashtag set not reviewed against current reach data\n- Product pricing incorrect or unavailable items shown`,
  },
  {
    id: '2', title: 'New API Route Checklist', category: 'technical', agentName: 'Raj', agentColor: '#888888', updatedAt: '23 Mar',
    content: `## New API Route Checklist\n\n**Owner:** Raj (Backend)\n\n### Before writing code\n- [ ] Route documented in Dev's MEMORY.md API contracts\n- [ ] Input/output shapes defined in lib/types.ts\n- [ ] Supabase table exists (or migration written)\n\n### Implementation\n- [ ] Parse and validate all inputs (return 400 on missing fields)\n- [ ] Venture context loaded if venture-scoped\n- [ ] External API call wrapped in try/catch\n- [ ] Result written to Supabase before returning\n- [ ] Error codes follow hierarchy (400/404/429/504/500)\n- [ ] No API keys in response\n- [ ] console.error('[route-name] failed:', err) on catch\n\n### After implementation\n- [ ] npm run build — zero errors\n- [ ] npm run lint — zero warnings\n- [ ] Endpoint tested with curl or Postman\n- [ ] Response shape matches lib/types.ts definition\n- [ ] Quinn issues APPROVED before merging`,
  },
  {
    id: '3', title: 'Weekly CEO Brief Review', category: 'operations', agentName: 'Marcus', agentColor: '#A080E0', updatedAt: '22 Mar',
    content: `## Weekly CEO Brief Review Process\n\n**Owner:** Marcus (CEO)\n**Frequency:** Every Monday 7am (Vercel Cron)\n\n### Brief Structure\n1. Top 3 wins from last week\n2. Top 3 risks or blockers\n3. This week's priorities (per venture)\n4. Metric snapshot: followers, sessions, CAC, content output\n\n### Review Actions\n1. Read full brief on arrival (CEO Inbox)\n2. Mark as read\n3. Flag any items requiring War Room discussion\n4. Reply to team via War Room with priorities\n\n### If brief is missing\n- Check Vercel function logs — briefing route timeout?\n- Trigger manual refresh via /api/briefing\n- Check Resend delivery logs for email issues`,
  },
  {
    id: '4', title: 'Brand Voice Guidelines — Novizio', category: 'design', agentName: 'Lena', agentColor: '#60A0E0', updatedAt: '20 Mar',
    content: `## Brand Voice — Novizio\n\n**Tone:** Thoughtful, intentional, aspirational — never preachy.\n\n### Do\n- Speak with quiet confidence ("made to last" not "the best quality ever")\n- Use sensory language: texture, weight, light, movement\n- Reference craft, process, origin\n- First person singular for founder-voice content\n\n### Don't\n- "Luxury" (overused) — say "considered" or "refined" instead\n- "Sustainable" without context — explain what that means for each piece\n- Exclamation marks — the work speaks\n- Discount language — "sale", "deal", "cheap"\n\n### Platform Tone Adjustments\n- **Instagram:** More poetic, visual, sensory\n- **LinkedIn:** More strategic, founder-perspective, industry insight\n- **Email:** Most personal — speak directly to the reader`,
  },
  {
    id: '5', title: 'Ad Spend Review — Monthly', category: 'finance', agentName: 'Felix', agentColor: '#888888', updatedAt: '18 Mar',
    content: `## Monthly Ad Spend Review\n\n**Owner:** Rio (Ads) + Felix (Finance)\n**Due:** Last Friday of each month\n\n### Review Checklist\n\n1. Pull spend report by channel (Instagram, LinkedIn, Google)\n2. Calculate ROAS per channel vs target (target: 2.5x)\n3. Identify top 3 performing creatives\n4. Identify underperformers (ROAS < 1.5x → pause)\n5. Recommend next month budget allocation\n6. Update deliverables with signed-off budget plan\n\n### Budget Guardrails\n- Never exceed monthly cap without Marcus approval\n- Shift budget within channels freely (no approval needed)\n- Any new channel requires Priya to write a spec first`,
  },
]

export default function SopsPage() {
  const [category, setCategory] = useState<SopCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>('1')

  const filtered = category === 'all' ? SEED_SOPS : SEED_SOPS.filter(s => s.category === category)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
          SOPs
        </h1>
        <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
          Standard Operating Procedures · {SEED_SOPS.length} docs across 5 categories
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => {
          const color = c === 'all' ? 'var(--di)' : CATEGORY_COLORS[c]
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '0.06em',
                padding: '4px 10px',
                background: category === c ? 'var(--b2)' : 'none',
                border: `1px solid ${category === c ? 'var(--mi)' : 'var(--b2)'}`,
                color: category === c ? color : 'var(--di)',
                cursor: 'pointer',
              }}
            >
              {c.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* SOP List */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1px', background: 'var(--b1)', alignItems: 'start' }}>
        {/* Left: SOP List */}
        <div style={{ background: 'var(--sf2)', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {filtered.map(sop => {
            const catColor = CATEGORY_COLORS[sop.category]
            const isActive = expandedId === sop.id
            return (
              <div
                key={sop.id}
                onClick={() => setExpandedId(sop.id)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderLeft: `2px solid ${isActive ? catColor : 'transparent'}`,
                  background: isActive ? '#0F0F0F' : 'var(--sf2)',
                  borderBottom: '1px solid var(--b1)',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ fontSize: '12px', color: isActive ? 'var(--ac)' : 'var(--tx)', marginBottom: '4px', lineHeight: 1.3 }}>
                  {sop.title}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: catColor }}>
                    {sop.category.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)' }}>
                    {sop.updatedAt}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: SOP Content */}
        <div style={{ background: 'var(--bg)', padding: '16px', minHeight: '400px' }}>
          {expandedId ? (() => {
            const sop = SEED_SOPS.find(s => s.id === expandedId)
            if (!sop) return null
            return (
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: CATEGORY_COLORS[sop.category], border: `1px solid ${CATEGORY_COLORS[sop.category]}`, padding: '2px 6px' }}>
                    {sop.category.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: sop.agentColor }}>
                    {sop.agentName}
                  </span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', marginLeft: 'auto' }}>
                    Updated {sop.updatedAt}
                  </span>
                </div>
                <pre style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '13px',
                  color: 'var(--tx)',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  padding: 0,
                  background: 'none',
                  border: 'none',
                }}>
                  {sop.content}
                </pre>
              </div>
            )
          })() : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--mu)' }}>
              SELECT A DOCUMENT
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
