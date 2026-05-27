/**
 * lib/agent-memory.ts — DB-backed agent MEMORY.md replacement.
 *
 * Replaces filesystem reads of agent-department/[Dept]/[agent]/MEMORY.md.
 * Source of truth lives in the `agent_memory` Supabase table.
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
