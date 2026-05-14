'use client';

import CompetitorSubNav from '../_subnav';

const s1 = 'bg-[#272729]';
const s2 = 'bg-[#262628]';
const s3 = 'bg-[#28282a]';

export default function CompetitorContentIntelPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col antialiased pt-14">

      <CompetitorSubNav />

      <div className="flex-1 w-full max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto px-6 py-8 flex flex-col gap-8">

        {/* Intelligence Brief Hero */}
        <section className={`${s1} rounded-3xl p-10 flex flex-col lg:flex-row gap-10 items-start`}
          style={{ boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0px' }}>
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-2 text-[#0071e3] text-[13px] font-medium uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              Intelligence Brief
            </div>
            <h2 className="text-[56px] font-semibold text-white max-w-3xl"
              style={{ lineHeight: '1.07', letterSpacing: '-0.28px' }}>
              Zara and Monzo capture 42% of Gen-Z engagement across primary social channels.
            </h2>
          </div>
          <div className={`w-full lg:w-[400px] ${s3} rounded-2xl p-6 border border-white/5 space-y-4`}>
            <div className="flex items-center gap-2 text-white/80 text-[13px] font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#0071e3]">target</span>
              Critical Opportunity for Hourbour
            </div>
            <p className="text-[17px] text-white/70 leading-relaxed" style={{ letterSpacing: '-0.374px' }}>
              A significant opening exists in founder-led video content on TikTok. Competitors are currently
              under-investing in authentic, behind-the-scenes narratives, leading to a potential 3x engagement
              multiplier for early adopters.
            </p>
            <button className="mt-2 text-[#0071e3] text-[14px] font-medium hover:underline flex items-center gap-1 active:scale-95">
              View Strategic Playbook <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* KPI Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Share of Voice */}
          <div className={`${s1} rounded-2xl p-6 flex flex-col gap-4`} style={{ boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0px' }}>
            <h3 className="text-white/60 text-[13px] font-medium uppercase tracking-wider">Share of Voice</h3>
            <div className="flex items-end justify-between">
              <div className="text-[28px] font-normal text-white" style={{ letterSpacing: '0.196px' }}>18.4%</div>
              <div className="flex items-center gap-1 text-[#0071e3] text-[13px] font-medium">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>+2.1%
              </div>
            </div>
            <div className="h-1 w-full bg-[#28282a] rounded-full overflow-hidden">
              <div className="h-full bg-[#0071e3] w-[18.4%]" />
            </div>
          </div>
          {/* Sentiment */}
          <div className={`${s1} rounded-2xl p-6 flex flex-col gap-4`} style={{ boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0px' }}>
            <h3 className="text-white/60 text-[13px] font-medium uppercase tracking-wider">Sentiment</h3>
            <div className="flex items-end justify-between">
              <div className="text-[28px] font-normal text-white" style={{ letterSpacing: '0.196px' }}>
                72<span className="text-white/40 text-[16px]">/100</span>
              </div>
              <div className="flex items-center gap-1 text-white/40 text-[13px] font-medium">
                <span className="material-symbols-outlined text-[16px]">trending_flat</span>0.0
              </div>
            </div>
            <div className="h-1 w-full bg-[#28282a] rounded-full overflow-hidden">
              <div className="h-full bg-white/40 w-[72%]" />
            </div>
          </div>
          {/* Velocity */}
          <div className={`${s1} rounded-2xl p-6 flex flex-col gap-4`} style={{ boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0px' }}>
            <h3 className="text-white/60 text-[13px] font-medium uppercase tracking-wider">Velocity</h3>
            <div className="flex items-end justify-between">
              <div className="text-[28px] font-normal text-white" style={{ letterSpacing: '0.196px' }}>
                12<span className="text-white/40 text-[16px]">/wk</span>
              </div>
              <div className="flex items-center gap-1 text-[#0071e3] text-[13px] font-medium">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>+4
              </div>
            </div>
            <div className="h-8 w-full mt-1 flex items-end gap-1">
              {[40, 60, 30, 80, 100].map((h, i) => (
                <div key={i} className={`w-full rounded-t ${i >= 3 ? 'bg-[#0071e3]' : 'bg-[#28282a]'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          {/* Avg Engagement */}
          <div className={`${s1} rounded-2xl p-6 flex flex-col gap-4`} style={{ boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0px' }}>
            <h3 className="text-white/60 text-[13px] font-medium uppercase tracking-wider">Avg Engagement</h3>
            <div className="flex items-end justify-between">
              <div className="text-[28px] font-normal text-white" style={{ letterSpacing: '0.196px' }}>4.2%</div>
              <div className="flex items-center gap-1 text-[#0071e3] text-[13px] font-medium">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>+0.8%
              </div>
            </div>
            <div className="h-8 w-full mt-1 flex items-center">
              <svg className="w-full h-full text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,15 Q25,5 50,10 T100,2" />
              </svg>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Content Signals */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <h3 className="text-white text-[18px] font-medium border-b border-white/10 pb-3">Live Content Signals</h3>
            <div className="flex flex-col gap-3">
              {[
                { badge: 'SPIKE', badgeBlue: true, time: '10m ago', title: 'Monzo launches new savings campaign on IG', desc: 'Engagement velocity is 3x their 30-day average.' },
                { badge: 'WATCH', badgeBlue: false, time: '1h ago', title: "Revolut pausing paid search for 'crypto'", desc: 'Detected a sudden drop in ad impressions.' },
                { badge: 'TREND', badgeBlue: false, time: '3h ago', title: "'Sustainable investing' sentiment rising", desc: 'Across top 5 competitors, mentions up 15%.' },
                { badge: 'SHIFT', badgeBlue: true, time: '5h ago', title: 'Zara shifting focus to TikTok Shorts', desc: 'Decrease in long-form YouTube output detected.' },
              ].map((s) => (
                <div key={s.title}
                  className={`${s2} rounded-xl p-4 border border-white/5 flex flex-col gap-2 hover:bg-[#28282a] transition-colors cursor-pointer`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.badgeBlue ? 'bg-[#0071e3]/20 text-[#0071e3]' : 'bg-white/10 text-white/80'}`}>
                      {s.badge}
                    </span>
                    <span className="text-white/40 text-[11px]">{s.time}</span>
                  </div>
                  <h4 className="text-white text-[14px] font-medium">{s.title}</h4>
                  <p className="text-white/60 text-[12px] truncate">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Competitive Momentum & Strategic Cards */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Competitive Momentum Table */}
            <div className="flex flex-col gap-6">
              <h3 className="text-white text-[18px] font-medium border-b border-white/10 pb-3">Competitive Momentum</h3>
              <div className={`${s1} rounded-2xl overflow-hidden border border-white/5`}>
                <table className="w-full text-left text-[14px]">
                  <thead className={`${s3} text-white/60 text-[12px] uppercase tracking-wider`}>
                    <tr>
                      {['Brand', 'Trend', 'Top Theme', 'Impact'].map((h) => (
                        <th key={h} className="px-6 py-4 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { brand: 'Zara',            trendColor: 'text-[#0071e3]', trendIcon: 'trending_up',   trend: 'High',   theme: 'Lifestyle Integration', impact: 'Significant', you: false },
                      { brand: 'Monzo',           trendColor: 'text-[#0071e3]', trendIcon: 'trending_up',   trend: 'High',   theme: 'Micro-Savings',         impact: 'Moderate',   you: false },
                      { brand: 'Revolut',         trendColor: 'text-white/40',  trendIcon: 'trending_flat', trend: 'Stable', theme: 'Travel Perks',          impact: 'Low',        you: false },
                      { brand: 'Hourbour (You)',  trendColor: 'text-white/40',  trendIcon: 'trending_flat', trend: 'Stable', theme: 'Security',              impact: '—',          you: true  },
                    ].map((r) => (
                      <tr key={r.brand}
                        className={r.you ? 'bg-[#0071e3]/5 hover:bg-[#0071e3]/10 transition-colors border-l-2 border-[#0071e3]' : 'hover:bg-white/[0.02] transition-colors'}>
                        <td className="px-6 py-4 font-medium text-white">{r.brand}</td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1 ${r.trendColor}`}>
                            <span className="material-symbols-outlined text-[16px]">{r.trendIcon}</span>
                            {r.trend}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/80">{r.theme}</td>
                        <td className="px-6 py-4 text-white/80">{r.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategic Market Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: 'speed',    color: 'text-[#0071e3]', label: 'Market Velocity', value: 'High',      desc: 'Content production across top 5 is accelerating.' },
                { icon: 'warning',  color: 'text-white/80',  label: 'Emerging Threat', value: 'Acme Corp', desc: 'Aggressive push in Gen-Z focused financial literacy.' },
                { icon: 'lightbulb',color: 'text-[#0071e3]', label: 'Top Opportunity', value: 'Video ROI', desc: 'Short-form educational video shows lowest saturation.' },
              ].map((c) => (
                <div key={c.label} className={`${s2} rounded-xl p-5 border border-white/5 flex flex-col gap-3`}>
                  <div className={c.color}><span className="material-symbols-outlined text-[24px]">{c.icon}</span></div>
                  <h4 className="text-white/60 text-[12px] uppercase tracking-wider font-medium">{c.label}</h4>
                  <div className="text-white text-[18px] font-medium">{c.value}</div>
                  <p className="text-white/50 text-[12px]">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Positioning */}
        <section className="flex flex-col gap-6 mt-8">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-white text-[18px] font-medium">Market Positioning</h3>
            <div className="flex gap-4 text-[12px]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0071e3]" /><span className="text-white/60">High Intent</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white/20" /><span className="text-white/60">Mass Market</span></div>
            </div>
          </div>
          <div className={`${s1} rounded-2xl p-6 border border-white/5 h-[400px] relative`}>
            <div className="absolute left-10 top-6 bottom-10 border-l border-white/10" />
            <div className="absolute left-10 bottom-10 right-6 border-b border-white/10" />
            <div className="absolute left-4 top-1/2 -rotate-90 text-white/40 text-[11px] uppercase tracking-wider -translate-y-1/2 origin-center whitespace-nowrap">
              Engagement Rate
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-[11px] uppercase tracking-wider">
              Brand Reach
            </div>
            <div className="absolute left-[80%] bottom-[30%] flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                <span className="text-white/80 text-[12px]">Zara</span>
              </div>
            </div>
            <div className="absolute left-[60%] bottom-[60%] flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#0071e3]/80 flex items-center justify-center border border-white/10">
                <span className="text-white text-[12px]">Monzo</span>
              </div>
            </div>
            <div className="absolute left-[40%] bottom-[40%] flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                <span className="text-white/80 text-[12px]">Revolut</span>
              </div>
            </div>
            <div className="absolute left-[20%] bottom-[20%] flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#0071e3] flex items-center justify-center border border-white/30 ring-2 ring-white/20">
                <span className="text-white text-[10px]">Hourbour</span>
              </div>
            </div>
          </div>
        </section>

        {/* Top Competitors */}
        <section className="flex flex-col gap-6 mt-8">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-white text-[18px] font-medium">Top Competitors</h3>
            <a href="#" className="text-[#0071e3] text-[13px] hover:underline">View All</a>
          </div>
          <div className={`${s1} rounded-2xl overflow-hidden border border-white/5`}>
            <table className="w-full text-left text-[14px]">
              <thead className={`${s3} text-white/60 text-[12px] uppercase tracking-wider`}>
                <tr>
                  {['Brand', 'Share of Voice', 'Sentiment', 'Momentum'].map((h) => (
                    <th key={h} className="px-6 py-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { brand: 'Zara',           sov: '32%', sent: '68/100', mom: '+4.2%', momColor: 'text-[#0071e3]', you: false },
                  { brand: 'Monzo',          sov: '28%', sent: '75/100', mom: '+2.1%', momColor: 'text-[#0071e3]', you: false },
                  { brand: 'Revolut',        sov: '22%', sent: '60/100', mom: '-1.0%', momColor: 'text-white/40',  you: false },
                  { brand: 'Hourbour (You)', sov: '18%', sent: '72/100', mom: '+0.5%', momColor: 'text-white/40',  you: true  },
                ].map((r) => (
                  <tr key={r.brand}
                    className={r.you ? 'bg-[#0071e3]/5 hover:bg-[#0071e3]/10 transition-colors border-l-2 border-[#0071e3]' : 'hover:bg-white/[0.02] transition-colors'}>
                    <td className="px-6 py-4 font-medium text-white">{r.brand}</td>
                    <td className="px-6 py-4 text-white/80">{r.sov}</td>
                    <td className="px-6 py-4 text-white/80">{r.sent}</td>
                    <td className={`px-6 py-4 ${r.momColor}`}>{r.mom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Winning Content Themes */}
        <section className="flex flex-col gap-6 mt-8">
          <h3 className="text-white text-[18px] font-medium border-b border-white/10 pb-3">Winning Content Themes</h3>
          <div className={`${s1} rounded-2xl overflow-hidden border border-white/5`}>
            <table className="w-full text-left text-[13px]">
              <thead className={`${s3} text-white/60 text-[11px] uppercase tracking-wider`}>
                <tr>
                  {['Rank','Theme','Owned By','Platform','Format','Engagement Quality','What It Means'].map((h) => (
                    <th key={h} className="px-6 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { rank:'#1', theme:'Founder-led Stories', by:'Monzo',    platform:'TikTok, LinkedIn', format:'Short Video',  eq:'Exceptional', eqColor:'text-[#0071e3]', meaning:'High trust, low barrier to entry. Needs authenticity.' },
                  { rank:'#2', theme:'Money Anxiety',        by:'Zara',     platform:'Instagram',        format:'Carousel',    eq:'High',         eqColor:'text-[#0071e3]', meaning:'Resonates heavily with Gen-Z. Requires empathetic tone.' },
                  { rank:'#3', theme:'Technical Explainers', by:'Revolut',  platform:'YouTube',          format:'Long Video',  eq:'Moderate',     eqColor:'text-white/80',  meaning:'Good for SEO, lower viral potential. Good for conversion.' },
                  { rank:'#4', theme:'Transparency',         by:'Hourbour', platform:'LinkedIn',         format:'Text Post',   eq:'Moderate',     eqColor:'text-white/80',  meaning:'Builds B2B credibility. Consistent performance.' },
                ].map((r) => (
                  <tr key={r.rank} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-white/40">{r.rank}</td>
                    <td className="px-6 py-4 font-medium text-white">{r.theme}</td>
                    <td className="px-6 py-4 text-white/80">{r.by}</td>
                    <td className="px-6 py-4 text-white/80">{r.platform}</td>
                    <td className="px-6 py-4 text-white/80">{r.format}</td>
                    <td className={`px-6 py-4 ${r.eqColor}`}>{r.eq}</td>
                    <td className="px-6 py-4 text-white/60">{r.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Platform Intelligence Breakdown */}
        <section className="flex flex-col gap-6 mt-8">
          <h3 className="text-white text-[18px] font-medium border-b border-white/10 pb-3">Platform Intelligence Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: 'photo_camera', iconColor: 'text-[#E1306C]', label: 'Instagram',
                rows: [['Top Competitor','Zara'],['Winning Format','Reels'],['Trend','Rising'],['Opportunity','Educational Carousels']],
                trendColor: 'text-[#0071e3]', rec: 'Recommended: Shift to static educational carousels.',
              },
              {
                icon: 'music_note', iconColor: 'text-[#00f2fe]', label: 'TikTok',
                rows: [['Top Competitor','Monzo'],['Winning Format','Trend/Audio'],['Trend','Peaking'],['Opportunity','Founder Vlogs']],
                trendColor: 'text-[#0071e3]', rec: 'Recommended: Double down on founder-led video.',
              },
              {
                icon: 'work', iconColor: 'text-[#0077b5]', label: 'LinkedIn',
                rows: [['Top Competitor','Revolut'],['Winning Format','Data Reports'],['Trend','Stable'],['Opportunity','Behind-the-scenes']],
                trendColor: 'text-white/60', rec: 'Recommended: Share culture and product workflows.',
              },
              {
                icon: 'play_circle', iconColor: 'text-[#FF0000]', label: 'YouTube',
                rows: [['Top Competitor','Revolut'],['Winning Format','Shorts'],['Trend','Declining (Long)'],['Opportunity','Deep-dive Explainers']],
                trendColor: 'text-white/60', rec: 'Recommended: Repurpose TikToks to Shorts.',
              },
            ].map((p) => (
              <div key={p.label} className={`${s2} rounded-xl p-5 border border-white/5 flex flex-col gap-4`}>
                <div className={`flex items-center gap-2 text-white font-medium`}>
                  <span className={`material-symbols-outlined text-[20px] ${p.iconColor}`}>{p.icon}</span>
                  {p.label}
                </div>
                <div className="space-y-3 text-[12px]">
                  {p.rows.map(([key, val], i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-white/40">{key}:</span>
                      <span className={key === 'Trend' ? p.trendColor : 'text-white'}>{val}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/5 text-[#0071e3]">{p.rec}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Performing Posts */}
        <section className="flex flex-col gap-6 mt-8">
          <h3 className="text-white text-[18px] font-medium border-b border-white/10 pb-3">Top Performing Posts</h3>
          <div className="flex flex-col gap-3">
            {[
              {
                rank: '#1', brand: 'Monzo', platform: 'TikTok', format: 'Short Video',
                title: '"We tried the envelope saving method so you don\'t have to"',
                why: 'Why it worked: High relatability, clear actionable hook, fast-paced editing.',
              },
              {
                rank: '#2', brand: 'Zara', platform: 'Instagram', format: 'Carousel',
                title: '"5 signs you\'re experiencing financial burnout"',
                why: 'Why it worked: Taps into current zeitgeist, highly shareable aesthetic.',
              },
            ].map((p) => (
              <div key={p.rank}
                className={`${s1} rounded-xl p-5 border border-white/5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between`}
                style={{ boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0px' }}>
                <div className="flex gap-4 items-start">
                  <div className="text-white/40 font-mono text-[14px] mt-1">{p.rank}</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="text-white font-medium">{p.brand}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-white/60">{p.platform}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-[#0071e3]">{p.format}</span>
                    </div>
                    <h4 className="text-white text-[15px] font-medium">{p.title}</h4>
                    <p className="text-white/60 text-[13px]">{p.why}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="bg-white/10 hover:bg-white/20 text-white text-[12px] px-4 py-2 rounded-lg transition-colors active:scale-95">Save Reference</button>
                  <button className="bg-[#0071e3]/20 hover:bg-[#0071e3]/30 text-[#0071e3] text-[12px] px-4 py-2 rounded-lg transition-colors active:scale-95">Create Brief</button>
                  <button className="bg-[#0071e3] hover:bg-[#0071e3]/90 text-white text-[12px] px-4 py-2 rounded-lg transition-colors active:scale-95">Build Response</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Content Opportunities for Hourbour */}
        <section className="flex flex-col gap-6 mt-8">
          <h3 className="text-white text-[18px] font-medium border-b border-white/10 pb-3">Content Opportunities for Hourbour</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                priority: 'P1 Priority', speed: 'Fast Execution', blue: true,
                title: 'Founder-led Security Explainers',
                platform: 'TikTok • Short Video',
                desc: 'Competitors focus heavily on lifestyle. The market lacks authentic, authoritative voices explaining safety protocols.',
              },
              {
                priority: 'P2 Priority', speed: 'Medium Execution', blue: false,
                title: 'Product Workflow Teardowns',
                platform: 'LinkedIn • Carousel/Text',
                desc: 'High demand for transparency in B2B fintech. Show how the product is built behind the scenes.',
              },
              {
                priority: 'P3 Priority', speed: 'Slow Execution', blue: false,
                title: 'Contrarian Market Analysis',
                platform: 'Newsletter / Blog',
                desc: 'Stand out from generic trend reporting by taking strong, data-backed stances against conventional wisdom.',
              },
            ].map((o) => (
              <div key={o.title}
                className={`${s1} rounded-2xl p-6 flex flex-col gap-4`}
                style={{ borderTop: `2px solid ${o.blue ? '#0071e3' : 'rgba(255,255,255,0.2)'}` }}>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded font-medium ${o.blue ? 'bg-[#0071e3]/20 text-[#0071e3]' : 'bg-white/10 text-white/80'}`}>
                    {o.priority}
                  </span>
                  <span className="text-white/40 text-[12px]">{o.speed}</span>
                </div>
                <div>
                  <h4 className="text-white text-[16px] font-medium mb-1">{o.title}</h4>
                  <div className="text-white/60 text-[12px] mb-3">{o.platform}</div>
                  <p className="text-white/70 text-[13px] leading-relaxed">{o.desc}</p>
                </div>
                <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                  <button className="flex-1 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white text-[13px] py-2 rounded-lg transition-colors active:scale-95">Create Brief</button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[13px] py-2 rounded-lg transition-colors active:scale-95">Add to Plan</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Next Best Moves */}
        <section className="flex flex-col gap-6 mt-8">
          <h3 className="text-white text-[18px] font-medium border-b border-white/10 pb-3">Next Best Moves</h3>
          <div className={`${s1} rounded-2xl p-2 border border-white/5`}>
            <div className="flex flex-col divide-y divide-white/5">
              {[
                { n: 1, blue: true,  title: 'Launch a founder-led TikTok series',     desc: "Capitalizes on the biggest whitespace in competitor strategy." },
                { n: 2, blue: false, title: "Counter Zara's \"Burnout\" campaign",     desc: 'Respond with a structural solution rather than just empathy.' },
                { n: 3, blue: false, title: 'Pause paid search on broad terms',        desc: "Following Revolut's lead, shift budget to high-intent long-tail keywords." },
                { n: 4, blue: false, title: 'Publish Q3 Product Roadmap',             desc: 'Increase transparency on LinkedIn to capture fleeing B2B interest.' },
                { n: 5, blue: false, title: 'Repurpose Web Copy for Shorts',          desc: 'Low effort test to gauge technical explainer traction on YouTube.' },
              ].map((m) => (
                <div key={m.n}
                  className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.02] transition-colors rounded-xl">
                  <div className="flex gap-4 items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[14px] ${m.blue ? 'bg-[#0071e3]/20 text-[#0071e3]' : 'bg-white/10 text-white/60'}`}>
                      {m.n}
                    </div>
                    <div>
                      <h4 className="text-white text-[15px] font-medium">{m.title}</h4>
                      <p className="text-white/60 text-[13px]">{m.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="bg-[#0071e3] hover:bg-[#0071e3]/90 text-white text-[12px] px-4 py-2 rounded-lg transition-colors active:scale-95">Create Brief</button>
                    <button className="bg-white/10 hover:bg-white/20 text-white text-[12px] px-4 py-2 rounded-lg transition-colors active:scale-95">Add to Plan</button>
                    <button className="text-white/40 hover:text-white px-2 active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-12 w-full max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px]">
        <div className="text-white/40">© 2024 YVON Intelligence. All rights reserved.</div>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Support'].map((l) => (
            <a key={l} href="#" className="text-white/40 hover:text-white transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}
