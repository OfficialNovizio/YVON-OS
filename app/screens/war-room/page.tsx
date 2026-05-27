'use client'

import Image from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { AgentId, AgentRunStatus, WarRoomEvent, WarRoomPlanRecord } from '@/lib/types'
import { getActiveVentureSlugClient } from '@/lib/venture-context'
import { supabaseClient } from '@/lib/supabase-client'

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG     = '#0d0d0d'   // dot borders only — page background is transparent
const BORDER = 'rgba(255,255,255,0.08)'
const T1     = '#ececec'
const T2     = '#b4b4b4'
const T3     = 'rgba(255,255,255,0.35)'
const USERBG = '#1e1e1e'
const ACCENT = '#cc785c'

// ── YVON Glass System — canonical 4 variants (docs/ventures/yvon-dashboard/DESIGN.md) ──
import type { CSSProperties } from 'react'

const G1: CSSProperties = {           // V1 — Clear Ice (light · dark text)
  background:             'rgba(255,255,255,0.32)',
  backdropFilter:         'blur(32px)',
  WebkitBackdropFilter:   'blur(32px)',
  border:                 '1px solid rgba(255,255,255,0.45)',
}
const G2: CSSProperties = {           // V2 — Azure Tint (dark · light text)
  background:             'linear-gradient(135deg, rgba(36,99,180,0.42), rgba(20,70,140,0.55))',
  backdropFilter:         'blur(30px)',
  WebkitBackdropFilter:   'blur(30px)',
  border:                 '1px solid rgba(255,255,255,0.18)',
}
const G3: CSSProperties = {           // V3 — Obsidian (dark · light text)
  background:             'linear-gradient(135deg, rgba(15,22,38,0.58), rgba(8,14,28,0.72))',
  backdropFilter:         'blur(34px)',
  WebkitBackdropFilter:   'blur(34px)',
  border:                 '1px solid rgba(255,255,255,0.08)',
}
const G4: CSSProperties = {           // V4 — Prism (light iridescent · dark text)
  background:             'radial-gradient(ellipse at 30% 40%, rgba(236,72,153,0.22), transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(6,182,212,0.18), transparent 60%), rgba(255,255,255,0.28)',
  backdropFilter:         'blur(30px)',
  WebkitBackdropFilter:   'blur(30px)',
  border:                 '1px solid rgba(255,255,255,0.40)',
}
const ink = {
  navy: '#051220',   // text on G1, G4 (light containers) — darkened for contrast
  white: '#f1f5fb',  // text on G2, G3 (dark containers)
  plum:  '#1a0830',  // accent text on G4 — darkened
}

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

// ─── Slash commands ────────────────────────────────────────────────────────────
interface SlashCmd { cmd: string; label: string; prompt: string }

const DEFAULT_SLASH_COMMANDS: SlashCmd[] = [
  { cmd: '/report',   label: 'Full executive report',       prompt: 'Generate a full executive report across all departments — tech, marketing, finance, and growth. Include current status, risks, and top 3 priorities.' },
  { cmd: '/brief',    label: 'Weekly executive brief',      prompt: 'Give me the weekly executive brief — what should we focus on this week across marketing, tech, and growth?' },
  { cmd: '/analyze',  label: 'Analyze current metrics',     prompt: 'Analyze our current metrics and KPIs. What are the top insights and what action should we take right now?' },
  { cmd: '/github',   label: 'GitHub repository deep dive', prompt: 'Do a deep dive on our GitHub repository — review open PRs, issues, recent commits, and technical debt. What needs attention most urgently?' },
  { cmd: '/strategy', label: 'Strategy session',            prompt: 'Run a strategy session with Marcus. What are our biggest opportunities and risks right now? What should we double down on?' },
  { cmd: '/sprint',   label: 'Sprint planning',             prompt: 'Help me plan this sprint. What are the highest-impact tasks to tackle in the next 2 weeks across tech, marketing, and growth?' },
  { cmd: '/launch',   label: 'Pre-launch readiness check',  prompt: 'Run a pre-launch readiness check across tech, marketing, and operations. What is missing and what are the risks?' },
  { cmd: '/market',   label: 'Market intelligence report',  prompt: 'Run a market intelligence report. What are our top competitors doing, what trends are emerging, and where is the biggest opportunity?' },
]

const QUICK_PROMPTS = [
  { label: 'Weekly strategy brief', icon: 'insights',      prompt: 'Give me a weekly executive brief — what should we focus on this week across marketing, tech, and growth?' },
  { label: 'Growth bottlenecks',    icon: 'trending_up',   prompt: 'Analyze our current growth funnel and identify the top 2 bottlenecks blocking us from scaling faster.' },
  { label: 'Pre-launch checklist',  icon: 'rocket_launch', prompt: 'We are preparing for a launch — run a pre-launch check across tech, marketing, and operations. What is missing?' },
  { label: 'Review open PRs',       icon: 'merge',         prompt: 'Review our open GitHub PRs and issues — identify what needs attention most urgently and why.' },
]

// ─── Types ─────────────────────────────────────────────────────────────────────
type SessionStatus = 'idle' | 'planning' | 'awaiting_approval' | 'executing' | 'synthesizing' | 'complete' | 'error'
type RepoStatus    = 'idle' | 'loading' | 'ready' | 'error' | 'no-repo'

interface ToolCallEntry {
  id:        string
  name:      string
  input:     unknown
  startedAt: number
  endedAt?:  number
  summary?:  string
  isError?:  boolean
}

type ThreadItem =
  | { id: string; kind: 'user';        text: string; attachments?: Array<{ preview?: string; mimeType: string; name: string; isImage: boolean }> }
  | { id: string; kind: 'plan';        objective: string; order: string; agents: AgentId[] }
  | { id: string; kind: 'engage_plan'; originalMessage: string; plan: import('@/lib/types').ExecutionPlan; routing: import('@/lib/types').RoutingResult }
  | { id: string; kind: 'agent';       agentId: AgentId; task: string; status: AgentRunStatus; output?: string; expanded: boolean; startedAt: number; endedAt?: number; tools: ToolCallEntry[] }
  | { id: string; kind: 'synthesis';   text: string; streaming: boolean }
  | { id: string; kind: 'error';       message: string }

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
    if (item.kind === 'agent' && item.agentId === agentId)
      return [...prev.slice(0, i), { ...item, ...patch }, ...prev.slice(i + 1)]
  }
  return prev
}

