# YVON TOON ENGINE — Architecture Documentation

> **Version:** 1.5.4 (v4 stratified delivery)
> **Last Updated:** 2026-06-09
> **Author:** YVON OS Engineering (OfficialNovizio)

---

## 1. WHAT IS THE TOON ENGINE?

The TOON Engine is the context intelligence layer of YVON OS. It sits between agents and LLMs, compressing every byte of context before it reaches the model. Think of it as a **lossy compression codec for AI context** — like JPEG for images, but for text that LLMs read.

**One sentence:** TOON makes every agent call 94% cheaper without the agent noticing.

---

## 2. ARCHITECTURE OVERVIEW

```
                        THE TOON ENGINE PIPELINE
                        ═══════════════════════

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │   .MD    │     │  TOON    │     │   CIE    │     │   LLM    │
    │  FILES   │────▶│COMPILER  │────▶│ INJECTOR │────▶│  MODEL   │
    │ (source) │     │          │     │          │     │(DeepSeek)│
    └──────────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
                          │               │                  │
                          ▼               │                  │
                    ┌──────────┐          │                  │
                    │  .TOON   │          │                  │
                    │  FILES   │──────────┘                  │
                    │(artifact)│                              │
                    └────┬─────┘                              │
                         │                                    │
                         ▼                                    ▼
                   ┌──────────┐                        ┌──────────┐
                   │ V3 ENGINE│                        │ RESPONSE │
                   │ + V4     │                        │ (TOON    │
                   │ STRATIFY │                        │  format) │
                   └──────────┘                        └────┬─────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │    AGENT    │
                                                    │  (Hermes)   │
                                                    └─────────────┘
```

---

## 3. COMPONENT BREAKDOWN

### 3.1 TOON COMPILER (`src/toon/compiler.ts`)

**What it does:** Converts human-readable `.md` files into LLM-optimized `.toon` files.

**Algorithm:**
```
INPUT:  .toon/memory/agent-department/CEO/marcus/MEMORY.md (2,000 chars)
        │
        ▼
PHASE 1: STRUCTURAL PARSE
        │  ├─ Header detection (#, ##, ### → section boundaries)
        │  ├─ List extraction (-, *, 1. → key-value pairs)
        │  ├─ Table detection (|--|--| → structured data)
        │  ├─ Code block preservation (``` → keep as-is)
        │  └─ Emphasis stripping (**bold**, *italic*)
        │
        ▼
PHASE 2: SCHEMA DETECTION
        │  ├─ Match content against known patterns
        │  │   key_value:  "Priority: Strategic" → "PRIORITY STRATEGIC"
        │  │   table:      tabular data → abbreviated TSV
        │  │   narrative:  paragraphs → compressed tokens
        │  └─ Unknown → generic token compression
        │
        ▼
PHASE 3: ABBREVIATION DICTIONARY
        │  ├─ Load dictionary.toon (project abbreviations)
        │  │   "Strategic direction" → "STRAT_DIR"
        │  │   "implementation" → "IMPL"
        │  └─ Greedy longest-match replacement
        │
        ▼
PHASE 4: V3 INDEXING
        │  ├─ Extract semantic terms
        │  ├─ Build inverted index: term → {file, position, score}
        │  └─ Merge into engine.bin
        │
        ▼
OUTPUT: .toon/memory/CEO/marcus/MEMORY.toon (350 chars, 82% compression)
```

**Stats:** 705 files compiled · average 82% per-file savings · 2.3s full recompile

---

### 3.2 DUAL-DOCS RESOLVER (`src/toon/v3/dual-docs.ts`)

**What it does:** Serves the right version of a document based on who's asking.

```
ASK: "Get marcus's MEMORY.md"

     ┌─────────────────────┐
     │  WHO IS ASKING?     │
     └────────┬────────────┘
              │
     ┌────────▼────────┐
     │   HUMAN MODE    │         │   LLM MODE       │
     │                 │         │                  │
     │ Read .md from:  │         │ Read .toon from: │
     │ .toon/memory/agent-department│         │ .toon/memory/    │
     │ /CEO/marcus/    │         │ .toon/memory/agent-department │
     │ MEMORY.md       │         │ /CEO/marcus/     │
     │                 │         │ MEMORY.toon      │
     │ 2,000 chars     │         │ 350 chars        │
     └─────────────────┘         └──────────────────┘
