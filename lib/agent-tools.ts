/**
 * lib/agent-tools.ts — Claude Code-compatible tool palette for War Room agents.
 *
 * Implements the same tool names/shapes the model was trained on so it uses
 * learned patterns. All tools are read-only and bounded. No Write/Edit by design —
 * War Room is browser-triggered, so any write capability is a remote write primitive.
 *
 * Tools implemented:
 *   - Read           : read a file (offset/limit, cat -n format)
 *   - Glob           : find files by pattern
 *   - Grep           : ripgrep-backed code search
 *   - Bash           : strict allowlist of read-only shell commands
 *   - WebFetch       : fetch a URL, convert HTML→markdown
 *   - TodoWrite      : in-memory todo list for the current run (planning surface)
 */

import type Anthropic from '@anthropic-ai/sdk'
import { promises as fs } from 'fs'
import { resolve, relative, isAbsolute, dirname } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import {
  resolveVentureRepo,
  getRepoInfo, getRepoTree, getRepoFile,
  listIssues, listPRs, listBranches, listCommits, searchCode,
  createOrUpdateRepoFile, deleteRepoFile,
} from '@/lib/github'
import { sessionCacheGetFile, sessionCacheSetFile, sessionCacheInvalidate, sessionQueryGet, sessionQuerySet } from '@/lib/session'
import { queryImpact, formatImpact } from '@/lib/graph-memory'

const execP = promisify(exec)

// ─── Repo sandbox ─────────────────────────────────────────────────────────────

const REPO_ROOT = process.cwd()

/**
 * Resolve a tool-supplied path to an absolute path.
 * Always allowed within REPO_ROOT.
 * If localRepoPath is supplied (local mode), also allowed within that path.
 * Throws on path traversal outside both roots.
 */
function safeResolve(p: string, localRepoPath?: string): string {
  const target = isAbsolute(p) ? resolve(p) : resolve(REPO_ROOT, p)
  const rel = relative(REPO_ROOT, target)
  if (!rel.startsWith('..') && !isAbsolute(rel)) return target // within YVON OS — always OK
  if (localRepoPath) {
    const relFromLocal = relative(localRepoPath, target)
    if (!relFromLocal.startsWith('..') && !isAbsolute(relFromLocal)) return target // within local repo — OK in local mode
  }
  throw new Error(`Path escapes repo root: ${p}`)
}

// ─── Platform detection ────────────────────────────────────────────────────────

const IS_MACOS  = process.platform === 'darwin'
const IS_LINUX  = process.platform === 'linux'
const IS_UNIX   = IS_MACOS || IS_LINUX
const IS_WIN32  = process.platform === 'win32'

// ─── Tool schemas (sent to the model) ─────────────────────────────────────────

export type ToolName = 'Read' | 'Glob' | 'Grep' | 'Bash' | 'WebFetch' | 'WebSearch' | 'TodoWrite' | 'Github' | 'GraphQuery'

export const ALL_TOOLS: ToolName[] = ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github', 'GraphQuery']

/** Per-call context for tools that need session-scope info (e.g. which venture's repo). */
export interface ToolContext {
  ventureSlug?:   string
  /** 'github' (default) | 'local' — controls whether FS tools are allowed for product ventures */
  repoMode?:      'github' | 'local'
  /** Absolute path to the venture's locally cloned repo (only relevant when repoMode=local) */
  localRepoPath?: string
  /** When true, the agent is READ-ONLY — write_file and delete_file are blocked. */
  readOnly?:      boolean
  /**
   * Set of file paths the agent is ALLOWED to modify (from the approved plan).
   * write_file to files NOT in this set will be blocked.
   * If undefined (default), all writes are allowed (backward compat).
   */
  allowedWritePaths?: string[]
}

type AnthropicTool = Anthropic.Messages.Tool

