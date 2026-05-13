'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getActiveVentureSlugClient } from '@/lib/venture-context';

/* ── Constants ── */
const ROOM_ID = '__room__';

/* ── Agent registry ── */
interface AgentMeta {
  id:       string;
  name:     string;
  role:     string;
  icon:     string;
  color:    string;
  about:    string;
  starters: string[];
}

const AGENTS: AgentMeta[] = [
  {
    id:    'kai-analyst',
    name:  'Kai',
    role:  'Analytics',
    icon:  '📊',
    color: '#3B82F6',
    about: 'Reads your data and spots what the numbers are actually saying. Ask for metrics, trend velocity, competitor moves, or a plain-English read of any spike or drop.',
    starters: [
      "What's our biggest growth signal this week?",
      'Which platform is underperforming vs benchmark?',
      'Spot any anomalies in the last 7 days?',
    ],
  },
  {
    id:    'nate-growth',
    name:  'Nate',
    role:  'Growth',
    icon:  '🚀',
    color: '#22C55E',
    about: 'Owns the funnel from top to bottom. Ask for leverage actions, experiment designs, activation ideas, or a read on where the funnel is leaking.',
    starters: [
      'Where is the funnel leaking right now?',
      'Design a 14-day experiment for trial conversion',
      'What should we kill immediately?',
    ],
  },
  {
    id:    'rio-ads',
    name:  'Rio',
    role:  'Channels',
    icon:  '📈',
    color: '#F97316',
    about: 'Manages channel performance and amplification decisions. Ask about boosting posts, platform benchmarks, budget allocation, or cross-posting strategy.',
    starters: [
      'Which channel should we double down on this week?',
      'Any posts ready to amplify right now?',
      'What is our Instagram engagement gap vs benchmark?',
    ],
  },
  {
    id:    'lena-brand',
    name:  'Lena',
    role:  'Content',
    icon:  '✍️',
    color: '#14B8A6',
    about: 'Writes hooks, captions, and copy that sounds like a person, not a brand. Ask for a specific piece of copy, a headline rewrite, or a hook for any platform.',
    starters: [
      'Write a TikTok hook for our subscription audit feature',
      'Rewrite our Instagram bio — make it sharper',
      'Give me 3 caption options for a LinkedIn post about budgeting',
    ],
  },
  {
    id:    'atlas-art-director',
    name:  'Atlas',
    role:  'Creative',
    icon:  '🎨',
    color: '#6366F1',
    about: 'Art director for the brand. Ask for mood direction, visual system decisions, image prompt briefs for Pixel, or a creative review of any campaign.',
    starters: [
      'What visual direction fits the spending challenge campaign?',
      'Write an image brief for Pixel — TikTok thumbnail series',
      'Review our current Instagram aesthetic — what needs to change?',
    ],
  },
  {
    id:    'pixel-production',
    name:  'Pixel',
    role:  'Production',
    icon:  '⚡',
    color: '#EC4899',
    about: 'Turns Atlas briefs into production-ready assets. Ask for optimised image prompts, batch production plans, or technical specs for any format.',
    starters: [
      'Give me a Midjourney prompt for the Hourbour hero visual',
      'What resolution and aspect ratio for a TikTok cover?',
      'Plan an asset batch for the next sprint — 4 pieces',
    ],
  },
];

const AGENT_MAP = Object.fromEntries(AGENTS.map(a => [a.id, a]));

/* ── Types ── */
interface ChatMessage {
  id:       string;
  role:     'user' | 'agent';
  agentId?: string;
  content:  string;
  ts:       string;
}

type ConversationMap = Record<string, ChatMessage[]>;

