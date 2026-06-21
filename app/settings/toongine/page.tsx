'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, StatusBadge } from '@/components/ui'
import { ArrowLeft, Bot, Flame, Brain, Cpu } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AgentInfo {
  name: string; role: string; department: string; status: string
  skillsCount: number; memoryHealth: number
}

interface ToonOSData {
  initialized: boolean; venture: string; agentsTotal: number
  departments: { name: string; agentCount: number }[]
  checks: { agents: boolean; graphify: boolean; codegraph: boolean; claudeMD: boolean }
  graphs: { graphify: string; codegraph: string }
  agents: AgentInfo[]
  hourlyBurn: { hour: string; tokens: number; cost: number }[]
  kpi: any
}

type TabId = 'burn' | 'agents' | 'health'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

// ─── Sub-Tab Bar ─────────────────────────────────────────────────────────────
function Tabs({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  const items: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'burn', label: 'Token Burn', icon: <Flame size={13} /> },
    { id: 'agents', label: 'Agents & Memory', icon: <Brain size={13} /> },
    { id: 'health', label: 'Health Metrics', icon: <Cpu size={13} /> },
  ]
  return (
    <div className="flex gap-1 border-b border-white/[0.06] mb-4 overflow-x-auto no-scrollbar">
      {items.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold whitespace-nowrap border-b-2 transition ${
            tab === t.id ? 'border-current' : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
          style={tab === t.id ? { borderColor: 'var(--ws-accent)', color: 'var(--ws-accent)' } : {}}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Mock data generators (replace with real API data when live) ───────────
function mockHourlyBurn() {
  const hours = ['00','02','04','06','08','10','12','14','16','18','20','22']
  const heights = [12,8,5,3,18,42,65,88,100,72,45,28]
  return hours.map((h, i) => ({ hour: h, tokens: Math.round(heights[i] * 8472), cost: heights[i] * 0.0423 }))
}

function mockActiveTasks() {
  return [
    { agent: 'Raj', task: 'Fix Supabase RLS policy migration', tokens: 12400, cost: 0.062, color: '#00d4ff' },
    { agent: 'Marcus', task: 'Hourbour pricing strategy review', tokens: 8700, cost: 0.044, color: '#8b5cf6' },
    { agent: 'Dev', task: 'Merge toongine v1.5.5 release', tokens: 3200, cost: 0.016, color: '#00d4ff' },
    { agent: 'Kai', task: 'Instagram trend scrape', tokens: 2800, cost: 0.014, color: '#4a5568' },
    { agent: 'Diana', task: 'Sprint board update — Phase 4', tokens: 1100, cost: 0.006, color: '#4a5568' },
  ]
}

function mockExpensiveTasks() {
  return [
    { agent: 'Raj', task: 'Full schema migration + RLS rewrite', cost: 1.24, efficiency: 99.2, color: '#00d4ff' },
    { agent: 'Marcus', task: 'War Room — Q3 strategy synthesis', cost: 0.98, efficiency: 99.1, color: '#8b5cf6' },
    { agent: 'Kai', task: 'Competitor deep-dive (12 competitors)', cost: 0.74, efficiency: 99.5, color: '#f59e0b' },
    { agent: 'Depth', task: 'TOON V4 architecture research paper', cost: 0.62, efficiency: 99.3, color: '#34d399' },
    { agent: 'Dev', task: 'Cross-repo refactor — 47 files', cost: 0.51, efficiency: 98.8, color: '#00d4ff' },
  ]
}

function mockCostByDept() {
  return [
    { dept: 'Technical', cost: 1.48, pct: 35, color: '#00d4ff' },
    { dept: 'CEO', cost: 0.93, pct: 22, color: '#8b5cf6' },
    { dept: 'Marketing', cost: 0.76, pct: 18, color: '#f59e0b' },
    { dept: 'Research', cost: 0.51, pct: 12, color: '#34d399' },
    { dept: 'Finance', cost: 0.30, pct: 7, color: '#ef4444' },
    { dept: 'Legal', cost: 0.21, pct: 5, color: '#ec4899' },
  ]
}

function mockWeeklyTrend() {
  return [
    { day: 'Mon', pct: 45 }, { day: 'Tue', pct: 62 }, { day: 'Wed', pct: 38 },
    { day: 'Thu', pct: 80 }, { day: 'Fri', pct: 55 }, { day: 'Sat', pct: 20 }, { day: 'Sun', pct: 10 },
  ]
}

function mockEfficiency() {
  return [
    { agent: 'Raj', tokens: 124000, cost: 0.62, efficiency: 99.97 },
    { agent: 'Dev', tokens: 98000, cost: 0.49, efficiency: 99.96 },
    { agent: 'Mia', tokens: 82000, cost: 0.41, efficiency: 99.95 },
    { agent: 'Marcus', tokens: 210000, cost: 1.05, efficiency: 99.94 },
    { agent: 'Quinn', tokens: 45000, cost: 0.23, efficiency: 99.92 },
  ]
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ToonGineOSPage() {
  const [toonOS, setToonOS] = useState<ToonOSData | null>(null)
  const [tab, setTab] = useState<TabId>('burn')
  const [period, setPeriod] = useState<'daily'|'weekly'|'monthly'>('daily')

  useEffect(() => {
    fetch('/api/ventures-health')
      .then(r => r.json()).then(d => setToonOS(d)).catch(() => {})
  }, [])

  const hourlyBurn = toonOS?.hourlyBurn?.length ? toonOS.hourlyBurn : mockHourlyBurn()
  const activeTasks = mockActiveTasks()
  const expensiveTasks = mockExpensiveTasks()
  const costByDept = mockCostByDept()
  const weeklyTrend = mockWeeklyTrend()
  const efficiency = mockEfficiency()
  const maxHour = Math.max(...hourlyBurn.map(h => h.tokens), 1)

  return (
    <div>
      <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3">
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--ws-accent-soft)' }}>
          <Bot size={20} style={{ color: 'var(--ws-accent)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-on-surface">ToonGine OS</h1>
          <p className="text-[12px] text-on-surface-variant">
            {toonOS?.initialized ? `${toonOS.agentsTotal} agents · ${toonOS.departments.length} departments` : 'Not initialized'}
          </p>
        </div>
        <StatusBadge tone={toonOS?.initialized ? 'green' : 'yellow'}>
          {toonOS?.initialized ? 'Active' : 'Init needed'}
        </StatusBadge>
      </div>

      <Tabs tab={tab} onChange={setTab} />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TOKEN BURN */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {tab === 'burn' && (
        <div>
          {/* Page subtitle */}
          <p className="text-[12px] text-on-surface-variant mb-4">
            Real-time token consumption · Cost tracking · Provider health · Efficiency analytics
          </p>

          {/* Period Selector */}
          <div className="inline-flex gap-0.5 mb-4 bg-white/[0.03] border border-white/[0.05] rounded-lg p-0.5">
            {(['daily','weekly','monthly'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md text-[11px] font-semibold capitalize transition ${
                  period === p ? 'bg-white/10 text-on-surface' : 'text-on-surface-variant/60 hover:text-on-surface-variant'
                }`}>
                {p}
              </button>
            ))}
          </div>

          {/* ── KPI Row ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
            <Card className="p-3">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1.5">Tokens Burned Today</div>
              <div className="text-2xl font-bold text-on-surface" style={{ color: 'var(--ws-accent)' }}>847.2K</div>
              <div className="text-[10px] text-red-400 mt-0.5">↑ 12% vs yesterday</div>
            </Card>
            <Card className="p-3">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1.5">Cost Today</div>
              <div className="text-2xl font-bold text-on-surface">$4.23</div>
              <div className="text-[10px] text-red-400 mt-0.5">↑ $0.51 vs yesterday</div>
            </Card>
            <Card className="p-3">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1.5">Active Agents</div>
              <div className="text-2xl font-bold text-emerald-400">8</div>
              <div className="text-[10px] text-on-surface-variant/50 mt-0.5">3 working now</div>
            </Card>
            <Card className="p-3">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1.5">Avg Tokens / Task</div>
              <div className="text-2xl font-bold text-on-surface">4.2K</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">↓ 8% more efficient</div>
            </Card>
            <Card className="p-3">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1.5">TOON Savings</div>
              <div className="text-2xl font-bold text-emerald-400">99.97%</div>
              <div className="text-[10px] text-on-surface-variant/50 mt-0.5">$224.93 saved today</div>
            </Card>
          </div>

          {/* ── Chart Row: Token Burn + Cost by Department ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 mb-4">
            {/* Token Burn Hourly */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">Token Burn · Hourly</span>
                <span className="text-[10px] text-on-surface-variant/40">Today</span>
              </div>
              <div className="flex items-end gap-[3px] h-28">
                {hourlyBurn.map(h => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="w-full rounded-t-sm transition-all" style={{
                      height: `${Math.max(2, (h.tokens / maxHour) * 100)}%`,
                      background: 'linear-gradient(180deg, var(--ws-accent), rgba(99,102,241,0.15))',
                      minHeight: 2,
                    }} />
                    <span className="text-[8px] text-on-surface-variant/40 mt-1">{h.hour}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant/40">
                <span>Peak: 14:00–16:00 · 847K tokens</span>
                <span>Agents active: 8</span>
              </div>
            </Card>

            {/* Cost by Department */}
            <Card className="p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-3">Cost by Department</div>
              <div className="space-y-2.5">
                {costByDept.map(d => (
                  <div key={d.dept} className="flex items-center gap-2.5">
                    <span className="text-[11px] text-on-surface-variant w-16 text-right shrink-0">{d.dept}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
                    </div>
                    <span className="text-[11px] font-semibold text-on-surface w-12 text-right shrink-0">${d.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Task Tables ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            {/* Active Tasks */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">Active Tasks · Right Now</span>
                <span className="text-[9px] text-emerald-400">● 3 running</span>
              </div>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_2fr_1fr_0.8fr] gap-2 text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/40 pb-2 border-b border-white/[0.04] mb-2">
                <span>Agent</span><span>Task</span><span>Tokens</span><span>Cost</span>
              </div>
              {activeTasks.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_1fr_0.8fr] gap-2 text-[11px] py-1.5 border-b border-white/[0.02] last:border-0">
                  <span className="font-semibold text-on-surface" style={{ color: t.color }}>{t.agent}</span>
                  <span className="text-on-surface-variant truncate">{t.task}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant/60">{formatTokens(t.tokens)}</span>
                  <span className="font-semibold font-mono text-[10px] text-on-surface">${t.cost.toFixed(3)}</span>
                </div>
              ))}
            </Card>

            {/* Most Expensive */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">Most Expensive · This Week</span>
                <select className="bg-white/[0.03] border border-white/[0.08] rounded-md text-[10px] text-on-surface-variant px-2 py-1">
                  <option>Cost ↓</option><option>Tokens ↓</option><option>Duration ↓</option>
                </select>
              </div>
              <div className="grid grid-cols-[1fr_2fr_0.8fr_0.8fr] gap-2 text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/40 pb-2 border-b border-white/[0.04] mb-2">
                <span>Agent</span><span>Task</span><span>Cost</span><span>Efficiency</span>
              </div>
              {expensiveTasks.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_0.8fr_0.8fr] gap-2 text-[11px] py-1.5 border-b border-white/[0.02] last:border-0">
                  <span className="font-semibold text-on-surface" style={{ color: t.color }}>{t.agent}</span>
                  <span className="text-on-surface-variant truncate">{t.task}</span>
                  <span className="font-semibold font-mono text-[10px] text-amber-400">${t.cost.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{t.efficiency}%</span>
                </div>
              ))}
            </Card>
          </div>

          {/* ── Provider Health ─────────────────────────────────── */}
          <Card className="p-4 mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-3">Provider Health & Credits</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* DeepSeek - Current */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold" style={{ color: 'var(--ws-accent)' }}>DeepSeek</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/10 text-on-surface">Current</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-on-surface-variant/60">Credits used</span><span className="text-on-surface">$18.42</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/60">Credits remaining</span><span className="text-emerald-400">$31.58</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/60">Total balance</span><span className="text-on-surface">$50.00</span></div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden my-2.5">
                  <div className="h-full rounded-full" style={{ width: '37%', background: 'linear-gradient(90deg, var(--ws-accent), #34d399)' }} />
                </div>
                <div className="flex justify-between text-[9px] text-on-surface-variant/40 mb-3">
                  <span>Used 37%</span><span>$31.58 left</span>
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-on-surface-variant/50">Avg cost / 1K tok</span><span className="font-mono text-on-surface">$0.00014</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/50">Efficiency (TOON)</span><span className="text-emerald-400">99.97%</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/50">Uptime</span><span className="text-emerald-400">99.9%</span></div>
                </div>
              </div>

              {/* Anthropic - Previous */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 opacity-60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold text-purple-400">Anthropic</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-500/10 text-purple-400">Previous</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-on-surface-variant/60">Total spent</span><span className="text-on-surface">$224.91</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/60">Tokens used</span><span className="font-mono text-on-surface">4.2M</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/60">Avg cost / 1K tok</span><span className="font-mono text-on-surface">$0.01500</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/60">Efficiency (TOON)</span><span className="text-on-surface">99.91%</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant/60">Switched on</span><span className="text-on-surface">Jun 2, 2026</span></div>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 border-t border-white/[0.04] text-[10px] text-on-surface-variant/50">
              <span>Cost reduction (Anthropic → DeepSeek): <span className="text-emerald-400 font-bold">↓ 99.07%</span></span>
              <span>Savings this month: <span className="text-emerald-400 font-bold">$220.68</span></span>
              <span>Days until credit exhaustion: <span className="text-on-surface font-bold">187 days</span></span>
            </div>
          </Card>

          {/* ── Bottom Row: Weekly Trend + Efficiency ──────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Weekly Cost Trend */}
            <Card className="p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-3">Weekly Cost Trend</div>
              <div className="flex items-end gap-[3px] h-20">
                {weeklyTrend.map(d => (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="w-full rounded-t-sm" style={{
                      height: `${d.pct}%`,
                      background: 'var(--ws-accent)',
                      minHeight: 2,
                    }} />
                    <span className="text-[8px] text-on-surface-variant/40 mt-1">{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-on-surface-variant/40 mt-2">Avg daily: $3.89 · Weekend avg: $0.54</div>
            </Card>

            {/* Agent Efficiency Leaderboard */}
            <Card className="p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-3">Agent Efficiency Leaderboard</div>
              <div className="grid grid-cols-[1fr_1fr_0.8fr_1fr] gap-2 text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/40 pb-2 border-b border-white/[0.04] mb-2">
                <span>Agent</span><span>Tokens</span><span>Cost</span><span>Efficiency</span>
              </div>
              {efficiency.map((e, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_0.8fr_1fr] gap-2 text-[11px] py-1.5 border-b border-white/[0.02] last:border-0">
                  <span className="font-semibold text-on-surface">{e.agent}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant/60">{formatTokens(e.tokens)}</span>
                  <span className="font-semibold font-mono text-[10px] text-on-surface">${e.cost.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{e.efficiency}%</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AGENTS & MEMORY */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {tab === 'agents' && (
        <div>
          <p className="text-[12px] text-on-surface-variant mb-4">Agent roster with memory health monitoring</p>

          {/* Department summary */}
          {toonOS?.initialized && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
              {(toonOS.departments || []).map(d => (
                <Card key={d.name} className="p-3 text-center">
                  <div className="text-lg font-bold text-on-surface">{d.agentCount}</div>
                  <div className="text-[10px] text-on-surface-variant/50">{d.name}</div>
                </Card>
              ))}
            </div>
          )}

          {/* Agent list with memory bars */}
          <div className="space-y-1.5">
            {toonOS?.initialized && toonOS.agents.length > 0 ? toonOS.agents.map((a, i) => {
              const health = a.memoryHealth || Math.floor(Math.random() * 40 + 40)
              const color = health > 70 ? '#34d399' : health > 40 ? '#fbbf24' : '#f87171'
              return (
                <Card key={`${a.name}-${i}`} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-on-surface font-medium">{a.name}</div>
                      <div className="text-[10px] text-on-surface-variant/50">{a.department} · {a.skillsCount} skills</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-28 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${health}%`, background: color }} />
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant w-8 text-right">{health}%</span>
                    </div>
                    <StatusBadge tone={a.status === 'active' ? 'green' : 'yellow'}>{a.status}</StatusBadge>
                  </div>
                </Card>
              )
            }) : (
              <Card className="p-8 text-center">
                <Brain size={28} className="text-on-surface-variant/20 mx-auto mb-3" />
                <p className="text-[13px] text-on-surface-variant/60">
                  {toonOS?.initialized ? 'Agent data loading...' : 'Run npx toongine init to deploy agents'}
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HEALTH METRICS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {tab === 'health' && (
        <div>
          <p className="text-[12px] text-on-surface-variant mb-4">System checks · Department health · Graph build status</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-3">System Checks</div>
              <div className="space-y-2.5">
                {[
                  { label: 'Agents Directory', ok: toonOS?.checks?.agents },
                  { label: 'CLAUDE.md Present', ok: toonOS?.checks?.claudeMD },
                  { label: 'Graphify Built', ok: toonOS?.checks?.graphify },
                  { label: 'Codegraph Built', ok: toonOS?.checks?.codegraph },
                ].map((check, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[12px] text-on-surface-variant">{check.label}</span>
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${check.ok ? 'bg-emerald-400/10 text-emerald-400' : 'border border-white/10 text-on-surface-variant/30'}`}>
                      {check.ok ? '✓' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-3">Graph Sizes</div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-on-surface-variant">Graphify</span>
                    <span className="text-on-surface font-mono">{toonOS?.graphs?.graphify || 'not built'}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400/60" style={{ width: toonOS?.checks?.graphify ? '100%' : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-on-surface-variant">Codegraph</span>
                    <span className="text-on-surface font-mono">{toonOS?.graphs?.codegraph || 'not built'}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400/60" style={{ width: toonOS?.checks?.codegraph ? '100%' : '0%' }} />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-3">Department Health</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {(toonOS?.departments || []).map(d => (
                  <div key={d.name} className="p-3 rounded-lg bg-white/[0.02] text-center">
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-emerald-400/60" style={{ width: '100%' }} />
                    </div>
                    <div className="text-[12px] font-semibold text-on-surface">{d.name}</div>
                    <div className="text-[10px] text-on-surface-variant/50">{d.agentCount} agents</div>
                  </div>
                ))}
                {(toonOS?.departments?.length || 0) === 0 && (
                  <p className="text-[11px] text-on-surface-variant/40 col-span-full text-center py-4">No department data</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
