# Hermes Aux-Tools Sidecar (Part B)

Connects YVON agents to Hermes's **auxiliary tools** via MCP. Honest scope first:

## What this gives you (and what it does NOT)
**Exposed by Hermes's tools MCP** (`agent/transports/hermes_tools_mcp_server.py`):
`web_search` (Firecrawl), browser automation (Camofox/Browserbase), `vision_analyze`, `image_generate`, `skill_view`/`skills_list`, `text_to_speech`, `kanban_*`.

**NOT exposed (Hermes's own code says so):** `delegate_task`, `memory`, `session_search`, `todo` — the **learning loop / persistent memory require Hermes's internal agent loop and cannot be driven over MCP**. → that value is delivered **natively** in `lib/learning-loop.ts` (already built), not here.

So this sidecar is for the extra tools (browser/vision/image/web), not for "agents that learn." Most of these tools need **paid API keys** (Firecrawl, Browserbase, vision/image providers).

## Transport reality
The Hermes tools MCP is **stdio** (spawned as a subprocess by the MCP client), not an HTTP service. So the MCP client and Hermes run **together** — the client launches `python -m agent.transports.hermes_tools_mcp_server` as a child process.

## Steps (on a machine with Docker + Python)
1. **Fetch Hermes:** `node scripts/hermes-setup.mjs` → clones into `hermes/vendor/`.
2. **Build the image** (uses Hermes's own Dockerfile): `docker build -t yvon-hermes hermes/vendor`.
3. **Provide tool keys** as settings in Supabase Vault (NOT .env): `FIRECRAWL_API_KEY`, `BROWSERBASE_API_KEY`, vision/image provider keys — only for the tools you want.
4. **Connect:** add an MCP client in the orchestrator that spawns the Hermes tools MCP over stdio, lists its tools, and registers them into the agent tool set (`TOOL_SCHEMAS` + `executeTool` dispatch). This is the wiring step — done once Hermes runs locally so each tool can be verified live.

## Why the wiring isn't pre-built
Registering Hermes's MCP tools means proxying live calls to a running Hermes process. Building that against a process that isn't running yet would be unverifiable guesswork. The correct order: get Hermes running (steps 1–3), confirm which tools you actually want + have keys for, then wire exactly those and verify each.

## Recommendation
The native learning loop (already shipped) is the high-value piece. Add this sidecar only if you specifically want browser/vision/image-gen inside War Room agents. When you're ready, run steps 1–3 and I'll wire the chosen tools + verify them live.
