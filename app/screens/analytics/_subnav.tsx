'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const subTabs = [
  { label: 'Overview',     href: '/screens/analytics' },
  { label: 'Portfolio',    href: '/screens/analytics/portfolio' },
  { label: 'Social Media', href: '/screens/analytics/social-media' },
  { label: 'Content',      href: '/screens/analytics/content' },
  { label: 'Reports',      href: '/screens/analytics/reports', badge: 'NEW' },
];

export default function AnalyticsSubNav() {
  const pathname = usePathname();

  return (
    <div className="ana-subnav sticky top-14 z-40">
      <div className="max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto px-6">
        {/* Title + meta */}
        <div className="flex items-center justify-between pt-4 pb-3">
          <h1
            className="text-[20px] font-bold text-white"
            style={{ letterSpacing: '-0.024em', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
          >
            Analytics
          </h1>
          <div
            className="flex items-center gap-4 text-[11px]"
            style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              <span>Updated now</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors hover:bg-white/[0.06]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <span>30 days</span>
              <span className="material-symbols-outlined text-[12px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <ul className="flex items-center gap-0.5" style={{ fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
          {subTabs.map((t) => {
            const isActive = pathname === t.href;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={[
                    'flex items-center gap-1.5 px-3 pb-3 pt-0.5 text-[13px] border-b-2 transition-all duration-200',
                    isActive
                      ? 'text-[#0066cc] font-semibold border-[#0066cc]'
                      : 'text-white/40 hover:text-white/65 border-transparent',
                  ].join(' ')}
                >
                  {t.label}
                  {'badge' in t && t.badge && (
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded"
                      style={{ background: 'rgba(0,102,204,0.25)', color: '#5ba8ff', letterSpacing: '0.08em' }}>
                      {t.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
