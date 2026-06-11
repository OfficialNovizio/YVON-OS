import 'server-only'
import { supabase } from '@/lib/supabase'
import type {
  WarRoomPlanRecord,
  WarRoomStep,
  WarRoomToolCall,
  ExecutionPlan,
  AgentId,
  StrategyLogEntry,
  LeverTrackerEntry,
  DailyLog,
} from '@/lib/types'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SaveWarRoomPlanInput {
  ventureName: string
  userPrompt: string
  intent: string | null
  plan: ExecutionPlan | null
  agentsUsed: AgentId[]
  status: 'complete' | 'partial' | 'error'
  synthesis: string
  elapsedMs: number
  steps: Array<{
    agentId: AgentId
    taskBrief: string | null
    outputContent: string | null
    status: 'complete' | 'error' | 'retried'
    retryCount: number
    toolCalls?: WarRoomToolCall[]
    turnIndex?: number
  }>
  conversationHistory?: Array<{ user: string; marcus: string }>
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function trimToolInput(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (k === 'content') { out[k] = `[${typeof v === 'string' ? v.length : 0} chars omitted]`; continue }
    if (typeof v === 'string' && v.length > 500) { out[k] = v.slice(0, 500) + '…'; continue }
    out[k] = v
  }
  return out
}

function sanitizeToolCallsForStore(toolCalls?: WarRoomToolCall[]): WarRoomToolCall[] {
  if (!toolCalls || toolCalls.length === 0) return []
  return toolCalls.map(tc => ({
    name:    tc.name,
    isError: tc.isError,
    summary: tc.summary ? tc.summary.slice(0, 500) : null,
    input:   trimToolInput(tc.input),
  }))
}

function mapStrategyLog(r: Record<string, unknown>): StrategyLogEntry {
  return {
    id:                  r.id as string,
    brand:               r.brand as string,
    surface:             r.surface as string,
    lever:               r.lever as string,
    layerNumber:         r.layer_number as number,
    variantA:            r.variant_a as string,
    variantB:            r.variant_b as string,
    runRecommendation:   r.run_recommendation as 'A' | 'B',
    result:              (r.result as string | null) ?? null,
    diagnosis:           (r.diagnosis as string | null) ?? null,
    mechanismConfirmed:  (r.mechanism_confirmed as boolean | null) ?? null,
    nextCycleDirection:  (r.next_cycle_direction as string | null) ?? null,
    createdAt:           r.created_at as string,
  }
}

// ─── War Room Execution Plans ─────────────────────────────────────────────────

export async function saveWarRoomPlan(input: SaveWarRoomPlanInput): Promise<string> {
  const { data: planRow, error: planErr } = await supabase
    .from('execution_plans')
    .insert({
      venture_name:         input.ventureName,
      user_prompt:          input.userPrompt,
      intent:               input.intent,
      objective:            input.plan?.objective ?? null,
      definition_done:      input.plan?.definition_of_done ?? null,
      agent_order:          input.plan?.order ?? 'parallel',
      agents_used:          input.agentsUsed,
      status:               input.status,
      synthesis:            input.synthesis,
      elapsed_ms:           input.elapsedMs,
      conversation_history: input.conversationHistory ?? [],
    })
    .select('id')
    .single()

  if (planErr ?? !planRow) throw new Error(planErr?.message ?? 'Failed to save plan')

  const planId = planRow.id as string

  if (input.steps.length > 0) {
    await supabase.from('execution_steps').insert(
      input.steps.map(s => ({
        plan_id:        planId,
        agent_id:       s.agentId,
        task_brief:     s.taskBrief,
        output_content: s.outputContent,
        status:         s.status,
        retry_count:    s.retryCount,
        tool_calls:     sanitizeToolCallsForStore(s.toolCalls),
        turn_index:     s.turnIndex ?? 0,
      }))
    )
  }

  return planId
}

