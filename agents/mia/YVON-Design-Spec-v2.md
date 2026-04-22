# YVON 2.0 — Design Specification (Apple-Inspired)
**Direction:** Apple Design Language · **Version:** 2.0 · **Date:** April 2026

> YVON 2.0 is built on Apple's core philosophy: the interface retreats until it becomes invisible. Every screen is a controlled stage — the data is the product, and the chrome around it must earn its place or disappear. This is minimalism not as aesthetic preference, but as reverence for the information being presented.

---

## 0. Design Philosophy

| Old YVON Problem | YVON 2.0 Solution |
|---|---|
| Harsh red accent used everywhere | Single accent color — Apple Blue `#0071e3` — reserved exclusively for interactive elements |
| Overwhelming dashboards, everything visible at once | Cinematic section rhythm: dark sections for immersion, light sections for information |
| Inconsistent card/table/chart styles | One unified component language — no borders on cards, contrast-based elevation |
| Poor mobile/responsiveness | Apple-standard breakpoints, touch targets, proportional typography scaling |
| Dense nav cluttered with too many items | Glass navigation bar, 6 items max, floats above content at all times |

**Core principles:**
1. **The data is the product.** Every UI element is set dressing, not the main event.
2. **Optical precision.** Typography is not arbitrary — letterforms, spacing, and weight are engineered per size context.
3. **Singular accent.** Apple Blue is the only chromatic color in the interface. Its rarity makes it unmissable.
4. **Cinematic rhythm.** Screens alternate between black immersive panels and light informational panels. Each section is a scene.
5. **Shadow is a luxury.** One soft diffused shadow or nothing. Elevation comes from background contrast.

---

## 1. Design Tokens

### 1.1 Color

#### Section Backgrounds (the "scene" system)
```
--bg-dark:          #000000   /* Immersive / hero sections — black canvas */
--bg-light:         #f5f5f7   /* Informational sections — Apple light gray */
--bg-white:         #ffffff   /* Pure white, used sparingly for contrast */
--bg-dark-surface-1: #272729  /* Cards on dark sections */
--bg-dark-surface-2: #262628  /* Subtle surface variation */
--bg-dark-surface-3: #28282a  /* Elevated cards on dark */
--bg-dark-surface-4: #2a2a2d  /* Highest dark elevation */
--bg-dark-surface-5: #242426  /* Deepest dark tone */
```

> **Dashboard application:** The sidebar and top-level layout live on `--bg-dark`. Individual screen content panels alternate: Command Center on dark, Analytics on light, Inbox on dark, Content on light, etc. This alternation creates the Apple "scene" rhythm across the app.

#### Text
```
--text-on-dark:       #ffffff              /* Primary text on black backgrounds */
--text-on-light:      #1d1d1f             /* Primary text on light gray backgrounds */
--text-secondary-dark: rgba(255,255,255,0.72)  /* Secondary text on dark */
--text-secondary-light: rgba(0,0,0,0.80)       /* Secondary text on light */
--text-tertiary:       rgba(0,0,0,0.48)        /* Disabled, fine print (light bg) */
--text-tertiary-dark:  rgba(255,255,255,0.40)  /* Disabled states (dark bg) */
```

#### Interactive — The Only Accent
```
--accent-blue:         #0071e3   /* Primary CTAs, focus rings, active states */
--accent-blue-dark-bg: #2997ff   /* Links/accents on dark backgrounds — higher luminance */
--accent-blue-link:    #0066cc   /* Inline text links on light backgrounds */
--accent-blue-hover:   #0077ed   /* Hover state brightening */
```

> **Rule:** Apple Blue is the ONLY chromatic color in YVON. No violet, no green, no amber for UI chrome. Those colors appear ONLY in data visualization (charts, graphs) and semantic status indicators — never as UI accent colors.

#### Semantic — Data & Status Only
```
--data-green:   #34c759   /* Positive delta, growth metrics */
--data-red:     #ff3b30   /* Negative delta, alert states */
--data-yellow:  #ff9f0a   /* Warning, watch states */
--data-blue:    #007aff   /* Info, neutral data */
--data-purple:  #af52de   /* Secondary data series */
--data-teal:    #5ac8fa   /* Tertiary data series */
```

> These are Apple's system colors — familiar, accessible, and never confused with the UI accent because `--accent-blue` is distinct from `--data-blue`.

#### Button & Control States
```
--btn-active-light:  #ededf2              /* Pressed state for light buttons */
--btn-bg-filter:     #fafafc              /* Filter/search button backgrounds */
--overlay:           rgba(210,210,215,0.64) /* Media controls, scrims */
--nav-bg:            rgba(0,0,0,0.80)    /* Navigation glass background */
--white-hover:       rgba(255,255,255,0.32) /* Hover on dark surfaces */
```

#### Shadow
```
--shadow-card:   rgba(0,0,0,0.22) 3px 5px 30px 0px  /* The only shadow in the system */
--shadow-focus:  0 0 0 3px rgba(0,113,227,0.40)      /* Accessibility focus ring */
```

> There are exactly **two shadow values** in YVON. Everything else uses background contrast for elevation.

---

### 1.2 Typography

**Font family:** `SF Pro Display` (20px and above) · `SF Pro Text` (19px and below)

Web fallbacks: `"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif`

> SF Pro is available on Apple devices natively. For cross-platform rendering, use `-apple-system, BlinkMacSystemFont` as the CSS font-family — this resolves to SF Pro on Apple, and Segoe UI / Roboto on Windows / Android respectively.

#### Type Scale