export const TOOL_SCHEMAS: Record<ToolName, AnthropicTool> = {
  Read: {
    name: 'Read',
    description: 'Read a file from the repo. Returns content with line numbers (cat -n format). Use this BEFORE making claims about file contents — never guess.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Absolute or repo-relative path to the file.' },
        offset:    { type: 'number', description: 'Line number to start from (1-indexed). Optional.' },
        limit:     { type: 'number', description: 'Max lines to read. Default 2000.' },
      },
      required: ['file_path'],
    },
  },
  Glob: {
    name: 'Glob',
    description: 'Find files matching a glob pattern (e.g. "**/*.tsx", "app/screens/**/page.tsx"). Returns paths sorted by recency. Use this to discover files before reading.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern, e.g. **/*.ts' },
        path:    { type: 'string', description: 'Directory to search from (repo-relative). Defaults to repo root.' },
      },
      required: ['pattern'],
    },
  },
  Grep: {
    name: 'Grep',
    description: 'Ripgrep-backed code search. Use this to find usages, definitions, patterns across the codebase before answering.',
    input_schema: {
      type: 'object',
      properties: {
        pattern:     { type: 'string', description: 'Regex or literal pattern.' },
        path:        { type: 'string', description: 'Directory or file to search (repo-relative).' },
        glob:        { type: 'string', description: 'Filter by glob, e.g. "*.tsx".' },
        output_mode: { type: 'string', enum: ['content', 'files_with_matches', 'count'], description: 'Default: files_with_matches.' },
        '-i':        { type: 'boolean', description: 'Case insensitive.' },
        '-n':        { type: 'boolean', description: 'Include line numbers (content mode only).' },
        head_limit:  { type: 'number', description: 'Cap result rows. Default 100.' },
      },
      required: ['pattern'],
    },
  },
  Bash: {
    name: 'Bash',
    description: IS_MACOS
      ? 'Run a read-only shell command on macOS (bash). Allowed: ls, pwd, cat, head, tail, wc, find, file, stat, du, df, git status/log/diff/show/branch/remote, git -C, npm ls/view/outdated, node --version. Pipe targets: head, tail, sort, wc, grep. ⚠️ tree is NOT available on macOS. Use find . -type f or ls -R instead. Prefer Read/Glob/Grep over Bash when possible — they are pure Node.js and never fail on missing shell utilities.'
      : IS_LINUX
      ? 'Run a read-only shell command on Linux (bash). Allowed: ls, pwd, cat, head, tail, wc, find, file, stat, du, df, git status/log/diff/show/branch/remote, git -C, npm ls/view/outdated, node --version. Pipe targets: head, tail, sort, wc, grep. ⚠️ tree is NOT available — use find . -type f or ls -R instead. Prefer Read/Glob/Grep over Bash when possible.'
      : 'Run a read-only shell command on Windows (PowerShell). Allowed: ls, pwd, cat, head, tail, wc, file, stat, git status/log/diff/show/branch/remote, git -C, npm ls/view/outdated, node --version. Pipe targets: head, tail, sort, wc, grep. ⚠️ find is NOT available on Windows (runs C:\\Windows\\System32\\find.exe). Use Glob for file discovery, Grep for content search. Prefer Read/Glob/Grep over Bash.',
    input_schema: {
      type: 'object',
      properties: {
        command:     { type: 'string', description: 'The command to run (must start with an allowed binary).' },
        description: { type: 'string', description: '5-10 word description of what this does.' },
        timeout:     { type: 'number', description: 'Timeout in ms. Default 10000, max 30000.' },
      },
      required: ['command', 'description'],
    },
  },
  WebFetch: {
    name: 'WebFetch',
    description: 'Fetch a URL and return its content (HTML converted to plain text). Use for docs, API references, external articles.',
    input_schema: {
      type: 'object',
      properties: {
        url:    { type: 'string', description: 'Fully-qualified https URL.' },
        prompt: { type: 'string', description: 'What you want to learn from this page (used for context only).' },
      },
      required: ['url', 'prompt'],
    },
  },
  WebSearch: {
    name: 'WebSearch',
    description: 'Search the web for current information. Returns titles, URLs, and snippets. Use for finding documentation, debugging errors, researching libraries, checking current events. Better than WebFetch when you don\'t know the exact URL — WebSearch finds the URLs for you.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query — be specific, use technical terms, include version numbers if relevant.' },
        maxResults: { type: 'number', description: 'Max results to return. Default 8, max 15.' },
      },
      required: ['query'],
    },
  },
  GraphQuery: {
    name: 'GraphQuery',
    description: 'Graph memory: find EVERY reference / call site of a symbol or filename across the venture repo. ⛔ Call this BEFORE you rename, move, extract, or change the signature of anything — it tells you which files you must also update so you never leave dangling callers (the #1 cause of broken builds). Returns file:line for each usage.',
    input_schema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'The symbol, identifier, method, class, or filename stem to trace (e.g. "buildOverviewForMonth", "ShiftController", "shiftRepo").' },
      },
      required: ['target'],
    },
  },
  TodoWrite: {
    name: 'TodoWrite',
    description: 'Maintain a working todo list for multi-step tasks. Use to plan, then mark items completed as you go.',
    input_schema: {
      type: 'object',
      properties: {
        todos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content:    { type: 'string' },
              status:     { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
              activeForm: { type: 'string' },
            },
            required: ['content', 'status', 'activeForm'],
          },
        },
      },
      required: ['todos'],
    },
  },
  Github: {
    name: 'Github',
    description: 'Query OR write to the active venture\'s GitHub repo. READ: verify repo existence, read files, check commits/issues/PRs/branches. WRITE: use action=write_file to commit a file directly to the repo — no git push needed. If the user uploads a file and asks you to add it to the repo, use write_file.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['repo', 'tree', 'file', 'issues', 'prs', 'branches', 'commits', 'search', 'write_file'],
          description: 'repo=metadata · tree=full file list · file=read one file · issues · prs · branches · commits · search · write_file=create or update a file (needs path, content, message). ⛔ delete_file is BLOCKED for all agents.',
        },
        path:    { type: 'string', description: 'File path inside the repo. Required for file, write_file, delete_file.' },
        content: { type: 'string', description: 'For write_file: the full file content as plain text.' },
        message: { type: 'string', description: 'For write_file and delete_file: the commit message.' },
        branch:  { type: 'string', description: 'For tree, write_file, delete_file: branch name (defaults to repo default).' },
        state:   { type: 'string', enum: ['open', 'closed', 'all'], description: 'For issues/prs.' },
        query:   { type: 'string', description: 'For action=search: code search query.' },
      },
      required: ['action'],
    },
  },
}

// ─── Tool result envelope ─────────────────────────────────────────────────────

export interface ToolResult {
  content:  string
  is_error: boolean
  /** One-line summary suitable for emitting to SSE / UI. */
  summary:  string
}