/* ── Message bubble ── */
function Bubble({ msg, fallbackAgent }: { msg: ChatMessage; fallbackAgent: AgentMeta }) {
  const isUser  = msg.role === 'user';
  const agent   = (msg.agentId ? AGENT_MAP[msg.agentId] : null) ?? fallbackAgent;
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[14px]"
          style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30` }}
        >
          {agent.icon}
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isUser && (
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: agent.color }}>
            {agent.name}
          </span>
        )}
        <div className={`px-4 py-3 rounded-[16px] text-[13px] leading-relaxed ${
          isUser
            ? 'bg-[#0071e3] text-white rounded-tr-[4px]'
            : 'bg-[#1f1f1f] border border-[#353535] text-[#c1c6d6] rounded-tl-[4px]'
        }`}>
          <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
        </div>
        <span className="text-[10px] text-[#8b919f]/60">{msg.ts}</span>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function TeamChatTab() {
  const [venture, setVenture]             = useState('Hourbour');
  const [selected, setSelected]           = useState<string>(ROOM_ID);
  const [conversations, setConversations] = useState<ConversationMap>({});
  const [input, setInput]                 = useState('');
  const [thinking, setThinking]           = useState<string[]>([]);   // agentIds currently "typing" in room
  const [streaming, setStreaming]         = useState<{ agentId: string; content: string } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const slug = getActiveVentureSlugClient();
    if (slug) setVenture(slug === 'novizio' ? 'Novizio' : 'Hourbour');
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversations, streaming, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selected]);

  const isRoom   = selected === ROOM_ID;
  const agent    = AGENTS.find(a => a.id === selected) ?? AGENTS[0];
  const thread   = conversations[selected] ?? [];

  /* ── Send to a single agent ── */
  const sendDirect = useCallback(async (msg: string) => {
    setStreaming({ agentId: selected, content: '' });
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/growth-sprint', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phase: 'message', venture, message: msg, agentId: selected }),
        signal:  abortRef.current.signal,
      });
      if (!res.ok || !res.body) { setStreaming(null); return; }

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf = '', full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
            if (evt.type === 'stream_chunk') { full += evt.content as string; setStreaming({ agentId: selected, content: full }); }
            if (evt.type === 'agent_message') full = evt.content as string;
          } catch { /* skip */ }
        }
      }

      setConversations(prev => ({
        ...prev,
        [selected]: [...(prev[selected] ?? []), {
          id: crypto.randomUUID(), role: 'agent', agentId: selected, content: full,
          ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        }],
      }));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setConversations(prev => ({
          ...prev,
          [selected]: [...(prev[selected] ?? []), {
            id: crypto.randomUUID(), role: 'agent', agentId: selected,
            content: 'Something went wrong. Try again.',
            ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          }],
        }));
      }
    } finally {
      setStreaming(null);
    }
  }, [selected, venture]);

  /* ── Broadcast to all agents ── */
  const sendBroadcast = useCallback(async (msg: string) => {
    setThinking(AGENTS.map(a => a.id));
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/growth-sprint', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phase: 'broadcast', venture, message: msg }),
        signal:  abortRef.current.signal,
      });
      if (!res.ok || !res.body) { setThinking([]); return; }

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
          try {
            const evt = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
            if (evt.type === 'agent_start') {
              // keep others in thinking
            }
            if (evt.type === 'agent_message') {
              const agentId = evt.agentId as string;
              setThinking(prev => prev.filter(id => id !== agentId));
              setConversations(prev => ({
                ...prev,
                [ROOM_ID]: [...(prev[ROOM_ID] ?? []), {
                  id: crypto.randomUUID(), role: 'agent', agentId,
                  content: evt.content as string,
                  ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                }],
              }));
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setConversations(prev => ({
          ...prev,
          [ROOM_ID]: [...(prev[ROOM_ID] ?? []), {
            id: crypto.randomUUID(), role: 'agent', agentId: 'kai-analyst',
            content: 'Broadcast failed. Try again.',
            ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          }],
        }));
      }
    } finally {
      setThinking([]);
    }
  }, [venture]);

  /* ── Unified send ── */
  const sendMessage = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || streaming || thinking.length > 0) return;
    setInput('');

    const ts = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setConversations(prev => ({
      ...prev,
      [selected]: [...(prev[selected] ?? []), { id: crypto.randomUUID(), role: 'user', content: msg, ts }],
    }));

    if (isRoom) await sendBroadcast(msg);
    else        await sendDirect(msg);
  }, [selected, isRoom, streaming, thinking, sendDirect, sendBroadcast]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
  }

  const lastMessage = (id: string) => {
    const c = conversations[id];
    return c && c.length > 0 ? c[c.length - 1] : null;
  };

  const isBusy = !!streaming || thinking.length > 0;

  return (
    <div className="flex gap-0 bg-[#111111] border border-[#353535] rounded-[20px] overflow-hidden" style={{ height: '700px' }}>

      {/* ── Sidebar ── */}
      <div className="w-[260px] flex-shrink-0 border-r border-[#353535] flex flex-col">
        <div className="p-4 border-b border-[#353535]">
          <p className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase">Marketing Team</p>
          <p className="text-[11px] text-[#8b919f]/60 mt-0.5">6 agents · all online</p>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Room entry */}
          <button
            onClick={() => setSelected(ROOM_ID)}
            className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-[#353535] ${
              selected === ROOM_ID ? 'bg-[#1f1f1f]' : 'hover:bg-[#1a1a1a]'
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#353535] border border-[#414753] flex items-center justify-center text-[15px]">
                🏠
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#111111]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-[13px] font-semibold ${selected === ROOM_ID ? 'text-white' : 'text-white/80'}`}>Room</span>
                {lastMessage(ROOM_ID) && <span className="text-[10px] text-[#8b919f]/50">{lastMessage(ROOM_ID)!.ts}</span>}
              </div>
              <p className="text-[10px] font-medium text-[#8b919f] uppercase tracking-wider">All Agents</p>
              {thinking.length > 0 ? (
                <p className="text-[11px] mt-0.5 text-amber-400">{thinking.length} agents typing...</p>
              ) : lastMessage(ROOM_ID) ? (
                <p className="text-[11px] text-[#8b919f]/70 truncate mt-0.5">
                  {lastMessage(ROOM_ID)!.role === 'user' ? 'You: ' : `${AGENT_MAP[lastMessage(ROOM_ID)!.agentId ?? '']?.name ?? ''}: `}
                  {lastMessage(ROOM_ID)!.content.slice(0, 32)}
                </p>
              ) : (
                <p className="text-[11px] text-[#8b919f]/40 mt-0.5 italic">Message all 5 agents at once</p>
              )}
            </div>
          </button>

          {/* Individual agents */}
          {AGENTS.map((a) => {
            const last      = lastMessage(a.id);
            const isActive  = selected === a.id;
            const isTyping  = streaming?.agentId === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-[#353535]/40 relative ${
                  isActive ? 'bg-[#1f1f1f]' : 'hover:bg-[#1a1a1a]'
                }`}
              >
                {isActive && <div className="absolute left-0 top-0 w-0.5 h-full rounded-r" style={{ background: a.color }} />}
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[16px]"
                    style={{ background: `${a.color}15`, border: `1.5px solid ${a.color}30` }}>
                    {a.icon}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#111111]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] font-semibold ${isActive ? 'text-white' : 'text-white/80'}`}>{a.name}</span>
                    {last && <span className="text-[10px] text-[#8b919f]/50">{last.ts}</span>}
                  </div>
                  <p className="text-[10px] font-medium text-[#8b919f] uppercase tracking-wider">{a.role}</p>
                  {isTyping ? (
                    <p className="text-[11px] mt-0.5" style={{ color: a.color }}>typing...</p>
                  ) : last ? (
                    <p className="text-[11px] text-[#8b919f]/70 truncate mt-0.5">
                      {last.role === 'user' ? 'You: ' : ''}{last.content.slice(0, 40)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#8b919f]/40 mt-0.5 italic">No messages yet</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-[#353535] flex-shrink-0">
          {isRoom ? (
            <>
              <div className="w-10 h-10 rounded-full bg-[#353535] border border-[#414753] flex items-center justify-center text-[18px] flex-shrink-0">🏠</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-white">Room</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border text-amber-400 bg-amber-400/10 border-amber-400/20">
                    All Agents
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto">
                    {AGENTS.slice(0, 5).map(a => (
                      <span key={a.id} className="text-[14px]">{a.icon}</span>
                    ))}
                  </span>
                </div>
                <p className="text-[11px] text-[#8b919f]">
                  Everyone responds — Kai (data), Nate (growth), Rio (channels), Lena (content), Atlas (creative)
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] flex-shrink-0"
                style={{ background: `${agent.color}15`, border: `1.5px solid ${agent.color}30` }}>
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-white">{agent.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                    style={{ color: agent.color, background: `${agent.color}10`, borderColor: `${agent.color}25` }}>
                    {agent.role}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 ml-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Online
                  </span>
                </div>
                <p className="text-[11px] text-[#8b919f] truncate">{agent.about}</p>
              </div>
            </>
          )}
        </div>

        {/* Thread */}
        <div ref={threadRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Empty state */}
          {thread.length === 0 && !isBusy && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6">
              {isRoom ? (
                <>
                  <div>
                    <div className="w-16 h-16 rounded-full bg-[#1f1f1f] border border-[#353535] flex items-center justify-center text-[26px] mx-auto mb-4">🏠</div>
                    <h3 className="text-[17px] font-semibold text-white mb-2">Message the whole team</h3>
                    <p className="text-[13px] text-[#8b919f] max-w-sm leading-relaxed">
                      Type one message — all 5 agents respond from their angle simultaneously. Kai gives you the data read, Nate the growth angle, Rio the channel take, Lena the copy angle, Atlas the creative direction.
                    </p>
                  </div>
                  <div className="space-y-2 w-full max-w-sm">
                    <p className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase mb-3">Try asking the room</p>
                    {[
                      "We're launching a spending challenge next week — what does each of you need?",
                      "Instagram engagement dropped 18% — what's everyone's take?",
                      'What should our content focus be for the next 2 weeks?',
                    ].map((s) => (
                      <button key={s} onClick={() => void sendMessage(s)}
                        className="w-full text-left px-4 py-3 bg-[#1f1f1f] border border-[#353535] rounded-[12px] text-[12px] text-[#c1c6d6] hover:border-[#414753] hover:text-white transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-[28px] mx-auto mb-4"
                      style={{ background: `${agent.color}12`, border: `1.5px solid ${agent.color}25` }}>
                      {agent.icon}
                    </div>
                    <h3 className="text-[17px] font-semibold text-white mb-2">Talk to {agent.name}</h3>
                    <p className="text-[13px] text-[#8b919f] max-w-sm leading-relaxed">{agent.about}</p>
                  </div>
                  <div className="space-y-2 w-full max-w-sm">
                    <p className="text-[10px] font-bold tracking-widest text-[#8b919f] uppercase mb-3">Try asking</p>
                    {agent.starters.map((s) => (
                      <button key={s} onClick={() => void sendMessage(s)}
                        className="w-full text-left px-4 py-3 bg-[#1f1f1f] border border-[#353535] rounded-[12px] text-[12px] text-[#c1c6d6] hover:border-[#414753] hover:text-white transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Messages */}
          {thread.map(msg => <Bubble key={msg.id} msg={msg} fallbackAgent={agent} />)}

          {/* Thinking indicators (broadcast) */}
          {thinking.length > 0 && (
            <div className="space-y-2">
              {thinking.map(id => {
                const a = AGENT_MAP[id];
                if (!a) return null;
                return (
                  <div key={id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[14px] flex-shrink-0"
                      style={{ background: `${a.color}18`, border: `1px solid ${a.color}30` }}>
                      {a.icon}
                    </div>
                    <div className="px-4 py-2.5 bg-[#1f1f1f] border border-[#353535] rounded-[14px] rounded-tl-[4px]">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: a.color }}>{a.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Streaming (direct) */}
          {streaming && !isRoom && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[14px]"
                style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30` }}>
                {agent.icon}
              </div>
              <div className="max-w-[75%]">
                <span className="text-[10px] font-bold tracking-widest uppercase block mb-1" style={{ color: agent.color }}>{agent.name}</span>
                <div className="px-4 py-3 rounded-[16px] rounded-tl-[4px] bg-[#1f1f1f] border border-[#353535] text-[13px] text-[#c1c6d6] leading-relaxed">
                  {streaming.content ? (
                    <pre className="whitespace-pre-wrap font-sans">
                      {streaming.content}
                      <span className="inline-block w-0.5 h-3.5 bg-white/60 animate-pulse ml-0.5 align-middle" />
                    </pre>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-[#353535]">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-[#1f1f1f] border border-[#353535] rounded-[16px] px-4 py-3 focus-within:border-[#414753] transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={isRoom ? 'Message all agents — everyone responds...' : `Message ${agent.name}...`}
                disabled={isBusy}
                className="w-full bg-transparent text-[13px] text-white placeholder-[#8b919f] focus:outline-none disabled:opacity-50"
              />
            </div>
            <button
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || isBusy}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-30"
              style={{ background: isRoom ? '#F97316' : agent.color }}
            >
              <span className="material-symbols-outlined text-white text-[18px]">send</span>
            </button>
          </div>
          <p className="text-[10px] text-[#8b919f]/40 mt-2 text-center">
            {isRoom
              ? 'Room · All 5 agents respond simultaneously · Enter to send'
              : `Talking to ${agent.name} · ${agent.role} · Enter to send`}
          </p>
        </div>
      </div>
    </div>
  );
}