| Role | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| Display Hero | SF Pro Display | 56px / 3.5rem | 600 | 1.07 | -0.28px | Page hero headlines |
| Section Heading | SF Pro Display | 40px / 2.5rem | 600 | 1.10 | 0px | Major section titles |
| Tile Heading | SF Pro Display | 28px / 1.75rem | 400 | 1.14 | +0.196px | KPI tile labels |
| Card Title Bold | SF Pro Display | 21px / 1.31rem | 700 | 1.19 | +0.231px | Card headlines (emphasis) |
| Card Title | SF Pro Display | 21px / 1.31rem | 400 | 1.19 | +0.231px | Card subheadings |
| Nav Heading | SF Pro Text | 34px / 2.13rem | 600 | 1.47 | -0.374px | Mobile drawer nav headings |
| Body | SF Pro Text | 17px / 1.06rem | 400 | 1.47 | -0.374px | Standard reading text |
| Body Emphasis | SF Pro Text | 17px / 1.06rem | 600 | 1.24 | -0.374px | Labels, emphasized body |
| Button Large | SF Pro Text | 18px / 1.13rem | 300 | 1.00 | 0px | Large pill CTA text |
| Button | SF Pro Text | 17px / 1.06rem | 400 | 2.41 | 0px | Standard button text |
| Link / Caption | SF Pro Text | 14px / 0.88rem | 400 | 1.43 | -0.224px | "Learn more", table captions |
| Caption Bold | SF Pro Text | 14px / 0.88rem | 600 | 1.29 | -0.224px | Emphasized captions |
| Micro | SF Pro Text | 12px / 0.75rem | 400 | 1.33 | -0.12px | Fine print, footnotes |
| Nano | SF Pro Text | 10px / 0.63rem | 400 | 1.47 | -0.08px | Legal, smallest labels |

**Data / metric values:** Use `SF Pro Display` at display sizes, `SF Mono` (or `"Courier New"`) for fixed-width numerical data in tables.

#### Typography Rules
- **Optical sizing boundary is absolute:** SF Pro Display at 20px+, SF Pro Text at 19px and below. Never invert this.
- **Negative tracking at every size:** Apple applies letter-spacing tightening even at body copy. This is the most distinctive typographic characteristic to enforce.
- **Weight restraint:** Most text lives at 400 and 600. Weight 700 only for `Card Title Bold`. Weight 300 only for `Button Large`. Never 800 or 900.
- **Headline line-heights are extremely tight:** 1.07–1.14 for display sizes. This creates the "billboard" compression Apple is known for.
- **Body text is left-aligned.** Only display headlines center-align.

---

### 1.3 Spacing Scale

Base unit: **8px**

```
--space-1:   2px
--space-2:   4px
--space-3:   5px
--space-4:   6px
--space-5:   7px
--space-6:   8px    ← base unit
--space-7:   9px
--space-8:  10px
--space-9:  11px
--space-10: 14px
--space-11: 15px
--space-12: 17px
--space-14: 20px
--space-16: 24px
```

> Apple's spacing scale is deliberately dense at small sizes (1px increments from 2–11px) to allow precise micro-adjustment of typography and icon alignment, then steps up more conventionally. Use multiples of 8px for layout-level spacing (section padding, grid gaps).

**Layout conventions:**
- Page section padding (vertical): 80px top/bottom on desktop, 48px on mobile
- Content max-width: 980px (centered)
- Page edge padding: 24px desktop, 16px mobile
- Card internal padding: 20px desktop, 16px mobile
- Grid gap: 16px standard, 24px for major panels

---

### 1.4 Border Radius Scale

```
--radius-micro:   5px      /* Small containers, tag pills, link chips */
--radius-std:     8px      /* Buttons, cards, image containers */
--radius-input:  11px      /* Search inputs, filter controls */
--radius-panel:  12px      /* Feature panels, lifestyle image containers */
--radius-pill:   980px     /* CTA links — "Learn more", "View", pill buttons */
--radius-circle: 50%       /* Media controls, avatar initials circles */
```

---

### 1.5 Elevation System

Apple uses **background contrast over shadows** for all UI elements. The translucent navigation is the only "floating" element.

| Level | Treatment | Where |
|---|---|---|
| **Flat** | Solid background, no shadow | All content sections |
| **Dark Surface** | `--bg-dark-surface-1` to `5` — progressively lighter dark cards | Cards/panels within dark sections |
| **Light Surface** | `--bg-white` card on `--bg-light` section | Cards in light sections |
| **Floating (Card)** | `--shadow-card` shadow | Only product/data highlight cards |
| **Navigation Glass** | `backdrop-filter: saturate(180%) blur(20px)` on `--nav-bg` | The nav bar — always |
| **Focus** | `--shadow-focus` — 3px blue ring | All interactive elements (keyboard nav) |

---

### 1.6 Motion

```
--duration-instant: 80ms
--duration-fast:   160ms
--duration-base:   240ms
--duration-slow:   400ms
--ease-apple:      cubic-bezier(0.25, 0.46, 0.45, 0.94)  /* Apple's signature ease */
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1.00)  /* Subtle spring for reveals */
```

**Rules:**
- Hover state color changes: `--duration-instant` (80ms)
- Page tab/section switches: `--duration-fast` (160ms) opacity fade
- Drawers, modals, mobile menu: `--duration-base` (240ms) slide + fade
- Hero section parallax: `--duration-slow` (400ms)
- Always respect `prefers-reduced-motion` — disable non-essential transitions

---

## 2. Navigation

### 2.1 Structure

YVON uses **Apple's floating glass navigation bar** adapted as a top bar (not a sidebar). On desktop, this is a fixed top nav. On mobile, it collapses to a hamburger overlay.

**Why top nav over sidebar:** Apple's system works on full-viewport-width sections. A sidebar competes with the cinematic full-width layouts. A top bar floats above them without interrupting the content stage.

