# YVON Orchestrator (Agent Engine)

Persistent service that runs War Room sessions outside Vercel's serverless limits — many sessions in parallel, isolated, for as long as they need. Runs the same on **Mac, Windows, and the container host**.

## Run locally (Mac or Windows)
**Option A — Node (fastest for dev):**
```bash
npm run engine:dev        # tsx orchestrator/server.ts → http://localhost:8787
```
**Option B — Docker (matches production exactly):**
```bash
npm run engine:up         # docker compose up --build
npm run engine:down       # stop
```
Both work identically on macOS and Windows (Docker Desktop). No bash-only scripts.

## Verify
```bash
curl http://localhost:8787/health
# {"ok":true,"service":"yvon-orchestrator",...}
curl -N "http://localhost:8787/run?tag=test"
# streams: session_started → cache_check → done → [DONE]
```

## Production (container host)
Deploy the same `docker-compose.yml` to Railway / Fly.io / Render / a VM. Point the Next.js UI's `ORCHESTRATOR_URL` at the deployed URL. One image, dev/prod parity.

## Config
- `ORCHESTRATOR_PORT` (default 8787) — runtime/bootstrap, set via env/compose.
- Bootstrap connection secrets (SUPABASE_URL / SERVICE_ROLE / DATABASE_URL) come from host env (connection bootstrap, not feature settings).
- Changeable feature settings (e.g. `WAR_ROOM_ENGINE_V2`) live in Supabase Vault, toggled in Settings — never in `.env`.

## Status
A2 establishes the runtime (HTTP + SSE + per-session isolation, reusing `lib/session.ts`). The full plan→execute→verify→learn pipeline migrates into `runSession` in later foundation steps; the Next.js path keeps working unchanged until then.
