/**
 * self-reflect.mjs — Post-task reflection for YVON agents
 * Call at session end to auto-extract lessons from recent changes.
 * Run via: npm run reflect
 *
 * Analyzes git diff, identifies patterns, and generates structured
 * memory entries for the self-improvement system.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MEMORY_DIR = '/Users/novysingh/.claude/projects/-Users-novysingh-StudioProjects-YVON2-0/memory';
const INDEX_PATH = join(MEMORY_DIR, 'MEMORY.md');

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf-8', cwd: ROOT }).trim(); }
  catch (e) { return ''; }
}

function getRecentChanges(n = 5) {
  const log = run(`git log -${n} --format="%h %s" --no-merges`);
  if (!log) return [];
  return log.split('\n').map(line => {
    const [hash, ...rest] = line.split(' ');
    return { hash, message: rest.join(' ') };
  });
}

function getChangedFiles(n = 5) {
  const firstHash = run(`git log -${n} --format="%h" --no-merges`).split('\n').pop();
  if (!firstHash) return [];
  const files = run(`git diff --name-only HEAD~${Math.min(n, 5)}..HEAD 2>/dev/null`);
  return files ? files.split('\n').filter(Boolean) : [];
}

function classifyChange(file) {
  if (file.includes('/_')) return 'component';
  if (file.includes('layout')) return 'layout';
  if (file.includes('page.')) return 'page';
  if (file.includes('api/')) return 'api';
  if (file.includes('.css')) return 'style';
  if (file.includes('script')) return 'script';
  if (file.includes('memory/') || file.includes('CLAUDE')) return 'config';
  if (file.includes('reference/')) return 'docs';
  return 'other';
}

function generateReflection() {
  const changes = getRecentChanges(5);
  const files = getChangedFiles(5);

  if (!changes.length && !files.length) {
    console.log('\n  No recent changes to reflect on.\n');
    return;
  }

  const categories = {};
  for (const f of files) {
    const cat = classifyChange(f);
    categories[cat] = categories[cat] || [];
    categories[cat].push(f);
  }

  const reflection = [
    `# Reflection — ${new Date().toISOString().split('T')[0]}`,
    '',
    '## Changes',
    ...changes.map(c => `- \`${c.hash}\` ${c.message}`),
    '',
    '## Categories',
    ...Object.entries(categories).map(([cat, cats]) => `- **${cat}**: ${cats.length} file(s)`),
    '',
    '## Files',
    ...files.map(f => `- \`${f}\``),
    '',
  ].join('\n');

  console.log('\n' + reflection);

  // Suggest memory classification
  const primaryCat = Object.entries(categories).sort((a, b) => b[1].length - a[1].length)[0];
  if (primaryCat) {
    console.log(`\n  💡 Primary category: ${primaryCat[0]}`);
    console.log('  If this taught you something new, save to memory/:');
    console.log('    user_*.md for user preferences');
    console.log('    feedback_*.md for corrections/validated approaches');
    console.log('    project_*.md for decisions/deadlines');
    console.log();
  }
}

generateReflection();
