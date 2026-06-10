'use client';

import { useState, useEffect, useMemo } from 'react';

const ACCENT = '#0066cc';
const GREEN  = '#047857';
const VIOLET = '#4f46e5';
const RED = '#dc2626';
const AMBER = '#d97706';
const I1='#0c2c52', I1b='#1a3e6e', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';

// ── Budget (fetched from DeepSeek API) ─────────────────────────────────────────
// Falls back to $50 if API is unreachable.

// ── Types ──────────────────────────────────────────────────────────────────────
interface TokenTotals { inputTokens: number; outputTokens: number; totalTokens: number; cacheReadTokens: number; costUsd: number; requests: number }
interface ModelRow    { model: string; inputTokens: number; outputTokens: number; costUsd: number; requests: number }
interface AgentRow    { agentId: string; inputTokens: number; outputTokens: number; cacheReadTokens: number; costUsd: number; requests: number }
interface RouteRow    { route: string; inputTokens: number; outputTokens: number; costUsd: number; requests: number }
interface DailyRow    { date: string; costUsd: number }
interface TokenData   { totals: TokenTotals; cacheHitRate: number; byModel: ModelRow[]; byAgent: AgentRow[]; byRoute: RouteRow[]; daily: DailyRow[]; hasData: boolean }
interface BalanceData { total: number; toppedUp: number; granted: number; currency: string }