```
┌──────────────────────────────────────────────────────────────────┐
│  [YVON logo]  Command  Analytics  Content  Market  Team  Inbox●  │  ← glass nav, 48px, fixed top
└──────────────────────────────────────────────────────────────────┘
```

**Nav styling:**
- Background: `rgba(0,0,0,0.80)` with `backdrop-filter: saturate(180%) blur(20px)`
- Height: 48px
- Text: SF Pro Text 12px, weight 400, `#ffffff`
- Active item: `#ffffff` with underline
- Hover: opacity 0.7 → 1.0 transition
- Inbox item: unread dot badge in `--accent-blue`
- Logo: YVON wordmark, left-aligned

**Max 6 nav items:**
```
Command · Analytics · Content · Market · Team · Inbox
```

### 2.2 Mobile Navigation

On mobile (<768px), the full nav collapses. A persistent top bar shows only logo + hamburger + inbox bell.

Tapping hamburger opens a **full-screen overlay drawer:**
- Background: `#000000`
- Nav items stacked vertically, SF Pro Text 34px weight 600, `#ffffff`
- Sub-items at 24px weight 300 below each primary item
- Close button top-right, backdrop tap closes

### 2.3 Active Venture Switcher

Lives as a subtle pill in the nav (right side, before inbox):
- Format: `[BrandName ▾]` — SF Pro Text 12px, `rgba(255,255,255,0.72)`
- Click: dropdown of ventures (dark surface card, `--shadow-card`)

---

## 3. Screen Specifications

> **Global layout rule:** Every screen is a full-viewport-width stage below the 48px navigation. Content sections alternate between `--bg-dark` and `--bg-light` backgrounds. Max content width: 980px, horizontally centered within the viewport.

---

### 3.1 Command Center (`/ceo`)

**Scene:** Dark. The founder's morning briefing — cinematic, focused, actionable.

#### Section Structure (vertical scroll, each section near full viewport height)

```
┌──────────────────────────────────────────────────────┐
│  SECTION 1 — bg-dark                                 │
│                                                      │
│   COMMAND CENTER                  (56px Display 600) │
│   Daily briefing · April 19       (17px Text 400)    │
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │  MARCUS BRIEFING                            │   │
│   │  "Today's priority: Campaign Studio..."     │   │  ← dark-surface-1 card
│   │  ─────────────────────────────────────────  │   │
│   │  · Action item 1    [View →]                │   │
│   │  · Action item 2    [View →]                │   │
│   │  · Action item 3    [View →]                │   │
│   └─────────────────────────────────────────────┘   │
│                                                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │ ANOMALY  │  │ ANOMALY  │  │ ANOMALY  │         │  ← max 3 alert cards
│   └──────────┘  └──────────┘  └──────────┘         │
│                                                      │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  SECTION 2 — bg-light                               │
│                                                      │
│   KPI GRID (2 rows × 3 columns)                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │CEO Score │  │Tasks Done│  │Brand Hlth│         │  ← white cards on #f5f5f7
│   └──────────┘  └──────────┘  └──────────┘         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│   │Com. Reach│  │Bln. CAC  │  │Bln. ROAS │         │
│   └──────────┘  └──────────┘  └──────────┘         │
│                                                      │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  SECTION 3 — bg-dark                                 │
│                                                      │
│   WEEKLY WORKLOAD                (40px Display 600)  │
│   [7-day heatmap grid]                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Component Details

**Marcus Briefing Card:**
- Background: `--bg-dark-surface-1` (`#272729`)
- Border: none
- Shadow: `--shadow-card`
- Title: SF Pro Display 21px weight 700, white
- Body: SF Pro Text 17px weight 400, `rgba(255,255,255,0.72)`
- Action items: each a row with SF Pro Text 17px + pill link button (Apple Blue, 980px radius)
- "Read full briefing" collapses extended text — `--accent-blue-dark-bg` link

**Anomaly Cards (max 3):**
- Background: `--bg-dark-surface-3`
- Left strip: 3px solid `--data-red` for danger anomalies, `--data-yellow` for warnings
- Metric name: SF Pro Text 14px weight 600, white
- Deviation: SF Pro Display 28px weight 400, `--data-red` or `--data-yellow`
- "View source" link: `--accent-blue-dark-bg`, 14px, pill shape

**KPI Tiles (Section 2 — light background):**
- Background: `#ffffff` (white card on `--bg-light`)
- Shadow: `--shadow-card`
- Border-radius: `--radius-std` (8px)
- Label: SF Pro Text 12px weight 400, `rgba(0,0,0,0.48)`, uppercase, letter-spacing 0.06em
- Value: SF Pro Display 40px weight 600, `#1d1d1f`, line-height 1.10
- Delta: SF Pro Text 14px, `--data-green` (↑) or `--data-red` (↓)
- Comparison text: SF Pro Text 12px, `rgba(0,0,0,0.48)`

**Workload Heatmap (Section 3 — dark):**
- 7 columns (days) × N rows (agents)
- Each cell: 32px circle, color = occupancy level
  - Empty: `--bg-dark-surface-1`
  - Low: `rgba(0,113,227,0.25)` (blue tint)
  - Medium: `rgba(0,113,227,0.55)`
  - Full: `#0071e3`
- Agent name labels: SF Pro Text 12px, `rgba(255,255,255,0.72)`, left-aligned
- Day labels: SF Pro Text 10px, `rgba(255,255,255,0.48)`, centered above columns

---

### 3.2 Analytics Hub (`/analytical`)

**Scene:** Light. Data-dense but open. Analysis mode.

