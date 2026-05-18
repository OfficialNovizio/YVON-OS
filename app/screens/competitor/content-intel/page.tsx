'use client';

import { useRouter } from 'next/navigation';
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

// ── Data ────────────────────────────────────────────────────────────────────────
const signals = [
  { id: 1, severity: 'red',   text: 'KAI · Monzo launched new savings campaign on IG — engagement velocity 3× their 30-day average.',          cta: 'Review Metric'  },
  { id: 2, severity: 'amber', text: 'KAI · Revolut pausing paid search for "crypto" — sudden drop in ad impressions detected.',                  cta: 'Explore Action' },
  { id: 3, severity: 'green', text: 'KAI · Zara shifting to TikTok Shorts — long-form YouTube output declining. Opportunity opening.',            cta: 'Analyze Trend'  },
];

// Zone 1 — Our Position KPIs
const kpis: { label: string; icon: string; value: string; unit: string; delta: string; up: boolean | null; bar?: number }[] = [
  { label: 'Share of Voice',  icon: 'record_voice_over', value: '18.4', unit: '%',    delta: '+2.1% MoM',    up: true,  bar: 18.4 },
  { label: 'Sentiment',       icon: 'mood',              value: '72',   unit: '/100', delta: 'Stable trend', up: null,  bar: 72   },
  { label: 'Velocity',        icon: 'bolt',              value: '12',   unit: '/wk',  delta: '+4 vs last mo', up: true              },
  { label: 'Avg Engagement',  icon: 'favorite',          value: '4.2',  unit: '%',    delta: '+0.8% MoM',    up: true              },
];

// Market Position Table (was "Top Competitors" / "Competitive Landscape")
const marketPosition = [
  { name: 'Zara',           sov: '32%',  sent: '68/100', mom: '+4.2%', up: true  as boolean | null },
  { name: 'Monzo',          sov: '28%',  sent: '75/100', mom: '+2.1%', up: true  as boolean | null },
  { name: 'Revolut',        sov: '22%',  sent: '60/100', mom: '−1.0%', up: false as boolean | null },
  { name: 'Hourbour (You)', sov: '18%',  sent: '72/100', mom: '+0.5%', up: null  as boolean | null, you: true },
];

// Zone 2 — Competitor Activity
const contentSignals = [
  { badge: 'SPIKE', urgent: true,  time: '10m ago', title: 'Monzo launches new savings campaign on IG',    desc: 'Engagement velocity is 3× their 30-day average.' },
  { badge: 'WATCH', urgent: false, time: '1h ago',  title: 'Revolut pausing paid search for "crypto"',    desc: 'Detected a sudden drop in ad impressions.' },
  { badge: 'TREND', urgent: false, time: '3h ago',  title: '"Sustainable investing" sentiment rising',     desc: 'Across top 5 competitors, mentions up 15%.' },
  { badge: 'SHIFT', urgent: true,  time: '5h ago',  title: 'Zara shifting focus to TikTok Shorts',        desc: 'Decrease in long-form YouTube output detected.' },
];

const momentum = [
  { brand: 'Zara',           up: true  as boolean | null, trend: 'High',   theme: 'Lifestyle Integration', impact: 'Significant', you: false },
  { brand: 'Monzo',          up: true  as boolean | null, trend: 'High',   theme: 'Micro-Savings',         impact: 'Moderate',   you: false },
  { brand: 'Revolut',        up: null  as boolean | null, trend: 'Stable', theme: 'Travel Perks',          impact: 'Low',        you: false },
  { brand: 'Hourbour (You)', up: null  as boolean | null, trend: 'Stable', theme: 'Security',              impact: '—',          you: true  },
];

const stratCards = [
  { icon: 'speed',     label: 'Market Velocity', value: 'High',      desc: 'Content production across top 5 is accelerating.',      accent: true  },
  { icon: 'warning',   label: 'Emerging Threat', value: 'Acme Corp', desc: 'Aggressive push in Gen-Z focused financial literacy.',   accent: false },
  { icon: 'lightbulb', label: 'Top Opportunity', value: 'Video ROI', desc: 'Short-form educational video shows lowest saturation.', accent: true  },
];