function ok(content: string, summary: string): ToolResult {
  return { content, is_error: false, summary }
}
function err(message: string): ToolResult {
  return { content: `Error: ${message}`, is_error: true, summary: `error: ${message.slice(0, 80)}` }
}

// ─── Bash allowlist ───────────────────────────────────────────────────────────

const BASH_ALLOWED_PREFIXES = [
  'ls', 'pwd', 'cat', 'head', 'tail', 'wc', 'file', 'stat',
  // ⛔ 'tree' removed — NOT installed by default on macOS (requires brew install tree).
  //    On Linux it may also be missing from minimal installs.
  //    Agents must use: find . -type f, ls -R, or Glob/Grep instead.
  'git status', 'git log', 'git diff', 'git show', 'git branch', 'git remote',
  'git -C',  // allows: git -C /local/repo/path log/status/diff/branch
  'npm ls', 'npm view', 'npm outdated',
  'node --version', 'node -v',
  // Read-only compile checks — agents may self-verify (the build gate runs these
  // server-side too). cwd is already the repo, so no `cd` is needed.
  'flutter analyze', 'dart analyze', 'flutter test', 'dart test', 'flutter doctor',
  // find allowed on macOS/Linux only — on Windows it resolves to C:\Windows\System32\find.exe
  ...(IS_UNIX ? ['find'] : []),
  // macOS/Linux utilities that are safe and read-only
  ...(IS_UNIX ? ['du', 'df', 'xargs', 'echo', 'which', 'uname', 'env'] : []),
]

// Safe read-only pipe targets: head, tail, sort, wc, grep (with literal pattern only)
const SAFE_PIPE_TARGET = /^(head(\s+(-\d+|-n\s+\d+))?|tail(\s+(-\d+|-n\s+\d+))?|sort(\s+-[a-zA-Z0-9]+)*|wc(\s+-[a-zA-Z]+)?|grep(\s+-[a-zA-Z]+)*(\s+"[^"]*"|\s+'[^']*'|\s+\S+))$/

function normalizeSep(p: string): string {
  return p.replace(/\\/g, '/')
}

function isBashAllowedSingle(cmd: string, localRepoPath?: string): boolean {
  const trimmed = cmd.trim()
  // Block shell injection characters. Allow backslashes for Windows paths.
  if (/[;&|`$(){}<>]|\.\.\//.test(trimmed)) return false
  if (!BASH_ALLOWED_PREFIXES.some(prefix => trimmed === prefix || trimmed.startsWith(prefix + ' '))) return false

  // ── Unix absolute paths (/...) ────────────────────────────────────────────
  if (/(?:^|\s)\//.test(trimmed)) {
    if (!localRepoPath) return false
    const absPaths = trimmed.match(/(?:^|\s)(\/[^\s"']+)/g)
    if (!absPaths) return false
    return absPaths.every(p => {
      const cleaned = p.trim()
      const rel = relative(localRepoPath, resolve(cleaned))
      return !rel.startsWith('..') && !isAbsolute(rel)
    })
  }

  // ── Windows absolute paths (C:\... or C:/...) ────────────────────────────
  if (/(?:^|\s)"?[A-Za-z]:[\\\/]/.test(trimmed)) {
    if (!localRepoPath) return false
    // Extract path tokens — quoted ("C:\path with spaces") or unquoted
    const winPaths = trimmed.match(/"([A-Za-z]:[\\\/][^"]*)"|([A-Za-z]:[\\\/]\S*)/g) ?? []
    if (winPaths.length === 0) return false
    const repoNorm = normalizeSep(localRepoPath)
    return winPaths.every(raw => {
      const cleaned = normalizeSep(raw.replace(/^"|"$/g, ''))
      // Path must be the repo itself or a subdirectory of it
      return cleaned === repoNorm || cleaned.startsWith(repoNorm + '/')
    })
  }

  return true
}

function isBashAllowed(cmd: string, localRepoPath?: string): boolean {
  // `2>&1` (merge stderr into stdout) is safe and very common — strip it before
  // the metachar check so commands like `flutter analyze 2>&1 | head` validate.
  const trimmed = cmd.replace(/\s*2>&1/g, '').trim()
  // Handle pipeline — base command + safe terminal stages only
  if (trimmed.includes('|')) {
    const stages = trimmed.split('|').map(s => s.trim()).filter(Boolean)
    if (stages.length < 2) return false
    if (!isBashAllowedSingle(stages[0], localRepoPath)) return false
    return stages.slice(1).every(stage => {
      if (/[;&|`$(){}<>]/.test(stage)) return false
      return SAFE_PIPE_TARGET.test(stage)
    })
  }
  return isBashAllowedSingle(trimmed, localRepoPath)
}

// ─── Tool executors ───────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 2_000_000
const MAX_GREP_ROWS = 200
const MAX_BASH_OUTPUT = 50_000

