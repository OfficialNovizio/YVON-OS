'use client';

import { useState, useEffect } from 'react';

const ACCENT = '#0066cc';
const GREEN  = '#047857';

// ── Glass Variants ─────────────────────────────────────────────────────────────
// V1: Clear Ice — white frosted, navy text  (Agent Kanban)
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1b='#1a3e6e', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', I1e='rgba(12,44,82,0.26)', L1='rgba(12,44,82,0.10)';

// V2: Azure Tint — blue gradient, white text  (Key Numbers)
const G2: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(36,99,180,0.42),rgba(20,70,140,0.55))', backdropFilter: 'blur(30px) saturate(190%)', WebkitBackdropFilter: 'blur(30px) saturate(190%)', border: '1px solid rgba(180,210,255,0.40)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.40),inset 0 -1px 0 rgba(0,30,80,0.25),0 18px 50px -10px rgba(10,40,100,0.40)' };
const I2='#f4f8ff', I2b='rgba(244,248,255,0.85)', I2c='rgba(244,248,255,0.68)', I2d='rgba(244,248,255,0.48)', L2='rgba(255,255,255,0.14)';

// V3: Obsidian — dark smoke, light text  (Intelligence Feed)
const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3='#f1f5fb', I3b='#ccd6eb', I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)', I3e='rgba(241,245,251,0.22)', L3='rgba(255,255,255,0.10)';

// ── Agent Types ────────────────────────────────────────────────────────────────
interface Agent { name: string; role: 'tech'|'brand'|'ops'|'exec'; dept: string; task: string; status: 'active'|'idle'|'done'; when?: string; }
interface AgentStatusResponse {
  active:         { id: string; name: string; role: 'tech'|'brand'|'ops'|'exec'; dept: string; currentTask: string }[];
  idle:           { id: string; name: string; role: 'tech'|'brand'|'ops'|'exec'; dept: string; currentTask: string }[];
  completedToday: { id: string; name: string; role: 'tech'|'brand'|'ops'|'exec'; dept: string; currentTask: string; when?: string }[];
  isDemo: boolean; fetchedAt: string;
}

function apiToAgents(data: AgentStatusResponse) {
  return {
    active: data.active.map(a => ({ name: a.name, role: a.role, dept: a.dept, task: a.currentTask, status: 'active' as const })),
    idle:   data.idle.map(a  => ({ name: a.name, role: a.role, dept: a.dept, task: a.currentTask, status: 'idle'   as const })),
    done:   data.completedToday.map(a => ({ name: a.name, role: a.role, dept: 'Today', task: a.currentTask, status: 'done' as const, when: a.when })),
  };
}

const ROLE_COLORS: Record<string,string> = {
  tech:  'linear-gradient(135deg,#d2e2ff,#ffffff)',
  brand: 'linear-gradient(135deg,#ffd9ea,#ffffff)',
  ops:   'linear-gradient(135deg,#d3f3df,#ffffff)',
  exec:  'linear-gradient(135deg,#e0d8ff,#ffffff)',
};

function AgentCard({ agent }: { agent: Agent }) {
  const cardClass = `ceo-agent-card ${agent.status}`;
  return (
    <div className={cardClass} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 12px', position: 'relative' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ROLE_COLORS[agent.role] || ROLE_COLORS.tech, border: `1px solid ${L1}`, fontSize: 13, fontWeight: 700, color: I1b, flexShrink: 0 }}>
        {agent.name[0]}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: I1, letterSpacing: '-0.01em' }}>{agent.name}</div>
        <div style={{ fontSize: 12, color: I1c, fontWeight: 600, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.task}</div>
      </div>
      {agent.status === 'done' && (
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✓</div>
      )}
    </div>
  );
}

function groupByDept(agents: Agent[]) {
  const groups: Record<string,Agent[]> = {};
  agents.forEach(a => { (groups[a.dept] = groups[a.dept] || []).push(a); });
  return groups;
}

