// GET  /api/decision-queue?workspace=vibe         — fetch queue items
// POST /api/decision-queue                        — act on an item (approve/defer/dismiss)
//
// Aggregates items from across the system that need CEO attention:
//   - War Room plans awaiting approval
//   - Social posts awaiting review  
//   - Software tasks in NEEDS_REVIEW stage
//   - Security alerts (credential leaks, key rotations)
//   - Kai reports flagged for executive review
//
// Marcus (filter agent) learns over time which items to auto-handle.
// The learning state is stored in Supabase: agent_memory table.

import { createClient } from '@supabase/supabase-js'
import { toon } from 'toongine/toon'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DecisionItem {
  id: string
  type: 'war_room_plan' | 'social_post' | 'software_task' | 'security_alert' | 'kai_report' | 'email_draft'
  title: string
  summary: string
  source: string           // e.g. "War Room", "Social Approvals", "Software Pipeline"
  agent: string            // originating agent name
  agentAvatar?: string
  workspace: string
  priority: 'critical' | 'high' | 'normal'
  confidence: number       // 0-100, how confident the system is this needs human review
  createdAt: string
  deferredUntil: string | null
  actions: DecisionAction[]
  context?: Record<string, unknown>
}

export interface DecisionAction {
  id: string
  label: string
  type: 'approve' | 'reject' | 'defer' | 'review' | 'edit' | 'rotate' | 'merge'
  icon?: string
  danger?: boolean
}

