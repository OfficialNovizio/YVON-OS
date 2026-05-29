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

const execP = promisify(exec)

// ─── Repo sandbox ─────────────────────────────────────────────────────────────

const REPO_ROOT = process.cwd()

/** Resolve a tool-supplied path to an absolute path within REPO_ROOT. Throws if it escapes. */
function safeResolve(p: string): string {
  const target = isAbsolute(p) ? resolve(p) : resolve(REPO_ROOT, p)
  const rel = relative(REPO_ROOT, target)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Path escapes repo root: ${p}`)
  }
  return target
}

// ─── Tool schemas (sent to the model) ─────────────────────────────────────────

export type ToolName = 'Read' | 'Glob' | 'Grep' | 'Bash' | 'WebFetch' | 'TodoWrite' | 'Github'

export const ALL_TOOLS: ToolName[] = ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'TodoWrite', 'Github']

/** Per-call context for tools that need session-scope info (e.g. which venture's repo). */
export interface ToolContext {
  ventureSlug?:   string
  /** 'github' (default) | 'local' — controls whether FS tools are allowed for product ventures */
  repoMode?:      'github' | 'local'
  /** Absolute path to the venture's locally cloned repo (only relevant when repoMode=local) */
  localRepoPath?: string
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
    description: 'Run a read-only shell command. ONLY these commands are allowed: ls, pwd, cat, head, tail, wc, find, tree, file, stat, git status, git log, git diff, git show, git branch, git remote, npm ls, npm view, npm outdated, node --version. Anything else is rejected. Use for git history and directory inspection.',
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
          enum: ['repo', 'tree', 'file', 'issues', 'prs', 'branches', 'commits', 'search', 'write_file', 'delete_file'],
          description: 'repo=metadata · tree=full file list · file=read one file · issues · prs · branches · commits · search · write_file=create or update a file (needs path, content, message) · delete_file=delete a file (needs path, message)',
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
  'ls', 'pwd', 'cat', 'head', 'tail', 'wc', 'find', 'tree', 'file', 'stat',
  'git status', 'git log', 'git diff', 'git show', 'git branch', 'git remote',
  'npm ls', 'npm view', 'npm outdated',
  'node --version', 'node -v',
]

function isBashAllowed(cmd: string): boolean {
  const trimmed = cmd.trim()
  // Block shell metacharacters and path traversal
  if (/[;&|`$(){}<>]|\.\.\//.test(trimmed)) return false
  // Block absolute paths — confines all reads to REPO_ROOT (which is cwd)
  if (/(?:^|\s)\//.test(trimmed)) return false
  return BASH_ALLOWED_PREFIXES.some(prefix => trimmed === prefix || trimmed.startsWith(prefix + ' '))
}

// ─── Tool executors ───────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 2_000_000
const MAX_GREP_ROWS = 200
const MAX_BASH_OUTPUT = 50_000

