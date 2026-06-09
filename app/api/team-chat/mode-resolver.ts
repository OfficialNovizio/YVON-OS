/**
 * app/api/team-chat/mode-resolver.ts — Single source of truth for War Room mode/tool guidance.
 *
 * Called ONCE at the top of the route handler. Every downstream function receives
 * the resolved ModeContext — no more duplicated mode detection across 5 locations.
 *
 * Fixes Failure #5 from the War Room v3 diagnosis: ventureBlock, toolGuidance,
 * streamWithTools filter, executeTool dispatcher, and ceoVentureScope all produced
 * mode-specific strings independently and drifted out of sync.
 */

import type { ToolName } from '@/lib/agent-tools'
import { VENTURE_TECH_STACK } from '@/lib/ventures'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModeContext {
  /** Whether this is the YVON Dashboard (the OS itself) vs a product venture. */
  isYvonDashboard: boolean
  /** Whether local mode is active AND a local repo path is configured. */
  isLocalMode: boolean
  /** The platform we're running on (darwin, linux, win32). */
  platform: NodeJS.Platform
  /** Absolute path to the YVON OS project root. */
  yvonOsPath: string
  /** Absolute path to the local venture repo clone (only set in local mode). */
  localRepoPath?: string
  /** The tech stack string for this venture (e.g. "Flutter/Dart + Firebase"). */
  techStack: string

  // ── Derived guidance blocks (used in system prompts) ─────────────────────

  /** The <venture-scope> block injected into agent system prompts. */
  ventureScopeBlock: string
  /** The <tools-available> block that tells agents how to read/write files. */
  toolGuidanceBlock: string
  /** One-line description of the READ command agents should use. */
  readCommand: string
  /** One-line description of the WRITE command agents should use. */
  writeCommand: string
  /** Which tools are available to agents in this mode. */
  allowedTools: ToolName[]
  /** Platform-specific bash note. */
  platformNote: string
}

// ─── Platform detection ───────────────────────────────────────────────────────

const IS_MACOS = process.platform === 'darwin'
const IS_LINUX = process.platform === 'linux'
const IS_WIN32 = process.platform === 'win32'

// ─── Constants ────────────────────────────────────────────────────────────────

const YVON_OS_PATH = process.cwd()

