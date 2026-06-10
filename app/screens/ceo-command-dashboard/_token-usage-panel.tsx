'use client';

import { useState, useEffect, useMemo } from 'react';

const ACCENT = '#0066cc';
const GREEN  = '#047857';
const VIOLET = '#4f46e5';
const RED = '#dc2626';
const AMBER = '#d97706';
const I1='#0c2c52', I1b='#1a3e6e', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';

// ── Types ──────────────────────────────────────────────────────────────────────
interface TokenTotals { inputTokens: number; outputTokens: number; totalTokens: number; cacheReadTokens: number; costUsd: number; requests: number }
interface ModelRow    { model: string; inputTokens: number; outputTokens: number; costUsd: number; requests: number }
interface AgentRow    { agentId: string; inputTokens: number; outputTokens: number; cacheReadTokens: number; costUsd: number; requests: number }
interface RouteRow    { route: string; inputTokens: number; outputTokens: number; costUsd: number; requests: number }
interface DailyRow    { date: string; costUsd: number; inputTokens: number; outputTokens: number }
interface TokenData   { totals: TokenTotals; cacheHitRate: number; byModel: ModelRow[]; byAgent: AgentRow[]; byRoute: RouteRow[]; daily: DailyRow[]; hasData: boolean }
interface BalanceData { total: number; toppedUp: number; granted: number; currency: string }

