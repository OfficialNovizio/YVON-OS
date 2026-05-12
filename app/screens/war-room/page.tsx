'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { AgentId, ExecutionPlan, RoutingResult, AgentRunStatus, WarRoomEvent, WarRoomPlanRecord, ConflictItem } from '@/lib/types';
import { getActiveVentureSlugClient } from '@/lib/venture-context';

// ─── Agent meta (display only — no runtime import of full agents.ts) ──────────

const AGENT_META: Record<AgentId, { name: string; icon: string; color: string; role: string }> = {
  'marcus-ceo':        { name: 'Marcus',  icon: '👑', color: '#F59E0B', role: 'CEO' },
  'diana-coo':         { name: 'Diana',   icon: '⚙️', color: '#94A3B8', role: 'COO' },
  'dev-lead':          { name: 'Dev',     icon: '💻', color: '#06B6D4', role: 'Lead Dev' },
  'raj-backend':       { name: 'Raj',     icon: '🔧', color: '#8B5CF6', role: 'Backend' },
  'mia-frontend':      { name: 'Mia',     icon: '🎨', color: '#D946EF', role: 'Frontend' },
  'quinn-qa':          { name: 'Quinn',   icon: '🧪', color: '#10B981', role: 'QA' },
  'kai-analyst':       { name: 'Kai',     icon: '📊', color: '#3B82F6', role: 'Analyst' },
  'lena-brand':        { name: 'Lena',    icon: '✍️', color: '#14B8A6', role: 'Brand Voice' },
  'rio-ads':           { name: 'Rio',     icon: '📈', color: '#F97316', role: 'Ads' },
  'nate-growth':       { name: 'Nate',    icon: '🚀', color: '#22C55E', role: 'Growth' },
  'atlas-art-director':{ name: 'Atlas',   icon: '🎨', color: '#6366F1', role: 'Art Director' },
  'pixel-production':  { name: 'Pixel',   icon: '⚡', color: '#8B5CF6', role: 'Production' },
  'felix-finance':     { name: 'Felix',   icon: '💰', color: '#10B981', role: 'Finance' },
  'daniel-kahneman':  { name: 'Kahneman',icon: '🧠', color: '#A78BFA', role: 'Behavioral Economist' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = 'idle' | 'planning' | 'executing' | 'synthesizing' | 'complete' | 'error';

interface TimelineEntry {
  id: number;
  time: string;
  message: string;
  type: 'plan' | 'agent' | 'error' | 'complete' | 'routing' | 'retry' | 'handoff';
  agentId?: AgentId;
}

interface WarRoomState {
  status: SessionStatus;
  plan: ExecutionPlan | null;
  routing: RoutingResult | null;
  activeAgents: AgentId[];
  agentStatus: Partial<Record<AgentId, AgentRunStatus>>;
  agentTasks: Partial<Record<AgentId, string>>;
  timeline: TimelineEntry[];
  synthesis: string;
  elapsed: number;
  confidence: number;
  conflicts: ConflictItem[];
}

const INITIAL_STATE: WarRoomState = {
  status: 'idle',
  plan: null,
  routing: null,
  activeAgents: [],
  agentStatus: {},
  agentTasks: {},
  timeline: [],
  synthesis: '',
  elapsed: 0,
  confidence: 0,
  conflicts: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

let timelineId = 0;
function entry(message: string, type: TimelineEntry['type'], agentId?: AgentId): TimelineEntry {
  return { id: ++timelineId, time: now(), message, type, agentId };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AgentRunStatus }) {
  const cls: Record<AgentRunStatus, string> = {
    idle:     'bg-white/20',
    working:  'bg-yellow-400 animate-pulse',
    done:     'bg-green-400',
    error:    'bg-red-400',
    retrying: 'bg-orange-400 animate-pulse',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${cls[status]}`} />;
}

function AgentCard({
  agentId,
  status,
  task,
  queued,
}: {
  agentId: AgentId;
  status: AgentRunStatus;
  task?: string;
  queued?: boolean;
}) {
  const meta = AGENT_META[agentId];
  const statusLabel: Record<AgentRunStatus, string> = {
    idle:     queued ? 'QUEUED' : 'STANDBY',
    working:  'WORKING',
    done:     'DONE',
    error:    'ERROR',
    retrying: 'RETRY',
  };
  const borderColor = status === 'done' ? 'border-green-400/30'
    : status === 'working' || status === 'retrying' ? 'border-yellow-400/30'
    : status === 'error' ? 'border-red-400/30'
    : queued ? 'border-purple-400/20'
    : 'border-white/5';

  const isActive = status === 'working' || status === 'retrying';

  return (
    <div className={`glass-card rounded-xl p-4 border ${borderColor} transition-all duration-300 ${isActive ? 'scale-[1.02]' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Avatar with animated ring when active */}
          <div className="relative flex-shrink-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
              isActive ? 'bg-yellow-400/10' : status === 'done' ? 'bg-green-400/10' : 'bg-white/5'
            }`}>
              {meta.icon}
            </div>
            {isActive && (
              <span className="absolute inset-0 rounded-full border-2 border-yellow-400/50 animate-ping" />
            )}
            {status === 'done' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border border-[#0a0a0a] flex items-center justify-center">
                <span className="text-[6px] text-black font-bold">✓</span>
              </span>
            )}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white leading-none">{meta.name}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{meta.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot status={status} />
          <span className="text-[9px] font-bold tracking-widest text-white/40">{statusLabel[status]}</span>
        </div>
      </div>
      {task && (
        <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2 mt-1">{task}</p>
      )}
    </div>
  );
}

// ─── Quick-start prompt chips ─────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: 'Review open PRs & issues', icon: 'merge', prompt: 'Review our open GitHub PRs and issues — identify what needs attention most urgently and why.' },
  { label: 'Weekly strategy brief', icon: 'insights', prompt: 'Give me a weekly executive brief — what should we focus on this week across marketing, tech, and growth?' },
  { label: 'Find growth bottlenecks', icon: 'trending_up', prompt: 'Analyze our current growth funnel and identify the top 2 bottlenecks blocking us from scaling faster.' },
  { label: 'Pre-launch checklist', icon: 'rocket_launch', prompt: 'We are preparing for a launch — run a pre-launch check across tech, marketing, and operations. What is missing?' },
];

function QuickPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {QUICK_PROMPTS.map(q => (
        <button
          key={q.label}
          onClick={() => onSelect(q.prompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/50 hover:text-white/80 hover:border-white/15 hover:bg-white/[0.07] transition-all"
        >
          <span className="material-symbols-outlined text-[13px]">{q.icon}</span>
          {q.label}
        </button>
      ))}
    </div>
  );
}

// ─── Action items parser ──────────────────────────────────────────────────────

function parseActionItems(synthesis: string): string[] {
  const items: string[] = []
  const lines = synthesis.split('\n')
  for (const line of lines) {
    const clean = line.trim()
    if (/^[-*•]\s+/.test(clean) || /^\d+\.\s+/.test(clean)) {
      const text = clean.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim()
      if (text.length > 15 && text.length < 160) items.push(text)
    }
  }
  return items.slice(0, 8)
}

function TimelineRow({ entry: e }: { entry: TimelineEntry }) {
  const meta = e.agentId ? AGENT_META[e.agentId] : null;
  const typeColor: Record<TimelineEntry['type'], string> = {
    plan:    'text-[#0071e3]',
    agent:   'text-green-400',
    error:   'text-red-400',
    complete:'text-white/70',
    routing: 'text-yellow-400',
    retry:   'text-orange-400',
    handoff: 'text-purple-400',
  };
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] text-white/30 font-mono tabular-nums mt-0.5 flex-shrink-0">{e.time}</span>
      {meta && (
        <span className="text-[11px] flex-shrink-0" style={{ color: meta.color }}>
          {meta.icon} {meta.name}
        </span>
      )}
      <p className={`text-[11px] leading-relaxed ${typeColor[e.type]}`}>{e.message}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type RepoStatus = 'idle' | 'loading' | 'ready' | 'error' | 'no-repo';

export default function WarRoomPage() {
  const [input, setInput] = useState('');
  const [venture, setVenture] = useState('Novizio');
  const [ventureSlug, setVentureSlug] = useState('');
  const [state, setState] = useState<WarRoomState>(INITIAL_STATE);
  const [githubContext, setGithubContext] = useState('');
  const [repoStatus, setRepoStatus] = useState<RepoStatus>('idle');
  const [repoLabel, setRepoLabel] = useState('');
  const [prStatus, setPrStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [prUrl, setPrUrl] = useState('');
  const [prError, setPrError] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [issueStatus, setIssueStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [issueCount, setIssueCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const synthRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Load active venture + fetch GitHub context on mount
  useEffect(() => {
    const slug = getActiveVentureSlugClient();
    if (!slug) return;
    setVentureSlug(slug);

    async function loadGitHubContext() {
      setRepoStatus('loading');
      try {
        // Get venture name + repo URL
        const ventureRes = await fetch('/api/ventures');
        const ventures = await ventureRes.json() as Array<{ slug: string; name: string; repoUrl?: string }>;
        const v = ventures.find(x => x.slug === slug) ?? ventures[0];
        if (!v) return;
        setVenture(v.name);

        if (!v.repoUrl) { setRepoStatus('no-repo'); return; }

        // Fetch repo snapshot in parallel
        const [repoRes, commitsRes, issuesRes, prsRes] = await Promise.all([
          fetch(`/api/github?venture=${slug}&action=repo`),
          fetch(`/api/github?venture=${slug}&action=commits`),
          fetch(`/api/github?venture=${slug}&action=issues`),
          fetch(`/api/github?venture=${slug}&action=prs`),
        ]);

        if (!repoRes.ok) { setRepoStatus('error'); return; }

        const repo    = await repoRes.json() as { name: string; defaultBranch: string; openIssues: number };
        const commits = commitsRes.ok ? (await commitsRes.json() as { commits: Array<{ sha: string; message: string; author: string; date: string }> }).commits.slice(0, 10) : [];
        const issues  = issuesRes.ok  ? (await issuesRes.json()  as { issues:  Array<{ number: number; title: string; labels: string[] }> }).issues.slice(0, 10)  : [];
        const prs     = prsRes.ok     ? (await prsRes.json()     as { prs:     Array<{ number: number; title: string; head: string; base: string }> }).prs.slice(0, 5)      : [];

        const ctx = [
          `## GitHub Repo: ${repo.name} (branch: ${repo.defaultBranch})`,
          `Open issues: ${repo.openIssues}`,
          '',
          commits.length > 0 ? `### Recent Commits\n${commits.map(c => `- [${c.sha}] ${c.message} (${c.author})`).join('\n')}` : '',
          issues.length > 0  ? `### Open Issues\n${issues.map(i => `- #${i.number}: ${i.title}${i.labels.length ? ` [${i.labels.join(', ')}]` : ''}`).join('\n')}` : '',
          prs.length > 0     ? `### Open PRs\n${prs.map(p => `- #${p.number}: ${p.title} (${p.head} → ${p.base})`).join('\n')}` : '',
        ].filter(Boolean).join('\n');

        setGithubContext(ctx);
        setRepoLabel(repo.name);
        setRepoStatus('ready');
      } catch {
        setRepoStatus('error');
      }
    }

    void loadGitHubContext();
  }, []);

  // Auto-scroll synthesis and timeline
  useEffect(() => {
    synthRef.current?.scrollTo({ top: synthRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.synthesis]);
  useEffect(() => {
    timelineRef.current?.scrollTo({ top: timelineRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.timeline]);

  const pushEntry = useCallback((e: TimelineEntry) => {
    setState(prev => ({ ...prev, timeline: [...prev.timeline, e] }));
  }, []);

  const run = useCallback(async () => {
    if (!input.trim() || state.status !== 'idle') return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState({ ...INITIAL_STATE, status: 'planning' });

    try {
      const res = await fetch('/api/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), ventureName: venture, githubContext: githubContext || undefined }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (raw === '[DONE]') {
            setState(prev => ({ ...prev, status: 'complete' }));
            continue;
          }

          let evt: WarRoomEvent;
          try { evt = JSON.parse(raw); } catch { continue; }

          switch (evt.type) {
            case 'routing':
              setState(prev => ({
                ...prev,
                routing: evt.routing,
                confidence: evt.confidence,
                activeAgents: evt.routing.specialists as AgentId[],
              }));
              pushEntry(entry(
                `Intent: ${evt.routing.intent} — routing to ${evt.routing.specialists.join(', ')}`,
                'routing'
              ));
              break;

            case 'plan':
              setState(prev => ({
                ...prev,
                status: 'executing',
                plan: evt.plan,
              }));
              if (evt.plan) {
                pushEntry(entry(
                  `Plan: ${evt.plan.objective}`,
                  'plan'
                ));
              }
              break;

            case 'agent_start':
              setState(prev => ({
                ...prev,
                agentStatus: { ...prev.agentStatus, [evt.agentId]: 'working' },
                agentTasks: { ...prev.agentTasks, [evt.agentId]: evt.task },
              }));
              pushEntry(entry(`Started`, 'agent', evt.agentId));
              break;

            case 'agent_complete':
              setState(prev => ({
                ...prev,
                agentStatus: { ...prev.agentStatus, [evt.agentId]: 'done' },
              }));
              pushEntry(entry(`Delivered — "${evt.previewText}..."`, 'agent', evt.agentId));
              break;

            case 'agent_error':
              setState(prev => ({
                ...prev,
                agentStatus: { ...prev.agentStatus, [evt.agentId]: 'error' },
              }));
              pushEntry(entry(`Error${evt.fatal ? ' (fatal)' : ''}: ${evt.error}`, 'error', evt.agentId));
              break;

            case 'retry':
              setState(prev => ({
                ...prev,
                agentStatus: { ...prev.agentStatus, [evt.agentId]: 'retrying' },
              }));
              pushEntry(entry(`Retrying (attempt ${evt.attempt})`, 'retry', evt.agentId));
              break;

            case 'conflicts':
              if (evt.conflicts?.length > 0) {
                setState(prev => ({ ...prev, conflicts: evt.conflicts }));
                pushEntry(entry(`${evt.conflicts.length} conflict(s) detected between agents`, 'routing'));
              }
              break;

            case 'handoff':
              pushEntry(entry(
                `Handoff → ${AGENT_META[evt.to]?.name ?? evt.to}: "${evt.summary}"`,
                'handoff',
                evt.from
              ));
              break;

            case 'text':
              setState(prev => ({
                ...prev,
                status: 'synthesizing',
                synthesis: prev.synthesis + evt.content,
              }));
              break;

            case 'plan_complete':
              setState(prev => ({ ...prev, elapsed: evt.elapsed }));
              pushEntry(entry(`Complete — ${(evt.elapsed / 1000).toFixed(1)}s`, 'complete'));
              break;

            case 'error':
              setState(prev => ({ ...prev, status: 'error' }));
              pushEntry(entry(`System error: ${evt.message}`, 'error'));
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setState(prev => ({ ...prev, status: 'error' }));
        pushEntry(entry(`Connection error: ${String(err)}`, 'error'));
      }
    }
  }, [input, venture, state.status, pushEntry]);

  const reset = () => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
    setInput('');
    setPrStatus('idle');
    setPrUrl('');
    setPrError('');
    setCheckedItems(new Set());
    setIssueStatus('idle');
    setIssueCount(0);
  };

  const handleCreateIssues = useCallback(async (items: string[]) => {
    const selected = items.filter((_, i) => checkedItems.has(i));
    if (selected.length === 0 || !ventureSlug) return;
    setIssueStatus('creating');
    try {
      const results = await Promise.all(
        selected.map(title =>
          fetch('/api/github', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ venture: ventureSlug, action: 'create-issue', title, body: `Created from YVON War Room session.\n\n**Venture:** ${venture}\n**Session prompt:** ${input}` }),
          })
        )
      );
      const created = results.filter(r => r.ok).length;
      setIssueCount(created);
      setIssueStatus('done');
    } catch {
      setIssueStatus('error');
    }
  }, [checkedItems, ventureSlug, venture, input]);

  const handleCreatePr = useCallback(async () => {
    if (!state.synthesis || !ventureSlug) return;
    setPrStatus('creating');
    setPrError('');
    try {
      const res = await fetch('/api/github/pr-from-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venture:        ventureSlug,
          synthesis:      state.synthesis,
          sessionSummary: input || undefined,
          agents:         state.activeAgents,
        }),
      });
      const data = await res.json() as {
        ok: boolean; prUrl?: string; reason?: string; message?: string; error?: string;
        committed?: string[]; skipped?: string[];
      };
      if (!data.ok || data.reason === 'no-code-blocks') {
        setPrStatus('error');
        setPrError(data.message ?? data.error ?? 'No file paths found in agent output. Agents must prefix code blocks with `// path/to/file.ts`.');
      } else if (data.prUrl) {
        setPrUrl(data.prUrl);
        setPrStatus('done');
      } else {
        setPrStatus('error');
        setPrError(data.error ?? 'PR creation failed.');
      }
    } catch (err) {
      setPrStatus('error');
      setPrError(String(err));
    }
  }, [state.synthesis, state.activeAgents, ventureSlug, input]);

  const statusLabel: Record<SessionStatus, string> = {
    idle:        'READY',
    planning:    'MARCUS PLANNING',
    executing:   'AGENTS WORKING',
    synthesizing:'MARCUS SYNTHESIZING',
    complete:    'COMPLETE',
    error:       'ERROR',
  };
  const statusColor: Record<SessionStatus, string> = {
    idle:        'text-white/30',
    planning:    'text-yellow-400',
    executing:   'text-[#0071e3]',
    synthesizing:'text-purple-400',
    complete:    'text-green-400',
    error:       'text-red-400',
  };

  const isRunning = state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error';

  // ── Plan History ────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<WarRoomPlanRecord[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/war-room-plans?venture=${encodeURIComponent(venture)}&limit=20`);
      if (res.ok) setHistory(await res.json() as WarRoomPlanRecord[]);
    } catch { /* silent */ } finally {
      setHistoryLoading(false);
    }
  }, [venture]);

  // Reload history when a session completes
  useEffect(() => {
    if (state.status === 'complete') {
      loadHistory();
      setHistoryOpen(true);
    }
  }, [state.status, loadHistory]);

  // Load history on first open
  const handleHistoryToggle = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && history.length === 0) loadHistory();
  };

  function formatElapsed(ms: number | null) {
    if (!ms) return '—';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <main className="pt-20 px-6 pb-16 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-8 pt-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase mb-1">YVON OS</p>
          <h1 className="text-4xl font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>
            War Room
          </h1>
          <p className="text-[13px] text-white/40 mt-1">CEO-orchestrated multi-agent execution</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-bold tracking-widest uppercase ${statusColor[state.status]}`}>
            {statusLabel[state.status]}
          </span>
          {state.elapsed > 0 && (
            <span className="text-[11px] text-white/30 font-mono">
              {(state.elapsed / 1000).toFixed(1)}s
            </span>
          )}
          {state.confidence > 0 && (
            <span className="text-[11px] text-white/30">
              {Math.round(state.confidence * 100)}% confidence
            </span>
          )}
        </div>
      </div>

      {/* GitHub context status bar */}
      <div className={`flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl border text-[11px] font-medium transition-all ${
        repoStatus === 'ready'   ? 'bg-green-500/5 border-green-500/20 text-green-400' :
        repoStatus === 'loading' ? 'bg-white/[0.03] border-white/[0.06] text-white/40' :
        repoStatus === 'error'   ? 'bg-red-500/5 border-red-500/20 text-red-400' :
        repoStatus === 'no-repo' ? 'bg-white/[0.03] border-white/[0.06] text-white/30' :
        'hidden'
      }`}>
        <span className="material-symbols-outlined text-[15px]">
          {repoStatus === 'ready' ? 'check_circle' : repoStatus === 'loading' ? 'sync' : repoStatus === 'error' ? 'error' : 'code_off'}
        </span>
        {repoStatus === 'ready'   && <span>Repo context loaded — <span className="font-mono">{repoLabel}</span> · commits, issues &amp; PRs injected into technical agents</span>}
        {repoStatus === 'loading' && <span>Fetching repo context from GitHub…</span>}
        {repoStatus === 'error'   && <span>Could not load GitHub context — agents will run without repo awareness</span>}
        {repoStatus === 'no-repo' && <span>No GitHub repo linked to this venture — add one in Settings → Venture Profile → Links</span>}
        {repoStatus === 'ready' && (
          <button
            onClick={() => { setRepoStatus('loading'); setGithubContext(''); void (async () => {
              setRepoStatus('loading');
              try {
                const [repoRes, commitsRes, issuesRes, prsRes] = await Promise.all([
                  fetch(`/api/github?venture=${ventureSlug}&action=repo`),
                  fetch(`/api/github?venture=${ventureSlug}&action=commits`),
                  fetch(`/api/github?venture=${ventureSlug}&action=issues`),
                  fetch(`/api/github?venture=${ventureSlug}&action=prs`),
                ]);
                if (!repoRes.ok) { setRepoStatus('error'); return; }
                const repo    = await repoRes.json() as { name: string; defaultBranch: string; openIssues: number };
                const commits = commitsRes.ok ? (await commitsRes.json() as { commits: Array<{ sha: string; message: string; author: string; date: string }> }).commits.slice(0, 10) : [];
                const issues  = issuesRes.ok  ? (await issuesRes.json()  as { issues:  Array<{ number: number; title: string; labels: string[] }> }).issues.slice(0, 10)  : [];
                const prs     = prsRes.ok     ? (await prsRes.json()     as { prs:     Array<{ number: number; title: string; head: string; base: string }> }).prs.slice(0, 5)      : [];
                const ctx = [`## GitHub Repo: ${repo.name} (branch: ${repo.defaultBranch})`, `Open issues: ${repo.openIssues}`, '', commits.length > 0 ? `### Recent Commits\n${commits.map(c => `- [${c.sha}] ${c.message} (${c.author})`).join('\n')}` : '', issues.length > 0 ? `### Open Issues\n${issues.map(i => `- #${i.number}: ${i.title}${i.labels.length ? ` [${i.labels.join(', ')}]` : ''}`).join('\n')}` : '', prs.length > 0 ? `### Open PRs\n${prs.map(p => `- #${p.number}: ${p.title} (${p.head} → ${p.base})`).join('\n')}` : ''].filter(Boolean).join('\n');
                setGithubContext(ctx); setRepoLabel(repo.name); setRepoStatus('ready');
              } catch { setRepoStatus('error'); }
            })(); }}
            className="ml-auto flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-[13px]">refresh</span>
            Refresh
          </button>
        )}
      </div>

      {/* Input */}
      <div className="glass-card rounded-2xl p-5 mb-6 border border-white/5">
        <div className="flex gap-3">
          <div className="flex-1 flex gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
              disabled={isRunning}
              placeholder="What do you need from the team? (Enter to send)"
              rows={2}
              className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/25 resize-none disabled:opacity-40"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={run}
                disabled={isRunning || !input.trim()}
                className="px-5 py-2 rounded-xl bg-[#0071e3] text-white text-[13px] font-semibold hover:bg-[#0077ed] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-1"
              >
                {isRunning ? '...' : 'Send'}
              </button>
              {(isRunning || state.status !== 'idle') && (
                <button
                  onClick={reset}
                  className="px-5 py-2 rounded-xl bg-white/5 text-white/50 text-[13px] font-semibold hover:bg-white/10 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Quick-start prompts — only shown when idle and input is empty */}
        {state.status === 'idle' && !input && (
          <QuickPrompts onSelect={p => setInput(p)} />
        )}
      </div>

      {/* Plan banner */}
      {state.plan && (
        <div className="glass-card rounded-xl p-4 mb-6 border border-[#0071e3]/20 bg-[#0071e3]/5">
          <div className="flex items-start gap-4">
            <span className="text-[10px] font-bold tracking-widest text-[#0071e3] uppercase mt-0.5 flex-shrink-0">Marcus Plan</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white font-medium mb-1">{state.plan.objective}</p>
              <p className="text-[11px] text-white/40">
                {state.plan.order === 'sequential' ? 'Sequential' : 'Parallel'} ·{' '}
                Done when: {state.plan.definition_of_done}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts panel — shown when agents disagree */}
      {state.conflicts.length > 0 && (
        <div className="glass-card rounded-xl p-4 mb-5 border border-orange-400/20 bg-orange-500/[0.04]">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[16px] text-orange-400">warning</span>
            <p className="text-[11px] font-bold tracking-widest text-orange-400 uppercase">
              Agent Disagreements — {state.conflicts.length} conflict{state.conflicts.length > 1 ? 's' : ''} detected
            </p>
            <p className="text-[10px] text-white/30 ml-auto">Marcus will adjudicate in synthesis</p>
          </div>
          <div className="space-y-2">
            {state.conflicts.map((c, i) => (
              <div key={i} className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-[11px] font-semibold text-white/70 mb-2">{c.topic}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm flex-shrink-0">{AGENT_META[c.agentA as AgentId]?.icon ?? '?'}</span>
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{AGENT_META[c.agentA as AgentId]?.name ?? c.agentA}</p>
                      <p className="text-[11px] text-white/55 leading-relaxed">{c.positionA}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm flex-shrink-0">{AGENT_META[c.agentB as AgentId]?.icon ?? '?'}</span>
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{AGENT_META[c.agentB as AgentId]?.name ?? c.agentB}</p>
                      <p className="text-[11px] text-white/55 leading-relaxed">{c.positionB}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 3-column layout */}
      <div className="grid grid-cols-[280px_1fr_280px] gap-5">

        {/* Left: Agent status grid */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase mb-3">Agent Status</p>
          <div className="space-y-3">
            {state.activeAgents.length === 0 ? (
              <div className="glass-card rounded-xl p-4 border border-white/5">
                <p className="text-[12px] text-white/20 text-center">Awaiting routing...</p>
              </div>
            ) : (
              state.activeAgents.map((id, i) => {
                const isSequential = state.plan?.order === 'sequential';
                const agentStatus = state.agentStatus[id] ?? 'idle';
                // In sequential mode, agents that haven't been touched yet are "queued"
                const isQueued = isSequential && agentStatus === 'idle' && i > 0 &&
                  state.activeAgents.slice(0, i).some(prev => (state.agentStatus[prev] ?? 'idle') !== 'done');
                return (
                  <AgentCard
                    key={id}
                    agentId={id}
                    status={agentStatus}
                    task={state.agentTasks[id]}
                    queued={isQueued}
                  />
                );
              })
            )}

            {/* Marcus synthesis card — always shown as endpoint */}
            {state.activeAgents.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[9px] text-white/20">↓</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className={`glass-card rounded-xl p-4 border transition-all duration-300 ${
                  state.status === 'synthesizing' ? 'border-purple-400/30' :
                  state.status === 'complete' ? 'border-green-400/30' : 'border-white/5'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👑</span>
                      <div>
                        <p className="text-[13px] font-semibold text-white leading-none">Marcus</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">CEO Synthesis</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        state.status === 'synthesizing' ? 'bg-purple-400 animate-pulse' :
                        state.status === 'complete' ? 'bg-green-400' : 'bg-white/20'
                      }`} />
                      <span className="text-[9px] font-bold tracking-widest text-white/40">
                        {state.status === 'synthesizing' ? 'WRITING' :
                         state.status === 'complete' ? 'DONE' : 'WAITING'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center: CEO synthesis output */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase mb-3">Executive Response</p>
          <div
            ref={synthRef}
            className="glass-card rounded-2xl p-6 border border-white/5 min-h-[480px] max-h-[640px] overflow-y-auto"
          >
            {!state.synthesis && state.status === 'idle' && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <span className="text-2xl">👑</span>
                </div>
                <p className="text-[13px] text-white/20 max-w-xs leading-relaxed">
                  Send a request and Marcus will coordinate your agents to deliver a unified response.
                </p>
              </div>
            )}
            {!state.synthesis && state.status === 'planning' && (
              <div className="flex items-center gap-3 py-4">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <p className="text-[13px] text-white/40">Marcus is reviewing your request and planning...</p>
              </div>
            )}
            {!state.synthesis && state.status === 'executing' && (
              <div className="flex items-center gap-3 py-4">
                <div className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse" />
                <p className="text-[13px] text-white/40">Specialists working — Marcus will synthesize when ready...</p>
              </div>
            )}
            {state.synthesis && (
              <div className="prose prose-invert prose-sm max-w-none">
                <div
                  className="text-[14px] text-white/85 leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: 'inherit' }}
                >
                  {state.synthesis}
                  {state.status === 'synthesizing' && (
                    <span className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 animate-pulse align-text-bottom" />
                  )}
                </div>
              </div>
            )}

            {/* Action items — parsed from synthesis when complete */}
            {state.status === 'complete' && state.synthesis && (() => {
              const items = parseActionItems(state.synthesis);
              if (items.length === 0) return null;
              return (
                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Action Items</p>
                    {repoStatus === 'ready' && issueStatus === 'idle' && (
                      <button
                        onClick={() => handleCreateIssues(items)}
                        disabled={checkedItems.size === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/50 hover:text-white/80 hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="material-symbols-outlined text-[13px]">add_task</span>
                        Create {checkedItems.size > 0 ? checkedItems.size : ''} GitHub Issue{checkedItems.size !== 1 ? 's' : ''}
                      </button>
                    )}
                    {issueStatus === 'creating' && <span className="text-[11px] text-white/30">Creating issues…</span>}
                    {issueStatus === 'done' && <span className="text-[11px] text-green-400">{issueCount} issue{issueCount !== 1 ? 's' : ''} created ✓</span>}
                    {issueStatus === 'error' && <span className="text-[11px] text-red-400">Failed — retry</span>}
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item, i) => (
                      <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checkedItems.has(i)}
                          onChange={e => {
                            const next = new Set(checkedItems);
                            e.target.checked ? next.add(i) : next.delete(i);
                            setCheckedItems(next);
                          }}
                          className="mt-0.5 flex-shrink-0 accent-[#0071e3]"
                        />
                        <span className="text-[12px] text-white/55 group-hover:text-white/75 leading-relaxed transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Draft PR button — shown after technical session completes with code blocks */}
            {state.status === 'complete' && state.synthesis && repoStatus === 'ready' && (
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                {prStatus === 'idle' && (
                  <button
                    onClick={handleCreatePr}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.07] transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">merge</span>
                    Push to GitHub as Draft PR
                    <span className="text-[10px] text-white/30 ml-1">— agents write, you review & merge</span>
                  </button>
                )}
                {prStatus === 'creating' && (
                  <div className="flex items-center gap-2 text-[12px] text-white/40">
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    Creating branch, committing files, opening draft PR…
                  </div>
                )}
                {prStatus === 'done' && prUrl && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-green-500/[0.06] border border-green-500/20">
                    <span className="material-symbols-outlined text-[16px] text-green-400">check_circle</span>
                    <span className="text-[12px] text-green-400">Draft PR created</span>
                    <a href={prUrl} target="_blank" rel="noreferrer" className="text-[12px] text-[#0071e3] underline underline-offset-2 ml-auto">
                      View PR →
                    </a>
                  </div>
                )}
                {prStatus === 'error' && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/20">
                    <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
                    <span className="text-[12px] text-red-400">{prError}</span>
                    <button onClick={() => setPrStatus('idle')} className="ml-auto text-[11px] text-white/30 hover:text-white/60">Retry</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Execution timeline */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase mb-3">Execution Log</p>
          <div
            ref={timelineRef}
            className="glass-card rounded-2xl p-4 border border-white/5 min-h-[480px] max-h-[640px] overflow-y-auto"
          >
            {state.timeline.length === 0 ? (
              <p className="text-[12px] text-white/20 text-center py-8">Events will appear here...</p>
            ) : (
              state.timeline.map(e => <TimelineRow key={e.id} entry={e} />)
            )}
          </div>
        </div>
      </div>

      {/* Work flow diagram */}
      {state.plan && state.activeAgents.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-white/5 mt-5">
          <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase mb-4">Work Flow</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-2">
              <span className="text-sm">👑</span>
              <span className="text-[12px] text-white/50 font-medium">Marcus</span>
              <span className="text-[10px] text-white/20 ml-1">PLAN</span>
            </div>
            <span className="text-white/20 text-lg">→</span>
            {state.activeAgents.map((id, i) => {
              const meta = AGENT_META[id];
              const s = state.agentStatus[id] ?? 'idle';
              return (
                <div key={id} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 border transition-all ${
                    s === 'done' ? 'bg-green-400/10 border-green-400/20' :
                    s === 'working' || s === 'retrying' ? 'bg-yellow-400/10 border-yellow-400/20' :
                    s === 'error' ? 'bg-red-400/10 border-red-400/20' :
                    'bg-white/5 border-transparent'
                  }`}>
                    <span className="text-sm">{meta.icon}</span>
                    <span className="text-[12px] text-white/70 font-medium">{meta.name}</span>
                    {s === 'done' && <span className="text-green-400 text-[10px] ml-1">✓</span>}
                    {(s === 'working' || s === 'retrying') && <span className="text-yellow-400 text-[10px] ml-1 animate-pulse">●</span>}
                    {s === 'error' && <span className="text-red-400 text-[10px] ml-1">✗</span>}
                  </div>
                  {i < state.activeAgents.length - 1 && (
                    <span className="text-white/20">
                      {state.plan?.order === 'sequential' ? '→' : '∥'}
                    </span>
                  )}
                </div>
              );
            })}
            <span className="text-white/20 text-lg">→</span>
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 border transition-all ${
              state.status === 'complete' ? 'bg-green-400/10 border-green-400/20' :
              state.status === 'synthesizing' ? 'bg-purple-400/10 border-purple-400/20' :
              'bg-white/5 border-transparent'
            }`}>
              <span className="text-sm">👑</span>
              <span className="text-[12px] text-white/70 font-medium">Marcus</span>
              <span className="text-[10px] text-white/30 ml-1">SYNTHESIS</span>
              {state.status === 'complete' && <span className="text-green-400 text-[10px] ml-1">✓</span>}
              {state.status === 'synthesizing' && <span className="text-purple-400 text-[10px] ml-1 animate-pulse">●</span>}
            </div>
          </div>
        </div>
      )}

      {/* Plan History ─────────────────────────────────────────────────────── */}
      <div className="mt-6">
        <button
          onClick={handleHistoryToggle}
          className="flex items-center gap-3 w-full glass-card rounded-2xl px-5 py-4 border border-white/5 hover:border-white/10 transition-colors text-left"
        >
          <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase flex-1">
            Plan History
            {history.length > 0 && (
              <span className="ml-2 text-white/20">({history.length})</span>
            )}
          </span>
          {historyLoading && <span className="w-3 h-3 rounded-full border border-white/20 border-t-white/60 animate-spin" />}
          <span className="text-white/30 text-sm">{historyOpen ? '▲' : '▼'}</span>
        </button>

        {historyOpen && (
          <div className="mt-2 space-y-2">
            {history.length === 0 && !historyLoading && (
              <div className="glass-card rounded-xl p-5 border border-white/5 text-center">
                <p className="text-[12px] text-white/20">No plans saved yet. Send a request to create your first.</p>
              </div>
            )}
            {history.map(plan => (
              <div key={plan.id} className="glass-card rounded-xl border border-white/5 overflow-hidden">
                {/* Plan row */}
                <button
                  onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors text-left"
                >
                  {/* Status dot */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    plan.status === 'complete' ? 'bg-green-400' :
                    plan.status === 'partial'  ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />

                  {/* Prompt */}
                  <p className="flex-1 text-[13px] text-white/70 truncate">{plan.userPrompt}</p>

                  {/* Agents used */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {plan.agentsUsed.map(id => (
                      <span key={id} className="text-sm" title={AGENT_META[id]?.name ?? id}>
                        {AGENT_META[id]?.icon ?? '?'}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <span className="text-[11px] text-white/25 flex-shrink-0 tabular-nums">
                    {formatElapsed(plan.elapsedMs)}
                  </span>
                  <span className="text-[11px] text-white/25 flex-shrink-0">
                    {formatDate(plan.createdAt)}
                  </span>
                  <span className="text-white/20 text-xs ml-1">{expandedPlan === plan.id ? '▲' : '▼'}</span>
                </button>

                {/* Expanded detail */}
                {expandedPlan === plan.id && (
                  <div className="border-t border-white/5 px-5 py-4 space-y-4">
                    {/* Objective + DoD */}
                    {plan.objective && (
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-white/25 uppercase mb-1">Objective</p>
                        <p className="text-[13px] text-white/70">{plan.objective}</p>
                      </div>
                    )}
                    {plan.definitionDone && (
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-white/25 uppercase mb-1">Definition of Done</p>
                        <p className="text-[12px] text-white/50">{plan.definitionDone}</p>
                      </div>
                    )}

                    {/* Agent steps */}
                    {plan.steps.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-white/25 uppercase mb-2">Agent Outputs</p>
                        <div className="space-y-3">
                          {plan.steps.map(step => {
                            const meta = AGENT_META[step.agentId];
                            return (
                              <div key={step.id} className="bg-white/3 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span>{meta?.icon ?? '?'}</span>
                                  <span className="text-[12px] font-semibold text-white/70">{meta?.name ?? step.agentId}</span>
                                  <span className={`text-[9px] font-bold tracking-wider uppercase ml-auto ${
                                    step.status === 'complete' ? 'text-green-400' :
                                    step.status === 'error'    ? 'text-red-400' : 'text-yellow-400'
                                  }`}>{step.status}</span>
                                </div>
                                {step.taskBrief && (
                                  <p className="text-[11px] text-white/35 mb-2 italic">{step.taskBrief}</p>
                                )}
                                {step.outputContent && (
                                  <p className="text-[12px] text-white/55 leading-relaxed line-clamp-4">
                                    {step.outputContent}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Marcus synthesis */}
                    {plan.synthesis && (
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-white/25 uppercase mb-2">Marcus Synthesis (Specialist Outputs)</p>
                        <p className="text-[12px] text-white/45 leading-relaxed line-clamp-6">{plan.synthesis}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
