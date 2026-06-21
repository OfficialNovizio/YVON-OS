'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Wrench, User, Bot, ArrowRightLeft, AlertTriangle, Check } from 'lucide-react'
import type { AgentAssignment, ExpandedTask, QualityGate } from '@/lib/council-preflight'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToolCall {
  agent: string
  tool: string
  input: string
  result?: string
  collapsed: boolean
}

interface ChatMessage {
  id: number
  role: 'user' | 'agent' | 'system' | 'tool' | 'meta'
  content: string
  agent?: string
  agentColor?: string
  toolCalls?: ToolCall[]
  timestamp: number
}

interface SSEEvent {
  type: 'meta' | 'chunk' | 'tool' | 'agent_switch' | 'done' | 'error' | 'warning'
  data: any
}

// ─── Agent color map ──────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  'marcus-ceo': '#abc7ff',
  'diana-coo': '#5ee0ff',
  'dev-technical': '#3b82f6',
  'mia-technical': '#ec4899',
  'raj-technical': '#f97316',
  'quinn-technical': '#84cc16',
  'kai-marketing': '#c08bff',
  'lena-marketing': '#f472b6',
  'rio-marketing': '#facc15',
  'felix-finance': '#5fd0b4',
  'kahneman-psychology': '#ffb693',
  'depth-research': '#a78bfa',
  'synth-research': '#818cf8',
  'board-command': '#c084fc',
}

function agentColor(id: string): string {
  return AGENT_COLORS[id] || 'var(--ws-accent)'
}

