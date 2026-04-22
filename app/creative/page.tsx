'use client'

import { useState, useRef, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAgent } from '@/lib/agents'

// ── Brand Intelligence Panel ──────────────────────────────────────────────────

interface BriefPayload {
  headline?: string
  format?: string
  platform?: string
  angle?: string
  caption?: string
  cta?: string
}

interface IntelPayload {
  kaiInsight?: { topInsight: string; contentOpportunity: string; urgency: string }
  brief?: BriefPayload
  generatedAt?: string
}

function BrandIntelligencePanel() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [data, setData] = useState<IntelPayload | null>(null)
  const [open, setOpen] = useState(false)

  async function run() {
    setState('loading')
    setOpen(true)
    try {
      const res = await fetch('/api/brand-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json() as IntelPayload
      setData(json)
      setState('done')
    } catch {
      setState('error')
    }
  }

  const urgColor = (u?: string) => u === 'high' ? 'var(--rd)' : u === 'medium' ? 'var(--am)' : 'var(--di)'

  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderLeft: '3px solid #14B8A6', padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: state === 'loading' ? 'var(--am)' : state === 'done' ? '#14B8A6' : 'var(--di)' }} />
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--di)' }}>
            Kai + Lena · Brand Intelligence
          </span>
          {data?.generatedAt && (
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)' }}>
              {new Date(data.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {state === 'done' && (
            <button onClick={() => setOpen(o => !o)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.08em', padding: '3px 10px', border: '1px solid var(--b2)', background: 'none', color: 'var(--di)', cursor: 'pointer' }}>
              {open ? 'Collapse' : 'Expand'}
            </button>
          )}
          <button
            onClick={run}
            disabled={state === 'loading'}
            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', border: '1px solid var(--b2)', background: 'none', color: state === 'loading' ? 'var(--di)' : '#14B8A6', cursor: state === 'loading' ? 'default' : 'pointer' }}
          >
            {state === 'loading' ? 'Analysing...' : state === 'done' ? 'Refresh →' : 'Run Intelligence →'}
          </button>
        </div>
      </div>

      {state === 'error' && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--rd)', marginTop: '10px' }}>
          Failed to load intelligence. Check ANTHROPIC_API_KEY.
        </div>
      )}

      {state === 'done' && open && data && (
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Kai insight */}
          {data.kaiInsight && (
            <div style={{ borderTop: '1px solid var(--b1)', paddingTop: '12px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#3B82F6', letterSpacing: '0.1em', marginBottom: '8px' }}>KAI · DATA READ</div>
              <div style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.65, marginBottom: '8px' }}>{data.kaiInsight.topInsight}</div>
              <div style={{ fontSize: '11px', color: 'var(--di)', lineHeight: 1.6, marginBottom: '8px' }}>{data.kaiInsight.contentOpportunity}</div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: urgColor(data.kaiInsight.urgency), border: `1px solid ${urgColor(data.kaiInsight.urgency)}`, padding: '1px 6px' }}>
                {data.kaiInsight.urgency?.toUpperCase()} URGENCY
              </span>
            </div>
          )}
          {/* Lena brief */}
          {data.brief && (
            <div style={{ borderTop: '1px solid var(--b1)', paddingTop: '12px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: '#14B8A6', letterSpacing: '0.1em', marginBottom: '8px' }}>LENA · CONTENT BRIEF</div>
              {data.brief.headline && (
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '14px', color: 'var(--br)', lineHeight: 1.4, marginBottom: '8px' }}>{data.brief.headline}</div>
              )}
              {data.brief.format && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', border: '1px solid var(--b2)', padding: '1px 6px' }}>{data.brief.format?.toUpperCase()}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', border: '1px solid var(--b2)', padding: '1px 6px' }}>{data.brief.platform?.toUpperCase()}</span>
                </div>
              )}
              {data.brief.caption && (
                <div style={{ fontSize: '11px', color: 'var(--tx)', lineHeight: 1.65, marginBottom: '6px', fontStyle: 'italic' }}>{data.brief.caption}</div>
              )}
              {data.brief.cta && (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--ac)' }}>CTA: {data.brief.cta}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'brief' | 'direction' | 'production' | 'pipeline'

type Brand = 'Novizio' | 'Hourbour'
type Platform = 'Instagram' | 'TikTok' | 'LinkedIn' | 'YouTube' | 'Pinterest'
type AssetType = 'Reel / Video' | 'Carousel' | 'Static post' | 'Story' | 'Banner ad' | 'Email header' | 'Hero image'

const BRANDS: Brand[] = ['Novizio', 'Hourbour']
const PLATFORMS: Platform[] = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Pinterest']
const ASSET_TYPES: AssetType[] = ['Reel / Video', 'Carousel', 'Static post', 'Story', 'Banner ad', 'Email header', 'Hero image']

const NOVIZIO_STYLE = 'Editorial · Quiet luxury · Muted earth tones · Clean typography · Craft-forward'
const HOURBOUR_STYLE = 'Clean fintech · Minimal · Data-confident · Trust-building · Modern'

// ── Helpers ───────────────────────────────────────────────────────────────────
function SH({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--b1)' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)' }}>{children}</div>
      {sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}


