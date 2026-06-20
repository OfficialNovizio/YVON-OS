'use client'

import { useEffect, useState } from 'react'

/* ── Design tokens (dark glass) ───────────────────────────────────────── */
const colors = {
  bg: '#0a0e17',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  text: '#e4e8f0',
  muted: '#5a6478',
  accent: '#00d4ff',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
}

const glassCard: React.CSSProperties = {
  background: colors.glass, border: `1px solid ${colors.glassBorder}`,
  borderRadius: 14, backdropFilter: 'blur(16px)', padding: 20,
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: colors.bg, color: colors.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.muted },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 },
  kpi: { textAlign: 'center' as const, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10 },
  kpiVal: { fontSize: 22, fontWeight: 700 },
  kpiLbl: { fontSize: 10, color: colors.muted, textTransform: 'uppercase' as const, letterSpacing: '.05em', marginTop: 4 },
  section: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 },
  panel: { ...glassCard },
  panelTitle: { fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
  memRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 },
  barWrap: { flex: 1, height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  gridItem: { textAlign: 'center' as const, padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8 },
  plugRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 },
  initOverlay: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    minHeight: 400, textAlign: 'center' as const },
  initBtn: { marginTop: 20, padding: '16px 48px', fontSize: 16, fontWeight: 700,
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', border: 'none',
    borderRadius: 14, cursor: 'pointer', letterSpacing: '-0.01em' },
  initBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  progressBar: { width: 300, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #6366f1)', borderRadius: 3, transition: 'width 0.3s' },
}