const topicRows = [
  { rank: '#1', theme: 'Founder-led Stories',  by: 'Monzo',    platform: 'TikTok, LinkedIn', format: 'Short Video', eq: 'Exceptional', eqUp: true  as boolean | null },
  { rank: '#2', theme: 'Money Anxiety',         by: 'Zara',     platform: 'Instagram',        format: 'Carousel',    eq: 'High',        eqUp: true  as boolean | null },
  { rank: '#3', theme: 'Technical Explainers',  by: 'Revolut',  platform: 'YouTube',          format: 'Long Video',  eq: 'Moderate',    eqUp: null  as boolean | null },
  { rank: '#4', theme: 'Transparency',          by: 'Hourbour', platform: 'LinkedIn',         format: 'Text Post',   eq: 'Moderate',    eqUp: null  as boolean | null },
];

const platforms = [
  { icon: 'photo_camera', label: 'Instagram', rows: [['Dominant Brand','Zara'],['Winning Format','Reels'],['Engagement Trend','Rising'],['Unclaimed Space','Edu. Carousels']],   trendUp: true,  rec: 'Zara dominates Reels. Monzo winning educational carousels — unclaimed in this niche.' },
  { icon: 'music_note',   label: 'TikTok',    rows: [['Dominant Brand','Monzo'],['Winning Format','Trend/Audio'],['Engagement Trend','Peaking'],['Unclaimed Space','Founder Vlogs']],  trendUp: true,  rec: 'Monzo owns founder-led. Competitor gap: authentic product storytelling.' },
  { icon: 'work',         label: 'LinkedIn',  rows: [['Dominant Brand','Revolut'],['Winning Format','Data Reports'],['Engagement Trend','Stable'],['Unclaimed Space','Behind-scenes']], trendUp: null,  rec: 'Revolut leads data-driven posts. Culture/workflow content is underserved.' },
  { icon: 'play_circle',  label: 'YouTube',   rows: [['Dominant Brand','Revolut'],['Winning Format','Shorts'],['Engagement Trend','Declining'],['Unclaimed Space','Deep Explainers']], trendUp: false, rec: 'YouTube declining overall. Long-form explainers still show 2× engagement for technical content.' },
];

const topPosts = [
  {
    rank: '#1', brand: 'Monzo', platform: 'TikTok',    format: 'Short Video',
    title: '"We tried the envelope saving method so you don\'t have to"',
    why: 'High relatability, clear actionable hook, fast-paced editing.',
    postUrl: 'https://tiktok.com/@monzo',
    platformIcon: 'music_note',
    triggerForResponse: 'Monzo\'s envelope saving method — viral on TikTok, 2.4M views',
    metrics: {
      views:        { value: '2.4M',  available: true  },
      likes:        { value: '184K',  available: true  },
      comments:     { value: '3.2K',  available: true  },
      shares:       { value: '41K',   available: true  },
      watchTime:    { value: '—',     available: false },  // internal-only
      interactions: { value: '228K',  available: true  },
    },
  },
  {
    rank: '#2', brand: 'Zara',  platform: 'Instagram', format: 'Carousel',
    title: '"5 signs you\'re experiencing financial burnout"',
    why: 'Taps into current zeitgeist, highly shareable aesthetic.',
    postUrl: 'https://instagram.com/zara',
    platformIcon: 'photo_camera',
    triggerForResponse: 'Zara\'s financial burnout carousel — aesthetic-first emotional framing',
    metrics: {
      views:        { value: '890K',  available: true  },
      likes:        { value: '62K',   available: true  },
      comments:     { value: '1.4K',  available: true  },
      shares:       { value: '—',     available: false },  // hidden on IG
      watchTime:    { value: '—',     available: false },  // carousel — N/A
      interactions: { value: '63K',   available: true  },  // likes + comments
    },
  },
];