function patchLastAgentTools(
  prev: ThreadItem[],
  agentId: AgentId,
  fn: (tools: ToolCallEntry[]) => ToolCallEntry[],
): ThreadItem[] {
  for (let i = prev.length - 1; i >= 0; i--) {
    const item = prev[i]
    if (item.kind === 'agent' && item.agentId === agentId)
      return [...prev.slice(0, i), { ...item, tools: fn(item.tools) }, ...prev.slice(i + 1)]
  }
  return prev
}

// ─── Markdown renderer ─────────────────────────────────────────────────────────
function inlineFormat(text: string, darkMode = false): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ fontWeight: 700, color: darkMode ? '#c0392b' : T1 }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ background: darkMode ? 'rgba(21,128,61,0.12)' : 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 5px', fontSize: 12, fontFamily: 'ui-monospace,monospace', color: darkMode ? '#15803d' : '#86efac' }}>{part.slice(1, -1)}</code>
    return part
  })
}

function SimpleMarkdown({ text, dark = false }: { text: string; dark?: boolean }) {
  const mt1 = dark ? ink.navy : T1
  const mt2 = dark ? ink.navy : T2
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      elements.push(
        <pre key={i} style={{ background: dark ? 'rgba(12,44,82,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${dark ? 'rgba(12,44,82,0.15)' : BORDER}`, borderRadius: 8, padding: '12px 14px', fontSize: 12, fontFamily: 'ui-monospace,monospace', color: mt2, overflowX: 'auto', margin: '10px 0', lineHeight: 1.6 }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 600, color: mt1, margin: '14px 0 5px' }}>{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: 16, fontWeight: 700, color: mt1, margin: '18px 0 8px' }}>{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: 18, fontWeight: 700, color: mt1, margin: '18px 0 8px' }}>{line.slice(2)}</h1>)
    } else if (/^[-*•] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•] /.test(lines[i])) { items.push(lines[i].replace(/^[-*•] /, '')); i++ }
      elements.push(
        <ul key={i} style={{ margin: '6px 0', paddingLeft: 0 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 14, color: mt2, lineHeight: 1.7, display: 'flex', gap: 10, marginBottom: 3 }}>
              <span style={{ color: dark ? 'rgba(12,44,82,0.35)' : T3, marginTop: 5, flexShrink: 0, fontSize: 6 }}>●</span>
              <span>{inlineFormat(item, dark)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i++ }
      elements.push(
        <ol key={i} style={{ margin: '6px 0', paddingLeft: 0 }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 14, color: mt2, lineHeight: 1.7, display: 'flex', gap: 10, marginBottom: 3 }}>
              <span style={{ color: dark ? 'rgba(12,44,82,0.45)' : T3, flexShrink: 0, minWidth: 18, fontSize: 12 }}>{j + 1}.</span>
              <span>{inlineFormat(item, dark)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 4 }} />)
    } else {
      elements.push(<p key={i} style={{ fontSize: 14, color: mt2, lineHeight: 1.7, margin: 0 }}>{inlineFormat(line, dark)}</p>)
    }
    i++
  }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{elements}</div>
}

// ─── Status pills ──────────────────────────────────────────────────────────────
function GithubStatusPill({ status, label, branch, openIssues, snapshotError }: {
  status: RepoStatus; label: string | null; branch: string | null; openIssues: number | null; snapshotError: string | null
}) {
  const eff: RepoStatus = snapshotError ? 'error' : (label ? 'ready' : status)
  const dot   = eff === 'ready' ? '#16a34a' : eff === 'error' ? '#dc2626' : eff === 'loading' ? '#ca8a04' : 'rgba(5,18,32,0.25)'
  const tc    = eff === 'ready' ? '#15803d' : eff === 'error' ? '#dc2626' : ink.navy
  const bc    = eff === 'ready' ? 'rgba(22,163,74,0.30)' : eff === 'error' ? 'rgba(220,38,38,0.30)' : 'rgba(5,18,32,0.18)'
  const txt   = eff === 'ready' ? (label ?? 'connected') : eff === 'error' ? (snapshotError ? 'github error' : 'unavailable') : eff === 'loading' ? 'connecting…' : eff === 'no-repo' ? 'no repo linked' : 'connecting…'
  return (
    <div title={eff === 'ready' && branch ? `${label} · ${branch} · ${openIssues ?? 0} issues` : snapshotError ?? `GitHub: ${eff}`}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: 'rgba(5,18,32,0.07)', border: `1px solid ${bc}`, fontFamily: 'ui-monospace,monospace' }}>
      <span className={eff === 'loading' ? 'animate-pulse' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: tc, fontWeight: 700 }}>{txt}</span>
      {eff === 'ready' && branch && <>
        <span style={{ fontSize: 10, color: 'rgba(5,18,32,0.35)' }}>·</span>
        <span style={{ fontSize: 11, color: ink.navy, fontWeight: 600 }}>{branch}</span>
        {openIssues !== null && <><span style={{ fontSize: 10, color: 'rgba(5,18,32,0.35)' }}>·</span><span style={{ fontSize: 11, color: ink.navy }}>{openIssues} issue{openIssues === 1 ? '' : 's'}</span></>}
      </>}
    </div>
  )
}

function EnginePill({ engine, fastModel, synthesisModel }: { engine: 'client_sdk' | 'agent_sdk'; fastModel?: string; synthesisModel?: string }) {
  const isClaude = engine === 'agent_sdk'
  const short = (m?: string) => m?.replace(/^claude-/, '').replace(/-\d{8}$/, '') ?? ''
  const fast = short(fastModel); const synth = short(synthesisModel)
  const models = fast && synth ? `${fast} · ${synth}` : (fast || synth)
  return (
    <div title={`Engine: ${isClaude ? 'Claude Agent SDK (subprocess)' : 'Client SDK tool loop'}${models ? ' · ' + models : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: isClaude ? 'rgba(180,80,20,0.12)' : 'rgba(30,80,180,0.10)', border: `1px solid ${isClaude ? 'rgba(180,80,20,0.35)' : 'rgba(30,80,180,0.30)'}`, fontFamily: 'ui-monospace,monospace' }}>
      <span style={{ fontSize: 11 }}>{isClaude ? '🟠' : '🔵'}</span>
      <span style={{ fontSize: 11, color: isClaude ? '#a84a10' : '#1a50b0', fontWeight: 700 }}>{isClaude ? 'Agent SDK' : 'Client SDK'}</span>
      {models && <span style={{ fontSize: 10, color: isClaude ? '#b86020' : '#2060c0', fontWeight: 600 }}>· {models}</span>}
    </div>
  )
}

// ─── Thread item components ────────────────────────────────────────────────────
function UserBubble({ item }: { item: Extract<ThreadItem, { kind: 'user' }> }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
      <div style={{ maxWidth: '70%' }}>
        {item.attachments && item.attachments.length > 0 && (
          <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {item.attachments.map((att, i) => att.isImage && att.preview ? (
              <div key={i} style={{ position: 'relative', width: 176, height: 128, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                <Image src={att.preview} alt="attachment" width={176} height={128} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: T2 }}>attach_file</span>
                <span style={{ fontSize: 12, color: T2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ background: USERBG, border: `1px solid rgba(255,255,255,0.10)`, borderRadius: '18px 18px 4px 18px', padding: '10px 16px' }}>
          <p style={{ fontSize: 14, color: T1, lineHeight: 1.6, margin: 0 }}>{item.text}</p>
        </div>
      </div>
    </div>
  )
}

function PlanBanner({ item }: { item: Extract<ThreadItem, { kind: 'plan' }> }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 10, fontSize: 11, maxWidth: '80%', background: 'rgba(10,14,30,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${ACCENT}35` }}>
        <span className="material-symbols-outlined" style={{ fontSize: 12, color: ACCENT, flexShrink: 0 }}>account_tree</span>
        <span style={{ color: T1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.objective}</span>
        <span style={{ color: T3 }}>·</span>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {item.agents.map(id => <span key={id} style={{ fontSize: 13 }} title={AGENT_META[id]?.name}>{AGENT_META[id]?.icon ?? '?'}</span>)}
        </div>
        <span style={{ color: T3 }}>·</span>
        <span style={{ color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 9, flexShrink: 0 }}>{item.order}</span>
      </div>
    </div>
  )
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  return `${m}m${Math.floor(s - m * 60)}s`
}

