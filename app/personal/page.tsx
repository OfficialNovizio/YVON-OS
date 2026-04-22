'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { getAgent } from '@/lib/agents'

type Tab = 'audit' | 'post' | 'connections'

const HOOK_TYPES = [
  { value: 'lesson', label: 'Lesson learned' },
  { value: 'number', label: 'Specific number / result' },
  { value: 'mistake', label: 'Mistake / failure' },
  { value: 'observation', label: 'Founder observation' },
  { value: 'process', label: 'Behind the process' },
  { value: 'contrarian', label: 'Contrarian take' },
]

const POST_FORMATS = [
  { value: 'short', label: 'Short reflection (100–150 words)' },
  { value: 'medium', label: 'Story arc (200–280 words)' },
  { value: 'thread', label: 'Thread format (3 punchy points)' },
]

function SH({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--b1)' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)' }}>{children}</div>
      {sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function StreamOutput({ content, loading }: { content: string; loading: boolean }) {
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
        borderLeft: '2px solid #84CC16',
        padding: '16px',
        maxHeight: '480px',
        overflowY: 'auto',
        fontFamily: 'var(--font-dm-mono)',
        fontSize: '12px',
        lineHeight: 1.8,
        color: 'var(--tx)',
        whiteSpace: 'pre-wrap',
      }}
    >
      {loading && !content && (
        <span style={{ color: 'var(--di)' }}>Stark · thinking…</span>
      )}
      {content}
      {loading && content && <span style={{ color: '#84CC16', animation: 'pulse 1s infinite' }}>▌</span>}
    </div>
  )
}

