'use client'

import type { WarRoomPhase, PhaseStatus, AgentId } from '@/lib/types'

// ─── Design tokens (matches war-room/page.tsx) ──────────────────────────────
const ACCENT = '#cc785c'
const GREEN  = '#10B981'
const RED    = '#EF4444'
const T1     = '#ececec'
const T2     = '#b4b4b4'
const T3     = 'rgba(255,255,255,0.25)'

// ─── PhaseStepper v3 ───────────────────────────────────────────────────────
// Renders the 3-phase War Room pipeline: Plan → Execute → Synthesize.
// Quinn QA is opt-in and shown as an extra step within Execute when active.

export interface PhaseState {
  phase: WarRoomPhase
  status: PhaseStatus
  passNumber?: number
  maxPasses?: number
  errors?: string[]
}

export interface QAPassResult {
  pass: number
  maxPasses: number
  status: 'PASS' | 'FAIL'
  errors: string[]
}

export interface PhaseStepperProps {
  currentPhase: WarRoomPhase | null
  phases: Record<string, PhaseState>
  qaResults: QAPassResult[]
  retryCount: number
  escalationMessage: string | null
  isVisible: boolean
}

// v4 pipeline: Plan → Execute → Validate → Synthesize
const PHASE_ORDER = ['plan', 'execute', 'validate', 'synthesize'] as const

const PHASE_LABELS: Record<string, { label: string; icon: string }> = {
  plan:        { label: 'Plan',        icon: '📋' },
  execute:     { label: 'Execute',     icon: '🔧' },
  validate:    { label: 'Validate',    icon: '✅' },
  synthesize:  { label: 'Synthesize',  icon: '📝' },
}

function StatusIcon({ status }: { status: PhaseStatus }) {
  switch (status) {
    case 'complete':
      return <span style={{ color: GREEN, fontSize: 12 }}>✓</span>
    case 'failed':
      return <span style={{ color: RED, fontSize: 12 }}>✗</span>
    case 'active':
      return (
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: ACCENT, animation: 'phaseStepperPulse 1.2s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )
    case 'pending':
    default:
      return <span style={{ color: T3, fontSize: 12 }}>○</span>
  }
}

export default function PhaseStepper({
  currentPhase,
  phases,
  qaResults,
  retryCount,
  escalationMessage,
  isVisible,
}: PhaseStepperProps) {
  if (!isVisible) return null

  return (
    <>
      <style>{`
        @keyframes phaseStepperPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(1.3); }
        }
        @keyframes phaseStepperSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '10px 14px',
        marginBottom: 10,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        animation: 'phaseStepperSlideIn 0.3s ease-out',
      }}>
        {/* Phase progress bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          flexWrap: 'wrap',
        }}>
          {PHASE_ORDER.map((phase, i) => {
            const state = phases[phase]
            const isActive = currentPhase === phase
            const currentIdx = currentPhase ? PHASE_ORDER.indexOf(currentPhase as typeof PHASE_ORDER[number]) : -1
            const isPast = currentIdx > i || state?.status === 'complete'
            const opacity = isActive || isPast || state?.status === 'complete' ? 1 : 0.35

            return (
              <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity }}>
                {i > 0 && (
                  <div style={{
                    width: 16, height: 1,
                    background: isPast ? GREEN : T3,
                    flexShrink: 0,
                  }} />
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px',
                  borderRadius: 8,
                  background: isActive
                    ? 'rgba(204,120,92,0.15)'
                    : state?.status === 'complete'
                    ? 'rgba(16,185,129,0.08)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(204,120,92,0.3)'
                    : state?.status === 'complete'
                    ? '1px solid rgba(16,185,129,0.15)'
                    : '1px solid transparent',
                  transition: 'all 0.3s ease',
                }}>
                  <StatusIcon status={isActive ? 'active' : state?.status ?? 'pending'} />
                  <span style={{
                    fontSize: 11,
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? ACCENT : state?.status === 'complete' ? GREEN : T2,
                    whiteSpace: 'nowrap',
                  }}>
                    {PHASE_LABELS[phase]?.icon ?? '•'} {PHASE_LABELS[phase]?.label ?? phase}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Retry badge */}
          {retryCount > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: '#F59E0B',
              background: 'rgba(245,158,11,0.12)',
              borderRadius: 6, padding: '2px 6px',
              marginLeft: 6,
            }}>
              ↻ {retryCount} retr{retryCount === 1 ? 'y' : 'ies'}
            </span>
          )}
        </div>

        {/* QA error details (shown inline when QA is opt-in active) */}
        {qaResults.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 3,
            marginTop: 4, padding: '6px 10px',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.04)',
            maxHeight: 120, overflowY: 'auto',
          }}>
            {qaResults.map((result, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 6,
                fontSize: 10,
              }}>
                <span style={{
                  color: result.status === 'PASS' ? GREEN : RED,
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {result.status === 'PASS' ? '✓' : '✗'} Pass {result.pass}/{result.maxPasses}
                </span>
                {result.errors.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {result.errors.slice(0, 3).map((err, j) => (
                      <span key={j} style={{
                        color: T2, lineHeight: 1.4,
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 9,
                      }}>
                        {err.length > 100 ? err.slice(0, 100) + '…' : err}
                      </span>
                    ))}
                    {result.errors.length > 3 && (
                      <span style={{ color: T3, fontSize: 9 }}>
                        +{result.errors.length - 3} more errors
                      </span>
                    )}
                  </div>
                )}
                {result.errors.length === 0 && result.status === 'PASS' && (
                  <span style={{ color: T3 }}>No issues found</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Escalation message */}
        {escalationMessage && (
          <div style={{
            marginTop: 4, padding: '6px 10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            fontSize: 10, fontWeight: 600,
            color: RED,
          }}>
            ⚠️ Escalated: {escalationMessage}
          </div>
        )}
      </div>
    </>
  )
}