async function execRead(input: { file_path: string; offset?: number; limit?: number }): Promise<ToolResult> {
  try {
    const abs = safeResolve(input.file_path)
    const stat = await fs.stat(abs)
    if (stat.size > MAX_FILE_BYTES) {
      return err(`File too large (${stat.size} bytes, cap ${MAX_FILE_BYTES}). Use Grep or read with offset/limit.`)
    }
    const raw = await fs.readFile(abs, 'utf8')
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

async function execGlob(input: { pattern: string; path?: string }): Promise<ToolResult> {
  try {
    const root = input.path ? safeResolve(input.path) : REPO_ROOT
    // Node 22+ built-in glob — handles ** correctly, no shell dependency
    const paths: string[] = []
    const exclude = (p: string) => /\/(node_modules|\.next|\.git|dist|build|graphify-out|tsconfig\.tsbuildinfo)(\/|$)/.test(p)
    const fsAny = fs as unknown as { glob: (pattern: string, opts: { cwd: string; exclude: (p: string) => boolean }) => AsyncIterable<string> }
    for await (const p of fsAny.glob(input.pattern, { cwd: root, exclude })) {
      paths.push(p)
      if (paths.length >= 200) break
    }
    paths.sort()
    if (paths.length === 0) return ok('(no matches)', `glob ${input.pattern}: 0 matches`)
    return ok(paths.join('\n'), `glob ${input.pattern}: ${paths.length} match${paths.length === 1 ? '' : 'es'}`)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}

async function execGrep(input: {
  pattern: string
  path?: string
  glob?: string
  output_mode?: 'content' | 'files_with_matches' | 'count'
  '-i'?: boolean
  '-n'?: boolean
  head_limit?: number
}): Promise<ToolResult> {
  try {
    const target = input.path ? safeResolve(input.path) : REPO_ROOT
    const mode = input.output_mode ?? 'files_with_matches'
    // POSIX grep -r (universally available; ripgrep not guaranteed on the host)
    const flags: string[] = ['-r', '-E', '--exclude-dir=node_modules', '--exclude-dir=.next', '--exclude-dir=.git', '--exclude-dir=dist', '--exclude-dir=build', '--exclude-dir=graphify-out']
    if (input['-i']) flags.push('-i')
    if (mode === 'files_with_matches') flags.push('-l')
    else if (mode === 'count') flags.push('-c')
    else if (input['-n']) flags.push('-n')
    if (input.glob) flags.push(`--include=${input.glob}`)
    const limit = Math.min(MAX_GREP_ROWS, input.head_limit ?? 100)
    const cmd = `grep ${flags.map(f => f.includes(' ') ? JSON.stringify(f) : f).join(' ')} -- ${JSON.stringify(input.pattern)} ${JSON.stringify(target)} 2>/dev/null | head -${limit}`
    const { stdout } = await execP(cmd, { shell: '/bin/bash', maxBuffer: 5_000_000, timeout: 30_000 })
    const out = stdout.trim()
    if (!out) return ok('(no matches)', `grep "${input.pattern}": 0 matches`)
    const rows = out.split('\n').length
    return ok(out, `grep "${input.pattern}": ${rows} row${rows === 1 ? '' : 's'}`)
  } catch (e) {
    // grep exits 1 when no matches — treat as empty
    const msg = e instanceof Error ? e.message : String(e)
    if (/Command failed.*exit code 1/i.test(msg)) return ok('(no matches)', `grep "${input.pattern}": 0 matches`)
    return err(msg)
  }
}

async function execBash(input: { command: string; description: string; timeout?: number }): Promise<ToolResult> {
  if (!isBashAllowed(input.command)) {
    return err(`Command not allowed. Read-only allowlist only (ls, cat, find, git log/diff/status/show/branch, npm ls/view/outdated, head, tail, wc, tree, etc.). Rejected: "${input.command}"`)
  }
  try {
    const timeout = Math.min(30_000, input.timeout ?? 10_000)
    const { stdout, stderr } = await execP(input.command, {
      cwd: REPO_ROOT,
      shell: '/bin/bash',
      maxBuffer: MAX_BASH_OUTPUT,
      timeout,
    })
    const combined = (stdout + (stderr ? `\n[stderr]\n${stderr}` : '')).trim()
    const truncated = combined.length > MAX_BASH_OUTPUT
      ? combined.slice(0, MAX_BASH_OUTPUT) + '\n[output truncated]'
      : combined
    return ok(truncated || '(no output)', `bash: ${input.description}`)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
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
        // Local mode: write directly to the cloned repo on this machine
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
            return ok(
              `File ${existed ? 'updated' : 'created'} locally: ${targetPath}`,
              `local write ${input.path}: ${existed ? 'updated' : 'created'} ✓`
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
        if (!input.path)    return err('action=delete_file requires a path argument')
        if (!input.message) return err('action=delete_file requires a message (commit message) argument')
        // Local mode: delete from the cloned repo on this machine
        if (ctx.repoMode === 'local' && ctx.localRepoPath) {
          try {
            const localRoot = ctx.localRepoPath
            const targetPath = resolve(localRoot, input.path)
            const rel = relative(localRoot, targetPath)
            if (rel.startsWith('..') || isAbsolute(rel)) {
              return err(`Path escapes local repo root: ${input.path}`)
            }
            await fs.unlink(targetPath)
            return ok(
              `Deleted locally: ${targetPath}`,
              `local delete ${input.path}: deleted ✓`
            )
          } catch (e) {
            return err(`Local delete failed: ${e instanceof Error ? e.message : String(e)}`)
          }
        }
        const result = await deleteRepoFile(owner, repo, input.path, input.message, input.branch)
        return ok(
          `Deleted: ${input.path}\nCommit SHA: ${result.commitSha}`,
          `github delete_file ${slug}/${input.path}: deleted ✓`
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

const LOCAL_FS_TOOLS = new Set(['Read', 'Glob', 'Grep', 'Bash'])

export async function executeTool(name: string, input: unknown, ctx: ToolContext = {}): Promise<ToolResult> {
  const inp = (input ?? {}) as Record<string, unknown>

  // Hard block: local filesystem tools are forbidden for product ventures in GitHub mode.
  // In local mode the user has explicitly cloned the repo locally — FS tools are allowed.
  const isYvonDashboard = !ctx.ventureSlug || ctx.ventureSlug === 'yvon-dashboard'
  const isLocalMode     = ctx.repoMode === 'local'
  if (!isYvonDashboard && !isLocalMode && LOCAL_FS_TOOLS.has(name)) {
    const slug = ctx.ventureSlug
    return err(
      `⛔ Local filesystem access is blocked for venture "${slug}" (GitHub mode). ` +
      `Use Github(action=file, path=...) to read files, Github(action=tree) for the file list, ` +
      `Github(action=commits/issues/prs) for repo data. ` +
      `Switch to Local mode in the War Room to use filesystem tools.`
    )
  }

  try {
    switch (name) {
      case 'Read':      return await execRead(inp as Parameters<typeof execRead>[0])
      case 'Glob':      return await execGlob(inp as Parameters<typeof execGlob>[0])
      case 'Grep':      return await execGrep(inp as Parameters<typeof execGrep>[0])
      case 'Bash':      return await execBash(inp as Parameters<typeof execBash>[0])
      case 'WebFetch':  return await execWebFetch(inp as Parameters<typeof execWebFetch>[0])
      case 'TodoWrite': return execTodoWrite(inp as Parameters<typeof execTodoWrite>[0])
      case 'Github':    return await execGithub(inp as Parameters<typeof execGithub>[0], ctx)
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
  'marcus-ceo':    ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'TodoWrite', 'Github'],
  'diana-coo':     ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'TodoWrite', 'Github'],
  'dev-lead':      ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'TodoWrite', 'Github'],
  'raj-backend':   ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'TodoWrite', 'Github'],
  'quinn-qa':      ['Read', 'Glob', 'Grep', 'Bash', 'WebFetch', 'TodoWrite', 'Github'],
  // Tier 2 — code-read
  'mia-frontend':  ['Read', 'Glob', 'Grep', 'WebFetch', 'TodoWrite', 'Github'],
  'kai-analyst':   ['Read', 'Glob', 'Grep', 'WebFetch', 'TodoWrite', 'Github'],
  'felix-finance': ['Read', 'Glob', 'Grep', 'WebFetch', 'TodoWrite', 'Github'],
  // Tier 3 — project-read
  'lena-brand':         ['Read', 'Glob', 'WebFetch', 'TodoWrite', 'Github'],
  'rio-ads':            ['Read', 'Glob', 'WebFetch', 'TodoWrite', 'Github'],
  'atlas-art-director': ['Read', 'Glob', 'WebFetch', 'TodoWrite', 'Github'],
  'pixel-production':   ['Read', 'Glob', 'WebFetch', 'TodoWrite', 'Github'],
  'nate-growth':        ['Read', 'Glob', 'WebFetch', 'TodoWrite', 'Github'],
  'daniel-kahneman':    ['Read', 'Glob', 'WebFetch', 'TodoWrite', 'Github'],
}

export function toolsForAgent(agentId: string): AnthropicTool[] {
  const names = AGENT_TOOLS[agentId] ?? ['Read', 'Glob', 'Grep', 'WebFetch', 'TodoWrite', 'Github']
  return names.map(n => TOOL_SCHEMAS[n])
}