function KanbanColumn({ title, swatch, agents, showDept = true }: { title: string; swatch: string; agents: Agent[]; showDept?: boolean }) {
  const grouped = showDept ? groupByDept(agents) : { '': agents };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h4 style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1c, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: swatch, display: 'inline-block' }} />
        {title}
        <span style={{ background: 'rgba(12,44,82,0.08)', color: I1b, fontSize: 11, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.04em' }}>{agents.length}</span>
      </h4>
      {Object.entries(grouped).map(([dept, list]) => (
        <div key={dept}>
          {showDept && dept && (
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: '4px 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {dept}<span style={{ flex: 1, height: 1, background: L1, display: 'inline-block' }} />
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
    { id: 'kai-analyst',  name: 'Kai',    role: 'tech',  dept: 'Today', currentTask: 'Analytics report delivered',     when: '4h ago' },
    { id: 'marcus-ceo',   name: 'Marcus', role: 'exec',  dept: 'Today', currentTask: 'Morning CEO brief published',    when: '6h ago' },
    { id: 'mia-frontend', name: 'Mia',    role: 'brand', dept: 'Today', currentTask: 'Brand voice guidelines updated', when: '8h ago' },
    { id: 'dev-lead',     name: 'Dev',    role: 'tech',  dept: 'Today', currentTask: 'Size guide page pushed',         when: 'Yesterday' },
  ],
  isDemo: true, fetchedAt: '',
};

// ── Agent Kanban — V1 ──────────────────────────────────────────────────────────
export function AgentKanban() {
  const [data, setData] = useState<AgentStatusResponse>(DEMO_FALLBACK);
  const [lastSync, setLastSync] = useState('');

  useEffect(() => {
    function load() {
      fetch('/api/agent-status').then(r => r.json()).then((d: AgentStatusResponse) => {
        setData(d);
        setLastSync(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }).catch(() => {});
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const { active, idle, done } = apiToAgents(data);
  return (
    <div style={{ ...G1, padding: '22px 22px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Agent Status</p>
          {data.isDemo && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1e }}>· demo</span>}
        </div>
        <span style={{ fontSize: 13, color: I1d, fontWeight: 600 }}>
          {active.length + idle.length} agents online{lastSync ? ` · synced ${lastSync}` : ' · syncing…'}
        </span>
      </div>
      <div className="ceo-col3-grid">
        <KanbanColumn title="Active"     swatch="#10b981"              agents={active} />
        <KanbanColumn title="Idle"       swatch="rgba(12,44,82,0.22)"  agents={idle} />
        <KanbanColumn title="Done Today" swatch={ACCENT}               agents={done} showDept={false} />
      </div>
    </div>
  );
}

// ── Intelligence Feed — V3: Obsidian ───────────────────────────────────────────
interface SourceReport { id: string; title: string; summary: string; createdAt: string; reportNumber: number; }
interface ReportsData { analytics: SourceReport|null; marketing: SourceReport|null; competitor: SourceReport|null; }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const REPORT_FALLBACKS = {
  analytics:  { body: 'Hermes Agent integration complete. 13 agents alive with real tools, graphify auto-injects. execute-stage.ts wired. Dev + Quinn tested on real repos. Zero TypeScript errors across all changes.', ts: 'Just now' },
  marketing:  { body: 'Quinn has react-doctor integrated for automated code health. Priorities defined across 10 items (5 URGENT, 4 HIGH, 1 LAUNCH). All assigned to specific agents with clear done conditions.', ts: 'Just now' },
  competitor: { body: '14 files changed in YVON repo. Hermes profile created with 14 skills. lib/hermes-spawn.ts bridge module built. Old Hermes sync files deleted. SESSION.md fix + Opportunities tab next.', ts: 'Just now' },
};

export function IntelligenceFeedPanel() {
  const [reports, setReports] = useState<ReportsData|null>(null);
  useEffect(() => {
    fetch('/api/intelligence/latest').then(r => r.json()).then((d: { sourceReports?: ReportsData }) => {
      if (d.sourceReports) setReports(d.sourceReports);
    }).catch(() => {});
  }, []);
  const BORDERS = { analytics: '#0066cc', marketing: '#047857', competitor: '#d97706' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Intelligence Feed</p>
          <span style={{ fontSize: 11, color: I1e, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>24HR · AI PULL</span>
        </div>
        <a href="#" style={{ fontSize: 12, fontWeight: 700, color: ACCENT, textDecoration: 'none', letterSpacing: '0.04em' }}>All reports →</a>
      </div>
      <div className="ceo-col3-grid" style={{ maxHeight: 420, overflowY: 'auto' }}>
        {(['analytics', 'marketing', 'competitor'] as const).map(kind => (
          <div key={kind} style={{ ...G1, padding: 20, display: 'flex', flexDirection: 'column', gap: 10, borderLeft: `4px solid ${BORDERS[kind]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: I1d }}>
                {{ analytics: 'Analytics', marketing: 'Marketing', competitor: 'Competitor' }[kind]}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: BORDERS[kind], letterSpacing: '0.04em' }}>
                {reports?.[kind] ? timeAgo(reports[kind]!.createdAt) : REPORT_FALLBACKS[kind].ts}
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: I1c, fontWeight: 500, margin: 0 }}>
              {reports?.[kind] ? reports[kind]!.summary.slice(0, 200) : REPORT_FALLBACKS[kind].body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Key Numbers removed — hardcoded ROAS/CAC/Brand Health, replaced by KPI arc gauges ──

// ── Situation Tab ──────────────────────────────────────────────────────────────
export default function SituationTab() {
  return (
    <div className="ceo-situation-grid">
      <div className="sit-full"><AgentKanban /></div>
      <div className="sit-feed"><IntelligenceFeedPanel /></div>
    </div>
  );
}
