/**
 * lib/agent-memory.ts — DB-backed agent memory system.
 *
 * Two memory layers:
 *
 * 1. agent_memory (flat, per-agent) — legacy persona/MEMORY.md store.
 *    Used by Quinn self-learning corrections. One row per agent, mutable text blob.
 *
 * 2. venture_agent_memories (structured, per-venture per-agent) — new layer.
 *    Structured rows with importance + tags. Smart retrieval: recent work always
 *    surfaces; old work surfaces only when importance >= 8 OR tags overlap with task.
 *    Cap: 50 rows per (venture_slug, agent_id), enforced by DB trigger.
 *
 * Server-only — uses service-role credentials.
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'

export interface AgentMemoryRow {
  agentId:   string
  content:   string
  updatedAt: string
}

function client() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase credentials not configured')
  return createClient(url, key)
}

/**
 * Read one agent's memory. If `currentVenture` is provided, strip dated session-log
 * lines tagged for OTHER ventures so the agent doesn't see irrelevant history.
 * Returns a capped excerpt (default 600 chars) — pass `cap: 0` for full content.
 */
export async function getAgentMemory(
  agentId: string,
  currentVenture?: string,
  cap: number = 600,
): Promise<string> {
  const sb = client()
  const { data, error } = await sb
    .from('agent_memory')
    .select('content')
    .eq('agent_id', agentId)
    .maybeSingle()
  if (error || !data) return ''
  const content = data.content as string
  if (!currentVenture) return cap > 0 ? content.slice(0, cap) : content

  const slug = currentVenture.toLowerCase().replace(/\s+/g, '-')
  const filtered = content
    .split('\n')
    .filter(line => {
      // Keep non-log lines (headers, rules, persona)
      if (!/^\[20\d{2}-\d{2}-\d{2}\]/.test(line.trim())) return true
      // Keep log lines tagged with the current venture or untagged (legacy)
      if (line.includes(`[venture:${slug}]`)) return true
      if (!line.includes('[venture:')) return true
      return false
    })
    .join('\n')

  return cap > 0 ? filtered.slice(0, cap) : filtered
}

/** Read full content (no cap, no filter) — used by the edit UI. */
export async function getAgentMemoryRaw(agentId: string): Promise<AgentMemoryRow | null> {
  const sb = client()
  const { data, error } = await sb
    .from('agent_memory')
    .select('agent_id, content, updated_at')
    .eq('agent_id', agentId)
    .maybeSingle()
  if (error || !data) return null
  return {
    agentId:   data.agent_id as string,
    content:   data.content as string,
    updatedAt: data.updated_at as string,
  }
}

/** List all agents with their memory metadata (sizes + timestamps; no content). */
export async function listAgentMemoryStatus(): Promise<Array<{ agentId: string; length: number; updatedAt: string }>> {
  const sb = client()
  const { data, error } = await sb
    .from('agent_memory')
    .select('agent_id, content, updated_at')
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => ({
    agentId:   r.agent_id as string,
    length:    (r.content as string).length,
    updatedAt: r.updated_at as string,
  })).sort((a, b) => a.agentId.localeCompare(b.agentId))
}

/** Upsert one agent's memory. */
export async function setAgentMemory(agentId: string, content: string): Promise<void> {
  const sb = client()
  const { error } = await sb
    .from('agent_memory')
    .upsert(
      { agent_id: agentId, content, updated_at: new Date().toISOString() },
      { onConflict: 'agent_id' },
    )
  if (error) throw new Error(error.message)
}

// ─── Venture-scoped structured memory (venture_agent_memories) ──────────────
//
// Smart retrieval rules (applied in DB query + in-process filter):
//   Age < 7 days    → always return (cap 8 recent entries)
//   Age 7–180 days  → return if importance >= 6
//   Age > 180 days  → return if importance >= 9
//   High importance (>= 9) always returned regardless of age (cap 3 entries)
//
// This means:
//   - Day-to-day corrections always surface (they're recent)
//   - Work from 6 months ago surfaces only if it was critical (importance 9-10)
//   - Tags can be used to surface topic-specific old memories when needed

