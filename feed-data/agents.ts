// feed-data/agents.ts — Demo data for Agents screen Tab 3 (Agent Ops)
// Only loaded in local development. Safe to delete.

export interface AgentOpsDemo {
  agents: {
    id: string; name: string; role: string; department: string; level: number
    status: 'active' | 'idle' | 'offline'
    skillsCount: number
    skills: { name: string; category: string }[]
    memorySize: string; memoryHealth: number
  }[]
  departments: { name: string; agentCount: number; skillsTotal: number }[]
  skillsTotal: number
  activity: { time: string; agent: string; task: string; tokens: number; duration: string; status: 'completed' | 'error' }[]
  tokenBurnData: {
    tokenUsage: { date: string; tokens: number }[]
    costByDept: { department: string; percentage: number; tokens: number; cost: number }[]
    costTrend: { date: string; cost: number }[]
    perAgentBurn: { agent: string; tokens: number; cost: number }[]
    providerHealth: { provider: string; usagePercent: number; balance: number | null; configured: boolean }[]
  }
  projectHealthData: {
    kpi: { toonAvg: number; bundleSize: number; apiSuccess: number; issuesOpen: number; issuesCritical: number }
    toonQuality: { category: string; percent: number; grade: string }[]
    savingsTrend: { date: string; percent: number }[]
    topKMatch: { chunksMatched: number; chunksInjected: number; l1: number; l2: number; ref: number }
    codebase: { lastCompile: string; duration: string; files: number; chunks: number; terms: number; bpe: number; corpusSize: string; compressedSize: string; compressionPercent: number; delta: string; tsErrors: number }
    apiHealth: { status200: number; status400: number; status500: number; total24h: number; errors: number; topError: string }
    promptQuality: { avgContext: string; avgInjected: string; reduction: number; cacheHits: number; bestAgent: string; worstAgent: string }
    issues: { time: string; message: string; severity: 'warning' | 'error' | 'success' }[]
    docCoverage: { dir: string; percent: number; covered: number; total: number }[]
  }
}

