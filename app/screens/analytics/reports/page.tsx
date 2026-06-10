'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsSubNav from '../_subnav';
import TimelineToggle from '@/app/components/TimelineToggle';
import { useVentureSlug } from '@/lib/use-venture-slug';

// ── Glass constants ──────────────────────────────────────────────────────────
const I1='rgba(0,0,0,0.85)', I1b='rgba(0,0,0,0.65)', I1c='rgba(0,0,0,0.50)', I1d='rgba(0,0,0,0.40)', L1='rgba(0,0,0,0.10)';
const I2='#ffffff', I2b='rgba(255,255,255,0.85)', I2c='rgba(255,255,255,0.68)', I2d='rgba(255,255,255,0.45)', L2='rgba(255,255,255,0.14)';
const I3='#ffffff', I3c='rgba(255,255,255,0.72)', I3d='rgba(255,255,255,0.45)', L3='rgba(255,255,255,0.10)';
const ACCENT = '#0066cc';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReportSection {
  title: string;
  body: string;
}

interface KaiReport {
  id: string;
  generatedAt: string;
  venture: 'Novizio' | 'Hourbour' | 'All Ventures';
  period: string;
  summary: string;
  situation: ReportSection;
  diagnosis: ReportSection;
  action: ReportSection;
  prescription: ReportSection;
  keyMetrics: { label: string; value: string; delta: string; positive: boolean }[];
}

// No seed data — the dashboard never fabricates reports.
// Reports come from two sources:
// 1. Supabase kai_reports table (populated by Kai's daily cron at 06:00 UTC)
// 2. Manual generation via the Generate button (spawns Kai Hermes agent)
// Until either runs, the Reports tab shows an honest empty state.

const SEED_REPORTS: KaiReport[] = []

const STORAGE_KEY = 'yvon_kai_reports';

function loadReports(): KaiReport[] {
  if (typeof window === 'undefined') return SEED_REPORTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_REPORTS;
    const parsed = JSON.parse(raw) as KaiReport[];
    return parsed.length > 0 ? parsed : SEED_REPORTS;
  } catch {
    return SEED_REPORTS;
  }
}

function saveReports(reports: KaiReport[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports.slice(0, 10)));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricPill({ metric }: { metric: KaiReport['keyMetrics'][0] }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 rounded-2xl"
      style={{
        background: metric.positive ? 'rgba(0,102,204,0.12)' : 'rgba(239,68,68,0.10)',
        border: `1px solid ${metric.positive ? 'rgba(0,102,204,0.22)' : 'rgba(239,68,68,0.20)'}`,
      }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: I2d }}>{metric.label}</span>
      <span className="text-[22px] font-bold" style={{ color: I2, fontFamily: 'GeistMono, "Geist Mono", monospace', letterSpacing: '-0.02em' }}>
        {metric.value}
      </span>
      <span className="text-[11px]" style={{ color: metric.positive ? 'rgba(52,211,153,0.9)' : 'rgba(239,68,68,0.85)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
        {metric.delta}
      </span>
    </div>
  );
}

function SectionBlock({ section, accent }: { section: ReportSection; accent: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: accent, letterSpacing: '0.22em' }}>{section.title}</p>
      <p className="text-[14px] leading-[1.7]" style={{ color: I3c }}>
        {section.body}
      </p>
    </div>
  );
}

