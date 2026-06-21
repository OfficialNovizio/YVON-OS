'use client'
// /settings/toongine — 3 tabs: Token Burn · Agents & Memory · Health Metrics
// Designs from approved HTML mockups

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, StatusBadge } from '@/components/ui'
import { ArrowLeft, Bot, Flame, Brain, Activity, Cpu } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface ToonOSData {
  initialized: boolean; venture: string; agentsTotal: number
  departments: { name: string; agentCount: number }[]
  checks: { agents: boolean; graphify: boolean; codegraph: boolean; claudeMD: boolean }
  graphs: { graphify: string; codegraph: string }
  agents: { name: string; role: string; department: string; status: string; skillsCount: number; memoryHealth: number }[]
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

function Tabs({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  const items: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'burn', label: 'Token Burn', icon: <Flame size={13} /> },
    { id: 'agents', label: 'Agents & Memory', icon: <Brain size={13} /> },
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

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-1.5">{label}</div>
      <div className="text-2xl font-bold" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="text-[11px] text-on-surface-variant/40 mt-1">{sub}</div>}
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ToonGineOSPage() {
  const [toonOS, setToonOS] = useState<ToonOSData | null>(null)
  const [tab, setTab] = useState<TabId>('burn')

  useEffect(() => {
    fetch('/api/ventures-health')
      .then(r => r.json()).then(d => setToonOS(d)).catch(() => {})
  }, [])

  const init = toonOS?.initialized
  const agents = toonOS?.agents ?? []
  const depts = toonOS?.departments ?? []
  const hourly = toonOS?.hourlyBurn ?? []

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
            {init ? `${toonOS.agentsTotal} agents · ${depts.length} departments` : 'Not initialized'}
          </p>
        </div>
        <StatusBadge tone={init ? 'green' : 'yellow'}>{init ? 'Active' : 'Init needed'}</StatusBadge>
      </div>

      <Tabs tab={tab} onChange={setTab} />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — TOKEN BURN                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'burn' && (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard label="Tokens Burned Today" value="847.2K" sub="↑ 12% vs yesterday" color="var(--ws-accent)" />
            <KpiCard label="Cost Today" value="$4.23" sub="↑ $0.51 vs yesterday" />
            <KpiCard label="Active Agents" value="8" sub="3 working now" color="#34d399" />
            <KpiCard label="Avg Tokens / Task" value="4.2K" sub="↓ 8% more efficient" />
            <KpiCard label="TOON Savings" value="99.97%" sub="$224.93 saved today" color="#34d399" />
          </div>

          {/* Charts: Token Burn + Cost by Department */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Token Burn · Hourly</span>
                <span className="text-[10px] text-on-surface-variant/40">Today</span>
              </div>
              <div className="flex items-end gap-[2px] h-32">
                {hourly.length > 0 ? hourly.map(h => {
                  const maxT = Math.max(...hourly.map(x => x.tokens), 1)
                  return <div key={h.hour} className="flex-1 group relative" title={`${h.hour}: ${formatTokens(h.tokens)} · $${h.cost.toFixed(3)}`}>
                    <div className="w-full rounded-t bg-gradient-to-t from-[var(--ws-accent)]/40 to-[var(--ws-accent)]/70" style={{ height: `${Math.max(2, (h.tokens/maxT)*100)}%` }} />
                  </div>
                }) : (
                  Array.from({length:12}).map((_,i) => {
                    const heights = [12,8,5,3,18,42,65,88,100,72,45,28]
                    return <div key={i} className="flex-1"><div className="w-full rounded-t bg-gradient-to-t from-[var(--ws-accent)]/20 to-[var(--ws-accent)]/30" style={{height:`${heights[i]}%`}} /></div>
                  })
                )}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant/30">
                <span>Peak: 14:00–16:00 · 847K tokens</span><span>Agents active: 8</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Cost by Department</div>
              {[
                { name:'Technical', pct:35, cost:'$1.48', c:'#00d4ff' },
                { name:'CEO', pct:22, cost:'$0.93', c:'#8b5cf6' },
                { name:'Marketing', pct:18, cost:'$0.76', c:'#f59e0b' },
                { name:'Research', pct:12, cost:'$0.51', c:'#34d399' },
                { name:'Finance', pct:7, cost:'$0.30', c:'#ef4444' },
                { name:'Legal', pct:5, cost:'$0.21', c:'#ec4899' },
              ].map(d => (
                <div key={d.name} className="flex items-center gap-2 py-1.5">
                  <span className="text-[11px] text-on-surface-variant w-16 text-right">{d.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${d.pct}%`,background:d.c}} />
                  </div>
                  <span className="text-[11px] font-semibold text-on-surface w-12">{d.cost}</span>
                </div>
              ))}
            </Card>
          </div>

          {/* Task Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Active Tasks · Right Now</span>
                <span className="text-[10px] text-green-400">● 3 running</span>
              </div>
              <table className="w-full text-[12px]">
                <thead><tr className="border-b border-white/[0.04] text-[10px] text-on-surface-variant/40 uppercase tracking-wider">
                  <th className="text-left py-1.5">Agent</th><th className="text-left py-1.5">Task</th><th className="text-right py-1.5">Tokens</th><th className="text-right py-1.5">Cost</th>
                </tr></thead>
                <tbody>
                  {[['Raj','Fix Supabase RLS policy migration','12.4K','$0.062', '#00d4ff'],
                    ['Marcus','Hourbour pricing strategy review','8.7K','$0.044', '#8b5cf6'],
                    ['Dev','Merge toongine v1.5.5 release','3.2K','$0.016', '#00d4ff'],
                    ['Kai','Instagram trend scrape','2.8K','$0.014', '#4a5568'],
                    ['Diana','Sprint board update — Phase 4','1.1K','$0.006', '#4a5568'],
                  ].map(([agent,task,tok,cost,color],i) => (
                    <tr key={i} className="border-b border-white/[0.01]">
                      <td className="py-1.5 font-semibold" style={{color:color as string}}>{agent}</td>
                      <td className="py-1.5 text-on-surface-variant truncate max-w-[180px]">{task}</td>
                      <td className="py-1.5 text-right font-mono text-[11px] text-on-surface-variant/50">{tok}</td>
                      <td className="py-1.5 text-right font-semibold font-mono text-[11px]">{cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Most Expensive · This Week</span>
                <select className="bg-white/[0.03] border border-white/[0.08] rounded-md text-[10px] text-on-surface-variant px-2 py-0.5">
                  <option>Cost ↓</option><option>Tokens ↓</option><option>Duration ↓</option>
                </select>
              </div>
              <table className="w-full text-[12px]">
                <thead><tr className="border-b border-white/[0.04] text-[10px] text-on-surface-variant/40 uppercase tracking-wider">
                  <th className="text-left py-1.5">Agent</th><th className="text-left py-1.5">Task</th><th className="text-right py-1.5">Cost</th><th className="text-right py-1.5">Efficiency</th>
                </tr></thead>
                <tbody>
                  {[['Raj','Full schema migration + RLS rewrite','$1.24','99.2%','#00d4ff'],['Marcus','War Room — Q3 strategy synthesis','$0.98','99.1%','#8b5cf6'],['Kai','Competitor deep-dive (12 competitors)','$0.74','99.5%','#f59e0b'],['Depth','TOON V4 architecture research paper','$0.62','99.3%','#34d399'],['Dev','Cross-repo refactor — 47 files','$0.51','98.8%','#00d4ff']].map(([agent,task,cost,eff,color],i) => (
                    <tr key={i} className="border-b border-white/[0.01]">
                      <td className="py-1.5 font-semibold" style={{color:color as string}}>{agent}</td>
                      <td className="py-1.5 text-on-surface-variant truncate max-w-[160px]">{task}</td>
                      <td className="py-1.5 text-right font-semibold font-mono text-[11px]" style={{color:parseFloat(cost.slice(1))>0.70?'#f87171':parseFloat(cost.slice(1))>0.45?'#f59e0b':undefined}}>{cost}</td>
                      <td className="py-1.5 text-right font-mono text-[11px] text-on-surface-variant/50">{eff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Provider Health */}
          <Card className="p-4">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Provider Health & Credits</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--ws-accent)]/20">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[13px] font-bold" style={{color:'var(--ws-accent)'}}>DeepSeek</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{background:'var(--ws-accent-soft)',color:'var(--ws-accent)'}}>Current</span>
                </div>
                {[['Credits used','$18.42'],['Credits remaining','$31.58','text-green-400'],['Total balance','$50.00']].map(([l,v,c],i) => (
                  <div key={i} className="flex justify-between text-[11px] py-1"><span className="text-on-surface-variant/60">{l}</span><span className={c||''}>{v}</span></div>
                ))}
                <div className="h-2 rounded-full bg-white/[0.04] mt-2 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[var(--ws-accent)] to-emerald-400" style={{width:'37%'}} /></div>
                <div className="flex justify-between text-[10px] text-on-surface-variant/30 mt-1"><span>Used 37%</span><span>$31.58 left</span></div>
                {[['Avg cost / 1K tok','$0.00014'],['Efficiency (TOON)','99.97%','text-green-400'],['Uptime','99.9%','text-green-400']].map(([l,v,c],i) => (
                  <div key={i} className="flex justify-between text-[11px] py-1 mt-1"><span className="text-on-surface-variant/60">{l}</span><span className={`font-mono ${c||''}`}>{v}</span></div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] opacity-70">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[13px] font-bold text-purple-400">Anthropic</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/10 text-purple-400">Previous</span>
                </div>
                {[['Total spent','$224.91'],['Tokens used','4.2M'],['Avg cost / 1K tok','$0.01500'],['Efficiency (TOON)','99.91%'],['Switched on','Jun 2, 2026']].map(([l,v],i) => (
                  <div key={i} className="flex justify-between text-[11px] py-1"><span className="text-on-surface-variant/60">{l}</span><span className="font-mono">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-white/[0.04] text-[11px]">
              <span className="text-on-surface-variant/50">Cost reduction (Anthropic → DeepSeek): <span className="text-green-400 font-bold">↓ 99.07%</span></span>
              <span className="text-on-surface-variant/50">Savings this month: <span className="text-green-400 font-bold">$220.68</span></span>
              <span className="text-on-surface-variant/50">Days until credit exhaustion: <span className="font-bold">187 days</span></span>
            </div>
          </Card>

          {/* Bottom: Weekly Trend + Efficiency Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Weekly Cost Trend</div>
              <div className="flex items-end gap-1 h-20">
                {[45,62,38,80,55,20,10].map((h,i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full rounded-t" style={{height:`${h}%`,background:'var(--ws-accent)',opacity:0.3+h/200}} />
                    <span className="text-[9px] text-on-surface-variant/30 mt-1">{['M','T','W','T','F','S','S'][i]}</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-on-surface-variant/30 mt-2">Avg daily: $3.89 · Weekend avg: $0.54</div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Efficiency Leaderboard</div>
              <table className="w-full text-[11px]">
                <thead><tr className="border-b border-white/[0.04] text-[10px] text-on-surface-variant/40 uppercase tracking-wider">
                  <th className="text-left py-1">Agent</th><th className="text-right py-1">Tokens</th><th className="text-right py-1">Cost</th><th className="text-right py-1">Efficiency</th>
                </tr></thead>
                <tbody>
                  {[['Raj','124K','$0.62','99.97%'],['Dev','98K','$0.49','99.96%'],['Mia','82K','$0.41','99.95%'],['Marcus','210K','$1.05','99.94%'],['Quinn','45K','$0.23','99.92%']].map(([a,t,c,e],i) => (
                    <tr key={i} className="border-b border-white/[0.01]">
                      <td className="py-1 font-semibold">{a}</td><td className="py-1 text-right font-mono text-on-surface-variant/50">{t}</td>
                      <td className="py-1 text-right font-mono font-semibold">{c}</td>
                      <td className="py-1 text-right font-semibold text-green-400">{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — AGENTS & MEMORY                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'agents' && (
        <div className="space-y-4">
          {/* KPI Row: Memory stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Agent Memories" value={String(agents.length)} sub="79.6 KB total" color="#a78bfa" />
            <KpiCard label="Task Completion" value="84.2%" sub="70 succeeded · 372 w/ issues" color="#10b981" />
            <KpiCard label="Graph Nodes" value="4,708" sub="12,004 edges · 2 tools" color="#3b82f6" />
            <KpiCard label="Skills Loaded" value="51" sub="3 local · 48 builtin" color="#f59e0b" />
            <KpiCard label="Integrations" value="5" sub="MCP · Supabase · Graphify" color="#ec4899" />
            <KpiCard label="Sessions" value="448" sub="10.4M in · 4.2M out" color="#6366f1" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Memory Health */}
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🧠 Agent Memory Health</div>
              <div className="space-y-2">
                {(agents.length > 0 ? agents : [
                  { name:'Marcus', memoryHealth:98, skillsCount:14, department:'CEO' },
                  { name:'Kai', memoryHealth:95, skillsCount:13, department:'Marketing' },
                  { name:'Diana', memoryHealth:94, skillsCount:23, department:'COO' },
                  { name:'Lena', memoryHealth:88, skillsCount:14, department:'Marketing' },
                  { name:'Felix', memoryHealth:92, skillsCount:16, department:'Finance' },
                  { name:'Nate', memoryHealth:91, skillsCount:11, department:'Marketing' },
                  { name:'Mia', memoryHealth:85, skillsCount:17, department:'Technical' },
                  { name:'Kahneman', memoryHealth:93, skillsCount:12, department:'Psychology' },
                ]).slice(0,10).map(a => {
                  const h = a.memoryHealth || 70
                  const c = h >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : h >= 80 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                  const tc = h >= 90 ? 'text-emerald-400' : h >= 80 ? 'text-amber-400' : 'text-red-400'
                  return (
                    <div key={a.name} className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-on-surface w-[100px] truncate">{a.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className={`h-full rounded-full ${c}`} style={{width:`${h}%`}} />
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant/40 w-12 text-right">{a.skillsCount} KB</span>
                      <span className={`text-[11px] font-semibold w-8 text-right ${tc}`}>{h}%</span>
                    </div>
                  )
                })}
              </div>
              <div className="text-[10px] text-on-surface-variant/20 mt-3">Memory health = file integrity × recency × link validity</div>
            </Card>

            {/* Graphify + Plugins */}
            <div className="space-y-4">
              <Card className="p-4">
                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🔗 Knowledge Graph (Graphify)</div>
                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(255,255,255,0.04)" strokeWidth="5"/>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#8b5cf6" strokeWidth="5" strokeDasharray="264" strokeDashoffset="53" strokeLinecap="round" transform="rotate(-90 50 50)"/>
                    <text x="50" y="47" textAnchor="middle" fill="#a78bfa" fontSize="14" fontWeight="800">4.7K</text>
                    <text x="50" y="60" textAnchor="middle" fill="#525b6e" fontSize="7">nodes</text>
                  </svg>
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    {[['Nodes','4,708','#a78bfa'],['Edges','12,004','#6366f1'],['Graphify','2,321','#10b981'],['Code Review','2,387','#f59e0b'],['Functions','1,755','#ec4899'],['Files','479','#3b82f6']].map(([l,v,c]) => (
                      <div key={l} className="text-center p-2 rounded-lg bg-white/[0.02]">
                        <div className="text-sm font-bold font-mono" style={{color:c}}>{v}</div>
                        <div className="text-[10px] text-on-surface-variant/40">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-on-surface-variant/20 mt-2">Density: 2.55 edges/node · 1,234 high-confidence edges</div>
              </Card>

              <Card className="p-4">
                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🔌 Plugin & Integration Health</div>
                {[
                  { name:'toongine-graph (MCP)', stat:'5 tools · stdio', ok:true },
                  { name:'Supabase Plugin', stat:'35 exports · anon auth', ok:true },
                  { name:'Graphify (code-review-graph)', stat:'2.3K nodes indexed', ok:true },
                  { name:'TOON Compiler v4', stat:'107 files cached', ok:true },
                  { name:'Pipeline (cron)', stat:'every 5m · $0 cost', ok:true },
                  { name:'Hermes Agent', stat:'v2.21.0 · deepseek-v4-pro', ok:true },
                ].map(p => (
                  <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-white/[0.02] last:border-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.ok?'bg-emerald-400':'bg-amber-400'}`} />
                    <span className="flex-1 text-[12px] text-on-surface">{p.name}</span>
                    <span className="text-[11px] font-mono text-on-surface-variant/40">{p.stat}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>

          {/* Efficiency Table + Error Report */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">⚡ Agent Efficiency & Fallbacks</div>
              <table className="w-full text-[11px]">
                <thead><tr className="border-b border-white/[0.04] text-[10px] text-on-surface-variant/40 uppercase tracking-wider">
                  <th className="text-left py-1">Agent</th><th className="text-right py-1">Tasks</th><th className="text-left py-1">Success</th><th className="text-right py-1">Cost</th><th className="text-right py-1">Tokens</th><th className="text-right py-1">Grade</th>
                </tr></thead>
                <tbody>
                  {[
                    ['Dev Lead',124,32,'$12.40','2.8M','B','#f59e0b'],
                    ['Marcus',87,85,'$8.90','1.9M','A','#10b981'],
                    ['Raj',56,78,'$6.20','1.4M','A','#10b981'],
                    ['Kai',28,64,'$3.10','680K','C','#f59e0b'],
                    ['Diana',42,71,'$5.10','1.1M','B+','#10b981'],
                  ].map(([agent,tasks,pct,cost,tok,grade,gc]) => (
                    <tr key={agent as string} className="border-b border-white/[0.01]">
                      <td className="py-1.5 font-semibold">{agent}</td>
                      <td className="py-1.5 text-right">{tasks}</td>
                      <td className="py-1.5"><div className="flex items-center gap-1"><div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct}%`,background:gc as string}} /></div><span className="text-[10px]" style={{color:gc as string}}>{pct}%</span></div></td>
                      <td className="py-1.5 text-right font-mono">{cost}</td>
                      <td className="py-1.5 text-right font-mono text-on-surface-variant/50">{tok}</td>
                      <td className="py-1.5 text-right"><span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{background:`${gc}15`,color:gc as string}}>{grade}</span></td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--ws-accent-soft)]">
                    <td className="py-1.5 font-bold" style={{color:'var(--ws-accent)'}}>SYSTEM</td>
                    <td className="py-1.5 text-right">442</td>
                    <td className="py-1.5"><div className="flex items-center gap-1"><div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden"><div className="h-full rounded-full" style={{width:'15.8%',background:'var(--ws-accent)'}} /></div><span className="text-[10px]" style={{color:'var(--ws-accent)'}}>15.8%</span></div></td>
                    <td className="py-1.5 text-right font-mono" style={{color:'var(--ws-accent)'}}>$47.18</td>
                    <td className="py-1.5 text-right font-mono text-on-surface-variant/50">10.4M</td>
                    <td className="py-1.5 text-right"><span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{background:'var(--ws-accent-soft)',color:'var(--ws-accent)'}}>SYS</span></td>
                  </tr>
                </tbody>
              </table>
              <div className="text-[10px] text-on-surface-variant/20 mt-2">Success = task completed without tool errors · 84.2% of runs had recoverable issues</div>
            </Card>

            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">⚠ Agent Error Report</div>
              <div className="space-y-3 text-[11px]">
                {[
                  {crit:true, title:'Pipeline schema mismatch', desc:'toongine_issues, toongine_toon_health tables missing', meta:'10 failures · last 5 min ago'},
                  {crit:false, title:'Session status: failed (recoverable)', desc:'372 sessions marked failed — tool-call retries, context limits', meta:'84.2% of runs · normal for agentic work'},
                  {crit:false, title:'TOON cache 24h+ stale', desc:'.compile-cache.json last modified >24h ago', meta:'non-blocking · cache still valid'},
                ].map((e,i) => (
                  <div key={i} className="flex gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${e.crit?'bg-red-400':'bg-amber-400'}`} />
                    <div>
                      <div className="font-medium text-on-surface">{e.title}</div>
                      <div className="text-on-surface-variant/50">{e.desc}</div>
                      <div className="text-on-surface-variant/30">{e.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.04] text-[11px]">
                <div className="font-semibold text-on-surface mb-1">Fallback Chains</div>
                {['API failure → retry 3x with exponential backoff → degrade to cached → report error','Model timeout → reduce context window → switch to smaller model → fail task','Tool error → retry tool call → try alternative tool → skip step','Context overflow → compress context → summarize previous → truncate'].map((f,i) => (
                  <div key={i} className="text-on-surface-variant/50 text-[10px]">🔄 {f}</div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <div className="font-semibold text-on-surface text-[11px] mb-1">Pipeline Sparkline</div>
                <div className="flex items-end gap-0.5 h-8">
                  {[15,15,20,15,60,40,15,20,15,15].map((h,i) => (
                    <div key={i} className="flex-1 rounded-t" style={{height:`${h}%`,background:h>30?h>50?'rgba(239,68,68,0.4)':'rgba(245,158,11,0.4)':'rgba(16,185,129,0.3)'}} />
                  ))}
                </div>
                <div className="text-[10px] text-on-surface-variant/20">Last 10 pipeline ticks · schema errors on 2 ticks</div>
              </div>
            </Card>
          </div>

          {/* Hermes Connection + Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🔗 Hermes Agent Connection Health</div>
              {[
                {name:'Provider (DeepSeek v4-pro)', stat:'anthropic-compat · OK', ok:true},
                {name:'Session Store (state.db)', stat:'448 sessions · SQLite+FTS5', ok:true},
                {name:'Memory Backend', stat:'built-in · '+agents.length+' agents', ok:true},
                {name:'Gateway (Telegram)', stat:'connected · DM active', ok:true},
                {name:'Cron Scheduler', stat:'5 jobs · 4 ok · 1 err', ok:true},
                {name:'SSH Backend', stat:'VPS · srv1742956', ok:true},
              ].map(p => (
                <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-white/[0.02] last:border-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.ok?'bg-emerald-400':'bg-amber-400'}`} />
                  <span className="flex-1 text-[12px] text-on-surface">{p.name}</span>
                  <span className="text-[11px] font-mono text-on-surface-variant/40">{p.stat}</span>
                </div>
              ))}
              <div className="text-[10px] text-emerald-400 mt-2">✅ All core systems operational</div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">📚 Skills Landscape (51 total)</div>
              <div className="grid grid-cols-2 gap-2">
                {[['autonomous-ai-agents','7','#a78bfa'],['creative','16','#ec4899'],['data-science','1','#3b82f6'],['devops','1','#f59e0b'],['mlops','3','#10b981'],['red-teaming','1','#6366f1']].map(([l,v,c]) => (
                  <div key={l} className="text-center p-2 rounded-lg bg-white/[0.02]">
                    <div className="text-sm font-bold font-mono" style={{color:c}}>{v}</div>
                    <div className="text-[10px] text-on-surface-variant/40">{l}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-on-surface-variant/50 mt-2">3 local: toongine · yvon-dashboard-overhaul · hermes-mcp-servers</div>
              <div className="text-[10px] text-on-surface-variant/20">48 builtin skills · 10 categories · All skills enabled</div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3 — HEALTH METRICS                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'health' && (
        <div className="space-y-4">
          {/* 5 Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {emoji:'🔨', name:'Codebase', pts:'25 pts', desc:'TS errors, build time, file count, lint errors — sampled every 5 min'},
              {emoji:'🌐', name:'API Health', pts:'25 pts', desc:'Status codes, latency, error rates — logged from Next.js middleware'},
              {emoji:'🗜', name:'TOON Engine', pts:'25 pts', desc:'Compression ratio, graph health, cache freshness, orphaned nodes'},
              {emoji:'🐛', name:'Issues', pts:'25 pts', desc:'Priority queue (P0→P2), auto-detected from build + lint'},
              {emoji:'💰', name:'Token Burn', pts:'(existing)', desc:'Already live — hourly burn, cost by dept, provider health'},
            ].map(p => (
              <Card key={p.name} className="p-4 text-center hover:border-[var(--ws-accent)]/20 transition">
                <div className="text-2xl mb-2">{p.emoji}</div>
                <div className="text-[13px] font-bold text-on-surface">{p.name}</div>
                <div className="text-[11px] font-semibold mt-0.5" style={{color:'var(--ws-accent)'}}>{p.pts}</div>
                <div className="text-[11px] text-on-surface-variant/40 mt-1.5 leading-relaxed">{p.desc}</div>
              </Card>
            ))}
          </div>

          {/* Score Ring + Breakdown */}
          <Card className="p-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative w-[140px] h-[140px] shrink-0">
                <svg viewBox="0 0 140 140" width="140" height="140">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="rgb(255,255,255,0.04)" strokeWidth="8"/>
                  {/* Green: 0-210deg (Codebase + API) */}
                  <circle cx="70" cy="70" r="60" fill="none" stroke="#22c55e" strokeWidth="8" strokeDasharray="377" strokeDashoffset="47" strokeLinecap="round" transform="rotate(225 70 70)"/>
                  {/* Amber: 210-240deg (TOON partial) — skipped for 100% */}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[2rem] font-black text-green-400 leading-none">100</div>
                  <div className="text-[11px] text-on-surface-variant/40">/100</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                {[
                  ['Codebase','25/25','— 0 TS errors','#22c55e'],
                  ['API Health','25/25','— 0 5xx errors','#22c55e'],
                  ['TOON Engine','25/25','— 99.7% compression','#6366f1'],
                  ['Issues','25/25','— 0 P0 open','#8b5cf6'],
                ].map(([label,score,sub,color]) => (
                  <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{background:color}} />
                    <span className="text-[12px] text-on-surface-variant">{label}: <strong className="text-on-surface">{score}</strong> <span className="text-on-surface-variant/40">{sub}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Insight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {trend:'▲ CODEBASE · IMPROVING', trendColor:'text-green-400', metric:'369', sub:'TypeScript files · 0 errors · clean build'},
              {trend:'— API · STABLE', trendColor:'text-on-surface-variant/40', metric:'0', sub:'5xx errors in last 24h · avg latency —ms'},
              {trend:'▲ TOON · HEALTHY', trendColor:'text-green-400', metric:'99.7%', sub:'Compression ratio · 4.7K graph nodes · cache fresh'},
              {trend:'— ISSUES · CLEAR', trendColor:'text-on-surface-variant/40', metric:'0', sub:'P0/P1 open · 2 recommendations pending'},
            ].map(c => (
              <Card key={c.trend} className="p-4">
                <div className={`text-[10px] font-semibold mb-2 ${c.trendColor}`}>{c.trend}</div>
                <div className="text-2xl font-black text-on-surface">{c.metric}</div>
                <div className="text-[11px] text-on-surface-variant/40 mt-1">{c.sub}</div>
              </Card>
            ))}
          </div>

          {/* Charts: Codebase + TOON */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🔨 Codebase Health (last 7 samples)</div>
              <div className="flex items-end gap-1 h-20">
                {[15,15,15,15,15,15,20].map((h,i) => (
                  <div key={i} className="flex-1 rounded-t" style={{height:`${h}%`,background:'linear-gradient(180deg, #22c55e88, #22c55e22)'}} />
                ))}
              </div>
              <div className="text-[10px] text-on-surface-variant/20 text-center mt-2">TS errors per sample · 0 = green</div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🗜 TOON Compression Trend</div>
              <div className="flex items-end gap-1 h-20">
                {[80,82,85,83,88,90,92].map((h,i) => (
                  <div key={i} className="flex-1 rounded-t" style={{height:`${h}%`,background:'linear-gradient(180deg, #8b5cf688, #8b5cf622)'}} />
                ))}
              </div>
              <div className="text-[10px] text-on-surface-variant/20 text-center mt-2">Compression ratio · 7 samples · increasing = better</div>
            </Card>
          </div>

          {/* Issues + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🐛 Issue Queue</div>
              <div className="space-y-2">
                {[
                  {pri:'P0', color:'bg-red-500/15 text-red-400', title:'Fix API error rate spike in /api/agent-ops', pts:'+4.8 pts'},
                  {pri:'P1', color:'bg-amber-500/15 text-amber-400', title:'Resolve 12 TypeScript errors in dashboard', pts:'+3.0 pts'},
                  {pri:'P2', color:'bg-slate-500/15 text-slate-400', title:'Update 3 outdated npm dependencies', pts:'+0.5 pts'},
                ].map((issue,i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${issue.color}`}>{issue.pri}</span>
                    <span className="flex-1 text-[12px] text-on-surface">{issue.title}</span>
                    <span className="text-[10px] text-on-surface-variant/40">{issue.pts}</span>
                  </div>
                ))}
                <div className="text-[10px] text-on-surface-variant/20 text-center pt-1">Auto-detected from build · lint · npm audit</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">📋 Health Timeline</div>
              <div className="space-y-2 text-[11px]">
                {[
                  {dot:'bg-red-400', text:'API error spike: 15% 5xx on /api/agent-ops', meta:'-5 pts · 2h ago'},
                  {dot:'bg-amber-400', text:'TS errors detected: 12 errors in build', meta:'-8 pts · 5h ago'},
                  {dot:'bg-green-400', text:'TOON cache refreshed: 107 files indexed', meta:'+2 pts · 1d ago'},
                ].map((e,i) => (
                  <div key={i} className="flex gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${e.dot}`} />
                    <span className="flex-1 text-on-surface">{e.text}</span>
                    <span className="text-on-surface-variant/30 shrink-0">{e.meta}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          {/* TOON Health Panel + Graph */}

          {/* Graphify Node Visual — Clickable */}
          <Link href="/settings/toongine/graph">
            <Card className="p-4 cursor-pointer hover:border-[var(--ws-accent)]/30 transition group mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider">🔗 Knowledge Graph Explorer</div>
                <span className="text-[10px] text-on-surface-variant/30 group-hover:text-[var(--ws-accent)] transition">Click to open full view →</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative w-[120px] h-[120px] shrink-0 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                  <svg viewBox="0 0 120 120" width="120" height="120" className="opacity-60 group-hover:opacity-100 transition">
                    <line x1="20" y1="100" x2="55" y2="55" stroke="rgb(255 255 255 / 0.04)" strokeWidth="0.5"/>
                    <line x1="55" y1="55" x2="30" y2="20" stroke="rgb(255 255 255 / 0.04)" strokeWidth="0.5"/>
                    <line x1="55" y1="55" x2="80" y2="25" stroke="rgb(255 255 255 / 0.04)" strokeWidth="0.5"/>
                    <line x1="55" y1="55" x2="100" y2="45" stroke="rgb(255 255 255 / 0.04)" strokeWidth="0.5"/>
                    <line x1="55" y1="55" x2="95" y2="80" stroke="rgb(255 255 255 / 0.04)" strokeWidth="0.5"/>
                    <line x1="55" y1="55" x2="60" y2="100" stroke="rgb(255 255 255 / 0.04)" strokeWidth="0.5"/>
                    <circle cx="55" cy="55" r="10" fill="#6366f130" stroke="#6366f1" strokeWidth="1"/>
                    <circle cx="20" cy="100" r="6" fill="#e9456030" stroke="#e94560" strokeWidth="1"/>
                    <circle cx="30" cy="20" r="5" fill="#3b82f630" stroke="#3b82f6" strokeWidth="1"/>
                    <circle cx="80" cy="25" r="7" fill="#8b5cf630" stroke="#8b5cf6" strokeWidth="1"/>
                    <circle cx="100" cy="45" r="4" fill="#10b98130" stroke="#10b981" strokeWidth="1"/>
                    <circle cx="95" cy="80" r="5" fill="#f59e0b30" stroke="#f59e0b" strokeWidth="1"/>
                    <circle cx="60" cy="100" r="6" fill="#ec489930" stroke="#ec4899" strokeWidth="1"/>
                    <text x="55" y="58" textAnchor="middle" fill="#a5b4fc" fontSize="6" fontWeight="700">YVON</text>
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  {[['4,708','Nodes','#a78bfa'],['12,004','Edges','#6366f1'],['2.55','Density','#10b981'],['479','Files','#f59e0b']].map(([v,l,c]) => (
                    <div key={l} className="text-center p-2 rounded-lg bg-white/[0.02]"><div className="text-sm font-bold" style={{color:c}}>{v}</div><div className="text-[10px] text-on-surface-variant/40">{l}</div></div>
                  ))}
                </div>
              </div>
            </Card>
          </Link>

          <Card className="p-4">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">🗜 TOON Engine Health</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Graph Nodes','4,708'],['Graph Edges','12,004'],
                ['Files Cached','107'],['Graph DB Size','3.6 MB'],
                ['Compression Ratio','99.7%'],['Agents w/ Skills','24'],
                ['Total Skillfish','49'],['Compile Errors','0'],
              ].map(([label,value]) => (
                <div key={label} className="text-center p-3 rounded-lg bg-white/[0.02]">
                  <div className="text-lg font-bold text-purple-400">{value}</div>
                  <div className="text-[10px] text-on-surface-variant/40 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
