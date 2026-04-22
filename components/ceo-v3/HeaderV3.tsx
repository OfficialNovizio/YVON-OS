'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ──────────────────────────────────────────────────────────────────
   HEADER — Apple glass nav  (48 px)
   ────────────────────────────────────────────────────────────────── */

export default function HeaderV3() {
  const [searchHovered, setSearchHovered] = useState(false)

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 200,
      height: '48px', background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: '16px',
    }}>
      {/* Title */}
      <h1 style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.3px', color: '#f5f5f7', flexShrink: 0 }}>
        CEO Command
      </h1>

      {/* Search pill */}
      <div style={{
        flex: '1', maxWidth: '440px',
        display: 'flex', alignItems: 'center', gap: '7px',
        background: 'rgba(255,255,255,0.07)',
        border: `1px solid ${searchHovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: '980px', padding: '0 14px', height: '30px',
        cursor: 'text', transition: 'border-color 150ms',
      }}
        onMouseEnter={() => setSearchHovered(true)}
        onMouseLeave={() => setSearchHovered(false)}
      >
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)' }}>🔍</span>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.30)', letterSpacing: '-0.1px' }}>Command or Search...</span>
      </div>

      <div style={{ flex: '1' }} />

      {/* Period filter */}
      <button style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.07)',
        borderRadius: '10px', padding: '0 12px', height: '30px',
        fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.70)',
        cursor: 'pointer', transition: 'all 80ms', border: 'none',
        fontFamily: 'inherit',
      }}>
        <span style={{ fontSize: '11px' }}>Monthly</span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>⌄</span>
      </button>

      {/* Notification bell */}
      <button style={{
        width: '30px', height: '30px', borderRadius: '50%',
        background: 'transparent', border: '1px solid rgba(255,255,255,0.09)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer',
        position: 'relative', transition: 'all 80ms',
      }}>
        <span style={{ fontSize: '13px' }}>🔔</span>
        <span style={{
          position: 'absolute', top: '5px', right: '5px',
          width: '7px', height: '7px', background: '#34c759',
          borderRadius: '50%', border: '1.5px solid #000',
        }} />
      </button>

      {/* Avatar */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #1c3a6e, #0071e3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 600, color: '#fff', cursor: 'pointer',
      }}>S</div>
    </header>
  )
}
