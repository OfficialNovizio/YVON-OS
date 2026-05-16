'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { AgentId, AgentRunStatus, WarRoomEvent } from '@/lib/types'
import { getActiveVentureSlugClient } from '@/lib/venture-context'

// ── Glass variant (G3 Obsidian for outer container) ──────────────────────────
const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = 'rgba(241,245,251,0.75)', I3d = 'rgba(241,245,251,0.45)';

// ─── Agent registry ────────────────────────────────────────────────────────────

const ROOM_ID = '__room__'

interface AgentMeta {
  id: string; name: string; role: string; icon: string; color: string; about: string; starters: string[]
}

const AGENTS: AgentMeta[] = [
  {
    id: 'kai-analyst', name: 'Kai', role: 'Analytics', icon: '📊', color: '#3B82F6',
    about: 'Data reads, trend velocity, competitor moves, anomalies.',
    starters: ["What's our biggest growth signal this week?", 'Which platform is underperforming vs benchmark?', 'Spot any anomalies in the last 7 days?'],
  },
  {
    id: 'nate-growth', name: 'Nate', role: 'Growth', icon: '🚀', color: '#22C55E',
    about: 'Funnel leaks, experiment design, activation ideas.',
    starters: ['Where is the funnel leaking right now?', 'Design a 14-day experiment for trial conversion', 'What should we kill immediately?'],
  },
  {
    id: 'rio-ads', name: 'Rio', role: 'Channels', icon: '📈', color: '#F97316',
    about: 'Channel performance, budget allocation, boost decisions.',
    starters: ['Which channel should we double down on this week?', 'Any posts ready to amplify right now?', 'What is our Instagram engagement gap?'],
  },
  {
    id: 'lena-brand', name: 'Lena', role: 'Content', icon: '✍️', color: '#14B8A6',
    about: 'Hooks, captions, copy — sounds human, not brand.',
    starters: ['Write a TikTok hook for our subscription audit feature', 'Rewrite our Instagram bio — make it sharper', 'Give me 3 caption options for a LinkedIn post'],
  },
  {
    id: 'atlas-art-director', name: 'Atlas', role: 'Creative', icon: '🎨', color: '#6366F1',
    about: 'Mood direction, visual systems, creative reviews.',
    starters: ['What visual direction fits the spending challenge campaign?', 'Write an image brief for Pixel — TikTok thumbnail series', 'Review our current Instagram aesthetic'],
  },
  {
    id: 'pixel-production', name: 'Pixel', role: 'Production', icon: '⚡', color: '#EC4899',
    about: 'Production-ready image prompts, batch plans, specs.',
    starters: ['Give me a Midjourney prompt for the hero visual', 'What resolution for a TikTok cover?', 'Plan an asset batch — 4 pieces'],
  },
]

const AGENT_MAP = Object.fromEntries(AGENTS.map(a => [a.id, a]))

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'agent' | 'synthesis' | 'plan-banner'
  agentId?: string
  content: string
  ts: string
  streaming?: boolean
  attachment?: { preview: string; mimeType: string }
  // plan-banner fields
  planAgents?: string[]
  planOrder?: string
}

type ConversationMap = Record<string, ChatMessage[]>
type SessionStatus = 'idle' | 'planning' | 'executing' | 'synthesizing' | 'complete' | 'error'

interface CockpitAgent {
  agentId: string
  status: AgentRunStatus
  task: string
  output?: string
}

