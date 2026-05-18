'use client';

import CompetitorSubNav from '../_subnav';

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

// ── DOT component ───────────────────────────────────────────────────────────────
type DotColor = 'green' | 'yellow' | 'blue' | 'none';
const DOT = ({ color }: { color: DotColor }) => {
  const bg: Record<DotColor, string> = {
    green:  'bg-emerald-500',
    yellow: 'bg-yellow-400',
    blue:   'bg-[#0066cc]',
    none:   'bg-black/10',
  };
  return <span className={`w-2 h-2 rounded-full inline-block ${bg[color]}`} />;
};

// ── Data ────────────────────────────────────────────────────────────────────────
const keywords = [
  { kw: 'best hourly savings app',       vol: '2.4k',  diff: 18, hrb: 'blue',  rev: 'none',   mon: 'none',   wis: 'none',  gap: true  },
  { kw: 'automatic savings tracker uk',  vol: '4.1k',  diff: 32, hrb: 'none',  rev: 'yellow', mon: 'green',  wis: 'none',  gap: true  },
  { kw: 'best app for saving money',     vol: '12.4k', diff: 72, hrb: 'none',  rev: 'green',  mon: 'green',  wis: 'none',  gap: true  },
  { kw: 'neobank uk 2026',              vol: '8.5k',  diff: 64, hrb: 'none',  rev: 'green',  mon: 'green',  wis: 'none',  gap: true  },
  { kw: 'international transfer free',   vol: '24.1k', diff: 88, hrb: 'none',  rev: 'green',  mon: 'yellow', wis: 'green', gap: true  },
  { kw: 'fintech app uk',               vol: '5.2k',  diff: 45, hrb: 'none',  rev: 'yellow', mon: 'green',  wis: 'none',  gap: true  },
  { kw: 'hourly savings tracker',        vol: '1.2k',  diff: 22, hrb: 'blue',  rev: 'none',   mon: 'none',   wis: 'none',  gap: false },
  { kw: 'money management app',          vol: '18.9k', diff: 82, hrb: 'none',  rev: 'green',  mon: 'green',  wis: 'none',  gap: true  },
];

const trending = [
  { kw: 'ai savings app',        change: '+340%', badge: 'Surging', up: true  },
  { kw: 'open banking uk',       change: '+185%', badge: 'Rising',  up: true  },
  { kw: 'ethical fintech',       change: '+92%',  badge: 'Rising',  up: true  },
  { kw: 'crypto savings account',change: '−44%',  badge: 'Falling', up: false },
];

const priorityGaps = [
  { score: '9.1', kw: 'automatic savings tracker uk', vol: '4.1k', why: 'High intent, low competition, directly maps to your core product.', platform: 'Organic + Blog' },
  { score: '8.7', kw: 'best hourly savings app',       vol: '2.4k', why: "Branded long-tail — own this before competitors colonise it.",     platform: 'Organic + ASO' },
  { score: '8.2', kw: 'ai savings app',                vol: '2.1k', why: 'Surging 340% — early mover advantage still available.',            platform: 'Blog + Social' },
  { score: '7.5', kw: 'neobank uk 2026',              vol: '8.5k', why: 'Competitors rank here; requires content investment but high payoff.', platform: 'SEO' },
];

// ── Hashtag Intelligence Data ──────────────────────────────────────────────────
const igHashtags = [
  { tag: '#financialtips',         engRate: '4.2%', volume: '18.4M', competition: 'High',   rec: false },
  { tag: '#savingschallenge',      engRate: '6.8%', volume: '2.1M',  competition: 'Medium', rec: true  },
  { tag: '#moneymindset',          engRate: '5.4%', volume: '9.8M',  competition: 'High',   rec: false },
  { tag: '#hourbour',              engRate: '—',    volume: '—',     competition: 'None',   rec: true  },
  { tag: '#savingsgoals',          engRate: '7.1%', volume: '1.2M',  competition: 'Low',    rec: true  },
  { tag: '#personalfinanceuk',     engRate: '8.4%', volume: '480K',  competition: 'Low',    rec: true  },
];

