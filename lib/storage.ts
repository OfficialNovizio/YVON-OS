// ─── Ephemeral UI Storage (localStorage) ─────────────────────────────────────
// Only UI state lives here. All persistent data (social stats, trending, agent
// history, settings) is now stored in Supabase via lib/db.ts.

const KEYS = {
  ACTIVE_TAB:     'yvon_ui_active_tab',
  SCROLL_POS:     'yvon_ui_scroll_pos',
  ACTIVE_VENTURE: 'yvon_active_venture',
} as const

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function get<T>(key: string): T | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function set<T>(key: string, value: T): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be full — fail silently
  }
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export function getActiveTab(page: string): string | null {
  return get<string>(`${KEYS.ACTIVE_TAB}_${page}`)
}
export function setActiveTab(page: string, tab: string): void {
  set(`${KEYS.ACTIVE_TAB}_${page}`, tab)
}

export function getScrollPos(page: string): number {
  return get<number>(`${KEYS.SCROLL_POS}_${page}`) ?? 0
}
export function setScrollPos(page: string, pos: number): void {
  set(`${KEYS.SCROLL_POS}_${page}`, pos)
}

// ─── Clear All (UI keys only) ─────────────────────────────────────────────────

export function clearAll(): void {
  if (!isBrowser()) return
  const uiPrefixes = [KEYS.ACTIVE_TAB, KEYS.SCROLL_POS, KEYS.ACTIVE_VENTURE]
  const keysToRemove = Object.keys(localStorage).filter((k) =>
    uiPrefixes.some((prefix) => k.startsWith(prefix))
  )
  keysToRemove.forEach((k) => localStorage.removeItem(k))
}
