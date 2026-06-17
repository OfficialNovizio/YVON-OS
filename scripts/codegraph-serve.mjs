#!/usr/bin/env node
/**
 * codegraph-serve.mjs
 * Serves the code-review-graph interactive visualization.
 *
 * If the HTML file exists, serves it via a minimal HTTP server.
 * Otherwise, generates it first via `code-review-graph visualize`.
 *
 * Usage: npm run codegraph:serve  →  http://localhost:8765
 *
 * Also accessible from Next.js API route: /api/graph-html
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const HTML_PATH = path.join(ROOT, '.code-review-graph', 'graph.html');
const PORT = parseInt(process.env.PORT || '8765', 10);

// ── Ensure HTML exists ────────────────────────────────────────────────────
if (!fs.existsSync(HTML_PATH)) {
  console.log('Generating graph visualization...');
  try {
    execSync('code-review-graph visualize --format html', {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    console.error('Failed to generate graph visualization.');
    console.error('Run `code-review-graph build` first.');
    process.exit(1);
  }
}

const html = fs.readFileSync(HTML_PATH, 'utf-8');

// ── Serve ─────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', bytes: html.length }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  const mb = (html.length / (1024 * 1024)).toFixed(1);
  console.log('');
  console.log('  Code Graph Server');
  console.log('  ─────────────────');
  console.log('  URL:    http://localhost:' + PORT);
  console.log('  Size:   ' + mb + ' MB');
  console.log('  Health: http://localhost:' + PORT + '/health');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
