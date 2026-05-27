'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveVentureSlugClient, setActiveVentureSlugClient } from '@/lib/venture-context';
import type { VentureConfig } from '@/lib/types';

export default function VentureSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ventures, setVentures] = useState<VentureConfig[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>('novizio');
  const ref = useRef<HTMLDivElement>(null);

  // Load ventures list once
  useEffect(() => {
    fetch('/api/ventures')
      .then((r) => r.json())
      .then((data: VentureConfig[]) => {
        if (Array.isArray(data)) setVentures(data);
      })
      .catch(() => {});
  }, []);

  // Read active venture from cookie on mount; sync when any source dispatches venturechange
  useEffect(() => {
    setActiveSlug(getActiveVentureSlugClient());
    function onVentureChange(e: Event) {
      const slug = (e as CustomEvent<{ slug: string }>).detail?.slug;
      if (slug) setActiveSlug(slug);
    }
    window.addEventListener('venturechange', onVentureChange);
    return () => window.removeEventListener('venturechange', onVentureChange);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function selectVenture(slug: string) {
    await setActiveVentureSlugClient(slug);
    setActiveSlug(slug);
    setOpen(false);
    window.dispatchEvent(new CustomEvent('venturechange', { detail: { slug } }));
    router.refresh();
  }

  const active = ventures.find((v) => v.slug === activeSlug) ?? ventures[0];

  if (!active && ventures.length === 0) {
    // Skeleton while loading
    return (
      <div className="h-8 w-28 rounded-full bg-white/[0.06] shimmer" />
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Pill trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 h-8 px-3 rounded-full border transition-all focus:outline-none"
        style={{
          background: 'rgba(12,44,82,0.07)',
          border: '1px solid rgba(12,44,82,0.18)',
        }}
      >
        {/* Colored dot */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: active?.color ?? '#E94560' }}
        />
        <span className="text-[12px] font-semibold tracking-tight" style={{ color: '#0c2c52' }}>
          {active?.name ?? '—'}
        </span>
        <span
          className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'rgba(12,44,82,0.50)' }}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-52 rounded-[14px] overflow-hidden z-50"
          style={{
            background: '#0f1624',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          }}
        >
          <div className="px-3 pt-3 pb-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Active Brand
            </p>
            <div className="space-y-0.5">
              {ventures.map((v) => {
                const isActive = v.slug === activeSlug;
                return (
                  <button
                    key={v.slug}
                    onClick={() => { void selectVenture(v.slug) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all text-left"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: isActive ? '1px solid rgba(255,255,255,0.10)' : '1px solid transparent',
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: v.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#f1f5fb' }}>
                        {v.name}
                      </p>
                      {v.tagline && (
                        <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.40)' }}>{v.tagline}</p>
                      )}
                      {!v.tagline && v.brandType && (
                        <p className="text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.40)' }}>{v.brandType}</p>
                      )}
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined text-[14px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status indicator */}
          <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: active?.color ?? '#E94560' }}
              />
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Showing data for <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{active?.name}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