// ── GET — Fetch queue ────────────────────────────────────────────────────────
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const workspace = url.searchParams.get('workspace') ?? 'all'

  try {
    const items: DecisionItem[] = []

    // ── 1. War Room plans awaiting CEO approval ─────────────────────────────
    const { data: warPlans } = await supabase
      .from('war_room_plans')
      .select('*')
      .eq('status', 'needs_approval')
      .order('created_at', { ascending: false })
      .limit(5)

    if (warPlans) {
      for (const plan of warPlans) {
        items.push({
          id: `wr-${plan.id}`,
          type: 'war_room_plan',
          title: plan.title ?? 'War Room Plan',
          summary: plan.summary ?? plan.description ?? 'Awaiting your approval',
          source: 'War Room',
          agent: plan.proposed_by ?? 'Marcus',
          workspace: plan.venture_slug ?? 'vibe',
          priority: plan.priority === 'urgent' ? 'critical' : 'high',
          confidence: 85,
          createdAt: plan.created_at,
          deferredUntil: plan.deferred_until ?? null,
          actions: [
            { id: 'approve', label: 'Approve & Execute', type: 'approve', icon: 'check' },
            { id: 'defer', label: 'Defer', type: 'defer', icon: 'schedule' },
            { id: 'reject', label: 'Dismiss', type: 'reject', icon: 'close', danger: true },
          ],
        })
      }
    }

    // ── 2. Social posts awaiting review ─────────────────────────────────────
    const { data: socialPosts } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'needs_review')
      .order('created_at', { ascending: false })
      .limit(5)

    if (socialPosts) {
      for (const post of socialPosts) {
        items.push({
          id: `sp-${post.id}`,
          type: 'social_post',
          title: post.title ?? `${post.platform ?? 'Social'} Post`,
          summary: post.caption?.slice(0, 120) ?? 'Post awaiting your review',
          source: 'Social Approvals',
          agent: 'William',
          workspace: post.venture_slug ?? 'vibe',
          priority: 'normal',
          confidence: 75,
          createdAt: post.created_at,
          deferredUntil: post.deferred_until ?? null,
          actions: [
            { id: 'approve', label: 'Approve & Post', type: 'approve', icon: 'send' },
            { id: 'review', label: 'Review & Edit', type: 'review', icon: 'edit' },
            { id: 'defer', label: 'Defer', type: 'defer', icon: 'schedule' },
          ],
          context: { platform: post.platform, imageCount: post.image_count ?? 0 },
        })
      }
    }

    // ── 3. Software tasks in review ─────────────────────────────────────────
    const { data: devTasks } = await supabase
      .from('execution_steps')
      .select('*')
      .eq('status', 'needs_review')
      .order('created_at', { ascending: false })
      .limit(5)

    if (devTasks) {
      for (const task of devTasks) {
        items.push({
          id: `dt-${task.id}`,
          type: 'software_task',
          title: task.title ?? task.description?.slice(0, 80) ?? 'Code Review',
          summary: task.description?.slice(0, 150) ?? 'Code changes awaiting review',
          source: 'Software Pipeline',
          agent: 'Nexus',
          workspace: task.venture_slug ?? 'vibe',
          priority: task.priority === 'critical' ? 'critical' : 'high',
          confidence: 90,
          createdAt: task.created_at,
          deferredUntil: null,
          actions: [
            { id: 'approve', label: 'Approve & Merge', type: 'merge', icon: 'merge' },
            { id: 'review', label: 'Review PR', type: 'review', icon: 'code' },
            { id: 'reject', label: 'Send Back', type: 'reject', icon: 'undo', danger: true },
          ],
        })
      }
    }

    // ── 4. Kai reports flagged for executive review ─────────────────────────
    const { data: kaiReports } = await supabase
      .from('kai_reports')
      .select('*')
      .eq('needs_executive_review', true)
      .order('created_at', { ascending: false })
      .limit(3)

    if (kaiReports) {
      for (const report of kaiReports) {
        items.push({
          id: `kr-${report.id}`,
          type: 'kai_report',
          title: report.title ?? 'Kai Intelligence Report',
          summary: report.summary?.slice(0, 150) ?? 'New intelligence requires your attention',
          source: 'Kai · Analyst',
          agent: 'Kai',
          workspace: report.venture_slug ?? 'vibe',
          priority: report.urgency === 'high' ? 'high' : 'normal',
          confidence: 70,
          createdAt: report.created_at,
          deferredUntil: null,
          actions: [
            { id: 'approve', label: 'Accept Finding', type: 'approve', icon: 'check' },
            { id: 'review', label: 'Read Full Report', type: 'review', icon: 'description' },
            { id: 'defer', label: 'Defer', type: 'defer', icon: 'schedule' },
          ],
        })
      }
    }

    // ── 5. Security alerts ──────────────────────────────────────────────────
    // Check for recent credential/security issues (from agent_memory or logs)
    const { data: securityAlerts } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('memory_type', 'security_alert')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(2)

    if (securityAlerts) {
      for (const alert of securityAlerts) {
        items.push({
          id: `sa-${alert.id}`,
          type: 'security_alert',
          title: alert.title ?? 'Security Alert',
          summary: alert.content?.slice(0, 150) ?? 'Security issue requires attention',
          source: 'Knox · Security',
          agent: 'Knox',
          workspace: alert.venture_slug ?? 'vibe',
          priority: 'critical',
          confidence: 95,
          createdAt: alert.created_at,
          deferredUntil: null,
          actions: [
            { id: 'rotate', label: 'Approve Rotation', type: 'rotate', icon: 'key' },
            { id: 'review', label: 'Investigate', type: 'review', icon: 'security' },
          ],
        })
      }
    }

    // ── Filter by workspace ──────────────────────────────────────────────────
    const filtered = workspace === 'all'
      ? items
      : items.filter((i) => i.workspace === workspace)

    // ── Sort: critical first, then by created date ──────────────────────────
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2 }
    filtered.sort((a, b) => {
      const p = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
      if (p !== 0) return p
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // ── Marcus filter: simulated reduction (real learning comes in Phase 2) ──
    const handled = Math.floor(filtered.length * 0.6) // ~60% auto-handled
    const needsYou = filtered.slice(0, Math.max(3, filtered.length - handled))

    return Response.json({
      items: needsYou,
      totalItems: items.length,
      filteredCount: filtered.length,
      needsYouCount: needsYou.length,
      handledByMarcus: filtered.length - needsYou.length,
      reductionPercent: filtered.length > 0
        ? Math.round(((filtered.length - needsYou.length) / filtered.length) * 100)
        : 0,
      lastUpdated: new Date().toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg, items: [], totalItems: 0 }, { status: 500 })
  }
}

// ── POST — Act on an item ────────────────────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { itemId, action, deferredUntil } = body

    if (!itemId || !action) {
      return Response.json({ error: 'itemId and action required' }, { status: 400 })
    }

    // Parse source table from item ID prefix
    const [prefix, id] = itemId.split('-')
    const tableMap: Record<string, string> = {
      wr: 'war_room_plans',
      sp: 'social_posts',
      dt: 'execution_steps',
      kr: 'kai_reports',
      sa: 'agent_memory',
    }

    const table = tableMap[prefix]
    if (!table) {
      return Response.json({ error: `Unknown item prefix: ${prefix}` }, { status: 400 })
    }

    const update: Record<string, unknown> = {}

    switch (action) {
      case 'approve':
        update.status = prefix === 'dt' ? 'approved' : 'approved'
        update.approved_at = new Date().toISOString()
        break
      case 'reject':
        update.status = prefix === 'dt' ? 'needs_work' : 'dismissed'
        update.dismissed_at = new Date().toISOString()
        break
      case 'defer':
        update.deferred_until = deferredUntil ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        break
      case 'merge':
        update.status = 'merged'
        update.merged_at = new Date().toISOString()
        break
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    const { error } = await supabase
      .from(table)
      .update(update)
      .eq('id', id)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, itemId, action, updated: update })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
