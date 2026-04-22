/**
 * Test Enhanced Systems
 * Tests all new monitoring, skills, error tracking, and feedback systems
 */

import { monitoring } from '@/lib/monitoring'
import { skillsManager } from '@/lib/skills-manager'
import { errorTracker } from '@/lib/error-tracker'
import { routingFeedback } from '@/lib/routing-feedback'

// ─── Test Utilities ───────────────────────────────────────────────────────────

interface TestResult {
  name: string
  passed: boolean
  details: string
  error?: string
}

const results: TestResult[] = []

function test(name: string, passed: boolean, details: string, error?: string) {
  results.push({ name, passed, details, error })
  console.log(`${passed ? '✓' : '✗'} ${name}`)
  if (!passed && error) {
    console.log(`  Error: ${error}`)
  }
}

// ─── Monitoring Tests ─────────────────────────────────────────────────────────

async function testMonitoring(): Promise<void> {
  console.log('\n📊 Monitoring System Tests')

  // Test 1.1: Record metrics
  try {
    monitoring.recordMetric('test_metric', 42, { test: 'value' })
    const metrics = monitoring.getMetric('test_metric')

    test(
      'Record Metrics',
      metrics.length > 0,
      `Found ${metrics.length} metric entries`
    )
  } catch (error) {
    test('Record Metrics', false, 'Failed to record metric', String(error))
  }

  // Test 1.2: Logging
  try {
    monitoring.info('Test info message', { test: true })
    monitoring.warn('Test warn message', { test: true })
    monitoring.error('Test error message', { test: true })

    const logs = monitoring.getLogs(undefined, 1)

    test(
      'Logging System',
      logs.length >= 3,
      `Found ${logs.length} log entries`
    )
  } catch (error) {
    test('Logging System', false, 'Failed to log', String(error))
  }

  // Test 1.3: Alerts
  try {
    const alert = monitoring.createAlert('system', 'low', 'Test alert')

    test(
      'Alert System',
      alert !== null && alert.id !== undefined,
      `Created alert: ${alert.id}`
    )
  } catch (error) {
    test('Alert System', false, 'Failed to create alert', String(error))
  }

  // Test 1.4: Health check
  try {
    const health = await monitoring.checkSystemHealth()

    test(
      'Health Check',
      health !== null && health.timestamp !== undefined,
      `Health status: ${health.status}`
    )
  } catch (error) {
    test('Health Check', false, 'Failed health check', String(error))
  }
}

// ─── Skills Manager Tests ─────────────────────────────────────────────────────

async function testSkillsManager(): Promise<void> {
  console.log('\n🎯 Skills Manager Tests')

  // Test 2.1: Get skills path
  try {
    const path = skillsManager.getSkillsPath('dev-lead')

    test(
      'Get Skills Path',
      path.includes('SKILLS.md'),
      `Path: ${path}`
    )
  } catch (error) {
    test('Get Skills Path', false, 'Failed to get path', String(error))
  }

  // Test 2.2: Read skills
  try {
    const content = await skillsManager.readSkills('dev-lead')

    test(
      'Read SKILLS.md',
      content.length > 0,
      `Read ${content.length} characters`
    )
  } catch (error) {
    test('Read SKILLS.md', false, 'Failed to read skills', String(error))
  }

  // Test 2.3: Validate skills
  try {
    const content = await skillsManager.readSkills('dev-lead')
    const validation = await skillsManager.validateSkills(content)

    test(
      'Validate SKILLS.md',
      validation !== null,
      `Valid: ${validation.valid}, Warnings: ${validation.warnings.length}`
    )
  } catch (error) {
    test('Validate SKILLS.md', false, 'Failed to validate', String(error))
  }

  // Test 2.4: Batch validation
  try {
    const result = await skillsManager.batchValidate()

    test(
      'Batch Validate',
      result.total > 0,
      `Validated ${result.total} files, ${result.valid} valid`
    )
  } catch (error) {
    test('Batch Validate', false, 'Failed batch validation', String(error))
  }
}

// ─── Error Tracker Tests ──────────────────────────────────────────────────────

