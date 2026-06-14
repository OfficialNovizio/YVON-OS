'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, PageHeader, StatusBadge } from '@/components/ui'
import { Radio, Send, Loader2, Shield, Brain, Zap, Users, Gavel, Scale, FileText, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CouncilAgent {
  id: string; name: string; role: string; department: string; level: number
  color: string; initials: string; status: 'idle' | 'thinking' | 'done'
  isLegal?: boolean; isBoard?: boolean; isValidator?: boolean
}

interface DebateMessage {
  agent: string; role: string; text: string; timestamp: number
  type?: 'position' | 'legal' | 'synthesis' | 'bias' | 'board' | 'next_steps' | 'system'
}

interface LegalFinding {
  agent: string; role: string; finding: string
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

interface BoardRuling {
  passed: boolean
  violations: string[]
  required_fixes: string[]
  ruling: 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | 'ESCALATED'
}

interface CouncilDecision {
  decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
  rationale: string; conditions: string[]; risks_accepted: string[]; next_steps: string[]
  positions: Array<{ agent: string; role: string; thesis: string; recommendation: string; score?: number }>
  legal_findings?: LegalFinding[]
  board_ruling?: BoardRuling
  bias_audit?: string; total_tokens: number; duration_ms: number; mode: 'live' | 'simulated'
}

type DecisionType = 'product_launch' | 'contracts' | 'open_source' | 'compliance' | 'general'

// ─── Council Configuration ────────────────────────────────────────────────────

const EXECUTIVE_SEATS: CouncilAgent[] = [
  { id: 'marcus-ceo', name: 'Marcus', role: 'CEO', department: 'Command', level: 1, color: '#abc7ff', initials: 'MC', status: 'idle' },
  { id: 'diana-coo', name: 'Diana', role: 'COO', department: 'Command', level: 1, color: '#5ee0ff', initials: 'DC', status: 'idle' },
  { id: 'felix-finance', name: 'Felix', role: 'CFO', department: 'Finance', level: 2, color: '#5fd0b4', initials: 'FX', status: 'idle' },
  { id: 'kai-marketing', name: 'Kai', role: 'CMO', department: 'Marketing', level: 3, color: '#c08bff', initials: 'KA', status: 'idle' },
]

const LEGAL_AGENTS: Record<DecisionType, CouncilAgent[]> = {
  product_launch: [
    { id: 'comply-legal', name: 'Comply', role: 'Compliance', department: 'Legal', level: 2, color: '#ffa726', initials: 'CP', status: 'idle', isLegal: true },
  ],
  contracts: [
    { id: 'docs-legal', name: 'Docs', role: 'Documentation', department: 'Legal', level: 2, color: '#66bb6a', initials: 'DC', status: 'idle', isLegal: true },
    { id: 'comply-legal', name: 'Comply', role: 'Compliance', department: 'Legal', level: 2, color: '#ffa726', initials: 'CP', status: 'idle', isLegal: true },
  ],
  open_source: [
    { id: 'guard-legal', name: 'Guard', role: 'IP Protection', department: 'Legal', level: 2, color: '#ef5350', initials: 'GD', status: 'idle', isLegal: true },
  ],
  compliance: [
    { id: 'comply-legal', name: 'Comply', role: 'Compliance', department: 'Legal', level: 2, color: '#ffa726', initials: 'CP', status: 'idle', isLegal: true },
  ],
  general: [
    { id: 'comply-legal', name: 'Comply', role: 'Compliance', department: 'Legal', level: 2, color: '#ffa726', initials: 'CP', status: 'idle', isLegal: true },
  ],
}

const VALIDATORS: CouncilAgent[] = [
  { id: 'kahneman-psychology', name: 'Kahneman', role: 'Bias Validator', department: 'Psychology', level: 2, color: '#ffb693', initials: 'KN', status: 'idle', isValidator: true },
]

const GOVERNANCE: CouncilAgent[] = [
  { id: 'board-command', name: 'Board', role: 'Governance Gate', department: 'Command', level: 1, color: '#ff8a80', initials: 'BR', status: 'idle', isBoard: true },
]

const DECISION_TYPES: { value: DecisionType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'general', label: 'General', icon: <Zap size={14} />, desc: 'Light compliance scan' },
  { value: 'product_launch', label: 'Product Launch', icon: <Send size={14} />, desc: 'Regulatory check' },
  { value: 'contracts', label: 'Contracts', icon: <FileText size={14} />, desc: 'Legal doc review' },
  { value: 'open_source', label: 'Open Source', icon: <Lock size={14} />, desc: 'IP + license check' },
  { value: 'compliance', label: 'Compliance', icon: <Scale size={14} />, desc: 'Full regulatory audit' },
]

// ─── Risk Badge ───────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    none: { color: '#4caf50', icon: <CheckCircle size={12} />, label: 'None' },
    low: { color: '#8bc34a', icon: <CheckCircle size={12} />, label: 'Low' },
    medium: { color: '#ff9800', icon: <AlertTriangle size={12} />, label: 'Medium' },
    high: { color: '#f44336', icon: <XCircle size={12} />, label: 'High' },
    critical: { color: '#b71c1c', icon: <XCircle size={12} />, label: 'Critical' },
  }
  const c = config[level] || config.none
  return (
    <span style={{ color: c.color, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
      {c.icon} {c.label}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdvisoryCouncilPage() {
  const [decisionType, setDecisionType] = useState<DecisionType>('general')
  const [executives, setExecutives] = useState<CouncilAgent[]>(EXECUTIVE_SEATS.map(a => ({ ...a })))
  const [legalAgents, setLegalAgents] = useState<CouncilAgent[]>(LEGAL_AGENTS.general.map(a => ({ ...a })))
  const [topic, setTopic] = useState('')
  const [context, setContext] = useState('')
  const [urgency, setUrgency] = useState<'routine' | 'high' | 'critical'>('routine')
  const [loading, setLoading] = useState(false)
  const [debate, setDebate] = useState<DebateMessage[]>([])
  const [decision, setDecision] = useState<CouncilDecision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'executives' | 'legal' | 'synthesis' | 'bias' | 'board' | 'done'>('idle')
  const transcriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/council/convene').then(r => r.json()).then(data => {
      if (data.status === 'live') {
        setExecutives(prev => prev.map(a => ({ ...a, status: 'idle' as const })))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [debate])

  useEffect(() => {
    setLegalAgents(LEGAL_AGENTS[decisionType].map(a => ({ ...a })))
  }, [decisionType])

  const conveneCouncil = useCallback(async () => {
    if (!topic.trim()) return
    setLoading(true); setError(null); setDecision(null); setDebate([]); setPhase('executives')
    setExecutives(prev => prev.map(a => ({ ...a, status: 'thinking' })))
    setLegalAgents(prev => prev.map(a => ({ ...a, status: 'idle' })))

    const legalLabel = DECISION_TYPES.find(d => d.value === decisionType)?.desc || 'Light scan'
    setDebate([{
      agent: 'system', role: 'Council', type: 'system',
      text: `Convening v2 Council: "${topic}"\nUrgency: ${urgency} · Type: ${decisionType} (${legalLabel})\nExecutives: Marcus (CEO), Diana (COO), Felix (CFO), Kai (CMO)\nLegal: ${legalAgents.map(a => a.name).join(', ') || 'none'}\nValidators: Kahneman · Board Gate: ACTIVE`,
      timestamp: Date.now(),
    }])

    try {
      const res = await fetch('/api/council/convene', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, context, urgency, decision_type: decisionType }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setExecutives(prev => prev.map(a => ({ ...a, status: 'idle' })))
        setLoading(false)
        return
      }

      const cd = data as CouncilDecision

      // Show executive positions
      for (let i = 0; i < cd.positions.length; i++) {
        const pos = cd.positions[i]
        setExecutives(prev => prev.map((a, idx) => idx === i ? { ...a, status: 'done' } : a))
        setDebate(prev => [...prev, {
          agent: pos.agent, role: `${pos.role} → ${pos.recommendation}${pos.score ? ` (${pos.score}/10)` : ''}`,
          text: pos.thesis, timestamp: Date.now() + i * 600, type: 'position',
        }])
        await new Promise(r => setTimeout(r, 400))
      }

      // Show legal findings
      if (cd.legal_findings && cd.legal_findings.length > 0) {
        setPhase('legal')
        for (let i = 0; i < cd.legal_findings.length; i++) {
          const lf = cd.legal_findings[i]
          setLegalAgents(prev => prev.map((a, idx) => idx === i ? { ...a, status: 'done' } : a))
          setDebate(prev => [...prev, {
            agent: lf.agent, role: `⚖ ${lf.role} — Risk: ${lf.risk_level.toUpperCase()}`,
            text: `${lf.finding}\n\n→ ${lf.recommendation}`,
            timestamp: Date.now() + cd.positions.length * 600 + i * 500, type: 'legal',
          }])
          await new Promise(r => setTimeout(r, 400))
        }
      }

      // Synthesis
      setPhase('synthesis')
      setDebate(prev => [...prev, {
        agent: 'marcus-ceo', role: 'CEO — SYNTHESIS',
        text: `DECISION: ${cd.decision}\n${cd.rationale}${cd.conditions.length > 0 ? `\n\nConditions: ${cd.conditions.map(c => `• ${c}`).join('\n')}` : ''}`,
        timestamp: Date.now() + 3000, type: 'synthesis',
      }])

      // Bias audit
      if (cd.bias_audit) {
        setPhase('bias')
        setDebate(prev => [...prev, {
          agent: 'kahneman-psychology', role: '🧠 Bias Audit',
          text: cd.bias_audit!, timestamp: Date.now() + 4000, type: 'bias',
        }])
      }

      // Board ruling
      if (cd.board_ruling) {
        setPhase('board')
        const br = cd.board_ruling
        const rulingEmoji = br.ruling === 'APPROVED' ? '✅' : br.ruling === 'CONDITIONAL' ? '⚠️' : br.ruling === 'ESCALATED' ? '🚨' : '❌'
        const boardText = [
          `Ruling: ${rulingEmoji} ${br.ruling}`,
          br.violations.length > 0 ? `Violations: ${br.violations.map(v => `Law ${v}`).join(', ')}` : 'No constitutional violations.',
          br.required_fixes.length > 0 ? `Required fixes:\n${br.required_fixes.map(f => `• ${f}`).join('\n')}` : '',
        ].filter(Boolean).join('\n')

        setDebate(prev => [...prev, {
          agent: 'board-command', role: '🏛 Board Governance Gate',
          text: boardText, timestamp: Date.now() + 5000, type: 'board',
        }])
      }

      // Next steps
      if (cd.next_steps.length > 0) {
        setPhase('done')
        setDebate(prev => [...prev, {
          agent: 'diana-coo', role: '📋 Next Steps',
          text: cd.next_steps.map(s => `→ ${s}`).join('\n'),
          timestamp: Date.now() + 6000, type: 'next_steps',
        }])
      }

      setDecision(cd)
      setPhase('done')
    } catch (err: any) {
      setError(err.message || 'Council failed to convene')
      setExecutives(prev => prev.map(a => ({ ...a, status: 'idle' })))
      setLegalAgents(prev => prev.map(a => ({ ...a, status: 'idle' })))
    } finally {
      setLoading(false)
      setExecutives(prev => prev.map(a => a.status === 'thinking' ? { ...a, status: 'idle' } : a))
      setLegalAgents(prev => prev.map(a => a.status === 'thinking' ? { ...a, status: 'idle' } : a))
    }
  }, [topic, context, urgency, decisionType, legalAgents])

  const reset = useCallback(() => {
    setDecision(null); setDebate([]); setError(null); setPhase('idle')
    setExecutives(EXECUTIVE_SEATS.map(a => ({ ...a })))
    setLegalAgents(LEGAL_AGENTS[decisionType].map(a => ({ ...a })))
  }, [decisionType])

  const [steerInput, setSteerInput] = useState('')
  const steerCouncil = useCallback(() => {
    if (!steerInput.trim() || loading) return
    const newContext = context ? `${context}\n\nUser steer: ${steerInput}` : `User steer: ${steerInput}`
    setContext(newContext)
    setSteerInput('')
    // Re-convene with updated context
    setLoading(true); setError(null); setDecision(null)
    setExecutives(prev => prev.map(a => ({ ...a, status: 'thinking' })))
    setLegalAgents(prev => prev.map(a => ({ ...a, status: 'idle' })))
    fetch('/api/council/convene', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, context: newContext, urgency, decision_type: decisionType }),
    }).then(r => r.json()).then(data => {
      if (data.error) { setError(data.error); setExecutives(prev => prev.map(a => ({ ...a, status: 'idle' }))); return }
      const cd = data as CouncilDecision
      // Append to existing debate
      setDebate(prev => [...prev, { agent: 'system', role: '🔄 Steered', text: steerInput, timestamp: Date.now(), type: 'system' }])
      for (let i = 0; i < cd.positions.length; i++) {
        const pos = cd.positions[i]
        setExecutives(prev => prev.map((a, idx) => idx === i ? { ...a, status: 'done' } : a))
        setDebate(prev => [...prev, { agent: pos.agent, role: `${pos.role} → ${pos.recommendation}`, text: pos.thesis, timestamp: Date.now() + i * 400, type: 'position' }])
      }
      if (cd.legal_findings) {
        cd.legal_findings.forEach((lf, i) => {
          setDebate(prev => [...prev, { agent: lf.agent, role: `⚖ ${lf.role}`, text: `${lf.finding}\n→ ${lf.recommendation}`, timestamp: Date.now() + 2000 + i * 400, type: 'legal' }])
        })
      }
      setDebate(prev => [...prev, { agent: 'marcus-ceo', role: 'CEO — SYNTHESIS', text: `DECISION: ${cd.decision}\n${cd.rationale}`, timestamp: Date.now() + 3500, type: 'synthesis' }])
      setDecision(cd); setPhase('done')
    }).catch(err => setError(err.message))
    .finally(() => { setLoading(false); setExecutives(prev => prev.map(a => ({ ...a, status: 'done' }))); setLegalAgents(prev => prev.map(a => ({ ...a, status: 'done' }))) })
  }, [steerInput, loading, context, topic, urgency, decisionType])

  const totalAgents = executives.length + legalAgents.length + VALIDATORS.length + GOVERNANCE.length
  const phaseLabel = phase === 'idle' ? 'Ready' : phase === 'executives' ? 'Deliberating' : phase === 'legal' ? 'Legal Review' : phase === 'synthesis' ? 'Synthesizing' : phase === 'bias' ? 'Bias Audit' : phase === 'board' ? 'Board Gate' : 'Complete'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <PageHeader
        title="Advisory Council v2"
        subtitle={`${executives.length} executives · ${legalAgents.length} legal · ${VALIDATORS.length} validator · ${GOVERNANCE.length} governance · ${totalAgents} total agents`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {decision && (
              <button className="btn-ghost !py-2 !text-sm" onClick={reset}>
                New Session
              </button>
            )}
            <button className="btn-accent !py-2 !text-sm" onClick={conveneCouncil} disabled={loading || !topic.trim()}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Radio size={15} />}
              {loading ? phaseLabel + '...' : 'Convene Council'}
            </button>
          </div>
        }
      />

      {/* ─── Topic Input ─────────────────────────────────────────────── */}
      <Card className="mb-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text" placeholder="What should the council decide? (e.g., 'Launch Hourbour without SOC2')"
              value={topic} onChange={e => setTopic(e.target.value)}
              disabled={loading}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Decision Type */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 2 }}>
              {DECISION_TYPES.map(dt => (
                <button
                  key={dt.value}
                  onClick={() => setDecisionType(dt.value)}
                  disabled={loading}
                  title={dt.desc}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '6px 10px', borderRadius: 6, border: 'none',
                    background: decisionType === dt.value ? 'rgba(94,224,255,0.15)' : 'transparent',
                    color: decisionType === dt.value ? '#5ee0ff' : 'rgba(255,255,255,0.5)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {dt.icon} {dt.label}
                </button>
              ))}
            </div>

            {/* Urgency */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 2 }}>
              {(['routine', 'high', 'critical'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setUrgency(u)}
                  disabled={loading}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: 'none',
                    background: urgency === u ? 'rgba(255,183,77,0.15)' : 'transparent',
                    color: urgency === u ? '#ffb74d' : 'rgba(255,255,255,0.5)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {u === 'critical' ? '🚨 ' : u === 'high' ? '⚠️ ' : ''}{u}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text" placeholder="Additional context, research brief, or task details..."
            value={context} onChange={e => setContext(e.target.value)}
            disabled={loading}
            style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: '#fff', fontSize: 13, width: '100%' }}
          />
        </div>
      </Card>

      {/* ─── Council Chamber ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Executives */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            👥 Executive Council ({executives.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {executives.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#111' }}>
                  {a.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>· {a.role}</span></div>
                </div>
                <StatusBadge tone={a.status === 'thinking' ? 'yellow' : a.status === 'done' ? 'green' : 'muted'}>{a.status === 'thinking' ? 'busy' : a.status === 'done' ? 'done' : 'idle'}</StatusBadge>
              </div>
            ))}
          </div>
        </Card>

        {/* Legal + Validators + Board */}
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            ⚖ Legal · 🧠 Validator · 🏛 Governance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {legalAgents.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#111' }}>
                  {a.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>· {a.role}</span></div>
                </div>
                <StatusBadge tone={a.status === 'thinking' ? 'yellow' : a.status === 'done' ? 'green' : 'muted'}>{a.status === 'thinking' ? 'busy' : a.status === 'done' ? 'done' : 'idle'}</StatusBadge>
              </div>
            ))}
            {VALIDATORS.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#111' }}>
                  {a.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>· {a.role}</span></div>
                </div>
                <StatusBadge tone="muted">idle</StatusBadge>
              </div>
            ))}
            {GOVERNANCE.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#111' }}>
                  {a.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>· {a.role}</span></div>
                </div>
                <StatusBadge tone="muted">idle</StatusBadge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── Legal Findings Summary ────────────────────────────────────── */}
      {decision?.legal_findings && decision.legal_findings.length > 0 && (
        <Card className="mb-4">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            ⚖ Legal Findings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {decision.legal_findings.map((lf, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, borderLeft: `3px solid ${lf.risk_level === 'critical' ? '#b71c1c' : lf.risk_level === 'high' ? '#f44336' : lf.risk_level === 'medium' ? '#ff9800' : '#4caf50'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{lf.role}</span>
                  <RiskBadge level={lf.risk_level} />
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{lf.finding}</div>
                <div style={{ fontSize: 11, color: '#5ee0ff', marginTop: 4 }}>→ {lf.recommendation}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Board Ruling ──────────────────────────────────────────────── */}
      {decision?.board_ruling && (decision.board_ruling.ruling !== 'APPROVED' || decision.board_ruling.violations.length > 0) && (
        <div className="mb-4" style={{ border: `1px solid ${decision.board_ruling.ruling === 'ESCALATED' ? '#f44336' : decision.board_ruling.ruling === 'CONDITIONAL' ? '#ff9800' : 'transparent'}`, borderRadius: 8, padding: 1 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            🏛 Board Ruling — {decision.board_ruling.ruling}
          </div>
          {decision.board_ruling.violations.length > 0 && (
            <div style={{ marginBottom: 6, fontSize: 13, color: '#f44336' }}>
              Violations: {decision.board_ruling.violations.map(v => `Law ${v}`).join(', ')}
            </div>
          )}
          {decision.board_ruling.required_fixes.length > 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Required fixes:{decision.board_ruling.required_fixes.map((f, i) => (
                <div key={i} style={{ marginTop: 2 }}>• {f}</div>
              ))}
            </div>
          )}
        </Card>
        </div>
      )}

      {/* ─── Decision Summary ──────────────────────────────────────────── */}
      {decision && (
        <div className="mb-4" style={{
          borderLeft: `4px solid ${decision.decision === 'APPROVED' ? '#4caf50' : decision.decision === 'CONDITIONAL' ? '#ff9800' : '#f44336'}`,
          borderRadius: 8,
        }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: decision.decision === 'APPROVED' ? '#4caf50' : decision.decision === 'CONDITIONAL' ? '#ff9800' : '#f44336' }}>
              {decision.decision === 'APPROVED' ? '✅ APPROVED' : decision.decision === 'CONDITIONAL' ? '⚠️ CONDITIONAL' : '❌ REJECTED'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {decision.mode.toUpperCase()} · {decision.total_tokens.toLocaleString()} tokens · {(decision.duration_ms / 1000).toFixed(1)}s
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 8 }}>{decision.rationale}</div>
          {decision.conditions.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>CONDITIONS</div>
              {decision.conditions.map((c, i) => (
                <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', paddingLeft: 8 }}>• {c}</div>
              ))}
            </div>
          )}
          {decision.risks_accepted.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#ff9800', marginBottom: 4 }}>RISKS ACCEPTED</div>
              {decision.risks_accepted.map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingLeft: 8 }}>• {r}</div>
              ))}
            </div>
          )}
          {decision.next_steps.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>NEXT STEPS (Generated by Diana)</div>
              {decision.next_steps.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: '#5ee0ff', paddingLeft: 8 }}>→ {s}</div>
              ))}
            </div>
          )}
        </Card>
        </div>
      )}

      {/* ─── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4" style={{ border: '1px solid #f44336', borderRadius: 8, padding: 1 }}>
        <Card>
          <div style={{ fontSize: 13, color: '#f44336' }}>⚠ {error}</div>
        </Card>
        </div>
      )}

      {/* ─── Steer Input ─────────────────────────────────────────────────── */}
      {debate.length > 0 && !loading && (
        <Card className="mb-4">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Steer the council — add a task, question, or challenge..."
              value={steerInput}
              onChange={e => setSteerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && steerCouncil()}
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(94,224,255,0.2)', borderRadius: 8, color: '#fff', fontSize: 13 }}
            />
            <button
              className="btn-accent !py-2 !text-sm"
              onClick={steerCouncil}
              disabled={!steerInput.trim()}
            >
              <Send size={14} /> Send
            </button>
          </div>
        </Card>
      )}

      {/* ─── Debate Transcript ─────────────────────────────────────────── */}
      {debate.length > 0 && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            📜 Council Transcript ({debate.length} messages)
          </div>
          <div ref={transcriptRef} style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {debate.map((msg, i) => {
              const isLegal = msg.type === 'legal'
              const isBoard = msg.type === 'board'
              const isBias = msg.type === 'bias'
              const isSynthesis = msg.type === 'synthesis'
              const isSystem = msg.type === 'system'

              const bgColor = isSystem ? 'transparent'
                : isSynthesis ? 'rgba(171,199,255,0.08)'
                : isBias ? 'rgba(255,182,147,0.08)'
                : isBoard ? 'rgba(255,138,128,0.08)'
                : isLegal ? 'rgba(255,167,38,0.08)'
                : 'rgba(255,255,255,0.02)'

              return (
                <div key={i} style={{ padding: '8px 12px', background: bgColor, borderRadius: 6, borderLeft: isLegal ? '2px solid #ffa726' : isBoard ? '2px solid #ff8a80' : isBias ? '2px solid #ffb693' : isSynthesis ? '2px solid #abc7ff' : '2px solid transparent' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 3, textTransform: 'uppercase' }}>
                    {msg.role}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
