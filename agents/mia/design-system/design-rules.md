# YVON Dashboard v2 — Strict Design Instructions

> These instructions MUST be followed for every UI change in the YVON BI Dashboard.
> Read this file before making any design/component modifications.

---

## 1. Layout Philosophy — Full-Screen Scroll

**Rule:** The CEO dashboard greeting + KPI strip must fill the initial viewport. Other content (Workload, Intelligence grid) is revealed on scroll—NOT all visible at once.

- Hero greeting section: `min-height: calc(100vh - 120px)` — takes most of the viewport
- KPI strip: visible below hero with slight overlap (hero bottom partially overlaps KPI top)
- Everything else: only appears when user scrolls down
- This creates a focused, intentional greeting-first experience

---

## 2. Color Palette — Precise Values

### Backgrounds
```
bg-deep:     #050505      → page background (near-black)
sidebar:     #0A0D0E      → sidebar surface (slightly lighter than bg)
card-bg:     rgba(255,255,255,0.03) → glass card default background
card-bg-hover: rgba(255,255,255,0.06) → glass card hover state
warroom:     #0B0E0F      → right war room panel
header-bar:  rgba(10,13,14,0.95) → top sticky header
```

### Accent Green (Primary)
```
green-accent:  #00C853   → primary CTA, active states, highlights
green-bright:  #00E676   → gradients, hero text
green-mid:     #00A842   → secondary accents
green-dark:    #00892D   → dimmed states
green-glow:    rgba(0,200,83,0.3) → glow effects
green-bg:      rgba(0,200,83,0.08) → subtle green backgrounds
```

### Borders
```
border-subtle:    rgba(255,255,255,0.08) → default card borders (glass)
border-hover:     rgba(255,255,255,0.15) → hover card borders
border-green:     rgba(0,200,83,0.3)     → green highlighted card border
border-sidebar:   #1A2123                → sidebar divider
border-reflection: rgba(255,255,255,0.1) → top reflection edge
```

### Text
```
text-primary:   #FFFFFF       → headings, values
text-secondary: rgba(255,255,255,0.64) → body text, descriptions
text-tertiary:  rgba(255,255,255,0.40) → labels, timestamps, metadata
text-label:     rgba(255,255,255,0.90) → card titles, uppercase labels
text-muted:     rgba(255,255,255,0.25) → inactive elements
```

### Semantic
```
danger:    #EF4444   → destructive actions, negative trends
warning:   #F59E0B   → warnings, amber indicators
info:      #3B82F6   → info highlights
success:   #00C853   → positive trends (same as accent)
```

### Heatmap Palette
```
heat-empty:  rgba(255,255,255,0.03)   → no activity
heat-1:      rgba(0,200,83,0.15)      → minimal
heat-2:      rgba(0,200,83,0.35)      → light
heat-3:      rgba(0,200,83,0.60)      → medium
heat-4:      #00C853                   → high/fully occupied
```

---

## 3. Typography — Strict Sizes & Weights

> Font family: **Inter** for all text (next/font).
> Display font: **Outfit** for hero headings.
> Mono: DM Mono / Courier for code.

### Hierarchy
```
h1-hero:       52px / 700   → Greeting "Hi. Let's make today count"
h2-section:    24px / 700   → Premium Briefing title
h3-card:       18px / 600   → Card section titles
h4-label:      12px / 700   → UPPERCASE card labels
label-tiny:    10px / 700   → Tracking-widest labels
metric-value:  28-32px / 700 → KPI big numbers
body:          13px / 400   → Default body text
small:         11px / 400   → Secondary text
tiny:          10px / 500   → Meta info, timestamps
```

### Font Weights
```
Regular text:  font-weight 400
Bold text:     font-weight 700 (use for labels, values, headings)
Black text:    font-weight 900 (use for KPI values, section headers with tracking)
Medium text:   font-weight 500 (use for navigation, secondary labels)
```

### Tracking
```
tracking-tight:   -0.025em → Hero headings
tracking-normal:   0        → Body text
tracking-wide:     0.05em   → KPI labels
tracking-widest:   0.15em   → UPPERCASE labels, buttons
```

### Line Heights
```
tight:        1.1 → Hero, large headings
normal:       1.4 → Card titles, body
relaxed:      1.6 → Paragraphs, briefings
```

---

## 4. Glass-morphic Card Design

### Standard Container
Every card/container must use glass-morphic styling:

```css
background: rgba(255, 255, 255, 0.03);      /* Translucent dark */
backdrop-filter: blur(20px);                 /* Blur behind */
border: 1px solid rgba(255, 255, 255, 0.08); /* Subtle border */
border-top: 1px solid rgba(255, 255, 255, 0.12); /* Stronger top edge (reflection) */
border-left: 1px solid rgba(255, 255, 255, 0.1); /* Slight left reflection */
border-radius: 16px;                          /* Rounded corners (rounded-2xl) */
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);   /* Depth shadow */
```

### Hover State
```css
background: rgba(255, 255, 255, 0.06);      /* Brighter on hover */
border-color: rgba(255, 255, 255, 0.15);     /* Stronger border */
border-top-color: rgba(255, 255, 255, 0.2);  /* Stronger reflection */
```

### Highlighted KPI Card (Green gradient)
```css
background: linear-gradient(135deg, #00C853, #00E676);
border: 1px solid rgba(0, 200, 83, 0.4);
box-shadow: 0 4px 30px rgba(0, 200, 83, 0.2);
```

### Hero Section
```css
background: linear-gradient(135deg, rgba(0,200,83,0.15), transparent 60%);
border: none (full-bleed within viewport — no border)
```

---

## 5. Border Radius

