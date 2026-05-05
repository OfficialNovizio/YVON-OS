/**
 * Phase A: Update all SKILL.md files to Hermes agentskills.io standard.
 * Adds missing: version, platforms, metadata.hermes.tags
 * Preserves all existing custom fields.
 *
 * Usage: node scripts/update-skill-frontmatter.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const AGENT_DIR = join(ROOT, 'agent-department')

// ─── Tag strategy per agent folder ──────────────────────────────────────────

const AGENT_TAGS = {
  'CEO/marcus':                ['ceo', 'executive', 'strategy', 'synthesis', 'brief', 'okr', 'war-room'],
  'COO/diana':                 ['coo', 'operations', 'workflow', 'planning', 'sprint', 'milestones', 'process'],
  'Technical/dev':             ['development', 'nextjs', 'typescript', 'architecture', 'vercel', 'api-routes', 'build'],
  'Technical/raj':             ['backend', 'supabase', 'database', 'query', 'schema', 'migration', 'api'],
  'Technical/mia':             ['frontend', 'react', 'tailwind', 'ui', 'component', 'design-system', 'ux'],
  'Technical/quinn':           ['qa', 'testing', 'debugging', 'quality', 'lint', 'code-review', 'pulse'],
  'Marketing/lena':            ['copywriting', 'content', 'brand-voice', 'caption', 'email', 'ad-copy', 'copy'],
  'Marketing/rio':             ['paid-ads', 'meta', 'tiktok', 'roas', 'conversion', 'retargeting', 'cpm'],
  'Marketing/atlas':           ['art-direction', 'visual', 'mood-board', 'creative', 'brand-identity', 'image-prompt'],
  'Marketing/pixel':           ['production', 'images', 'assets', 'upscaling', 'batch', 'generation'],
  'Marketing/kai':             ['analytics', 'data', 'kpi', 'competitor', 'trend', 'market-gap', 'ga4'],
  'Marketing/nate':            ['growth', 'funnel', 'experiment', 'ab-test', 'channel', 'acquisition'],
  'Finance/felix':             ['finance', 'pl', 'runway', 'cac', 'ltv', 'mrr', 'margin', 'roi', 'saas'],
  'Psychology/Daniel_Kahneman':['psychology', 'behavioral', 'framing', 'system1', 'bias', 'lever', 'debiasing'],
}

const CATEGORY_TAGS = {
  'executive-operations': ['strategy', 'business', 'planning'],
  'marketing-and-growth': ['marketing', 'growth', 'brand'],
  'creative-visual':      ['design', 'visual', 'creative'],
  'design-and-build':     ['development', 'build', 'technical'],
  'superpowers':          ['productivity', 'workflow', 'methodology'],
  'yvon-custom':          ['yvon', 'custom', 'internal'],
  'prompt-systems':       ['prompt', 'ai', 'generation'],
  'workflow':             ['workflow', 'process', 'automation'],
}

// ─── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return { fm: {}, body: content, raw: '' }
  const end = content.indexOf('\n---', 3)
  if (end === -1) return { fm: {}, body: content, raw: '' }

  const raw = content.slice(3, end).trim()
  const body = content.slice(end + 4).replace(/^\n/, '')

  // Simple key:value parser (handles multiline values with >- indentation)
  const fm = {}
  const lines = raw.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) { i++; continue }
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()

    // Multi-line value (>- or |)
    if (value === '>-' || value === '>' || value === '|') {
      const sublines = []
      i++
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i] === '')) {
        sublines.push(lines[i].trim())
        i++
      }
      fm[key] = sublines.join(' ').trim()
      continue
    }

    // Nested object (empty value, next lines indented)
    if (value === '' && i + 1 < lines.length && lines[i + 1].startsWith('  ')) {
      const nested = {}
      i++
      while (i < lines.length && lines[i].startsWith('  ')) {
        const nLine = lines[i].trim()
        const nColon = nLine.indexOf(':')
        if (nColon !== -1) {
          nested[nLine.slice(0, nColon).trim()] = nLine.slice(nColon + 1).trim()
        }
        i++
      }
      fm[key] = nested
      continue
    }

    // Array value [a, b, c]
    if (value.startsWith('[')) {
      try {
        fm[key] = JSON.parse(value.replace(/'/g, '"'))
      } catch {
        fm[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
      }
      i++
      continue
    }

    fm[key] = value
    i++
  }

  return { fm, body, raw }
}

// ─── Frontmatter serialiser ───────────────────────────────────────────────────

function serializeFrontmatter(fm) {
  const lines = []

  // Standard fields first (Hermes order)
  const standardOrder = ['name', 'description', 'version', 'license', 'platforms', 'prerequisites', 'compatibility', 'metadata']
  const seen = new Set()

  for (const key of standardOrder) {
    if (!(key in fm)) continue
    seen.add(key)
    const val = fm[key]

    if (key === 'platforms') {
      lines.push(`platforms: []`)
      continue
    }

    if (key === 'metadata') {
      lines.push(`metadata:`)
      const meta = val || {}
      if (meta.hermes) {
        lines.push(`  hermes:`)
        if (meta.hermes.tags) {
          lines.push(`    tags: [${meta.hermes.tags.join(', ')}]`)
        }
        if (meta.hermes.related_skills && meta.hermes.related_skills.length > 0) {
          lines.push(`    related_skills: [${meta.hermes.related_skills.join(', ')}]`)
        }
        // preserve other hermes fields
        for (const [k, v] of Object.entries(meta.hermes)) {
          if (k !== 'tags' && k !== 'related_skills') {
            lines.push(`    ${k}: ${v}`)
          }
        }
      }
      // preserve other metadata fields (not hermes)
      for (const [k, v] of Object.entries(meta)) {
        if (k !== 'hermes') {
          if (typeof v === 'object') {
            lines.push(`  ${k}:`)
            for (const [kk, vv] of Object.entries(v)) {
              lines.push(`    ${kk}: ${vv}`)
            }
          } else {
            lines.push(`  ${k}: ${v}`)
          }
        }
      }
      continue
    }

    if (key === 'prerequisites') {
      const pre = val || {}
      lines.push(`prerequisites:`)
      if (pre.env_vars && pre.env_vars.length > 0) {
        lines.push(`  env_vars: [${pre.env_vars.join(', ')}]`)
      } else {
        lines.push(`  env_vars: []`)
      }
      if (pre.commands && pre.commands.length > 0) {
        lines.push(`  commands: [${pre.commands.join(', ')}]`)
      } else {
        lines.push(`  commands: []`)
      }
      continue
    }

    if (typeof val === 'string' && val.length > 80) {
      lines.push(`${key}: >-`)
      // wrap at 80 chars
      lines.push(`  ${val}`)
      continue
    }

    lines.push(`${key}: ${val}`)
  }

  // Remaining custom fields (not in standard order)
  for (const [key, val] of Object.entries(fm)) {
    if (seen.has(key)) continue
    if (typeof val === 'object' && !Array.isArray(val)) {
      lines.push(`${key}:`)
      for (const [k, v] of Object.entries(val)) {
        if (typeof v === 'object') {
          lines.push(`  ${k}:`)
          for (const [kk, vv] of Object.entries(v)) {
            lines.push(`    ${kk}: ${vv}`)
          }
        } else {
          lines.push(`  ${k}: ${v}`)
        }
      }
    } else if (Array.isArray(val)) {
      lines.push(`${key}: [${val.join(', ')}]`)
    } else {
      lines.push(`${key}: ${val}`)
    }
  }

  return lines.join('\n')
}

// ─── Find all SKILL.md files ──────────────────────────────────────────────────

function findSkillFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      results.push(...findSkillFiles(fullPath))
    } else if (entry === 'SKILL.md' || (entry.endsWith('.md') && entry.startsWith('0') && dir.includes('Kahneman'))) {
      results.push(fullPath)
    }
  }
  return results
}

// ─── Get tags for a skill file ────────────────────────────────────────────────

function getTagsForFile(filePath) {
  const rel = relative(AGENT_DIR, filePath).replace(/\\/g, '/')

  // Determine agent tags
  let agentTags = []
  for (const [agentKey, tags] of Object.entries(AGENT_TAGS)) {
    if (rel.startsWith(agentKey)) {
      agentTags = tags
      break
    }
  }

  // Determine category tags
  let catTags = []
  for (const [catKey, tags] of Object.entries(CATEGORY_TAGS)) {
    if (rel.includes(`/${catKey}/`)) {
      catTags = tags
      break
    }
  }

  // Derive skill-specific tag from folder name (the skill's own directory)
  const parts = rel.split('/')
  const skillDir = parts[parts.length - 2] || ''
  const skillTag = skillDir.replace(/-/g, '-').toLowerCase()

  // Merge all tags, deduplicate
  const all = [...new Set([...agentTags, ...catTags, skillTag].filter(Boolean))]
  return all.slice(0, 8) // cap at 8 tags
}

// ─── Process a single SKILL.md ───────────────────────────────────────────────

function processSkillFile(filePath) {
  const raw = readFileSync(filePath, 'utf8')

  // Handle BOM
  const content = raw.startsWith('\uFEFF') ? raw.slice(1) : raw

  const { fm, body } = parseFrontmatter(content)

  let changed = false

  // 1. Add version if missing
  if (!fm.version) {
    fm.version = '1.0.0'
    changed = true
  }

  // 2. Add platforms if missing
  if (!('platforms' in fm)) {
    fm.platforms = []
    changed = true
  }

  // 3. Add metadata.hermes.tags if missing
  if (!fm.metadata || !fm.metadata.hermes || !fm.metadata.hermes.tags || fm.metadata.hermes.tags.length === 0) {
    const tags = getTagsForFile(filePath)
    if (!fm.metadata) fm.metadata = {}
    if (!fm.metadata.hermes) fm.metadata.hermes = {}
    fm.metadata.hermes.tags = tags
    changed = true
  }

  // 4. Move metadata.version to top-level if present
  if (fm.metadata && fm.metadata.version && !fm.version) {
    fm.version = fm.metadata.version
    delete fm.metadata.version
    changed = true
  }

  if (!changed) return false

  const serialized = serializeFrontmatter(fm)
  const newContent = `---\n${serialized}\n---\n${body}`
  writeFileSync(filePath, newContent, 'utf8')
  return true
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const files = findSkillFiles(AGENT_DIR)
  console.log(`Found ${files.length} skill files\n`)

  let updated = 0
  let skipped = 0

  for (const file of files) {
    const rel = relative(ROOT, file)
    try {
      const changed = processSkillFile(file)
      if (changed) {
        console.log(`✓ Updated: ${rel}`)
        updated++
      } else {
        console.log(`⏭  Skipped (already standard): ${rel}`)
        skipped++
      }
    } catch (err) {
      console.error(`❌ Error processing ${rel}: ${err.message}`)
    }
  }

  console.log(`\n─────────────────────────────────────────`)
  console.log(`Skill frontmatter update complete: ${updated} updated, ${skipped} skipped`)
  console.log(`─────────────────────────────────────────`)
}

main()
