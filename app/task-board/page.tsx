'use client'

import { useState } from 'react'
import { PageHeader, StatusBadge, Card } from '@/components/ui'
import { useLiveData } from '@/lib/use-live-data'
import { useWorkspace } from '@/lib/WorkspaceContext'
import type { TaskItem } from '@/app/api/task-board/route'

const STAGES: TaskItem['stage'][] = ['proposed', 'backlog', 'week', 'review', 'done']
const STAGE_LABELS: Record<string, string> = { proposed: 'Proposed', backlog: 'Backlog', week: 'This Week', review: 'Review', done: 'Done' }
const STAGE_COLORS: Record<string, string> = { proposed: 'border-amber-500/40', review: 'border-amber-500/40' }

export default function TaskBoardPage() {
  const { workspace } = useWorkspace()
  const { data, loading } = useLiveData<{ tasks: TaskItem[]; total: number }>({
    url: `/api/task-board?venture=${workspace.key}`,
    pollIntervalMs: 30000,
  })

  const tasks = data?.tasks ?? []

  return (
    <div>
      <PageHeader title="Task Board" subtitle="The agents&apos; board — proposed, approved, executing, reviewed. Two yellow stages need you." />

      {/* Live activity bar */}
      <div className="mb-3 flex items-center gap-3 text-[12px] text-on-surface-variant">
        <StatusBadge tone="green">{tasks.filter((t) => t.stage === 'week').length} working</StatusBadge>
        <StatusBadge tone="yellow">{tasks.filter((t) => t.stage === 'proposed' || t.stage === 'review').length} need you</StatusBadge>
        {loading && <span className="animate-pulse">Loading...</span>}
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto pb-4 scroll-x">
        {STAGES.map((stage) => {
          const items = tasks.filter((t) => t.stage === stage)
          return (
            <div key={stage} className={`kanban-col min-w-[220px] flex-1 ${STAGE_COLORS[stage] ?? ''}`}>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {STAGE_LABELS[stage]}
                </span>
                <StatusBadge tone="muted">{items.length}</StatusBadge>
              </div>
              <div className="space-y-2">
                {items.map((task) => (
                  <div key={task.id} className="kanban-card">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-on-surface shrink-0">
                        {task.agent[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-on-surface leading-snug">{task.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] text-on-surface-variant">{task.agent}</span>
                          <span className={`chip ${task.priority === 'high' ? 'chip-accent' : ''}`}>
                            {task.priority}
                          </span>
                        </div>
                        {stage === 'proposed' && (
                          <button className="btn-accent mt-2 !py-1 !text-[10px] w-full !justify-center">Approve</button>
                        )}
                        {stage === 'review' && (
                          <div className="mt-2 flex gap-1">
                            <button className="btn-accent !py-1 !text-[10px] flex-1 !justify-center">Approve</button>
                            <button className="btn-ghost !py-1 !text-[10px] flex-1 !justify-center">Return</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
