'use client'

import { useState, useEffect, useMemo } from 'react'

type Venture = 'Novizio' | 'Hourbour'
type Tab = 'Brand Identity' | 'Growth Strategy' | 'Tactics Library' | 'Community'
const TABS: Tab[] = ['Brand Identity', 'Growth Strategy', 'Tactics Library', 'Community']

// ── Local Helpers ─────────────────────────────────────────────────────────────

function SH({ children, sub, right }: { children: React.ReactNode; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)' }}>{children}</div>
        {sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', marginTop: '2px' }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

function Badge({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', color, border: `1px solid ${color}`, background: bg || 'transparent', padding: '1px 6px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function NextMoveCard({ text }: { text: string }) {
  return (
    <div style={{ background: 'var(--sf)', borderLeft: '3px solid var(--am)', padding: '12px 16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--am)', marginBottom: '4px' }}>Next Move</div>
      </div>
      <div style={{ fontSize: '13px', color: 'var(--tx)', lineHeight: 1.55 }}>{text}</div>
    </div>
  )
}

function StatsRow({ cards }: { cards: Array<{ label: string; value: string; sub?: string; subColor?: string }> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cards.length}, 1fr)`, gap: '1px', background: 'var(--b1)', marginBottom: '28px' }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: 'var(--sf)', padding: '16px 18px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mu)', marginBottom: '8px' }}>{c.label}</div>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: 'var(--br)', lineHeight: 1 }}>{c.value}</div>
          {c.sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: c.subColor || 'var(--di)', marginTop: '4px' }}>{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}

function StatusDot({ status }: { status: 'done' | 'needs-update' | 'missing' }) {
  const map = { done: { color: 'var(--gn)', label: '✓' }, 'needs-update': { color: 'var(--am)', label: '⚠' }, missing: { color: 'var(--rd)', label: '✗' } }
  const { color, label } = map[status]
  return (
    <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color, fontWeight: 600 }}>{label}</span>
  )
}

// ── VENTURE DATA ──────────────────────────────────────────────────────────────

type TrendSignal = 'Hot' | 'Rising' | 'Established'
type Difficulty = 'Easy' | 'Medium' | 'Hard'
type FocusLevel = 'Primary' | 'Secondary' | 'Paused'
type ExperimentStatus = 'Running' | 'Done' | 'Abandoned'
type CollabStage = 'Prospect' | 'Reached Out' | 'Live' | 'Done'
type ChecklistStatus = 'done' | 'needs-update' | 'missing'
type UGCStatus = 'Spotted' | 'Permission Requested' | 'Approved' | 'Published'
type InitiativeStatus = 'Planning' | 'Active' | 'Done'
type InitiativeType = 'Poll' | 'Q&A' | 'Challenge' | 'Giveaway' | 'Live'

interface Tactic {
  id: string
  name: string
  whyItsGrowing: string
  howToApply: string
  difficulty: Difficulty
  trendSignal: TrendSignal
}

interface VentureData {
  pulse: {
    momentumScore: number
    momentumTrend: 'up' | 'down'
    growthBlocker: string
    todayPriority: string
  }
  identity: {
    nextMove: string
    positioningStatement: string
    pillars: Array<{ name: string; belief: string; example: string }>
    toneOfVoice: { dos: string[]; donts: string[] }
    visualChecklist: Array<{ platform: string; items: Array<{ label: string; status: ChecklistStatus }> }>
    voiceLibrary: {
      pillars: Array<{ icon: string; name: string; desc: string; quote: string }>
      dials: Array<{ left: string; right: string; value: number }>
      approved: string[]
      banned: string[]
      examples: Array<{ channel: string; content: string; note: string }>
    }
  }
  growth: {
    nextMove: string
    stats: { organicGrowthRate: string; activeExperiments: number; topChannel: string }
    channels: Array<{ name: string; focus: FocusLevel; rationale: string; lastActive: string }>
    experiments: Array<{ id: string; hypothesis: string; status: ExperimentStatus; result?: string }>
    collabs: Array<{ id: string; name: string; platform: string; audienceSize: string; stage: CollabStage; notes: string }>
  }
  tactics: Tactic[]
  community: {
    nextMove: string
    stats: { ugcSpotted: number; avgReplyRate: string; activeInitiatives: number }
    ugcPieces: Array<{ id: string; description: string; platform: string; source: string; dateSpotted: string; status: UGCStatus }>
    engagementHabits: Array<{ label: string; target: string; actual: string; onTarget: boolean }>
    initiatives: Array<{ id: string; type: InitiativeType; platform: string; status: InitiativeStatus; startDate: string; outcomeNotes: string }>
  }
}

const VENTURE_DATA: Record<Venture, VentureData> = {
  Novizio: {
    pulse: {
      momentumScore: 72,
      momentumTrend: 'up',
      growthBlocker: 'LinkedIn has been silent for 14 days — the thought leadership gap against COS is widening.',
      todayPriority: 'Publish the supply chain transparency Reel — the content window closes this week.',
    },
    identity: {
      nextMove: 'Your Instagram bio still uses a generic tagline. Update it to reflect the new positioning statement — this is the first thing a new follower reads.',
      positioningStatement: 'Novizio makes considered clothing for people who buy less and choose better.',
      pillars: [
        { name: 'Craft', belief: 'Every piece is made to outlast the trend that inspired it.', example: 'Reformation\'s supply chain series — but deeper, more personal.' },
        { name: 'Restraint', belief: 'The best wardrobe is one where nothing needs replacing.', example: 'Arket\'s "Made in Portugal" static post — origin story as trust signal.' },
        { name: 'Honesty', belief: 'We say what something costs to make, not just what it costs to buy.', example: 'Patagonia\'s transparency reports — radical openness as brand identity.' },
      ],
      toneOfVoice: {
        dos: ['Write short sentences. One idea per line.', 'Let the product speak — describe it, don\'t hype it.', 'Use "you" sparingly. Let the work do the persuading.'],
        donts: ['No exclamation marks — ever.', 'No "must-have", "flying off the shelves", "limited time".', 'No superlatives: incredible, amazing, best, perfect.'],
      },
      visualChecklist: [
        { platform: 'Instagram', items: [{ label: 'Profile photo', status: 'done' }, { label: 'Bio', status: 'needs-update' }, { label: 'Link in bio', status: 'done' }, { label: 'Story highlights', status: 'needs-update' }, { label: 'Pinned post', status: 'missing' }] },
        { platform: 'TikTok', items: [{ label: 'Profile photo', status: 'done' }, { label: 'Bio', status: 'done' }, { label: 'Link in bio', status: 'done' }, { label: 'Story highlights', status: 'missing' }, { label: 'Pinned post', status: 'done' }] },
        { platform: 'LinkedIn', items: [{ label: 'Profile photo', status: 'missing' }, { label: 'Bio', status: 'missing' }, { label: 'Link in bio', status: 'missing' }, { label: 'Story highlights', status: 'missing' }, { label: 'Pinned post', status: 'missing' }] },
      ],
      voiceLibrary: {
        pillars: [
          { icon: '◎', name: 'Effortless', desc: 'Style should feel inevitable, not laboured. Novizio copy never tries too hard. It whispers, not shouts.', quote: '"This is the piece you\'ll reach for without thinking." Not: "Our must-have bestseller that\'s flying off the shelves!"' },
          { icon: '◇', name: 'Intentional', desc: 'Every piece exists for a reason. Copy communicates considered design — the why behind each item. Anti-trend, pro-investment.', quote: '"Built to last a decade, not a season." Not: "Get ahead of the trends this summer."' },
          { icon: '◇', name: 'Understated', desc: 'Minimalist in language as in design. Short sentences. No hyperbole. Let the product speak. Avoid superlatives entirely.', quote: '"Wear it everywhere." Not: "The most versatile, incredible piece you\'ll ever own!"' },
        ],
        dials: [
          { left: 'Casual', right: 'Formal', value: 72 },
          { left: 'Playful', right: 'Serious', value: 62 },
          { left: 'Warm', right: 'Cold', value: 42 },
          { left: 'Minimal', right: 'Elaborate', value: 25 },
          { left: 'Bold', right: 'Subtle', value: 82 },
        ],
        approved: ['Wear it everywhere.', 'Built to last.', 'The only ___ you need.', 'Stop buying. Start choosing.', 'Considered design.'],
        banned: ['Must-have', 'Flying off the shelves', 'Limited time only!', '"Incredible" / "Amazing"', '"Trendy" / "On-trend"'],
        examples: [
          { channel: 'Instagram Caption', content: 'Seven items. Every occasion. This is the wardrobe you stop second-guessing.\n\nThe Spring Edit — link in bio.', note: 'Tone: Effortless · Intentional · No hashtag clutter in caption body' },
          { channel: 'TikTok Hook', content: '"This is your sign to stop buying things you\'ll wear once."', note: 'Hook type: Controversy · 2.8× engagement lift' },
          { channel: 'Meta Ad Headline', content: 'Built to last a decade, not a season.', note: 'Best performing headline · Spring Drop \'26 · 4.1% CTR' },
          { channel: 'Email Subject Line', content: 'The seven pieces.', note: 'Open rate: 34.2% · Short works · Less is more for Novizio audience' },
        ],
      },
    },
    growth: {
      nextMove: '2 experiments have been Running for 3+ weeks with no result logged. Close them before opening new tests — otherwise your signal is noise.',
      stats: { organicGrowthRate: '+8.2%', activeExperiments: 3, topChannel: 'Instagram' },
      channels: [
        { name: 'Instagram', focus: 'Primary', rationale: 'Highest engagement rate and where core audience lives — 4.2% avg.', lastActive: '1 day ago' },
        { name: 'TikTok', focus: 'Primary', rationale: 'Fastest follower growth channel this quarter — 7.2K and climbing.', lastActive: '2 days ago' },
        { name: 'LinkedIn', focus: 'Secondary', rationale: 'Untapped thought leadership opportunity. COS is entering this space now.', lastActive: '14 days ago' },
        { name: 'Pinterest', focus: 'Secondary', rationale: 'High-intent discovery traffic for fashion. Evergreen content performs well here.', lastActive: '5 days ago' },
        { name: 'X', focus: 'Paused', rationale: 'Low ROI for fashion brand at this stage. Revisit at 50K followers.', lastActive: '31 days ago' },
      ],
      experiments: [
        { id: 'e1', hypothesis: 'Posting Reels at 5–7pm Thursday doubles our weekly reach vs mid-morning slots.', status: 'Running' },
        { id: 'e2', hypothesis: 'Captions under 10 words get 30% more saves than longer captions on static posts.', status: 'Running' },
        { id: 'e3', hypothesis: 'Behind-the-scenes process content gets 2× more profile visits than product shots.', status: 'Done', result: 'Confirmed. BTS Reels averaged 4.1% profile visit rate vs 1.9% for product posts. Now a standing content pillar.' },
        { id: 'e4', hypothesis: 'Adding a question CTA to Stories increases DM replies by 50%.', status: 'Abandoned', result: 'Insufficient volume to measure — Stories audience too small at current follower count.' },
      ],
      collabs: [
        { id: 'c1', name: 'Mara Johansson', platform: 'Instagram', audienceSize: '62K', stage: 'Reached Out', notes: 'Slow fashion creator. High alignment with Novizio values. Awaiting reply.' },
        { id: 'c2', name: 'The Conscious Wardrobe', platform: 'Instagram', audienceSize: '28K', stage: 'Live', notes: 'Story collab running this week. Tracking saves and profile visits.' },
        { id: 'c3', name: 'Luisa Ferreira', platform: 'TikTok', audienceSize: '114K', stage: 'Prospect', notes: 'Portuguese creator — strong brand fit for origin story content.' },
      ],
    },
    tactics: [
      { id: 't1', name: 'Short-form Video', whyItsGrowing: 'Reels and TikTok currently offer the highest organic reach of any content format — algorithms are actively distributing short video to non-followers.', howToApply: 'Document the making process — fabric sourcing, stitching, finishing. These are Novizio\'s most differentiated stories and perform well in the 30–60s range.', difficulty: 'Easy', trendSignal: 'Hot' },
      { id: 't2', name: 'UGC & Social Proof', whyItsGrowing: '92% of consumers trust peer content over brand content. Brands that amplify customer voices grow 3× faster than those that only post brand-generated content.', howToApply: 'Feature real customers wearing Novizio pieces in real life. Ask for permission, credit them, and let their caption do the selling. No staging.', difficulty: 'Medium', trendSignal: 'Hot' },
      { id: 't3', name: 'Organic Creator Collabs', whyItsGrowing: 'Micro-influencers (10K–100K) achieve 60% higher engagement rates than larger accounts and cost nothing for organic partnership exchanges.', howToApply: 'Target slow fashion and sustainable living creators. Offer gifting + co-creation — content they\'d make anyway, wearing Novizio. No scripts.', difficulty: 'Medium', trendSignal: 'Rising' },
      { id: 't4', name: 'SEO Content Marketing', whyItsGrowing: 'Long-tail search traffic compounds over time. A post ranking for "artisan linen clothing" in 2026 is still generating traffic in 2028.', howToApply: 'Write Pinterest descriptions and captions using search terms like "artisan made clothing", "slow fashion brand", "portuguese linen fashion" — all low-difficulty keywords.', difficulty: 'Hard', trendSignal: 'Established' },
      { id: 't5', name: 'Community Building', whyItsGrowing: 'Brands with active communities see 5× higher lifetime value and near-zero churn. An owned audience is the only asset that survives algorithm changes.', howToApply: 'Launch a private IG group or Substack for customers who want behind-the-scenes access. Call it "The Edit" — content, early access, no spam.', difficulty: 'Medium', trendSignal: 'Rising' },
      { id: 't6', name: 'LinkedIn Thought Leadership', whyItsGrowing: 'LinkedIn reach for personal brand content is up 42% YoY. Fashion founders are a first-mover opportunity — COS just entered with their design director.', howToApply: 'Post as the founder: the decisions behind Novizio — why slow fashion, what craft means, the trade-offs of not chasing trends. Weekly. Personal voice.', difficulty: 'Medium', trendSignal: 'Hot' },
      { id: 't7', name: 'Pinterest / Visual SEO', whyItsGrowing: 'Pinterest drives 33% more referral traffic than Twitter and Facebook combined for fashion brands. High-intent users actively searching to buy.', howToApply: 'Pin every product with keyword-rich descriptions. Create boards: "Slow Fashion Outfits", "Artisan Clothing", "Capsule Wardrobe Essentials". Evergreen.', difficulty: 'Easy', trendSignal: 'Rising' },
      { id: 't8', name: 'Trend-jacking', whyItsGrowing: 'Timing content to cultural moments or trending audio can 10× organic reach with zero extra effort. The window is narrow — usually 24–48 hours.', howToApply: 'When a sustainable fashion story breaks in the press, post Novizio\'s angle within the day. When a trending sound fits the brand, use it immediately.', difficulty: 'Easy', trendSignal: 'Hot' },
      { id: 't9', name: 'Email Marketing', whyItsGrowing: 'Email has an average ROI of 42:1 — the highest of any marketing channel. Unlike social, you own the list. No algorithm between you and the reader.', howToApply: 'Monthly "The Edit" email: one piece, one story behind it, one styling idea. Under 300 words. Subject line under 9 words. Lena writes it.', difficulty: 'Medium', trendSignal: 'Established' },
      { id: 't10', name: 'Cross-platform Repurposing', whyItsGrowing: 'One piece of content can reach 5 different audiences on 5 platforms. Brands doing this consistently get 5× the output from the same creative effort.', howToApply: 'Every Reel becomes a TikTok. Every TikTok caption becomes a LinkedIn post. Every LinkedIn post becomes a Pinterest description. One shoot, five formats.', difficulty: 'Easy', trendSignal: 'Rising' },
      { id: 't11', name: 'Referral & Word-of-Mouth', whyItsGrowing: 'Word-of-mouth drives 20–50% of all purchasing decisions. For premium fashion, peer recommendation converts 4× better than any ad.', howToApply: 'Create an experience worth talking about — packaging, personal notes, early access for existing customers. Give them something to share, not a discount code.', difficulty: 'Hard', trendSignal: 'Established' },
      { id: 't12', name: 'Behind-the-Scenes Content', whyItsGrowing: 'Polished content is everywhere. Raw, authentic BTS outperforms studio shots by 2.4× on saves and shares — audiences trust what feels unfiltered.', howToApply: 'Film the process: cutting, stitching, quality checks, rejected pieces. This is Novizio\'s strongest differentiator. The story most brands can\'t tell.', difficulty: 'Easy', trendSignal: 'Hot' },
    ],
    community: {
      nextMove: '3 UGC pieces were spotted this week — request permission before the posts age out and engagement drops. DM the creators today.',
      stats: { ugcSpotted: 3, avgReplyRate: '71%', activeInitiatives: 1 },
      ugcPieces: [
        { id: 'u1', description: 'Customer styled the linen trousers with a vintage blazer — editorial quality photo.', platform: 'Instagram', source: '@mara.wears', dateSpotted: 'Apr 3', status: 'Spotted' },
        { id: 'u2', description: 'TikTok "get ready with me" featuring Novizio jacket — 14K views.', platform: 'TikTok', source: '@sustainable.looks', dateSpotted: 'Apr 2', status: 'Permission Requested' },
        { id: 'u3', description: 'Unboxing video with packaging close-up — genuine reaction, very on-brand.', platform: 'TikTok', source: '@theslowcloset', dateSpotted: 'Mar 29', status: 'Approved' },
      ],
      engagementHabits: [
        { label: 'Comment reply rate', target: '80%', actual: '71%', onTarget: false },
        { label: 'DM response time', target: '< 4 hours', actual: '~6 hours', onTarget: false },
        { label: 'Story reply rate', target: '60%', actual: '68%', onTarget: true },
        { label: 'Weekly comment sessions', target: '5×/week', actual: '4×/week', onTarget: false },
      ],
      initiatives: [
        { id: 'i1', type: 'Challenge', platform: 'Instagram', status: 'Active', startDate: 'Apr 1', outcomeNotes: '5-day capsule wardrobe challenge — 38 participants so far. Tracking saves and new followers.' },
        { id: 'i2', type: 'Q&A', platform: 'Instagram', status: 'Planning', startDate: 'Apr 12', outcomeNotes: 'Founder Q&A in Stories — planned for launch week of Spring Edit.' },
      ],
    },
  },

  Hourbour: {
    pulse: {
      momentumScore: 54,
      momentumTrend: 'up',
      growthBlocker: 'Instagram engagement is down 18% in 3 weeks — captions are not converting lurkers into commenters.',
      todayPriority: 'Post the subscription audit explainer on TikTok — this format is the highest-performing hook in fintech right now.',
    },
    identity: {
      nextMove: 'Hourbour\'s LinkedIn page has no banner image or about section. This is the first thing B2B prospects see — fix it before the next LinkedIn push.',
      positioningStatement: 'Hourbour gives people total clarity over their money so they can stop guessing and start deciding.',
      pillars: [
        { name: 'Clarity', belief: 'Financial confusion is the enemy. Every feature exists to remove it.', example: 'Monzo\'s "Spending summary" — instant visibility, zero jargon.' },
        { name: 'Control', belief: 'Your money should work for you, not disappear into subscriptions you forgot.', example: 'Revolut\'s subscription tracker — empowers, doesn\'t shame.' },
        { name: 'Trust', belief: 'We earn trust by showing our work, not hiding behind financial language.', example: 'Starling\'s plain-English product explanations — no small print culture.' },
      ],
      toneOfVoice: {
        dos: ['Lead with a number or a fact — specificity builds credibility.', 'Write like you\'re texting a financially savvy friend.', 'Frame every insight as an opportunity: "here\'s where to adjust."'],
        donts: ['Never use finance-bro language: leverage, synergy, disruptive.', 'Never shame the user — no "warning", "overspending", "bad habit".', 'Never use jargon that needs explaining in the same sentence.'],
      },
      visualChecklist: [
        { platform: 'Instagram', items: [{ label: 'Profile photo', status: 'done' }, { label: 'Bio', status: 'needs-update' }, { label: 'Link in bio', status: 'done' }, { label: 'Story highlights', status: 'done' }, { label: 'Pinned post', status: 'needs-update' }] },
        { platform: 'TikTok', items: [{ label: 'Profile photo', status: 'done' }, { label: 'Bio', status: 'done' }, { label: 'Link in bio', status: 'needs-update' }, { label: 'Story highlights', status: 'missing' }, { label: 'Pinned post', status: 'missing' }] },
        { platform: 'LinkedIn', items: [{ label: 'Profile photo', status: 'done' }, { label: 'Bio', status: 'missing' }, { label: 'Link in bio', status: 'done' }, { label: 'Story highlights', status: 'missing' }, { label: 'Pinned post', status: 'missing' }] },
      ],
      voiceLibrary: {
        pillars: [
          { icon: '◎', name: 'Clear', desc: 'Financial language can be opaque. Hourbour copy cuts through jargon. Every feature explained in one plain sentence.', quote: '"See where your money goes." Not: "Advanced AI-powered expenditure analytics."' },
          { icon: '◇', name: 'Empowering', desc: 'The user is in control. Copy never patronises or shames. Frame every insight as an opportunity, not a failure.', quote: '"You spent 18% more on food this month. Here\'s where to adjust." Not: "Warning: overspending detected."' },
          { icon: '◇', name: 'Modern', desc: 'Hourbour is for people who manage their life from their phone. Sharp, current, no legacy finance tone.', quote: '"Your money, finally organised." Not: "A comprehensive financial management solution."' },
        ],
        dials: [
          { left: 'Casual', right: 'Formal', value: 38 },
          { left: 'Playful', right: 'Serious', value: 45 },
          { left: 'Warm', right: 'Cold', value: 35 },
          { left: 'Minimal', right: 'Elaborate', value: 30 },
          { left: 'Bold', right: 'Subtle', value: 55 },
        ],
        approved: ['Know your number.', 'Your money, your rules.', 'Finally, clarity.', 'Spend smarter.', 'Built for real life.'],
        banned: ['Synergy', 'Leverage', 'Disruptive', '"Revolutionary"', '"Game-changing"'],
        examples: [
          { channel: 'Instagram Caption', content: 'Most people don\'t know where 30% of their income goes.\n\nHourbour shows you in 10 seconds.', note: 'Tone: Clear · Hook-led · Stat opens strong' },
          { channel: 'TikTok Hook', content: '"I found out I was spending £400/month on things I forgot I subscribed to."', note: 'Hook type: Story/Confession · High relatability · 3.4× engagement lift' },
          { channel: 'Meta Ad Headline', content: 'Your subscriptions are costing more than you think.', note: 'Best performing headline · App Install Drive · 3.8% CTR' },
          { channel: 'Email Subject Line', content: 'You\'re leaking £200/month.', note: 'Open rate: 41.8% · Specificity + loss aversion · Strong performer' },
        ],
      },
    },
    growth: {
      nextMove: 'LinkedIn is your Primary channel but you\'ve posted nothing there in 9 days. One post today keeps momentum — it doesn\'t need to be long.',
      stats: { organicGrowthRate: '+5.1%', activeExperiments: 2, topChannel: 'LinkedIn' },
      channels: [
        { name: 'LinkedIn', focus: 'Primary', rationale: 'Highest quality audience for fintech — professionals who actively manage money.', lastActive: '9 days ago' },
        { name: 'Instagram', focus: 'Primary', rationale: 'Largest follower base. Engagement dropping — needs a content strategy reset.', lastActive: '1 day ago' },
        { name: 'TikTok', focus: 'Secondary', rationale: 'Financial content is exploding on TikTok — "fintok" is one of the fastest-growing verticals.', lastActive: '3 days ago' },
        { name: 'Pinterest', focus: 'Paused', rationale: 'Low traction for fintech. Revisit if visual content strategy changes.', lastActive: '18 days ago' },
        { name: 'X', focus: 'Paused', rationale: 'Finance Twitter is active but noisy. Not worth the attention investment at this stage.', lastActive: '22 days ago' },
      ],
      experiments: [
        { id: 'e1', hypothesis: 'LinkedIn posts with a specific number in the first line get 2× more impressions than generic openers.', status: 'Running' },
        { id: 'e2', hypothesis: 'TikTok videos under 30 seconds get 40% higher completion rate than 60-second explainers.', status: 'Running' },
        { id: 'e3', hypothesis: 'Posting Instagram carousels on Tuesday morning outperforms all other formats and days.', status: 'Abandoned', result: 'Not enough data — posting frequency too low to isolate the variable. Will retest when consistency improves.' },
      ],
      collabs: [
        { id: 'c1', name: 'MoneyWithMia', platform: 'TikTok', audienceSize: '89K', stage: 'Prospect', notes: 'Personal finance creator — exact audience match. Relatable, not preachy.' },
        { id: 'c2', name: 'The Frugal Friend', platform: 'Instagram', audienceSize: '41K', stage: 'Reached Out', notes: 'Budget-conscious lifestyle creator. Hourbour\'s subscription tracker is their exact pain point.' },
      ],
    },
    tactics: [
      { id: 't1', name: 'Short-form Video', whyItsGrowing: '"FinTok" is one of the fastest-growing content verticals on TikTok — personal finance content is seeing 3× the organic reach of other categories.', howToApply: 'The hook: "I found out I was paying for X subscriptions I forgot about." Walk through the Hourbour subscription audit feature. Real numbers, real savings.', difficulty: 'Easy', trendSignal: 'Hot' },
      { id: 't2', name: 'UGC & Social Proof', whyItsGrowing: 'For fintech, social proof is everything — people don\'t trust financial apps until someone they relate to vouches for it.', howToApply: 'Ask early users to share their "ah-ha" moment — the first time Hourbour showed them something surprising about their spending. Feature these stories.', difficulty: 'Medium', trendSignal: 'Hot' },
      { id: 't3', name: 'Organic Creator Collabs', whyItsGrowing: 'Personal finance creators (5K–100K) have highly engaged, trust-based audiences who take action on recommendations.', howToApply: 'Partner with budget and personal finance creators for app walkthroughs. No scripts — let them explore Hourbour and react genuinely.', difficulty: 'Medium', trendSignal: 'Rising' },
      { id: 't4', name: 'SEO Content Marketing', whyItsGrowing: 'Fintech search queries are high-intent — people searching "how to track subscriptions" or "best budgeting app" are ready to download.', howToApply: 'Create Pinterest and LinkedIn content targeting "subscription tracker app", "how to stop overspending", "budgeting for beginners". Own the long tail.', difficulty: 'Hard', trendSignal: 'Established' },
      { id: 't5', name: 'Community Building', whyItsGrowing: 'Fintech brands with strong communities have 70% lower churn. Users who feel part of something stay longer and refer more.', howToApply: 'Create a private community for Hourbour users — share tips, monthly money challenges, early feature previews. Discord or a Slack group works.', difficulty: 'Medium', trendSignal: 'Rising' },
      { id: 't6', name: 'LinkedIn Thought Leadership', whyItsGrowing: 'LinkedIn is the highest-trust platform for fintech brands. Founders who post regularly see 4× more inbound leads than those who don\'t.', howToApply: 'Post as the founder: the problem Hourbour solves, what you\'ve learned building a fintech, money habits that changed your life. Weekly minimum.', difficulty: 'Medium', trendSignal: 'Hot' },
      { id: 't7', name: 'Pinterest / Visual SEO', whyItsGrowing: 'Personal finance content on Pinterest is evergreen — a pin about budgeting drives traffic for years, not hours.', howToApply: 'Create infographic-style pins: "5 subscriptions you\'re probably overpaying for", "Where your money goes each month". Link to app download.', difficulty: 'Easy', trendSignal: 'Rising' },
      { id: 't8', name: 'Trend-jacking', whyItsGrowing: 'Financial news cycles create massive search and social spikes. Being fast with a relevant angle can 10× reach with no extra budget.', howToApply: 'When interest rates, inflation, or subscription price hikes are in the news — post Hourbour\'s angle within 24 hours. Show how the app helps.', difficulty: 'Easy', trendSignal: 'Hot' },
      { id: 't9', name: 'Email Marketing', whyItsGrowing: 'Fintech email lists are gold — users who give you their email are 5× more likely to convert to paid than social followers.', howToApply: 'Monthly "Money Clarity" email: one money insight, one Hourbour tip, one user story. Under 250 words. No financial jargon. Lena writes it.', difficulty: 'Medium', trendSignal: 'Established' },
      { id: 't10', name: 'Cross-platform Repurposing', whyItsGrowing: 'One fintech explainer can reach professionals on LinkedIn, general consumers on TikTok, and searchers on Pinterest — same content, 3 audiences.', howToApply: 'Every TikTok explainer becomes a LinkedIn post becomes a Pinterest infographic. Adapt the tone per platform — data-led on LinkedIn, story-led on TikTok.', difficulty: 'Easy', trendSignal: 'Rising' },
      { id: 't11', name: 'Referral & Word-of-Mouth', whyItsGrowing: 'Fintech grows fastest through trust — and trust travels between friends. A referral from a peer converts 4× better than any ad impression.', howToApply: 'Build a referral moment into the app: when a user saves money, prompt them to share the result (not just the app). Share the win, not the product.', difficulty: 'Hard', trendSignal: 'Established' },
      { id: 't12', name: 'Behind-the-Scenes Content', whyItsGrowing: 'Transparency is the new marketing for fintech — showing how you build trust beats any claim you can make about trustworthiness.', howToApply: 'Post about how Hourbour protects data, how features are prioritised, what you\'ve changed based on user feedback. Radical openness as brand strategy.', difficulty: 'Easy', trendSignal: 'Hot' },
    ],
    community: {
      nextMove: 'Your comment reply rate on Instagram dropped to 58% this week. Reply to every comment from the last 3 days today — this directly impacts the algorithm.',
      stats: { ugcSpotted: 1, avgReplyRate: '58%', activeInitiatives: 1 },
      ugcPieces: [
        { id: 'u1', description: 'User shared a screenshot of their subscription audit result — saved £340/month.', platform: 'Instagram', source: '@frugal.with.felix', dateSpotted: 'Apr 4', status: 'Spotted' },
      ],
      engagementHabits: [
        { label: 'Comment reply rate', target: '80%', actual: '58%', onTarget: false },
        { label: 'DM response time', target: '< 4 hours', actual: '~9 hours', onTarget: false },
        { label: 'Story reply rate', target: '60%', actual: '52%', onTarget: false },
        { label: 'Weekly comment sessions', target: '5×/week', actual: '3×/week', onTarget: false },
      ],
      initiatives: [
        { id: 'i1', type: 'Poll', platform: 'Instagram', status: 'Active', startDate: 'Apr 3', outcomeNotes: '"What\'s your biggest money stress?" poll — 204 votes. Top answer: subscriptions (41%). Feeding into content brief.' },
        { id: 'i2', type: 'Challenge', platform: 'TikTok', status: 'Planning', startDate: 'Apr 15', outcomeNotes: '"7-day spending audit challenge" — users track one category for a week using Hourbour.' },
      ],
    },
  },
}

// ── Brand Pulse Header ─────────────────────────────────────────────────────────

function BrandPulseHeader({ venture }: { venture: Venture }) {
  const { pulse } = VENTURE_DATA[venture]
  const scoreColor = pulse.momentumScore >= 70 ? 'var(--gn)' : pulse.momentumScore >= 40 ? 'var(--am)' : 'var(--rd)'
  const arrow = pulse.momentumTrend === 'up' ? '↑' : '↓'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '1px', background: 'var(--b1)', marginBottom: '24px' }}>
      {/* Momentum Score */}
      <div style={{ background: 'var(--sf)', padding: '20px 24px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mu)', marginBottom: '12px' }}>Momentum Score</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '48px', color: scoreColor, lineHeight: 1 }}>{pulse.momentumScore}</span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '20px', color: scoreColor }}>{arrow}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', marginTop: '6px' }}>Brand growth velocity</div>
      </div>
      {/* Growth Blocker */}
      <div style={{ background: 'var(--sf)', borderLeft: '3px solid var(--rd)', padding: '20px 20px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rd)', marginBottom: '10px' }}>Growth Blocker</div>
        <div style={{ fontSize: '13px', color: 'var(--tx)', lineHeight: 1.6 }}>{pulse.growthBlocker}</div>
      </div>
      {/* Today's Priority */}
      <div style={{ background: 'var(--sf)', borderLeft: '3px solid var(--gn)', padding: '20px 20px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gn)', marginBottom: '10px' }}>Today&apos;s Priority</div>
        <div style={{ fontSize: '13px', color: 'var(--tx)', lineHeight: 1.6 }}>{pulse.todayPriority}</div>
      </div>
    </div>
  )
}

// ── Tab 1: Brand Identity ─────────────────────────────────────────────────────

function BrandIdentityTab({ venture }: { venture: Venture }) {
  const { identity } = VENTURE_DATA[venture]
  const [positioning, setPositioning] = useState(identity.positioningStatement)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(positioning)
  const [voiceExpanded, setVoiceExpanded] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <NextMoveCard text={identity.nextMove} />

      {/* Positioning Statement */}
      <div>
        <SH>Positioning Statement</SH>
        <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '24px 28px' }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={2}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--b2)', color: 'var(--tx)', fontFamily: 'var(--font-dm-sans)', fontSize: '18px', lineHeight: 1.6, padding: '12px', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setPositioning(draft); setEditing(false) }} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', border: '1px solid var(--gn)', background: 'none', color: 'var(--gn)', cursor: 'pointer' }}>Save</button>
                <button onClick={() => { setDraft(positioning); setEditing(false) }} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', border: '1px solid var(--b2)', background: 'none', color: 'var(--di)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
              <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '18px', color: 'var(--br)', lineHeight: 1.6, flex: 1 }}>{positioning}</div>
              <button onClick={() => { setDraft(positioning); setEditing(true) }} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', border: '1px solid var(--b2)', background: 'none', color: 'var(--di)', cursor: 'pointer', flexShrink: 0 }}>Edit</button>
            </div>
          )}
        </div>
      </div>

      {/* Brand Pillars */}
      <div>
        <SH>Brand Pillars</SH>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--b1)' }}>
          {identity.pillars.map(p => (
            <div key={p.name} style={{ background: 'var(--sf)', padding: '20px 20px' }}>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', color: 'var(--br)', marginBottom: '8px' }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.65, marginBottom: '12px' }}>{p.belief}</div>
              <div style={{ borderTop: '1px solid var(--b1)', paddingTop: '10px' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', letterSpacing: '0.08em', marginBottom: '4px' }}>Example in the wild</div>
                <div style={{ fontSize: '11px', color: 'var(--di)', lineHeight: 1.5, fontStyle: 'italic' }}>{p.example}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tone of Voice */}
      <div>
        <SH>Tone of Voice — Quick Ref</SH>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--b1)' }}>
          <div style={{ background: 'var(--sf)', padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gn)', marginBottom: '12px' }}>Do</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {identity.toneOfVoice.dos.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--gn)', fontSize: '10px', marginTop: '2px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--sf)', padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rd)', marginBottom: '12px' }}>Don&apos;t</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {identity.toneOfVoice.donts.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--rd)', fontSize: '10px', marginTop: '2px', flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Identity Checklist */}
      <div>
        <SH>Visual Identity Checklist</SH>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(5, 1fr)', background: 'var(--sf)', padding: '10px 16px', gap: '8px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', letterSpacing: '0.08em' }}>Platform</div>
            {['Profile Photo', 'Bio', 'Link in Bio', 'Highlights', 'Pinned Post'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', letterSpacing: '0.08em', textAlign: 'center' }}>{h}</div>
            ))}
          </div>
          {identity.visualChecklist.map(row => (
            <div key={row.platform} style={{ display: 'grid', gridTemplateColumns: '120px repeat(5, 1fr)', background: 'var(--sf)', padding: '12px 16px', gap: '8px', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', letterSpacing: '0.06em' }}>{row.platform}</div>
              {row.items.map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <StatusDot status={item.status} />
                </div>
              ))}
            </div>
          ))}
          {/* Legend */}
          <div style={{ background: 'var(--sf)', padding: '8px 16px', display: 'flex', gap: '16px' }}>
            {[{ s: 'done' as const, l: 'Done' }, { s: 'needs-update' as const, l: 'Needs update' }, { s: 'missing' as const, l: 'Missing' }].map(({ s, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StatusDot status={s} />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Voice Library — collapsible */}
      <div>
        <SH right={
          <button onClick={() => setVoiceExpanded(v => !v)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.08em', padding: '3px 10px', border: '1px solid var(--b2)', background: 'none', color: 'var(--di)', cursor: 'pointer' }}>
            {voiceExpanded ? 'Collapse' : 'Expand'}
          </button>
        }>Brand Voice Library</SH>

        {voiceExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Voice Pillars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--b1)' }}>
              {identity.voiceLibrary.pillars.map(p => (
                <div key={p.name} style={{ background: 'var(--sf)', padding: '18px 18px' }}>
                  <div style={{ fontSize: '18px', marginBottom: '6px', color: 'var(--di)' }}>{p.icon}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.06em', color: 'var(--br)', marginBottom: '8px' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--tx)', lineHeight: 1.65, marginBottom: '10px' }}>{p.desc}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', lineHeight: 1.55, fontStyle: 'italic' }}>{p.quote}</div>
                </div>
              ))}
            </div>

            {/* Tone Dials + Approved/Banned */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--b1)' }}>
              {/* Dials */}
              <div style={{ background: 'var(--sf)', padding: '18px 18px' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)', marginBottom: '14px' }}>Tone Dials</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {identity.voiceLibrary.dials.map(d => (
                    <div key={d.left}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>{d.left}</span>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>{d.right}</span>
                      </div>
                      <div style={{ height: '2px', background: 'var(--b2)', borderRadius: '1px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: `${d.value}%`, transform: 'translateX(-50%)', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--br)', top: '-3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved / Banned */}
              <div style={{ background: 'var(--sf)', padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gn)', marginBottom: '8px' }}>Approved Phrases</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {identity.voiceLibrary.approved.map(a => (
                      <div key={a} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--tx)', padding: '3px 8px', background: 'var(--bg)', border: '1px solid var(--b1)' }}>{a}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rd)', marginBottom: '8px' }}>Banned Words</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {identity.voiceLibrary.banned.map(b => (
                      <span key={b} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--rd)', padding: '2px 7px', border: '1px solid var(--rd)' }}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Examples */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'var(--b1)' }}>
              {identity.voiceLibrary.examples.map(ex => (
                <div key={ex.channel} style={{ background: 'var(--sf)', padding: '16px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--di)', textTransform: 'uppercase', marginBottom: '8px' }}>{ex.channel}</div>
                  <div style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.65, marginBottom: '8px', whiteSpace: 'pre-line', fontStyle: 'italic' }}>{ex.content}</div>
                  <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)' }}>{ex.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 2: Growth Strategy ────────────────────────────────────────────────────

function GrowthStrategyTab({ venture }: { venture: Venture }) {
  const { growth } = VENTURE_DATA[venture]
  const [experiments, setExperiments] = useState(growth.experiments)
  const [newHypothesis, setNewHypothesis] = useState('')
  const [collabs] = useState(growth.collabs)

  const focusColor = (f: FocusLevel) => f === 'Primary' ? 'var(--gn)' : f === 'Secondary' ? 'var(--am)' : 'var(--mu)'
  const expStatusColor = (s: ExperimentStatus) => s === 'Running' ? 'var(--bl)' : s === 'Done' ? 'var(--gn)' : 'var(--mu)'

  function cycleExperiment(id: string) {
    const cycle: ExperimentStatus[] = ['Running', 'Done', 'Abandoned']
    setExperiments(prev => prev.map(e => e.id === id ? { ...e, status: cycle[(cycle.indexOf(e.status) + 1) % cycle.length] } : e))
  }

  function addExperiment() {
    if (!newHypothesis.trim()) return
    setExperiments(prev => [...prev, { id: `e${Date.now()}`, hypothesis: newHypothesis.trim(), status: 'Running' }])
    setNewHypothesis('')
  }

  const COLLAB_STAGES: CollabStage[] = ['Prospect', 'Reached Out', 'Live', 'Done']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <NextMoveCard text={growth.nextMove} />

      <StatsRow cards={[
        { label: 'Organic Growth Rate', value: growth.stats.organicGrowthRate, sub: 'This month', subColor: 'var(--gn)' },
        { label: 'Active Experiments', value: String(experiments.filter(e => e.status === 'Running').length), sub: `${experiments.length} total` },
        { label: 'Top Channel', value: growth.stats.topChannel, sub: 'By attention focus' },
      ]} />

      {/* Channel Priority Matrix */}
      <div>
        <SH>Channel Priority Matrix</SH>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
          {growth.channels.map(ch => (
            <div key={ch.name} style={{ display: 'grid', gridTemplateColumns: '110px 90px 1fr 90px', gap: '16px', alignItems: 'center', background: 'var(--sf)', padding: '12px 16px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--br)', letterSpacing: '0.04em' }}>{ch.name}</div>
              <Badge label={ch.focus} color={focusColor(ch.focus)} />
              <div style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.5 }}>{ch.rationale}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', textAlign: 'right' }}>{ch.lastActive}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Experiment Tracker */}
      <div>
        <SH sub="Click status to cycle: Running → Done → Abandoned">Experiment Tracker</SH>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {experiments.map(exp => (
            <div key={exp.id} style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.55, flex: 1 }}>{exp.hypothesis}</div>
                <button onClick={() => cycleExperiment(exp.id)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.08em', padding: '3px 9px', border: `1px solid ${expStatusColor(exp.status)}`, background: 'none', color: expStatusColor(exp.status), cursor: 'pointer', flexShrink: 0, textTransform: 'uppercase' }}>
                  {exp.status}
                </button>
              </div>
              {exp.result && (
                <div style={{ fontSize: '11px', color: 'var(--di)', lineHeight: 1.5, borderTop: '1px solid var(--b1)', paddingTop: '8px' }}>{exp.result}</div>
              )}
            </div>
          ))}
        </div>
        {/* Add experiment */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Add hypothesis: If we do X, then Y will happen..."
            value={newHypothesis}
            onChange={e => setNewHypothesis(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExperiment()}
            style={{ flex: 1, background: 'var(--sf)', border: '1px solid var(--b2)', color: 'var(--tx)', fontFamily: 'var(--font-dm-sans)', fontSize: '12px', padding: '8px 12px', outline: 'none' }}
          />
          <button onClick={addExperiment} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', border: '1px solid var(--b2)', background: 'none', color: 'var(--ac)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Add →
          </button>
        </div>
      </div>

      {/* Collab Pipeline */}
      <div>
        <SH>Collab Pipeline — Organic Only</SH>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--b1)' }}>
          {COLLAB_STAGES.map(stage => (
            <div key={stage} style={{ background: 'var(--sf)' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)' }}>{stage}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', marginTop: '2px' }}>{collabs.filter(c => c.stage === stage).length}</div>
              </div>
              <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' }}>
                {collabs.filter(c => c.stage === stage).map(col => (
                  <div key={col.id} style={{ background: 'var(--bg)', border: '1px solid var(--b1)', padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--br)', marginBottom: '2px' }}>{col.name}</div>
                    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', marginBottom: '6px' }}>{col.platform} · {col.audienceSize}</div>
                    <div style={{ fontSize: '11px', color: 'var(--di)', lineHeight: 1.45 }}>{col.notes}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab 3: Tactics Library ─────────────────────────────────────────────────────

type TacticStatus = 'Not Started' | 'Testing' | 'Active'
type TacticFilter = 'All' | 'Hot' | 'Rising' | 'Easy Wins' | 'Active'
const TACTIC_FILTERS: TacticFilter[] = ['All', 'Hot', 'Rising', 'Easy Wins', 'Active']

function TacticsLibraryTab({ venture }: { venture: Venture }) {
  const { tactics } = VENTURE_DATA[venture]
  const [filter, setFilter] = useState<TacticFilter>('All')
  const [statuses, setStatuses] = useState<Record<string, TacticStatus>>(
    () => Object.fromEntries(tactics.map(t => [t.id, 'Not Started' as TacticStatus]))
  )

  const visible = useMemo(() => tactics.filter(t => {
    if (filter === 'All') return true
    if (filter === 'Hot') return t.trendSignal === 'Hot'
    if (filter === 'Rising') return t.trendSignal === 'Rising'
    if (filter === 'Easy Wins') return t.difficulty === 'Easy'
    if (filter === 'Active') return statuses[t.id] === 'Active'
    return true
  }), [tactics, filter, statuses])

  function cycleStatus(id: string) {
    const cycle: TacticStatus[] = ['Not Started', 'Testing', 'Active']
    setStatuses(prev => ({ ...prev, [id]: cycle[(cycle.indexOf(prev[id]) + 1) % cycle.length] }))
  }

  const trendColor = (t: TrendSignal) => t === 'Hot' ? 'var(--rd)' : t === 'Rising' ? 'var(--am)' : 'var(--di)'
  const diffColor = (d: Difficulty) => d === 'Easy' ? 'var(--gn)' : d === 'Medium' ? 'var(--am)' : 'var(--rd)'
  const statusColor = (s: TacticStatus) => s === 'Active' ? 'var(--gn)' : s === 'Testing' ? 'var(--am)' : 'var(--mu)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0px', borderBottom: '1px solid var(--b1)' }}>
        {TACTIC_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '8px 16px', border: 'none', borderBottom: filter === f ? '2px solid var(--ac)' : '2px solid transparent',
              background: 'none', color: filter === f ? 'var(--br)' : 'var(--di)', cursor: 'pointer', marginBottom: '-1px',
            }}
          >
            {f}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', alignSelf: 'center', paddingRight: '4px' }}>
          {visible.length} tactic{visible.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tactic cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'var(--b1)' }}>
        {visible.map(t => (
          <div key={t.id} style={{ background: 'var(--sf)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: trendColor(t.trendSignal), flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', letterSpacing: '0.06em', color: 'var(--br)' }}>{t.name}</span>
              </div>
              <Badge label={t.trendSignal} color={trendColor(t.trendSignal)} />
            </div>

            {/* Why growing */}
            <div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.08em', color: 'var(--mu)', textTransform: 'uppercase', marginBottom: '4px' }}>Why it&apos;s growing</div>
              <div style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.6 }}>{t.whyItsGrowing}</div>
            </div>

            {/* How to apply */}
            <div style={{ borderLeft: '2px solid var(--b2)', paddingLeft: '12px' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.08em', color: 'var(--ac)', textTransform: 'uppercase', marginBottom: '4px' }}>How to apply — {venture}</div>
              <div style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.6 }}>{t.howToApply}</div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <Badge label={t.difficulty} color={diffColor(t.difficulty)} />
              <button onClick={() => cycleStatus(t.id)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', border: `1px solid ${statusColor(statuses[t.id])}`, background: 'none', color: statusColor(statuses[t.id]), cursor: 'pointer' }}>
                {statuses[t.id]}
              </button>
            </div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--mu)', textAlign: 'center', padding: '40px' }}>
          No tactics match this filter.
        </div>
      )}
    </div>
  )
}

// ── Tab 4: Community ──────────────────────────────────────────────────────────

function CommunityTab({ venture }: { venture: Venture }) {
  const { community } = VENTURE_DATA[venture]
  const [ugcPieces, setUgcPieces] = useState(community.ugcPieces)
  const [initiatives, setInitiatives] = useState(community.initiatives)

  const UGC_STAGES: UGCStatus[] = ['Spotted', 'Permission Requested', 'Approved', 'Published']
  const INIT_STAGES: InitiativeStatus[] = ['Planning', 'Active', 'Done']

  const ugcStatusColor = (s: UGCStatus) => s === 'Published' ? 'var(--gn)' : s === 'Approved' ? 'var(--bl)' : s === 'Permission Requested' ? 'var(--am)' : 'var(--di)'
  const initStatusColor = (s: InitiativeStatus) => s === 'Done' ? 'var(--gn)' : s === 'Active' ? 'var(--am)' : 'var(--di)'

  const initTypeColor: Record<InitiativeType, string> = {
    Poll: 'var(--bl)', 'Q&A': 'var(--ac)', Challenge: 'var(--am)', Giveaway: 'var(--gn)', Live: 'var(--rd)',
  }

  function cycleUGC(id: string) {
    setUgcPieces(prev => prev.map(u => u.id === id ? { ...u, status: UGC_STAGES[(UGC_STAGES.indexOf(u.status) + 1) % UGC_STAGES.length] } : u))
  }

  function cycleInit(id: string) {
    setInitiatives(prev => prev.map(i => i.id === id ? { ...i, status: INIT_STAGES[(INIT_STAGES.indexOf(i.status) + 1) % INIT_STAGES.length] } : i))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <NextMoveCard text={community.nextMove} />

      <StatsRow cards={[
        { label: 'UGC Spotted This Month', value: String(community.stats.ugcSpotted), sub: 'Pieces to action' },
        { label: 'Comment Reply Rate', value: community.stats.avgReplyRate, sub: 'Target: 80%', subColor: parseInt(community.stats.avgReplyRate) >= 80 ? 'var(--gn)' : 'var(--rd)' },
        { label: 'Active Initiatives', value: String(community.stats.activeInitiatives), sub: `${initiatives.length} total` },
      ]} />

      {/* UGC Tracker */}
      <div>
        <SH sub="Click status to advance through pipeline">UGC Tracker</SH>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 70px 150px', gap: '16px', background: 'var(--sf)', padding: '8px 14px' }}>
            {['Content', 'Platform', 'Source', 'Date', 'Status'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', letterSpacing: '0.08em' }}>{h}</div>
            ))}
          </div>
          {ugcPieces.map(u => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 70px 150px', gap: '16px', alignItems: 'center', background: 'var(--sf)', padding: '10px 14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--tx)', lineHeight: 1.45 }}>{u.description}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>{u.platform}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--ac)' }}>{u.source}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)' }}>{u.dateSpotted}</div>
              <button onClick={() => cycleUGC(u.id)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.06em', padding: '3px 8px', border: `1px solid ${ugcStatusColor(u.status)}`, background: 'none', color: ugcStatusColor(u.status), cursor: 'pointer', textAlign: 'left', textTransform: 'uppercase' }}>
                {u.status}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Habits */}
      <div>
        <SH>Engagement Habits — Target vs Actual</SH>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
          {community.engagementHabits.map(h => (
            <div key={h.label} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 24px', gap: '16px', alignItems: 'center', background: 'var(--sf)', padding: '12px 16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--tx)' }}>{h.label}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--di)', textAlign: 'center' }}>{h.target}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: h.onTarget ? 'var(--gn)' : 'var(--rd)', textAlign: 'center', fontWeight: 600 }}>{h.actual}</div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.onTarget ? 'var(--gn)' : 'var(--rd)' }} />
            </div>
          ))}
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 24px', gap: '16px', background: 'var(--sf)', padding: '6px 16px', opacity: 0.6 }}>
            <div />
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', textAlign: 'center', letterSpacing: '0.08em' }}>TARGET</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', textAlign: 'center', letterSpacing: '0.08em' }}>ACTUAL</div>
            <div />
          </div>
        </div>
      </div>

      {/* Community Initiatives */}
      <div>
        <SH sub="Click status to advance: Planning → Active → Done">Community Initiatives</SH>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'var(--b1)' }}>
          {initiatives.map(init => (
            <div key={init.id} style={{ background: 'var(--sf)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Badge label={init.type} color={initTypeColor[init.type]} />
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)' }}>{init.platform}</span>
                </div>
                <button onClick={() => cycleInit(init.id)} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', letterSpacing: '0.08em', padding: '3px 9px', border: `1px solid ${initStatusColor(init.status)}`, background: 'none', color: initStatusColor(init.status), cursor: 'pointer', textTransform: 'uppercase' }}>
                  {init.status}
                </button>
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)' }}>Started {init.startDate}</div>
              <div style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.55 }}>{init.outcomeNotes}</div>
            </div>
          ))}
          {initiatives.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '32px', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--mu)', textAlign: 'center', background: 'var(--sf)' }}>
              No initiatives yet. Start a poll, Q&A, or challenge to build community engagement.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [venture, setVenture] = useState<Venture>('Novizio')
  const [activeTab, setActiveTab] = useState<Tab>('Brand Identity')

  useEffect(() => {
    const match = document.cookie.match(/yvon_active_venture=([^;]+)/)
    if (match) {
      const slug = decodeURIComponent(match[1]).toLowerCase()
      if (slug === 'hourbour') setVenture('Hourbour')
      else setVenture('Novizio')
    }
  }, [])

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mu)', marginBottom: '4px' }}>
          Organic Marketing · {venture.toUpperCase()}
        </div>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: 'var(--br)' }}>Marketing</div>
      </div>

      {/* Brand Pulse Header — always visible */}
      <BrandPulseHeader venture={venture} />

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: '28px' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content — key={venture} forces remount on venture switch */}
      {activeTab === 'Brand Identity' && <BrandIdentityTab key={`identity-${venture}`} venture={venture} />}
      {activeTab === 'Growth Strategy' && <GrowthStrategyTab key={`growth-${venture}`} venture={venture} />}
      {activeTab === 'Tactics Library' && <TacticsLibraryTab key={`tactics-${venture}`} venture={venture} />}
      {activeTab === 'Community' && <CommunityTab key={`community-${venture}`} venture={venture} />}
    </div>
  )
}
