'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { AgentId, AgentRunStatus, WarRoomEvent, WarRoomPlanRecord } from '@/lib/types'
import { getActiveVentureSlugClient } from '@/lib/venture-context'

// ── Glass system ────────────────────────────────────────────────────────────────
const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = '#ffffff', I3d = 'rgba(241,245,251,0.85)';
const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

// ─── Agent meta ────────────────────────────────────────────────────────────────

const AGENT_META: Record<AgentId, { name: string; icon: string; color: string; role: string }> = {
  'marcus-ceo':         { name: 'Marcus',   icon: '👑', color: '#F59E0B', role: 'CEO' },
  'diana-coo':          { name: 'Diana',    icon: '⚙️', color: '#94A3B8', role: 'COO' },
  'dev-lead':           { name: 'Dev',      icon: '💻', color: '#06B6D4', role: 'Lead Dev' },
  'raj-backend':        { name: 'Raj',      icon: '🔧', color: '#8B5CF6', role: 'Backend' },
  'mia-frontend':       { name: 'Mia',      icon: '🎨', color: '#D946EF', role: 'Frontend' },
  'quinn-qa':           { name: 'Quinn',    icon: '🧪', color: '#10B981', role: 'QA' },
  'kai-analyst':        { name: 'Kai',      icon: '📊', color: '#3B82F6', role: 'Analyst' },
  'lena-brand':         { name: 'Lena',     icon: '✍️', color: '#14B8A6', role: 'Brand Voice' },
  'rio-ads':            { name: 'Rio',      icon: '📈', color: '#F97316', role: 'Ads' },
  'nate-growth':        { name: 'Nate',     icon: '🚀', color: '#22C55E', role: 'Growth' },
  'atlas-art-director': { name: 'Atlas',    icon: '🎨', color: '#6366F1', role: 'Art Director' },
  'pixel-production':   { name: 'Pixel',    icon: '⚡', color: '#8B5CF6', role: 'Production' },
  'felix-finance':      { name: 'Felix',    icon: '💰', color: '#10B981', role: 'Finance' },
  'daniel-kahneman':    { name: 'Kahneman', icon: '🧠', color: '#A78BFA', role: 'Psychologist' },
}

const ALL_AGENT_IDS = Object.keys(AGENT_META) as AgentId[]

const QUICK_PROMPTS = [
  { label: 'Weekly strategy brief', icon: 'insights',      prompt: 'Give me a weekly executive brief — what should we focus on this week across marketing, tech, and growth?' },
  { label: 'Growth bottlenecks',    icon: 'trending_up',   prompt: 'Analyze our current growth funnel and identify the top 2 bottlenecks blocking us from scaling faster.' },
  { label: 'Pre-launch checklist',  icon: 'rocket_launch', prompt: 'We are preparing for a launch — run a pre-launch check across tech, marketing, and operations. What is missing?' },
  { label: 'Review open PRs',       icon: 'merge',         prompt: 'Review our open GitHub PRs and issues — identify what needs attention most urgently and why.' },
]

// ─── Types ─────────────────────────────────────────────────────────────────────

type SessionStatus = 'idle' | 'planning' | 'executing' | 'synthesizing' | 'complete' | 'error'
type RepoStatus    = 'idle' | 'loading' | 'ready' | 'error' | 'no-repo'

type ThreadItem =
  | { id: string; kind: 'user';      text: string; attachment?: { preview: string; mimeType: string } }
  | { id: string; kind: 'plan';      objective: string; order: string; agents: AgentId[] }
  | { id: string; kind: 'agent';     agentId: AgentId; task: string; status: AgentRunStatus; output?: string; expanded: boolean }
  | { id: string; kind: 'synthesis'; text: string; streaming: boolean }
  | { id: string; kind: 'error';     message: string }

// ─── Pure helpers ──────────────────────────────────────────────────────────────

let _tid = 0
const mkId = () => String(++_tid)

