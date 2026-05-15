'use client';

import { useState, useEffect } from 'react';

const GREEN  = '#047857';
const ACCENT = '#0066cc';
const RED    = '#dc2626';
const AMBER  = '#d97706';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pass:   { bg: 'rgba(4,120,87,0.12)', text: GREEN },
    warn:   { bg: 'rgba(217,119,6,0.12)', text: AMBER },
    fail:   { bg: 'rgba(220,38,38,0.12)', text: RED },
  };
  const c = colors[status] || { bg: 'rgba(0,0,0,0.06)', text: '#666' };
  return (
    <span style={{ background: c.bg, color: c.text, padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
      {status}
    </span>
  );
}

function MetricBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.32)', borderRadius: 12, backdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.40)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(12,44,82,0.48)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

interface HealthData {
  status: string;
  timestamp: string;
  checks: Record<string, any>;
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { runCheck(); }, []);

  async function runCheck() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const d = await res.json();
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ fontSize: 14, color: 'rgba(12,44,82,0.48)' }}>Running health checks...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 14, color: RED, fontWeight: 600 }}>{error}</div>
        <button onClick={runCheck} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.10)', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Retry</button>
      </div>
    </div>
  );

  if (!data) return null;

  const SECTION: React.CSSProperties = {
    background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, padding: 22,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70), inset 0 -1px 0 rgba(255,255,255,0.10)',
  };
  const LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(12,44,82,0.48)', margin: '0 0 12px' };
  const ROW: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(12,44,82,0.08)', fontSize: 13 };
  const VAL = (v: any) => typeof v === 'object' ? JSON.stringify(v) : String(v);

  return (
    <div className="min-h-screen pb-24" style={{ paddingTop: 96 }}>
      <div className="px-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(12,44,82,0.48)', marginBottom: 4 }}>System Health</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0c2c52', margin: 0, letterSpacing: '-0.02em' }}>
              Health Dashboard<span style={{ color: ACCENT }}>.</span>
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StatusBadge status={data.status} />
            <div style={{ fontSize: 11, color: 'rgba(12,44,82,0.40)', marginTop: 4 }}>
              {new Date(data.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <MetricBadge label="Database" value={data.checks.database?.status || '?'} color={data.checks.database?.status === 'pass' ? GREEN : RED} />
          <MetricBadge label="Website" value={data.checks.website?.status || '?'} color={data.checks.website?.status === 'pass' ? GREEN : RED} />
          <MetricBadge label="Spend" value={data.checks.spend?.status || '?'} color={data.checks.spend?.status === 'pass' ? GREEN : data.checks.spend?.status === 'warn' ? AMBER : RED} />
          <MetricBadge label="Repository" value={data.checks.repository?.status || '?'} color={data.checks.repository?.status === 'pass' ? GREEN : RED} />
        </div>

        {/* Database detail */}
        {data.checks.database && (
          <div style={{ ...SECTION, marginBottom: 16 }}>
            <h2 style={LABEL}>Database {data.checks.database.latency ? `· ${data.checks.database.latency}ms` : ''}</h2>
            {Object.entries(data.checks.database.details || {}).map(([key, val]: [string, any]) => (
              <div key={key} style={ROW}>
                <span style={{ fontWeight: 600, color: '#0c2c52' }}>{key}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={val.status} />
                  <span style={{ color: 'rgba(12,44,82,0.55)', fontSize: 12 }}>{VAL(val.value)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Website detail */}
        {data.checks.website && (
          <div style={{ ...SECTION, marginBottom: 16 }}>
            <h2 style={LABEL}>Website {data.checks.website.latency ? `· ${data.checks.website.latency}ms` : ''}</h2>
            {Object.entries(data.checks.website.details || {}).map(([key, val]: [string, any]) => (
              <div key={key} style={ROW}>
                <span style={{ fontWeight: 600, color: '#0c2c52' }}>{key}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={val.status} />
                  <span style={{ color: 'rgba(12,44,82,0.55)', fontSize: 12 }}>{VAL(val.value)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Spend detail */}
        {data.checks.spend && (
          <div style={{ ...SECTION, marginBottom: 16 }}>
            <h2 style={LABEL}>Spend</h2>
            {data.checks.spend.totals && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                <MetricBadge label="MTD Cost" value={`$${data.checks.spend.totals.monthToDate.toFixed(2)}`} color={ACCENT} />
                <MetricBadge label="Daily Burn" value={`$${data.checks.spend.totals.dailyBurn.toFixed(2)}`} color={ACCENT} />
                <MetricBadge label="Projected" value={`$${data.checks.spend.totals.projectedMonth.toFixed(0)}`} color={data.checks.spend.totals.projectedMonth > 200 ? AMBER : GREEN} />
              </div>
            )}
            {Object.entries(data.checks.spend.details || {}).map(([key, val]: [string, any]) => (
              <div key={key} style={ROW}>
                <span style={{ fontWeight: 600, color: '#0c2c52' }}>{key}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={val.status} />
                  <span style={{ color: 'rgba(12,44,82,0.55)', fontSize: 12 }}>{VAL(val.value)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Repository detail */}
        {data.checks.repository && (
          <div style={{ ...SECTION, marginBottom: 16 }}>
            <h2 style={LABEL}>Repository</h2>
            {Object.entries(data.checks.repository.details || {}).map(([key, val]: [string, any]) => (
              <div key={key} style={ROW}>
                <span style={{ fontWeight: 600, color: '#0c2c52' }}>{key}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={val.status} />
                  <span style={{ color: 'rgba(12,44,82,0.55)', fontSize: 12 }}>{VAL(val.value)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Retry button */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button onClick={runCheck} disabled={loading}
            style={{ padding: '10px 28px', borderRadius: 999, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Running...' : 'Run Health Check'}
          </button>
        </div>
      </div>
    </div>
  );
}
