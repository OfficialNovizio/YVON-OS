'use client';

import { useState, useEffect } from 'react';

const INK   = '#eef0f8';
const INK_2 = '#b8c2d8';
const INK_3 = 'rgba(220,228,248,0.75)';
const INK_4 = 'rgba(220,228,248,0.45)';
const INK_5 = 'rgba(220,228,248,0.22)';
const INK_LINE = 'rgba(255,255,255,0.10)';
const ACCENT = '#0066cc';
const GREEN  = '#059669';
const AMBER  = '#d97706';
const RED    = '#dc2626';

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(32px) saturate(160%) brightness(1.1)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%) brightness(1.1)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 22,
  boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 0 0 1px rgba(255,255,255,0.07) inset, 0 20px 60px -20px rgba(0,0,0,0.55), 0 4px 12px -4px rgba(0,0,0,0.30)',
};

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: 0 }}>
      {children}
    </p>
  );
}

// ── Activity Log ───────────────────────────────────────────────────────────────
const ACTIVITY = [
  { name: 'Kai',    task: 'Analytics report delivered',      when: '4h ago',          day: 'today' },
  { name: 'Marcus', task: 'Morning CEO brief published',     when: '6h ago',          day: 'today' },
  { name: 'Mia',    task: 'Brand voice guidelines updated',  when: '8h ago',          day: 'today' },
  { name: 'Dev',    task: 'Size guide page pushed',          when: 'Yesterday 18:42', day: 'yesterday' },
];

function ActivityLog() {
  const [filter, setFilter] = useState<'today' | 'yesterday' | '7d'>('today');
  const today     = ACTIVITY.filter(a => a.day === 'today');
  const yesterday = ACTIVITY.filter(a => a.day === 'yesterday');

  const dayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ ...GLASS, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CardLabel>Agent Activity Log</CardLabel>
          <span style={{ fontSize: 9, color: INK_5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>({filter})</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['today', 'yesterday', '7d'] as const).map(k => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className="ceo-ghost-btn"
              style={{ padding: '5px 10px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', background: filter === k ? INK : 'rgba(255,255,255,0.6)', color: filter === k ? '#fff' : INK_2 }}
            >
              {k === '7d' ? 'Last 7' : k}
            </button>
          ))}
        </div>
      </div>

      {/* Day divider */}
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, padding: '14px 4px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        Today · {dayLabel}
        <span style={{ flex: 1, height: 1, background: INK_LINE, display: 'inline-block' }} />
      </div>

      {today.map((a, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 110px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 4px', borderBottom: `1px solid ${INK_LINE}` }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{a.name}</span>
          <span style={{ fontSize: 13, color: INK_2 }}>{a.task}</span>
          <span style={{ fontSize: 11, color: INK_4, fontWeight: 500 }}>{a.when}</span>
        </div>
      ))}

      {filter !== 'today' && yesterday.length > 0 && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, padding: '14px 4px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            Yesterday
            <span style={{ flex: 1, height: 1, background: INK_LINE, display: 'inline-block' }} />
          </div>
          {yesterday.map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 110px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 4px', borderBottom: `1px solid ${INK_LINE}` }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{a.name}</span>
              <span style={{ fontSize: 13, color: INK_2 }}>{a.task}</span>
              <span style={{ fontSize: 11, color: INK_4, fontWeight: 500 }}>{a.when}</span>
            </div>
          ))}
        </>
      )}

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${INK_LINE}` }}>
        {[
          { label: 'Today',     v: '4',   c: INK },
          { label: 'This Week', v: '26',  c: INK },
          { label: 'Avg / Day', v: '5.2', c: INK },
          { label: 'SLA Hit',   v: '96%', c: GREEN },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Source Reports (real API) ──────────────────────────────────────────────────
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
  if (!dateStr) return INK_4;
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
  const ts   = report ? timeAgo(report.createdAt) : FALLBACK_TS[kind];
  const body = report ? report.summary.slice(0, 220) : FALLBACK_BODIES[kind];
  const num  = report ? `Report #${report.reportNumber}` : 'Pending first run';
  const color = report ? tsColor(report.createdAt) : INK_4;

  return (
    <div className={`ceo-source-card ${kind}`} style={{ minHeight: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            {ICONS[kind]}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_3 }}>
            {{ analytics: 'Analytics', marketing: 'Marketing', competitor: 'Competitor' }[kind]}
          </span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color }}>{ts}</span>
      </div>

      <p style={{ fontSize: 10, color: INK_5, fontWeight: 600, margin: 0 }}>{num}</p>
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: INK_2, flex: 1, margin: 0, overflow: 'hidden' }}>{body}</p>

      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px dashed ${INK_LINE}`, fontSize: 10, color: INK_4, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
        <span>{REPORT_META[kind]}</span>
        <span style={{ color: ACCENT }}>Open ›</span>
      </div>
    </div>
  );
}

function SourceReportsPanel() {
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
    <div style={{ ...GLASS, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CardLabel>Source Reports</CardLabel>
          <span style={{ fontSize: 9, color: INK_5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>· Auto-pull every 24h</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_4 }}>Last pull · 04:00</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
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
