'use client';

import { useState, useEffect, useCallback } from 'react';
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

// ─── Seed data (shown until user generates their first real report) ───────────

const SEED_REPORTS: KaiReport[] = [
  {
    id: 'kai-2026-05-13',
    generatedAt: '2026-05-13T09:14:00Z',
    venture: 'All Ventures',
    period: 'May 6–13, 2026',
    summary: 'Novizio TikTok surged +31% on process-transparency content. Hourbour email funnel conversion fell 8pts — action required this week.',
    situation: {
      title: 'Situation',
      body:
        'Both ventures are in their highest-activity period of Q2. Novizio generated 3.8× ROAS on TikTok paid spend, driven by the "factory transparency" creative set launched May 8. Instagram engagement is healthy at 6.3% but reach has plateaued since April 22. Hourbour email funnel conversion dropped from 18% to 10% following the May 7 onboarding copy refresh — a regression, not a trend. Overall brand health index sits at 82/100, up 4pts from the prior 7-day window.',
    },
    diagnosis: {
      title: 'Diagnosis',
      body:
        "Novizio's TikTok spike is causally linked to one creative format: factory-floor process content. The effect is short-window — typical half-life is 10–14 days before replication dilutes novelty. The Instagram reach plateau is a distribution issue, not a content quality issue; hashtag strategy is stale (avg tag age: 112 days). Hourbour's email conversion regression traces directly to the May 7 copy change — the new headline buries the primary value proposition below the fold on mobile (68% of opens). CAC on paid is holding at $8.20 — below the $12 target, which is healthy, but Hourbour's acquisition spend is 34% under-paced against the Q2 plan.",
    },
    action: {
      title: 'Action',
      body:
        '1. Brief Atlas on 2 more factory-floor TikTok concepts this week while the format has tail lift. 2. Refresh Novizio Instagram hashtag set — target 60% niche (<500K posts), 30% mid, 10% broad. 3. Revert Hourbour email headline to v1 copy (or A/B test v3) — expected to recover 5–6pts conversion within one send cycle. 4. Increase Hourbour paid spend by +$800/week to close the Q2 pacing gap before June cutoff.',
    },
    prescription: {
      title: 'Kai Prescription',
      body:
        "This week's highest-leverage action is the Hourbour email headline fix — it is the only change that is a pure regression fix with near-zero execution risk and recovers measurable revenue within 48 hours. TikTok brief is second priority; delay past 14 days and the format window closes. Instagram hashtag refresh is a low-cost background task — assign to Lena alongside next caption batch. The Hourbour spend increase should be approved by Stark before execution.",
    },
    keyMetrics: [
      { label: 'ROAS', value: '3.8×', delta: '+0.4× vs prior week', positive: true },
      { label: 'CAC', value: '$8.20', delta: '−$1.10 vs target', positive: true },
      { label: 'Brand Health', value: '82/100', delta: '+4pts vs last week', positive: true },
      { label: 'HRB Email CVR', value: '10%', delta: '−8pts regression', positive: false },
    ],
  },
  {
    id: 'kai-2026-05-06',
    generatedAt: '2026-05-06T09:08:00Z',
    venture: 'Novizio',
    period: 'Apr 29–May 6, 2026',
    summary: 'ROAS steady at 3.4×. Instagram reach down 11% week-over-week. TikTok CAC improved to $4.20 — best channel by margin.',
    situation: {
      title: 'Situation',
      body:
        "Novizio Q2 opening week performance came in at 3.4× ROAS — on target but not breakthrough. TikTok is the standout channel: $4.20 CAC, 22% engagement rate on top post. Instagram reach fell 11% WoW, likely tied to the algorithm's shift toward Reels-first distribution. Content calendar has 3 posts missed this week — all scheduled IG carousels.",
    },
    diagnosis: {
      title: 'Diagnosis',
      body:
        "The 3 missed IG posts represent a production gap, not a strategy gap. Carousel production time is currently 4.5 hours per post; target is 2.5 hours. TikTok's performance validates the process-transparency positioning. The ROAS plateau at 3.4× is likely a creative fatigue signal — top ad set has been running 22 days with no refresh.",
    },
    action: {
      title: 'Action',
      body:
        '1. Refresh top TikTok ad set — brief Pixel on 3 new variants. 2. Address carousel production bottleneck — evaluate Canva automation template with Atlas. 3. Push missed IG posts as a Reels format instead of static carousels.',
    },
    prescription: {
      title: 'Kai Prescription',
      body:
        "Highest-leverage action: ad creative refresh. Running a 22-day-old creative on a $X00/day budget is burning margin. Even a 10% ROAS improvement on refreshed creative returns more than any other action this week. Production bottleneck is a Week 2 problem — do not let it block this week's paid performance fix.",
    },
    keyMetrics: [
      { label: 'ROAS', value: '3.4×', delta: 'Flat vs prior week', positive: true },
      { label: 'TikTok CAC', value: '$4.20', delta: '−$0.30 vs prior', positive: true },
      { label: 'IG Reach', value: '−11%', delta: 'WoW decline', positive: false },
      { label: 'Missed Posts', value: '3', delta: 'Production gap', positive: false },
    ],
  },
  {
    id: 'kai-2026-04-29',
    generatedAt: '2026-04-29T09:22:00Z',
    venture: 'Hourbour',
    period: 'Apr 22–29, 2026',
    summary: 'Hourbour MRR +12% MoM. Trial-to-paid conversion at 22% — above SaaS median. CAC by paid channel needs audit.',
    situation: {
      title: 'Situation',
      body:
        'Hourbour closed April with MRR growth of +12% MoM, above the 8% Q2 target. Trial-to-paid conversion improved to 22%, driven by the new onboarding email sequence launched April 14. Paid social CAC increased from $18 to $24 over 30 days — a trend that requires intervention before May budget commitment.',
    },
    diagnosis: {
      title: 'Diagnosis',
      body:
        'The CAC increase on paid is concentrated in the Meta prospecting campaign. Click-to-trial rate is stable at 3.1%, but trial activation (completing the first savings rule) dropped from 54% to 41%. This suggests the ad is attracting a lower-intent audience segment — likely due to the broadened age targeting applied April 20.',
    },
    action: {
      title: 'Action',
      body:
        '1. Revert Meta targeting to 25–38 demographic (pre-April-20 setting). 2. Add "activate your first rule" push notification at T+2 hours post-signup. 3. Review May budget split — consider shifting 20% of Meta budget to TikTok test.',
    },
    prescription: {
      title: 'Kai Prescription',
      body:
        'Reverting the targeting is a 5-minute change with a 2-week payback window — do it first. The push notification requires dev effort; queue it as a Week 2 sprint item. MRR momentum is real — do not let CAC creep erode the growth story before Series A conversations.',
    },
    keyMetrics: [
      { label: 'MRR Growth', value: '+12%', delta: 'vs 8% target', positive: true },
      { label: 'Trial→Paid', value: '22%', delta: 'Above SaaS median', positive: true },
      { label: 'Meta CAC', value: '$24', delta: '+$6 vs 30d prior', positive: false },
      { label: 'Activation Rate', value: '41%', delta: '−13pts vs prior', positive: false },
    ],
  },
];

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

  if (!activeReport) return null;

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
