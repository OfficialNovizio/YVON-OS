import 'server-only'
import { supabase } from '@/lib/supabase'
import type {
  Task,
  TaskStatus,
  TaskPriority,
  AgentId,
  Deliverable,
  DeliverableType,
  SopDoc,
  SopCategory,
  Decision,
  DecisionAction,
} from '@/lib/types'

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(ventureId: string): Promise<Task[]> {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    agentId: r.agent_id as AgentId | undefined,
    title: r.title,
    description: r.description ?? undefined,
    status: r.status as TaskStatus,
    priority: r.priority as TaskPriority,
    dueDate: r.due_date ?? undefined,
    createdAt: r.created_at,
  }))
}

export async function createTask(
  data: Omit<Task, 'id' | 'createdAt'>
): Promise<Task> {
  const { data: row, error } = await supabase
    .from('tasks')
    .insert({
      venture_id: data.ventureId,
      agent_id: data.agentId ?? null,
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      priority: data.priority,
      due_date: data.dueDate ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id: row.id,
    ventureId: row.venture_id,
    agentId: row.agent_id as AgentId | undefined,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
  }
}

export async function updateTask(
  id: string,
  data: Partial<Pick<Task, 'status' | 'priority' | 'title' | 'description' | 'dueDate' | 'agentId'>>
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (data.status !== undefined)      update.status = data.status
  if (data.priority !== undefined)    update.priority = data.priority
  if (data.title !== undefined)       update.title = data.title
  if (data.description !== undefined) update.description = data.description
  if (data.dueDate !== undefined)     update.due_date = data.dueDate
  if (data.agentId !== undefined)     update.agent_id = data.agentId
  await supabase.from('tasks').update(update).eq('id', id)
}

// ─── Deliverables ─────────────────────────────────────────────────────────────

export async function getDeliverables(ventureId: string): Promise<Deliverable[]> {
  const { data } = await supabase
    .from('deliverables')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    agentId: r.agent_id as AgentId | undefined,
    title: r.title,
    type: r.type as DeliverableType,
    content: r.content ?? undefined,
    status: r.status,
    createdAt: r.created_at,
  }))
}

export async function createDeliverable(
  data: Omit<Deliverable, 'id' | 'createdAt'>
): Promise<Deliverable> {
  const { data: row, error } = await supabase
    .from('deliverables')
    .insert({
      venture_id: data.ventureId,
      agent_id: data.agentId ?? null,
      title: data.title,
      type: data.type,
      content: data.content ?? null,
      status: data.status,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id: row.id,
    ventureId: row.venture_id,
    agentId: row.agent_id as AgentId | undefined,
    title: row.title,
    type: row.type as DeliverableType,
    content: row.content ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  }
}

// ─── SOPs ─────────────────────────────────────────────────────────────────────

export async function getSops(ventureId: string): Promise<SopDoc[]> {
  const { data } = await supabase
    .from('sops')
    .select('*')
    .eq('venture_id', ventureId)
    .order('updated_at', { ascending: false })
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    title: r.title,
    content: r.content ?? undefined,
    category: r.category as SopCategory,
    agentId: r.agent_id as AgentId | undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function createSop(
  data: Omit<SopDoc, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SopDoc> {
  const now = new Date().toISOString()
  const { data: row, error } = await supabase
    .from('sops')
    .insert({
      venture_id: data.ventureId,
      title: data.title,
      content: data.content ?? null,
      category: data.category,
      agent_id: data.agentId ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id: row.id,
    ventureId: row.venture_id,
    title: row.title,
    content: row.content ?? undefined,
    category: row.category as SopCategory,
    agentId: row.agent_id as AgentId | undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateSop(
  id: string,
  data: Partial<Pick<SopDoc, 'title' | 'content' | 'category' | 'agentId'>>
): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.title !== undefined)    update.title = data.title
  if (data.content !== undefined)  update.content = data.content
  if (data.category !== undefined) update.category = data.category
  if (data.agentId !== undefined)  update.agent_id = data.agentId
  await supabase.from('sops').update(update).eq('id', id)
}

// ─── Decisions ────────────────────────────────────────────────────────────────

export async function getDecisions(
  ventureId: string,
  opts: { resolved?: boolean; limit?: number } = {}
): Promise<Decision[]> {
  let query = supabase
    .from('decisions')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50)

  if (opts.resolved === false) {
    query = query.is('action_taken', null)
  } else if (opts.resolved === true) {
    query = query.not('action_taken', 'is', null)
  }

  const { data } = await query
  return (data ?? []).map(row => ({
    id: row.id as string,
    ventureId: row.venture_id as string,
    agentId: row.agent_id as string,
    decisionText: row.decision_text as string,
    question: (row.question as string | null) ?? undefined,
    actionTaken: (row.action_taken as DecisionAction | null) ?? undefined,
    urgency: row.urgency as Decision['urgency'],
    resolvedAt: (row.resolved_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
  }))
}

export async function createDecision(
  d: Omit<Decision, 'id' | 'createdAt' | 'resolvedAt' | 'actionTaken'>
): Promise<Decision> {
  const { data, error } = await supabase
    .from('decisions')
    .insert({
      venture_id: d.ventureId,
      agent_id: d.agentId,
      decision_text: d.decisionText,
      question: d.question ?? null,
      urgency: d.urgency,
    })
    .select('*')
    .single()
  if (error ?? !data) throw new Error('Failed to create decision')
  return {
    id: data.id as string,
    ventureId: data.venture_id as string,
    agentId: data.agent_id as string,
    decisionText: data.decision_text as string,
    question: (data.question as string | null) ?? undefined,
    urgency: data.urgency as Decision['urgency'],
    createdAt: data.created_at as string,
  }
}

export async function resolveDecision(id: string, action: DecisionAction): Promise<void> {
  await supabase
    .from('decisions')
    .update({ action_taken: action, resolved_at: new Date().toISOString() })
    .eq('id', id)
}
