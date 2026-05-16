# Marketing Dashboard Research — DTC/E-Commerce (2025-2026)
> Compiled: 2026-04-05 | For: YVON BI Dashboard (2 ventures: fashion + fintech)

---

## 1. Top Marketing Dashboard KPIs & Metrics

### Tier 1 — The "North Star" Metrics (always visible)
| Metric | Definition | DTC Benchmark |
|--------|-----------|----------------|
| **Blended ROAS** | Total revenue / total ad spend (all channels) | 3.0-5.0x for fashion, 2.5-4.0x for fintech |
| **NC-ROAS (New Customer ROAS)** | Revenue from new customers / ad spend | 2.0-3.5x (more important than blended) |
| **MER (Marketing Efficiency Ratio)** | Total revenue / total marketing spend | 4.0-8.0x healthy range |
| **CAC (Customer Acquisition Cost)** | Total spend / new customers acquired | $20-60 fashion, $50-150 fintech |
| **LTV:CAC Ratio** | Lifetime value / acquisition cost | 3:1+ is healthy, below 1.5:1 is danger |
| **AOV (Average Order Value)** | Revenue / number of orders | Track trend, not absolute |
| **Contribution Margin** | Revenue - COGS - ad spend - shipping | 20-40% target for DTC |

### Tier 2 — Channel Performance Metrics
| Metric | What It Tells You |
|--------|-------------------|
| **ROAS by channel** (Meta, Google, TikTok, email, organic) | Which channels are profitable |
| **Spend by channel** | Budget allocation reality |
| **New vs returning customer revenue split** | Retention health |
| **Revenue per session** | Traffic quality |
| **Conversion rate by source** | Funnel efficiency per channel |
| **CPM / CPC / CTR by platform** | Cost trends and creative performance |
| **Impressions & reach** | Top-of-funnel awareness |

### Tier 3 — Operational Metrics
| Metric | Purpose |
|--------|---------|
| **Cart abandonment rate** | Checkout friction (avg 70% industry) |
| **Add-to-cart rate** | Product page effectiveness (8-12% target) |
| **Session duration & pages/session** | Engagement depth |
| **Email revenue as % of total** | Owned channel dependency |
| **Refund/return rate** | Product-market fit signal |
| **Repeat purchase rate** | Brand health (25-40% for strong DTC) |
| **Days between purchases** | Repurchase cycle |

### How Triple Whale / Northbeam Layout These
The top-tier tools show a **summary row** at the very top (Blended ROAS, NC-ROAS, MER, total spend, total revenue), then a **trend chart** (daily/weekly), then a **channel breakdown table** below. This 3-tier hierarchy is the standard pattern.

---

## 2. Marketing Funnel Tracking (TOFU / MOFU / BOFU)

### TOFU — Top of Funnel (Awareness)
| Metric | Source |
|--------|--------|
| Impressions | Meta, Google, TikTok |
| Reach (unique) | All paid platforms |
| Video views (3s, 15s, thruPlay) | Video ad platforms |
| Website sessions (new users) | GA4 |
| Social followers & growth rate | Platform analytics |
| Brand search volume | Google Trends / Search Console |
| CPM (cost per 1000 impressions) | Ad platforms |
| **Benchmark CPM**: $5-15 Meta, $8-25 TikTok, $20-60 Google Display |

### MOFU — Middle of Funnel (Consideration)
| Metric | Source |
|--------|--------|
| CTR (click-through rate) | Ad platforms |
| Landing page views | GA4 / pixel |
| Add-to-cart events | Pixel / Shopify |
| Email signups / lead captures | Klaviyo / forms |
| Product page views | GA4 |
| Content engagement (saves, shares) | Social platforms |
| Quiz completions (for DTC) | On-site |
| **Benchmark CTR**: 0.8-1.5% Meta, 2-5% Google Search |

### BOFU — Bottom of Funnel (Conversion)
| Metric | Source |
|--------|--------|
| Initiate checkout events | Pixel |
| Purchases / conversion rate | Shopify / GA4 |
| Revenue & AOV | Shopify |
| CAC by channel | Calculated |
| ROAS by channel | Calculated |
| Cart abandonment rate | Shopify |
| Post-purchase upsell conversion | Apps |
| **Benchmark CVR**: 1.5-3.5% for DTC ecommerce |

### Funnel Visualization Pattern
The standard funnel dashboard shows a **horizontal or vertical funnel graphic** with drop-off rates between each stage, plus a **conversion rate trend chart** showing week-over-week improvement. Key insight: the **drop-off between add-to-cart and purchase** is the highest-leverage area for most DTC brands.

