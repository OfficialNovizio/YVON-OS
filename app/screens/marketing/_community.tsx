'use client';

import { useState, useCallback } from 'react';
import { G1, I1, I1c, I1d, L1, G2, I2, I2d, G3, I3c, I3d, G4, I4d, ACCENT, INK_4 } from './_glass-tokens'

// ── Static data ──────────────────────────────────────────────────────────────────
const platforms = [
  { name: 'Telegram',     icon: '✈️', members: 312, growth: '+18 this week', growthUp: true,  engagement: '64%',  engUp: true,  status: 'ACTIVE',  statusColor: '#34d399', statusBg: 'rgba(52,211,153,0.12)',  description: 'Core inner circle. Daily voice notes from the founder.' },
  { name: 'LinkedIn Group',icon: '💼', members: 841, growth: '+55 this week', growthUp: true,  engagement: '2.1%', engUp: false, status: 'GROWING', statusColor: '#fbbf24', statusBg: 'rgba(251,191,36,0.12)',  description: 'B2B audience. Weekly founder insights post.' },
  { name: 'Discord',      icon: '🎮', members: 128, growth: '+3 this week',  growthUp: true,  engagement: '41%',  engUp: true,  status: 'SEED',    statusColor: '#5ba8ff', statusBg: `${ACCENT}18`,           description: 'Power users. Bug reports & feature voting.' },
];

const ambassadors = [
  { handle: '@clara.finance', platform: 'Instagram', followers: '24K',  posts: 12, reach: '180K', status: 'Active' },
  { handle: '@paulbudgets',   platform: 'TikTok',    followers: '61K',  posts: 7,  reach: '420K', status: 'Active' },
  { handle: '@shreya_saves',  platform: 'LinkedIn',  followers: '8.2K', posts: 4,  reach: '32K',  status: 'Warm'   },
  { handle: '@moneyreal.yt',  platform: 'YouTube',   followers: '19K',  posts: 2,  reach: '95K',  status: 'Warm'   },
];

const ugcQueue = [
  { handle: '@olivia_tracks', platform: 'TikTok',    quote: '"Hourbour literally changed how I look at my paycheck."',     views: '48K', age: '2h ago',  status: 'Hot'    },
  { handle: '@ben_finance',   platform: 'Instagram', quote: '"Finally a budgeting app that doesn\'t feel like homework."',  views: '12K', age: '6h ago',  status: 'Rising' },
  { handle: '@jasmine.cfo',   platform: 'LinkedIn',  quote: '"Showed my CFO. He asked which firm built this."',             views: '3.2K', age: '1d ago', status: 'New'    },
];

