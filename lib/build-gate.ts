/**
 * lib/build-gate.ts — compile/analyze verification gate (Part D).
 *
 * Runs the venture's real analyzer (Flutter/Dart/TS) and parses the results so
 * the War Room can: (1) capture a BASELINE before agents edit, (2) after edits,
 * detect NEW errors (regressions the agents introduced), and (3) refuse to claim
 * "fixed" while errors remain. This is the direct fix for the 7 agent-introduced
 * compile errors that shipped as "ship-ready".
 *
 * Local-mode only (needs the toolchain). Cross-platform: invokes the analyzer via
 * the same shell used for git, with a generous timeout.
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'

const execP = promisify(exec)

export type Stack = 'flutter' | 'dart' | 'node' | 'unknown'
export interface BuildError {
  severity: 'error' | 'warning' | 'info'
  file: string
  line: number
  col: number
  message: string
}
export interface AnalyzeResult {
  stack: Stack
  ran: boolean          // false if no toolchain / unknown stack
  errors: BuildError[]  // severity === 'error' only
  warnings: number
  raw: string
  skippedReason?: string
}

export async function detectStack(repoRoot: string): Promise<Stack> {
  const has = async (f: string) => fs.stat(path.join(repoRoot, f)).then(() => true).catch(() => false)
  if (await has('pubspec.yaml')) return (await has('lib')) ? 'flutter' : 'dart'
  if (await has('package.json')) return 'node'
  return 'unknown'
}

/** Parse one analyzer line into a BuildError. Handles both `•` and `-` separators
 *  and paths containing spaces (e.g. "Working UI/Shift/Shift Screen.dart"). */
export function parseAnalyzerLine(line: string): BuildError | null {
  const sev = line.match(/^\s*(error|warning|info)\b/i)
  if (!sev) return null
  // Strip the leading "severity - " / "severity • " so the path regex (which
  // allows spaces and dashes for filenames) can't absorb the prefix.
  const body = line.replace(/^\s*(error|warning|info)\s*[•-]?\s*/i, '')
  // Locate path:line:col; path may contain spaces/slashes.
  const loc = body.match(/([A-Za-z0-9_./\\][A-Za-z0-9_./\\ -]*\.[A-Za-z0-9]+):(\d+):(\d+)/)
  if (!loc) return null
  // Message = the longest segment that isn't the severity, location, or a lint code.
  const segs = line.split(/\s+[•-]\s+/).map(s => s.trim()).filter(Boolean)
  const message = segs
    .filter(s => !/^(error|warning|info)$/i.test(s) && !s.includes(`${loc[1]}:${loc[2]}:${loc[3]}`) && !/^[a-z_]+$/.test(s))
    .sort((a, b) => b.length - a.length)[0] ?? segs[1] ?? ''
  return {
    severity: sev[1].toLowerCase() as BuildError['severity'],
    file: loc[1].trim(),
    line: Number(loc[2]),
    col: Number(loc[3]),
    message: message.replace(/^[•-]\s*/, '').trim(),
  }
}

/** Stable key for diffing across edits (line numbers shift, so exclude them). */
export function errorKey(e: BuildError): string {
  return `${e.file}|${e.message}`
}

export async function runAnalyze(repoRoot: string): Promise<AnalyzeResult> {
  const stack = await detectStack(repoRoot)
  const cmd =
    stack === 'flutter' ? 'flutter analyze --no-pub' :
    stack === 'dart'    ? 'dart analyze' :
    stack === 'node'    ? 'npx tsc --noEmit' :
    ''
  if (!cmd) return { stack, ran: false, errors: [], warnings: 0, raw: '', skippedReason: 'unknown stack' }

  const shell = process.platform === 'win32' ? undefined : '/bin/bash'
  // The dev server runs a non-login shell, so flutter/dart may not be on PATH.
  // Prepend the usual SDK locations (Mac + Windows) so the gate reliably finds them.
  const home = process.env.HOME ?? process.env.USERPROFILE ?? ''
  const extra = process.platform === 'win32'
    ? [`${home}\\flutter\\bin`, `${home}\\fvm\\default\\bin`, 'C:\\flutter\\bin', 'C:\\src\\flutter\\bin']
    : [`${home}/development/flutter/bin`, `${home}/flutter/bin`, `${home}/fvm/default/bin`, '/opt/homebrew/bin', '/usr/local/bin', `${home}/.pub-cache/bin`]
  const env = { ...process.env, PATH: `${extra.join(path.delimiter)}${path.delimiter}${process.env.PATH ?? ''}` }
  let raw = ''
  try {
    const { stdout, stderr } = await execP(cmd, { cwd: repoRoot, shell, timeout: 180_000, maxBuffer: 20_000_000, env })
    raw = `${stdout}\n${stderr}`
  } catch (e: unknown) {
    // analyzers exit non-zero when issues exist — that's expected; capture output.
    const err = e as { stdout?: string; stderr?: string; message?: string; code?: string }
    raw = `${err.stdout ?? ''}\n${err.stderr ?? ''}`
    if (!raw.trim() && /not found|ENOENT/i.test(err.message ?? '')) {
      return { stack, ran: false, errors: [], warnings: 0, raw: err.message ?? '', skippedReason: 'toolchain not installed' }
    }
  }

  const errors: BuildError[] = []
  let warnings = 0
  for (const line of raw.split('\n')) {
    const parsed = parseAnalyzerLine(line)
    if (!parsed) continue
    if (parsed.severity === 'error') errors.push(parsed)
    else if (parsed.severity === 'warning') warnings++
  }
  return { stack, ran: true, errors, warnings, raw }
}

/** Errors present now that were NOT in the baseline = regressions the agents introduced. */
export function newErrors(baseline: BuildError[], current: BuildError[]): BuildError[] {
  const base = new Set(baseline.map(errorKey))
  return current.filter(e => !base.has(errorKey(e)))
}

/** Compact, agent-readable error list for feeding back into a fix round. */
export function formatErrors(errors: BuildError[]): string {
  if (errors.length === 0) return 'No compile errors.'
  return errors.map((e, i) => `${i + 1}. ${e.file}:${e.line}:${e.col} — ${e.message}`).join('\n')
}
