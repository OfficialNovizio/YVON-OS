/**
 * Deep Validation Tests for Memory System
 * Comprehensive testing of all improvements
 */

import { promises as fs } from 'fs'
import path from 'path'
import { readSession, sessionManager, flagSIP } from '@/lib/session-manager'
import { validateSessionContent, migrateSessionContent } from '@/lib/session-schema'
import { getPendingSips, generateSipReport } from '@/lib/sip-manager'
import { getSectionStats } from '@/lib/memory-manager'
import { COLLABORATION_GRAPH, calculateRoutingConfidence } from '@/lib/collaboration-manager'

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

// ─── Phase 1 Tests: Session Manager ───────────────────────────────────────────

async function testSessionManager(): Promise<void> {
  console.log('\n📋 Phase 1: Session Manager Tests')

  // Test 1.1: Session Manager can read SESSION.md
  try {
    const sessionData = await readSession()
    test(
      'Session Manager Read',
      sessionData !== null,
      'Session manager can read SESSION.md'
    )
  } catch (error) {
    test('Session Manager Read', false, 'Failed to read SESSION.md', String(error))
  }

  // Test 1.2: Session data has required structure
  try {
    const sessionData = await readSession()
    const hasRequiredFields =
      sessionData.activeRightNow !== undefined &&
      sessionData.openDecisions !== undefined &&
      sessionData.lastSessions !== undefined &&
      sessionData.sipFlags !== undefined

    test(
      'Session Data Structure',
      hasRequiredFields,
      'Session data has all required fields'
    )
  } catch (error) {
    test('Session Data Structure', false, 'Failed to validate structure', String(error))
  }

  // Test 1.3: Session validation
  try {
    const sessionContent = await fs.readFile('.yvon-os/SESSION.md', 'utf-8')
    const validation = validateSessionContent(sessionContent)

    test(
      'SESSION.md Validation',
      validation.warnings.length === 0,
      `Warnings: ${validation.warnings.length}`
    )
  } catch (error) {
    test('SESSION.md Validation', false, 'Failed to validate', String(error))
  }

  // Test 1.4: Session migration
  try {
    const sessionContent = await fs.readFile('.yvon-os/SESSION.md', 'utf-8')
    const migrated = migrateSessionContent(sessionContent)

    test(
      'SESSION.md Migration',
      migrated.includes('SESSION_SCHEMA_VERSION'),
      'Schema version marker added'
    )
  } catch (error) {
    test('SESSION.md Migration', false, 'Failed to migrate', String(error))
  }
}

// ─── Phase 2 Tests: SIP Automation ────────────────────────────────────────────

async function testSipAutomation(): Promise<void> {
  console.log('\n⚡ Phase 2: SIP Automation Tests')

  // Test 2.1: Get pending SIPs
  try {
    const pendingSips = await getPendingSips()

    test(
      'Get Pending SIPs',
      Array.isArray(pendingSips),
      `Found ${pendingSips.length} pending SIPs`
    )
  } catch (error) {
    test('Get Pending SIPs', false, 'Failed to get pending SIPs', String(error))
  }

  // Test 2.2: Generate SIP report
  try {
    const report = await generateSipReport()

    test(
      'Generate SIP Report',
      report !== null && report.timestamp !== undefined,
      `Report generated with ${report.stats.pending} pending, ${report.stats.overdue} overdue`
    )
  } catch (error) {
    test('Generate SIP Report', false, 'Failed to generate report', String(error))
  }

  // Test 2.3: Check SIP API endpoint
  try {
    const response = await fetch('http://localhost:3000/api/sip/run', {
      method: 'GET'
    })

    test(
      'SIP API GET',
      response.status === 200,
      `API status: ${response.status}`
    )
  } catch (error) {
    test('SIP API GET', false, 'Failed to call API', String(error))
  }
}

// ─── Phase 3 Tests: Memory Management ─────────────────────────────────────────