function StreamOutput({ content, loading, accentColor }: { content: string; loading: boolean; accentColor: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [content])
  if (!content && !loading) return null
  return (
    <div
      ref={ref}
      style={{
        marginTop: '16px',
        background: 'var(--sf)',
        border: '1px solid var(--b1)',
        borderLeft: `2px solid ${accentColor}`,
        padding: '16px',
        maxHeight: '560px',
        overflowY: 'auto',
        fontFamily: 'var(--font-dm-mono)',
        fontSize: '12px',
        lineHeight: 1.8,
        color: 'var(--tx)',
        whiteSpace: 'pre-wrap',
      }}
    >
      {loading && !content && <span style={{ color: 'var(--di)' }}>thinking…</span>}
      {content}
      {loading && content && <span style={{ color: accentColor }}>▌</span>}
    </div>
  )
}

async function callAgent(agentId: string, prompt: string, onChunk: (t: string) => void): Promise<void> {
  const agent = getAgent(agentId as Parameters<typeof getAgent>[0])
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: agent?.systemPrompt ?? '',
      userMessage: prompt,
      model: agent?.model ?? 'claude-sonnet-4-6',
    }),
  })
  if (!res.body) return
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6)
      if (payload === '[DONE]') break
      try {
        const parsed = JSON.parse(payload) as { text?: string }
        if (parsed.text) onChunk(parsed.text)
      } catch { /* ignore */ }
    }
  }
}

// ── Save to Content Plan Bar ──────────────────────────────────────────────────
function SaveToCalendarBar({ headline, platform, assetType, brief }: {
  headline: string
  platform: string
  assetType: string
  brief: string
}) {
  const [planDate, setPlanDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const platformMap: Record<string, string> = {
    Instagram: 'IG', TikTok: 'TT', LinkedIn: 'LI', YouTube: 'YT',
  }
  const typeMap: Record<string, string> = {
    'Reel / Video': 'Reel', Carousel: 'Carousel', Static: 'Static',
    'Short / Story': 'Short', Article: 'Article',
  }

  async function save() {
    if (!planDate) return
    setSaving(true)
    try {
      const res = await fetch('/api/content-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planDate,
          contentType: typeMap[assetType] ?? 'Post',
          platform: platformMap[platform] ?? 'IG',
          headline,
          brief,
        }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--sf)', border: '1px solid #50C090', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#50C090' }}>
        Saved to content plan for {planDate}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--sf)', border: '1px solid var(--b2)' }}>
      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', letterSpacing: '0.08em' }}>SAVE TO CONTENT PLAN</span>
      <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)}
        style={{ background: 'var(--bg)', border: '1px solid var(--b2)', padding: '4px 8px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--tx)' }} />
      <button onClick={save} disabled={!planDate || saving}
        style={{ background: planDate ? '#50C090' : 'var(--b2)', border: 'none', color: '#000', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', padding: '4px 12px', cursor: planDate ? 'pointer' : 'default' }}>
        {saving ? 'SAVING...' : 'SAVE →'}
      </button>
    </div>
  )
}

