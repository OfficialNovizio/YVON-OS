'use client'

import { useState, useEffect, useRef } from 'react'
import { streamMessage } from '@/lib/claude-client'
import type { Message } from '@/lib/types'

interface AgentChatProps {
  agentName: string
  defaultModel: string
  defaultSystemPrompt: string
  quickPrompt?: string | null
  onQuickPromptUsed?: () => void
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[80%] rounded-md px-4 py-3 text-sm whitespace-pre-wrap"
        style={{
          backgroundColor: isUser
            ? 'rgba(233,69,96,0.15)'
            : 'var(--color-surface)',
          border: isUser
            ? '1px solid rgba(233,69,96,0.3)'
            : '1px solid rgba(15,52,96,0.5)',
          color: 'var(--color-text)',
          fontFamily: msg.content.includes('```') ? 'Courier New, monospace' : 'inherit',
        }}
      >
        {msg.content}
        {msg.role === 'assistant' && msg.content === '' && (
          <span className="inline-block w-2 h-4 ml-1 animate-pulse" style={{ backgroundColor: 'var(--color-red)' }} />
        )}
      </div>
    </div>
  )
}

export default function AgentChat({
  agentName,
  defaultModel,
  defaultSystemPrompt,
  quickPrompt,
  onQuickPromptUsed,
}: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fire quick prompt from skills panel
  useEffect(() => {
    if (quickPrompt) {
      sendMessage(quickPrompt)
      onQuickPromptUsed?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickPrompt])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(userText: string) {
    if (!userText.trim() || isStreaming) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString(),
    }

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsStreaming(true)

    let accumulated = ''

    await streamMessage({
      agentName,
      systemPrompt: defaultSystemPrompt,
      userMessage: userText.trim(),
      model: defaultModel,
      onChunk: (chunk) => {
        accumulated += chunk
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: accumulated }
          }
          return copy
        })
      },
      onComplete: () => {
        setIsStreaming(false)
      },
      onError: (err) => {
        setIsStreaming(false)
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: `Error: ${err.message}` }
          }
          return copy
        })
      },
    })
  }

  function clearChat() {
    setMessages([])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div
      className="flex flex-col h-full rounded-md overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid rgba(15,52,96,0.6)',
        minHeight: '500px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(15,52,96,0.5)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
          {agentName} · {defaultModel}
        </span>
        <button
          onClick={clearChat}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{ color: 'var(--color-muted)', border: '1px solid rgba(160,174,192,0.2)' }}
        >
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--color-muted)' }}>
            Start a conversation with {agentName}.
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t flex gap-3 items-end"
        style={{ borderColor: 'rgba(15,52,96,0.5)' }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          rows={2}
          disabled={isStreaming}
          className="flex-1 resize-none rounded px-3 py-2 text-sm outline-none disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-navy)',
            border: '1px solid rgba(15,52,96,0.8)',
            color: 'var(--color-text)',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-40"
          style={{
            backgroundColor: 'var(--color-red)',
            color: '#fff',
          }}
        >
          {isStreaming ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