---

## 3. Attribution Models

### Model Comparison

| Model | How It Works | Best For | Weakness |
|-------|-------------|----------|----------|
| **Last-Touch** | 100% credit to final click before purchase | Simple reporting | Ignores awareness channels |
| **First-Touch** | 100% credit to first interaction | Awareness channel valuation | Ignores conversion drivers |
| **Linear** | Equal credit to all touchpoints | Fair baseline | Doesn't weight intent |
| **Time-Decay** | More credit to recent touchpoints | Short sales cycles | Undervalues awareness |
| **U-Shaped (Position-Based)** | 40% first, 40% last, 20% middle | Balanced DTC view | Arbitrary weighting |
| **Data-Driven (MMM/ML)** | Machine learning assigns credit | Large spenders (>$50K/mo) | Needs 6+ months data |

### What's Popular Now (2025-2026)
1. **Triple Whale's "Triple Attribution"** — combines post-purchase surveys ("How did you hear about us?") with pixel data. Most popular among DTC brands spending $10K-$200K/mo.
2. **Northbeam's MMM (Marketing Mix Modeling)** — uses Bayesian statistics. Preferred by brands spending $100K+/mo across 4+ channels.
3. **Google's Data-Driven Attribution** — built into GA4. Free but less accurate for cross-device journeys.
4. **Post-purchase surveys** — simple "How did you hear about us?" survey. Surprisingly accurate for DTC. Often used alongside pixel-based attribution.
5. **Incrementality testing** — geo-based lift tests. Gold standard but expensive and slow.

### Recommendation for YVON (2 ventures, small team)
Use a **hybrid approach**: last-touch for channel-level reporting (simple, comparable), plus post-purchase survey data for understanding true discovery sources. Don't over-invest in attribution until monthly ad spend exceeds $30K combined.

---

## 4. Campaign Management Dashboard

### Layout Pattern (Industry Standard)
```
[Header: Date Range | Venture Selector | Channel Filter]

[Row 1: 4-6 KPI cards]
  Active Campaigns | Total Spend | Blended ROAS | NC-ROAS | Conversions | Revenue

[Row 2: Performance Chart]
  Line chart: Spend vs Revenue vs ROAS (daily trend)

[Row 3: Campaign Table]
  Campaign Name | Status | Spend | Impressions | Clicks | CTR | CPC | Purchases | ROAS | CPA

[Row 4: Creative Performance]
  Creative Name | Campaign | Spend | CTR | Thumb-Stop Rate | Hook Rate (3s video) | ROAS
```

### Key Features
- **Real-time or near-real-time** updates (15-min delay standard)
- **Status filters**: Active, Paused, Completed, Draft
- **Bulk actions**: Pause/activate multiple campaigns
- **Budget pacing**: Shows % of daily/monthly budget spent vs. time elapsed
- **Alert system**: Notify when ROAS drops below threshold or spend spikes
- **Creative fatigue indicators**: Declining CTR over time for same creative
- **A/B test results display**: Statistical significance indicators

### Campaign Status States
Draft → Scheduled → Active → Paused/Completed → Archived

---

## 5. Email Marketing Metrics

### Benchmarks (Mailchimp 2023 Data + Industry 2025 Estimates)

| Metric | Ecommerce Average | Top Quartile | Klaviyo DTC Avg |
|--------|-------------------|--------------|-----------------|
| **Open Rate** | 29.8% | 40%+ | 35-42% |
| **Click Rate** | 1.74% | 3.5%+ | 3.0-5.0% |
| **Click-to-Open Rate** | ~5.8% | 10%+ | 8-12% |
| **Unsubscribe Rate** | 0.19% | <0.1% | 0.05-0.15% |
| **Bounce Rate** | 0.3-1.0% | <0.5% | <0.3% |
| **Revenue per Recipient** | — | — | $0.05-0.15 per send |

*Note: Apple MPP (Mail Privacy Protection) inflates open rates since 2021. Click rate is now the more reliable engagement metric.*

### Flows/Automations to Track
| Flow | Open Rate | Revenue Contribution |
|------|-----------|---------------------|
| Welcome Series | 50-60% | 2-5% of total email revenue |
| Abandoned Cart | 40-50% | 20-30% of email revenue |
| Browse Abandonment | 35-45% | 5-10% |
| Post-Purchase | 40-55% | 5-10% |
| Win-Back | 20-30% | 3-8% |
| VIP/Loyalty | 45-55% | 10-20% |

