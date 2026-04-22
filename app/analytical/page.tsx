'use client';

import { useState, useEffect, useRef } from 'react';

// ── Tabs ────────────────────────────────────────────────────────────
const TABS = [
  'Overview', 'Instagram', 'LinkedIn', 'TikTok', 'Content', 'Portfolio',
  'Competitor Intel',
];

// ── Chart drawing helper ───────────────────────────────────────────
interface ChartDataset { color: string; data: number[]; }

function drawLineChart(
  canvas: HTMLCanvasElement | null,
  datasets: ChartDataset[],
  labels: string[],
  yMin: number, yMax: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = canvas.parentElement?.offsetWidth ?? 400;
  const c = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  const pad = { l: 24, r: 8, t: 8, b: 22 };
  const gw = w - pad.l - pad.r;
  const gh = h - pad.t - pad.b;

  c.clearRect(0, 0, w, h);

  for (let f = 0; f <= 1; f += 0.25) {
    const y = pad.t + gh * (1 - f);
    c.beginPath(); c.moveTo(pad.l, y); c.lineTo(w - pad.r, y);
    c.strokeStyle = '#1e1e1e'; c.lineWidth = 1; c.stroke();
    const val = Math.round(yMin + f * (yMax - yMin));
    c.fillStyle = '#444'; c.font = '8px DM Sans,sans-serif'; c.textAlign = 'right';
    c.fillText(String(val), pad.l - 3, y + 3);
  }

  labels.forEach((lbl, i) => {
    const x = pad.l + (i / (labels.length - 1)) * gw;
    c.fillStyle = '#555'; c.font = '9px DM Sans,sans-serif'; c.textAlign = 'center';
    c.fillText(lbl, x, h - 4);
  });

  datasets.forEach((ds) => {
    const xs = ds.data.map((_, i) => pad.l + (i / (ds.data.length - 1)) * gw);
    const ys = ds.data.map((v) => pad.t + gh - ((v - yMin) / (yMax - yMin)) * gh);

    c.beginPath(); c.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
      const cpx = (xs[i - 1] + xs[i]) / 2;
      c.bezierCurveTo(cpx, ys[i - 1], cpx, ys[i], xs[i], ys[i]);
    }
    c.lineTo(xs[xs.length - 1], pad.t + gh);
    c.lineTo(xs[0], pad.t + gh);
    c.closePath();
    const r = parseInt(ds.color === '#fff' ? 'ff' : ds.color.slice(1, 3), 16);
    const g = parseInt(ds.color === '#fff' ? 'ff' : ds.color.slice(3, 5), 16);
    const b = parseInt(ds.color === '#fff' ? 'ff' : ds.color.slice(5, 7), 16);
    const grad = c.createLinearGradient(0, pad.t, 0, pad.t + gh);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    c.fillStyle = grad; c.fill();

    c.beginPath(); c.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
      const cpx = (xs[i - 1] + xs[i]) / 2;
      c.bezierCurveTo(cpx, ys[i - 1], cpx, ys[i], xs[i], ys[i]);
    }
    c.strokeStyle = ds.color; c.lineWidth = 1.5; c.stroke();

    c.beginPath(); c.arc(xs[xs.length - 1], ys[ys.length - 1], 3, 0, Math.PI * 2);
    c.fillStyle = ds.color; c.fill();
  });
}

function ChartCanvas({
  datasets, labels, yMin, yMax, height = 130,
}: {
  datasets: ChartDataset[]; labels: string[]; yMin: number; yMax: number; height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { drawLineChart(ref.current, datasets, labels, yMin, yMax); }, [datasets, labels, yMin, yMax]);
  return <canvas ref={ref} height={height} />;
}

// ── Pill ────────────────────────────────────────────────────────────
function Pill({ style, children }: { style: 'neutral' | 'up' | 'down' | 'avg'; children: React.ReactNode }) {
  const m: Record<string, string> = {
    neutral: 'inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]',
    up: 'inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#1a3a1a] text-[#4ade80]',
    down: 'inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#3a1a1a] text-[#f87171]',
    avg: 'inline-block px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]',
  };
  return <span className={m[style]}>{children}</span>;
}

// ── Metric Cards ────────────────────────────────────────────────────
function SocialMetricCard({
  label, value, change, goal, goalPct, goalWidth,
}: {
  label: string; value: string; change: string; goal: string; goalPct: string; goalWidth: string;
}) {
  return (
    <div className="rounded-lg px-3 py-3" style={{ background: '#161616', border: '1px solid #232323' }}>
      <div className="text-[10.5px] text-[#888] mb-1.5 font-medium">{label}</div>
      <div className="text-[28px] font-bold tracking-tight text-[#f0f0f0] leading-none mb-1">{value}</div>
      <div className="text-[11px] text-[#3ecf6e]">{change}</div>
      <div className="text-[10.5px] text-[#555] mt-2">
        Goal: {goal} · <span className="text-[#888] font-semibold">{goalPct}</span>
      </div>
      <div className="h-[3px] bg-[#2a2a2a] rounded mt-1.5">
        <div className="h-full rounded" style={{ width: goalWidth, background: '#3ecf6e' }} />
      </div>
    </div>
  );
}

function EcomCard({
  label, value, change, changeDir, changeColor, sub,
}: {
  label: string; value: string; change: string; changeDir?: 'up' | 'down';
  changeColor?: string; sub: string;
}) {
  const changeStyle: React.CSSProperties = {
    fontSize: 11,
    color: changeColor ?? (changeDir === 'up' ? '#3ecf6e' : changeDir === 'down' ? '#f87171' : '#888'),
  };
  return (
    <div className="rounded-lg px-3 py-3" style={{ background: '#161616', border: '1px solid #232323' }}>
      <div className="text-[10.5px] text-[#888] mb-1.5 font-medium">{label}</div>
      <div className="text-[28px] font-bold tracking-tight text-[#f0f0f0] leading-none mb-1">{value}</div>
      <div style={changeStyle}>{change}</div>
      <div className="text-[10.5px] text-[#555] mt-2">{sub}</div>
    </div>
  );
}

