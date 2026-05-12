'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const subTabs = [
  { label: 'Overview',      href: '/screens/competitor' },
  { label: 'Content Intel', href: '/screens/competitor/content-intel' },
  { label: 'Content Gaps',  href: '/screens/competitor/content-gaps' },
  { label: 'Keywords',      href: '/screens/competitor/keywords' },
  { label: 'Alerts',        href: '/screens/competitor/alerts' },
];

export default function CompetitorSubNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 z-40 bg-black/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Title + tracking strip */}
        <div className="flex items-center justify-between pt-5 pb-3">
          <h1 className="text-[22px] font-semibold text-white" style={{ letterSpacing: '-0.28px' }}>
            Competitor Overview
          </h1>
          <div className="flex items-center gap-5 text-[12px] text-white/50" style={{ letterSpacing: '-0.374px' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Live Tracking Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              <span>Last updated: 2 mins ago</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">tune</span>
              <span>Filters: Top 5, 30 Days</span>
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
                      ? 'text-[#0071e3] font-medium border-[#0071e3]'
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