```

**Path mapping:**
```
.toon/memory/agent-department/CEO/marcus/MEMORY.md  →  .toon/memory/.toon/memory/agent-department/CEO/marcus/MEMORY.toon
docs/CONSTITUTION.md                   →  .toon/docs/CONSTITUTION.toon
CLAUDE.md                              →  .toon/project/CLAUDE.md
.toon/graphs/GRAPH_REPORT.md           →  .toon/graphs/GRAPH_REPORT.md
```

---

### 3.3 CIE — CONTEXT INTELLIGENCE ENGINE (`src/cie/`)

**What it does:** Decides WHAT context to inject, HOW MUCH, and IN WHAT ORDER.

```
INPUT: agent_id + task + venture

     ┌────────────────────────────┐
     │ 1. AGENT DISPATCH          │
     │    Load agent manifest     │
     │    Load agent memory (TOON)│
     │    Load agent skills (TOON)│
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ 2. VENTURE CONTEXT         │
     │    Load venture DESIGN.md  │
     │    Load venture CONTEXT.md │
     │    Load venture METRICS.md │
     │    Load venture BRAND.md   │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ 3. GLOBAL CONTEXT          │
     │    Load CONSTITUTION       │
     │    Load WORKFLOW.md        │
     │    Load ENGINE.md          │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ 4. BUDGET ALLOCATION       │
     │    Cap: 2,500 tokens       │
     │    Agent context: 40%      │
     │    Venture context: 30%    │
     │    Global context: 20%     │
     │    Task-specific: 10%      │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ 5. INJECTION               │
     │    Format: TOON only       │
     │    Method: V4 stratified   │
     │    Order: relevance-ranked │
     └────────────────────────────┘

OUTPUT: compressed_context (≤2,500 tokens)
```

---

### 3.4 V3 ENGINE — PROGRESSIVE LOADING (`src/toon/v3/engine.ts`)

**What it does:** Instead of loading all 705 TOON files into context, it loads only what's relevant to the current query.

```
QUERY: "Update Novizio's pricing strategy"

     ┌────────────────────────────┐
     │ 1. TERM EXTRACTION         │
     │    "novizio" "pricing"     │
     │    "strategy" "update"     │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ 2. INVERTED INDEX LOOKUP   │
     │    engine.bin lookup:      │
     │    "novizio" → 47 files    │
     │    "pricing" → 12 files    │
     │    Intersection → 8 files  │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ 3. RELEVANCE RANKING       │
     │    Score by:               │
     │    - Term frequency        │
     │    - Position weight       │
     │    - File recency          │
     │    Top 8 files ranked      │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ 4. PROGRESSIVE INJECTION   │
     │    File 1: 350 tokens ✓    │
     │    File 2: 280 tokens ✓    │
     │    File 3: 400 tokens ✓    │
     │    ...                     │
     │    Budget exhausted at 5   │
     │    files (2,500 tokens)   │
     └────────────────────────────┘

OUTPUT: 5 TOON files · 2,500 tokens · 94% savings vs loading all 705 files
```

**engine.bin structure:**
```
[HEADER: 64 bytes]
  magic: "TOONV3"
  version: 3
  term_count: 12,847
  doc_count: 705
  checksum: SHA256

[TERM INDEX: variable]
  term_hash | offset | length | doc_count
  "novizio"  | 0x2A40 | 128    | 47
  "pricing"  | 0x2AC0 | 64     | 12
  ...

[DOC INDEX: variable]
  doc_hash | positions[] | relevance_scores[]
  doc_042   | [45, 230, 891] | [0.9, 0.7, 0.5]
  ...