// ── Correlation table ──────────────────────────────────────────────
interface CorrRow {
  num: number;
  name: string;
  quote: string;
  conv?: string;
  vsAvg?: string;
  vsStyle?: 'up' | 'down' | 'avg';
  sessions?: string;
  revenue?: string;
}
const CORR_DATA: CorrRow[] = [
  { num: 1, name: 'Process Transparency', quote: '"This took 3 weeks." · "From sketch to shelf"' },
  { num: 2, name: 'Founder Voice', quote: '"Founder note" · "3 decisions that defined us"', conv: '3.8%', vsAvg: '+36%', vsStyle: 'up', sessions: '1.8K', revenue: '$1,620' },
  { num: 3, name: 'Styling / Outfit', quote: '"Outfit formula" · "How our fits run"', conv: '3.2%', vsAvg: '+14%', vsStyle: 'up', sessions: '3.1K', revenue: '$1,840' },
  { num: 4, name: 'Product Showcase', quote: '"Spring collection" · "Just dropped"', conv: '2.1%', vsAvg: 'vs avg', vsStyle: 'avg', sessions: '4.2K', revenue: '$1,960' },
  { num: 5, name: 'Education / FAQ', quote: '"Fabric test" · "What makes us different"', conv: '1.4%', vsAvg: '-50%', vsStyle: 'down', sessions: '1.2K', revenue: '$380' },
];

// ── CAC channels ────────────────────────────────────────────────────
const CAC_DATA = [
  { platform: 'TikTok', value: '$4.20', note: 'Best CAC · +18% MoM', highlight: false },
  { platform: 'Instagram', value: '$7.80', note: '+6% MoM', highlight: true },
  { platform: 'YouTube', value: '$12.40', note: '+31% MoM', highlight: false },
  { platform: 'LinkedIn', value: '$18.60', note: 'Highest · review spend', highlight: false },
  { platform: 'Avg LTV', value: '$142', note: 'LTV:CAC ratio · 18×', highlight: false },
];

// ── Intelligence synthesis ─────────────────────────────────────────
const SYNTH_ENTRIES = [
  {
    avatar: 'K', bgColor: 'linear-gradient(135deg,#38bdf8,#0284c7)',
    color: '#fff', name: 'Kai',
    text: 'TikTok follower growth accelerated 148% this week driven by 3 repurposed Instagram Reels posted Mar 18–20. Algorithm window is open. Recommend doubling repurposing cadence to 6 clips/week.',
  },
  {
    avatar: 'N', bgColor: 'linear-gradient(135deg,#a3e635,#65a30d)',
    color: '#000', name: 'Nate',
    text: 'TikTok now drives 41% of attributed conversions at lowest CAC ($4.20). LinkedIn converts at 3× cost with lower volume. Reallocate 20% of LinkedIn content budget to TikTok production this month.',
  },
];

// ── Intel bars (shared) ────────────────────────────────────────────
const SHARED_INTEL = [
  {
    type: 'action', label: 'ACTION', bg: '#1a1000', border: '#3a2800',
    bold: 'TikTok reel from Mar 20 hit 2x avg reach',
    rest: ' — extend campaign this week',
    link: 'VIEW REEL →',
  },
  {
    type: 'watch', label: 'WATCH', bg: '#0e180e', border: '#1e3220',
    bold: 'LinkedIn engagement dropped to 1.4%',
    rest: ' — investigate posting time or format',
    link: 'SEE LINKEDIN →',
  },
  {
    type: 'intel', label: 'INTEL', bg: '#0e1018', border: '#1e2030',
    bold: 'Reformotion posted a transparency campaign.',
    rest: ' Novizio has no equivalent — gap opening',
    link: 'CONTENT GAP →',
  },
];

// ── Top post data for platform tabs ─────────────────────────────────
interface TopPost {
  title: string;
  format: string;
  date: string;
  views: string;
  engages: string;
  ctr: string;
  trend: 'up' | 'down';
}
const INSTAGRAM_TOP_POSTS: TopPost[] = [
  { title: 'Outfit formula: monochrome layering', format: 'Reel', date: 'Apr 2', views: '24.3K', engages: '1,832', ctr: '5.7%', trend: 'up' },
  { title: 'Behind the fabric selection desk', format: 'Carousel', date: 'Mar 30', views: '18.1K', engages: '1,420', ctr: '4.2%', trend: 'up' },
  { title: 'Founder picks: 3 non-negotiables', format: 'Reel', date: 'Mar 27', views: '31.7K', engages: '2,640', ctr: '6.1%', trend: 'up' },
  { title: 'Spring palette mood board', format: 'Static', date: 'Mar 24', views: '9.8K', engages: '680', ctr: '3.1%', trend: 'down' },
];

const LINKEDIN_TOP_POSTS: TopPost[] = [
  { title: 'What 1 year of building taught me', format: 'Article', date: 'Apr 1', views: '48.2K', engages: '3,210', ctr: '7.8%', trend: 'up' },
  { title: 'The real cost of fast fashion', format: 'Post', date: 'Mar 28', views: '12.4K', engages: '980', ctr: '2.3%', trend: 'down' },
  { title: 'Our 90-day quality test results', format: 'Carousel', date: 'Mar 25', views: '8.7K', engages: '620', ctr: '1.9%', trend: 'down' },
  { title: 'From zero to 21K in 6 months', format: 'Post', date: 'Mar 22', views: '67.3K', engages: '5,410', ctr: '8.9%', trend: 'up' },
];

