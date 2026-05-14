'use client';

import { useState } from 'react';
import CompetitorSubNav from '../_subnav';

const s1 = 'bg-[#1d1d1f]';

type Alert = {
  id: number;
  brand: string;
  category: 'Campaign' | 'Sentiment' | 'Feature' | 'Viral' | 'Market';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  detail: string;
  ago: string;
  read: boolean;
  action?: string;
};

const ALERTS: Alert[] = [
  {
    id: 1, brand: 'Monzo', category: 'Campaign', severity: 'Critical',
    title: 'Monzo launched "Family Accounts" with heavy paid spend',
    detail: 'New product page live + Meta/TikTok ad campaigns detected. Estimated spend $40k/day. Directly targets your core segment.',
    ago: '1 hour ago', read: false, action: 'Create Counter Brief',
  },
  {
    id: 2, brand: 'Revolut', category: 'Sentiment', severity: 'High',
    title: 'Revolut TikTok mentions spiked +400% on crypto fees',
    detail: 'Negative sentiment wave following hidden withdrawal fee disclosure. Opportunity to position Hourbour on transparency.',
    ago: '3 hours ago', read: false, action: 'Draft Response',
  },
  {
    id: 3, brand: 'Zara', category: 'Viral', severity: 'High',
    title: 'Zara reel on "money anxiety" hit 2.8M views',
    detail: 'Carousel format on Instagram. Gen-Z resonance extremely high. Theme: emotional framing + action CTA. Highest engagement post this month.',
    ago: '5 hours ago', read: false, action: 'Create Brief',
  },
  {
    id: 4, brand: 'N26', category: 'Feature', severity: 'Medium',
    title: 'N26 released Q3 Sustainability Report',
    detail: 'Full interactive carbon footprint map published. Gaining traction with ESG-conscious users. Content gap identified.',
    ago: '1 day ago', read: true,
  },
  {
    id: 5, brand: 'Market', category: 'Market', severity: 'Medium',
    title: 'Regulatory keyword surge: "open banking APIs"',
    detail: 'New FCA consultation paper driving +185% search volume on open banking terms. Early SEO opportunity.',
    ago: '2 days ago', read: true, action: 'Target Keywords',
  },
  {
    id: 6, brand: 'Wise', category: 'Campaign', severity: 'Low',
    title: 'Wise started YouTube Shorts test series',
    detail: 'Low production quality but high frequency. Format: 15–30s explainers on transfer fees. Still in early stage.',
    ago: '3 days ago', read: true,
  },
];

const severityConfig = {
  Critical: { badge: 'bg-red-500/15 text-red-400',    border: 'border-l-red-500',    dot: 'bg-red-500'    },
  High:     { badge: 'bg-orange-500/15 text-orange-400', border: 'border-l-orange-500', dot: 'bg-orange-500' },
  Medium:   { badge: 'bg-yellow-500/15 text-yellow-400', border: 'border-l-yellow-400', dot: 'bg-yellow-400' },
  Low:      { badge: 'bg-white/10 text-white/50',     border: 'border-l-white/20',   dot: 'bg-white/30'   },
};

const categoryIcon: Record<Alert['category'], string> = {
  Campaign: 'campaign',
  Sentiment: 'mood',
  Feature: 'new_releases',
  Viral: 'trending_up',
  Market: 'public',
};

