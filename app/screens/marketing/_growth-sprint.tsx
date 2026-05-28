'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVentureSlug } from '@/lib/use-venture-slug';

// ── Glass variants ──────────────────────────────────────────────────────────────
const G1 = { background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(32px) saturate(160%)', WebkitBackdropFilter: 'blur(32px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(20,60,120,0.28)' };
const I1 = '#0c2c52', I1c = 'rgba(12,44,82,0.65)', I1d = 'rgba(12,44,82,0.48)', L1 = 'rgba(12,44,82,0.10)';
const G3 = { background: 'linear-gradient(135deg,rgba(15,22,38,0.58),rgba(8,14,28,0.72))', backdropFilter: 'blur(34px) saturate(140%)', WebkitBackdropFilter: 'blur(34px) saturate(140%)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(0,0,0,0.30),0 22px 60px -12px rgba(0,10,40,0.55)' };
const I3c = 'rgba(241,245,251,0.75)', I3d = 'rgba(241,245,251,0.45)';
const G4 = { background: 'radial-gradient(120% 80% at 0% 0%,rgba(255,150,200,0.32),transparent 55%),radial-gradient(120% 80% at 100% 100%,rgba(120,200,255,0.40),transparent 55%),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.12))', backdropFilter: 'blur(30px) saturate(200%)', WebkitBackdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.50)', borderRadius: 22, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60),inset 0 -1px 0 rgba(255,255,255,0.10),0 18px 50px -10px rgba(180,80,160,0.30)' };
const I4 = '#2a1240', I4d = 'rgba(42,18,64,0.48)';
const ACCENT = '#0066cc';

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
  'kai-analyst':        { name: 'Kai',   icon: '📊', color: '#3B82F6', role: 'Analytics' },
  'nate-growth':        { name: 'Nate',  icon: '🚀', color: '#22C55E', role: 'Growth'    },
  'rio-ads':            { name: 'Rio',   icon: '📈', color: '#F97316', role: 'Channels'  },
  'lena-brand':         { name: 'Lena',  icon: '✍️', color: '#14B8A6', role: 'Content'   },
  'atlas-art-director': { name: 'Atlas', icon: '🎨', color: '#6366F1', role: 'Creative'  },
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: 'from-yellow-400 via-pink-500 to-purple-500',
  TikTok:    'from-black via-[#69C9D0] to-[#EE1D52]',
  LinkedIn:  'from-[#0A66C2] to-[#0073B1]',
  YouTube:   'from-[#FF0000] to-[#CC0000]',
};

const PHASE_LABELS: Record<SprintPhase, string> = {
  idle:     'READY TO SPRINT',
  briefing: 'KAI BRIEFING...',
  explore:  'NATE + RIO READING...',
  pitching: 'LENA PITCHING...',
  active:   'SPRINT ACTIVE',
  error:    'ERROR',
};

/* ── Virality bar (dark context — active sprint only) ── */
function ViralBar({ label, value }: { label: string; value: number }) {
  const pct   = (value / 5) * 100;
  const color = value >= 4 ? '#34d399' : value >= 3 ? '#5ba8ff' : '#fb923c';
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 9, color: I3d, width: 70, flexShrink: 0, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(241,245,251,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: I3d, width: 16, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/* ── Agent message card (dark context) ── */
function MessageCard({ msg }: { msg: AgentMessage }) {
  const [expanded, setExpanded] = useState(msg.messageType !== 'brief');
  const agent = AGENTS[msg.agentId];
  if (!agent) return null;
  return (
    <div style={{ background: 'rgba(241,245,251,0.04)', border: '1px solid rgba(241,245,251,0.08)', borderRadius: 14, overflow: 'hidden' }}>
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
        style={{ padding: '10px 14px' }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{agent.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, fontWeight: 700, color: agent.color }}>{agent.name}</span>
            <span style={{ fontSize: 9, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.10em' }}>{agent.role}</span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', padding: '2px 8px', borderRadius: 999, marginLeft: 'auto',
              background: msg.messageType === 'brief' ? `${ACCENT}20` : msg.messageType === 'analysis' ? 'rgba(52,211,153,0.12)' : 'rgba(251,146,60,0.12)',
              color:      msg.messageType === 'brief' ? '#5ba8ff'     : msg.messageType === 'analysis' ? '#34d399'               : '#fb923c',
            }}>{msg.messageType}</span>
          </div>
          {!expanded && <p style={{ fontSize: 11, color: I3d, margin: 0 }}>{msg.content.slice(0, 80)}…</p>}
        </div>
        <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16, color: I3d }}>{expanded ? 'expand_less' : 'expand_more'}</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(241,245,251,0.06)' }}>
          <pre style={{ fontSize: 12, color: I3c, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', margin: '12px 0 0' }}>{msg.content}</pre>
        </div>
      )}
    </div>
  );
}