```
cards:         16px (rounded-2xl) — ALL container cards
buttons:       12px (rounded-xl) — Primary buttons
pills:         9999px (rounded-full) — Search pill, dropdown buttons
badges:        8px   (rounded-lg)  — Small badges, agent status
avatar:        50%   (rounded-full) — Avatar circles
```

**NEVER use border-radius < 8px for UI cards.**
**NEVER use border-radius > 24px for any element except pills.**

---

## 6. Spacing

```
page-padding:    24px — Main content area internal padding
card-gap:        16px (gap-4) — Between KPI cards, grid items
card-gap-lg:     24px (gap-6) — Between larger card sections
card-inner:      20px padding (p-5) — Internal card content padding
section-gap:     32px — Between major page sections
sidebar-padding: 12px horizontal, 8px vertical items
```

---

## 7. Sidebar — Exact Specification

### Dimensions
```
width: 260px (w-[260px])
min-width: 260px
height: 100vh (fixed, full height)
background: #0A0D0E
border-right: 1px solid rgba(255,255,255,0.06)
```

### Top Logo Area
```
padding: 16px 20px
height: 56px (matches nav height)
border-bottom: none (sidebar blends into main bg)
```

### Brand Dropdown
```
padding: 12px 16px
button: background rgba(0,200,83,0.06), border 1px solid rgba(0,200,83,0.2), rounded-xl
dropdown: z-index 100, background #0A0D0E, border 1px solid rgba(255,255,255,0.08), rounded-xl
```

### Dashboard Nav Items
```
height: 36px per item
padding: 0 16px
active: bg rgba(0,200,83,0.08), border-left 2px solid #00C853, text color #FFFFFF
hover (inactive): bg rgba(255,255,255,0.03), text rgba(255,255,255,0.64)
font: 13px Inter, weight 400, tracking normal
```

### AI Team Items
```
height: 34px per item
padding: 0 16px
agent-avatar: 24px circle with 2px border-radius-full
agent-name: 12px, color rgba(255,255,255,0.64)
agent-role: 10px, color rgba(255,255,255,0.30), margin-left auto
status-dot: 6px circle, positioned on avatar
status colors: active=#00C853, busy=#F59E0B, idle=#6B7280, offline=#404040
```

### Add to Workspace Button
```
position: fixed at bottom of sidebar
padding: 8px 16px
background: transparent
border: 1px dashed rgba(255,255,255,0.10)
border-radius: 8px
font: 11px, color rgba(255,255,255,0.50)
hover: border green, text green
```

---

## 8. Agent Avatars

- Use the `AgentAvatar` component (`components/AgentAvatar.tsx`) in sidebar and team sections
- Size: `24px` for sidebar roster, `32px` for team tasks, `48px` for detail pages
- If external avatar URL not available, generate initials-based avatar with brand color background
- Store generated avatars in `public/avatars/agents/`
- Fallback: colored circle with agent initial

---

## 9. Navigation Bar

```
height: 56px
background: #0A0D0E (or rgba(10,13,14,0.95) for sticky)
border-bottom: 1px solid rgba(255,255,255,0.06)
left: 260px (offset by sidebar width)
position: sticky, top: 0, z-index: 40
```

### Elements (left to right)
```
1. "CEO Command" — page title, 14px, bold, white
2. Search pill — centered, full-width max 500px, rounded-full
3. Monthly selector — pill style, right side
4. Notification bell — 32px circle button
5. Profile avatar — 32px circle with green ring
```

---

## 10. KPI Card Design

```
container: h-[120px] — fixed height for consistent row
border-radius: 16px
glass: as defined in section 4

icon: 28px circle, background rgba(255,255,255,0.05), white icon
label: UPPERCASE, 10px, weight 700, tracking-widest, text-secondary
value: 28px, weight 700, font-display, text-primary
change-value: 12px, weight 700 (green or red)
change-label: 10px, weight 500, tracking-normal, text-tertiary
view-all: 9px, weight 700, uppercase, tracking-widest, text-muted
```

---

## 11. Workload Heatmap

```
container: rounded-2xl, glass card bg
legend: 4 levels (Low, Med, High, Fully Occupied)
day-labels: 10px, bold, uppercase, left column
date-header: 9px, bold, numbers above grid, gray-500
cells: 18px × 20px, rounded-sm, gap 2px
cell colors: as defined in section 2 (Heatmap Palette)
```

---

## 12. Anomalies Bar

```
position: top of page content (below nav)
background: rgba(255,255,255,0.03)
border: 1px solid rgba(255,255,255,0.06)
border-radius: 8px
padding: 8px 16px
label: "ANOMALIES:" — 10px, bold, uppercase, tracking-widest, green-400
items: 12px, text-secondary, separated by bullet dots
```

---

## 13. Intelligence Grid

```
layout: 4-column grid (lg:grid-cols-4)
gap: 24px (gap-6)
left column (spans 2): Premium Briefing + Decision Queue
middle column: Activity Feed + Brand Pulse Chart
right column: Market Intelligence + Customer Voice + Team Tasks + Quick Actions
```

## 14. Decision Queue Card

```
urgency-badge-top-left of each sub-card
colors: ACT NOW → red/amber, TODAY → amber, THIS WEEK → blue/teal
sub-cards: glass-morphic, rounded-xl, padding 20px
action-buttons: 2 per sub-card, left = outline, right = solid (colored)
```

## 15. Quick Actions

```
position: bottom-right of intelligence grid
button style: glass card, rounded-xl, padding 12px 16px
icon: 16px, left side
label: 11px, bold, uppercase, tracking-wider
layout: flex-col (stacked vertically)
gap: 8px between buttons
```
