'use client'

import { useState, useEffect, useCallback } from 'react'
import { getModelDisplay, formatCost } from '@/lib/token-cost'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AgentUsage {
  agentId: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  costUsd: number
  requests: number
}

interface RouteUsage {
  route: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  requests: number
}

interface ModelUsage {
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  requests: number
}

interface DailyBucket {
  date: string
  inputTokens: number
  outputTokens: number
  costUsd: number
}

interface UsageData {
  days: number
  totals: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheCreationTokens: number
    totalTokens: number
    costUsd: number
    requests: number
  }
  cacheHitRate: number
  byAgent: AgentUsage[]
  byRoute: RouteUsage[]
  byModel: ModelUsage[]
  daily: DailyBucket[]
  hasData: boolean
}

// ── Mock data — shown when Supabase table isn't set up yet ────────────────────
const MOCK_DATA: UsageData = {
  days: 30,
  hasData: false,
  totals: {
    inputTokens: 284_620,
    outputTokens: 94_830,
    cacheReadTokens: 186_400,
    cacheCreationTokens: 42_100,
    totalTokens: 379_450,
    costUsd: 3.847,
    requests: 147,
  },
  cacheHitRate: 40,
  byAgent: [
    { agentId: 'marcus-ceo',         inputTokens: 68_200, outputTokens: 24_100, cacheReadTokens: 52_000, costUsd: 1.142, requests: 34 },
    { agentId: 'dev-lead',           inputTokens: 42_100, outputTokens: 18_200, cacheReadTokens: 31_000, costUsd: 0.874, requests: 19 },
    { agentId: 'sofia-social',        inputTokens: 38_400, outputTokens: 12_800, cacheReadTokens: 28_400, costUsd: 0.712, requests: 22 },
    { agentId: 'kai-analyst',        inputTokens: 28_900, outputTokens: 9_400,  cacheReadTokens: 18_200, costUsd: 0.514, requests: 18 },
    { agentId: 'zara-competitor',    inputTokens: 22_400, outputTokens: 8_100,  cacheReadTokens: 14_800, costUsd: 0.392, requests: 14 },
    { agentId: 'stark-growth',       inputTokens: 18_200, outputTokens: 7_200,  cacheReadTokens: 12_400, costUsd: 0.213, requests: 12 },
  ],
  byRoute: [
    { route: 'war-room',        inputTokens: 124_400, outputTokens: 38_200, costUsd: 1.842, requests: 62 },
    { route: 'individual-chat', inputTokens: 98_200,  outputTokens: 42_100, costUsd: 1.412, requests: 58 },
    { route: 'briefing',        inputTokens: 42_100,  outputTokens: 8_400,  costUsd: 0.412, requests: 18 },
    { route: 'creative-studio', inputTokens: 19_920,  outputTokens: 6_130,  costUsd: 0.181, requests: 9 },
  ],
  byModel: [
    { model: 'claude-sonnet-4-6',         inputTokens: 218_400, outputTokens: 78_200, costUsd: 2.824, requests: 112 },
    { model: 'claude-opus-4-6',           inputTokens: 42_100,  outputTokens: 9_400,  costUsd: 0.841, requests: 19 },
    { model: 'claude-haiku-4-5-20251001', inputTokens: 24_120,  outputTokens: 7_230,  costUsd: 0.182, requests: 16 },
  ],
  daily: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86_400_000)
    const base = 8_000 + Math.sin(i * 0.4) * 3_000 + Math.random() * 2_000
    return {
      date: d.toISOString().slice(0, 10),
      inputTokens:  Math.round(base),
      outputTokens: Math.round(base * 0.33),
      costUsd:      Math.round(base * 0.000012 * 10000) / 10000,
    }
  }),
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SH({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--b1)' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)' }}>{children}</div>
      {sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '14px' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.08em', color: 'var(--di)', marginBottom: '8px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '22px', color: accent ?? 'var(--br)' }}>{value}</div>
      {sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 2
  return (
    <div style={{ flex: 1, height: '6px', background: 'var(--b2)', borderRadius: '0' }}>
      <div style={{ height: '6px', width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function agentDisplayName(id: string): string {
  const names: Record<string, string> = {
    'marcus-ceo': 'Marcus', 'diana-coo': 'Diana',
    'sofia-social': 'Sofia', 'lena-brand': 'Lena', 'rio-ads': 'Rio',
    'atlas-art-director': 'Atlas', 'pixel-production': 'Pixel',
    'kai-analyst': 'Kai', 'zara-competitor': 'Zara', 'nate-growth': 'Nate',
    'venture-scout': 'Scout', 'dev-lead': 'Dev', 'raj-backend': 'Raj',
    'mia-frontend': 'Mia', 'quinn-qa': 'Quinn', 'felix-finance': 'Felix',
    'stark-growth': 'Stark', 'unknown': '—',
  }
  return names[id] ?? id
}

function agentColor(id: string): string {
  const colors: Record<string, string> = {
    'marcus-ceo': '#A080E0', 'diana-coo': '#9070D0', 'alex-marketing-dir': '#50C090',
    'sofia-social': '#60A0E0', 'lena-brand': '#60A0E0', 'rio-ads': '#E09050',
    'atlas-art-director': '#6366F1', 'pixel-production': '#8B5CF6', 'opus-creative-ops': '#C084FC',
    'kai-analyst': '#888888', 'zara-competitor': '#666666', 'nate-growth': '#666666',
    'venture-scout': '#06B6D4', 'dev-lead': '#06B6D4', 'raj-backend': '#8B5CF6',
    'mia-frontend': '#D946EF', 'stark-growth': '#84CC16',
  }
  return colors[id] ?? 'var(--di)'
}

function routeLabel(r: string): string {
  const map: Record<string, string> = {
    'war-room': 'War Room', 'individual-chat': 'Agent Chat', 'briefing': 'CEO Brief',
    'creative-studio': 'Creative Studio', 'personal': 'Personal', 'scout': 'Scout', 'unknown': 'Unknown',
  }
  return map[r] ?? r
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function DailyChart({ daily, metric }: { daily: DailyBucket[]; metric: 'tokens' | 'cost' }) {
  const values = daily.map(d => metric === 'cost' ? d.costUsd : d.inputTokens + d.outputTokens)
  const max = Math.max(...values, 1)
  const recent = daily.slice(-7)
  void recent // recentMax removed — chart uses global max for consistent scale

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '64px', marginBottom: '6px' }}>
        {daily.map((d, i) => {
          const v = metric === 'cost' ? d.costUsd : d.inputTokens + d.outputTokens
          const h = Math.max(4, (v / max) * 64)
          const isRecent = i >= daily.length - 7
          return (
            <div
              key={d.date}
              title={`${d.date}: ${metric === 'cost' ? formatCost(d.costUsd) : ((d.inputTokens + d.outputTokens) / 1000).toFixed(1) + 'K tokens'}`}
              style={{ flex: 1, height: `${h}px`, background: isRecent ? 'var(--ac)' : 'var(--b3)', cursor: 'default' }}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)' }}>
          {daily[0]?.date}
        </span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)' }}>
          7-day avg: {metric === 'cost'
            ? formatCost(recent.reduce((s, d) => s + d.costUsd, 0) / 7)
            : Math.round(recent.reduce((s, d) => s + d.inputTokens + d.outputTokens, 0) / 7 / 1000) + 'K'
          }
        </span>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)' }}>
          Today
        </span>
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function TokenUsagePage() {
  const [data, setData] = useState<UsageData>(MOCK_DATA)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'agents' | 'routes' | 'models'>('agents')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/token-usage?days=${days}`)
      if (res.ok) {
        const json = await res.json() as UsageData
        setData(json.hasData ? json : { ...MOCK_DATA, ...json, hasData: false })
      }
    } catch { /* keep mock */ }
    finally { setLoading(false) }
  }, [days])

  useEffect(() => { void load() }, [load])

  const { totals, cacheHitRate, byAgent, byRoute, byModel, daily } = data
  const maxAgentCost = Math.max(...byAgent.map(a => a.costUsd), 0.001)
  const maxRouteCost = Math.max(...byRoute.map(r => r.costUsd), 0.001)
  const maxModelCost = Math.max(...byModel.map(m => m.costUsd), 0.001)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            Token Usage
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            Cost by agent · Route breakdown · Cache efficiency · Daily trend
            {!data.hasData && <span style={{ color: 'var(--am)', marginLeft: '8px' }}>· Preview data — connect Supabase token_usage table to see real usage</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 10px', background: days === d ? 'var(--b3)' : 'none', border: `1px solid ${days === d ? 'var(--b3)' : 'var(--b2)'}`, color: days === d ? 'var(--br)' : 'var(--di)', cursor: 'pointer' }}>
              {d}d
            </button>
          ))}
          <button onClick={load} disabled={loading} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '5px 12px', background: 'none', border: '1px solid var(--b2)', color: loading ? 'var(--di)' : 'var(--ac)', cursor: 'pointer', marginLeft: '4px' }}>
            {loading ? '…' : 'REFRESH'}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1px', background: 'var(--b1)' }}>
        <KpiCard label="Total Cost" value={formatCost(totals.costUsd)} sub={`${days} days`} accent="var(--ac)" />
        <KpiCard label="Total Tokens" value={`${Math.round(totals.totalTokens / 1000)}K`} sub={`${totals.requests} requests`} />
        <KpiCard label="Input Tokens" value={`${Math.round(totals.inputTokens / 1000)}K`} />
        <KpiCard label="Output Tokens" value={`${Math.round(totals.outputTokens / 1000)}K`} />
        <KpiCard label="Cache Hit Rate" value={`${cacheHitRate}%`} sub={`${Math.round(totals.cacheReadTokens / 1000)}K saved`} accent={cacheHitRate > 30 ? 'var(--gn)' : 'var(--am)'} />
        <KpiCard label="Daily Avg Cost" value={formatCost(totals.costUsd / days)} sub="per day" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Left: Daily chart */}
        <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '16px' }}>
          <SH>Daily Cost — {days} Days</SH>
          <DailyChart daily={daily} metric="cost" />
          <div style={{ marginTop: '16px' }}>
            <SH>Daily Tokens — {days} Days</SH>
            <DailyChart daily={daily} metric="tokens" />
          </div>
        </div>

        {/* Right: Model split */}
        <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '16px' }}>
          <SH sub="Cost and tokens by model tier">Model Split</SH>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {byModel.map(m => (
              <div key={m.model}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--tx)' }}>{getModelDisplay(m.model)}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--ac)' }}>{formatCost(m.costUsd)}</span>
                </div>
                <Bar value={m.costUsd} max={maxModelCost} color="var(--ac)" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)' }}>{m.requests} req</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)' }}>{Math.round((m.inputTokens + m.outputTokens) / 1000)}K tokens</span>
                </div>
              </div>
            ))}
          </div>

          {/* Cache savings callout */}
          <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg)', borderLeft: '2px solid var(--gn)' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', letterSpacing: '0.08em', marginBottom: '4px' }}>PROMPT CACHE</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '13px', color: 'var(--gn)' }}>{cacheHitRate}% hit rate</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', marginTop: '2px' }}>
              {Math.round(totals.cacheReadTokens / 1000)}K tokens read from cache
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown tabs */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '16px' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--b1)', marginBottom: '16px', marginTop: '-4px' }}>
          {(['agents', 'routes', 'models'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--ac)' : '2px solid transparent',
                color: tab === t ? 'var(--ac)' : 'var(--di)',
                cursor: 'pointer',
                marginBottom: '-1px',
              }}
            >
              BY {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* BY AGENTS */}
        {tab === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {byAgent.map((a, i) => (
              <div key={a.agentId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ width: '16px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: agentColor(a.agentId), flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', width: '80px', flexShrink: 0 }}>{agentDisplayName(a.agentId)}</span>
                  <Bar value={a.costUsd} max={maxAgentCost} color={agentColor(a.agentId)} />
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--ac)', width: '56px', textAlign: 'right', flexShrink: 0 }}>{formatCost(a.costUsd)}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', width: '48px', textAlign: 'right', flexShrink: 0 }}>{Math.round((a.inputTokens + a.outputTokens) / 1000)}K tok</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', width: '40px', textAlign: 'right', flexShrink: 0 }}>{a.requests} req</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BY ROUTES */}
        {tab === 'routes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {byRoute.map((r, i) => (
              <div key={r.route}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ width: '16px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', width: '120px', flexShrink: 0 }}>{routeLabel(r.route)}</span>
                  <Bar value={r.costUsd} max={maxRouteCost} color="var(--bl)" />
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--ac)', width: '56px', textAlign: 'right', flexShrink: 0 }}>{formatCost(r.costUsd)}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', width: '48px', textAlign: 'right', flexShrink: 0 }}>{Math.round((r.inputTokens + r.outputTokens) / 1000)}K tok</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', width: '40px', textAlign: 'right', flexShrink: 0 }}>{r.requests} req</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BY MODELS */}
        {tab === 'models' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {byModel.map((m, i) => (
              <div key={m.model}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ width: '16px', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--tx)', width: '80px', flexShrink: 0 }}>{getModelDisplay(m.model)}</span>
                  <Bar value={m.costUsd} max={maxModelCost} color="var(--ac)" />
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--ac)', width: '56px', textAlign: 'right', flexShrink: 0 }}>{formatCost(m.costUsd)}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', width: '48px', textAlign: 'right', flexShrink: 0 }}>{Math.round((m.inputTokens + m.outputTokens) / 1000)}K tok</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', width: '40px', textAlign: 'right', flexShrink: 0 }}>{m.requests} req</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supabase setup note — shown when no real data */}
      {!data.hasData && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderLeft: '2px solid var(--am)', padding: '16px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--am)', letterSpacing: '0.08em', marginBottom: '8px' }}>SETUP REQUIRED — PREVIEW DATA SHOWN ABOVE</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: 'var(--di)', lineHeight: 1.7 }}>
            To see real token usage, create the <code style={{ color: 'var(--ac)' }}>token_usage</code> table in Supabase:<br />
            <code style={{ color: 'var(--tx)', display: 'block', marginTop: '8px', padding: '10px', background: 'var(--bg)', fontSize: '11px', lineHeight: 1.6 }}>
              {`create table token_usage (
  id uuid default gen_random_uuid() primary key,
  agent_id text,
  route text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_creation_tokens int not null default 0,
  cost_usd numeric(10,6) not null default 0,
  venture_id text,
  created_at timestamptz default now()
);
create index on token_usage (created_at desc);
create index on token_usage (agent_id);`}
            </code>
            Once the table exists, every call to <code style={{ color: 'var(--ac)' }}>/api/claude</code> will automatically log token usage.
          </div>
        </div>
      )}
    </div>
  )
}
