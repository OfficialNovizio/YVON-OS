'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

const ACCENT = '#0066cc';
const GREEN  = '#047857';
const VIOLET = '#4f46e5';

// V1: Clear Ice — white frosted, navy text  (inner SysPanel cards)
const I1='#0c2c52', I1b='#1a3e6e', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';

// V4: Prism — iridescent pink+cyan, dark plum text  (outer strip)
const G4: React.CSSProperties = { background: "radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))", backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4c='rgba(42,18,64,0.68)', I4d='rgba(42,18,64,0.48)';

function SysPanel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ padding: 18, borderRadius: 16, background: 'rgba(255,255,255,0.55)', border: `1px solid rgba(255,255,255,0.72)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.80)' }}>
      <h5 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        {right && <span style={{ fontSize: 11, color: I1d, letterSpacing: '0.16em' }}>{right}</span>}
      </h5>
      {children}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '6px 10px', borderRadius: 999, background: 'rgba(12,44,82,0.08)', color: I1b, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {label} <span style={{ color: I1, fontWeight: 800 }}>{value}</span>
    </span>
  );
}

// ── Project Graph ──────────────────────────────────────────────────────────────
interface GraphNode { id: string; label: string; community: number; degree: number }
interface GraphEdge { source: string; target: string }
interface GraphData  { nodes: GraphNode[]; edges: GraphEdge[]; totalNodes: number; totalEdges: number; totalCommunities: number }
interface SimNode extends GraphNode { x: number; y: number; vx: number; vy: number }

const W = 400, H = 170;

function runForces(nodes: SimNode[], edgeSet: Set<string>) {
  const REPEL = 300, ATTRACT = 0.03, GRAVITY = 0.012, DAMP = 0.85;
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]; let fx = 0, fy = 0;
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const b = nodes[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist2 = Math.max(dx * dx + dy * dy, 1);
      const dist  = Math.sqrt(dist2);
      const f = REPEL / dist2;
      fx += (dx / dist) * f; fy += (dy / dist) * f;
    }
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const b = nodes[j];
      const k1 = `${a.id}→${b.id}`, k2 = `${b.id}→${a.id}`;
      if (edgeSet.has(k1) || edgeSet.has(k2)) {
        fx += (b.x - a.x) * ATTRACT; fy += (b.y - a.y) * ATTRACT;
      }
    }
    fx += (W / 2 - a.x) * GRAVITY; fy += (H / 2 - a.y) * GRAVITY;
    a.vx = (a.vx + fx) * DAMP; a.vy = (a.vy + fy) * DAMP;
  }
  for (const nd of nodes) {
    nd.x = Math.max(6, Math.min(W - 6, nd.x + nd.vx));
    nd.y = Math.max(6, Math.min(H - 6, nd.y + nd.vy));
  }
}

const COMM_COLORS = ['#0066cc', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea', '#16a34a'];
function commColor(c: number) { return COMM_COLORS[c % COMM_COLORS.length]; }

export function ProjectGraphPanel() {
  const [meta, setMeta] = useState<Pick<GraphData,'totalNodes'|'totalEdges'|'totalCommunities'> | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const simNodes = useRef<SimNode[]>([]);
  const simEdges = useRef<GraphEdge[]>([]);
  const edgeSet  = useRef<Set<string>>(new Set());
  const rafRef   = useRef<number>(0);
  const frameRef = useRef(0);

  useEffect(() => {
    fetch('/api/graph-summary')
      .then(r => r.json())
      .then((d: GraphData) => {
        setMeta({ totalNodes: d.totalNodes, totalEdges: d.totalEdges, totalCommunities: d.totalCommunities });
        simNodes.current = d.nodes.map(n => ({ ...n, x: W / 2 + (Math.random() - 0.5) * W * 0.7, y: H / 2 + (Math.random() - 0.5) * H * 0.7, vx: 0, vy: 0 }));
        simEdges.current = d.edges;
        edgeSet.current  = new Set(d.edges.map(e => `${e.source}→${e.target}`));
        frameRef.current = 0;
        const step = () => {
          runForces(simNodes.current, edgeSet.current);
          frameRef.current++;
          setTick(t => t + 1);
          if (frameRef.current < 200) rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
      })
      .catch(() => {});
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const maxDeg = useMemo(() => Math.max(...simNodes.current.map(n => n.degree), 1), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const nodes  = simNodes.current;
  const edges  = simEdges.current;
  const nodeIdx: Record<string, SimNode> = {};
  for (const n of nodes) nodeIdx[n.id] = n;

  return (
    <SysPanel title="Project Graph" right={<a href="/api/graph-html" target="_blank" rel="noreferrer" style={{ color: ACCENT }}>Full view →</a>}>
      {!meta ? (
        <div style={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, border: `2px solid ${L1}`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', borderRadius: 10, background: 'rgba(12,44,82,0.04)' }}>
          {edges.map((e, i) => {
            const s = nodeIdx[e.source], t = nodeIdx[e.target];
            if (!s || !t) return null;
            const active = hovered === s.id || hovered === t.id;
            return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={active ? commColor(s.community) : 'rgba(12,44,82,0.15)'} strokeWidth={active ? 1.2 : 0.7} />;
          })}
          {nodes.map(node => {
            const r   = 3 + (node.degree / maxDeg) * 5;
            const col = commColor(node.community);
            return (
              <g key={node.id} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
                {hovered === node.id && <circle cx={node.x} cy={node.y} r={r + 5} fill={col} opacity="0.18" />}
                <circle cx={node.x} cy={node.y} r={r} fill={col} opacity={hovered === node.id ? 1 : 0.85} />
                {hovered === node.id && (
                  <text x={node.x + r + 3} y={node.y + 3.5} fontSize="7" fill={I1b} style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {node.label.slice(0, 20)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {meta && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <Chip label="Nodes"       value={meta.totalNodes.toLocaleString()} />
          <Chip label="Edges"       value={meta.totalEdges.toLocaleString()} />
          <Chip label="Communities" value={String(meta.totalCommunities)} />
        </div>
      )}
    </SysPanel>
  );
}

// ── Token Usage ────────────────────────────────────────────────────────────────
interface TokenTotals { inputTokens: number; outputTokens: number; totalTokens: number; cacheReadTokens: number; costUsd: number; requests: number }
interface ModelRow    { model: string; inputTokens: number; outputTokens: number; costUsd: number; requests: number }
interface DailyRow    { date: string; costUsd: number }
interface TokenData   { totals: TokenTotals; cacheHitRate: number; byModel: ModelRow[]; daily: DailyRow[]; hasData: boolean }

function fmt(n: number) { if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(0)}k`; return String(n); }
function fmtCost(u: number) { if (u < 0.001) return '<$0.001'; if (u < 1) return `$${u.toFixed(4)}`; return `$${u.toFixed(2)}`; }
function modelShort(m: string) { if (m.includes('opus')) return 'Opus'; if (m.includes('sonnet')) return 'Sonnet'; if (m.includes('haiku')) return 'Haiku'; return m.split('-').pop() ?? m; }
function modelColor(m: string) { if (m.includes('opus')) return VIOLET; if (m.includes('sonnet')) return ACCENT; if (m.includes('haiku')) return GREEN; return '#64748b'; }