function updateLastAgent(
  prev: ThreadItem[],
  agentId: AgentId,
  patch: Partial<Extract<ThreadItem, { kind: 'agent' }>>,
): ThreadItem[] {
  for (let i = prev.length - 1; i >= 0; i--) {
    const item = prev[i]
    if (item.kind === 'agent' && item.agentId === agentId) {
      return [...prev.slice(0, i), { ...item, ...patch }, ...prev.slice(i + 1)]
    }
  }
  return prev
}

// ─── Markdown renderer ─────────────────────────────────────────────────────────

function inlineFormat(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-white/10 rounded px-1 py-0.5 text-[12px] font-mono text-emerald-300">{part.slice(1, -1)}</code>
    return part
  })
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} className="bg-white/[0.05] border border-white/10 rounded-xl p-4 text-[12px] font-mono text-white/75 overflow-x-auto my-3 leading-relaxed">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-[14px] font-semibold text-white mt-4 mb-1.5">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-[16px] font-bold text-white mt-5 mb-2">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-[18px] font-bold text-white mt-5 mb-2">{line.slice(2)}</h1>)
    } else if (/^[-*•] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•] /, ''))
        i++
      }
      elements.push(
        <ul key={i} className="space-y-1.5 my-2 pl-1">
          {items.map((item, j) => (
            <li key={j} className="text-[14px] text-white/80 leading-relaxed flex gap-2.5">
              <span className="text-white/25 mt-1 flex-shrink-0 text-[8px]">●</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(
        <ol key={i} className="space-y-1.5 my-2 pl-1">
          {items.map((item, j) => (
            <li key={j} className="text-[14px] text-white/80 leading-relaxed flex gap-2.5">
              <span className="text-white/30 flex-shrink-0 min-w-[18px] text-[12px]">{j + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />)
    } else {
      elements.push(
        <p key={i} className="text-[14px] text-white/85 leading-relaxed">{inlineFormat(line)}</p>
      )
    }
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

// ─── Thread item components ────────────────────────────────────────────────────

function UserBubble({ item }: { item: Extract<ThreadItem, { kind: 'user' }> }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[68%]">
        {item.attachment && (
          <div className="mb-2 flex justify-end">
            <div className="relative w-44 h-32 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
              <img src={item.attachment.preview} alt="attachment" className="w-full h-full object-cover" />
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded" style={{ background: 'rgba(0,0,0,0.60)', color: I3c }}>
                {item.attachment.mimeType.split('/')[1]}
              </div>
            </div>
          </div>
        )}
        <div className="rounded-2xl rounded-tr-sm px-4 py-3" style={{ background: `${ACCENT}30`, border: `1px solid ${ACCENT}35` }}>
          <p className="text-[14px] leading-relaxed" style={{ color: I3c }}>{item.text}</p>
        </div>
      </div>
    </div>
  )
}

function PlanBanner({ item }: { item: Extract<ThreadItem, { kind: 'plan' }> }) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11px] max-w-[80%]" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}20` }}>
        <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 13, color: ACCENT }}>account_tree</span>
        <span className="truncate" style={{ color: I3c }}>{item.objective}</span>
        <span style={{ color: I3d }}>·</span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {item.agents.map(id => (
            <span key={id} className="text-sm" title={AGENT_META[id]?.name}>{AGENT_META[id]?.icon ?? '?'}</span>
          ))}
        </div>
        <span style={{ color: I3d }}>·</span>
        <span style={{ color: ACCENT, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontSize: 9 }} className="flex-shrink-0">{item.order}</span>
      </div>
    </div>
  )
}

function AgentCard({
  item,
  onToggle,
}: {
  item: Extract<ThreadItem, { kind: 'agent' }>
  onToggle: () => void
}) {
  const meta = AGENT_META[item.agentId]
  const isActive = item.status === 'working' || item.status === 'retrying'

  const dotCls: Record<AgentRunStatus, string> = {
    idle:     'bg-white/20',
    working:  'bg-yellow-400 animate-pulse',
    done:     'bg-green-400',
    error:    'bg-red-400',
    retrying: 'bg-orange-400 animate-pulse',
  }
  const statusLabel: Record<AgentRunStatus, string> = {
    idle:     'STANDBY',
    working:  'WORKING',
    done:     'DONE',
    error:    'ERROR',
    retrying: 'RETRYING',
  }

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[480px] rounded-xl transition-all duration-300" style={{
        background: 'rgba(241,245,251,0.04)',
        border: item.status === 'done' ? '1px solid rgba(52,211,153,0.20)' : isActive ? '1px solid rgba(250,204,21,0.25)' : item.status === 'error' ? '1px solid rgba(248,113,113,0.20)' : '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base transition-all" style={{
              background: isActive ? 'rgba(250,204,21,0.10)' : item.status === 'done' ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.05)',
            }}>
              {meta?.icon}
            </div>
            {isActive && (
              <span className="absolute inset-0 rounded-full animate-ping" style={{ border: '1px solid rgba(250,204,21,0.40)' }} />
            )}
            {item.status === 'done' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 flex items-center justify-center" style={{ border: '1px solid rgba(8,14,28,0.90)' }}>
                <span className="text-[6px] text-black font-bold">✓</span>
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[12px] font-semibold" style={{ color: I3c }}>{meta?.name}</p>
              <span className="text-[9px] uppercase tracking-wide" style={{ color: I3d }}>{meta?.role}</span>
            </div>
            {item.task && (
              <p className="text-[11px] mt-0.5 truncate" style={{ color: I3d }}>{item.task}</p>
            )}
          </div>

          {/* Status + expand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${dotCls[item.status]}`} />
              <span className="text-[9px] font-bold tracking-widest" style={{ color: I3d }}>{statusLabel[item.status]}</span>
            </div>
            {item.output && (
              <button
                onClick={onToggle}
                className="transition-colors"
                style={{ color: I3d, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  {item.expanded ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Expanded output */}
        {item.expanded && item.output && (
          <div className="px-3 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[12px] leading-relaxed mt-2" style={{ color: I3d }}>{item.output}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SynthesisBubble({
  item,
  onCopy,
  copied,
}: {
  item: Extract<ThreadItem, { kind: 'synthesis' }>
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="flex justify-start gap-3">
      {/* Crown avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
        <span className="text-sm">👑</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold" style={{ color: '#F59E0B' }}>Marcus</span>
          <span className="text-[10px]" style={{ color: I3d }}>CEO Synthesis</span>
          {item.streaming && (
            <span className="inline-block w-[3px] h-3.5 ml-0.5 animate-pulse rounded-full" style={{ background: I3c }} />
          )}
        </div>

        <div className="rounded-2xl rounded-tl-sm p-5" style={{ background: `rgba(241,245,251,0.04)`, border: '1px solid rgba(255,255,255,0.08)' }}>
          <SimpleMarkdown text={item.text} />
        </div>

        {!item.streaming && (
          <div className="flex items-center gap-3 mt-2 ml-1">
            <button
              onClick={onCopy}
              className="flex items-center gap-1.5 transition-colors"
              style={{ fontSize: 11, color: I3d, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{copied ? 'check' : 'content_copy'}</span>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorCard({ item }: { item: Extract<ThreadItem, { kind: 'error' }> }) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/[0.07] border border-red-500/15 text-[12px] text-red-400 max-w-lg">
        <span className="material-symbols-outlined text-[14px] flex-shrink-0">error</span>
        <span>{item.message}</span>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function WarRoomPage() {
  const [thread, setThread]               = useState<ThreadItem[]>([])
  const [agentRoster, setAgentRoster]     = useState<Partial<Record<AgentId, AgentRunStatus>>>({})
  const [sessionAgents, setSessionAgents] = useState<AgentId[]>([])
  const [input, setInput]                 = useState('')
  const [attachment, setAttachment]       = useState<{ base64: string; mimeType: string; preview: string } | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [venture, setVenture]             = useState('Novizio')
  const [ventureSlug, setVentureSlug]     = useState('')
  const [githubContext, setGithubContext] = useState('')
  const [repoStatus, setRepoStatus]       = useState<RepoStatus>('idle')
  const [repoLabel, setRepoLabel]         = useState('')
  const [history, setHistory]             = useState<WarRoomPlanRecord[]>([])
  const [historyOpen, setHistoryOpen]     = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [copiedId, setCopiedId]           = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<{ user: string; marcus: string }[]>([])

  const threadRef       = useRef<HTMLDivElement>(null)
  const fileInputRef    = useRef<HTMLInputElement>(null)
  const textareaRef     = useRef<HTMLTextAreaElement>(null)
  const abortRef        = useRef<AbortController | null>(null)
  const synthesisIdRef  = useRef<string | null>(null)
  const synthesisTextRef = useRef('')

  // Auto-scroll thread to bottom on new items
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread])

  // Load venture + GitHub context
  useEffect(() => {
    const slug = getActiveVentureSlugClient()
    if (!slug) return
    setVentureSlug(slug)

    async function load() {
      setRepoStatus('loading')
      try {
        const ventureRes = await fetch('/api/ventures')
        const ventures = await ventureRes.json() as Array<{ slug: string; name: string; repoUrl?: string }>
        const v = ventures.find(x => x.slug === slug) ?? ventures[0]
        if (!v) return
        setVenture(v.name)
        if (!v.repoUrl) { setRepoStatus('no-repo'); return }

        const [repoRes, commitsRes, issuesRes, prsRes] = await Promise.all([
          fetch(`/api/github?venture=${slug}&action=repo`),
          fetch(`/api/github?venture=${slug}&action=commits`),
          fetch(`/api/github?venture=${slug}&action=issues`),
          fetch(`/api/github?venture=${slug}&action=prs`),
        ])
        if (!repoRes.ok) { setRepoStatus('error'); return }

        const repo    = await repoRes.json() as { name: string; defaultBranch: string; openIssues: number }
        const commits = commitsRes.ok ? (await commitsRes.json() as { commits: Array<{ sha: string; message: string; author: string }> }).commits.slice(0, 10) : []
        const issues  = issuesRes.ok  ? (await issuesRes.json()  as { issues:  Array<{ number: number; title: string }> }).issues.slice(0, 10)  : []
        const prs     = prsRes.ok     ? (await prsRes.json()     as { prs:     Array<{ number: number; title: string; head: string; base: string }> }).prs.slice(0, 5) : []

        setGithubContext([
          `## GitHub: ${repo.name} (${repo.defaultBranch}) · ${repo.openIssues} open issues`,
          commits.length > 0 ? `### Commits\n${commits.map(c => `- ${c.message} (${c.author})`).join('\n')}` : '',
          issues.length  > 0 ? `### Issues\n${issues.map(i => `- #${i.number}: ${i.title}`).join('\n')}` : '',
          prs.length     > 0 ? `### PRs\n${prs.map(p => `- #${p.number}: ${p.title} (${p.head} → ${p.base})`).join('\n')}` : '',
        ].filter(Boolean).join('\n'))
        setRepoLabel(repo.name)
        setRepoStatus('ready')
      } catch {
        setRepoStatus('error')
      }
    }
    void load()
  }, [])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/war-room-plans?venture=${encodeURIComponent(venture)}&limit=20`)
      if (res.ok) setHistory(await res.json() as WarRoomPlanRecord[])
    } catch { /* silent */ } finally {
      setHistoryLoading(false)
    }
  }, [venture])

  // File attachment handler
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setAttachment({ base64: dataUrl.split(',')[1], mimeType: file.type, preview: URL.createObjectURL(file) })
    }
    reader.readAsDataURL(file)
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const toggleAgentExpand = useCallback((id: string) => {
    setThread(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx === -1) return prev
      const item = prev[idx] as Extract<ThreadItem, { kind: 'agent' }>
      return [...prev.slice(0, idx), { ...item, expanded: !item.expanded }, ...prev.slice(idx + 1)]
    })
  }, [])

  // ── Run a session ────────────────────────────────────────────────────────────
  const run = useCallback(async () => {
    if (!input.trim()) return
    if (sessionStatus === 'planning' || sessionStatus === 'executing' || sessionStatus === 'synthesizing') return

    const msg = input.trim()
    const att = attachment
    setInput('')
    setAttachment(null)
    setSessionStatus('planning')
    setAgentRoster({})
    setSessionAgents([])
    synthesisIdRef.current  = null
    synthesisTextRef.current = ''

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    setThread(prev => [...prev, {
      id: mkId(), kind: 'user', text: msg,
      attachment: att ? { preview: att.preview, mimeType: att.mimeType } : undefined,
    }])

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          ventureName: venture,
          githubContext: githubContext || undefined,
          imageBase64: att?.base64,
          imageMimeType: att?.mimeType,
          conversationHistory: conversationHistory.slice(-2),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith(':')) continue
          if (!line.startsWith('data:')) continue
          const raw = line.slice(5).trim()
          if (raw === '[DONE]') { setSessionStatus('complete'); continue }

          let evt: WarRoomEvent
          try { evt = JSON.parse(raw) } catch { continue }

          switch (evt.type) {
            case 'routing': {
              const agents = (evt.routing.specialists ?? []) as AgentId[]
              setSessionAgents(agents)
              setAgentRoster(prev => {
                const next = { ...prev }
                agents.forEach(id => { if (!next[id]) next[id] = 'idle' })
                return next
              })
              break
            }
            case 'plan': {
              if (evt.plan && evt.routing?.intent !== 'direct') {
                const p = evt.plan
                setThread(prev => [...prev, {
                  id: mkId(), kind: 'plan',
                  objective: p.objective,
                  order: p.order,
                  agents: p.agents as AgentId[],
                }])
              }
              setSessionStatus('executing')
              break
            }
            case 'agent_start': {
              setAgentRoster(prev => ({ ...prev, [evt.agentId]: 'working' }))
              setThread(prev => [...prev, {
                id: mkId(), kind: 'agent',
                agentId: evt.agentId as AgentId,
                task: evt.task ?? '',
                status: 'working',
                expanded: false,
              }])
              break
            }
            case 'agent_complete': {
              setAgentRoster(prev => ({ ...prev, [evt.agentId]: 'done' }))
              setThread(prev => updateLastAgent(prev, evt.agentId as AgentId, { status: 'done', output: evt.previewText }))
              break
            }
            case 'agent_error': {
              setAgentRoster(prev => ({ ...prev, [evt.agentId]: 'error' }))
              setThread(prev => updateLastAgent(prev, evt.agentId as AgentId, { status: 'error' }))
              break
            }
            case 'retry': {
              setAgentRoster(prev => ({ ...prev, [evt.agentId]: 'retrying' }))
              setThread(prev => updateLastAgent(prev, evt.agentId as AgentId, { status: 'retrying' }))
              break
            }
            case 'text': {
              setSessionStatus('synthesizing')
              if (!synthesisIdRef.current) {
                const sid = mkId()
                synthesisIdRef.current   = sid
                synthesisTextRef.current = evt.content
                setThread(prev => [...prev, { id: sid, kind: 'synthesis', text: evt.content, streaming: true }])
              } else {
                synthesisTextRef.current += evt.content
                const sid = synthesisIdRef.current
                const full = synthesisTextRef.current
                setThread(prev => {
                  const idx = prev.findIndex(i => i.id === sid)
                  if (idx === -1) return prev
                  const item = prev[idx] as Extract<ThreadItem, { kind: 'synthesis' }>
                  return [...prev.slice(0, idx), { ...item, text: full }, ...prev.slice(idx + 1)]
                })
              }
              break
            }
            case 'plan_complete': {
              setSessionStatus('complete')
              const sid = synthesisIdRef.current
              if (sid) {
                setThread(prev => {
                  const idx = prev.findIndex(i => i.id === sid)
                  if (idx === -1) return prev
                  const item = prev[idx] as Extract<ThreadItem, { kind: 'synthesis' }>
                  return [...prev.slice(0, idx), { ...item, streaming: false }, ...prev.slice(idx + 1)]
                })
              }
              setConversationHistory(prev => [...prev, { user: msg, marcus: synthesisTextRef.current }])
              void loadHistory()
              break
            }
            case 'error': {
              setSessionStatus('error')
              setThread(prev => [...prev, { id: mkId(), kind: 'error', message: evt.message }])
              break
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const hadText = !!synthesisTextRef.current
        setSessionStatus(hadText ? 'complete' : 'error')
        if (!hadText) {
          setThread(prev => [...prev, { id: mkId(), kind: 'error', message: String(err) }])
        }
        // Stop streaming cursor if we have partial text
        const sid = synthesisIdRef.current
        if (sid && hadText) {
          setThread(prev => {
            const idx = prev.findIndex(i => i.id === sid)
            if (idx === -1) return prev
            const item = prev[idx] as Extract<ThreadItem, { kind: 'synthesis' }>
            return [...prev.slice(0, idx), { ...item, streaming: false }, ...prev.slice(idx + 1)]
          })
        }
      }
    }
  }, [input, attachment, venture, githubContext, conversationHistory, sessionStatus, loadHistory])

  const reset = () => {
    abortRef.current?.abort()
    setThread([])
    setAgentRoster({})
    setSessionAgents([])
    setInput('')
    setAttachment(null)
    setSessionStatus('idle')
    setConversationHistory([])
    synthesisIdRef.current   = null
    synthesisTextRef.current = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void run() }
    if (e.key === 'Escape') { abortRef.current?.abort(); setSessionStatus('error') }
  }

  const isRunning = sessionStatus === 'planning' || sessionStatus === 'executing' || sessionStatus === 'synthesizing'

  const statusLabels: Record<SessionStatus, string> = {
    idle:        'Ready',
    planning:    'Planning…',
    executing:   'Agents working',
    synthesizing:'Marcus synthesizing',
    complete:    'Complete',
    error:       'Error',
  }

  return (
    <main className="h-screen overflow-hidden pt-[80px] p-5"><div className="flex flex-col h-full gap-4"><div className="flex flex-1 gap-4 min-h-0">

      {/* ── Left sidebar — agent roster ──────────────────────────────────────── */}
      <aside className={`${sidebarCollapsed ? 'w-14' : 'w-56'} flex-shrink-0 flex flex-col transition-all duration-200 overflow-hidden rounded-2xl`} style={{ background: 'linear-gradient(135deg,rgba(15,22,38,0.62),rgba(8,14,28,0.78))', backdropFilter: 'blur(28px) saturate(140%)', WebkitBackdropFilter: 'blur(28px) saturate(140%)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14),0 20px 50px -16px rgba(0,10,40,0.55)' }}>

        {/* Sidebar header */}
        <div className="flex items-center px-3 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {!sidebarCollapsed && (
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase' as const, flex: 1, color: '#ffffff' }}>Agents</p>
          )}
          <button
            onClick={() => setSidebarCollapsed(p => !p)}
            style={{ color: '#ffffff', cursor: 'pointer', background: 'none', border: 'none', marginLeft: 'auto' }}
          >
            <span className="material-symbols-outlined text-[16px]">
              {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          {ALL_AGENT_IDS.map(id => {
            const meta      = AGENT_META[id]
            const status    = agentRoster[id]
            const isSession = sessionAgents.includes(id)
            const isActive  = !!status && status !== 'idle'

            const dotCls = status === 'done'     ? 'bg-green-400' :
                           status === 'working'   ? 'bg-yellow-400 animate-pulse' :
                           status === 'retrying'  ? 'bg-orange-400 animate-pulse' :
                           status === 'error'     ? 'bg-red-400' :
                           isSession              ? 'bg-white/20' : ''

            return (
              <div
                key={id}
                title={`${meta.name} — ${meta.role}`}
                className={`flex items-center gap-2.5 px-3 py-2 transition-all duration-200 ${
                  isSession || isActive ? 'opacity-100' : 'opacity-25'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <span className="text-[17px] leading-none">{meta.icon}</span>
                  {dotCls && (
                    <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${dotCls}`} />
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: 12, fontWeight: 500, color: I3c, lineHeight: 1.2 }}>{meta.name}</p>
                    <p className="truncate" style={{ fontSize: 9, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginTop: 2 }}>{meta.role}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Session status */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: sessionStatus === 'complete' ? '#4ade80' : sessionStatus === 'error' ? '#f87171' : sessionStatus === 'idle' ? I3d : ACCENT }}>
              {statusLabels[sessionStatus]}
            </p>
            {conversationHistory.length > 0 && (
              <p className="mt-0.5" style={{ fontSize: 9, color: I3d }}>
                {conversationHistory.length} exchange{conversationHistory.length !== 1 ? 's' : ''} in context
              </p>
            )}
          </div>
        )}
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg,rgba(15,22,38,0.62),rgba(8,14,28,0.78))', backdropFilter: 'blur(28px) saturate(140%)', WebkitBackdropFilter: 'blur(28px) saturate(140%)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14),0 20px 50px -16px rgba(0,10,40,0.55)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, paddingBottom: 12 }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: I3d }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
              War Room
            </div>
            <p style={{ fontSize: 12, color: I3c }} className="flex items-center gap-1.5">
              <span>{venture}</span>
              <span style={{ color: I3d }}>·</span>
              {repoStatus === 'ready'   && <span style={{ color: 'rgba(52,211,153,0.60)' }}>{repoLabel}</span>}
              {repoStatus === 'loading' && <span style={{ color: I3d }}>loading repo…</span>}
              {repoStatus === 'error'   && <span style={{ color: 'rgba(248,113,113,0.60)' }}>repo unavailable</span>}
              {repoStatus === 'no-repo' && <span style={{ color: I3d }}>no repo linked</span>}
            </p>
          </div>
          {thread.length > 0 && (
            <button
              onClick={reset}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '6px 12px', color: I3d, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              className="active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>restart_alt</span>
              New session
            </button>
          )}
        </div>

        {/* Thread */}
        <div
          ref={threadRef}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          {thread.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-3xl">👑</span>
              </div>
              <h2 className="text-[15px] font-semibold mb-2" style={{ color: I3c }}>War Room</h2>
              <p className="text-[13px] max-w-xs leading-relaxed mb-7" style={{ color: I3d }}>
                Send a request and Marcus will route it to the right agents, then deliver a unified executive response.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map(q => (
                  <button
                    key={q.label}
                    onClick={() => { setInput(q.prompt); textareaRef.current?.focus() }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: I3d, cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            thread.map(item => {
              switch (item.kind) {
                case 'user':
                  return <UserBubble key={item.id} item={item} />
                case 'plan':
                  return <PlanBanner key={item.id} item={item} />
                case 'agent':
                  return <AgentCard key={item.id} item={item} onToggle={() => toggleAgentExpand(item.id)} />
                case 'synthesis':
                  return (
                    <SynthesisBubble
                      key={item.id}
                      item={item}
                      onCopy={() => handleCopy(item.id, item.text)}
                      copied={copiedId === item.id}
                    />
                  )
                case 'error':
                  return <ErrorCard key={item.id} item={item} />
              }
            })
          )}
        </div>

        {/* ── Input bar ──────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pt-3 pb-4 space-y-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Attachment preview */}
          {attachment && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                <img src={attachment.preview} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 11, color: I3c }}>Image attached</p>
                <p style={{ fontSize: 9, color: I3d }}>{attachment.mimeType} · agents will see this</p>
              </div>
              <button
                onClick={() => setAttachment(null)}
                className="flex-shrink-0 transition-colors"
                style={{ color: I3d, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
          )}

          <div className="flex items-end gap-2.5">
            {/* Attach */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: I3d, cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRunning}
              placeholder="Message the War Room… (Enter to send · Shift+Enter for newline · Esc to cancel)"
              rows={1}
              style={{ minHeight: '42px', maxHeight: '128px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 16px', fontSize: 14, color: '#f1f5fb' }}
              className="flex-1 focus:outline-none resize-none disabled:opacity-40 transition-colors leading-relaxed"
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`
              }}
            />

            {/* Send */}
            <button
              onClick={() => void run()}
              disabled={isRunning || !input.trim()}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              {isRunning
                ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
                : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_upward</span>
              }
            </button>
        </div>
      </div>
      </div>
      </div>
      {/* ── Session history ──────────────────────────────────────────── */}
      <div className="rounded-xl" style={{ background: "linear-gradient(135deg,rgba(15,22,38,0.62),rgba(8,14,28,0.78))", backdropFilter: "blur(28px) saturate(140%)", WebkitBackdropFilter: "blur(28px) saturate(140%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14),0 20px 50px -16px rgba(0,10,40,0.55)" }}>
        <button
          onClick={() => {
            const next = !historyOpen;
            setHistoryOpen(next);
            if (next && history.length === 0) void loadHistory();
          }}
          className="w-full flex items-center gap-3 px-5 py-2.5 transition-colors rounded-xl"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <span className="text-[9px] font-bold tracking-[0.25em] uppercase flex-1" style={{ color: I3c }}>
            Session History
            {history.length > 0 && <span className="ml-2" style={{ color: I3d }}>({history.length})</span>}
          </span>
          {historyLoading && (
            <span className="w-3 h-3 rounded-full animate-spin" style={{ border: "1px solid rgba(255,255,255,0.15)", borderTopColor: I3c }} />
          )}
          <span style={{ color: I3d, fontSize: 10 }}>{historyOpen ? "▲" : "▼"}</span>
        </button>

        {historyOpen && (
          <div className="max-h-40 overflow-y-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {history.length === 0 && !historyLoading && (
              <p className="text-[11px] text-center py-3" style={{ color: I3d }}>No sessions yet.</p>
            )}
            {history.map((plan) => (
              <div key={plan.id} className="flex items-center gap-3 px-5 py-2 transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span className={"w-1.5 h-1.5 rounded-full flex-shrink-0 " + (plan.status === "complete" ? "bg-green-400" : plan.status === "partial" ? "bg-yellow-400" : "bg-red-400")} />
                <p className="flex-1 text-[12px] truncate" style={{ color: I3c }}>
                  {plan.userPrompt.split(" ").slice(0, 6).join(" ")}
                  {plan.agentsUsed.length > 0 && (
                    <span style={{ color: I3d }} className="ml-1.5">
                      · {plan.agentsUsed.slice(0, 2).map((id) => AGENT_META[id]?.name ?? id).join(", ")}
                    </span>
                  )}
                </p>
                <div className="flex gap-0.5 flex-shrink-0">
                  {plan.agentsUsed.slice(0, 3).map((id) => (
                    <span key={id} className="text-xs" title={AGENT_META[id]?.name ?? id}>
                      {AGENT_META[id]?.icon ?? "?"}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] flex-shrink-0 tabular-nums" style={{ color: I3d }}>
                  {new Date(plan.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </main>
  );
}