const ugcStatusConfig: Record<string, { color: string; bg: string }> = {
  Hot:    { color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
  Rising: { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)'  },
  New:    { color: I1d,       bg: L1                        },
};

// ── Main component ────────────────────────────────────────────────────────────────
export default function CommunityTab() {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const generatePrompts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/growth-sprint', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          phase:   'message',
          venture: 'Hourbour',
          message: 'Write 5 community engagement prompts for our Telegram group this week — questions or challenges that get members to share a screenshot, confess a money habit, or tag a friend. Make each one specific to fintech users. Numbered list only, no intro.',
        }),
      });

      if (!res.ok || !res.body) { setError('API error'); setLoading(false); return; }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '', full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          try {
            const evt = JSON.parse(raw) as Record<string, unknown>;
            if (evt.type === 'stream_chunk') full += evt.content as string;
            if (evt.type === 'agent_message') full = evt.content as string;
          } catch { /* skip */ }
        }
      }

      const parsed = full
        .split(/\n/)
        .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(l => l.length > 20)
        .slice(0, 5);

      setPrompts(parsed.length > 0 ? parsed : [full.trim()]);
    } catch {
      setError('Failed to generate prompts');
    }
    setLoading(false);
  }, []);

  const totalMembers = platforms.reduce((s, p) => s + p.members, 0);

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: INK_4, margin: '0 0 6px' }}>Community Hub</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Real people who talk about Hourbour.</h2>
          <p style={{ fontSize: 13, color: I1d, margin: '4px 0 0' }}>Capture, amplify, seed.</p>
        </div>
        <div className="text-right">
          <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 36, fontWeight: 700, color: I1, letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>{totalMembers.toLocaleString()}</p>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: I1d, margin: '4px 0 0' }}>Total community</p>
        </div>
      </div>

      {/* ── Platform Cards — G4 Prism ──────────────────────────────────────────── */}
      <section>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: INK_4, margin: '0 0 16px' }}>Platforms</p>
        <div className="grid grid-cols-3 gap-5">
          {platforms.map(p => (
            <div key={p.name} style={{ ...G4, padding: 24 }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: I4d.replace('0.48', '0.85') }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, padding: '4px 10px', borderRadius: 999, background: p.statusBg, color: p.statusColor }}>{p.status}</span>
              </div>
              <div className="flex items-end gap-3 mb-1">
                <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: '#2a1240', lineHeight: 1 }}>{p.members.toLocaleString()}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: p.growthUp ? '#059669' : '#e11d48', marginBottom: 2 }}>{p.growth}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontSize: 11, color: I4d }}>Engagement rate</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: p.engUp ? '#059669' : '#d97706' }}>{p.engagement}</span>
              </div>
              <p style={{ fontSize: 11, color: I4d, lineHeight: 1.55, margin: 0 }}>{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── UGC Pipeline + Right Column ────────────────────────────────────────── */}
      <section className="grid grid-cols-[1fr_380px] gap-6">

        {/* UGC Pipeline — G1 */}
        <div style={{ ...G1, padding: 24 }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I1d, margin: '0 0 4px' }}>UGC · Voice Capture</p>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Voice Capture Pipeline</h3>
              <p style={{ fontSize: 11, color: I1d, margin: '2px 0 0' }}>UGC spotted in the wild — seed these back into your feed</p>
            </div>
            <button style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}20`, padding: '6px 14px', borderRadius: 999, cursor: 'pointer' }}>
              + Add source
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {ugcQueue.map((u, i) => {
              const sc = ugcStatusConfig[u.status] ?? ugcStatusConfig['New'];
              return (
                <div key={i} style={{ background: L1, borderRadius: 14, padding: 16 }} className="hover:bg-black/[0.04] transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p style={{ fontSize: 13, color: I1c, fontStyle: 'italic', lineHeight: 1.5, flexGrow: 1, margin: 0 }}>{u.quote}</p>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', padding: '3px 8px', borderRadius: 999, background: sc.bg, color: sc.color, flexShrink: 0 }}>{u.status}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span style={{ fontSize: 11, fontWeight: 600, color: I1d }}>{u.handle}</span>
                    <span style={{ color: L1 }}>·</span>
                    <span style={{ fontSize: 11, color: I1d }}>{u.platform}</span>
                    <span style={{ color: L1 }}>·</span>
                    <span style={{ fontSize: 11, color: I1d }}>{u.views} views</span>
                    <span style={{ color: L1 }}>·</span>
                    <span style={{ fontSize: 11, color: I1d }}>{u.age}</span>
                    <div className="flex gap-3 ml-auto">
                      <button style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Repost</button>
                      <button style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Amplify</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl text-center" style={{ border: `1px dashed ${L1}` }}>
            <p style={{ fontSize: 11, color: I1d, margin: 0 }}>Set up monitoring: connect Apify social scraper to auto-pull mentions every 6h</p>
          </div>
        </div>

        {/* Right col — Ambassadors + Prompt Generator */}
        <div className="flex flex-col gap-5">

          {/* Top Ambassadors — G1 */}
          <div style={{ ...G1, padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I1d, margin: '0 0 4px' }}>Community</p>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: '0 0 16px' }}>Top Ambassadors</h3>
            <div className="flex flex-col gap-3">
              {ambassadors.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span style={{ fontSize: 11, color: I1d, fontFamily: 'ui-monospace,monospace', width: 16, flexShrink: 0 }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 12, fontWeight: 600, color: I1, margin: '0 0 1px' }}>{a.handle}</p>
                    <p style={{ fontSize: 10, color: I1d, margin: 0 }}>{a.platform} · {a.followers} followers</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p style={{ fontSize: 12, fontWeight: 600, color: I1, margin: '0 0 1px' }}>{a.reach}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: a.status === 'Active' ? '#059669' : '#d97706', margin: 0 }}>{a.status}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 active:scale-95"
              style={{ fontSize: 11, color: I1d, background: L1, border: `1px solid ${L1}`, padding: '8px 0', borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}>
              + Nominate ambassador
            </button>
          </div>

          {/* Engagement Prompt Generator — G2 Azure Tint */}
          <div style={{ ...G2, padding: 24 }} className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I2d, margin: '0 0 4px' }}>Lena · Content</p>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: I2, margin: 0 }}>Engagement Prompts</h3>
                <p style={{ fontSize: 11, color: I2d, margin: '2px 0 0' }}>Lena writes prompts for your Telegram group</p>
              </div>
              <span style={{ fontSize: 18 }}>✍️</span>
            </div>

            {prompts.length === 0 && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: I2d }}>chat_bubble_outline</span>
                </div>
                <p style={{ fontSize: 12, color: I2d, maxWidth: 200, lineHeight: 1.6, margin: 0 }}>
                  Generate community prompts that get members talking
                </p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex items-center justify-center gap-2 py-4">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            {error && <p style={{ fontSize: 11, color: '#f87171', padding: '8px 0', margin: 0 }}>{error}</p>}

            {prompts.length > 0 && (
              <div className="flex-1 mb-4 overflow-y-auto flex flex-col gap-2" style={{ maxHeight: 240 }}>
                {prompts.map((prompt, i) => (
                  <div key={i} className="flex items-start gap-3 group" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: I2d, width: 16, marginTop: 1, flexShrink: 0 }}>{i + 1}</span>
                    <p style={{ fontSize: 12, color: I2, lineHeight: 1.55, flexGrow: 1, margin: 0 }}>{prompt}</p>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ fontSize: 10, fontWeight: 700, color: I2d, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => void generatePrompts()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 active:scale-95 mt-auto"
              style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.14em', padding: '10px 0', borderRadius: 999, border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
              {loading ? (
                <><span className="w-1 h-1 rounded-full bg-white animate-pulse" />Lena is writing...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
                {prompts.length > 0 ? 'Regenerate Prompts' : 'Generate Prompts'}</>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── UGC Seeding Loop — G3 ──────────────────────────────────────────────── */}
      <section>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: INK_4, margin: '0 0 16px' }}>UGC Seeding Loop</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: 'record_voice_over',  step: '01', label: 'Capture',   desc: 'Monitor mentions every 6h via Apify scraper across all platforms' },
            { icon: 'thumb_up',           step: '02', label: 'Validate',  desc: 'Flag posts with >500 views or >2% engagement for amplification' },
            { icon: 'volunteer_activism', step: '03', label: 'Seed Back', desc: 'Repost to Stories, embed in newsletter, share in Telegram' },
            { icon: 'trending_up',        step: '04', label: 'Amplify',   desc: 'Boost posts hitting 2× benchmark — $20 minimum, 24h window' },
          ].map(s => (
            <div key={s.step} style={{ ...G3, padding: 20 }}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 10, fontWeight: 700, color: I3d, fontFamily: 'ui-monospace,monospace' }}>{s.step}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5ba8ff' }}>{s.icon}</span>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5fb', margin: '0 0 6px' }}>{s.label}</h4>
              <p style={{ fontSize: 11, color: I3c, lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