// ── BRIEF TAB (Campaign Brief Generator — Alex) ───────────────────────────────
function BriefTab({ brand, initialBrief, onBriefConsumed }: { brand: Brand; initialBrief?: string | null; onBriefConsumed?: () => void }) {
  const [objective, setObjective] = useState('')
  const [audience, setAudience] = useState('')
  const [assetType, setAssetType] = useState<AssetType>('Reel / Video')
  const [platform, setPlatform] = useState<Platform>('Instagram')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (initialBrief) {
      setObjective(initialBrief)
      onBriefConsumed?.()
    }
  }, [initialBrief, onBriefConsumed])

  async function generate() {
    if (!objective) return
    setLoading(true)
    setOutput('')
    const prompt = `Generate a detailed creative brief for ${brand}.

Campaign objective: ${objective}
Target audience: ${audience || 'not specified'}
Primary asset type: ${assetType}
Platform: ${platform}
Deadline: ${deadline || 'not specified'}
Brand style: ${brand === 'Novizio' ? NOVIZIO_STYLE : HOURBOUR_STYLE}

Return a complete creative brief with:
1. BRIEF TITLE
2. OBJECTIVE — one sentence, what does success look like
3. AUDIENCE INSIGHT — who exactly we're talking to, what they care about
4. KEY MESSAGE — the single idea this creative must communicate
5. MANDATORY INCLUSIONS — what MUST be in this asset (product, CTA, etc.)
6. MANDATORY EXCLUSIONS — what to never include for this brand
7. VISUAL DIRECTION — mood, palette, lighting, composition guidance for Atlas
8. COPY DIRECTION — tone, length, hook style for Lena
9. PLATFORM REQUIREMENTS — specs, ratios, caption length for ${platform}
10. SUCCESS METRICS — how we'll measure performance
11. CREATIVE HANDOFF CHECKLIST — 5 items Atlas/Pixel must confirm before delivery`

    try {
      await callAgent('marcus-ceo', prompt, (t) => setOutput(prev => prev + t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '3px solid #50C090', paddingLeft: '16px', marginLeft: '2px' }}>
      <SH sub="Step 01 · Marcus scopes the campaign — objective, audience, message, handoff to Atlas">Campaign Brief</SH>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>ASSET TYPE</label>
          <select value={assetType} onChange={e => setAssetType(e.target.value as AssetType)} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}>
            {ASSET_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>PLATFORM</label>
          <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>CAMPAIGN OBJECTIVE <span style={{ color: 'var(--rd)' }}>*</span></label>
        <input value={objective} onChange={e => setObjective(e.target.value)} placeholder="e.g. Launch the Spring 2026 collection with a focus on the linen category" style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>TARGET AUDIENCE <span style={{ color: 'var(--mu)' }}>(optional)</span></label>
          <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Fashion-conscious women 26–40 who follow slow fashion" style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>DEADLINE <span style={{ color: 'var(--mu)' }}>(optional)</span></label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      <button onClick={generate} disabled={loading || !objective} style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', padding: '8px 20px', background: loading ? 'var(--b2)' : '#50C090', border: 'none', color: loading ? 'var(--di)' : '#000', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'GENERATING…' : 'GENERATE BRIEF →'}
      </button>
      <StreamOutput content={output} loading={loading} accentColor="#50C090" />
      {output && !loading && (
        <SaveToCalendarBar
          headline={objective}
          platform={platform}
          assetType={assetType}
          brief={output}
        />
      )}
    </div>
  )
}

