'use client';

import { useEffect, useState } from 'react';
import AnalyticsSubNav from '../_subnav';
import MarketIntelligence from '../_market-intelligence';
import CountryFilterBar from '../_country-bar';
import { getActiveVentureSlugClient } from '@/lib/venture-context';
import type { TargetAudience } from '@/lib/types';

// ── Glass variants ──────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1='#0c2c52', I1c='rgba(12,44,82,0.65)';
const INK_4  = 'rgba(10,37,71,0.52)';
const ACCENT = '#0066cc';

export default function AnalyticsMarketPage() {
  const [ventureSlug, setVentureSlug] = useState('novizio');
  const [countries, setCountries] = useState<string[]>(['US']);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [marketCats, setMarketCats] = useState<string[]>([]);
  const [marketFocus, setMarketFocus] = useState('');

  useEffect(() => {
    const slug = getActiveVentureSlugClient();
    setVentureSlug(slug);
    fetch('/api/ventures')
      .then(r => r.json())
      .then((ventures: { slug: string; operatingCountries?: string[]; targetAudience?: TargetAudience; marketSubcategories?: string[] }[]) => {
        const v = ventures.find((x: { slug: string }) => x.slug === slug);
        if (v?.operatingCountries?.length) setCountries(v.operatingCountries);
        if (v?.targetAudience) setTargetAudience(v.targetAudience);
        if (v?.marketSubcategories?.length) setMarketCats(v.marketSubcategories);
        // Derive market focus from subcategories
        const subCats = v?.marketSubcategories ?? [];
        const leafLabels: Record<string, string> = {
          saree: 'Sarees', lehenga: 'Lehengas', 'salwar-kameez': 'Salwar Kameez',
          shirt: 'Shirts', kurta: 'Kurtas', 'western-dress': 'Dresses',
          'ethnic-womenswear': "Women's Ethnic", 'western-womenswear': "Women's Western",
          ethnic: 'Ethnic', western: 'Western', sneakers: 'Sneakers', jewelry: 'Jewelry',
        };
        const focusItems = subCats.map(c => leafLabels[c] || c).filter(c => c.length < 25).slice(0, 3);
        if (focusItems.length) setMarketFocus(focusItems.join(', '));
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen pb-24">
      <AnalyticsSubNav />

      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px] space-y-8">

        {/* Page header */}
        <div>
          <div
            className="flex items-center gap-2 mb-1.5"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: INK_4 }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            Market Intelligence · YVON OS
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: I1, lineHeight: 1 }}>
            Market<span style={{ color: ACCENT }}>.</span>
          </h1>
          <p style={{ fontSize: 13, color: I1c, marginTop: 8, lineHeight: 1.5 }}>
            Segmentation, audience, demand signals, competitive position, and forecast scenarios.
            Filtered by your operating countries.
          </p>
        </div>

        {/* Markets bar */}
        <CountryFilterBar countries={countries} />

        {/* Target audience context card */}
        {(marketFocus || (targetAudience && (targetAudience.ageRange || targetAudience.gender || targetAudience.incomeTier || targetAudience.region))) && (
          <div style={{ ...G1, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: ACCENT }}>travel_explore</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(12,44,82,0.48)' }}>
                Market Profile
              </span>
            </div>
            {marketFocus && (
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(12,44,82,0.35)' }}>Focus</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>{marketFocus}</span>
              </div>
            )}
            {targetAudience && targetAudience.ageRange && (
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(12,44,82,0.35)' }}>Age</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: I1c }}>{targetAudience.ageRange}</span>
              </div>
            )}
            {targetAudience && targetAudience.gender && (
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(12,44,82,0.35)' }}>Gender</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: I1c }}>{targetAudience.gender}</span>
              </div>
            )}
            {targetAudience && targetAudience.incomeTier && (
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(12,44,82,0.35)' }}>Income</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: I1c }}>{targetAudience.incomeTier}</span>
              </div>
            )}
            {targetAudience && targetAudience.region && (
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(12,44,82,0.35)' }}>Region</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: I1c }}>{targetAudience.region}</span>
              </div>
            )}
            {targetAudience && targetAudience.description && (
              <span style={{ fontSize: 12, color: 'rgba(12,44,82,0.5)', fontStyle: 'italic' }}>
                {targetAudience.description}
              </span>
            )}
            {marketCats.length > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(12,44,82,0.35)' }}>
                  {marketCats.length} sub-categories
                </span>
              </div>
            )}
          </div>
        )}

        {/* All 7 Market Intelligence panels */}
        <MarketIntelligence ventureSlug={ventureSlug} countries={countries} />

        {/* Footer */}
        <footer className="border-t flex items-center justify-between py-6" style={{ borderColor: 'rgba(12,44,82,0.10)' }}>
          <p style={{ fontSize: 11, color: INK_4 }}>© 2026 YVON Analytics. Built for Excellence.</p>
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
