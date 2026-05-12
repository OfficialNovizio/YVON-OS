'use client';

import CompetitorSubNav from '../_subnav';

const s1 = 'bg-[#1d1d1f]';

type DotColor = 'green' | 'yellow' | 'blue' | 'none';
const DOT = ({ color }: { color: DotColor }) => {
  const cls: Record<DotColor, string> = {
    green:  'bg-emerald-500',
    yellow: 'bg-yellow-500',
    blue:   'bg-[#0071e3] shadow-[0_0_6px_#0071e3]',
    none:   'bg-white/15',
  };
  return <span className={`w-2 h-2 rounded-full inline-block ${cls[color]}`} />;
};

const keywords = [
  { kw: 'best hourly savings app',        vol: '2.4k',  diff: 18, intent: 'High',   hrb: 'blue',   rev: 'none',  mon: 'none',  wis: 'none',  gap: true  },
  { kw: 'automatic savings tracker uk',   vol: '4.1k',  diff: 32, intent: 'High',   hrb: 'none',   rev: 'yellow',mon: 'green', wis: 'none',  gap: true  },
  { kw: 'best app for saving money',      vol: '12.4k', diff: 72, intent: 'High',   hrb: 'none',   rev: 'green', mon: 'green', wis: 'none',  gap: true  },
  { kw: 'neobank uk 2026',               vol: '8.5k',  diff: 64, intent: 'Med',    hrb: 'none',   rev: 'green', mon: 'green', wis: 'none',  gap: true  },
  { kw: 'international transfer free',    vol: '24.1k', diff: 88, intent: 'High',   hrb: 'none',   rev: 'green', mon: 'yellow',wis: 'green', gap: true  },
  { kw: 'fintech app uk',                vol: '5.2k',  diff: 45, intent: 'Med',    hrb: 'none',   rev: 'yellow',mon: 'green', wis: 'none',  gap: true  },
  { kw: 'hourly savings tracker',         vol: '1.2k',  diff: 22, intent: 'High',   hrb: 'blue',   rev: 'none',  mon: 'none',  wis: 'none',  gap: false },
  { kw: 'money management app',           vol: '18.9k', diff: 82, intent: 'High',   hrb: 'none',   rev: 'green', mon: 'green', wis: 'none',  gap: true  },
];

const trending = [
  { kw: 'ai savings app',         change: '+340%', badge: 'Surging',  badgeCls: 'bg-emerald-500/10 text-emerald-400' },
  { kw: 'open banking uk',        change: '+185%', badge: 'Rising',   badgeCls: 'bg-[#0071e3]/10 text-[#0071e3]'    },
  { kw: 'ethical fintech',        change: '+92%',  badge: 'Rising',   badgeCls: 'bg-[#0071e3]/10 text-[#0071e3]'    },
  { kw: 'crypto savings account', change: '-44%',  badge: 'Falling',  badgeCls: 'bg-white/10 text-white/50'         },
];