const ttHashtags = [
  { tag: '#moneytok',              type: 'Evergreen', views: '4.2B',  trending: true  },
  { tag: '#savingshacks',          type: 'Trending',  views: '820M',  trending: true  },
  { tag: '#financialindependence', type: 'Evergreen', views: '2.1B',  trending: false },
  { tag: '#ukfinance',             type: 'Niche',     views: '128M',  trending: false },
  { tag: '#savingchallenge2026',   type: 'Trending',  views: '44M',   trending: true  },
  { tag: '#neobankuk',             type: 'Niche',     views: '8.2M',  trending: false },
];

const liHashtags = [
  { tag: '#fintech',            reach: 'High',   intent: 'Professional', posts: '2.1M/wk' },
  { tag: '#openbanking',        reach: 'Medium', intent: 'Decision',     posts: '48K/wk'  },
  { tag: '#personalfinance',    reach: 'High',   intent: 'Learning',     posts: '820K/wk' },
  { tag: '#savingsapp',         reach: 'Low',    intent: 'Purchase',     posts: '12K/wk'  },
  { tag: '#ukfintech',          reach: 'Medium', intent: 'Professional', posts: '62K/wk'  },
];

const ytTags = [
  { tag: 'save money uk 2026',       type: 'Search term', volume: '8.4K/mo', diff: 'Low'    },
  { tag: 'automatic savings app',    type: 'Search term', volume: '4.2K/mo', diff: 'Low'    },
  { tag: 'best savings app uk',      type: 'Search term', volume: '22K/mo',  diff: 'High'   },
  { tag: '#moneysavingtips',         type: 'Hashtag',     volume: '—',       diff: 'Medium' },
  { tag: '#fintechuk',               type: 'Hashtag',     volume: '—',       diff: 'Low'    },
];

