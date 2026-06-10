'use client';

import { useState, useEffect } from 'react';
import type { Decision, DecisionUrgency, DecisionAction } from '@/lib/types';

const ACCENT = '#0066cc';
const GREEN  = '#047857';

// V1: Clear Ice — white frosted, navy text  (Priorities)
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1b='#1a3e6e', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', I1e='rgba(12,44,82,0.26)', L1='rgba(12,44,82,0.10)';

// V3: Obsidian — dark smoke, light text  (Decision Queue)
const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3='#f1f5fb', I3b='#ccd6eb', I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)', L3='rgba(255,255,255,0.10)';

const DECISIONS = [
  {
    urgency: 'ACT NOW', urgencyBg: '#dc2626',
    category: 'Infrastructure · Hermes',
    question: "Commit and push the Hermes Agent integration to GitHub? All 13 agents are powered, execute-stage.ts is wired, graphify memory auto-injects.",
    stake: '14 files changed, TypeScript zero errors, tested with real repos',
    prep: 'Marcus verified all agent spawns work', deadline: 'Decision before next session',
    primary: 'Push to GitHub', secondary: 'Review diff first',
  },
  {
    urgency: 'HIGH', urgencyBg: '#0066cc',
    category: 'Code Quality · SESSION.md',
    question: "Fix the corrupted SESSION.md — 100+ lines of duplicated entries, stray agent-persona text leaking. This is the source of truth for all sessions.",
    stake: 'Every future session reads corrupted data if not fixed',
    prep: 'Phase 1 squad (Dev+Raj+Mia+Quinn) ready', deadline: 'This week',
    primary: 'Assign Dev', secondary: 'Defer',
  },
  {
    urgency: 'HIGH', urgencyBg: '#0066cc',
    category: 'UI · Competitor Dashboard',
    question: "Build the missing Opportunities tab (currently 404) and add Health to NavBar? Both are code-level fixes.",
    stake: '404 erodes trust. Health dashboard is invisible.',
    prep: 'Mia identified both issues in audit', deadline: 'This sprint',
    primary: 'Assign Mia', secondary: 'Schedule next sprint',
  },
];

// ── Decision Queue — V3: Obsidian ─────────────────────────────────────────────
export function DecisionQueue({ onWarRoom }: { onWarRoom: () => void }) {
  const [idx, setIdx]   = useState(0);
  const [fade, setFade] = useState(false);
  const d = DECISIONS[idx];

  const navigate = (delta: number) => {
    const next = idx + delta;
    if (next < 0 || next >= DECISIONS.length) return;
    setFade(true);
    setTimeout(() => { setIdx(next); setFade(false); }, 150);
  };

  return (
    <div style={{ ...G3, padding: 22, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I3d, margin: 0 }}>Decision Queue</p>
        <div className="flex items-center gap-2.5">
          <button disabled={idx === 0} onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid rgba(255,255,255,0.18)`, background: 'rgba(255,255,255,0.12)', color: I3b, cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all 180ms ease' }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: I3c }}>{idx + 1} / {DECISIONS.length}</span>
          <button disabled={idx === DECISIONS.length - 1} onClick={() => navigate(+1)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid rgba(255,255,255,0.18)`, background: 'rgba(255,255,255,0.12)', color: I3b, cursor: idx === DECISIONS.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === DECISIONS.length - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all 180ms ease' }}>›</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 22, borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: `1px solid ${L3}`, minHeight: 280, opacity: fade ? 0.35 : 1, transition: 'opacity 180ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: d.urgencyBg, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{d.urgency}</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I3d }}>{d.category}</span>
        </div>
        <p style={{ margin: '28px 0', fontSize: 24, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.025em', color: I3, flex: 1, display: 'flex', alignItems: 'center' }}>{d.question}</p>
        <div style={{ fontSize: 13, color: I3c, lineHeight: 1.6, marginBottom: 18, borderTop: `1px dashed ${L3}`, paddingTop: 14 }}>
          <strong style={{ color: I3b, fontWeight: 600 }}>Stake.</strong> {d.stake}<br />
          <strong style={{ color: I3b, fontWeight: 600 }}>Prep.</strong> {d.prep}<br />
          <strong style={{ color: I3b, fontWeight: 600 }}>Deadline.</strong> {d.deadline}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: `1px solid rgba(255,255,255,0.20)`, background: 'transparent', color: I3b, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 180ms ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >{d.secondary}</button>
          <button style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: 'none', background: I3, color: '#0c0d10', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 180ms ease' }}>{d.primary}</button>
        </div>
      </div>

      <p style={{ fontSize: 13, color: I3d, textAlign: 'center', marginTop: 12, fontWeight: 600 }}>
        {idx < DECISIONS.length - 1 ? `${DECISIONS.length - idx - 1} more waiting` : 'End of queue · all reviewed'}
      </p>
      <button className="ceo-war-room-btn" style={{ marginTop: 14 }} onClick={onWarRoom}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>⚡</span>
          Need context?{' '}<span style={{ opacity: 0.75, fontWeight: 500 }}>Open War Room</span>
        </span>
        <span>→</span>
      </button>
    </div>
  );
}

