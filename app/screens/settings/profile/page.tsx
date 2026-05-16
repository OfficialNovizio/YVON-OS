'use client'

import { useEffect, useState } from 'react'
import { T, SC, FF, FInput, BackLink } from '../_shared'

// ─── Nav Preview ─────────────────────────────────────────────────────────────

function NavPreview({ name, title, avatar }: { name: string; title: string; avatar: string }) {
  return (
    <div style={{
      background:   'rgba(0,0,0,0.8)',
      border:       `1px solid ${T.border}`,
      borderRadius: 14,
      padding:      '12px 20px',
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'space-between',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Left mock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.text1, letterSpacing: '0.05em' }}>YVON</p>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Command', 'Analytics', 'War Room'].map(l => (
            <span key={l} style={{ fontSize: 12, color: T.text3 }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Right: user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.text1, lineHeight: 1 }}>{name || 'S. Marcos'}</p>
          <p style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{title || 'Chief Executive'}</p>
        </div>
        {avatar ? (
          <img src={avatar} alt="avatar" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${T.border}` }} />
        ) : (
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: `${SC.profile}20`, border: `1px solid ${SC.profile}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: SC.profile,
          }}>
            {(name || 'S')[0]?.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfileSettingsPage() {
  const [name,   setName]   = useState('S. Marcos')
  const [title,  setTitle]  = useState('Chief Executive')
  const [avatar, setAvatar] = useState('')
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    setName(localStorage.getItem('yvon_user_name')    ?? 'S. Marcos')
    setTitle(localStorage.getItem('yvon_user_title')  ?? 'Chief Executive')
    setAvatar(localStorage.getItem('yvon_user_avatar') ?? '')
  }, [])

  function handleSave() {
    localStorage.setItem('yvon_user_name',   name)
    localStorage.setItem('yvon_user_title',  title)
    localStorage.setItem('yvon_user_avatar', avatar)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, paddingTop: 56, paddingBottom: 60 }}>
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto" style={{ paddingTop: 32 }}>
        <BackLink />

        <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text1, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          User Profile
        </h1>
        <p style={{ fontSize: 13, color: T.text2, marginBottom: 36 }}>
          Your display name and avatar shown in the navigation bar. Stored locally — never sent to any server.
        </p>

        {/* Live preview */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.text3, marginBottom: 10 }}>
            Nav Preview
          </p>
          <NavPreview name={name} title={title} avatar={avatar} />
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 480 }}>
          <FF label="Display Name">
            <FInput
              value={name}
              onChange={e => { setName(e.target.value); setSaved(false) }}
              placeholder="S. Marcos"
            />
          </FF>

          <FF label="Title">
            <FInput
              value={title}
              onChange={e => { setTitle(e.target.value); setSaved(false) }}
              placeholder="Chief Executive"
            />
          </FF>

          <FF label="Avatar URL">
            <FInput
              value={avatar}
              onChange={e => { setAvatar(e.target.value); setSaved(false) }}
              placeholder="https://..."
              type="url"
            />
          </FF>

          {avatar && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={avatar}
                alt="Avatar preview"
                style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${T.border}` }}
              />
              <p style={{ fontSize: 12, color: T.text3 }}>Preview of your avatar</p>
            </div>
          )}

          <div style={{ paddingTop: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={handleSave}
              style={{
                background:    saved ? '#30d158' : T.accent,
                color:         '#fff',
                border:        'none',
                borderRadius:  8,
                padding:       '10px 28px',
                fontFamily:    T.font,
                fontSize:      14,
                fontWeight:    500,
                cursor:        'pointer',
                letterSpacing: '-0.2px',
                transition:    'background 0.2s',
              }}
            >
              {saved ? '✓ Saved' : 'Save Profile'}
            </button>
            {saved && (
              <p style={{ fontSize: 12, color: '#30d158' }}>Refresh the page to see changes in the nav bar.</p>
            )}
          </div>
        </div>

        {/* Note */}
        <div style={{
          marginTop: 40, padding: '14px 18px',
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 12,
        }}>
          <p style={{ fontSize: 12, color: T.text3, lineHeight: 1.6 }}>
            <strong style={{ color: T.text2 }}>Local storage only.</strong>{' '}
            Your profile data is saved in this browser and never sent to Supabase or any server. To sync across devices, update the NavBar component directly.
          </p>
        </div>
      </div>
    </div>
  )
}
