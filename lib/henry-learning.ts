/**
 * Henry Learning System
 *
 * Henry is YVON's intelligent filter that sits between Marcus and the owner.
 * He tracks owner decisions over time and learns when to auto-handle decisions
 * without needing escalation.
 *
 * Core logic:
 * - Tracks decisions by type (approved, rejected, deferred)
 * - Auto-approve rule: if the same decision type has been approved 3+ times
 *   with >90% confidence, Henry can auto-handle it
 * - getStats() returns aggregate stats for the dashboard
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type DecisionOutcome = 'approved' | 'rejected' | 'deferred'

export interface DecisionRecord {
  id: string
  type: string
  outcome: DecisionOutcome
  timestamp: number
}

export interface TypeConfidence {
  type: string
  total: number
  approved: number
  rejected: number
  deferred: number
  /** Confidence that this type should be auto-approved (0-1) */
  confidence: number
  /** Whether Henry can auto-handle this type */
  canAutoHandle: boolean
}

export interface HenryStats {
  /** Number of decisions Henry auto-handled (didn't escalate) */
  autoHandled: number
  /** Number of decisions that required owner attention */
  escalated: number
  /** Overall approval rate (approved / total) */
  approvalRate: number
  /** Per-type confidence breakdown */
  typeConfidence: TypeConfidence[]
  /** Total decisions tracked */
  totalDecisions: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum number of approvals before auto-handle is considered */
const MIN_APPROVALS_FOR_AUTO = 3

/** Confidence threshold for auto-handling (must be strictly above this) */
const AUTO_CONFIDENCE_THRESHOLD = 0.9

// ── In-memory store ───────────────────────────────────────────────────────────

/** In-memory log of all owner decisions. Persists for the session lifetime. */
const decisionLog: DecisionRecord[] = []

/** Counter for auto-handled decisions (decisions Henry didn't escalate). */
let autoHandledCount = 0

/** Counter for escalated decisions (decisions that required owner input). */
let escalatedCount = 0

// ── Core API ──────────────────────────────────────────────────────────────────

/**
 * Record an owner's decision on an item.
 * Returns whether Henry could have auto-handled this (for learning feedback).
 */
export function recordDecision(
  id: string,
  type: string,
  outcome: DecisionOutcome
): boolean {
  decisionLog.push({
    id,
    type,
    outcome,
    timestamp: Date.now(),
  })

  escalatedCount++

  // Check if this type now qualifies for auto-handling
  const conf = getConfidenceForType(type)
  return conf.canAutoHandle
}

/**
 * Record that Henry auto-handled a decision (didn't need to escalate).
 */
export function recordAutoHandle(type: string): void {
  autoHandledCount++
  decisionLog.push({
    id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    outcome: 'approved',
    timestamp: Date.now(),
  })
}

/**
 * Check if a given decision type can be auto-handled by Henry.
 * Returns true if the type has been approved 3+ times with >90% confidence.
 */
export function canAutoHandle(type: string): boolean {
  const conf = getConfidenceForType(type)
  return conf.canAutoHandle
}

/**
 * Calculate confidence for a specific decision type.
 */
export function getConfidenceForType(type: string): TypeConfidence {
  const records = decisionLog.filter((r) => r.type === type)
  const total = records.length
  const approved = records.filter((r) => r.outcome === 'approved').length
  const rejected = records.filter((r) => r.outcome === 'rejected').length
  const deferred = records.filter((r) => r.outcome === 'deferred').length

  // Confidence = approved / total (if total > 0, else 0)
  const confidence = total > 0 ? approved / total : 0

  // Auto-handle if: 3+ approvals AND confidence > 90%
  const canAutoHandle =
    approved >= MIN_APPROVALS_FOR_AUTO && confidence > AUTO_CONFIDENCE_THRESHOLD

  return {
    type,
    total,
    approved,
    rejected,
    deferred,
    confidence,
    canAutoHandle,
  }
}

/**
 * Get aggregate statistics for the Henry dashboard.
 */
export function getStats(): HenryStats {
  const uniqueTypes = [...new Set(decisionLog.map((r) => r.type))]
  const typeConfidence = uniqueTypes.map((type) => getConfidenceForType(type))

  const totalDecisions = decisionLog.length
  const approvedTotal = decisionLog.filter(
    (r) => r.outcome === 'approved'
  ).length
  const approvalRate =
    totalDecisions > 0 ? approvedTotal / totalDecisions : 0

  return {
    autoHandled: autoHandledCount,
    escalated: escalatedCount,
    approvalRate,
    typeConfidence,
    totalDecisions,
  }
}

/**
 * Reset all Henry learning state (useful for testing).
 */
export function resetHenry(): void {
  decisionLog.length = 0
  autoHandledCount = 0
  escalatedCount = 0
}
