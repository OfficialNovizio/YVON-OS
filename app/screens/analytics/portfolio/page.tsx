'use client';

import { useRouter } from 'next/navigation';
import AnalyticsSubNav from '../_subnav';

// ── Glass Variants ──────────────────────────────────────────────────────────────
// V1: Clear Ice — white frosted, navy text
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1b='#1a3e6e', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', I1e='rgba(12,44,82,0.26)', L1='rgba(12,44,82,0.10)';

// V2: Azure Tint — blue gradient, light text
const G2: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(36,99,180,0.42),rgba(20,70,140,0.55))', backdropFilter: 'blur(30px) saturate(190%)', WebkitBackdropFilter: 'blur(30px) saturate(190%)', border: '1px solid rgba(180,210,255,0.40)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.40),inset 0 -1px 0 rgba(0,30,80,0.25),0 18px 50px -10px rgba(10,40,100,0.40)' };
const I2='#f4f8ff', I2b='rgba(244,248,255,0.85)', I2c='rgba(244,248,255,0.68)', I2d='rgba(244,248,255,0.48)', I2e='rgba(244,248,255,0.25)', L2='rgba(255,255,255,0.14)';

// V3: Obsidian — dark smoke, light text
const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3='#f1f5fb', I3b='#ccd6eb', I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)', I3e='rgba(241,245,251,0.22)', L3='rgba(255,255,255,0.10)';