// ── DIRECTION TAB (Visual Direction — Atlas) ──────────────────────────────────
function DirectionTab({ brand, initialBrief, onBriefConsumed }: { brand: Brand; initialBrief?: string | null; onBriefConsumed?: () => void }) {
  const [briefOrIdea, setBriefOrIdea] = useState('')
  const [deliverable, setDeliverable] = useState('Mood board + prompt architecture')
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (initialBrief) {
      setBriefOrIdea(initialBrief)
      onBriefConsumed?.()
    }
  }, [initialBrief, onBriefConsumed])

  const DELIVERABLES = [
    'Mood board + prompt architecture',
    'Visual brief only',
    'Style spec (colors, fonts, composition)',
    'AI image prompts (ready to run)',
    'Full creative package (all of the above)',
  ]

  async function runDirection() {
    if (!briefOrIdea) return
    setLoading(true)
    setOutput('')
    const prompt = `Create visual direction for ${brand}.

Brief / Creative idea:
${briefOrIdea}

Brand visual style: ${brand === 'Novizio' ? NOVIZIO_STYLE : HOURBOUR_STYLE}
Deliverable requested: ${deliverable}

${deliverable.includes('Mood board') || deliverable.includes('all') ? `
MOOD BOARD FORMAT:
- 5 image references (describe each: subject, lighting, color palette, composition)
- Colour palette (4–6 hex codes with names)
- Typography direction (font style, weight, hierarchy)
- Mood in 3 words
` : ''}

${deliverable.includes('prompt') || deliverable.includes('all') ? `
PROMPT ARCHITECTURE:
For each prompt provide:
Subject: [main element]
Environment: [setting, background]
Lighting: [type, direction, quality]
Style: [aesthetic, rendering style]
Camera: [angle, lens feel]
Negative prompt: [what to exclude]
Full assembled prompt: [ready to copy into Midjourney/DALL-E]
` : ''}

${deliverable.includes('Style spec') || deliverable.includes('all') ? `
STYLE SPEC:
- Primary palette (3 colors with hex)
- Accent color (1 color with hex)
- Typography: heading font style, body font style, caption style
- Composition rules (3 rules for this campaign)
- Photography direction (5 rules)
` : ''}

Be specific. Give references and examples. This goes straight to Pixel for production.`

    try {
      await callAgent('atlas-art-director', prompt, (t) => setOutput(prev => prev + t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '3px solid #6366F1', paddingLeft: '16px', marginLeft: '2px' }}>
      <SH sub="Step 02 · Atlas sets the visual language — mood boards, prompts, style specs for Pixel">Visual Direction</SH>

      <div>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>DELIVERABLE</label>
          <select value={deliverable} onChange={e => setDeliverable(e.target.value)} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}>
            {DELIVERABLES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>BRIEF OR CREATIVE IDEA <span style={{ color: 'var(--rd)' }}>*</span></label>
        <textarea value={briefOrIdea} onChange={e => setBriefOrIdea(e.target.value)} placeholder="Paste the campaign brief from Alex, or describe the creative idea directly…" rows={5} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
      </div>

      <button onClick={runDirection} disabled={loading || !briefOrIdea} style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', padding: '8px 20px', background: loading ? 'var(--b2)' : '#6366F1', border: 'none', color: loading ? 'var(--di)' : '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'DIRECTING…' : 'SET DIRECTION →'}
      </button>
      <StreamOutput content={output} loading={loading} accentColor="#6366F1" />
      {output && !loading && (
        <SaveToCalendarBar
          headline={briefOrIdea.slice(0, 80)}
          platform="Instagram"
          assetType="Reel / Video"
          brief={output}
        />
      )}
    </div>
  )
}

