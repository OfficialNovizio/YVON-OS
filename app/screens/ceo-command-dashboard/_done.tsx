'use client';

import { useState, useEffect } from 'react';

const ACCENT = '#0066cc';
const GREEN  = '#047857';
const AMBER  = '#d97706';
const RED    = '#dc2626';

// V1: Clear Ice — white frosted, navy text  (ActivityLog)
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1b='#1a3e6e', I1d='rgba(12,44,82,0.48)', I1e='rgba(12,44,82,0.26)', L1='rgba(12,44,82,0.10)';

// V2: Azure Tint — blue gradient, light text  (SourceReportsPanel)
const G2: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(36,99,180,0.42),rgba(20,70,140,0.55))', backdropFilter: 'blur(30px) saturate(190%)', WebkitBackdropFilter: 'blur(30px) saturate(190%)', border: '1px solid rgba(180,210,255,0.40)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.40),inset 0 -1px 0 rgba(0,30,80,0.25),0 18px 50px -10px rgba(10,40,100,0.40)' };
const I2b='rgba(244,248,255,0.85)', I2c='rgba(244,248,255,0.68)', I2d='rgba(244,248,255,0.48)', I2e='rgba(244,248,255,0.25)', L2='rgba(255,255,255,0.14)';

// ── Activity Log — V1: Clear Ice (live: agent-status completedToday) ────────────
interface CompletedAgent { name: string; dept: string; currentTask: string; when?: string }
interface AgentStatusResp { completedToday?: CompletedAgent[]; isDemo?: boolean }

export function ActivityLog() {
  const [items, setItems]     = useState<CompletedAgent[]>([]);
  const [isDemo, setIsDemo]   = useState(false);
  const [loading, setLoading] = useState(true);
  const dayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  useEffect(() => {
    function load() {
      fetch('/api/agent-status')
        .then(r => r.json())
        .then((d: AgentStatusResp) => { setItems(d.completedToday ?? []); setIsDemo(!!d.isDemo); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ ...G1, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Agent Activity Log</p>
          {isDemo && <span style={{ fontSize: 11, color: I1e, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>· demo</span>}
        </div>
        <span style={{ fontSize: 13, color: I1d, fontWeight: 600 }}>{items.length} completed today</span>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, padding: '4px 4px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        Today · {dayLabel}
        <span style={{ flex: 1, height: 1, background: L1, display: 'inline-block' }} />
      </div>

      {loading ? (
        <p style={{ fontSize: 14, color: I1d, fontWeight: 500, padding: '12px 4px', margin: 0 }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: 14, color: I1d, fontWeight: 500, padding: '12px 4px', margin: 0 }}>No completed tasks yet today.</p>
      ) : items.map((a, i) => (
        <div key={`${a.name}-${i}`} style={{ display: 'grid', gridTemplateColumns: '24px 110px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 4px', borderBottom: `1px solid ${L1}` }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: I1 }}>{a.name}</span>
          <span style={{ fontSize: 14, color: I1b, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.currentTask}</span>
          <span style={{ fontSize: 12, color: I1d, fontWeight: 600 }}>{a.when ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

// ── Source Reports — V2: Azure Tint ───────────────────────────────────────────
interface SourceReportItem {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  reportNumber: number;
}

interface SourceReportsData {
  analytics:  SourceReportItem | null;
  marketing:  SourceReportItem | null;
  competitor: SourceReportItem | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function tsColor(dateStr: string | null): string {
  if (!dateStr) return I2d;
  const h = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  if (h < 12) return GREEN;
  if (h < 24) return AMBER;
  return RED;
}

const ICONS: Record<string, string> = {
  analytics:  '📊',
  marketing:  '📣',
  competitor: '🎯',
};

const FALLBACK_BODIES: Record<string, string> = {
  analytics:  'ROAS up 0.4× MoM. Drop-off concentrated in IG checkout size step. Brand search +11% WoW after "Behind the Fiber" organic series.',
  marketing:  'TikTok engagement +42% on transparency content. Suggest reallocating 15% of Meta spend. Newsletter CTR +3.1% WoW.',
  competitor: 'Reformation prepping a transparency push (3 hires, supply-chain copywriter). Everlane testing a Fiber Trace module in beta.',
};

const FALLBACK_TS: Record<string, string> = {
  analytics:  '4h ago',
  marketing:  '11h ago',
  competitor: '18h ago',
};

const REPORT_META: Record<string, string> = {
  analytics:  '4 KPIs · 12 charts',
  marketing:  '3 channels · 8 creatives',
  competitor: '6 brands tracked',
};

function SourceCard({ kind, report }: { kind: 'analytics' | 'marketing' | 'competitor'; report: SourceReportItem | null }) {
  const ts    = report ? timeAgo(report.createdAt) : FALLBACK_TS[kind];
  const body  = report ? report.summary.slice(0, 220) : FALLBACK_BODIES[kind];
  const num   = report ? `Report #${report.reportNumber}` : 'Pending first run';
  const color = report ? tsColor(report.createdAt) : I2d;

  return (
    <div className={`ceo-source-card ${kind}`} style={{ minHeight: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            {ICONS[kind]}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I2c }}>
            {{ analytics: 'Analytics', marketing: 'Marketing', competitor: 'Competitor' }[kind]}
          </span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color }}>{ts}</span>
      </div>

      <p style={{ fontSize: 10, color: I2e, fontWeight: 600, margin: 0 }}>{num}</p>
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: I2b, flex: 1, margin: 0, overflow: 'hidden' }}>{body}</p>

      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px dashed ${L2}`, fontSize: 10, color: I2d, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
        <span>{REPORT_META[kind]}</span>
        <span style={{ color: '#7eb8ff' }}>Open ›</span>
      </div>
    </div>
  );
}

export function SourceReportsPanel() {
  const [reports, setReports] = useState<SourceReportsData | null>(null);

  useEffect(() => {
    fetch('/api/intelligence/latest')
      .then(r => r.json())
      .then((d: { sourceReports?: SourceReportsData }) => {
        if (d?.sourceReports) setReports(d.sourceReports);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ ...G2, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I2d, margin: 0 }}>Source Reports</p>
          <span style={{ fontSize: 11, color: I2e, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>· Auto-pull every 24h</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: I2d }}>Last pull · 04:00</span>
      </div>

      <div className="ceo-col3-grid">
        <SourceCard kind="analytics"  report={reports?.analytics  ?? null} />
        <SourceCard kind="marketing"  report={reports?.marketing  ?? null} />
        <SourceCard kind="competitor" report={reports?.competitor ?? null} />
      </div>
    </div>
  );
}

// ── Done Tab ───────────────────────────────────────────────────────────────────
export default function DoneTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
      <ActivityLog />
      <SourceReportsPanel />
    </div>
  );
}