// V4: Prism — iridescent pink+cyan, plum text
const G4: React.CSSProperties = { background: "radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))", backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4='#2a1240', I4b='#4a2060', I4c='rgba(42,18,64,0.68)', I4d='rgba(42,18,64,0.48)', L4='rgba(42,18,64,0.10)';
const ACCENT = '#0066cc';
const GREEN  = '#059669';

export default function AnalyticsPortfolioPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen pb-24">
      <AnalyticsSubNav />

      {/* Signal Strip — V3 Obsidian */}
      <div style={{ ...G3, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', padding: '10px 0' }}>
        <div className="max-w-[980px] 2xl:max-w-[min(90vw,1400px)] mx-auto px-4 flex items-center gap-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 rounded-full px-3 py-1 border whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.08)', borderColor: L3 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
            <span className="text-[11px] font-medium" style={{ color: I3c }}>Engagement Spike: Novizio +42%</span>
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1 border whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.08)', borderColor: L3 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
            <span className="text-[11px] font-medium" style={{ color: I3c }}>Hourbour funnel conversion −8pts vs Q3</span>
          </div>
        </div>
      </div>

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* Intelligence Hero — V2 Azure Tint */}
        <section style={{ ...G2, overflow: 'hidden', minHeight: 380, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem' }}>
          <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
            style={{ background: 'radial-gradient(circle at 70% 50%, rgba(0,113,227,0.15), transparent 60%)' }} />
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.05) 50px)' }} />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 h-full">
            <div className="max-w-2xl">
              <h1 className="text-[40px] md:text-[56px] font-semibold leading-[1.07] mb-4"
                style={{ letterSpacing: '-0.02em', color: I2 }}>
                Portfolio Command
              </h1>
              <p className="text-[17px] max-w-lg mb-8 leading-relaxed"
                style={{ letterSpacing: '-0.01em', color: I2c }}>
                Novizio leads the stack. Hourbour funnel needs reinforcement — 8pts below Q3 target.
                Content rebalancing recommended.
              </p>
              <button
                onClick={() => router.push('/screens/war-room?q=Marcus%2C+rebalance+the+portfolio+—+Novizio+is+overloaded+and+Hourbour+has+funnel+gaps.+What+are+the+top+3+reallocation+decisions%3F')}
                className="bg-[#0071e3] text-white px-6 py-2.5 rounded-full text-[14px] font-medium hover:bg-[#005cbb] transition-colors inline-flex items-center gap-2 active:scale-95"
              >
                <span>Rebalance Portfolio</span>
                <span className="material-symbols-outlined text-[16px]">tune</span>
              </button>
            </div>
            <div className="flex flex-row md:flex-col gap-4 self-start md:self-end">
              <div className="rounded-2xl p-4 min-w-[140px]"
                style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${L2}` }}>
                <div className="text-[12px] mb-1" style={{ color: I2d }}>Composite Health</div>
                <div className="text-[32px] font-medium" style={{ letterSpacing: '-0.02em', color: I2 }}>
                  88<span className="text-[16px]" style={{ color: I2d }}>/100</span>
                </div>
              </div>
              <div className="rounded-2xl p-4 min-w-[140px]"
                style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${L2}` }}>
                <div className="text-[12px] mb-1" style={{ color: I2d }}>Risk Index</div>
                <div className="text-[32px] font-medium" style={{ letterSpacing: '-0.02em', color: I2 }}>Low</div>
              </div>
            </div>
          </div>
        </section>

        {/* Metric Row — V1 Clear Ice */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Novizio', value: 94, sub: '+2.4 pts this week', icon: 'trending_up', iconColor: ACCENT, border: false },
            { label: 'Hourbour', value: 82, sub: '−8pts below Q3', icon: 'trending_down', iconColor: '#ffb4ab', border: false },
            { label: 'Industry Avg', value: 78, sub: 'DTC Benchmark', icon: 'bar_chart', iconColor: I1d, border: false },
            { label: 'Q3 Target', value: 90, sub: 'Brand goal', icon: 'flag', iconColor: ACCENT, border: true },
          ].map((m) => (
            <div key={m.label}
              className="rounded-[20px] p-5 transition-colors cursor-pointer relative overflow-hidden"
              style={{ ...G1, padding: 20 }}>
              {m.border && <div className="absolute inset-0 border-2 rounded-[20px] pointer-events-none" style={{ borderColor: 'rgba(0,102,204,0.20)' }} />}
              <div className="flex justify-between items-center mb-6 relative z-10">
                <span className="text-[14px] font-medium" style={{ color: I1c }}>{m.label}</span>
                <span className="material-symbols-outlined text-[16px]" style={{ color: m.iconColor }}>{m.icon}</span>
              </div>
              <div className="text-[28px] font-medium mb-1 relative z-10"
                style={{ letterSpacing: '-0.02em', color: m.border ? (ACCENT) : I1 }}>{m.value}</div>
              <div className="text-[12px] relative z-10" style={{ color: I1d }}>{m.sub}</div>
            </div>
          ))}
        </section>

        {/* Analytical Hub Bento */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Radar Module — V2 Azure Tint */}
          <div style={{ ...G2, padding: 24, display: 'flex', flexDirection: 'column', gridColumn: 'span 1', minHeight: 340 }}>
            <h3 className="text-[16px] font-semibold mb-2" style={{ color: I2 }}>Growth vs Engagement</h3>
            <p className="text-[13px] mb-8" style={{ color: I2d }}>Relative matrix across portfolio</p>
            <div className="flex-1 flex items-center justify-center relative">
              <div className="w-[180px] h-[180px] rounded-full border border-white/10 relative flex items-center justify-center">
                <div className="w-[120px] h-[120px] rounded-full border border-white/10" />
                <div className="w-[60px] h-[60px] rounded-full border border-white/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-white/5" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-px bg-white/5" />
                </div>
                <div className="absolute w-[100px] h-[120px] bg-[#0071e3]/20 border border-[#0071e3]/40 blur-[2px] transform translate-x-4 -translate-y-2"
                  style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }} />
              </div>
            </div>
          </div>

          {/* Performance Stack — V3 Obsidian */}
          <div style={{ ...G3, padding: 24, display: 'flex', flexDirection: 'column', gridColumn: 'span 1', minHeight: 340 }}>
            <h3 className="text-[16px] font-semibold mb-2" style={{ color: I3 }}>Performance Stack</h3>
            <p className="text-[13px] mb-6" style={{ color: I3d }}>Contribution by brand</p>
            <div className="flex-1 flex items-end gap-4 px-4 h-full pt-8">
              <div className="flex-1 flex flex-col justify-end h-full gap-1">
                <div className="w-full rounded-t-sm h-[20%]" style={{ background: L3 }} />
                <div className="w-full bg-[#0071e3]/40 h-[30%]" />
                <div className="w-full bg-[#0071e3] h-[50%] rounded-b-sm" style={{ boxShadow: '0 0 15px rgba(0,113,227,0.3)' }} />
                <div className="text-[11px] text-center mt-2" style={{ color: I3d }}>NOV</div>
              </div>
              <div className="flex-1 flex flex-col justify-end h-full gap-1">
                <div className="w-full rounded-t-sm h-[40%]" style={{ background: L3 }} />
                <div className="w-full h-[30%]" style={{ background: I3e }} />
                <div className="w-full h-[10%] rounded-b-sm" style={{ background: 'rgba(241,245,251,0.35)' }} />
                <div className="text-[11px] text-center mt-2" style={{ color: I3d }}>HRB</div>
              </div>
            </div>
            <div className="mt-6 pt-4 flex items-start gap-3" style={{ borderTop: `1px solid ${L3}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ background: 'rgba(0,102,204,0.20)', border: '1px solid rgba(0,102,204,0.35)', color: '#5ba8ff' }}>
                M
              </div>
              <div>
                <div className="text-[12px] font-medium" style={{ color: I3c }}>Marcus (Strategist)</div>
                <div className="text-[12px] leading-snug mt-0.5" style={{ color: I3d }}>
                  Novizio carrying the stack. Re-allocate content bandwidth to bolster Hourbour mid-funnel.
                </div>
              </div>
            </div>
          </div>

          {/* 8-Week Trend — V2 Azure Tint */}
          <div style={{ ...G2, padding: 24, display: 'flex', flexDirection: 'column', gridColumn: 'span 1', minHeight: 340 }}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[16px] font-semibold" style={{ color: I2 }}>8-Week Trend</h3>
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: 'rgba(244,248,255,0.10)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: I2d }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: I2d }}>DTC Bench</span>
              </div>
            </div>
            <p className="text-[13px] mb-8" style={{ color: I2d }}>Aggregate view vs Industry</p>
            <div className="flex-1 relative w-full mt-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                <div className="w-full border-t border-white/5" />
                <div className="w-full border-t border-white/5" />
                <div className="w-full border-t border-white/5" />
              </div>
              <svg className="w-full h-[120px] overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,80 Q20,75 40,78 T80,70 T100,65" fill="none" stroke="rgba(255,255,255,0.2)" strokeDasharray="4,4" strokeWidth="1.5" />
                <path d="M0,60 Q20,40 40,50 T80,30 T100,20" fill="none" stroke="#0071e3" strokeWidth="2.5" />
                <path d="M0,60 Q20,40 40,50 T80,30 T100,20 L100,100 L0,100 Z" fill="url(#blue-grad)" opacity="0.1" />
                <defs>
                  <linearGradient id="blue-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0071e3" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="20" r="4" fill="#000" stroke="#0071e3" strokeWidth="2" />
              </svg>
              <div className="flex justify-between mt-4 text-[11px]" style={{ color: I2d }}>
                <span>W1</span>
                <span>W4</span>
                <span>W8</span>
              </div>
            </div>
          </div>
        </section>

        {/* Allocation Decisions Pending — V3 Obsidian */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[20px] font-semibold" style={{ letterSpacing: '-0.02em', color: I1 }}>
              Allocation Decisions Pending
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: 'swap_horiz', badge: 'High Impact', badgeBg: 'bg-white/10', badgeText: 'text-white/80',
                title: 'Shift Weekly Content Capacity',
                desc: 'Reallocate 2 posts/wk from Novizio to Hourbour to address funnel gaps.',
                from: 'Novizio', to: 'Hourbour', highlight: true,
                route: '/screens/war-room?q=Approve+decision%3A+shift+2+posts%2Fwk+from+Novizio+to+Hourbour+to+address+mid-funnel+gaps',
              },
              {
                icon: 'payments', badge: 'Medium Impact', badgeBg: 'bg-white/5', badgeText: 'text-white/60',
                title: 'Reallocate Paid Support',
                desc: 'Shift spend from LinkedIn awareness campaigns into TikTok and IG converters.',
                from: 'LinkedIn', to: 'TikTok + IG', highlight: false,
                route: '/screens/war-room?q=Approve+decision%3A+shift+LinkedIn+ad+spend+to+TikTok+%2B+IG+converters',
              },
              {
                icon: 'rule', badge: 'Governance', badgeBg: 'bg-white/5', badgeText: 'text-white/60',
                title: 'Raise Portfolio Threshold',
                desc: 'Establish mandate that all active portfolio brands must maintain health score 70+.',
                from: 'Current: 65', to: 'New: 70+', highlight: false,
                route: '/screens/war-room?q=Approve+governance+decision%3A+raise+minimum+portfolio+health+score+threshold+to+70',
              },
            ].map((a) => (
              <div key={a.title}
                onClick={() => router.push(a.route)}
                className="rounded-[20px] p-6 transition-colors cursor-pointer group"
                style={{
                  ...G3, padding: 24,
                  borderLeft: a.highlight ? '3px solid #0071e3' : '3px solid transparent',
                }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: a.highlight ? 'rgba(0,102,204,0.18)' : 'rgba(255,255,255,0.08)' }}>
                    <span className="material-symbols-outlined text-[16px]"
                      style={{ color: a.highlight ? ACCENT : I3d }}>{a.icon}</span>
                  </div>
                  <span className={`${a.badgeBg} ${a.badgeText} text-[10px] font-medium px-2 py-0.5 rounded-full`}>{a.badge}</span>
                </div>
                <h3 className="text-[15px] font-semibold mb-2 leading-snug group-hover:text-[#0071e3] transition-colors" style={{ color: I3 }}>
                  {a.title}
                </h3>
                <p className="text-[13px] mb-5 leading-relaxed" style={{ color: I3c }}>{a.desc}</p>
                <div className="flex items-center justify-between text-[12px] font-medium rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${L3}`, color: I3c }}>
                  <span style={{ color: I3d }}>{a.from}</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ color: I3d }}>arrow_right_alt</span>
                  <span style={{ color: I3b }}>{a.to}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Channel Contribution by Brand */}
        <section>
          <h2 className="text-[20px] font-semibold mb-6" style={{ letterSpacing: '-0.02em', color: I1 }}>
            Channel Contribution by Brand
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Volume & Mix — V1 Clear Ice */}
            <div style={{ ...G1, padding: '1.5rem 2rem' }}>
              <h3 className="text-[14px] font-semibold mb-6" style={{ color: I1 }}>Volume &amp; Mix</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13px] font-medium" style={{ color: I1 }}>Novizio</span>
                    <span className="text-[12px] font-mono" style={{ color: I1d }}>1.2M Vol</span>
                  </div>
                  <div className="w-full h-8 rounded-full flex overflow-hidden" style={{ border: `1px solid ${L1}` }}>
                    <div className="bg-[#0071e3] w-[45%] h-full flex items-center justify-center">
                      <span className="text-[10px] font-medium text-white/90">IG</span>
                    </div>
                    <div className="w-[25%] h-full flex items-center justify-center" style={{ background: 'rgba(0,113,227,0.7)' }}>
                      <span className="text-[10px] font-medium text-white/90">TT</span>
                    </div>
                    <div className="w-[20%] h-full flex items-center justify-center" style={{ background: 'rgba(0,113,227,0.4)' }}>
                      <span className="text-[10px] font-medium text-white/80">YT</span>
                    </div>
                    <div className="w-[10%] h-full" style={{ background: 'rgba(0,113,227,0.2)' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13px] font-medium" style={{ color: I1 }}>Hourbour</span>
                    <span className="text-[12px] font-mono" style={{ color: I1d }}>480k Vol</span>
                  </div>
                  <div className="w-full h-8 rounded-full flex overflow-hidden" style={{ border: `1px solid ${L1}` }}>
                    <div className="bg-white/40 w-[15%] h-full flex items-center justify-center">
                      <span className="text-[10px] font-medium text-black/60">IG</span>
                    </div>
                    <div className="w-[15%] h-full" style={{ background: 'rgba(0,0,0,0.08)' }} />
                    <div className="w-[10%] h-full" style={{ background: 'rgba(0,0,0,0.05)' }} />
                    <div className="w-[60%] h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
                      <span className="text-[10px] font-medium" style={{ color: I1d }}>LI</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6 pt-6 text-[11px] justify-center" style={{ borderTop: `1px solid ${L1}`, color: I1d }}>
                {[['IG','bg-white/80'],['TT','bg-white/60'],['YT','bg-white/40'],['LI','bg-white/20']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${c}`} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Dimension Contribution — V1 Clear Ice */}
            <div style={{ ...G1, padding: '1.5rem 2rem' }}>
              <h3 className="text-[14px] font-semibold mb-6" style={{ color: I1 }}>Dimension Contribution</h3>
              <div className="w-full text-left">
                <div className="flex text-[11px] uppercase tracking-wider mb-3 pb-2" style={{ color: I1d, borderBottom: `1px solid ${L1}` }}>
                  <div className="w-2/5">Metric</div>
                  <div className="w-[30%] text-center">Novizio</div>
                  <div className="w-[30%] text-center">Hourbour</div>
                </div>
                {[
                  { metric: 'Growth',      nov: { label: 'High', blue: true },  hrb: { label: 'Low',  blue: false } },
                  { metric: 'Engagement',  nov: { label: 'High', blue: true },  hrb: { label: 'Med',  blue: false } },
                  { metric: 'Reach',       nov: { label: 'High', blue: true },  hrb: { label: 'Low',  blue: false } },
                  { metric: 'Conversion',  nov: { label: 'Med',  blue: false }, hrb: { label: 'High', blue: true  } },
                  { metric: 'Consistency', nov: { label: 'High', blue: true },  hrb: { label: 'Med',  blue: false } },
                ].map((row) => (
                  <div key={row.metric}
                    className="flex py-2.5 items-center px-2 -mx-2" style={{ borderBottom: `1px solid ${L1}` }}>
                    <div className="w-2/5 text-[13px]" style={{ color: I1c }}>{row.metric}</div>
                    <div className="w-[30%] text-center">
                      <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${row.nov.blue ? 'bg-[#0066cc]/20 text-[#0066cc]' : 'bg-[#0c2c52]/10 text-[#0c2c52]/65'}`}>
                        {row.nov.label}
                      </span>
                    </div>
                    <div className="w-[30%] text-center">
                      <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${row.hrb.blue ? 'bg-[#0066cc]/20 text-[#0066cc]' : 'bg-[#0c2c52]/10 text-[#0c2c52]/65'}`}>
                        {row.hrb.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Rebalance Plan & Risk Watchlist — V2 / V3 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rebalance Plan — V2 Azure Tint */}
          <div className="lg:col-span-2" style={{ ...G2, padding: '1.5rem 2rem' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[20px]" style={{ color: ACCENT }}>route</span>
              <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.02em', color: I2 }}>Portfolio Rebalance Plan</h2>
            </div>
            <div className="space-y-6 relative" style={{ paddingLeft: 30 }}>
              <div className="absolute left-[5px] top-2 bottom-2 w-px" style={{ background: L2 }} />
              {[
                {
                  n: 1, active: true,
                  title: 'Increase Hourbour transparency',
                  desc: 'Shift editorial focus to behind-the-scenes processes to drive trust and conversion.',
                },
                {
                  n: 2, active: false,
                  title: 'Reduce Novizio showcase',
                  desc: 'Scale back purely aesthetic top-of-funnel posts to free up creative bandwidth.',
                },
                {
                  n: 3, active: false,
                  title: 'Reuse best formats',
                  desc: "Adapt Novizio's top performing IG Reel formats for Hourbour's product lines.",
                },
                {
                  n: 4, active: false,
                  title: 'Review score delta',
                  desc: 'Monitor composite health weekly; revert if Novizio drops below 85.',
                },
              ].map((step) => (
                <div key={step.n} className="relative flex gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold z-10 shrink-0"
                    style={{ background: 'rgba(244,248,255,0.10)', border: `1px solid ${step.active ? ACCENT : L2}`, color: step.active ? ACCENT : I2d }}>
                    {step.n}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold mb-1" style={{ color: I2 }}>{step.title}</h4>
                    <p className="text-[13px] leading-relaxed" style={{ color: I2c }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Watchlist — V3 Obsidian */}
          <div className="lg:col-span-1 flex flex-col" style={{ ...G3, padding: '1.5rem 2rem' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">warning</span>
              <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.02em', color: I3 }}>Risk Watchlist</h2>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              {[
                {
                  title: 'Hourbour below target',
                  severity: 'High', sevColor: '#ffb4ab',
                  desc: 'Currently 8 pts below Q3 growth objective.',
                },
                {
                  title: 'Novizio over-concentrated',
                  severity: 'Med', sevColor: I3d,
                  desc: 'Relying too heavily on a single brand for total portfolio reach.',
                },
                {
                  title: 'Portfolio imbalance',
                  severity: 'Med', sevColor: I3d,
                  desc: 'Conversion metrics lagging behind awareness across the board.',
                },
              ].map(risk => (
                <div key={risk.title} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: risk.severity === 'High' ? '1px solid rgba(255,180,171,0.20)' : `1px solid ${L3}` }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[13px] font-medium" style={{ color: I3 }}>{risk.title}</span>
                    <span className="text-[10px] uppercase font-medium tracking-wider" style={{ color: risk.sevColor }}>{risk.severity}</span>
                  </div>
                  <p className="text-[12px] leading-snug" style={{ color: I3c }}>{risk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Executive Readout & Next Move — V3 Obsidian */}
        <section style={{ ...G3, overflow: 'hidden' }}>
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-8" style={{ borderRight: '1px solid rgba(241,245,251,0.10)' }}>
              <div className="text-[11px] uppercase tracking-wider font-medium mb-3" style={{ color: I3d }}>Executive Readout</div>
              <p className="text-[15px] leading-relaxed italic" style={{ color: I3c }}>
                &ldquo;Novizio remains the portfolio leader, but its top-heavy metrics mask vulnerabilities in our
                conversion funnel. A tactical redistribution of content effort toward Hourbour&apos;s
                higher-conversion formats is recommended to balance the stack.&rdquo;
              </p>
            </div>
            <div className="w-full md:w-[320px] p-6 md:p-8 flex flex-col justify-center" style={{ background: 'rgba(241,245,251,0.03)' }}>
              <div className="text-[11px] uppercase tracking-wider font-medium mb-3" style={{ color: I3d }}>Next Move</div>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: I3 }}>Ready to execute plan?</h3>
              <button
                onClick={() => router.push('/screens/war-room?q=Execute+portfolio+rebalance+plan%3A+shift+content+capacity+to+Hourbour%2C+reallocate+LinkedIn+spend+to+TikTok%2C+raise+health+threshold+to+70')}
                className="w-full px-4 py-3 rounded-xl text-[14px] font-medium transition-colors flex items-center justify-center gap-2 active:scale-95"
                style={{ background: ACCENT, color: '#fff' }}
              >
                <span>Rebalance Now</span>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="w-full py-8" style={{ borderTop: `1px solid ${L1}` }}>
        <div className="max-w-[980px] 2xl:max-w-[min(90vw,1400px)] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[12px]" style={{ color: I1d }}>© 2026 YVON Intelligence. All rights reserved.</div>
          <div className="flex items-center gap-6 text-[12px]" style={{ color: I1d }}>
            <a href="#" className="hover:opacity-70 transition-opacity" style={{ color: I1c }}>Privacy Policy</a>
            <a href="#" className="hover:opacity-70 transition-opacity" style={{ color: I1c }}>Terms of Service</a>
            <a href="#" className="hover:opacity-70 transition-opacity" style={{ color: I1c }}>Support</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
