'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { getAgent } from '@/lib/agents'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DimensionScore {
  name: string
  label: string
  score: number | null
  color: string
}

const DIMENSIONS: DimensionScore[] = [
  { name: 'demand',      label: 'Demand',           score: null, color: '#06B6D4' },
  { name: 'market',      label: 'Market Size',       score: null, color: '#8B5CF6' },
  { name: 'competition', label: 'Competition',       score: null, color: '#F59E0B' },
  { name: 'icp',         label: 'ICP Clarity',       score: null, color: '#10B981' },
  { name: 'model',       label: 'Model Fit',         score: null, color: '#F43F5E' },
]

const REVENUE_MODELS = [
  'SaaS / Subscription',
  'Marketplace (take rate)',
  'DTC / E-commerce',
  'Freemium → paid',
  'Service / Consulting',
  'Transaction fee',
  'Licensing / B2B',
  'Ad-supported',
  'Not sure yet',
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function SH({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--b1)' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)' }}>{children}</div>
      {sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function parseScores(text: string): Record<string, number> {
  const scores: Record<string, number> = {}
  // Look for patterns like "Demand: 7/10" or "DEMAND — 7/10" or "Demand Score: 7"
  const patterns = [
    { key: 'demand',      re: /demand[^0-9]*(\d+)\s*\/\s*10/i },
    { key: 'market',      re: /market\s*(size)?[^0-9]*(\d+)\s*\/\s*10/i },
    { key: 'competition', re: /competition[^0-9]*(\d+)\s*\/\s*10/i },
    { key: 'icp',         re: /icp[^0-9]*(\d+)\s*\/\s*10/i },
    { key: 'model',       re: /model\s*(fit)?[^0-9]*(\d+)\s*\/\s*10/i },
  ]
  for (const { key, re } of patterns) {
    const m = text.match(re)
    if (m) {
      const num = parseInt(m[m.length - 1])
      if (!isNaN(num) && num >= 0 && num <= 10) scores[key] = num
    }
  }
  return scores
}

function getTotalAndVerdict(dims: DimensionScore[]): { total: number; verdict: 'GO' | 'CAUTIOUS' | 'NOT NOW' | null } {
  const filled = dims.filter(d => d.score !== null)
  if (filled.length < 5) return { total: 0, verdict: null }
  const total = filled.reduce((sum, d) => sum + (d.score ?? 0), 0)
  const verdict = total >= 40 ? 'GO' : total >= 28 ? 'CAUTIOUS' : 'NOT NOW'
  return { total, verdict }
}

// ── Score Bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ dim, animate }: { dim: DimensionScore; animate: boolean }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (animate && dim.score !== null) {
      const t = setTimeout(() => setWidth((dim.score! / 10) * 100), 100)
      return () => clearTimeout(t)
    } else {
      setWidth(0)
    }
  }, [animate, dim.score])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '100px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', flexShrink: 0 }}>
        {dim.label}
      </div>
      <div style={{ flex: 1, height: '8px', background: 'var(--b2)', position: 'relative' }}>
        <div
          style={{
            height: '8px',
            width: `${width}%`,
            background: dim.score !== null ? dim.color : 'var(--b2)',
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      <div style={{ width: '36px', textAlign: 'right', fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: dim.score !== null ? dim.color : 'var(--b3)', fontWeight: 600 }}>
        {dim.score !== null ? `${dim.score}/10` : '—'}
      </div>
    </div>
  )
}

// ── Verdict Badge ─────────────────────────────────────────────────────────────
function VerdictBadge({ verdict, total }: { verdict: 'GO' | 'CAUTIOUS' | 'NOT NOW' | null; total: number }) {
  if (!verdict) return null
  const config = {
    'GO':       { bg: '#10B981', label: '✓ GO',      sub: 'Strong signal — worth pursuing' },
    'CAUTIOUS': { bg: '#F59E0B', label: '⚠ CAUTIOUS', sub: 'Some gaps — validate before committing' },
    'NOT NOW':  { bg: '#F43F5E', label: '✕ NOT NOW',  sub: 'Significant gaps — revisit the premise' },
  }
  const c = config[verdict]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--sf)', border: `1px solid ${c.bg}40`, borderLeft: `3px solid ${c.bg}` }}>
      <div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '20px', color: c.bg, letterSpacing: '0.05em', fontWeight: 700 }}>{c.label}</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', marginTop: '2px' }}>{c.sub}</div>
      </div>
      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '28px', color: c.bg, fontWeight: 700 }}>{total}</div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)' }}>/ 50</div>
      </div>
    </div>
  )
}