const agentsDemo: AgentOpsDemo = {
  agents: [
    { id: 'marcus-ceo', name: 'Marcus', role: 'CEO', department: 'Command', level: 1, status: 'active', skillsCount: 14, memorySize: '12 KB', memoryHealth: 80, skills: [
      { name: 'decision-critic', category: 'marketplace' }, { name: 'business-health-diagnostic', category: 'executive-operations' },
      { name: 'good-strategy-bad-strategy', category: 'marketplace' }, { name: 'strategy-advisor', category: 'marketplace' },
      { name: 'vision', category: 'marketplace' }, { name: 'storytelling', category: 'marketplace' },
      { name: 'creativity-inc', category: 'marketplace' }, { name: 'challenge-protocol', category: 'operating-system' },
      { name: 'focus-protocol', category: 'operating-system' }, { name: 'reality-distortion-field', category: 'operating-system' },
      { name: 'reflection-protocol', category: 'operating-system' }, { name: 'triple-pass-protocol', category: 'operating-system' },
      { name: 'kahneman-routing', category: 'custom' }, { name: 'brand-guardian', category: 'brand' },
    ]},
    { id: 'diana-coo', name: 'Diana', role: 'COO', department: 'Command', level: 1, status: 'active', skillsCount: 23, memorySize: '18 KB', memoryHealth: 95, skills: [] },
    { id: 'board-command', name: 'Board', role: 'Governance Agent', department: 'Command', level: 1, status: 'idle', skillsCount: 5, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'corporate-governance', category: 'custom' }, { name: 'constitution-enforcement', category: 'custom' },
      { name: 'risk-assessment-matrix', category: 'custom' }, { name: 'reflection-protocol', category: 'operating-system' },
      { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
    { id: 'comply-legal', name: 'Comply', role: 'Compliance Officer', department: 'Legal', level: 2, status: 'idle', skillsCount: 6, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'gdpr-compliance', category: 'custom' }, { name: 'soc2-framework', category: 'custom' },
      { name: 'regulatory-monitoring', category: 'custom' }, { name: 'data-privacy-audit', category: 'custom' },
      { name: 'reflection-protocol', category: 'operating-system' }, { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
    { id: 'docs-legal', name: 'Docs', role: 'Documentation Officer', department: 'Legal', level: 2, status: 'idle', skillsCount: 5, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'tos-drafting', category: 'custom' }, { name: 'privacy-policy-builder', category: 'custom' },
      { name: 'nda-templates', category: 'custom' }, { name: 'reflection-protocol', category: 'operating-system' },
      { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
    { id: 'guard-legal', name: 'Guard', role: 'IP Protection Officer', department: 'Legal', level: 2, status: 'idle', skillsCount: 5, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'open-source-compliance', category: 'custom' }, { name: 'trademark-protection', category: 'custom' },
      { name: 'patent-landscape', category: 'custom' }, { name: 'reflection-protocol', category: 'operating-system' },
      { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
    { id: 'forge-sense', name: 'Forge', role: 'Method Discovery', department: 'Sense', level: 2, status: 'idle', skillsCount: 5, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'benchmark-methodology', category: 'custom' }, { name: 'paper-reproduction', category: 'custom' },
      { name: 'model-evaluation-framework', category: 'custom' }, { name: 'reflection-protocol', category: 'operating-system' },
      { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
    { id: 'radar-sense', name: 'Radar', role: 'Market Intelligence', department: 'Sense', level: 2, status: 'idle', skillsCount: 5, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'competitor-intelligence', category: 'custom' }, { name: 'market-sizing', category: 'custom' },
      { name: 'trend-detection', category: 'custom' }, { name: 'reflection-protocol', category: 'operating-system' },
      { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
    { id: 'scout-sense', name: 'Scout', role: 'Internet Discovery', department: 'Sense', level: 2, status: 'idle', skillsCount: 5, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'tool-evaluation', category: 'custom' }, { name: 'api-assessment', category: 'custom' },
      { name: 'emerging-tech-radar', category: 'custom' }, { name: 'reflection-protocol', category: 'operating-system' },
      { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
    { id: 'depth-research', name: 'Depth', role: 'Deep Research', department: 'Research', level: 3, status: 'idle', skillsCount: 5, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'research-methodology', category: 'custom' }, { name: 'competitive-teardown', category: 'custom' },
      { name: 'market-mapping', category: 'custom' }, { name: 'reflection-protocol', category: 'operating-system' },
      { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
    { id: 'synth-research', name: 'Synth', role: 'Synthesis', department: 'Research', level: 3, status: 'idle', skillsCount: 5, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'research-synthesis', category: 'custom' }, { name: 'thesis-building', category: 'custom' },
      { name: 'recommendation-framework', category: 'custom' }, { name: 'reflection-protocol', category: 'operating-system' },
      { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
    { id: 'vette-research', name: 'Vette', role: 'Fact Verification', department: 'Research', level: 3, status: 'idle', skillsCount: 5, memorySize: '2 KB', memoryHealth: 30, skills: [
      { name: 'fact-checking', category: 'custom' }, { name: 'source-credibility', category: 'custom' },
      { name: 'misinformation-detection', category: 'custom' }, { name: 'reflection-protocol', category: 'operating-system' },
      { name: 'triple-pass-protocol', category: 'operating-system' },
    ]},
  ],
  departments: [
    { name: 'Command', agentCount: 3, skillsTotal: 42 },
    { name: 'Legal', agentCount: 3, skillsTotal: 16 },
    { name: 'Sense', agentCount: 3, skillsTotal: 15 },
    { name: 'Research', agentCount: 3, skillsTotal: 15 },
    { name: 'Finance', agentCount: 1, skillsTotal: 16 },
    { name: 'Marketing', agentCount: 6, skillsTotal: 13 },
    { name: 'Technical', agentCount: 4, skillsTotal: 22 },
  ],
  skillsTotal: 139,
  activity: [
    { time: '14:32', agent: 'Marcus', task: 'Council synthesis — Launch Hourbour MVP', tokens: 2100, duration: '45s', status: 'completed' },
    { time: '14:28', agent: 'Comply', task: 'GDPR audit — Hourbour processing activity', tokens: 1800, duration: '38s', status: 'completed' },
    { time: '14:15', agent: 'Felix', task: 'Runway projection — Q2 burn rate', tokens: 950, duration: '22s', status: 'completed' },
    { time: '13:50', agent: 'Dev', task: 'PR review #142 — API route refactor', tokens: 3200, duration: '120s', status: 'completed' },
    { time: '13:12', agent: 'Kai', task: 'Competitor analysis — Hourglass positioning', tokens: 2500, duration: '65s', status: 'completed' },
    { time: '12:45', agent: 'Diana', task: 'Sprint planning — Q3 roadmap', tokens: 1500, duration: '40s', status: 'completed' },
    { time: '12:10', agent: 'Mia', task: 'UI component — glass-card refactor', tokens: 2800, duration: '90s', status: 'completed' },
    { time: '11:30', agent: 'Board', task: 'Constitutional review — new agent approvals', tokens: 800, duration: '15s', status: 'completed' },
    { time: '11:05', agent: 'Scout', task: 'Tool discovery — new AI agent frameworks', tokens: 3400, duration: '85s', status: 'completed' },
  ],
  tokenBurnData: {
    tokenUsage: [
      { date: 'Jun 9', tokens: 18000000 }, { date: 'Jun 10', tokens: 22000000 }, { date: 'Jun 11', tokens: 28000000 },
      { date: 'Jun 12', tokens: 31000000 }, { date: 'Jun 13', tokens: 29000000 }, { date: 'Jun 14', tokens: 27000000 },
    ],
    costByDept: [
      { department: 'Command', percentage: 32, tokens: 259000000, cost: 0.27 },
      { department: 'Marketing', percentage: 24, tokens: 194000000, cost: 0.20 },
      { department: 'Technical', percentage: 16, tokens: 129000000, cost: 0.14 },
      { department: 'Legal', percentage: 12, tokens: 97000000, cost: 0.10 },
      { department: 'Finance', percentage: 8, tokens: 65000000, cost: 0.07 },
      { department: 'Sense', percentage: 5, tokens: 40000000, cost: 0.04 },
      { department: 'Research', percentage: 3, tokens: 24000000, cost: 0.03 },
    ],
    costTrend: [
      { date: 'Jun 9', cost: 0.72 }, { date: 'Jun 10', cost: 0.88 }, { date: 'Jun 11', cost: 1.12 },
      { date: 'Jun 12', cost: 0.95 }, { date: 'Jun 13', cost: 0.91 }, { date: 'Jun 14', cost: 0.85 },
    ],
    perAgentBurn: [
      { agent: 'Marcus', tokens: 245000, cost: 0.18 }, { agent: 'Kai', tokens: 180000, cost: 0.13 },
      { agent: 'Dev', tokens: 152000, cost: 0.11 }, { agent: 'Diana', tokens: 128000, cost: 0.09 },
      { agent: 'Felix', tokens: 95000, cost: 0.07 }, { agent: 'Mia', tokens: 82000, cost: 0.06 },
      { agent: 'Scout', tokens: 68000, cost: 0.05 }, { agent: 'Raj', tokens: 55000, cost: 0.04 },
    ],
    providerHealth: [
      { provider: 'DeepSeek', usagePercent: 82, balance: 6.95, configured: true },
      { provider: 'OpenAI', usagePercent: 0, balance: null, configured: false },
      { provider: 'Claude', usagePercent: 0, balance: null, configured: false },
    ],
  },
  projectHealthData: {
    kpi: { toonAvg: 94, bundleSize: 208, apiSuccess: 99.2, issuesOpen: 3, issuesCritical: 0 },
    toonQuality: [
      { category: 'Documents', percent: 96, grade: 'A+' }, { category: 'Code', percent: 91, grade: 'A' },
      { category: 'Memory', percent: 92, grade: 'A' }, { category: 'Schemas', percent: 97, grade: 'A+' },
      { category: 'Configs', percent: 99, grade: 'A+' }, { category: 'Scripts', percent: 85, grade: 'B' },
      { category: 'Graphs', percent: 93, grade: 'A' },
    ],
    savingsTrend: [
      { date: 'Jun 8', percent: 92 }, { date: 'Jun 9', percent: 93 }, { date: 'Jun 10', percent: 92 },
      { date: 'Jun 11', percent: 94 }, { date: 'Jun 12', percent: 94 }, { date: 'Jun 13', percent: 93 },
      { date: 'Jun 14', percent: 94 },
    ],
    topKMatch: { chunksMatched: 4.2, chunksInjected: 3.8, l1: 82, l2: 14, ref: 4 },
    codebase: { lastCompile: '14:22', duration: '2m 34s', files: 847, chunks: 2341, terms: 18492, bpe: 256, corpusSize: '5.2 MB', compressedSize: '1.8 MB', compressionPercent: 65, delta: '+12 files · +89 chunks', tsErrors: 0 },
    apiHealth: { status200: 99, status400: 1, status500: 0, total24h: 1847, errors: 3, topError: '/api/trending 3× 400 in 24h' },
    promptQuality: { avgContext: '12.4 KB', avgInjected: '1.8 KB', reduction: 85, cacheHits: 62, bestAgent: 'dev-lead', worstAgent: 'kai' },
    issues: [
      { time: '14:22', message: '/api/trending 400 ×3 "invalid key"', severity: 'warning' },
      { time: '12:05', message: 'TOON compile 3× stall scripts dir', severity: 'warning' },
      { time: '10:47', message: '/api/competitor timeout >5s', severity: 'warning' },
      { time: '09:00', message: 'Health check ALL PASSED', severity: 'success' },
      { time: '03:00', message: 'Cron cleanup SUCCESS', severity: 'success' },
    ],
    docCoverage: [
      { dir: 'app', percent: 78, covered: 147, total: 188 },
      { dir: 'lib', percent: 92, covered: 34, total: 37 },
      { dir: 'components', percent: 65, covered: 18, total: 28 },
      { dir: 'scripts', percent: 42, covered: 6, total: 14 },
    ],
  },
}

export default agentsDemo
