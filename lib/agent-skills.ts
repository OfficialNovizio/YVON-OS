import type { AgentId, AgentSkill } from '@/lib/types'

export const AGENT_SKILLS: Partial<Record<AgentId, AgentSkill[]>> = {
  'marcus-ceo': [
    { id: 'ceo-brief', label: 'Morning Brief', description: 'Generate today\'s executive briefing', trigger: 'Generate a comprehensive morning brief for me covering: key metrics across all ventures, top priorities for today, risks to watch, and team status.' },
    { id: 'ceo-strategy', label: 'Strategic Review', description: 'Review current strategy and next moves', trigger: 'Conduct a strategic review of YVON. Assess our current position, what\'s working, what\'s not, and recommend the top 3 strategic moves for the next 90 days.' },
    { id: 'ceo-decision', label: 'Decision Framework', description: 'Structure a complex decision', trigger: 'Help me structure a decision I need to make. I\'ll describe the options, and you frame it with: key criteria, trade-offs, risks, recommendation, and how to communicate it to the team.' },
    { id: 'ceo-investors', label: 'Investor Update', description: 'Draft an investor-ready update', trigger: 'Draft a concise investor update covering: what we built, key metrics, what\'s next, and any asks. Keep it confident, data-driven, and under 300 words.' },
  ],

  'diana-coo': [
    { id: 'coo-ops-review', label: 'Ops Review', description: 'Review operational efficiency', trigger: 'Conduct an operations review across YVON. Identify bottlenecks, inefficiencies, and the top 3 process improvements we should implement this quarter.' },
    { id: 'coo-sop', label: 'Write SOP', description: 'Create a standard operating procedure', trigger: 'Help me write a standard operating procedure (SOP) for a recurring process. I\'ll describe the process, and you format it as: purpose, scope, steps, responsible party, and success criteria.' },
    { id: 'coo-scaling', label: 'Scaling Plan', description: 'Plan for scaling operations', trigger: 'Create a scaling plan for our operations. Identify what systems, processes, and hires we need to go from current state to 10x output without proportional cost increase.' },
    { id: 'coo-team-health', label: 'Team Health Check', description: 'Assess team performance and gaps', trigger: 'Run a team health check across the YVON agent team. Identify: who is overloaded, where there are skill gaps, what processes are breaking down, and recommended interventions.' },
  ],

  'sofia-social': [
    { id: 'sofia-caption', label: 'Write Caption', description: 'Write an engaging social media caption', trigger: 'Write an engaging caption for a social media post. Give me 3 variants: one story-driven, one value-led, one punchy/short. Include a strong hook and relevant hashtag suggestions.' },
    { id: 'sofia-reel', label: 'Reel Script', description: 'Script a short-form video', trigger: 'Script a 30-60 second Instagram Reel. Structure it as: hook (0-3s), problem/value setup (3-15s), content delivery (15-50s), CTA (50-60s). Make it conversational and scroll-stopping.' },
    { id: 'sofia-calendar', label: 'Content Calendar', description: 'Plan a week of social content', trigger: 'Create a 7-day content calendar for this venture. For each day: content type (reel/carousel/post), topic, caption angle, and best posting time. Balance educational, entertaining, and promotional content.' },
    { id: 'sofia-engagement', label: 'Engagement Tactics', description: 'Boost engagement on current content', trigger: 'Give me 5 specific engagement tactics to increase interaction on our social posts. Include: comment prompts, story strategies, DM sequences, collab ideas, and a 30-day engagement experiment to test.' },
  ],

  'lena-brand': [
    { id: 'lena-caption', label: 'Write Caption', description: 'Brand-voice caption for any platform', trigger: 'Write a caption in our brand voice. Provide 3 options — one for Instagram, one for LinkedIn, one for email/newsletter. Maintain brand tone: premium, confident, human.' },
    { id: 'lena-hook', label: 'Hook Variants', description: 'Generate 5 content hooks', trigger: 'Generate 5 different content hooks for this topic. For each: opening line (< 8 words), the emotion it triggers, and the content format it works best for (reel, carousel, thread).' },
    { id: 'lena-voice', label: 'Brand Voice Audit', description: 'Audit content for brand voice consistency', trigger: 'Audit this content for brand voice consistency. Check against our brand pillars: Is the tone right? Does it sound like us? What phrases feel off? Rewrite the weakest section.' },
    { id: 'lena-email', label: 'Email Subject Lines', description: 'Generate email subject line options', trigger: 'Write 8 email subject line variants for this campaign. Mix: curiosity, urgency, value, and personalization angles. Include open rate prediction and the psychology behind each.' },
    { id: 'lena-tagline', label: 'Tagline Generator', description: 'Create brand taglines or campaign slogans', trigger: 'Generate 10 tagline or campaign slogan options. Each should be under 8 words, memorable, and reflect our brand positioning. Include the emotion each is designed to trigger.' },
  ],

  'rio-ads': [
    { id: 'rio-ad-copy', label: 'Ad Copy', description: 'Write paid ad copy for any platform', trigger: 'Write ad copy for a paid campaign. Give me variations for: Instagram feed, Instagram Stories, LinkedIn sponsored, and Google search. Each must have a hook, body, and CTA.' },
    { id: 'rio-audience', label: 'Audience Segments', description: 'Define target audience segments', trigger: 'Define 3-5 audience segments for our paid campaigns. For each: demographic profile, psychographic traits, pain points, what messaging resonates, and which platform to target them on.' },
    { id: 'rio-budget', label: 'Budget Allocation', description: 'Recommend ad budget distribution', trigger: 'Recommend a monthly ad budget allocation across channels. Factor in our goals (awareness vs conversion), current CAC benchmarks, and ROI expectations. Justify each allocation decision.' },
    { id: 'rio-creative', label: 'Creative Brief', description: 'Brief a creative ad concept', trigger: 'Create an ad creative brief for our next campaign. Include: concept, visual direction, copy angle, target emotion, format specs (dimensions, duration), and 3 visual hook ideas.' },
  ],

  'kai-analyst': [
    { id: 'kai-metrics', label: 'Metrics Report', description: 'Analyze current performance metrics', trigger: 'Analyze our current performance metrics across social and web. Identify: what\'s growing, what\'s declining, the top opportunity, the biggest risk, and your top 3 recommendations.' },
    { id: 'kai-cohort', label: 'Cohort Analysis', description: 'Break down audience cohort behavior', trigger: 'Run a cohort analysis on our audience data. Segment by acquisition source, engagement level, and content preference. What are the most valuable cohorts and how do we grow them?' },
    { id: 'kai-dashboard', label: 'Dashboard Design', description: 'Design an analytics dashboard', trigger: 'Design a KPI dashboard for this venture. Recommend: the 6 most important metrics to track, how to visualize each, frequency of review, and what thresholds should trigger action.' },
    { id: 'kai-ab-test', label: 'A/B Test Plan', description: 'Design an A/B testing experiment', trigger: 'Design an A/B test for this hypothesis. Define: control vs variant, what we\'re measuring, sample size needed, test duration, statistical significance threshold, and how to interpret results.' },
  ],

  'zara-competitor': [
    { id: 'zara-intel', label: 'Competitor Intel', description: 'Analyze a competitor\'s strategy', trigger: 'Analyze our top competitor\'s strategy. Cover: their content approach, posting frequency, engagement tactics, product positioning, pricing signals, and their apparent weak spots we can exploit.' },
    { id: 'zara-gaps', label: 'Market Gaps', description: 'Identify underserved market opportunities', trigger: 'Identify market gaps our competitors are missing. Analyze: unserved audience segments, content topics they avoid, positioning white space, and emerging trends they\'re ignoring.' },
    { id: 'zara-swot', label: 'SWOT Analysis', description: 'Run a competitive SWOT analysis', trigger: 'Run a SWOT analysis against our main competitors. Be specific and data-driven. For each quadrant, include 3-4 points with evidence. End with: our #1 competitive advantage we should double down on.' },
    { id: 'zara-trends', label: 'Trend Monitoring', description: 'Surface emerging trends in our niche', trigger: 'Surface the top 5 emerging trends in our niche right now. For each: what it is, which competitors are adopting it, how fast it\'s growing, and whether we should jump on it, watch it, or ignore it.' },
  ],

  'nate-growth': [
    { id: 'nate-growth-audit', label: 'Growth Audit', description: 'Full growth funnel audit', trigger: 'Run a growth audit across our full funnel. Analyze: awareness, acquisition, activation, retention, and revenue stages. Identify the biggest leak in the funnel and the highest-leverage fix.' },
    { id: 'nate-experiments', label: 'Growth Experiments', description: 'Propose growth experiments to run', trigger: 'Propose 5 growth experiments we should run this month. For each: hypothesis, channel, mechanic, expected impact, effort required, and how we\'ll measure success. Rank by ICE score.' },
    { id: 'nate-referral', label: 'Referral Program', description: 'Design a referral or viral loop', trigger: 'Design a referral program or viral loop for this venture. Define: the incentive structure, trigger points, user experience, and expected k-factor. What makes someone want to share this?' },
    { id: 'nate-ltv', label: 'LTV Optimization', description: 'Strategies to increase customer LTV', trigger: 'Recommend strategies to increase customer lifetime value. Cover: retention tactics, upsell opportunities, win-back sequences, and loyalty mechanics. Quantify the LTV impact of each.' },
  ],

  'dev-lead': [
    { id: 'dev-arch', label: 'Architecture Review', description: 'Review system architecture decisions', trigger: 'Review the current architecture for this system or feature. Evaluate: scalability, maintainability, security posture, performance bottlenecks, and technical debt. Give a concrete recommendation.' },
    { id: 'dev-api', label: 'API Design', description: 'Design a REST or data API', trigger: 'Design an API for this feature. Define: endpoints, request/response shapes (TypeScript interfaces), error codes, authentication approach, rate limiting, and versioning strategy.' },
    { id: 'dev-review', label: 'Code Review', description: 'Review code for quality and issues', trigger: 'Review this code. Check for: correctness, security vulnerabilities, performance issues, TypeScript errors, edge cases, and adherence to our codebase patterns. Return specific, actionable feedback.' },
    { id: 'dev-debt', label: 'Tech Debt Audit', description: 'Identify and prioritize tech debt', trigger: 'Audit the technical debt in this codebase or module. Categorize by: severity (critical/medium/low), effort to fix, and business impact. Prioritize the top 5 items to address next sprint.' },
    { id: 'dev-perf', label: 'Performance Audit', description: 'Identify performance bottlenecks', trigger: 'Audit this system for performance issues. Check: bundle size, API response times, database query efficiency, caching opportunities, and rendering bottlenecks. Return a prioritized fix list.' },
  ],

  'raj-backend': [
    { id: 'raj-schema', label: 'DB Schema Design', description: 'Design a database schema', trigger: 'Design a database schema for this feature. Define: tables, columns with types, indexes, foreign keys, and any constraints. Include the SQL CREATE TABLE statements and explain key design decisions.' },
    { id: 'raj-api-route', label: 'API Route', description: 'Build a Next.js API route handler', trigger: 'Write a Next.js App Router API route handler for this endpoint. Include: input validation, error handling with proper status codes, TypeScript types, and Supabase integration if needed.' },
    { id: 'raj-query', label: 'Query Optimization', description: 'Optimize a slow database query', trigger: 'Optimize this database query. Analyze: missing indexes, N+1 problems, unnecessary joins, and opportunities for caching. Return the optimized query with an explanation of changes.' },
    { id: 'raj-security', label: 'Security Review', description: 'Review backend security posture', trigger: 'Review this backend code for security issues. Check: input sanitization, SQL injection risks, auth bypass vectors, rate limiting gaps, secret exposure, and API surface area vulnerabilities.' },
  ],

  'mia-frontend': [
    { id: 'mia-component', label: 'Build Component', description: 'Build a React/Next.js component', trigger: 'Build this React component. Use: TypeScript with proper types, Tailwind CSS with our design tokens (CSS variables), no hardcoded colors, mobile-first layout, and clean prop interfaces.' },
    { id: 'mia-layout', label: 'Page Layout', description: 'Design a responsive page layout', trigger: 'Design the layout for this page. Define: grid structure, responsive breakpoints, component hierarchy, state management approach, and which parts should be server vs client components.' },
    { id: 'mia-ux', label: 'UX Improvements', description: 'Identify and fix UX issues', trigger: 'Review this UI for UX issues. Check: information hierarchy, interaction feedback (loading/error states), mobile experience, accessibility, and cognitive load. Suggest specific improvements.' },
    { id: 'mia-animation', label: 'Animation Plan', description: 'Design micro-interactions and animations', trigger: 'Design the micro-interactions and animations for this UI. For each interaction: trigger, animation type (fade/slide/scale), duration, easing, and the CSS or Framer Motion implementation.' },
  ],

  'quinn-qa': [
    { id: 'quinn-test-plan', label: 'Test Plan', description: 'Write a structured test plan', trigger: 'Write a test plan for this feature. Cover: happy path tests, edge cases, error state tests, mobile/responsive checks, accessibility tests, and API response validation. Format as a checklist.' },
    { id: 'quinn-bug-report', label: 'Bug Report', description: 'Write a detailed bug report', trigger: 'Help me write a detailed bug report. Structure it as: title, severity, steps to reproduce, expected behavior, actual behavior, environment details, and potential root cause.' },
    { id: 'quinn-review', label: 'Feature Review', description: 'Review a feature before release', trigger: 'Review this feature before release. Return a structured report: ✅ What works, ⚠️ Edge cases to handle, ❌ Bugs found, 🔧 Recommended fixes. Also confirm build and lint pass.' },
    { id: 'quinn-regression', label: 'Regression Checklist', description: 'Build a regression test checklist', trigger: 'Build a regression test checklist for this change. List all existing features that could be affected, the specific tests to run for each, and the acceptance criteria for sign-off.' },
  ],

  'felix-finance': [
    { id: 'vera-model', label: 'Revenue Model', description: 'Build a revenue projection model', trigger: 'Build a revenue model for this venture. Include: revenue streams, pricing assumptions, volume projections (Month 1, 3, 6, 12), cost structure, gross margin, and break-even analysis. Show your assumptions clearly.' },
    { id: 'vera-roi', label: 'ROI Analysis', description: 'Calculate ROI for an initiative', trigger: 'Calculate the ROI for this initiative. Define: investment required (time + money), expected return (revenue uplift or cost savings), payback period, NPV if applicable, and recommendation to proceed or not.' },
    { id: 'vera-budget', label: 'Budget Breakdown', description: 'Create a budget allocation plan', trigger: 'Create a budget allocation plan for this quarter. Break down by category (marketing, tools, contractors, ads, etc.), justify each allocation, and flag any areas where we are over-invested or under-invested.' },
    { id: 'vera-unit-econ', label: 'Unit Economics', description: 'Analyze unit economics', trigger: 'Analyze the unit economics for this business. Calculate and interpret: CAC, LTV, LTV:CAC ratio, payback period, gross margin per unit, and contribution margin. Flag which levers move the needle most.' },
    { id: 'vera-scenario', label: 'Scenario Planning', description: 'Model best/base/worst case scenarios', trigger: 'Run scenario planning for this financial decision. Model 3 cases: optimistic (+20% assumptions), base (realistic), and pessimistic (-20%). Show how the outcome changes and what triggers each scenario.' },
  ],
}
