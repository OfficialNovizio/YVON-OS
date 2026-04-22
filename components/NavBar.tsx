'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react'

export default function NavBar() {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          padding: '0 20px',
          background: 'var(--bg-deep)',
          width: '100%',
          borderBottom: '1px solid var(--b1)',
        }}
      >
        {/* Left — Logo + Pulse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--br)',
            }}
          >
            YVON
          </Link>
          <div
            className="pulse-dot"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--color-accent)',
              boxShadow: '0 0 6px var(--color-accent)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: '10px',
              color: 'var(--color-accent)',
              letterSpacing: '0.06em',
            }}
          >
            All systems operational
          </span>
        </div>

        {/* Center — Search Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--color-surface)',
                border: searchFocused
                  ? `1px solid var(--color-accent)`
                  : `1px solid var(--color-border)`,
                borderRadius: '9999px',
                padding: '7px 16px',
                transition: 'border-color 0.2s',
                cursor: 'text',
              }}
            >
              <Search style={{ width: '14px', height: '14px', color: 'var(--color-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Command or Search…"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text-secondary)',
                  fontSize: '12px',
                  width: '100%',
                  fontFamily: 'var(--font-inter), system-ui',
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => setSearchFocused(false), 200)
                }}
              />
              <kbd
                style={{
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '10px',
                  color: 'var(--color-muted)',
                  background: 'var(--bg-deep)',
                  border: `1px solid var(--color-border)`,
                  borderRadius: '4px',
                  padding: '1px 5px',
                  flexShrink: 0,
                }}
              >
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right — Monthly selector, bell, profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Monthly selector */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: `1px solid var(--color-border)`,
              borderRadius: '9999px',
              padding: '5px 12px',
              color: 'var(--color-text-secondary)',
              fontSize: '11px',
              fontFamily: 'var(--font-inter), system-ui',
              cursor: 'pointer',
            }}
          >
            Monthly
            <ChevronDown style={{ width: '12px', height: '12px' }} />
          </button>

          {/* Notification Bell */}
          <button
            style={{
              background: 'none',
              border: `1px solid var(--color-border)`,
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              position: 'relative',
            }}
          >
            <Bell style={{ width: '14px', height: '14px' }} />
            {/* Unread dot */}
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--color-accent)',
              }}
            />
          </button>

          {/* Profile */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-deep)',
              border: `2px solid var(--color-accent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: '#fff',
              boxShadow: '0 0 8px rgba(0, 200, 83, 0.3)',
            }}
          >
            S
          </div>
        </div>
      </nav>

      {/* Anomalies Alert Bar */}
      <div
        style={{
          height: '28px',
          background: 'linear-gradient(90deg, rgba(0, 200, 83, 0.12) 0%, rgba(0, 230, 118, 0.06) 50%, rgba(0, 200, 83, 0.03) 100%)',
          borderBottom: '1px solid rgba(0, 200, 83, 0.2)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '12px' }}>⚡</span>
        <span style={{ fontFamily: 'var(--font-inter), system-ui', fontSize: '11px', fontWeight: 600, color: 'var(--color-accent-bright)', letterSpacing: '0.02em' }}>
          ANOMALIES:
        </span>
        <span style={{ fontFamily: 'var(--font-inter), system-ui', fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>
          Instagram engagement dropped 18% vs 7-day avg
        </span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span style={{ fontFamily: 'var(--font-inter), system-ui', fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>
          YouTube views up 34% — spike detected
        </span>
      </div>
    </>
  )
}