// ── Priorities — each its own V1 card ──────────────────────────────────────────
const TIER_META: Record<string, { tc: string; bc: string; bg: string }> = {
  URGENT:    { tc: '#dc2626', bc: 'rgba(220,38,38,0.20)', bg: 'rgba(220,38,38,0.06)' },
  HIGH:      { tc: ACCENT,    bc: 'rgba(0,102,204,0.20)', bg: 'rgba(0,102,204,0.06)' },
  STRATEGIC: { tc: '#d97706', bc: 'rgba(217,119,6,0.20)', bg: 'rgba(217,119,6,0.06)' },
  LAUNCH:    { tc: GREEN,     bc: 'rgba(5,150,105,0.20)', bg: 'rgba(5,150,105,0.06)' },
};

const PRIORITIES = [
  { tier: 'URGENT',    title: 'Push Hermes integration to GitHub',     desc: '14 files changed: execute-stage.ts, hermes-spawn.ts, 13 agent skills, Quinn tools. TypeScript zero errors. All agents tested.', owner: 'Marcus' },
  { tier: 'URGENT',    title: 'Fix SESSION.md corruption',             desc: '100+ lines of duplicated table entries, stray agent-persona injections. Source of truth for all sessions.', owner: 'Dev' },
  { tier: 'HIGH',      title: 'Build Competitor Opportunities tab',    desc: 'Tab is linked in subnav but folder does not exist — hard 404. Must create page.tsx with same glass pattern.', owner: 'Mia' },
  { tier: 'HIGH',      title: 'Add Health to NavBar',                  desc: 'Health dashboard at /screens/health exists and works, but is not linked in NavBar.tsx. Zero discovery.', owner: 'Mia' },
  { tier: 'HIGH',      title: 'Run pending Supabase migrations',       desc: 'Migrations 021 (clothing_items), 022 (CSE — 4 tables), 023 (studio_sessions). Multiple agents blocked on these.', owner: 'Raj' },
  { tier: 'STRATEGIC', title: 'Standardize glass CSS across 32 files', desc: 'G1-G4 definitions duplicated verbatim in 32 component files. Extract to shared constants module.', owner: 'Dev' },
  { tier: 'STRATEGIC', title: 'Delete legacy Marketing tabs',          desc: '4 tabs (Brand Identity, Growth Strategy, Tactics, Team) are hardcoded demos. Remove dead code, keep registry.', owner: 'Dev' },
  { tier: 'STRATEGIC', title: 'Fix competitor-pipeline.ts types',      desc: '23 explicit `any` type violations. Worst type-safety in the codebase. Replace with proper interfaces.', owner: 'Quinn' },
  { tier: 'LAUNCH',    title: 'Verify War Room approval gate intact',  desc: 'feedback.md Rule 6: gate deleted 5+ times. Check team-chat/route.ts for STRUCTURAL GATE comment.', owner: 'Quinn' },
  { tier: 'LAUNCH',    title: 'Extract Creative Studio monolith',      desc: '2199 lines in page.tsx. Extract FilterBar, SchedulePanel, platform tiles into separate components.', owner: 'Mia' },
];