/* ── Pitch card (dark context — inside G3) ── */
function PitchCard({ pitch, onApprove, onPass, onVary }: {
  pitch: ContentPitch; onApprove: (id: string) => void; onPass: (id: string) => void; onVary: (id: string) => void;
}) {
  const platColor  = PLATFORM_COLORS[pitch.platform] ?? 'from-[#8b919f] to-[#353535]';
  const isLow      = pitch.virality.total < 15;
  const isHigh     = pitch.virality.total >= 20;
  const borderColor = pitch.status === 'approved' ? 'rgba(52,211,153,0.40)' : pitch.status === 'passed' ? 'rgba(255,255,255,0.04)' : isHigh ? 'rgba(91,168,255,0.20)' : isLow ? 'rgba(251,146,60,0.20)' : 'rgba(241,245,251,0.08)';

  return (
    <div style={{ background: 'rgba(241,245,251,0.04)', border: `1px solid ${borderColor}`, borderRadius: 16, overflow: 'hidden', opacity: pitch.status === 'passed' ? 0.4 : 1 }}>
      <div className={`h-0.5 w-full bg-gradient-to-r ${platColor}`} />
      <div style={{ padding: 18 }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 10, fontWeight: 700, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.10em' }}>{pitch.platform}</span>
              <span style={{ color: I3d }}>·</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.10em' }}>{pitch.format}</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5fb', lineHeight: 1.3, margin: 0 }}>&ldquo;{pitch.hook}&rdquo;</p>
          </div>
          <div style={{ flexShrink: 0, marginLeft: 12, textAlign: 'center', padding: '8px 12px', borderRadius: 10, background: isHigh ? `${ACCENT}18` : isLow ? 'rgba(251,146,60,0.12)' : 'rgba(241,245,251,0.06)', border: `1px solid ${isHigh ? `${ACCENT}30` : isLow ? 'rgba(251,146,60,0.20)' : 'rgba(241,245,251,0.08)'}` }}>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: isHigh ? '#5ba8ff' : isLow ? '#fb923c' : '#f1f5fb' }}>{pitch.virality.total}</div>
            <div style={{ fontSize: 8, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.10em', marginTop: 2 }}>/ 25</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: I3d, lineHeight: 1.55, margin: '0 0 12px' }}>{pitch.angle}</p>
        <div className="space-y-1.5 mb-4">
          <ViralBar label="Shareable"  value={pitch.virality.shareability}    />
          <ViralBar label="Relatable"  value={pitch.virality.relatability}    />
          <ViralBar label="Hook"       value={pitch.virality.hook_strength}   />
          <ViralBar label="Native"     value={pitch.virality.platform_native} />
          <ViralBar label="Trend fit"  value={pitch.virality.trend_fit}       />
        </div>
        {pitch.tactic && (
          <div className="mb-3">
            <span style={{ fontSize: 10, fontWeight: 700, color: I3d, padding: '3px 10px', background: 'rgba(241,245,251,0.06)', borderRadius: 999 }}>↗ {pitch.tactic}</span>
          </div>
        )}
        {isLow && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#fb923c' }}>warning</span>
            <span style={{ fontSize: 10, color: '#fb923c' }}>Score below 15 — low viral potential.</span>
          </div>
        )}
        {pitch.status === 'pending' && (
          <div className="flex gap-2">
            <button onClick={() => onApprove(pitch.id)} className="flex-1 flex items-center justify-center gap-1 active:scale-95"
              style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', padding: '8px 0', borderRadius: 999, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span>Approve
            </button>
            <button onClick={() => onVary(pitch.id)} className="flex-1 flex items-center justify-center gap-1 active:scale-95"
              style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', padding: '8px 0', borderRadius: 999, background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: '#5ba8ff', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>refresh</span>Vary
            </button>
            <button onClick={() => onPass(pitch.id)} className="active:scale-95"
              style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', padding: '8px 12px', borderRadius: 999, background: 'rgba(241,245,251,0.04)', border: '1px solid rgba(241,245,251,0.08)', color: I3d, cursor: 'pointer' }}>
              Pass
            </button>
          </div>
        )}
        {pitch.status === 'approved' && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#34d399' }}>check_circle</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>Added to Content Queue</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Queue item (dark context) ── */
function QueueItem({ pitch, index }: { pitch: ContentPitch; index: number }) {
  return (
    <div className="flex items-start gap-3" style={{ background: 'rgba(241,245,251,0.04)', border: '1px solid rgba(241,245,251,0.06)', borderRadius: 12, padding: 12 }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399' }}>{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span style={{ fontSize: 9, fontWeight: 700, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.10em' }}>{pitch.platform}</span>
          <span style={{ color: I3d }}>·</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.10em' }}>{pitch.format}</span>
        </div>
        <p className="line-clamp-2" style={{ fontSize: 11, color: I3c, lineHeight: 1.4, margin: 0 }}>&ldquo;{pitch.hook}&rdquo;</p>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: pitch.virality.total >= 20 ? '#5ba8ff' : I3d, flexShrink: 0 }}>{pitch.virality.total}</span>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────────── */
export default function GrowthSprintTab() {
  const router = useRouter();
  const ventureSlug = useVentureSlug();
  const venture = ventureSlug.charAt(0).toUpperCase() + ventureSlug.slice(1);
  const [sprintMode, setSprintMode]       = useState<'1h' | '6h' | '48h'>('48h');
  const [phase, setPhase]                 = useState<SprintPhase>('idle');
  const [messages, setMessages]           = useState<AgentMessage[]>([]);
  const [streamingId, setStreamingId]     = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState('');
  const [pitches, setPitches]             = useState<ContentPitch[]>([]);
  const [queue, setQueue]                 = useState<ContentPitch[]>([]);
  const [input, setInput]                 = useState('');
  const [phaseLabel, setPhaseLabel]       = useState('');
  const feedRef  = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (raw === '[DONE]') continue;
          let evt: Record<string, unknown>;
          try { evt = JSON.parse(raw) as Record<string, unknown>; } catch { continue; }

          switch (evt.type) {
            case 'phase':          setPhase(evt.phase as SprintPhase); setPhaseLabel(evt.label as string); break;
            case 'agent_start':    setStreamingId(evt.agentId as string); setStreamContent(''); break;
            case 'stream_chunk':   setStreamContent(prev => prev + (evt.content as string)); break;
            case 'agent_message':  {
              const msg: AgentMessage = { id: crypto.randomUUID(), agentId: evt.agentId as string, content: evt.content as string, messageType: evt.messageType as AgentMessage['messageType'], ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) };
              setMessages(prev => [...prev, msg]); setStreamingId(null); setStreamContent(''); break;
            }
            case 'pitches':        setPitches((evt.pitches as ContentPitch[]).map(p => ({ ...p, status: 'pending' as const }))); break;
            case 'pitch_variation':{ const varied = { ...(evt.pitch as ContentPitch), status: 'pending' as const }; setPitches(prev => [varied, ...prev.filter(p => p.status !== 'pending')]); break; }
            case 'done':           setStreamingId(null); if (phase !== 'active') setPhase('active'); break;
            case 'error':          setPhase('error'); break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setPhase('error');
    }
  }, [venture, phase]);

  function startSprint() {
    setMessages([]); setPitches([]); setQueue([]); setStreamingId(null); setStreamContent('');
    setPhase('briefing');
    void callSprint({ phase: 'auto-brief', mode: sprintMode });
  }

  function sendMessage() {
    if (!input.trim() || phase === 'idle') return;
    const msg = input.trim(); setInput('');
    void callSprint({ phase: 'message', message: msg, context: sprintContext });
  }

  function approvePitch(id: string) {
    setPitches(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    const pitch = pitches.find(p => p.id === id);
    if (pitch) setQueue(prev => [...prev, { ...pitch, status: 'approved' }]);
  }

  function passPitch(id: string)  { setPitches(prev => prev.map(p => p.id === id ? { ...p, status: 'passed' } : p)); }

  function varyPitch(id: string) {
    const pitch = pitches.find(p => p.id === id);
    if (!pitch) return;
    void callSprint({ phase: 'vary', context: `Platform: ${pitch.platform}\nFormat: ${pitch.format}\nHook: ${pitch.hook}\nAngle: ${pitch.angle}\nTactic: ${pitch.tactic}` });
  }

  const isRunning = phase === 'briefing' || phase === 'explore' || phase === 'pitching';
  const approved  = queue.length;
  const pending   = pitches.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">

      {/* ── Sprint Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: I1d, margin: '0 0 4px' }}>YVON · Content Engine</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: I1, letterSpacing: '-0.02em', margin: 0 }}>Growth Sprint Room</h2>
          <p style={{ fontSize: 12, color: I1d, margin: '2px 0 0' }}>48-hour content sprint cycle · Kai → Nate + Rio → Lena → You</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
            border: `1px solid ${phase === 'idle' ? L1 : phase === 'active' ? 'rgba(52,211,153,0.30)' : phase === 'error' ? 'rgba(248,113,113,0.30)' : `${ACCENT}30`}`,
            background: phase === 'active' ? 'rgba(52,211,153,0.06)' : phase === 'error' ? 'rgba(248,113,113,0.06)' : isRunning ? `${ACCENT}08` : L1,
          }}>
            {isRunning  && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
            {phase === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em',
              color: phase === 'active' ? '#34d399' : phase === 'error' ? '#f87171' : isRunning ? '#5ba8ff' : I1d }}>
              {phaseLabel || PHASE_LABELS[phase]}
            </span>
          </div>
          {phase === 'idle' ? (
            <button onClick={startSprint} className="flex items-center gap-2 active:scale-95"
              style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.14em', padding: '10px 20px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>rocket_launch</span>Start Sprint
            </button>
          ) : (
            <button onClick={() => { abortRef.current?.abort(); setPhase('idle'); }} className="flex items-center gap-2 active:scale-95"
              style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', padding: '10px 18px', borderRadius: 999, background: L1, border: `1px solid ${L1}`, color: I1d, cursor: 'pointer' }}>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          IDLE STATE — glass cards
      ══════════════════════════════════════════════════════════════════════════ */}
      {phase === 'idle' && (
        <div className="space-y-6">

          {/* Mode selector — G3 Obsidian */}
          <div style={{ ...G3, padding: '24px 28px' }} className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}25` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#5ba8ff' }}>rocket_launch</span>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, color: I3c, lineHeight: 1.6, margin: '0 0 12px' }}>
                <strong style={{ color: '#f1f5fb' }}>A sprint is a data-to-live-content loop.</strong> Kai reads your numbers → agents find the lever → Lena writes hooks scored for virality → you approve → content goes live. Below <strong style={{ color: '#f1f5fb' }}>15/25 virality</strong> = don&apos;t post.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: 10, fontWeight: 700, color: I3d, textTransform: 'uppercase' as const, letterSpacing: '0.14em', marginRight: 4 }}>Sprint mode:</span>
                {([
                  { id: '1h',  label: '⚡ 1h Rapid',    desc: '1 hook, post raw now'        },
                  { id: '6h',  label: '🔥 6h Fast',      desc: '2 hooks, light production'   },
                  { id: '48h', label: '🚀 48h Standard', desc: '4 hooks, full production'    },
                ] as const).map(m => (
                  <button key={m.id} onClick={() => setSprintMode(m.id)} title={m.desc}
                    className="active:scale-95"
                    style={{ fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: sprintMode === m.id ? ACCENT : 'rgba(241,245,251,0.06)',
                      color:      sprintMode === m.id ? '#fff'  : I3d,
                    }}>
                    {m.label}
                  </button>
                ))}
                <span style={{ fontSize: 10, color: I3d, marginLeft: 4 }}>
                  {sprintMode === '1h' ? '— trend-jacking, no production' : sprintMode === '6h' ? '— fast reaction, light visuals' : '— planned content, full production'}
                </span>
              </div>
            </div>
          </div>

          {/* Why / What / When — G1 Glass */}
          <div className="grid grid-cols-3 gap-5">

            {/* Why Sprint */}
            <div style={{ ...G1, padding: 24 }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontSize: 18 }}>⚡</span>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: I1d, margin: 0 }}>Why Sprint?</p>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: I1, letterSpacing: '-0.01em', margin: '0 0 16px', lineHeight: 1.35 }}>
                Random posting gets stable growth. Sprinting gets exponential.
              </h4>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: 'close', color: '#e11d48', text: 'Posting without data = guessing. Most posts die silently.' },
                  { icon: 'close', color: '#e11d48', text: "No feedback loop = you repeat what didn't work." },
                  { icon: 'check', color: '#059669', text: 'A sprint forces: data → decision → content → live → learn in 48h.' },
                  { icon: 'check', color: '#059669', text: 'Winners get amplified immediately. Losers get cut before they waste budget.' },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 14, color: r.color }}>{r.icon}</span>
                    <p style={{ fontSize: 12, color: I1c, lineHeight: 1.55, margin: 0 }}>{r.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
                style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20` }}>
                <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 14, color: ACCENT }}>info</span>
                <p style={{ fontSize: 11, color: I1c, lineHeight: 1.55, margin: 0 }}>
                  <strong style={{ color: I1 }}>This is not a report.</strong> A sprint is a live content production session — agents collaborate in real-time to produce, score, and queue content ideas. Reports (Analytics &rsaquo; Reports) look backwards. Sprints look forward.
                </p>
              </div>
            </div>

            {/* What Happens */}
            <div style={{ ...G1, padding: 24 }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontSize: 18 }}>🔄</span>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: I1d, margin: 0 }}>What Happens</p>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { agent: '📊 Kai',  color: '#3B82F6', step: 'Opens sprint',     detail: "Pulls this week's analytics, spots trend velocity, flags one competitor move." },
                  { agent: '🚀 Nate', color: '#22C55E', step: 'Reads the funnel', detail: 'Identifies the current leak, proposes 3 leverage actions.' },
                  { agent: '📈 Rio',  color: '#F97316', step: 'Checks channels',  detail: 'Compares performance vs benchmarks. Flags amplification triggers.' },
                  { agent: '✍️ Lena',color: '#14B8A6', step: 'Pitches 4 pieces', detail: 'Writes hooks tied to rising trends. Each pitch is scored for virality.' },
                  { agent: '👤 You',  color: ACCENT,    step: 'Approve or steer', detail: 'Approve, pass, or ask Lena to vary. Approved pieces go into the queue.' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{s.agent.split(' ')[0]}</span>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: I1 }}>{s.step}</span>
                      <p style={{ fontSize: 11, color: I1d, margin: '1px 0 0', lineHeight: 1.5 }}>{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 48h Cycle — G4 Prism */}
            <div style={{ ...G4, padding: 24 }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontSize: 18 }}>⏱️</span>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: I4d, margin: 0 }}>The 48h Cycle</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: I4d }} />
                <div className="flex flex-col gap-4">
                  {[
                    { time: 'H 0',  label: 'Sprint opens',          detail: 'Kai briefs, Nate+Rio react, Lena pitches',    dotColor: ACCENT    },
                    { time: 'H 2',  label: 'You approve pitches',   detail: 'Pick your best, steer or vary the rest',     dotColor: ACCENT    },
                    { time: 'H 4',  label: 'Atlas + Pixel produce', detail: 'Visuals, captions, everything ready to post', dotColor: '#8b5cf6' },
                    { time: 'H 24', label: 'Content goes live',     detail: 'Post on approved platforms at peak time',    dotColor: '#34d399' },
                    { time: 'H 30', label: '6h check',              detail: '>2× benchmark? Boost now. <50%? Kill it.',   dotColor: '#d97706' },
                    { time: 'H 48', label: 'Amplify winners',       detail: 'Cross-post, increase budget, start sprint 2', dotColor: '#34d399' },
                  ].map(step => (
                    <div key={step.time} className="flex items-start gap-3 relative">
                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: step.dotColor, border: `2px solid rgba(255,255,255,0.60)` }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 9, fontWeight: 700, color: I4d, fontFamily: 'ui-monospace,monospace' }}>{step.time}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: I4 }}>{step.label}</span>
                        </div>
                        <p style={{ fontSize: 10, color: I4d, margin: '1px 0 0', lineHeight: 1.5 }}>{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 p-3 rounded-xl" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}20` }}>
                <p style={{ fontSize: 10, color: ACCENT, margin: 0 }}>Run 2 sprints in parallel — Sprint A is amplified while Sprint B is in production.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          ACTIVE SPRINT STATE — G3 dark panels (terminal feel)
      ══════════════════════════════════════════════════════════════════════════ */}
      {phase !== 'idle' && (
        <div className="grid grid-cols-[1fr_300px] gap-5">

          {/* Left: Agent Feed + Pitches + Input */}
          <div className="flex flex-col gap-4">

            {/* Agent Feed — G3 */}
            <div ref={feedRef} style={{ ...G3, padding: 18 }} className="space-y-3 max-h-[420px] overflow-y-auto">
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.18em', color: I3d, marginBottom: 8 }}>Agent Feed</p>
              {messages.length === 0 && isRunning && (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <p style={{ fontSize: 12, color: I3d, margin: 0 }}>{phaseLabel || 'Loading sprint data...'}</p>
                </div>
              )}
              {messages.map(msg => <MessageCard key={msg.id} msg={msg} />)}
              {streamingId && (
                <div style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}20`, borderRadius: 14, padding: 16 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 16 }}>{AGENTS[streamingId]?.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: AGENTS[streamingId]?.color }}>{AGENTS[streamingId]?.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse ml-1" />
                  </div>
                  {streamContent && (
                    <pre style={{ fontSize: 11, color: I3c, whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', lineHeight: 1.6, margin: 0 }}>
                      {streamContent}
                      <span className="inline-block w-0.5 h-3 bg-blue-400 animate-pulse ml-0.5 align-middle" />
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Content Pitches */}
            {pitches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: I1d, margin: 0 }}>
                    Content Pitches — {pending} pending · {approved} approved
                  </p>
                  <span style={{ fontSize: 10, color: I1d }}>Below 15/25 = don&apos;t post</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {pitches.map(p => (
                    <PitchCard key={p.id} pitch={p} onApprove={approvePitch} onPass={passPitch} onVary={varyPitch} />
                  ))}
                </div>
              </div>
            )}

            {/* Input — G1 */}
            {phase === 'active' && (
              <div style={{ ...G1, padding: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: I1d, margin: '0 0 12px' }}>Steer the Sprint — ask any agent</p>
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                    placeholder="Ask Kai for data, Nate for growth strategy, Rio for channel advice, Lena for copy..."
                    className="flex-1 focus:outline-none"
                    style={{ background: L1, border: `1px solid ${L1}`, borderRadius: 999, padding: '10px 16px', fontSize: 13, color: I1, fontFamily: 'inherit' }}
                  />
                  <button onClick={sendMessage} disabled={!input.trim()} className="active:scale-95"
                    style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '10px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', opacity: !input.trim() ? 0.4 : 1 }}>
                    Send
                  </button>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {["What's the best hook style for TikTok this week?", 'Which pitch has the best shot at going viral?', 'Rewrite pitch 1 hook — make it more direct'].map(q => (
                    <button key={q} onClick={() => setInput(q)} className="active:scale-95"
                      style={{ fontSize: 10, color: I1d, background: L1, border: `1px solid ${L1}`, padding: '6px 12px', borderRadius: 999, cursor: 'pointer' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Queue + Sprint Cycle + Amplify Rules */}
          <div className="flex flex-col gap-4">

            {/* Content Queue — G3 */}
            <div style={{ ...G3, padding: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: I3d, margin: 0 }}>Content Queue</p>
                {queue.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399' }}>{queue.length} approved</span>}
              </div>
              {queue.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: 'rgba(241,245,251,0.06)', border: '1px solid rgba(241,245,251,0.08)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: I3d }}>inbox</span>
                  </div>
                  <p style={{ fontSize: 11, color: I3d, margin: 0 }}>Approve pitches to fill the queue</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {queue.map((p, i) => <QueueItem key={p.id} pitch={p} index={i} />)}
                </div>
              )}
              {queue.length > 0 && (
                <button onClick={() => router.push('/screens/creative-studio')} className="w-full flex items-center justify-center gap-2 mt-4 active:scale-95"
                  style={{ background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', padding: '10px 0', borderRadius: 999, border: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>Send to Creative Studio
                </button>
              )}
            </div>

            {/* Sprint Cycle — G3 */}
            <div style={{ ...G3, padding: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: I3d, margin: '0 0 16px' }}>
                {sprintMode === '1h' ? '1h Rapid Cycle' : sprintMode === '6h' ? '6h Fast Cycle' : '48h Sprint Cycle'}
              </p>
              <div className="flex flex-col gap-2">
                {(sprintMode === '1h' ? [
                  { hour: 'Now',   label: 'Kai spots the trend',          done: messages.length > 0 },
                  { hour: '5min',  label: 'Lena writes 1 hook',           done: pitches.length > 0  },
                  { hour: '15min', label: 'You approve',                  done: queue.length > 0    },
                  { hour: '30min', label: 'Post raw — no editing',         done: false               },
                  { hour: '1h',    label: 'Check engagement, amplify 2×', done: false               },
                ] : sprintMode === '6h' ? [
                  { hour: 'H 0',   label: 'Kai brief + Nate picks lever', done: messages.length > 0 },
                  { hour: 'H 1',   label: 'Lena writes 2 hooks',          done: pitches.length > 0  },
                  { hour: 'H 2',   label: 'You approve',                  done: queue.length > 0    },
                  { hour: 'H 3',   label: 'Quick Atlas visual brief',     done: false               },
                  { hour: 'H 5',   label: 'Live on platform',             done: false               },
                  { hour: 'H 6',   label: 'Check + amplify winners',      done: false               },
                ] : [
                  { hour: 'H 0',   label: 'Kai opens sprint',             done: messages.length > 0 },
                  { hour: 'H 1',   label: 'Lena writes 4 hooks',          done: pitches.length > 0  },
                  { hour: 'H 2',   label: 'You approve + Nate validates', done: queue.length > 0    },
                  { hour: 'H 4',   label: 'Atlas + Pixel produce',        done: false               },
                  { hour: 'H 24',  label: 'Live on platform',             done: false               },
                  { hour: 'H 30',  label: '6h metrics check',             done: false               },
                  { hour: 'H 48',  label: 'Amplify winners',              done: false               },
                ]).map(step => (
                  <div key={step.hour} className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: step.done ? 'rgba(52,211,153,0.15)' : 'rgba(241,245,251,0.05)', border: `1px solid ${step.done ? 'rgba(52,211,153,0.35)' : 'rgba(241,245,251,0.10)'}` }}>
                      {step.done && <span style={{ fontSize: 8, fontWeight: 700, color: '#34d399' }}>✓</span>}
                    </span>
                    <span style={{ fontSize: 9, color: I3d, fontFamily: 'ui-monospace,monospace', width: 48, flexShrink: 0 }}>{step.hour}</span>
                    <span style={{ fontSize: 11, color: step.done ? I3c : I3d }}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amplify Rules — G3 */}
            <div style={{ ...G3, padding: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.16em', color: I3d, margin: '0 0 12px' }}>Amplify Rules</p>
              <div className="flex flex-col gap-2">
                {[
                  { icon: 'trending_up',   color: '#34d399', rule: '2× benchmark at 6h → boost now'             },
                  { icon: 'trending_up',   color: '#34d399', rule: '2× at 24h → cross-post all platforms'       },
                  { icon: 'trending_down', color: '#fb923c', rule: '<50% at 6h → kill, extract learning'        },
                  { icon: 'remove',        color: I3d,       rule: 'Never treat all posts equally'              },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 14, color: r.color }}>{r.icon}</span>
                    <p style={{ fontSize: 11, color: I3d, margin: 0 }}>{r.rule}</p>
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