```
┌──────────────────────────────────────────────────────┐
│  SECTION 1 — bg-light                               │
│                                                      │
│   ANALYTICS HUB             (56px Display 600, dark) │
│   [IG] [LI] [TT] [Overview]   ← pill tab bar       │
│                                                      │
│   ┌─────────────────────────┐  ┌───────────────┐   │
│   │  TREND CHART            │  │ INTEL PANEL   │   │
│   │  (primary metric, time  │  │ Kai + Nate    │   │
│   │   picker: 7D/30D/90D)   │  │ synthesis     │   │
│   └─────────────────────────┘  └───────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  SECTION 2 — bg-dark                                 │
│                                                      │
│   TOP POSTS               (40px Display 600, white)  │
│   [Data table — dark surface cards per row]         │
│                                                      │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  SECTION 3 — bg-light                               │
│                                                      │
│   CORRELATION ENGINE  (top 3 rows, expand for more) │
│   COMPETITOR INTEL    (collapsible accordion)        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Platform Tab Bar:**
- Style: pill-shaped tabs, 980px border-radius
- Inactive: background `#fafafc`, text `rgba(0,0,0,0.80)`, border `3px solid rgba(0,0,0,0.04)`
- Active: background `--accent-blue`, text `#ffffff`
- Switching tabs filters the entire page — all charts, tables, and intel update

**Trend Chart:**
- Chart background: `#ffffff`, border-radius 8px, shadow `--shadow-card`
- Chart line: `--accent-blue` (primary), `--data-green` (secondary if needed)
- Grid lines: `rgba(0,0,0,0.06)`, horizontal only
- Axis labels: SF Pro Text 12px, `rgba(0,0,0,0.48)`
- Tooltip: dark surface card (`--bg-dark-surface-1`), white text, shadow

**Top Posts Table (dark section):**
- Row background: transparent; hover: `--bg-dark-surface-1`
- Row border-bottom: `1px solid rgba(255,255,255,0.08)`
- Row height: 52px (comfortable touch target)
- Rank: SF Pro Display 21px, `rgba(255,255,255,0.40)`
- Post preview: 40px×40px rounded thumbnail
- Score pill: `--accent-blue` background, white SF Pro Text 12px weight 600
- Delta cell: SF Mono 14px, `--data-green` or `--data-red`

---

### 3.3 CEO Inbox (`/inbox`)

**Scene:** Dark. Quiet, focused reading environment.

```
┌──────────────────────────────────────────────────────┐
│  SECTION 1 — bg-dark                                 │
│                                                      │
│   INBOX                        [Mark all read]       │
│   [All] [Briefings] [Pulse] [Alerts]  ← pill filters│
│                                                      │
│   (Desktop: split view — 360px list + detail panel) │
│   ┌──────────────────┐  ┌─────────────────────────┐ │
│   │ ● Daily Briefing │  │  Daily Briefing          │ │
│   │   Apr 19, 7:00AM │  │  April 19, 2026 · 7:00AM│ │
│   │                  │  │  ─────────────────────── │ │
│   │   Pulse Report   │  │  Marcus's synthesis...   │ │
│   │   Week 16        │  │  [full report body]      │ │
│   └──────────────────┘  └─────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Inbox List:**
- Each row: 72px height, border-bottom `1px solid rgba(255,255,255,0.08)`
- Hover: `--bg-dark-surface-1` background
- Unread dot: 6px circle, `--accent-blue`, left edge
- Title: SF Pro Text 17px weight 600, white (unread) / `rgba(255,255,255,0.72)` (read)
- Timestamp: SF Pro Text 12px, `rgba(255,255,255,0.40)`
- Preview snippet: SF Pro Text 14px, `rgba(255,255,255,0.48)`, 1 line truncated

**Detail Panel:**
- Background: `--bg-dark-surface-1`
- Title: SF Pro Display 28px weight 400, white
- Body: SF Pro Text 17px weight 400, line-height 1.47, `rgba(255,255,255,0.80)`
- Action buttons (if report has decisions): pill CTAs in `--accent-blue-dark-bg`

**Pill Filter Tabs:**
- Same as Analytics tab bar — inactive/active pill styling

---

### 3.4 Content Hub (`/content`)

Three tabs: **Brand Pulse · Trending · Campaign Studio**

**Scene alternates per tab:**
- Brand Pulse: Light
- Trending: Dark
- Campaign Studio: Light

---

#### Tab 1 — Brand Pulse (Light)

```
┌──────────────────────────────────────────────────────┐
│  SECTION 1 — bg-light                               │
│                                                      │
│   BRAND PULSE              (56px Display 600, dark)  │
│                                                      │
│   ┌────────────────┐  ┌────────────┐  ┌──────────┐ │
│   │ CONTENT SCORER │  │  ANOMALY   │  │ REVENUE  │ │
│   │ Top 5 posts    │  │  3 alerts  │  │ ATTRIB.  │ │
│   │ ranked table   │  │            │  │  MAP     │ │
│   └────────────────┘  └────────────┘  └──────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- **Content Scorer:** White card on `--bg-light`, shadow. Table: 5 rows, score shown as horizontal bar (0–100px width, `--accent-blue` fill) + number in SF Mono.
- **Anomaly Alerts:** White card, left border 3px `--data-red` or `--data-yellow` per severity.
- **Revenue Attribution Map:** 3 nodes (Post → UTM → Purchase) connected by lines. Node circles: 40px, `--bg-dark-surface-1`. Labels: SF Pro Text 12px. Connector lines: `rgba(0,0,0,0.12)`.

---

#### Tab 2 — Trending Pipeline (Dark)

