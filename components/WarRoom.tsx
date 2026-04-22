'use client'

import { useState, useRef, useEffect } from 'react'
import type { AgentConfig, RoutingResult } from '@/lib/types'
import { getAgent } from '@/lib/agents'
import RoutingChain from '@/components/RoutingChain'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  routing?: RoutingResult
}

interface Props {
  ventureId: string
  ventureName: string
}

export default function WarRoom({ ventureId, ventureName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [routing, setRouting] = useState<RoutingResult | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setStreaming(true)
    setRouting(null)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, ventureId, ventureName }),
      })

      if (!res.body) throw new Error('No stream body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data) as { type: string; content?: string; routing?: RoutingResult }
            if (parsed.type === 'routing' && parsed.routing) {
              setRouting(parsed.routing)
            } else if (parsed.type === 'text' && parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + parsed.content }
                    : m
                )
              )
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Error: ${msg}` } : m
        )
      )
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const routingSpecialists: AgentConfig[] = routing
    ? routing.specialists.map((id) => getAgent(id)).filter(Boolean) as AgentConfig[]
    : []

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '70vh' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
        {messages.length === 0 && (
          <p className="text-sm text-center mt-16" style={{ color: 'var(--color-muted)' }}>
            Address the whole team. Marcus synthesizes input from the right specialists automatically.
          </p>
        )}

        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1
          const showRouting = msg.role === 'assistant' && isLast && routing && routingSpecialists.length > 0

          return (
            <div key={msg.id} className="flex flex-col gap-2">
              {showRouting && <RoutingChain specialists={routingSpecialists} />}
              <div
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] px-4 py-3 rounded-md text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    backgroundColor: msg.role === 'user'
                      ? 'rgba(233,69,96,0.15)'
                      : 'var(--color-surface)',
                    border: msg.role === 'user'
                      ? '1px solid rgba(233,69,96,0.3)'
                      : '1px solid rgba(245,158,11,0.25)',
                    borderLeft: msg.role === 'assistant' ? '3px solid #F59E0B' : undefined,
                    color: 'var(--color-text)',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div className="text-xs font-medium mb-2" style={{ color: '#F59E0B' }}>
                      👑 Marcus — CEO
                    </div>
                  )}
                  {msg.content || (streaming && isLast ? <span className="animate-pulse">▋</span> : null)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex gap-3 pt-4 border-t"
        style={{ borderColor: 'rgba(15,52,96,0.4)' }}
      >
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message the ${ventureName} team… (Enter to send, Shift+Enter for new line)`}
          disabled={streaming}
          className="flex-1 resize-none px-4 py-3 rounded-md text-sm outline-none disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid rgba(15,52,96,0.6)',
            color: 'var(--color-text)',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || streaming}
          className="px-6 py-2 rounded-md text-sm font-semibold self-end transition-colors disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-red)', color: '#fff' }}
        >
          {streaming ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
