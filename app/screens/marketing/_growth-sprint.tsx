'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveVentureSlugClient } from '@/lib/venture-context';

/* ── Types ── */
type SprintPhase = 'idle' | 'briefing' | 'explore' | 'pitching' | 'active' | 'error';

interface ViralityScore {
  shareability:    number;
  relatability:    number;
  hook_strength:   number;
  platform_native: number;
  trend_fit:       number;
  total:           number;
}

interface ContentPitch {
  id:       string;
  platform: string;
  format:   string;
  hook:     string;
  angle:    string;
  tactic:   string;
  virality: ViralityScore;
  status:   'pending' | 'approved' | 'passed' | 'amplify';
}

interface AgentMessage {
  id:          string;
  agentId:     string;
  content:     string;
  messageType: 'brief' | 'analysis' | 'pitch' | 'response';
  ts:          string;
}

/* ── Agent display meta ── */
const AGENTS: Record<string, { name: string; icon: string; color: string; role: string }> = {
  'kai-analyst':         { name: 'Kai',   icon: '📊', color: '#3B82F6', role: 'Analytics' },
  'nate-growth':         { name: 'Nate',  icon: '🚀', color: '#22C55E', role: 'Growth' },
  'rio-ads':             { name: 'Rio',   icon: '📈', color: '#F97316', role: 'Channels' },
  'lena-brand':          { name: 'Lena',  icon: '✍️', color: '#14B8A6', role: 'Content' },
  'atlas-art-director':  { name: 'Atlas', icon: '🎨', color: '#6366F1', role: 'Creative' },
};

/* ── Platform icons ── */
const PLATFORM_COLORS: Record<string, string> = {
  Instagram: 'from-yellow-400 via-pink-500 to-purple-500',
  TikTok:    'from-black via-[#69C9D0] to-[#EE1D52]',
  LinkedIn:  'from-[#0A66C2] to-[#0073B1]',
  YouTube:   'from-[#FF0000] to-[#CC0000]',
};

const PHASE_LABELS: Record<SprintPhase, string> = {
  idle:      'READY TO SPRINT',
  briefing:  'KAI BRIEFING...',
  explore:   'NATE + RIO READING...',
  pitching:  'LENA PITCHING...',
  active:    'SPRINT ACTIVE',
  error:     'ERROR',
};

/* ── Virality bar ── */
function ViralBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  const color = value >= 4 ? 'bg-emerald-400' : value >= 3 ? 'bg-[#abc7ff]' : 'bg-[#ffb693]';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-[#8b919f] w-[70px] flex-shrink-0 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-1.5 bg-[#353535] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-white/60 w-4 text-right">{value}</span>
    </div>
  );
}

