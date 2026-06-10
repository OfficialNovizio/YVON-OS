'use client';

import { useState, useEffect, useMemo } from 'react';

const ACCENT = '#0066cc';
const GREEN  = '#047857';
const VIOLET = '#4f46e5';
const I1='#0c2c52', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';

// ── Types ──────────────────────────────────────────────────────────────────────
interface TokenTotals { inputTokens: number; outputTokens: number; totalTokens: number; cacheReadTokens: number; costUsd: number; requests: number }
interface ModelRow    { model: string; inputTokens: number; outputTokens: number; costUsd: number; requests: number }
interface DailyRow    { date: string; costUsd: number }
interface TokenData   { totals: TokenTotals; cacheHitRate: number; byModel: ModelRow[]; daily: DailyRow[]; hasData: boolean }

function fmt(n: number) { if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(0)}k`; return String(n); }
function fmtCost(u: number) { if (u < 0.001) return '<$0.001'; if (u < 1) return `$${u.toFixed(4)}`; return `$${u.toFixed(2)}`; }
function modelShort(m: string) { if (m.includes('opus')) return 'Opus'; if (m.includes('sonnet')) return 'Sonnet'; if (m.includes('haiku')) return 'Haiku'; if (m.includes('deepseek')) return 'DeepSeek'; return m.split('-').pop() ?? m; }
function modelColor(m: string) { if (m.includes('opus')) return VIOLET; if (m.includes('sonnet')) return ACCENT; if (m.includes('haiku')) return GREEN; if (m.includes('deepseek')) return VIOLET; return '#64748b'; }

// ── Standalone Token Usage Panel — V1: Clear Ice ──────────────────────────────
export function TokenUsagePanel() {
  const [data, setData] = useState<TokenData | null>(null);

  useEffect(() => {
    fetch('/api/token-usage?days=30')
      .then(r => r.json())
      .then((d: TokenData) => setData(d))
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
          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90, margin: '6px 0 12px' }}>
            {bars.map((b, i) => (
              <div key={i} title={fmtCost(b.costUsd)} style={{
                flex: 1, height: `${b.pct}%`,
                background: i === bars.length - 1 ? VIOLET : `linear-gradient(180deg, ${ACCENT}, ${VIOLET})`,
                borderRadius: '3px 3px 0 0', opacity: i === bars.length - 1 ? 1 : 0.7,
              }} />
            ))}
          </div>

          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Total cost', v: fmtCost(data.totals.costUsd), c: data.totals.costUsd > 0 ? I1 : I1d },
              { label: 'Tokens',     v: fmt(data.totals.totalTokens), c: data.totals.totalTokens > 0 ? I1 : I1d },
              { label: 'Cache hit',  v: `${data.cacheHitRate}%`,      c: data.cacheHitRate > 30 ? GREEN : '#d97706' },
              { label: 'Requests',   v: data.totals.requests.toLocaleString(), c: data.totals.requests > 0 ? I1 : I1d },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: k.c }}>
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
