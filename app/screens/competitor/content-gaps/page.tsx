'use client';

import CompetitorSubNav from '../_subnav';

const DOT = ({ color }: { color: 'green' | 'yellow' | 'blue' | 'none' }) => {
  const cls = {
    green:  'bg-green-500',
    yellow: 'bg-yellow-500',
    blue:   'bg-[#0071e3] shadow-[0_0_8px_#0071e3]',
    none:   'bg-white/20',
  }[color];
  return <span className={`w-2 h-2 rounded-full inline-block ${cls}`} />;
};

export default function CompetitorContentGapsPage() {
  return (
    <main className="min-h-screen bg-black text-[#f5f5f7] antialiased flex flex-col pt-14">

      <CompetitorSubNav />

      <div className="flex-grow pt-8 pb-32 px-6 max-w-[1200px] mx-auto w-full">

        {/* Section 1: Hero Briefing */}
        <section className="mb-8">
          <div className="bg-[#1d1d1f] rounded-[2rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#0071e3]/10 to-transparent pointer-events-none opacity-50" />
            <div className="relative z-10">
              <h2 className="text-[40px] font-semibold text-white mb-4" style={{ lineHeight: '1.1', letterSpacing: '-0.01em' }}>
                Competitor. Close the gaps that matter.
              </h2>
              <p className="text-[21px] text-[#86868b] mb-10" style={{ lineHeight: '1.38' }}>
                3 priority moves recommended.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <div className="flex items-center gap-2 bg-black/50 rounded-full px-5 py-2.5">
                  <span className="material-symbols-outlined text-[#86868b] text-sm">radar</span>
                  <span className="text-sm font-medium text-white/80">Active Competitors (4)</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0071e3]/10 rounded-full px-5 py-2.5">
                  <span className="material-symbols-outlined text-[#0071e3] text-sm">warning</span>
                  <span className="text-sm font-medium text-[#0071e3]">High-Priority Gaps (2)</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-5 py-2.5">
                  <span className="material-symbols-outlined text-white text-sm">lightbulb</span>
                  <span className="text-sm font-medium text-white">Recommended Moves (3)</span>
                </div>
              </div>
              <button className="bg-[#0071e3] text-white font-medium px-8 py-4 rounded-full hover:opacity-90 transition-all flex items-center gap-2 text-[17px] active:scale-95">
                Generate Response Plan
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Response Cards */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { label: 'Borrow',       value: '1 Move',  blue: false },
            { label: 'Counter',      value: '1 Move',  blue: false },
            { label: 'Ignore',       value: '1 Area',  blue: false },
            { label: 'Urgent Gaps',  value: '2 Areas', blue: true  },
          ].map((c) => (
            <div key={c.label}
              className="bg-[#1d1d1f] rounded-[1.5rem] p-8 flex flex-col justify-between h-40 relative overflow-hidden"
              style={c.blue ? { background: 'linear-gradient(135deg, #1d1d1f, rgba(0,113,227,0.1))' } : {}}>
              {c.blue && (
                <div className="absolute right-0 bottom-0 p-4 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined" style={{ fontSize: 80 }}>warning</span>
                </div>
              )}
              <div className={`text-[12px] font-semibold uppercase tracking-wider relative z-10 ${c.blue ? 'text-[#0071e3]' : 'text-[#86868b]'}`}>
                {c.label}
              </div>
              <div className="text-[28px] font-semibold text-white relative z-10" style={{ lineHeight: '1.14', letterSpacing: '0.004em' }}>
                {c.value}
              </div>
            </div>
          ))}
        </section>

        {/* Section 3: Intelligence Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Competitor vs You */}
          <div className="lg:col-span-5 bg-[#1d1d1f] rounded-[2rem] overflow-hidden">
            <div className="p-8 pb-4">
              <h3 className="text-[24px] font-semibold text-white" style={{ lineHeight: '1.14', letterSpacing: '0.004em' }}>
                Competitor vs You
              </h3>
            </div>
            <div className="p-4">
              <table className="w-full text-left text-[15px]">
                <thead className="text-[#86868b]">
                  <tr>
                    <th className="font-medium py-4 px-6">Dimension</th>
                    <th className="font-medium py-4 px-6 text-[#0071e3]">You</th>
                    <th className="font-medium py-4 px-6">Novizio</th>
                    <th className="font-medium py-4 px-6">Reformotion</th>
                  </tr>
                </thead>
                <tbody className="text-[#f5f5f7]">
                  {[
                    { dim: 'IG Eng. Rate',    you: '1.2%', nov: '4.8%', ref: '2.1%', boldNov: true,  boldRef: false },
                    { dim: 'TikTok Vol',      you: 'Low',  nov: 'High', ref: 'Med',  boldNov: true,  boldRef: false },
                    { dim: 'Founder Content', you: 'None', nov: 'Weekly', ref: 'Monthly', boldNov: true, boldRef: false },
                    { dim: 'Transparency',    you: 'Basic', nov: 'Basic', ref: 'Full', boldNov: false, boldRef: true },
                  ].map((r) => (
                    <tr key={r.dim} className="hover:bg-white/5 transition-colors rounded-xl">
                      <td className="py-4 px-6 text-[#86868b] rounded-l-xl">{r.dim}</td>
                      <td className="py-4 px-6">{r.you}</td>
                      <td className={`py-4 px-6 ${r.boldNov ? 'font-semibold text-white bg-white/5' : ''}`}>{r.nov}</td>
                      <td className={`py-4 px-6 rounded-r-xl ${r.boldRef ? 'font-semibold text-white' : ''}`}>{r.ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Content Gap Analysis */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="mb-2 flex justify-between items-center px-2">
              <h3 className="text-[24px] font-semibold text-white" style={{ lineHeight: '1.14' }}>Content Gap Analysis</h3>
              <span className="text-sm font-medium text-[#86868b]">Prioritized descending</span>
            </div>

            {[
              {
                priority: 'High Priority', priorityColor: 'bg-red-500/10 text-red-500',
                title: 'Founder-led on Instagram', gapWith: 'Novizio', opacity: '',
                gap: "Novizio's CEO posts weekly behind-the-scenes insights driving 40% of their total engagement.",
                why: 'Humanizes the fintech brand, building trust critical for user acquisition.',
                firstMove: 'Launch weekly "Builder" stories.',
              },
              {
                priority: 'High Priority', priorityColor: 'bg-red-500/10 text-red-500',
                title: 'Supply chain transparency', gapWith: 'Reformotion', opacity: '',
                gap: 'Reformotion published a full interactive map of their data centers and carbon footprint.',
                why: 'Capturing the ESG-conscious investor segment currently ignoring YVON.',
                firstMove: 'Publish Q1 Sustainability Report.',
              },
              {
                priority: 'Medium Priority', priorityColor: 'bg-yellow-500/10 text-yellow-500',
                title: 'TikTok series format', gapWith: 'Novizio', opacity: 'opacity-75',
                gap: 'Consistent 3-part educational series on basic finance concepts.',
                why: 'Algorithmic advantage for sequential content consumption.',
                firstMove: 'Draft 3-part "Crypto Basics".',
              },
            ].map((g) => (
              <div key={g.title} className={`bg-[#1d1d1f] rounded-[2rem] p-8 flex flex-col gap-6 ${g.opacity}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full mb-4 ${g.priorityColor}`}>
                      {g.priority}
                    </span>
                    <h4 className="text-[28px] font-semibold text-white" style={{ lineHeight: '1.14', letterSpacing: '0.004em' }}>
                      {g.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[13px] font-medium text-[#86868b] block mb-1">Gap with</span>
                    <span className="text-[17px] font-semibold text-white">{g.gapWith}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mt-4">
                  <div>
                    <div className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-2">The Gap</div>
                    <p className="text-[15px] leading-relaxed text-[#f5f5f7]">{g.gap}</p>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest mb-2">Why It Matters</div>
                    <p className="text-[15px] leading-relaxed text-[#f5f5f7]">{g.why}</p>
                  </div>
                </div>
                <div className="mt-8 pt-6 flex justify-between items-center border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest">First Move:</span>
                    <span className="text-[15px] font-medium text-white">{g.firstMove}</span>
                  </div>
                  <div className="flex gap-4">
                    <button className="text-[15px] font-medium text-[#0071e3] bg-[#0071e3]/10 px-6 py-2.5 rounded-full hover:bg-[#0071e3]/20 transition-colors active:scale-95">
                      Add to Plan
                    </button>
                    <button className="text-[15px] font-medium text-white bg-[#0071e3] px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity active:scale-95">
                      Create Brief
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Priority Content Gaps */}
        <section className="mb-16">
          <div className="mb-6 px-2">
            <h3 className="text-[24px] font-semibold text-white" style={{ lineHeight: '1.14' }}>Priority Content Gaps</h3>
            <p className="text-sm font-medium text-[#86868b]">Ranked by opportunity score · untapped moves only</p>
          </div>
          <div className="bg-[#1d1d1f] rounded-[2rem] p-4 flex flex-col gap-2">
            {[
              { score: '9.2', scoreColor: 'text-[#0071e3]', title: '"First financial win" storytelling',        sub: 'Monzo (early stage)',   badge: 'Critical', badgeCls: 'bg-red-500/10 text-red-500'      },
              { score: '8.6', scoreColor: 'text-white',      title: 'Gen Z money anxiety content',              sub: 'Unclaimed',             badge: 'High',     badgeCls: 'bg-orange-500/10 text-orange-500' },
              { score: '8.0', scoreColor: 'text-white',      title: 'Feature education (unknown features)',     sub: 'Monzo (growing)',       badge: 'Act Soon', badgeCls: 'bg-yellow-500/10 text-yellow-500' },
              { score: '7.4', scoreColor: 'text-white/60',   title: 'International transfer savings calculator', sub: 'Revolut (TikTok)',     badge: 'Medium',   badgeCls: 'bg-white/10 text-white/80'        },
              { score: '6.8', scoreColor: 'text-white/60',   title: 'Small business finance tips',              sub: 'Unclaimed',             badge: 'Medium',   badgeCls: 'bg-white/10 text-white/80'        },
            ].map((r, i) => (
              <div key={r.score + r.title}
                className={`flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors ${i > 0 ? 'border-t border-white/5' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className={`font-semibold text-xl font-mono w-12 text-center ${r.scoreColor}`}>{r.score}</span>
                  <div>
                    <div className="text-white font-medium text-[17px]">{r.title}</div>
                    <div className="text-[#86868b] text-[14px]">{r.sub}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full ${r.badgeCls}`}>
                  {r.badge}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 & 7: Keyword Opportunity Matrix + Strategy Note */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="px-2">
              <h3 className="text-[24px] font-semibold text-white" style={{ lineHeight: '1.14' }}>Keyword Opportunity Matrix</h3>
              <p className="text-sm font-medium text-[#86868b]">Search volume + difficulty + competitor coverage + rankability</p>
            </div>
            <div className="bg-[#1d1d1f] rounded-[2rem] overflow-hidden p-4">
              <table className="w-full text-left text-[14px]">
                <thead className="text-[#86868b] border-b border-white/10">
                  <tr>
                    <th className="font-medium py-4 px-4">Keyword</th>
                    <th className="font-medium py-4 px-4 text-right">Vol/mo</th>
                    <th className="font-medium py-4 px-4 text-right">Diff</th>
                    <th className="font-medium py-4 px-4 text-center text-[#0071e3]">Hourbour</th>
                    <th className="font-medium py-4 px-4 text-center">Revolut</th>
                    <th className="font-medium py-4 px-4 text-center">Monzo</th>
                    <th className="font-medium py-4 px-4 text-center">Wise</th>
                    <th className="font-medium py-4 px-4 text-center">N26</th>
                  </tr>
                </thead>
                <tbody className="text-[#f5f5f7]">
                  {([
                    ['best app for saving money',        '12.4k', 72,  'none',  'green', 'green',  'none',  'yellow'],
                    ['fintech app uk 2026',              '5.2k',  45,  'none',  'yellow','green',  'none',  'none'  ],
                    ['international transfer free',      '24.1k', 88,  'none',  'green', 'yellow', 'green', 'none'  ],
                    ['money management app',             '18.9k', 82,  'none',  'green', 'green',  'none',  'yellow'],
                    ['neobank uk',                       '8.5k',  64,  'none',  'green', 'green',  'none',  'none'  ],
                    ['hourly savings tracker',           '1.2k',  22,  'blue',  'none',  'none',   'none',  'none'  ],
                  ] as [string, string, number, string, string, string, string, string][]).map(([kw, vol, diff, hrb, rev, mon, wis, n26]) => (
                    <tr key={kw} className="hover:bg-white/5 transition-colors border-t border-white/5 first:border-0">
                      <td className="py-4 px-4 text-white">{kw}</td>
                      <td className="py-4 px-4 text-right">{vol}</td>
                      <td className="py-4 px-4 text-right">{diff}</td>
                      <td className="py-4 px-4 text-center"><DOT color={hrb as 'green'|'yellow'|'blue'|'none'} /></td>
                      <td className="py-4 px-4 text-center"><DOT color={rev as 'green'|'yellow'|'blue'|'none'} /></td>
                      <td className="py-4 px-4 text-center"><DOT color={mon as 'green'|'yellow'|'blue'|'none'} /></td>
                      <td className="py-4 px-4 text-center"><DOT color={wis as 'green'|'yellow'|'blue'|'none'} /></td>
                      <td className="py-4 px-4 text-center"><DOT color={n26 as 'green'|'yellow'|'blue'|'none'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategy Note */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="px-2">
              <h3 className="text-[24px] font-semibold text-white" style={{ lineHeight: '1.14' }}>Zara · Keyword Strategy</h3>
              <p className="text-sm font-medium text-[#86868b] invisible">Placeholder</p>
            </div>
            <div className="bg-[#1d1d1f] rounded-[2rem] p-8 flex-1 flex flex-col justify-center">
              <span className="material-symbols-outlined text-[#0071e3] mb-6" style={{ fontSize: 32 }}>insights</span>
              <p className="text-[16px] leading-relaxed text-[#f5f5f7] mb-4">
                Hourbour is currently ranking for 0 non-branded keywords in the top 100 results, while Monzo and
                Revolut are capturing 85% of high-intent search traffic.
              </p>
              <p className="text-[16px] leading-relaxed text-[#f5f5f7]">
                <strong>Recommendation:</strong> We need to start with branded search capture to protect our existing
                funnel before expanding into competitive generic terms like &quot;neobank uk&quot;. Focus efforts on
                long-tail, low-difficulty feature keywords (e.g., &quot;hourly savings tracker&quot;) to build initial
                domain authority.
              </p>
            </div>
          </div>
        </section>

        {/* Section 8: Competitive Alerts */}
        <section className="mb-16">
          <div className="mb-6 px-2">
            <h3 className="text-[24px] font-semibold text-white" style={{ lineHeight: '1.14' }}>Competitive Alerts</h3>
            <p className="text-sm font-medium text-[#86868b]">Live competitor signals · updated daily</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { brand: 'Monzo',   borderColor: 'border-red-500',     badgeCls: 'bg-red-500/10 text-red-500',       badge: 'Watch', msg: 'Launched new "Family Accounts" feature landing page with massive ad spend.',           ago: '2 hours ago' },
              { brand: 'Revolut', borderColor: 'border-orange-500',  badgeCls: 'bg-orange-500/10 text-orange-500', badge: 'Watch', msg: 'Spike in TikTok mentions (+400%) regarding crypto withdrawal fees.',                    ago: '5 hours ago' },
              { brand: 'N26',     borderColor: 'border-[#0071e3]',   badgeCls: 'bg-[#0071e3]/10 text-[#0071e3]',  badge: 'Intel', msg: 'Published Q3 Transparency Report focusing on sustainable investments.',                 ago: '1 day ago'   },
              { brand: 'Market',  borderColor: 'border-purple-500',  badgeCls: 'bg-purple-500/10 text-purple-500', badge: 'Intel', msg: 'New regulatory keyword trends emerging around open banking APIs.',                      ago: '2 days ago'  },
            ].map((a) => (
              <div key={a.brand} className={`bg-[#1d1d1f] rounded-[1.5rem] p-6 border-t-2 ${a.borderColor}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[#86868b] text-[12px] font-semibold uppercase tracking-wider">{a.brand}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm ${a.badgeCls}`}>{a.badge}</span>
                </div>
                <p className="text-white text-[15px] font-medium leading-snug">{a.msg}</p>
                <div className="text-[#86868b] text-[12px] mt-4">{a.ago}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 9: Next Best Moves */}
        <section className="mb-16">
          <div className="mb-6 px-2">
            <h3 className="text-[24px] font-semibold text-white" style={{ lineHeight: '1.14' }}>Next Best Moves</h3>
            <p className="text-sm font-medium text-[#86868b]">Kai · recommended sequence for the next 14 days</p>
          </div>
          <div className="bg-[#1d1d1f] rounded-[2rem] p-8">
            <ol className="flex flex-col gap-6 mb-8">
              {[
                { n: 1, blue: true,  title: 'Launch weekly "Builder" stories on IG',              desc: "Direct counter to Novizio's founder-led strategy to humanize the brand." },
                { n: 2, blue: true,  title: 'Publish Q1 Sustainability Report',                   desc: 'Close the transparency gap with Reformotion and capture ESG-conscious users.' },
                { n: 3, blue: false, title: 'Draft 3-part "Crypto Basics" TikTok Series',         desc: 'Establish algorithmic momentum and sequential engagement.' },
                { n: 4, blue: false, title: 'Optimize landing page for "hourly savings tracker"', desc: 'Secure early organic traffic on a low-difficulty, high-relevance keyword.' },
              ].map((m) => (
                <li key={m.n} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${m.blue ? 'bg-[#0071e3]/20 text-[#0071e3]' : 'bg-white/10 text-white/80'}`}>
                    {m.n}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-[17px] mb-1">{m.title}</h4>
                    <p className="text-[#86868b] text-[14px]">{m.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex gap-4 pt-6 border-t border-white/10">
              <button className="bg-[#0071e3] text-white font-medium px-6 py-3 rounded-full hover:opacity-90 transition-opacity active:scale-95">Create Brief</button>
              <button className="bg-[#0071e3]/10 text-[#0071e3] font-medium px-6 py-3 rounded-full hover:bg-[#0071e3]/20 transition-colors active:scale-95">Add to Plan</button>
              <button className="bg-white/5 text-white/80 font-medium px-6 py-3 rounded-full hover:bg-white/10 transition-colors ml-auto active:scale-95">Dismiss</button>
            </div>
          </div>
        </section>

        {/* Section 10: Executive Readout */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-[#0071e3]/20 to-[#1d1d1f] border border-[#0071e3]/30 rounded-[2rem] p-8 flex items-start gap-6">
            <span className="material-symbols-outlined text-[#0071e3] mt-1 shrink-0" style={{ fontSize: 32 }}>auto_awesome</span>
            <div>
              <h3 className="text-[20px] font-semibold text-white mb-2" style={{ lineHeight: '1.14' }}>Executive Readout</h3>
              <p className="text-[16px] leading-relaxed text-[#f5f5f7]">
                Our primary vulnerability lies in <strong>narrative gaps</strong> rather than generic awareness. While
                competitors are winning on &quot;human&quot; elements (founder-led content, transparency), we have an
                immediate opening to dominate niche, high-intent spaces like automated tracking before attempting to
                displace established players in broad generic search.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-[#1d1d1f] border-t border-white/10 py-12 px-16 mt-auto">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">YVON</span>
            <span className="text-[#86868b] text-sm">© 2026 Strategy Platform. All rights reserved.</span>
          </div>
          <div className="flex gap-8 text-sm text-[#86868b]">
            {['Privacy Policy', 'Terms of Service', 'Legal', 'System Status'].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