// ── PRODUCTION TAB (Asset Production — Pixel) ─────────────────────────────────
function ProductionTab({ brand, initialBrief, onBriefConsumed }: { brand: Brand; initialBrief?: string | null; onBriefConsumed?: () => void }) {
  const [direction, setDirection] = useState('')
  const [batchSize, setBatchSize] = useState('3 variants')
  const [platform, setPlatform] = useState<Platform>('Instagram')
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (initialBrief) {
      setDirection(initialBrief)
      onBriefConsumed?.()
    }
  }, [initialBrief, onBriefConsumed])

  const BATCH_SIZES = ['1 hero image', '3 variants', '5 variants', 'Full set (1 hero + 4 variants)']

  async function runProduction() {
    if (!direction) return
    setLoading(true)
    setOutput('')
    const prompt = `Run production on this creative direction for ${brand}.

Visual direction / brief:
${direction}

Platform: ${platform}
Batch size: ${batchSize}
Brand style: ${brand === 'Novizio' ? NOVIZIO_STYLE : HOURBOUR_STYLE}

Return:
1. PRE-PRODUCTION CHECKLIST — 5 items to confirm before generating
2. GENERATION QUEUE — for each variant:
   - Variant name (e.g. Hero_A, Variant_B)
   - Full AI prompt (ready to run, 50–80 words, optimised for Midjourney v6)
   - Negative prompt
   - Aspect ratio for ${platform}
   - Estimated generation settings (--ar, --style, --v)
3. QC PROTOCOL — what to check on each output:
   - Auto-reject rules (what fails immediately)
   - Pass criteria (what must be true)
4. PLATFORM EXPORT SPECS — exact dimensions, file format, naming convention
5. DELIVERY NOTES — what Opus needs to know for scheduling

Be production-ready. This is a live brief, not an example.`

    try {
      await callAgent('pixel-production', prompt, (t) => setOutput(prev => prev + t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '3px solid #8B5CF6', paddingLeft: '16px', marginLeft: '2px' }}>
      <SH sub="Step 03 · Pixel generates assets — prompts, QC protocol, export specs">Asset Production</SH>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>PLATFORM</label>
          <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>BATCH SIZE</label>
          <select value={batchSize} onChange={e => setBatchSize(e.target.value)} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}>
            {BATCH_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>VISUAL DIRECTION <span style={{ color: 'var(--rd)' }}>*</span></label>
        <textarea value={direction} onChange={e => setDirection(e.target.value)} placeholder="Paste Atlas's visual direction output here, or write the creative direction directly…" rows={5} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
      </div>

      <button onClick={runProduction} disabled={loading || !direction} style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', padding: '8px 20px', background: loading ? 'var(--b2)' : '#8B5CF6', border: 'none', color: loading ? 'var(--di)' : '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'PRODUCING…' : 'RUN PRODUCTION →'}
      </button>
      <StreamOutput content={output} loading={loading} accentColor="#8B5CF6" />
      {output && !loading && (
        <SaveToCalendarBar
          headline={direction.slice(0, 80)}
          platform="Instagram"
          assetType="Reel / Video"
          brief={output}
        />
      )}
    </div>
  )
}// ── PIPELINE TAB (Creative Ops — Opus) ────────────────────────────────────────
function PipelineTab({ brand }: { brand: Brand }) {
  const [task, setTask] = useState('status')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')

  const TASKS = [
    { value: 'status', label: 'Daily Studio Status' },
    { value: 'schedule', label: 'Build Posting Schedule' },
    { value: 'queue', label: 'Review Content Queue' },
    { value: 'delegate', label: 'Delegate to Team' },
    { value: 'custom', label: 'Custom brief to Opus' },
  ]

  async function runOps() {
    setLoading(true)
    setOutput('')

    const prompts: Record<string, string> = {
      status: `Give me the daily Creative Studio status briefing for ${brand}. Include: pipeline overview (what's in Brief / Direction / Production / Scheduling / Done), any items flagged or blocked, what Stark needs to decide today, and the next 3 scheduled posts. Keep it under 15 lines. Be direct — no padding.`,
      schedule: `Build a 2-week posting schedule for ${brand} based on: ${input || 'standard content mix (3 posts/week)'}. Include asset type, platform, publish date/time, content pillar, who owns production. Format as a table.`,
      queue: `Review the current content queue for ${brand}. Context: ${input || 'standard review — flag anything that needs attention'}. Identify: what's ready to publish, what's blocked, what's missing, and give a priority order for the next 5 pieces.`,
      delegate: `Create a delegation plan for ${brand} creative pipeline. Task: ${input || 'full creative pipeline for next campaign'}. Assign each step to the right agent (Alex, Atlas, Pixel, Sofia, Lena, Rio) with clear inputs, outputs, and deadlines.`,
      custom: `${input || 'Give me a Creative Studio overview for ' + brand}`,
    }

    try {
      await callAgent('atlas-art-director', prompts[task] || prompts.custom, (t) => setOutput(prev => prev + t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '3px solid #C084FC', paddingLeft: '16px', marginLeft: '2px' }}>
      <SH sub="Step 04 · Opus manages the pipeline — scheduling, delegation, status tracking">Creative Ops</SH>

      <div>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>TASK</label>
          <select value={task} onChange={e => setTask(e.target.value)} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}>
            {TASKS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {task !== 'status' && (
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>{task === 'custom' ? 'YOUR MESSAGE TO OPUS' : 'CONTEXT / DETAILS'} <span style={{ color: 'var(--mu)' }}>(optional)</span></label>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={task === 'schedule' ? 'e.g. Spring collection launch — 5 posts/week, focus on Reels' : task === 'delegate' ? 'e.g. Full Spring 2026 campaign — 3 hero images + 8 posts' : task === 'custom' ? 'Write anything to Opus…' : 'Additional context…'} rows={3} style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
        </div>
      )}

      <button onClick={runOps} disabled={loading} style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', padding: '8px 20px', background: loading ? 'var(--b2)' : '#C084FC', border: 'none', color: loading ? 'var(--di)' : '#000', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'RUNNING…' : 'RUN →'}
      </button>
      <StreamOutput content={output} loading={loading} accentColor="#C084FC" />
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function CreativePage() {
  return (
    <Suspense fallback={<div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', padding: '40px' }}>Loading Creative Studio…</div>}>
      <CreativePageInner />
    </Suspense>
  )
}

function CreativePageInner() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('brief')
  const [brand, setBrand] = useState<Brand>('Novizio')
  const [pendingBrief, setPendingBrief] = useState<string | null>(null)
  const consumeBrief = useCallback(() => setPendingBrief(null), [])

  // Auto-select brand from active venture cookie
  useEffect(() => {
    const match = document.cookie.match(/yvon_active_venture=([^;]+)/)
    const slug = match?.[1] ?? 'novizio'
    setBrand(slug === 'hourbour' ? 'Hourbour' : 'Novizio')
  }, [])

  // Read query params from "Send to Creative" navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    const briefParam = searchParams.get('brief')
    if (tabParam && ['brief', 'direction', 'production', 'pipeline'].includes(tabParam)) {
      setTab(tabParam)
    }
    if (briefParam) {
      setPendingBrief(briefParam)
    }
    if (tabParam || briefParam) {
      window.history.replaceState(null, '', '/creative')
    }
  }, [searchParams])

  const TABS: { id: Tab; label: string; agent: string; color: string; step: string; desc: string }[] = [
    { id: 'brief',      label: 'Campaign Brief',  agent: 'Marcus', color: '#50C090', step: '01', desc: 'Define what we\'re making and why' },
    { id: 'direction',  label: 'Visual Direction', agent: 'Atlas',  color: '#6366F1', step: '02', desc: 'Set the visual language and mood' },
    { id: 'production', label: 'Production',       agent: 'Pixel',  color: '#8B5CF6', step: '03', desc: 'Generate assets with AI prompts' },
    { id: 'pipeline',   label: 'Creative Ops',     agent: 'Atlas',  color: '#C084FC', step: '04', desc: 'Schedule, delegate, and track' },
  ]

  const activeTab = TABS.find(t => t.id === tab)!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            Creative Studio
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            Brief → Visual Direction → Production ·{' '}
            <span style={{ color: brand === 'Novizio' ? 'var(--br)' : '#4A6A9A' }}>
              {brand}
            </span>
          </p>
        </div>
        {/* Agent quick-links */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'marcus-ceo',         name: 'Marcus', role: 'CEO',     color: '#F59E0B' },
            { id: 'atlas-art-director', name: 'Atlas',  role: 'Art Dir', color: '#6366F1' },
            { id: 'pixel-production',   name: 'Pixel',  role: 'Prod',    color: '#8B5CF6' },
          ].map(a => (
            <a key={a.id} href={`/agents/${a.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid var(--b2)', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: a.color }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: a.color }} />
              {a.name}
            </a>
          ))}
        </div>
      </div>

      {/* Brand Intelligence */}
      <BrandIntelligencePanel />

      {/* Pipeline flow indicator */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', background: 'var(--sf)', border: '1px solid var(--b1)', padding: '0' }}>
        {TABS.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
            <button
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                padding: '12px 10px',
                background: tab === t.id ? `${t.color}12` : 'none',
                border: 'none',
                borderRight: i < TABS.length - 1 ? '1px solid var(--b1)' : 'none',
                borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
                color: tab === t.id ? t.color : 'var(--di)',
                cursor: 'pointer',
                textAlign: 'center',
                letterSpacing: '0.06em',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div style={{ fontSize: '8px', color: tab === t.id ? t.color : 'var(--mu)', letterSpacing: '0.1em' }}>STEP {t.step}</div>
              <div style={{ fontWeight: tab === t.id ? 500 : 400 }}>{t.label.toUpperCase()}</div>
              <div style={{ fontSize: '9px', color: tab === t.id ? t.color : 'var(--mu)' }}>{t.agent} · {t.desc}</div>
            </button>
          </div>
        ))}
      </div>

      {/* Active tab indicator */}
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: activeTab.color, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>STEP {activeTab.step}</span>
        <span style={{ color: 'var(--mu)' }}>·</span>
        <span>{activeTab.agent.toUpperCase()}</span>
        <span style={{ color: 'var(--mu)' }}>·</span>
        <span style={{ color: 'var(--di)' }}>{activeTab.desc}</span>
      </div>

      {/* Tab content */}
      {tab === 'brief'      && <BriefTab brand={brand} initialBrief={pendingBrief} onBriefConsumed={consumeBrief} />}
      {tab === 'direction'  && <DirectionTab brand={brand} initialBrief={pendingBrief} onBriefConsumed={consumeBrief} />}
      {tab === 'production' && <ProductionTab brand={brand} initialBrief={pendingBrief} onBriefConsumed={consumeBrief} />}
      {tab === 'pipeline'   && <PipelineTab brand={brand} />}
    </div>
  )
}
