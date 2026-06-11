'use client'

import { Card } from '@/components/ui'
import { Plus, Trash2 } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'twitter', label: 'Twitter / X', icon: '🐦' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'pinterest', label: 'Pinterest', icon: '📌' },
  { id: 'github', label: 'GitHub', icon: '🐙' },
  { id: 'discord', label: 'Discord', icon: '💬' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
] as const

// ═══════════════════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface VentureSocial {
  id: string; ventureId: string; platform: string; handleOrUrl: string; createdAt: string
}

// ═══════════════════════════════════════════════════════════════════════════
//  PROPS
// ═══════════════════════════════════════════════════════════════════════════
interface SocialTabProps {
  socials: VentureSocial[]
  addSocial: (platform: string) => Promise<void>
  removeSocial: (platform: string) => Promise<void>
}

// ═══════════════════════════════════════════════════════════════════════════
//  SOCIAL TAB
// ═══════════════════════════════════════════════════════════════════════════
export default function SocialTab({ socials, addSocial, removeSocial }: SocialTabProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
      {SOCIAL_PLATFORMS.map(p => {
        const existing = socials.find(s => s.platform === p.id)
        return (
          <Card key={p.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">{p.icon}</span>
              <div className="min-w-0">
                <p className="text-[13px] text-on-surface font-medium">{p.label}</p>
                {existing ? <p className="text-[11px] text-on-surface-variant/60 truncate">{existing.handleOrUrl}</p> : <p className="text-[11px] text-on-surface-variant/40 italic">Not connected</p>}
              </div>
            </div>
            {existing ? (
              <button onClick={() => removeSocial(p.id)} className="text-on-surface-variant/40 hover:text-red-400 transition shrink-0"><Trash2 size={14} /></button>
            ) : (
              <button onClick={() => addSocial(p.id)} className="text-on-surface-variant/40 hover:text-on-surface transition shrink-0"><Plus size={14} /></button>
            )}
          </Card>
        )
      })}
    </div>
  )
}
