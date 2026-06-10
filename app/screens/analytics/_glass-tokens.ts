// ── Shared Glass Tokens for Analytics Dashboard ──────────────────────────────
// Single source of truth for the 3 glass variants + ink tokens used across
// all Analytics sub-pages. Previously copy-pasted identically into 4 files.

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

// Glass variant 3 — Deep Ink (dark, for data cards)
export const G3: React.CSSProperties = {
  background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))',
  backdropFilter: 'blur(34px) saturate(140%)',
  WebkitBackdropFilter: 'blur(34px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 22,
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)',
}

// ── Ink tokens (light theme) ─────────────────────────────────────────────────
export const I1 = '#0c2c52'
export const I1b = '#1a3e6e'
export const I1c = 'rgba(12,44,82,0.65)'
export const I1d = 'rgba(12,44,82,0.48)'
export const L1 = 'rgba(12,44,82,0.10)'

// ── Ink tokens (dark / deep variant) ─────────────────────────────────────────
export const I3 = '#f1f5fb'
export const I3c = 'rgba(241,245,251,0.75)'
export const I3d = 'rgba(241,245,251,0.45)'
export const L3 = 'rgba(255,255,255,0.10)'

// ── Ink tokens (azure tint variant) ──────────────────────────────────────────
export const I2 = '#f4f8ff'
export const I2b = 'rgba(244,248,255,0.85)'
export const I2c = 'rgba(244,248,255,0.68)'
export const I2d = 'rgba(244,248,255,0.48)'
export const L2 = 'rgba(255,255,255,0.14)'

// ── Brand accent ─────────────────────────────────────────────────────────────
export const ACCENT = '#0066cc'
export const GREEN = '#059669'
export const AMBER = '#d97706'
export const RED = '#dc2626'
export const INK_4 = 'rgba(10,37,71,0.52)'
