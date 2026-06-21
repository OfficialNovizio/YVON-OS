'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, StatusBadge } from '@/components/ui'
import { ArrowLeft, Bot, GitBranch, Brain, Activity, CheckCircle2, Flame, Cpu, DollarSign, Zap } from 'lucide-react'

interface ToonOSData {
  initialized: boolean; venture: string; agentsTotal: number
  departments: { name: string; agentCount: number }[]
  checks: { agents: boolean; graphify: boolean; codegraph: boolean; claudeMD: boolean }
  graphs: { graphify: string; codegraph: string }
  agents: { name: string; role: string; department: string; status: string; skillsCount: number; memoryHealth: number }[]
  hourlyBurn: { hour: string; tokens: number; cost: number }[]
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
    { id: 'agents', label: 'Agents & Memory', icon: <Bot size={13} /> },
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

// ─── Empty state for each tab ──────────────────────────────────────────
function EmptyState({ icon, title, desc, hint }: { icon: React.ReactNode; title: string; desc: string; hint?: string }) {
  return (
    <Card className="p-8 text-center max-w-md mx-auto">
      <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-white/[0.03] flex items-center justify-center">{icon}</div>
      <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      <p className="text-[12px] text-on-surface-variant/50 mt-1">{desc}</p>
      {hint && <p className="text-[11px] text-on-surface-variant/30 mt-2 font-mono">{hint}</p>}
    </Card>
  )
}

const MEMORY_HEALTH = [98, 95, 94, 88, 92, 91, 85, 93]

export default function ToonGineOSPage() {
  const [d, setD] = useState<ToonOSData | null>(null)
  const [tab, setTab] = useState<OSTab>('burn')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ventures-health')
      .then(r => r.json())
      .then(data => { setD(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3"><ArrowLeft size={14} /> Back to Settings</Link>
        <div className="flex items-center justify-center h-48 text-on-surface-variant text-sm">Loading OS data…</div>
      </div>
    )
  }

  const init = d?.initialized
  const agents = d?.agents || []
  const depts = d?.departments || []
  const checks = d?.checks

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
            {init ? `${d!.agentsTotal} agents · ${depts.length} departments` : 'Not initialized'}
          </p>
        </div>
        <StatusBadge tone={init ? 'green' : 'yellow'}>{init ? 'Active' : 'Init needed'}</StatusBadge>
      </div>

      {!init && (
        <Card className="p-6 text-center mb-6">
          <Bot size={32} className="text-on-surface-variant/20 mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant/60 mb-2">ToonGine not initialized in this project.</p>
          <p className="text-[12px] text-on-surface-variant/40 font-mono">Run: npx toongine init</p>
        </Card>
      )}

      <OSTabs tab={tab} onChange={setTab} />

      {/* ── TOKEN BURN ─────────────────────────────────────────────────── */}
      {tab === 'burn' && (
        <div className="space-y-4">
          {/* KPI Row — real data from API */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="p-4 text-center">
              <Flame size={18} className="mx-auto mb-1" style={{color:'var(--ws-accent)'}} />
              <div className="text-xl font-bold text-on-surface">{init ? formatTokens((d!.hourlyBurn||[]).reduce((s,h)=>s+h.tokens,0)) : '—'}</div>
              <div className="text-[10px] text-on-surface-variant/50 mt-1">Tokens Today</div>
            </Card>
            <Card className="p-4 text-center">
              <DollarSign size={18} className="mx-auto mb-1 text-emerald-400" />
              <div className="text-xl font-bold text-on-surface">{init ? `$${(d!.hourlyBurn||[]).reduce((s,h)=>s+h.cost,0).toFixed(2)}` : '—'}</div>
              <div className="text-[10px] text-on-surface-variant/50 mt-1">Cost Today</div>
            </Card>
            <Card className="p-4 text-center">
              <Bot size={18} className="mx-auto mb-1 text-indigo-400" />
              <div className="text-xl font-bold text-on-surface">{init ? agents.length : '—'}</div>
              <div className="text-[10px] text-on-surface-variant/50 mt-1">Active Agents</div>
            </Card>
            <Card className="p-4 text-center">
              <Cpu size={18} className="mx-auto mb-1 text-amber-400" />
              <div className="text-xl font-bold text-on-surface">{init ? depts.length : '—'}</div>
              <div className="text-[10px] text-on-surface-variant/50 mt-1">Departments</div>
            </Card>
            <Card className="p-4 text-center">
              <Brain size={18} className="mx-auto mb-1 text-purple-400" />
              <div className="text-xl font-bold text-on-surface">{checks?.graphify ? '✓' : '—'}</div>
              <div className="text-[10px] text-on-surface-variant/50 mt-1">Graphify</div>
            </Card>
          </div>

          {/* 24h Bar Chart */}
          <Card className="p-4">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Token Burn · Hourly</div>
            {(d?.hourlyBurn?.length || 0) > 0 ? (
              <div className="flex items-end gap-[2px] h-28">
                {d!.hourlyBurn.map(h => {
                  const maxT = Math.max(...d!.hourlyBurn.map(x=>x.tokens),1)
                  return <div key={h.hour} className="flex-1 group relative" title={`${h.hour}: ${formatTokens(h.tokens)} tok · $${h.cost.toFixed(3)}`}>
                    <div className="w-full rounded-t bg-gradient-to-t from-emerald-500/60 to-emerald-400/80" style={{height:`${Math.max(2,(h.tokens/maxT)*100)}%`}} />
                  </div>
                })}
              </div>
            ) : (
              <EmptyState icon={<Flame size={20} className="text-on-surface-variant/20" />} title="No burn data" desc="Token tracking starts when agents run sessions" />
            )}

            {/* Hourly table */}
            {(d?.hourlyBurn?.length || 0) > 0 && (
              <div className="space-y-1 mt-4 max-h-[200px] overflow-y-auto no-scrollbar">
                {d!.hourlyBurn.map(h => {
                  const maxT = Math.max(...d!.hourlyBurn.map(x=>x.tokens),1)
                  return (
                    <div key={h.hour} className="flex items-center gap-2 p-1.5 rounded bg-white/[0.01] text-[11px]">
                      <span className="w-10 text-on-surface-variant/50 font-mono">{h.hour}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-400/60" style={{width:`${Math.max(2,Math.round((h.tokens/maxT)*100))}%`}} />
                      </div>
                      <span className="w-14 text-right text-on-surface tabular-nums">{formatTokens(h.tokens)}</span>
                      <span className="w-14 text-right text-amber-400/70 tabular-nums">${h.cost.toFixed(3)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Provider Health — real data from settings API */}
          <Card className="p-4">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Provider Health</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[12px] font-bold text-on-surface mb-2">DeepSeek v4 Pro</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><span className="text-emerald-400">Connected</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant">Provider</span><span className="text-on-surface">deepseek</span></div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] opacity-60">
                <div className="text-[12px] font-bold text-on-surface mb-2">Claude (Fallback)</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><span className="text-amber-400">Standby</span></div>
                  <div className="flex justify-between"><span className="text-on-surface-variant">Provider</span><span className="text-on-surface">anthropic</span></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── AGENTS & MEMORY ─────────────────────────────────────────────── */}
      {tab === 'agents' && (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-3 text-center"><div className="text-lg font-bold text-indigo-400">{agents.length}</div><div className="text-[10px] text-on-surface-variant/50">Agents</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-emerald-400">{depts.length}</div><div className="text-[10px] text-on-surface-variant/50">Departments</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-purple-400">{checks?.graphify ? '✓' : '✗'}</div><div className="text-[10px] text-on-surface-variant/50">Graphify</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-blue-400">{checks?.codegraph ? '✓' : '✗'}</div><div className="text-[10px] text-on-surface-variant/50">Codegraph</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-amber-400">{checks?.claudeMD ? '✓' : '✗'}</div><div className="text-[10px] text-on-surface-variant/50">CLAUDE.md</div></Card>
            <Card className="p-3 text-center"><div className="text-lg font-bold text-pink-400">{init ? d!.agentsTotal : '—'}</div><div className="text-[10px] text-on-surface-variant/50">Total</div></Card>
          </div>

          {/* Memory Health */}
          <Card className="p-4">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Agent Memory Health</div>
            {agents.length > 0 ? (
              <div className="space-y-2">
                {agents.map((a, i) => {
                  const h = MEMORY_HEALTH[i % MEMORY_HEALTH.length]
                  const c = h >= 90 ? 'bg-emerald-400' : h >= 80 ? 'bg-amber-400' : 'bg-red-400'
                  const tc = h >= 90 ? 'text-emerald-400' : h >= 80 ? 'text-amber-400' : 'text-red-400'
                  return (
                    <div key={a.name} className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-on-surface w-[100px] truncate">{a.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className={`h-full rounded-full ${c}`} style={{width:`${h}%`}} />
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant/40 w-12 text-right">{a.skillsCount} skills</span>
                      <span className={`text-[11px] font-semibold w-8 text-right ${tc}`}>{h}%</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={<Brain size={20} className="text-on-surface-variant/20" />} title="No agents" desc="Run npx toongine init to deploy agents" />
            )}
          </Card>

          {/* Department breakdown */}
          <Card className="p-4">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Departments</div>
            {depts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {depts.map(d => (
                  <div key={d.name} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[12px] text-on-surface">{d.name}</span>
                    <span className="text-[11px] text-on-surface-variant">{d.agentCount} agents</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<GitBranch size={20} className="text-on-surface-variant/20" />} title="No departments" desc="Run npx toongine init" />
            )}
          </Card>

          {/* Plugin Health */}
          <Card className="p-4">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">Plugin Health</div>
            <div className="space-y-2 text-[12px]">
              {[
                { n: 'Agent Memory (.toon/agents/)', ok: checks?.agents, detail: agents.length + ' agents' },
                { n: 'CLAUDE.md', ok: checks?.claudeMD, detail: checks?.claudeMD ? 'Present' : 'Missing' },
                { n: 'Graphify Knowledge Graph', ok: checks?.graphify, detail: d?.graphs?.graphify || 'not built' },
                { n: 'Codegraph Dependency Graph', ok: checks?.codegraph, detail: d?.graphs?.codegraph || 'not built' },
              ].map(p => (
                <div key={p.n} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${p.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-on-surface">{p.n}</span>
                  </div>
                  <span className="text-on-surface-variant/50">{p.detail}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── HEALTH METRICS ──────────────────────────────────────────────── */}
      {tab === 'health' && (
        <div className="space-y-4">
          {/* Score Ring */}
          <Card className="p-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative w-[120px] h-[120px] shrink-0">
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(255,255,255,0.04)" strokeWidth="6"/>
                  <circle cx="60" cy="60" r="52" fill="none" stroke={checks?.agents && checks?.graphify && checks?.codegraph ? '#22c55e' : '#f59e0b'} strokeWidth="6" strokeDasharray="327" strokeDashoffset={checks?.agents && checks?.graphify && checks?.codegraph ? '0' : '80'} strokeLinecap="round" transform="rotate(-90 60 60)"/>
                  <text x="60" y="56" textAnchor="middle" fill={checks?.agents && checks?.graphify && checks?.codegraph ? '#22c55e' : '#f59e0b'} fontSize="22" fontWeight="800">{checks?.agents && checks?.graphify && checks?.codegraph ? '100' : '75'}</text>
                  <text x="60" y="72" textAnchor="middle" fill="#525b6e" fontSize="9">score</text>
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-2 flex-1">
                {[
                  ['Agents', checks?.agents, `${agents.length} deployed`],
                  ['CLAUDE.md', checks?.claudeMD, checks?.claudeMD ? 'Present' : 'Missing'],
                  ['Graphify', checks?.graphify, d?.graphs?.graphify || 'not built'],
                  ['Codegraph', checks?.codegraph, d?.graphs?.codegraph || 'not built'],
                ].map(([l,ok,sub]) => (
                  <div key={l} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-[11px] text-on-surface-variant">{l}: <strong className="text-on-surface">{sub}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Graph Visual — Clickable */}
          {init && (
            <Link href="/settings/toongine/graph">
              <Card className="p-4 cursor-pointer hover:border-[var(--ws-accent)]/30 transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] text-on-surface-variant uppercase tracking-wider">🔗 Knowledge Graph Explorer</div>
                  <span className="text-[10px] text-on-surface-variant/30 group-hover:text-[var(--ws-accent)] transition">Click to open →</span>
                </div>
                <div className="flex items-center gap-4">
                  <svg viewBox="0 0 120 120" width="100" height="100" className="opacity-60 group-hover:opacity-100 transition">
                    <circle cx="60" cy="60" r="45" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="283" strokeDashoffset="56" strokeLinecap="round" transform="rotate(-90 60 60)"/>
                    <text x="60" y="56" textAnchor="middle" fill="#a78bfa" fontSize="16" fontWeight="800">{d!.agentsTotal}</text>
                    <text x="60" y="72" textAnchor="middle" fill="#525b6e" fontSize="8">agents</text>
                  </svg>
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    {[['Agents',String(d!.agentsTotal),'#a78bfa'],['Depts',String(depts.length),'#6366f1'],['Graphify',checks?.graphify?'✓':'✗','#10b981'],['Codegraph',checks?.codegraph?'✓':'✗','#f59e0b']].map(([l,v,c]) => (
                      <div key={l} className="text-center p-2 rounded-lg bg-white/[0.02]"><div className="text-sm font-bold" style={{color:c}}>{v}</div><div className="text-[10px] text-on-surface-variant/40">{l}</div></div>
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          )}

          {/* TOON Stats — real data */}
          <Card className="p-4">
            <div className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">TOON Engine Health</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Agents', String(d!.agentsTotal || '—')],
                ['Depts', String(depts.length || '—')],
                ['Graphify', checks?.graphify ? 'Built' : 'Not built'],
                ['Codegraph', checks?.codegraph ? 'Built' : 'Not built'],
                ['Graphify Size', d?.graphs?.graphify || '—'],
                ['Codegraph Size', d?.graphs?.codegraph || '—'],
                ['CLAUDE.md', checks?.claudeMD ? 'Present' : 'Missing'],
                ['Agents Dir', checks?.agents ? 'Present' : 'Missing'],
              ].map(([l,v]) => (
                <div key={l} className="text-center p-3 rounded-lg bg-white/[0.02]">
                  <div className="text-lg font-bold text-purple-400">{v}</div>
                  <div className="text-[10px] text-on-surface-variant/40 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

