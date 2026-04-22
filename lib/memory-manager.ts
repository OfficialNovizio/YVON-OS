/**
 * Memory Manager Service
 * Manages MEMORY.md file growth with caps, compression, and archiving
 */

import { promises as fs } from 'fs'
import path from 'path'

// ─── Configuration ────────────────────────────────────────────────────────────

export interface SectionConfig {
  name: string
  maxEntries: number
  compressAfterDays: number
  archiveAfterDays: number
}

export const MEMORY_SECTIONS: SectionConfig[] = [
  { name: '## Session Log', maxEntries: 50, compressAfterDays: 30, archiveAfterDays: 90 },
  { name: '## Completed Tasks', maxEntries: 100, compressAfterDays: 60, archiveAfterDays: 180 },
  { name: '## Never Again', maxEntries: 50, compressAfterDays: 90, archiveAfterDays: 365 },
  { name: '## Architecture Decisions', maxEntries: 30, compressAfterDays: 180, archiveAfterDays: 365 },
  { name: '## Rejected Patterns', maxEntries: 20, compressAfterDays: 180, archiveAfterDays: 365 }
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemoryEntry {
  date: string
  content: string
  compressed: boolean
  archived: boolean
}

export interface SectionStats {
  name: string
  totalEntries: number
  activeEntries: number
  compressedEntries: number
  archivedEntries: number
  sizeKB: number
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Enforce section caps on MEMORY.md content
 */
export function enforceSectionCaps(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let currentSection: string | null = null
  let sectionStart = -1
  let entryCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Check if this is a section header
    const sectionMatch = trimmed.match(/^##\s+(.+)/)
    if (sectionMatch) {
      // Process previous section if it was being tracked
      if (currentSection && sectionStart !== -1) {
        const sectionConfig = MEMORY_SECTIONS.find(s => s.name === currentSection)
        if (sectionConfig && entryCount > sectionConfig.maxEntries) {
          // Keep only the first maxEntries entries
          const keepLines = result.slice(sectionStart, sectionStart + sectionConfig.maxEntries + 1)
          result.splice(sectionStart, result.length - sectionStart, ...keepLines)
        }
      }

      // Start tracking new section
      currentSection = sectionMatch[1]
      sectionStart = result.length
      entryCount = 0
      result.push(line)
      continue
    }

    // Count entries in current section
    if (currentSection) {
      const sectionConfig = MEMORY_SECTIONS.find(s => s.name === currentSection)
      if (sectionConfig && trimmed.match(/^\[20\d{2}-\d{2}-\d{2}\]|^-/)) {
        entryCount++
      }
    }

    result.push(line)
  }

  return result.join('\n')
}

/**
 * Compress old entries in MEMORY.md content
 */
export function compressOldEntries(content: string, referenceDate: Date = new Date()): string {
  const lines = content.split('\n')
  const result: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const dateMatch = trimmed.match(/\[(\d{4}-\d{2}-\d{2})\]/)

    if (dateMatch) {
      const entryDate = new Date(dateMatch[1])
      const daysOld = (referenceDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)

      // Find which section this entry belongs to
      const sectionConfig = MEMORY_SECTIONS.find(s =>
        result.some(l => l.trim().startsWith(s.name))
      )

      if (sectionConfig && daysOld > sectionConfig.compressAfterDays) {
        // Compress this entry
        const compressed = line.replace(/\s+—\s+.*$/, ' — (compressed entry)')
        result.push(compressed)
        continue
      }
    }

    result.push(line)
  }

  return result.join('\n')
}

/**
 * Archive entries older than threshold to separate file
 */
export async function archiveOldEntries(
  filePath: string,
  archiveDir: string,
  referenceDate: Date = new Date()
): Promise<{ archived: number; newSize: number }> {
  const content = await fs.readFile(filePath, 'utf-8')
  const lines = content.split('\n')
  const keepLines: string[] = []
  const archiveLines: string[] = []
  let currentSection: string | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    // Track section
    const sectionMatch = trimmed.match(/^##\s+(.+)/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      keepLines.push(line)
      continue
    }

    // Check if entry should be archived
    const dateMatch = trimmed.match(/\[(\d{4}-\d{2}-\d{2})\]/)
    if (dateMatch) {
      const entryDate = new Date(dateMatch[1])
      const daysOld = (referenceDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)

      const sectionConfig = MEMORY_SECTIONS.find(s => s.name === currentSection)
      if (sectionConfig && daysOld > sectionConfig.archiveAfterDays) {
        archiveLines.push(line)
        continue
      }
    }

    keepLines.push(line)
  }

  // Write archived entries if any
  if (archiveLines.length > 0) {
    const archivePath = path.join(archiveDir, `archive-${referenceDate.toISOString().split('T')[0]}.md`)
    const archiveContent = `# Archived Entries — ${referenceDate.toISOString().split('T')[0]}\n\n${archiveLines.join('\n')}\n`
    await fs.writeFile(archivePath, archiveContent, 'utf-8')
  }

  // Update original file if archived
  if (archiveLines.length > 0) {
    await fs.writeFile(filePath, keepLines.join('\n'), 'utf-8')
  }

  return {
    archived: archiveLines.length,
    newSize: keepLines.length
  }
}

