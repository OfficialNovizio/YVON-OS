// feed-data/council.ts — Demo data for Advisory Council
// Only loaded in local development. Safe to delete — app falls back to live API.
// Vercel (production) never loads this file.

export interface CouncilDemoData {
  topic: string
  context: string
  decisionType: string
  urgency: string
  result: {
    decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
    rationale: string
    conditions: string[]
    risks_accepted: string[]
    next_steps: string[]
    positions: Array<{
      agent: string
      role: string
      thesis: string
      recommendation: string
      score?: number
    }>
    legal_findings?: Array<{
      agent: string
      role: string
      finding: string
      risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
      recommendation: string
    }>
    board_ruling?: {
      passed: boolean
      violations: string[]
      required_fixes: string[]
      ruling: 'APPROVED' | 'CONDITIONAL' | 'REJECTED' | 'ESCALATED'
    }
    bias_audit?: string
    total_tokens: number
    duration_ms: number
    mode: 'live' | 'simulated'
  }
  debate: Array<{
    agent: string
    role: string
    text: string
    delay: number
  }>
}

const councilDemo: CouncilDemoData = {
  topic: 'Launch Hourbour MVP without SOC2 certification?',
  context: 'Hourbour is our fintech SaaS. MVP is ready. Enterprise leads are asking about SOC2. Do we launch now without SOC2 and get it within 90 days, or delay launch until SOC2 Type I is complete?',
  decisionType: 'product_launch',
  urgency: 'high',

  result: {
    decision: 'CONDITIONAL',
    rationale: 'Council conditionally approves: Launch Hourbour MVP within 2 weeks, but lock in SOC2 Type I audit within 30 days. Enterprise leads can be converted with a SOC2 roadmap commitment. Delaying launch costs us 2-3 enterprise deals at $15K ACV each — that is not acceptable given our runway position.',
    conditions: [
      'SOC2 Type I audit initiated within 30 days',
      'Penetration test completed before launch',
      'Data Processing Agreement ready for enterprise leads',
      'Privacy Policy updated with SOC2 in-progress language',
      'GDPR Art. 30 ROPA updated for Hourbour processing',
    ],
    risks_accepted: [
      'Enterprise deals may require live SOC2 before close (not just initiated)',
      'SOC2 Type I takes 2-3 months — we are exposed during that window',
      'If SOC2 fails, enterprise credibility damaged',
      '$25K audit cost impacts Q2 runway',
    ],
    next_steps: [
      'Diana: Create 2-week launch sprint with milestones',
      'Comply: Begin SOC2 Type I gap assessment this week',
      'Felix: Model $25K SOC2 cost against $45K enterprise pipeline',
      'Dev: Complete penetration test before launch date',
      'Docs: Draft enterprise-ready DPA and updated Privacy Policy',
    ],
    positions: [
      {
        agent: 'marcus-ceo',
        role: 'CEO',
        thesis: 'Launch now, SOC2 in parallel. We have 3 enterprise leads worth $45K ARR combined. Delaying launch by 3 months for SOC2 costs us $11K in lost revenue — plus market timing risk. The MVP is solid. Ship it, commit to SOC2 publicly, and use the enterprise pipeline to justify the audit cost. Score: 8/10 strategic alignment.',
        recommendation: 'PROCEED',
        score: 8,
      },
      {
        agent: 'diana-coo',
        role: 'COO',
        thesis: 'Operationally feasible but tight. Launch sprint takes 2 weeks. Pen test can run in parallel — Dev estimates 5 days. SOC2 gap assessment adds 2 weeks to existing roadmap. Team capacity exists if we deprioritize the analytics dashboard v2. Risk: pen test findings could delay launch beyond the 2-week window. Recommend buffer of 1 extra week.',
        recommendation: 'PROCEED',
        score: 7,
      },
      {
        agent: 'felix-finance',
        role: 'CFO',
        thesis: 'Financial analysis says launch. SOC2 Type I costs $25K. Enterprise pipeline of 3 leads at $15K ACV = $45K potential. Even at 50% close rate, we net $22.5K against $25K cost — negative on first 3 deals. But: SOC2 unlocks the ENTIRE enterprise segment, not just these 3. Lifetime value of SOC2 certification far exceeds audit cost. Approval conditional on enterprise pipeline validation within 30 days.',
        recommendation: 'PROCEED',
        score: 7,
      },
      {
        agent: 'kai-marketing',
        role: 'CMO',
        thesis: 'Market timing is right — fintech SaaS buyers increasingly require SOC2 even at Series A stage. Launching with "SOC2 in progress" is a credible story that competitor Hourglass used successfully in Q1. Competitor landscape: 3 direct competitors all have SOC2. Delaying launch keeps us invisible while they capture enterprise mindshare. Launch now, market SOC2 commitment aggressively. Score: 9/10.',
        recommendation: 'PROCEED',
        score: 9,
      },
    ],
    legal_findings: [
      {
        agent: 'comply-legal',
        role: 'Compliance Officer',
        finding: 'Product launch with SOC2 pending is acceptable from a regulatory standpoint, but three gaps require immediate attention: (1) GDPR Art. 5 requires lawful basis for all Hourbour data processing — the current Privacy Policy does not cover fintech-specific data categories. (2) Under SOC2 Trust Services Criteria, Security is mandatory — the pen test must be completed before launch, not after. (3) EU AI Act classification: if Hourbour uses any automated decision-making for financial recommendations, it triggers high-risk classification requiring conformity assessment.',
        risk_level: 'medium',
        recommendation: 'Complete pen test before launch. Update Privacy Policy with fintech data categories. File ROPA update for Hourbour processing activity. Flag if any automated financial decision-making triggers EU AI Act high-risk classification.',
      },
    ],
    board_ruling: {
      passed: true,
      violations: [],
      required_fixes: [
        'Privacy Policy update before launch — fintech data categories',
        'GDPR Art. 30 ROPA entry for Hourbour processing',
        'Penetration test report attached to launch checklist',
      ],
      ruling: 'CONDITIONAL',
    },
    bias_audit: 'BIAS_TYPE: Overconfidence detected. Council shows strong consensus (4/4 PROCEED) without sufficient challenge to the assumption that enterprise leads will accept "SOC2 in progress." Felix flagged this partially. CORRECTION: Add a 30-day check-in — if zero enterprise deals close in that window, re-evaluate whether delaying for full SOC2 would have been the better decision.',
    total_tokens: 8421,
    duration_ms: 362000,
    mode: 'live',
  },

  debate: [
    { agent: 'system', role: 'Council', text: 'Convening: "Launch Hourbour MVP without SOC2 certification?"\nUrgency: high · Type: product_launch\nCouncil: Marcus (CEO), Diana (COO), Felix (CFO), Kai (CMO)\nLegal: Comply · Validator: Kahneman · Gate: Board', delay: 0 },
    { agent: 'marcus-ceo', role: 'CEO (PROCEED · 8/10)', text: 'Launch now, SOC2 in parallel. We have 3 enterprise leads worth $45K ARR combined. Delaying launch by 3 months for SOC2 costs us $11K in lost revenue — plus market timing risk. The MVP is solid. Ship it, commit to SOC2 publicly, and use the enterprise pipeline to justify the audit cost.', delay: 800 },
    { agent: 'diana-coo', role: 'COO (PROCEED · 7/10)', text: 'Operationally feasible but tight. Launch sprint takes 2 weeks. Pen test can run in parallel — Dev estimates 5 days. SOC2 gap assessment adds 2 weeks to existing roadmap. Team capacity exists if we deprioritize the analytics dashboard v2.', delay: 600 },
    { agent: 'felix-finance', role: 'CFO (PROCEED · 7/10)', text: 'Financial analysis says launch. SOC2 Type I costs $25K. Enterprise pipeline of 3 leads at $15K ACV = $45K potential. Even at 50% close rate, we net $22.5K against $25K cost — negative on first 3 deals. But SOC2 unlocks the ENTIRE enterprise segment.', delay: 600 },
    { agent: 'kai-marketing', role: 'CMO (PROCEED · 9/10)', text: 'Market timing is right — fintech SaaS buyers increasingly require SOC2 even at Series A stage. Launching with "SOC2 in progress" is a credible story that competitor Hourglass used successfully in Q1. 3 direct competitors all have SOC2. Launch now.', delay: 600 },
    { agent: 'comply-legal', role: '⚖ Compliance Officer — medium', text: 'Product launch with SOC2 pending is acceptable, but three gaps: (1) GDPR Art. 5 — Privacy Policy lacks fintech data categories. (2) SOC2 Security TSC — pen test must complete before launch. (3) EU AI Act — check if automated financial decisions trigger high-risk classification.\n→ Complete pen test before launch. Update Privacy Policy. File ROPA update.', delay: 500 },
    { agent: 'marcus-ceo', role: 'CEO — SYNTHESIS', text: 'DECISION: CONDITIONAL\nCouncil conditionally approves: Launch Hourbour MVP within 2 weeks, but lock in SOC2 Type I audit within 30 days. Enterprise leads can be converted with a SOC2 roadmap commitment. Delaying launch costs us 2-3 enterprise deals at $15K ACV each.', delay: 800 },
    { agent: 'kahneman-psychology', role: '🧠 Bias Audit', text: 'BIAS_TYPE: Overconfidence detected. Council shows strong consensus (4/4 PROCEED) without sufficient challenge to the assumption that enterprise leads will accept "SOC2 in progress." CORRECTION: Add a 30-day check-in.', delay: 500 },
    { agent: 'board-command', role: '🏛 Board Gate — CONDITIONAL', text: 'Fixes required:\n• Privacy Policy update before launch — fintech data categories\n• GDPR Art. 30 ROPA entry for Hourbour processing\n• Penetration test report attached to launch checklist', delay: 500 },
  ],
}

export default councilDemo
