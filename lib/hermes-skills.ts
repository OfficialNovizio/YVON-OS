/**
 * lib/hermes-skills.ts — connect the pulled Hermes skill packs to agents (B3/C-skills).
 *
 * The packs were pulled to agent-department/shared/skills/hermes/ by the weekly
 * sync. This module maps each pack to the agent(s) it helps and loads the
 * relevant SKILL.md into that agent's brief — so the files actually change agent
 * behaviour instead of sitting inert. Filesystem-based + cached → cross-platform.
 */
import { promises as fs } from 'fs'
import path from 'path'

const HERMES_ROOT = path.join(process.cwd(), 'agent-department/shared/skills/hermes')
const PER_SKILL_CAP = 2500  // chars per pack injected into a brief

/** Agent → relevant Hermes packs (relative path under hermes/). From SKILLS-REGISTRY.md. */
const AGENT_PACKS: Record<string, string[]> = {
  'dev-lead':       ['software-development/subagent-driven-development', 'software-development/code-wiki', 'devops/watchers'],
  'diana-coo':      ['software-development/subagent-driven-development'],
  'raj-backend':    ['software-development/rest-graphql-debug', 'software-development/code-wiki'],
  'quinn-qa':       ['dogfood/adversarial-ux-test', 'software-development/code-wiki'],
  'mia-frontend':   ['web-development/page-agent'],
}

const _cache = new Map<string, string>()  // pack path -> capped SKILL.md (or '' if missing)

async function loadPack(rel: string): Promise<string> {
  if (_cache.has(rel)) return _cache.get(rel)!
  let body = ''
  try {
    const raw = await fs.readFile(path.join(HERMES_ROOT, rel, 'SKILL.md'), 'utf8')
    body = raw.length > PER_SKILL_CAP ? raw.slice(0, PER_SKILL_CAP) + '\n…[truncated]' : raw
  } catch { body = '' }
  _cache.set(rel, body)
  return body
}

/**
 * Build the Hermes-skills block for an agent. Returns '' if the agent has no
 * mapped packs or none are present on disk.
 */
export async function buildHermesSkillBlock(agentId: string): Promise<string> {
  const packs = AGENT_PACKS[agentId]
  if (!packs || packs.length === 0) return ''
  const loaded = await Promise.all(packs.map(async p => ({ name: p.split('/').pop()!, body: await loadPack(p) })))
  const present = loaded.filter(p => p.body)
  if (present.length === 0) return ''
  const blocks = present.map(p => `<hermes-skill name="${p.name}">\n${p.body}\n</hermes-skill>`)
  return `<hermes-skills>\n[Battle-tested workflow skills (from Hermes Agent, MIT). Apply these patterns to this task.]\n\n${blocks.join('\n\n')}\n</hermes-skills>`
}

/** Which packs an agent will receive (for tests / introspection). */
export function packsForAgent(agentId: string): string[] {
  return AGENT_PACKS[agentId] ?? []
}
