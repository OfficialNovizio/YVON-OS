// lib/hermes-vps.ts
const VPS_URL = process.env.HERMES_VPS_URL || ""
const VPS_CODE = process.env.HERMES_VPS_CODE || ""

interface HR { ok: boolean; data?: unknown; error?: string }

async function callH(p: string, b?: unknown): Promise<HR> {
  if (!VPS_URL || !VPS_CODE) return { ok: false, error: "VPS not configured" }
  try {
    const r = await fetch(VPS_URL + p, {
      method: b ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + VPS_CODE },
      body: b ? JSON.stringify(b) : undefined,
      signal: AbortSignal.timeout(15000),
    })
    const d = await r.json()
    return { ok: r.ok, data: d, error: r.ok ? undefined : d.error as string }
  } catch (e) { return { ok: false, error: String(e) } }
}

export const hermesVPS = {
  agents: () => callH("/api/agents"),
  agent: (id: string) => callH("/api/agents/" + id),
  council: (t: string, c: string) => callH("/api/council/convene", { decisionType: t, context: c }),
  graphExplore: (q: string) => callH("/api/graph/explore", { query: q }),
  graphStatus: () => callH("/api/graph/status"),
  health: () => callH("/api/health"),
}