### Dashboard Should Show
- Revenue attribution from email (as % of total)
- List health: growth rate, engagement segments (active, at-risk, inactive)
- Flow performance: each automation's conversion funnel
- Campaign calendar with send performance overlay
- Segment comparison: engaged vs. unengaged performance

---

## 6. Social Media Analytics Dashboards

### Sprout Social / Hootsuite Level Features
| Feature | Details |
|---------|---------|
| **Cross-platform overview** | Instagram, TikTok, Facebook, X, LinkedIn, Pinterest in one view |
| **Post performance grid** | Every post with impressions, engagement, saves, shares, link clicks |
| **Engagement rate** | (Likes + Comments + Saves) / Followers x 100 |
| **Follower growth chart** | Net new followers over time by platform |
| **Best time to post** | Heatmap showing engagement by day/hour |
| **Competitor benchmarking** | Side-by-side follower/engagement comparison |
| **Sentiment analysis** | AI-tagged positive/neutral/negative mentions |
| **Content type breakdown** | Photo vs. video vs. carousel vs. Stories performance |
| **Paid vs organic** | Separated metrics for boosted vs. native content |
| **Audience demographics** | Age, gender, location breakdown |

### Platform-Specific Metrics That Matter
- **Instagram**: Saves rate, Reel completion rate, Story tap-forward vs. tap-back rate
- **TikTok**: Hook rate (3-sec views / impressions), completion rate, share rate
- **Facebook**: Post reach (organic vs. paid), link click-through
- **X/Twitter**: Impressions, profile visits, link clicks

### Benchmarks (DTC Fashion/Fintech)
| Metric | Instagram | TikTok | Facebook |
|--------|-----------|--------|----------|
| Engagement Rate | 1-3% | 3-8% | 0.5-1.5% |
| Organic Reach (% of followers) | 5-15% | 50-200%+ | 2-8% |
| Best Post Frequency | 4-7/week | 1-3/day | 3-5/week |

---

## 7. Content Calendar / Planning Tools

### What Modern Content Calendars Look Like (Notion, Airtable, Monday.com Patterns)

#### Layout Pattern
```
[Calendar View]
  Month/Week toggle
  Each day shows: platform icons, post type, status badge

[Board/Kanban View]
  Columns: Idea → Draft → In Review → Scheduled → Published → Analyzed

[List/Table View]
  Title | Platform | Type | Status | Assignee | Due Date | Publish Date | Campaign | Performance Link
```

#### Essential Fields
| Field | Purpose |
|-------|---------|
| Content title | What the post/campaign is |
| Platform(s) | Where it goes (multi-select) |
| Content type | Photo, video, carousel, story, reel, email, blog |
| Status | Idea / Draft / Review / Approved / Scheduled / Published |
| Assignee | Who's responsible (Lena, Atlas, Pixel, etc.) |
| Due date | When creative is due |
| Publish date | When it goes live |
| Campaign | Which campaign it belongs to |
| Asset links | Links to images, copy docs, Canva/Figma files |
| Caption/copy | The actual text |
| Hashtags/keywords | SEO and discoverability |
| Approval chain | Who signs off before publish |
| Performance link | Post-publish: link to analytics |

#### Key Features
- **Drag-and-drop rescheduling** between dates
- **Approval workflows** (submit for review → approve/reject with comments)
- **Asset attachment** (images, videos directly in the calendar entry)
- **Template library** (repeatable post formats)
- **Platform preview** (see how the post will look before publishing)
- **Content pillars/tags** (filter by educational, promotional, UGC, etc.)
- **Automated publishing** (schedule and auto-post to platforms)
- **Recurrence** (repeating series, weekly features)

---

## 8. Brand Management / Brand Asset Management

### Dashboard Includes
| Section | Contents |
|---------|----------|
| **Asset Library** | Logos, fonts, color palettes, photography, templates — searchable, tagged, versioned |
| **Brand Guidelines** | Voice, tone, do's/don'ts, visual rules — living document |
| **Usage Tracking** | Which assets are used where, download counts, expiration alerts |
| **Version Control** | Asset history, who changed what, rollback capability |
| **Access Control** | Role-based permissions (internal team, freelancers, agencies) |
| **Approval Workflows** | Asset creation → review → approve → publish to library |
| **Compliance Checks** | Off-brand detection, logo misuse, color/typography violations |
| **License Management** | Stock photo licenses, expiration dates, usage rights |

