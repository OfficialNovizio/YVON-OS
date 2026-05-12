'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import VentureSwitcher from '@/app/components/VentureSwitcher';

const navItems = [
  { href: '/screens/ceo-command-dashboard', label: 'Command' },
  { href: '/screens/analytics', label: 'Analytics' },
  { href: '/screens/competitor', label: 'Competitor' },
  { href: '/screens/creative-studio', label: 'Creative Studio' },
  { href: '/screens/war-room', label: 'War Room' },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    router.replace('/login');
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a] border-b border-white/[0.08]">
      <div className="flex items-center justify-between px-8 h-14 w-full max-w-screen-2xl mx-auto">
        {/* Left: Logo + Brand Switcher + Nav links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-white tracking-tighter uppercase">
            YVON
          </Link>
          <VentureSwitcher />
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-tight">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? 'text-white border-b-2 border-[#0071e3] pb-1'
                      : 'text-white/50 hover:text-white transition-colors'
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Period toggle, notifications, user */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">Monthly</span>
            <span className="material-symbols-outlined text-[16px] text-white/50">expand_more</span>
          </div>

          <Link
            href="/screens/settings"
            className={pathname.startsWith('/screens/settings')
              ? 'text-white'
              : 'text-white/50 hover:text-white transition-colors'
            }
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </Link>

          <button className="relative text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#0071e3] rounded-full" />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold text-white leading-none">yvon786</p>
              <p className="text-[9px] text-white/40 uppercase tracking-tighter">Administrator</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0066cc]/20 border border-[#0066cc]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-[#0066cc]">person</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
