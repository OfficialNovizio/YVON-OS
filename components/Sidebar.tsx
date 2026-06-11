'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { WORKSPACES, WORKSPACE_MAP } from '@/lib/workspaces'
import type { WorkspaceKey } from '@/lib/workspaces'

interface SidebarProps {
  mode: 'full' | 'icons'
  onToggle?: () => void
  mobileClose?: () => void
}

// ── Navigation data ──────────────────────────────────────────────────────────
interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
}

interface NavSection {
  heading: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Command Center',
    items: [
      { label: 'Dashboard Home', href: '/dashboard', icon: 'dashboard' },
      { label: 'Decision Queue', href: '/decision-queue', icon: 'filter_list', badge: 7 },
      { label: 'Task Board', href: '/task-board', icon: 'view_kanban' },
      { label: 'Advisory Council', href: '/advisory-council', icon: 'groups' },
      { label: 'Agents', href: '/agents', icon: 'smart_toy' },
      { label: 'Org Chart', href: '/org-chart', icon: 'account_tree' },
      { label: 'Office', href: '/office', icon: 'apartment' },
      { label: 'Skill Workshop', href: '/skill-workshop', icon: 'school' },
    ],
  },
  {
    heading: 'Long-form',
    items: [
      { label: 'Content Pipeline', href: '/content-pipeline', icon: 'movie' },
      { label: 'Production Calendar', href: '/production-calendar', icon: 'calendar_month' },
      { label: 'YouTube Studio', href: '/youtube-studio', icon: 'play_circle' },
      { label: 'YouTube Analytics', href: '/youtube-analytics', icon: 'analytics' },
    ],
  },
  {
    heading: 'Shorts',
    items: [
      { label: 'Short Pipeline', href: '/short-pipeline', icon: 'short_text' },
      { label: 'Shorts', href: '/shorts', icon: 'smart_display' },
    ],
  },
  {
    heading: 'Posts',
    items: [
      { label: 'Social Approvals', href: '/social-approvals', icon: 'check_circle', badge: 6 },
      { label: 'Scheduler', href: '/scheduler', icon: 'calendar_month' },
      { label: 'Social Analytics', href: '/social-analytics', icon: 'trending_up' },
      { label: 'Newsletter', href: '/newsletter', icon: 'mail' },
    ],
  },
  {
    heading: 'Knowledge',
    items: [
      { label: 'Brain & Wiki', href: '/brain-wiki', icon: 'psychology' },
      { label: 'Asset Lab', href: '/asset-lab', icon: 'palette' },
      { label: 'Trend Radar', href: '/trend-radar', icon: 'radar' },
    ],
  },
  {
    heading: 'Build',
    items: [
      { label: 'Idea Feed', href: '/idea-feed', icon: 'lightbulb', badge: 94 },
      { label: 'Software Pipeline', href: '/software-pipeline', icon: 'code', badge: 1 },
    ],
  },
  {
    heading: 'Revenue',
    items: [
      { label: 'Consulting CRM', href: '/consulting-crm', icon: 'handshake', badge: 3 },
      { label: 'Cinematic Sites', href: '/cinematic-sites', icon: 'palette' },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Email Inbox', href: '/inbox', icon: 'inbox' },
      { label: 'Settings', href: '/settings', icon: 'settings' },
      { label: 'Hardware', href: '/hardware', icon: 'dns' },
      { label: 'Projects', href: '/projects', icon: 'folder' },
      { label: 'People', href: '/people', icon: 'people' },
      { label: 'Docs', href: '/docs', icon: 'description' },
      { label: 'Logs', href: '/logs', icon: 'receipt_long' },
    ],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

// ── Component ────────────────────────────────────────────────────────────────
export function Sidebar({ mode, onToggle, mobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { workspace } = useWorkspace()

  const handleNav = () => {
    mobileClose?.()
  }

  // Current workspace label
  const ws = WORKSPACES.find((w: { key: WorkspaceKey }) => w.key === workspace.key)
  const wsLabel = ws?.name ?? workspace.key

  return (
    <div className="flex flex-col h-full text-[13px] overflow-y-auto no-scrollbar">
      {/* ── Logo + workspace switcher ──────────────────────────────────────── */}
      <div className="px-3 py-4 border-b border-white/[0.06]">
        {mode === 'full' ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent shrink-0 flex items-center justify-center text-[#06121f] font-bold text-sm">
                Y
              </div>
              <div>
                <div className="font-semibold text-on-surface leading-tight text-sm">YVON OS</div>
                <div className="text-[10px] text-on-surface-variant tracking-widest uppercase">Mission Control</div>
              </div>
            </div>
            {/* Venture badge — read-only display, switching is in the TopBar pill */}
            <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs">
              <span className="text-[10px] tracking-widest text-on-surface-variant">
                VENTURE
              </span>
              <span className="flex-1 text-left text-on-surface font-medium">
                {wsLabel}
              </span>
              {WORKSPACE_MAP[workspace.key]?.isVenture && (
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: workspace.accent }} />
              )}
            </div>
          </>
        ) : (
          /* Icon-only mode — just the logo */
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent shrink-0 flex items-center justify-center text-[#06121f] font-bold text-sm">
              Y
            </div>
          </div>
        )}
      </div>

      {/* ── Nav sections ───────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto no-scrollbar" onClick={handleNav}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading}>
            {mode === 'full' && (
              <div className="text-[10px] tracking-[0.15em] text-on-surface-variant px-3 mb-1.5 uppercase">
                {section.heading}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`nav-link ${active ? 'active' : ''} ${mode === 'icons' ? 'justify-center px-2' : ''}`}
                      title={mode === 'icons' ? item.label : undefined}
                    >
                      <span className="material-symbols-outlined text-[20px] shrink-0">
                        {item.icon}
                      </span>
                      {mode === 'full' && <span className="flex-1 truncate">{item.label}</span>}
                      {mode === 'full' && item.badge && item.badge > 0 && (
                        <span className="chip chip-accent text-[10px] px-1.5 py-0.5">
                          {item.badge}
                        </span>
                      )}
                      {mode === 'icons' && item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-[#06121f] text-[9px] font-bold flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Bottom: collapse toggle (desktop only) ──────────────────────────── */}
      <div className="p-3 border-t border-white/[0.06] hidden md:block">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition text-on-surface-variant text-xs"
          title={mode === 'full' ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {mode === 'full' ? 'chevron_left' : 'chevron_right'}
          </span>
          {mode === 'full' && <span>Collapse</span>}
        </button>
      </div>
    </div>
  )
}
