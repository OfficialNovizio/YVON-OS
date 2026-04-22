/**
 * System Monitoring Service
 * Tracks metrics, errors, and performance for the memory system
 */

import { promises as fs } from 'fs'
import path from 'path'

// ─── Configuration ────────────────────────────────────────────────────────────

export interface MonitoringConfig {
  metricsRetentionDays: number
  maxLogEntries: number
  alertThresholds: {
    file_size_kb: number
    sip_overdue_hours: number
    error_rate: number
  }
}

export const MONITORING_CONFIG: MonitoringConfig = {
  metricsRetentionDays: 30,
  maxLogEntries: 1000,
  alertThresholds: {
    file_size_kb: 100,
    sip_overdue_hours: 48,
    error_rate: 0.05
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetricEntry {
  timestamp: string
  metric: string
  value: number
  tags?: Record<string, string>
}

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  context?: Record<string, unknown>
}

export interface Alert {
  id: string
  timestamp: string
  type: 'file_size' | 'sip_overdue' | 'error_rate' | 'system'
  severity: 'low' | 'medium' | 'high'
  message: string
  resolved: boolean
}

export interface SystemHealth {
  timestamp: string
  status: 'healthy' | 'warning' | 'critical'
  metrics: Record<string, number>
  alerts: Alert[]
}

// ─── Core Monitoring Service ──────────────────────────────────────────────────

export class MonitoringService {
  private metricsFile: string
  private logsFile: string
  private alertsFile: string
  private metrics: MetricEntry[] = []
  private logs: LogEntry[] = []
  private alerts: Alert[] = []

  constructor() {
    const monitoringDir = path.join(process.cwd(), '.yvon-os', 'monitoring')
    this.metricsFile = path.join(monitoringDir, 'metrics.json')
    this.logsFile = path.join(monitoringDir, 'logs.json')
    this.alertsFile = path.join(monitoringDir, 'alerts.json')

    // Initialize monitoring directory
    this.initMonitoringDir(monitoringDir)
  }

  private async initMonitoringDir(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true })

      // Load existing data
      await this.loadExistingData()
    } catch (error) {
      console.warn('Failed to initialize monitoring directory:', error)
    }
  }

  private async loadExistingData(): Promise<void> {
    try {
      const metricsContent = await fs.readFile(this.metricsFile, 'utf-8')
      this.metrics = JSON.parse(metricsContent)
    } catch {
      this.metrics = []
    }

    try {
      const logsContent = await fs.readFile(this.logsFile, 'utf-8')
      this.logs = JSON.parse(logsContent)
    } catch {
      this.logs = []
    }

    try {
      const alertsContent = await fs.readFile(this.alertsFile, 'utf-8')
      this.alerts = JSON.parse(alertsContent)
    } catch {
      this.alerts = []
    }
  }

  // ─── Metrics ──────────────────────────────────────────────────────────────────

  recordMetric(metric: string, value: number, tags?: Record<string, string>): void {
    const entry: MetricEntry = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      tags
    }

    this.metrics.push(entry)

    // Keep only recent metrics
    if (this.metrics.length > MONITORING_CONFIG.maxLogEntries) {
      this.metrics = this.metrics.slice(-MONITORING_CONFIG.maxLogEntries)
    }

    this.saveMetrics()
  }

  getMetric(metric: string, hoursBack: number = 24): MetricEntry[] {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000)
    return this.metrics.filter(m => {
      const time = new Date(m.timestamp).getTime()
      return time > cutoff && m.metric === metric
    })
  }

  getMetricAverage(metric: string, hoursBack: number = 24): number {
    const entries = this.getMetric(metric, hoursBack)
    if (entries.length === 0) return 0
    return entries.reduce((sum, e) => sum + e.value, 0) / entries.length
  }

  // ─── Logging ──────────────────────────────────────────────────────────────────

  log(level: LogEntry['level'], message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }

    this.logs.push(entry)

    // Keep only recent logs
    if (this.logs.length > MONITORING_CONFIG.maxLogEntries) {
      this.logs = this.logs.slice(-MONITORING_CONFIG.maxLogEntries)
    }

    this.saveLogs()
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context)
  }

  getLogs(level?: 'info' | 'warn' | 'error', hoursBack: number = 24): LogEntry[] {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000)
    return this.logs.filter(l => {
      const time = new Date(l.timestamp).getTime()
      return time > cutoff && (!level || l.level === level)
    })
  }

  // ─── Alerts ──────────────────────────────────────────────────────────────────

  createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    message: string
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      severity,
      message,
      resolved: false
    }

    this.alerts.push(alert)
    this.saveAlerts()

    // Also log as warning/error
    if (severity === 'high') {
      this.error(`ALERT: ${message}`, { alertId: alert.id, type })
    } else {
      this.warn(`ALERT: ${message}`, { alertId: alert.id, type })
    }

    return alert
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      this.saveAlerts()
      return true
    }
    return false
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  // ─── Health Checks ───────────────────────────────────────────────────────────

  async checkSystemHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      metrics: {},
      alerts: this.getActiveAlerts()
    }

    // Check file sizes
    const memoryFiles = await this.getMemoryFiles()
    for (const file of memoryFiles) {
      const stats = await fs.stat(file.path)
      const sizeKB = stats.size / 1024

      if (sizeKB > MONITORING_CONFIG.alertThresholds.file_size_kb) {
        health.status = 'warning'
        this.createAlert(
          'file_size',
          'medium',
          `Memory file too large: ${file.name} (${sizeKB.toFixed(1)}KB)`
        )
      }

      health.metrics[`file_${file.name}_size_kb`] = sizeKB
    }

    // Check SIP overdue
    try {
      const { getPendingSips } = await import('./sip-manager')
      const pendingSips = await getPendingSips()
      const overdueSips = pendingSips.filter(sip => {
        const flaggedDate = new Date(sip.flaggedAt)
        const hoursSince = (Date.now() - flaggedDate.getTime()) / (1000 * 60 * 60)
        return hoursSince > MONITORING_CONFIG.alertThresholds.sip_overdue_hours
      })

      if (overdueSips.length > 0) {
        health.status = 'warning'
        this.createAlert(
          'sip_overdue',
          'medium',
          `${overdueSips.length} SIP tasks overdue`
        )
      }

      health.metrics.sip_pending = pendingSips.length
      health.metrics.sip_overdue = overdueSips.length
    } catch (error) {
      this.warn('Failed to check SIP status', { error: String(error) })
    }

    // Check error rate
    const recentErrors = this.getLogs('error', 24)
    const totalLogs = this.getLogs(undefined, 24).length
    const errorRate = totalLogs > 0 ? recentErrors.length / totalLogs : 0

    if (errorRate > MONITORING_CONFIG.alertThresholds.error_rate) {
      health.status = 'critical'
      this.createAlert(
        'error_rate',
        'high',
        `Error rate too high: ${(errorRate * 100).toFixed(1)}%`
      )
    }

    health.metrics.error_rate = errorRate

    return health
  }

  private async getMemoryFiles(): Promise<Array<{ name: string; path: string }>> {
    const results: Array<{ name: string; path: string }> = []
    const departmentsDir = path.join(process.cwd(), 'departments')

    const findFiles = async (dir: string): Promise<void> => {
      const items = await fs.readdir(dir, { withFileTypes: true })
      for (const item of items) {
        const fullPath = path.join(dir, item.name)
        if (item.isDirectory()) {
          await findFiles(fullPath)
        } else if (item.name === 'MEMORY.md') {
          results.push({
            name: path.basename(path.dirname(fullPath)),
            path: fullPath
          })
        }
      }
    }

    await findFiles(departmentsDir)
    return results
  }

  // ─── Save Operations ─────────────────────────────────────────────────────────

  private async saveMetrics(): Promise<void> {
    try {
      await fs.writeFile(this.metricsFile, JSON.stringify(this.metrics, null, 2))
    } catch (error) {
      console.warn('Failed to save metrics:', error)
    }
  }

  private async saveLogs(): Promise<void> {
    try {
      await fs.writeFile(this.logsFile, JSON.stringify(this.logs, null, 2))
    } catch (error) {
      console.warn('Failed to save logs:', error)
    }
  }

  private async saveAlerts(): Promise<void> {
    try {
      await fs.writeFile(this.alertsFile, JSON.stringify(this.alerts, null, 2))
    } catch (error) {
      console.warn('Failed to save alerts:', error)
    }
  }

  // ─── Reports ─────────────────────────────────────────────────────────────────

  async generateReport(hoursBack: number = 24): Promise<{
    timestamp: string
    period: string
    metrics: Record<string, unknown>
    logs: {
      total: number
      byLevel: Record<string, number>
      recent: LogEntry[]
    }
    alerts: {
      total: number
      active: number
      byType: Record<string, number>
    }
    health: SystemHealth
  }> {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000)
    const recentLogs = this.logs.filter(l => new Date(l.timestamp).getTime() > cutoff)

    const metrics: Record<string, unknown> = {}
    const metricNames = [...new Set(this.metrics.map(m => m.metric))]
    for (const name of metricNames) {
      metrics[name] = {
        average: this.getMetricAverage(name, hoursBack),
        count: this.getMetric(name, hoursBack).length
      }
    }

    const health = await this.checkSystemHealth()

    return {
      timestamp: new Date().toISOString(),
      period: `${hoursBack}h`,
      metrics,
      logs: {
        total: recentLogs.length,
        byLevel: {
          info: recentLogs.filter(l => l.level === 'info').length,
          warn: recentLogs.filter(l => l.level === 'warn').length,
          error: recentLogs.filter(l => l.level === 'error').length
        },
        recent: recentLogs.slice(-10)
      },
      alerts: {
        total: this.alerts.length,
        active: this.getActiveAlerts().length,
        byType: this.alerts.reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      health
    }
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

export const monitoring = new MonitoringService()
