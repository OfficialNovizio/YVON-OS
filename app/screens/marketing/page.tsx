'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GrowthSprintTab from './_growth-sprint';
import CommunityTab from './_community';
import TeamChatTab from './_team-chat';
import ContentTab from './_content';

// ── Glass variants ──────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';
const G2 = { background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)' };
const I2 = '#f4f8ff', I2d = 'rgba(244,248,255,0.48)';
const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = 'rgba(241,245,251,0.75)', I3d = 'rgba(241,245,251,0.45)';
const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';
const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

// ── Data ────────────────────────────────────────────────────────────────────────
const pillars = [
  { name: 'Clarity',  icon: 'visibility',   description: 'Demystifying financial data without dumbing it down.',         supportLine: '"See exactly where it goes."'  },
  { name: 'Control',  icon: 'tune',         description: 'Giving agency back to the user to make decisive moves.',       supportLine: '"Your money, your rules."'     },
  { name: 'Trust',    icon: 'verified_user', description: 'Bank-level security presented with absolute transparency.',   supportLine: '"Built for peace of mind."'    },
];

const auditRows = [
  { platform: 'Instagram', dot: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500', photo: 'check', bio: 'check', link: 'check', highlight: 'warn',  pinned: 'check' },
  { platform: 'TikTok',    dot: 'bg-black',                                                      photo: 'check', bio: 'check', link: 'cross', highlight: 'na',    pinned: 'warn'  },
  { platform: 'LinkedIn',  dot: 'bg-[#0A66C2]',                                                  photo: 'check', bio: 'cross', link: 'check', highlight: 'na',    pinned: 'cross' },
];

const voiceItems = [
  { tone: 'Tone: Direct & Authoritative',  copy: '"Stop wondering where your paycheck went. Tell it where to go."',                                                         usage: 'Use in: Hero Headlines'       },
  { tone: 'Tone: Empathetic & Clear',      copy: "\"We automatically categorize your expenses so you don't have to lift a finger at the end of the month.\"",              usage: 'Use in: Feature Explanations'  },
  { tone: 'Tone: Urgent & Actionable',     copy: '"Your subscription renewal is approaching. Review it now."',                                                              usage: 'Use in: Push Notifications'   },
];

const tactics = [
  { title: 'Clarity Elevator',             badge: 'EASY',        badgeColor: '#059669', badgeBg: 'rgba(5,150,105,0.12)',   description: 'Distill your core value proposition into a 3-second hook that cuts through market noise instantly.',                    apply: 'Rewrite homepage hero headline to focus solely on the primary user outcome, removing all technical jargon.',                       tags: ['Low Effort', 'High Conv.'],    status: { icon: 'schedule',      color: INK_4,     label: 'Not started'  } },
  { title: 'Marketing Control',            badge: 'HOT',         badgeColor: '#e11d48', badgeBg: 'rgba(225,29,72,0.12)',   description: 'Seize control of the narrative by creating definitive content that positions competitors relative to you.',              apply: 'Publish a "vs" matrix page highlighting our organic focus against traditional paid models.',                                         tags: ['Med Effort', 'High Trust'],    status: { icon: 'check_circle',  color: '#059669', label: '40% Complete' } },
  { title: 'Pioneer Content',              badge: 'RISING',      badgeColor: '#d97706', badgeBg: 'rgba(217,119,6,0.12)',   description: "Create fundamentally new categories of content that competitors haven't recognized as valuable yet.",                  apply: 'Launch "Tactical Teardowns" analyzing obscure but highly effective organic campaigns in adjacent industries.',                      tags: ['High Effort', 'Long Tail'],    status: { icon: 'schedule',      color: INK_4,     label: 'Planning phase'} },
  { title: 'Subscription Waste',           badge: 'EASY',        badgeColor: '#059669', badgeBg: 'rgba(5,150,105,0.12)',   description: 'Highlight the inefficiency of current market solutions to agitate the problem before presenting your fix.',             apply: 'Create a LinkedIn carousel showing the ROI decay of typical SaaS marketing stacks over 12 months.',                                 tags: ['Low Effort', 'High Agitation'],status: { icon: 'schedule',      color: INK_4,     label: 'Queued'       } },
  { title: 'Spend Breakdown',              badge: 'RISING',      badgeColor: '#d97706', badgeBg: 'rgba(217,119,6,0.12)',   description: 'Radical transparency regarding resource allocation to build immense trust with skeptical buyers.',                        apply: 'Publish an open-book review of how we allocate hours across the Tactical Library vs administrative tasks.',                         tags: ['Med Effort', 'Max Trust'],     status: { icon: 'schedule',      color: INK_4,     label: 'Drafting'     } },
  { title: 'Social Proof Story',           badge: 'RISING',      badgeColor: '#d97706', badgeBg: 'rgba(217,119,6,0.12)',   description: 'Embed testimonials within narrative structures rather than isolated quotes for higher retention.',                        apply: 'Interview recent successful client and cut into a 3-part micro-documentary for Twitter threads.',                                   tags: ['Med Effort', 'High Conv.'],    status: { icon: 'check_circle',  color: '#059669', label: 'Active run'   } },
  { title: 'Creator Trust',                badge: 'ESTABLISHED', badgeColor: I1d,       badgeBg: L1,                       description: 'Leverage the personal brand of founders or key team members to humanize corporate offerings.',                          apply: 'Daily 60-second raw voice notes from the lead strategist shared to the private Telegram community.',                               tags: ['Low Effort', 'High Loyalty'],  status: { icon: 'check_circle',  color: '#059669', label: 'Ongoing'      } },
  { title: 'Tackling Objections',          badge: 'ESTABLISHED', badgeColor: I1d,       badgeBg: L1,                       description: "Directly address the top reasons prospects don't buy, leaning into vulnerabilities.",                                   apply: '"Why You Shouldn\'t Hire Us" landing page section filtering out bad fit leads early.',                                             tags: ['Med Effort', 'Qualifying'],    status: { icon: 'check_circle',  color: '#059669', label: 'Deployed'     } },
];

const tacticFilters = ['ALL', 'HOT', 'RISING', 'EASY WINS', 'ACTIVE'];

// ── Helpers ──────────────────────────────────────────────────────────────────────
function AuditIcon({ status }: { status: string }) {
  if (status === 'check') return <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#059669' }}>check_circle</span>;
  if (status === 'cross') return <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#e11d48' }}>cancel</span>;
  if (status === 'warn')  return <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#d97706' }}>warning</span>;
  return <span style={{ color: I1d, fontSize: 16 }}>—</span>;
}

// ── Page ─────────────────────────────────────────────────────────────────────────
// ── Edit Modal ────────────────────────────────────────────────────────────────────
function EditModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div style={{ ...G1, padding: 32, width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: I1, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: L1, border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: I1d }}>close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab]       = useState('Brand Identity');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // ── Brand Identity edit state ────────────────────────────────────────────
  type EditTarget = null | 'positioning' | `pillar-${0|1|2}` | 'voice';
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [positioningText, setPositioningText] = useState(
    'Hourbour gives people total clarity over their money so they can stop guessing and start deciding.'
  );
  const [editablePillars, setEditablePillars] = useState(pillars.map(p => ({ ...p })));
  const [editableVoice,   setEditableVoice]   = useState(voiceItems.map(v => ({ ...v })));

  function savePillar(idx: 0|1|2, updated: typeof pillars[0]) {
    setEditablePillars(prev => prev.map((p, i) => i === idx ? updated : p));
    setEditTarget(null);
  }

  const tabs = ['Brand Identity', 'Growth Strategy', 'Tactics Library', 'Content', 'Community', 'Growth Sprint', 'Team'];

  const filteredTactics = activeFilter === 'ALL'       ? tactics
    : activeFilter === 'ACTIVE'    ? tactics.filter(t => ['Active run','Ongoing','Deployed','40% Complete'].includes(t.status.label))
    : activeFilter === 'EASY WINS' ? tactics.filter(t => t.badge === 'EASY')
    : tactics.filter(t => t.badge === activeFilter);

  return (
  <>
    <main className="min-h-screen pb-24">

      {/* ── Header ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto px-6 pt-[96px]">
        <div className="flex items-end justify-between gap-6 mb-[22px]">
          <div>
            <div className="flex items-center gap-2 mb-1.5" style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: INK_4
            }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
              Marketing · YVON OS
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: I1, lineHeight: 1 }}>
              Operations<span style={{ color: ACCENT }}>.</span>
            </h1>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <p className="flex items-center gap-1.5" style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#059669', margin: 0
            }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab strip ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto px-6 mt-4 mb-2">
          <nav className="flex items-center gap-1.5 p-1.5 w-fit" style={{
            background: 'rgba(8,16,36,0.58)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 999,
            boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 40px -18px rgba(0,0,0,0.50), 0 4px 10px -4px rgba(0,0,0,0.30)',
          }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="transition-all duration-200 active:scale-95"
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const,
                  padding: '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  color:      activeTab === tab ? '#0c0d10' : 'rgba(220,228,248,0.45)',
                  background: activeTab === tab ? 'rgba(255,255,255,0.92)' : 'transparent',
                }}>
                {tab}
              </button>
            ))}
          </nav>
      </div>

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── 1. Signal Strip — G3 Obsidian ──────────────────────────────────── */}
        <section style={{ ...G3, padding: '14px 24px' }} className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase' as const, color: I3d }}>Signals</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(251,146,60,0.12)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#fb923c' }}>warning</span>
            <span style={{ fontSize: 12, color: '#fb923c', fontWeight: 600 }}>Instagram Engagement −18% vs 7-day avg</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(52,211,153,0.10)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#34d399' }}>trending_up</span>
            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>YouTube Views +34% — spike detected</span>
          </div>
          <span style={{ fontSize: 11, color: I3d, marginLeft: 'auto' }}>Organic Marketing · Hourbour</span>
        </section>

        {/* ── 2. Hero — G3 Obsidian ──────────────────────────────────────────── */}
        <section style={{ ...G3, padding: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I3d, margin: '0 0 12px' }}>Organic Marketing · YVON OS</p>
          <h2 style={{ fontSize: 38, fontWeight: 700, color: '#f1f5fb', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 16px' }}>
            Marketing. Tighten the story<br />before scaling distribution.
          </h2>
          <p style={{ fontSize: 18, color: I3c, margin: '0 0 28px', lineHeight: 1.5 }}>3 priority fixes this week.</p>
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { icon: 'speed',  label: 'Momentum Score — 54',          accent: true  },
              { icon: 'block',  label: 'Brand Friction — 1 blocker',   accent: false },
              { icon: 'flag',   label: "Today's Priority — TikTok",    accent: false },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{ background: b.accent ? `${ACCENT}25` : 'rgba(241,245,251,0.08)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: b.accent ? '#5ba8ff' : I3d }}>{b.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: b.accent ? '#5ba8ff' : I3c }}>{b.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/screens/war-room?q=Generate+a+brand+brief+for+Hourbour')}
            className="active:scale-95"
            style={{ background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, padding: '14px 28px', borderRadius: 999, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            Generate Brand Brief
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
          </button>
        </section>

        {/* ── 3. Summary KPIs — G4 Prism ─────────────────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: INK_4, margin: '0 0 16px' }}>Performance Summary</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Momentum Score',  value: '54',       icon: 'speed',   valueColor: ACCENT,    desc: 'Brand growth velocity index'              },
              { label: 'Growth Blocker',  value: '1 Active', icon: 'block',   valueColor: '#fb923c', desc: 'Instagram engagement −18% in 3 weeks'     },
              { label: "Today's Priority",value: 'TikTok',   icon: 'flag',    valueColor: I4,        desc: 'Post subscription audit explainer'        },
            ].map(k => (
              <div key={k.label} style={{ ...G4, padding: 24 }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: I4d, margin: 0 }}>{k.label}</p>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: k.valueColor }}>{k.icon}</span>
                </div>
                <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: k.valueColor, margin: '0 0 6px', lineHeight: 1 }}>{k.value}</p>
                <p style={{ fontSize: 11, color: I4d, margin: 0 }}>{k.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: BRAND IDENTITY
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Brand Identity' && (
          <div className="space-y-6">

            {/* Next Move Strip — G3 + ACCENT border */}
            <div style={{ ...G3, padding: '16px 20px', borderLeft: `4px solid ${ACCENT}` }} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}20` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5ba8ff' }}>lightbulb</span>
              </div>
              <div className="flex-1">
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: '#5ba8ff', marginRight: 8 }}>Next Move:</span>
                <span style={{ fontSize: 13, color: I3c }}>Hourbour&apos;s LinkedIn page has no banner image or about section. This is a missed trust signal.</span>
              </div>
              <button
                onClick={() => router.push('/screens/war-room?q=Fix+Hourbour+LinkedIn+brand+presence')}
                className="flex items-center gap-1 flex-shrink-0 active:scale-95"
                style={{ fontSize: 12, fontWeight: 700, color: '#5ba8ff', background: 'none', border: 'none', cursor: 'pointer' }}>
                Fix now <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
              </button>
            </div>

            {/* 2-col layout */}
            <div className="grid grid-cols-12 gap-6">

              {/* Left col — positioning + pillars */}
              <div className="col-span-7 flex flex-col gap-6">

                {/* Positioning Statement — G1 */}
                <div style={{ ...G1, padding: 32 }} className="group relative">
                  <div className="flex items-center justify-between mb-6">
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I1d, margin: 0 }}>Positioning Statement</p>
                    <button onClick={() => setEditTarget('positioning')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 active:scale-95"
                      style={{ fontSize: 12, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span> Edit
                    </button>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.3, color: I1, letterSpacing: '-0.01em', margin: 0 }}>
                    &ldquo;{positioningText}&rdquo;
                  </p>
                </div>

                {/* Brand Pillars */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: INK_4, margin: '0 0 16px 4px' }}>Brand Pillars</p>
                  <div className="grid grid-cols-3 gap-4">
                    {editablePillars.map((p, idx) => (
                      <div key={p.name} style={{ ...G1, padding: 20 }} className="group relative">
                        <button onClick={() => setEditTarget(`pillar-${idx as 0|1|2}`)}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                          style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, padding: '4px 10px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>
                          Edit
                        </button>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: L1 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: ACCENT }}>{p.icon}</span>
                        </div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: I1, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{p.name}</h4>
                        <p style={{ fontSize: 12, color: I1c, lineHeight: 1.55, margin: '0 0 12px', minHeight: 52 }}>{p.description}</p>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: I1d, margin: '0 0 4px' }}>Support Line</p>
                        <p style={{ fontSize: 12, color: I1, fontStyle: 'italic', margin: 0 }}>{p.supportLine}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right col — audit + voice */}
              <div className="col-span-5 flex flex-col gap-6">

                {/* Brand Presence Audit — G1 */}
                <div style={{ ...G1, overflow: 'hidden' }}>
                  <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: I1, margin: 0 }}>Brand Presence Audit</h3>
                    <span style={{ fontSize: 11, color: I1d }}>Updated 2h ago</span>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ borderTop: `1px solid ${L1}` }}>
                        {['Platform','Photo','Bio','Link','Highl.','Pinned'].map((h, i) => (
                          <th key={h} className={i > 0 ? 'text-center' : ''}
                            style={{ padding: `8px ${i === 0 ? '20px' : '8px'}`, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: I1d }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditRows.map(row => (
                        <tr key={row.platform} style={{ borderTop: `1px solid ${L1}` }} className="hover:bg-black/[0.02] transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded flex-shrink-0 opacity-80 ${row.dot}`} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{row.platform}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center"><AuditIcon status={row.photo} /></td>
                          <td className="py-3 text-center"><AuditIcon status={row.bio} /></td>
                          <td className="py-3 text-center"><AuditIcon status={row.link} /></td>
                          <td className="py-3 text-center"><AuditIcon status={row.highlight} /></td>
                          <td className="py-3 text-center"><AuditIcon status={row.pinned} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Brand Voice Library — G2 Azure Tint */}
                <div style={{ ...G2, padding: 24 }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: ACCENT }}>record_voice_over</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: I2, margin: 0 }}>Brand Voice Library</p>
                    </div>
                    <button onClick={() => setEditTarget('voice')}
                      style={{ fontSize: 11, fontWeight: 700, color: I2, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', padding: '5px 12px', borderRadius: 999, cursor: 'pointer' }}
                      className="active:scale-95">
                      Edit
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editableVoice.map((v, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 14 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: I2d, margin: '0 0 6px' }}>{v.tone}</p>
                        <p style={{ fontSize: 12, color: I2, fontStyle: 'italic', margin: '0 0 8px', lineHeight: 1.55 }}>{v.copy}</p>
                        <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.10)', color: I2d, padding: '3px 10px', borderRadius: 999 }}>{v.usage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: GROWTH STRATEGY
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Growth Strategy' && (
          <div className="space-y-6">

            {/* North Star KPIs — G4 */}
            <section>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: INK_4, margin: '0 0 16px' }}>Growth North Star</p>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'North Star',    value: 'MAU',    sub: 'Monthly Active Users drives all decisions', valueColor: ACCENT,    icon: 'auto_awesome'  },
                  { label: 'Current MAU',   value: '1,240',  sub: '+18% MoM — on track',                      valueColor: '#34d399', icon: 'people'        },
                  { label: 'MAU Target',    value: '2,000',  sub: 'End of this sprint cycle',                 valueColor: I4,        icon: 'flag'          },
                  { label: 'Gap to Close',  value: '760',    sub: '38% remaining · 14 days',                  valueColor: '#fb923c', icon: 'trending_up'   },
                ].map(c => (
                  <div key={c.label} style={{ ...G4, padding: 24 }}>
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: I4d, margin: 0 }}>{c.label}</p>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: c.valueColor }}>{c.icon}</span>
                    </div>
                    <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: c.valueColor, margin: '0 0 4px', lineHeight: 1 }}>{c.value}</p>
                    <p style={{ fontSize: 11, color: I4d, margin: 0 }}>{c.sub}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Funnel Health + Leverage Actions */}
            <section className="grid grid-cols-12 gap-6">

              {/* Funnel Health — G1 */}
              <div className="col-span-5" style={{ ...G1, padding: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I1d, margin: '0 0 4px' }}>Kai · Funnel Health</p>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: '0 0 20px' }}>Funnel Health</h3>
                <div className="space-y-4">
                  {[
                    { stage: 'Awareness', value: 48200, pct: 80, color: ACCENT,    gap: null                        },
                    { stage: 'Interest',  value: 9640,  pct: 16, color: '#fb923c', gap: '80% drop-off — top leak'   },
                    { stage: 'Trial',     value: 3210,  pct: 5,  color: '#34d399', gap: '67% drop-off'              },
                    { stage: 'Paid',      value: 1240,  pct: 2,  color: '#8b5cf6', gap: '61% drop-off'              },
                  ].map(f => (
                    <div key={f.stage}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{f.stage}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: I1, fontFamily: 'ui-monospace,monospace' }}>{f.value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: L1 }}>
                        <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: f.color }} />
                      </div>
                      {f.gap && <span style={{ fontSize: 11, color: '#fb923c' }}>⚠ {f.gap}</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 rounded-xl" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#fb923c', margin: '0 0 4px' }}>Biggest leak: Awareness → Interest</p>
                  <p style={{ fontSize: 11, color: I1d, margin: 0 }}>Fix: Hook quality and CTA clarity on all organic posts</p>
                </div>
              </div>

              {/* Leverage Actions — G3 */}
              <div className="col-span-7" style={{ ...G3, padding: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I3d, margin: '0 0 4px' }}>Nate · Growth</p>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5fb', letterSpacing: '-0.02em', margin: '0 0 20px' }}>Top 3 Leverage Actions</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Quick Win', labelColor: '#34d399', labelBg: 'rgba(52,211,153,0.12)',  action: 'Add a friction-free "Save Report" CTA inside the app after every expense sync',                              hypothesis: 'IF we add in-app share trigger THEN referral installs will increase by 25% BECAUSE users share wins organically when prompted at peak satisfaction.',                                                     effort: 'Low effort',  impact: 'High impact'    },
                    { label: 'Big Bet',   labelColor: '#5ba8ff', labelBg: `${ACCENT}18`,             action: 'Launch a 14-day "Spending Clarity Challenge" — daily micro-prompts via Telegram + TikTok',                  hypothesis: 'IF we run a public challenge THEN trial signups will increase by 40% BECAUSE challenge-based content consistently outperforms passive posts by 3-5× in fintech.',                                           effort: 'Med effort',  impact: 'Max reach'      },
                    { label: 'Kill',      labelColor: '#fb923c', labelBg: 'rgba(251,146,60,0.12)',   action: 'Stop posting generic "financial tips" carousels — engagement rate is 0.4%, below kill threshold',            hypothesis: 'Reallocating this production time to short-form video will yield 4× the reach for the same effort.',                                                                                                      effort: 'Saves time',  impact: 'Frees capacity' },
                  ].map(a => (
                    <div key={a.label} style={{ background: 'rgba(241,245,251,0.04)', border: '1px solid rgba(241,245,251,0.08)', borderRadius: 14, padding: 18 }}>
                      <div className="flex items-start gap-4">
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '4px 10px', borderRadius: 999, background: a.labelBg, color: a.labelColor, flexShrink: 0, marginTop: 2 }}>{a.label}</span>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5fb', margin: '0 0 6px' }}>{a.action}</p>
                          <p style={{ fontSize: 11, color: I3d, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 10px' }}>&ldquo;{a.hypothesis}&rdquo;</p>
                          <div className="flex gap-2">
                            <span style={{ fontSize: 10, color: I3d, background: 'rgba(241,245,251,0.06)', padding: '2px 10px', borderRadius: 999 }}>{a.effort}</span>
                            <span style={{ fontSize: 10, color: I3d, background: 'rgba(241,245,251,0.06)', padding: '2px 10px', borderRadius: 999 }}>{a.impact}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Channel Benchmarks + Experiment Queue */}
            <section className="grid grid-cols-12 gap-6">

              {/* Channel Benchmarks — G1 */}
              <div className="col-span-8" style={{ ...G1, overflow: 'hidden' }}>
                <div className="px-6 pt-5 pb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I1d, margin: '0 0 4px' }}>Rio · Channels</p>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Channel Health vs Our Targets</h3>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderTop: `1px solid ${L1}` }}>
                      {['Channel','Metric','Current','Target','Gap','Signal'].map(h => (
                        <th key={h} className="px-5 py-3" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: I1d }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ch: 'Instagram', metric: 'Engagement rate', current: '1.1%', target: '2.5%', gap: '−1.4pp', over: false },
                      { ch: 'TikTok',    metric: 'View retention',  current: '38%',  target: '50%',  gap: '−12pp',  over: false },
                      { ch: 'LinkedIn',  metric: 'Eng. rate',       current: '3.8%', target: '3%',   gap: '+0.8pp', over: true  },
                      { ch: 'YouTube',   metric: 'CTR',             current: '5.4%', target: '4%',   gap: '+1.4pp', over: true  },
                    ].map(r => (
                      <tr key={r.ch} style={{ borderTop: `1px solid ${L1}` }} className="hover:bg-black/[0.02] transition-colors">
                        <td className="px-5 py-3.5" style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{r.ch}</td>
                        <td className="px-5 py-3.5" style={{ fontSize: 12, color: I1d }}>{r.metric}</td>
                        <td className="px-5 py-3.5" style={{ fontSize: 12, fontWeight: 700, color: I1 }}>{r.current}</td>
                        <td className="px-5 py-3.5" style={{ fontSize: 12, color: I1d }}>{r.target}</td>
                        <td className="px-5 py-3.5" style={{ fontSize: 12, color: I1c }}>{r.gap}</td>
                        <td className="px-5 py-3.5">
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', padding: '3px 10px', borderRadius: 999, background: r.over ? 'rgba(52,211,153,0.10)' : 'rgba(251,146,60,0.10)', color: r.over ? '#34d399' : '#fb923c' }}>
                            {r.over ? 'Over' : 'Under'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Experiment Queue — G1 */}
              <div className="col-span-4" style={{ ...G1, padding: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I1d, margin: '0 0 4px' }}>Nate · Experiments</p>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: '0 0 16px' }}>Experiment Queue</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { name: 'Hook A/B Test',      status: 'Running', statusColor: '#34d399', statusBg: 'rgba(52,211,153,0.10)', days: '7 days left',  desc: 'Question vs statement hook on TikTok'        },
                    { name: 'Spending Challenge',  status: 'Queued',  statusColor: ACCENT,    statusBg: `${ACCENT}15`,           days: 'Starts Monday', desc: '14-day series across Telegram + TikTok'      },
                    { name: 'LinkedIn Carousel',   status: 'Draft',   statusColor: I1d,       statusBg: L1,                      days: '—',             desc: 'ROI decay of typical SaaS stacks'            },
                  ].map(e => (
                    <div key={e.name} style={{ background: L1, borderRadius: 14, padding: 14 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{e.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', padding: '3px 8px', borderRadius: 999, background: e.statusBg, color: e.statusColor }}>{e.status}</span>
                      </div>
                      <p style={{ fontSize: 11, color: I1c, margin: '0 0 4px' }}>{e.desc}</p>
                      <p style={{ fontSize: 10, color: I1d, margin: 0 }}>{e.days}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: TACTICS LIBRARY
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Tactics Library' && (
          <div className="space-y-6">

            {/* Filter bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1" style={{
                background: 'rgba(8,16,36,0.58)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
              }}>
                {tacticFilters.map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className="transition-all duration-200 active:scale-95"
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const,
                      padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                      color:      activeFilter === f ? '#0c0d10' : 'rgba(220,228,248,0.45)',
                      background: activeFilter === f ? 'rgba(255,255,255,0.92)' : 'transparent',
                    }}>
                    {f}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, color: I1d }}>{filteredTactics.length} tactics</span>
            </div>

            {/* Tactic cards */}
            <div className="grid grid-cols-4 gap-4 pb-4">
              {filteredTactics.map(t => (
                <div key={t.title} style={{ ...G1, padding: 20 }} className="flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: I1, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.3, width: '70%' }}>{t.title}</h4>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: 999, background: t.badgeBg, color: t.badgeColor }}>{t.badge}</span>
                  </div>
                  <p style={{ fontSize: 12, color: I1c, margin: '0 0 12px', flexGrow: 1, lineHeight: 1.55 }}>{t.description}</p>
                  <div style={{ borderTop: `1px solid ${L1}`, paddingTop: 12, marginBottom: 12 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: I1d, margin: '0 0 6px' }}>How to Apply — Hourbour</p>
                    <p className="line-clamp-2" style={{ fontSize: 11, color: I1c, lineHeight: 1.5, margin: 0 }}>{t.apply}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {t.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 10, color: I1d, background: L1, padding: '2px 8px', borderRadius: 4 }}>{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: t.status.color }}>{t.status.icon}</span>
                    <span style={{ fontSize: 10, color: t.status.color }}>{t.status.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Content'       && <ContentTab />}
        {activeTab === 'Community'     && <CommunityTab />}
        {activeTab === 'Growth Sprint' && <GrowthSprintTab />}
        {activeTab === 'Team'          && <TeamChatTab />}

        {/* Footer */}
        <footer className="border-t flex items-center justify-between py-6" style={{ borderColor: L1 }}>
          <p style={{ fontSize: 11, color: INK_4 }}>© 2026 YVON Intelligence. Built for Excellence.</p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#" style={{ fontSize: 11, color: INK_4 }} className="hover:opacity-70 transition-opacity">{l}</a>
            ))}
          </div>
        </footer>

      </div>
    </main>

    {/* ── Brand Identity Edit Modals ─────────────────────────────────────────── */}

    {/* Positioning Statement */}
    {editTarget === 'positioning' && (
      <EditModal title="Edit Positioning Statement" onClose={() => setEditTarget(null)}>
        <textarea
          value={positioningText}
          onChange={e => setPositioningText(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${L1}`, background: 'rgba(12,44,82,0.04)', fontSize: 15, color: I1, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
        />
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setEditTarget(null)}
            style={{ background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
            className="active:scale-95">
            Save
          </button>
          <button
            onClick={() => router.push('/screens/war-room?q=Regenerate+the+brand+positioning+statement+for+Hourbour')}
            style={{ background: 'none', border: `1px solid ${L1}`, color: I1d, fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            className="active:scale-95">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
            Regenerate with Lena
          </button>
        </div>
      </EditModal>
    )}

    {/* Pillar Edit */}
    {(editTarget === 'pillar-0' || editTarget === 'pillar-1' || editTarget === 'pillar-2') && (() => {
      const idx = Number(editTarget.split('-')[1]) as 0|1|2;
      const pillar = editablePillars[idx];
      return (
        <EditModal title={`Edit Pillar — ${pillar.name}`} onClose={() => setEditTarget(null)}>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Pillar Name', key: 'name' as const, value: pillar.name },
              { label: 'Description', key: 'description' as const, value: pillar.description },
              { label: 'Support Line', key: 'supportLine' as const, value: pillar.supportLine },
            ].map(field => (
              <div key={field.key}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: I1d, margin: '0 0 6px' }}>{field.label}</p>
                <input
                  value={field.value}
                  onChange={e => setEditablePillars(prev => prev.map((p, i) => i === idx ? { ...p, [field.key]: e.target.value } : p))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${L1}`, background: 'rgba(12,44,82,0.04)', fontSize: 13, color: I1, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => savePillar(idx, editablePillars[idx])}
              style={{ background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
              className="active:scale-95">
              Save Pillar
            </button>
            <button
              onClick={() => setEditTarget(null)}
              style={{ background: 'none', border: `1px solid ${L1}`, color: I1d, fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10, cursor: 'pointer' }}
              className="active:scale-95">
              Cancel
            </button>
          </div>
        </EditModal>
      );
    })()}

    {/* Brand Voice Edit */}
    {editTarget === 'voice' && (
      <EditModal title="Edit Brand Voice Library" onClose={() => setEditTarget(null)}>
        <div className="flex flex-col gap-5">
          {editableVoice.map((v, i) => (
            <div key={i} style={{ background: 'rgba(12,44,82,0.04)', border: `1px solid ${L1}`, borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: I1d, margin: '0 0 10px' }}>Voice Example {i + 1}</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Tone Label', key: 'tone' as const, value: v.tone },
                  { label: 'Copy Example', key: 'copy' as const, value: v.copy },
                  { label: 'Usage Context', key: 'usage' as const, value: v.usage },
                ].map(field => (
                  <div key={field.key}>
                    <p style={{ fontSize: 10, color: I1d, margin: '0 0 4px' }}>{field.label}</p>
                    <input
                      value={field.value}
                      onChange={e => setEditableVoice(prev => prev.map((item, j) => j === i ? { ...item, [field.key]: e.target.value } : item))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${L1}`, background: '#fff', fontSize: 12, color: I1, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => setEditTarget(null)}
            style={{ background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
            className="active:scale-95">
            Save Voice
          </button>
          <button
            onClick={() => router.push('/screens/war-room?q=Regenerate+brand+voice+examples+for+Hourbour+with+3+tone+variants')}
            style={{ background: 'none', border: `1px solid ${L1}`, color: I1d, fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            className="active:scale-95">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
            Regenerate with Lena
          </button>
        </div>
      </EditModal>
    )}

  </>
  );
}
