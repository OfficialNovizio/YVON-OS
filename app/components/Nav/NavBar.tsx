'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getActiveVentureSlugClient } from '@/lib/venture-context';
import VentureSwitcher from '@/app/components/VentureSwitcher';

const navItems = [
  { href: '/screens/ceo-command-dashboard', label: 'Command' },
  { href: '/screens/analytics', label: 'Analytics' },
  { href: '/screens/competitor', label: 'Competitor' },
  { href: '/screens/marketing', label: 'Marketing' },
  { href: '/screens/creative-studio', label: 'Creative Studio' },
  { href: '/screens/war-room', label: 'War Room' },
  { href: '/screens/career', label: 'Personal' },
];

const novizioNavItems = [
  { href: '/screens/merchandize', label: 'Merchandize' },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeVenture, setActiveVenture] = useState<string>('novizio');
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef    = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setActiveVenture(getActiveVentureSlugClient());
    function onVentureChange(e: Event) {
      const slug = (e as CustomEvent<{ slug: string }>).detail.slug;
      setActiveVenture(slug);
    }
    window.addEventListener('venturechange', onVentureChange);
    return () => window.removeEventListener('venturechange', onVentureChange);
  }, []);

  // Close drawer when route changes (handles cross-route navigation)
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close drawer on outside click — exclude the hamburger button itself so
  // the toggle's own onClick isn't cancelled by this handler firing first
  useEffect(() => {
    if (!mobileOpen) return;
    function onOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inDrawer    = drawerRef.current?.contains(target);
      const inHamburger = hamburgerRef.current?.contains(target);
      if (!inDrawer && !inHamburger) setMobileOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [mobileOpen]);

  function closeDrawer() { setMobileOpen(false); }

  async function handleLogout() {
    await Promise.all([
      supabaseClient.auth.signOut(),
      fetch('/api/auth/logout', { method: 'POST' }),
    ]);
    router.replace('/login');
  }

  const allNavItems = [
    ...navItems,
    ...(activeVenture === 'novizio' ? novizioNavItems : []),
  ];

  return (
    <>
      <nav className="glass-nav px-3 sm:px-5 py-2 sm:py-2.5 gap-1.5 sm:gap-2">
        {/* Left: Logo + divider + Brand Switcher + Nav links */}
        <div className="flex items-center gap-2 sm:gap-5 flex-1 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 pr-2 sm:pr-4"
            style={{ borderRight: '1px solid rgba(12,44,82,0.15)' }}
          >
            <span
              className="w-[22px] h-[22px] rounded-full shrink-0"
              style={{
                background:
                  'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0.15) 55%, transparent 70%), linear-gradient(135deg, #ffffff 0%, #b8d6f5 60%, #4a90d9 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6), 0 2px 6px rgba(0,40,90,0.25)',
              }}
            />
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: '#0c2c52' }}>
              YVON
            </span>
          </Link>

          <VentureSwitcher />

          <div className="hidden md:flex items-center gap-1 text-[13.5px] font-medium">
            {allNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3.5 py-2 rounded-xl transition-all"
                  style={{
                    color: isActive ? '#0c2c52' : 'rgba(12,44,82,0.65)',
                    background: isActive ? 'rgba(12,44,82,0.10)' : 'transparent',
                    boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.5)' : 'none',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Period toggle, settings, notifications, user, hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
            style={{ background: 'rgba(12,44,82,0.07)', border: '1px solid rgba(12,44,82,0.12)' }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(12,44,82,0.70)' }}>Monthly</span>
            <span className="material-symbols-outlined text-[16px]" style={{ color: 'rgba(12,44,82,0.50)' }}>expand_more</span>
          </div>

          <Link
            href="/screens/settings"
            className="hidden sm:inline-flex transition-colors"
            style={{ color: pathname.startsWith('/screens/settings') ? '#0c2c52' : 'rgba(12,44,82,0.55)' }}
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </Link>

          <button className="relative transition-colors" style={{ color: 'rgba(12,44,82,0.55)' }}>
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#0066cc] rounded-full" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3" style={{ borderLeft: '1px solid rgba(12,44,82,0.12)' }}>
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold leading-none" style={{ color: '#0c2c52' }}>yvon786</p>
              <p className="text-[9px] uppercase tracking-tighter" style={{ color: 'rgba(12,44,82,0.50)' }}>Administrator</p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(12,44,82,0.08)', border: '1px solid rgba(12,44,82,0.15)' }}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ color: '#0c2c52' }}>person</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="hidden sm:inline-flex transition-colors"
              style={{ color: 'rgba(12,44,82,0.45)' }}
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>

          {/* Hamburger — mobile only */}
          <button
            ref={hamburgerRef}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl transition-all"
            style={{ background: mobileOpen ? 'rgba(12,44,82,0.12)' : 'transparent' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#0c2c52' }}>
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-nav-drawer md:hidden" ref={drawerRef}>
          {allNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-link${isActive ? ' active' : ''}`}
                onClick={closeDrawer}
              >
                {item.label}
              </Link>
            );
          })}
          <div style={{ height: 1, background: 'rgba(12,44,82,0.08)', margin: '6px 0' }} />
          <Link href="/screens/settings" className="mobile-nav-link" onClick={closeDrawer}>
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="mobile-nav-link w-full text-left"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign out
          </button>
        </div>
      )}
    </>
  );
}

export default NavBar;