// ── Stream Output ─────────────────────────────────────────────────────────────
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
        background: 'var(--sf)',
        border: '1px solid var(--b1)',
        borderLeft: '2px solid #06B6D4',
        padding: '16px',
        maxHeight: '600px',
        overflowY: 'auto',
        fontFamily: 'var(--font-dm-mono)',
        fontSize: '12px',
        lineHeight: 1.8,
        color: 'var(--tx)',
        whiteSpace: 'pre-wrap',
      }}
    >
      {loading && !content && <span style={{ color: 'var(--di)' }}>Scout · researching…</span>}
      {content}
      {loading && content && <span style={{ color: '#06B6D4' }}>▌</span>}
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function ScoutPage() {
  const [ideaName, setIdeaName]     = useState('')
  const [description, setDescription] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [revenueModel, setRevenueModel] = useState('')
  const [problem, setProblem]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [output, setOutput]         = useState('')
  const [dims, setDims]             = useState<DimensionScore[]>(DIMENSIONS.map(d => ({ ...d })))
  const [showScores, setShowScores] = useState(false)
  const [validated, setValidated]   = useState<{ name: string; verdict: string; total: number }[]>([])

  const { total, verdict } = getTotalAndVerdict(dims)

  async function runValidation() {
    if (!ideaName || !description) return
    setLoading(true)
    setOutput('')
    setDims(DIMENSIONS.map(d => ({ ...d, score: null })))
    setShowScores(false)

    const agent = getAgent('venture-scout')
    const prompt = `Validate this startup idea for Stark (solo founder, runs Novizio + Hourbour under YVON).

IDEA NAME: ${ideaName}
ONE-LINE DESCRIPTION: ${description}
TARGET MARKET: ${targetMarket || 'not specified'}
REVENUE MODEL: ${revenueModel || 'not specified'}
${problem ? `CORE PROBLEM BEING SOLVED: ${problem}` : ''}

Run the full 5-dimension validation. For each dimension, give a score out of 10 in the EXACT format:
[Dimension Name]: [score]/10

Structure your report as:

## DEMAND — [score]/10
[research, signals, evidence]

## MARKET SIZE — [score]/10
[TAM/SAM/SOM with cited sources or best estimates]

## COMPETITION — [score]/10
[who exists, what gaps remain, market map]

## ICP CLARITY — [score]/10
[one specific real customer profile]

## MODEL FIT — [score]/10
[which revenue model fits this problem and why]

---
## VERDICT: [GO / CAUTIOUS / NOT NOW]
TOTAL SCORE: [X]/50

## NEXT STEPS
[if GO or CAUTIOUS: draft handoff notes for Felix (financial model) and Priya (product spec)]
[if NOT NOW: what needs to change for this to become viable]`

    let fullText = ''
    try {
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
            if (parsed.text) {
              fullText += parsed.text
              setOutput(fullText)
            }
          } catch { /* ignore */ }
        }
      }
      // Parse scores from completed output
      const scores = parseScores(fullText)
      const updatedDims = DIMENSIONS.map(d => ({
        ...d,
        score: scores[d.name] !== undefined ? scores[d.name] : null,
      }))
      setDims(updatedDims)
      setShowScores(true)

      // Determine verdict for history
      const t = Object.values(scores).reduce((s, v) => s + v, 0)
      const v = t >= 40 ? 'GO' : t >= 28 ? 'CAUTIOUS' : 'NOT NOW'
      setValidated(prev => [{ name: ideaName, verdict: v, total: t }, ...prev.slice(0, 4)])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            Idea Validation
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            5-dimension scoring · Demand · Market · Competition · ICP · Model Fit · Powered by Scout 🔭
          </p>
        </div>
        <Link
          href="/agents/venture-scout"
          style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.08em', padding: '6px 14px', border: '1px solid var(--b2)', color: 'var(--di)', textDecoration: 'none', display: 'inline-block' }}
        >
          VIEW AGENT →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left: Form + Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SH sub="Describe the idea — Scout will research and score it across 5 dimensions">New Idea</SH>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>IDEA NAME <span style={{ color: 'var(--rd)' }}>*</span></label>
                <input
                  value={ideaName}
                  onChange={(e) => setIdeaName(e.target.value)}
                  placeholder="e.g. StyleVault"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>REVENUE MODEL</label>
                <select
                  value={revenueModel}
                  onChange={(e) => setRevenueModel(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Select a model…</option>
                  {REVENUE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>ONE-LINE DESCRIPTION <span style={{ color: 'var(--rd)' }}>*</span></label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. A subscription wardrobe service for professionals who hate shopping"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>TARGET MARKET</label>
                <input
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="e.g. UK professionals 28–42"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', display: 'block', marginBottom: '6px', letterSpacing: '0.08em' }}>CORE PROBLEM <span style={{ color: 'var(--mu)' }}>(optional)</span></label>
                <input
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="e.g. Professionals waste 20min/day on outfit decisions"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--b2)', padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button
              onClick={runValidation}
              disabled={loading || !ideaName || !description}
              style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', padding: '10px 24px', background: loading ? 'var(--b2)' : '#06B6D4', border: 'none', color: loading ? 'var(--di)' : '#000', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', fontWeight: 600 }}
            >
              {loading ? 'VALIDATING…' : 'VALIDATE IDEA →'}
            </button>
          </div>

          {/* Verdict */}
          {showScores && <VerdictBadge verdict={verdict} total={total} />}

          {/* Stream output */}
          <StreamOutput content={output} loading={loading} />
        </div>

        {/* Right: Score panel + history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Dimension Scores */}
          <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '16px' }}>
            <SH>Dimension Scores</SH>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {dims.map(d => (
                <ScoreBar key={d.name} dim={d} animate={showScores} />
              ))}
            </div>
            {!showScores && (
              <div style={{ marginTop: '16px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--mu)', textAlign: 'center', paddingTop: '8px', borderTop: '1px solid var(--b1)' }}>
                Scores appear after validation
              </div>
            )}
          </div>

          {/* Scoring legend */}
          <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '16px' }}>
            <SH>Scoring Thresholds</SH>
            {[
              { range: '40–50', verdict: 'GO', color: '#10B981', desc: 'Strong signal across dimensions' },
              { range: '28–39', verdict: 'CAUTIOUS', color: '#F59E0B', desc: 'Worth exploring with caveats' },
              { range: '< 28', verdict: 'NOT NOW', color: '#F43F5E', desc: 'Significant gaps to address first' },
            ].map(t => (
              <div key={t.verdict} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '56px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: t.color, flexShrink: 0 }}>{t.range}</div>
                <div style={{ width: '72px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: t.color, fontWeight: 700, flexShrink: 0 }}>{t.verdict}</div>
                <div style={{ fontSize: '11px', color: 'var(--di)', lineHeight: 1.4 }}>{t.desc}</div>
              </div>
            ))}
          </div>

          {/* Session history */}
          {validated.length > 0 && (
            <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '16px' }}>
              <SH>This Session</SH>
              {validated.map((v, i) => {
                const color = v.verdict === 'GO' ? '#10B981' : v.verdict === 'CAUTIOUS' ? '#F59E0B' : '#F43F5E'
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', paddingBottom: '10px', borderBottom: i < validated.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                    <div style={{ flex: 1, fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--tx)' }}>{v.name}</div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: color }}>{v.verdict}</div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: color, fontWeight: 700 }}>{v.total}/50</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