```
┌──────────────────────────────────────────────────────┐
│  TRENDING PIPELINE          (56px Display 600, white) │
│  [New] [Used] [Archived]     Platform: [IG][YT][LI]  │
│                                                      │
│  ┌────────────────────────┐  ┌────────────────────┐ │
│  │  TOPIC CARD            │  │  TOPIC CARD        │ │
│  │  "Founder Morning...   │  │  "Silent B-roll... │ │
│  │  Hook: "You don't..."  │  │  Hook: "No music.. │ │
│  │  Format: Talking head  │  │  Format: B-roll    │ │
│  │  [Use It]              │  │  [Use It]          │ │
│  └────────────────────────┘  └────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- **Topic Cards:** Background `--bg-dark-surface-1`, shadow `--shadow-card`
- Topic name: SF Pro Display 21px weight 400, white
- Hook: SF Pro Text 17px, `rgba(255,255,255,0.72)`, italic
- Format badge: pill `--radius-pill`, background `rgba(255,255,255,0.10)`, white text 12px
- "Use It" button: `--accent-blue`, 8px radius, SF Pro Text 17px

---

#### Tab 3 — Campaign Studio (Light)

**Horizontal stepper at top of page (below nav):**
```
① Brief ──── ② Ideas ──── ③ Scripts ──── ④ Captions ──── ⑤ Prompts ──── ⑥ Assets
```
- Stepper background: `#ffffff`, border-bottom `1px solid rgba(0,0,0,0.08)`, height 56px
- Completed step: `--accent-blue` circle with white checkmark
- Active step: `--accent-blue` filled circle, SF Pro Text 14px weight 600
- Inactive step: `rgba(0,0,0,0.24)` circle, SF Pro Text 14px weight 400
- Connector line: 1px `rgba(0,0,0,0.12)` between steps

**Stage content area (below stepper):**
- Background: `--bg-light`
- Stage 1 (Brief): Clean form layout, 980px max-width centered. Field labels: SF Pro Text 14px weight 600, `#1d1d1f`. Inputs: 11px radius, 3px border `rgba(0,0,0,0.04)`, focus: `--shadow-focus`. "Generate →" button: Primary Blue pill.
- Stages 2–5: Vertical list of generated items. Each item: white card, shadow `--shadow-card`, 8px radius. Select/reject: checkmark and X buttons visible on hover, top-right corner. "Continue →" at bottom: Primary Blue pill, full-width on mobile.
- Stage 6: Copy-ready prompt in a white card with monospace font. "Copy" button (pill, outline style). "Open in Krea AI →" (filled blue pill).

---

### 3.5 Market Radar (`/market-radar`)

**Scene:** Dark (data-immersive, competitive intelligence).

```
┌──────────────────────────────────────────────────────┐
│  SECTION 1 — bg-dark                                 │
│                                                      │
│   MARKET RADAR             (56px Display 600, white) │
│   Venture: [YVON ▾]                                  │
│                                                      │
│   ┌─────────────────────────┐  ┌───────────────────┐│
│   │  COMPETITOR SCORECARD   │  │   BUBBLE CHART    ││
│   │  5 rows, signal score   │  │   Eng × Reach     ││
│   │  mini-bar per rival     │  │   Click = drawer  ││
│   └─────────────────────────┘  └───────────────────┘│
│                                                      │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  SECTION 2 — bg-light                               │
│                                                      │
│   TERRITORY SCOUT          (40px Display 600, dark)  │
│                                                      │
│   ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│   │UNCLAIMED │  │TRENDING  │  │SATURATED       │   │  ← cluster cards, white on --bg-light
│   │ cluster  │  │ cluster  │  │ cluster        │   │
│   └──────────┘  └──────────┘  └────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Scorecard (dark section):**
- Dark surface card, shadow
- Row hover: `--bg-dark-surface-2`
- Signal score: horizontal bar (0–100), `--data-green` fill if high, `--data-yellow` if mid, `--data-red` if low
- Competitor name: SF Pro Display 21px weight 400, white
- Score number: SF Mono 17px, `rgba(255,255,255,0.72)`

**Bubble Chart:**
- Background: `--bg-dark-surface-1`, 8px radius, shadow
- Bubbles: colored by data series (uses data palette)
- Click → detail drawer slides from right (480px, dark surface)
- Axes labels: SF Pro Text 12px, `rgba(255,255,255,0.40)`

**Territory Scout Cards (light section):**
- White cards on `--bg-light`, shadow `--shadow-card`
- "Unclaimed" badge: `--data-green` text, green tint pill background
- "Trending" badge: `--data-yellow` text, amber tint pill
- "Saturated" badge: `--data-red` text, red tint pill
- Card body: SF Pro Text 17px, `#1d1d1f`
- Cluster keywords: compact pill tags, `--radius-micro`, `rgba(0,0,0,0.06)` bg

---

### 3.6 Team (`/team`)

Three internal tabs: **Roster · Tasks · War Room**

**Scene:** Alternates — Roster: light, Tasks: dark, War Room: dark.

---

#### Tab 1 — Roster (Light)

```
┌──────────────────────────────────────────────────────┐
│  THE TEAM                   (56px Display 600, dark)  │
│  Command Layer · Build Layer · Grow Layer             │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  MARCUS  │  │   DEV    │  │   LENA   │          │  ← white cards on --bg-light
│  │  👑 CEO  │  │  💻 Lead │  │  ✍️ Brand│          │
│  │  [Opus]  │  │ [Sonnet] │  │ [Haiku]  │          │
│  │  Chat →  │  │  Chat →  │  │  Chat →  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└──────────────────────────────────────────────────────┘
```

