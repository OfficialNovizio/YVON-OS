'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, PageHeader, StatusBadge } from '@/components/ui'
import { Play, CalendarPlus, Radio, Check, ListPlus, UserPlus, MessageCircleQuestion, X, Pause, Volume2, Loader2, Scale } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LegalFinding {
  agent: string; role: string; finding: string
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

interface BoardRuling {
  passed: boolean; violations: string[]; required_fixes: string[]
  ruling: 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | 'ESCALATED'
}

interface CouncilResult {
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
  rationale: string; conditions: string[]; risks_accepted: string[]; next_steps: string[]
  positions: Array<{ agent: string; role: string; thesis: string; recommendation: string; score?: number }>
  legal_findings?: LegalFinding[]
  board_ruling?: BoardRuling
  bias_audit?: string; total_tokens: number; duration_ms: number; mode: 'live' | 'simulated'
}

interface DebateMessage { agent: string; role: string; text: string; timestamp: number }

type DecisionType = 'product_launch' | 'contracts' | 'open_source' | 'compliance' | 'general'

// ─── Real Agents ──────────────────────────────────────────────────────────────

const council = [
  { id: 'marcus-ceo', initials: 'MC', name: 'Marcus', role: 'CEO', color: '#abc7ff' },
  { id: 'diana-coo', initials: 'DC', name: 'Diana', role: 'COO', color: '#5ee0ff' },
  { id: 'felix-finance', initials: 'FX', name: 'Felix', role: 'CFO', color: '#5fd0b4' },
  { id: 'kai-marketing', initials: 'KA', name: 'Kai', role: 'CMO', color: '#c08bff' },
  { id: 'kahneman-psychology', initials: 'KN', name: 'Kahneman', role: 'Bias Validator', color: '#ffb693' },
]

const decisionTypes: { value: DecisionType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'product_launch', label: 'Product Launch' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'open_source', label: 'Open Source' },
  { value: 'compliance', label: 'Compliance' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdvisoryCouncilPage() {
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')
  const [decisionType, setDecisionType] = useState<DecisionType>('general')
  const [urgency, setUrgency] = useState<'routine' | 'high' | 'critical'>('routine')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CouncilResult | null>(null)
  const [debate, setDebate] = useState<DebateMessage[]>([])
  const [warRoom, setWarRoom] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState<{ recIndex: number; audioUrl: string; loading: boolean } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Patterns derived from debate
  const patterns = result?.conditions.map((c, i) => ({ text: c, count: result.conditions.length - i })) || []

  const handleListen = useCallback(async (recIndex: number, text: string) => {
    if (speaking?.recIndex === recIndex && speaking?.loading) return
    if (speaking?.recIndex === recIndex && audioRef.current && !audioRef.current.paused) { audioRef.current.pause(); setSpeaking(null); return }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setSpeaking({ recIndex, audioUrl: '', loading: true })
    try {
      const res = await fetch('/api/heygen/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.slice(0, 500), voiceId: 'henry' }) })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSpeaking({ recIndex, audioUrl: data.audioUrl, loading: false })
      const audio = new Audio(data.audioUrl)
      audioRef.current = audio
      audio.onended = () => setSpeaking(null)
      audio.onerror = () => setSpeaking(null)
      await audio.play()
    } catch { setSpeaking(null) }
  }, [speaking])

  const stopAudio = useCallback(() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null } setSpeaking(null) }, [])

  // ─── Demo data loader (dev only, delete-safe) ─────────────────────
  const [isDemo, setIsDemo] = useState(false)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    setIsDemo(true)
    import('@/feed-data/council').then(mod => {
      const demo = mod.default
      setTopic(demo.topic)
      setContext(demo.context)
      setDecisionType(demo.decisionType as DecisionType)
      setUrgency(demo.urgency as 'routine' | 'high' | 'critical')
      setResult(demo.result as CouncilResult)
      const msgs: DebateMessage[] = demo.debate.map(d => ({
        agent: d.agent, role: d.role, text: d.text, timestamp: Date.now() + d.delay,
      }))
      setDebate(msgs)
    }).catch(() => {
      // feed-data folder deleted — proceed with live API, no crash
      setIsDemo(false)
    })
  }, [])

  const conveneCouncil = useCallback(async () => {
    if (!topic.trim()) return
    setLoading(true); setError(null); setResult(null); setDebate([]); setWarRoom(true)

    try {
      const res = await fetch('/api/council/convene', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, context, urgency, decision_type: decisionType }) })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }

      const cd = data as CouncilResult
      const msgs: DebateMessage[] = [{ agent: 'system', role: 'Council', text: `Convened: "${topic}" · ${decisionType} · ${urgency}`, timestamp: Date.now() }]

      for (const pos of cd.positions) {
        msgs.push({ agent: pos.agent, role: `${pos.role} (${pos.recommendation})`, text: pos.thesis, timestamp: Date.now() + msgs.length * 800 })
      }

      if (cd.legal_findings) {
        for (const lf of cd.legal_findings) {
          msgs.push({ agent: lf.agent, role: `⚖ ${lf.role} — ${lf.risk_level}`, text: `${lf.finding}\n→ ${lf.recommendation}`, timestamp: Date.now() + msgs.length * 600 })
        }
      }

      msgs.push({ agent: 'marcus-ceo', role: 'CEO — SYNTHESIS', text: `${cd.decision}: ${cd.rationale}`, timestamp: Date.now() + msgs.length * 600 })

      if (cd.bias_audit) msgs.push({ agent: 'kahneman-psychology', role: 'Bias Audit', text: cd.bias_audit, timestamp: Date.now() + msgs.length * 500 })

      if (cd.board_ruling) {
        const br = cd.board_ruling
        const parts = []
        if (br.violations.length > 0) parts.push(`Violations: ${br.violations.map(v => `Law ${v}`).join(', ')}`)
        if (br.required_fixes.length > 0) parts.push(`Fixes: ${br.required_fixes.join(' | ')}`)
        msgs.push({ agent: 'board-command', role: `Board — ${br.ruling}`, text: parts.join('\n') || 'All clear.', timestamp: Date.now() + msgs.length * 500 })
      }

      setDebate(msgs)
      setResult(cd)
    } catch (err: any) { setError(err.message || 'Failed') }
    finally { setLoading(false) }
  }, [topic, context, urgency, decisionType])

  return (
    <div>
      <PageHeader
        title="Advisory Council"
        subtitle={`${council.length} agents debate, recommend, and convene into a live War Room. Real Hermes agents with tool access and 31 domain skills.`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setWarRoom(true)}>
              <CalendarPlus size={15} /> Set today's topic
            </button>
            <button className="btn-accent" onClick={conveneCouncil} disabled={loading || !topic.trim()}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Radio size={15} />}
              {loading ? 'Convening...' : 'Run a live session'}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {/* Topic Input */}
          <Card className="p-4">
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">What should the council decide?</label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Launch Hourbour MVP without SOC2?"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-white/20 focus:outline-none mb-2"
              onKeyDown={e => e.key === 'Enter' && conveneCouncil()} />
            <div className="flex flex-wrap gap-1.5 mb-2">
              {decisionTypes.map(dt => (
                <button key={dt.value} onClick={() => setDecisionType(dt.value)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${decisionType === dt.value ? 'bg-white/10 text-on-surface' : 'bg-white/[0.03] text-on-surface-variant/60 hover:bg-white/[0.06]'}`}>{dt.label}</button>
              ))}
              <select value={urgency} onChange={e => setUrgency(e.target.value as any)}
                className="ml-auto rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-on-surface-variant focus:outline-none">
                <option value="routine">Routine</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <input value={context} onChange={e => setContext(e.target.value)}
              placeholder="Additional context (optional)..."
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-on-surface-variant placeholder:text-on-surface-variant/40 focus:border-white/20 focus:outline-none" />
          </Card>

          {/* Error */}
          {error && <Card className="p-4"><p className="text-sm text-error">{error}</p></Card>}

          {/* Hero result */}
          {result && (
            <Card className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <StatusBadge tone={result.decision === 'APPROVED' ? 'green' : result.decision === 'CONDITIONAL' ? 'yellow' : 'red'}>{result.decision}</StatusBadge>
                <span className="text-[11px] text-on-surface-variant">{result.mode === 'live' ? '🟢 Live Hermes' : '🟡 Simulated'} · {(result.total_tokens/1000).toFixed(1)}K tokens · {(result.duration_ms/1000).toFixed(1)}s</span>
              </div>
              <h2 className="text-lg font-semibold leading-snug text-on-surface">{result.rationale}</h2>
              {result.conditions.length > 0 && (
                <p className="mt-2 text-[13px] text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Conditions:</span> {result.conditions.join(' · ')}
                </p>
              )}

              {/* Audio player */}
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                <button className="flex h-9 w-9 items-center justify-center rounded-full text-black/80 transition hover:opacity-80"
                  style={{ background: 'var(--ws-accent)' }}
                  onClick={() => handleListen(-1, `${result.rationale} ${result.conditions.length > 0 ? 'Conditions: ' + result.conditions.join('. ') : ''}`)}
                  disabled={speaking?.recIndex === -1 && speaking?.loading}>
                  {speaking?.recIndex === -1 && speaking?.loading ? <Loader2 size={16} className="animate-spin" />
                    : speaking?.recIndex === -1 && audioRef.current && !audioRef.current.paused ? <Pause size={16} />
                    : <Volume2 size={16} />}
                </button>
                <div className="flex h-8 flex-1 items-center gap-[3px]">
                  {Array.from({ length: 56 }).map((_, i) => (
                    <span key={i} className="w-[3px] rounded-full" style={{ height: `${20 + Math.abs(Math.sin(i * 0.7)) * 70}%`,
                      background: speaking?.recIndex === -1 && !speaking?.loading ? i < 18 ? 'var(--ws-accent)' : 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <span className="text-[11px] tabular-nums text-on-surface-variant">
                  {speaking?.recIndex === -1 && speaking?.loading ? 'Generating…' : speaking?.recIndex === -1 ? '▶ Playing' : '0:00 / 0:00'}
                </span>
                {speaking?.recIndex === -1 && !speaking?.loading && (
                  <button onClick={stopAudio} className="text-on-surface-variant hover:text-on-surface"><X size={13} /></button>
                )}
              </div>

              {/* Council avatars */}
              <div className="mt-2 flex -space-x-1.5">
                {council.map((c) => (
                  <span key={c.name} title={c.name} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-black/80" style={{ background: c.color }}>{c.initials}</span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-accent !py-1.5 !text-xs"><Check size={13} /> Accept</button>
                <button className="btn-ghost !py-1.5 !text-xs"><ListPlus size={13} /> Accept & create task</button>
                <button className="btn-ghost !py-1.5 !text-xs"><UserPlus size={13} /> Assign to agent</button>
                <button className="btn-ghost !py-1.5 !text-xs" onClick={() => setWarRoom(true)}><MessageCircleQuestion size={13} /> View in War Room</button>
              </div>
            </Card>
          )}

          {/* Agent positions */}
          {result?.positions && result.positions.map((pos, i) => (
            <Card key={i} hover className="p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <StatusBadge tone="blue">{pos.role}</StatusBadge>
                <span className="text-[11px] text-on-surface-variant">{pos.recommendation}{pos.score ? ` · ${pos.score}/10` : ''}</span>
              </div>
              <h3 className="text-sm font-semibold text-on-surface">{pos.thesis.slice(0, 120)}{pos.thesis.length > 120 ? '…' : ''}</h3>
              <div className="mt-3 flex gap-2">
                <button className="btn-accent !py-1.5 !text-xs">Accept</button>
                <button className="btn-ghost !py-1.5 !text-xs">Assign</button>
                <button className="btn-ghost !py-1.5 !text-xs" onClick={() => handleListen(i, pos.thesis)} disabled={speaking?.recIndex === i && speaking?.loading}>
                  {speaking?.recIndex === i && speaking?.loading ? <Loader2 size={13} className="animate-spin" /> : speaking?.recIndex === i ? <Pause size={13} /> : <Volume2 size={13} />} Listen
                </button>
              </div>
            </Card>
          ))}

          {/* Legal findings */}
          {result?.legal_findings && result.legal_findings.length > 0 && result.legal_findings.map((lf, i) => (
            <div key={`legal-${i}`} className="mb-4 rounded-xl border p-4" style={{ borderLeft: `3px solid ${lf.risk_level === 'critical' ? '#b71c1c' : lf.risk_level === 'high' ? '#f44336' : lf.risk_level === 'medium' ? '#ff9800' : '#4caf50'}`, background: 'rgba(255,255,255,0.02)' }}>
              <div className="mb-1.5 flex items-center gap-2">
                <StatusBadge tone={lf.risk_level === 'critical' || lf.risk_level === 'high' ? 'red' : lf.risk_level === 'medium' ? 'yellow' : 'green'}>{lf.role}</StatusBadge>
                <span className="text-[11px] text-on-surface-variant">Risk: {lf.risk_level.toUpperCase()}</span>
              </div>
              <p className="text-[13px] text-on-surface-variant">{lf.finding}</p>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--ws-accent)' }}>→ {lf.recommendation}</p>
            </div>
          ))}

          {/* Board ruling */}
          {result?.board_ruling && (result.board_ruling.ruling !== 'APPROVED' || result.board_ruling.violations.length > 0) && (
            <Card className="p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <StatusBadge tone={result.board_ruling.ruling === 'ESCALATED' || result.board_ruling.ruling === 'REJECTED' ? 'red' : 'yellow'}>Board: {result.board_ruling.ruling}</StatusBadge>
              </div>
              {result.board_ruling.violations.length > 0 && <p className="text-[12px] text-red-400">Violations: {result.board_ruling.violations.map(v => `Law ${v}`).join(', ')}</p>}
              {result.board_ruling.required_fixes.length > 0 && <p className="text-[12px] text-on-surface-variant">Fixes: {result.board_ruling.required_fixes.join(' · ')}</p>}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="mb-1 text-sm font-semibold text-on-surface">Pattern Tracker</h4>
            <p className="mb-3 text-[12px] text-on-surface-variant">Conditions and themes the council surfaces.</p>
            <div className="space-y-2">
              {patterns.length > 0 ? patterns.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                  <span className="text-[12px] text-on-surface">{p.text}</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--ws-accent)' }}>×{p.count}</span>
                </div>
              )) : (
                <p className="text-[12px] text-on-surface-variant/60">Run a live session to surface patterns.</p>
              )}
            </div>
          </Card>
          <Card className="p-4">
            <h4 className="mb-1 text-sm font-semibold text-on-surface">This session</h4>
            <p className="text-3xl font-bold text-on-surface">{result ? result.positions.length : 0}</p>
            <p className="text-[12px] text-on-surface-variant">agent positions · {result ? `${(result.total_tokens/1000).toFixed(1)}K tokens` : 'ready'}</p>
          </Card>
          <Card className="p-4">
            <h4 className="mb-1 text-sm font-semibold text-on-surface">Decision type</h4>
            <p className="text-sm font-semibold capitalize" style={{ color: 'var(--ws-accent)' }}>{decisionType.replace('_', ' ')}</p>
            <p className="text-[12px] text-on-surface-variant">{urgency} urgency</p>
          </Card>
        </div>
      </div>

      {warRoom && <WarRoom debate={debate} topic={topic} loading={loading} result={result} onClose={() => setWarRoom(false)} onSteer={(text: string) => { setTopic(text); conveneCouncil() }} />}
    </div>
  )
}

// ─── War Room ─────────────────────────────────────────────────────────────────

function WarRoom({ debate, topic, loading, result, onClose, onSteer }: {
  debate: DebateMessage[]; topic: string; loading: boolean; result: CouncilResult | null
  onClose: () => void; onSteer: (text: string) => void
}) {
  const [input, setInput] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm">
      <div className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-bold tracking-wide text-on-surface"><Radio size={16} style={{ color: 'var(--ws-accent)' }} /> WAR ROOM</span>
        {loading ? <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ws-accent)' }}><Loader2 size={12} className="animate-spin" /> CONVENING</span>
          : result ? <span className="flex items-center gap-1.5 text-xs" style={{ color: result.decision === 'APPROVED' ? '#5fd0b4' : result.decision === 'CONDITIONAL' ? '#ffb693' : '#ff8a80' }}><span className="h-2 w-2 rounded-full" style={{ background: result.decision === 'APPROVED' ? '#5fd0b4' : result.decision === 'CONDITIONAL' ? '#ffb693' : '#ff8a80' }} />{result.decision}</span>
          : <span className="flex items-center gap-1.5 text-xs text-error"><span className="h-2 w-2 animate-pulse rounded-full bg-error" /> LIVE</span>}
        <span className="truncate text-sm text-on-surface-variant">Debating: {topic || 'Enter a topic'}</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-ghost !py-1.5 !text-xs"><Pause size={13} /> Pause</button>
          <button className="btn-ghost !py-1.5 !text-xs" onClick={onClose}><X size={14} /> Close</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="scroll-y w-[340px] shrink-0 overflow-y-auto border-r border-white/10 p-4">
          {debate.length === 0 ? (
            <div className="py-8 text-center"><p className="text-sm text-on-surface-variant">Council chamber ready</p></div>
          ) : debate.map((msg, i) => (
            <div key={i} className="mb-3">
              <p className="mb-0.5 text-[11px] font-semibold" style={{ color: council.find(c => c.id === msg.agent)?.color || 'var(--ws-accent)' }}>{msg.role}</p>
              <p className="text-[13px] leading-relaxed text-on-surface-variant">{msg.text.slice(0, 300)}</p>
            </div>
          ))}
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-90" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(40,60,110,0.5), transparent 60%), radial-gradient(100% 80% at 50% 100%, var(--ws-accent-soft), #07080d 70%)' }} />
          <div className="relative text-center">
            <div className="mx-auto mb-6 flex h-40 w-72 items-end justify-center">
              <div className="h-28 w-64 rounded-[50%] border" style={{ borderColor: 'var(--ws-glow)', background: 'rgba(255,255,255,0.03)' }} />
            </div>
            <div className="mx-auto flex max-w-md flex-wrap justify-center gap-2">
              {council.map((c) => (
                <span key={c.name} className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-black/80" style={{ background: c.color }}>{c.initials}</span>
              ))}
            </div>
            {debate.length > 0 && <p className="mt-6 text-sm text-on-surface-variant"><span className="font-semibold text-on-surface">{debate[debate.length-1]?.role}:</span> {debate[debate.length-1]?.text.slice(0, 150)}</p>}
          </div>

          {result && (
            <div className="absolute bottom-5 left-1/2 w-[min(560px,90%)] -translate-x-1/2">
              <Card className="p-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ws-accent)' }}>The council {result.decision === 'CONDITIONAL' ? 'conditionally approves' : result.decision === 'APPROVED' ? 'approves' : 'rejects'}</p>
                <p className="text-sm text-on-surface">{result.rationale}</p>
                {result.board_ruling && result.board_ruling.ruling !== 'APPROVED' && (
                  <p className="mt-1 text-[11px]" style={{ color: '#ff8a80' }}>Board: {result.board_ruling.ruling}{result.board_ruling.required_fixes.length > 0 ? ` — ${result.board_ruling.required_fixes.length} fixes` : ''}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button className="btn-accent !py-1.5 !text-xs"><Check size={13} /> Accept</button>
                  <button className="btn-ghost !py-1.5 !text-xs">Accept & create task</button>
                  <button className="btn-ghost !py-1.5 !text-xs" onClick={onClose}>Back to council</button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Jump in — steer the debate…"
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onSteer(input); setInput('') } }}
            disabled={loading} />
          <button className="btn-accent !py-1.5 !text-xs" onClick={() => { if (input.trim()) { onSteer(input); setInput('') } }} disabled={loading || !input.trim()}>Send</button>
        </div>
      </div>
    </div>
  )
}
