'use client'

import { useEffect, useState } from 'react'
import { T, BackLink, Btn } from '../_shared'
import {
  COMMAND_PANELS,
  DEFAULT_PANEL_FLAGS,
  loadPanelFlags,
  savePanelFlags,
  type CommandPanelId,
  type PanelFlags,
  type PanelState,
} from '@/lib/command-panels'
import {
  ANALYTICS_TABS,
  DEFAULT_ANALYTICS_FLAGS,
  loadAnalyticsFlags,
  saveAnalyticsFlags,
  type AnalyticsTabId,
  type AnalyticsTabFlags,
  SOCIAL_PANELS,
  DEFAULT_SOCIAL_FLAGS,
  loadSocialFlags,
  saveSocialFlags,
  type SocialPanelId,
  type SocialPanelFlags,
} from '@/lib/analytics-tabs'
import {
  COMPETITOR_TABS,
  DEFAULT_COMPETITOR_FLAGS,
  loadCompetitorFlags,
  saveCompetitorFlags,
  type CompetitorTabId,
  type CompetitorTabFlags,
} from '@/lib/competitor-tabs'
import {
  MARKETING_TABS,
  DEFAULT_MARKETING_FLAGS,
  loadMarketingFlags,
  saveMarketingFlags,
  type MarketingTabId,
  type MarketingTabFlags,
} from '@/lib/marketing-tabs'

const G1 = {
  background: 'rgba(255,255,255,0.32)',
  backdropFilter: 'blur(32px) saturate(160%)',
  WebkitBackdropFilter: 'blur(32px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 18,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)',
} as const

const STATE_META: Record<PanelState, { label: string; color: string; blurb: string }> = {
  'live':         { label: 'Live data',   color: '#047857', blurb: 'Wired to a real endpoint — on by default.' },
  'wire-pending': { label: 'Coming soon', color: '#d97706', blurb: 'Real data source exists; gets wired in Phase 2. Off for now.' },
  'legacy':       { label: 'Legacy',      color: 'rgba(12,44,82,0.45)', blurb: 'Hardcoded/demo or duplicate. Off — turn on only to preview the old UI.' },
}

const ORDER: PanelState[] = ['live', 'wire-pending', 'legacy']