async function callAgent(prompt: string, onChunk: (t: string) => void): Promise<void> {
  const agent = getAgent('stark-growth')
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

// ── AUDIT TAB ─────────────────────────────────────────────────────────────────
function AuditTab() {
  const [url, setUrl]         = useState('')
  const [bio, setBio]         = useState('')
  const [headline, setHeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [output, setOutput]   = useState('')

  async function runAudit() {
    if (!bio && !headline) return
    setLoading(true)
    setOutput('')
    const prompt = `Run a LinkedIn profile audit for Stark (solo founder, Novizio + Hourbour).

Profile URL: ${url || 'not provided'}
Headline: "${headline}"
Bio / About section:
${bio}

Return your audit in this exact structure:
1. SCORE: [X/10] — one-line verdict
2. HEADLINE: what works, what to change, give 2 rewritten options
3. BIO: what works, what to cut, give a rewritten version (max 220 chars)
4. GAPS: 3 specific sections/elements missing from this profile
5. QUICK WINS: 3 actions they can do in the next 30 minutes
6. KEYWORDS: 5 keywords Stark should appear for in LinkedIn search`

    try {
      await callAgent(prompt, (t) => setOutput(prev => prev + t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SH sub="Paste your current profile details for a structured, specific audit">LinkedIn Profile Audit</SH>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>PROFILE URL (optional)</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://linkedin.com/in/yourusername"
            style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>CURRENT HEADLINE</label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Founder @ Novizio | Building Hourbour"
            style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>ABOUT / BIO SECTION <span style={{ color: 'var(--mu)' }}>(paste the full text)</span></label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Paste your current LinkedIn About section here…"
          rows={6}
          style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
        />
      </div>

      <button
        onClick={runAudit}
        disabled={loading || (!bio && !headline)}
        style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', padding: '8px 20px', background: loading ? 'var(--b2)' : '#84CC16', border: 'none', color: loading ? 'var(--di)' : '#000', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
      >
        {loading ? 'ANALYSING…' : 'RUN AUDIT →'}
      </button>

      <StreamOutput content={output} loading={loading} />
    </div>
  )
}

// ── POST WRITING TAB ──────────────────────────────────────────────────────────
function PostWritingTab() {
  const [topic, setTopic]     = useState('')
  const [hookType, setHookType] = useState('lesson')
  const [format, setFormat]   = useState('medium')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [output, setOutput]   = useState('')

  async function writePost() {
    if (!topic) return
    setLoading(true)
    setOutput('')
    const hookLabel = HOOK_TYPES.find(h => h.value === hookType)?.label ?? hookType
    const formatLabel = POST_FORMATS.find(f => f.value === format)?.label ?? format
    const prompt = `Write a LinkedIn post for Stark (solo founder, runs Novizio fashion brand + Hourbour financial app).

Topic: ${topic}
Hook type: ${hookLabel}
Format: ${formatLabel}
${context ? `Additional context: ${context}` : ''}

Rules:
- Write in Stark's voice: direct, no hype, honest, specific
- NO "Excited to announce", "Thrilled to share", "Blessed", or any LinkedIn clichés
- Start with a hook that doesn't begin with "I"
- Use specific numbers or details where possible
- End with a genuine question or observation, not a CTA
- No hashtags in the body — add 2–3 relevant ones at the very end on a separate line
- Paragraphs max 2 sentences. White space is good.

After the post, on a new line add:
---
HOOK SCORE: [X/10] with one-line explanation
ALTERNATIVES: 2 different opening lines to test`

    try {
      await callAgent(prompt, (t) => setOutput(prev => prev + t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SH sub="Write in your real voice — no platitudes, no performance">Post Writing</SH>

      <div>
        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>TOPIC OR SEED IDEA <span style={{ color: 'var(--rd)' }}>*</span></label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Launched Novizio drop 3 — sold out in 4 hours but almost didn't happen"
          style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>HOOK TYPE</label>
          <select
            value={hookType}
            onChange={(e) => setHookType(e.target.value)}
            style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}
          >
            {HOOK_TYPES.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>FORMAT</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}
          >
            {POST_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>EXTRA CONTEXT <span style={{ color: 'var(--mu)' }}>(optional — numbers, story details, punchline)</span></label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g. The factory called 3 days before the drop saying 40% of the stock had a colour defect…"
          rows={3}
          style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
        />
      </div>

      <button
        onClick={writePost}
        disabled={loading || !topic}
        style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', padding: '8px 20px', background: loading ? 'var(--b2)' : '#84CC16', border: 'none', color: loading ? 'var(--di)' : '#000', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
      >
        {loading ? 'WRITING…' : 'WRITE POST →'}
      </button>

      <StreamOutput content={output} loading={loading} />
    </div>
  )
}

// ── CONNECTIONS TAB ───────────────────────────────────────────────────────────
function ConnectionsTab() {
  const [targetType, setTargetType] = useState('')
  const [goal, setGoal]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [output, setOutput]         = useState('')

  const TARGET_TYPES = [
    'Founders at pre-seed / seed stage',
    'Operators at DTC / e-commerce brands',
    'Angel investors (fashion / consumer)',
    'Angel investors (fintech / SaaS)',
    'Creative directors & brand builders',
    'Journalists & newsletter writers',
    'Product people at SaaS companies',
    'Other solo founders',
  ]

  async function buildStrategy() {
    if (!targetType && !goal) return
    setLoading(true)
    setOutput('')
    const prompt = `Build a LinkedIn connection strategy for Stark (solo founder, Novizio + Hourbour).

Target type: ${targetType || 'not specified'}
Connection goal: ${goal || 'not specified'}

Return:
1. SEARCH STRATEGY: 3 specific LinkedIn search queries to find these people
2. FILTER CRITERIA: what to look for in a profile before connecting (3 signals)
3. CONNECTION NOTE (variant A — cold, direct, no fluff, 200 chars max)
4. CONNECTION NOTE (variant B — reference-based, if they post content, 200 chars max)
5. CONNECTION NOTE (variant C — problem-led, if they'd benefit from your work, 200 chars max)
6. FOLLOW-UP: what to do in the first 48h after they accept
7. RED FLAGS: 3 profile signals that mean don't bother

Rules for connection notes:
- No "I came across your profile and was impressed"
- No "I'd love to pick your brain"
- Be specific about why them, why now
- Max 200 characters per note`

    try {
      await callAgent(prompt, (t) => setOutput(prev => prev + t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SH sub="Find and reach the right people — no spray and pray">Connection Strategy</SH>

      <div>
        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>TARGET TYPE</label>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">Select a target type…</option>
          {TARGET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>WHAT DO YOU WANT FROM THIS NETWORK? <span style={{ color: 'var(--mu)' }}>(optional)</span></label>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. angel investors for Hourbour's pre-seed round in Q3"
          style={{ width: '100%', background: 'var(--sf)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <button
        onClick={buildStrategy}
        disabled={loading || (!targetType && !goal)}
        style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', padding: '8px 20px', background: loading ? 'var(--b2)' : '#84CC16', border: 'none', color: loading ? 'var(--di)' : '#000', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
      >
        {loading ? 'BUILDING…' : 'BUILD STRATEGY →'}
      </button>

      <StreamOutput content={output} loading={loading} />

      {/* Static pillar guide */}
      {!output && !loading && (
        <div style={{ marginTop: '8px' }}>
          <SH>Content Pillars — Stark&apos;s Voice</SH>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--b1)' }}>
            {[
              { pillar: 'Founder reality', desc: 'The honest day-to-day — decisions, setbacks, small wins. What textbooks skip.' },
              { pillar: 'Craft & product', desc: 'Behind Novizio drops. The supply chain, the design decisions, the trade-offs.' },
              { pillar: 'Build in public', desc: 'Hourbour\'s product journey — what shipped, what flopped, what the data said.' },
              { pillar: 'Contrarian takes', desc: 'Where consensus thinking about fashion or SaaS is wrong. Short, provocative.' },
              { pillar: 'System design', desc: 'How YVON works — AI agents, solo ops, automation in a one-person company.' },
              { pillar: 'Cross-venture lessons', desc: 'What running two completely different businesses teaches you about both.' },
            ].map(p => (
              <div key={p.pillar} style={{ background: 'var(--sf)', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: '#84CC16', marginBottom: '6px', letterSpacing: '0.06em' }}>{p.pillar}</div>
                <div style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function PersonalPage() {
  const [tab, setTab] = useState<Tab>('audit')

  const TABS: { id: Tab; label: string }[] = [
    { id: 'audit',       label: 'LinkedIn Audit' },
    { id: 'post',        label: 'Post Writing' },
    { id: 'connections', label: 'Connection Strategy' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            Personal Growth
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            LinkedIn · Post writing · Connection strategy · Powered by Stark agent 🌱
          </p>
        </div>
        <Link
          href="/agents/stark-growth"
          style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.08em', padding: '6px 14px', border: '1px solid var(--b2)', color: 'var(--di)', textDecoration: 'none', display: 'inline-block' }}
        >
          VIEW AGENT →
        </Link>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--b1)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              letterSpacing: '0.06em',
              padding: '8px 20px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #84CC16' : '2px solid transparent',
              color: tab === t.id ? '#84CC16' : 'var(--di)',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'audit'       && <AuditTab />}
        {tab === 'post'        && <PostWritingTab />}
        {tab === 'connections' && <ConnectionsTab />}
      </div>
    </div>
  )
}
