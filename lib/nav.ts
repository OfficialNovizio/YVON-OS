// Sidebar navigation, mirroring the LifeOS Mission Control briefings.
// `full: true` marks the 6 hero screens that are fully built.

export type NavItem = {
  label: string
  href: string
  icon: string // lucide-react icon name
  badge?: number
  full?: boolean
}

export type NavSection = {
  title?: string
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Decision Queue', href: '/decision-queue', icon: 'Inbox', badge: 7, full: true },
      { label: 'Task Board', href: '/task-board', icon: 'KanbanSquare', full: true },
      { label: 'Advisory Council', href: '/advisory-council', icon: 'Users', full: true },
      { label: 'Agents', href: '/agents', icon: 'Bot', full: true },
      { label: 'Org Chart', href: '/org-chart', icon: 'Network' },
      { label: 'Office', href: '/office', icon: 'Building2' },
      { label: 'Skill Workshop', href: '/skill-workshop', icon: 'GraduationCap' },
    ],
  },
  {
    title: 'Long-form',
    items: [
      { label: 'Content Pipeline', href: '/content-pipeline', icon: 'Clapperboard' },
      { label: 'Production Calendar', href: '/production-calendar', icon: 'CalendarDays' },
      { label: 'YouTube Studio', href: '/youtube-studio', icon: 'Youtube' },
      { label: 'YouTube Analytics', href: '/youtube-analytics', icon: 'BarChart3' },
    ],
  },
  {
    title: 'Shorts',
    items: [
      { label: 'Short Pipeline', href: '/short-pipeline', icon: 'Scissors' },
      { label: 'Shorts', href: '/shorts', icon: 'Smartphone' },
    ],
  },
  {
    title: 'Posts',
    items: [
      { label: 'Social Approvals', href: '/social-approvals', icon: 'CheckCheck', badge: 6 },
      { label: 'Scheduler', href: '/scheduler', icon: 'CalendarClock' },
      { label: 'Social Analytics', href: '/social-analytics', icon: 'LineChart' },
      { label: 'Newsletter', href: '/newsletter', icon: 'Mail' },
    ],
  },
  {
    title: 'Knowledge',
    items: [
      { label: 'Brain & Wiki', href: '/brain-wiki', icon: 'BrainCircuit', full: true },
      { label: 'Asset Lab · Leonardo', href: '/asset-lab', icon: 'Image' },
      { label: 'Trend Radar · Isaac', href: '/trend-radar', icon: 'Radar' },
    ],
  },
  {
    title: 'Build · Software Factory',
    items: [
      { label: 'Idea Feed', href: '/idea-feed', icon: 'Lightbulb', badge: 94 },
      { label: 'Software Pipeline', href: '/software-pipeline', icon: 'GitPullRequest', badge: 1, full: true },
    ],
  },
  {
    title: 'Revenue',
    items: [
      { label: 'Consulting CRM', href: '/consulting-crm', icon: 'Briefcase', badge: 3 },
      { label: 'Cinematic Sites', href: '/cinematic-sites', icon: 'Globe' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Email Inbox', href: '/inbox', icon: 'AtSign' },
      { label: 'People', href: '/people', icon: 'Contact' },
      { label: 'Projects', href: '/projects', icon: 'FolderKanban' },
      { label: 'Docs', href: '/docs', icon: 'FileText' },
      { label: 'Logs', href: '/logs', icon: 'ScrollText' },
      { label: 'Hardware & Runtime', href: '/hardware', icon: 'Cpu' },
    ],
  },
]

export const ALL_ITEMS: NavItem[] = NAV.flatMap((s) => s.items)