**Agent Card:**
- Background: `#ffffff`, shadow `--shadow-card`, 8px radius
- Initials circle: 40px, `--accent-blue` background (Opus), `--bg-dark-surface-1` (Sonnet), `rgba(0,0,0,0.06)` (Haiku)
- Name: SF Pro Display 21px weight 400, `#1d1d1f`
- Role label: SF Pro Text 12px, `rgba(0,0,0,0.48)`, uppercase
- Model badge: pill, 5px radius — Opus: blue tint, Sonnet: light gray, Haiku: light teal tint
- "Chat →" link: `--accent-blue-link`, 14px, pill shape with 980px radius — signature Apple "Learn more" style

---

#### Tab 2 — Tasks / Ship Protocol (Dark)

```
┌──────────────────────────────────────────────────────┐
│  SHIP PROTOCOL                                       │
│  [All] [In Flight] [Scoped] [Shipped] ← pill filters │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ● IN FLIGHT                                 │   │  ← highlighted dark-surface-2
│  │  Campaign Studio Redesign · Mia · High       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  BACKLOG                                            │
│  · Task name · Agent · Priority badge · Status pill  │
│  · Task name · Agent · Priority badge · Status pill  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Active task card: `--bg-dark-surface-2`, left border 3px `--accent-blue`, shadow
- Priority badges: pill shape — High: `--data-red` tint, Med: `--data-yellow` tint, Low: `rgba(255,255,255,0.10)`
- Backlog rows: 52px height, border-bottom `rgba(255,255,255,0.08)`, hover `--bg-dark-surface-1`

---

#### Tab 3 — War Room (Dark)

```
┌──────────────────────────────────────────────────────┐
│  WAR ROOM                   (56px Display 600, white) │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  [Enter your challenge...              Send →]│   │  ← dark surface input, blue send btn
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Routed to: [Kai] [Nate]                     │   │
│  │  ──────────────────────────────────────────  │   │
│  │  Kai:  [response text]                       │   │
│  │  Nate: [response text]                       │   │
│  │  ──────────────────────────────────────────  │   │
│  │  MARCUS SYNTHESIS:                           │   │
│  │  [final recommendation]                      │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

- Input: `--bg-dark-surface-1`, 11px radius, white placeholder text, focus ring `--shadow-focus`
- "Send →" button: Primary Blue pill, 980px radius, SF Pro Text 17px
- Agent label chips: `rgba(0,113,227,0.20)` bg, `--accent-blue-dark-bg` text, 5px radius
- Response card: `--bg-dark-surface-2`, shadow, 8px radius
- Marcus Synthesis: separated by full-width `rgba(255,255,255,0.08)` divider, title SF Pro Display 21px weight 700

---

### 3.7 Settings (`/settings`)

**Scene:** Light. Administrative, calm, functional.

Sub-nav: `Ventures · Agents` — pill tab bar, same style as Analytics

**Ventures list:**
- White card per venture, shadow, 8px radius
- Venture name: SF Pro Display 21px weight 400, `#1d1d1f`
- Type badge: pill, `rgba(0,0,0,0.06)` bg
- "Edit" link: `--accent-blue-link`, 14px, appears on row hover
- "Add Venture" button: Primary Blue, full pill, top-right of section

**Edit Drawer (480px from right):**
- Background: `#ffffff`, shadow `--shadow-card`
- Fields: SF Pro Text 17px inputs, 11px radius, `rgba(0,0,0,0.04)` border at 3px, focus ring blue
- Auto-save on blur — no manual save button (Apple-style implied persistence)
- Drawer header: SF Pro Display 28px weight 400, `#1d1d1f`

---

## 4. Component Library

### 4.1 Card (Light Context)

```
background:     #ffffff
border:         none
border-radius:  8px  (--radius-std)
padding:        20px
shadow:         --shadow-card
hover:          no transform — internal links respond to hover, not the card
```

### 4.2 Card (Dark Context)

```
background:     --bg-dark-surface-1 (#272729)
border:         none
border-radius:  8px
padding:        20px
shadow:         --shadow-card
hover:          background transitions to --bg-dark-surface-2 (100ms)
```

### 4.3 KPI Tile

```
┌─────────────────────────┐
│  REVENUE REACH   ↑ 12%  │   ← 12px uppercase label + delta (top row)
│                         │
│  42.8K                  │   ← 40px Display 600 value
│  vs 38.1K last period   │   ← 12px secondary comparison
└─────────────────────────┘
```

- Light context: white card, `#1d1d1f` value text
- Dark context: `--bg-dark-surface-1` card, white value text
- Delta `↑`: `--data-green` · Delta `↓`: `--data-red`
- Click → detail drawer

### 4.4 Data Table

```
thead
  background:    transparent (or --bg-light / --bg-dark-surface-2 for dark)
  text:          SF Pro Text 12px, uppercase, letter-spacing 0.06em
  color:         rgba(0,0,0,0.48) on light / rgba(255,255,255,0.40) on dark
  border-bottom: 1px solid rgba(0,0,0,0.12) on light / rgba(255,255,255,0.08) on dark

tbody rows
  height:        52px (desktop), 56px (mobile)
  border-bottom: 1px solid matching thead separator
  hover:         background tint — rgba(0,0,0,0.03) on light / --bg-dark-surface-1 on dark

No zebra striping. No visible outer border on the table.
```

### 4.5 Button

**Primary Blue (CTA):**
```
background:     #0071e3
text:           #ffffff, SF Pro Text 17px weight 400
padding:        8px 15px
border-radius:  8px (or 980px for pill variant)
border:         1px solid transparent
hover:          background #0077ed
active:         background shifts, scale(0.98)
focus:          2px solid #0071e3 outline, 2px offset
```

**Primary Dark:**
```
background:     #1d1d1f
text:           #ffffff
(same sizing as Primary Blue)
```