/* ── Agent message card ── */
function MessageCard({ msg }: { msg: AgentMessage }) {
  const [expanded, setExpanded] = useState(msg.messageType !== 'brief');
  const agent = AGENTS[msg.agentId];
  if (!agent) return null;

  return (
    <div className="bg-[#1f1f1f] border border-[#353535] rounded-[14px] overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#353535]/30 transition-colors"
      >
        <span className="text-lg flex-shrink-0">{agent.icon}</span>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white" style={{ color: agent.color }}>{agent.name}</span>
            <span className="text-[10px] text-[#8b919f] uppercase tracking-wider">{agent.role}</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ml-auto ${
              msg.messageType === 'brief'    ? 'text-[#abc7ff] bg-[#0071e3]/10' :
              msg.messageType === 'analysis' ? 'text-emerald-400 bg-emerald-400/10' :
              msg.messageType === 'pitch'    ? 'text-[#ffb693] bg-[#ffb693]/10' :
              'text-white/40 bg-white/5'
            }`}>{msg.messageType}</span>
          </div>
          {!expanded && (
            <p className="text-[11px] text-[#8b919f] truncate mt-0.5">{msg.content.slice(0, 80)}…</p>
          )}
        </div>
        <span className="material-symbols-outlined text-[16px] text-[#8b919f] flex-shrink-0">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#353535]">
          <pre className="text-[12px] text-[#c1c6d6] leading-relaxed whitespace-pre-wrap font-sans mt-3">{msg.content}</pre>
        </div>
      )}
    </div>
  );
}

/* ── Pitch card ── */
function PitchCard({
  pitch,
  onApprove,
  onPass,
  onVary,
}: {
  pitch:      ContentPitch;
  onApprove:  (id: string) => void;
  onPass:     (id: string) => void;
  onVary:     (id: string) => void;
}) {
  const platColor = PLATFORM_COLORS[pitch.platform] ?? 'from-[#8b919f] to-[#353535]';
  const isLowScore = pitch.virality.total < 15;
  const isHighScore = pitch.virality.total >= 20;

  return (
    <div className={`bg-[#18181a] border rounded-[16px] overflow-hidden transition-all ${
      pitch.status === 'approved' ? 'border-emerald-500/40' :
      pitch.status === 'passed'   ? 'border-white/5 opacity-40' :
      isLowScore                  ? 'border-[#ffb693]/20' :
      isHighScore                 ? 'border-[#abc7ff]/20' :
      'border-[#353535]/60'
    }`}>
      {/* Platform stripe */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${platColor}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#8b919f] uppercase tracking-widest">{pitch.platform}</span>
              <span className="text-[#8b919f]">·</span>
              <span className="text-[10px] font-bold text-[#8b919f] uppercase tracking-widest">{pitch.format}</span>
            </div>
            <p className="text-[14px] font-semibold text-white leading-snug">&ldquo;{pitch.hook}&rdquo;</p>
          </div>
          {/* Virality badge */}
          <div className={`flex-shrink-0 ml-3 text-center px-3 py-1.5 rounded-[10px] ${
            isHighScore ? 'bg-[#abc7ff]/10 border border-[#abc7ff]/20' :
            isLowScore  ? 'bg-[#ffb693]/10 border border-[#ffb693]/20' :
            'bg-[#353535] border border-[#414753]'
          }`}>
            <div className={`text-[18px] font-bold leading-none ${
              isHighScore ? 'text-[#abc7ff]' : isLowScore ? 'text-[#ffb693]' : 'text-white'
            }`}>{pitch.virality.total}</div>
            <div className="text-[8px] text-[#8b919f] uppercase tracking-wide mt-0.5">/ 25</div>
          </div>
        </div>

        {/* Angle */}
        <p className="text-[12px] text-[#8b919f] leading-relaxed mb-4">{pitch.angle}</p>

        {/* Virality breakdown */}
        <div className="space-y-1.5 mb-4">
          <ViralBar label="Shareable"  value={pitch.virality.shareability} />
          <ViralBar label="Relatable"  value={pitch.virality.relatability} />
          <ViralBar label="Hook"       value={pitch.virality.hook_strength} />
          <ViralBar label="Native"     value={pitch.virality.platform_native} />
          <ViralBar label="Trend fit"  value={pitch.virality.trend_fit} />
        </div>

        {/* Tactic tag */}
        {pitch.tactic && (
          <div className="mb-4">
            <span className="text-[10px] font-bold text-[#8b919f] px-2.5 py-1 bg-[#353535] rounded-full">
              ↗ {pitch.tactic}
            </span>
          </div>
        )}

        {/* Below-threshold warning */}
        {isLowScore && (
          <div className="flex items-center gap-1.5 mb-3 text-[10px] text-[#ffb693]">
            <span className="material-symbols-outlined text-[12px]">warning</span>
            Score below 15 — low viral potential. Consider varying.
          </div>
        )}

        {/* Actions */}
        {pitch.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(pitch.id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-widest py-2 rounded-full hover:bg-emerald-500/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[13px]">check</span>
              Approve
            </button>
            <button
              onClick={() => onVary(pitch.id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#abc7ff]/10 border border-[#abc7ff]/20 text-[#abc7ff] text-[11px] font-bold uppercase tracking-widest py-2 rounded-full hover:bg-[#abc7ff]/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[13px]">refresh</span>
              Vary
            </button>
            <button
              onClick={() => onPass(pitch.id)}
              className="px-3 py-2 bg-white/5 border border-white/10 text-white/30 text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-white/10 active:scale-95 transition-all"
            >
              Pass
            </button>
          </div>
        )}
        {pitch.status === 'approved' && (
          <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Added to Content Queue
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Content Queue item ── */
function QueueItem({ pitch, index }: { pitch: ContentPitch; index: number }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#1f1f1f] border border-[#353535] rounded-[12px]">
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[9px] font-bold text-emerald-400">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-bold text-[#8b919f] uppercase tracking-widest">{pitch.platform}</span>
          <span className="text-[#8b919f]">·</span>
          <span className="text-[9px] font-bold text-[#8b919f] uppercase tracking-widest">{pitch.format}</span>
        </div>
        <p className="text-[11px] text-white/80 leading-snug line-clamp-2">&ldquo;{pitch.hook}&rdquo;</p>
      </div>
      <div className={`flex-shrink-0 text-[11px] font-bold ${
        pitch.virality.total >= 20 ? 'text-[#abc7ff]' : 'text-white/40'
      }`}>
        {pitch.virality.total}
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function GrowthSprintTab() {
  const router = useRouter();
  const [venture, setVenture]           = useState('Hourbour');
  const [sprintMode, setSprintMode]     = useState<'1h' | '6h' | '48h'>('48h');
  const [phase, setPhase]               = useState<SprintPhase>('idle');
  const [messages, setMessages]         = useState<AgentMessage[]>([]);
  const [streamingId, setStreamingId]   = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState('');
  const [pitches, setPitches]           = useState<ContentPitch[]>([]);
  const [queue, setQueue]               = useState<ContentPitch[]>([]);
  const [input, setInput]               = useState('');
  const [phaseLabel, setPhaseLabel]     = useState('');
  const feedRef   = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => {
    const slug = getActiveVentureSlugClient();
    if (slug) setVenture(slug === 'novizio' ? 'Novizio' : 'Hourbour');
  }, []);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamContent]);

  const sprintContext = messages.map(m => `${AGENTS[m.agentId]?.name ?? m.agentId}: ${m.content.slice(0, 200)}`).join('\n');

  const callSprint = useCallback(async (body: Record<string, unknown>) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/growth-sprint', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...body, venture }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok || !res.body) { setPhase('error'); return; }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (raw === '[DONE]') continue;

          let evt: Record<string, unknown>;
          try { evt = JSON.parse(raw) as Record<string, unknown>; } catch { continue; }

          switch (evt.type) {
            case 'phase':
              setPhase(evt.phase as SprintPhase);
              setPhaseLabel(evt.label as string);
              break;

            case 'agent_start':
              setStreamingId(evt.agentId as string);
              setStreamContent('');
              break;

            case 'stream_chunk':
              setStreamContent(prev => prev + (evt.content as string));
              break;

            case 'agent_message': {
              const msg: AgentMessage = {
                id:          crypto.randomUUID(),
                agentId:     evt.agentId as string,
                content:     evt.content as string,
                messageType: evt.messageType as AgentMessage['messageType'],
                ts:          new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              };
              setMessages(prev => [...prev, msg]);
              setStreamingId(null);
              setStreamContent('');
              break;
            }

            case 'pitches':
              setPitches((evt.pitches as ContentPitch[]).map(p => ({ ...p, status: 'pending' as const })));
              break;

            case 'pitch_variation': {
              const varied = { ...(evt.pitch as ContentPitch), status: 'pending' as const };
              setPitches(prev => [varied, ...prev.filter(p => p.status !== 'pending')]);
              break;
            }

            case 'done':
              setStreamingId(null);
              if (phase !== 'active') setPhase('active');
              break;

            case 'error':
              setPhase('error');
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setPhase('error');
    }
  }, [venture, phase]);

  function startSprint() {
    setMessages([]);
    setPitches([]);
    setQueue([]);
    setStreamingId(null);
    setStreamContent('');
    setPhase('briefing');
    void callSprint({ phase: 'auto-brief', mode: sprintMode });
  }

  function sendMessage() {
    if (!input.trim() || phase === 'idle') return;
    const msg = input.trim();
    setInput('');
    void callSprint({ phase: 'message', message: msg, context: sprintContext });
  }

  function approvePitch(id: string) {
    setPitches(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    const pitch = pitches.find(p => p.id === id);
    if (pitch) setQueue(prev => [...prev, { ...pitch, status: 'approved' }]);
  }

  function passPitch(id: string) {
    setPitches(prev => prev.map(p => p.id === id ? { ...p, status: 'passed' } : p));
  }

  function varyPitch(id: string) {
    const pitch = pitches.find(p => p.id === id);
    if (!pitch) return;
    const context = `Platform: ${pitch.platform}\nFormat: ${pitch.format}\nHook: ${pitch.hook}\nAngle: ${pitch.angle}\nTactic: ${pitch.tactic}`;
    void callSprint({ phase: 'vary', context });
  }

  const isRunning = phase === 'briefing' || phase === 'explore' || phase === 'pitching';
  const approved  = queue.length;
  const pending   = pitches.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-5">

      {/* ── Sprint Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>
            Growth Sprint Room
          </h2>
          <p className="text-[12px] text-[#8b919f] mt-0.5">
            48-hour content sprint cycle · Kai → Nate + Rio → Lena → You
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Phase indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
            phase === 'idle'   ? 'border-[#414753] text-[#8b919f]' :
            phase === 'active' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' :
            phase === 'error'  ? 'border-red-400/30 text-red-400' :
            'border-[#abc7ff]/30 text-[#abc7ff] bg-[#0071e3]/5'
          }`}>
            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-[#abc7ff] animate-pulse" />}
            {phase === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            {phaseLabel || PHASE_LABELS[phase]}
          </div>

          {phase === 'idle' ? (
            <button
              onClick={startSprint}
              className="flex items-center gap-2 bg-[#0071e3] text-white px-5 py-2.5 rounded-full text-[13px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
              Start Sprint
            </button>
          ) : (
            <button
              onClick={() => { abortRef.current?.abort(); setPhase('idle'); }}
              className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/40 px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Idle state ── */}
      {phase === 'idle' && (
        <div className="space-y-5">

          {/* Mode selector + context */}
          <div className="relative overflow-hidden rounded-[20px] bg-[#111111] border border-[#353535] px-8 py-6 flex items-center gap-6">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0071e3]/5 via-transparent to-transparent pointer-events-none" />
            <div className="w-10 h-10 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px] text-[#abc7ff]">rocket_launch</span>
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-[13px] text-[#8b919f] leading-relaxed mb-3">
                <strong className="text-white">A sprint is a data-to-live-content loop.</strong> Kai reads your numbers → agents find the lever → Lena writes hooks scored for virality → you approve → content goes live. Below <strong className="text-white">15/25 virality</strong> = don&apos;t post.
              </p>
              {/* Mode selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#8b919f] uppercase tracking-widest mr-1">Sprint mode:</span>
                {([
                  { id: '1h',  label: '⚡ 1h Rapid',    desc: '1 hook, post raw now' },
                  { id: '6h',  label: '🔥 6h Fast',      desc: '2 hooks, light production' },
                  { id: '48h', label: '🚀 48h Standard', desc: '4 hooks, full production' },
                ] as const).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSprintMode(m.id)}
                    title={m.desc}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                      sprintMode === m.id
                        ? 'bg-[#0071e3] border-[#0071e3] text-white'
                        : 'bg-transparent border-[#353535] text-[#8b919f] hover:border-[#414753] hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
                <span className="text-[10px] text-[#8b919f]/50 ml-1">
                  {sprintMode === '1h' ? '— trend-jacking, no production needed' : sprintMode === '6h' ? '— fast reaction, light visuals' : '— planned content, full production'}
                </span>
              </div>
            </div>
          </div>

          {/* Why / What / When explainer */}
          <div className="grid grid-cols-3 gap-4">

            {/* WHY */}
            <div className="bg-[#1f1f1f] border border-[#353535] rounded-[18px] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[18px]">⚡</span>
                <span className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase">Why Sprint?</span>
              </div>
              <h4 className="text-[15px] font-semibold text-white mb-3" style={{ letterSpacing: '-0.01em' }}>
                Random posting gets stable growth. Sprinting gets exponential.
              </h4>
              <div className="space-y-2.5">
                {[
                  { icon: 'close', color: 'text-[#ffb693]', text: 'Posting without data = guessing. Most posts die silently.' },
                  { icon: 'close', color: 'text-[#ffb693]', text: 'No feedback loop = you repeat what didn\'t work.' },
                  { icon: 'check', color: 'text-emerald-400', text: 'A sprint forces: data → decision → content → live → learn in 48h.' },
                  { icon: 'check', color: 'text-emerald-400', text: 'Winners get amplified immediately. Losers get cut before they waste budget.' },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5 ${r.color}`}>{r.icon}</span>
                    <p className="text-[11px] text-[#8b919f] leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* WHAT HAPPENS */}
            <div className="bg-[#1f1f1f] border border-[#353535] rounded-[18px] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[18px]">🔄</span>
                <span className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase">What Happens</span>
              </div>
              <div className="space-y-3">
                {[
                  { agent: '📊 Kai',   color: '#3B82F6', step: 'Opens sprint', detail: 'Pulls this week\'s analytics, spots trend velocity, flags one competitor move.' },
                  { agent: '🚀 Nate',  color: '#22C55E', step: 'Reads the funnel', detail: 'Identifies the current leak, proposes 3 leverage actions.' },
                  { agent: '📈 Rio',   color: '#F97316', step: 'Checks channels', detail: 'Compares performance vs benchmarks. Flags amplification triggers.' },
                  { agent: '✍️ Lena', color: '#14B8A6', step: 'Pitches 4 pieces', detail: 'Writes hooks tied to rising trends. Each pitch is scored for virality.' },
                  { agent: '👤 You',  color: '#abc7ff', step: 'Approve or steer', detail: 'Approve, pass, or ask Lena to vary. Approved pieces go into the queue.' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <span className="text-[13px] flex-shrink-0 mt-0.5">{s.agent.split(' ')[0]}</span>
                    <div>
                      <span className="text-[12px] font-semibold text-white">{s.step}</span>
                      <p className="text-[10px] text-[#8b919f] mt-0.5 leading-relaxed">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WHEN — 48h timeline */}
            <div className="bg-[#1f1f1f] border border-[#353535] rounded-[18px] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[18px]">⏱️</span>
                <span className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase">The 48h Cycle</span>
              </div>
              <div className="relative pl-4">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#353535]" />
                <div className="space-y-4">
                  {[
                    { time: 'H 0',  label: 'Sprint opens',         detail: 'Kai briefs, Nate+Rio react, Lena pitches',   color: 'bg-[#abc7ff]' },
                    { time: 'H 2',  label: 'You approve pitches',  detail: 'Pick your best, steer or vary the rest',     color: 'bg-[#abc7ff]' },
                    { time: 'H 4',  label: 'Atlas + Pixel produce', detail: 'Visuals, captions, everything ready to post', color: 'bg-[#6366F1]' },
                    { time: 'H 24', label: 'Content goes live',    detail: 'Post on approved platforms at peak time',    color: 'bg-emerald-400' },
                    { time: 'H 30', label: '6h check',             detail: '>2× benchmark? Boost now. <50%? Kill it.',   color: 'bg-amber-400' },
                    { time: 'H 48', label: 'Amplify winners',      detail: 'Cross-post, increase budget, start sprint 2', color: 'bg-emerald-400' },
                  ].map((step) => (
                    <div key={step.time} className="flex items-start gap-3 relative">
                      <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ${step.color} border-2 border-[#1f1f1f]`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-[#8b919f] font-mono">{step.time}</span>
                          <span className="text-[12px] font-semibold text-white">{step.label}</span>
                        </div>
                        <p className="text-[10px] text-[#8b919f] mt-0.5 leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 p-3 bg-[#131313] border border-[#abc7ff]/15 rounded-[10px]">
                <p className="text-[10px] text-[#abc7ff]">
                  Run 2 sprints in parallel — Sprint A is being amplified while Sprint B is in production.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active sprint: 3-col layout ── */}
      {phase !== 'idle' && (
        <div className="grid grid-cols-[1fr_300px] gap-5">

          {/* ── Left: Agent Feed + Pitches + Input ── */}
          <div className="flex flex-col gap-4">

            {/* Agent Feed */}
            <div
              ref={feedRef}
              className="bg-[#111111] border border-[#353535] rounded-[18px] p-4 space-y-3 max-h-[420px] overflow-y-auto"
            >
              <p className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase mb-2">Agent Feed</p>

              {messages.length === 0 && isRunning && (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-2 h-2 rounded-full bg-[#abc7ff] animate-pulse" />
                  <p className="text-[12px] text-[#8b919f]">{phaseLabel || 'Loading sprint data...'}</p>
                </div>
              )}

              {messages.map(msg => <MessageCard key={msg.id} msg={msg} />)}

              {/* Streaming agent */}
              {streamingId && (
                <div className="bg-[#1f1f1f] border border-[#abc7ff]/20 rounded-[14px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{AGENTS[streamingId]?.icon}</span>
                    <span className="text-[12px] font-semibold" style={{ color: AGENTS[streamingId]?.color }}>
                      {AGENTS[streamingId]?.name}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#abc7ff] animate-pulse ml-1" />
                  </div>
                  {streamContent && (
                    <pre className="text-[11px] text-[#c1c6d6] whitespace-pre-wrap font-sans leading-relaxed">
                      {streamContent}
                      <span className="inline-block w-0.5 h-3 bg-[#abc7ff] animate-pulse ml-0.5 align-middle" />
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Content Pitches */}
            {pitches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase">
                    Content Pitches — {pending} pending · {approved} approved
                  </p>
                  <span className="text-[10px] text-[#8b919f]">Below 15/25 = don&apos;t post</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {pitches.map(p => (
                    <PitchCard
                      key={p.id}
                      pitch={p}
                      onApprove={approvePitch}
                      onPass={passPitch}
                      onVary={varyPitch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            {phase === 'active' && (
              <div className="bg-[#111111] border border-[#353535] rounded-[18px] p-4">
                <p className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase mb-3">
                  Steer the Sprint — ask any agent
                </p>
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                    placeholder="Ask Kai for data, Nate for growth strategy, Rio for channel advice, Lena for copy..."
                    className="flex-1 bg-[#1f1f1f] border border-[#353535] rounded-full px-4 py-2.5 text-[13px] text-white placeholder-[#8b919f] focus:outline-none focus:border-[#414753]"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="bg-[#0071e3] text-white px-5 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-30"
                  >
                    Send
                  </button>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[
                    "What's the best hook style for TikTok this week?",
                    'Which pitch has the best shot at going viral?',
                    'Rewrite pitch 1 hook — make it more direct',
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-[10px] text-[#8b919f] bg-[#1f1f1f] border border-[#353535] px-3 py-1.5 rounded-full hover:text-white hover:border-[#414753] transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Content Queue + Amplify + 48h cycle ── */}
          <div className="flex flex-col gap-4">

            {/* Content Queue */}
            <div className="bg-[#111111] border border-[#353535] rounded-[18px] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase">Content Queue</p>
                {queue.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400">{queue.length} approved</span>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border border-[#353535] flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-[16px] text-[#8b919f]">inbox</span>
                  </div>
                  <p className="text-[11px] text-[#8b919f]">Approve pitches to fill the queue</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queue.map((p, i) => <QueueItem key={p.id} pitch={p} index={i} />)}
                </div>
              )}

              {queue.length > 0 && (
                <button
                  onClick={() => router.push('/screens/creative-studio')}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-[#0071e3] text-white py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">send</span>
                  Send to Creative Studio
                </button>
              )}
            </div>

            {/* Sprint Cycle */}
            <div className="bg-[#111111] border border-[#353535] rounded-[18px] p-5">
              <p className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase mb-4">
                {sprintMode === '1h' ? '1h Rapid Cycle' : sprintMode === '6h' ? '6h Fast Cycle' : '48h Sprint Cycle'}
              </p>
              <div className="space-y-2">
                {(sprintMode === '1h' ? [
                  { hour: 'Now',    label: 'Kai spots the trend',         done: messages.length > 0 },
                  { hour: '5min',   label: 'Lena writes 1 hook',          done: pitches.length > 0 },
                  { hour: '15min',  label: 'You approve',                 done: queue.length > 0 },
                  { hour: '30min',  label: 'Post raw — no editing',        done: false },
                  { hour: '1h',     label: 'Check engagement, amplify 2×', done: false },
                ] : sprintMode === '6h' ? [
                  { hour: 'H 0',    label: 'Kai brief + Nate picks lever', done: messages.length > 0 },
                  { hour: 'H 1',    label: 'Lena writes 2 hooks',          done: pitches.length > 0 },
                  { hour: 'H 2',    label: 'You approve',                  done: queue.length > 0 },
                  { hour: 'H 3',    label: 'Quick Atlas visual brief',     done: false },
                  { hour: 'H 5',    label: 'Live on platform',             done: false },
                  { hour: 'H 6',    label: 'Check + amplify winners',      done: false },
                ] : [
                  { hour: 'H 0',    label: 'Kai opens sprint',             done: messages.length > 0 },
                  { hour: 'H 1',    label: 'Lena writes 4 hooks',          done: pitches.length > 0 },
                  { hour: 'H 2',    label: 'You approve + Nate validates', done: queue.length > 0 },
                  { hour: 'H 4',    label: 'Atlas + Pixel produce',        done: false },
                  { hour: 'H 24',   label: 'Live on platform',             done: false },
                  { hour: 'H 30',   label: '6h metrics check',             done: false },
                  { hour: 'H 48',   label: 'Amplify winners',              done: false },
                ]).map((step) => (
                  <div key={step.hour} className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full flex-shrink-0 border flex items-center justify-center ${
                      step.done
                        ? 'bg-emerald-500/20 border-emerald-500/40'
                        : 'bg-[#1f1f1f] border-[#414753]'
                    }`}>
                      {step.done && <span className="text-[7px] text-emerald-400 font-bold">✓</span>}
                    </span>
                    <span className="text-[9px] text-[#8b919f] font-mono w-12 flex-shrink-0">{step.hour}</span>
                    <span className={`text-[11px] ${step.done ? 'text-white/70' : 'text-[#8b919f]'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amplification rules */}
            <div className="bg-[#111111] border border-[#353535] rounded-[18px] p-5">
              <p className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase mb-3">Amplify Rules</p>
              <div className="space-y-2">
                {[
                  { icon: 'trending_up', color: 'text-emerald-400', rule: '2× benchmark at 6h → boost now' },
                  { icon: 'trending_up', color: 'text-emerald-400', rule: '2× at 24h → cross-post all platforms' },
                  { icon: 'trending_down', color: 'text-[#ffb693]', rule: '<50% at 6h → kill, extract learning' },
                  { icon: 'remove',       color: 'text-[#8b919f]', rule: 'Never treat all posts equally' },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5 ${r.color}`}>{r.icon}</span>
                    <p className="text-[11px] text-[#8b919f]">{r.rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