export default function CompetitorAlertsPage() {
  const [filter, setFilter] = useState<'All' | 'Unread' | Alert['category']>('All');
  const [dismissed, setDismissed] = useState<number[]>([]);

  const categories: (Alert['category'] | 'All' | 'Unread')[] = ['All', 'Unread', 'Campaign', 'Sentiment', 'Feature', 'Viral', 'Market'];

  const visible = ALERTS.filter((a) => {
    if (dismissed.includes(a.id)) return false;
    if (filter === 'All') return true;
    if (filter === 'Unread') return !a.read;
    return a.category === filter;
  });

  const unreadCount = ALERTS.filter((a) => !a.read && !dismissed.includes(a.id)).length;

  return (
    <main className="min-h-screen bg-black text-[#f5f5f7] antialiased flex flex-col pt-14">
      <CompetitorSubNav />

      <div className="flex-grow pt-8 pb-24 px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto w-full flex flex-col gap-8">

        {/* Summary KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Unread Alerts',   value: unreadCount, icon: 'notifications_active', color: 'text-[#0071e3]' },
            { label: 'Critical / High', value: ALERTS.filter(a => ['Critical','High'].includes(a.severity)).length, icon: 'warning', color: 'text-orange-400' },
            { label: 'Competitors',     value: [...new Set(ALERTS.map(a => a.brand))].length, icon: 'radar', color: 'text-white' },
            { label: 'Last 7 Days',     value: ALERTS.length, icon: 'history', color: 'text-white/60' },
          ].map((k) => (
            <div key={k.label} className={`${s1} rounded-2xl p-5 flex flex-col gap-3 border border-white/5`}>
              <div className="flex justify-between items-center text-white/40">
                <span className="text-[11px] uppercase tracking-wider font-medium">{k.label}</span>
                <span className={`material-symbols-outlined text-[18px] ${k.color}`}>{k.icon}</span>
              </div>
              <div className={`text-[30px] font-semibold leading-none ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </section>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c as typeof filter)}
              className={[
                'px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors active:scale-95',
                filter === c
                  ? 'bg-[#0071e3] text-white'
                  : 'bg-[#1d1d1f] text-white/50 hover:text-white hover:bg-white/10',
              ].join(' ')}
            >
              {c}
              {c === 'Unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Alert feed */}
        <section className="flex flex-col gap-3">
          {visible.length === 0 && (
            <div className={`${s1} rounded-2xl p-12 border border-white/5 flex flex-col items-center gap-3 text-center`}>
              <span className="material-symbols-outlined text-[40px] text-white/20">notifications_off</span>
              <p className="text-white/40 text-[14px]">No alerts in this category.</p>
            </div>
          )}

          {visible.map((alert) => {
            const cfg = severityConfig[alert.severity];
            return (
              <div
                key={alert.id}
                className={[
                  `${s1} rounded-2xl p-6 border border-white/5 border-l-4 ${cfg.border}`,
                  alert.read ? 'opacity-60' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px] text-white/60">{categoryIcon[alert.category]}</span>
                    </div>
                    {/* Content */}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">{alert.brand}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {alert.severity}
                        </span>
                        <span className="text-white/30 text-[11px]">{alert.category}</span>
                        {!alert.read && <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />}
                      </div>
                      <h3 className="text-white text-[15px] font-medium leading-snug">{alert.title}</h3>
                      <p className="text-white/50 text-[13px] leading-relaxed">{alert.detail}</p>
                      <span className="text-white/30 text-[11px] mt-1">{alert.ago}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {alert.action && (
                      <button className="text-[12px] font-medium text-white bg-[#0071e3] hover:bg-[#0071e3]/90 px-4 py-2 rounded-xl transition-colors active:scale-95 whitespace-nowrap">
                        {alert.action}
                      </button>
                    )}
                    <button
                      onClick={() => setDismissed((d) => [...d, alert.id])}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors active:scale-95"
                      title="Dismiss"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Alert settings panel */}
        <section className="flex flex-col gap-4 mt-4">
          <h2 className="text-white text-[18px] font-semibold" style={{ letterSpacing: '-0.28px' }}>Alert Settings</h2>
          <div className={`${s1} rounded-2xl p-6 border border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
            {[
              { label: 'Campaign Launches',   desc: 'New ad campaigns or product pages detected',    enabled: true  },
              { label: 'Sentiment Shifts',    desc: 'Significant positive or negative brand spikes',  enabled: true  },
              { label: 'Viral Content',       desc: 'Posts exceeding 2× average engagement',         enabled: true  },
              { label: 'New Features',        desc: 'Product updates or new landing pages',           enabled: true  },
              { label: 'Keyword Movements',   desc: 'Competitors entering or leaving keyword ranks',  enabled: false },
              { label: 'Market Signals',      desc: 'Industry trends and regulatory changes',         enabled: false },
            ].map((s) => (
              <div key={s.label} className="flex items-start gap-3">
                <div className={[
                  'w-10 h-6 rounded-full relative mt-0.5 cursor-pointer transition-colors shrink-0',
                  s.enabled ? 'bg-[#0071e3]' : 'bg-white/15',
                ].join(' ')}>
                  <div className={[
                    'w-4 h-4 rounded-full bg-white absolute top-1 transition-all',
                    s.enabled ? 'left-5' : 'left-1',
                  ].join(' ')} />
                </div>
                <div>
                  <div className="text-white text-[14px] font-medium">{s.label}</div>
                  <div className="text-white/40 text-[12px] mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <footer className="border-t border-white/10 py-8 px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto w-full flex justify-between items-center text-[12px] text-white/30">
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
