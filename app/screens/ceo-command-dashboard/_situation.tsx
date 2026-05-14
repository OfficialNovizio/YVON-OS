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

// ── Agents ─────────────────────────────────────────────────────────────────────
interface Agent {
  name: string;
  role: 'tech' | 'brand' | 'ops' | 'exec';
  dept: string;
  task: string;
  status: 'active' | 'idle' | 'done';
  when?: string;
}

interface AgentStatusResponse {
  active: { id: string; name: string; role: 'tech' | 'brand' | 'ops' | 'exec'; dept: string; currentTask: string }[];
  idle:   { id: string; name: string; role: 'tech' | 'brand' | 'ops' | 'exec'; dept: string; currentTask: string }[];
  completedToday: { id: string; name: string; role: 'tech' | 'brand' | 'ops' | 'exec'; dept: string; currentTask: string; when?: string }[];
  isDemo: boolean;
  fetchedAt: string;
}

function apiToAgents(data: AgentStatusResponse): { active: Agent[]; idle: Agent[]; done: Agent[] } {
  return {
    active: data.active.map(a => ({ name: a.name, role: a.role, dept: a.dept, task: a.currentTask, status: 'active' as const })),
    idle:   data.idle.map(a  => ({ name: a.name, role: a.role, dept: a.dept, task: a.currentTask, status: 'idle'   as const })),
    done:   data.completedToday.map(a => ({ name: a.name, role: a.role, dept: 'Today', task: a.currentTask, status: 'done' as const, when: a.when })),
  };
}

const ROLE_COLORS: Record<string, string> = {
  tech:  'linear-gradient(135deg, #d2e2ff, #ffffff)',
  brand: 'linear-gradient(135deg, #ffd9ea, #ffffff)',
  ops:   'linear-gradient(135deg, #d3f3df, #ffffff)',
  exec:  'linear-gradient(135deg, #e0d8ff, #ffffff)',
};

function AgentCard({ agent }: { agent: Agent }) {
  const initial = agent.name[0];
  const roleStyle = ROLE_COLORS[agent.role] || ROLE_COLORS.tech;
  const cardClass = `ceo-agent-card ${agent.status}`;
  return (
    <div className={cardClass} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 12px', position: 'relative' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: roleStyle, border: `1px solid ${INK_LINE}`, fontSize: 13, fontWeight: 700, color: INK_2, flexShrink: 0 }}>
        {initial}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}>{agent.name}</div>
        <div style={{ fontSize: 11, color: INK_3, fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agent.task}
        </div>
      </div>
      {agent.status === 'done' && (
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
          ✓
        </div>
      )}
    </div>
  );
}

function groupByDept(agents: Agent[]) {
  const groups: Record<string, Agent[]> = {};
  agents.forEach(a => {
    (groups[a.dept] = groups[a.dept] || []).push(a);
  });
  return groups;
}

