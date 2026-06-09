'use client';

import Link from 'next/link';

const G1: React.CSSProperties = {
  background: 'rgba(255,255,255,0.32)',
  backdropFilter: 'blur(32px) saturate(160%)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)',
};
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)';
const ACCENT = '#0066cc';

// Shown when every panel in a tab is toggled off.
export default function EmptyTab() {
  return (
    <div style={{ ...G1, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <p style={{ fontSize: 17, fontWeight: 800, color: I1, margin: 0 }}>All panels hidden</p>
      <p style={{ fontSize: 14, color: I1c, margin: 0, maxWidth: 420, lineHeight: 1.5 }}>
        Every panel on this tab is turned off. Re-enable them any time from
        Settings → Dashboard Panels.
      </p>
      <Link
        href="/screens/settings/panels"
        style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: ACCENT, textDecoration: 'none', letterSpacing: '0.04em' }}
      >
        Open Dashboard Panels →
      </Link>
    </div>
  );
}