export interface VentureAgentMemory {
  id:              string
  ventureSlug:     string
  agentId:         string
  memoryKey?:      string
  content:         string
  memoryType:      'learned' | 'correction' | 'preference' | 'context'
  importance:      number
  tags:            string[]
  sourceSessionId?: string
  createdAt:       string
  updatedAt:       string
  lastAccessedAt?: string
  accessCount:     number
}

/** Smart retrieval: surfaces recent + high-importance memories for an agent+venture. */
export async function getVentureAgentMemories(
  ventureSlug: string,
  agentId: string,
  taskTags?: string[],   // optional topic tags to also surface old but tag-matched memories
): Promise<VentureAgentMemory[]> {
  const sb = client()

  // Pull all entries for this agent+venture (DB cap is 50), sorted by importance DESC, updated DESC.
  // We apply age-decay filtering in process so the DB does minimal work.
  const { data } = await sb
    .from('venture_agent_memories')
    .select('*')
    .eq('venture_slug', ventureSlug)
    .eq('agent_id', agentId)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(50)

  if (!data || data.length === 0) return []

  const now     = Date.now()
  const DAY_MS  = 86_400_000
  const result: VentureAgentMemory[] = []

  // Buckets with separate caps to prevent any one bucket from dominating
  const recentEntries:      VentureAgentMemory[] = []  // < 7 days, cap 8
  const mediumEntries:      VentureAgentMemory[] = []  // 7–180 days importance >= 6, cap 4
  const ancientHighImport:  VentureAgentMemory[] = []  // > 180 days importance >= 9, cap 2
  const tagMatchedEntries:  VentureAgentMemory[] = []  // any age, tag overlap, cap 3

  for (const row of data) {
    const m: VentureAgentMemory = {
      id:              row.id as string,
      ventureSlug:     row.venture_slug as string,
      agentId:         row.agent_id as string,
      memoryKey:       row.memory_key as string | undefined,
      content:         row.content as string,
      memoryType:      row.memory_type as VentureAgentMemory['memoryType'],
      importance:      row.importance as number,
      tags:            (row.tags as string[]) ?? [],
      sourceSessionId: row.source_session_id as string | undefined,
      createdAt:       row.created_at as string,
      updatedAt:       row.updated_at as string,
      lastAccessedAt:  row.last_accessed_at as string | undefined,
      accessCount:     row.access_count as number,
    }

    const ageMs = now - new Date(m.updatedAt).getTime()
    const ageDays = ageMs / DAY_MS

    if (ageDays < 7) {
      recentEntries.push(m)
    } else if (ageDays < 180 && m.importance >= 6) {
      mediumEntries.push(m)
    } else if (ageDays >= 180 && m.importance >= 9) {
      ancientHighImport.push(m)
    }

    // Tag overlap — surface old memories when the current task shares tags
    if (taskTags && taskTags.length > 0 && m.tags.length > 0 && ageDays >= 7) {
      const overlap = m.tags.some(t => taskTags.includes(t))
      if (overlap && m.importance >= 5) {
        tagMatchedEntries.push(m)
      }
    }
  }

  // Merge with per-bucket caps, deduplicate by ID
  const seen = new Set<string>()
  const add = (entries: VentureAgentMemory[], cap: number) => {
    let added = 0
    for (const e of entries) {
      if (added >= cap) break
      if (!seen.has(e.id)) { seen.add(e.id); result.push(e); added++ }
    }
  }

  add(recentEntries,     8)
  add(mediumEntries,     4)
  add(ancientHighImport, 2)
  add(tagMatchedEntries, 3)

  // Mark as accessed (fire-and-forget, non-critical)
  const ids = result.map(r => r.id)
  if (ids.length > 0) {
    void sb.from('venture_agent_memories')
      .update({ last_accessed_at: new Date().toISOString(), access_count: (0) })
      .in('id', ids)
  }

  return result
}