async function testMemoryManagement(): Promise<void> {
  console.log('\n💾 Phase 3: Memory Management Tests')

  // Test 3.1: Check archive directory exists
  try {
    const archiveDir = path.join(process.cwd(), '.yvon-os', 'archives')
    const stats = await fs.stat(archiveDir)

    test(
      'Archive Directory Exists',
      stats.isDirectory(),
      `Archive directory: ${archiveDir}`
    )
  } catch (error) {
    test('Archive Directory Exists', false, 'Archive directory not found', String(error))
  }

  // Test 3.2: Check MEMORY.md files have sections
  try {
    const memoryFiles = await findMemoryFiles(path.join(process.cwd(), 'departments'))
    const sampleFile = memoryFiles[0]

    if (sampleFile) {
      const content = await fs.readFile(sampleFile, 'utf-8')
      const stats = getSectionStats(content)

      test(
        'Section Stats Generated',
        stats.length > 0,
        `Found ${stats.length} sections in sample file`
      )
    } else {
      test('Section Stats Generated', false, 'No MEMORY.md files found')
    }
  } catch (error) {
    test('Section Stats Generated', false, 'Failed to analyze sections', String(error))
  }

  // Test 3.3: Check SIP flag in agent MEMORY.md
  try {
    const agentMemoryPath = path.join(
      process.cwd(),
      'departments',
      'technical',
      'dev-lead',
      'MEMORY.md'
    )

    const content = await fs.readFile(agentMemoryPath, 'utf-8')
    const hasSipFlag = content.includes('[SIP_SCHEDULED]') || content.includes('session_count')

    test(
      'Agent MEMORY.md Updated',
      hasSipFlag,
      'Agent memory file contains SIP/session info'
    )
  } catch (error) {
    test('Agent MEMORY.md Updated', false, 'Failed to check agent memory', String(error))
  }
}

// ─── Phase 4 Tests: Collaboration Optimization ────────────────────────────────

async function testCollaborationOptimization(): Promise<void> {
  console.log('\n🤝 Phase 4: Collaboration Optimization Tests')

  // Test 4.1: Check collaboration graph
  const agentIds = Object.keys(COLLABORATION_GRAPH)
  test(
    'Collaboration Graph Loaded',
    agentIds.length > 0,
    `Found ${agentIds.length} agents in collaboration graph`
  )

  // Test 4.2: Test routing confidence calculation
  try {
    const confidence = calculateRoutingConfidence(
      'Build a new API endpoint for user authentication',
      ['dev-lead', 'raj-backend']
    )

    test(
      'Routing Confidence Calculation',
      confidence >= 0 && confidence <= 1,
      `Confidence: ${confidence.toFixed(2)}`
    )
  } catch (error) {
    test('Routing Confidence Calculation', false, 'Failed to calculate', String(error))
  }

  // Test 4.3: Check agent autonomy levels
  const agentWithLevel1 = Object.entries(COLLABORATION_GRAPH).find(
    ([_, agent]) => agent.autonomyLevel === 1
  )

  test(
    'Agent Autonomy Levels',
    agentWithLevel1 !== undefined,
    `Found ${agentWithLevel1 ? agentWithLevel1[0] : 'none'} with autonomy level 1`
  )
}

// ─── Integration Tests ────────────────────────────────────────────────────────

async function testIntegration(): Promise<void> {
  console.log('\n🔗 Integration Tests')

  // Test 5.1: Session Manager → SIP Manager integration
  try {
    const sessionData = await readSession()
    const pendingSips = await getPendingSips()

    test(
      'Session ↔ SIP Integration',
      Array.isArray(pendingSips),
      `Session has ${sessionData.sipFlags.length} SIP flags, ${pendingSips.length} pending`
    )
  } catch (error) {
    test('Session ↔ SIP Integration', false, 'Integration failed', String(error))
  }

  // Test 5.2: Check API endpoints are accessible
  try {
    const endpoints = [
      '/api/memory',
      '/api/sip/run',
      '/api/team-chat',
      '/api/route-intent'
    ]

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const response = await fetch(`http://localhost:3000${endpoint}`, {
            method: 'GET'
          })
          return response.ok
        } catch {
          return false
        }
      })
    )

    const accessibleCount = results.filter(r => r).length

    test(
      'API Endpoints Accessible',
      accessibleCount > 0,
      `${accessibleCount}/${endpoints.length} endpoints accessible`
    )
  } catch (error) {
    test('API Endpoints Accessible', false, 'Failed to check endpoints', String(error))
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function findMemoryFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  const items = await fs.readdir(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      results.push(...await findMemoryFiles(fullPath))
    } else if (item.name === 'MEMORY.md') {
      results.push(fullPath)
    }
  }

  return results
}

// ─── Main Test Runner ─────────────────────────────────────────────────────────

async function main() {
  console.log('🧪 Deep Validation Tests for Memory System')
  console.log('='.repeat(50))

  try {
    await testSessionManager()
    await testSipAutomation()
    await testMemoryManagement()
    await testCollaborationOptimization()
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