const LOCAL_FS_TOOLS: ToolName[] = ['Read', 'Glob', 'Grep', 'Bash', 'GraphQuery']
const ALL_AGENT_TOOLS: ToolName[] = ['Read', 'Glob', 'Grep', 'Bash', 'GraphQuery', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github']
const GITHUB_ONLY_TOOLS: ToolName[] = ['WebFetch', 'WebSearch', 'TodoWrite', 'Github']

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ResolveModeParams {
  repoMode: 'github' | 'local'
  ventureSlug?: string
  ventureName?: string
  localRepoPath?: string
}

export function resolveMode(params: ResolveModeParams): ModeContext {
  const { repoMode, ventureSlug, ventureName, localRepoPath } = params
  const isYvonDashboard = !ventureSlug || ventureSlug === 'yvon-dashboard'
  const isLocalMode = repoMode === 'local' && !!localRepoPath
  const techStack = VENTURE_TECH_STACK[ventureSlug ?? ''] ?? 'web/mobile app'
  const repoSlash = localRepoPath ? localRepoPath.replace(/\\/g, '/') : ''
  const hasSpaces = (localRepoPath ?? '').includes(' ')
  const quotedRepo = hasSpaces ? `"${localRepoPath}"` : localRepoPath
  const quotedRepoSlash = hasSpaces ? `"${repoSlash}"` : repoSlash

  const platform = process.platform
  const platformNote = IS_MACOS
    ? `PLATFORM: macOS (bash on Darwin)\n` +
      `- Commands: ls, cat, git, find, file, stat, du, df, wc, head, tail\n` +
      `- Path separator: /\n` +
      `- ⚠️ tree is NOT installed — use find . -type f or ls -R instead\n` +
      `- ⚠️ PATHS WITH SPACES MUST BE QUOTED: ls "${quotedRepoSlash}/lib" — double-quote the full path\n` +
      `- Pipelines allowed: | head, | tail, | sort, | wc, | grep (quoted literal patterns only)`
    : IS_WIN32
    ? `PLATFORM: Windows (PowerShell)\n` +
      `- Commands: ls, cat, git, file, stat\n` +
      `- Path separator: \\\n` +
      `- ⚠️ find is NOT available — use Glob to discover files, Grep to search content\n` +
      `- ⚠️ tree is NOT available — use Glob(pattern) or ls for directory listing`
    : `PLATFORM: Linux (bash)\n` +
      `- Commands: ls, cat, git, find, file, stat, du, df, wc, head, tail\n` +
      `- Path separator: /\n` +
      `- ⚠️ tree is NOT in the allowlist — use find . -type f or ls -R instead`

  // Build the venture scope block (tells agents which codebase they're working on)
  const ventureScopeBlock = isYvonDashboard
    ? `<venture-scope>
Active venture: YVON Dashboard (the AI operating system itself)
The active codebase IS the YVON OS at the local filesystem (${YVON_OS_PATH}).
- Read / Bash / Glob / Grep: use freely to explore the YVON Next.js codebase and docs
- Github tool: targets the YVON OS GitHub repo if configured
- All codebase questions refer to the YVON OS itself
</venture-scope>`
    : isLocalMode
    ? `<venture-scope>
Active venture: ${ventureName ?? ventureSlug ?? 'Unknown'} (slug: ${ventureSlug}) — LOCAL MODE
Local repo path: ${localRepoPath}

READ PATH — use these for ALL file/code questions:
- Read(file_path): read a file using its FULL path, e.g. Read("${repoSlash}/lib/main.dart")
- Glob(pattern): find files within ${repoSlash}/
- Grep(pattern): search file contents within ${repoSlash}/
- Bash(command): shell commands, e.g. Bash("ls ${quotedRepoSlash}") or Bash("git -C ${quotedRepoSlash} log --oneline -5")
⚠️ Always use FULL paths — prefix with ${repoSlash}/

WRITE PATH — LOCAL MODE:
- Github(action=write_file): writes directly to ${repoSlash}/<path> on THIS machine — NOT a GitHub commit
- Github(action=delete_file): deletes from the local repo on THIS machine
- Changes appear immediately in your local clone. No git pull needed.
- ⛔ Do NOT use Github(action=tree) or Github(action=file) for reading — use Read/Glob/Grep instead
</venture-scope>`
    : `<venture-scope>
Active venture: ${ventureName ?? ventureSlug ?? 'Unknown'} (slug: ${ventureSlug})

⚠️ REPO SCOPE — READ THIS BEFORE USING ANY TOOL:
You are working exclusively for this venture. Its codebase lives on GitHub.

ALLOWED for venture questions:
  Github(action=file/tree/commits/issues/prs/branches/search/write_file/delete_file) — the ONLY way to read or write the venture codebase

NOT ALLOWED for venture questions:
  Read / Bash / Glob / Grep — these access the YVON OS dashboard (/YVON2.0/), a completely separate Next.js codebase. It has NOTHING to do with this venture.
  Bash git commands (git log, git status, git diff) — these query YVON's git history, NOT the venture's. Using them to answer questions about the venture produces wrong data.

Read / Bash / Glob / Grep are ONLY permitted for: loading your own MEMORY.md, YVON system docs (WORKFLOW.md, SESSION.md), and YVON agent config. For everything else about the venture, use Github tools.
</venture-scope>`

  // Build the tool guidance block (tells agents HOW to use tools)
  const toolGuidanceBlock = isLocalMode && localRepoPath
    ? `<tools-available>
LOCAL MODE — ${ventureName ?? 'venture'} repo is on THIS machine at: ${localRepoPath}
${platformNote}

READ THE LOCAL REPO — ALWAYS USE THESE FIRST (faster and more reliable than Bash):
- Read(file_path): read a file — full path required, e.g. Read("${repoSlash}/lib/main.dart")
- Glob(pattern): find files by pattern — searches within ${repoSlash}/
- Grep(pattern): search file contents — searches within ${repoSlash}/
⚡ Prefer Read/Glob/Grep over Bash for ALL file reading — they are cross-platform and never fail on path formatting.
⛔ DO NOT RE-EXPLORE THE PROJECT STRUCTURE. The snapshot contains the FULL file tree. Go DIRECTLY to Read(file_path) for specific files.

BASH — only for: checking directory contents, git log/status/diff
- Bash("ls ${quotedRepoSlash}") or Bash("ls ${quotedRepoSlash}/lib") or Bash("git -C ${quotedRepoSlash} log --oneline -5")
- ⚠️ If the path has spaces, wrap the ENTIRE path in double quotes

⛔ BASH FAILURE RECOVERY:
If ANY Bash command returns an error:
1. DO NOT retry the same or similar Bash command — it WILL fail again
2. Switch to Read(file_path) to read files, Glob(pattern) to find files, Grep(pattern) to search
3. Read/Glob/Grep are pure Node.js — they ALWAYS work regardless of installed shell utilities

WRITE TO THE LOCAL REPO:
- Github(action=write_file, path=..., content=..., message=...): writes to ${repoSlash}/<path>
- Github(action=delete_file, path=..., message=...): deletes from ${repoSlash}

GITHUB ONLY WHEN NEEDED:
- Github(action=issues/prs/commits): for GitHub-specific data not available locally
- ⛔ Do NOT use Github(action=tree) or Github(action=file) for reading — use Read/Glob instead

- WebFetch(url): fetch a URL
- WebSearch(query): search the web
- TodoWrite: plan multi-step work
</tools-available>`
    : `<tools-available>
⚠️ TWO COMPLETELY SEPARATE CODEBASES — NEVER CONFUSE THEM:

1. YVON OS (this AI system): Read / Bash / Glob / Grep
   Path: ${YVON_OS_PATH}
   This is the AI operating system dashboard — Next.js, TypeScript, Supabase.
   Git commits, files, and history here belong to YVON, NOT to the venture.
   NEVER use Bash git commands to answer questions about the venture's product.

2. Venture app (the actual product): Github(action=...)
   This is the venture's real codebase on GitHub.
   ALL questions about the venture's codebase → use Github tool ONLY.

Tools:
- Read(file_path): read a file from the YVON OS filesystem — YVON docs, agent memory, etc. NOT the venture repo.
- Glob(pattern), Grep(pattern): search the YVON OS codebase only.
- Bash(command): read-only shell. WARNING: git commands here query YVON's history, NOT the venture's.
- WebFetch(url): fetch a URL.
- WebSearch(query): search the web.
- Github(action): READ or WRITE the venture repo.
  Read: repo · tree · file · issues · prs · branches · commits · search
  Write: write_file(path, content, message) · delete_file(path, message)
- TodoWrite: plan multi-step work.

⛔ DO NOT RE-EXPLORE THE PROJECT STRUCTURE. The snapshot contains the FULL file tree. Go DIRECTLY to Github(action=file) for specific files.
⛔ LOCAL WRITE PROHIBITION: You have zero local filesystem write access. Bash is read-only. Never claim to have written or edited a file locally. The only write path is Github(action=write_file).
</tools-available>`

  // Read/write commands used in task briefs
  const readCommand = isLocalMode && localRepoPath
    ? `Read("${repoSlash}/[filepath]")`
    : `Github(action=file, path=[filepath])`

  const writeCommand = `Github(action=write_file, path="[filepath]", content="[COMPLETE file content]", message="fix: [description]")`

  // Tools available to agents in this mode
  const allowedTools: ToolName[] = isYvonDashboard || isLocalMode
    ? ALL_AGENT_TOOLS
    : GITHUB_ONLY_TOOLS

  return {
    isYvonDashboard,
    isLocalMode,
    platform,
    yvonOsPath: YVON_OS_PATH,
    localRepoPath,
    techStack,
    ventureScopeBlock,
    toolGuidanceBlock,
    readCommand,
    writeCommand,
    allowedTools,
    platformNote,
  }
}