function KanbanColumn({ title, swatch, agents, showDept = true }: {
  title: string;
  swatch: string;
  agents: Agent[];
  showDept?: boolean;
}) {
  const grouped = showDept ? groupByDept(agents) : { '': agents };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h4 style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_3, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: swatch, display: 'inline-block' }} />
        {title}
        <span style={{ background: 'rgba(12,13,16,0.06)', color: INK_2, fontSize: 9, padding: '2px 7px', borderRadius: 999, letterSpacing: '0.04em' }}>{agents.length}</span>
      </h4>
      {Object.entries(grouped).map(([dept, list]) => (
        <div key={dept}>
          {showDept && dept && (
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_5, margin: '4px 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {dept}
              <span style={{ flex: 1, height: 1, background: INK_LINE, display: 'inline-block' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((a, i) => <AgentCard key={`${a.name}-${i}`} agent={a} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

const DEMO_FALLBACK: AgentStatusResponse = {
  active: [
    { id: 'kai-analyst', name: 'Kai',  role: 'tech',  dept: 'Marketing', currentTask: 'Analyzing analytics data' },
    { id: 'rio-ads',     name: 'Rio',  role: 'brand', dept: 'Marketing', currentTask: 'Running TikTok ad campaigns' },
    { id: 'dev-lead',    name: 'Dev',  role: 'tech',  dept: 'Technical', currentTask: 'Building size guide page' },
  ],
  idle: [
    { id: 'diana-coo',          name: 'Diana',  role: 'exec',  dept: 'Strategy',   currentTask: 'Standby · brand transparency' },
    { id: 'raj-backend',        name: 'Raj',    role: 'tech',  dept: 'Technical',  currentTask: 'Standby · infra' },
    { id: 'mia-frontend',       name: 'Mia',    role: 'brand', dept: 'Brand',      currentTask: 'Standby · voice ops' },
    { id: 'lena-brand',         name: 'Lena',   role: 'ops',   dept: 'Operations', currentTask: 'Standby · supply chain' },
    { id: 'nate-growth',        name: 'Nate',   role: 'ops',   dept: 'Operations', currentTask: 'Standby · conversion ops' },
    { id: 'quinn-qa',           name: 'Quinn',  role: 'tech',  dept: 'Technical',  currentTask: 'Standby · QA' },
    { id: 'atlas-art-director', name: 'Atlas',  role: 'ops',   dept: 'Operations', currentTask: 'Standby · logistics' },
    { id: 'pixel-production',   name: 'Pixel',  role: 'brand', dept: 'Brand',      currentTask: 'Standby · creative' },
    { id: 'felix-finance',      name: 'Felix',  role: 'exec',  dept: 'Strategy',   currentTask: 'Standby · finance' },
    { id: 'marcus-ceo',         name: 'Marcus', role: 'exec',  dept: 'Executive',  currentTask: 'Standby · CEO agent' },
  ],
  completedToday: [
    { id: 'kai-analyst',  name: 'Kai',    role: 'tech',  dept: 'Today', currentTask: 'Analytics report delivered',    when: '4h ago' },
    { id: 'marcus-ceo',   name: 'Marcus', role: 'exec',  dept: 'Today', currentTask: 'Morning CEO brief published',   when: '6h ago' },
    { id: 'mia-frontend', name: 'Mia',    role: 'brand', dept: 'Today', currentTask: 'Brand voice guidelines updated', when: '8h ago' },
    { id: 'dev-lead',     name: 'Dev',    role: 'tech',  dept: 'Today', currentTask: 'Size guide page pushed',        when: 'Yesterday' },
  ],
  isDemo: true,
  fetchedAt: '',
};

function AgentKanban() {
  const [data, setData] = useState<AgentStatusResponse>(DEMO_FALLBACK);
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    function load() {
      fetch('/api/agent-status')
        .then(r => r.json())
        .then((d: AgentStatusResponse) => {
          setData(d);
          setLastSync(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        })
        .catch(() => {});
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const { active, idle, done } = apiToAgents(data);

  return (
    <div style={{ ...GLASS, padding: '22px 22px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CardLabel>Agent Status</CardLabel>
          {data.isDemo && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_5 }}>· demo</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: INK_4, fontWeight: 500 }}>
          {active.length + idle.length} agents online{lastSync ? ` · synced ${lastSync}` : ' · syncing…'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <KanbanColumn title="Active"     swatch="#10b981"             agents={active} />
        <KanbanColumn title="Idle"       swatch="rgba(12,13,16,0.18)" agents={idle}   />
        <KanbanColumn title="Done Today" swatch={ACCENT}              agents={done} showDept={false} />
      </div>
    </div>
  );
}

// ── Intelligence Feed (source reports from real API) ───────────────────────────
interface SourceReport {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  reportNumber: number;
}

interface ReportsData {
  analytics:  SourceReport | null;
  marketing:  SourceReport | null;
  competitor: SourceReport | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h    = Math.floor(diff / 3600000);
  if (h < 1)  return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const REPORT_FALLBACKS = {
  analytics:  { body: 'ROAS up 0.4× MoM on Novizio Q3 plan. Drop-off concentrated in IG checkout size step. Brand search +11% WoW after "Behind the Fiber" organic series.', ts: '4h ago', cls: '' },
  marketing:  { body: 'TikTok engagement +42% on transparency content. Suggest reallocating 15% of Meta spend to TikTok seedings. Newsletter CTR +3.1% WoW.', ts: '11h ago', cls: '' },
  competitor: { body: 'Reformation prepping a transparency push. Everlane testing a Fiber Trace module in beta. Gen Z intent gap: 12%.', ts: '18h ago', cls: 'old' },
};

function ReportCard({ kind, report }: { kind: 'analytics' | 'marketing' | 'competitor'; report: SourceReport | null }) {
  const fb = REPORT_FALLBACKS[kind];
  const ts   = report ? timeAgo(report.createdAt) : fb.ts;
  const body = report ? report.summary.slice(0, 200) : fb.body;
  const tsOld = !report || (Date.now() - new Date(report.createdAt).getTime()) > 12 * 3600000;
  const labels: Record<string, string> = { analytics: 'Analytics', marketing: 'Marketing', competitor: 'Competitor' };

  return (
    <div className={`ceo-report-card ${kind}`} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: INK_3 }}>{labels[kind]}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: tsOld ? '#d97706' : GREEN, letterSpacing: '0.04em' }}>{ts}</span>
      </div>
      <p style={{ fontSize: 12.5, lineHeight: 1.5, color: INK_2, fontWeight: 400, margin: 0 }}>{body}</p>
    </div>
  );
}

function IntelligenceFeedPanel() {
  const [reports, setReports] = useState<ReportsData | null>(null);

  useEffect(() => {
    fetch('/api/intelligence/latest')
      .then(r => r.json())
      .then((d: { sourceReports?: ReportsData }) => {
        if (d.sourceReports) setReports(d.sourceReports);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ ...GLASS, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CardLabel>Intelligence Feed</CardLabel>
          <span style={{ fontSize: 9, color: INK_5, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>24HR · AI PULL</span>
        </div>
        <a href="#" style={{ fontSize: 11, fontWeight: 600, color: ACCENT, textDecoration: 'none', letterSpacing: '0.04em' }}>All reports →</a>
      </div>

      <ReportCard kind="analytics"  report={reports?.analytics ?? null}  />
      <ReportCard kind="marketing"  report={reports?.marketing ?? null}  />
      <ReportCard kind="competitor" report={reports?.competitor ?? null} />
    </div>
  );
}

// ── Key Numbers ────────────────────────────────────────────────────────────────
function Sparkline({ values, color = ACCENT }: { values: number[]; color?: string }) {
  const w = 420, h = 36, pad = 2;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as [number, number];
  });
  const d    = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const fill = `${d} L${pts[pts.length-1][0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={fill} fill={color} opacity="0.10" />
      <path d={d} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const KEY_NUMBERS = [
  { label: 'ROAS',        delta: '↑ +0.4 MoM', deltaGood: true,  value: '3.8', unit: '×',        sub: 'Trailing 8 weeks · Blended across paid',    spark: [3.0,3.1,3.3,3.2,3.4,3.5,3.6,3.8], color: ACCENT },
  { label: 'CAC',         delta: '↓ −12% MoM', deltaGood: true,  value: '$8.20', unit: '',       sub: 'Cost per acquisition · Blended',             spark: [10.2,10.0,9.6,9.3,9.1,8.8,8.4,8.2], color: GREEN },
  { label: 'Brand Health',delta: '↑ +2 pts',   deltaGood: true,  value: '74',  unit: '',         sub: 'Composite · social + survey · 0–100',        spark: [62,64,65,67,69,70,72,74], color: '#6c5ce7' },
];

function KeyNumbers() {
  return (
    <div style={{ ...GLASS, padding: 22, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <CardLabel>Key Numbers</CardLabel>
        <span style={{ fontSize: 10, color: INK_4, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>3 of 3</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        {KEY_NUMBERS.map((k, i) => (
          <div key={k.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 18, borderBottom: i < 2 ? `1px solid ${INK_LINE}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4 }}>{k.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>{k.delta}</span>
            </div>
            <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1, color: INK }}>{k.value}</span>
            <Sparkline values={k.spark} color={k.color} />
            <span style={{ fontSize: 11, color: INK_4, fontWeight: 500, marginTop: 2 }}>{k.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Situation Tab ──────────────────────────────────────────────────────────────
export default function SituationTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
      {/* Kanban — full width */}
      <div style={{ gridColumn: '1 / span 12' }}>
        <AgentKanban />
      </div>
      {/* Intel feed — cols 1-7 */}
      <div style={{ gridColumn: '1 / span 7' }}>
        <IntelligenceFeedPanel />
      </div>
      {/* Key numbers — cols 8-12 */}
      <div style={{ gridColumn: '8 / span 5' }}>
        <KeyNumbers />
      </div>
    </div>
  );
}