function shortToolInput(name: string, input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const o = input as Record<string, unknown>
  if (name === 'Read')     return String(o.file_path ?? '')
  if (name === 'Glob')     return String(o.pattern ?? '') + (o.path ? `  in ${o.path}` : '')
  if (name === 'Grep')     return `"${String(o.pattern ?? '')}"${o.glob ? `  ${o.glob}` : ''}${o.path ? `  in ${o.path}` : ''}`
  if (name === 'Bash')     return String(o.command ?? '')
  if (name === 'WebFetch') return String(o.url ?? '')
  if (name === 'Github') {
    const parts = [String(o.action ?? '')]
    if (o.path)   parts.push(String(o.path))
    if (o.query)  parts.push(`"${String(o.query)}"`)
    if (o.branch) parts.push(`branch=${String(o.branch)}`)
    if (o.state)  parts.push(`state=${String(o.state)}`)
    return parts.join(' ')
  }
  if (name === 'TodoWrite' && Array.isArray(o.todos)) return `${(o.todos as unknown[]).length} item(s)`
  return JSON.stringify(input).slice(0, 80)
}

function AgentCard({ item, onToggle, now }: {
  item: Extract<ThreadItem, { kind: 'agent' }>; onToggle: () => void; now: number
}) {
  const meta = AGENT_META[item.agentId]
  const isActive = item.status === 'working' || item.status === 'retrying'
  const dotColor = item.status === 'done' ? '#4ade80' : item.status === 'working' ? '#facc15' : item.status === 'retrying' ? '#fb923c' : item.status === 'error' ? '#f87171' : T3
  const statusLabel = { idle: 'STANDBY', working: 'WORKING', done: 'DONE', error: 'ERROR', retrying: 'RETRYING' }[item.status]
  const elapsedMs = (item.endedAt ?? now) - item.startedAt

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 640, borderRadius: 12, background: 'rgba(10,14,30,0.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${item.status === 'done' ? 'rgba(52,211,153,0.22)' : isActive ? 'rgba(250,204,21,0.28)' : item.status === 'error' ? 'rgba(248,113,113,0.22)' : 'rgba(255,255,255,0.10)'}`, transition: 'border-color 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className={isActive ? 'animate-pulse' : ''} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: isActive ? 'rgba(250,204,21,0.10)' : item.status === 'done' ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.05)' }}>
              {meta?.icon}
            </div>
            {item.status === 'done' && (
              <span style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: '#4ade80', border: `1px solid ${BG}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, color: '#000', fontWeight: 700 }}>✓</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: T1, margin: 0 }}>{meta?.name}</p>
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: T2 }}>{meta?.role}</span>
            </div>
            {item.task && <p style={{ fontSize: 11, color: T2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0' }}>{item.task}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontFamily: 'ui-monospace,monospace', color: T2 }}>{formatElapsed(elapsedMs)}{isActive ? '…' : ''}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className={item.status === 'working' || item.status === 'retrying' ? 'animate-pulse' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: T2 }}>{statusLabel}</span>
            </div>
            {item.output && (
              <button onClick={onToggle} style={{ color: T2, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{item.expanded ? 'expand_less' : 'expand_more'}</span>
              </button>
            )}
          </div>
        </div>
        {item.tools.length > 0 && (
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'ui-monospace,monospace' }}>
              {item.tools.map(t => {
                const inFlight = !t.endedAt
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, lineHeight: 1.4 }}>
                    <span style={{ color: inFlight ? 'rgba(250,204,21,0.70)' : t.isError ? 'rgba(248,113,113,0.70)' : 'rgba(52,211,153,0.70)' }}>{inFlight ? '⏵' : t.isError ? '✗' : '✓'}</span>
                    <span style={{ fontWeight: 600, color: T1 }}>{t.name}</span>
                    <span style={{ flex: 1, color: T2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortToolInput(t.name, t.input)}</span>
                    <span style={{ fontSize: 10, color: T2, flexShrink: 0 }}>{formatElapsed((t.endedAt ?? now) - t.startedAt)}{inFlight ? '…' : ''}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {item.expanded && item.output && (
          <div style={{ padding: '12px', borderTop: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: T2, margin: 0 }}>{item.output}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SynthesisBubble({ item, onCopy, copied }: {
  item: Extract<ThreadItem, { kind: 'synthesis' }>; onCopy: () => void; copied: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%' }}>
      <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
        <span style={{ fontSize: 14 }}>👑</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>Marcus</span>
          <span style={{ fontSize: 10, color: 'rgba(245,158,11,0.70)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>CEO Synthesis</span>
          {item.streaming && <span className="animate-pulse" style={{ display: 'inline-block', width: 3, height: 14, borderRadius: 2, background: '#F59E0B' }} />}
        </div>
        {/* G4 Prism — "completed items, soft iridescent moments" — light container → dark text */}
        <div style={{ ...G4, borderRadius: 14, padding: '16px 20px', color: ink.navy }}>
          <SimpleMarkdown text={item.text} dark />
        </div>
        {!item.streaming && (
          <button onClick={onCopy} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(245,158,11,0.60)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}

function ErrorCard({ item }: { item: Extract<ThreadItem, { kind: 'error' }> }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(10,14,30,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(248,113,113,0.30)', fontSize: 12, color: '#f87171', maxWidth: 480 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, flexShrink: 0 }}>error</span>
        <span>{item.message}</span>
      </div>
    </div>
  )
}

// ─── EngagePlanCard ─────────────────────────────────────────────────────────────
// ⛔ WORKFLOW RULE 4 — This component IS the approval gate. Do not delete or
// bypass. Every session must route through this before specialists run.
// Source of truth: docs/WORKFLOW.md § "Phase 0 — ENGAGE + PLAN"

function EngagePlanCard({ item, onApprove, onCancel }: {
  item: Extract<ThreadItem, { kind: 'engage_plan' }>
  onApprove: () => void
  onCancel: () => void
}) {
  const agents = (item.plan.agents ?? []) as AgentId[]
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
      <div style={{ maxWidth: '82%', width: '100%', borderRadius: 16, overflow: 'hidden', background: 'rgba(15,22,38,0.70)', border: '1px solid rgba(245,158,11,0.30)', boxShadow: '0 0 0 1px rgba(245,158,11,0.08) inset' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.06)' }}>
          <span style={{ fontSize: 14 }}>👑</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.90)' }}>Marcus — Engage + Plan</span>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ color: T3, minWidth: 64 }}>Intent</span>
            <span style={{ color: T1 }}>{item.routing.intent.replace(/_/g, ' ')}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ color: T3, minWidth: 64 }}>Team</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {agents.map(id => (
                <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, fontSize: 11 }}>
                  <span>{AGENT_META[id]?.icon ?? '?'}</span>
                  <span style={{ color: T1 }}>{AGENT_META[id]?.name ?? id}</span>
                </span>
              ))}
              <span style={{ padding: '2px 8px', borderRadius: 6, background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, fontSize: 9, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.plan.order}</span>
            </div>
          </div>
          {agents.length > 0 && (
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ color: T3, minWidth: 64 }}>Plan</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {agents.map(id => {
                  const task = item.plan.each_agent_task?.[id]
                  return task ? (
                    <div key={id} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: T3, flexShrink: 0 }}>→</span>
                      <span style={{ color: T2 }}><span style={{ color: T1, fontWeight: 500 }}>{AGENT_META[id]?.name ?? id}:</span> {task.length > 100 ? task.slice(0, 100) + '…' : task}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}
          {item.plan.definition_of_done && (
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ color: T3, minWidth: 64 }}>Done when</span>
              <span style={{ color: T2 }}>{item.plan.definition_of_done}</span>
            </div>
          )}
        </div>
        {/* Footer — approval gate */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid rgba(245,158,11,0.12)', background: 'rgba(245,158,11,0.04)' }}>
          <span style={{ fontSize: 11, color: 'rgba(245,158,11,0.70)', fontStyle: 'italic' }}>Awaiting your go-ahead →</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onCancel} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: T2, cursor: 'pointer' }}>Cancel</button>
            <button onClick={onApprove} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,0.85)', border: '1px solid rgba(245,158,11,0.60)', color: '#000', cursor: 'pointer' }}>Go ahead →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slash picker ──────────────────────────────────────────────────────────────
function SlashPicker({ commands, activeIdx, onSelect }: { commands: SlashCmd[]; activeIdx: number; onSelect: (c: SlashCmd) => void }) {
  if (commands.length === 0) return null
  return (
    <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6, borderRadius: 12, background: '#1a1a1a', border: `1px solid ${BORDER}`, boxShadow: '0 -8px 24px rgba(0,0,0,0.50)', overflow: 'hidden', zIndex: 50 }}>
      <div style={{ padding: '4px 0' }}>
        {commands.map((cmd, i) => (
          <button key={cmd.cmd} onClick={() => onSelect(cmd)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: i === activeIdx ? 'rgba(255,255,255,0.08)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, fontFamily: 'ui-monospace,monospace', minWidth: 80 }}>{cmd.cmd}</span>
            <span style={{ fontSize: 12, color: T2 }}>{cmd.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Agents bar ────────────────────────────────────────────────────────────────
function AgentsBar({ sessionAgents, agentRoster }: { sessionAgents: AgentId[]; agentRoster: Partial<Record<AgentId, AgentRunStatus>> }) {
  return (
    <div style={{ ...G2, borderRadius: 24, padding: '7px 12px', overflowX: 'auto', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, scrollbarWidth: 'none' }}>
      {ALL_AGENT_IDS.map(id => {
        const meta = AGENT_META[id]
        const status = agentRoster[id]
        const isSession = sessionAgents.includes(id)
        const isActive = !!status && status !== 'idle'
        const dotColor = status === 'done' ? '#4ade80' : status === 'working' ? '#facc15' : status === 'retrying' ? '#fb923c' : status === 'error' ? '#f87171' : null
        return (
          <div key={id} title={`${meta.name} — ${meta.role}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, flexShrink: 0, background: isActive ? `${meta.color}30` : isSession ? `${meta.color}18` : 'rgba(255,255,255,0.07)', border: `1px solid ${isActive ? `${meta.color}90` : isSession ? `${meta.color}50` : 'rgba(255,255,255,0.14)'}`, opacity: isSession || isActive ? 1 : 0.38, transition: 'all 0.2s', boxShadow: isActive ? `0 0 8px ${meta.color}40` : 'none' }}>
            <span style={{ fontSize: 14, position: 'relative', display: 'inline-block', filter: isActive || isSession ? `drop-shadow(0 0 4px ${meta.color}90)` : 'none' }}>
              {meta.icon}
              {dotColor && <span className={status === 'working' || status === 'retrying' ? 'animate-pulse' : ''} style={{ position: 'absolute', bottom: -1, right: -2, width: 5, height: 5, borderRadius: '50%', background: dotColor, border: `1px solid ${BG}`, display: 'inline-block' }} />}
            </span>
            <span style={{ fontSize: 11, color: isActive ? '#fff' : ink.white, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>{meta.name}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── History sidebar ───────────────────────────────────────────────────────────
function groupByDate(records: WarRoomPlanRecord[]): Array<{ label: string; items: WarRoomPlanRecord[] }> {
  const now = Date.now(); const DAY = 86_400_000
  const g: Record<string, WarRoomPlanRecord[]> = { Today: [], Yesterday: [], 'Last 7 days': [], Older: [] }
  for (const r of records) {
    const age = now - new Date(r.createdAt).getTime()
    if (age < DAY)        g['Today'].push(r)
    else if (age < 2*DAY) g['Yesterday'].push(r)
    else if (age < 7*DAY) g['Last 7 days'].push(r)
    else                  g['Older'].push(r)
  }
  return Object.entries(g).filter(([, items]) => items.length > 0).map(([label, items]) => ({ label, items }))
}

function HistorySidebar({ collapsed, onCollapse, onNew, records, loading, onLoad, activeSessionId }: {
  collapsed: boolean; onCollapse: () => void; onNew: () => void
  records: WarRoomPlanRecord[]; loading: boolean; onLoad: (r: WarRoomPlanRecord) => void; activeSessionId: string | null
}) {
  const groups = groupByDate(records)
  return (
    <div style={{ width: collapsed ? 52 : 256, flexShrink: 0, display: 'flex', flexDirection: 'column', ...G3, borderRadius: 16, transition: 'width 0.2s', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 8px 6px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button onClick={onCollapse} title={collapsed ? 'Expand' : 'Collapse'} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: T2, flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{collapsed ? 'chevron_right' : 'menu'}</span>
        </button>
        {!collapsed && <span style={{ fontSize: 12, fontWeight: 600, color: T2, flex: 1 }}>War Room</span>}
        {!collapsed && (
          <button onClick={onNew} title="New session" style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${BORDER}`, cursor: 'pointer', color: T2, flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={onNew} title="New session" style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${BORDER}`, cursor: 'pointer', color: T2, margin: '0 10px 8px', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
        </button>
      )}
      {/* Session list */}
      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.10) transparent' }}>
          {loading && <p style={{ fontSize: 11, color: T3, textAlign: 'center', padding: '16px 0' }}>Loading…</p>}
          {!loading && records.length === 0 && (
            <p style={{ fontSize: 11, color: T3, textAlign: 'center', padding: '16px 12px', lineHeight: 1.5 }}>No sessions yet. Send a message to start.</p>
          )}
          {groups.map(({ label, items }) => (
            <div key={label}>
              <p style={{ fontSize: 10, fontWeight: 600, color: T3, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 12px 3px', margin: 0 }}>{label}</p>
              {items.map(r => (
                <button key={r.id} onClick={() => onLoad(r)} style={{ display: 'block', textAlign: 'left', padding: '6px 10px', background: activeSessionId === r.id ? 'rgba(255,255,255,0.08)' : 'none', border: 'none', cursor: 'pointer', borderRadius: 6, margin: '1px 4px', width: 'calc(100% - 8px)' }}>
                  <p style={{ fontSize: 12, color: T1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.userPrompt.split(' ').slice(0, 7).join(' ')}{r.userPrompt.split(' ').length > 7 ? '…' : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: r.status === 'complete' ? '#4ade80' : r.status === 'partial' ? '#facc15' : '#f87171', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: T3 }}>{new Date(r.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    {r.agentsUsed.slice(0, 3).map(id => <span key={id} style={{ fontSize: 10 }} title={AGENT_META[id]?.name}>{AGENT_META[id]?.icon ?? '?'}</span>)}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function WarRoomPage() {
  const [thread, setThread]               = useState<ThreadItem[]>([])
  const [agentRoster, setAgentRoster]     = useState<Partial<Record<AgentId, AgentRunStatus>>>({})
  const [sessionAgents, setSessionAgents] = useState<AgentId[]>([])
  const [input, setInput]                 = useState('')
  const [attachments, setAttachments]     = useState<Array<{ base64: string; mimeType: string; name: string; preview?: string; isImage: boolean }>>([])
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [venture, setVenture]             = useState('Novizio')
  const [ventureSlug, setVentureSlug]     = useState('')
  const [githubContext, setGithubContext]  = useState('')
  const [repoStatus, setRepoStatus]       = useState<RepoStatus>('idle')
  const [repoLabel, setRepoLabel]         = useState('')
  const [history, setHistory]             = useState<WarRoomPlanRecord[]>([])
  const [, setTick]                       = useState(0)
  const [engineInfo, setEngineInfo]       = useState<{ engine: 'client_sdk' | 'agent_sdk'; fastModel?: string; synthesisModel?: string } | null>(null)
  const [snapshot, setSnapshot]           = useState<{ repo: string | null; branch: string | null; openIssues: number | null; error: string | null } | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [copiedId, setCopiedId]           = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<{ user: string; marcus: string }[]>([])
  const [repoMode, setRepoMode]           = useState<'github' | 'local'>(() => {
    if (typeof window === 'undefined') return 'github'
    return (localStorage.getItem('yvon_war_room_repo_mode') as 'github' | 'local') ?? 'github'
  })
  const [localRepoPath, setLocalRepoPath] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    const slug = document.cookie.match(/yvon_active_venture=([^;]+)/)?.[1] ?? 'novizio'
    return localStorage.getItem(`yvon_local_repo_path_${slug}`) ?? ''
  })
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  // currentSessionId tracks the DB plan ID for the ongoing conversation — reused across turns
  const currentSessionIdRef = useRef<string | null>(null)
  // Slash command state
  const [slashOpen, setSlashOpen]         = useState(false)
  const [slashIdx, setSlashIdx]           = useState(0)
  const [slashCommands, setSlashCommands] = useState<SlashCmd[]>(DEFAULT_SLASH_COMMANDS)
  const [slashFiltered, setSlashFiltered] = useState<SlashCmd[]>(DEFAULT_SLASH_COMMANDS)

  const threadRef        = useRef<HTMLDivElement>(null)
  const fileInputRef     = useRef<HTMLInputElement>(null)
  const textareaRef      = useRef<HTMLTextAreaElement>(null)
  const abortRef         = useRef<AbortController | null>(null)
  const synthesisIdRef   = useRef<string | null>(null)
  const synthesisTextRef = useRef('')

  // Live timer — re-renders every 250ms while agents are running so elapsed timers update
  useEffect(() => {
    if (sessionStatus !== 'planning' && sessionStatus !== 'executing' && sessionStatus !== 'synthesizing') return
    const t = setInterval(() => setTick(n => n + 1), 250)
    return () => clearInterval(t)
  }, [sessionStatus])

  // Auto-scroll thread to bottom on new items
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [thread])

  // Pre-fetch engine info on mount
  useEffect(() => {
    fetch('/api/war-room-engine')
      .then(r => r.json() as Promise<{ engine: 'client_sdk' | 'agent_sdk'; fastModel?: string; synthesisModel?: string }>)
      .then(setEngineInfo)
      .catch(() => {})
  }, [])

  // Load custom slash commands — merge with defaults (custom overrides same /cmd)
  useEffect(() => {
    fetch('/api/war-room-commands')
      .then(r => r.json() as Promise<{ commands?: SlashCmd[] }>)
      .then(data => {
        if (!data.commands?.length) return
        const overrides = new Map(data.commands.map(c => [c.cmd, c]))
        const merged = [
          ...data.commands,
          ...DEFAULT_SLASH_COMMANDS.filter(d => !overrides.has(d.cmd)),
        ]
        setSlashCommands(merged)
        setSlashFiltered(merged)
      })
      .catch(() => {})
  }, [])

  // Load venture + GitHub context
  useEffect(() => {
    const slug = getActiveVentureSlugClient()
    if (!slug) return
    setVentureSlug(slug)

    async function load() {
      setRepoStatus('loading')
      try {
        const ventureRes = await fetch('/api/ventures')
        const ventures = await ventureRes.json() as Array<{ slug: string; name: string; repoUrl?: string; localRepoPath?: string }>
        const v = ventures.find(x => x.slug === slug) ?? ventures[0]
        if (!v) return
        setVenture(v.name)
        if (v.localRepoPath) {
          setLocalRepoPath(v.localRepoPath)
          localStorage.setItem(`yvon_local_repo_path_${slug}`, v.localRepoPath)
        }
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
        const issues  = issuesRes.ok  ? (await issuesRes.json()  as { issues:  Array<{ number: number; title: string }> }).issues.slice(0, 10) : []
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
      const res = await fetch(`/api/war-room-plans?venture=${encodeURIComponent(venture)}&limit=40`)
      if (res.ok) setHistory(await res.json() as WarRoomPlanRecord[])
    } catch { /* silent */ } finally {
      setHistoryLoading(false)
    }
  }, [venture])

  // Load history on mount so sidebar is pre-populated
  useEffect(() => { void loadHistory() }, [loadHistory])

  const loadSessionIntoThread = useCallback((plan: WarRoomPlanRecord) => {
    const synthesis = plan.synthesis ?? '(this session had no recorded synthesis)'
    const items: ThreadItem[] = [
      { id: mkId(), kind: 'user', text: plan.userPrompt },
      ...(plan.objective ? [{ id: mkId(), kind: 'plan' as const, objective: plan.objective, order: plan.agentOrder, agents: plan.agentsUsed }] : []),
      { id: mkId(), kind: 'synthesis', text: synthesis, streaming: false },
    ]
    setThread(items)
    setConversationHistory([{ user: plan.userPrompt, marcus: synthesis }])
    setActiveSessionId(plan.id)
    requestAnimationFrame(() => threadRef.current?.scrollTo({ top: 0, behavior: 'auto' }))
  }, [])

  const handleFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      const isImage = file.type.startsWith('image/')
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setAttachments(prev => [...prev, {
          base64:   dataUrl.split(',')[1],
          mimeType: file.type || 'application/octet-stream',
          name:     file.name,
          isImage,
          preview:  isImage ? URL.createObjectURL(file) : undefined,
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const deleteMessage = useCallback((id: string) => {
    setThread(prev => prev.filter(i => i.id !== id))
  }, [])

  const clearChat = useCallback(() => {
    setThread([])
    setConversationHistory([])
    setActiveSessionId(null)
    currentSessionIdRef.current = null
  }, [])

  const toggleAgentExpand = useCallback((id: string) => {
    setThread(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx === -1) return prev
      const item = prev[idx] as Extract<ThreadItem, { kind: 'agent' }>
      return [...prev.slice(0, idx), { ...item, expanded: !item.expanded }, ...prev.slice(idx + 1)]
    })
  }, [])

  async function ensureAuthCookie(): Promise<boolean> {
    const { data: { session } } = await supabaseClient.auth.getSession()
    if (!session?.access_token) return false
    const res = await fetch('/api/auth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session.access_token }),
    })
    return res.ok
  }

  const run = useCallback(async (approvalData?: {
    originalMessage: string
    plan: import('@/lib/types').ExecutionPlan
    routing: import('@/lib/types').RoutingResult
  }) => {
    const isApproval = !!approvalData
    if (!isApproval && !input.trim()) return
    if (sessionStatus === 'planning' || sessionStatus === 'executing' || sessionStatus === 'synthesizing') return

    const msg = isApproval ? approvalData.originalMessage : input.trim()
    const att = isApproval ? [] : attachments

    if (!isApproval) {
      setInput('')
      setAttachments([])
      setSlashOpen(false)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      setThread(prev => [...prev, {
        id: mkId(), kind: 'user', text: msg,
        attachments: att.length > 0 ? att.map(a => ({ preview: a.preview, mimeType: a.mimeType, name: a.name, isImage: a.isImage })) : undefined,
      }])
      setActiveSessionId(null)
    } else {
      setThread(prev => prev.filter(i => i.kind !== 'engage_plan'))
    }

    setSessionStatus(isApproval ? 'executing' : 'planning')
    setAgentRoster({})
    setSessionAgents([])
    synthesisIdRef.current  = null
    synthesisTextRef.current = ''

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    await ensureAuthCookie()

    try {
      const res = await fetch('/api/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          ventureName: venture,
          ventureSlug: ventureSlug || undefined,
          repoMode,
          localRepoPath: repoMode === 'local' && localRepoPath ? localRepoPath : undefined,
          githubContext: githubContext || undefined,
          files: att.length > 0 ? att.map(a => ({ base64: a.base64, mimeType: a.mimeType, name: a.name, isImage: a.isImage })) : undefined,
          conversationHistory: conversationHistory.slice(-2),
          sessionId: currentSessionIdRef.current ?? undefined,
          ...(isApproval ? {
            approved: true,
            previousPlan: approvalData.plan,
            previousRouting: approvalData.routing,
          } : {}),
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
          if (raw === '[DONE]') { setSessionStatus(prev => prev === 'awaiting_approval' ? 'awaiting_approval' : 'complete'); continue }

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
                setThread(prev => [...prev, { id: mkId(), kind: 'plan', objective: p.objective, order: p.order, agents: p.agents as AgentId[] }])
              }
              setSessionStatus('executing')
              break
            }
            case 'agent_start': {
              setAgentRoster(prev => ({ ...prev, [evt.agentId]: 'working' }))
              setThread(prev => [...prev, { id: mkId(), kind: 'agent', agentId: evt.agentId as AgentId, task: evt.task ?? '', status: 'working', expanded: false, startedAt: Date.now(), tools: [] }])
              break
            }
            case 'agent_complete': {
              setAgentRoster(prev => ({ ...prev, [evt.agentId]: 'done' }))
              setThread(prev => updateLastAgent(prev, evt.agentId as AgentId, { status: 'done', endedAt: Date.now(), output: evt.previewText }))
              break
            }
            case 'agent_error': {
              setAgentRoster(prev => ({ ...prev, [evt.agentId]: 'error' }))
              setThread(prev => updateLastAgent(prev, evt.agentId as AgentId, { status: 'error', endedAt: Date.now() }))
              break
            }
            case 'retry': {
              setAgentRoster(prev => ({ ...prev, [evt.agentId]: 'retrying' }))
              setThread(prev => updateLastAgent(prev, evt.agentId as AgentId, { status: 'retrying' }))
              break
            }
            case 'tool_call_start': {
              const id = (evt.tool_use_id as string) || `${evt.agentId}-${Date.now()}`
              setThread(prev => patchLastAgentTools(prev, evt.agentId as AgentId, tools => [...tools, { id, name: evt.tool as string, input: evt.input, startedAt: Date.now() }]))
              break
            }
            case 'tool_call_result': {
              const id = evt.tool_use_id as string
              setThread(prev => patchLastAgentTools(prev, evt.agentId as AgentId, tools =>
                tools.map(t => t.id === id ? { ...t, endedAt: Date.now(), summary: evt.summary as string, isError: !!evt.is_error } : t),
              ))
              break
            }
            case 'tool_iteration': break
            case 'github_snapshot': {
              setSnapshot({ repo: evt.repo, branch: evt.branch, openIssues: evt.openIssues, error: evt.error })
              break
            }
            case 'engine': {
              setEngineInfo({ engine: evt.engine, fastModel: evt.fastModel, synthesisModel: evt.synthesisModel })
              break
            }
            case 'text': {
              setSessionStatus('synthesizing')
              if (!synthesisIdRef.current) {
                const sid = mkId()
                synthesisIdRef.current  = sid
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
            case 'plan_approval_required': {
              // ⛔ WORKFLOW RULE 4 — DO NOT REMOVE. See app/api/team-chat/route.ts for full comment.
              // Phase 1 complete — show ENGAGE+PLAN card and wait for user approval
              const planData    = evt.plan    as import('@/lib/types').ExecutionPlan
              const routingData = evt.routing as import('@/lib/types').RoutingResult
              setThread(prev => [...prev, { id: mkId(), kind: 'engage_plan', originalMessage: msg, plan: planData, routing: routingData }])
              setSessionStatus('awaiting_approval')
              break
            }
            case 'plan_complete': {
              setSessionStatus(prev => prev === 'awaiting_approval' ? 'awaiting_approval' : 'complete')
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
            case 'session_id': {
              // Store the DB plan ID — reused for all follow-up messages in this conversation
              if (!currentSessionIdRef.current) {
                currentSessionIdRef.current = evt.sessionId as string
                setActiveSessionId(evt.sessionId as string)
              }
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
        if (!hadText) setThread(prev => [...prev, { id: mkId(), kind: 'error', message: String(err) }])
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
  }, [input, attachments, venture, ventureSlug, githubContext, conversationHistory, sessionStatus, loadHistory])

  const reset = () => {
    abortRef.current?.abort()
    setThread([]); setAgentRoster({}); setSessionAgents([])
    setInput(''); setAttachments([]); setSessionStatus('idle')
    setConversationHistory([]); setActiveSessionId(null); setSlashOpen(false)
    synthesisIdRef.current = null; synthesisTextRef.current = ''
    currentSessionIdRef.current = null
  }

  const applySlash = (cmd: SlashCmd) => {
    setInput(cmd.prompt)
    setSlashOpen(false)
    textareaRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    if (val.startsWith('/')) {
      const q = val.slice(1).toLowerCase()
      const filtered = slashCommands.filter(c => c.cmd.slice(1).startsWith(q) || c.label.toLowerCase().includes(q))
      setSlashFiltered(filtered.length > 0 ? filtered : slashCommands)
      setSlashOpen(true); setSlashIdx(0)
    } else {
      setSlashOpen(false)
    }
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx(i => Math.min(i + 1, slashFiltered.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSlashIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); applySlash(slashFiltered[slashIdx]); return }
      if (e.key === 'Escape') { setSlashOpen(false); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void run() }
    if (e.key === 'Escape') { abortRef.current?.abort(); setSessionStatus('error') }
  }

  const isRunning = sessionStatus === 'planning' || sessionStatus === 'executing' || sessionStatus === 'synthesizing'
  const now = Date.now()

  const statusLabels: Record<SessionStatus, string> = {
    idle: '', planning: 'Planning…', awaiting_approval: 'Awaiting approval',
    executing: 'Agents working', synthesizing: 'Synthesizing…', complete: '', error: 'Error',
  }

  return (
    <main style={{ height: '100vh', padding: '84px 10px 10px', display: 'flex', gap: 10, overflow: 'hidden', background: 'transparent', fontFamily: "'Inter',-apple-system,sans-serif" }}>

      {/* ── History sidebar ──────────────────────────────────────────────────── */}
      <HistorySidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(p => !p)}
        onNew={reset}
        records={history}
        loading={historyLoading}
        onLoad={loadSessionIntoThread}
        activeSessionId={activeSessionId}
      />

      {/* ── Main column ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', minWidth: 0 }}>

        {/* All 13 agents as horizontal pills */}
        <AgentsBar sessionAgents={sessionAgents} agentRoster={agentRoster} />

        {/* Status bar — G1 Clear Ice — detached floating */}
        <div style={{ ...G1, borderRadius: 12, padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
          <GithubStatusPill status={repoStatus} label={snapshot?.repo ?? repoLabel} branch={snapshot?.branch ?? null} openIssues={snapshot?.openIssues ?? null} snapshotError={snapshot?.error ?? null} />
          {engineInfo && <EnginePill engine={engineInfo.engine} fastModel={engineInfo.fastModel} synthesisModel={engineInfo.synthesisModel} />}

          {/* Repo mode toggle */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(12,44,82,0.15)', flexShrink: 0 }}>
            {(['github', 'local'] as const).map(mode => {
              const active = repoMode === mode
              return (
                <button key={mode} onClick={() => { setRepoMode(mode); localStorage.setItem('yvon_war_room_repo_mode', mode) }} title={mode === 'local' ? (localRepoPath || 'Set local path in Venture Settings → Profile') : 'Use GitHub API'}
                  style={{ padding: '3px 9px', fontSize: 10, fontWeight: active ? 700 : 500, background: active ? (mode === 'local' ? 'rgba(224,117,71,0.14)' : 'rgba(0,102,204,0.12)') : 'transparent', color: active ? (mode === 'local' ? '#cc7840' : '#0066cc') : ink.navy, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.12s', opacity: mode === 'local' && !localRepoPath ? 0.5 : 1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{mode === 'local' ? 'folder' : 'cloud'}</span>
                  {mode === 'github' ? 'GitHub' : 'Local'}
                </button>
              )
            })}
          </div>

          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: ink.navy, fontWeight: 800, letterSpacing: '0.02em' }}>{venture}</span>
          {sessionStatus !== 'idle' && sessionStatus !== 'complete' && statusLabels[sessionStatus] && (
            <span style={{ fontSize: 11, fontWeight: 800, color: sessionStatus === 'error' ? '#991b1b' : sessionStatus === 'awaiting_approval' ? '#7c2d12' : ink.navy }}>
              {statusLabels[sessionStatus]}
            </span>
          )}
          {isRunning && (
            <button
              onClick={() => { abortRef.current?.abort(); setSessionStatus('idle') }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7f1d1d', fontWeight: 700, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>stop_circle</span>
              Stop
            </button>
          )}
          {thread.length > 0 && !isRunning && (
            <>
              <button onClick={clearChat} title="Clear all messages" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7c1d1d', fontWeight: 600, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>delete_sweep</span>
                Clear
              </button>
              <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: ink.navy, fontWeight: 600, background: 'rgba(8,16,36,0.10)', border: '1px solid rgba(12,44,82,0.25)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>restart_alt</span>
                New
              </button>
            </>
          )}
        </div>

        {/* ── Single unified G4 glass card — thread + input together ─────── */}
        <div style={{ ...G4, borderRadius: 20, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.14)' }}>

          {/* Thread scroll area — transparent; each component carries its own background */}
          <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.10) transparent' }}>
            {thread.length === 0 ? (
              /* Empty state — vertically centered, uses dark text on the G4 light card */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', minHeight: 280, padding: '32px 24px 24px' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.55)', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <span style={{ fontSize: 26 }}>👑</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: ink.navy, margin: '0 0 8px', letterSpacing: '-0.02em' }}>War Room</h2>
                <p style={{ fontSize: 13, color: ink.navy, opacity: 0.65, maxWidth: 360, lineHeight: 1.65, margin: '0 0 22px' }}>
                  Send a request and Marcus will route it to the right agents, then synthesize a{' '}
                  <span style={{ color: ACCENT, fontWeight: 600 }}>unified</span> executive response.{' '}
                  <span style={{ color: ACCENT, fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>/</span> for quick commands.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {QUICK_PROMPTS.map(q => (
                    <button key={q.label} onClick={() => { setInput(q.prompt); textareaRef.current?.focus() }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.60)', fontSize: 12, color: ink.navy, cursor: 'pointer', fontWeight: 500, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, opacity: 0.75 }}>{q.icon}</span>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {thread.map(item => {
                  const deletable = !isRunning && (item.kind === 'user' || item.kind === 'synthesis' || item.kind === 'agent' || item.kind === 'error')
                  const wrapper = (child: React.ReactNode) => (
                    <div key={item.id} style={{ position: 'relative' }} className="group">
                      {child}
                      {deletable && (
                        <button
                          onClick={() => deleteMessage(item.id)}
                          title="Delete message"
                          style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 6, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s', fontSize: 12 }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                        </button>
                      )}
                    </div>
                  )
                  switch (item.kind) {
                    case 'user':         return wrapper(<UserBubble key={item.id} item={item} />)
                    case 'plan':         return <PlanBanner key={item.id} item={item} />
                    case 'engage_plan':  return (
                      <EngagePlanCard key={item.id} item={item}
                        onApprove={() => void run({ originalMessage: item.originalMessage, plan: item.plan, routing: item.routing })}
                        onCancel={() => { setThread(prev => prev.filter(i => i.kind !== 'engage_plan')); setSessionStatus('idle') }}
                      />
                    )
                    case 'agent':        return wrapper(<AgentCard key={item.id} item={item} onToggle={() => toggleAgentExpand(item.id)} now={now} />)
                    case 'synthesis':    return wrapper(<SynthesisBubble key={item.id} item={item} onCopy={() => handleCopy(item.id, item.text)} copied={copiedId === item.id} />)
                    case 'error':        return wrapper(<ErrorCard key={item.id} item={item} />)
                  }
                })}
              </div>
            )}
          </div>

          {/* Input section — always pinned to bottom */}
          <div style={{ flexShrink: 0, padding: '12px 16px 16px', borderTop: thread.length > 0 ? '1px solid rgba(255,255,255,0.20)' : 'none' }}>

            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {attachments.map((att, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.40)', maxWidth: 220 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.20)' }}>
                      {att.isImage && att.preview
                        ? <Image src={att.preview} alt="" width={28} height={28} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span className="material-symbols-outlined" style={{ fontSize: 16, color: ink.navy, opacity: 0.65 }}>description</span>
                      }
                    </div>
                    <p style={{ fontSize: 11, color: ink.navy, margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{att.name}</p>
                    <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} style={{ color: ink.navy, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.50, flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              {slashOpen && <SlashPicker commands={slashFiltered} activeIdx={slashIdx} onSelect={applySlash} />}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '8px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.28)', border: `1px solid ${input ? 'rgba(12,44,82,0.35)' : 'rgba(255,255,255,0.60)'}`, transition: 'border-color 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <button onClick={() => fileInputRef.current?.click()} title="Attach image" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: ink.navy, opacity: 0.55 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
                </button>
                <input ref={fileInputRef} type="file" accept="*" multiple style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = '' }} />

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isRunning}
                  placeholder={isRunning ? 'Working…' : 'Message the War Room… (/ for commands)'}
                  rows={1}
                  style={{ flex: 1, minHeight: 34, maxHeight: 160, background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: 14, color: ink.navy, lineHeight: 1.6, fontFamily: 'inherit', padding: '3px 0', opacity: isRunning ? 0.5 : 1 }}
                />

                <button
                  onClick={() => void run()}
                  disabled={isRunning || !input.trim()}
                  style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: input.trim() && !isRunning ? ACCENT : 'rgba(255,255,255,0.20)', border: 'none', cursor: input.trim() && !isRunning ? 'pointer' : 'default', color: input.trim() && !isRunning ? '#fff' : ink.navy, transition: 'background 0.15s', opacity: isRunning ? 0.5 : 1 }}
                >
                  <span className={`material-symbols-outlined${isRunning ? ' animate-spin' : ''}`} style={{ fontSize: 15 }}>{isRunning ? 'progress_activity' : 'arrow_upward'}</span>
                </button>
              </div>

              <p style={{ fontSize: 10, color: ink.plum, textAlign: 'center', margin: '5px 0 0', fontWeight: 600, opacity: 0.70 }}>
                Enter to send · Shift+Enter for newline · / for commands · Esc to stop
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