export function Priorities() {
  const counts: Record<string, number> = {};
  for (const p of PRIORITIES) counts[p.tier] = (counts[p.tier] || 0) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Priorities</p>
        <span style={{ fontSize: 12, color: I1d, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{PRIORITIES.length} active</span>
      </div>

      {/* Individual priority cards — scrollable */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {PRIORITIES.map((p, i) => {
          const m = TIER_META[p.tier] || TIER_META.URGENT;
          return (
            <div key={i} style={{ ...G1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10)' }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, border: `1px solid ${m.bc}`, background: m.bg, color: m.tc }}>{p.tier}</span>
                <span style={{ fontSize: 13, color: I1d, fontWeight: 600 }}>Owner · <strong style={{ color: I1b, fontWeight: 700 }}>{p.owner}</strong></span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: I1, letterSpacing: '-0.015em' }}>{p.title}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: I1c, lineHeight: 1.35 }}>{p.desc}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, cursor: 'pointer' }}>See detail →</div>
            </div>
          );
        })}
      </div>

      {/* Tier count stats separator */}
      <div style={{ ...G1, padding: '10px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10)' }}>
        {Object.entries(TIER_META).map(([tier, m]) => (
          <div key={tier} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: m.tc }}>{tier}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: m.tc, lineHeight: 1.2 }}>{counts[tier] || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Decisions Waiting — V3: Obsidian (live: /api/decisions) ────────────────────
const URGENCY_META: Record<DecisionUrgency, { label: string; bg: string }> = {
  'critical':  { label: 'CRITICAL',  bg: '#dc2626' },
  'today':     { label: 'TODAY',     bg: '#d97706' },
  'this-week': { label: 'THIS WEEK', bg: '#0066cc' },
};

function decisionTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function DecisionsLive() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/decisions?resolved=false')
      .then(r => r.json())
      .then((d: { decisions?: Decision[] }) => setDecisions(d.decisions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function resolve(id: string, action: DecisionAction) {
    setBusy(id);
    try {
      await fetch('/api/decisions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      setDecisions(prev => prev.filter(d => d.id !== id));
    } catch {
      /* leave it in the list on failure */
    } finally {
      setBusy(null);
    }
  }

  const actionBtn = (label: string, onClick: () => void, opts?: { solid?: boolean; danger?: boolean; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={opts?.disabled}
      style={{
        flex: 1, padding: '11px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: opts?.disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', transition: 'all 180ms ease', opacity: opts?.disabled ? 0.5 : 1,
        border: opts?.solid ? 'none' : `1px solid rgba(255,255,255,0.20)`,
        background: opts?.solid ? I3 : 'transparent',
        color: opts?.solid ? '#0c0d10' : opts?.danger ? '#fca5a5' : I3b,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ ...G3, padding: 22, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: I3d, margin: 0 }}>Decisions Waiting</p>
        <span style={{ fontSize: 13, fontWeight: 800, color: I3c }}>{decisions.length} open</span>
      </div>

      {loading ? (
        <p style={{ fontSize: 14, color: I3d, fontWeight: 500, margin: 0 }}>Loading…</p>
      ) : decisions.length === 0 ? (
        <p style={{ fontSize: 15, color: I3c, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
          You&apos;re clear — no decisions waiting. New decisions raised by agents will appear here for approval.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {decisions.map(d => {
            const u = URGENCY_META[d.urgency] ?? URGENCY_META['this-week'];
            return (
              <div key={d.id} style={{ padding: 18, borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: `1px solid ${L3}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: u.bg, letterSpacing: '0.14em' }}>{u.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: I3d }}>{d.agentId} · {decisionTimeAgo(d.createdAt)}</span>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.01em', color: I3 }}>
                  {d.question || d.decisionText}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {actionBtn('Reject',  () => resolve(d.id, 'rejected'), { danger: true, disabled: busy === d.id })}
                  {actionBtn('Defer',   () => resolve(d.id, 'deferred'),  { disabled: busy === d.id })}
                  {actionBtn('Approve', () => resolve(d.id, 'approved'),  { solid: true, disabled: busy === d.id })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Act Tab ────────────────────────────────────────────────────────────────────
export default function ActTab({ onWarRoom }: { onWarRoom: () => void }) {
  return (
    <div className="ceo-act-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <DecisionQueue onWarRoom={onWarRoom} />
      </div>
      <Priorities />
    </div>
  );
}
