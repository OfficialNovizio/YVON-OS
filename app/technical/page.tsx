'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { PROJECTS } from '@/lib/projects'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'agent'
  content: string
  agentId?: string
  agentName?: string
  agentRole?: string
  color?: string
  emoji?: string
}

interface ProposalData {
  commitMessage: string
  branchName: string
  files: Array<{ path: string; content: string }>
}

interface PendingChange {
  id: string
  project_id: string
  agent_id: string
  agent_name: string
  branch_name: string
  commit_message: string
  files: Array<{ path: string; content: string }>
  diff: string | null
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_at: string | null
  review_note: string | null
}

interface GitStatus {
  branch: string
  status: string
  aheadBy: number
  mounted: boolean
}

interface Commit {
  hash: string
  message: string
  author: string
  when: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TECH_AGENTS = [
  { id: 'dev-lead',     name: 'Dev',   role: 'Lead Dev',  color: '#60A0E0', emoji: '💻' },
  { id: 'raj-backend',  name: 'Raj',   role: 'Backend',   color: '#818CF8', emoji: '🔧' },
  { id: 'mia-frontend', name: 'Mia',   role: 'Frontend',  color: '#F472B6', emoji: '🎨' },
  { id: 'quinn-qa',     name: 'Quinn', role: 'QA',        color: '#34D399', emoji: '🧪' },
  { id: 'diana-coo',    name: 'Diana', role: 'COO / PM',  color: '#94A3B8', emoji: '⚙️' },
]

const SETUP_SQL = `CREATE TABLE IF NOT EXISTS pending_changes (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id        text NOT NULL,
  agent_id          text NOT NULL,
  agent_name        text,
  branch_name       text NOT NULL,
  commit_message    text NOT NULL,
  files             jsonb NOT NULL DEFAULT '[]',
  diff              text,
  status            text NOT NULL DEFAULT 'pending',
  requested_at      timestamptz DEFAULT now(),
  reviewed_at       timestamptz,
  review_note       text
);
CREATE INDEX IF NOT EXISTS idx_pending_changes_project
  ON pending_changes (project_id, status, requested_at DESC);`

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function statusColor(s: string) {
  return s === 'approved' ? '#50C090' : s === 'rejected' ? '#E94560' : '#F59E0B'
}

// Extract ```proposal ... ``` block from agent response text
function extractProposal(text: string): ProposalData | null {
  const match = text.match(/```proposal\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim()) as ProposalData
  } catch {
    return null
  }
}

// Render markdown-ish text: code blocks, inline code, bold
function renderContent(text: string) {
  const parts: React.ReactNode[] = []
  // Split on code fence blocks first
  const blocks = text.split(/(```[\s\S]*?```)/g)
  blocks.forEach((block, i) => {
    if (block.startsWith('```')) {
      const inner = block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')
      const lang  = block.match(/^```(\w+)/)?.[1] ?? ''
      // Don't render proposal blocks as visible code — they're extracted separately
      if (lang === 'proposal') return
      parts.push(
        <pre key={i} style={{
          background: '#0D0D1A', borderRadius: '6px', padding: '12px',
          fontSize: '11px', overflowX: 'auto', margin: '8px 0',
          fontFamily: 'var(--font-dm-mono)', lineHeight: 1.55,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>{inner}</pre>
      )
    } else {
      // Inline: bold, inline code
      const inlineParts = block.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
      parts.push(
        <span key={i}>
          {inlineParts.map((p, j) => {
            if (p.startsWith('`') && p.endsWith('`'))
              return <code key={j} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '3px' }}>{p.slice(1, -1)}</code>
            if (p.startsWith('**') && p.endsWith('**'))
              return <strong key={j}>{p.slice(2, -2)}</strong>
            return <span key={j} style={{ whiteSpace: 'pre-wrap' }}>{p}</span>
          })}
        </span>
      )
    }
  })
  return parts
}

// ── ProposeModal ──────────────────────────────────────────────────────────────
function ProposeModal({
  proposal, agentId, agentName, projectId, onClose, onProposed,
}: {
  proposal: ProposalData
  agentId: string
  agentName: string
  projectId: string
  onClose: () => void
  onProposed: () => void
}) {
  const [commitMsg, setCommitMsg] = useState(proposal.commitMessage)
  const [branch, setBranch]       = useState(proposal.branchName)
  const [loading, setLoading]     = useState(false)
  const [err, setErr]             = useState('')

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch('/api/codebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'propose',
          project: projectId,
          agentId,
          agentName,
          branchName: branch,
          commitMessage: commitMsg,
          files: proposal.files,
        }),
      })
      const data = await res.json()
      if (data.ok) { onProposed(); onClose() }
      else setErr(data.error ?? 'Failed to propose change')
    } catch {
      setErr('Network error')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--border)', padding: '20px', width: '100%', maxWidth: '520px' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '16px' }}>📋 Stage Change for Review</div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: 'var(--mu)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.08em' }}>COMMIT MESSAGE</label>
          <input value={commitMsg} onChange={e => setCommitMsg(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--color-bg)', color: 'var(--fg)', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: 'var(--mu)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.08em' }}>BRANCH NAME</label>
          <input value={branch} onChange={e => setBranch(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--color-bg)', color: 'var(--fg)', fontSize: '13px', fontFamily: 'var(--font-dm-mono)', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--mu)', marginBottom: '6px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.08em' }}>
            FILES ({proposal.files.length})
          </div>
          {proposal.files.map((f, i) => (
            <div key={i} style={{ fontSize: '12px', padding: '3px 8px', background: 'var(--color-bg)', borderRadius: '4px', marginBottom: '3px', fontFamily: 'var(--font-dm-mono)', color: '#50C090' }}>
              {f.path}
            </div>
          ))}
        </div>

        {err && <div style={{ color: '#E94560', fontSize: '12px', marginBottom: '10px' }}>{err}</div>}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--mu)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ padding: '8px 18px', borderRadius: '4px', border: 'none', background: '#50C090', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Staging…' : 'Stage for Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ChatBubble ────────────────────────────────────────────────────────────────
function ChatBubble({ msg, projectId, onProposed }: { msg: ChatMessage; projectId: string; onProposed: () => void }) {
  const [proposalModal, setProposalModal] = useState<ProposalData | null>(null)
  const proposal = msg.role === 'agent' ? extractProposal(msg.content) : null

  return (
    <>
      {proposalModal && (
        <ProposeModal
          proposal={proposalModal}
          agentId={msg.agentId ?? 'dev-lead'}
          agentName={msg.agentName ?? 'Agent'}
          projectId={projectId}
          onClose={() => setProposalModal(null)}
          onProposed={onProposed}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
        {msg.role === 'agent' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '2px' }}>
            <span style={{ fontSize: '13px' }}>{msg.emoji ?? '🤖'}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: msg.color ?? 'var(--mu)' }}>{msg.agentName}</span>
            <span style={{ fontSize: '10px', color: 'var(--mu)' }}>{msg.agentRole}</span>
          </div>
        )}
        <div style={{
          maxWidth: '85%', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', lineHeight: 1.6,
          background: msg.role === 'user' ? '#60A0E033' : 'var(--color-surface)',
          border: msg.role === 'user' ? '1px solid #60A0E066' : `1px solid ${msg.color ? `${msg.color}33` : 'var(--border)'}`,
          borderLeft: msg.role === 'agent' ? `3px solid ${msg.color ?? 'var(--border)'}` : undefined,
        }}>
          {renderContent(msg.content)}
        </div>
        {/* Propose button if agent included a proposal block */}
        {proposal && (
          <button
            onClick={() => setProposalModal(proposal)}
            style={{ marginLeft: '2px', padding: '5px 12px', borderRadius: '4px', border: '1px solid #50C09066', background: '#50C09015', color: '#50C090', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-mono)' }}
          >
            📋 Stage this change for review →
          </button>
        )}
      </div>
    </>
  )
}

// ── ChangeCard ────────────────────────────────────────────────────────────────
function ChangeCard({ change, onApprove, onReject }: {
  change: PendingChange
  onApprove: (id: string) => void
  onReject: (id: string, note: string) => void
}) {
  const [expanded, setExpanded]     = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [note, setNote]             = useState('')

  return (
    <div style={{ borderRadius: '6px', border: `1px solid var(--border)`, borderLeft: `3px solid ${statusColor(change.status)}`, backgroundColor: 'var(--color-surface)', overflow: 'hidden' }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>{change.commit_message}</span>
            <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '10px', background: `${statusColor(change.status)}22`, color: statusColor(change.status), fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{change.status}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--mu)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>🤖 {change.agent_name}</span>
            <span>⬡ {change.branch_name}</span>
            <span>📄 {change.files?.length ?? 0} file{(change.files?.length ?? 0) !== 1 ? 's' : ''}</span>
            <span>🕐 {timeAgo(change.requested_at)}</span>
          </div>
          {change.review_note && <div style={{ marginTop: '4px', fontSize: '11px', color: '#E94560' }}>✗ {change.review_note}</div>}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--mu)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--mu)', marginBottom: '6px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.08em' }}>FILES</div>
            {(change.files ?? []).map((f, i) => <div key={i} style={{ fontSize: '12px', padding: '3px 8px', background: 'var(--color-bg)', borderRadius: '4px', marginBottom: '3px', fontFamily: 'var(--font-dm-mono)', color: '#50C090' }}>{f.path}</div>)}
          </div>
          {change.diff && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--mu)', marginBottom: '6px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.08em' }}>DIFF</div>
              <pre style={{ fontSize: '11px', padding: '10px', background: 'var(--color-bg)', borderRadius: '4px', overflowX: 'auto', maxHeight: '260px', overflowY: 'auto', lineHeight: 1.5, fontFamily: 'var(--font-dm-mono)', margin: 0 }}>
                {change.diff.split('\n').slice(0, 80).map((line, i) => (
                  <span key={i} style={{ display: 'block', color: line.startsWith('+') ? '#50C090' : line.startsWith('-') ? '#E94560' : line.startsWith('@@') ? '#60A0E0' : 'inherit' }}>{line}</span>
                ))}
              </pre>
            </div>
          )}
          {change.status === 'pending' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <button onClick={() => onApprove(change.id)} style={{ padding: '7px 18px', borderRadius: '4px', border: 'none', background: '#50C090', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✓ Approve &amp; Push</button>
              <button onClick={() => setShowReject(r => !r)} style={{ padding: '7px 18px', borderRadius: '4px', border: '1px solid #E94560', background: 'transparent', color: '#E94560', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✗ Reject</button>
              {showReject && (
                <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '220px' }}>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason (optional)" style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--color-bg)', color: 'var(--fg)', fontSize: '12px' }} />
                  <button onClick={() => onReject(change.id, note)} style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', background: '#E9456022', color: '#E94560', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}>Confirm</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TechnicalPage() {
  const [selectedProjectId, setSelectedProjectId] = useState(PROJECTS[0].id)
  const [activeTab, setActiveTab] = useState<'chat' | 'changes' | 'status' | 'log' | 'setup'>('chat')

  // Chat state
  const [messages, setMessages]           = useState<ChatMessage[]>([])
  const [input, setInput]                 = useState('')
  const [streaming, setStreaming]         = useState(false)
  const [routingAgent, setRoutingAgent]   = useState<string | null>(null)
  const chatEndRef                        = useRef<HTMLDivElement>(null)

  // Other tabs state
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null)
  const [commits, setCommits]     = useState<Commit[]>([])
  const [changes, setChanges]     = useState<PendingChange[]>([])
  const [loading, setLoading]     = useState(false)
  const [toast, setToast]         = useState('')

  const project = PROJECTS.find(p => p.id === selectedProjectId)!

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming])

  const fetchChanges = useCallback(async () => {
    const res = await fetch(`/api/codebase?action=pending&project=${selectedProjectId}`)
    const data = await res.json()
    setChanges(data.changes ?? [])
  }, [selectedProjectId])

  const fetchStatus = useCallback(async () => {
    if (!project.localPath) return
    setLoading(true)
    const res = await fetch(`/api/codebase?action=status&project=${selectedProjectId}`)
    setGitStatus(await res.json())
    setLoading(false)
  }, [selectedProjectId, project.localPath])

  const fetchLog = useCallback(async () => {
    if (!project.localPath) return
    setLoading(true)
    const res = await fetch(`/api/codebase?action=log&project=${selectedProjectId}&count=15`)
    const data = await res.json()
    setCommits(data.commits ?? [])
    setLoading(false)
  }, [selectedProjectId, project.localPath])

  useEffect(() => { fetchChanges() }, [fetchChanges])
  useEffect(() => {
    if (activeTab === 'status') fetchStatus()
    if (activeTab === 'log') fetchLog()
    if (activeTab === 'changes') fetchChanges()
  }, [activeTab, fetchStatus, fetchLog, fetchChanges])

  // ── Send message to tech team ───────────────────────────────────────────────
  async function sendMessage() {
    const msg = input.trim()
    if (!msg || streaming) return
    setInput('')
    setStreaming(true)
    setRoutingAgent(null)

    const userMsg: ChatMessage = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])

    // Build history for context (last 6 turns)
    const history = messages.slice(-6).map(m => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }))

    let agentMsg: ChatMessage = { role: 'agent', content: '' }
    setMessages(prev => [...prev, agentMsg])

    try {
      const res = await fetch('/api/tech-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          projectId: selectedProjectId,
          projectName: project.name,
          projectStack: project.techStack.join(', '),
          history,
        }),
      })

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let   buf     = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6)
          if (raw === '[DONE]') break
          try {
            const ev = JSON.parse(raw)
            if (ev.type === 'agent') {
              agentMsg = {
                ...agentMsg,
                agentId:   ev.agentId,
                agentName: ev.agentName,
                agentRole: ev.agentRole,
                color:     ev.color,
                emoji:     ev.emoji,
              }
              setRoutingAgent(`${ev.emoji} Routing to ${ev.agentName} (${ev.agentRole})…`)
              setMessages(prev => [...prev.slice(0, -1), agentMsg])
            } else if (ev.type === 'text') {
              agentMsg = { ...agentMsg, content: agentMsg.content + ev.content }
              setMessages(prev => [...prev.slice(0, -1), agentMsg])
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Connection error'
      setMessages(prev => [...prev.slice(0, -1), { ...agentMsg, content: `⚠ Error: ${errMsg}` }])
    }

    setStreaming(false)
    setRoutingAgent(null)
  }

  async function handleApprove(id: string) {
    const res  = await fetch('/api/codebase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve', id }) })
    const data = await res.json()
    if (data.ok) { showToast(`✓ Pushed to ${data.branch}`); fetchChanges() }
    else showToast(`✗ ${data.error}`)
  }

  async function handleReject(id: string, note: string) {
    const res  = await fetch('/api/codebase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', id, note }) })
    const data = await res.json()
    if (data.ok) { showToast('Rejected.'); fetchChanges() }
    else showToast(`✗ ${data.error}`)
  }

  const pendingCount = changes.filter(c => c.status === 'pending').length

  const TABS = [
    { id: 'chat'    as const, label: 'TEAM CHAT' },
    { id: 'changes' as const, label: `REVIEW${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { id: 'status'  as const, label: 'GIT STATUS' },
    { id: 'log'     as const, label: 'COMMITS' },
    { id: 'setup'   as const, label: 'SETUP' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, padding: '10px 18px', borderRadius: '6px', background: toast.startsWith('✓') ? '#50C090' : '#E94560', color: '#000', fontWeight: 700, fontSize: '13px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Header + project pills */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '2px' }}>Code Hub</h1>
          <p style={{ fontSize: '12px', color: 'var(--mu)' }}>Talk to the technical team — changes queue here for your approval before anything touches git</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {PROJECTS.map(p => (
            <button key={p.id} onClick={() => setSelectedProjectId(p.id)} style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${selectedProjectId === p.id ? p.color : 'var(--border)'}`, background: selectedProjectId === p.id ? `${p.color}15` : 'transparent', color: selectedProjectId === p.id ? p.color : 'var(--mu)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {p.name}
              {p.localPath ? '' : ' ⚠'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '8px 14px', fontSize: '11px', border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font-dm-mono)', color: activeTab === t.id ? 'var(--fg)' : 'var(--mu)', borderBottom: activeTab === t.id ? '2px solid var(--fg)' : '2px solid transparent', marginBottom: '-1px', letterSpacing: '0.05em' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TEAM CHAT ────────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Agent legend */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {TECH_AGENTS.map(a => (
              <Link key={a.id} href={`/agents/${a.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--color-surface)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '12px' }}>{a.emoji}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: a.color }}>{a.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--mu)' }}>{a.role}</span>
                </div>
              </Link>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--mu)', alignSelf: 'center', fontFamily: 'var(--font-dm-mono)' }}>
              auto-routes to the right agent
            </div>
          </div>

          {/* Hint chips */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                'The checkout flow needs a loading state on the button',
                'Add rate limiting to the /api/auth endpoint',
                'There\'s a bug where logged-out users can still access /dashboard',
                'I want to add dark mode support',
                'Plan the feature for order tracking notifications',
              ].map(hint => (
                <button key={hint} onClick={() => setInput(hint)} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--color-surface)', color: 'var(--mu)', fontSize: '11px', cursor: 'pointer', textAlign: 'left' }}>
                  {hint}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: messages.length > 0 ? '320px' : '0' }}>
            {messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} projectId={selectedProjectId} onProposed={() => { fetchChanges(); showToast('✓ Change staged — check Review tab') }} />
            ))}
            {routingAgent && (
              <div style={{ fontSize: '12px', color: 'var(--mu)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#60A0E0', animation: 'pulse 1s infinite' }} />
                {routingAgent}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--color-surface)' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={`Tell the ${project.name} team what you need… (UI, bug fix, new feature, API change, test coverage…)`}
              rows={2}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)', fontSize: '13px', resize: 'none', lineHeight: 1.5 }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: streaming ? '#333' : '#60A0E0', color: streaming ? 'var(--mu)' : '#000', fontSize: '12px', fontWeight: 700, cursor: streaming ? 'not-allowed' : 'pointer', flexShrink: 0 }}
            >
              {streaming ? '…' : 'Send →'}
            </button>
          </div>

          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--mu)', fontSize: '11px', cursor: 'pointer' }}>
              Clear chat
            </button>
          )}
        </div>
      )}

      {/* ── REVIEW ───────────────────────────────────────────────────────── */}
      {activeTab === 'changes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
            {[{ l: 'PENDING', v: changes.filter(c=>c.status==='pending').length, c: '#F59E0B' }, { l: 'APPROVED', v: changes.filter(c=>c.status==='approved').length, c: '#50C090' }, { l: 'REJECTED', v: changes.filter(c=>c.status==='rejected').length, c: '#E94560' }].map(s => (
              <div key={s.l} style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: `1px solid ${s.c}33`, background: 'var(--color-surface)', borderLeft: `3px solid ${s.c}` }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: '10px', color: 'var(--mu)', fontFamily: 'var(--font-dm-mono)' }}>{s.l}</div>
              </div>
            ))}
            <button onClick={fetchChanges} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--color-bg)', color: 'var(--mu)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-dm-mono)', alignSelf: 'center' }}>↺</button>
          </div>
          {changes.length === 0
            ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--mu)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '6px' }}>No staged changes for {project.name} yet.<br/><span style={{ fontSize: '11px' }}>Chat with the team and click &quot;Stage this change&quot; to queue a proposal.</span></div>
            : changes.map(c => <ChangeCard key={c.id} change={c} onApprove={handleApprove} onReject={handleReject} />)
          }
        </div>
      )}

      {/* ── GIT STATUS ───────────────────────────────────────────────────── */}
      {activeTab === 'status' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!project.localPath
            ? <div style={{ padding: '16px', color: '#F59E0B', fontSize: '13px', border: '1px solid #F59E0B33', borderRadius: '6px', background: '#F59E0B08' }}>⚠ {project.name} not mounted — set <code style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px' }}>{project.id.toUpperCase()}_PATH</code> in .env.local</div>
            : loading ? <div style={{ color: 'var(--mu)', fontSize: '13px' }}>Loading…</div>
            : gitStatus ? (
              <>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--color-surface)', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--mu)', marginBottom: '4px', fontFamily: 'var(--font-dm-mono)' }}>BRANCH</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-dm-mono)' }}>⬡ {gitStatus.branch}</div>
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--color-surface)', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--mu)', marginBottom: '4px', fontFamily: 'var(--font-dm-mono)' }}>AHEAD</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{gitStatus.aheadBy} commits</div>
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--color-bg)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--mu)', marginBottom: '6px', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.1em' }}>WORKING TREE</div>
                  {gitStatus.status ? <pre style={{ fontSize: '12px', fontFamily: 'var(--font-dm-mono)', margin: 0 }}>{gitStatus.status}</pre> : <span style={{ fontSize: '12px', color: '#50C090' }}>✓ Clean</span>}
                </div>
              </>
            ) : null
          }
        </div>
      )}

      {/* ── COMMITS ──────────────────────────────────────────────────────── */}
      {activeTab === 'log' && (
        <div>
          {!project.localPath
            ? <div style={{ padding: '16px', color: '#F59E0B', fontSize: '13px', border: '1px solid #F59E0B33', borderRadius: '6px', background: '#F59E0B08' }}>⚠ {project.name} not mounted</div>
            : loading ? <div style={{ color: 'var(--mu)', fontSize: '13px' }}>Loading…</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {commits.length === 0
                  ? <div style={{ color: 'var(--mu)', fontSize: '13px' }}>No commits found.</div>
                  : commits.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--color-surface)' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: '#60A0E0', flexShrink: 0 }}>{c.hash}</span>
                      <span style={{ fontSize: '13px', flex: 1 }}>{c.message}</span>
                      <span style={{ fontSize: '11px', color: 'var(--mu)', flexShrink: 0 }}>{c.author}</span>
                      <span style={{ fontSize: '11px', color: 'var(--mu)', flexShrink: 0 }}>{c.when}</span>
                    </div>
                  ))
                }
              </div>
          }
        </div>
      )}

      {/* ── SETUP ────────────────────────────────────────────────────────── */}
      {activeTab === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '14px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--color-surface)' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>1. Mount your project repos</div>
            <pre style={{ fontSize: '11px', padding: '10px', background: 'var(--color-bg)', borderRadius: '4px', fontFamily: 'var(--font-dm-mono)', lineHeight: 1.5, margin: 0 }}>{`# .env.local\nNOVIZIO_PATH=/Users/stark/code/novizio\nHOURBOUR_PATH=/Users/stark/code/hourbour`}</pre>
            {PROJECTS.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                <code style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: '#50C090', minWidth: '160px' }}>{p.id.toUpperCase()}_PATH</code>
                <span style={{ fontSize: '12px', color: p.localPath ? '#50C090' : 'var(--mu)' }}>{p.localPath ? `✓ ${p.localPath}` : 'not set'}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--color-surface)' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>2. Create Supabase table</div>
            <div style={{ fontSize: '12px', color: 'var(--mu)', marginBottom: '10px' }}>Run once in your Supabase SQL editor:</div>
            <pre style={{ fontSize: '11px', padding: '10px', background: 'var(--color-bg)', borderRadius: '4px', fontFamily: 'var(--font-dm-mono)', lineHeight: 1.55, margin: 0, overflowX: 'auto' }}>{SETUP_SQL}</pre>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--color-surface)' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>3. How it works</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                ['Chat', 'Describe what you need in plain English — any change, bug, feature, or UI update'],
                ['Auto-route', 'YVON picks the right agent: Mia for UI, Raj for backend, Quinn for bugs, Dev for features…'],
                ['Propose', 'When an agent produces working code, click "Stage this change" to queue it'],
                ['Review', 'The Review tab shows every queued change with a diff before anything touches your repo'],
                ['Push', 'Click Approve → YVON creates the branch, commits the files, and pushes to origin'],
              ].map(([title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#60A0E0', minWidth: '64px', fontFamily: 'var(--font-dm-mono)' }}>{title}</span>
                  <span style={{ fontSize: '12px', color: 'var(--mu)', lineHeight: 1.5 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