async function execRead(input: { file_path: string; offset?: number; limit?: number }, ctx?: ToolContext): Promise<ToolResult> {
  try {
    const localRepoPath = ctx?.repoMode === 'local' ? ctx?.localRepoPath : undefined
    const abs = safeResolve(input.file_path, localRepoPath)
    // Per-session read-through cache (engine v2). No-op when no active session.
    let raw = sessionCacheGetFile(abs)
    if (raw === undefined) {
      const stat = await fs.stat(abs)
      if (stat.size > MAX_FILE_BYTES) {
        return err(`File too large (${stat.size} bytes, cap ${MAX_FILE_BYTES}). Use Grep or read with offset/limit.`)
      }
      raw = await fs.readFile(abs, 'utf8')
      sessionCacheSetFile(abs, raw)
    }
    const lines = raw.split('\n')
    const offset = Math.max(1, input.offset ?? 1)
    const limit = Math.min(2000, input.limit ?? 2000)
    const slice = lines.slice(offset - 1, offset - 1 + limit)
    const numbered = slice.map((l, i) => `${String(offset + i).padStart(5, ' ')}\t${l}`).join('\n')
    const total = lines.length
    const note = (offset > 1 || offset - 1 + limit < total) ? `\n[showing lines ${offset}–${offset + slice.length - 1} of ${total}]` : ''
    return ok(numbered + note, `read ${input.file_path} (${slice.length} lines)`)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}

async function execGlob(input: { pattern: string; path?: string }, ctx?: ToolContext): Promise<ToolResult> {
  try {
    const localRepoPath = ctx?.repoMode === 'local' ? ctx?.localRepoPath : undefined
    const root = input.path ? safeResolve(input.path, localRepoPath) : REPO_ROOT
    // Per-session structure-query cache: identical Glob re-runs are served instantly.
    const cacheKey = `glob:${root}:${input.pattern}`
    const cached = sessionQueryGet(cacheKey)
    if (cached !== undefined) {
      const n = cached === '(no matches)' ? 0 : cached.split('\n').length
      return ok(cached, `glob ${input.pattern}: ${n} match${n === 1 ? '' : 'es'} (cached)`)
    }
    // Node 22+ built-in glob — handles ** correctly, no shell dependency
    const paths: string[] = []
    const exclude = (p: string) => /\/(node_modules|\.next|\.git|dist|build|\.toon\/graphs|tsconfig\.tsbuildinfo)(\/|$)/.test(p)
    const fsAny = fs as unknown as { glob: (pattern: string, opts: { cwd: string; exclude: (p: string) => boolean }) => AsyncIterable<string> }
    for await (const p of fsAny.glob(input.pattern, { cwd: root, exclude })) {
      paths.push(p)
      if (paths.length >= 200) break
    }
    paths.sort()
    if (paths.length === 0) { sessionQuerySet(cacheKey, '(no matches)'); return ok('(no matches)', `glob ${input.pattern}: 0 matches`) }
    const globOut = paths.join('\n')
    sessionQuerySet(cacheKey, globOut)
    return ok(globOut, `glob ${input.pattern}: ${paths.length} match${paths.length === 1 ? '' : 'es'}`)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}

// Graph memory — trace every reference/call site of a symbol before editing it.
async function execGraphQuery(input: { target: string }, ctx?: ToolContext): Promise<ToolResult> {
  const target = (input?.target ?? '').trim()
  if (!target) return err('GraphQuery requires a "target" (symbol, method, class, or filename stem).')
  const repoRoot = ctx?.repoMode === 'local' ? ctx?.localRepoPath : undefined
  if (!repoRoot) {
    return err('GraphQuery needs Local mode (a cloned repo). Switch the War Room to Local mode, or use Github(action=search) for GitHub-hosted code.')
  }
  const cacheKey = `graph:${repoRoot}:${target}`
  const cached = sessionQueryGet(cacheKey)
  if (cached !== undefined) return ok(cached, `graph "${target}": cached`)
  const impact = await queryImpact(repoRoot, target)
  const out = formatImpact(impact)
  sessionQuerySet(cacheKey, out)
  return ok(out, `graph "${target}": ${impact.count} ref(s) in ${impact.fileCount} file(s)`)
}

// Pure Node.js grep — no shell dependency, works on Windows and macOS identically.
async function execGrep(input: {
  pattern: string
  path?: string
  glob?: string
  output_mode?: 'content' | 'files_with_matches' | 'count'
  '-i'?: boolean
  '-n'?: boolean
  head_limit?: number
}, ctx?: ToolContext): Promise<ToolResult> {
  try {
    const localRepoPath = ctx?.repoMode === 'local' ? ctx?.localRepoPath : undefined
    const target = input.path ? safeResolve(input.path, localRepoPath) : REPO_ROOT
    // Per-session structure-query cache: identical Grep re-runs are served instantly.
    const grepKey = `grep:${target}:${JSON.stringify(input)}`
    const grepCached = sessionQueryGet(grepKey)
    if (grepCached !== undefined) {
      const n = grepCached === '(no matches)' ? 0 : grepCached.split('\n').length
      return ok(grepCached, `grep "${input.pattern}": ${n} result(s) (cached)`)
    }
    const mode   = input.output_mode ?? 'files_with_matches'
    const limit  = Math.min(MAX_GREP_ROWS, input.head_limit ?? 100)
    const reFlags = input['-i'] ? 'gi' : 'g'
    let re: RegExp
    try { re = new RegExp(input.pattern, reFlags) } catch { return err(`Invalid regex: ${input.pattern}`) }

    const EXCLUDED = /[\\/](node_modules|\.next|\.git|dist|build|\.toon\/graphs)([\\/]|$)/

    // ── Collect candidate files ───────────────────────────────────────────────
    const stat = await fs.stat(target).catch(() => null)
    if (!stat) return err(`Path not found: ${target}`)

    let files: string[] = []
    if (stat.isFile()) {
      files = [target]
    } else {
      // Recursive file walk
      const walk = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const e of entries) {
          const full = resolve(dir, e.name)
          if (EXCLUDED.test(full)) continue
          if (e.isDirectory()) await walk(full)
          else if (e.isFile()) {
            if (input.glob) {
              // Simple glob: *.dart or **/*.ts — just check extension / filename
              const globPat = input.glob.replace(/\*\*\//, '').replace(/\*/g, '.*').replace(/\./g, '\\.')
              if (!new RegExp(globPat + '$', 'i').test(e.name)) continue
            }
            files.push(full)
          }
        }
      }
      await walk(target)
    }

    // ── Search files ──────────────────────────────────────────────────────────
    const results: string[] = []
    for (const file of files) {
      if (results.length >= limit) break
      let text: string
      try { text = await fs.readFile(file, 'utf-8') } catch { continue }
      re.lastIndex = 0
      if (mode === 'files_with_matches') {
        if (re.test(text)) results.push(file)
      } else if (mode === 'count') {
        const count = (text.match(re) ?? []).length
        if (count > 0) results.push(`${file}: ${count}`)
      } else {
        // content mode
        const lines = text.split('\n')
        for (let i = 0; i < lines.length && results.length < limit; i++) {
          re.lastIndex = 0
          if (re.test(lines[i])) {
            results.push(input['-n'] ? `${file}:${i + 1}: ${lines[i]}` : `${file}: ${lines[i]}`)
          }
        }
      }
    }

    if (results.length === 0) { sessionQuerySet(grepKey, '(no matches)'); return ok('(no matches)', `grep "${input.pattern}": 0 matches`) }
    const out = results.join('\n')
    sessionQuerySet(grepKey, out)
    return ok(out, `grep "${input.pattern}": ${results.length} result(s)`)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}

async function execBash(input: { command: string; description: string; timeout?: number }, ctx?: ToolContext): Promise<ToolResult> {
  const localRepoPath = ctx?.repoMode === 'local' ? ctx?.localRepoPath : undefined
  if (!isBashAllowed(input.command, localRepoPath)) {
    return err(`Bash command rejected: "${input.command}"\n\nThis command is not in the read-only allowlist. Instead, use:\n- Read(file_path) to read any file — pure Node.js, always works\n- Glob(pattern) to find files by pattern — pure Node.js, always works\n- Grep(pattern) to search file contents — pure Node.js, always works\n- Bash is only for: ls, cat, find, git log/status/diff, npm ls/view/outdated`)
  }
  try {
    const timeout = Math.min(30_000, input.timeout ?? 10_000)
    const cwd = (ctx?.repoMode === 'local' && ctx?.localRepoPath) ? ctx.localRepoPath : REPO_ROOT
    // Use platform-native shell — /bin/bash on macOS/Linux, powershell.exe on Windows
    const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
    // Enrich PATH so flutter/dart resolve even under the dev server's non-login shell.
    const home = process.env.HOME ?? process.env.USERPROFILE ?? ''
    const extra = process.platform === 'win32'
      ? [`${home}\\flutter\\bin`, `${home}\\fvm\\default\\bin`, 'C:\\flutter\\bin', 'C:\\src\\flutter\\bin']
      : [`${home}/development/flutter/bin`, `${home}/flutter/bin`, `${home}/fvm/default/bin`, '/opt/homebrew/bin', '/usr/local/bin', `${home}/.pub-cache/bin`]
    const sep = process.platform === 'win32' ? ';' : ':'
    const env = { ...process.env, PATH: `${extra.join(sep)}${sep}${process.env.PATH ?? ''}` }
    const { stdout, stderr } = await execP(input.command, {
      cwd,
      shell,
      maxBuffer: MAX_BASH_OUTPUT,
      timeout,
      env,
    })
    const combined = (stdout + (stderr ? `\n[stderr]\n${stderr}` : '')).trim()
    const truncated = combined.length > MAX_BASH_OUTPUT
      ? combined.slice(0, MAX_BASH_OUTPUT) + '\n[output truncated]'
      : combined
    return ok(truncated || '(no output)', `bash: ${input.description}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return err(`Bash command failed: ${msg}\n\n⚠️ DO NOT retry this Bash command — it will fail again. Use Read, Glob, and Grep instead. They are pure Node.js implementations that do NOT depend on any shell utilities being installed. They always work on macOS, Linux, and Windows.\n- Use Read(file_path) to read file contents\n- Use Glob(pattern) to find files\n- Use Grep(pattern) to search file contents`)
  }
}

async function execWebFetch(input: { url: string; prompt: string }): Promise<ToolResult> {
  try {
    const u = new URL(input.url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      return err(`Unsupported protocol: ${u.protocol}`)
    }
    const res = await fetch(input.url, {
      headers: { 'User-Agent': 'YVON-WarRoom/1.0' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return err(`HTTP ${res.status}`)
    const text = await res.text()
    // Strip HTML tags crudely → plain text. Cap at 50KB.
    const stripped = text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const capped = stripped.slice(0, 50_000) + (stripped.length > 50_000 ? '\n[truncated]' : '')
    return ok(`URL: ${input.url}\nGoal: ${input.prompt}\n\n${capped}`, `fetched ${u.hostname} (${capped.length} chars)`)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}

async function execWebSearch(input: { query: string; maxResults?: number }): Promise<ToolResult> {
  const maxResults = Math.min(15, input.maxResults ?? 8)
  const query = input.query.trim()
  if (!query) return err('Search query is required')

  // Try DuckDuckGo Instant Answer API first (free, no API key needed).
  // Falls back to HTML scraping if the API returns no results.
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(ddgUrl, {
      headers: { 'User-Agent': 'YVON-WarRoom/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (res.ok) {
      const data = await res.json() as {
        Abstract?: string
        AbstractText?: string
        AbstractSource?: string
        AbstractURL?: string
        Heading?: string
        RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Icon?: { URL?: string } }>
        Results?: Array<{ Text?: string; FirstURL?: string }>
      }

      const lines: string[] = []
      lines.push(`Web search results for query: "${query}"`)
      lines.push('')

      // Instant answer (if available)
      let hasContent = false
      if (data.AbstractText) {
        lines.push(`**${data.Heading ?? 'Answer'}:** ${data.AbstractText}`)
        if (data.AbstractSource) lines.push(`Source: ${data.AbstractSource}`)
        if (data.AbstractURL) lines.push(`URL: ${data.AbstractURL}`)
        lines.push('')
        hasContent = true
      }

      // Related topics
      const topics = data.RelatedTopics ?? []
      const results = data.Results ?? []
      const allItems = [...results.map(r => ({ title: r.Text ?? '', url: r.FirstURL ?? '' })),
                        ...topics.filter(t => t.Text).map(t => ({ title: t.Text ?? '', url: t.FirstURL ?? '' }))]

      if (allItems.length > 0) {
        lines.push(`Links:`)
        const seen = new Set<string>()
        let count = 0
        for (const item of allItems) {
          if (count >= maxResults) break
          const key = item.url || item.title.slice(0, 40)
          if (seen.has(key)) continue
          seen.add(key)
          lines.push(`- [${item.title.slice(0, 120)}](${item.url})`)
          count++
        }
        hasContent = true
      }

      if (hasContent) {
        return ok(lines.join('\n'), `web search "${query}": ${Math.min(maxResults, allItems.length)} results`)
      }
    }
  } catch { /* fall through to fallback */ }

  // Fallback: web search via DuckDuckGo HTML (lite version, no JS required)
  try {
    const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const res = await fetch(htmlUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return err(`Search failed: HTTP ${res.status}`)
    const html = await res.text()

    // Extract result links from the HTML results page
    const linkMatches = html.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi) ?? []
    const snippetMatches = html.match(/<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/gi) ?? []

    if (linkMatches.length === 0) return ok(`(no results found for "${query}")`, `web search "${query}": 0 results`)

    const lines: string[] = [`Web search results for query: "${query}"`, '', 'Links:']
    for (let i = 0; i < Math.min(maxResults, linkMatches.length); i++) {
      const hrefMatch = linkMatches[i].match(/href="([^"]*)"/)
      const titleMatch = linkMatches[i].match(/>([^<]*)</)
      const url = hrefMatch?.[1] ?? ''
      const title = titleMatch?.[1]?.trim() ?? ''
      if (url) lines.push(`- [${title || url.slice(0, 80)}](${url})`)
    }

    return ok(lines.join('\n'), `web search "${query}": ${linkMatches.length} results`)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}

interface TodoItem { content: string; status: 'pending' | 'in_progress' | 'completed'; activeForm: string }

async function execGithub(
  input: { action: string; path?: string; content?: string; message?: string; branch?: string; state?: 'open' | 'closed' | 'all'; query?: string },
  ctx: ToolContext,
): Promise<ToolResult> {
  if (!ctx.ventureSlug) return err('No active venture for this session — cannot resolve GitHub repo.')
  try {
    const { owner, repo, repoUrl } = await resolveVentureRepo(ctx.ventureSlug)
    const slug = `${owner}/${repo}`

    switch (input.action) {
      case 'repo': {
        const r = await getRepoInfo(owner, repo)
        const body = [
          `Repo: ${r.fullName}  (${r.private ? 'private' : 'public'})`,
          `Description: ${r.description ?? '(none)'}`,
          `Default branch: ${r.defaultBranch}`,
          `Stars: ${r.stars}  ·  Open issues: ${r.openIssues}`,
          `Updated: ${r.updatedAt}`,
          `URL: ${r.url}`,
        ].join('\n')
        return ok(body, `github repo ${slug}: exists, ${r.openIssues} open issues`)
      }
      case 'tree': {
        const branch = input.branch ?? (await getRepoInfo(owner, repo)).defaultBranch
        const t = await getRepoTree(owner, repo, branch)
        const list = t.files.slice(0, 300).map(f => `${f.path}  (${f.size}B)`).join('\n')
        const note = t.truncated ? `\n[result truncated by GitHub — showing first ${t.files.length} files]` : `\n[${t.files.length} files total]`
        return ok(list + note, `github tree ${slug}@${branch}: ${t.files.length} files`)
      }
      case 'file': {
        if (!input.path) return err('action=file requires a path argument')
        const f = await getRepoFile(owner, repo, input.path)
        const capped = f.content.length > 80_000 ? f.content.slice(0, 80_000) + '\n[truncated]' : f.content
        return ok(`${f.path} (${f.size}B)\n\n${capped}`, `github file ${slug}/${input.path}: ${f.size}B`)
      }
      case 'issues': {
        const list = await listIssues(owner, repo, input.state ?? 'open')
        if (list.length === 0) return ok('(no issues)', `github issues ${slug}: 0`)
        const body = list.map(i => `#${i.number} [${i.state}] ${i.title}${i.labels.length ? ' · ' + i.labels.join(',') : ''}`).join('\n')
        return ok(body, `github issues ${slug}: ${list.length}`)
      }
      case 'prs': {
        const list = await listPRs(owner, repo, input.state ?? 'open')
        if (list.length === 0) return ok('(no PRs)', `github prs ${slug}: 0`)
        const body = list.map(p => `#${p.number} [${p.state}] ${p.title}  (${p.head} → ${p.base})`).join('\n')
        return ok(body, `github prs ${slug}: ${list.length}`)
      }
      case 'branches': {
        const list = await listBranches(owner, repo)
        return ok(list.map(b => `${b.name}${b.protected ? ' [protected]' : ''}`).join('\n'), `github branches ${slug}: ${list.length}`)
      }
      case 'commits': {
        const list = await listCommits(owner, repo, 20)
        const body = list.map(c => `${c.sha}  ${c.date.slice(0, 10)}  ${c.author}  ${c.message}`).join('\n')
        return ok(body, `github commits ${slug}: ${list.length}`)
      }
      case 'search': {
        if (!input.query) return err('action=search requires a query argument')
        const list = await searchCode(owner, repo, input.query)
        if (list.length === 0) return ok('(no matches)', `github search ${slug} "${input.query}": 0`)
        return ok(list.map(r => r.path).join('\n'), `github search ${slug} "${input.query}": ${list.length}`)
      }
      case 'write_file': {
        if (!input.path)    return err('action=write_file requires a path argument')
        if (!input.content) return err('action=write_file requires a content argument')
        if (!input.message) return err('action=write_file requires a message (commit message) argument')
        // ⛔ READ-ONLY GATE: Block all writes when readOnly mode is active
        if (ctx.readOnly) {
          return err(
            '⛔ WRITE BLOCKED: You are in READ-ONLY mode. You CANNOT write files.\n' +
            'You are a validator/QA agent. Report errors — do not fix them yourself.\n' +
            'The specialist agent will apply the fixes based on your report.'
          )
        }
        // ⛔ FILE GUARD: Block writes to files not in the approved plan (if allowedWritePaths is set)
        // Write operation proceeds only if the file matches an allowed path or the guard isn't set
        // (backward compatible — if allowedWritePaths is undefined, all writes pass)
        if (ctx.allowedWritePaths && ctx.allowedWritePaths.length > 0) {
          const normalizedPath = input.path.replace(/\\/g, '/')
          const isAllowed = ctx.allowedWritePaths.some(allowed =>
            normalizedPath.includes(allowed.replace(/\\/g, '/')) ||
            allowed.replace(/\\/g, '/').includes(normalizedPath)
          )
          if (!isAllowed) {
            return err(
              `⛔ WRITE BLOCKED: File "${input.path}" is NOT in the approved plan.\n` +
              `You may ONLY write to files listed in your task brief. To modify this file,\n` +
              `ask the user for approval first.\n\n` +
              `Allowed files: ${ctx.allowedWritePaths.join(', ')}`
            )
          }
        }
        // Local mode: write directly to the cloned repo, then git-commit for a real SHA
        if (ctx.repoMode === 'local' && ctx.localRepoPath) {
          try {
            const localRoot = ctx.localRepoPath
            const targetPath = resolve(localRoot, input.path)
            const rel = relative(localRoot, targetPath)
            if (rel.startsWith('..') || isAbsolute(rel)) {
              return err(`Path escapes local repo root: ${input.path}`)
            }
            await fs.mkdir(dirname(targetPath), { recursive: true })
            const existed = await fs.stat(targetPath).then(() => true).catch(() => false)
            await fs.writeFile(targetPath, input.content, 'utf-8')
            // Invalidate the per-session read cache so no agent reads stale content.
            sessionCacheInvalidate(targetPath)

            // Git-commit the write so a real SHA is available for Marcus's synthesis.
            // Uses the same shell as execBash (PowerShell on Windows, bash on Mac/Linux).
            let sha = ''
            try {
              const shell  = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
              const gitAdd = await execP(`git -C "${localRoot}" add "${targetPath}"`, { shell, timeout: 10_000 })
              void gitAdd
              const gitMsg = input.message.replace(/"/g, "'")
              const gitCommit = await execP(`git -C "${localRoot}" commit -m "${gitMsg}"`, { shell, timeout: 10_000 })
              const shaMatch = gitCommit.stdout.match(/\[[\w/]+ ([a-f0-9]+)\]/)
              sha = shaMatch?.[1] ?? ''
            } catch { /* git not initialised or nothing staged — file was still written */ }

            const status = existed ? 'updated' : 'created'
            const shaNote = sha ? `\nCommit SHA: ${sha}` : '\n(no git commit — file written to disk only)'
            return ok(
              `File ${status} locally: ${targetPath}${shaNote}`,
              `local write ${input.path}: ${status} ✓${sha ? ' SHA:' + sha.slice(0, 7) : ''}`
            )
          } catch (e) {
            return err(`Local write failed: ${e instanceof Error ? e.message : String(e)}`)
          }
        }
        const result = await createOrUpdateRepoFile(owner, repo, input.path, input.content, input.message, input.branch)
        return ok(
          `File ${result.created ? 'created' : 'updated'}: ${input.path}\nCommit SHA: ${result.sha}\nURL: ${result.url}`,
          `github write_file ${slug}/${input.path}: ${result.created ? 'created' : 'updated'} ✓`
        )
      }
      case 'delete_file': {
        // ⛔ NEVER DELETE — This operation is BLOCKED for ALL agents.
        //    Deletion requires explicit user instruction outside the War Room.
        //    No agent has permission to delete files. Period.
        return err(
          '⛔ DELETE BLOCKED: File deletion is NEVER allowed for any agent.\n' +
          'No agent — including Marcus, Dev Lead, Quinn QA — can delete files.\n' +
          'If a file truly needs to be deleted, ask the user to do it manually.\n' +
          'You may suggest deletion in your report, but you CANNOT execute it.'
        )
      }
      default:
        return err(`Unknown Github action: ${input.action}`)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/GitHub 404/.test(msg)) return err(`GitHub 404 — repo not found or GITHUB_TOKEN has no access. Check: (1) venture repo URL is correct in Settings, (2) GITHUB_TOKEN has Contents read permission for this repo. Detail: ${msg.slice(0, 200)}`)
    return err(msg)
  }
}

function execTodoWrite(input: { todos: TodoItem[] }): ToolResult {
  const lines = input.todos.map((t, i) => {
    const mark = t.status === 'completed' ? '✓' : t.status === 'in_progress' ? '→' : '·'
    const label = t.status === 'in_progress' ? t.activeForm : t.content
    return `${i + 1}. ${mark} ${label}`
  }).join('\n')
  const inProgress = input.todos.find(t => t.status === 'in_progress')
  const done = input.todos.filter(t => t.status === 'completed').length
  return ok(
    `Todos updated (${done}/${input.todos.length} complete${inProgress ? `, currently: ${inProgress.activeForm}` : ''}):\n${lines}`,
    `todos: ${done}/${input.todos.length} done${inProgress ? `, on: ${inProgress.activeForm.slice(0, 40)}` : ''}`,
  )
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const LOCAL_FS_TOOLS = new Set(['Read', 'Glob', 'Grep', 'Bash', 'GraphQuery'])

export async function executeTool(name: string, input: unknown, ctx: ToolContext = {}): Promise<ToolResult> {
  const inp = (input ?? {}) as Record<string, unknown>

  // Hard block: local filesystem tools are forbidden for product ventures in GitHub mode.
  // In local mode the user has explicitly cloned the repo locally — FS tools are allowed.
  const isYvonDashboard = !ctx.ventureSlug || ctx.ventureSlug === 'yvon-dashboard'
  const isLocalMode     = ctx.repoMode === 'local'
  if (!isYvonDashboard && !isLocalMode && LOCAL_FS_TOOLS.has(name)) {
    const slug = ctx.ventureSlug
    return err(
      `⛔ ${name} is blocked for venture "${slug}" — you are in GitHub mode, so local filesystem tools cannot see the venture's codebase.\n\n` +
      `Use Github tools instead:\n` +
      `- Github(action=file, path=...) — read a specific file from the venture's GitHub repo\n` +
      `- Github(action=tree) — list all files in the repo\n` +
      `- Github(action=commits) — view recent commits\n` +
      `- Github(action=issues) — view open issues\n` +
      `- Github(action=write_file, path=..., content=..., message=...) — write a file directly to the repo\n\n` +
      `To use Read/Glob/Grep on this venture's code, switch to Local mode in the War Room settings.`
    )
  }

  try {
    switch (name) {
      case 'Read':      return await execRead(inp as Parameters<typeof execRead>[0], ctx)
      case 'Glob':      return await execGlob(inp as Parameters<typeof execGlob>[0], ctx)
      case 'Grep':      return await execGrep(inp as Parameters<typeof execGrep>[0], ctx)
      case 'Bash':      return await execBash(inp as Parameters<typeof execBash>[0], ctx)
      case 'WebFetch':  return await execWebFetch(inp as Parameters<typeof execWebFetch>[0])
      case 'WebSearch': return await execWebSearch(inp as Parameters<typeof execWebSearch>[0])
      case 'TodoWrite': return execTodoWrite(inp as Parameters<typeof execTodoWrite>[0])
      case 'Github':    return await execGithub(inp as Parameters<typeof execGithub>[0], ctx)
      case 'GraphQuery':return await execGraphQuery(inp as { target: string }, ctx)
      default:          return err(`Unknown tool: ${name}`)
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}

// ─── Per-agent tool allowlists ────────────────────────────────────────────────

/**
 * Tier 1 — full code exploration: technical agents + CEO/COO
 * Tier 2 — code-read: analysts and frontend (no shell)
 * Tier 3 — project-read: content/marketing/psychology
 */
export const AGENT_TOOLS: Record<string, ToolName[]> = {
  // Tier 1 — full
  'marcus-ceo':    ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'diana-coo':     ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'dev-lead':      ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'raj-backend':   ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'quinn-qa':      ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  // Tier 2 — code-read
  'mia-frontend':  ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'kai-analyst':   ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'felix-finance': ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  // Tier 3 — project-read
  'lena-brand':         ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'rio-ads':            ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'atlas-art-director': ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'pixel-production':   ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'nate-growth':        ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
  'daniel-kahneman':    ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github'],
}

export function toolsForAgent(agentId: string): AnthropicTool[] {
  const names = AGENT_TOOLS[agentId] ?? ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite', 'Github']
  return names.map(n => TOOL_SCHEMAS[n])
}
