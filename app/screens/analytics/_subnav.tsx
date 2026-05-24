'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const subTabs = [
  { label: 'Overview',     href: '/screens/analytics' },
  { label: 'Market',       href: '/screens/analytics/market', badge: 'NEW' },
  { label: 'Portfolio',    href: '/screens/analytics/portfolio' },
  { label: 'Social Media', href: '/screens/analytics/social-media' },
  { label: 'Reports',      href: '/screens/analytics/reports' },
];

const INK    = '#0a2547';
const INK_4  = 'rgba(10,37,71,0.52)';
const GREEN  = '#059669';
const ACCENT = '#0066cc';
const P_INK4 = 'rgba(220,228,248,0.45)';

export default function AnalyticsSubNav() {
  const pathname = usePathname();

  return (
    <header className="max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto px-6 pt-[96px]">
      {/* Page head */}
      <div className="flex items-end justify-between gap-6 mb-[22px]">
        <div>
          <div
            className="flex items-center gap-2 mb-1.5"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: INK_4 }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            Analytics · YVON OS
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: INK, lineHeight: 1 }}>
            Analytics<span style={{ color: ACCENT }}>.</span>
          </h1>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <p className="flex items-center gap-1.5" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GREEN, margin: 0 }}>
            <span className="ceo-live-dot" style={{ background: GREEN }} />
            Live data
          </p>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer"
            style={{ background: 'rgba(10,37,71,0.06)', border: '1px solid rgba(10,37,71,0.12)', fontSize: 11, fontWeight: 600, color: 'rgba(10,37,71,0.55)' }}
          >
            <span>30 days</span>
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </div>
        </div>
      </div>

      {/* Dark pill tab strip — matches CEO dashboard TabStrip */}
      <nav
        className="flex items-center gap-1.5 p-1.5 w-fit"
        style={{
          background: 'rgba(8,16,36,0.58)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 999,
          boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 40px -18px rgba(0,0,0,0.50), 0 4px 10px -4px rgba(0,0,0,0.30)',
        }}
      >
        {subTabs.map((t) => {
          const isActive = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex items-center gap-2 px-[18px] py-[9px] rounded-full text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-200"
              style={{
                color: isActive ? '#0c0d10' : P_INK4,
                background: isActive ? 'rgba(255,255,255,0.92)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              {t.label}
              {'badge' in t && t.badge && (
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={{ background: ACCENT, color: '#fff', letterSpacing: '0.05em' }}
                >
                  {t.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