/**
 * Get statistics about MEMORY.md sections
 */
export function getSectionStats(content: string): SectionStats[] {
  const lines = content.split('\n')
  const stats: SectionStats[] = []
  let currentSection: string | null = null
  let entryCount = 0
  let compressedCount = 0

  for (const line of lines) {
    const trimmed = line.trim()

    // Check section header
    const sectionMatch = trimmed.match(/^##\s+(.+)/)
    if (sectionMatch) {
      // Save previous section stats
      if (currentSection) {
        stats.push({
          name: currentSection,
          totalEntries: entryCount,
          activeEntries: entryCount - compressedCount,
          compressedEntries: compressedCount,
          archivedEntries: 0, // Would need to check archive files
          sizeKB: Math.round(line.length / 1024)
        })
      }

      currentSection = sectionMatch[1]
      entryCount = 0
      compressedCount = 0
      continue
    }

    // Count entries
    if (currentSection) {
      if (trimmed.match(/^\[20\d{2}-\d{2}-\d{2}\]|^-/)) {
        entryCount++
        if (trimmed.includes('(compressed entry)')) {
          compressedCount++
        }
      }
    }
  }

  // Add final section
  if (currentSection) {
    stats.push({
      name: currentSection,
      totalEntries: entryCount,
      activeEntries: entryCount - compressedCount,
      compressedEntries: compressedCount,
      archivedEntries: 0,
      sizeKB: Math.round(content.length / 1024)
    })
  }

  return stats
}

/**
 * Optimize MEMORY.md file (apply caps, compression, archiving)
 */
export async function optimizeMemoryFile(
  filePath: string,
  archiveDir: string
): Promise<{
  optimized: boolean
  archivedCount: number
  compressedCount: number
  newSizeKB: number
}> {
  try {
    // Read current content
    let content = await fs.readFile(filePath, 'utf-8')

    // Apply section caps
    content = enforceSectionCaps(content)

    // Compress old entries
    content = compressOldEntries(content)

    // Archive very old entries
    const { archived, newSize } = await archiveOldEntries(filePath, archiveDir)

    // Get stats
    const stats = getSectionStats(content)
    const compressedCount = stats.reduce((sum, s) => sum + s.compressedEntries, 0)

    return {
      optimized: true,
      archivedCount: archived,
      compressedCount,
      newSizeKB: Math.round(newSize / 1024)
    }
  } catch (error) {
    return {
      optimized: false,
      archivedCount: 0,
      compressedCount: 0,
      newSizeKB: 0
    }
  }
}

/**
 * Batch optimize all MEMORY.md files
 */
export async function batchOptimizeMemoryFiles(
  memoryDir: string,
  archiveDir: string
): Promise<{
  totalFiles: number
  optimizedFiles: number
  totalArchived: number
  totalCompressed: number
}> {
  const files = await fs.readdir(memoryDir)
  const memoryFiles = files.filter(f => f.endsWith('MEMORY.md'))

  let optimizedFiles = 0
  let totalArchived = 0
  let totalCompressed = 0

  for (const file of memoryFiles) {
    const filePath = path.join(memoryDir, file)
    const result = await optimizeMemoryFile(filePath, archiveDir)

    if (result.optimized) {
      optimizedFiles++
      totalArchived += result.archivedCount
      totalCompressed += result.compressedCount
    }
  }

  return {
    totalFiles: memoryFiles.length,
    optimizedFiles,
    totalArchived,
    totalCompressed
  }
}
