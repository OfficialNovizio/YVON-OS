'use client';

import { useRouter } from 'next/navigation';
import AnalyticsSubNav from '../_subnav';

// ── Glass Variants ──────────────────────────────────────────────────────────────
const G1: React.CSSProperties = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1c='rgba(12,44,82,0.65)', I1d='rgba(12,44,82,0.48)', L1='rgba(12,44,82,0.10)';

const G2: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(36,99,180,0.42),rgba(20,70,140,0.55))', backdropFilter: 'blur(30px) saturate(190%)', WebkitBackdropFilter: 'blur(30px) saturate(190%)', border: '1px solid rgba(180,210,255,0.40)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.40),inset 0 -1px 0 rgba(0,30,80,0.25),0 18px 50px -10px rgba(10,40,100,0.40)' };
const I2='#f4f8ff', I2c='rgba(244,248,255,0.68)', I2d='rgba(244,248,255,0.48)', L2='rgba(255,255,255,0.14)';

const G3: React.CSSProperties = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3='#f1f5fb', I3c='rgba(241,245,251,0.75)', I3d='rgba(241,245,251,0.45)', L3='rgba(255,255,255,0.10)';

const G4: React.CSSProperties = { background: "radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))", backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4='#2a1240', I4d='rgba(42,18,64,0.48)';

const ACCENT = '#0066cc';
const GREEN  = '#059669';

// ── Estimated competitor benchmarks (flagged as estimated until platforms connect) ──
const COMPETITORS = [
  { name: 'Zara',  brandScore: 82, sov: '32%', sentiment: 74, growthVel: '+8.2%', threat: 'High'   },
  { name: 'H&M',   brandScore: 75, sov: '26%', sentiment: 68, growthVel: '+3.1%', threat: 'Medium' },
  { name: 'ASOS',  brandScore: 79, sov: '24%', sentiment: 71, growthVel: '+5.4%', threat: 'High'   },
  { name: 'Monki', brandScore: 61, sov: '11%', sentiment: 65, growthVel: '+1.8%', threat: 'Low'    },
  { name: 'COS',   brandScore: 68, sov: '7%',  sentiment: 72, growthVel: '+2.3%', threat: 'Low'    },
];

const OUR_BRAND_SCORE = 48; // Novizio estimated health score
const COMP_AVG = Math.round(COMPETITORS.reduce((s, c) => s + c.brandScore, 0) / COMPETITORS.length);
const BEST_COMP = COMPETITORS.reduce((best, c) => c.brandScore > best.brandScore ? c : best, COMPETITORS[0]);
const INDUSTRY_BENCH = 72;
const OUR_TARGET = 75;

export default function AnalyticsPortfolioPage() {
  const router = useRouter();

  const gap = COMP_AVG - OUR_BRAND_SCORE;
  const gapToTarget = OUR_TARGET - OUR_BRAND_SCORE;

  return (
    <main className="min-h-screen pb-24">
      <AnalyticsSubNav />

      {/* Signal Strip */}
      <div style={{ ...G3, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', padding: '10px 0' }}>
        <div className="max-w-[980px] 2xl:max-w-[min(90vw,1400px)] mx-auto px-4 flex items-center gap-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 rounded-full px-3 py-1 border whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.08)', borderColor: L3 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[11px] font-medium" style={{ color: I3c }}>Novizio brand score {OUR_BRAND_SCORE} pts — {gap} pts below competitor average</span>
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1 border whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.08)', borderColor: L3 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
            <span className="text-[11px] font-medium" style={{ color: I3c }}>Zara accelerating — +8.2% growth velocity this month</span>
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1 border whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.08)', borderColor: L3 }}>
            <span className="text-[11px] font-medium" style={{ color: 'rgba(241,245,251,0.40)', fontStyle: 'italic' }}>AI-estimated · connect platforms for live data</span>
          </div>
        </div>
      </div>

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* Hero — G2 Azure Tint */}
        <section style={{ ...G2, overflow: 'hidden', minHeight: 380, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem' }}>
          <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
            style={{ background: 'radial-gradient(circle at 70% 50%, rgba(0,113,227,0.15), transparent 60%)' }} />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 h-full">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: I2d }}>
                  AI-Estimated · Connect platforms for live data
                </span>
              </div>
              <h1 className="text-[40px] md:text-[56px] font-semibold leading-[1.07] mb-4"
                style={{ letterSpacing: '-0.02em', color: I2 }}>
                Competitive Standing
              </h1>
              <p className="text-[17px] max-w-lg mb-8 leading-relaxed"
                style={{ letterSpacing: '-0.01em', color: I2c }}>
                Novizio sits <strong style={{ color: I2 }}>{gap} pts</strong> below the competitor average.
                Zara leads the tier. Close the gap by owning the content spaces competitors aren&apos;t covering.
              </p>
              <button
                onClick={() => router.push('/screens/war-room?q=Marcus%2C+Novizio+is+' + gap + '+pts+below+competitor+average.+What+are+the+top+3+moves+to+close+the+gap+against+Zara%2C+H%26M%2C+and+ASOS%3F')}
                className="bg-[#0071e3] text-white px-6 py-2.5 rounded-full text-[14px] font-medium hover:bg-[#005cbb] transition-colors inline-flex items-center gap-2 active:scale-95"
              >
                <span>Close the Gap</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
            <div className="flex flex-row md:flex-col gap-4 self-start md:self-end">
              <div className="rounded-2xl p-4 min-w-[140px]" style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${L2}` }}>
                <div className="text-[12px] mb-1" style={{ color: I2d }}>Your Score</div>
                <div className="text-[32px] font-medium" style={{ letterSpacing: '-0.02em', color: I2 }}>
                  {OUR_BRAND_SCORE}<span className="text-[16px]" style={{ color: I2d }}>/100</span>
                </div>
                <div className="text-[11px] mt-1" style={{ color: 'rgba(251,146,60,0.85)' }}>Est. · pre-launch</div>
              </div>
              <div className="rounded-2xl p-4 min-w-[140px]" style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${L2}` }}>
                <div className="text-[12px] mb-1" style={{ color: I2d }}>Gap to Close</div>
                <div className="text-[32px] font-medium" style={{ letterSpacing: '-0.02em', color: I2 }}>
                  {gapToTarget}<span className="text-[14px]" style={{ color: I2d }}> pts</span>
                </div>
                <div className="text-[11px] mt-1" style={{ color: I2d }}>to reach target</div>
              </div>
            </div>
          </div>
        </section>

        {/* Metric Row — 5 KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Novizio (You)',      value: OUR_BRAND_SCORE, sub: 'Est. pre-launch score', icon: 'radio_button_checked', iconColor: ACCENT,    border: true,  highlight: false },
            { label: 'Competitor Avg',     value: COMP_AVG,        sub: '5 tier competitors',    icon: 'group',               iconColor: I1d,        border: false, highlight: false },
            { label: 'Best Competitor',    value: BEST_COMP.brandScore, sub: BEST_COMP.name,     icon: 'emoji_events',        iconColor: '#d97706',  border: false, highlight: false },
            { label: 'Industry Benchmark', value: INDUSTRY_BENCH,  sub: 'Fashion DTC avg',       icon: 'bar_chart',           iconColor: I1d,        border: false, highlight: false },
            { label: 'Your Target',        value: OUR_TARGET,      sub: 'End of sprint',         icon: 'flag',                iconColor: GREEN,      border: false, highlight: true  },
          ].map((m) => (
            <div key={m.label}
              className="rounded-[20px] p-5 transition-colors cursor-pointer relative overflow-hidden"
              style={{ ...G1, padding: 20 }}>
              {m.border && <div className="absolute inset-0 border-2 rounded-[20px] pointer-events-none" style={{ borderColor: 'rgba(0,102,204,0.20)' }} />}
              <div className="flex justify-between items-center mb-6 relative z-10">
                <span className="text-[13px] font-medium leading-tight" style={{ color: m.highlight ? GREEN : I1c }}>{m.label}</span>
                <span className="material-symbols-outlined text-[16px]" style={{ color: m.iconColor }}>{m.icon}</span>
              </div>
              <div className="text-[28px] font-medium mb-1 relative z-10"
                style={{ letterSpacing: '-0.02em', color: m.highlight ? GREEN : m.border ? ACCENT : I1 }}>{m.value}</div>
              <div className="text-[12px] relative z-10" style={{ color: I1d }}>{m.sub}</div>
            </div>
          ))}
        </section>

        {/* Analytical Hub Bento */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand Score vs Competitors — G2 Azure Tint */}
          <div style={{ ...G2, padding: 24, display: 'flex', flexDirection: 'column', gridColumn: 'span 1', minHeight: 340 }}>
            <h3 className="text-[16px] font-semibold mb-2" style={{ color: I2 }}>Score vs Competitors</h3>
            <p className="text-[13px] mb-4" style={{ color: I2d }}>Brand health by competitor</p>
            <div className="flex-1 flex flex-col gap-2 justify-center">
              {[{ name: 'You', score: OUR_BRAND_SCORE, isUs: true }, ...COMPETITORS.map(c => ({ name: c.name, score: c.brandScore, isUs: false }))].map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-[11px] w-14 flex-shrink-0 font-medium" style={{ color: c.isUs ? I2 : I2d }}>{c.name}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${c.score}%`, background: c.isUs ? '#fb923c' : 'rgba(255,255,255,0.35)' }} />
                  </div>
                  <span className="text-[11px] font-mono w-8 text-right flex-shrink-0" style={{ color: c.isUs ? '#fb923c' : I2d }}>{c.score}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${L2}` }}>
              <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              <span className="text-[11px]" style={{ color: I2d }}>You are {gap} pts below competitor average</span>
            </div>
          </div>

          {/* Market Position — G3 Obsidian */}
          <div style={{ ...G3, padding: 24, display: 'flex', flexDirection: 'column', gridColumn: 'span 1', minHeight: 340 }}>
            <h3 className="text-[16px] font-semibold mb-2" style={{ color: I3 }}>Market Position</h3>
            <p className="text-[13px] mb-4" style={{ color: I3d }}>Where competitors stand</p>
            <div className="flex-1 overflow-hidden">
              {COMPETITORS.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 py-2" style={{ borderBottom: i < COMPETITORS.length - 1 ? `1px solid ${L3}` : 'none' }}>
                  <span className="text-[11px] font-mono w-4" style={{ color: I3d }}>{i + 1}</span>
                  <span className="flex-1 text-[13px] font-medium" style={{ color: I3 }}>{c.name}</span>
                  <span className="text-[12px] font-mono" style={{ color: I3c }}>{c.sov}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                    background: c.threat === 'High' ? 'rgba(248,113,113,0.15)' : c.threat === 'Medium' ? 'rgba(251,146,60,0.12)' : 'rgba(52,211,153,0.10)',
                    color: c.threat === 'High' ? '#f87171' : c.threat === 'Medium' ? '#fb923c' : '#34d399'
                  }}>{c.threat}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 flex items-start gap-3" style={{ borderTop: `1px solid ${L3}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ background: 'rgba(0,102,204,0.20)', border: '1px solid rgba(0,102,204,0.35)', color: '#5ba8ff' }}>K</div>
              <p className="text-[12px] leading-snug" style={{ color: I3d }}>Zara and ASOS are accelerating. High-threat window — act in the next 30 days.</p>
            </div>
          </div>

          {/* 8-Week Trend — G2 Azure Tint */}
          <div style={{ ...G2, padding: 24, display: 'flex', flexDirection: 'column', gridColumn: 'span 1', minHeight: 340 }}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[16px] font-semibold" style={{ color: I2 }}>Gap Trend</h3>
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: 'rgba(244,248,255,0.10)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: I2d }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: I2d }}>Competitor Avg</span>
              </div>
            </div>
            <p className="text-[13px] mb-4" style={{ color: I2d }}>Your score vs competitor average</p>
            <div className="flex-1 relative w-full">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                <div className="w-full border-t border-white/5" />
                <div className="w-full border-t border-white/5" />
                <div className="w-full border-t border-white/5" />
              </div>
              <svg className="w-full h-[120px] overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Competitor avg line */}
                <path d="M0,38 Q20,36 40,35 T80,33 T100,32" fill="none" stroke="rgba(255,255,255,0.25)" strokeDasharray="4,4" strokeWidth="1.5" />
                {/* Our line — starting low, slight upward trend */}
                <path d="M0,70 Q20,68 40,65 T80,60 T100,56" fill="none" stroke="#fb923c" strokeWidth="2.5" />
                <path d="M0,70 Q20,68 40,65 T80,60 T100,56 L100,100 L0,100 Z" fill="url(#orange-grad)" opacity="0.12" />
                <defs>
                  <linearGradient id="orange-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="56" r="4" fill="#000" stroke="#fb923c" strokeWidth="2" />
                <circle cx="100" cy="32" r="3" fill="#000" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
              </svg>
              <div className="flex justify-between mt-1 text-[11px]" style={{ color: I2d }}>
                <span>W1</span><span>W4</span><span>W8</span>
              </div>
              <div className="flex gap-4 mt-3 text-[11px]" style={{ color: I2d }}>
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#fb923c] rounded" /> You</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: 'rgba(255,255,255,0.25)' }} /> Comp avg</div>
              </div>
            </div>
          </div>
        </section>

        {/* Competitive Positioning Moves */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[20px] font-semibold" style={{ letterSpacing: '-0.02em', color: I1 }}>
              Competitive Positioning Moves
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: 'content_copy', badge: 'Content Gap', badgeBg: 'bg-white/10', badgeText: 'text-white/80',
                title: 'Own Founder-Led Content',
                desc: 'Zara and ASOS dominate product aesthetics. The founder narrative space is unclaimed. Launch weekly behind-the-scenes content to differentiate.',
                vs: 'Zara', move: 'Launch IG Stories series', highlight: true,
                route: '/screens/war-room?q=Launch+founder-led+content+strategy+for+Novizio+—+differentiate+from+Zara+aesthetic+focus',
              },
              {
                icon: 'trending_up', badge: 'Platform Gap', badgeBg: 'bg-white/5', badgeText: 'text-white/60',
                title: 'TikTok First-Mover Window',
                desc: 'H&M TikTok engagement is declining. Educational fashion content in this tier is unclaimed. 30-day window before competitors pivot.',
                vs: 'H&M', move: 'Post 3 TikTok Reels/wk', highlight: false,
                route: '/screens/war-room?q=TikTok+strategy+for+Novizio+—+capture+H%26M+gap+in+educational+fashion+content',
              },
              {
                icon: 'search', badge: 'SEO Gap', badgeBg: 'bg-white/5', badgeText: 'text-white/60',
                title: 'Keyword Ownership Play',
                desc: 'ASOS ranks for sustainable fashion terms. Novizio can claim niche long-tail fashion keywords (low competition, high intent) first.',
                vs: 'ASOS', move: 'Target 5 low-diff keywords', highlight: false,
                route: '/screens/war-room?q=Keyword+strategy+for+Novizio+—+capture+sustainable+fashion+SEO+gaps+before+ASOS+consolidates',
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
                  <span style={{ color: I3d }}>vs {a.vs}</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ color: I3d }}>arrow_right_alt</span>
                  <span style={{ color: I3 }}>{a.move}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Competitor Performance Detail */}
        <section>
          <h2 className="text-[20px] font-semibold mb-6" style={{ letterSpacing: '-0.02em', color: I1 }}>
            Competitor Performance Detail
          </h2>
          <div style={{ ...G1, overflow: 'hidden' }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${L1}` }}>
                  {['Competitor', 'Brand Score', 'Share of Voice', 'Sentiment', 'Growth Velocity', 'Threat Level'].map(h => (
                    <th key={h} className="px-6 py-4" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: I1d }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c, i) => (
                  <tr key={c.name} style={{ borderTop: `1px solid ${L1}` }} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: L1, color: I1 }}>{c.name[0]}</div>
                        <span className="text-[13px] font-semibold" style={{ color: I1 }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-mono font-medium" style={{ color: I1 }}>{c.brandScore}</span>
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: L1 }}>
                          <div className="h-full rounded-full" style={{ width: `${c.brandScore}%`, background: ACCENT }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ fontSize: 13, color: I1c }}>{c.sov}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: L1 }}>
                          <div className="h-full rounded-full" style={{ width: `${c.sentiment}%`, background: '#34d399' }} />
                        </div>
                        <span className="text-[12px] font-mono" style={{ color: I1c }}>{c.sentiment}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>{c.growthVel}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{
                        background: c.threat === 'High' ? 'rgba(248,113,113,0.12)' : c.threat === 'Medium' ? 'rgba(251,146,60,0.10)' : 'rgba(52,211,153,0.10)',
                        color: c.threat === 'High' ? '#f87171' : c.threat === 'Medium' ? '#fb923c' : '#34d399'
                      }}>{c.threat}</span>
                    </td>
                  </tr>
                ))}
                {/* You row */}
                <tr style={{ borderTop: `1px solid ${L1}`, background: `${ACCENT}06` }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: `${ACCENT}20`, color: ACCENT }}>N</div>
                      <span className="text-[13px] font-bold" style={{ color: ACCENT }}>Novizio (You)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-mono font-medium" style={{ color: '#fb923c' }}>{OUR_BRAND_SCORE}</span>
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: L1 }}>
                        <div className="h-full rounded-full bg-[#fb923c]" style={{ width: `${OUR_BRAND_SCORE}%` }} />
                      </div>
                      <span className="text-[10px]" style={{ color: I1d, fontStyle: 'italic' }}>est.</span>
                    </div>
                  </td>
                  <td className="px-6 py-4" style={{ fontSize: 13, color: I1d, fontStyle: 'italic' }}>—</td>
                  <td className="px-6 py-4" style={{ fontSize: 13, color: I1d, fontStyle: 'italic' }}>—</td>
                  <td className="px-6 py-4" style={{ fontSize: 13, color: I1d, fontStyle: 'italic' }}>Pre-launch</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: L1, color: I1d }}>Entrant</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Competitor Threat Watch — G3 Obsidian */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2" style={{ ...G2, padding: '1.5rem 2rem' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#5ba8ff' }}>route</span>
              <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.02em', color: I2 }}>Gap Closure Roadmap</h2>
            </div>
            <div className="space-y-6 relative" style={{ paddingLeft: 30 }}>
              <div className="absolute left-[5px] top-2 bottom-2 w-px" style={{ background: L2 }} />
              {[
                { n: 1, active: true,  title: 'Establish TikTok presence',        desc: '3 Reels/week minimum. Focus on founder-led educational content to fill the H&M gap.' },
                { n: 2, active: false, title: 'Claim low-difficulty keywords',     desc: 'Target 5 long-tail fashion terms with <40 difficulty score. Build domain authority.' },
                { n: 3, active: false, title: 'Launch Instagram brand narrative',  desc: "Shift from product posts to story-driven content. Counter Zara's aesthetic dominance." },
                { n: 4, active: false, title: 'Measure score delta vs competitors', desc: 'Re-evaluate brand score monthly. Adjust competitor tier as follower count grows.' },
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

          {/* Competitor Threat Watch — G3 Obsidian */}
          <div className="lg:col-span-1 flex flex-col" style={{ ...G3, padding: '1.5rem 2rem' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">radar</span>
              <h2 className="text-[18px] font-semibold" style={{ letterSpacing: '-0.02em', color: I3 }}>Competitor Threat Watch</h2>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              {[
                { title: 'Zara accelerating', severity: 'High', sevColor: '#ffb4ab', desc: '+8.2% growth velocity this month. TikTok-first pivot confirmed.' },
                { title: 'ASOS keyword push', severity: 'Med',  sevColor: I3d,       desc: 'Expanding sustainable fashion keyword coverage. SEO threat.' },
                { title: 'H&M TikTok decline', severity: 'Low', sevColor: I3d,       desc: 'Engagement dropping —opportunity window opening.' },
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

        {/* Executive Readout */}
        <section style={{ ...G3, overflow: 'hidden' }}>
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-8" style={{ borderRight: '1px solid rgba(241,245,251,0.10)' }}>
              <div className="text-[11px] uppercase tracking-wider font-medium mb-3" style={{ color: I3d }}>Executive Readout</div>
              <p className="text-[15px] leading-relaxed italic" style={{ color: I3c }}>
                &ldquo;Novizio enters a market where the top 3 competitors already dominate share of voice. The gap is real but the window is open — TikTok engagement quality is declining for mid-tier brands. A focused 30-day content sprint targeting owned narrative gaps will accelerate brand score faster than broad awareness campaigns.&rdquo;
              </p>
            </div>
            <div className="w-full md:w-[320px] p-6 md:p-8 flex flex-col justify-center" style={{ background: 'rgba(241,245,251,0.03)' }}>
              <div className="text-[11px] uppercase tracking-wider font-medium mb-3" style={{ color: I3d }}>Next Move</div>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: I3 }}>Ready to execute?</h3>
              <button
                onClick={() => router.push('/screens/war-room?q=Marcus%2C+build+a+30-day+competitive+positioning+plan+for+Novizio+—+close+the+gap+against+Zara%2C+H%26M%2C+ASOS+using+content+and+SEO+gaps')}
                className="w-full px-4 py-3 rounded-xl text-[14px] font-medium transition-colors flex items-center justify-center gap-2 active:scale-95"
                style={{ background: ACCENT, color: '#fff' }}
              >
                <span>Build Positioning Plan</span>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="w-full py-8 mt-8" style={{ borderTop: `1px solid ${L1}` }}>
        <div className="max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
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
