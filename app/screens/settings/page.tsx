'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { T, SC } from './_shared'

// ── Glass system ────────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';
const ACCENT = '#0066cc';
const INK_4  = 'rgba(10,37,71,0.52)';

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
      background:  'transparent',
      fontFamily:  T.font,
    }}>
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto" style={{
        paddingTop: 96,
        paddingBottom: 80,
      }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="flex items-center gap-2 mb-2" style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: INK_4
          }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            YVON OS
          </div>
          <h1 style={{
            fontSize:      44,
            fontWeight:    700,
            color:         I1,
            letterSpacing: '-0.025em',
            lineHeight:    1,
            margin:        0,
          }}>
            Settings<span style={{ color: ACCENT }}>.</span>
          </h1>
          <p style={{
            fontSize:   15,
            color:      I1c,
            marginTop:  10,
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
                  ...G1,
                  padding:       '22px 22px',
                  cursor:        'pointer',
                  textAlign:     'left',
                  transition:    'transform 0.18s, border-color 0.18s',
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
