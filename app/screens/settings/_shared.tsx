'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

// ─── Glass Design Tokens ──────────────────────────────────────────────────────

export const T = {
  font:       "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
  accent:     '#0066cc',
  accentGlow: 'rgba(0,102,204,0.14)',
  bg:         'transparent',
  surface:    'rgba(255,255,255,0.28)',
  surfaceHov: 'rgba(255,255,255,0.36)',
  border:     'rgba(255,255,255,0.35)',
  borderHov:  'rgba(255,255,255,0.55)',
  text1:      '#0c2c52',
  text2:      'rgba(12,44,82,0.65)',
  text3:      'rgba(12,44,82,0.48)',
  red:        '#dc2626',
} as const

export const SC = {
  venture:   '#ff6b6b',
  agents:    '#bf5af2',
  profile:   '#ff9f0a',
  providers: '#0071e3',
  danger:    '#ff453a',
} as const

export const DC = {
  ceo:        '#ff9f0a',
  technical:  '#2997ff',
  marketing:  '#ff375f',
  finance:    '#30d158',
  psychology: '#bf5af2',
} as const

// ─── Input style helper ───────────────────────────────────────────────────────

export function iS(focused: boolean): CSSProperties {
  return {
    background:   'rgba(12,44,82,0.06)',
    border:       `1px solid ${focused ? T.accent : 'rgba(12,44,82,0.15)'}`,
    boxShadow:    focused ? `0 0 0 3px ${T.accentGlow}` : 'none',
    borderRadius: 8,
    color:        '#0c2c52',
    outline:      'none',
    fontFamily:   T.font,
    fontSize:     14,
    padding:      '9px 12px',
    width:        '100%',
    transition:   'border-color 0.15s, box-shadow 0.15s',
    letterSpacing:'-0.2px',
  }
}

// ─── Form Field wrapper ───────────────────────────────────────────────────────

export function FF({ label, children, style, labelColor }: {
  label: string
  children: React.ReactNode
  style?: CSSProperties
  labelColor?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      <label style={{ fontFamily: T.font, fontSize: 10, fontWeight: 600,
        color: labelColor ?? T.text3, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Form Input ───────────────────────────────────────────────────────────────

export function FInput({ value, onChange, placeholder, type = 'text', mono }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  mono?: boolean
}) {
  const [f, setF] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{ ...iS(f), fontFamily: mono ? 'monospace' : T.font }}
    />
  )
}

// ─── Form TextArea ────────────────────────────────────────────────────────────

export function FTextArea({ value, onChange, placeholder, rows = 3, small }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  small?: boolean
}) {
  const [f, setF] = useState(false)
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{ ...iS(f), resize: 'none', lineHeight: 1.5, fontSize: small ? 13 : 14 }}
    />
  )
}

// ─── Form Select ─────────────────────────────────────────────────────────────

export function FSelect({ value, onChange, options }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
}) {
  const [f, setF] = useState(false)
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        ...iS(f),
        appearance: 'none',
        cursor: 'pointer',
        paddingRight: 32,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255%2C255%2C255%2C0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
      }}
    >
      {options.map((o, i) => (
        <option key={`${o.value}-${i}`} value={o.value} style={{ background: '#ffffff', color: '#0c2c52' }}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function FDivider({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
      {label && (
        <span style={{ fontFamily: T.font, fontSize: 10, fontWeight: 600, color: T.text3,
          textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

// ─── Save Bar ─────────────────────────────────────────────────────────────────

export function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
      <button onClick={onSave} disabled={saving} style={{ background: '#0c2c52', color: '#fff', border: 'none',
        borderRadius: 999, padding: '10px 32px', fontFamily: T.font, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '-0.01em', opacity: saving ? 0.5 : 1, transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {saving ? 'progress_activity' : 'save'}
        </span>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────

export function Btn({ children, onClick, variant = 'primary', small, disabled, style: sx }: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'dangerSolid'
  small?: boolean
  disabled?: boolean
  style?: CSSProperties
}) {
  const [h, setH] = useState(false)
  const base: CSSProperties = {
    fontFamily:    T.font,
    fontSize:      small ? 12 : 14,
    fontWeight:    500,
    cursor:        disabled ? 'not-allowed' : 'pointer',
    borderRadius:  8,
    padding:       small ? '6px 14px' : '9px 20px',
    letterSpacing: '-0.2px',
    transition:    'all 0.15s',
    opacity:       disabled ? 0.4 : 1,
    border:        'none',
  }
  const styles: Record<string, CSSProperties> = {
    primary:     { background: h && !disabled ? '#0082ff' : T.accent, color: '#fff' },
    ghost:       { background: h ? 'rgba(12,44,82,0.10)' : 'rgba(12,44,82,0.06)', color: T.text2, border: '1px solid rgba(12,44,82,0.15)' },
    danger:      { background: h && !disabled ? 'rgba(255,69,58,0.08)' : 'transparent', color: T.red, border: '1px solid rgba(255,69,58,0.27)' },
    dangerSolid: { background: h && !disabled ? '#cc3530' : '#ff453a', color: '#fff' },
  }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...base, ...styles[variant], ...sx }}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// ─── Back Link ────────────────────────────────────────────────────────────────

export function BackLink() {
  const router = useRouter()
  const [h, setH] = useState(false)
  return (
    <button
      onClick={() => router.push('/screens/settings')}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ background: 'none', border: 'none', color: h ? '#fff' : T.accent,
        fontFamily: T.font, fontSize: 13, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4, padding: 0,
        marginBottom: 28, letterSpacing: '-0.2px', transition: 'color 0.15s' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>arrow_back</span>
      Settings
    </button>
  )
}
