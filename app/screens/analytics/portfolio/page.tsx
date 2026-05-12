'use client';

import { useRouter } from 'next/navigation';
import AnalyticsSubNav from '../_subnav';

export default function AnalyticsPortfolioPage() {
  const router = useRouter();
  return (
    <main className="pt-14 pb-24 bg-black text-[#e2e2e2] min-h-screen">
      <AnalyticsSubNav />

      {/* Signal Strip */}
      <div className="w-full bg-[#1c1c1e] border-b border-white/5">
        <div className="max-w-[980px] mx-auto px-4 py-2.5 flex items-center gap-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1 border border-white/5 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
            <span className="text-[11px] font-medium text-white/90">Engagement Spike: Novizio +42%</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1 border border-white/5 whitespace-nowrap">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
            <span className="text-[11px] font-medium text-white/90">YouTube Anomaly Detected</span>
          </div>
        </div>
      </div>

      <div className="max-w-[980px] mx-auto px-4 pt-10 pb-20 flex flex-col gap-8">

        {/* Intelligence Hero */}
        <section className="rounded-[24px] overflow-hidden relative min-h-[380px] flex flex-col justify-between p-8 md:p-12"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(40px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
            style={{ background: 'radial-gradient(circle at 70% 50%, rgba(0,113,227,0.15), transparent 60%)' }} />
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.05) 50px)' }} />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 h-full">
            <div className="max-w-2xl">
              <h1 className="text-[40px] md:text-[56px] font-semibold leading-[1.07] text-white mb-4"
                style={{ letterSpacing: '-0.02em' }}>
                Portfolio Command
              </h1>
              <p className="text-[17px] text-white/70 max-w-lg mb-8 leading-relaxed"
                style={{ letterSpacing: '-0.01em' }}>
                Overall brand health is stable. Novizio engagement offset by Delta&apos;s targeted ad fatigue.
                Rebalancing recommended for optimal ROI.
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
                style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-[12px] text-white/50 mb-1">Composite Health</div>
                <div className="text-[32px] font-medium text-white" style={{ letterSpacing: '-0.02em' }}>
                  88<span className="text-[16px] text-white/40">/100</span>
                </div>
              </div>
              <div className="rounded-2xl p-4 min-w-[140px]"
                style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-[12px] text-white/50 mb-1">Risk Index</div>
                <div className="text-[32px] font-medium text-white" style={{ letterSpacing: '-0.02em' }}>Low</div>
              </div>
            </div>
          </div>
        </section>

        {/* Metric Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Novizio', value: 94, sub: '+2.4 pts this week', icon: 'trending_up', iconColor: '#0071e3', border: false },
            { label: 'Hourbour', value: 82, sub: 'Stable', icon: 'trending_flat', iconColor: 'rgba(255,255,255,0.4)', border: false },
            { label: 'Delta', value: 76, sub: '-1.2 pts this week', icon: 'trending_down', iconColor: '#ffb4ab', border: false },
            { label: 'Target', value: 90, sub: 'Q3 Goal', icon: 'flag', iconColor: '#0071e3', border: true },
          ].map((m) => (
            <div key={m.label}
              className="rounded-[20px] p-5 hover:bg-white/[0.02] transition-colors cursor-pointer relative overflow-hidden"
              style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {m.border && <div className="absolute inset-0 border-2 border-[#0071e3]/20 rounded-[20px] pointer-events-none" />}
              <div className="flex justify-between items-center mb-6 relative z-10">
                <span className="text-[14px] font-medium text-white/80">{m.label}</span>
                <span className="material-symbols-outlined text-[16px]" style={{ color: m.iconColor }}>{m.icon}</span>
              </div>
              <div className="text-[28px] font-medium text-white mb-1 relative z-10"
                style={{ letterSpacing: '-0.02em', color: m.border ? '#0071e3' : undefined }}>{m.value}</div>
              <div className="text-[12px] text-white/50 relative z-10">{m.sub}</div>
            </div>
          ))}
        </section>

        {/* Analytical Hub Bento */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Radar Module */}
          <div className="rounded-[24px] p-6 flex flex-col md:col-span-1 min-h-[340px]"
            style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-[16px] font-medium text-white mb-2">Growth vs Engagement</h3>
            <p className="text-[13px] text-white/50 mb-8">Relative matrix across portfolio</p>
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

          {/* Performance Stack */}
          <div className="rounded-[24px] p-6 flex flex-col md:col-span-1 min-h-[340px]"
            style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-[16px] font-medium text-white mb-2">Performance Stack</h3>
            <p className="text-[13px] text-white/50 mb-6">Contribution by brand</p>
            <div className="flex-1 flex items-end gap-4 px-4 h-full pt-8">
              <div className="flex-1 flex flex-col justify-end h-full gap-1">
                <div className="w-full bg-white/5 rounded-t-sm h-[20%]" />
                <div className="w-full bg-[#0071e3]/40 h-[30%]" />
                <div className="w-full bg-[#0071e3] h-[50%] rounded-b-sm" style={{ boxShadow: '0 0 15px rgba(0,113,227,0.3)' }} />
                <div className="text-[11px] text-white/40 text-center mt-2">NOV</div>
              </div>
              <div className="flex-1 flex flex-col justify-end h-full gap-1">
                <div className="w-full bg-white/5 rounded-t-sm h-[40%]" />
                <div className="w-full bg-white/20 h-[30%]" />
                <div className="w-full bg-white/40 h-[10%] rounded-b-sm" />
                <div className="text-[11px] text-white/40 text-center mt-2">HRB</div>
              </div>
              <div className="flex-1 flex flex-col justify-end h-full gap-1">
                <div className="w-full bg-white/5 rounded-t-sm h-[50%]" />
                <div className="w-full bg-[#ffb4ab]/20 h-[20%]" />
                <div className="w-full bg-[#ffb4ab]/40 h-[15%] rounded-b-sm" />
                <div className="text-[11px] text-white/40 text-center mt-2">DLT</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-start gap-3">
              <img
                alt="Marcus"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDreMChF3yR6yGUIGUA6DQoxV29o3xtxXK0xm7rXyKKrpHvcXgTSDz7VY284CVBSNzuoxjRnrD38wzLKja4zHdAeeJEuGniRH6tJkDmZQsyhkbepQv3wwJnBEufvCjG0QeG-xrJraxOJYyiMnvyPI7MGVB4aODYoa6GjdAV1daxMzIsN9MQKA_eYjY1AuZwYD-eksrXiPlhN5rJjv2TLBQxCC9HgTFtFRs3Ir0qOca-qY32rZQlLfVyAvsc-7kQi7kv6P43OQPRTnpU"
                className="w-8 h-8 rounded-full grayscale opacity-80 object-cover shrink-0"
              />
              <div>
                <div className="text-[12px] font-medium text-white/90">Marcus (Strategist)</div>
                <div className="text-[12px] text-white/60 leading-snug mt-0.5">
                  Novizio carrying the stack. Consider re-allocating Delta spend to bolster Harbour mid-funnel.
                </div>
              </div>
            </div>
          </div>

          {/* 8-Week Trend */}
          <div className="rounded-[24px] p-6 flex flex-col md:col-span-1 min-h-[340px]"
            style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[16px] font-medium text-white">8-Week Trend</h3>
              <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-white/30" />
                <span className="text-[10px] text-white/60 uppercase tracking-wider">DTC Bench</span>
              </div>
            </div>
            <p className="text-[13px] text-white/50 mb-8">Aggregate view vs Industry</p>
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
              <div className="flex justify-between mt-4 text-[11px] text-white/40 font-mono">
                <span>W1</span>
                <span>W4</span>
                <span>W8</span>
              </div>
            </div>
          </div>
        </section>

        {/* Allocation Decisions Pending */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[20px] font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>
              Allocation Decisions Pending
            </h2>
            <span className="bg-[#0071e3]/20 text-[#0071e3] text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-[#0071e3]/30">
              3 Actions
            </span>
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
                className="rounded-[20px] p-6 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                style={{
                  background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)',
                  border: a.highlight ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.05)',
                  borderLeft: a.highlight ? '2px solid #0071e3' : undefined,
                }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: a.highlight ? 'rgba(0,113,227,0.1)' : 'rgba(255,255,255,0.05)' }}>
                    <span className="material-symbols-outlined text-[16px]"
                      style={{ color: a.highlight ? '#0071e3' : 'rgba(255,255,255,0.6)' }}>{a.icon}</span>
                  </div>
                  <span className={`${a.badgeBg} ${a.badgeText} text-[10px] font-medium px-2 py-0.5 rounded-full`}>{a.badge}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2 leading-snug group-hover:text-[#0071e3] transition-colors">
                  {a.title}
                </h3>
                <p className="text-[13px] text-white/60 mb-5 leading-relaxed">{a.desc}</p>
                <div className="flex items-center justify-between text-[12px] font-medium text-white/80 bg-black/40 rounded-lg p-2.5 border border-white/5">
                  <span className="text-white/50">{a.from}</span>
                  <span className="material-symbols-outlined text-[16px] text-white/30">arrow_right_alt</span>
                  <span>{a.to}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Channel Contribution by Brand */}
        <section>
          <h2 className="text-[20px] font-semibold text-white mb-6" style={{ letterSpacing: '-0.02em' }}>
            Channel Contribution by Brand
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Volume & Mix */}
            <div className="rounded-[24px] p-6 md:p-8"
              style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-[14px] font-medium text-white mb-6">Volume &amp; Mix</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13px] font-medium text-white">Novizio</span>
                    <span className="text-[12px] text-white/50 font-mono">1.2M Vol</span>
                  </div>
                  <div className="w-full h-8 rounded-full flex overflow-hidden border border-white/10">
                    <div className="bg-[#0071e3] w-[45%] h-full flex items-center justify-center">
                      <span className="text-[10px] font-medium text-white/90">IG</span>
                    </div>
                    <div className="w-[25%] h-full flex items-center justify-center border-l border-black/20" style={{ background: 'rgba(0,113,227,0.7)' }}>
                      <span className="text-[10px] font-medium text-white/90">TT</span>
                    </div>
                    <div className="w-[20%] h-full flex items-center justify-center border-l border-black/20" style={{ background: 'rgba(0,113,227,0.4)' }}>
                      <span className="text-[10px] font-medium text-white/80">YT</span>
                    </div>
                    <div className="w-[10%] h-full border-l border-black/20" style={{ background: 'rgba(0,113,227,0.2)' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13px] font-medium text-white">Hourbour</span>
                    <span className="text-[12px] text-white/50 font-mono">480k Vol</span>
                  </div>
                  <div className="w-full h-8 rounded-full flex overflow-hidden border border-white/10">
                    <div className="bg-white/40 w-[15%] h-full flex items-center justify-center">
                      <span className="text-[10px] font-medium text-black/60">IG</span>
                    </div>
                    <div className="bg-white/30 w-[15%] h-full border-l border-black/20" />
                    <div className="bg-white/20 w-[10%] h-full border-l border-black/20" />
                    <div className="bg-white/10 w-[60%] h-full flex items-center justify-center border-l border-black/20">
                      <span className="text-[10px] font-medium text-white/60">LI</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6 pt-6 border-t border-white/5 text-[11px] text-white/40 justify-center">
                {[['IG','bg-white/80'],['TT','bg-white/60'],['YT','bg-white/40'],['LI','bg-white/20']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${c}`} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Dimension Contribution */}
            <div className="rounded-[24px] p-6 md:p-8"
              style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-[14px] font-medium text-white mb-6">Dimension Contribution</h3>
              <div className="w-full text-left">
                <div className="flex text-[11px] text-white/40 uppercase tracking-wider mb-3 pb-2 border-b border-white/10">
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
                    className="flex py-2.5 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2">
                    <div className="w-2/5 text-[13px] text-white/80">{row.metric}</div>
                    <div className="w-[30%] text-center">
                      <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${row.nov.blue ? 'bg-[#0071e3]/20 text-[#0071e3]' : 'bg-white/10 text-white/60'}`}>
                        {row.nov.label}
                      </span>
                    </div>
                    <div className="w-[30%] text-center">
                      <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${row.hrb.blue ? 'bg-[#0071e3]/20 text-[#0071e3]' : 'bg-white/10 text-white/60'}`}>
                        {row.hrb.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Rebalance Plan & Risk Watchlist */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rebalance Plan */}
          <div className="lg:col-span-2 rounded-[24px] p-6 md:p-8"
            style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[20px] text-[#0071e3]">route</span>
              <h2 className="text-[18px] font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>Portfolio Rebalance Plan</h2>
            </div>
            <div className="space-y-6 relative before:absolute before:inset-y-2 before:left-[15px] before:w-px before:bg-white/10">
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
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[12px] font-bold z-10 shrink-0"
                    style={{ border: `1px solid ${step.active ? '#0071e3' : 'rgba(255,255,255,0.2)'}`, color: step.active ? '#0071e3' : 'rgba(255,255,255,0.6)' }}>
                    {step.n}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-white mb-1">{step.title}</h4>
                    <p className="text-[13px] text-white/50 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Watchlist */}
          <div className="lg:col-span-1 rounded-[24px] p-6 md:p-8 flex flex-col"
            style={{ background: 'rgba(31,31,31,0.4)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">warning</span>
              <h2 className="text-[18px] font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>Risk Watchlist</h2>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div className="bg-black/40 rounded-xl p-4 border border-[#ffb4ab]/20">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[13px] font-medium text-white">Hourbour below target</span>
                  <span className="text-[10px] text-[#ffb4ab] uppercase font-medium tracking-wider">High</span>
                </div>
                <p className="text-[12px] text-white/50 leading-snug">Currently 8 pts below Q3 growth objective.</p>
              </div>
              <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[13px] font-medium text-white">Novizio over-concentrated</span>
                  <span className="text-[10px] text-white/50 uppercase font-medium tracking-wider">Med</span>
                </div>
                <p className="text-[12px] text-white/50 leading-snug">Relying too heavily on a single brand for total portfolio reach.</p>
              </div>
              <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[13px] font-medium text-white">Portfolio imbalance</span>
                  <span className="text-[10px] text-white/50 uppercase font-medium tracking-wider">Med</span>
                </div>
                <p className="text-[12px] text-white/50 leading-snug">Conversion metrics lagging behind awareness across the board.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Executive Readout & Next Move */}
        <section className="rounded-[24px] overflow-hidden border border-white/10"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(40px) saturate(200%)' }}>
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/10">
              <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-3">Executive Readout</div>
              <p className="text-[15px] text-white/80 leading-relaxed italic">
                &ldquo;Novizio remains the portfolio leader, but its top-heavy metrics mask vulnerabilities in our
                conversion funnel. A tactical redistribution of content effort toward Hourbour&apos;s
                higher-conversion formats is recommended to balance the stack.&rdquo;
              </p>
            </div>
            <div className="w-full md:w-[320px] p-6 md:p-8 flex flex-col justify-center bg-white/[0.02]">
              <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-3">Next Move</div>
              <h3 className="text-[16px] font-medium text-white mb-4">Ready to execute plan?</h3>
              <button className="w-full bg-[#0071e3] text-white px-4 py-3 rounded-xl text-[14px] font-medium hover:bg-[#005cbb] transition-colors flex items-center justify-center gap-2 active:scale-95">
                <span>Rebalance Now</span>
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-black/50 py-8">
        <div className="max-w-[980px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[12px] text-white/40">© 2024 YVON Intelligence. All rights reserved.</div>
          <div className="flex items-center gap-6 text-[12px] text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