export function TokenUsagePanel() {
  const [data, setData] = useState<TokenData | null>(null);

  useEffect(() => {
    fetch('/api/token-usage?days=30')
      .then(r => r.json())
      .then((d: TokenData) => setData(d))
      .catch(() => {});
  }, []);

  const bars = useMemo(() => {
    if (!data) return [];
    const recent = data.daily.slice(-14);
    const max = Math.max(...recent.map(d => d.costUsd), 0.0001);
    return recent.map(d => ({ date: d.date.slice(5), costUsd: d.costUsd, pct: Math.max(4, (d.costUsd / max) * 90) }));
  }, [data]);

  if (!data) {
    return (
      <SysPanel title="Token / AI Usage" right="7D · 30D · 90D">
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, border: `2px solid ${L1}`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </SysPanel>
    );
  }

  return (
    <SysPanel title="Token / AI Usage" right="30D">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90, margin: '6px 0 12px' }}>
        {bars.map((b, i) => (
          <div key={i} title={fmtCost(b.costUsd)} style={{ flex: 1, height: `${b.pct}%`, background: i === bars.length - 1 ? VIOLET : `linear-gradient(180deg, ${ACCENT}, ${VIOLET})`, borderRadius: '3px 3px 0 0', opacity: i === bars.length - 1 ? 1 : 0.7 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        {[
          { label: 'Total cost', v: fmtCost(data.totals.costUsd), c: I1 },
          { label: 'Tokens',     v: fmt(data.totals.totalTokens), c: I1 },
          { label: 'Cache hit',  v: `${data.cacheHitRate}%`,      c: data.cacheHitRate > 30 ? GREEN : '#d97706' },
          { label: 'Requests',   v: data.totals.requests.toLocaleString(), c: I1 },
        ].map(k => (
          <div key={k.label}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d }}>{k.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>
      {data.byModel.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {data.byModel.slice(0, 3).map(m => (
            <Chip key={m.model} label={modelShort(m.model)} value={fmtCost(m.costUsd)} />
          ))}
        </div>
      )}
    </SysPanel>
  );
}

// ── Workload Calendar ──────────────────────────────────────────────────────────
const WORKLOAD = [
  0,1,1,2,1,0,0,
  1,2,3,2,3,1,0,
  2,3,4,3,4,2,1,
  1,2,3,2,4,2,0,
  2,3,3,4,3,1,0,
];

function calColor(v: number) {
  if (v === 0) return 'rgba(12,44,82,0.06)';
  if (v === 1) return 'rgba(16,185,129,0.30)';
  if (v === 2) return 'rgba(16,185,129,0.50)';
  if (v === 3) return 'rgba(16,185,129,0.75)';
  return 'rgba(5,150,105,0.95)';
}

export function WorkloadCalendarPanel() {
  return (
    <SysPanel title="Workload Calendar" right="May 2026">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, margin: '6px 0 10px' }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ fontSize: 9, color: I1d, fontWeight: 700, textAlign: 'center', letterSpacing: '0.1em' }}>{d}</div>
        ))}
        {WORKLOAD.map((v, i) => (
          <div key={i} style={{ aspectRatio: '1/1', borderRadius: 5, background: calColor(v), border: `1px solid rgba(12,44,82,0.10)` }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip label="Tasks"     value="87" />
        <Chip label="Busy days" value="22" />
        <Chip label="Peak"      value="May 12" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 9, color: I1d, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Less {[0,1,2,3,4].map(v => (
          <span key={v} style={{ width: 10, height: 10, borderRadius: 3, background: calColor(v), border: `1px solid rgba(12,44,82,0.10)`, display: 'inline-block' }} />
        ))} More
      </div>
    </SysPanel>
  );
}

// ── Session Sync Panel ─────────────────────────────────────────────────────────
interface SessionSyncData {
  sessionCount: number
  agents: string[]
  tasks: string[]
  markdownRow: string | null
}

export function SessionSyncPanel() {
  const [data, setData]     = useState<SessionSyncData | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/session-sync')
      .then(r => r.json())
      .then((d: SessionSyncData) => setData(d))
      .catch(() => {})
  }, [])

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/session-sync', { method: 'POST' })
      const json = await res.json() as { synced?: boolean; skipped?: boolean; reason?: string; error?: string; sessionCount?: number }
      if (json.error)   setSyncResult(`Error: ${json.error}`)
      else if (json.skipped) setSyncResult(json.reason ?? 'Nothing to sync')
      else setSyncResult(`Synced ${json.sessionCount ?? 0} sessions to SESSION.md`)
    } catch {
      setSyncResult('Request failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <SysPanel title="Session Log Sync" right="Live agents → SESSION.md">
      {!data ? (
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${L1}`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d }}>Today&apos;s Calls</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: data.sessionCount > 0 ? ACCENT : I1d }}>{data.sessionCount}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d }}>Agents Active</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: data.agents.length > 0 ? GREEN : I1d }}>{data.agents.length}</div>
            </div>
          </div>
          {data.agents.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {data.agents.slice(0, 6).map(a => (
                <Chip key={a} label={a} value="" />
              ))}
            </div>
          )}
          <button
            onClick={handleSync}
            disabled={syncing || data.sessionCount === 0}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 10, border: 'none', cursor: syncing || data.sessionCount === 0 ? 'not-allowed' : 'pointer',
              background: syncing || data.sessionCount === 0 ? 'rgba(12,44,82,0.12)' : `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`,
              color: syncing || data.sessionCount === 0 ? I1d : '#fff',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
              transition: 'opacity 150ms ease', opacity: syncing ? 0.7 : 1,
            }}
          >
            {syncing ? 'Syncing…' : 'Sync to SESSION.md'}
          </button>
          {syncResult && (
            <p style={{ margin: '8px 0 0', fontSize: 11, color: syncResult.startsWith('Error') ? '#dc2626' : GREEN, fontWeight: 600 }}>
              {syncResult}
            </p>
          )}
        </>
      )}
    </SysPanel>
  )
}

// ── System Strip — outer V4, inner V1 ─────────────────────────────────────────
interface SystemStripShow { graph?: boolean; tokens?: boolean; workload?: boolean; sessions?: boolean }

export default function SystemStrip({ show }: { show?: SystemStripShow }) {
  const [open, setOpen] = useState(false);
  const s = { graph: true, tokens: true, workload: true, sessions: true, ...show };

  const labels = [
    s.graph    && 'Project Graph',
    s.tokens   && 'Token Usage',
    s.workload && 'Workload',
    s.sessions && 'Session Sync',
  ].filter(Boolean).join(' · ');

  return (
    <div style={{ ...G4, overflow: 'hidden' }}>
      {/* Toggle bar */}
      <div
        style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 180ms ease' }}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.18)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I4c }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: VIOLET, display: 'inline-block' }} />
          System
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600, color: I4c }}>
          <span className="ceo-system-label">{labels}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', transition: 'transform 240ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </span>
      </div>

      {/* Expandable content */}
      <div style={{ maxHeight: open ? 640 : 0, overflow: 'hidden', transition: 'max-height 320ms ease', padding: open ? '0 14px 14px' : '0 14px' }}>
        <div className="ceo-system-4col">
          {s.graph    && <ProjectGraphPanel />}
          {s.tokens   && <TokenUsagePanel />}
          {s.workload && <WorkloadCalendarPanel />}
          {s.sessions && <SessionSyncPanel />}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