```

---

### 3.5 V4 STRATIFIED DELIVERY (`src/toon/v4/stratify.ts`)

**What it does:** Splits context into semantic layers and injects them by relevance — most relevant first, until budget runs out.

```
INPUT: 705 TOON files + query "Update Novizio's pricing strategy"

     ┌────────────────────────────┐
     │ LAYER 1: CORE (30% budget) │
     │ Constitution + Agent Memory│
     │ + Venture Core             │
     │ 750 tokens                 │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ LAYER 2: DIRECT (25%)      │
     │ Files matching "novizio"   │
     │ + "pricing"                │
     │ 625 tokens                 │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ LAYER 3: RELATED (20%)     │
     │ Files matching "strategy"  │
     │ + "revenue" + "marketing"  │
     │ 500 tokens                 │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ LAYER 4: CONTEXTUAL (15%)  │
     │ Files matching "finance"   │
     │ + "competitors"            │
     │ 375 tokens                 │
     └────────────┬───────────────┘
                  │
     ┌────────────▼───────────────┐
     │ LAYER 5: AMBIENT (10%)     │
     │ Recent sessions + trends   │
     │ 250 tokens                 │
     └────────────────────────────┘

TOTAL: 2,500 tokens injected · 94% savings · 13/15 data types at scale
```

**V4 improvements over V3:**
| Metric | V3 | V4 |
|--------|----|----|
| Context relevance | Query-based only | Semantic layering |
| Token allocation | Flat | Weighted by layer |
| Data type coverage | 10/15 | 13/15 |
| Practical savings | 90-92% | 94-96% |
| Cold start time | 2.3s | 1.8s |

---

### 3.6 HERMES BRIDGE (`src/toon/auto/hermes-bridge.ts`)

**What it does:** Syncs TOON compression with Hermes Agent runtime.

```
HERMES STATE                        TOON BRIDGE
────────────                        ──────────
~/.hermes/state.db                  Session delta compression
~/.hermes/memories/                 Memory TOON-ification
~/.hermes/skills/                   Skill TOON compression
~/.hermes/profiles/yvon/skills/     Agent skill generation
```

**Session Delta:**
```
Session 1: Marcus discusses pricing → 5,000 tokens
Session 2: Marcus discusses pricing AGAIN
           Delta: only new information → 350 tokens (93% savings)
```

---

### 3.7 METRICS COLLECTOR (`src/metrics/`)

**What it does:** Tracks every token, every call, every cost.

```
METRICS PIPELINE:
  Agent call → toongine middleware intercepts
    ├─ Records: agent_id, prompt_tokens, completion_tokens
    ├─ Records: provider, model, latency_ms
    ├─ Records: compression_savings_pct
    ├─ Records: pre_toon_tokens vs post_toon_tokens
    └─ Writes to: Supabase token_usage table (via YVON OS API)
```

---

## 4. DATA FLOW — END TO END

```
USER: "Deploy the new pricing page"
  │
  ▼
HERMES AGENT (Marcus)
  │
  ├─ Loads: CONSTITUTION (hard rules)
  ├─ Loads: ENGINE.md (this doc — for context)
  ├─ Loads: Marcus MEMORY.toon (agent state)
  │
  ▼
CIE INJECTOR
  │
  ├─ Agent context: 1,000 tokens
  ├─ Venture context (Novizio): 750 tokens
  ├─ Global context: 500 tokens
  ├─ Task-specific: 250 tokens
  │
  ▼
TOON COMPRESSOR
  │
  ├─ All context in TOON format
  ├─ V4 stratified: 5 layers
  ├─ Total: 2,500 tokens (vs 25,000 raw → 90% savings)
  │
  ▼
LLM (DeepSeek v4)
  │
  ├─ Receives: 2,500 token system prompt + 2,000 token user message
  ├─ Cost: $0.0004 (vs $0.004 without TOON)
  │
  ▼
RESPONSE
  │
  ├─ Dev agent spawned
  ├─ Mia builds pricing page
  ├─ Quinn tests
  ├─ Dev deploys
  │
  ▼
METRICS
  │
  ├─ Total tokens: 4,500
  ├─ Savings: 90%
  ├─ Cost: $0.0004
  └─ Written to Supabase token_usage