**Pill Link (Apple "Learn more" / "View"):**
```
background:     transparent
text:           #0066cc (light bg) or #2997ff (dark bg)
border:         1px solid currentColor
border-radius:  980px
padding:        8px 15px
font:           SF Pro Text 17px weight 400
hover:          text-decoration underline
```

**Filter Pill (inactive tab / search):**
```
background:     #fafafc
text:           rgba(0,0,0,0.80), 12px-14px
border:         3px solid rgba(0,0,0,0.04)
border-radius:  11px
padding:        0px 14px, height 32px
focus:          --shadow-focus
```

**Active Filter Pill:**
```
background:     #0071e3
text:           #ffffff
border:         none
```

**Ghost / Danger:** Same as Section 4.4 in spec v1 — minimally used. Apple rarely uses danger-styled buttons; instead it uses confirmation dialogs for destructive actions.

### 4.6 Badge / Tag

```
border-radius:  5px (--radius-micro) for rectangular tags
                980px (--radius-pill) for status pills
padding:        2px 8px
font:           SF Pro Text 12px weight 400

Light bg badges:
  Neutral:  rgba(0,0,0,0.06) bg, rgba(0,0,0,0.80) text
  Success:  rgba(52,199,89,0.12) bg, #1a7a36 text
  Warning:  rgba(255,159,10,0.12) bg, #8a5600 text
  Danger:   rgba(255,59,48,0.12) bg, #8a1200 text
  Info:     rgba(0,113,227,0.12) bg, #0057b3 text

Dark bg badges:
  Neutral:  rgba(255,255,255,0.12) bg, rgba(255,255,255,0.72) text
  Success:  rgba(52,199,89,0.20) bg, #34c759 text
  Warning:  rgba(255,159,10,0.20) bg, #ff9f0a text
  Danger:   rgba(255,59,48,0.20) bg, #ff453a text
  Info:     rgba(0,113,227,0.20) bg, #2997ff text
```

### 4.7 Input / Form Field

```
background:     #fafafc (light context)
border:         3px solid rgba(0,0,0,0.04)
border-radius:  11px (--radius-input)
padding:        8px 14px
font:           SF Pro Text 17px weight 400, #1d1d1f
placeholder:    rgba(0,0,0,0.40)
focus border:   3px solid #0071e3
focus shadow:   --shadow-focus
height:         44px (single line — meets touch target minimum)
```

### 4.8 Drawer

```
width:          480px (desktop), 100% (mobile)
background:     #ffffff (light drawers) or --bg-dark-surface-1 (dark drawers)
shadow:         0 8px 64px rgba(0,0,0,0.30)
animation:      slide from right, 240ms --ease-apple
backdrop:       rgba(0,0,0,0.30), click to close
header:         SF Pro Display 28px weight 400, 24px padding, border-bottom
body:           24px padding, scrollable
```

### 4.9 Empty States

```
Icon:           Lucide icon, 36px, rgba(0,0,0,0.24) on light / rgba(255,255,255,0.24) on dark
Heading:        SF Pro Display 21px weight 400
Body:           SF Pro Text 17px, secondary text color
CTA:            Primary Blue pill button
Centered:       vertically and horizontally within the container
```

### 4.10 Loading / Skeleton

```
Skeleton color:     rgba(0,0,0,0.06) on light / rgba(255,255,255,0.06) on dark
Shimmer animation:  linear-gradient sweep, 1.5s ease-in-out infinite
border-radius:      match the element being loaded
Never:              show spinners in content areas (Apple never uses spinners for content loads)
```

### 4.11 Toast / Notification

```
Position:       bottom-center (not bottom-right — Apple centers toasts)
Width:          auto, max 360px
Background:     rgba(0,0,0,0.85) with blur — the glass treatment
Text:           SF Pro Text 14px, white
Border-radius:  11px
Shadow:         --shadow-card
Duration:       3500ms auto-dismiss
Animation:      slide up from bottom, fade out, 240ms
Max visible:    1 at a time (queue subsequent)
```

---

## 5. Responsive Design

### 5.1 Breakpoints

| Name | Width | Layout |
|---|---|---|
| `mobile` | 0–767px | 1 column, full-width sections, drawer nav |
| `tablet-sm` | 768–833px | 2-col product grids begin, icon nav |
| `tablet` | 834–1023px | Full tablet, expanded nav |
| `desktop-sm` | 1024–1069px | Standard desktop begins |
| `desktop` | 1070–1439px | Full layout, 980px content max-width |
| `wide` | 1440px+ | Centered with generous margins |

### 5.2 Typography Scaling

| Role | Desktop | Tablet | Mobile |
|---|---|---|---|
| Display Hero | 56px | 40px | 28px |
| Section Heading | 40px | 34px | 28px |
| Tile Heading | 28px | 24px | 21px |
| Body | 17px | 17px | 17px (unchanged) |

Line-heights maintain their ratios at all sizes. Never increase tracking at smaller sizes — Apple keeps it tight throughout.

### 5.3 Layout Scaling

| Screen | Desktop | Tablet | Mobile |
|---|---|---|---|
| Command Center | 3-col KPI grid, 2-col hero section | 2-col KPI, stacked panels | 1-col all sections stacked |
| Analytics Hub | 60/40 split | Stacked, Intel collapses | 1-col, tabs, accordion details |
| Inbox | Split view (list + detail) | List only, detail full-screen | Full-screen detail only |
| Content Hub | Horizontal stepper + full stage | Same but smaller | Vertical stepper + accordion stages |
| Market Radar | Side-by-side scorecard + chart | Stacked | 1-col, chart collapses to summary |
| Team Roster | 3-col card grid | 2-col grid | 1-col list |
| War Room | Full-width, stacked response | Same | Same |
| Settings | Pill sub-nav + content | Tabs on top | Tabs on top, full-width drawer |

