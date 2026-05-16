'use client';

import { useState } from 'react';
import CompetitorSubNav from '../_subnav';

// ── Glass variants ──────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';

const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';

const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

// ── Types ───────────────────────────────────────────────────────────────────────
type AlertCategory = 'Campaign' | 'Sentiment' | 'Feature' | 'Viral' | 'Market';
type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
type FilterOption  = 'All' | 'Unread' | AlertCategory;

type Alert = {
  id: number;
  brand: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  detail: string;
  ago: string;
  read: boolean;
  action?: string;
};

// ── Data ────────────────────────────────────────────────────────────────────────
const ALERTS: Alert[] = [
  { id: 1, brand: 'Monzo',  category: 'Campaign',  severity: 'Critical', title: 'Monzo launched "Family Accounts" with heavy paid spend',          detail: 'New product page live + Meta/TikTok ad campaigns detected. Estimated spend $40k/day. Directly targets your core segment.',               ago: '1 hour ago',  read: false, action: 'Create Counter Brief' },
  { id: 2, brand: 'Revolut',category: 'Sentiment', severity: 'High',     title: 'Revolut TikTok mentions spiked +400% on crypto fees',             detail: 'Negative sentiment wave following hidden withdrawal fee disclosure. Opportunity to position Hourbour on transparency.',                  ago: '3 hours ago', read: false, action: 'Draft Response'      },
  { id: 3, brand: 'Zara',   category: 'Viral',     severity: 'High',     title: 'Zara reel on "money anxiety" hit 2.8M views',                     detail: 'Carousel format on Instagram. Gen-Z resonance extremely high. Theme: emotional framing + action CTA. Highest engagement post this month.',ago: '5 hours ago', read: false, action: 'Create Brief'        },
  { id: 4, brand: 'N26',    category: 'Feature',   severity: 'Medium',   title: 'N26 released Q3 Sustainability Report',                           detail: 'Full interactive carbon footprint map published. Gaining traction with ESG-conscious users. Content gap identified.',                   ago: '1 day ago',   read: true                        },
  { id: 5, brand: 'Market', category: 'Market',    severity: 'Medium',   title: 'Regulatory keyword surge: "open banking APIs"',                   detail: 'New FCA consultation paper driving +185% search volume on open banking terms. Early SEO opportunity.',                                  ago: '2 days ago',  read: true,  action: 'Target Keywords'    },
  { id: 6, brand: 'Wise',   category: 'Campaign',  severity: 'Low',      title: 'Wise started YouTube Shorts test series',                         detail: 'Low production quality but high frequency. Format: 15–30s explainers on transfer fees. Still in early stage.',                           ago: '3 days ago',  read: true                        },
];

const severityConfig: Record<AlertSeverity, { borderColor: string; badgeColor: string; badgeBg: string; dotColor: string }> = {
  Critical: { borderColor: '#f87171', badgeColor: 'text-red-500',    badgeBg: 'rgba(239,68,68,0.10)',    dotColor: '#f87171' },
  High:     { borderColor: '#fb923c', badgeColor: 'text-orange-500', badgeBg: 'rgba(249,115,22,0.10)',   dotColor: '#fb923c' },
  Medium:   { borderColor: '#fbbf24', badgeColor: 'text-amber-500',  badgeBg: 'rgba(245,158,11,0.10)',   dotColor: '#fbbf24' },
  Low:      { borderColor: L1,        badgeColor: '',                 badgeBg: L1,                        dotColor: I1d       },
};

const categoryIcon: Record<AlertCategory, string> = {
  Campaign: 'campaign', Sentiment: 'mood', Feature: 'new_releases', Viral: 'trending_up', Market: 'public',
};

const alertSettings = [
  { label: 'Campaign Launches',  desc: 'New ad campaigns or product pages detected',    enabled: true  },
  { label: 'Sentiment Shifts',   desc: 'Significant positive or negative brand spikes',  enabled: true  },
  { label: 'Viral Content',      desc: 'Posts exceeding 2× average engagement',         enabled: true  },
  { label: 'New Features',       desc: 'Product updates or new landing pages',           enabled: true  },
  { label: 'Keyword Movements',  desc: 'Competitors entering or leaving keyword ranks',  enabled: false },
  { label: 'Market Signals',     desc: 'Industry trends and regulatory changes',         enabled: false },
];