interface HistoryEntry {
  id: string; prompt: string; agents: string[]; ts: string; elapsedMs: number
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function exportSession(messages: ChatMessage[], venture: string) {
  const lines: string[] = [`# Marketing Session — ${venture}`, `Exported: ${new Date().toLocaleString()}`, '---', '']
  for (const msg of messages) {
    if (msg.role === 'plan-banner') {
      lines.push(`> **Routing** → ${(msg.planAgents ?? []).map(id => AGENT_MAP[id]?.name ?? id).join(', ')} · ${msg.planOrder}`, '')
    } else if (msg.role === 'user') {
      lines.push(`**You:** ${msg.content}`, '')
    } else if (msg.role === 'synthesis') {
      lines.push(`**Marcus (CEO Synthesis):**`, msg.content, '')
    } else if (msg.role === 'agent') {
      const agent = AGENT_MAP[msg.agentId ?? '']
      if (agent) lines.push(`**${agent.name} (${agent.role}):**`, msg.content, '')
    }
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `marketing-${venture.toLowerCase()}-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Markdown renderer ─────────────────────────────────────────────────────────

function inlineFormat(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-white/10 rounded px-1 py-0.5 text-[11px] font-mono text-emerald-300">{part.slice(1, -1)}</code>
    return part
  })
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-[13px] font-semibold text-white mt-3 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-[14px] font-bold text-white mt-4 mb-1.5">{line.slice(3)}</h2>)
    } else if (/^[-*•] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•] /.test(lines[i])) { items.push(lines[i].replace(/^[-*•] /, '')); i++ }
      elements.push(
        <ul key={i} className="space-y-1 my-1.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="text-[13px] text-white/80 leading-relaxed flex gap-2">
              <span className="text-white/20 mt-1 flex-shrink-0 text-[7px]">●</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i++ }
      elements.push(
        <ol key={i} className="space-y-1 my-1.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="text-[13px] text-white/80 leading-relaxed flex gap-2">
              <span className="text-white/30 flex-shrink-0 min-w-[16px] text-[11px]">{j + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />)
    } else {
      elements.push(<p key={i} className="text-[13px] text-white/85 leading-relaxed">{inlineFormat(line)}</p>)
    }
    i++
  }
  return <div className="space-y-0.5">{elements}</div>
}

// ─── Message bubbles ───────────────────────────────────────────────────────────

function Bubble({
  msg,
  fallbackAgent,
  allMessages,
  venture,
}: {
  msg: ChatMessage
  fallbackAgent: AgentMeta
  allMessages: ChatMessage[]
  venture: string
}) {
  const [copied, setCopied] = useState(false)
  const isUser      = msg.role === 'user'
  const isSynthesis = msg.role === 'synthesis'
  const isPlan      = msg.role === 'plan-banner'
  const agent       = (msg.agentId ? AGENT_MAP[msg.agentId] : null) ?? fallbackAgent

  // ── Plan banner ──
  if (isPlan) {
    return (
      <div className="flex justify-center my-1">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#F97316]/[0.08] border border-[#F97316]/15 max-w-[85%]">
          <span className="material-symbols-outlined text-[12px] text-[#F97316]/60 flex-shrink-0">route</span>
          <span className="text-[11px] text-white/40">Routing to</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {(msg.planAgents ?? []).map(id => (
              <span key={id} className="text-[13px]" title={AGENT_MAP[id]?.name}>{AGENT_MAP[id]?.icon ?? '?'}</span>
            ))}
          </div>
          <span className="text-white/15">·</span>
          <span className="text-[10px] text-[#F97316]/50 uppercase tracking-wider">{msg.planOrder}</span>
        </div>
      </div>
    )
  }

  // ── Marcus synthesis ──
  if (isSynthesis) {
    const handleCopy = () => {
      navigator.clipboard.writeText(msg.content).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
    return (
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/25 flex items-center justify-center text-[15px] flex-shrink-0">
          👑
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-widest">Marcus</span>
            <span className="text-[9px] text-white/20 uppercase tracking-wider">CEO Synthesis</span>
            {msg.streaming && <span className="inline-block w-[3px] h-3 bg-white/40 animate-pulse rounded-full" />}
          </div>
          <div className="px-4 py-3.5 rounded-[16px] rounded-tl-[4px] bg-[#F59E0B]/[0.07] border border-[#F59E0B]/15">
            <SimpleMarkdown text={msg.content} />
          </div>
          {!msg.streaming && (
            <div className="flex items-center gap-3 mt-2 ml-0.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-white/55 transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => exportSession(allMessages, venture)}
                className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-white/55 transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">download</span>
                Export session
              </button>
              <span className="text-white/20 text-[10px]">{msg.ts}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Regular user / agent ──
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] mb-1"
          style={{ background: `${agent.color}18`, border: `1.5px solid ${agent.color}30` }}
        >
          {agent.icon}
        </div>
      )}
      <div className={`max-w-[72%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <span className="text-[10px] font-bold tracking-widest uppercase ml-0.5" style={{ color: agent.color }}>
            {agent.name}
          </span>
        )}
        {msg.attachment && (
          <div className="relative w-44 h-28 rounded-[12px] overflow-hidden border border-white/10 mb-1">
            <img src={msg.attachment.preview} alt="attachment" className="w-full h-full object-cover" />
            <div className="absolute bottom-1.5 right-1.5 bg-black/60 rounded px-1.5 py-0.5 text-[8px] text-white/60 uppercase">
              {msg.attachment.mimeType.split('/')[1]}
            </div>
          </div>
        )}
        <div className={`px-4 py-3 rounded-[16px] text-[13px] leading-relaxed ${
          isUser
            ? 'bg-[#0071e3] text-white rounded-br-[4px]'
            : 'bg-[#1e1e1e] border border-[#2e2e2e] text-[#c4c9d4] rounded-bl-[4px]'
        }`}>
          <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
        </div>
        <span className="text-[10px] text-white/20 mx-0.5">{msg.ts}</span>
      </div>
    </div>
  )
}