const TIKTOK_TOP_POSTS: TopPost[] = [
  { title: 'POV: your clothes cost $2 to make', format: 'Video', date: 'Apr 2', views: '189K', engages: '14.2K', ctr: '12.3%', trend: 'up' },
  { title: 'How we source fabrics at $1/yard', format: 'Video', date: 'Mar 31', views: '97K', engages: '7.8K', ctr: '8.4%', trend: 'up' },
  { title: 'Reply: "is this greenwashing?"', format: 'Video', date: 'Mar 28', views: '214K', engages: '21.3K', ctr: '14.1%', trend: 'up' },
  { title: 'Styling one base 5 ways', format: 'Video', date: 'Mar 25', views: '68K', engages: '5.2K', ctr: '6.7%', trend: 'down' },
];

// ── Content tab data ────────────────────────────────────────────────
const CONTENT_CALENDAR = [
  { channel: 'Instagram', date: 'Apr 6', format: 'Reel', status: 'Scheduled', topic: 'Transparency: cost breakdown' },
  { channel: 'TikTok', date: 'Apr 7', format: 'Video', status: 'Draft', topic: 'Reply: why our prices are fair' },
  { channel: 'LinkedIn', date: 'Apr 8', format: 'Article', status: 'Scheduled', topic: 'The math behind ethical fashion' },
  { channel: 'Instagram', date: 'Apr 9', format: 'Carousel', status: 'Draft', topic: 'Fabric testing: 90 days in' },
  { channel: 'TikTok', date: 'Apr 10', format: 'Video', status: 'Ideas', topic: 'Styling capsule for spring' },
];

const CONTENT_PERF = [
  {
    name: 'Reels', posted: 12, views: '248K', avgEng: '7.2%', trend: 'up',
    insight: 'Highest ROI — double output',
  },
  {
    name: 'Stories', posted: 28, views: '87K', avgEng: '3.1%', trend: 'avg',
    insight: 'Good for community, low reach',
  },
  {
    name: 'Carousels', posted: 4, views: '42K', avgEng: '2.8%', trend: 'down',
    insight: 'Underperforming vs prior month',
  },
  {
    name: 'Static posts', posted: 6, views: '31K', avgEng: '2.1%', trend: 'down',
    insight: 'Transition away from static',
  },
];

// ── Portfolio tab data ──────────────────────────────────────────────
const PORTFOLIO_CAMPAIGNS = [
  {
    name: 'Spring Drop — Launch',
    period: 'Mar 15 – Apr 2',
    channels: 'Instagram, TikTok, LinkedIn',
    reach: '340K',
    engRate: '5.8%',
    conversions: '1,240',
    revenue: '$14.8K',
    result: 'Exceeded target by 23%',
    status: 'Completed',
  },
  {
    name: 'Transparency Week',
    period: 'Mar 1 – Mar 7',
    channels: 'Instagram, TikTok',
    reach: '520K',
    engRate: '8.2%',
    conversions: '2,180',
    revenue: '$26.4K',
    result: 'Viral — top week ever',
    status: 'Completed',
  },
  {
    name: 'Founder Series Vol.2',
    period: 'Mar 20 – Apr 5',
    channels: 'LinkedIn, Instagram',
    reach: '180K',
    engRate: '6.4%',
    conversions: '890',
    revenue: '$10.2K',
    result: 'On track',
    status: 'Active',
  },
];

// ── Competitor Intel data ───────────────────────────────────────────
const COMP_DATA = [
  {
    brand: 'Reformotion', followers: '34K', growth: '+18%',
    engRate: '4.2%', postFreq: '5/week',
    weakness: 'Inconsistent posting schedule',
    threat: 'High',
    insight: 'Strong in transparency content — direct threat to our moat',
  },
  {
    brand: 'Ethical Stitch', followers: '12K', growth: '+8%',
    engRate: '3.1%', postFreq: '3/week',
    weakness: 'Low production quality',
    threat: 'Medium',
    insight: 'Similar price tier but weaker brand voice',
  },
  {
    brand: 'Slow Wear Co', followers: '89K', growth: '+3%',
    engRate: '2.4%', postFreq: '2/week',
    weakness: 'Declining engagement, stale content',
    threat: 'High',
    insight: 'Large audience but disengaged — acquisition target',
  },
];

const MARKET_SCORECARD = [
  { metric: 'Brand Share of Voice', ours: '14%', comp: '22%', status: 'gap' },
  { metric: 'Engagement Rate vs Industry', ours: '6.2%', comp: '3.8%', status: 'lead' },
  { metric: 'Content Velocity (posts/week)', ours: '8', comp: '5', status: 'lead' },
  { metric: 'Follower Growth Rate', ours: '+12%', comp: '+5%', status: 'lead' },
  { metric: 'Cross-platform Consistency', ours: '72%', comp: '81%', status: 'gap' },
];

// ── Tab content components ──────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9.5px] font-bold tracking-wider text-[#555] uppercase mb-1.5">{children}</div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg px-3.5 py-3.5" style={{ background: '#161616', border: '1px solid #232323' }}>
      <div className="text-[10.5px] font-bold tracking-wider text-[#888] uppercase mb-2.5">{title}</div>
      {children}
    </div>
  );
}

function IntelBars({ rows }: { rows: typeof SHARED_INTEL }) {
  return (
    <div className="px-5 py-2.5 flex flex-col gap-0.5">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded"
          style={{ background: row.bg, border: `1px solid ${row.border}` }}>
          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-[9.5px] font-extrabold tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                background: row.type === 'action' ? '#3a1800' : row.type === 'watch' ? '#1a3a1a' : '#1a1e3a',
                color: row.type === 'action' ? '#fb923c' : row.type === 'watch' ? '#4ade80' : '#818cf8',
              }}>
              {row.label}
            </span>
            <span className="text-[#888]">
              <span className="text-[#f0f0f0] font-medium">{row.bold}</span>{row.rest}
            </span>
          </div>
          <span className="text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-opacity hover:opacity-70"
            style={{ color: '#3ecf6e' }}>
            {row.link}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══ OVERVIEW TAB ═══