// ── Page ────────────────────────────────────────────────────────────────────────
export default function CompetitorAlertsPage() {
  const [filter, setFilter]       = useState<FilterOption>('All');
  const [dismissed, setDismissed] = useState<number[]>([]);

  const categories: FilterOption[] = ['All', 'Unread', 'Campaign', 'Sentiment', 'Feature', 'Viral', 'Market'];
  const unreadCount = ALERTS.filter(a => !a.read && !dismissed.includes(a.id)).length;

  const visible = ALERTS.filter(a => {
    if (dismissed.includes(a.id)) return false;
    if (filter === 'All')    return true;
    if (filter === 'Unread') return !a.read;
    return a.category === filter;
  });

  const summaryKpis = [
    { label: 'Unread Alerts',   value: unreadCount,                                                         icon: 'notifications_active', valueColor: ACCENT     },
    { label: 'Critical / High', value: ALERTS.filter(a => ['Critical','High'].includes(a.severity)).length, icon: 'warning',              valueColor: '#fb923c'  },
    { label: 'Competitors',     value: [...new Set(ALERTS.map(a => a.brand))].length,                        icon: 'radar',                valueColor: I4         },
    { label: 'Last 7 Days',     value: ALERTS.length,                                                        icon: 'history',              valueColor: I4d        },
  ];

  return (
    <main className="min-h-screen pb-24">
      <CompetitorSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* ── 1. Summary KPIs — G4 Prism ────────────────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Alert Summary</p>
          <div className="grid grid-cols-4 gap-4">
            {summaryKpis.map(k => (
              <div key={k.label} style={{ ...G4, padding: 24 }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: I4d, margin: 0 }}>{k.label}</p>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: k.valueColor }}>{k.icon}</span>
                </div>
                <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: k.valueColor, margin: 0, lineHeight: 1 }}>{k.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. Filter Bar — dark pill (matches subnav style) ──────────────── */}
        <div className="flex items-center gap-1.5 p-1.5 flex-wrap w-fit"
          style={{
            background: 'rgba(8,16,36,0.58)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 999,
            boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset,0 20px 40px -18px rgba(0,0,0,0.50)',
          }}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className="flex items-center gap-1.5 px-[18px] py-[9px] rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-200 active:scale-95"
              style={{
                color:      filter === c ? '#0c0d10' : 'rgba(220,228,248,0.45)',
                background: filter === c ? 'rgba(255,255,255,0.92)' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}>
              {c}
              {c === 'Unread' && unreadCount > 0 && (
                <span style={{ background: ACCENT, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999 }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── 3. Alert Feed — G1 Clear Ice ──────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          {visible.length === 0 && (
            <div style={{ ...G1, padding: 48 }} className="flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: I1d }}>notifications_off</span>
              <p style={{ fontSize: 14, color: I1d, margin: 0 }}>No alerts in this category.</p>
            </div>
          )}

          {visible.map(alert => {
            const cfg = severityConfig[alert.severity];
            return (
              <div key={alert.id}
                style={{ ...G1, padding: 20, borderLeft: `4px solid ${cfg.borderColor}`, opacity: alert.read ? 0.65 : 1 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: L1 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: I1d }}>{categoryIcon[alert.category]}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: I1d }}>{alert.brand}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeColor}`}
                          style={{ background: cfg.badgeBg }}>{alert.severity}</span>
                        <span style={{ fontSize: 11, color: I1d }}>{alert.category}</span>
                        {!alert.read && <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />}
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: I1, lineHeight: 1.4, margin: 0 }}>{alert.title}</h3>
                      <p style={{ fontSize: 12, color: I1c, lineHeight: 1.6, margin: 0 }}>{alert.detail}</p>
                      <span style={{ fontSize: 11, color: I1d }}>{alert.ago}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.action && (
                      <button style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        className="active:scale-95">
                        {alert.action}
                      </button>
                    )}
                    <button onClick={() => setDismissed(d => [...d, alert.id])}
                      className="hover:bg-black/5 transition-colors active:scale-95"
                      style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: I1d }}>close</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── 4. Alert Settings — G1 Clear Ice ──────────────────────────────── */}
        <section>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_4, margin: '0 0 16px' }}>Alert Settings</p>
          <div style={{ ...G1, padding: 28 }}>
            <div className="grid grid-cols-3 gap-6">
              {alertSettings.map(s => (
                <div key={s.label} className="flex items-start gap-3">
                  <div className="relative w-10 h-6 rounded-full flex-shrink-0 mt-0.5 cursor-pointer"
                    style={{ background: s.enabled ? ACCENT : L1, border: `1px solid ${s.enabled ? ACCENT : 'rgba(12,44,82,0.15)'}` }}>
                    <div className="w-4 h-4 rounded-full absolute top-[3px] transition-all"
                      style={{ left: s.enabled ? 22 : 3, background: s.enabled ? '#fff' : I1d }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: I1, margin: '0 0 2px' }}>{s.label}</p>
                    <p style={{ fontSize: 11, color: I1d, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
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