// ── Page ────────────────────────────────────────────────────────────────────────
export default function CompetitorKeywordsPage() {
  const gapCount   = keywords.filter(k => k.gap && k.hrb === 'none').length;
  const ownedCount = keywords.filter(k => k.hrb !== 'none').length;

  const kpiCards = [
    { label: 'Keywords Tracked',  value: keywords.length, icon: 'manage_search', color: I4,       iconColor: I4d    },
    { label: 'You Own',           value: ownedCount,       icon: 'verified',      color: ACCENT,   iconColor: ACCENT },
    { label: 'Gap Opportunities', value: gapCount,         icon: 'arrow_upward',  color: '#059669',iconColor: '#059669' },
    { label: 'Avg Difficulty',    value: '53',             icon: 'speed',         color: '#d97706',iconColor: '#d97706' },
  ];

  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── 1. KPI Cards — G4 Prism ───────────────────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Keyword Intelligence</p>
          <div className="grid grid-cols-4 gap-4">
            {kpiCards.map(k => (
              <div key={k.label} style={{ ...G4, padding: 24 }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: 0 }}>{k.label}</p>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: k.iconColor }}>{k.icon}</span>
                </div>
                <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: k.color, margin: 0, lineHeight: 1 }}>{k.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. Main Grid: Keyword Matrix + Right Column ───────────────────── */}
        <section className="grid grid-cols-12 gap-6">

          {/* Keyword Matrix — G1 Clear Ice */}
          <div className="col-span-8" style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-5 pb-3 flex items-end justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Search Coverage</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Keyword Matrix</h2>
              </div>
              <div className="flex items-center gap-4">
                {[{ color: 'blue' as DotColor, label: 'You' }, { color: 'green' as DotColor, label: 'Competitor' }, { color: 'yellow' as DotColor, label: 'Partial' }, { color: 'none' as DotColor, label: 'Missing' }].map(d => (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <DOT color={d.color} />
                    <span style={{ fontSize: 10, color: I1d }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderTop: `1px solid ${L1}` }}>
                  {['Keyword', 'Vol/mo', 'Diff', 'You', 'Rev', 'Mon', 'Wise', 'Action'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 ${i === 1 || i === 2 ? 'text-right' : i > 2 && i < 7 ? 'text-center' : i === 7 ? 'text-right' : ''}`}
                      style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: i === 3 ? ACCENT : I1d }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keywords.map(r => (
                  <tr key={r.kw} style={{ borderTop: `1px solid ${L1}`, borderLeft: r.gap && r.hrb === 'none' ? '3px solid rgba(5,150,105,0.40)' : '3px solid transparent' }}
                    className="hover:bg-black/[0.02] transition-colors group">
                    <td className="px-4 py-3" style={{ fontSize: 12, fontWeight: 500, color: I1 }}>{r.kw}</td>
                    <td className="px-4 py-3 text-right" style={{ fontSize: 12, color: I1c }}>{r.vol}</td>
                    <td className="px-4 py-3 text-right">
                      <span style={{ fontSize: 12, fontWeight: 600, color: r.diff < 40 ? '#059669' : r.diff < 70 ? '#d97706' : '#e11d48' }}>{r.diff}</span>
                    </td>
                    <td className="px-4 py-3 text-center"><DOT color={r.hrb as DotColor} /></td>
                    <td className="px-4 py-3 text-center"><DOT color={r.rev as DotColor} /></td>
                    <td className="px-4 py-3 text-center"><DOT color={r.mon as DotColor} /></td>
                    <td className="px-4 py-3 text-center"><DOT color={r.wis as DotColor} /></td>
                    <td className="px-4 py-3 text-right">
                      {r.gap && r.hrb === 'none' && (
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                          style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                          Target
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div className="col-span-4 flex flex-col gap-5">

            {/* Trending This Week — G3 Obsidian */}
            <div style={{ ...G3, overflow: 'hidden' }}>
              <div className="px-5 pt-5 pb-3">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I3d, margin: '0 0 4px' }}>Search trends</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5fb', letterSpacing: '-0.02em', margin: 0 }}>Trending This Week</h2>
              </div>
              {trending.map((t) => (
                <div key={t.kw} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
                  style={{ borderTop: '1px solid rgba(241,245,251,0.07)' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5fb', margin: '0 0 2px' }}>{t.kw}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: t.up ? '#34d399' : '#f87171', margin: 0 }}>{t.change} searches</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', padding: '3px 10px', borderRadius: 999,
                    background: t.up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                    color: t.up ? '#34d399' : '#f87171' }}>{t.badge}</span>
                </div>
              ))}
            </div>

            {/* Kai's Recommendation — G2 Azure Tint */}
            <div style={{ ...G2, padding: 22 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: ACCENT }}>insights</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: I2 }}>Kai&apos;s Recommendation</span>
              </div>
              <p style={{ fontSize: 13, color: I2d, lineHeight: 1.65, margin: '0 0 14px' }}>
                You currently rank for <strong style={{ color: I2 }}>0 non-branded keywords</strong> in top 100 results.
                Start with low-difficulty long-tail terms like{' '}
                <em style={{ color: '#5ba8ff' }}>&quot;hourly savings tracker&quot;</em> to build domain authority.
              </p>
              <button className="flex items-center gap-1 active:scale-95"
                style={{ fontSize: 12, fontWeight: 700, color: '#5ba8ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Build keyword plan
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
              </button>
            </div>

            {/* Quick Actions — G1 Clear Ice */}
            <div style={{ ...G1, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: I1, margin: '0 0 12px' }}>Quick Actions</p>
              <div className="flex flex-col gap-1">
                {[
                  { label: 'Export keyword gaps CSV',       icon: 'download'    },
                  { label: 'Add keyword to tracking',       icon: 'add_circle'  },
                  { label: 'Create content brief from gap', icon: 'description' },
                ].map(a => (
                  <button key={a.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-black/[0.04] transition-colors active:scale-95"
                    style={{ fontSize: 12, color: I1c, background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: I1d }}>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── 3. Priority Keyword Gaps — G1 Clear Ice ───────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 4px' }}>Opportunity</p>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Priority Keyword Gaps</h2>
            </div>
            <span style={{ fontSize: 11, color: I1d }}>High-opportunity terms competitors own — you don&apos;t</span>
          </div>
          <div style={{ ...G1, overflow: 'hidden' }}>
            {priorityGaps.map((r, idx) => (
              <div key={r.kw} className="flex items-center justify-between px-6 py-4 hover:bg-black/[0.03] transition-colors group"
                style={{ borderTop: idx > 0 ? `1px solid ${L1}` : 'none' }}>
                <div className="flex items-center gap-5">
                  <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 16, fontWeight: 700, color: ACCENT, width: 36, textAlign: 'center', flexShrink: 0 }}>{r.score}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: I1, margin: '0 0 2px' }}>{r.kw}</p>
                    <p style={{ fontSize: 12, color: I1d, margin: 0 }}>{r.why}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span style={{ fontSize: 11, color: I1d }}>{r.vol}/mo · {r.platform}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                    style={{ background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                    Create Brief
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. HASHTAG INTELLIGENCE ───────────────────────────────────────── */}
        <section className="space-y-6">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 4px' }}>Discovery Layer</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Hashtag Intelligence</h2>
            <p style={{ fontSize: 13, color: I1d, margin: '4px 0 0' }}>Platform-specific hashtag recommendations to maximize discovery and reach</p>
          </div>

          {/* Instagram Hashtags */}
          <div style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-5 pb-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#E1306C' }}>photo_camera</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: I1, margin: 0 }}>Instagram Hashtags</h3>
              <span style={{ fontSize: 11, color: I1d, marginLeft: 'auto' }}>Ranked by eng rate · low competition = opportunity</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderTop: `1px solid ${L1}` }}>
                  {['Hashtag', 'Eng Rate', 'Volume', 'Competition', 'Our Rec'].map(h => (
                    <th key={h} className="px-5 py-3" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {igHashtags.map(r => (
                  <tr key={r.tag} style={{ borderTop: `1px solid ${L1}`, background: r.rec ? `${ACCENT}04` : 'transparent' }}
                    className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <span style={{ fontSize: 13, fontWeight: 600, color: r.rec ? ACCENT : I1 }}>{r.tag}</span>
                    </td>
                    <td className="px-5 py-3" style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{r.engRate}</td>
                    <td className="px-5 py-3" style={{ fontSize: 12, color: I1c }}>{r.volume}</td>
                    <td className="px-5 py-3">
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                        background: r.competition === 'Low' ? 'rgba(5,150,105,0.10)' : r.competition === 'Medium' ? 'rgba(217,119,6,0.10)' : r.competition === 'None' ? `${ACCENT}12` : 'rgba(239,68,68,0.10)',
                        color: r.competition === 'Low' ? '#059669' : r.competition === 'Medium' ? '#d97706' : r.competition === 'None' ? ACCENT : '#ef4444',
                      }}>{r.competition}</span>
                    </td>
                    <td className="px-5 py-3">
                      {r.rec && <span className="material-symbols-outlined text-[16px] text-[#059669]">check_circle</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${L1}`, background: `${ACCENT}04` }}>
              <span className="material-symbols-outlined text-[14px]" style={{ color: ACCENT }}>lightbulb</span>
              <p style={{ fontSize: 12, color: I1c, margin: 0 }}>
                <strong style={{ color: I1 }}>Kai recommends:</strong> Use 3–5 niche tags + 2–3 medium tags per post. Avoid high-competition tags until you have 10K+ followers.
              </p>
            </div>
          </div>

          {/* TikTok Hashtags */}
          <div style={{ ...G3, overflow: 'hidden' }}>
            <div className="px-6 pt-5 pb-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#00f2ea' }}>music_note</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5fb', margin: 0 }}>TikTok Hashtags</h3>
              <span style={{ fontSize: 11, color: I3d, marginLeft: 'auto' }}>Trending this week + evergreen niche tags</span>
            </div>
            <div className="px-6 pb-5 grid grid-cols-3 gap-3">
              {ttHashtags.map(t => (
                <div key={t.tag} style={{ background: 'rgba(241,245,251,0.05)', border: '1px solid rgba(241,245,251,0.09)', borderRadius: 12, padding: '12px 14px' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em',
                      color: t.type === 'Trending' ? '#34d399' : t.type === 'Niche' ? '#5ba8ff' : I3d }}>
                      {t.type}
                    </span>
                    {t.trending && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5fb', margin: '0 0 4px' }}>{t.tag}</p>
                  <p style={{ fontSize: 11, color: I3d, margin: 0 }}>{t.views} views</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(241,245,251,0.07)' }}>
              <span className="material-symbols-outlined text-[14px]" style={{ color: '#5ba8ff' }}>lightbulb</span>
              <p style={{ fontSize: 12, color: I3c, margin: 0 }}>
                <strong style={{ color: '#f1f5fb' }}>Kai recommends:</strong> Lead with 1 trending tag + 2 evergreen niche tags. TikTok FYP algorithm weights relevance over volume — niche tags outperform broad ones for new accounts.
              </p>
            </div>
          </div>

          {/* LinkedIn + YouTube Hashtags — 2 col */}
          <div className="grid grid-cols-2 gap-6">

            {/* LinkedIn */}
            <div style={{ ...G1, overflow: 'hidden' }}>
              <div className="px-6 pt-5 pb-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#0A66C2' }}>work</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: I1, margin: 0 }}>LinkedIn Hashtags</h3>
              </div>
              <div style={{ borderTop: `1px solid ${L1}` }}>
                {liHashtags.map((t, idx) => (
                  <div key={t.tag} className="flex items-center justify-between px-6 py-3 hover:bg-black/[0.02] transition-colors"
                    style={{ borderTop: idx > 0 ? `1px solid ${L1}` : 'none' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{t.tag}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ fontSize: 10, color: I1d }}>{t.posts} posts</span>
                        <span style={{ fontSize: 10, color: I1d }}>·</span>
                        <span style={{ fontSize: 10, color: I1d }}>{t.intent} intent</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                      background: t.reach === 'Low' ? 'rgba(5,150,105,0.10)' : t.reach === 'Medium' ? `${ACCENT}10` : 'rgba(217,119,6,0.10)',
                      color: t.reach === 'Low' ? '#059669' : t.reach === 'Medium' ? ACCENT : '#d97706',
                    }}>{t.reach}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3" style={{ borderTop: `1px solid ${L1}`, background: `${ACCENT}04` }}>
                <p style={{ fontSize: 11, color: I1c, margin: 0 }}>LinkedIn: lower volume = higher intent. Purchase-intent tags worth targeting even at low volume.</p>
              </div>
            </div>

            {/* YouTube */}
            <div style={{ ...G2, overflow: 'hidden' }}>
              <div className="px-6 pt-5 pb-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#FF0000' }}>play_circle</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: I2, margin: 0 }}>YouTube Tags & Search Terms</h3>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                {ytTags.map((t, idx) => (
                  <div key={t.tag} className="flex items-center justify-between px-6 py-3"
                    style={{ borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: I2 }}>{t.tag}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ fontSize: 10, color: I2d }}>{t.type}</span>
                        {t.volume !== '—' && <>
                          <span style={{ fontSize: 10, color: I2d }}>·</span>
                          <span style={{ fontSize: 10, color: I2d }}>{t.volume}</span>
                        </>}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                      background: t.diff === 'Low' ? 'rgba(52,211,153,0.15)' : t.diff === 'Medium' ? 'rgba(255,255,255,0.12)' : 'rgba(248,113,113,0.15)',
                      color: t.diff === 'Low' ? '#34d399' : t.diff === 'Medium' ? I2d : '#f87171',
                    }}>{t.diff}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                <p style={{ fontSize: 11, color: I2d, margin: 0 }}>YouTube: search terms matter more than hashtags. Title and description optimization drives 80% of discovery.</p>
              </div>
            </div>
          </div>
        </section>

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
  );
}
