'use client';

import { useState, useCallback } from 'react';

/* ── Static data ── */
const platforms = [
  {
    name: 'Telegram',
    icon: '✈️',
    members: 312,
    growth: '+18 this week',
    growthUp: true,
    engagement: '64%',
    engColor: 'text-emerald-400',
    status: 'ACTIVE',
    statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Core inner circle. Daily voice notes from the founder.',
  },
  {
    name: 'LinkedIn Group',
    icon: '💼',
    members: 841,
    growth: '+55 this week',
    growthUp: true,
    engagement: '2.1%',
    engColor: 'text-[#ffb693]',
    status: 'GROWING',
    statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    description: 'B2B audience. Weekly founder insights post.',
  },
  {
    name: 'Discord',
    icon: '🎮',
    members: 128,
    growth: '+3 this week',
    growthUp: true,
    engagement: '41%',
    engColor: 'text-emerald-400',
    status: 'SEED',
    statusColor: 'text-[#abc7ff] bg-[#0071e3]/10 border-[#0071e3]/20',
    description: 'Power users. Bug reports & feature voting.',
  },
];

const ambassadors = [
  { handle: '@clara.finance', platform: 'Instagram', followers: '24K', posts: 12, reach: '180K', status: 'Active' },
  { handle: '@paulbudgets',   platform: 'TikTok',    followers: '61K', posts: 7,  reach: '420K', status: 'Active' },
  { handle: '@shreya_saves',  platform: 'LinkedIn',  followers: '8.2K',posts: 4,  reach: '32K',  status: 'Warm'   },
  { handle: '@moneyreal.yt',  platform: 'YouTube',   followers: '19K', posts: 2,  reach: '95K',  status: 'Warm'   },
];

const ugcQueue = [
  { handle: '@olivia_tracks', platform: 'TikTok',    quote: '"Hourbour literally changed how I look at my paycheck."',     views: '48K', age: '2h ago',  status: 'Hot' },
  { handle: '@ben_finance',   platform: 'Instagram', quote: '"Finally a budgeting app that doesn\'t feel like homework."', views: '12K', age: '6h ago',  status: 'Rising' },
  { handle: '@jasmine.cfo',   platform: 'LinkedIn',  quote: '"Showed my CFO. He asked which firm built this."',             views: '3.2K',age: '1d ago',  status: 'New' },
];