/** Format venture memories as a context block for injection into specialist prompts. */
export function formatVentureMemoriesBlock(memories: VentureAgentMemory[]): string {
  if (memories.length === 0) return ''

  const lines = memories.map(m => {
    const date  = m.updatedAt.slice(0, 10)
    const tag   = m.memoryType === 'correction' ? '⚠️ CORRECTION' : m.memoryType === 'preference' ? '🎯 PREFERENCE' : '📝'
    const imp   = m.importance >= 8 ? ` [importance:${m.importance}]` : ''
    return `${tag}${imp} [${date}]: ${m.content.slice(0, 400)}`
  }).join('\n')

  return `<venture-memory>\n[Structured agent memories for this venture — treat as learned context, not new input.]\n\n${lines}\n</venture-memory>`
}

/** Save a single memory entry for a venture+agent. */
export async function saveVentureAgentMemory(
  ventureSlug: string,
  agentId: string,
  data: {
    content:          string
    memoryType?:      'learned' | 'correction' | 'preference' | 'context'
    importance?:      number
    tags?:            string[]
    memoryKey?:       string
    sourceSessionId?: string
  },
): Promise<void> {
  const sb = client()

  // If memoryKey provided, upsert by (venture_slug, agent_id, memory_key)
  if (data.memoryKey) {
    const { data: existing } = await sb
      .from('venture_agent_memories')
      .select('id')
      .eq('venture_slug', ventureSlug)
      .eq('agent_id', agentId)
      .eq('memory_key', data.memoryKey)
      .maybeSingle()

    if (existing?.id) {
      await sb.from('venture_agent_memories').update({
        content:           data.content,
        memory_type:       data.memoryType ?? 'learned',
        importance:        data.importance ?? 5,
        tags:              data.tags ?? [],
        source_session_id: data.sourceSessionId ?? null,
      }).eq('id', existing.id)
      return
    }
  }

  await sb.from('venture_agent_memories').insert({
    venture_slug:      ventureSlug,
    agent_id:          agentId,
    memory_key:        data.memoryKey ?? null,
    content:           data.content,
    memory_type:       data.memoryType ?? 'learned',
    importance:        data.importance ?? 5,
    tags:              data.tags ?? [],
    source_session_id: data.sourceSessionId ?? null,
  })
}

// ─── Session History (agent_session_memory) ──────────────────────────────────

export interface AgentSessionEntry {
  id:              string
  agentId:         string
  venture:         string | null
  sessionDate:     string
  summary:         string
  learnings:       string[]
  corrections:     string[]
  filesChanged:    string[]
  toolCallsCount:  number
  createdAt:       string
}

/** Save a session entry. Auto-pruned to 50 per agent by DB trigger. */
export async function saveSessionMemory(
  agentId: string,
  data: {
    venture?:        string
    summary:         string
    learnings?:      string[]
    corrections?:    string[]
    filesChanged?:   string[]
    toolCallsCount?: number
  },
): Promise<void> {
  const sb = client()
  const { error } = await sb.from('agent_session_memory').insert({
    agent_id:         agentId,
    venture:          data.venture ?? null,
    summary:          data.summary,
    learnings:        data.learnings    ?? [],
    corrections:      data.corrections  ?? [],
    files_changed:    data.filesChanged ?? [],
    tool_calls_count: data.toolCallsCount ?? 0,
  })
  if (error) throw new Error(error.message)
}

/** Read last N sessions for an agent (newest first). */
export async function getSessionHistory(
  agentId: string,
  limit: number = 10,
): Promise<AgentSessionEntry[]> {
  const sb = client()
  const { data, error } = await sb
    .from('agent_session_memory')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 50))
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => ({
    id:             r.id             as string,
    agentId:        r.agent_id       as string,
    venture:        r.venture        as string | null,
    sessionDate:    r.session_date   as string,
    summary:        r.summary        as string,
    learnings:      (r.learnings     as string[]) ?? [],
    corrections:    (r.corrections   as string[]) ?? [],
    filesChanged:   (r.files_changed as string[]) ?? [],
    toolCallsCount: (r.tool_calls_count as number) ?? 0,
    createdAt:      r.created_at     as string,
  }))
}