### 5.4 Section Behavior on Mobile

Apple's **full-width color block sections** are maintained at all breakpoints without exception. On mobile:
- Section padding reduces from 80px to 48px vertical
- Content max-width: 100% minus 32px horizontal padding (16px each side)
- Hero headlines scale down but maintain their tight line-height ratios
- Section backgrounds (black / `#f5f5f7`) span full viewport width — never broken

### 5.5 Touch Targets

- All buttons: minimum 44×44px touch area
- Nav items (mobile drawer): 52px height
- Table rows: 56px on mobile
- Input fields: 44px height minimum
- Pill CTAs: 8px vertical padding creating ~44px natural touch height at 17px font

---

## 6. Accessibility

- Focus ring: `2px solid #0071e3` on all interactive elements — Apple's standard
- Color contrast: 4.5:1 minimum for body text on both dark and light backgrounds
- Color never the only differentiator — always pair with icon, label, or shape
- ARIA roles: `<nav>`, `<main>`, `<header>`, `role="status"` on live regions (anomaly alerts, inbox unread count)
- Keyboard navigation: full tab-order following visual flow; drawer traps focus while open
- Screen reader: all icon-only buttons have `aria-label`
- `prefers-reduced-motion`: all transitions and animations disabled; skeleton loaders still shown but without shimmer animation

---

## 7. Implementation Notes

### 7.1 Font Loading

```css
/* CSS */
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
             "Helvetica Neue", Helvetica, Arial, sans-serif;
```

This resolves to SF Pro on macOS/iOS natively, and to Segoe UI/Roboto on Windows/Android — both acceptable. For guaranteed SF Pro on web, host the font files (available via Apple's font licensing for web use in some contexts) or use the system stack.

For monospace data (metric tables, KPI numbers in dense tables): `"SF Mono", "JetBrains Mono", "Courier New", monospace`.

### 7.2 CSS Custom Properties

```css
:root {
  /* Backgrounds */
  --bg-dark: #000000;
  --bg-light: #f5f5f7;
  --bg-white: #ffffff;
  --bg-dark-surface-1: #272729;
  --bg-dark-surface-2: #262628;
  --bg-dark-surface-3: #28282a;
  --bg-dark-surface-4: #2a2a2d;
  --bg-dark-surface-5: #242426;

  /* Text */
  --text-on-dark: #ffffff;
  --text-on-light: #1d1d1f;
  --text-secondary-dark: rgba(255,255,255,0.72);
  --text-secondary-light: rgba(0,0,0,0.80);
  --text-tertiary: rgba(0,0,0,0.48);
  --text-tertiary-dark: rgba(255,255,255,0.40);

  /* Accent */
  --accent-blue: #0071e3;
  --accent-blue-dark: #2997ff;
  --accent-blue-link: #0066cc;
  --accent-blue-hover: #0077ed;

  /* Data */
  --data-green: #34c759;
  --data-red: #ff3b30;
  --data-yellow: #ff9f0a;

  /* Shadows */
  --shadow-card: rgba(0,0,0,0.22) 3px 5px 30px 0px;
  --shadow-focus: 0 0 0 3px rgba(0,113,227,0.40);

  /* Nav */
  --nav-bg: rgba(0,0,0,0.80);

  /* Radii */
  --radius-micro: 5px;
  --radius-std: 8px;
  --radius-input: 11px;
  --radius-panel: 12px;
  --radius-pill: 980px;
  --radius-circle: 50%;
}
```

### 7.3 Component Folder Structure

```
/components
  /ui
    Card.tsx           — light + dark variants
    KpiTile.tsx
    DataTable.tsx
    Button.tsx         — primary, dark, pill-link, filter variants
    Badge.tsx
    Drawer.tsx
    EmptyState.tsx
    Toast.tsx
    SkeletonLoader.tsx
    Input.tsx
    PillTabBar.tsx     — the pill filter/tab pattern used everywhere
  /layout
    TopNav.tsx         — glass nav, always
    MobileDrawerNav.tsx
    SectionWrapper.tsx — enforces bg-dark / bg-light alternation + max-width
    PageHeader.tsx
  /charts
    TrendChart.tsx
    BubbleChart.tsx
    WorkloadHeatmap.tsx
    RevenueAttributionMap.tsx
```

### 7.4 SectionWrapper Convention

Every full-width section should use a shared `SectionWrapper` component that handles:
- Background color (`dark` | `light` | `white` prop)
- Vertical padding (80px desktop, 48px mobile)
- Inner content div with 980px max-width and horizontal centering
- This ensures the cinematic rhythm is never broken by a screen that forgets to alternate

---

## 8. Next Steps (Implementation Order)

1. **CSS tokens + Tailwind theme** — register all custom properties and map to utilities
2. **TopNav + MobileDrawerNav** — the glass nav is the first thing a user sees
3. **SectionWrapper** — foundational layout primitive for the scene system
4. **UI component library** — Card, Button, Badge, Input, PillTabBar, Drawer, KpiTile
5. **Command Center** — dark hero + light KPI grid + dark heatmap (tests all 3 section types)
6. **Inbox** — dark, split-view, simplest data model
7. **Analytics Hub** — most chart-heavy screen
8. **Content Hub** — three-tab workflow with stepper
9. **Market Radar** — bubble chart + dark scorecard
10. **Team + Settings** — forms, roster, tasks
11. **Responsive pass** — audit all screens at all 6 breakpoints
12. **Accessibility audit** — keyboard flow, contrast check, ARIA

---

*YVON 2.0 Design Specification v2.0 — Apple Design Language*
*Ready for implementation. Next: design tokens → layout shell → component library.*
