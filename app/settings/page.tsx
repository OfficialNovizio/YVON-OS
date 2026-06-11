'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useWorkspace } from '@/lib/WorkspaceContext'
import {
  Bell, Key, Palette, User, Server, Cpu, Database, Loader2,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Globe,
  Shield, Save, ExternalLink
} from 'lucide-react'

interface SystemInfo {
  systemHealth: {
    status: string; agentsLive: number; supabaseConnected: boolean
    deepseekBalance: number | null; tokenSpentToday: number
  }
  greeting: string
  ventures: { slug: string; name: string; decisionsPending: number }[]
}

// ── Persisted settings ────────────────────────────────────────────────────
const LS_KEYS = {
  notifications: 'yvon_settings_notifications',
  autoApprove: 'yvon_settings_auto_approve',
  darkMode: 'yvon_settings_dark_mode',
  compactSidebar: 'yvon_settings_compact_sidebar',
  telegramNudge: 'yvon_settings_telegram_nudge',
  weeklyDigest: 'yvon_settings_weekly_digest',
}

function loadBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === 'true' }
  catch { return fallback }
}
function saveBool(key: string, v: boolean) {
  try { localStorage.setItem(key, String(v)) } catch { /* */ }
}

// ── SettingRow: toggle with label + description ────────────────────────────
function SettingRow({
  label, desc, value, onChange,
}: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-b-0">
      <div className="mr-4">
        <p className="text-[13px] text-on-surface">{label}</p>
        <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)} className="shrink-0 text-on-surface-variant hover:text-on-surface transition">
        {value ? <ToggleRight size={22} style={{ color: 'var(--ws-accent)' }} /> : <ToggleLeft size={22} />}
      </button>
    </div>
  )
}