```

---

## 5. FILE STRUCTURE

```
.toon/                          ← BUILD ARTIFACT (gitignored, generated on install)
├── CONSTITUTION.toon           ← Hard rules (loaded every session)
├── ENGINE.toon                 ← This document (TOON-compressed)
├── dictionary.toon             ← Project abbreviation dictionary
├── schemas.toon                ← Auto-detected data schemas
├── v3/
│   └── engine.bin              ← Inverted index for progressive loading
├── docs/                       ← TOON-compressed documentation
│   ├── CONSTITUTION.toon
│   ├── ENGINE.toon
│   ├── WORKFLOW.toon
│   ├── novizio/
│   │   ├── DESIGN.toon
│   │   ├── CONTEXT.toon
│   │   └── ...
│   └── hourbour/
│       └── ...
├── memory/                     ← TOON-compressed agent memories
│   └── .toon/memory/agent-department/
│       ├── CEO/marcus/
│       │   ├── AGENT.toon
│       │   ├── MEMORY.toon
│       │   └── ...
│       ├── Technical/dev/
│       └── ...
├── graphs/                     ← Knowledge graphs
│   ├── GRAPH_REPORT.toon
│   └── CODEGRAPH_REPORT.toon
└── project/                    ← Project-level files
    └── CLAUDE.md
```

---

## 6. PERFORMANCE BENCHMARKS

| Metric | Without TOON | With TOON (V3) | With TOON (V4) |
|--------|-------------|----------------|----------------|
| Agent context injected | 25,000 tokens | 2,500 tokens | 2,500 tokens |
| Per-call cost (DeepSeek) | $0.004 | $0.0004 | $0.0004 |
| Daily cost (1000 calls) | $4.00 | $0.40 | $0.40 |
| Monthly cost (30K calls) | $120.00 | $12.00 | $12.00 |
| Context relevance | 100% (brute force) | 85% | 92% |
| Cold start latency | 0ms | 2,300ms | 1,800ms |
| Files loaded/call | 705 (all) | 8 (indexed) | 5 (stratified) |
| Savings per call | 0% | 90% | 94% |
| Data types covered | 15/15 | 10/15 | 13/15 |

---

## 7. VERSION HISTORY

| Version | Date | Key Change |
|---------|------|-----------|
| v1.0 | 2026-04 | Initial release: basic .md → .toon compilation |
| v2.0 | 2026-05 | Added abbreviation dictionary, schema detection |
| v3.0 | 2026-05 | V3 engine: inverted index, progressive loading |
| v4.0 | 2026-06 | V4 stratified: semantic layering, 94% practical savings |
| v1.5.4 | 2026-06 | Current: npm package `toongine`, Hermes bridge, dashboard |

---

## 8. SECURITY MODEL

```
TRUST BOUNDARIES:
  ┌─────────────────────────────────────────────┐
  │  TRUSTED ZONE                                │
  │  - .md source files (agent-editable)         │
  │  - TOON compiler (read-only on .md)          │
  │  - .toon/ output (write-only, compiler only) │
  │  - engine.bin (generated, signed)            │
  └──────────────────┬──────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────┐
  │  UNTRUSTED ZONE                              │
  │  - LLM response (TOON-encoded, validated)    │
  │  - Plugin code (sandboxed, allowlisted)      │
  │  - User input (escaped, never raw in prompt) │
  │  - External data (Supabase, APIs)            │
  └─────────────────────────────────────────────┘
```

---

## 9. INTEGRATION POINTS

| System | Integration | Method |
|--------|------------|--------|
| **Hermes Agent** | Skill generation, session delta | `hermes-bridge.ts` |
| **Supabase** | Token usage, agent state, metrics | `supabase-writer.ts` |
| **Vercel** | Deploy-time compilation | `postinstall.js` |
| **Next.js** | CIE middleware injection | `app/api/*/route.ts` |
| **npm** | Package distribution | `toongine` package |
| **GitHub** | Source control | `OfficialNovizio/ToonGine` |
