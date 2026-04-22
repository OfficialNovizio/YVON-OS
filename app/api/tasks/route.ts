import { getTasks, createTask, updateTask } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import type { Task, TaskStatus, TaskPriority, AgentId } from '@/lib/types'

export async function GET(request: Request): Promise<Response> {
  const url       = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? ''
  if (!ventureId) return Response.json({ error: 'ventureId is required' }, { status: 400 })

  try {
    const tasks = await getTasks(ventureId)
    return Response.json(tasks)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: Partial<Omit<Task, 'id' | 'createdAt'>>
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ventureId, title, description, agentId, status = 'pending', priority = 'medium', dueDate } = body

  if (!ventureId || !title) {
    return Response.json({ error: 'ventureId and title are required' }, { status: 400 })
  }

  try {
    const task = await createTask({
      ventureId,
      title,
      description,
      agentId: agentId as AgentId | undefined,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      dueDate,
    })

    await logActivity({
      ventureId,
      agentId: agentId as AgentId | undefined,
      type: 'task_created',
      message: `Task created: "${title}"`,
      metadata: { taskId: task.id },
    })

    return Response.json(task, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function PATCH(request: Request): Promise<Response> {
  let body: { id?: string; ventureId?: string } & Partial<Pick<Task, 'status' | 'priority' | 'title' | 'description' | 'dueDate' | 'agentId'>>
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, ventureId, ...rest } = body
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  try {
    await updateTask(id, rest)

    if (rest.status === 'done' && ventureId) {
      await logActivity({
        ventureId,
        type: 'task_completed',
        message: `Task completed: "${rest.title ?? id}"`,
        metadata: { taskId: id },
      })
    }

    return Response.json({ updated: true })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