function HistoryCard({
  report,
  isActive,
  onClick,
}: {
  report: KaiReport;
  isActive: boolean;
  onClick: () => void;
}) {
  const date = new Date(report.generatedAt);
  const formatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer"
      style={{
        background: isActive ? 'rgba(0,102,204,0.10)' : 'rgba(0,0,0,0.04)',
        border: isActive ? '1px solid rgba(0,102,204,0.30)' : `1px solid ${L1}`,
        outline: 'none',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[12px] font-semibold" style={{ color: isActive ? ACCENT : I1b }}>
          {report.venture}
        </span>
        <span className="text-[10px] font-mono shrink-0" style={{ color: I1d }}>
          {formatted} · {time}
        </span>
      </div>
      <p className="text-[11px] leading-[1.55]" style={{ color: I1c }}>
        {report.summary.length > 100 ? report.summary.slice(0, 100) + '…' : report.summary}
      </p>
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsReportsPage() {
  const router = useRouter();
  const ventureSlug = useVentureSlug();
  const [reports, setReports] = useState<KaiReport[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('30D');

  // Load reports from API on mount, fall back to localStorage
  useEffect(() => {
    if (ventureSlug) {
      fetch(`/api/kai-report?venture=${ventureSlug}`)
        .then(r => r.json())
        .then(data => {
          if (data.reports?.length) {
            setReports(data.reports);
            setActiveId(data.reports[0].id);
            return;
          }
        })
        .catch(() => {})
        .finally(() => {
          // Fall back to localStorage if API returns nothing
          const loaded = loadReports();
          if (loaded.length) {
            setReports(prev => prev.length ? prev : loaded);
            setActiveId(prev => prev || loaded[0]?.id || '');
          }
        });
    }
  }, [ventureSlug]);

  const activeReport = reports.find((r) => r.id === activeId) ?? reports[0];

  function handleGenerate() {
    if (!ventureSlug) return;
    setGenerating(true);

    fetch('/api/kai-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venture: ventureSlug, period: reportPeriod }),
    })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) {
          // Show error — don't create fake report
          const msg = data?.error === 'no_data'
            ? 'Connect social accounts and fetch data first before generating a report.'
            : data?.error === 'not_implemented'
            ? 'Report generation with Claude is not yet connected. Social data exists but synthesis is pending.'
            : 'Could not generate report.';
          alert(msg);
          return;
        }
        const newReport: KaiReport = data.report;
        const updated = [newReport, ...reports].slice(0, 10);
        setReports(updated);
        setActiveId(newReport.id);
        saveReports(updated);
      })
      .catch(() => {
        alert('Could not reach the server. Check your connection and try again.');
      })
      .finally(() => setGenerating(false));
  }

  if (!activeReport) {
    return (
      <main className="min-h-screen pb-24">
        <AnalyticsSubNav />
        <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px]">
          {/* Header row — keep the Generate button accessible */}
          <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h2 className="text-[22px] font-bold mb-1" style={{ letterSpacing: '-0.024em', color: '#0c2c52' }}>
                Intelligence Reports
              </h2>
              <p className="text-[13px]" style={{ color: I1c }}>
                Kai analyses all venture signals and produces a prioritised action brief.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TimelineToggle options={['7D','30D','90D']} value={reportPeriod} onChange={setReportPeriod} />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 disabled:opacity-50"
                style={{
                  background: generating ? 'rgba(0,102,204,0.3)' : 'rgba(0,102,204,0.85)',
                  color: '#fff',
                  border: '1px solid rgba(0,102,204,0.6)',
                  boxShadow: generating ? 'none' : '0 0 24px -4px rgba(0,102,204,0.55)',
                  cursor: generating ? 'not-allowed' : 'pointer',
                }}
              >
                {generating ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" style={{ display: 'inline-block' }} /> Generating…</>
                ) : (
                  <><span className="material-symbols-outlined text-[16px]">auto_awesome</span> Generate Kai Report</>
                )}
              </button>
            </div>
          </div>

          {/* Empty state — honest, clear, actionable */}
          <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
            <span className="material-symbols-outlined text-[56px]" style={{ color: 'rgba(0,0,0,0.10)' }}>description</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'rgba(0,0,0,0.55)', margin: 0 }}>
              No Reports Yet
            </h2>
            <p className="max-w-lg" style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', lineHeight: 1.65 }}>
              Reports are generated by <strong>Kai</strong>, the YVON analyst agent. They come from two sources:
            </p>
            <div className="flex flex-col gap-3 text-left max-w-md" style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', lineHeight: 1.6 }}>
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,102,204,0.06)', border: '1px solid rgba(0,102,204,0.12)' }}>
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5" style={{ color: '#0066cc' }}>schedule</span>
                <div>
                  <strong style={{ color: '#0c2c52' }}>Daily cron — 06:00 UTC</strong>
                  <p style={{ margin: '2px 0 0' }}>Kai automatically pulls analytics data, detects anomalies, and writes a report every morning. First report arrives tomorrow.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>touch_app</span>
                <div>
                  <strong style={{ color: '#0c2c52' }}>Manual generation</strong>
                  <p style={{ margin: '2px 0 0' }}>Click <strong>Generate Kai Report</strong> above to spawn Kai now. Requires social accounts to be connected with data.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => router.push('/screens/analytics/social-media')}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold active:scale-95"
                style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.6)' }}
              >
                Connect Social Accounts
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', marginTop: 8 }}>
              No fabricated data. No demo reports. What you see is real.
            </p>
          </div>
        </div>
      </main>
    )
  }

  const formattedDate = new Date(activeReport.generatedAt).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const formattedTime = new Date(activeReport.generatedAt).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <main className="min-h-screen pb-24">
      <AnalyticsSubNav />
      <div className="px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto mt-[18px]">

        {/* ── Header row ─────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2 className="text-[22px] font-bold mb-1" style={{ letterSpacing: '-0.024em', color: '#0c2c52' }}>
              Intelligence Reports
            </h2>
            <p className="text-[13px]" style={{ color: I1c }}>
              Kai analyses all venture signals and produces a prioritised action brief. Up to 10 reports stored locally.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TimelineToggle options={['7D','30D','90D']} value={reportPeriod} onChange={setReportPeriod} />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 disabled:opacity-50"
              style={{
                background: generating ? 'rgba(0,102,204,0.3)' : 'rgba(0,102,204,0.85)',
                color: '#fff',
                border: '1px solid rgba(0,102,204,0.6)',
                boxShadow: generating ? 'none' : '0 0 24px -4px rgba(0,102,204,0.55)',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: 'InstrumentSans, Inter, sans-serif',
              }}
            >
              {generating ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    style={{ display: 'inline-block' }}
                  />
                  Generating…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  Generate Kai Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Two-column layout: report (left) + history (right) ── */}
        <div className="flex gap-6 items-start">

          {/* ── Active report ──────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Report header — V2 Azure Tint */}
            <div className="ana-glass-v2 p-6">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(0,102,204,0.2)', color: '#5ba8ff', letterSpacing: '0.06em', fontFamily: 'InstrumentSans, Inter, sans-serif' }}
                    >
                      {activeReport.venture.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: I2d, letterSpacing: '0.06em', fontWeight: 600 }}>{activeReport.period}</span>
                  </div>
                  <p className="text-[17px] font-semibold leading-[1.45]" style={{ color: 'rgba(255,255,255,0.92)', fontFamily: 'InstrumentSans, Inter, sans-serif', maxWidth: 540 }}>
                    {activeReport.summary}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                    {formattedDate}
                  </p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'GeistMono, "Geist Mono", monospace' }}>
                    {formattedTime}
                  </p>
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-4 gap-3">
                {activeReport.keyMetrics.map((m) => (
                  <MetricPill key={m.label} metric={m} />
                ))}
              </div>
            </div>

            {/* Situation */}
            <SectionBlock section={activeReport.situation} accent="rgba(255,255,255,0.40)" />

            {/* Diagnosis */}
            <SectionBlock section={activeReport.diagnosis} accent="rgba(251,191,36,0.75)" />

            {/* Action */}
            <SectionBlock section={activeReport.action} accent="rgba(52,211,153,0.75)" />

            {/* Kai Prescription — elevated card */}
            <div className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(0,102,204,0.16), rgba(255,255,255,0.04))',
                border: '1px solid rgba(0,102,204,0.28)',
                boxShadow: '0 0 48px -16px rgba(0,102,204,0.30)',
              }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#5ba8ff' }}>psychology</span>
                <p className="ana-label" style={{ color: '#5ba8ff' }}>{activeReport.prescription.title}</p>
              </div>
              <p className="text-[14px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.80)', fontFamily: 'InstrumentSans, Inter, sans-serif' }}>
                {activeReport.prescription.body}
              </p>
              <div className="flex gap-3 mt-5">
                <a
                  href={`/screens/war-room?q=${encodeURIComponent('Execute Kai prescription from report ' + activeReport.id + ': ' + activeReport.prescription.body.slice(0, 120))}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200"
                  style={{
                    background: 'rgba(0,102,204,0.75)',
                    color: '#fff',
                    border: '1px solid rgba(0,102,204,0.5)',
                    fontFamily: 'InstrumentSans, Inter, sans-serif',
                    textDecoration: 'none',
                  }}
                >
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                  Take Action in War Room
                </a>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    fontFamily: 'InstrumentSans, Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    const text = [
                      `KAI REPORT — ${activeReport.venture} | ${activeReport.period}`,
                      '',
                      'SUMMARY',
                      activeReport.summary,
                      '',
                      'SITUATION',
                      activeReport.situation.body,
                      '',
                      'DIAGNOSIS',
                      activeReport.diagnosis.body,
                      '',
                      'ACTION',
                      activeReport.action.body,
                      '',
                      'KAI PRESCRIPTION',
                      activeReport.prescription.body,
                    ].join('\n');
                    navigator.clipboard.writeText(text);
                  }}
                >
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                  Copy Report
                </button>
              </div>
            </div>

          </div>

          {/* ── History sidebar — V1 Clear Ice ──────────────── */}
          <div className="w-[280px] shrink-0 flex flex-col gap-3" style={{ position: 'sticky', top: 180 }}>
            <div className="ana-glass p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: I1d, margin: 0 }}>Report History</p>
                <span className="text-[11px] font-mono" style={{ color: I1d }}>
                  {reports.length}/10
                </span>
              </div>

              {reports.map((r) => (
                <HistoryCard
                  key={r.id}
                  report={r}
                  isActive={r.id === activeId}
                  onClick={() => setActiveId(r.id)}
                />
              ))}

              {reports.length >= 10 && (
                <p className="text-center text-[11px] pt-1" style={{ color: I1c }}>
                  Max 10 reports stored. Oldest removed on next generation.
                </p>
              )}

              {reports.length < 10 && (
                <p className="text-center text-[11px] pt-1" style={{ color: I1c }}>
                  {10 - reports.length} slot{10 - reports.length !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] mt-12" style={{ color: I1c }}>
          © 2026 YVON · Reports stored locally. Supabase persistence coming in Phase 2.
        </p>
      </div>
    </main>
  );
}
