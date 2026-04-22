'use client'

import type { Decision } from '@/lib/types'

interface DecisionCardProps {
  decision: Decision
  /** Called after approve/reject/defer resolves */
  onResolved: (id: string, action: 'approved' | 'rejected' | 'deferred') => void
}

const URGENCY_COLOR: Record<string, string> = {
  critical: 'var(--rd)',
  today:    'var(--am)',
  'this-week': 'var(--bl)',
}

const URGENCY_LABEL: Record<string, string> = {
  critical:   'ACT NOW',
  today:      'TODAY',
  'this-week':'THIS WEEK',
}

export default function DecisionCard({ decision, onResolved }: DecisionCardProps) {
  const urgColor = URGENCY_COLOR[decision.urgency] ?? 'var(--di)'
  const urgLabel = URGENCY_LABEL[decision.urgency] ?? decision.urgency.toUpperCase()
  const resolved = !!decision.actionTaken

  async function handleAction(action: 'approved' | 'rejected' | 'deferred') {
    try {
      await fetch('/api/decisions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: decision.id, action }),
      })
      onResolved(decision.id, action)
    } catch { /* non-fatal */ }
  }

  return (
    <div style={{
      background: 'var(--sf)',
      border: '1px solid var(--b1)',
      borderLeft: `3px solid ${urgColor}`,
      padding: '18px 20px',
      opacity: resolved ? 0.45 : 1,
      transition: 'opacity 0.35s',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-dm-mono)', fontSize: '9px',
            letterSpacing: '0.1em', color: urgColor,
          }}>
            {urgLabel}
          </span>
          <span style={{ color: 'var(--b3)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>
            {decision.ventureId.charAt(0).toUpperCase() + decision.ventureId.slice(1)}
          </span>
          <span style={{ color: 'var(--b3)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>
            {decision.agentId}
          </span>
        </div>
        {resolved && (
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--gn)' }}>
            {decision.actionTaken === 'approved' ? '✓ Approved' : decision.actionTaken === 'rejected' ? '✗ Rejected' : '— Deferred'}
          </span>
        )}
      </div>

      {/* Decision text */}
      <div style={{ fontSize: '13px', color: 'var(--tx)', lineHeight: 1.65, marginBottom: '10px' }}>
        {decision.decisionText}
      </div>

      {/* Question */}
      {decision.question && (
        <div style={{
          fontFamily: 'var(--font-dm-mono)', fontSize: '11px',
          color: 'var(--br)', marginBottom: resolved ? 0 : '14px',
          letterSpacing: '0.02em',
        }}>
          → {decision.question}
        </div>
      )}

      {/* Action buttons */}
      {!resolved && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleAction('approved')}
            style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.06em',
              padding: '6px 16px', background: 'var(--b2)', border: '1px solid var(--b3)',
              color: 'var(--gn)', cursor: 'pointer',
            }}
          >
            Approve
          </button>
          <button
            onClick={() => handleAction('deferred')}
            style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.06em',
              padding: '6px 16px', background: 'none', border: '1px solid var(--b2)',
              color: 'var(--di)', cursor: 'pointer',
            }}
          >
            Defer
          </button>
          <button
            onClick={() => handleAction('rejected')}
            style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.06em',
              padding: '6px 16px', background: 'none', border: '1px solid var(--b2)',
              color: 'var(--rd)', cursor: 'pointer',
            }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
