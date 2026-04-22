/**
 * Migrate MEMORY.md files to include session_count
 */

import { promises as fs } from 'fs'
import path from 'path'

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

async function migrateMemoryFile(filePath: string): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8')

    // Check if session_count already exists
    if (content.includes('session_count:')) {
      console.log(`  ✓ Already migrated: ${path.basename(path.dirname(filePath))}`)
      return true
    }

    // Add session_count to Status section
    if (content.includes('## Status')) {
      content = content.replace(
        '## Status',
        '## Status\nsession_count: 0'
      )
      await fs.writeFile(filePath, content, 'utf-8')
      console.log(`  ✓ Migrated: ${path.basename(path.dirname(filePath))}`)
      return true
    } else {
      console.log(`  ⚠ No Status section: ${path.basename(path.dirname(filePath))}`)
      return false
    }
  } catch (error) {
    console.log(`  ✗ Failed: ${path.basename(path.dirname(filePath))} - ${error}`)
    return false
  }
}

async function main() {
  console.log('🔄 Migrating MEMORY.md files...\n')

  const memoryFiles = await findMemoryFiles(path.join(process.cwd(), 'departments'))
  console.log(`Found ${memoryFiles.length} MEMORY.md files\n`)

  let migrated = 0
  let skipped = 0

  for (const file of memoryFiles) {
    const result = await migrateMemoryFile(file)
    if (result) {
      migrated++
    } else {
      skipped++
    }
  }

  console.log(`\n✅ Migration complete!`)
  console.log(`  Migrated: ${migrated}`)
  console.log(`  Skipped: ${skipped}`)
}

main().catch(console.error)