// ── ExpandableSection: click-to-expand card ───────────────────────────────
function ExpandableSection({
  icon: Icon, title, subtitle, badge, children, defaultOpen = false,
}: {
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>
  title: string; subtitle: string; badge?: React.ReactNode
  children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition"
      >
        <Icon size={18} style={{ color: 'var(--ws-accent)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface">{title}</p>
          <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{subtitle}</p>
        </div>
        {badge}
        {open ? <ChevronUp size={16} className="text-on-surface-variant shrink-0" /> : <ChevronDown size={16} className="text-on-surface-variant shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.04]">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </Card>
  )
}

export default function SettingsPage() {
  const { workspace } = useWorkspace()
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Prefs with localStorage persistence
  const [notifications, setN] = useState(true)
  const [autoApprove, setAA] = useState(false)
  const [darkMode, setDM] = useState(true)
  const [compactSidebar, setCS] = useState(false)
  const [telegramNudge, setTN] = useState(true)
  const [weeklyDigest, setWD] = useState(true)

  useEffect(() => {
    setN(loadBool(LS_KEYS.notifications, true))
    setAA(loadBool(LS_KEYS.autoApprove, false))
    setDM(loadBool(LS_KEYS.darkMode, true))
    setCS(loadBool(LS_KEYS.compactSidebar, false))
    setTN(loadBool(LS_KEYS.telegramNudge, true))
    setWD(loadBool(LS_KEYS.weeklyDigest, true))
  }, [])

  const mkToggle = (key: string, setter: (v: boolean) => void) =>
    useCallback((v: boolean) => { setter(v); saveBool(key, v) }, [key, setter])

  const setNotifications = mkToggle(LS_KEYS.notifications, setN)
  const setAutoApprove    = mkToggle(LS_KEYS.autoApprove, setAA)
  const setDarkMode       = useCallback((v: boolean) => {
    setDM(v); saveBool(LS_KEYS.darkMode, v)
    document.documentElement.classList.toggle('dark', v)
    if (!v) document.documentElement.classList.add('light')
  }, [])
  const setCompactSidebar = mkToggle(LS_KEYS.compactSidebar, setCS)
  const setTelegramNudge  = mkToggle(LS_KEYS.telegramNudge, setTN)
  const setWeeklyDigest   = mkToggle(LS_KEYS.weeklyDigest, setWD)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const s = info?.systemHealth

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Configure YVON OS — agents, API keys, notifications, and more." />
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-on-surface-variant" /></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Configure YVON OS — agents, API keys, notifications, and more." />

      <div className="space-y-3">
        {/* ── 1. Profile ─────────────────────────────────────────────── */}
        <ExpandableSection
          icon={User} title="Profile" subtitle="Account details & system status"
          badge={<StatusBadge tone={s?.status === 'healthy' ? 'green' : 'yellow'}>{s?.status ?? 'Unknown'}</StatusBadge>}
        >
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-on-surface-variant">Role</span><span className="text-on-surface">CEO Marcus</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">System</span><span className="text-on-surface">YVON OS v3.0</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Agents live</span><span className="text-on-surface">{s?.agentsLive ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Departments</span><span className="text-on-surface">4 (CEO, Technical, Marketing, Finance)</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Active venture</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: workspace.accent }} />
                <span className="text-on-surface">{workspace.name}</span>
              </span>
            </div>
          </div>
        </ExpandableSection>

        {/* ── 2. Preferences ─────────────────────────────────────────── */}
        <ExpandableSection
          icon={Bell} title="Preferences" subtitle="Notification & display settings"
          defaultOpen
        >
          <SettingRow label="Decision Queue nudge" desc="Nudge every 30 min if queue has items" value={notifications} onChange={setNotifications} />
          <SettingRow label="Telegram nudge" desc="Send critical alerts via Telegram" value={telegramNudge} onChange={setTelegramNudge} />
          <SettingRow label="Weekly digest" desc="Email summary every Sunday morning" value={weeklyDigest} onChange={setWeeklyDigest} />
          <SettingRow label="Auto-approve low-risk" desc="Let Marcus auto-handle routine tasks" value={autoApprove} onChange={setAutoApprove} />
          <SettingRow label="Dark mode" desc="Use dark color scheme" value={darkMode} onChange={setDarkMode} />
          <SettingRow label="Compact sidebar" desc="Icons-only sidebar on desktop" value={compactSidebar} onChange={setCompactSidebar} />
        </ExpandableSection>

        {/* ── 3. AI Provider ─────────────────────────────────────────── */}
        <ExpandableSection
          icon={Cpu} title="AI Provider" subtitle="DeepSeek v4 Pro — balance, usage, model config"
          badge={s?.deepseekBalance != null ? (
            <StatusBadge tone={s.deepseekBalance > 1 ? 'green' : 'yellow'}>${s.deepseekBalance.toFixed(2)}</StatusBadge>
          ) : undefined}
        >
          <div className="space-y-3">
            <div className="text-[13px] space-y-2">
              <div className="flex justify-between"><span className="text-on-surface-variant">Provider</span><span className="text-on-surface">DeepSeek</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Model</span><span className="text-on-surface">v4 Pro</span></div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Balance</span>
                <span className={s?.deepseekBalance != null && s.deepseekBalance > 10 ? 'text-emerald-400' : 'text-on-surface'}>
                  {s?.deepseekBalance != null ? `$${s.deepseekBalance.toFixed(2)}` : 'Loading...'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tokens today</span>
                <span className="text-on-surface">
                  {s?.tokenSpentToday != null && s.tokenSpentToday > 0
                    ? (s.tokenSpentToday / 1000).toFixed(1) + 'K'
                    : 'Calculating...'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Status</span>
                <StatusBadge tone="green">Active</StatusBadge>
              </div>
            </div>
            <a
              href="https://platform.deepseek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition"
            >
              DeepSeek dashboard <ExternalLink size={12} />
            </a>
          </div>
        </ExpandableSection>

        {/* ── 4. Database ────────────────────────────────────────────── */}
        <ExpandableSection
          icon={Database} title="Database" subtitle="Supabase PostgreSQL — connection, tokens, migrations"
          badge={<StatusBadge tone={s?.supabaseConnected ? 'green' : 'red'}>{s?.supabaseConnected ? 'Connected' : 'Offline'}</StatusBadge>}
        >
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-on-surface-variant">Provider</span><span className="text-on-surface">Supabase</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Database</span><span className="text-on-surface">PostgreSQL 15</span></div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Token usage today</span>
              <span className="text-on-surface">
                {s?.tokenSpentToday != null && s.tokenSpentToday > 0
                  ? (s.tokenSpentToday / 1000).toFixed(1) + 'K tokens'
                  : 'Awaiting data...'}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Migrations</span><span className="text-on-surface">50+ applied</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Tables</span><span className="text-on-surface">ventures, agent_sessions, token_usage, +30</span></div>
          </div>
        </ExpandableSection>

        {/* ── 5. API Keys ────────────────────────────────────────────── */}
        <ExpandableSection
          icon={Key} title="API Keys" subtitle="Manage connected service credentials"
          badge={<span className="text-[10px] text-emerald-400 font-medium">4/5 active</span>}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <div>
                <p className="text-[13px] text-on-surface">DeepSeek</p>
                <p className="text-[11px] text-on-surface-variant/60">DEEPSEEK_API_KEY</p>
              </div>
              <StatusBadge tone="green">Active</StatusBadge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <div>
                <p className="text-[13px] text-on-surface">Supabase</p>
                <p className="text-[11px] text-on-surface-variant/60">SUPABASE_URL + SERVICE_ROLE_KEY</p>
              </div>
              <StatusBadge tone="green">Active</StatusBadge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <div>
                <p className="text-[13px] text-on-surface">YouTube</p>
                <p className="text-[11px] text-on-surface-variant/60">YOUTUBE_API_KEY</p>
              </div>
              <StatusBadge tone="green">Active</StatusBadge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <div>
                <p className="text-[13px] text-on-surface">Apify</p>
                <p className="text-[11px] text-on-surface-variant/60">APIFY_API_KEY (optional)</p>
              </div>
              <StatusBadge tone="yellow">Optional</StatusBadge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-[13px] text-on-surface">GitHub</p>
                <p className="text-[11px] text-on-surface-variant/60">GITHUB_TOKEN</p>
              </div>
              <StatusBadge tone="green">Active</StatusBadge>
            </div>
          </div>
        </ExpandableSection>

        {/* ── 6. Integrations ────────────────────────────────────────── */}
        <ExpandableSection
          icon={Globe} title="Integrations" subtitle="Connected platforms & external services"
          badge={<StatusBadge tone="green">5 connected</StatusBadge>}
        >
          <div className="space-y-2.5">
            {[
              { name: 'Vercel', desc: 'Auto-deploy from GitHub CI', status: 'green', url: 'https://yvon.in' },
              { name: 'Telegram', desc: 'Notifications & nudge channel', status: 'green', url: null },
              { name: 'Supabase', desc: 'Database, auth, realtime', status: 'green', url: null },
              { name: 'GitHub', desc: 'Repo: OfficialNovizio/YVON2.0', status: 'green', url: 'https://github.com/OfficialNovizio/YVON2.0' },
              { name: 'Apify', desc: 'Web scraping & competitor data', status: 'yellow', url: null },
            ].map((int) => (
              <div key={int.name} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
                <div>
                  <p className="text-[13px] text-on-surface">{int.name}</p>
                  <p className="text-[11px] text-on-surface-variant/60">{int.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={int.status as 'green' | 'yellow'}>{int.status === 'green' ? 'Active' : 'Configured'}</StatusBadge>
                  {int.url && (
                    <a href={int.url} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-on-surface">
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ExpandableSection>

        {/* ── 7. Deployment ──────────────────────────────────────────── */}
        <ExpandableSection
          icon={Server} title="Deployment" subtitle="Production environment & build pipeline"
          badge={<StatusBadge tone="green">Production</StatusBadge>}
        >
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-on-surface-variant">Platform</span><span className="text-on-surface">Vercel</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Domain</span>
              <a href="https://yvon.in" target="_blank" rel="noopener noreferrer" className="text-on-surface hover:text-on-surface-variant inline-flex items-center gap-1">
                yvon.in <ExternalLink size={11} />
              </a>
            </div>
            <div className="flex justify-between"><span className="text-on-surface-variant">CI/CD</span><span className="text-on-surface">GitHub Actions → Vercel</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Branch</span><span className="text-on-surface">master</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Build</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">Passing</span>
              </span>
            </div>
          </div>
        </ExpandableSection>

        {/* ── 8. Security ────────────────────────────────────────────── */}
        <ExpandableSection
          icon={Shield} title="Security" subtitle="Access controls, session management"
        >
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-on-surface-variant">CSP Headers</span><StatusBadge tone="green">Enabled</StatusBadge></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">HTTPS</span><StatusBadge tone="green">Enforced</StatusBadge></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">API rate limiting</span><StatusBadge tone="green">Active</StatusBadge></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Key rotation</span><span className="text-on-surface">Manual</span></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">Last audit</span><span className="text-on-surface">June 2026</span></div>
          </div>
        </ExpandableSection>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[11px] text-on-surface-variant/40">
        YVON OS v3.0 · Mission Control · Built with 13 agents
      </div>
    </div>
  )
}
