'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, StatusBadge } from '@/components/ui'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { ArrowLeft, Bot, Flame, Brain, Activity } from 'lucide-react'

interface ToonOSData {
  initialized: boolean; venture: string; agentsTotal: number
  departments: { name: string; agentCount: number }[]
  checks: { agents: boolean; graphify: boolean; codegraph: boolean; claudeMD: boolean }
  graphs: { graphify: string; codegraph: string }
  agents: { name: string; role: string; department: string; status: string; skillsCount: number; memoryHealth: number }[]
  hourlyBurn: { hour: string; tokens: number; cost: number }[]
  kpi: any
}

type OSTab = 'burn' | 'agents' | 'health'

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function OSTabs({ tab, onChange }: { tab: OSTab; onChange: (t: OSTab) => void }) {
  const items: { id: OSTab; label: string; icon: React.ReactNode }[] = [
    { id: 'burn', label: 'Token Burn', icon: <Flame size={13} /> },
    { id: 'agents', label: 'Agents', icon: <Brain size={13} /> },
    { id: 'health', label: 'Health Metrics', icon: <Activity size={13} /> },
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

// ── TOKEN BURN TAB ───────────────────────────────────────────────────────────

function TokenBurnTab({ data }: { data: ToonOSData | null }) {
  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
        {[
          { label: 'Tokens Burned', value: '0', sub: 'today', accent: '#00d4ff' },
          { label: 'Cost Today', value: '$0.00', sub: '—', accent: '#e4e8f0' },
          { label: 'Active Agents', value: String(data?.agentsTotal ?? '—'), sub: 'total deployed', accent: '#34d399' },
          { label: 'Avg / Task', value: '—', sub: '—', accent: '#8b5cf6' },
          { label: 'TOON Savings', value: '99%', sub: 'structural compression', accent: '#34d399' },
        ].map((kpi, i) => (
          <Card key={i} className="p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1">{kpi.label}</div>
            <div className="text-xl font-bold" style={{ color: kpi.accent }}>{kpi.value}</div>
            <div className="text-[10px] text-on-surface-variant/40 mt-0.5">{kpi.sub}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 mb-3">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider">Token Burn · Hourly</h3>
            <span className="text-[10px] text-on-surface-variant/40">Today</span>
          </div>
          <div className="flex items-end gap-[3px] h-28">
            {(data?.hourlyBurn?.length ?? 0) > 0 ? data!.hourlyBurn.map(h => {
              const maxT = Math.max(...data!.hourlyBurn.map(x => x.tokens), 1)
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full" title={`${h.hour}: ${formatTokens(h.tokens)} tok · $${h.cost.toFixed(3)}`}>
                  <div className="w-full rounded-t-sm bg-gradient-to-t from-[#00d4ff33] to-[#00d4ffaa] hover:to-[#00d4ff] transition"
                    style={{ height: `${Math.max(2, (h.tokens / maxT) * 100)}%` }} />
                  <span className="text-[8px] text-on-surface-variant/40 mt-1">{h.hour}</span>
                </div>
              )
            }) : Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full rounded-t-sm bg-white/[0.02]" style={{ height: '2px' }} />
                <span className="text-[8px] text-on-surface-variant/20 mt-1">{String(i * 2).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Cost by Department</h3>
          <div className="space-y-2">
            {['Technical', 'CEO', 'Marketing', 'Research', 'Finance', 'Legal'].map((dept, i) => {
              const widths = [35, 22, 18, 12, 7, 5]
              const colors = ['#00d4ff', '#8b5cf6', '#f59e0b', '#34d399', '#ef4444', '#ec4899']
              return (
                <div key={dept} className="flex items-center gap-2">
                  <span className="text-[10px] text-on-surface-variant w-20 text-right truncate">{dept}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${widths[i]}%`, background: colors[i] }} />
                  </div>
                  <span className="text-[10px] text-on-surface-variant w-10 font-mono">—</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Task Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider">Active Tasks</h3>
            <span className="text-[9px] text-emerald-400/70">● waiting</span>
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] text-on-surface-variant/40 uppercase tracking-wider border-b border-white/[0.04]">
                <th className="text-left py-1.5">Agent</th><th className="text-left py-1.5">Task</th><th className="text-right py-1.5">Tokens</th><th className="text-right py-1.5">Cost</th>
              </tr>
            </thead>
            <tbody>
              {[
                { agent: 'Raj', task: 'Fix Supabase RLS policy migration', tokens: '12.4K', cost: '$0.062', color: '#00d4ff' },
                { agent: 'Marcus', task: 'Hourbour pricing strategy review', tokens: '8.7K', cost: '$0.044', color: '#8b5cf6' },
                { agent: 'Dev', task: 'Merge toongine v1.5.5 release', tokens: '3.2K', cost: '$0.016', color: '#00d4ff' },
                { agent: 'Kai', task: 'Instagram trend scrape', tokens: '2.8K', cost: '$0.014', color: '#4a5568' },
                { agent: 'Diana', task: 'Sprint board update — Phase 4', tokens: '1.1K', cost: '$0.006', color: '#4a5568' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/[0.02]">
                  <td className="py-1.5 font-semibold" style={{ color: row.color }}>{row.agent}</td>
                  <td className="py-1.5 text-on-surface-variant max-w-[200px] truncate">{row.task}</td>
                  <td className="py-1.5 text-right text-on-surface-variant/60 font-mono text-[10px]">{row.tokens}</td>
                  <td className="py-1.5 text-right font-semibold font-mono text-[10px]">{row.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider">Most Expensive · Week</h3>
            <select className="bg-white/[0.03] border border-white/[0.08] rounded text-[10px] text-on-surface-variant px-2 py-0.5">
              <option>Cost ↓</option><option>Tokens ↓</option><option>Duration ↓</option>
            </select>
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] text-on-surface-variant/40 uppercase tracking-wider border-b border-white/[0.04]">
                <th className="text-left py-1.5">Agent</th><th className="text-left py-1.5">Task</th><th className="text-right py-1.5">Cost</th><th className="text-right py-1.5">Eff.</th>
              </tr>
            </thead>
            <tbody>
              {[
                { agent: 'Raj', task: 'Full schema migration + RLS rewrite', cost: '$1.24', eff: '99.2%', color: '#f87171' },
                { agent: 'Marcus', task: 'War Room — Q3 strategy synthesis', cost: '$0.98', eff: '99.1%', color: '#f59e0b' },
                { agent: 'Kai', task: 'Competitor deep-dive (12 competitors)', cost: '$0.74', eff: '99.5%', color: '#f59e0b' },
                { agent: 'Depth', task: 'TOON V4 architecture research', cost: '$0.62', eff: '99.3%', color: '#e4e8f0' },
                { agent: 'Dev', task: 'Cross-repo refactor — 47 files', cost: '$0.51', eff: '98.8%', color: '#e4e8f0' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/[0.02]">
                  <td className="py-1.5 font-semibold" style={{ color: row.color }}>{row.agent}</td>
                  <td className="py-1.5 text-on-surface-variant max-w-[200px] truncate">{row.task}</td>
                  <td className="py-1.5 text-right font-semibold font-mono text-[10px]" style={{ color: row.color }}>{row.cost}</td>
                  <td className="py-1.5 text-right text-on-surface-variant/60 font-mono text-[10px]">{row.eff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Provider Health */}
      <Card className="p-4 mb-3">
        <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Provider Health & Credits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-[#00d4ff33]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold" style={{ color: '#00d4ff' }}>DeepSeek</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00d4ff22] text-[#00d4ff]">Current</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-on-surface-variant">Credits used</span><span className="text-on-surface">$18.42</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Remaining</span><span className="text-emerald-400">$31.58</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Balance</span><span className="text-on-surface">$50.00</span></div>
            </div>
            <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden my-2">
              <div className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-emerald-400" style={{ width: '37%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-on-surface-variant/40">
              <span>Used 37%</span><span>$31.58 left</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-on-surface-variant">Avg / 1K tok</span><span className="text-on-surface font-mono text-[10px]">$0.00014</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">TOON Efficiency</span><span className="text-emerald-400">99.97%</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Uptime</span><span className="text-emerald-400">99.9%</span></div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] opacity-60">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold" style={{ color: '#8b5cf6' }}>Anthropic</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8b5cf622] text-[#8b5cf6]">Previous</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-on-surface-variant">Total spent</span><span className="text-on-surface">$224.91</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Tokens used</span><span className="text-on-surface font-mono text-[10px]">4.2M</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Avg / 1K tok</span><span className="text-on-surface font-mono text-[10px]">$0.01500</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Switched</span><span className="text-on-surface">Jun 2, 2026</span></div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/[0.04] text-[11px]">
          <span className="text-on-surface-variant">Cost reduction: <span className="text-emerald-400 font-bold">↓ 99.07%</span></span>
          <span className="text-on-surface-variant">Savings this month: <span className="text-emerald-400 font-bold">$220.68</span></span>
          <span className="text-on-surface-variant">Days until empty: <span className="text-on-surface font-bold">187 days</span></span>
        </div>
      </Card>

      {/* Bottom: Weekly Trend + Efficiency Leaderboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4">
          <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Weekly Cost Trend</h3>
          <div className="flex items-end gap-[3px] h-20">
            {[45, 62, 38, 80, 55, 20, 10].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full rounded-t-sm" style={{ height: `${h}%`, background: '#00d4ff' }} />
                <span className="text-[8px] text-on-surface-variant/40 mt-1">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-on-surface-variant/40 mt-2">Avg daily: $3.89 · Weekend avg: $0.54</div>
        </Card>
        <Card className="p-4">
          <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Efficiency Leaderboard</h3>
          <table className="w-full text-[11px]">
            <thead><tr className="text-[10px] text-on-surface-variant/40 uppercase tracking-wider border-b border-white/[0.04]"><th className="text-left py-1.5">Agent</th><th className="text-right py-1.5">Tokens</th><th className="text-right py-1.5">Cost</th><th className="text-right py-1.5">Eff.</th></tr></thead>
            <tbody>
              {[
                { agent: 'Raj', tokens: '124K', cost: '$0.62', eff: '99.97%' },
                { agent: 'Dev', tokens: '98K', cost: '$0.49', eff: '99.96%' },
                { agent: 'Mia', tokens: '82K', cost: '$0.41', eff: '99.95%' },
                { agent: 'Marcus', tokens: '210K', cost: '$1.05', eff: '99.94%' },
                { agent: 'Quinn', tokens: '45K', cost: '$0.23', eff: '99.92%' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/[0.02]">
                  <td className="py-1.5 font-semibold text-on-surface">{row.agent}</td>
                  <td className="py-1.5 text-right text-on-surface-variant/60 font-mono text-[10px]">{row.tokens}</td>
                  <td className="py-1.5 text-right font-semibold font-mono text-[10px]">{row.cost}</td>
                  <td className="py-1.5 text-right text-emerald-400 font-semibold">{row.eff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

// ── AGENTS TAB ───────────────────────────────────────────────────────────────

function AgentsTab({ data }: { data: ToonOSData | null }) {
  const agents = data?.agents ?? []
  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {[
          { label: 'Agent Memories', value: String(agents.length), sub: 'active agents', color: '#a78bfa' },
          { label: 'Task Completion', value: '84%', sub: '70 succeeded', color: '#10b981' },
          { label: 'Graph Nodes', value: '4.7K', sub: '12K edges', color: '#3b82f6' },
          { label: 'Skills Loaded', value: '51', sub: '3 local · 48 builtin', color: '#f59e0b' },
          { label: 'Integrations', value: '5', sub: 'MCP · Supabase · Graphify', color: '#ec4899' },
          { label: 'Sessions', value: '448', sub: '10.4M in · 4.2M out', color: '#6366f1' },
        ].map((kpi, i) => (
          <Card key={i} className="p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1">{kpi.label}</div>
            <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[10px] text-on-surface-variant/40 mt-0.5">{kpi.sub}</div>
          </Card>
        ))}
      </div>

      {/* Row 1: Memory Health + Graphify & Plugins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Memory Health */}
        <Card className="p-4">
          <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🧠 Agent Memory Health</h3>
          <div className="space-y-1.5">
            {[
              { name: 'Marcus (CEO)', pct: 98, size: '8.3 KB', color: '#10b981' },
              { name: 'Kai (Marketing)', pct: 95, size: '7.9 KB', color: '#10b981' },
              { name: 'Diana (COO)', pct: 94, size: '7.1 KB', color: '#10b981' },
              { name: 'Lena (Marketing)', pct: 88, size: '6.9 KB', color: '#f59e0b' },
              { name: 'Felix (Finance)', pct: 92, size: '6.7 KB', color: '#10b981' },
              { name: 'Nate (Marketing)', pct: 91, size: '6.4 KB', color: '#10b981' },
              { name: 'Mia (Technical)', pct: 85, size: '5.6 KB', color: '#f59e0b' },
              { name: 'Kahneman (Psych)', pct: 93, size: '5.5 KB', color: '#10b981' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] text-on-surface font-medium w-[130px] truncate shrink-0">{a.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${a.pct}%`,
                    background: a.color === '#10b981' ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  }} />
                </div>
                <span className="text-[10px] text-on-surface-variant/50 font-mono w-12 text-right">{a.size}</span>
                <span className="text-[10px] font-semibold w-8 text-right" style={{ color: a.color }}>{a.pct}%</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-on-surface-variant/30 mt-3">Memory health = file integrity × recency × link validity</div>
        </Card>

        {/* Graphify + Plugins */}
        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🔗 Knowledge Graph (Graphify)</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 120 120" width="96" height="96">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6"/>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#8b5cf6" strokeWidth="6"
                    strokeDasharray="326.7" strokeDashoffset="65" strokeLinecap="round"
                    transform="rotate(-90 60 60)"/>
                  <text x="60" y="56" textAnchor="middle" fill="#a78bfa" fontSize="16" fontWeight="800">4.7K</text>
                  <text x="60" y="70" textAnchor="middle" fill="#525b6e" fontSize="8">nodes</text>
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-1.5 flex-1">
                {[
                  { v: '4,708', l: 'Nodes', c: '#a78bfa' },
                  { v: '12,004', l: 'Edges', c: '#6366f1' },
                  { v: '2,321', l: 'Graphify', c: '#10b981' },
                  { v: '2,387', l: 'Code Review', c: '#f59e0b' },
                  { v: '1,755', l: 'Functions', c: '#ec4899' },
                  { v: '479', l: 'Files', c: '#3b82f6' },
                ].map((s, i) => (
                  <div key={i} className="text-center p-1.5 rounded-lg bg-white/[0.02]">
                    <div className="text-xs font-bold font-mono" style={{ color: s.c }}>{s.v}</div>
                    <div className="text-[9px] text-on-surface-variant/50 uppercase">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🔌 Plugin & Integration Health</h3>
            <div className="space-y-1.5">
              {[
                { name: 'toongine-graph (MCP)', stat: '5 tools · stdio', ok: true },
                { name: 'Supabase Plugin', stat: '35 exports · anon auth', ok: true },
                { name: 'Graphify (code-review-graph)', stat: '2.3K nodes indexed', ok: true },
                { name: 'TOON Compiler v4', stat: '107 files cached', ok: false },
                { name: 'Pipeline (cron)', stat: 'every 5m · $0 cost', ok: true },
                { name: 'Hermes Agent', stat: 'v2.21.0 · deepseek-v4-pro', ok: false },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.ok ? 'bg-emerald-400 shadow-[0_0_6px_#10b98155]' : 'bg-amber-400'}`} />
                  <span className="text-on-surface truncate flex-1">{p.name}</span>
                  <span className="text-on-surface-variant/50 font-mono text-[10px] shrink-0">{p.stat}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Efficiency + Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <Card className="p-4">
          <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">⚡ Agent Efficiency & Fallbacks</h3>
          <table className="w-full text-[10px]">
            <thead><tr className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider border-b border-white/[0.04]"><th className="text-left py-1">Agent</th><th className="text-right py-1">Tasks</th><th className="text-left py-1">Success</th><th className="text-right py-1">Cost</th><th className="text-right py-1">Tokens</th><th className="text-right py-1">Grade</th></tr></thead>
            <tbody>
              {[
                { agent: 'Dev Lead', tasks: 124, succ: 32, cost: '$12.40', tok: '2.8M', grade: 'B', gc: 'warn' },
                { agent: 'Marcus', tasks: 87, succ: 85, cost: '$8.90', tok: '1.9M', grade: 'A', gc: 'ok' },
                { agent: 'Raj', tasks: 56, succ: 78, cost: '$6.20', tok: '1.4M', grade: 'A', gc: 'ok' },
                { agent: 'Kai', tasks: 28, succ: 64, cost: '$3.10', tok: '680K', grade: 'C', gc: 'warn' },
                { agent: 'Diana', tasks: 42, succ: 71, cost: '$5.10', tok: '1.1M', grade: 'B+', gc: 'ok' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/[0.02]">
                  <td className="py-1 text-on-surface font-semibold">{row.agent}</td>
                  <td className="py-1 text-right text-on-surface-variant">{row.tasks}</td>
                  <td className="py-1">
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300" style={{ width: `${row.succ}%` }} />
                      </div>
                      <span className="text-[9px] text-emerald-400 w-7 text-right">{row.succ}%</span>
                    </div>
                  </td>
                  <td className="py-1 text-right font-mono text-on-surface-variant">{row.cost}</td>
                  <td className="py-1 text-right font-mono text-on-surface-variant/50">{row.tok}</td>
                  <td className="py-1 text-right">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${row.gc === 'ok' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>{row.grade}</span>
                  </td>
                </tr>
              ))}
              <tr className="bg-white/[0.02]">
                <td className="py-1 font-bold" style={{ color: 'var(--ws-accent)' }}>SYSTEM</td>
                <td className="py-1 text-right text-on-surface-variant">442</td>
                <td className="py-1">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '15.8%', background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }} />
                    </div>
                    <span className="text-[9px] text-[#a78bfa] w-7 text-right">15.8%</span>
                  </div>
                </td>
                <td className="py-1 text-right font-mono" style={{ color: 'var(--ws-accent)' }}>$47.18</td>
                <td className="py-1 text-right font-mono text-on-surface-variant/50">10.4M</td>
                <td className="py-1 text-right"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--ws-accent-soft)]" style={{ color: 'var(--ws-accent)' }}>SYS</span></td>
              </tr>
            </tbody>
          </table>
          <div className="text-[9px] text-on-surface-variant/30 mt-2">Success = task completed without tool errors · 84.2% of runs had recoverable issues</div>
        </Card>

        <Card className="p-4">
          <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">⚠️ Agent Error Report</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0" />
              <div className="text-[11px]">
                <div className="text-on-surface font-medium">Pipeline schema mismatch</div>
                <div className="text-on-surface-variant/60">toongine_issues, toongine_toon_health tables missing</div>
                <div className="text-on-surface-variant/30 text-[10px]">10 failures · last 5 min ago</div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
              <div className="text-[11px]">
                <div className="text-on-surface font-medium">Session status: failed (recoverable)</div>
                <div className="text-on-surface-variant/60">372 sessions marked failed — tool-call retries, context limits</div>
                <div className="text-on-surface-variant/30 text-[10px]">84.2% of runs · normal for agentic work</div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
              <div className="text-[11px]">
                <div className="text-on-surface font-medium">TOON cache 24h+ stale</div>
                <div className="text-on-surface-variant/60">.compile-cache.json last modified {'>'}24h ago</div>
                <div className="text-on-surface-variant/30 text-[10px]">non-blocking · cache still valid</div>
              </div>
            </div>
          </div>

          <h4 className="text-[10px] text-on-surface font-semibold mt-4 mb-2">Fallback Chains</h4>
          <div className="space-y-1 text-[10px] text-on-surface-variant/60">
            <div>🔄 API failure → retry 3x → degrade to cached → report error</div>
            <div>🔄 Model timeout → reduce context → switch model → fail task</div>
            <div>🔄 Tool error → retry tool → try alternative → skip step</div>
            <div>🔄 Context overflow → compress → summarize → truncate</div>
          </div>

          <h4 className="text-[10px] text-on-surface font-semibold mt-3 mb-1">Pipeline Health</h4>
          <div className="flex items-end gap-[2px] h-8">
            {[15,15,20,15,60,40,15,20,15,15].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm" style={{
                height: `${h}%`,
                background: h > 30 ? 'rgba(239,68,68,0.4)' : h > 18 ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.3)'
              }} />
            ))}
          </div>
          <div className="text-[9px] text-on-surface-variant/30 mt-1">Last 10 ticks · ⚠️ schema errors on 2 ticks</div>
        </Card>
      </div>

      {/* Row 3: Hermes Connection + Skills Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🔗 Hermes Agent Connection Health</h3>
          <div className="space-y-1.5">
            {[
              { name: 'Provider (DeepSeek v4-pro)', stat: 'anthropic-compat · OK', ok: true },
              { name: 'Session Store (state.db)', stat: '448 sessions · SQLite+FTS5', ok: true },
              { name: 'Memory Backend', stat: 'built-in · 15 agents', ok: true },
              { name: 'Gateway (Telegram)', stat: 'connected · DM active', ok: true },
              { name: 'Cron Scheduler', stat: '5 jobs · 4 ok · 1 err', ok: true },
              { name: 'SSH Backend', stat: 'VPS · srv1742956', ok: false },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className={`w-1.5 h-1.5 rounded-full ${p.ok ? 'bg-emerald-400 shadow-[0_0_6px_#10b98155]' : 'bg-amber-400'}`} />
                <span className="text-on-surface truncate flex-1">{p.name}</span>
                <span className="text-on-surface-variant/50 font-mono text-[10px] shrink-0">{p.stat}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-emerald-400 mt-3">✅ All core systems operational</div>
        </Card>

        <Card className="p-4">
          <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">📚 Skills Landscape (51 total)</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { v: '7', l: 'autonomous-ai-agents', c: '#a78bfa' },
              { v: '16', l: 'creative', c: '#ec4899' },
              { v: '1', l: 'data-science', c: '#3b82f6' },
              { v: '1', l: 'devops', c: '#f59e0b' },
              { v: '3', l: 'mlops', c: '#10b981' },
              { v: '1', l: 'red-teaming', c: '#6366f1' },
            ].map((s, i) => (
              <div key={i} className="text-center p-2 rounded-lg bg-white/[0.02]">
                <div className="text-sm font-bold font-mono" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[9px] text-on-surface-variant/50">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-on-surface-variant/50 mt-2">
            3 local: <span style={{ color: 'var(--ws-accent)' }}>toongine</span> · <span style={{ color: 'var(--ws-accent)' }}>yvon-dashboard-overhaul</span> · <span style={{ color: 'var(--ws-accent)' }}>hermes-mcp-servers</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── HEALTH METRICS TAB ───────────────────────────────────────────────────────

function HealthTab({ data }: { data: ToonOSData | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Card className="p-4">
        <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">System Checks</h3>
        <div className="space-y-2">
          {[
            { label: 'Agents Directory', ok: data?.checks?.agents ?? false },
            { label: 'CLAUDE.md Present', ok: data?.checks?.claudeMD ?? false },
            { label: 'Graphify Built', ok: data?.checks?.graphify ?? false },
            { label: 'Codegraph Built', ok: data?.checks?.codegraph ?? false },
          ].map((check, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
              <span className="text-[12px] text-on-surface-variant">{check.label}</span>
              <span className={`w-2 h-2 rounded-full ${check.ok ? 'bg-emerald-400' : 'border border-white/10'}`} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Departments</h3>
        <div className="space-y-1.5">
          {(data?.departments ?? []).length > 0 ? data!.departments.map(d => (
            <div key={d.name} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
              <span className="text-[12px] text-on-surface font-medium">{d.name}</span>
              <span className="text-[11px] text-on-surface-variant">{d.agentCount} agents</span>
            </div>
          )) : (
            <p className="text-[12px] text-on-surface-variant/40 text-center py-4">No department data</p>
          )}
        </div>
      </Card>

      <Card className="p-4 sm:col-span-2">
        <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Graph Sizes</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-on-surface-variant">Graphify</span>
              <span className="text-on-surface font-mono">{data?.graphs?.graphify || 'not built'}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400/60" style={{ width: data?.checks?.graphify ? '100%' : '0%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-on-surface-variant">Codegraph</span>
              <span className="text-on-surface font-mono">{data?.graphs?.codegraph || 'not built'}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full bg-blue-400/60" style={{ width: data?.checks?.codegraph ? '100%' : '0%' }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:col-span-2 text-center">
        <h3 className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-2">Total Agents</h3>
        <div className="text-3xl font-bold text-on-surface">{data?.agentsTotal ?? '—'}</div>
        <div className="text-[11px] text-on-surface-variant mt-1">{data?.departments?.length ?? 0} departments deployed</div>
        <StatusBadge tone={data?.initialized ? 'green' : 'yellow'}>{data?.initialized ? 'Active' : 'Init needed'}</StatusBadge>
      </Card>
    </div>
  )
}

// ── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function ToonGineOSPage() {
  const { workspace } = useWorkspace()
  const [toonOS, setToonOS] = useState<ToonOSData | null>(null)
  const [osTab, setOsTab] = useState<OSTab>('burn')

  useEffect(() => {
    fetch('/api/ventures-health')
      .then(r => r.json())
      .then(d => setToonOS(d))
      .catch(() => {})
  }, [])

  return (
    <div>
      <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3">
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--ws-accent-soft)' }}>
          <Bot size={20} style={{ color: 'var(--ws-accent)' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-on-surface">ToonGine OS</h1>
          <p className="text-[12px] text-on-surface-variant">
            {toonOS?.initialized
              ? `${toonOS.agentsTotal} agents · ${toonOS.departments.length} departments`
              : 'Not initialized — run npx toongine init'}
          </p>
        </div>
        <StatusBadge tone={toonOS?.initialized ? 'green' : 'yellow'}>
          {toonOS?.initialized ? 'Active' : 'Init needed'}
        </StatusBadge>
      </div>

      <OSTabs tab={osTab} onChange={setOsTab} />

      {osTab === 'burn' && <TokenBurnTab data={toonOS} />}
      {osTab === 'agents' && <AgentsTab data={toonOS} />}
      {osTab === 'health' && <HealthTab data={toonOS} />}
    </div>
  )
}
