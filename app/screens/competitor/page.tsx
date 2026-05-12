'use client';

import CompetitorSubNav from './_subnav';

export default function CompetitorPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col antialiased pb-0 pt-14">

      <CompetitorSubNav />

      {/* Canvas */}
      <div className="flex-grow w-full max-w-[1200px] mx-auto px-6 py-12 flex flex-col gap-8">

        {/* Hero Brief Card */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#272729]/60 backdrop-blur-2xl border border-white/10 p-10 flex flex-col gap-6 group">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[80px] pointer-events-none bg-[#0071e3]/20 group-hover:bg-[#0071e3]/30 transition-colors duration-700" />
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#0071e3] text-white text-[10px] font-bold uppercase tracking-widest">
                Intelligence Brief
              </span>
              <span className="text-white/40 text-sm" style={{ letterSpacing: '-0.374px' }}>Q3 Market Shifts</span>
            </div>
            <h2 className="text-[40px] font-semibold text-white mb-6"
              style={{ lineHeight: '1.07', letterSpacing: '-0.28px' }}>
              Zara and Monzo capture{' '}
              <span className="text-[#0071e3]">42%</span>{' '}
              of Gen-Z engagement across primary social channels.
            </h2>
            <div className="p-5 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md flex gap-4 items-start">
              <span className="material-symbols-outlined text-[#ffb693] mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                lightbulb
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1" style={{ letterSpacing: '-0.374px' }}>
                  Critical Opportunity for Hourbour
                </h3>
                <p className="text-white/70 text-sm leading-relaxed" style={{ letterSpacing: '-0.374px' }}>
                  Competitor absence on TikTok leaves a 1.2M view gap in short-form technical content.
                  Immediate activation recommended in the Creative Studio.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Share of Voice', icon: 'record_voice_over',
              value: '34.2%', trendColor: 'text-emerald-400', trendIcon: 'trending_up', trend: '+2.4% vs last mo',
            },
            {
              label: 'Sentiment Score', icon: 'mood',
              value: <span>7.2<span className="text-lg text-white/40">/10</span></span>,
              trendColor: 'text-white/40', trendIcon: 'horizontal_rule', trend: 'Neutral trend',
            },
            {
              label: 'Content Velocity', icon: 'bolt',
              value: <span>14<span className="text-lg text-white/40"> posts/wk</span></span>,
              trendColor: 'text-rose-400', trendIcon: 'trending_down', trend: '-3 vs category avg',
            },
            {
              label: 'Avg. Engagement', icon: 'favorite',
              value: '4.8%', trendColor: 'text-emerald-400', trendIcon: 'trending_up', trend: 'Top quartile',
            },
          ].map((k, i) => (
            <div key={i}
              className="rounded-2xl bg-[#1d1d1f] border border-white/5 p-6 flex flex-col gap-3 hover:bg-[#272729] transition-colors duration-300">
              <div className="flex justify-between items-center text-white/60">
                <span className="text-sm font-medium" style={{ letterSpacing: '-0.374px' }}>{k.label}</span>
                <span className="material-symbols-outlined text-[18px]">{k.icon}</span>
              </div>
              <div className="text-[32px] font-semibold leading-none text-white" style={{ letterSpacing: '-0.28px' }}>
                {k.value}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${k.trendColor}`}>
                <span className="material-symbols-outlined text-[14px]">{k.trendIcon}</span>
                <span>{k.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Grid: Matrix & Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Competitor Matrix Table */}
          <div className="rounded-2xl bg-[#1d1d1f] border border-white/5 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>Top Competitors</h3>
              <button className="text-sm text-[#0071e3] hover:text-white transition-colors duration-200">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-white/40 border-b border-white/10" style={{ letterSpacing: '-0.374px' }}>
                    <th className="pb-3 font-medium">Brand</th>
                    <th className="pb-3 font-medium">Share of Voice</th>
                    <th className="pb-3 font-medium">Sentiment</th>
                    <th className="pb-3 font-medium text-right">Momentum</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-white" style={{ letterSpacing: '-0.374px' }}>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">Z</div>
                        Zara
                      </div>
                    </td>
                    <td className="py-4">24.5%</td>
                    <td className="py-4 text-emerald-400">Positive</td>
                    <td className="py-4 text-right">
                      <span className="material-symbols-outlined text-[18px] text-emerald-400">arrow_upward</span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#0071e3] text-white flex items-center justify-center text-[10px] font-bold">M</div>
                        Monzo
                      </div>
                    </td>
                    <td className="py-4">17.8%</td>
                    <td className="py-4 text-emerald-400">Positive</td>
                    <td className="py-4 text-right">
                      <span className="material-symbols-outlined text-[18px] text-emerald-400">arrow_upward</span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">R</div>
                        Revolut
                      </div>
                    </td>
                    <td className="py-4">12.1%</td>
                    <td className="py-4 text-white/60">Neutral</td>
                    <td className="py-4 text-right">
                      <span className="material-symbols-outlined text-[18px] text-white/40">arrow_forward</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium text-white/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[10px] font-bold">H</div>
                        Hourbour
                      </div>
                    </td>
                    <td className="py-4 text-white/50">8.4%</td>
                    <td className="py-4 text-rose-400">Needs Focus</td>
                    <td className="py-4 text-right">
                      <span className="material-symbols-outlined text-[18px] text-rose-400">arrow_downward</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Market Positioning Chart */}
          <div className="rounded-2xl bg-[#1d1d1f] border border-white/5 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>Market Positioning</h3>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#0071e3]" />
                  High Intent
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  Mass Market
                </span>
              </div>
            </div>
            <div className="flex-grow relative bg-black/50 rounded-xl border border-white/5 mt-2 min-h-[240px] overflow-hidden">
              {/* Grid */}
              <div className="absolute inset-0"
                style={{ backgroundImage: 'linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
              {/* Axis labels */}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/30 uppercase tracking-widest">
                Brand Reach →
              </span>
              <span className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 text-[10px] text-white/30 uppercase tracking-widest origin-left">
                Engagement →
              </span>
              {/* Zara */}
              <div className="absolute top-[20%] right-[15%] w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs font-medium text-white hover:scale-110 transition-transform cursor-pointer"
                style={{ boxShadow: '0 0 15px rgba(255,255,255,0.05)' }}>
                Zara
              </div>
              {/* Monzo */}
              <div className="absolute top-[10%] left-[40%] w-20 h-20 rounded-full bg-[#0071e3]/80 backdrop-blur-md border border-[#0071e3] flex items-center justify-center text-sm font-bold text-white hover:scale-110 transition-transform cursor-pointer"
                style={{ boxShadow: '0 0 20px rgba(0,113,227,0.3)' }}>
                Monzo
              </div>
              {/* Revolut */}
              <div className="absolute top-[40%] right-[30%] w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-medium text-white/70 hover:scale-110 transition-transform cursor-pointer">
                Rev
              </div>
              {/* Hourbour */}
              <div className="absolute bottom-[25%] left-[20%] w-14 h-14 rounded-full bg-black border border-dashed border-white/40 flex items-center justify-center text-[11px] font-medium text-white/50 hover:border-white transition-colors cursor-pointer group">
                Hourbour
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Opportunity Gap
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full py-8 px-6 flex justify-between items-center max-w-[1200px] mx-auto border-t border-white/10 mt-auto">
        <div className="text-white/40 font-bold text-[12px]">© 2024 YVON Intelligence. All rights reserved.</div>
        <ul className="flex items-center gap-6 text-[12px] text-white/40">
          {['Privacy Policy', 'Terms of Service', 'Support'].map((l) => (
            <li key={l}>
              <a href="#" className="hover:text-[#0071e3] underline transition-colors">{l}</a>
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
}
