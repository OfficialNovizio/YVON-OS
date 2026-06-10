// ── Shared Glass Tokens for Competitor Dashboard ──────────────────────────────
// Single source of truth for the 4 glass variants + ink tokens used across
// all Competitor sub-pages. Previously copy-pasted identically into 6 files.

import type React from 'react'

// Glass variant 1 — Clear Ice (light, transparent)
export const G1: React.CSSProperties = {
  background: 'rgba(255,255,255,0.32)',
  backdropFilter: 'blur(32px) saturate(160%)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 22,
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)',
}

// Glass variant 2 — Azure Tint (blue gradient)
export const G2: React.CSSProperties = {
  background: 'linear-gradient(135deg,rgba(0,102,204,0.28),rgba(0,160,255,0.18))',
  backdropFilter: 'blur(32px) saturate(160%)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: 22,
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.10),0 18px 50px -10px rgba(0,60,160,0.40)',
}

// Glass variant 3 — Deep Ink (dark)
export const G3: React.CSSProperties = {
  background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))',
  backdropFilter: 'blur(34px) saturate(140%)',
  WebkitBackdropFilter: 'blur(34px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 22,
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)',
}

// Glass variant 4 — Prism (iridescent pink+cyan)
export const G4: React.CSSProperties = {
  background:
    'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))',
  backdropFilter: 'blur(30px) saturate(200%)',
  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.50)',
  borderRadius: 22,
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)',
}

// Reports-specific glass variants
export const G2_ALT: React.CSSProperties = {
  background: 'linear-gradient(135deg,rgba(180,210,255,0.55),rgba(220,235,255,0.35))',
  backdropFilter: 'blur(32px) saturate(160%)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),0 18px 50px -10px rgba(20,60,120,0.28)',
}

export const G3_ALT: React.CSSProperties = {
  background: 'linear-gradient(135deg,rgba(10,25,50,0.85),rgba(10,25,50,0.75))',
  backdropFilter: 'blur(32px) saturate(160%)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 22,
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.08),0 18px 50px -10px rgba(0,0,0,0.40)',
}

// ── Ink tokens (light theme) ─────────────────────────────────────────────────
export const I1 = '#0c2c52'
export const I1c = 'rgba(12,44,82,0.65)'
export const I1d = 'rgba(12,44,82,0.48)'
export const L1 = 'rgba(12,44,82,0.10)'

// ── Ink tokens (dark) ────────────────────────────────────────────────────────
export const I2 = '#f4f8ff'
export const I2d = 'rgba(244,248,255,0.48)'

export const I3c = 'rgba(241,245,251,0.75)'
export const I3d = 'rgba(241,245,251,0.45)'

// ── Ink tokens (prism) ───────────────────────────────────────────────────────
export const I4 = '#2a1240'
export const I4d = 'rgba(42,18,64,0.48)'

// ── Reports-specific tokens ──────────────────────────────────────────────────
export const W_TEXT = 'rgba(220,230,255,0.85)'
export const W_MUTED = 'rgba(220,230,255,0.50)'

// ── Brand accent ─────────────────────────────────────────────────────────────
export const ACCENT = '#0066cc'
export const GREEN = '#059669'
export const AMBER = '#d97706'
export const RED = '#dc2626'
export const INK_4 = 'rgba(10,37,71,0.52)'
export const INK = '#0a2547'

// ── Anchor brand tokens ──────────────────────────────────────────────────────
export const ANCHOR_COLOR = '#fbbf24'
export const ANCHOR_BG = 'rgba(251,191,36,0.08)'
export const ANCHOR_BORDER = 'rgba(251,191,36,0.25)'