// Competitor Response Playbook (max 3, each with trigger)
const responsePlaybook = [
  {
    n: 1, accent: true,
    title: 'Counter Monzo\'s Micro-Savings campaign',
    desc: 'Monzo launched "Micro-Goals" — small automated transfers. Respond with a human-first savings story, not a feature comparison.',
    trigger: 'Monzo\'s "Family Accounts" launch (+$40K/day spend)',
  },
  {
    n: 2, accent: false,
    title: 'Own the transparency gap Revolut left',
    desc: 'Revolut paused paid search and sentiment dropped. Publish Hourbour\'s security and transparency framework while the spotlight is open.',
    trigger: 'Revolut sentiment drop following crypto fee disclosure',
  },
  {
    n: 3, accent: false,
    title: 'Capture Zara\'s TikTok audience shift',
    desc: 'Zara is pulling back from long-form YouTube. Repurpose top-performing blog content into TikTok Shorts to capture the migrating audience.',
    trigger: 'Zara reducing YouTube output — TikTok Shorts pivot detected',
  },
];

// ── Page ────────────────────────────────────────────────────────────────────────
export default function CompetitorContentIntelPage() {
  const router = useRouter();

  function handleSave(post: typeof topPosts[0]) {
    // Save to Supabase saved_competitor_posts table
    fetch('/api/saved-competitor-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: post.brand,
        platform: post.platform,
        format: post.format,
        title: post.title,
        why: post.why,
        postUrl: post.postUrl,
      }),
    }).catch(() => {}); // silent fail — optimistic UI
  }

  function handleBrief(post: typeof topPosts[0]) {
    // Route to War Room — agent depends on venture type
    // Fashion → Atlas; Fintech → Lena
    const agent = 'Lena'; // Hourbour is fintech
    const query = `Brief ${agent} based on this competitor post: "${post.title}" — Why it worked: ${post.why}. Create a response content brief for Hourbour.`;
    router.push(`/screens/war-room?q=${encodeURIComponent(query)}`);
  }

  function handleRespond(post: typeof topPosts[0]) {
    const query = `Create a response strategy to ${post.brand}'s post about "${post.title}" — how should Hourbour respond or differentiate? Trigger: ${post.triggerForResponse}`;
    router.push(`/screens/war-room?q=${encodeURIComponent(query)}`);
  }

  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── ZONE 1: OUR POSITION ──────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#0066cc]" />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: 0 }}>Zone 1 — Our Position in the Market</p>
          </div>

          {/* KPI Cards — G4 Prism */}
          <div className="grid grid-cols-4 gap-4">
            {kpis.map(k => (
              <div key={k.label} style={{ ...G4, padding: 24 }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: 0 }}>{k.label}</p>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: I4d }}>{k.icon}</span>
                </div>
                <p style={{ fontFamily: 'ui-monospace,"Geist Mono",monospace', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: I4, margin: '0 0 8px', lineHeight: 1 }}>
                  {k.value}<span style={{ fontSize: 16, fontWeight: 500, color: I4d }}>{k.unit}</span>
                </p>
                {k.bar !== undefined ? (
                  <div style={{ height: 3, background: L1, borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${k.bar}%`, background: ACCENT, borderRadius: 999 }} />
                  </div>
                ) : null}
                <div className={`flex items-center gap-1 text-[11px] font-bold ${k.up === true ? 'text-emerald-600' : k.up === false ? 'text-rose-500' : ''}`}
                  style={k.up === null ? { color: I4d } : {}}>
                  <span className="material-symbols-outlined text-[13px]">
                    {k.up === true ? 'trending_up' : k.up === false ? 'trending_down' : 'horizontal_rule'}
                  </span>
                  {k.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Market Position Table — G1 Clear Ice (moved to top hero area) */}
          <div style={{ ...G1, overflow: 'hidden' }}>
            <div className="px-6 pt-5 pb-3 flex items-center justify-between">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Market Position</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Market Position Table</h2>
              </div>
              <span style={{ fontSize: 11, color: I1d }}>Share of Voice · Sentiment · Momentum</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderTop: `1px solid ${L1}` }}>
                  {['Brand', 'Share of Voice', 'Sentiment', 'Momentum'].map(h => (
                    <th key={h} className="px-6 py-3" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {marketPosition.map(c => (
                  <tr key={c.name} style={{ borderTop: `1px solid ${L1}`, background: c.you ? `${ACCENT}08` : 'transparent' }}>
                    <td className="px-6 py-4" style={{ fontSize: 13, fontWeight: c.you ? 700 : 500, color: c.you ? ACCENT : I1 }}>{c.name}</td>
                    <td className="px-6 py-4" style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: I1c }}>{c.sov}</td>
                    <td className="px-6 py-4" style={{ fontSize: 13, color: I1c }}>{c.sent}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[13px] font-bold ${c.up === true ? 'text-emerald-600' : c.up === false ? 'text-rose-500' : ''}`}
                        style={c.up === null ? { color: I1d } : {}}>
                        {c.mom}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── ZONE 2: COMPETITOR ACTIVITY ───────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: 0 }}>Zone 2 — Competitor Activity</p>
          </div>

          {/* Signal Strip — G3 Obsidian */}
          <section style={{ ...G3, overflow: 'hidden' }}>
            {signals.map((s, idx) => {
              const dotCls    = s.severity === 'red' ? 'bg-red-400'       : s.severity === 'green' ? 'bg-emerald-400' : 'bg-amber-400';
              const textCls   = s.severity === 'red' ? 'text-red-400'     : s.severity === 'green' ? 'text-emerald-400' : 'text-amber-400';
              const borderCls = s.severity === 'red' ? 'border-red-400/20 bg-red-400/5' : s.severity === 'green' ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-amber-400/20 bg-amber-400/5';
              return (
                <div key={s.id} className="flex items-center justify-between px-6 py-4 gap-6"
                  style={{ borderTop: idx > 0 ? '1px solid rgba(241,245,251,0.07)' : 'none' }}>
                  <div className="flex items-center gap-4">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
                    <p style={{ fontSize: 13, lineHeight: 1.55, color: I3c, margin: 0 }}>{s.text}</p>
                  </div>
                  <button className={`flex-shrink-0 border rounded-full px-4 py-1.5 transition-all hover:opacity-80 active:scale-95 ${textCls} ${borderCls}`}
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {s.cta}
                  </button>
                </div>
              );
            })}
          </section>

          {/* Live Signals + Momentum Grid */}
          <section className="grid grid-cols-12 gap-6">

            {/* Live Content Signals — G3 Obsidian */}
            <div className="col-span-4" style={{ ...G3, overflow: 'hidden' }}>
              <div className="px-5 pt-5 pb-3">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I3d, margin: '0 0 4px' }}>Real-time</p>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5fb', letterSpacing: '-0.02em', margin: 0 }}>Live Content Signals</h2>
              </div>
              {contentSignals.map((s) => (
                <div key={s.title} className="px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ borderTop: '1px solid rgba(241,245,251,0.07)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: s.urgent ? `${ACCENT}22` : 'rgba(241,245,251,0.08)', color: s.urgent ? '#5ba8ff' : I3d }}>
                      {s.badge}
                    </span>
                    <span style={{ fontSize: 11, color: I3d }}>{s.time}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5fb', margin: '0 0 3px', lineHeight: 1.4 }}>{s.title}</p>
                  <p style={{ fontSize: 12, color: I3c, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Right column: Momentum Table + Strategy Cards */}
            <div className="col-span-8 flex flex-col gap-6">

              {/* Competitive Momentum — G1 Clear Ice */}
              <div style={{ ...G1, overflow: 'hidden' }}>
                <div className="px-6 pt-5 pb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: '0 0 4px' }}>Analysis</p>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Competitive Momentum</h2>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderTop: `1px solid ${L1}` }}>
                      {['Brand', 'Trend', 'Top Theme', 'Impact'].map(h => (
                        <th key={h} className="px-5 py-3" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {momentum.map(r => (
                      <tr key={r.brand} style={{ borderTop: `1px solid ${L1}`, background: r.you ? `${ACCENT}08` : 'transparent' }}
                        className="hover:bg-black/[0.03] transition-colors">
                        <td className="px-5 py-3.5" style={{ fontSize: 13, fontWeight: r.you ? 700 : 500, color: r.you ? ACCENT : I1 }}>{r.brand}</td>
                        <td className="px-5 py-3.5">
                          <div className={`flex items-center gap-1 text-[12px] font-bold ${r.up === true ? 'text-emerald-600' : r.up === false ? 'text-rose-500' : ''}`}
                            style={r.up === null ? { color: I1d } : {}}>
                            <span className="material-symbols-outlined text-[14px]">
                              {r.up === true ? 'trending_up' : r.up === false ? 'trending_down' : 'trending_flat'}
                            </span>
                            {r.trend}
                          </div>
                        </td>
                        <td className="px-5 py-3.5" style={{ fontSize: 13, color: I1c }}>{r.theme}</td>
                        <td className="px-5 py-3.5" style={{ fontSize: 13, color: I1d }}>{r.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Strategic Market Cards — G4 Prism */}
              <div className="grid grid-cols-3 gap-4">
                {stratCards.map(c => (
                  <div key={c.label} style={{ ...G4, padding: 20 }}>
                    <span className="material-symbols-outlined mb-3" style={{ fontSize: 22, color: c.accent ? ACCENT : I4d, display: 'block' }}>{c.icon}</span>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: I4d, margin: '0 0 6px' }}>{c.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: I4, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{c.value}</p>
                    <p style={{ fontSize: 11, color: I4d, lineHeight: 1.5, margin: 0 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Winning Content Themes — G1 Clear Ice */}
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Content Themes</p>
            <div style={{ ...G1, overflow: 'hidden' }}>
              <div className="px-6 pt-5 pb-3">
                <h2 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Winning Content Themes</h2>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderTop: `1px solid ${L1}` }}>
                    {['Rank','Theme','Owned By','Platform','Format','Engagement Quality'].map(h => (
                      <th key={h} className="px-5 py-3" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topicRows.map(r => (
                    <tr key={r.rank} style={{ borderTop: `1px solid ${L1}` }} className="hover:bg-black/[0.02] transition-colors">
                      <td className="px-5 py-3.5" style={{ fontSize: 12, color: I1d, fontFamily: 'ui-monospace,monospace' }}>{r.rank}</td>
                      <td className="px-5 py-3.5" style={{ fontSize: 13, fontWeight: 600, color: I1 }}>{r.theme}</td>
                      <td className="px-5 py-3.5" style={{ fontSize: 12, color: I1c }}>{r.by}</td>
                      <td className="px-5 py-3.5" style={{ fontSize: 12, color: I1c }}>{r.platform}</td>
                      <td className="px-5 py-3.5" style={{ fontSize: 12, color: I1c }}>{r.format}</td>
                      <td className="px-5 py-3.5" style={{ fontSize: 12, fontWeight: 700, color: r.eqUp === true ? ACCENT : I1c }}>{r.eq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Platform Intelligence — competitor-only scope — G3 Obsidian */}
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Competitor Platform Behaviour</p>
            <div className="grid grid-cols-4 gap-4">
              {platforms.map(p => (
                <div key={p.label} style={{ ...G3, padding: 20 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: ACCENT }}>{p.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5fb' }}>{p.label}</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {p.rows.map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span style={{ fontSize: 11, color: I3d }}>{key}:</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: key === 'Engagement Trend' ? (p.trendUp === true ? '#34d399' : p.trendUp === false ? '#f87171' : I3c) : '#f1f5fb' }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(241,245,251,0.08)', paddingTop: 10, marginTop: 4, fontSize: 11, color: '#5ba8ff', lineHeight: 1.5 }}>
                      {p.rec}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Performing Posts — with thumbnail slots + wired buttons */}
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Top Performing Posts</p>
            <div className="flex flex-col gap-4">
              {topPosts.map(p => (
                <div key={p.rank} style={{ ...G1, padding: 24 }} className="flex items-start gap-5">
                  {/* Thumbnail placeholder */}
                  <div className="w-[72px] h-[72px] rounded-xl flex-shrink-0 flex flex-col items-center justify-center gap-1"
                    style={{ background: 'rgba(0,102,204,0.08)', border: '1px dashed rgba(0,102,204,0.20)' }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: 'rgba(0,102,204,0.40)' }}>{p.platformIcon}</span>
                    <span style={{ fontSize: 9, color: 'rgba(0,102,204,0.40)', fontWeight: 700 }}>POST</span>
                  </div>

                  <div className="flex items-start justify-between gap-6 flex-1 min-w-0">
                    <div className="flex gap-5 items-start flex-1 min-w-0">
                      <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 14, color: I1d, flexShrink: 0, marginTop: 2 }}>{p.rank}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span style={{ fontSize: 12, fontWeight: 700, color: I1 }}>{p.brand}</span>
                          <span style={{ color: I1d }}>·</span>
                          <span style={{ fontSize: 12, color: I1c }}>{p.platform}</span>
                          <span style={{ color: I1d }}>·</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{p.format}</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: I1, margin: '0 0 4px' }}>{p.title}</p>
                        <p style={{ fontSize: 12, color: I1c, margin: '0 0 10px', lineHeight: 1.5 }}>{p.why}</p>

                        {/* Metrics strip */}
                        <div style={{ marginBottom: 10 }}>
                          <div className="flex items-center gap-1 flex-wrap mb-1.5">
                            {[
                              { icon: 'visibility',    label: 'Views',        m: p.metrics.views        },
                              { icon: 'favorite',      label: 'Likes',        m: p.metrics.likes        },
                              { icon: 'chat_bubble',   label: 'Comments',     m: p.metrics.comments     },
                              { icon: 'share',         label: 'Shares',       m: p.metrics.shares       },
                              { icon: 'timer',         label: 'Watch Time',   m: p.metrics.watchTime    },
                              { icon: 'ads_click',     label: 'Interactions', m: p.metrics.interactions },
                            ].map(({ icon, label, m }) => (
                              <div key={label}
                                style={{
                                  background: m.available ? L1 : 'rgba(12,44,82,0.04)',
                                  borderRadius: 8, padding: '5px 10px',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 64,
                                  opacity: m.available ? 1 : 0.45,
                                }}>
                                <div className="flex items-center gap-1">
                                  <span className="material-symbols-outlined" style={{ fontSize: 11, color: I1d }}>{icon}</span>
                                  <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 700, color: m.available ? I1 : I1d }}>{m.value}</span>
                                </div>
                                <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: I1d }}>{label}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'rgba(16,185,129,0.70)', background: 'rgba(16,185,129,0.08)', padding: '2px 7px', borderRadius: 999 }}>via Apify</span>
                            <span style={{ fontSize: 10, color: I1d }}>· faded metrics not publicly available on {p.platform}</span>
                          </div>
                        </div>

                        <a href={p.postUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                          style={{ fontSize: 11, color: ACCENT }}>
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          View on {p.platform}
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleSave(p)}
                        style={{ background: L1, color: I1c, fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                        className="hover:bg-black/10 active:scale-95 transition-all">
                        Save
                      </button>
                      <button
                        onClick={() => handleBrief(p)}
                        style={{ background: `${ACCENT}15`, color: ACCENT, fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                        className="hover:bg-[#0066cc]/25 active:scale-95 transition-all">
                        Brief
                      </button>
                      <button
                        onClick={() => handleRespond(p)}
                        style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                        className="hover:bg-[#0055bb] active:scale-95 transition-all">
                        Respond
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Competitor Response Playbook (was "Next Best Moves") */}
          <section>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Competitor Response Playbook</p>
            <div style={{ ...G1, overflow: 'hidden' }}>
              {responsePlaybook.map((m, idx) => (
                <div key={m.n} className="flex items-start justify-between px-6 py-5 hover:bg-black/[0.03] transition-colors"
                  style={{ borderTop: idx > 0 ? `1px solid ${L1}` : 'none' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: m.accent ? `${ACCENT}18` : L1, color: m.accent ? ACCENT : I1d }}>
                      {m.n}
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontSize: 14, fontWeight: 600, color: I1, margin: '0 0 4px' }}>{m.title}</p>
                      <p style={{ fontSize: 12, color: I1c, margin: '0 0 6px' }}>{m.desc}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px]" style={{ color: '#d97706' }}>bolt</span>
                        <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>Triggered by:</span>
                        <span style={{ fontSize: 11, color: I1d }}>{m.trigger}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-6">
                    <button
                      onClick={() => router.push(`/screens/war-room?q=${encodeURIComponent(`Create response strategy for: ${m.title}. Context: ${m.trigger}`)}`)}
                      style={{ background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                      className="active:scale-95">
                      Create Brief
                    </button>
                    <button style={{ background: L1, color: I1c, fontSize: 11, fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                      className="active:scale-95">
                      Add to Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

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
