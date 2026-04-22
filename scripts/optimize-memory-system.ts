/**
 * Memory System Optimization Script
 * Applies all improvements to existing MEMORY.md files
 */

import { promises as fs } from 'fs'
import path from 'path'
import { batchOptimizeMemoryFiles, optimizeMemoryFile } from '@/lib/memory-manager'
import { readSession, updateSession } from '@/lib/session-manager'
import { scheduleSip, getPendingSips } from '@/lib/sip-manager'

const departmentsDir = path.join(process.cwd(), 'departments')
const archiveDir = path.join(process.cwd(), '.yvon-os', 'archives')

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

async function main() {
  console.log('🚀 Starting Memory System Optimization...\n')

  // Step 1: Create archive directory
  try {
    await fs.mkdir(archiveDir, { recursive: true })
    console.log('✓ Created archive directory:', archiveDir)
  } catch (error) {
    console.warn('⚠️ Could not create archive directory:', error)
  }

  // Step 2: Find and optimize all MEMORY.md files
  console.log('\n📋 Optimizing MEMORY.md files...')
  const memoryFiles = await findMemoryFiles(departmentsDir)
  console.log(`  Found ${memoryFiles.length} MEMORY.md files`)

  let optimizedCount = 0
  let archivedCount = 0
  let compressedCount = 0

  for (const filePath of memoryFiles) {
    try {
      const result = await optimizeMemoryFile(filePath, archiveDir)
      if (result.optimized) {
        optimizedCount++
        archivedCount += result.archivedCount
        compressedCount += result.compressedCount
        console.log(`  ✓ Optimized: ${path.basename(path.dirname(filePath))}`)
      }
    } catch (error) {
      console.warn(`  ⚠️ Could not optimize ${filePath}:`, error)
    }
  }

  // Step 3: Update SESSION.md with new format
  console.log('\n📝 Updating SESSION.md format...')
  try {
    const sessionData = await readSession()

    // Add schema version marker
    await updateSession({
      activeRightNow: {
        ...sessionData.activeRightNow,
        nextSessionStart: 'Read SESSION.md + ROADMAP.md + relevant agent MEMORY.md'
      }
    })

    console.log('✓ SESSION.md updated with new schema')
  } catch (error) {
    console.warn('⚠️ Could not update SESSION.md:', error)
  }

  // Step 4: Check for pending SIPs
  console.log('\n🔍 Checking for pending SIP tasks...')
  try {
    const pendingSips = await getPendingSips()

    if (pendingSips.length > 0) {
      console.log(`  ${pendingSips.length} pending SIP tasks:`)
      pendingSips.forEach(sip => {
        console.log(`    - ${sip.agentId} (session ${sip.sessionCount})`)
      })
    } else {
      console.log('  No pending SIP tasks')
    }
  } catch (error) {
    console.warn('⚠️ Could not check pending SIPs:', error)
  }

  // Step 5: Apply SIP scheduling to agents approaching threshold
  console.log('\n⚡ Scheduling upcoming SIP tasks...')
  const agentIds = [
    'marcus-ceo', 'diana-coo', 'dev-lead', 'raj-backend', 'mia-frontend',
    'quinn-qa', 'lena-brand', 'rio-ads', 'atlas-art-director', 'pixel-production',
    'kai-analyst', 'nate-growth', 'felix-finance', 'stark-growth'
  ]

  let scheduledCount = 0
  for (const agentId of agentIds) {
    try {
      // Read agent's MEMORY.md to get session count
      const memoryPath = path.join(departmentsDir, getDepartment(agentId), agentId, 'MEMORY.md')
      const content = await fs.readFile(memoryPath, 'utf-8')
      const sessionCountMatch = content.match(/session_count:\s*(\d+)/)

      if (sessionCountMatch) {
        const sessionCount = parseInt(sessionCountMatch[1])

        // Check if SIP should be triggered
        if (sessionCount > 0 && sessionCount % 5 === 0 && sessionCount > 0) {
          await scheduleSip(agentId, sessionCount)
          console.log(`  ✓ Scheduled SIP for ${agentId} (session ${sessionCount})`)
          scheduledCount++
        }
      }
    } catch (error) {
      // Agent might not have MEMORY.md yet, skip
    }
  }

  console.log(`  Total SIPs scheduled: ${scheduledCount}`)

  // Summary
  console.log('\n✅ Optimization Complete!')
  console.log('\nSummary:')
  console.log(`  - ${optimizedCount} MEMORY.md files optimized`)
  console.log(`  - ${archivedCount} entries archived`)
  console.log(`  - ${compressedCount} entries compressed`)
  console.log(`  - ${scheduledCount} SIP tasks scheduled`)
  console.log(`  - Archive directory: ${archiveDir}`)

  console.log('\nNext steps:')
  console.log('  1. Review archived entries in:', archiveDir)
  console.log('  2. Apply SIP distillations via /api/sip/run')
  console.log('  3. Monitor SESSION.md for [SIP_DUE] flags')
  console.log('  4. Update CLAUDE.md with new protocols')
}

function getDepartment(agentId: string): string {
  const departmentMap: Record<string, string> = {
    'marcus-ceo': 'executive',
    'diana-coo': 'executive',
    'dev-lead': 'technical',
    'raj-backend': 'technical',
    'mia-frontend': 'technical',
    'quinn-qa': 'technical',
    'lena-brand': 'marketing',
    'rio-ads': 'marketing',
    'atlas-art-director': 'marketing',
    'pixel-production': 'marketing',
    'kai-analyst': 'analytics',
    'nate-growth': 'analytics',
    'felix-finance': 'operations',
    'stark-growth': 'personal'
  }
  return departmentMap[agentId] || 'personal'
}

main().catch(console.error)
