import 'server-only'
import { logActivityEvent } from '@/lib/db'
import type { ActivityEvent } from '@/lib/types'

export async function logActivity(
  event: Omit<ActivityEvent, 'id' | 'createdAt'>
): Promise<void> {
  try {
    await logActivityEvent(event)
  } catch {
    // Activity logging should never break the main flow
  }
}