function OverviewTab() {
  return (
    <>
      <IntelBars rows={SHARED_INTEL} />
      <div className="grid gap-2.5 px-5 py-2.5" style={{ gridTemplateColumns: '1fr 1.35fr' }}>
        <div className="flex flex-col gap-2.5">
          <div>
            <SectionLabel>Social Performance</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <SocialMetricCard label="Total Followers" value="21.4K" change="+12.3% vs last wk" goal="30k by Apr" goalPct="71%" goalWidth="71%" />
              <SocialMetricCard label="Avg Engagement" value="6.2%" change="+1.8pp vs last wk" goal="8% by Apr" goalPct="78%" goalWidth="78%" />
              <SocialMetricCard label="Weekly Reach" value="169K" change="+31.4% vs last wk" goal="250K by Apr" goalPct="68%" goalWidth="68%" />
              <SocialMetricCard label="Brand Health" value="74/100" change="+5 pts vs last wk" goal="85 by Apr" goalPct="87%" goalWidth="87%" />
            </div>
          </div>
          <div>
            <SectionLabel>E-Commerce Health</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <EcomCard label="Weekly Revenue" value="$4,820" change="+18% vs last wk" changeDir="up" sub="Social-attributed" />
              <EcomCard label="Conv. Rate" value="2.8%" change="Benchmark: 1.4×" changeColor="#888" sub="Within healthy range" />
              <EcomCard label="Cart Abandon" value="68%" change="Benchmark: +45%" changeDir="down" sub="Above target — review checkout" />
              <EcomCard label="Repeat Purchase" value="24%" change="Benchmark: 20%" changeColor="#888" sub="Healthy retention signal" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <Card title="Purchase Correlation Score">
            <div className="text-[11px] text-[#555] mb-2.5" style={{ marginTop: -4 }}>Kai: which content types actually drive purchases — ranked by conversion rate</div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5 pr-1" style={{ width: '40%' }} />
                  <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5 px-1">CONV</th>
                  <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5 px-1">VS AVG</th>
                  <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5 px-1">SESSIONS</th>
                  <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5 pr-0">REVENUE</th>
                </tr>
              </thead>
              <tbody>
                {CORR_DATA.map((row) => (
                  <tr key={row.num} className="border-t border-[#232323]">
                    <td className="py-1.5">
                      <div className="flex items-start gap-2">
                        <span className="text-[#555] text-[11px] w-4 flex-shrink-0">{row.num}</span>
                        <div>
                          <div className="text-[12.5px] font-semibold text-[#f0f0f0]">{row.name}</div>
                          <div className="text-[10.5px] text-[#888] mt-0.5">{row.quote}</div>
                        </div>
                      </div>
                    </td>
                    {row.conv ? (
                      <>
                        <td className="text-right px-1 text-[12px] text-[#f0f0f0]">{row.conv}</td>
                        <td className="text-right px-1"><Pill style={row.vsStyle as 'up' | 'down' | 'avg'}>{row.vsAvg}</Pill></td>
                        <td className="text-right px-1 text-[12px] text-[#888]">{row.sessions}</td>
                        <td className="text-right px-1 text-[12px] font-semibold text-[#f0f0f0]">{row.revenue}</td>
                      </>
                    ) : (
                      <>
                        <td className="text-right px-1"><Pill style="neutral">CONV</Pill></td>
                        <td className="text-right px-1"><Pill style="neutral">VS AVG</Pill></td>
                        <td className="text-right px-1"><Pill style="neutral">SESSIONS</Pill></td>
                        <td className="text-right px-1 pr-0"><Pill style="neutral">REVENUE</Pill></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="rounded p-2.5 mt-2 text-[12px] leading-relaxed" style={{ background: '#0e180e', border: '1px solid #1e3220', color: '#8ac89a' }}>
              <span className="text-[#3ecf6e] font-bold">KEY INSPECT: </span>
              Process Transparency + Founder Voice content converts at 2× the rate of product showcases.
            </div>
          </Card>
          <Card title="Revenue Attribution · CAC Per Channel">
            <div className="text-[10.5px] text-[#555] mt-0.5 mb-2.5" style={{ marginTop: -4 }}>Felix: estimated cost per acquisition by platform</div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {CAC_DATA.map(ch => (
                <div key={ch.platform} className="rounded-lg px-3.5 py-3"
                  style={{ background: ch.highlight ? '#0d1f10' : '#1a1a1a', border: ch.highlight ? '1px solid #2a6040' : '1px solid #2a2a2a' }}>
                  <div className="text-[12px] text-[#888] mb-1 font-medium">{ch.platform}</div>
                  <div className="text-[28px] font-bold tracking-tight text-[#f0f0f0] leading-none mb-1">{ch.value}</div>
                  <div className="text-[11px]" style={{ color: ch.highlight ? '#3ecf6e' : '#555' }}>{ch.note}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <div className="grid gap-2.5 px-5 pt-0 pb-2.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Revenue by Channel">
          <div className="text-[11px] text-[#555] mb-2.5" style={{ marginTop: -4 }}>Social-attributed revenue · 6-week trend by platform</div>
          <ChartCanvas datasets={[
            { color: '#3ecf6e', data: [1200, 1400, 1800, 2200, 2800, 3400] },
            { color: '#6ee7b7', data: [800, 900, 1100, 1300, 1500, 1800] },
            { color: '#a3e635', data: [400, 500, 600, 700, 900, 1100] },
            { color: '#ffffff', data: [300, 350, 400, 420, 460, 520] },
          ]} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6']} yMin={0} yMax={4000} />
        </Card>
        <Card title="Cross-Platform Follower Growth">
          <div className="text-[11px] text-[#555] mb-2.5" style={{ marginTop: -4 }}>All platforms · 6-week trend</div>
          <div className="flex gap-3.5 mb-2">
            {([
              { color: '#ffffff', label: 'Instagram' },
              { color: '#3ecf6e', label: 'LinkedIn' },
              { color: '#6ee7b7', label: 'YouTube' },
              { color: '#a3e635', label: 'TikTok' },
            ]).map(item => (
              <span key={item.label} className="flex items-center gap-1 text-[11px] text-[#888]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />{item.label}
              </span>
            ))}
          </div>
          <ChartCanvas datasets={[
            { color: '#ffffff', data: [800, 900, 1050, 1200, 1400, 1700] },
            { color: '#3ecf6e', data: [200, 250, 280, 320, 380, 450] },
            { color: '#6ee7b7', data: [150, 180, 210, 240, 280, 340] },
            { color: '#a3e635', data: [100, 200, 400, 700, 1100, 1600] },
          ]} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6']} yMin={0} yMax={2000} />
        </Card>
      </div>
      <div className="mx-5 mb-5 rounded-lg overflow-hidden" style={{ background: '#161616', border: '1px solid #232323' }}>
        <div className="px-4 pt-3.5 pb-2.5 border-b border-[#232323]">
          <div className="text-[13px] font-bold tracking-wider text-[#f0f0f0] uppercase">Intelligence Synthesis</div>
          <div className="text-[11px] text-[#555] mt-0.5">Kai · Nate · proactive interpretation</div>
        </div>
        <div className="px-4">
          {SYNTH_ENTRIES.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 py-3.5" style={{ borderBottom: i < SYNTH_ENTRIES.length - 1 ? '1px solid #232323' : 'none' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0"
                style={{ background: entry.bgColor, color: entry.color }}>
                {entry.avatar}
              </div>
              <div>
                <div className="text-[12.5px] font-semibold text-[#f0f0f0]">{entry.name}</div>
                <div className="text-[12.5px] text-[#888] leading-relaxed mt-1">{entry.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#232323]" style={{ background: '#1a1a1a' }}>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#555]">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#3ecf6e' }} />
            KAI · LIVE DATA READ
          </span>
          <span className="text-[12px] font-bold cursor-pointer transition-opacity hover:opacity-70" style={{ color: '#3ecf6e' }}>ASK KAI →</span>
        </div>
      </div>
    </>
  );
}

// ═══ PLATFORM TAB SHARED TEMPLATE ═══
function PlatformTab({
  eyebrow, title, color, metrics, topPosts, chartDatasets, chartLabels, chartYMin, chartYMax,
  insightTitle, insightText, insightColor,
}: {
  eyebrow: string;
  title: string;
  color: string;
  metrics: { label: string; value: string; change: string }[];
  topPosts: TopPost[];
  chartDatasets: ChartDataset[];
  chartLabels: string[];
  chartYMin: number;
  chartYMax: number;
  insightTitle: string;
  insightText: string;
  insightColor: string;
}) {
  return (
    <div className="pb-5">
      {/* Page header */}
      <div className="px-5 pt-4 flex justify-between items-start">
        <div>
          <div className="text-[10.5px] font-semibold tracking-widest text-[#888] uppercase">{eyebrow}</div>
          <div className="text-[28px] font-bold tracking-tight mt-1" style={{ color }}>{title}</div>
        </div>
        <div className="text-right text-[11px] text-[#555] leading-relaxed">
          Platform deep-dive<br />Last refreshed · just now
        </div>
      </div>

      {/* Quick metrics */}
      <div className="px-5 py-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}>
          {metrics.map((m, i) => (
            <div key={i} className="rounded-lg px-3 py-3" style={{ background: '#161616', border: '1px solid #232323' }}>
              <div className="text-[10.5px] text-[#888] mb-1 font-medium">{m.label}</div>
              <div className="text-[24px] font-bold leading-none" style={{ color }}>{m.value}</div>
              <div className="text-[11px] text-[#3ecf6e] mt-1">{m.change}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-2.5 px-5 pb-2.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Engagement Trend">
          <div className="text-[11px] text-[#555] mb-2.5" style={{ marginTop: -4 }}>6-week rolling engagement rate</div>
          <ChartCanvas datasets={chartDatasets} labels={chartLabels} yMin={chartYMin} yMax={chartYMax} height={120} />
        </Card>
        <Card title="Posting Performance">
          <div className="text-[11px] text-[#555] mb-2.5" style={{ marginTop: -4 }}>Views · last 6 weeks</div>
          <ChartCanvas datasets={chartDatasets.slice(0, 2)} labels={chartLabels} yMin={0} yMax={chartYMax * 2} height={120} />
        </Card>
      </div>

      {/* Top Posts */}
      <div className="px-5 pt-1 pb-3">
        <Card title="Top Performing Posts">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5">CONTENT</th>
                <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5">FORMAT</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">VIEWS</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">ENGAGEMENT</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">CTR</th>
                <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((p, i) => (
                <tr key={i} className="border-t border-[#232323]">
                  <td className="py-2">
                    <div className="w-56 overflow-hidden">
                      <div className="text-[12px] font-medium text-[#f0f0f0] truncate">{p.title}</div>
                      <div className="text-[10px] text-[#555]">{p.date}</div>
                    </div>
                  </td>
                  <td className="text-center px-1">
                    <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a' }}>{p.format}</span>
                  </td>
                  <td className="text-center text-[12px] text-[#f0f0f0]">{p.views}</td>
                  <td className="text-center text-[12px] text-[#888]">{p.engages}</td>
                  <td className="text-center text-[12px]" style={{ color: p.ctr > '6%' ? '#3ecf6e' : '#888' }}>{p.ctr}</td>
                  <td className="text-right py-2 pr-4"><Pill style={p.trend}>{p.engages}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Insight */}
      <div className="mx-5 pb-2">
        <div className="rounded p-3 text-[12px] leading-relaxed" style={{ background: `${insightColor}12`, border: `1px solid ${insightColor}30`, color: insightColor }}>
          <span className="font-bold">ANALYST INSIGHT: </span>{insightText}
        </div>
      </div>
    </div>
  );
}

function InstagramTab() {
  return (
    <PlatformTab
      eyebrow="Instagram · Deep Dive"
      title="Instagram Analytics"
      color="#E1306C"
      metrics={[
        { label: 'Followers', value: '14.2K', change: '+8.3% vs last wk' },
        { label: 'Engagement Rate', value: '5.7%', change: '+0.9pp vs last wk' },
        { label: 'Reach', value: '98K', change: '+22% vs last wk' },
        { label: 'Profile Visits', value: '3.4K', change: '+18% vs last wk' },
      ]}
      topPosts={INSTAGRAM_TOP_POSTS}
      chartDatasets={[
        { color: '#E1306C', data: [4.2, 4.5, 4.8, 5.1, 5.4, 5.7] },
        { color: '#C13584', data: [3.1, 3.3, 3.6, 3.8, 4.2, 4.6] },
      ]}
      chartLabels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6']}
      chartYMin={2} chartYMax={7}
      insightTitle="Instagram Insight"
      insightText="Reels are crushing it — averaging 3.2× the reach of static posts. Carousel posts with 5+ slides see 40% higher saves. Shift 60% of content to Reels/carousels."
      insightColor="#E1306C"
    />
  );
}

function LinkedInTab() {
  return (
    <PlatformTab
      eyebrow="LinkedIn · Deep Dive"
      title="LinkedIn Analytics"
      color="#0A66C2"
      metrics={[
        { label: 'Connections', value: '2.8K', change: '+140 this wk' },
        { label: 'Post Impressions', value: '137K', change: '+31% vs last wk' },
        { label: 'Engagement Rate', value: '1.4%', change: '-0.6pp vs last wk' },
        { label: 'Lead Gen Forms', value: '23', change: '+8 vs last wk' },
      ]}
      topPosts={LINKEDIN_TOP_POSTS}
      chartDatasets={[
        { color: '#0A66C2', data: [2.8, 2.5, 2.2, 2.0, 1.7, 1.4] },
        { color: '#5B9BD5', data: [42, 58, 72, 90, 110, 137] },
      ]}
      chartLabels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6']}
      chartYMin={1} chartYMax={150}
      insightTitle="LinkedIn Insight"
      insightText="Founder stories and personal narratives drive 3× engagement vs company posts. Shift to 70% founder-led content. The engagement drop needs investigation — test posting at 7 AM vs 5 PM."
      insightColor="#0A66C2"
    />
  );
}

function TikTokTab() {
  return (
    <PlatformTab
      eyebrow="TikTok · Deep Dive"
      title="TikTok Analytics"
      color="#3ecf6e"
      metrics={[
        { label: 'Followers', value: '8,200', change: '+148% vs last wk' },
        { label: 'Avg Views/Video', value: '142K', change: '+2.4× vs last wk' },
        { label: 'Total Likes', value: '89K', change: '+180% vs last wk' },
        { label: 'Shares', value: '12.4K', change: '+95% vs last wk' },
      ]}
      topPosts={TIKTOK_TOP_POSTS}
      chartDatasets={[
        { color: '#3ecf6e', data: [12, 24, 38, 68, 97, 142] },
        { color: '#6ee7b7', data: [2, 5, 12, 24, 48, 78] },
      ]}
      chartLabels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6']}
      chartYMin={0} chartYMax={160}
      insightTitle="TikTok Insight"
      insightText={'Reply format videos (answering comments/questions) generate 3× more engagement than scripted content. The algorithm rewards authenticity — lean harder into the "raw behind-the-scenes" format. Posting 6–9 AM EST gets 2× reach vs afternoon.'}
      insightColor="#3ecf6e"
    />
  );
}

function ContentTab() {
  return (
    <div className="pb-5">
      <div className="px-5 pt-4 flex justify-between items-start mb-3">
        <div>
          <div className="text-[10.5px] font-semibold tracking-widest text-[#888] uppercase">Content Calendar</div>
          <div className="text-[28px] font-bold tracking-tight mt-1 text-[#a78bfa]">Content Performance</div>
        </div>
        <div className="text-right text-[11px] text-[#555] leading-relaxed">
          Planning &amp; pipeline<br />6 upcoming items
        </div>
      </div>

      {/* Upcoming */}
      <div className="px-5 pb-3">
        <Card title="Upcoming Content">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5">DATE</th>
                <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5">CHANNEL</th>
                <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5">TOPIC</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">FORMAT</th>
                <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {CONTENT_CALENDAR.map((item, i) => (
                <tr key={i} className="border-t border-[#232323]">
                  <td className="py-2 text-[12px] text-[#888]">{item.date}</td>
                  <td className="py-2 text-[12px] text-[#f0f0f0] font-medium">{item.channel}</td>
                  <td className="py-2 text-[12px] text-[#f0f0f0]">{item.topic}</td>
                  <td className="py-2 text-center">
                    <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a' }}>{item.format}</span>
                  </td>
                  <td className="py-2 text-right">
                    <span className="text-[11px] px-2 py-0.5 rounded font-bold"
                      style={{
                        background: item.status === 'Scheduled' ? '#1a3a1a' : item.status === 'Draft' ? '#2a2000' : '#1e2030',
                        color: item.status === 'Scheduled' ? '#4ade80' : item.status === 'Draft' ? '#fbbf24' : '#818cf8',
                      }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Format breakdown */}
      <div className="grid gap-2.5 px-5 pb-2.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Content Format Performance">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5">FORMAT</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">POSTS</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">VIEWS</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">AVG ENG</th>
                <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {CONTENT_PERF.map((f, i) => (
                <tr key={i} className="border-t border-[#232323]">
                  <td className="py-2 text-[12px] font-medium text-[#f0f0f0]">{f.name}</td>
                  <td className="py-2 text-center text-[12px] text-[#888]">{f.posted}</td>
                  <td className="py-2 text-center text-[12px] text-[#f0f0f0]">{f.views}</td>
                  <td className="py-2 text-center text-[12px]" style={{ color: f.avgEng > '5%' ? '#3ecf6e' : '#888' }}>{f.avgEng}</td>
                  <td className="py-2 text-right"><Pill style={f.trend as 'up' | 'down' | 'avg'}>{f.trend === 'up' ? 'Trending ↑' : f.trend === 'down' ? 'Declining' : 'Stable'}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Content Mix Recommendation">
          <div className="space-y-3 mt-1" style={{ marginTop: -4 }}>
            {[
              { label: 'Reels', pct: 45, color: '#3ecf6e' },
              { label: 'Stories', pct: 25, color: '#a78bfa' },
              { label: 'Carousels', pct: 20, color: '#38bdf8' },
              { label: 'Static', pct: 10, color: '#666' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#888]">{item.label}</span>
                  <span className="text-[#f0f0f0] font-semibold">{item.pct}%</span>
                </div>
                <div className="h-[6px] bg-[#2a2a2a] rounded" style={{ overflow: 'hidden' }}>
                  <div className="h-full rounded" style={{ width: `${item.pct * 2}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded p-2.5 mt-3 text-[12px] leading-relaxed" style={{ background: '#1a1020', border: '1px solid #2a1a3a', color: '#c4a8ee' }}>
            Target allocation based on performance data. Reels should dominate — they drive 3.2× the reach with same production effort as static.
          </div>
        </Card>
      </div>

      <div className="mx-5">
        <div className="rounded p-3 text-[12px] leading-relaxed" style={{ background: '#1a102012', border: '1px solid #a78bfa30', color: '#a78bfa' }}>
          <span className="font-bold">KAI · CONTENT INSIGHT: </span>
          Process transparency and founder voice content convert at 2× product showcases. Prioritize educational content that shows the "why" behind the brand.
        </div>
      </div>
    </div>
  );
}

function PortfolioTab() {
  return (
    <div className="pb-5">
      <div className="px-5 pt-4 flex justify-between items-start mb-3">
        <div>
          <div className="text-[10.5px] font-semibold tracking-widest text-[#888] uppercase">Campaigns · Hourbour</div>
          <div className="text-[28px] font-bold tracking-tight mt-1 text-[#fb923c]">Campaign Portfolio</div>
        </div>
        <div className="text-right text-[11px] text-[#555] leading-relaxed">
          3 active/completed campaigns<br />Total revenue: $51.4K
        </div>
      </div>

      {/* Summary pills */}
      <div className="px-5 pb-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'Total Reach', value: '1.04M', sub: 'All campaigns combined' },
            { label: 'Conversion Rate', value: '4.2%', sub: 'Above industry avg · 2.1×' },
            { label: 'Avg CAC', value: '$8.40', sub: 'Down 18% from last quarter' },
            { label: 'ROI', value: '348%', sub: 'Return on ad spend' },
          ].map((m, i) => (
            <div key={i} className="rounded-lg px-3 py-3" style={{ background: '#161616', border: '1px solid #232323' }}>
              <div className="text-[10.5px] text-[#888] mb-1">{m.label}</div>
              <div className="text-[24px] font-bold leading-none text-[#fb923c]">{m.value}</div>
              <div className="text-[10.5px] text-[#555] mt-1">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign list */}
      <div className="px-5 pb-3">
        <Card title="Campaign Breakdown">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5">CAMPAIGN</th>
                <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5">CHANNELS</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">REACH</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">ENG RATE</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">CONV</th>
                <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5">REVENUE</th>
                <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5">RESULT</th>
              </tr>
            </thead>
            <tbody>
              {PORTFOLIO_CAMPAIGNS.map((c, i) => (
                <tr key={i} className="border-t border-[#232323]">
                  <td className="py-2">
                    <div className="text-[12px] font-medium text-[#f0f0f0]">{c.name}</div>
                    <div className="text-[10px] text-[#555]">{c.period}</div>
                  </td>
                  <td className="py-2 text-[11px] text-[#888]">{c.channels}</td>
                  <td className="py-2 text-center text-[12px] text-[#f0f0f0]">{c.reach}</td>
                  <td className="py-2 text-center text-[12px]" style={{ color: c.engRate > '5%' ? '#3ecf6e' : '#888' }}>{c.engRate}</td>
                  <td className="py-2 text-center text-[12px] text-[#888]">{c.conversions}</td>
                  <td className="py-2 text-right text-[12px] font-semibold text-[#f0f0f0]">{c.revenue}</td>
                  <td className="py-2 text-right">
                    <span className="text-[11px] px-2 py-0.5 rounded font-bold"
                      style={{
                        background: c.status === 'Completed' ? '#1a3a1a' : '#2a1a00',
                        color: c.status === 'Completed' ? '#4ade80' : '#fb923c',
                      }}>
                      {c.status}
                    </span>
                    <div className="text-[10px] text-[#888] mt-0.5">{c.result}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid gap-2.5 px-5 pb-2.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Revenue by Campaign">
          <div className="text-[11px] text-[#555] mb-2.5" style={{ marginTop: -4 }}>Attributed revenue · per campaign</div>
          <ChartCanvas datasets={[
            { color: '#fb923c', data: [8, 12, 15, 18, 22, 26] },
            { color: '#fbbf24', data: [5, 8, 10, 14, 18, 15] },
          ]} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6']} yMin={0} yMax={30} />
        </Card>
        <Card title="Channel Effectiveness">
          <div className="text-[11px] text-[#555] mb-2.5" style={{ marginTop: -4 }}>Conversions per channel · last 4 weeks</div>
          <ChartCanvas datasets={[
            { color: '#3ecf6e', data: [200, 340, 480, 620, 890, 1240] },
            { color: '#38bdf8', data: [80, 120, 180, 240, 310, 420] },
          ]} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6']} yMin={0} yMax={1500} />
        </Card>
      </div>

      <div className="mx-5">
        <div className="rounded p-3 text-[12px] leading-relaxed" style={{ background: '#1a100812', border: '1px solid #fb923c30', color: '#fb923c' }}>
          <span className="font-bold">FELIX · PORTFOLIO INSIGHT: </span>
          Transparency Week delivered the best ROI ever at 3× our benchmark. Product-led content underperforms. Recommend making "behind-the-scenes" content 50% of all output.
        </div>
      </div>
    </div>
  );
}

function CompetitorTab() {
  return (
    <div className="pb-5">
      <div className="px-5 pt-4 flex justify-between items-start mb-3">
        <div>
          <div className="text-[10.5px] font-semibold tracking-widest text-[#888] uppercase">Competitor Intelligence</div>
          <div className="text-[28px] font-bold tracking-tight mt-1 text-[#818cf8]">Competitor Analysis</div>
        </div>
        <div className="text-right text-[11px] text-[#555] leading-relaxed">
          3 competitors tracked<br />Updated · daily
        </div>
      </div>

      {/* Scorecard */}
      <div className="px-5 pb-3">
        <Card title="Market Scorecard — Us vs Competitors">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[9.5px] font-bold text-[#555] pb-1.5">METRIC</th>
                <th className="text-center text-[9.5px] font-bold text-[#3ecf6e] pb-1.5">HOURBOUR</th>
                <th className="text-center text-[9.5px] font-bold text-[#555] pb-1.5">COMP AVG</th>
                <th className="text-right text-[9.5px] font-bold text-[#555] pb-1.5">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {MARKET_SCORECARD.map((m, i) => (
                <tr key={i} className="border-t border-[#232323]">
                  <td className="py-2 text-[12px] font-medium text-[#f0f0f0]">{m.metric}</td>
                  <td className="py-2 text-center text-[12px] text-[#3ecf6e] font-semibold">{m.ours}</td>
                  <td className="py-2 text-center text-[12px] text-[#888]">{m.comp}</td>
                  <td className="py-2 text-right">
                    <Pill style={m.status === 'lead' ? 'up' : 'down'}>{m.status === 'lead' ? '✓ Leading' : '⚠ Gap'}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Competitor list */}
      <div className="px-5 pb-3">
        <Card title="Competitor Profiles">
          {COMP_DATA.map((c, i) => (
            <div key={i} className={`py-3 ${i < COMP_DATA.length - 1 ? 'border-b border-[#232323]' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px]"
                    style={{
                      background: i === 0 ? 'linear-gradient(135deg,#f472b6,#db2777)' : i === 1 ? 'linear-gradient(135deg,#38bdf8,#0284c7)' : 'linear-gradient(135deg,#a78bfa,#6d28d9)',
                      color: '#fff',
                    }}>
                    {c.brand[0]}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#f0f0f0]">{c.brand}</div>
                    <div className="text-[10.5px] text-[#555]">{c.followers} followers · +{c.growth} growth</div>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded font-bold"
                  style={{
                    background: c.threat === 'High' ? '#3a1a1a' : '#2a2000',
                    color: c.threat === 'High' ? '#f87171' : '#fbbf24',
                  }}>
                  {c.threat} threat
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2" style={{ paddingLeft: '44px' }}>
                <div className="text-[10.5px] text-[#888]">Eng: <span className="text-[#f0f0f0] font-medium">{c.engRate}</span></div>
                <div className="text-[10.5px] text-[#888]">Freq: <span className="text-[#f0f0f0] font-medium">{c.postFreq}</span></div>
                <div className="text-[10.5px] text-[#888] col-span-2">
                  Weakness: <span className="text-[#f87171] font-medium">{c.weakness}</span>
                </div>
              </div>
              <div className="rounded p-2 ml-11 text-[11px] leading-relaxed" style={{ background: '#0e1018', border: '1px solid #1e2030', color: '#818cf8' }}>
                {c.insight}
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="mx-5">
        <div className="rounded p-3 text-[12px] leading-relaxed" style={{ background: '#1e102012', border: '1px solid #818cf830', color: '#818cf8' }}>
          <span className="font-bold">KAI · COMPETITOR INSIGHT: </span>
          Reformotion is the only real threat in our space — they're strong on transparency and growing 18% MoM. Slow Wear Co has size but is losing engagement. Opportunity: we can out-narrate Slow Wear while competing directly with Reformotion on transparency content.
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────
const TAB_COMPONENTS: Record<string, () => React.ReactElement> = {
  'Overview': OverviewTab,
  'Instagram': InstagramTab,
  'LinkedIn': LinkedInTab,
  'TikTok': TikTokTab,
  'Content': ContentTab,
  'Portfolio': PortfolioTab,
  'Competitor Intel': CompetitorTab,
};
const TAB_INTEL_FILTER: Record<string, string> = {
  'Overview': '', // all
  'Instagram': 'instagram',
  'LinkedIn': 'linkedin',
  'TikTok': 'tiktok',
  'Content': '',
  'Portfolio': '',
  'Competitor Intel': 'competitor',
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const TabComp = TAB_COMPONENTS[activeTab];

  return (
    <div className="overflow-y-auto" style={{ background: '#0b0b0b', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ═══ PAGE HEADER ═══ */}
      <div className="px-5 pt-4 pb-0 flex justify-between items-start">
        <div>
          <div className="text-[10.5px] font-semibold tracking-widest text-[#888] uppercase">Brand Intelligence · Hourbour</div>
          <div className="text-[30px] font-bold tracking-tight text-[#f0f0f0] mt-1">Analytical Dashboard</div>
        </div>
        <div className="text-right text-[11px] text-[#555] leading-relaxed">
          Last updated · 5 Apr 2026<br />Next refresh · 06:00 AM
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex items-center gap-0 px-5 border-b border-[#232323] mt-3">
        {TABS.map(tab => (
          <div
            key={tab}
            className="px-3.5 py-2.5 text-[12.5px] cursor-pointer whitespace-nowrap transition-colors"
            style={{
              color: activeTab === tab ? '#f0f0f0' : '#888',
              borderBottom: activeTab === tab ? '2px solid #3ecf6e' : '2px solid transparent',
              fontWeight: activeTab === tab ? 600 : 400,
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Show intel bars only on Overview */}
      {activeTab === 'Overview' && <IntelBars rows={SHARED_INTEL} />}

      {/* Tab content */}
      {TabComp && <TabComp />}
    </div>
  );
}
