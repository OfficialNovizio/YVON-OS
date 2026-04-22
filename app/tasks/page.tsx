'use client'

import { useState } from 'react'
import type { TaskStatus, TaskPriority } from '@/lib/types'

type SeedTask = {
  id: string
  title: string
  description?: string
  agentId: string
  agentName: string
  agentColor: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
}

const PRIORITY_META: Record<TaskPriority, { color: string; label: string }> = {
  high:   { color: 'var(--rd)', label: 'HIGH' },
  medium: { color: 'var(--am)', label: 'MED' },
  low:    { color: 'var(--di)', label: 'LOW' },
}

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'pending',     label: 'Pending' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done',        label: 'Done' },
]

const SEED_TASKS: SeedTask[] = [
  { id: '1', title: 'Spring Drop IG Reel shoot — workshop BTS', agentId: 'sofia-social', agentName: 'Sofia', agentColor: '#60A0E0', status: 'in-progress', priority: 'high', dueDate: '30 Mar', description: '30-second behind-the-scenes Reel of the spring collection production process.' },
  { id: '2', title: 'Mobile checkout UX audit', agentId: 'mia-frontend', agentName: 'Mia', agentColor: '#888888', status: 'pending', priority: 'high', dueDate: '2 Apr', description: 'Mobile conversion rate is 1.4% vs 3.2% desktop. Identify friction points.' },
  { id: '3', title: 'Q2 Marketing Strategy doc — final review', agentId: 'marcus-ceo', agentName: 'Marcus', agentColor: '#F59E0B', status: 'in-progress', priority: 'medium', dueDate: '28 Mar' },
  { id: '4', title: 'Competitor content gap report', agentId: 'zara-competitor', agentName: 'Zara', agentColor: '#666666', status: 'pending', priority: 'medium', dueDate: '4 Apr' },
  { id: '5', title: 'Size inclusivity campaign — concept brief', agentId: 'lena-brand', agentName: 'Lena', agentColor: '#60A0E0', status: 'pending', priority: 'high', dueDate: '5 Apr' },
  { id: '6', title: 'LinkedIn content calendar — April', agentId: 'sofia-social', agentName: 'Sofia', agentColor: '#60A0E0', status: 'done', priority: 'medium' },
  { id: '7', title: 'GA4 property — service account access setup', agentId: 'raj-backend', agentName: 'Raj', agentColor: '#888888', status: 'done', priority: 'high' },
  { id: '8', title: 'Q1 performance debrief — exec summary', agentId: 'marcus-ceo', agentName: 'Marcus', agentColor: '#A080E0', status: 'done', priority: 'medium' },
  { id: '9', title: 'Influencer outreach list — sustainable fashion', agentId: 'rio-ads', agentName: 'Rio', agentColor: '#E09050', status: 'pending', priority: 'low', dueDate: '10 Apr' },
  { id: '10', title: 'Hourbour app — onboarding flow redesign brief', agentId: 'diana-coo', agentName: 'Diana', agentColor: '#94A3B8', status: 'in-progress', priority: 'high', dueDate: '31 Mar' },
]

function TaskCard({ task, onMove }: { task: SeedTask; onMove: (id: string, to: TaskStatus) => void }) {
  const pm = PRIORITY_META[task.priority]

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--b1)',
      borderLeft: `2px solid ${task.agentColor}`,
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {/* Priority + Due */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: pm.color, border: `1px solid ${pm.color}`, padding: '1px 5px' }}>
          {pm.label}
        </span>
        {task.dueDate && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', marginLeft: 'auto' }}>
            Due {task.dueDate}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.4 }}>{task.title}</div>
      {task.description && (
        <div style={{ fontSize: '11px', color: 'var(--di)', lineHeight: 1.4 }}>{task.description}</div>
      )}

      {/* Agent + Move */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--b1)' }}>
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: task.agentColor }}>
          {task.agentName}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {COLUMNS.filter(c => c.id !== task.status).map(c => (
            <button
              key={c.id}
              onClick={() => onMove(task.id, c.id)}
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '8px',
                letterSpacing: '0.04em',
                padding: '2px 6px',
                background: 'none',
                border: '1px solid var(--b2)',
                color: 'var(--di)',
                cursor: 'pointer',
              }}
            >
              → {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<SeedTask[]>(SEED_TASKS)
  const [newTitle, setNewTitle] = useState('')
  const [showNew, setShowNew] = useState(false)

  function moveTask(id: string, to: TaskStatus) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: to } : t))
  }

  function addTask() {
    if (!newTitle.trim()) return
    const task: SeedTask = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      agentId: 'diana-coo',
      agentName: 'Diana',
      agentColor: '#9070D0',
      status: 'pending',
      priority: 'medium',
    }
    setTasks(prev => [...prev, task])
    setNewTitle('')
    setShowNew(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '28px', color: 'var(--br)', margin: '0 0 4px' }}>
            Tasks
          </h1>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)', margin: 0 }}>
            {tasks.filter(t => t.status === 'pending').length} pending ·{' '}
            {tasks.filter(t => t.status === 'in-progress').length} in progress ·{' '}
            {tasks.filter(t => t.status === 'done').length} done
          </p>
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            padding: '6px 14px',
            background: 'none',
            border: '1px solid var(--ac)',
            color: 'var(--ac)',
            cursor: 'pointer',
          }}
        >
          + NEW TASK
        </button>
      </div>

      {/* New Task Input */}
      {showNew && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Task title…"
            className="input-base"
            style={{ flex: 1 }}
            autoFocus
          />
          <button
            onClick={addTask}
            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.06em', padding: '8px 16px', background: 'var(--b2)', border: '1px solid var(--b3)', color: 'var(--br)', cursor: 'pointer' }}
          >
            ADD
          </button>
          <button
            onClick={() => setShowNew(false)}
            style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', padding: '8px 12px', background: 'none', border: '1px solid var(--b2)', color: 'var(--di)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--b1)', alignItems: 'start' }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} style={{ background: 'var(--sf)', padding: '0' }}>
              {/* Column Header */}
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--b1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--di)' }}>
                  {col.label.toUpperCase()}
                </span>
                <span style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '10px',
                  color: colTasks.length > 0 ? 'var(--ac)' : 'var(--mu)',
                  background: 'var(--b2)',
                  padding: '1px 6px',
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '8px', background: 'var(--b1)' }}>
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onMove={moveTask} />
                ))}
                {colTasks.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', background: 'var(--bg)' }}>
                    EMPTY
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