export async function updateWarRoomPlan(
  planId: string,
  patch: {
    synthesis?: string
    status?: 'complete' | 'partial' | 'error'
    elapsedMs?: number
    agentsUsed?: AgentId[]
    steps?: SaveWarRoomPlanInput['steps']
    conversationHistory?: Array<{ user: string; marcus: string }>
  }
): Promise<void> {
  await supabase
    .from('execution_plans')
    .update({
      ...(patch.synthesis            !== undefined ? { synthesis:            patch.synthesis            } : {}),
      ...(patch.status               !== undefined ? { status:               patch.status               } : {}),
      ...(patch.elapsedMs            !== undefined ? { elapsed_ms:           patch.elapsedMs            } : {}),
      ...(patch.agentsUsed           !== undefined ? { agents_used:          patch.agentsUsed           } : {}),
      ...(patch.conversationHistory  !== undefined ? { conversation_history: patch.conversationHistory  } : {}),
    })
    .eq('id', planId)

  if (patch.steps && patch.steps.length > 0) {
    await supabase.from('execution_steps').insert(
      patch.steps.map(s => ({
        plan_id:        planId,
        agent_id:       s.agentId,
        task_brief:     s.taskBrief,
        output_content: s.outputContent,
        status:         s.status,
        retry_count:    s.retryCount,
        tool_calls:     sanitizeToolCallsForStore(s.toolCalls),
        turn_index:     s.turnIndex ?? 0,
      }))
    )
  }
}

export async function getWarRoomPlans(
  ventureName: string,
  limit = 20
): Promise<WarRoomPlanRecord[]> {
  const { data: plans } = await supabase
    .from('execution_plans')
    .select('*')
    .eq('venture_name', ventureName)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!plans || plans.length === 0) return []

  const planIds = plans.map(p => p.id as string)

  const { data: steps } = await supabase
    .from('execution_steps')
    .select('*')
    .in('plan_id', planIds)
    .order('created_at', { ascending: true })

  const stepsByPlan = new Map<string, WarRoomStep[]>()
  for (const s of steps ?? []) {
    const list = stepsByPlan.get(s.plan_id as string) ?? []
    list.push({
      id:            s.id as string,
      planId:        s.plan_id as string,
      agentId:       s.agent_id as AgentId,
      taskBrief:     (s.task_brief as string | null) ?? null,
      outputContent: (s.output_content as string | null) ?? null,
      status:        s.status as WarRoomStep['status'],
      retryCount:    (s.retry_count as number) ?? 0,
      toolCalls:     (s.tool_calls as WarRoomToolCall[] | null) ?? [],
      turnIndex:     (s.turn_index as number | null) ?? 0,
      createdAt:     s.created_at as string,
    })
    stepsByPlan.set(s.plan_id as string, list)
  }

  return plans.map(p => ({
    id:                  p.id as string,
    ventureName:         p.venture_name as string,
    userPrompt:          p.user_prompt as string,
    intent:              (p.intent as string | null) ?? null,
    objective:           (p.objective as string | null) ?? null,
    definitionDone:      (p.definition_done as string | null) ?? null,
    agentOrder:          (p.agent_order as 'parallel' | 'sequential') ?? 'parallel',
    agentsUsed:          (p.agents_used as AgentId[]) ?? [],
    status:              p.status as WarRoomPlanRecord['status'],
    synthesis:           (p.synthesis as string | null) ?? null,
    elapsedMs:           (p.elapsed_ms as number | null) ?? null,
    createdAt:           p.created_at as string,
    steps:               stepsByPlan.get(p.id as string) ?? [],
    conversationHistory: (p.conversation_history as Array<{ user: string; marcus: string }>) ?? [],
  }))
}

export async function deleteWarRoomPlan(planId: string): Promise<void> {
  await supabase.from('execution_steps').delete().eq('plan_id', planId)
  await supabase.from('execution_plans').delete().eq('id', planId)
}

export async function deleteAllWarRoomPlans(ventureName: string): Promise<void> {
  const { data: plans } = await supabase
    .from('execution_plans')
    .select('id')
    .eq('venture_name', ventureName)
  if (plans && plans.length > 0) {
    const ids = plans.map(p => p.id as string)
    await supabase.from('execution_steps').delete().in('plan_id', ids)
  }
  await supabase.from('execution_plans').delete().eq('venture_name', ventureName)
}

// ─── Strategy Log ─────────────────────────────────────────────────────────────

