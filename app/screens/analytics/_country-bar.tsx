'use client';

import { useRouter } from 'next/navigation';

const ACCENT = '#0066cc';
const INK_2 = 'rgba(10,37,71,0.35)';
const INK_3 = 'rgba(10,37,71,0.28)';
const GREEN = '#059669';

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', CA: 'Canada', MX: 'Mexico',
  GB: 'United Kingdom', DE: 'Germany', FR: 'France',
  IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
  SE: 'Sweden', DK: 'Denmark', NO: 'Norway',
  CH: 'Switzerland', AT: 'Austria', BE: 'Belgium',
  IE: 'Ireland', PT: 'Portugal', PL: 'Poland',
  JP: 'Japan', KR: 'South Korea', CN: 'China',
  IN: 'India', AU: 'Australia', NZ: 'New Zealand',
  SG: 'Singapore', HK: 'Hong Kong', TW: 'Taiwan',
  TH: 'Thailand', VN: 'Vietnam', PH: 'Philippines',
  MY: 'Malaysia', ID: 'Indonesia',
  AE: 'UAE', SA: 'Saudi Arabia', IL: 'Israel',
  ZA: 'South Africa', NG: 'Nigeria',
  BR: 'Brazil', AR: 'Argentina', CO: 'Colombia', CL: 'Chile',
};

export default function CountryFilterBar({ countries }: { countries: string[] }) {
  const router = useRouter();

  if (countries.length === 0) return null;

  const displayCountries = countries.length <= 3
    ? countries.map(c => COUNTRY_NAMES[c] ?? c).join(', ')
    : `${countries.length} countries`;

  return (
    <div
      className="flex items-center gap-3 px-5 py-2.5"
      style={{
        background: 'rgba(5,150,105,0.06)',
        border: '1px solid rgba(5,150,105,0.15)',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        color: INK_2,
      }}
    >
      <span className="flex items-center gap-1.5" style={{ color: GREEN, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
        Markets
      </span>
      <span style={{ width: 1, height: 14, background: INK_3 }} />
      <span style={{ color: '#0c2c52', fontWeight: 600 }}>{displayCountries}</span>
      {countries.length <= 3 && countries.length > 1 && (
        <span style={{ fontSize: 11, color: INK_2 }}>
          ({countries.length} selected)
        </span>
      )}
      <button
        onClick={() => router.push('/screens/settings/venture')}
        className="ml-auto flex items-center gap-1"
        style={{ fontSize: 11, fontWeight: 600, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>settings</span>
        Manage regions
      </button>
    </div>
  );
}