// ─── Cockpit Panel ─────────────────────────────────────────────────────────────

function CockpitPanel({
  sessionStatus,
  cockpitAgents,
  cockpitPlan,
  sessionAgentIds,
  venture,
  elapsedMs,
  lastElapsedMs,
}: {
  sessionStatus: SessionStatus
  cockpitAgents: CockpitAgent[]
  cockpitPlan: string
  sessionAgentIds: string[]
  venture: string
  elapsedMs: number
  lastElapsedMs: number
}) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  const isActive = sessionStatus === 'planning' || sessionStatus === 'executing' || sessionStatus === 'synthesizing'

  const statusConfig = {
    idle:         { dot: 'bg-white/20',   label: 'STANDBY',      pulse: false },
    planning:     { dot: 'bg-yellow-400', label: 'PLANNING',     pulse: true  },
    executing:    { dot: 'bg-[#F97316]',  label: 'EXECUTING',    pulse: true  },
    synthesizing: { dot: 'bg-purple-400', label: 'SYNTHESIZING', pulse: true  },
    complete:     { dot: 'bg-green-400',  label: 'COMPLETE',     pulse: false },
    error:        { dot: 'bg-red-400',    label: 'ERROR',        pulse: false },
  }[sessionStatus]

  const railWidth = {
    idle: '0%', planning: '15%', executing: '55%', synthesizing: '85%', complete: '100%', error: '100%',
  }[sessionStatus]

  const agentDot: Record<AgentRunStatus, string> = {
    idle:     'bg-white/15',
    working:  'bg-yellow-400 animate-pulse',
    done:     'bg-green-400',
    error:    'bg-red-400',
    retrying: 'bg-orange-400 animate-pulse',
  }

  return (
    <aside className="w-[230px] flex-shrink-0 border-l border-[#222] flex flex-col bg-[#0a0a0a]">

      {/* ── Status bar ── */}
      <div className="px-4 py-3 border-b border-[#1e1e1e] flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-bold tracking-[0.25em] text-white/15 uppercase">Cockpit</p>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${statusConfig.pulse ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] font-bold text-white/30 tracking-widest">{statusConfig.label}</span>
          </div>
        </div>
        {/* Progress rail */}
        <div className="h-[2px] bg-white/[0.05] rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: railWidth,
              background: sessionStatus === 'complete' ? '#4ade80' : sessionStatus === 'error' ? '#f87171' : 'linear-gradient(90deg, #F97316, #F59E0B)',
            }}
          />
        </div>
        {/* Elapsed timer */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-white/15">
            {isActive ? 'Elapsed' : sessionStatus === 'complete' ? 'Completed in' : ''}
          </span>
          <span className={`text-[11px] font-mono font-bold tabular-nums ${
            isActive ? 'text-[#F97316]/70' : sessionStatus === 'complete' ? 'text-green-400/70' : 'text-white/15'
          }`}>
            {isActive ? fmtElapsed(elapsedMs) : sessionStatus === 'complete' ? fmtElapsed(lastElapsedMs) : '—'}
          </span>
        </div>
      </div>

      {/* ── Mission block ── */}
      {cockpitPlan && (
        <div className="px-4 py-3 border-b border-[#1a1a1a] flex-shrink-0">
          <p className="text-[9px] font-bold tracking-[0.2em] text-[#F97316]/50 uppercase mb-1.5">Mission</p>
          <p className="text-[11px] text-white/50 leading-relaxed">{cockpitPlan}</p>
        </div>
      )}

      {/* ── Agent instruments ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
        <p className="text-[9px] font-bold tracking-[0.2em] text-white/15 uppercase mb-3">
          {isActive ? 'Active Agents' : 'Team Ready'}
        </p>

        {isActive && cockpitAgents.length > 0 ? (
          <div className="space-y-2">
            {cockpitAgents.map(ca => {
              const meta      = AGENT_MAP[ca.agentId]
              if (!meta) return null
              const isWorking  = ca.status === 'working' || ca.status === 'retrying'
              const isExpanded = expandedAgent === ca.agentId
              const hasOutput  = !!ca.output && ca.status === 'done'

              return (
                <div
                  key={ca.agentId}
                  className={`rounded-[10px] border transition-all duration-300 overflow-hidden ${
                    isWorking    ? 'bg-yellow-400/[0.05] border-yellow-400/15' :
                    ca.status === 'done'    ? 'bg-green-400/[0.04] border-green-400/12' :
                    ca.status === 'error'   ? 'bg-red-400/[0.05] border-red-400/12' :
                    'bg-white/[0.02] border-white/[0.04]'
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <span className="text-[14px] flex-shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white/80">{meta.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${agentDot[ca.status]}`} />
                          {hasOutput && (
                            <button
                              onClick={() => setExpandedAgent(isExpanded ? null : ca.agentId)}
                              className="text-white/20 hover:text-white/50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[9px] uppercase tracking-wide text-white/20">{meta.role}</p>
                    </div>
                  </div>

                  {/* Task brief (always shown) */}
                  {ca.task && (
                    <div className="px-3 pb-2">
                      <p className="text-[10px] text-white/30 leading-snug">{ca.task}</p>
                    </div>
                  )}

                  {/* Expanded full output */}
                  {isExpanded && ca.output && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/[0.05]">
                      <p className="text-[10px] text-white/40 leading-relaxed">{ca.output}</p>
                    </div>
                  )}

                  {/* Working animation bar */}
                  {isWorking && (
                    <div className="h-[2px] bg-white/[0.04]">
                      <div className="h-full bg-yellow-400/60 animate-pulse" style={{ width: '60%' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Standby grid */
          <div className="grid grid-cols-3 gap-1.5">
            {AGENTS.map(a => {
              const inSession = sessionAgentIds.includes(a.id)
              return (
                <div
                  key={a.id}
                  title={`${a.name} — ${a.role}`}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-[8px] bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className={`text-[15px] transition-opacity ${inSession ? 'opacity-100' : 'opacity-30'}`}>{a.icon}</span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    sessionStatus === 'complete' && inSession ? 'bg-green-400' : 'bg-emerald-500/40'
                  }`} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 border-t border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{venture}</span>
        </div>
        <p className="text-[9px] text-white/12">6 agents · all online</p>
      </div>
    </aside>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function TeamChatTab() {
  const [venture, setVenture]             = useState('Novizio')
  const [selected, setSelected]           = useState<string>(ROOM_ID)
  const [conversations, setConversations] = useState<ConversationMap>({})
  const [input, setInput]                 = useState('')
  const [attachment, setAttachment]       = useState<{ base64: string; mimeType: string; preview: string } | null>(null)
  const [historyOpen, setHistoryOpen]     = useState(false)
  const [sessionHistory, setSessionHistory] = useState<HistoryEntry[]>([])

  // Orchestration state (Room mode)
  const [sessionStatus, setSessionStatus]   = useState<SessionStatus>('idle')
  const [cockpitAgents, setCockpitAgents]   = useState<CockpitAgent[]>([])
  const [cockpitPlan, setCockpitPlan]       = useState('')
  const [sessionAgentIds, setSessionAgentIds] = useState<string[]>([])

  // Elapsed timer
  const [elapsedMs, setElapsedMs]         = useState(0)
  const [lastElapsedMs, setLastElapsedMs] = useState(0)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  // Individual agent mode
  const [thinking, setThinking]             = useState<string[]>([])
  const [streamingDirect, setStreamingDirect] = useState<{ agentId: string; content: string } | null>(null)

  const threadRef  = useRef<HTMLDivElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const abortRef   = useRef<AbortController | null>(null)
  const synthIdRef = useRef<string | null>(null)
  const synthText  = useRef('')
  const convHistory = useRef<{ user: string; marcus: string }[]>([])

  useEffect(() => {
    const slug = getActiveVentureSlugClient()
    if (slug) setVenture(slug === 'novizio' ? 'Novizio' : 'Hourbour')
  }, [])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [conversations, streamingDirect, thinking])

  // ── Elapsed timer logic ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStatus === 'planning') {
      startTimeRef.current = Date.now()
      setElapsedMs(0)
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 500)
    }
    if (sessionStatus === 'complete' || sessionStatus === 'error') {
      if (timerRef.current) clearInterval(timerRef.current)
      setLastElapsedMs(Date.now() - startTimeRef.current)
    }
    if (sessionStatus === 'idle') {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsedMs(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [sessionStatus])

  const isRoom = selected === ROOM_ID
  const agent  = AGENTS.find(a => a.id === selected) ?? AGENTS[0]
  const thread = conversations[selected] ?? []
  const isBusy = sessionStatus === 'planning' || sessionStatus === 'executing' || sessionStatus === 'synthesizing' || !!streamingDirect || thinking.length > 0

  const ts  = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const uid = () => crypto.randomUUID()

  // ── File attach ──────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setAttachment({ base64: dataUrl.split(',')[1], mimeType: file.type, preview: URL.createObjectURL(file) })
    }
    reader.readAsDataURL(file)
  }

  // ── Room send (orchestrated via /api/team-chat) ──────────────────────────────
  const sendRoom = useCallback(async (msg: string) => {
    const att = attachment
    setAttachment(null)
    setSessionStatus('planning')
    setCockpitAgents([])
    setCockpitPlan('')
    setSessionAgentIds([])
    synthIdRef.current = null
    synthText.current  = ''

    const userMsg: ChatMessage = {
      id: uid(), role: 'user', content: msg, ts: ts(),
      attachment: att ? { preview: att.preview, mimeType: att.mimeType } : undefined,
    }
    setConversations(prev => ({ ...prev, [ROOM_ID]: [...(prev[ROOM_ID] ?? []), userMsg] }))

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/team-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:             msg,
          ventureName:         venture,
          imageBase64:         att?.base64,
          imageMimeType:       att?.mimeType,
          conversationHistory: convHistory.current.slice(-2),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error(`${res.status}`)
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let planBannerId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith(':') || !line.startsWith('data:')) continue
          const raw = line.slice(5).trim()
          if (raw === '[DONE]') { setSessionStatus('complete'); continue }

          let evt: WarRoomEvent
          try { evt = JSON.parse(raw) } catch { continue }

          switch (evt.type) {
            case 'routing': {
              const ids = (evt.routing.specialists ?? []) as string[]
              setSessionAgentIds(ids)
              setCockpitAgents(ids.map(id => ({ agentId: id, status: 'idle', task: '' })))
              break
            }
            case 'plan': {
              if (evt.plan) {
                const agentIds = evt.plan.agents as string[]
                setCockpitPlan(evt.plan.objective ?? '')
                // Inject plan banner into thread
                if (!planBannerId) {
                  planBannerId = uid()
                  const banner: ChatMessage = {
                    id:         planBannerId,
                    role:       'plan-banner',
                    content:    '',
                    ts:         ts(),
                    planAgents: agentIds,
                    planOrder:  evt.plan.order,
                  }
                  setConversations(prev => ({ ...prev, [ROOM_ID]: [...(prev[ROOM_ID] ?? []), banner] }))
                }
              }
              setSessionStatus('executing')
              break
            }
            case 'agent_start': {
              const id = evt.agentId as string
              setCockpitAgents(prev => prev.map(ca => ca.agentId === id ? { ...ca, status: 'working', task: evt.task ?? '' } : ca))
              // Also add to cockpit if not present (direct routing)
              setCockpitAgents(prev => prev.some(ca => ca.agentId === id) ? prev : [...prev, { agentId: id, status: 'working', task: evt.task ?? '' }])
              break
            }
            case 'agent_complete': {
              const id = evt.agentId as string
              setCockpitAgents(prev => prev.map(ca => ca.agentId === id ? { ...ca, status: 'done', output: evt.previewText } : ca))
              break
            }
            case 'agent_error': {
              const id = evt.agentId as string
              setCockpitAgents(prev => prev.map(ca => ca.agentId === id ? { ...ca, status: 'error' } : ca))
              break
            }
            case 'retry': {
              const id = evt.agentId as string
              setCockpitAgents(prev => prev.map(ca => ca.agentId === id ? { ...ca, status: 'retrying' } : ca))
              break
            }
            case 'text': {
              setSessionStatus('synthesizing')
              if (!synthIdRef.current) {
                const sid = uid()
                synthIdRef.current = sid
                synthText.current  = evt.content
                setConversations(prev => ({
                  ...prev,
                  [ROOM_ID]: [...(prev[ROOM_ID] ?? []), { id: sid, role: 'synthesis', content: evt.content, ts: ts(), streaming: true }],
                }))
              } else {
                synthText.current += evt.content
                const sid  = synthIdRef.current
                const full = synthText.current
                setConversations(prev => {
                  const msgs = prev[ROOM_ID] ?? []
                  const idx  = msgs.findIndex(m => m.id === sid)
                  if (idx === -1) return prev
                  const updated = [...msgs]; updated[idx] = { ...updated[idx], content: full }
                  return { ...prev, [ROOM_ID]: updated }
                })
              }
              break
            }
            case 'plan_complete': {
              setSessionStatus('complete')
              const sid = synthIdRef.current
              if (sid) {
                setConversations(prev => {
                  const msgs = prev[ROOM_ID] ?? []
                  const idx  = msgs.findIndex(m => m.id === sid)
                  if (idx === -1) return prev
                  const updated = [...msgs]; updated[idx] = { ...updated[idx], streaming: false }
                  return { ...prev, [ROOM_ID]: updated }
                })
              }
              convHistory.current = [...convHistory.current, { user: msg, marcus: synthText.current }].slice(-4)
              const agentsUsed = cockpitAgents.map(c => c.agentId)
              setSessionHistory(prev => [{
                id:        uid(),
                prompt:    msg,
                agents:    agentsUsed,
                ts:        ts(),
                elapsedMs: Date.now() - startTimeRef.current,
              }, ...prev].slice(0, 8))
              break
            }
            case 'error': {
              setSessionStatus('error')
              setConversations(prev => ({
                ...prev,
                [ROOM_ID]: [...(prev[ROOM_ID] ?? []), { id: uid(), role: 'agent', agentId: 'kai-analyst', content: evt.message, ts: ts() }],
              }))
              break
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setSessionStatus(synthText.current ? 'complete' : 'error')
        const sid = synthIdRef.current
        if (sid) {
          setConversations(prev => {
            const msgs = prev[ROOM_ID] ?? []
            const idx  = msgs.findIndex(m => m.id === sid)
            if (idx === -1) return prev
            const updated = [...msgs]; updated[idx] = { ...updated[idx], streaming: false }
            return { ...prev, [ROOM_ID]: updated }
          })
        }
      }
    }
  }, [attachment, venture, cockpitAgents])

  // ── Direct agent send ────────────────────────────────────────────────────────
  const sendDirect = useCallback(async (msg: string) => {
    const att = attachment
    setAttachment(null)
    setStreamingDirect({ agentId: selected, content: '' })
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/growth-sprint', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phase: 'message', venture, message: msg, agentId: selected }),
        signal:  abortRef.current.signal,
      })
      if (!res.ok || !res.body) { setStreamingDirect(null); return }

      const reader = res.body.getReader()
      const dec    = new TextDecoder()
      let buf = '', full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          try {
            const ev = JSON.parse(line.slice(5).trim()) as Record<string, unknown>
            if (ev.type === 'stream_chunk') { full += ev.content as string; setStreamingDirect({ agentId: selected, content: full }) }
            if (ev.type === 'agent_message') full = ev.content as string
          } catch { /* skip */ }
        }
      }

      setConversations(prev => ({
        ...prev,
        [selected]: [...(prev[selected] ?? []), { id: uid(), role: 'agent', agentId: selected, content: full, ts: ts() }],
      }))
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setConversations(prev => ({
          ...prev,
          [selected]: [...(prev[selected] ?? []), { id: uid(), role: 'agent', agentId: selected, content: 'Something went wrong. Try again.', ts: ts() }],
        }))
      }
    } finally {
      setStreamingDirect(null)
    }
  }, [attachment, selected, venture])

  // ── Unified send ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isBusy) return
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    if (!isRoom) {
      const userMsg: ChatMessage = { id: uid(), role: 'user', content: msg, ts: ts() }
      setConversations(prev => ({ ...prev, [selected]: [...(prev[selected] ?? []), userMsg] }))
    }

    if (isRoom) await sendRoom(msg)
    else        await sendDirect(msg)
  }, [input, isBusy, isRoom, selected, sendRoom, sendDirect])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() }
  }

  const lastPreview = (id: string) => {
    const c = conversations[id]; if (!c || c.length === 0) return null
    // skip plan-banners for preview
    for (let i = c.length - 1; i >= 0; i--) {
      if (c[i].role !== 'plan-banner') return c[i]
    }
    return null
  }

  return (
    <div style={{ ...G3, height: '720px', padding: 0 }} className="flex overflow-hidden">

      {/* ── LEFT: agent roster + history ─────────────────────────────────────── */}
      <div className="w-[240px] flex-shrink-0 border-r border-[#222] flex flex-col bg-[#0e0e0e]">
        <div className="px-4 py-3.5 border-b border-[#222]">
          <p className="text-[10px] font-black tracking-[0.3em] text-white/25 uppercase">Marketing Team</p>
          <p className="text-[11px] text-white/18 mt-0.5">6 agents · all online</p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Room */}
          <button
            onClick={() => setSelected(ROOM_ID)}
            className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-[#1e1e1e] relative ${
              selected === ROOM_ID ? 'bg-[#1a1a1a]' : 'hover:bg-[#161616]'
            }`}
          >
            {selected === ROOM_ID && <div className="absolute left-0 top-0 w-0.5 h-full bg-[#F97316] rounded-r" />}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#252525] border border-[#333] flex items-center justify-center text-[15px]">📣</div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0e0e0e]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white/90">Room</span>
                {sessionStatus !== 'idle' && sessionStatus !== 'complete' && (
                  <span className="text-[9px] font-mono text-[#F97316]/70">{fmtElapsed(elapsedMs)}</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">All Agents</p>
              {lastPreview(ROOM_ID) ? (
                <p className="text-[11px] text-white/30 truncate mt-0.5">
                  {lastPreview(ROOM_ID)!.role === 'synthesis' ? '👑 ' : lastPreview(ROOM_ID)!.role === 'user' ? 'You: ' : ''}
                  {lastPreview(ROOM_ID)!.content.slice(0, 32)}
                </p>
              ) : (
                <p className="text-[11px] text-white/18 mt-0.5 italic">Message all agents at once</p>
              )}
            </div>
          </button>

          {/* Individual agents */}
          {AGENTS.map(a => {
            const last     = lastPreview(a.id)
            const isActive = selected === a.id
            const isTyping = streamingDirect?.agentId === a.id
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-[#1a1a1a] relative ${
                  isActive ? 'bg-[#1a1a1a]' : 'hover:bg-[#161616]'
                }`}
              >
                {isActive && <div className="absolute left-0 top-0 w-0.5 h-full rounded-r" style={{ background: a.color }} />}
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[15px]"
                    style={{ background: `${a.color}14`, border: `1.5px solid ${a.color}28` }}>
                    {a.icon}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0e0e0e]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-white/85">{a.name}</span>
                    {last && <span className="text-[10px] text-white/18">{last.ts}</span>}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${a.color}70` }}>{a.role}</p>
                  {isTyping ? (
                    <p className="text-[11px] mt-0.5" style={{ color: a.color }}>typing…</p>
                  ) : last ? (
                    <p className="text-[11px] text-white/28 truncate mt-0.5">
                      {last.role === 'user' ? 'You: ' : ''}{last.content.slice(0, 32)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-white/15 mt-0.5 italic">No messages yet</p>
                  )}
                </div>
              </button>
            )
          })}

          {/* History accordion */}
          <div className="border-t border-[#1e1e1e] mt-1">
            <button
              onClick={() => setHistoryOpen(p => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#161616] transition-colors"
            >
              <span className="text-[9px] font-bold tracking-[0.25em] text-white/15 uppercase">
                History {sessionHistory.length > 0 && `(${sessionHistory.length})`}
              </span>
              <span className="text-white/15 text-[10px]">{historyOpen ? '▲' : '▼'}</span>
            </button>
            {historyOpen && sessionHistory.length > 0 && sessionHistory.map(h => (
              <button
                key={h.id}
                onClick={() => setSelected(ROOM_ID)}
                className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-[#161616] transition-colors"
              >
                <span className="w-1 h-1 rounded-full bg-white/12 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] text-white/30 truncate">{h.prompt.slice(0, 38)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {h.agents.slice(0, 3).map(id => (
                      <span key={id} className="text-[10px]">{AGENT_MAP[id]?.icon ?? '?'}</span>
                    ))}
                    <span className="text-[9px] text-white/15">{fmtElapsed(h.elapsedMs)}</span>
                    <span className="text-[9px] text-white/12 ml-auto">{h.ts}</span>
                  </div>
                </div>
              </button>
            ))}
            {historyOpen && sessionHistory.length === 0 && (
              <p className="text-[11px] text-white/15 italic text-center py-3">No sessions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── CENTER: chat thread ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-[#222] flex-shrink-0">
          {isRoom ? (
            <>
              <div className="w-10 h-10 rounded-full bg-[#252525] border border-[#333] flex items-center justify-center text-[17px] flex-shrink-0">📣</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white">Room</span>
                  <span className="text-[9px] font-black px-2 py-1 rounded-full border text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20 uppercase tracking-widest">All Agents</span>
                </div>
                <p className="text-[11px] text-white/28 truncate">Everyone responds — Kai · Nate · Rio · Lena · Atlas · Pixel</p>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {AGENTS.map(a => <span key={a.id} className="text-[13px]" title={a.name}>{a.icon}</span>)}
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[17px] flex-shrink-0"
                style={{ background: `${agent.color}14`, border: `1.5px solid ${agent.color}28` }}>
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white">{agent.name}</span>
                  <span className="text-[9px] font-black px-2 py-1 rounded-full border uppercase tracking-widest"
                    style={{ color: agent.color, background: `${agent.color}10`, borderColor: `${agent.color}25` }}>
                    {agent.role}
                  </span>
                </div>
                <p className="text-[11px] text-white/28 truncate">{agent.about}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Online
              </div>
            </>
          )}
        </div>

        {/* Thread */}
        <div ref={threadRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-hide">
          {thread.length === 0 && !isBusy && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-[26px]"
                style={isRoom ? { background: '#1e1e1e', border: '1px solid #2e2e2e' } : { background: `${agent.color}12`, border: `1.5px solid ${agent.color}25` }}>
                {isRoom ? '📣' : agent.icon}
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-white mb-1.5">
                  {isRoom ? 'Message the whole team' : `Talk to ${agent.name}`}
                </h3>
                <p className="text-[12px] text-white/32 max-w-xs leading-relaxed">
                  {isRoom ? 'One message, every angle. Kai reads the data, Nate the funnel, Rio the channel, Lena the copy, Atlas the creative — Marcus synthesizes.' : agent.about}
                </p>
              </div>
              <div className="space-y-2 w-full max-w-[340px]">
                <p className="text-[9px] font-bold tracking-[0.25em] text-white/18 uppercase mb-2">
                  {isRoom ? 'Try asking the room' : 'Try asking'}
                </p>
                {(isRoom
                  ? ["We're launching a spending challenge next week — what does each of you need?", "Instagram engagement dropped 18% — what's everyone's take?", 'What should our content focus be for the next 2 weeks?']
                  : agent.starters
                ).map(s => (
                  <button key={s} onClick={() => void sendMessage(s)}
                    className="w-full text-left px-4 py-2.5 bg-[#181818] border border-[#282828] rounded-[12px] text-[12px] text-white/48 hover:border-[#383838] hover:text-white/72 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {thread.map(msg => (
            <Bubble
              key={msg.id}
              msg={msg}
              fallbackAgent={agent}
              allMessages={thread}
              venture={venture}
            />
          ))}

          {/* Thinking indicators */}
          {isRoom && thinking.length > 0 && (
            <div className="space-y-2">
              {thinking.map(id => {
                const a = AGENT_MAP[id]; if (!a) return null
                return (
                  <div key={id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] flex-shrink-0"
                      style={{ background: `${a.color}18`, border: `1px solid ${a.color}30` }}>
                      {a.icon}
                    </div>
                    <div className="px-4 py-2.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded-[14px] rounded-tl-[4px]">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: a.color }}>{a.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Direct streaming */}
          {streamingDirect && !isRoom && (
            <div className="flex gap-3 items-end">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] flex-shrink-0 mb-1"
                style={{ background: `${agent.color}18`, border: `1.5px solid ${agent.color}30` }}>
                {agent.icon}
              </div>
              <div className="max-w-[72%]">
                <span className="text-[10px] font-bold tracking-widest uppercase block mb-1.5 ml-0.5" style={{ color: agent.color }}>{agent.name}</span>
                <div className="px-4 py-3 rounded-[16px] rounded-bl-[4px] bg-[#1e1e1e] border border-[#2e2e2e] text-[13px] text-white/75 leading-relaxed">
                  {streamingDirect.content ? (
                    <pre className="whitespace-pre-wrap font-sans">
                      {streamingDirect.content}
                      <span className="inline-block w-0.5 h-3.5 bg-white/50 animate-pulse ml-0.5 align-middle" />
                    </pre>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/35 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/35 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/35 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Input bar ─────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-[#222] px-4 pt-3 pb-4 space-y-2">
          {attachment && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                <img src={attachment.preview} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/45">Image attached</p>
                <p className="text-[9px] text-white/22">{attachment.mimeType}</p>
              </div>
              <button onClick={() => setAttachment(null)} className="text-white/20 hover:text-white/55 transition-colors">
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            </div>
          )}

          <div className="flex items-end gap-2.5">
            <button
              onClick={() => fileRef.current?.click()}
              title="Attach image"
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#1e1e1e] border border-[#2e2e2e] flex items-center justify-center text-white/22 hover:text-white/55 hover:border-[#3e3e3e] transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">attach_file</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
            />

            <div className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e] rounded-[16px] px-4 py-2.5 focus-within:border-[#3e3e3e] transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={isBusy}
                placeholder={isRoom ? 'Message all agents — everyone responds…' : `Message ${agent.name}…`}
                rows={1}
                style={{ minHeight: '24px', maxHeight: '108px' }}
                className="w-full bg-transparent text-[13px] text-white placeholder-white/18 focus:outline-none resize-none disabled:opacity-40 leading-relaxed"
                onInput={e => {
                  const el = e.currentTarget; el.style.height = 'auto'
                  el.style.height = `${Math.min(el.scrollHeight, 108)}px`
                }}
              />
            </div>

            <button
              onClick={() => void sendMessage()}
              disabled={(!input.trim() && !attachment) || isBusy}
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: isRoom ? '#F97316' : agent.color }}
            >
              {isBusy
                ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              }
            </button>
          </div>

          <p className="text-[9px] text-white/15 text-center">
            {isRoom
              ? 'Room · All agents respond simultaneously · Enter to send'
              : `${agent.name} · ${agent.role} · Enter to send`}
          </p>
        </div>
      </div>

      {/* ── RIGHT: cockpit panel ──────────────────────────────────────────────── */}
      <CockpitPanel
        sessionStatus={sessionStatus}
        cockpitAgents={cockpitAgents}
        cockpitPlan={cockpitPlan}
        sessionAgentIds={sessionAgentIds}
        venture={venture}
        elapsedMs={elapsedMs}
        lastElapsedMs={lastElapsedMs}
      />
    </div>
  )
}
