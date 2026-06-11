import os from 'os'

type Machine = { name: string; role: string; status: 'active' | 'idle' | 'routing'; tone: 'blue' | 'green' | 'muted' }

const MACHINES: Machine[] = [
  { name: 'Mac Mini 2 — Hermes', role: 'Personal layer · routing gateway', status: 'routing', tone: 'blue' },
  { name: 'Mac Mini 1 — OpenClaw', role: 'Workspace tier · production work', status: 'active', tone: 'green' },
  { name: 'Mac Mini 3 — Workshop', role: 'Skill training · makes the team better', status: 'idle', tone: 'muted' },
  { name: 'Mac Studio M5 — reserved', role: 'Future capacity', status: 'idle', tone: 'muted' },
]

export async function GET(): Promise<Response> {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = Math.round((totalMem - freeMem) / (1024 ** 3))
  const cpus = os.cpus().length
  const uptime = Math.round(os.uptime() / 3600)

  return Response.json({
    machines: MACHINES,
    stats: {
      machines: MACHINES.length,
      agents: 23,
      ramUsed: `${usedMem} GB`,
      ramTotal: `${Math.round(totalMem / (1024 ** 3))} GB`,
      gateway: 'Hermes',
      cpus,
      uptime,
      hostname: os.hostname(),
    },
    source: 'live',
  })
}
