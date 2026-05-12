'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const subTabs = [
  { label: 'Overview',     href: '/screens/analytics' },
  { label: 'Portfolio',    href: '/screens/analytics/portfolio' },
  { label: 'Social Media', href: '/screens/analytics/social-media' },
  { label: 'Content',      href: '/screens/analytics/content' },
];

export default function AnalyticsSubNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 z-40 bg-black/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Title + meta */}
        <div className="flex items-center justify-between pt-5 pb-3">
          <h1 className="text-[22px] font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>
            Analytical Dashboard
          </h1>
          <div className="flex items-center gap-5 text-[12px] text-white/50" style={{ letterSpacing: '-0.374px' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Live Data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              <span>Updated: now</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/[0.06] px-3 py-1 rounded-full cursor-pointer hover:bg-white/[0.08] transition-colors">
              <span>Last 30 days</span>
              <span className="material-symbols-outlined text-[13px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <ul className="flex items-center gap-1 text-[13px]" style={{ letterSpacing: '-0.2px' }}>
          {subTabs.map((t) => {
            const isActive = pathname === t.href;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={[
                    'block px-3 pb-3 border-b-2 transition-colors duration-200',
                    isActive
                      ? 'text-[#0066cc] font-medium border-[#0066cc]'
                      : 'text-white/40 hover:text-white/70 border-transparent',
                  ].join(' ')}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