async function testErrorTracker(): Promise<void> {
  console.log('\n🐛 Error Tracker Tests')

  // Test 3.1: Record error
  try {
    const error = errorTracker.recordError('test-agent', 'Test error message', { test: true })

    test(
      'Record Error',
      error !== null && error.id !== undefined,
      `Recorded error: ${error.id}`
    )
  } catch (error) {
    test('Record Error', false, 'Failed to record error', String(error))
  }

  // Test 3.2: Get patterns
  try {
    const patterns = errorTracker.getPatterns()

    test(
      'Get Error Patterns',
      Array.isArray(patterns),
      `Found ${patterns.length} patterns`
    )
  } catch (error) {
    test('Get Error Patterns', false, 'Failed to get patterns', String(error))
  }

  // Test 3.3: Get auto-fixable patterns
  try {
    const autoFixable = errorTracker.getAutoFixablePatterns()

    test(
      'Get Auto-fixable Patterns',
      Array.isArray(autoFixable),
      `Found ${autoFixable.length} auto-fixable patterns`
    )
  } catch (error) {
    test('Get Auto-fixable Patterns', false, 'Failed to get patterns', String(error))
  }

  // Test 3.4: Generate report
  try {
    const report = await errorTracker.generateReport()

    test(
      'Generate Error Report',
      report !== null && report.timestamp !== undefined,
      `Total errors: ${report.totalErrors}`
    )
  } catch (error) {
    test('Generate Error Report', false, 'Failed to generate report', String(error))
  }
}

// ─── Routing Feedback Tests ───────────────────────────────────────────────────

async function testRoutingFeedback(): Promise<void> {
  console.log('\n🔀 Routing Feedback Tests')

  // Test 4.1: Record feedback
  try {
    const feedback = routingFeedback.recordFeedback(
      'Build API endpoint',
      ['dev-lead', 'raj-backend'],
      'good',
      undefined,
      'Test feedback'
    )

    test(
      'Record Routing Feedback',
      feedback !== null && feedback.id !== undefined,
      `Recorded feedback: ${feedback.id}`
    )
  } catch (error) {
    test('Record Routing Feedback', false, 'Failed to record feedback', String(error))
  }

  // Test 4.2: Suggest agents
  try {
    const suggested = routingFeedback.suggestAgents('Build API endpoint')

    test(
      'Suggest Agents',
      Array.isArray(suggested),
      `Suggested ${suggested.length} agents`
    )
  } catch (error) {
    test('Suggest Agents', false, 'Failed to suggest agents', String(error))
  }

  // Test 4.3: Get patterns
  try {
    const patterns = routingFeedback.getPatterns()

    test(
      'Get Routing Patterns',
      Array.isArray(patterns),
      `Found ${patterns.length} patterns`
    )
  } catch (error) {
    test('Get Routing Patterns', false, 'Failed to get patterns', String(error))
  }

  // Test 4.4: Generate report
  try {
    const report = await routingFeedback.generateReport()

    test(
      'Generate Feedback Report',
      report !== null && report.timestamp !== undefined,
      `Accuracy: ${(report.overallAccuracy * 100).toFixed(1)}%`
    )
  } catch (error) {
    test('Generate Feedback Report', false, 'Failed to generate report', String(error))
  }
}

// ─── Integration Tests ────────────────────────────────────────────────────────

async function testIntegration(): Promise<void> {
  console.log('\n🔗 Integration Tests')

  // Test 5.1: Error → Monitoring integration
  try {
    errorTracker.recordError('integration-test', 'Integration test error')
    const logs = monitoring.getLogs('error', 1)

    test(
      'Error → Monitoring',
      logs.length > 0,
      `Errors logged: ${logs.length}`
    )
  } catch (error) {
    test('Error → Monitoring', false, 'Integration failed', String(error))
  }

  // Test 5.2: Skills validation integration
  try {
    const validation = await skillsManager.batchValidate()

    test(
      'Skills Validation',
      validation.total > 0,
      `Validated ${validation.total} files`
    )
  } catch (error) {
    test('Skills Validation', false, 'Validation failed', String(error))
  }

  // Test 5.3: System health integration
  try {
    const health = await monitoring.checkSystemHealth()

    test(
      'System Health',
      health !== null,
      `Status: ${health.status}, Alerts: ${health.alerts.length}`
    )
  } catch (error) {
    test('System Health', false, 'Health check failed', String(error))
  }
}

// ─── Main Test Runner ─────────────────────────────────────────────────────────

async function main() {
  console.log('🧪 Enhanced Systems Test Suite')
  console.log('='.repeat(50))

  try {
    await testMonitoring()
    await testSkillsManager()
    await testErrorTracker()
    await testRoutingFeedback()
    await testIntegration()

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Test Summary')
    console.log('='.repeat(50))

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length

    console.log(`Total Tests: ${results.length}`)
    console.log(`Passed: ${passed} (${Math.round(passed / results.length * 100)}%)`)
    console.log(`Failed: ${failed}`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.error || r.details}`)
      })
    } else {
      console.log('\n✅ All tests passed!')
    }

    return failed === 0
  } catch (error) {
    console.error('\n❌ Test runner failed:', error)
    return false
  }
}

main().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