export default function ToonGinePage() {
  const [data, setData] = useState<any>(null)
  const [initializing, setInitializing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')

  // Poll for data
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/toongine/health')
        if (res.ok) {
          const d = await res.json()
          if (d.initialized) setData(d)
        }
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleInit() {
    setInitializing(true)
    setError('')
    setProgress(10)
    setStatusText('Scanning project files...')

    try {
      const res = await fetch('/api/toongine/init', { method: 'POST' })
      if (!res.ok) throw new Error('Init failed')

      // Stream progress updates
      const reader = res.body?.getReader()
      if (reader) {
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            try {
              const msg = JSON.parse(line)
              if (msg.progress) setProgress(msg.progress)
              if (msg.status) setStatusText(msg.status)
              if (msg.done) {
                setProgress(100)
                setStatusText('Initialization complete!')
                setTimeout(() => window.location.reload(), 1500)
              }
              if (msg.error) throw new Error(msg.error)
            } catch (e: any) {
              if (e.message !== 'Init failed') throw e
            }
          }
        }
      }

      // Fallback: just reload
      setProgress(100)
      setStatusText('Done! Refreshing...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (e: any) {
      setError(e.message || 'Initialization failed')
      setInitializing(false)
    }
  }

  // ── Empty State (not initialized) ──
  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.initOverlay}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>ToonGine Agent Dashboard</h1>
          <p style={{ color: colors.muted, fontSize: 14, maxWidth: 480, lineHeight: 1.6 }}>
            Initialize ToonGine to unlock AI agent intelligence — knowledge graph,
            TOON compression, token burn tracking, agent memory health, and more.
          </p>
          {error && (
            <div style={{ marginTop: 12, padding: '8px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: colors.red, fontSize: 13 }}>
              {error}
            </div>
          )}
          <button
            onClick={handleInit}
            disabled={initializing}
            style={{ ...styles.initBtn, ...(initializing ? styles.initBtnDisabled : {}) }}
          >
            {initializing ? 'Initializing...' : '🚀 Initialize ToonGine'}
          </button>
          {initializing && (
            <div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: progress + '%' }} />
              </div>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>{statusText}</div>
            </div>
          )}
          <div style={{ marginTop: 32, fontSize: 11, color: colors.muted }}>
            Installed via ToonGine npm package · Runs locally · Zero config
          </div>
        </div>
      </div>
    )
  }

  // ── Dashboard (initialized) ──
  const { summary, memories, graph, plugins, efficiency, errors: errs } = data
  const fmt = (n: number) => n?.toLocaleString?.() ?? '0'
  const kb = (b: number) => (b / 1024).toFixed(1)

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={styles.header}>
          <h1 style={styles.title}>⚡ ToonGine Agent Dashboard</h1>
          <div style={styles.subtitle}>{summary?.repo || 'Local Project'} · auto-refresh 5s</div>
        </div>

        {/* KPI Row */}
        <div style={styles.kpiRow}>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.purple}}>{summary?.agentMemories ?? 0}</div><div style={styles.kpiLbl}>Agent Memories</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.green}}>{summary?.completionRate ?? 0}%</div><div style={styles.kpiLbl}>Completion</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.accent}}>{fmt(summary?.graphNodes)}</div><div style={styles.kpiLbl}>Graph Nodes</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.yellow}}>{summary?.skillsTotal ?? 0}</div><div style={styles.kpiLbl}>Skills</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.purple}}>{plugins?.length ?? 0}</div><div style={styles.kpiLbl}>Plugins</div></div>
          <div style={styles.kpi}><div style={{...styles.kpiVal, color: colors.accent}}>{fmt(summary?.sessions)}</div><div style={styles.kpiLbl}>Sessions</div></div>
        </div>

        {/* Memory + Graph */}
        <div style={styles.section}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>🧠 Agent Memory Health</div>
            {(memories || []).slice(0, 8).map((m: any, i: number) => {
              const pct = m.health || 0
              const bc = pct >= 90 ? colors.green : pct >= 70 ? colors.yellow : colors.red
              return (
                <div key={i} style={styles.memRow}>
                  <span style={{ width: 90, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.agent}</span>
                  <span style={{ fontSize: 10, color: colors.muted, width: 45 }}>{m.dept}</span>
                  <div style={styles.barWrap}><div style={{ width: pct + '%', height: '100%', background: bc, borderRadius: 3 }} /></div>
                  <span style={{ width: 35, textAlign: 'right', fontFamily: 'monospace', fontSize: 10, color: colors.muted }}>{kb(m.size)}K</span>
                  <span style={{ width: 30, textAlign: 'right', fontWeight: 600, fontSize: 11, color: bc }}>{pct}%</span>
                </div>
              )
            })}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelTitle}>🔗 Knowledge Graph</div>
            <div style={styles.grid}>
              <div style={styles.gridItem}><div style={{ fontSize: 20, fontWeight: 700, color: colors.purple }}>{fmt(graph?.nodes)}</div><div style={{ fontSize: 9, color: colors.muted }}>NODES</div></div>
              <div style={styles.gridItem}><div style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>{fmt(graph?.edges)}</div><div style={{ fontSize: 9, color: colors.muted }}>EDGES</div></div>
              <div style={styles.gridItem}><div style={{ fontSize: 20, fontWeight: 700, color: colors.green }}>{graph?.density ?? '—'}</div><div style={{ fontSize: 9, color: colors.muted }}>DENSITY</div></div>
              {(graph?.kinds || []).slice(0, 6).map((k: any, i: number) => (
                <div key={i} style={styles.gridItem}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(k.count)}</div>
                  <div style={{ fontSize: 9, color: colors.muted }}>{k.kind}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plugins + Efficiency */}
        <div style={styles.section}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>🔌 Plugins</div>
            {(plugins || []).map((p: any, i: number) => {
              const dc = p.status === 'ok' ? colors.green : p.status === 'warn' ? colors.yellow : colors.red
              return (
                <div key={i} style={styles.plugRow}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: dc }} />
                  <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: colors.muted, fontFamily: 'monospace' }}>{p.detail}</span>
                </div>
              )
            })}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelTitle}>⚡ Efficiency</div>
            {(efficiency || []).slice(0, 6).map((a: any, i: number) => {
              const rate = a.successRate || 0
              const bc = rate >= 80 ? colors.green : rate >= 50 ? colors.yellow : colors.red
              return (
                <div key={i} style={styles.memRow}>
                  <span style={{ width: 80, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.agent}</span>
                  <span style={{ fontSize: 10, color: colors.muted }}>{a.tasks}t</span>
                  <div style={styles.barWrap}><div style={{ width: rate + '%', height: '100%', background: bc, borderRadius: 3 }} /></div>
                  <span style={{ width: 35, textAlign: 'right', fontWeight: 600, fontSize: 11, color: bc }}>{rate}%</span>
                  <span style={{ width: 45, textAlign: 'right', fontFamily: 'monospace', fontSize: 10, color: colors.muted }}>${a.cost}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Errors */}
        <div style={styles.section}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>⚠️ Error Report</div>
            {(errs || []).length > 0 ? (errs || []).map((e: any, i: number) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.severity === 'critical' ? colors.red : colors.yellow }} />
                  <span style={{ fontWeight: 600 }}>{e.title}</span>
                </div>
                <div style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>{e.detail}</div>
              </div>
            )) : <div style={{ color: colors.green, fontSize: 12 }}>✅ No errors detected</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