function fmt(n: number) { if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(0)}k`; return String(n); }
function fmtCost(u: number) { if (u < 0.001) return '<$0.001'; if (u < 1) return `$${u.toFixed(4)}`; return `$${u.toFixed(2)}`; }
function modelShort(m: string) { if (m.includes('opus')) return 'Opus'; if (m.includes('sonnet')) return 'Sonnet'; if (m.includes('haiku')) return 'Haiku'; if (m.includes('deepseek')) return 'DeepSeek'; return m.split('-').pop() ?? m; }
function modelColor(m: string) { if (m.includes('opus')) return VIOLET; if (m.includes('sonnet')) return ACCENT; if (m.includes('haiku')) return GREEN; if (m.includes('deepseek')) return VIOLET; return '#64748b'; }

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
    '/api/kai-read': 'Kai\'s Read',
    '/api/kai-report': 'Kai Report',
    '/api/auto-competitors': 'Auto Competitors',
    '/api/team-chat': 'War Room',
    '/api/calendar-verify': 'Calendar Verify',
  };
  return map[rt] ?? rt.replace('/api/', '').replace(/-/g, ' ');
}

// ── Standalone Token Usage Panel — V1: Clear Ice ──────────────────────────────
export function TokenUsagePanel() {
  const [data, setData] = useState<TokenData | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    // Fetch both: 30-day overview + same endpoint returns byAgent/byRoute breakdown
    fetch('/api/token-usage?days=30')
      .then(r => r.json())
      .then((d: TokenData) => setData(d))
      .catch(() => {});

    // Fetch real DeepSeek balance
    fetch('/api/deepseek-balance')
      .then(r => r.json())
      .then((d: { balance: BalanceData | null }) => {
        if (d.balance) setBalance(d.balance);
      })
      .catch(() => {});
  }, []);

  const G1: React.CSSProperties = {
    background: 'rgba(255,255,255,0.32)',
    backdropFilter: 'blur(32px) saturate(160%)',
    WebkitBackdropFilter: 'blur(32px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.55)',
    borderRadius: 22,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)',
  };

  const bars = useMemo(() => {
    if (!data) return [];
    const recent = data.daily.slice(-14);
    const max = Math.max(...recent.map(d => d.costUsd), 0.0001);
    return recent.map(d => ({ date: d.date.slice(5), costUsd: d.costUsd, pct: Math.max(4, (d.costUsd / max) * 90) }));
  }, [data]);

  // Balance — raw numbers from DeepSeek API + usage tracking. No derived math.
  const deepseekBalance = balance?.total ?? null;
  const budgetUsed = data?.totals.costUsd ?? 0;

  // Budget bar: spent vs total balance (the only two real numbers we have)
  const totalForBar = deepseekBalance ? deepseekBalance + budgetUsed : 50;
  const budgetPct = totalForBar > 0 ? Math.min(100, (budgetUsed / totalForBar) * 100) : 0;
  const budgetColor = budgetPct > 90 ? RED : budgetPct > 70 ? AMBER : GREEN;
  const budgetLabel = balance ? 'DeepSeek Balance' : 'Est. Budget';

  // Detail data — take from byAgent/byRoute (already returned by API for 30d window)
  const detailAgentRows = (data?.byAgent ?? []).slice(0, 8);
  const detailRouteRows = (data?.byRoute ?? []).slice(0, 8);

  return (
    <div style={{ ...G1, padding: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0 }}>
            Token / AI Usage
          </p>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: VIOLET, padding: '2px 8px', borderRadius: 999,
            border: `1px solid ${VIOLET}44`, background: `${VIOLET}14`,
          }}>
            LIVE
          </span>
        </div>
        <span style={{ fontSize: 12, color: I1d, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          30-day rolling
        </span>
      </div>

      {!data ? (
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, border: `2px solid ${L1}`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Budget bar */}
          {balance && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: I1d }}>
                  {budgetLabel}
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: budgetColor }}>
                  {fmtCost(deepseekBalance!)} remaining · {fmtCost(budgetUsed)} spent
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(12,44,82,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${budgetPct}%`, borderRadius: 3,
                  background: budgetColor,
                  transition: 'width 400ms ease',
                }} />
              </div>
            </div>
          )}
          {!balance && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: I1d }}>
                  Est. Budget
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: budgetColor }}>
                  {fmtCost(budgetUsed)} spent · $50.00 budget
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(12,44,82,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${budgetPct}%`, borderRadius: 3,
                  background: budgetColor,
                  transition: 'width 400ms ease',
                }} />
              </div>
            </div>
          )}

          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 70, marginBottom: 12 }}>
            {bars.map((b, i) => (
              <div key={i} title={fmtCost(b.costUsd)} style={{
                flex: 1, height: `${b.pct}%`,
                background: i === bars.length - 1 ? VIOLET : `linear-gradient(180deg, ${ACCENT}, ${VIOLET})`,
                borderRadius: '3px 3px 0 0', opacity: i === bars.length - 1 ? 1 : 0.7,
              }} />
            ))}
          </div>

          {/* KPI grid — 5 columns: cost, budget left, tokens, cache, requests */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[
              { label: 'Balance',    v: balance ? fmtCost(deepseekBalance!) : '—', c: balance ? GREEN : I1d },
              { label: 'Spent',      v: fmtCost(budgetUsed),      c: budgetUsed > 0 ? I1 : I1d },
              { label: 'Tokens',      v: fmt(data.totals.totalTokens), c: data.totals.totalTokens > 0 ? I1 : I1d },
              { label: 'Cache hit',   v: `${data.cacheHitRate}%`,  c: data.cacheHitRate > 30 ? GREEN : AMBER },
              { label: 'Requests',    v: data.totals.requests.toLocaleString(), c: data.totals.requests > 0 ? I1 : I1d },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: k.c }}>
                  {k.v}
                </div>
              </div>
            ))}
          </div>

          {/* Model breakdown */}
          {data.byModel.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {data.byModel.slice(0, 4).map(m => (
                <span key={m.model} style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  padding: '6px 10px', borderRadius: 999,
                  background: `${modelColor(m.model)}12`, color: modelColor(m.model),
                  border: `1px solid ${modelColor(m.model)}22`,
                }}>
                  {modelShort(m.model)} · {fmtCost(m.costUsd)}
                </span>
              ))}
            </div>
          )}

          {/* Detail toggle */}
          {(detailAgentRows.length > 0 || detailRouteRows.length > 0) && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${L1}`, paddingTop: 12 }}>
              <div
                onClick={() => setDetailOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: ACCENT,
                }}
              >
                <span style={{ display: 'inline-block', transition: 'transform 200ms ease', transform: detailOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                Detailed Breakdown (past 30 days)
              </div>

              {detailOpen && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Per-agent table */}
                  {detailAgentRows.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: I1d, marginBottom: 6 }}>
                        By Agent
                      </div>
                      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${L1}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'rgba(12,44,82,0.04)', padding: '6px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: I1d }}>
                          <span>Agent</span><span>Tokens</span><span>Reqs</span><span>Cost</span>
                        </div>
                        {detailAgentRows.map(a => (
                          <div key={a.agentId} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '7px 10px', fontSize: 11, borderTop: `1px solid ${L1}`, color: I1b }}>
                            <span style={{ fontWeight: 700 }}>{agentLabel(a.agentId)}</span>
                            <span style={{ color: I1c }}>{fmt(a.inputTokens + a.outputTokens)}</span>
                            <span style={{ color: I1c }}>{a.requests}</span>
                            <span style={{ fontWeight: 700, color: a.costUsd > 0.10 ? AMBER : I1b }}>{fmtCost(a.costUsd)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-route table */}
                  {detailRouteRows.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: I1d, marginBottom: 6 }}>
                        By Workflow / API
                      </div>
                      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${L1}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'rgba(12,44,82,0.04)', padding: '6px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: I1d }}>
                          <span>Workflow</span><span>Tokens</span><span>Reqs</span><span>Cost</span>
                        </div>
                        {detailRouteRows.map(r => (
                          <div key={r.route} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '7px 10px', fontSize: 11, borderTop: `1px solid ${L1}`, color: I1b }}>
                            <span style={{ fontWeight: 700 }}>{routeLabel(r.route)}</span>
                            <span style={{ color: I1c }}>{fmt(r.inputTokens + r.outputTokens)}</span>
                            <span style={{ color: I1c }}>{r.requests}</span>
                            <span style={{ fontWeight: 700, color: r.costUsd > 0.10 ? AMBER : I1b }}>{fmtCost(r.costUsd)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!data.hasData && (
            <p style={{ fontSize: 13, color: I1d, margin: '10px 0 0', fontStyle: 'italic' }}>
              No usage recorded yet. AI calls made through the War Room or agent chat will appear here automatically.
            </p>
          )}
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