export async function saveStrategyLog(
  entry: Omit<StrategyLogEntry, 'id' | 'createdAt'>
): Promise<string> {
  const { data, error } = await supabase
    .from('strategy_log')
    .insert({
      brand:               entry.brand,
      surface:             entry.surface,
      lever:               entry.lever,
      layer_number:        entry.layerNumber,
      variant_a:           entry.variantA,
      variant_b:           entry.variantB,
      run_recommendation:  entry.runRecommendation,
      result:              entry.result ?? null,
      diagnosis:           entry.diagnosis ?? null,
      mechanism_confirmed: entry.mechanismConfirmed ?? null,
      next_cycle_direction:entry.nextCycleDirection ?? null,
    })
    .select('id')
    .single()
  if (error ?? !data) throw new Error('Failed to save strategy log')
  return data.id as string
}

export async function getPendingStrategyLogs(brand: string): Promise<StrategyLogEntry[]> {
  const { data } = await supabase
    .from('strategy_log')
    .select('*')
    .eq('brand', brand)
    .is('result', null)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapStrategyLog)
}

export async function updateStrategyLogResult(
  id: string,
  result: string,
  diagnosis: string,
  mechanismConfirmed: boolean,
  nextCycleDirection: string
): Promise<void> {
  await supabase.from('strategy_log').update({
    result,
    diagnosis,
    mechanism_confirmed:  mechanismConfirmed,
    next_cycle_direction: nextCycleDirection,
  }).eq('id', id)
}

export async function getStrategyLog(brand: string, surface?: string, limit = 10): Promise<StrategyLogEntry[]> {
  let q = supabase.from('strategy_log').select('*').eq('brand', brand)
  if (surface) q = q.eq('surface', surface)
  const { data } = await q.order('created_at', { ascending: false }).limit(limit)
  return (data ?? []).map(mapStrategyLog)
}

// ─── Lever Tracker ────────────────────────────────────────────────────────────

export async function getLeverTracker(brand: string, surface: string): Promise<LeverTrackerEntry | null> {
  const { data } = await supabase
    .from('lever_tracker')
    .select('*')
    .eq('brand', brand)
    .eq('surface', surface)
    .single()
  if (!data) return null
  return {
    id:         data.id as string,
    brand:      data.brand as string,
    surface:    data.surface as string,
    lever:      data.lever as string,
    usageCount: data.usage_count as number,
    capped:     data.capped as boolean,
    lastUsed:   data.last_used as string,
  }
}

export async function updateLeverTracker(
  brand: string,
  surface: string,
  lever: string
): Promise<{ capped: boolean; count: number }> {
  const existing = await getLeverTracker(brand, surface)

  if (!existing || existing.lever !== lever) {
    await supabase.from('lever_tracker').upsert({
      brand, surface, lever,
      usage_count: 1,
      capped:      false,
      last_used:   new Date().toISOString(),
    }, { onConflict: 'brand,surface' })
    return { capped: false, count: 1 }
  }

  const newCount = Math.min(existing.usageCount + 1, 3)
  const capped   = newCount >= 3
  await supabase.from('lever_tracker').update({
    usage_count: newCount,
    capped,
    last_used:   new Date().toISOString(),
  }).eq('brand', brand).eq('surface', surface)

  return { capped, count: newCount }
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export async function getDailyLogs(
  ventureId: string,
  opts: { days?: number } = {}
): Promise<DailyLog[]> {
  const since = new Date()
  since.setDate(since.getDate() - (opts.days ?? 7))

  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('venture_id', ventureId)
    .gte('log_date', since.toISOString().split('T')[0])
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false })

  return (data ?? []).map(row => ({
    id: row.id as string,
    ventureId: row.venture_id as string,
    agentId: row.agent_id as string,
    task: row.task as string,
    outcome: (row.outcome as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    logDate: row.log_date as string,
    createdAt: row.created_at as string,
  }))
}

export async function appendDailyLog(log: Omit<DailyLog, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('daily_logs').insert({
    venture_id: log.ventureId,
    agent_id: log.agentId,
    task: log.task,
    outcome: log.outcome ?? null,
    notes: log.notes ?? null,
    log_date: log.logDate,
  })
}
