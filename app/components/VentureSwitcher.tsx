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

  // Read active venture from cookie on mount
  useEffect(() => {
    setActiveSlug(getActiveVentureSlugClient());
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

  function selectVenture(slug: string) {
    setActiveVentureSlugClient(slug);
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
        className="flex items-center gap-2.5 h-8 px-3 rounded-full border transition-all
          bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20
          focus:outline-none"
      >
        {/* Colored dot */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: active?.color ?? '#E94560' }}
        />
        <span className="text-[12px] font-semibold text-white tracking-tight">
          {active?.name ?? '—'}
        </span>
        <span
          className={`material-symbols-outlined text-[14px] text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-52 rounded-[14px] bg-[#111] border border-white/10 shadow-2xl overflow-hidden z-50">
          <div className="px-3 pt-3 pb-2">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">
              Active Brand
            </p>
            <div className="space-y-0.5">
              {ventures.map((v) => {
                const isActive = v.slug === activeSlug;
                return (
                  <button
                    key={v.slug}
                    onClick={() => selectVenture(v.slug)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-all text-left
                      ${isActive
                        ? 'bg-white/[0.08] border border-white/10'
                        : 'hover:bg-white/[0.05] border border-transparent'
                      }`}
                  >
                    {/* Color dot */}
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: v.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">
                        {v.name}
                      </p>
                      {v.tagline && (
                        <p className="text-[10px] text-white/40 truncate">{v.tagline}</p>
                      )}
                      {!v.tagline && v.brandType && (
                        <p className="text-[10px] text-white/40 capitalize">{v.brandType}</p>
                      )}
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined text-[14px] text-white/60 flex-shrink-0">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status indicator */}
          <div className="px-4 py-2.5 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: active?.color ?? '#E94560' }}
              />
              <p className="text-[10px] text-white/30">
                Showing data for <span className="text-white/60 font-semibold">{active?.name}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