const statusColor: Record<string, string> = {
  Hot:    'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Rising: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  New:    'text-[#8b919f] bg-white/5 border-white/10',
};

const ambassadorStatus: Record<string, string> = {
  Active: 'text-emerald-400',
  Warm:   'text-amber-400',
};

/* ── Main component ── */
export default function CommunityTab() {
  const [prompts, setPrompts]   = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

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
      let buf = '';
      let full = '';

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

      // Parse numbered list
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
    <div className="space-y-6">

      {/* ── Community Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>Community Hub</h2>
          <p className="text-[12px] text-[#8b919f] mt-0.5">Real people who talk about Hourbour — capture, amplify, seed.</p>
        </div>
        <div className="text-right">
          <div className="text-[32px] font-semibold text-white leading-none" style={{ letterSpacing: '-0.03em' }}>
            {totalMembers.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#8b919f] mt-0.5 uppercase tracking-widest">Total community</div>
        </div>
      </div>

      {/* ── Platform Cards ── */}
      <div className="grid grid-cols-3 gap-5">
        {platforms.map((p) => (
          <div key={p.name} className="bg-[#1f1f1f] border border-[#353535] rounded-[20px] p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.icon}</span>
                <span className="text-[15px] font-semibold text-white">{p.name}</span>
              </div>
              <span className={`text-[9px] font-bold tracking-widest px-2 py-1 rounded-full border ${p.statusColor}`}>
                {p.status}
              </span>
            </div>
            <div className="flex items-end gap-3 mb-1">
              <span className="text-[28px] font-semibold text-white leading-none">{p.members.toLocaleString()}</span>
              <span className={`text-[12px] font-medium mb-0.5 ${p.growthUp ? 'text-emerald-400' : 'text-[#ffb693]'}`}>
                {p.growth}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] text-[#8b919f]">Engagement rate</span>
              <span className={`text-[11px] font-bold ${p.engColor}`}>{p.engagement}</span>
            </div>
            <p className="text-[11px] text-[#8b919f] leading-relaxed">{p.description}</p>
          </div>
        ))}
      </div>

      {/* ── Two-col: UGC + Ambassadors ── */}
      <div className="grid grid-cols-[1fr_380px] gap-5">

        {/* UGC Pipeline */}
        <div className="bg-[#1f1f1f] border border-[#353535] rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[13px] font-semibold text-white">Voice Capture Pipeline</h3>
              <p className="text-[11px] text-[#8b919f] mt-0.5">UGC spotted in the wild — seed these back into your feed</p>
            </div>
            <button className="text-[11px] text-[#abc7ff] bg-[#0071e3]/10 border border-[#0071e3]/20 px-3 py-1.5 rounded-full hover:bg-[#0071e3]/20 transition-colors">
              + Add source
            </button>
          </div>

          <div className="space-y-3">
            {ugcQueue.map((u, i) => (
              <div key={i} className="bg-[#131313] border border-[#353535]/60 rounded-[14px] p-4 hover:border-[#414753] transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-[13px] text-[#c1c6d6] italic leading-snug flex-1">{u.quote}</p>
                  <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColor[u.status]}`}>
                    {u.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-white/60">{u.handle}</span>
                  <span className="text-[#353535]">·</span>
                  <span className="text-[11px] text-[#8b919f]">{u.platform}</span>
                  <span className="text-[#353535]">·</span>
                  <span className="text-[11px] text-[#8b919f]">{u.views} views</span>
                  <span className="text-[#353535]">·</span>
                  <span className="text-[11px] text-[#8b919f]">{u.age}</span>
                  <div className="flex gap-2 ml-auto">
                    <button className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Repost</button>
                    <button className="text-[10px] text-[#abc7ff] hover:text-white font-medium transition-colors">Amplify</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-[#131313] border border-dashed border-[#414753] rounded-[12px] text-center">
            <p className="text-[11px] text-[#8b919f]">
              Set up monitoring: connect Apify social scraper to auto-pull mentions every 6h
            </p>
          </div>
        </div>

        {/* Right col: Ambassadors + Prompt Generator */}
        <div className="flex flex-col gap-5">

          {/* Top Ambassadors */}
          <div className="bg-[#1f1f1f] border border-[#353535] rounded-[20px] p-6">
            <h3 className="text-[13px] font-semibold text-white mb-4">Top Ambassadors</h3>
            <div className="space-y-3">
              {ambassadors.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#8b919f] font-mono w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-white truncate">{a.handle}</p>
                    <p className="text-[10px] text-[#8b919f]">{a.platform} · {a.followers} followers</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-medium text-white">{a.reach}</p>
                    <p className={`text-[10px] font-medium ${ambassadorStatus[a.status]}`}>{a.status}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-[11px] text-[#8b919f] bg-[#131313] border border-[#353535] py-2 rounded-full hover:text-white hover:border-[#414753] transition-all">
              + Nominate ambassador
            </button>
          </div>

          {/* Engagement Prompt Generator */}
          <div className="bg-[#1f1f1f] border border-[#353535] rounded-[20px] p-6 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-white">Engagement Prompts</h3>
                <p className="text-[11px] text-[#8b919f] mt-0.5">Lena writes prompts for your Telegram group</p>
              </div>
              <span className="text-lg">✍️</span>
            </div>

            {prompts.length === 0 && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <div className="w-10 h-10 rounded-full bg-[#131313] border border-[#353535] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[18px] text-[#8b919f]">chat_bubble_outline</span>
                </div>
                <p className="text-[12px] text-[#8b919f] max-w-[200px] leading-relaxed">
                  Generate community prompts that get members talking
                </p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex items-center justify-center gap-2 py-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#abc7ff] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#abc7ff] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#abc7ff] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            {error && (
              <p className="text-[11px] text-[#ffb693] py-2">{error}</p>
            )}

            {prompts.length > 0 && (
              <div className="flex-1 space-y-2 mb-4 overflow-y-auto max-h-[240px]">
                {prompts.map((prompt, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#131313] border border-[#353535]/60 rounded-[12px] hover:border-[#414753] transition-colors group">
                    <span className="text-[10px] font-bold text-[#8b919f] w-4 mt-0.5 flex-shrink-0">{i + 1}</span>
                    <p className="text-[12px] text-[#c1c6d6] leading-relaxed flex-1">{prompt}</p>
                    <button className="text-[10px] text-[#8b919f] hover:text-[#abc7ff] opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 font-medium">
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => void generatePrompts()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0071e3] text-white py-2.5 rounded-full text-[12px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 mt-auto"
            >
              {loading ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  Lena is writing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  {prompts.length > 0 ? 'Regenerate Prompts' : 'Generate Prompts'}
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ── UGC Seeding Strategy ── */}
      <div className="bg-[#1f1f1f] border border-[#353535] rounded-[20px] p-6">
        <h3 className="text-[13px] font-semibold text-white mb-4">UGC Seeding Loop</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: 'record_voice_over', step: '01', label: 'Capture', desc: 'Monitor mentions every 6h via Apify scraper across all platforms' },
            { icon: 'thumb_up',          step: '02', label: 'Validate', desc: 'Flag posts with >500 views or >2% engagement for amplification' },
            { icon: 'volunteer_activism', step: '03', label: 'Seed Back', desc: 'Repost to Stories, embed in newsletter, share in Telegram' },
            { icon: 'trending_up',       step: '04', label: 'Amplify', desc: 'Boost posts hitting 2× benchmark — $20 minimum, 24h window' },
          ].map((s) => (
            <div key={s.step} className="relative p-5 bg-[#131313] border border-[#353535]/60 rounded-[16px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-[#8b919f] font-mono">{s.step}</span>
                <span className="material-symbols-outlined text-[18px] text-[#abc7ff]">{s.icon}</span>
              </div>
              <h4 className="text-[13px] font-semibold text-white mb-2">{s.label}</h4>
              <p className="text-[11px] text-[#8b919f] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
