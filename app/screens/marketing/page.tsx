'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GrowthSprintTab from './_growth-sprint';
import CommunityTab from './_community';
import TeamChatTab from './_team-chat';

/* ── Data ── */
const pillars = [
  {
    name: 'Clarity',
    icon: 'visibility',
    description: 'Demystifying financial data without dumbing it down.',
    supportLine: '"See exactly where it goes."',
  },
  {
    name: 'Control',
    icon: 'tune',
    description: 'Giving agency back to the user to make decisive moves.',
    supportLine: '"Your money, your rules."',
  },
  {
    name: 'Trust',
    icon: 'verified_user',
    description: 'Bank-level security presented with absolute transparency.',
    supportLine: '"Built for peace of mind."',
  },
];

const auditRows = [
  { platform: 'Instagram', color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500', photo: 'check', bio: 'check', link: 'check', highlight: 'warn', pinned: 'check' },
  { platform: 'TikTok',    color: 'bg-black border border-white/20',                              photo: 'check', bio: 'check', link: 'cross', highlight: 'na',   pinned: 'warn'  },
  { platform: 'LinkedIn',  color: 'bg-[#0A66C2]',                                                 photo: 'check', bio: 'cross', link: 'check', highlight: 'na',   pinned: 'cross' },
];

const voiceItems = [
  { tone: 'Tone: Direct & Authoritative',  copy: '"Stop wondering where your paycheck went. Tell it where to go."',                                                                               usage: 'Use in: Hero Headlines' },
  { tone: 'Tone: Empathetic & Clear',      copy: "\"We automatically categorize your expenses so you don't have to lift a finger at the end of the month.\"",                                   usage: 'Use in: Feature Explanations' },
  { tone: 'Tone: Urgent & Actionable',     copy: '"Your subscription renewal is approaching. Review it now."',                                                                                   usage: 'Use in: Push Notifications' },
];

const tactics = [
  { title: 'Clarity Elevator',            badge: 'EASY',        badgeColor: 'text-emerald-400 bg-emerald-900/30 border-emerald-800/50', description: 'Distill your core value proposition into a 3-second hook that cuts through market noise instantly.',                                      apply: 'Rewrite homepage hero headline to focus solely on the primary user outcome, removing all technical jargon.',                                    tags: ['Low Effort', 'High Conv.'],    status: { icon: 'schedule', color: 'text-[#8b919f]', label: 'Not started' } },
  { title: 'Marketing Control',           badge: 'HOT',         badgeColor: 'text-rose-400 bg-rose-900/30 border-rose-800/50',         description: 'Seize control of the narrative by creating definitive content that positions competitors relative to you.',                              apply: 'Publish a "vs" matrix page highlighting our organic focus against traditional paid models.',                                                      tags: ['Med Effort', 'High Trust'],    status: { icon: 'check_circle',  color: 'text-emerald-500', label: '40% Complete' } },
  { title: 'Pioneer Content',             badge: 'RISING',      badgeColor: 'text-amber-400 bg-amber-900/30 border-amber-800/50',      description: "Create fundamentally new categories of content that competitors haven't recognized as valuable yet.",                                  apply: 'Launch "Tactical Teardowns" analyzing obscure but highly effective organic campaigns in adjacent industries.',                                    tags: ['High Effort', 'Long Tail'],    status: { icon: 'schedule', color: 'text-[#8b919f]', label: 'Planning phase' } },
  { title: 'Explaining Subscription Waste', badge: 'EASY',      badgeColor: 'text-emerald-400 bg-emerald-900/30 border-emerald-800/50', description: 'Highlight the inefficiency of current market solutions to agitate the problem before presenting your fix.',                             apply: 'Create a LinkedIn carousel showing the ROI decay of typical SaaS marketing stacks over 12 months.',                                              tags: ['Low Effort', 'High Agitation'], status: { icon: 'schedule', color: 'text-[#8b919f]', label: 'Queued' } },
  { title: 'Spend Breakdown',             badge: 'RISING',      badgeColor: 'text-amber-400 bg-amber-900/30 border-amber-800/50',      description: 'Radical transparency regarding resource allocation to build immense trust with skeptical buyers.',                                         apply: 'Publish an open-book review of how we allocate hours across the Tactical Library vs administrative tasks.',                                       tags: ['Med Effort', 'Max Trust'],     status: { icon: 'schedule', color: 'text-[#8b919f]', label: 'Drafting' } },
  { title: 'Social Proof Story',          badge: 'RISING',      badgeColor: 'text-amber-400 bg-amber-900/30 border-amber-800/50',      description: 'Embed testimonials within narrative structures rather than isolated quotes for higher retention.',                                         apply: 'Interview recent successful client and cut into a 3-part micro-documentary for Twitter threads.',                                                 tags: ['Med Effort', 'High Conv.'],    status: { icon: 'check_circle',  color: 'text-emerald-500', label: 'Active run' } },
  { title: 'Creator Trust',               badge: 'ESTABLISHED', badgeColor: 'text-[#8b919f] bg-[#1f1f1f] border-[#414753]',           description: 'Leverage the personal brand of founders or key team members to humanize corporate offerings.',                                           apply: 'Daily 60-second raw voice notes from the lead strategist shared to the private telegram community.',                                             tags: ['Low Effort', 'High Loyalty'],  status: { icon: 'check_circle',  color: 'text-emerald-500', label: 'Ongoing' } },
  { title: 'Tackling Objections',         badge: 'ESTABLISHED', badgeColor: 'text-[#8b919f] bg-[#1f1f1f] border-[#414753]',           description: "Directly address the top reasons prospects don't buy, leaning into vulnerabilities.",                                                   apply: '"Why You Shouldn\'t Hire Us" landing page section filtering out bad fit leads early.',                                                           tags: ['Med Effort', 'Qualifying'],    status: { icon: 'check_circle',  color: 'text-emerald-500', label: 'Deployed' } },
];

const tacticFilters = ['ALL', 'HOT', 'RISING', 'EASY WINS', 'ACTIVE'];

/* ── Helpers ── */
function AuditIcon({ status }: { status: string }) {
  if (status === 'check') return <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>;
  if (status === 'cross') return <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">cancel</span>;
  if (status === 'warn')  return <span className="material-symbols-outlined text-[18px] text-yellow-500">warning</span>;
  return <span className="text-[#8b919f] text-[18px]">—</span>;
}

/* ── Page ── */
export default function MarketingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab]       = useState('Brand Identity');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const tabs = ['Brand Identity', 'Growth Strategy', 'Tactics Library', 'Community', 'Growth Sprint', 'Team'];

  return (
    <main className="pt-14 pb-24 bg-[#131313] text-white min-h-screen">
      <div className="pt-8 px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto space-y-6">

        {/* ── Page Header ── */}
        <header className="flex items-end justify-between pb-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#8b919f] tracking-wide mb-3">
              <span className="hover:text-white cursor-pointer transition-colors">YVON</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-white">Marketing</span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.1em] text-[#8b919f] mb-1 uppercase">Organic Marketing · Hourbour</div>
            <h1 className="text-[40px] font-semibold tracking-tight leading-[1.10] text-white">Marketing</h1>
          </div>
          <div className="flex items-center gap-2 bg-[#1f1f1f] py-1.5 px-3 rounded-full border border-[#353535]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest text-emerald-400">LIVE</span>
          </div>
        </header>

        {/* ── Anomaly Strip ── */}
        <div className="bg-[#2a2a2a] border border-[#414753] rounded-[16px] p-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-[#ffb693] text-[20px] mt-0.5">warning</span>
          <div className="text-[13px] leading-relaxed text-[#c1c6d6]">
            <span className="font-bold text-white tracking-wide">ANOMALIES:</span>{' '}
            Instagram engagement dropped <span className="text-[#ffb693] font-medium">18%</span> vs 7-day avg |{' '}
            YouTube views up <span className="text-emerald-400 font-medium">34%</span> — spike detected
          </div>
        </div>

        {/* ── Hero Card ── */}
        <div className="relative overflow-hidden rounded-[24px] bg-[#1f1f1f] border border-[#353535] shadow-[0_8px_30px_rgba(0,0,0,0.3)] p-10 flex flex-col justify-between min-h-[300px]">
          <div className="absolute -right-32 -bottom-32 w-96 h-96 bg-emerald-900/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-emerald-900/0 via-emerald-500/30 to-emerald-900/0" />
          <div className="relative z-10 max-w-2xl">
            <div className="text-[13px] font-medium text-[#8b919f] mb-4">Organic Marketing Center · Hourbour · 3 priority fixes this week</div>
            <h2 className="text-[34px] font-semibold tracking-tight leading-[1.10] text-white mb-8">
              Marketing. Tighten the story before scaling distribution.
            </h2>
            <div className="flex flex-wrap gap-3 mb-10">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#353535] border border-[#414753] text-[13px] font-medium text-white">
                Momentum Score — <span className="text-emerald-400 ml-1 font-bold">54</span>
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#353535] border border-[#ffb693]/30 text-[13px] font-medium text-white">
                Brand Friction — <span className="text-[#ffb693] ml-1 font-bold">1 blocker</span>
              </span>
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#353535] border border-[#0071e3]/50 text-[13px] font-medium text-white">
                Today&apos;s Priority — TikTok explainer
              </span>
            </div>
          </div>
          <div className="relative z-10">
            <button
              onClick={() => router.push('/screens/war-room?q=Generate+a+brand+brief+for+Hourbour')}
              className="bg-[#0071e3] text-white hover:opacity-90 px-6 py-3 rounded-full text-[14px] font-semibold tracking-wide flex items-center gap-2 active:scale-95 transition-all"
            >
              Generate Brand Brief
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-[#1f1f1f] p-6 rounded-[20px] border border-[#353535] flex flex-col justify-between min-h-[140px]">
            <div className="text-[13px] font-medium text-[#8b919f] mb-2">Momentum Score</div>
            <div className="flex items-end gap-3">
              <span className="text-[36px] font-semibold leading-none text-white tracking-tight">54</span>
              <span className="flex items-center text-emerald-400 text-[14px] font-medium mb-1">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>velocity
              </span>
            </div>
            <div className="text-[12px] text-[#c1c6d6] mt-3">Brand growth velocity index</div>
          </div>
          <div className="bg-[#1f1f1f] p-6 rounded-[20px] border border-[#ffb693]/20 flex flex-col min-h-[140px]">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#ffb693] mb-2">
              <span className="material-symbols-outlined text-[16px]">block</span>Growth Blocker
            </div>
            <div className="text-[15px] leading-[1.47] text-white font-medium">Instagram engagement is down 18% in 3 weeks.</div>
            <div className="text-[12px] text-[#c1c6d6] mt-auto pt-3">Audience retention issue detected.</div>
          </div>
          <div className="bg-[#1f1f1f] p-6 rounded-[20px] border border-[#0071e3]/30 flex flex-col min-h-[140px]">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#abc7ff] mb-2">
              <span className="material-symbols-outlined text-[16px]">flag</span>Today&apos;s Priority
            </div>
            <div className="text-[15px] leading-[1.47] text-white font-medium">Post the subscription audit explainer on TikTok.</div>
            <div className="text-[12px] text-[#c1c6d6] mt-auto pt-3">Draft is ready for review.</div>
          </div>
        </div>

        {/* ── Sub Tabs ── */}
        <div className="flex space-x-6 border-b border-[#353535] overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[14px] font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-emerald-500'
                  : 'text-[#8b919f] hover:text-white/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            TAB: BRAND IDENTITY
        ══════════════════════════════════════════ */}
        {activeTab === 'Brand Identity' && (
          <div className="space-y-6">
            {/* Next Move Strip */}
            <div className="bg-gradient-to-r from-[#353535] to-[#1f1f1f] p-4 rounded-[14px] border border-[#414753] flex items-center gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1 h-full bg-[#0071e3]" />
              <div className="bg-[#131313] p-2 rounded-full border border-[#353535]">
                <span className="material-symbols-outlined text-[#abc7ff] text-[20px]">lightbulb</span>
              </div>
              <div className="text-[14px]">
                <span className="font-bold text-white text-[12px] tracking-wider uppercase mr-2 opacity-80">Next Move:</span>
                <span className="text-[#c1c6d6]">Hourbour&apos;s LinkedIn page has no banner image or about section. This is a missed trust signal.</span>
              </div>
              <button
                onClick={() => router.push('/screens/war-room?q=Fix+Hourbour+LinkedIn+brand+presence')}
                className="ml-auto text-[13px] font-medium text-[#abc7ff] hover:text-white transition-colors flex items-center gap-1 flex-shrink-0"
              >
                Fix now <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* 2-Col Bento */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left */}
              <div className="col-span-7 flex flex-col gap-6">
                {/* Positioning Statement */}
                <div className="bg-[#1f1f1f] rounded-[20px] border border-[#353535] p-8 group relative">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[11px] font-bold tracking-widest text-[#8b919f] uppercase">Positioning Statement</h3>
                    <button className="text-[12px] font-medium text-[#abc7ff] hover:text-white bg-[#131313] py-1.5 px-4 rounded-full border border-[#353535] transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                    </button>
                  </div>
                  <p className="text-[26px] font-medium leading-[1.25] text-white" style={{ letterSpacing: '-0.01em' }}>
                    &ldquo;Hourbour gives people total clarity over their money so they can stop guessing and start deciding.&rdquo;
                  </p>
                </div>

                {/* Brand Pillars */}
                <div>
                  <h3 className="text-[11px] font-bold tracking-widest text-[#8b919f] uppercase mb-4 pl-2">Brand Pillars</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {pillars.map((p) => (
                      <div key={p.name} className="bg-[#1f1f1f] rounded-[16px] p-5 border border-[#353535]">
                        <div className="w-10 h-10 rounded-full bg-[#353535] border border-[#414753] flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-white text-[20px]">{p.icon}</span>
                        </div>
                        <h4 className="text-[16px] font-semibold text-white mb-2">{p.name}</h4>
                        <p className="text-[13px] leading-[1.5] text-[#c1c6d6] mb-4" style={{ minHeight: '60px' }}>{p.description}</p>
                        <div className="text-[11px] font-medium text-[#8b919f] uppercase tracking-wider mb-1">Support Line</div>
                        <div className="text-[12px] text-white italic">{p.supportLine}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="col-span-5 flex flex-col gap-6">
                {/* Brand Presence Audit */}
                <div className="bg-[#1f1f1f] rounded-[20px] border border-[#353535] overflow-hidden">
                  <div className="p-6 border-b border-[#353535] flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-white">Brand Presence Audit</h3>
                    <span className="text-[11px] text-[#8b919f]">Updated 2h ago</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-[#353535] text-[11px] uppercase tracking-wider text-[#8b919f] font-medium">
                        <tr>
                          <th className="px-4 py-3 font-medium">Platform</th>
                          <th className="px-2 py-3 font-medium text-center">Photo</th>
                          <th className="px-2 py-3 font-medium text-center">Bio</th>
                          <th className="px-2 py-3 font-medium text-center">Link</th>
                          <th className="px-2 py-3 font-medium text-center">Highl.</th>
                          <th className="px-2 py-3 font-medium text-center">Pinned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#353535]">
                        {auditRows.map((row) => (
                          <tr key={row.platform} className="hover:bg-[#353535]/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">
                              <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded flex-shrink-0 ${row.color} opacity-80`} />
                                {row.platform}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center"><AuditIcon status={row.photo} /></td>
                            <td className="px-2 py-3 text-center"><AuditIcon status={row.bio} /></td>
                            <td className="px-2 py-3 text-center"><AuditIcon status={row.link} /></td>
                            <td className="px-2 py-3 text-center"><AuditIcon status={row.highlight} /></td>
                            <td className="px-2 py-3 text-center"><AuditIcon status={row.pinned} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Brand Voice Library */}
                <div className="bg-[#1f1f1f] rounded-[20px] border border-[#353535] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#8b919f]">record_voice_over</span>
                      Brand Voice Library
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {voiceItems.map((v, i) => (
                      <div key={i} className="p-4 rounded-[14px] bg-[#131313] border border-[#414753]/30 hover:border-[#414753] transition-colors">
                        <div className="text-[11px] font-bold text-[#8b919f] uppercase tracking-wider mb-2">{v.tone}</div>
                        <p className="text-[13px] text-[#c1c6d6] italic mb-2">{v.copy}</p>
                        <span className="text-[11px] text-[#8b919f] px-2 py-0.5 rounded bg-[#353535]">{v.usage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: TACTICS LIBRARY
        ══════════════════════════════════════════ */}
        {activeTab === 'Tactics Library' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {tacticFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`text-[12px] px-4 py-1.5 rounded-full font-medium transition-all ${
                      activeFilter === f
                        ? 'bg-[#353535] text-white border border-[#414753]'
                        : 'bg-transparent text-[#8b919f] hover:text-white border border-transparent hover:border-[#414753]/50 hover:bg-[#1f1f1f]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="text-[13px] text-[#8b919f] font-medium">12 tactics</div>
            </div>

            {/* Section Label */}
            <div>
              <h3 className="text-[11px] font-bold tracking-widest text-[#c1c6d6] uppercase mb-1">Tactics Library</h3>
              <p className="text-[#8b919f] text-[12px]">Repeatable growth plays ranked by relevance and expected payoff.</p>
            </div>

            {/* Tactic Cards Grid */}
            <div className="grid grid-cols-4 gap-5 pb-12">
              {tactics.map((t) => (
                <div key={t.title} className="bg-[#18181a] border border-[#353535]/60 rounded-[16px] p-5 flex flex-col hover:border-[#414753] transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-[14px] font-semibold text-white leading-tight w-2/3">{t.title}</h4>
                    <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border ${t.badgeColor}`}>{t.badge}</span>
                  </div>
                  <p className="text-[12px] text-[#8b919f] mb-4 flex-grow leading-relaxed">{t.description}</p>
                  <div className="h-px w-full bg-[#353535] mb-4" />
                  <div className="mb-4">
                    <div className="text-[9px] font-semibold text-[#8b919f] tracking-wider mb-2 uppercase">How to Apply — Hourbour</div>
                    <p className="text-[11px] text-[#c1c6d6] line-clamp-2">{t.apply}</p>
                  </div>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {t.tags.map((tag) => (
                      <span key={tag} className="bg-[#1f1f1f] border border-[#353535] text-[#8b919f] text-[10px] px-2 py-0.5 rounded-sm">{tag}</span>
                    ))}
                  </div>
                  <div className={`text-[10px] flex items-center mt-auto ${t.status.color}`}>
                    <span className="material-symbols-outlined text-[12px] mr-1">{t.status.icon}</span>
                    {t.status.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: GROWTH STRATEGY
        ══════════════════════════════════════════ */}
        {activeTab === 'Growth Strategy' && (
          <div className="space-y-6">

            {/* North Star */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-5">
              {[
                { label: 'North Star', value: 'Monthly Active Users', sub: 'MAU drives all decisions', color: 'text-[#abc7ff]' },
                { label: 'Current MAU', value: '1,240', sub: '+18% MoM — on track', color: 'text-emerald-400' },
                { label: 'MAU Target', value: '2,000', sub: 'End of this sprint cycle', color: 'text-white' },
                { label: 'Gap to Close', value: '760', sub: '38% remaining · 14 days', color: 'text-[#ffb693]' },
              ].map((c) => (
                <div key={c.label} className="bg-[#1f1f1f] border border-[#353535] rounded-[18px] p-5">
                  <div className="text-[10px] font-bold text-[#8b919f] uppercase tracking-widest mb-2">{c.label}</div>
                  <div className={`text-[26px] font-semibold leading-none mb-1 ${c.color}`} style={{ letterSpacing: '-0.02em' }}>{c.value}</div>
                  <div className="text-[11px] text-[#8b919f]">{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Two-col: Funnel + Leverage Actions */}
            <div className="grid grid-cols-[380px_1fr] gap-5">

              {/* Funnel Health */}
              <div className="bg-[#1f1f1f] border border-[#353535] rounded-[20px] p-6">
                <h3 className="text-[13px] font-semibold text-white mb-5">Funnel Health</h3>
                <div className="space-y-3">
                  {[
                    { stage: 'Awareness',    value: 48200, max: 60000, pct: 80, color: 'bg-[#abc7ff]',    gap: null },
                    { stage: 'Interest',     value: 9640,  max: 60000, pct: 16, color: 'bg-amber-400',    gap: '80% drop-off — top leak' },
                    { stage: 'Trial',        value: 3210,  max: 60000, pct: 5,  color: 'bg-emerald-400',  gap: '67% drop-off' },
                    { stage: 'Paid',         value: 1240,  max: 60000, pct: 2,  color: 'bg-[#0071e3]',    gap: '61% drop-off' },
                  ].map((f) => (
                    <div key={f.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium text-white">{f.stage}</span>
                        <span className="text-[11px] font-bold text-white">{f.value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-[#353535] rounded-full overflow-hidden mb-1">
                        <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                      </div>
                      {f.gap && (
                        <span className="text-[10px] text-[#ffb693]">⚠ {f.gap}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-[#131313] border border-[#ffb693]/20 rounded-[12px]">
                  <p className="text-[11px] text-[#ffb693] font-medium">Biggest leak: Awareness → Interest</p>
                  <p className="text-[11px] text-[#8b919f] mt-1">Fix: Hook quality and CTA clarity on all organic posts</p>
                </div>
              </div>

              {/* Top 3 Leverage Actions */}
              <div className="bg-[#1f1f1f] border border-[#353535] rounded-[20px] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xl">🚀</span>
                  <h3 className="text-[13px] font-semibold text-white">Nate&apos;s Top 3 Leverage Actions</h3>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      rank: '01',
                      label: 'Quick Win',
                      rankColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      action: 'Add a friction-free "Save Report" CTA inside the app after every expense sync',
                      hypothesis: 'IF we add in-app share trigger THEN referral installs will increase by 25% BECAUSE users share wins organically when prompted at peak satisfaction.',
                      effort: 'Low effort',
                      impact: 'High impact',
                    },
                    {
                      rank: '02',
                      label: 'Big Bet',
                      rankColor: 'text-[#abc7ff] bg-[#0071e3]/10 border-[#0071e3]/20',
                      action: 'Launch a 14-day "Spending Clarity Challenge" — daily micro-prompts via Telegram + TikTok',
                      hypothesis: 'IF we run a public challenge THEN trial signups will increase by 40% BECAUSE challenge-based content consistently outperforms passive posts by 3-5× in fintech.',
                      effort: 'Med effort',
                      impact: 'Max reach',
                    },
                    {
                      rank: '03',
                      label: 'Kill',
                      rankColor: 'text-[#ffb693] bg-[#ffb693]/10 border-[#ffb693]/20',
                      action: 'Stop posting generic "financial tips" carousels — engagement rate is 0.4%, below kill threshold',
                      hypothesis: 'Reallocating this production time to short-form video will yield 4× the reach for the same effort.',
                      effort: 'Saves time',
                      impact: 'Frees capacity',
                    },
                  ].map((a) => (
                    <div key={a.rank} className="flex gap-4 p-4 bg-[#131313] border border-[#353535]/60 rounded-[14px] hover:border-[#414753] transition-colors">
                      <div className="flex-shrink-0">
                        <span className={`text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-full border block text-center ${a.rankColor}`}>
                          {a.label}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white mb-2">{a.action}</p>
                        <p className="text-[11px] text-[#8b919f] italic leading-relaxed mb-2">&ldquo;{a.hypothesis}&rdquo;</p>
                        <div className="flex gap-2">
                          <span className="text-[10px] text-[#8b919f] bg-[#1f1f1f] border border-[#353535] px-2 py-0.5 rounded-sm">{a.effort}</span>
                          <span className="text-[10px] text-[#8b919f] bg-[#1f1f1f] border border-[#353535] px-2 py-0.5 rounded-sm">{a.impact}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Channel Benchmarks + Experiment Queue */}
            <div className="grid grid-cols-[1fr_380px] gap-5">

              {/* Channel Benchmarks */}
              <div className="bg-[#1f1f1f] border border-[#353535] rounded-[20px] overflow-hidden">
                <div className="p-6 border-b border-[#353535]">
                  <h3 className="text-[13px] font-semibold text-white">Channel Health vs Benchmarks</h3>
                  <p className="text-[11px] text-[#8b919f] mt-0.5">Rio&apos;s framework — underinvested channels flagged</p>
                </div>
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#353535] text-[10px] uppercase tracking-widest text-[#8b919f]">
                    <tr>
                      <th className="px-5 py-3 font-medium">Channel</th>
                      <th className="px-4 py-3 font-medium">Metric</th>
                      <th className="px-4 py-3 font-medium">Current</th>
                      <th className="px-4 py-3 font-medium">Target</th>
                      <th className="px-4 py-3 font-medium">Gap</th>
                      <th className="px-4 py-3 font-medium">Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#353535]">
                    {[
                      { ch: 'Instagram', metric: 'Engagement rate', current: '1.1%', target: '2.5%', gap: '-1.4pp', signal: 'Under', sigColor: 'text-[#ffb693]' },
                      { ch: 'TikTok',    metric: 'View retention',  current: '38%',  target: '50%',  gap: '-12pp',  signal: 'Under', sigColor: 'text-[#ffb693]' },
                      { ch: 'LinkedIn',  metric: 'Eng. rate',       current: '3.8%', target: '3%',   gap: '+0.8pp', signal: 'Over',  sigColor: 'text-emerald-400' },
                      { ch: 'YouTube',   metric: 'CTR',             current: '5.4%', target: '4%',   gap: '+1.4pp', signal: 'Over',  sigColor: 'text-emerald-400' },
                    ].map((r) => (
                      <tr key={r.ch} className="hover:bg-[#353535]/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-white">{r.ch}</td>
                        <td className="px-4 py-3 text-[#8b919f]">{r.metric}</td>
                        <td className="px-4 py-3 text-white font-medium">{r.current}</td>
                        <td className="px-4 py-3 text-[#8b919f]">{r.target}</td>
                        <td className="px-4 py-3 text-white">{r.gap}</td>
                        <td className={`px-4 py-3 text-[11px] font-bold ${r.sigColor}`}>{r.signal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Experiment Queue */}
              <div className="bg-[#1f1f1f] border border-[#353535] rounded-[20px] p-6">
                <h3 className="text-[13px] font-semibold text-white mb-4">Experiment Queue</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Hook A/B Test', status: 'Running', statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', days: '7 days left', desc: 'Question vs statement hook on TikTok' },
                    { name: 'Spending Challenge', status: 'Queued', statusColor: 'text-[#abc7ff] bg-[#0071e3]/10 border-[#0071e3]/20', days: 'Starts Monday', desc: '14-day series across Telegram + TikTok' },
                    { name: 'LinkedIn Carousel', status: 'Draft', statusColor: 'text-[#8b919f] bg-white/5 border-white/10', days: '—', desc: 'ROI decay of typical SaaS stacks' },
                  ].map((e) => (
                    <div key={e.name} className="p-4 bg-[#131313] border border-[#353535]/60 rounded-[14px]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-medium text-white">{e.name}</span>
                        <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full border ${e.statusColor}`}>{e.status}</span>
                      </div>
                      <p className="text-[11px] text-[#8b919f] mb-1">{e.desc}</p>
                      <p className="text-[10px] text-[#8b919f]/60">{e.days}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: COMMUNITY
        ══════════════════════════════════════════ */}
        {activeTab === 'Community' && <CommunityTab />}

        {/* ══════════════════════════════════════════
            TAB: GROWTH SPRINT
        ══════════════════════════════════════════ */}
        {activeTab === 'Growth Sprint' && <GrowthSprintTab />}

        {/* ══════════════════════════════════════════
            TAB: TEAM
        ══════════════════════════════════════════ */}
        {activeTab === 'Team' && <TeamChatTab />}

        {/* Continuation cue */}
        <div className="flex justify-center pt-8 pb-12 opacity-30">
          <div className="w-px h-16 bg-gradient-to-b from-[#8b919f] to-transparent" />
        </div>

      </div>
    </main>
  );
}