function agentInitials(id: string): string {
  const parts = id.split('-')
  if (parts.length >= 2) {
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('')
  }
  return id.slice(0, 2).toUpperCase()
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatViewProps {
  venture: string
  onMetaReceived?: (meta: {
    expandedTask: ExpandedTask
    assignments: AgentAssignment[]
    qualityGate: QualityGate
    contextTokens: number
    fingerprintMatch: boolean
    warnings: string[]
  }) => void
  onDone?: (stats: { totalTokens: number; cost: number }) => void
  isMobile?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatView({ venture, onMetaReceived, onDone, isMobile }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [streamingAgent, setStreamingAgent] = useState('marcus-ceo')
  const [sessionTokens, setSessionTokens] = useState(0)
  const [sessionCost, setSessionCost] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)
    setStreamingText('')
    setStreamingAgent('marcus-ceo')

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const res = await fetch('/api/council/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venture, message: text }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'system',
          content: `Error: ${err.error || res.statusText}`,
          timestamp: Date.now(),
        }])
        setLoading(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let currentText = ''
      let currentAgentId = streamingAgent
      let toolCalls: ToolCall[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          if (jsonStr === '[DONE]') continue

          try {
            const event = JSON.parse(jsonStr)
            handleSSEEvent(event, {
              setMessages, currentText, setCurrentText: (t: string) => { currentText = t },
              currentAgentId, setCurrentAgentId: (id: string) => {
                currentAgentId = id
                setStreamingAgent(id)
              },
              toolCalls, setToolCalls: (tc: ToolCall[]) => { toolCalls = tc },
              setStreamingText,
              setSessionTokens,
              setSessionCost,
              onMetaReceived,
              onDone,
            })
          } catch {}
        }
      }

      // Flush remaining streaming text as message
      if (currentText.trim()) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'agent',
          content: currentText,
          agent: currentAgentId,
          agentColor: agentColor(currentAgentId),
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          timestamp: Date.now(),
        }])
      }

      setStreamingText('')
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'system',
          content: `Connection error: ${err.message}`,
          timestamp: Date.now(),
        }])
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [input, loading, venture, streamingAgent, onMetaReceived, onDone])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setLoading(false)
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="scroll-y flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-xs">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <Bot size={24} style={{ color: 'var(--ws-accent)' }} />
              </div>
              <p className="text-sm font-semibold text-on-surface mb-1">Advisory Council Active</p>
              <p className="text-[12px] text-on-surface-variant leading-relaxed">
                Marcus (CEO) and the council are ready. Type your request — the council expands, assigns, and executes. Use @agent-name to involve specialists.
              </p>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Streaming indicator */}
        {streamingText && (
          <div className="flex gap-3">
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-black/80"
              style={{ background: agentColor(streamingAgent) }}>
              {agentInitials(streamingAgent)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-semibold" style={{ color: agentColor(streamingAgent) }}>
                  {streamingAgent.split('-').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')}
                </span>
                <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: agentColor(streamingAgent) }} />
              </div>
              <p className="text-[13px] leading-relaxed text-on-surface whitespace-pre-wrap">
                {streamingText}
                <span className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom animate-pulse" style={{ background: 'var(--ws-accent)' }} />
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 focus-within:border-white/[0.15] transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? 'Council is working…' : 'Message the council… (use @agent to assign)'}
            className="flex-1 bg-transparent text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
            disabled={loading}
          />
          {loading ? (
            <button
              onClick={handleStop}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <AlertTriangle size={14} className="text-red-400" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
              style={{
                background: input.trim() ? 'var(--ws-accent)' : 'rgba(255,255,255,0.05)',
                color: input.trim() ? '#0a0a0a' : '#6b7280',
              }}
            >
              <Send size={14} />
            </button>
          )}
        </div>

        {/* Token counter */}
        {sessionTokens > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-on-surface-variant/60">
            <span>{sessionTokens.toLocaleString()} tokens</span>
            <span>·</span>
            <span>${sessionCost.toFixed(3)}</span>
            <span>·</span>
            <span>{venture}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-1.5">
          <p className="text-[11px] text-on-surface-variant">{msg.content}</p>
        </div>
      </div>
    )
  }

  if (msg.role === 'meta') {
    return (
      <div className="flex justify-center">
        <div className="rounded-lg px-3 py-1.5" style={{ background: 'var(--ws-accent-soft)', border: '1px solid var(--ws-glow)' }}>
          <p className="text-[11px] font-semibold" style={{ color: 'var(--ws-accent)' }}>{msg.content}</p>
        </div>
      </div>
    )
  }

  const isUser = msg.role === 'user'
  const color = msg.agentColor || 'var(--ws-accent)'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-black/80"
        style={{ background: isUser ? 'var(--ws-accent)' : color }}>
        {isUser ? 'Y' : agentInitials(msg.agent || 'marcus-ceo')}
      </div>

      <div className={`min-w-0 max-w-[85%] ${isUser ? 'items-end' : ''}`}>
        {/* Agent label */}
        {!isUser && msg.agent && (
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[11px] font-semibold" style={{ color }}>
              {msg.agent.split('-').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')}
            </span>
            <span className="text-[10px] text-on-surface-variant/50">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Message content */}
        <div className={`rounded-xl px-3.5 py-2.5 ${isUser
          ? 'rounded-tr-sm'
          : 'rounded-tl-sm'
        }`}
          style={isUser
            ? { background: 'var(--ws-accent-soft)', border: '1px solid var(--ws-glow)' }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
          }>
          <p className="text-[13px] leading-relaxed text-on-surface whitespace-pre-wrap">{msg.content}</p>

          {/* Tool calls */}
          {msg.toolCalls && msg.toolCalls.length > 0 && (
            <div className="mt-2 space-y-1">
              {msg.toolCalls.map((tc, i) => (
                <ToolCallBadge key={i} toolCall={tc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tool Call Badge ──────────────────────────────────────────────────────────

function ToolCallBadge({ toolCall: tc }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg bg-black/30 border border-white/[0.05] overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-white/[0.03] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Wrench size={11} style={{ color: 'var(--ws-accent)' }} />
        <span className="text-[10px] font-medium text-on-surface-variant">{tc.tool}</span>
        <span className="text-[10px] text-on-surface-variant/50 truncate flex-1">{tc.input.slice(0, 40)}</span>
        <span className="text-[10px] text-on-surface-variant/40">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <div className="border-t border-white/[0.04] px-2.5 py-1.5">
          <p className="text-[10px] text-on-surface-variant/60 mb-1">Input:</p>
          <pre className="text-[10px] text-on-surface-variant whitespace-pre-wrap font-mono mb-1">{tc.input}</pre>
          {tc.result && (
            <>
              <p className="text-[10px] text-on-surface-variant/60 mb-1">Result:</p>
              <pre className="text-[10px] text-on-surface-variant whitespace-pre-wrap font-mono">{tc.result.slice(0, 300)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SSE Event Handler ────────────────────────────────────────────────────────

interface SSEState {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  currentText: string
  setCurrentText: (t: string) => void
  currentAgentId: string
  setCurrentAgentId: (id: string) => void
  toolCalls: ToolCall[]
  setToolCalls: (tc: ToolCall[]) => void
  setStreamingText: (t: string) => void
  setSessionTokens: React.Dispatch<React.SetStateAction<number>>
  setSessionCost: React.Dispatch<React.SetStateAction<number>>
  onMetaReceived?: (meta: any) => void
  onDone?: (stats: any) => void
}

function handleSSEEvent(event: any, state: SSEState) {
  const {
    setMessages, currentText, setCurrentText,
    currentAgentId, setCurrentAgentId,
    toolCalls, setToolCalls,
    setStreamingText, setSessionTokens, setSessionCost,
    onMetaReceived, onDone,
  } = state

  switch (event.type || event.event) {
    case 'meta': {
      const d = event.data || event
      // Add meta message
      const agents = d.agents || d.assignments?.map((a: any) => a.name) || []
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'meta',
        content: `Council convened · ${agents.length} agents · ${d.contextTokens || 0} tokens injected · ${d.fingerprintMatch ? 'Context cached' : 'Context rebuilt'}`,
        timestamp: Date.now(),
      }])
      if (onMetaReceived) onMetaReceived(d)
      break
    }

    case 'chunk': {
      const text = event.data?.text || event.data || ''
      const newText = currentText + text
      setCurrentText(newText)
      setStreamingText(newText)
      break
    }

    case 'tool': {
      const d = event.data
      const tc: ToolCall = {
        agent: d.agent || currentAgentId,
        tool: d.tool || 'unknown',
        input: d.input || '',
        result: d.result,
        collapsed: true,
      }
      setToolCalls([...toolCalls, tc])
      break
    }

    case 'agent_switch': {
      const d = event.data
      // Flush current text as message from previous agent
      if (currentText.trim()) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'agent',
          content: currentText,
          agent: currentAgentId,
          agentColor: agentColor(currentAgentId),
          toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
          timestamp: Date.now(),
        }])
      }
      setCurrentText('')
      setStreamingText('')
      setCurrentAgentId(d.to || currentAgentId)
      setToolCalls([])
      break
    }

    case 'warning': {
      const d = event.data
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'system',
        content: `⚠️ ${d.warning || d.message || 'Warning'}`,
        timestamp: Date.now(),
      }])
      break
    }

    case 'done': {
      const d = event.data || event
      // Flush remaining text
      if (currentText.trim()) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'agent',
          content: currentText,
          agent: currentAgentId,
          agentColor: agentColor(currentAgentId),
          toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
          timestamp: Date.now(),
        }])
      }
      setCurrentText('')
      setStreamingText('')

      const totalTokens = d.totalTokens || d.sessionTokens || 0
      const cost = d.cost || d.sessionCost || 0
      setSessionTokens(totalTokens)
      setSessionCost(cost)

      if (onDone) onDone({ totalTokens, cost })

      // Add done message
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'system',
        content: `Done · ${totalTokens.toLocaleString()} tokens · $${cost.toFixed(4)} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: Date.now(),
      }])
      break
    }

    case 'error': {
      const d = event.data || event
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'system',
        content: `Error: ${d.error || d.message || 'Unknown error'}`,
        timestamp: Date.now(),
      }])
      break
    }
  }
}
