'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Venture = 'Novizio' | 'Hourbour'
type Tab = 'Overview' | 'Content Intel' | 'Content Gaps' | 'Keywords' | 'Alerts'
const TABS: Tab[] = ['Overview', 'Content Intel', 'Content Gaps', 'Keywords', 'Alerts']

// Map cookie slug → Venture key
const SLUG_TO_VENTURE: Record<string, Venture> = {
  novizio:  'Novizio',
  hourbour: 'Hourbour',
}

function SH({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--b1)' }}>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--di)' }}>{children}</div>
      {sub && <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

// ── VENTURE DATA ──────────────────────────────────────────────────────────────
const VENTURE_DATA = {
  Novizio: {
    industry: 'Fashion',
    us: { name: 'Novizio', ig: '28.4K', li: '6.0K', tt: '7.2K', eng: '4.2%', posts: 14, threat: null as null },
    competitors: [
      { name: 'Sézane', ig: '1.2M', li: '42K', tt: '280K', eng: '3.8%', posts: 28, threat: 'high' as const },
      { name: 'Reformation', ig: '2.8M', li: '89K', tt: '420K', eng: '4.2%', posts: 34, threat: 'high' as const },
      { name: 'COS', ig: '2.4M', li: '124K', tt: '180K', eng: '2.1%', posts: 22, threat: 'medium' as const },
      { name: 'Arket', ig: '1.8M', li: '67K', tt: '92K', eng: '2.9%', posts: 18, threat: 'medium' as const },
    ],
    zarasBrief: {
      headline: 'Reformation owns the transparency narrative — move within 2 weeks',
      body: 'This week, Reformation launched a supply chain transparency campaign across IG that reached an estimated 4.2M accounts. Hook: "We tracked our supply chain for 30 days — here\'s what we found." It\'s the highest-performing campaign in sustainable fashion this month and they\'re claiming the radical transparency angle before anyone else. Sézane posted 3 Reels using the same behind-the-scenes format you introduced in January — they\'re achieving 8× your reach on identical content concepts. COS is now running LinkedIn thought leadership from their design director: 4 posts in 2 weeks averaging 12.4K impressions each. That\'s a first-mover space in fashion × LinkedIn. Move within 2 weeks or COS owns it.',
      action: 'Opportunity: Launch a 4-part supply chain transparency Reel series. No competitor has gone this deep. Novizio\'s craft story is the differentiator — this is the moment to document and publish it.',
    },
    scatterPoints: [
      { x: 88, y: 42, label: 'Sézane', color: 'var(--rd)' },
      { x: 96, y: 42, label: 'Reformation', color: 'var(--rd)' },
      { x: 92, y: 24, label: 'COS', color: 'var(--am)' },
      { x: 85, y: 32, label: 'Arket', color: 'var(--am)' },
      { x: 24, y: 42, label: 'Novizio', color: 'var(--gn)' },
    ],
    contentIntel: [
      { brand: 'Reformation', platform: 'Instagram', type: 'REEL', date: 'Mar 23', hook: '"We tracked our supply chain for 30 days — here\'s what we found."', reach: '~4.2M est.', eng: '~6.8%', thumbGrad: 'linear-gradient(135deg,#1a2a1a,#0a2040)', whyItWorked: 'Sustainability hook + radical transparency. Triggers curiosity and shares. Posted Thursday 5pm.', action: 'ADAPT FOR NOVIZIO' },
      { brand: 'Sézane', platform: 'Instagram', type: 'REEL', date: 'Mar 20', hook: '"From sketch to shelf — the 6 months we don\'t show you."', reach: '~2.4M est.', eng: '~5.2%', thumbGrad: 'linear-gradient(135deg,#2a1a1a,#1a1a2e)', whyItWorked: 'Behind-the-scenes process + time revelation. Same format Novizio used in Jan — 8× bigger reach due to audience size.', action: 'OUTPACE WITH DEPTH' },
      { brand: 'Reformation', platform: 'Instagram', type: 'CAROUSEL', date: 'Mar 18', hook: '"Our carbon footprint: 2024 vs 2025 — the honest comparison."', reach: '~1.8M est.', eng: '~4.8%', thumbGrad: 'linear-gradient(135deg,#1a2030,#0a1a30)', whyItWorked: 'Data + accountability format. Carousel saves 3.4× industry avg. Community-building through transparency.', action: 'COUNTER WITH YOUR DATA' },
      { brand: 'COS', platform: 'LinkedIn', type: 'POST', date: 'Mar 21', hook: '"Why we\'re slowing our design process down in 2026."', reach: '~12.4K est.', eng: '~4.1%', thumbGrad: 'linear-gradient(135deg,#0a1a40,#1a1a2e)', whyItWorked: 'Design director voice. Thought leadership in a space fashion brands don\'t use. First-mover advantage on fashion × LinkedIn.', action: 'ENTER THIS SPACE' },
      { brand: 'Arket', platform: 'Instagram', type: 'POST', date: 'Mar 19', hook: '"Made in Portugal. Hand-finished. Here\'s the workshop."', reach: '~980K est.', eng: '~4.1%', thumbGrad: 'linear-gradient(135deg,#1a1a30,#0a1030)', whyItWorked: 'Origin story + craft credentials. Static post outperforming their Reels — audience trusts authenticity over production.', action: 'NOVIZIO HAS THIS STORY' },
      { brand: 'Sézane', platform: 'TikTok', type: 'SHORT', date: 'Mar 17', hook: '"3 ways to style the linen shirt for every season."', reach: '~640K est.', eng: '~8.4%', thumbGrad: 'linear-gradient(135deg,#2a0a1a,#1a1a2e)', whyItWorked: 'Styling utility + seasonless messaging. TikTok algorithm rewarding practical fashion content. 82% completion rate.', action: 'REPLICATE FORMAT' },
    ],
    gaps: [
      { topic: 'Supply chain transparency docs', priority: 9.4, owner: 'Reformation (recent)', urgency: 'CRITICAL', description: 'Reformation just entered. Novizio\'s craft story is deeper. Document the full production journey — 4-part Reel series.' },
      { topic: 'Founder mental health / entrepreneurship', priority: 8.8, owner: 'Unclaimed', urgency: 'HIGH', description: 'No fashion competitor is doing this. Massive LinkedIn + Instagram crossover potential. 1 personal post could outperform 10 product posts.' },
      { topic: 'Customer transformation stories (UGC-driven)', priority: 8.2, owner: 'Unclaimed', urgency: 'HIGH', description: 'Size inclusivity + personal style journey. DTC brands with this format see 2.4× saves rate. Novizio has customers ready to feature.' },
      { topic: 'Craft process micro-documentaries', priority: 7.6, owner: 'Sézane (entering)', urgency: 'ACT SOON', description: 'Sézane launched 2 process Reels this month. Novizio\'s craft is more authentic — but window is closing in 4–6 weeks.' },
      { topic: 'Styling tutorials — everyday wear', priority: 7.1, owner: 'Unclaimed', urgency: 'MEDIUM', description: 'High save potential. Carousels perform well in this format. 3 pieces per tutorial from existing Novizio collection.' },
      { topic: 'Fashion × sustainability data posts', priority: 6.8, owner: 'Reformation (active)', urgency: 'MONITOR', description: 'Reformation owns data-driven content. Differentiate with craft quality angle vs environmental metrics.' },
    ],
    keywords: [
      { kw: 'custom fashion brand', vol: '4.4K', diff: 28, us: false, s1: false, s2: false, s3: false, s4: false },
      { kw: 'sustainable clothing label', vol: '18.2K', diff: 62, us: false, s1: true, s2: true, s3: false, s4: false },
      { kw: 'ethical fashion uk', vol: '8.1K', diff: 42, us: false, s1: false, s2: true, s3: true, s4: false },
      { kw: 'artisan made clothing', vol: '2.9K', diff: 19, us: false, s1: true, s2: false, s3: false, s4: true },
      { kw: 'slow fashion brand', vol: '12.4K', diff: 55, us: false, s1: true, s2: true, s3: false, s4: false },
      { kw: 'portuguese linen fashion', vol: '1.2K', diff: 8, us: false, s1: false, s2: false, s3: false, s4: true },
    ],
    kwHeaders: ['Novizio', 'Sézane', 'Reformation', 'COS', 'Arket'],
    alerts: [
      { level: 'critical', icon: '⚡', brand: 'Reformation', text: 'Supply chain transparency campaign reached 4.2M accounts — highest fashion campaign reach this month. Sustainability narrative being claimed now.', date: 'Mar 23', action: 'RESPOND THIS WEEK' },
      { level: 'warn', icon: '⚠', brand: 'Sézane', text: 'TikTok views up 3.2× in 7 days. New hook format detected: transformation + before/after. 6 clips posted, avg 480K views each.', date: 'Mar 21', action: 'ANALYSE HOOKS' },
      { level: 'warn', icon: '⚠', brand: 'COS', text: 'LinkedIn activity doubled — 8 posts in 2 weeks from design director. Testing thought leadership in the fashion × professional space.', date: 'Mar 20', action: 'FIRST MOVER OPPORTUNITY' },
      { level: 'info', icon: '↗', brand: 'Market', text: '"Sustainable supply chain" search volume up 28% this week. No fashion brand under 100K followers ranks for it. Organic opportunity open.', date: 'Mar 22', action: 'CONTENT BRIEF' },
      { level: 'info', icon: '↗', brand: 'Arket', text: 'Reduced posting frequency from 22 to 14 posts/month. Engagement rate improved. Signal: quality over quantity strategy shift.', date: 'Mar 18', action: 'MONITOR' },
    ],
  },
  Hourbour: {
    industry: 'Fintech',
    us: { name: 'Hourbour', ig: '14.2K', li: '4.8K', tt: '2.1K', eng: '3.8%', posts: 8, threat: null as null },
    competitors: [
      { name: 'Revolut', ig: '580K', li: '420K', tt: '1.2M', eng: '1.8%', posts: 42, threat: 'high' as const },
      { name: 'Monzo', ig: '142K', li: '84K', tt: '310K', eng: '3.2%', posts: 28, threat: 'high' as const },
      { name: 'Wise', ig: '98K', li: '220K', tt: '64K', eng: '2.4%', posts: 18, threat: 'medium' as const },
      { name: 'N26', ig: '124K', li: '148K', tt: '42K', eng: '2.1%', posts: 14, threat: 'medium' as const },
    ],
    zarasBrief: {
      headline: 'Monzo\'s community-first content is driving 3.2% engagement — fintech\'s highest',
      body: 'Monzo posted 4 "real customer money moments" stories this week averaging 3.8% engagement — outperforming every other fintech brand this month. Their formula: personal finance milestone (first savings goal hit, first international transfer) + real customer face + non-corporate language. Revolut is doubling down on TikTok with 1.2M followers and growing 14% MoM — but their engagement is only 1.8%, suggesting reach without depth. Wise dominates LinkedIn with thought leadership posts from their CFO — 220K LinkedIn followers vs Hourbour\'s 4.8K is a significant gap. N26 is quiet across all platforms this month — potential market share available.',
      body2: '',
      action: 'Opportunity: Hourbour\'s engagement rate (3.8%) already rivals Monzo\'s. The gap is reach, not resonance. A consistent TikTok strategy targeting the "first financial win" moment could unlock a new acquisition channel within 60 days.',
    },
    scatterPoints: [
      { x: 86, y: 24, label: 'Revolut', color: 'var(--rd)' },
      { x: 56, y: 36, label: 'Monzo', color: 'var(--rd)' },
      { x: 48, y: 28, label: 'Wise', color: 'var(--am)' },
      { x: 44, y: 24, label: 'N26', color: 'var(--am)' },
      { x: 16, y: 38, label: 'Hourbour', color: 'var(--gn)' },
    ],
    contentIntel: [
      { brand: 'Monzo', platform: 'Instagram', type: 'POST', date: 'Mar 22', hook: '"She saved her first £1,000 using Monzo pots. Here\'s how she did it."', reach: '~84K est.', eng: '~4.8%', thumbGrad: 'linear-gradient(135deg,#2a1a2a,#0a1a30)', whyItWorked: 'Real customer + milestone moment. Emotional hook. Non-corporate language. Community shares drive organic reach.', action: 'ADAPT FOR HOURBOUR' },
      { brand: 'Revolut', platform: 'TikTok', type: 'SHORT', date: 'Mar 20', hook: '"This is how I moved £5,000 internationally for £0 in fees."', reach: '~1.4M est.', eng: '~2.1%', thumbGrad: 'linear-gradient(135deg,#1a1a30,#0a2040)', whyItWorked: 'Fee comparison + personal finance hack. Virality driven by savings angle. TikTok search traffic on "international transfer" high.', action: 'SIMILAR FORMAT' },
      { brand: 'Wise', platform: 'LinkedIn', type: 'ARTICLE', date: 'Mar 19', hook: '"The hidden cost of traditional banking in 2026 — a breakdown."', reach: '~32K est.', eng: '~3.8%', thumbGrad: 'linear-gradient(135deg,#0a1a40,#1a1a2e)', whyItWorked: 'Data-driven thought leadership from CFO. B2B credibility play. LinkedIn algorithm favours long-form from executives.', action: 'HOURBOUR HAS THIS ANGLE' },
      { brand: 'Monzo', platform: 'TikTok', type: 'SHORT', date: 'Mar 18', hook: '"3 Monzo features 90% of users don\'t know about."', reach: '~380K est.', eng: '~3.4%', thumbGrad: 'linear-gradient(135deg,#1a2030,#0a1a30)', whyItWorked: 'Discovery + utility. High save and share rate. Works for new and existing customers. Educates without selling.', action: 'FEATURE SPOTLIGHT SERIES' },
    ],
    gaps: [
      { topic: '"First financial win" storytelling', priority: 9.2, owner: 'Monzo (early stage)', urgency: 'CRITICAL', description: 'Monzo is experimenting but hasn\'t owned it. Hourbour\'s product is built for this moment. Launch a 6-part customer milestone series.' },
      { topic: 'Gen Z money anxiety content', priority: 8.6, owner: 'Unclaimed', urgency: 'HIGH', description: 'No fintech brand is addressing financial anxiety directly. Huge TikTok search demand. Anti-bank sentiment angle available.' },
      { topic: 'Feature education (unknown features)', priority: 8.0, owner: 'Monzo (growing)', urgency: 'ACT SOON', description: 'Monzo\'s "features users don\'t know" format is gaining traction. Hourbour has unique features not covered anywhere.' },
      { topic: 'International transfer savings calculator', priority: 7.4, owner: 'Revolut (TikTok)', urgency: 'MEDIUM', description: 'Revolut owns this search term. Differentiate with Hourbour\'s rate guarantee angle vs Revolut\'s variable rates.' },
      { topic: 'Small business finance tips', priority: 6.8, owner: 'Unclaimed', urgency: 'MEDIUM', description: 'LinkedIn + YouTube format. N26 has abandoned this. Hourbour\'s SME features can anchor a weekly series.' },
    ],
    keywords: [
      { kw: 'best app for saving money', vol: '22.4K', diff: 48, us: false, s1: true, s2: true, s3: false, s4: false },
      { kw: 'fintech app uk 2026', vol: '8.8K', diff: 32, us: false, s1: true, s2: false, s3: true, s4: true },
      { kw: 'international transfer free', vol: '18.4K', diff: 61, us: false, s1: false, s2: false, s3: true, s4: false },
      { kw: 'money management app', vol: '31.2K', diff: 72, us: false, s1: true, s2: true, s3: false, s4: true },
      { kw: 'neobank uk', vol: '12.8K', diff: 55, us: false, s1: true, s2: true, s3: true, s4: true },
      { kw: 'hourly savings tracker', vol: '1.4K', diff: 6, us: false, s1: false, s2: false, s3: false, s4: false },
    ],
    kwHeaders: ['Hourbour', 'Revolut', 'Monzo', 'Wise', 'N26'],
    alerts: [
      { level: 'warn', icon: '⚠', brand: 'Monzo', text: 'Engagement rate reached 3.2% this week — driven by 4 customer milestone posts. Format is gaining algorithmic traction. Audience size: 142K.', date: 'Mar 22', action: 'COUNTER CAMPAIGN' },
      { level: 'warn', icon: '⚠', brand: 'Revolut', text: 'TikTok followers up 14% MoM (1.2M total). New format: "fee comparison" videos averaging 1.4M views each. Low engagement but massive reach.', date: 'Mar 20', action: 'ENGAGEMENT PLAY' },
      { level: 'info', icon: '↗', brand: 'N26', text: 'Posting frequency dropped 40% this month. UK and EU market activity quiet. Potential audience gap opening in their follower base.', date: 'Mar 18', action: 'ACQUISITION OPPORTUNITY' },
      { level: 'info', icon: '↗', brand: 'Market', text: '"Gen Z money anxiety" search volume up 44% in 2 weeks. No fintech brand has content in this category. First-mover advantage available.', date: 'Mar 21', action: 'CONTENT BRIEF' },
    ],
  },
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function OverviewTab({ venture }: { venture: Venture }) {
  const d = VENTURE_DATA[venture]
  const all = [...d.competitors, d.us]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Zara's Weekly Brief */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderLeft: '2px solid #6A4A9A', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6A4A9A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: '#fff' }}>Z</div>
          <div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#6A4A9A', letterSpacing: '0.08em' }}>ZARA · WEEKLY COMPETITIVE BRIEF</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)' }}>Week of Mar 24, 2026 · {d.industry}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--am)', border: '1px solid var(--am)', padding: '2px 8px' }}>ACTION REQUIRED</div>
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--ac)', marginBottom: '10px', fontWeight: 500 }}>{d.zarasBrief.headline}</div>
        <p style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.65, margin: '0 0 12px' }}>{d.zarasBrief.body}</p>
        <div style={{ background: 'var(--bg)', borderLeft: '2px solid var(--gn)', padding: '10px 12px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--gn)', marginBottom: '5px', letterSpacing: '0.06em' }}>OPPORTUNITY</div>
          <p style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.55, margin: 0 }}>{d.zarasBrief.action}</p>
        </div>
      </div>

      {/* Competitor Matrix */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '16px' }}>
        <SH sub="All competitors vs us · sorted by Instagram followers">Competitor Matrix</SH>
        <div style={{ display: 'grid', gridTemplateColumns: `1fr 80px 80px 80px 60px 60px 80px`, gap: 0 }}>
          {['Brand', 'Instagram', 'LinkedIn', 'TikTok', 'Eng %', 'Posts/mo', 'Threat'].map(h => (
            <div key={h} style={{ padding: '6px 8px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', borderBottom: '1px solid var(--b1)', letterSpacing: '0.06em' }}>{h}</div>
          ))}
          {all.map((c, i) => {
            const isUs = c.threat === null
            return [
              <div key={`${i}n`} style={{ padding: '10px 8px', borderBottom: '1px solid var(--b1)', fontSize: '12px', color: isUs ? 'var(--ac)' : 'var(--tx)', fontFamily: isUs ? 'var(--font-dm-mono)' : undefined, fontWeight: isUs ? 500 : undefined }}>{c.name}{isUs ? ' ←' : ''}</div>,
              <div key={`${i}ig`} style={{ padding: '10px 8px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--tx)' }}>{c.ig}</div>,
              <div key={`${i}li`} style={{ padding: '10px 8px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--tx)' }}>{c.li}</div>,
              <div key={`${i}tt`} style={{ padding: '10px 8px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--tx)' }}>{c.tt}</div>,
              <div key={`${i}en`} style={{ padding: '10px 8px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: parseFloat(c.eng) >= 4 ? 'var(--gn)' : parseFloat(c.eng) >= 3 ? 'var(--di)' : 'var(--rd)' }}>{c.eng}</div>,
              <div key={`${i}po`} style={{ padding: '10px 8px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)' }}>{c.posts}</div>,
              <div key={`${i}th`} style={{ padding: '10px 8px', borderBottom: '1px solid var(--b1)' }}>
                {c.threat && (
                  <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', padding: '2px 6px', color: c.threat === 'high' ? 'var(--rd)' : 'var(--am)', border: `1px solid ${c.threat === 'high' ? 'var(--rd)' : 'var(--am)'}` }}>{c.threat.toUpperCase()}</span>
                )}
              </div>,
            ]
          })}
        </div>
      </div>

      {/* SVG Scatter Plot */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', padding: '16px' }}>
        <SH sub="Bubble position = followers (X) vs engagement rate (Y) · bigger = more posts/month">Market Position Map</SH>
        <div style={{ position: 'relative', height: '280px', border: '1px solid var(--b1)' }}>
          {/* Quadrant lines */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: '24px', borderLeft: '1px dashed var(--b2)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '24px', right: 0, borderTop: '1px dashed var(--b2)' }} />
          {/* Quadrant labels */}
          <div style={{ position: 'absolute', top: '8px', left: '27%', fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)' }}>small · high eng</div>
          <div style={{ position: 'absolute', top: '8px', right: '8px', fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', textAlign: 'right' }}>large · high eng</div>
          <div style={{ position: 'absolute', bottom: '30px', left: '27%', fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)' }}>small · low eng</div>
          <div style={{ position: 'absolute', bottom: '30px', right: '8px', fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', textAlign: 'right' }}>large · low eng</div>
          {/* Axes */}
          <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>Followers →</div>
          <div style={{ position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>Engagement →</div>
          {/* Points */}
          {d.scatterPoints.map(p => (
            <div key={p.label} style={{ position: 'absolute', left: `${p.x}%`, bottom: `${p.y / 1.5 + 8}%`, transform: 'translate(-50%, 50%)' }}>
              <div style={{ width: '10px', height: '10px', background: p.color, borderRadius: p.label === venture ? '0' : '50%' }} />
              <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: p.color, whiteSpace: 'nowrap', fontWeight: p.label === venture ? 500 : undefined }}>{p.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', marginTop: '8px' }}>{venture} leads on engagement rate despite smaller following — a defensible strength while scaling reach.</div>
      </div>
    </div>
  )
}

// ── BRIEF PANEL ───────────────────────────────────────────────────────────────
function BriefPanel({ action, hook, whyItWorked, brand, platform, venture, onClose }: {
  action: string; hook: string; whyItWorked: string; brand: string; platform: string; venture: string; onClose: () => void
}) {
  const router = useRouter()
  const isAdapt = action.startsWith('ADAPT') || action === 'REPLICATE FORMAT' || action === 'SIMILAR FORMAT'
  const isOutpace = action === 'OUTPACE WITH DEPTH'
  const isCounter = action === 'COUNTER WITH YOUR DATA'
  const isEnter = action === 'ENTER THIS SPACE'
  const isOwn = action.includes('HAS THIS') || action.includes('HAS THIS ANGLE')
  const isFeature = action === 'FEATURE SPOTLIGHT SERIES'

  let title = 'CONTENT BRIEF'
  let instruction = ''
  let what = ''
  let keep = ''
  let change = ''

  if (isAdapt) {
    title = `ADAPT BRIEF — MAKE ${brand}'S FORMAT YOURS`
    instruction = `${brand} posted a format that performed well. Adapt it for ${venture} — same mechanics, your voice and story.`
    what = hook
    keep = 'The hook structure and format type — this is what made it work'
    change = `Replace ${brand}'s brand identity with ${venture}'s voice. No mimicking — translate the mechanic, not the aesthetic.`
  } else if (isOutpace) {
    title = 'OUTPACE BRIEF — GO DEEPER THAN THEY DID'
    instruction = `${brand} used a concept you've already established. They got more reach due to audience size — but your version can be more authentic and specific.`
    what = hook
    keep = 'The content concept and behind-the-scenes angle'
    change = `Add more depth and specificity. Where they showed a summary, show the details. ${venture}'s craft story is more authentic — use it.`
  } else if (isCounter) {
    title = 'COUNTER BRIEF — BEAT THEM WITH YOUR DATA'
    instruction = `${brand} owns this topic with data-driven content. ${venture} can counter with a craft-quality angle — differentiator, not imitation.`
    what = hook
    keep = 'The data-driven format structure — audiences save this type of content'
    change = `Swap environmental metrics for craft quality storytelling. Where ${brand} shows numbers, ${venture} shows process and materials. Different angle, same format.`
  } else if (isEnter) {
    title = 'ENTER BRIEF — CLAIM THIS CHANNEL NOW'
    instruction = `${brand} is testing a new platform/format combination. ${venture} can enter before it becomes crowded — first-mover advantage.`
    what = hook
    keep = 'The channel + format combination — LinkedIn thought leadership in fashion is untested territory'
    change = `Use ${venture}'s founder or design lead voice. More personal, less corporate. The format works because it feels real — keep that.`
  } else if (isOwn) {
    title = 'YOU HAVE THIS STORY — TELL IT'
    instruction = `${brand} is getting reach from a story that ${venture} actually has better rights to. Time to tell yours.`
    what = hook
    keep = 'The storytelling approach — origin + craft + specificity'
    change = `Use your real details — real locations, real materials, real process steps. ${venture}'s version should be more specific, not less.`
  } else if (isFeature) {
    title = 'FEATURE SERIES BRIEF'
    instruction = `${brand} is educating their audience on features they don't know about. ${venture} has unique features that no competitor covers. Start a series.`
    what = hook
    keep = 'Discovery format — "X things you don\'t know" structure works because it creates curiosity before the viewer can scroll'
    change = `Use ${venture}-specific features. Each video = 1 feature, 60 seconds max. Practical demo, not a product pitch.`
  } else {
    title = 'CONTENT BRIEF'
    instruction = 'Use the analysis below to create your response content.'
    what = hook
    keep = whyItWorked
    change = `Adapt for ${venture}'s voice and audience.`
  }

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--ac)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--ac)', letterSpacing: '0.06em' }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', cursor: 'pointer', padding: '0 4px' }}>CLOSE ×</button>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.55, margin: 0 }}>{instruction}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--b1)' }}>
        {[
          { l: 'THEIR POST', v: what },
          { l: 'WHY IT WORKED', v: whyItWorked },
          { l: 'WHAT TO KEEP', v: keep },
          { l: 'WHAT TO CHANGE', v: change },
          { l: 'FORMAT', v: `${platform} · ${adventure(action)}` },
          { l: 'SEND TO', v: 'Lena (copy angle) · Atlas (visual direction)' },
        ].map(f => (
          <div key={f.l} style={{ background: 'var(--sf)', padding: '10px 12px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', marginBottom: '4px', letterSpacing: '0.06em' }}>{f.l}</div>
            <div style={{ fontSize: '11px', color: 'var(--di)', lineHeight: 1.5 }}>{f.v}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          const brief = [
            `THEIR POST: ${what}`,
            `WHY IT WORKED: ${whyItWorked}`,
            `WHAT TO KEEP: ${keep}`,
            `WHAT TO CHANGE: ${change}`,
            `FORMAT: ${platform} · ${adventure(action)}`,
          ].join('\n')
          // Route to correct tab based on action type
          const targetTab = isAdapt ? 'direction' : isOutpace ? 'brief' : isCounter ? 'direction' : isEnter ? 'brief' : isOwn ? 'production' : 'direction'
          router.push(`/creative?tab=${targetTab}&brief=${encodeURIComponent(brief)}`)
        }}
        style={{ alignSelf: 'flex-start', background: 'var(--ac)', border: 'none', color: '#0a1a0a', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.06em', padding: '8px 16px', cursor: 'pointer' }}
      >
        SEND TO CREATIVE →
      </button>
    </div>
  )
}

function adventure(action: string) {
  if (action.includes('REEL') || action.includes('SHORT') || action.includes('REPLICATE')) return 'Short-form video'
  if (action.includes('ARTICLE') || action.includes('LINKEDIN')) return 'LinkedIn article or post'
  if (action.includes('CAROUSEL')) return 'Carousel'
  return 'Match original format'
}

// ── CONTENT INTEL TAB ─────────────────────────────────────────────────────────
function ContentIntelTab({ venture }: { venture: Venture }) {
  const { contentIntel } = VENTURE_DATA[venture]
  const [openBrief, setOpenBrief] = useState<number | null>(null)

  // Map action label → button color
  const actionColor = (a: string) => {
    if (a.startsWith('ADAPT') || a === 'REPLICATE FORMAT' || a === 'SIMILAR FORMAT' || a === 'FEATURE SPOTLIGHT SERIES') return 'var(--gn)'
    if (a === 'OUTPACE WITH DEPTH' || a.includes('HAS THIS')) return 'var(--ac)'
    if (a === 'COUNTER WITH YOUR DATA') return 'var(--am)'
    if (a === 'ENTER THIS SPACE') return 'var(--bl)'
    return 'var(--di)'
  }

  // Plain-English tooltip per action
  const actionMeaning = (a: string) => {
    if (a.startsWith('ADAPT') || a === 'SIMILAR FORMAT') return 'Their format works — adapt it for your brand'
    if (a === 'OUTPACE WITH DEPTH') return 'You have this story — tell a deeper version'
    if (a === 'COUNTER WITH YOUR DATA') return 'They own this topic — counter with your differentiator'
    if (a === 'ENTER THIS SPACE') return 'They\'re testing a new channel — enter before it\'s crowded'
    if (a.includes('HAS THIS')) return 'You already have this story — just tell it'
    if (a === 'REPLICATE FORMAT') return 'High-performing format you can replicate'
    if (a === 'FEATURE SPOTLIGHT SERIES') return 'Build a series around your features'
    return 'Review and act on this signal'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SH sub="Zara · top-performing competitor content this week with analysis">Competitor Content Pull</SH>
      {contentIntel.map((c, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderBottom: openBrief === i ? 'none' : undefined, display: 'grid', gridTemplateColumns: '80px 1fr', gap: 0 }}>
            {/* Thumbnail */}
            <div style={{ background: c.thumbGrad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px' }}>
              <span style={{ fontSize: '16px', opacity: 0.6 }}>{c.type === 'REEL' || c.type === 'SHORT' ? '▶' : c.type === 'CAROUSEL' ? '⊞' : c.type === 'ARTICLE' ? '≡' : '◉'}</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{c.type}</span>
            </div>
            {/* Content */}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--ac)', fontWeight: 500 }}>{c.brand}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--di)', border: '1px solid var(--b2)', padding: '1px 5px' }}>{c.platform}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', marginLeft: 'auto' }}>{c.date}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--tx)', lineHeight: 1.45, margin: 0 }}>{c.hook}</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div><div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)' }}>EST. REACH</div><div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)' }}>{c.reach}</div></div>
                <div><div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)' }}>EST. ENG</div><div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--gn)' }}>{c.eng}</div></div>
              </div>
              <div style={{ background: 'var(--bg)', padding: '8px 10px', borderLeft: '2px solid var(--b3)' }}>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--di)', marginBottom: '3px', letterSpacing: '0.06em' }}>WHY IT WORKED</div>
                <p style={{ fontSize: '11px', color: 'var(--di)', lineHeight: 1.45, margin: 0 }}>{c.whyItWorked}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)' }}>{actionMeaning(c.action)}</span>
                <button
                  onClick={() => setOpenBrief(openBrief === i ? null : i)}
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: openBrief === i ? '#0a1a0a' : actionColor(c.action), background: openBrief === i ? actionColor(c.action) : 'none', border: `1px solid ${actionColor(c.action)}`, padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.06em', flexShrink: 0 }}
                >
                  {openBrief === i ? 'CLOSE BRIEF ×' : `${c.action} →`}
                </button>
              </div>
            </div>
          </div>
          {openBrief === i && (
            <BriefPanel
              action={c.action}
              hook={c.hook}
              whyItWorked={c.whyItWorked}
              brand={c.brand}
              platform={c.platform}
              venture={venture}
              onClose={() => setOpenBrief(null)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── GAP BRIEF PANEL ───────────────────────────────────────────────────────────
type GapItem = typeof VENTURE_DATA['Novizio']['gaps'][number]

function gapFirstPiece(topic: string, venture: string): string {
  const map: Record<string, string> = {
    'Supply chain transparency docs': `Reel: "We tracked every step of ${venture}'s production — here's what it looks like." 60–90s, raw footage.`,
    'Founder mental health / entrepreneurship': `LinkedIn post: "The part of running ${venture} no one sees." Personal, specific, 300 words.`,
    'Customer transformation stories (UGC-driven)': `Carousel: "Real ${venture} customers — before and after finding their style." 5 slides, 1 customer each.`,
    'Craft process micro-documentaries': `Reel: "How one ${venture} piece goes from sketch to your wardrobe." 90 seconds, workshop footage.`,
    'Styling tutorials — everyday wear': `Carousel: "3 ways to wear the hero piece — office to evening." 4 slides.`,
    'Fashion × sustainability data posts': `Post: "${venture}'s 2025 material sourcing — in numbers." One graphic, published LinkedIn + Instagram.`,
    '"First financial win" storytelling': `Reel: "She hit her first savings goal using ${venture} — here's her story." 60s, real customer.`,
    'Gen Z money anxiety content': `TikTok: "Nobody talks about this side of money in your 20s." Raw talking-head, no corporate polish.`,
    'Feature education (unknown features)': `TikTok: "3 ${venture} features most users have never tried." Quick demo, 45 seconds.`,
    'International transfer savings calculator': `Carousel: "How much you'd save on your last international transfer with ${venture}." 3 comparison slides.`,
    'Small business finance tips': `LinkedIn series: "Weekly finance tip for UK founders — from ${venture}." 1 post per week, text + graphic.`,
  }
  return map[topic] ?? `Create a first piece establishing ${venture}'s presence in this gap.`
}

function GapBriefPanel({ gap, venture, onClose }: { gap: GapItem; venture: string; onClose: () => void }) {
  const router = useRouter()
  const urgencyColor = (u: string) => u === 'CRITICAL' ? 'var(--rd)' : u === 'HIGH' || u === 'ACT SOON' ? 'var(--am)' : 'var(--di)'
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--ac)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--ac)', letterSpacing: '0.06em' }}>GAP CLAIM BRIEF</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', cursor: 'pointer', padding: '0 4px' }}>CLOSE ×</button>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.55, margin: 0 }}>{gap.description}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--b1)' }}>
        {[
          { l: 'THE GAP', v: gap.topic },
          { l: 'CURRENT OWNER', v: gap.owner },
          { l: 'FIRST PIECE TO CREATE', v: gapFirstPiece(gap.topic, venture) },
          { l: 'URGENCY', v: gap.urgency },
          { l: 'OPPORTUNITY SCORE', v: `${gap.priority} / 10` },
          { l: 'ASSIGN TO', v: 'Lena (copy angle) · Atlas (visual direction)' },
        ].map(f => (
          <div key={f.l} style={{ background: 'var(--sf)', padding: '10px 12px' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', marginBottom: '4px', letterSpacing: '0.06em' }}>{f.l}</div>
            <div style={{ fontSize: '11px', color: f.l === 'URGENCY' ? urgencyColor(gap.urgency) : 'var(--di)', lineHeight: 1.5 }}>{f.v}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          const brief = [
            `CONTENT GAP: ${gap.topic}`,
            `PRIORITY: ${gap.priority}/10 · URGENCY: ${gap.urgency}`,
            `CURRENT OWNER: ${gap.owner}`,
            `FIRST PIECE TO CREATE: ${gapFirstPiece(gap.topic, venture)}`,
            `DESCRIPTION: ${gap.description}`,
          ].join('\n')
          router.push(`/creative?tab=brief&brief=${encodeURIComponent(brief)}`)
        }}
        style={{ alignSelf: 'flex-start', background: 'var(--ac)', border: 'none', color: '#0a1a0a', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.06em', padding: '8px 16px', cursor: 'pointer' }}
      >
        ADD TO CONTENT PLAN →
      </button>
    </div>
  )
}

// ── CONTENT GAPS TAB ──────────────────────────────────────────────────────────
function ContentGapsTab({ venture }: { venture: Venture }) {
  const { gaps } = VENTURE_DATA[venture]
  const [openGap, setOpenGap] = useState<number | null>(null)
  const urgencyColor = (u: string) => u === 'CRITICAL' ? 'var(--rd)' : u === 'HIGH' || u === 'ACT SOON' ? 'var(--am)' : 'var(--di)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SH sub="Zara · ranked by opportunity score · unclaimed gaps only">Priority Content Gaps</SH>
      {gaps.map((g, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderBottom: openGap === i ? 'none' : undefined, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '24px', color: 'var(--br)', minWidth: '44px' }}>{g.priority}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: 'var(--tx)', fontWeight: 500, marginBottom: '2px' }}>{g.topic}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)' }}>Currently owned by: {g.owner}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: urgencyColor(g.urgency), border: `1px solid ${urgencyColor(g.urgency)}`, padding: '2px 7px', flexShrink: 0 }}>{g.urgency}</span>
            </div>
            <div style={{ height: '2px', background: 'var(--b2)' }}>
              <div style={{ height: '2px', width: `${g.priority * 10}%`, background: g.urgency === 'CRITICAL' ? 'var(--rd)' : g.urgency === 'HIGH' ? 'var(--am)' : 'var(--di)' }} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.5, margin: 0 }}>{g.description}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOpenGap(openGap === i ? null : i)}
                style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: openGap === i ? '#0a1a0a' : 'var(--ac)', background: openGap === i ? 'var(--ac)' : 'none', border: '1px solid var(--ac)', padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.06em' }}
              >
                {openGap === i ? 'CLOSE BRIEF ×' : 'CLAIM THIS GAP →'}
              </button>
            </div>
          </div>
          {openGap === i && (
            <GapBriefPanel gap={g} venture={venture} onClose={() => setOpenGap(null)} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── KEYWORDS TAB ──────────────────────────────────────────────────────────────
function KeywordsTab({ venture }: { venture: Venture }) {
  const { keywords, kwHeaders } = VENTURE_DATA[venture]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SH sub="Search volume · difficulty · competitor coverage · ● = active ○ = not ranking">Keyword Coverage Matrix</SH>
      <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 50px 80px 80px 80px 80px 80px', gap: 0 }}>
          {['Keyword', 'Vol/mo', 'Diff', ...kwHeaders].map(h => (
            <div key={h} style={{ padding: '8px 10px', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--di)', borderBottom: '1px solid var(--b1)', letterSpacing: '0.05em', background: 'var(--bg)' }}>{h}</div>
          ))}
          {keywords.map((k, i) => {
            const coverage = [k.us, k.s1, k.s2, k.s3, k.s4]
            return [
              <div key={`${i}k`} style={{ padding: '10px 10px', borderBottom: '1px solid var(--b1)', fontSize: '12px', color: 'var(--tx)' }}>{k.kw}</div>,
              <div key={`${i}v`} style={{ padding: '10px 10px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--di)' }}>{k.vol}</div>,
              <div key={`${i}d`} style={{ padding: '10px 10px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: parseInt(k.diff.toString()) < 30 ? 'var(--gn)' : parseInt(k.diff.toString()) < 55 ? 'var(--am)' : 'var(--rd)' }}>{k.diff}</div>,
              ...coverage.map((has, j) => (
                <div key={`${i}c${j}`} style={{ padding: '10px 10px', borderBottom: '1px solid var(--b1)', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', color: has ? 'var(--gn)' : j === 0 ? 'var(--rd)' : 'var(--b3)', textAlign: 'center' }}>
                  {has ? '●' : '○'}
                </div>
              )),
            ]
          })}
        </div>
      </div>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--b1)', borderLeft: '2px solid #6A4A9A', padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: '#6A4A9A', marginBottom: '6px', letterSpacing: '0.06em' }}>ZARA · KEYWORD STRATEGY</div>
        <p style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.55, margin: 0 }}>
          {venture === 'Novizio'
            ? 'Novizio ranks for 0 of these keywords. The lowest-difficulty opportunity: "portuguese linen fashion" (D:8, 1.2K/mo) — unclaimed by all competitors. "Custom fashion brand" (D:28) is the highest-opportunity quick win. Target these two first before addressing the competitive keywords.'
            : 'Hourbour ranks for 0 of these keywords. "Hourly savings tracker" (D:6, 1.4K/mo) is unclaimed by all competitors and directly describes your product. "Fintech app uk 2026" (D:32) is low-competition vs volume. Start with branded search capture, then expand to category terms.'}
        </p>
      </div>
    </div>
  )
}

// ── ALERT ACTION PANEL ────────────────────────────────────────────────────────
type AlertItem = typeof VENTURE_DATA['Novizio']['alerts'][number]

function alertPanelContent(action: string, alert: AlertItem, venture: string): { title: string; what: string; steps: string[]; assign: string } {
  const isRespond = action === 'RESPOND THIS WEEK' || action === 'COUNTER CAMPAIGN'
  const isAnalyse = action === 'ANALYSE HOOKS' || action === 'ENGAGEMENT PLAY'
  const isFirst = action === 'FIRST MOVER OPPORTUNITY' || action === 'ACQUISITION OPPORTUNITY'
  const isBrief = action === 'CONTENT BRIEF'

  if (isRespond) return {
    title: 'COMPETITIVE RESPONSE BRIEF',
    what: `${alert.brand} is claiming a narrative that matters to your audience. Respond this week before it solidifies.`,
    steps: [
      `Counter-narrative: publish ${venture}'s version of this story within 5 days`,
      'Frame around your specific differentiator — not a direct refutation',
      'Post on the same platform(s) they used for maximum overlap',
    ],
    assign: 'Lena (copy) · Atlas (visual) · Rio (boost if needed)',
  }
  if (isAnalyse) return {
    title: 'HOOK ANALYSIS BRIEF',
    what: `${alert.brand}'s format is gaining traction. Analyse what's driving it before building your version.`,
    steps: [
      'Identify the emotional hook in their top 3 posts this week',
      'Note the first 3 seconds — what makes someone stop scrolling',
      'Draft 2 hook variants for your next post using the same trigger',
    ],
    assign: 'Kai (analysis) · Lena (hook copywriting)',
  }
  if (isFirst) return {
    title: 'FIRST MOVER ACTION BRIEF',
    what: `${alert.brand} is quiet or absent — a window is open. Move before someone else claims this space.`,
    steps: [
      'Publish 1 piece in this gap within 48 hours to establish presence',
      'Use consistent framing so the second and third piece build on the first',
      'Track engagement rate vs your baseline — validate before scaling',
    ],
    assign: 'Lena (copy) · Atlas (visual direction)',
  }
  if (isBrief) return {
    title: 'CONTENT OPPORTUNITY BRIEF',
    what: `Market signal detected. No brand owns this yet — create the first piece.`,
    steps: [
      'Research the search term or trend mentioned in the alert',
      'Create 1 definitive piece that ranks or performs for this topic',
      'Repurpose across platforms: long-form (LinkedIn) + short-form (TikTok/IG)',
    ],
    assign: 'Lena (copy) · Atlas (visual) · Kai (keyword angle)',
  }
  // MONITOR
  return {
    title: 'MONITOR — NO ACTION YET',
    what: `This signal doesn't require immediate action but should be tracked.`,
    steps: [
      'Check this signal again in 7 days — has volume or frequency increased?',
      'If frequency doubles, escalate to CONTENT BRIEF or RESPOND THIS WEEK',
      'No content action needed this week',
    ],
    assign: 'Kai (tracking)',
  }
}

function AlertActionPanel({ alert, venture, onClose }: { alert: AlertItem; venture: string; onClose: () => void }) {
  const router = useRouter()
  const content = alertPanelContent(alert.action, alert, venture)
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--ac)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--ac)', letterSpacing: '0.06em' }}>{content.title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontFamily: 'var(--font-dm-mono)', fontSize: '10px', cursor: 'pointer', padding: '0 4px' }}>CLOSE ×</button>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.55, margin: 0 }}>{content.what}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
        {content.steps.map((step, idx) => (
          <div key={idx} style={{ background: 'var(--sf)', padding: '10px 12px', display: 'flex', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--ac)', minWidth: '16px' }}>{idx + 1}.</span>
            <span style={{ fontSize: '11px', color: 'var(--di)', lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
        <div style={{ background: 'var(--sf)', padding: '10px 12px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', marginBottom: '3px', letterSpacing: '0.06em' }}>ASSIGN TO</div>
          <div style={{ fontSize: '11px', color: 'var(--di)' }}>{content.assign}</div>
        </div>
      </div>
      <button
        onClick={() => {
          const brief = [
            `ALERT: ${alert.action} — ${alert.brand}`,
            `CONTEXT: ${alert.text}`,
            'PLAN:',
            ...content.steps.map((s, i) => `${i + 1}. ${s}`),
            `ASSIGN TO: ${content.assign}`,
          ].join('\n')
          router.push(`/creative?tab=brief&brief=${encodeURIComponent(brief)}`)
        }}
        style={{ alignSelf: 'flex-start', background: 'var(--ac)', border: 'none', color: '#0a1a0a', fontFamily: 'var(--font-dm-mono)', fontSize: '9px', letterSpacing: '0.06em', padding: '8px 16px', cursor: 'pointer' }}
      >
        SEND TO TEAM →
      </button>
    </div>
  )
}

// ── ALERTS TAB ────────────────────────────────────────────────────────────────
function AlertsTab({ venture }: { venture: Venture }) {
  const { alerts } = VENTURE_DATA[venture]
  const [openAlert, setOpenAlert] = useState<number | null>(null)
  const levelColor = (l: string) => l === 'critical' ? 'var(--rd)' : l === 'warn' ? 'var(--am)' : 'var(--bl)'
  const levelLabel = (l: string) => l === 'critical' ? 'CRITICAL' : l === 'warn' ? 'WATCH' : 'INTEL'

  const actionColor = (action: string) => {
    if (action === 'RESPOND THIS WEEK' || action === 'COUNTER CAMPAIGN') return 'var(--rd)'
    if (action === 'ANALYSE HOOKS' || action === 'ENGAGEMENT PLAY') return 'var(--am)'
    if (action === 'FIRST MOVER OPPORTUNITY' || action === 'ACQUISITION OPPORTUNITY') return 'var(--gn)'
    if (action === 'CONTENT BRIEF') return 'var(--ac)'
    return 'var(--di)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SH sub="Zara · live competitor signals · updated daily">Competitive Alerts</SH>
      {alerts.map((a, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderBottom: openAlert === i ? 'none' : undefined, borderLeft: `2px solid ${levelColor(a.level)}`, padding: '14px 16px', display: 'grid', gridTemplateColumns: '36px 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
              <span style={{ fontSize: '16px' }}>{a.icon}</span>
              <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '7px', color: levelColor(a.level), border: `1px solid ${levelColor(a.level)}`, padding: '1px 3px', textAlign: 'center', letterSpacing: '0.04em' }}>{levelLabel(a.level)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--tx)', fontWeight: 500 }}>{a.brand}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)' }}>{a.date}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--di)', lineHeight: 1.5, margin: 0 }}>{a.text}</p>
              <div>
                <button
                  onClick={() => setOpenAlert(openAlert === i ? null : i)}
                  style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: openAlert === i ? '#0a1a0a' : actionColor(a.action), background: openAlert === i ? actionColor(a.action) : 'none', border: `1px solid ${actionColor(a.action)}`, padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.06em' }}
                >
                  {openAlert === i ? 'CLOSE ×' : `${a.action} →`}
                </button>
              </div>
            </div>
          </div>
          {openAlert === i && (
            <AlertActionPanel alert={a} venture={venture} onClose={() => setOpenAlert(null)} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── COMPETITOR CONFIG BAR ─────────────────────────────────────────────────────
const DEFAULTS: Record<Venture, string[]> = {
  Novizio:  ['Sézane', 'Reformation', 'COS', 'Arket'],
  Hourbour: ['Revolut', 'Monzo', 'Wise', 'N26'],
}

function CompetitorConfigBar({ venture }: { venture: Venture }) {
  const [configured, setConfigured] = useState<string[]>([])
  const [isDefault, setIsDefault]   = useState(true)

  useEffect(() => {
    try {
      const key  = `yvon_competitors_${venture.toLowerCase()}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConfigured(parsed)
          setIsDefault(false)
          return
        }
      }
    } catch { /* ignore */ }
    setConfigured(DEFAULTS[venture])
    setIsDefault(true)
  }, [venture])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 14px',
      background: 'var(--sf)',
      border: '1px solid var(--b1)',
      marginBottom: '20px',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '9px', color: 'var(--mu)', letterSpacing: '0.08em', flexShrink: 0 }}>
        TRACKING
      </span>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
        {configured.map(c => (
          <span key={c} style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '9px',
            color: 'var(--di)',
            background: 'var(--bg)',
            border: '1px solid var(--b1)',
            padding: '2px 8px',
          }}>
            {c}
          </span>
        ))}
      </div>
      {isDefault && (
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '8px', color: 'var(--mu)', flexShrink: 0 }}>
          AUTO-DETECTED
        </span>
      )}
      <Link href="/settings?tab=ventures" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '8px',
          color: 'var(--ac)',
          border: '1px solid var(--ac)',
          padding: '2px 8px',
          letterSpacing: '0.06em',
          cursor: 'pointer',
        }}>
          CONFIGURE →
        </span>
      </Link>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function CompetitorPage() {
  const [venture, setVenture] = useState<Venture>('Novizio')
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  // Read active venture from cookie — keep in sync with Sidebar1
  useEffect(() => {
    const match = document.cookie.match(/yvon_active_venture=([^;]+)/)
    if (match?.[1]) {
      const v = SLUG_TO_VENTURE[decodeURIComponent(match[1])]
      if (v) setVenture(v)
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mu)', letterSpacing: '0.08em', marginBottom: '4px' }}>COMPETITIVE INTELLIGENCE · {VENTURE_DATA[venture].industry.toUpperCase()}</div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400, fontSize: '32px', color: 'var(--br)', margin: 0 }}>Competitor Intel</h1>
      </div>

      <div className="tab-bar" style={{ marginBottom: '24px' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'tab-btn-active' : ''}`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <CompetitorConfigBar venture={venture} />

      {activeTab === 'Overview' && <OverviewTab venture={venture} />}
      {activeTab === 'Content Intel' && <ContentIntelTab venture={venture} />}
      {activeTab === 'Content Gaps' && <ContentGapsTab venture={venture} />}
      {activeTab === 'Keywords' && <KeywordsTab venture={venture} />}
      {activeTab === 'Alerts' && <AlertsTab venture={venture} />}
    </div>
  )
}
