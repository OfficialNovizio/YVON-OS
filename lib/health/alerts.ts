/** Alert writer — writes health check results to requests/pending/ */
import { promises as fs } from 'fs'
import path from 'path'

const PENDING_DIR = path.join(process.cwd(), 'requests', 'pending')

export interface HealthAlert {
  id: string
  agent: string
  type: 'alert' | 'report'
  summary: string
  severity: 'info' | 'warning' | 'critical'
  data: any
  status: 'pending'
  createdAt: string
}

export async function writeHealthAlert(alert: Omit<HealthAlert, 'id' | 'createdAt' | 'status'>) {
  const id = `health-${alert.severity}-${Date.now()}`
  const entry: HealthAlert = { ...alert, id, status: 'pending', createdAt: new Date().toISOString() }

  try {
    await fs.mkdir(PENDING_DIR, { recursive: true })
    // Append to a consolidated health log instead of individual files
    const logPath = path.join(PENDING_DIR, `health-${new Date().toISOString().split('T')[0]}.json`)
    let existing: HealthAlert[] = []
    try { const raw = await fs.readFile(logPath, 'utf-8'); existing = JSON.parse(raw) } catch { /* new file */ }
    existing.push(entry)
    await fs.writeFile(logPath, JSON.stringify(existing, null, 2), 'utf-8')
    return entry
  } catch (e) {
    console.error('Failed to write health alert:', e)
    return null
  }
}