export default function CompetitorKeywordsPage() {
  const gapCount = keywords.filter((k) => k.gap && k.hrb === 'none').length;
  const ownedCount = keywords.filter((k) => k.hrb !== 'none').length;

  return (
    <main className="min-h-screen bg-black text-[#f5f5f7] antialiased flex flex-col pt-14">
      <CompetitorSubNav />

      <div className="flex-grow pt-8 pb-24 px-6 max-w-[1200px] mx-auto w-full flex flex-col gap-10">

        {/* KPI row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Keywords Tracked',    value: keywords.length, icon: 'manage_search',  color: 'text-white' },
            { label: 'You Own',             value: ownedCount,      icon: 'verified',        color: 'text-[#0071e3]' },
            { label: 'Gap Opportunities',   value: gapCount,        icon: 'arrow_upward',    color: 'text-emerald-400' },
            { label: 'Avg Difficulty',      value: '53',            icon: 'speed',           color: 'text-yellow-400' },
          ].map((k) => (
            <div key={k.label} className={`${s1} rounded-2xl p-6 flex flex-col gap-3 border border-white/5`}>
              <div className="flex justify-between items-center text-white/50">
                <span className="text-[12px] uppercase tracking-wider font-medium">{k.label}</span>
                <span className={`material-symbols-outlined text-[18px] ${k.color}`}>{k.icon}</span>
              </div>
              <div className={`text-[32px] font-semibold leading-none ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </section>

        {/* Main grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Keyword table */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-white text-[18px] font-semibold" style={{ letterSpacing: '-0.28px' }}>Keyword Matrix</h2>
                <p className="text-white/40 text-[12px] mt-0.5">Volume + difficulty + competitor coverage</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/40">
                <span className="flex items-center gap-1.5"><DOT color="blue" /> You</span>
                <span className="flex items-center gap-1.5"><DOT color="green" /> Competitor</span>
                <span className="flex items-center gap-1.5"><DOT color="yellow" /> Partial</span>
                <span className="flex items-center gap-1.5"><DOT color="none" /> Missing</span>
              </div>
            </div>

            <div className={`${s1} rounded-2xl overflow-hidden border border-white/5`}>
              <table className="w-full text-left text-[13px]">
                <thead className="text-white/40 text-[11px] uppercase tracking-wider border-b border-white/5">
                  <tr>
                    <th className="px-5 py-4 font-medium">Keyword</th>
                    <th className="px-4 py-4 font-medium text-right">Vol/mo</th>
                    <th className="px-4 py-4 font-medium text-right">Diff</th>
                    <th className="px-4 py-4 font-medium text-center text-[#0071e3]">You</th>
                    <th className="px-4 py-4 font-medium text-center">Rev</th>
                    <th className="px-4 py-4 font-medium text-center">Mon</th>
                    <th className="px-4 py-4 font-medium text-center">Wise</th>
                    <th className="px-4 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {keywords.map((r) => (
                    <tr key={r.kw} className={`hover:bg-white/[0.03] transition-colors group ${r.gap && r.hrb === 'none' ? 'border-l-2 border-l-emerald-500/40' : ''}`}>
                      <td className="px-5 py-3.5 text-white font-medium">{r.kw}</td>
                      <td className="px-4 py-3.5 text-right text-white/60">{r.vol}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`text-[12px] font-medium ${r.diff < 40 ? 'text-emerald-400' : r.diff < 70 ? 'text-yellow-400' : 'text-rose-400'}`}>
                          {r.diff}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center"><DOT color={r.hrb as DotColor} /></td>
                      <td className="px-4 py-3.5 text-center"><DOT color={r.rev as DotColor} /></td>
                      <td className="px-4 py-3.5 text-center"><DOT color={r.mon as DotColor} /></td>
                      <td className="px-4 py-3.5 text-center"><DOT color={r.wis as DotColor} /></td>
                      <td className="px-4 py-3.5 text-right">
                        {r.gap && r.hrb === 'none' && (
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium text-[#0071e3] bg-[#0071e3]/10 hover:bg-[#0071e3]/20 px-2.5 py-1 rounded-lg active:scale-95">
                            Target
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">

            {/* Trending */}
            <div className="flex flex-col gap-3">
              <h2 className="text-white text-[18px] font-semibold" style={{ letterSpacing: '-0.28px' }}>Trending This Week</h2>
              <div className="flex flex-col gap-2">
                {trending.map((t) => (
                  <div key={t.kw} className={`${s1} rounded-xl p-4 border border-white/5 flex justify-between items-center`}>
                    <div>
                      <div className="text-white text-[14px] font-medium">{t.kw}</div>
                      <div className={`text-[11px] font-medium mt-0.5 ${t.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{t.change} searches</div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${t.badgeCls}`}>{t.badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategy note */}
            <div className="bg-gradient-to-b from-[#0071e3]/10 to-[#1d1d1f] rounded-2xl p-6 border border-[#0071e3]/20 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0071e3] text-[20px]">insights</span>
                <span className="text-white text-[14px] font-semibold">Kai&apos;s Recommendation</span>
              </div>
              <p className="text-white/70 text-[13px] leading-relaxed">
                You currently rank for <strong className="text-white">0 non-branded keywords</strong> in top 100 results.
                Start with low-difficulty long-tail terms like <em className="text-[#0071e3]">&quot;hourly savings tracker&quot;</em> to
                build domain authority before targeting high-volume competitive terms.
              </p>
              <button className="mt-1 text-[#0071e3] text-[13px] font-medium flex items-center gap-1 hover:underline active:scale-95">
                Build keyword plan
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            {/* Quick actions */}
            <div className={`${s1} rounded-2xl p-5 border border-white/5 flex flex-col gap-3`}>
              <h3 className="text-white text-[14px] font-semibold">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Export keyword gaps CSV',      icon: 'download' },
                  { label: 'Add keyword to tracking',      icon: 'add_circle' },
                  { label: 'Create content brief from gap', icon: 'description' },
                ].map((a) => (
                  <button key={a.label}
                    className="flex items-center gap-3 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors px-3 py-2.5 rounded-lg text-left active:scale-95">
                    <span className="material-symbols-outlined text-[16px] text-white/40">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Top keyword gaps */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-white text-[18px] font-semibold" style={{ letterSpacing: '-0.28px' }}>Priority Keyword Gaps</h2>
            <p className="text-white/40 text-[12px] mt-0.5">High-opportunity terms competitors own &mdash; you don&apos;t</p>
          </div>
          <div className={`${s1} rounded-2xl p-3 border border-white/5`}>
            <div className="flex flex-col divide-y divide-white/5">
              {[
                { score: '9.1', kw: 'automatic savings tracker uk',  vol: '4.1k', why: 'High intent, low competition, directly maps to your core product.',        platform: 'Organic + Blog'   },
                { score: '8.7', kw: 'best hourly savings app',        vol: '2.4k', why: 'Branded long-tail — own this before competitors colonise it.',             platform: 'Organic + ASO'    },
                { score: '8.2', kw: 'ai savings app',                 vol: '2.1k', why: 'Surging 340% — early mover advantage still available.',                   platform: 'Blog + Social'    },
                { score: '7.5', kw: 'neobank uk 2026',               vol: '8.5k', why: 'Competitors rank here; requires content investment but high payoff.',       platform: 'SEO'              },
              ].map((r) => (
                <div key={r.kw} className="flex items-center justify-between px-4 py-4 hover:bg-white/[0.02] transition-colors rounded-xl group">
                  <div className="flex items-center gap-4">
                    <span className="text-[#0071e3] font-semibold font-mono text-[16px] w-10 text-center">{r.score}</span>
                    <div>
                      <div className="text-white font-medium text-[15px]">{r.kw}</div>
                      <div className="text-white/40 text-[12px] mt-0.5">{r.why}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-white/40 text-[12px] hidden md:block">{r.vol}/mo · {r.platform}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#0071e3] hover:bg-[#0071e3]/90 text-white text-[12px] px-3 py-1.5 rounded-lg active:scale-95">
                      Create Brief
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      <footer className="border-t border-white/10 py-8 px-6 max-w-[1200px] mx-auto w-full flex justify-between items-center text-[12px] text-white/30">
        <span>© 2026 YVON Intelligence. All rights reserved.</span>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Support'].map((l) => (
            <a key={l} href="#" className="hover:text-white/60 transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}