function fmt(n: number) { if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(0)}k`; return String(n); }
function fmtCost(u: number) { if (u < 0.001) return '<$0.001'; if (u < 1) return `$${u.toFixed(4)}`; return `$${u.toFixed(2)}`; }
function modelShort(m: string) { if (m.includes('deepseek')) return 'DeepSeek'; if (m.includes('opus')) return 'Opus'; if (m.includes('sonnet')) return 'Sonnet'; return m.split('/').pop()?.split('-').slice(0,2).join('-') ?? m; }
function modelColor(m: string) { if (m.includes('deepseek')) return VIOLET; if (m.includes('opus')) return VIOLET; if (m.includes('sonnet')) return ACCENT; return '#64748b'; }

function agentLabel(aid: string): string {
  const map: Record<string, string> = {
    'marcus-ceo': 'Marcus', 'diana-coo': 'Diana', 'dev-lead': 'Dev',
    'raj-backend': 'Raj', 'mia-frontend': 'Mia', 'quinn-qa': 'Quinn',
    'kai-analyst': 'Kai', 'lena-brand': 'Lena', 'rio-ads': 'Rio',
    'nate-growth': 'Nate', 'atlas-art-director': 'Atlas', 'pixel-production': 'Pixel',
    'felix-finance': 'Felix',
  };
  return map[aid] ?? aid.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function routeLabel(rt: string): string {
  const map: Record<string, string> = {
    'unknown': 'Other / Direct',
    '/api/growth-sprint': 'Growth Sprint',
    '/api/content-intelligence': 'Content Intel',
    '/api/creative-studio': 'Creative Studio',
    '/api/kai-read': "Kai's Read",
    '/api/kai-report': 'Kai Report',
    '/api/auto-competitors': 'Auto Competitors',
    '/api/team-chat': 'War Room',
    '/api/calendar-verify': 'Calendar Verify',
  };
  return map[rt] ?? rt.replace('/api/', '').replace(/-/g, ' ');
}

// ── Panel ──────────────────────────────────────────────────────────────────────
export function TokenUsagePanel() {
  const [data, setData] = useState<TokenData | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetch('/api/token-usage?days=30')
      .then(r => r.json()).then((d: TokenData) => setData(d)).catch(() => {});
    fetch('/api/deepseek-balance')
      .then(r => r.json()).then((d: { balance: BalanceData | null }) => {
        if (d.balance) setBalance(d.balance);
      }).catch(() => {});
  }, []);

  const G1: React.CSSProperties = {
    background: 'rgba(255,255,255,0.32)',
    backdropFilter: 'blur(32px) saturate(160%)',
    WebkitBackdropFilter: 'blur(32px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.55)',
    borderRadius: 22,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)',
  };

  const dailyBars = useMemo(() => {
    if (!data?.daily?.length) return [];
    const recent = data.daily.slice(-14);
    const max = Math.max(...recent.map(d => d.costUsd), 0.0001);
    return recent.map(d => ({ date: d.date.slice(5), cost: d.costUsd, pct: Math.max(4, (d.costUsd / max) * 90) }));
  }, [data]);

  const deepseekBalance = balance?.total ?? null;
  const budgetUsed = data?.totals.costUsd ?? 0;
  const totalForBar = deepseekBalance ? deepseekBalance + budgetUsed : 50;
  const budgetPct = Math.min(100, (budgetUsed / totalForBar) * 100);
  const budgetColor = budgetPct > 90 ? RED : budgetPct > 70 ? AMBER : GREEN;

  return (
    <div style={{ ...G1, padding: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0 }}>
            Token / AI Usage
          </p>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: VIOLET, padding: '2px 8px', borderRadius: 999, border: `1px solid ${VIOLET}44`, background: `${VIOLET}14` }}>LIVE</span>
        </div>
        <span style={{ fontSize: 11, color: I1d, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>30-day</span>
      </div>

      {!data ? (
        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, border: `2px solid ${L1}`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* ── Balance row ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, padding: '12px 16px', borderRadius: 14, background: 'rgba(12,44,82,0.04)', border: `1px solid ${L1}` }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d }}>Balance</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: balance ? GREEN : I1d, marginTop: 2 }}>
                {balance ? fmtCost(deepseekBalance!) : '—'}
              </div>
              {balance && (
                <div style={{ fontSize: 9, fontWeight: 600, color: I1d, marginTop: 2 }}>
                  topped up {fmtCost(balance.toppedUp)}{balance.granted > 0 ? ` + ${fmtCost(balance.granted)} granted` : ''}
                </div>
              )}
            </div>
            <div style={{ flex: 1, padding: '12px 16px', borderRadius: 14, background: 'rgba(12,44,82,0.04)', border: `1px solid ${L1}` }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d }}>Spent (30d)</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: budgetUsed > 0 ? I1 : I1d, marginTop: 2 }}>{fmtCost(budgetUsed)}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: I1d, marginTop: 2 }}>{data.totals.requests.toLocaleString()} requests</div>
            </div>
            <div style={{ flex: 1, padding: '12px 16px', borderRadius: 14, background: 'rgba(12,44,82,0.04)', border: `1px solid ${L1}` }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d }}>Cache Rate</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: data.cacheHitRate > 30 ? GREEN : AMBER, marginTop: 2 }}>{data.cacheHitRate}%</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: I1d, marginTop: 2 }}>{fmt(data.totals.cacheReadTokens)} tokens cached</div>
            </div>
          </div>

          {/* ── Budget bar ──────────────────────────────────────────── */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: I1d }}>{balance ? 'DeepSeek' : 'Est.'} usage</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: budgetColor }}>{fmtCost(budgetUsed)} / {fmtCost(totalForBar)} ({budgetPct.toFixed(0)}%)</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(12,44,82,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${budgetPct}%`, borderRadius: 3, background: budgetColor, transition: 'width 400ms ease' }} />
            </div>
          </div>

          {/* ── Daily chart ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 55 }}>
            {dailyBars.map((b, i) => (
              <div key={i} title={`${b.date}: ${fmtCost(b.cost)}`} style={{
                flex: 1, height: `${b.pct}%`,
                background: i === dailyBars.length - 1 ? VIOLET : ACCENT,
                borderRadius: '2px 2px 0 0', opacity: i === dailyBars.length - 1 ? 1 : 0.55,
              }} />
            ))}
          </div>

          {/* ── Model pills ─────────────────────────────────────────── */}
          {data.byModel.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {data.byModel.map(m => {
                const pct = budgetUsed > 0 ? ((m.costUsd / budgetUsed) * 100).toFixed(0) : '0';
                return (
                  <span key={m.model} style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                    padding: '5px 10px', borderRadius: 999,
                    background: `${modelColor(m.model)}10`, color: modelColor(m.model),
                    border: `1px solid ${modelColor(m.model)}22`,
                  }}>
                    {modelShort(m.model)} {fmtCost(m.costUsd)} ({pct}%)
                  </span>
                );
              })}
            </div>
          )}

          {/* ── Detail toggle ───────────────────────────────────────── */}
          {(data.byAgent.length > 0 || data.byRoute.length > 0) && (
            <div style={{ marginTop: 12, borderTop: `1px solid ${L1}`, paddingTop: 10 }}>
              <div
                onClick={() => setDetailOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}
              >
                <span style={{ transition: 'transform 200ms ease', transform: detailOpen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
                Detailed Breakdown
              </div>

              {detailOpen && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Agent table */}
                  {data.byAgent.length > 0 && (
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${L1}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '5px 10px', background: 'rgba(12,44,82,0.04)', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: I1d }}>
                        <span>Agent</span><span>Tokens</span><span>Reqs</span><span>Cache</span><span>Cost</span>
                      </div>
                      {data.byAgent.slice(0, 10).map(a => (
                        <div key={a.agentId} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '6px 10px', fontSize: 10, borderTop: `1px solid ${L1}`, color: I1b }}>
                          <span style={{ fontWeight: 700 }}>{agentLabel(a.agentId)}</span>
                          <span style={{ color: I1c }}>{fmt(a.inputTokens + a.outputTokens)}</span>
                          <span style={{ color: I1c }}>{a.requests}</span>
                          <span style={{ color: a.cacheReadTokens > 0 ? GREEN : I1d }}>{a.cacheReadTokens > 0 ? `${((a.cacheReadTokens / (a.inputTokens + a.cacheReadTokens || 1)) * 100).toFixed(0)}%` : '—'}</span>
                          <span style={{ fontWeight: 700, color: a.costUsd > 0.10 ? AMBER : I1b }}>{fmtCost(a.costUsd)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Route table */}
                  {data.byRoute.length > 0 && (
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${L1}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '5px 10px', background: 'rgba(12,44,82,0.04)', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: I1d }}>
                        <span>Workflow</span><span>Tokens</span><span>Reqs</span><span>Cost</span>
                      </div>
                      {data.byRoute.slice(0, 10).map(r => (
                        <div key={r.route} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '6px 10px', fontSize: 10, borderTop: `1px solid ${L1}`, color: I1b }}>
                          <span style={{ fontWeight: 700 }}>{routeLabel(r.route)}</span>
                          <span style={{ color: I1c }}>{fmt(r.inputTokens + r.outputTokens)}</span>
                          <span style={{ color: I1c }}>{r.requests}</span>
                          <span style={{ fontWeight: 700, color: r.costUsd > 0.10 ? AMBER : I1b }}>{fmtCost(r.costUsd)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!data.hasData && (
            <p style={{ fontSize: 12, color: I1d, marginTop: 10, fontStyle: 'italic' }}>
              No usage recorded yet. War Room or agent calls will appear here.
            </p>
          )}
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
