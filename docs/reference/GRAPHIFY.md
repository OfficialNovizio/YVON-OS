# Graphify — Knowledge Graph

Graphify builds a knowledge graph from your codebase using:
- **AST parsing** (tree-sitter, 25 languages) — deterministic, no LLM needed
- **LLM extraction** — for docs, images, relationships
- **Leiden community detection** — clusters related code into groups
- **Interactive HTML export** — `graph.html` rendered with vis.js

## Quick Start

```bash
# Build the knowledge graph (AST-only, no API cost)
npm run graphify:build

# Build the import dependency graph (no external package needed)
npm run codegraph:build

# Watch for changes and rebuild (graphify)
npm run graphify:watch

# Query the graph
npm run graphify:query -- "What is the agent routing system"
```

> **Scope:** Graphify scans only `app/`, `lib/`, `src/` — see `.graphifyignore` for exclusions.
> Agent docs, skills, and config files are excluded to prevent community noise.

## Graphify Output

```
graphify-out/
├── graph.json            # Full graph data (nodes, edges, communities)
├── graph.html            # Interactive visualization (open in browser)
├── GRAPH_REPORT.md       # Compact summary — 26 named communities + god nodes
├── CODEGRAPH_REPORT.md   # Import dependency map — hubs, API routes, orphans
├── cache/                # SHA256 cache for incremental rebuilds
└── memory/               # Q&A results for feedback loop
```

**What Claude reads:**
- Architecture questions → `GRAPH_REPORT.md` (communities + god nodes)
- "What imports X" / "impact of changing Y" → `CODEGRAPH_REPORT.md` (hub files + API routes)

## Claude Code Integration

Claude Code hooks are installed. Before answering architecture or codebase questions:

1. Claude Code checks for `graphify-out/graph.json`
2. If present, reads `graphify-out/GRAPH_REPORT.md` for context
3. After code changes, rebuilds the graph automatically

To check status:
```bash
python -m graphify hook status
```

## Interactive Visualization

Open `graphify-out/graph.html` in a browser for:
- Clickable nodes (files, functions, classes)
- Searchable by node label
- Filterable by community
- Pan and zoom navigation

## Git Hooks

Post-commit and post-checkout hooks are installed:
- After commit: rebuild graph if code files changed
- After checkout: rebuild graph

To install manually:
```bash
python -m graphify hook install
```

To remove:
```bash
python -m graphify hook uninstall
```

## Query Examples

```bash
# Architecture overview
python -m graphify query "What is the architecture of this project"

# Find dependencies
python -m graphify path "app/api/route-intent/route.ts" "lib/gatekeeper.ts"

# Explain a node
python -m graphify explain "getAgent"

# Custom token budget
python -m graphify query "your question" --budget 500
```

## Memory Feedback Loop

Save Q&A results for future reference:
```bash
python -m graphify save-result --question "..." --answer "..." --nodes "Node1" "Node2"
```

Results are saved to `graphify-out/memory/` and improve future queries.

## Benchmark

Measure token savings vs naive full-corpus approach:
```bash
python -m graphify benchmark graphify-out/graph.json
```

## Graph Statistics

```
Nodes: ~500 (files, functions, classes)
Edges: ~900 (imports, calls, references)
Communities: ~57 (clustered by code relationships)
Files parsed: ~138
Languages: javascript, typescript, python, bash, tsx
```