### For 2 Ventures (Fashion + Fintech)
- **Venture-level separation**: Each brand has its own asset library, guidelines, and templates
- **Shared assets**: Company-level assets (YVON parent) available to both ventures
- **Brand switching**: Dropdown to switch between venture contexts
- **Cross-venture analytics**: Compare brand asset usage and content output between ventures

---

## 9. Creative Pipeline / Production Dashboard

### What It Tracks
```
[Pipeline Overview]
  Total Assets in Progress | Overdue | Completed This Week | Backlog

[Stage Funnel]
  Briefed → Concepting → In Production → Review → Approved → Live

[Team Workload]
  Person | Active Tasks | Capacity | Overdue Items

[Turnaround Metrics]
  Avg time per stage | Total cycle time | Bottleneck identification
```

### Key Metrics
| Metric | Definition | Target |
|--------|-----------|--------|
| **Cycle time** | Brief to live | 3-7 days for standard assets |
| **Throughput** | Assets completed per week | Track trend |
| **WIP (Work in Progress)** | Active items | Cap at team capacity |
| **Review turnaround** | Time in review stage | <24 hours ideal |
| **Revision rate** | % of assets that go back for revision | <30% |
| **Asset utilization** | % of created assets actually published | >70% |
| **Creative fatigue rate** | How quickly CTR declines on new ads | 7-14 days for paid social |

### For YVON's Team (Atlas, Pixel, Lena)
- **Atlas** manages the pipeline: briefs, art direction, quality gates
- **Pixel** handles production: batch generation, upscaling, format conversion
- **Lena** handles copy: captions, scripts, email copy
- Dashboard shows each person's queue, deadlines, and bottlenecks

---

## 10. Competitive Intelligence Dashboards

### What They Show
| Feature | Details |
|---------|---------|
| **Traffic estimates** | Monthly visits, traffic sources breakdown, top pages |
| **Ad library** | Active ads competitors are running (Meta Ad Library, TikTok) |
| **Social presence** | Follower counts, posting frequency, engagement rates |
| **Pricing monitoring** | Product prices, promotions, discount patterns |
| **SEO overlap** | Shared keywords, ranking changes, new keyword targets |
| **Email monitoring** | Sign up for competitor emails, catalog frequency, offers |
| **Product launches** | New SKU monitoring, collection drops |
| **Sentiment tracking** | Reviews, mentions, brand perception trends |
| **Market share estimates** | Relative traffic/engagement vs. category |

### Tools & Data Sources
- **SimilarWeb**: Traffic estimates, referral sources, audience overlap
- **Meta Ad Library** (free): All active Facebook/Instagram ads
- **TikTok Creative Center** (free): Top ads in category
- **SEMrush / Ahrefs**: SEO competitive analysis
- **Social Blade**: Social media growth tracking
- **Google Alerts / Mention**: Brand mention monitoring
- **Prisync / Competera**: Pricing intelligence

### For Fashion + Fintech
- Fashion: Track 5-10 rival brands on social, ad spend, new collection drops, pricing
- Fintech: Track competitor feature launches, pricing changes, content marketing, SEO positions
- Dashboard should show **side-by-side comparison** with alerts on significant changes

---

## Summary: What YVON Should Build

### Priority Order (for a small DTC brand)
1. **Unified KPI dashboard** (Section 1) — the foundation
2. **Channel performance view** (Sections 1-2) — where money goes and comes back
3. **Email metrics integration** (Section 5) — highest ROI channel for DTC
4. **Social analytics** (Section 6) — content effectiveness
5. **Content calendar** (Section 7) — operational workflow
6. **Creative pipeline** (Section 9) — production management
7. **Competitive intel** (Section 10) — market awareness
8. **Attribution modeling** (Section 3) — once spend justifies complexity
9. **Brand management** (Section 8) — scales with team size
10. **Campaign management** (Section 4) — ad platform UIs are usually sufficient below $50K/mo

### Architecture Notes
- All metrics should support **venture-level filtering** (fashion vs. fintech)
- **Date range selector** is universal — last 7d, 30d, 90d, custom
- **Comparison mode**: current period vs. previous period (WoW, MoM, YoY)
- **Export to PDF/CSV** for every report
- **Mobile-friendly** for on-the-go checks (especially social and email metrics)

---

*Sources: Shopify ecommerce metrics guide, Mailchimp email benchmarks (2023), Sprout Social analytics documentation, BigCommerce metrics guide, web research on Triple Whale, Northbeam, and industry DTC best practices.*
