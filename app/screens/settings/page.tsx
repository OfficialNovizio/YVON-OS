'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { T, SC } from './_shared'

// ─── Hub Cards ────────────────────────────────────────────────────────────────

const HUB_CARDS = [
  {
    key:   'venture',
    color: SC.venture,
    icon:  'rocket_launch',
    title: 'Venture Profile',
    desc:  'Core identity, brand type, social accounts, and integrations. Everything agents use to understand your venture.',
    tags:  ['Profile', 'Socials', 'Integrations'],
  },
  {
    key:   'agents',
    color: SC.agents,
    icon:  'smart_toy',
    title: 'Agent Configuration',
    desc:  'Set the model, personality extension, and memory for each of your 13 agents across all four departments.',
    tags:  ['Model', 'Prompt', 'Memory'],
  },
  {
    key:   'profile',
    color: SC.profile,
    icon:  'person',
    title: 'User Profile',
    desc:  'Your display name, title, and avatar shown across the OS. Stored locally — never sent to any server.',
    tags:  ['Display Name', 'Avatar'],
  },
  {
    key:   'providers',
    color: SC.providers,
    icon:  'key',
    title: 'AI Providers',
    desc:  'Connect Anthropic, OpenAI, Google Gemini, or Mistral. Keys stored securely in your database — never in code.',
    tags:  ['API Keys', 'Models', 'Providers'],
  },
  {
    key:   'danger',
    color: SC.danger,
    icon:  'warning',
    title: 'Danger Zone',
    desc:  'Clear agent memory, archive, or permanently delete a venture. All actions require typed confirmation.',
    tags:  ['Clear Memory', 'Archive', 'Delete'],
  },
]

// ─── Hub Page ─────────────────────────────────────────────────────────────────

export default function SettingsHubPage() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{
      minHeight:   '100vh',
      background:  T.bg,
      fontFamily:  T.font,
      paddingTop:  56,
    }}>
      <div style={{
        maxWidth: 840,
        margin:   '0 auto',
        padding:  '48px 32px 80px',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontSize:      11,
            fontWeight:    600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         T.text3,
            marginBottom:  10,
          }}>
            YVON OS
          </p>
          <h1 style={{
            fontSize:      28,
            fontWeight:    600,
            color:         T.text1,
            letterSpacing: '-0.03em',
            lineHeight:    1.15,
            margin:        0,
          }}>
            Settings
          </h1>
          <p style={{
            fontSize:   14,
            color:      T.text2,
            marginTop:  8,
            lineHeight: 1.5,
          }}>
            Configure your ventures, agents, and workspace preferences.
          </p>
        </div>

        {/* 2×2 Grid */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap:                 16,
        }}>
          {HUB_CARDS.map(card => {
            const isHov = hovered === card.key
            return (
              <button
                key={card.key}
                onClick={() => router.push('/screens/settings/' + card.key)}
                onMouseEnter={() => setHovered(card.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background:    T.surface,
                  border:        `1px solid ${isHov ? T.borderHov : T.border}`,
                  borderRadius:  16,
                  padding:       '28px 24px',
                  cursor:        'pointer',
                  textAlign:     'left',
                  transition:    'transform 0.18s, border-color 0.18s, background 0.18s',
                  transform:     isHov ? 'scale(1.012)' : 'scale(1)',
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           16,
                }}
              >
                {/* Icon badge + arrow row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width:          44,
                    height:         44,
                    borderRadius:   12,
                    background:     `${card.color}18`,
                    border:         `1px solid ${card.color}30`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    flexShrink:     0,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: card.color, fontFamily: "'Material Symbols Outlined'" }}>
                      {card.icon}
                    </span>
                  </div>
                  <span className="material-symbols-outlined" style={{
                    fontSize:   18,
                    color:      isHov ? T.text2 : T.text3,
                    transition: 'color 0.15s',
                    fontFamily: "'Material Symbols Outlined'",
                  }}>
                    arrow_forward
                  </span>
                </div>

                {/* Title + description */}
                <div>
                  <p style={{
                    fontSize:      16,
                    fontWeight:    600,
                    color:         T.text1,
                    letterSpacing: '-0.02em',
                    marginBottom:  6,
                  }}>
                    {card.title}
                  </p>
                  <p style={{
                    fontSize:   13,
                    color:      T.text2,
                    lineHeight: 1.55,
                  }}>
                    {card.desc}
                  </p>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {card.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize:     10,
                      fontWeight:   600,
                      letterSpacing:'0.05em',
                      textTransform:'uppercase',
                      color:        card.color,
                      background:   `${card.color}12`,
                      border:       `1px solid ${card.color}22`,
                      borderRadius: 6,
                      padding:      '3px 8px',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
