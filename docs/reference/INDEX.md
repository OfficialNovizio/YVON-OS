# docs/reference/ — Static Reference Documentation

These files don't change often. Load them on demand — only the file relevant to the current task.
Never load all reference files at once.

---

## Files

| File | Purpose | Load when | Related to |
|------|---------|-----------|-----------|
| [`STACK.md`](STACK.md) | Full tech stack — frameworks, services, hosting, APIs in use | Any architecture decision or new dependency question | ARCHITECTURE.md |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Component structure, lib layout, file naming conventions | Navigating unfamiliar parts of the codebase; new screen creation | STACK.md, PAGES.md |
| [`PAGES.md`](PAGES.md) | All routes, pages, and API endpoints with their purpose | Building new pages; debugging routing; API work | ARCHITECTURE.md |
| [`ENV.md`](ENV.md) | All environment variables — what they do, which are server-only | Adding integrations; debugging missing env vars | STACK.md |
| [`SECURITY.md`](SECURITY.md) | Security architecture, CSP headers, rate limiting, auth decisions | Any security-touching change; auth work; API hardening | ENV.md |
| [`GATEKEEPER.md`](GATEKEEPER.md) | Pre-flight validation protocol — intent classification before LLM calls | Routing logic work; adding new agent intents | AGENTS.md |
| [`AGENTS.md`](AGENTS.md) | Full agent registry — all 13 agents, their departments, models assigned | Cross-agent tasks; adding new agents; routing questions | GATEKEEPER.md |
| [`GRAPHIFY.md`](GRAPHIFY.md) | How to use the Graphify knowledge graph (build, query, visualise) | Architecture questions; codebase exploration | ARCHITECTURE.md |
| [`OPEN-DESIGN.md`](OPEN-DESIGN.md) | Open-design UI prototyping protocol | New screen design; UI wireframing | ARCHITECTURE.md |
| [`SELF-IMPROVEMENT.md`](SELF-IMPROVEMENT.md) | SIP (Self-Improvement Protocol) — how agents reflect and save learnings | Adjourning stage; after any task with 3+ tool calls | `docs/memory/feedback.md` |
| [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) | Known issues, error patterns, and their fixes | When a build fails or a known pattern recurs | STACK.md |
| [`SPEC-war-room.md`](SPEC-war-room.md) | War Room feature spec — how the multi-agent chat works | Modifying War Room UI or API logic | AGENTS.md |
| [`SPEC-agent-history.md`](SPEC-agent-history.md) | Agent history tracking spec | Agent history UI or API work | AGENTS.md |

---

## Load order by task type

| Task type | Load these files |
|-----------|-----------------|
| New screen / UI work | ARCHITECTURE.md + PAGES.md + OPEN-DESIGN.md |
| API / backend work | STACK.md + ENV.md + ARCHITECTURE.md |
| Security work | SECURITY.md + ENV.md |
| Agent routing work | AGENTS.md + GATEKEEPER.md |
| Architecture question | GRAPHIFY.md → run `npm run graphify:query` |
| Build failure | TROUBLESHOOTING.md |
| Session reflection | SELF-IMPROVEMENT.md |