// ─── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onClick}
      style={{
        width: 44, height: 26, borderRadius: 999, flexShrink: 0, cursor: 'pointer',
        border: 'none', padding: 3, position: 'relative',
        background: on ? '#047857' : 'rgba(12,44,82,0.20)',
        transition: 'background 0.18s',
      }}
    >
      <span style={{
        display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transform: on ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPanelsSettingsPage() {
  const [flags, setFlags] = useState<PanelFlags>(DEFAULT_PANEL_FLAGS)
  const [aFlags, setAFlags] = useState<AnalyticsTabFlags>(DEFAULT_ANALYTICS_FLAGS)
  const [sFlags, setSFlags] = useState<SocialPanelFlags>(DEFAULT_SOCIAL_FLAGS)
  const [cFlags, setCFlags] = useState<CompetitorTabFlags>(DEFAULT_COMPETITOR_FLAGS)
  const [mFlags, setMFlags] = useState<MarketingTabFlags>(DEFAULT_MARKETING_FLAGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setFlags(loadPanelFlags())
    setAFlags(loadAnalyticsFlags())
    setSFlags(loadSocialFlags())
    setCFlags(loadCompetitorFlags())
    setMFlags(loadMarketingFlags())
  }, [])

  function flash() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function toggle(id: CommandPanelId) {
    const next = { ...flags, [id]: !flags[id] }
    setFlags(next); savePanelFlags(next); flash()
  }

  function toggleAnalytics(id: AnalyticsTabId) {
    const next = { ...aFlags, [id]: !aFlags[id] }
    setAFlags(next); saveAnalyticsFlags(next); flash()
  }

  function toggleSocial(id: SocialPanelId) {
    const next = { ...sFlags, [id]: !sFlags[id] }
    setSFlags(next); saveSocialFlags(next); flash()
  }

  function toggleCompetitor(id: CompetitorTabId) {
    const next = { ...cFlags, [id]: !cFlags[id] }
    setCFlags(next); saveCompetitorFlags(next); flash()
  }

  function toggleMarketing(id: MarketingTabId) {
    const next = { ...mFlags, [id]: !mFlags[id] }
    setMFlags(next); saveMarketingFlags(next); flash()
  }

  function resetDefaults() {
    setFlags({ ...DEFAULT_PANEL_FLAGS }); savePanelFlags({ ...DEFAULT_PANEL_FLAGS })
    setAFlags({ ...DEFAULT_ANALYTICS_FLAGS }); saveAnalyticsFlags({ ...DEFAULT_ANALYTICS_FLAGS })
    setSFlags({ ...DEFAULT_SOCIAL_FLAGS }); saveSocialFlags({ ...DEFAULT_SOCIAL_FLAGS })
    setCFlags({ ...DEFAULT_COMPETITOR_FLAGS }); saveCompetitorFlags({ ...DEFAULT_COMPETITOR_FLAGS })
    setMFlags({ ...DEFAULT_MARKETING_FLAGS }); saveMarketingFlags({ ...DEFAULT_MARKETING_FLAGS })
    flash()
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, paddingTop: 56, paddingBottom: 60 }}>
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto" style={{ paddingTop: 32 }}>
        <BackLink />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text1, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
              Dashboard Panels
            </h1>
            <p style={{ fontSize: 13, color: T.text2, marginBottom: 4, maxWidth: 620, lineHeight: 1.55 }}>
              Control which panels and tabs appear on the Command and Analytics dashboards. Changes save
              instantly and apply next time you open the dashboard. Nothing is deleted — toggle anything
              back on whenever you like. Stored locally on this device.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {saved && <span style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>Saved ✓</span>}
            <Btn variant="ghost" small onClick={resetDefaults}>Reset to defaults</Btn>
          </div>
        </div>

        {/* ── Command dashboard ─────────────────────────────────────────── */}
        <SurfaceHeading title="Command Dashboard" sub="Panels on the CEO Command screen" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 16 }}>
          {ORDER.map(state => {
            const panels = COMMAND_PANELS.filter(p => p.state === state)
            if (panels.length === 0) return null
            const meta = STATE_META[state]
            return (
              <section key={state}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <StateChip color={meta.color} label={meta.label} />
                  <span style={{ fontSize: 12, color: T.text3 }}>{meta.blurb}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {panels.map(p => (
                    <PanelRow
                      key={p.id}
                      label={p.label} chip={p.tab} description={p.description}
                      dataSource={p.dataSource} connectsTo={p.connectsTo}
                      on={flags[p.id]} onToggle={() => toggle(p.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* ── Analytics dashboard ───────────────────────────────────────── */}
        <SurfaceHeading title="Analytics Dashboard" sub="Sub-tabs on the Analytics screen" style={{ marginTop: 40 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 16 }}>
          {(['live', 'legacy'] as const).map(state => {
            const tabs = ANALYTICS_TABS.filter(t => t.state === state)
            if (tabs.length === 0) return null
            const meta = STATE_META[state]
            return (
              <section key={state}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <StateChip color={meta.color} label={meta.label} />
                  <span style={{ fontSize: 12, color: T.text3 }}>{meta.blurb}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {tabs.map(t => (
                    <PanelRow
                      key={t.id}
                      label={t.label} chip="tab" description={t.description}
                      dataSource={t.dataSource} connectsTo={t.connectsTo}
                      on={aFlags[t.id]} onToggle={() => toggleAnalytics(t.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {/* Social Media sub-panels */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <StateChip color={STATE_META.legacy.color} label="Social panels" />
              <span style={{ fontSize: 12, color: T.text3 }}>Charts inside the Social Media tab — off until wired to real data.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {SOCIAL_PANELS.map(p => (
                <PanelRow
                  key={p.id}
                  label={p.label} chip="social" description={p.description}
                  dataSource={p.dataSource} connectsTo={p.connectsTo}
                  on={sFlags[p.id]} onToggle={() => toggleSocial(p.id)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* ── Competitor dashboard ──────────────────────────────────────── */}
        <SurfaceHeading title="Competitor Dashboard" sub="Sub-tabs on the Competitor screen" style={{ marginTop: 40 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 16 }}>
          {(['live', 'legacy'] as const).map(state => {
            const tabs = COMPETITOR_TABS.filter(t => t.state === state)
            if (tabs.length === 0) return null
            const meta = STATE_META[state]
            return (
              <section key={state}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <StateChip color={meta.color} label={meta.label} />
                  <span style={{ fontSize: 12, color: T.text3 }}>{meta.blurb}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {tabs.map(t => (
                    <PanelRow
                      key={t.id}
                      label={t.label} chip="tab" description={t.description}
                      dataSource={t.dataSource} connectsTo="—"
                      on={cFlags[t.id]} onToggle={() => toggleCompetitor(t.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* ── Marketing dashboard ───────────────────────────────────────── */}
        <SurfaceHeading title="Marketing Dashboard" sub="In-page tabs on the Marketing screen" style={{ marginTop: 40 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 16 }}>
          {(['live', 'legacy'] as const).map(state => {
            const tabs = MARKETING_TABS.filter(t => t.state === state)
            if (tabs.length === 0) return null
            const meta = STATE_META[state]
            return (
              <section key={state}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <StateChip color={meta.color} label={meta.label} />
                  <span style={{ fontSize: 12, color: T.text3 }}>{meta.blurb}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {tabs.map(t => (
                    <PanelRow
                      key={t.id}
                      label={t.label} chip="tab" description={t.description}
                      dataSource={t.dataSource} connectsTo="—"
                      on={mFlags[t.id]} onToggle={() => toggleMarketing(t.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Shared row + heading + chip ─────────────────────────────────────────────
function SurfaceHeading({ title, sub, style }: { title: string; sub: string; style?: React.CSSProperties }) {
  return (
    <div style={{ marginTop: 28, ...style }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text1, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 12, color: T.text3, margin: '2px 0 0' }}>{sub}</p>
    </div>
  )
}

function StateChip({ color, label }: { color: string; label: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
      color, padding: '3px 10px', borderRadius: 999,
      border: `1px solid ${color}40`, background: `${color}14`,
    }}>
      {label}
    </span>
  )
}

function PanelRow({ label, chip, description, dataSource, connectsTo, on, onToggle }: {
  label: string; chip: string; description: string; dataSource: string; connectsTo: string;
  on: boolean; onToggle: () => void
}) {
  return (
    <div style={{ ...G1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text1, letterSpacing: '-0.01em' }}>{label}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: T.text3, padding: '2px 7px', borderRadius: 6, background: 'rgba(12,44,82,0.06)',
          }}>
            {chip}
          </span>
        </div>
        <p style={{ fontSize: 13, color: T.text2, margin: '3px 0 0', lineHeight: 1.45 }}>{description}</p>
        <p style={{ fontSize: 11, color: T.text3, margin: '5px 0 0', letterSpacing: '0.01em' }}>
          <strong style={{ fontWeight: 700 }}>Data:</strong> {dataSource}
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          <strong style={{ fontWeight: 700 }}>Connects:</strong> {connectsTo}
        </p>
      </div>
      <Toggle on={on} onClick={onToggle} />
    </div>
  )
}
