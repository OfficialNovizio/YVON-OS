# YVON BI Dashboard v2 — Design System

> Extracted from: `NEW UI design/` reference images (3 images)
> Date: 2026-04-07 | Owner: Mia (Frontend & UI/UX)

---

## 1. Color Palette

### Base Background
| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#050505` | Page background (already in globals.css) |
| `--color-surface` | `#0E1415` | Card/panel surfaces |
| `--color-elevated` | `#161C1D` | Hover states, overlays |
| `--color-sidebar` | `#080C0D` | Left sidebar background |
| `--color-warroom` | `#0D1112` | Right war room panel |

### Accent — Green (NEW primary, replaces red)
| Token | Value | Usage |
|---|---|---|
| `--color-accent` | `#00C853` | Primary action, CTAs |
| `--color-accent-bright` | `#00E676` | Glow effects, hero wave highlights |
| `--color-accent-dim` | `#00892D` | Disabled, subtle accents |
| `--color-accent-bg` | `rgba(0, 200, 83, 0.08)` | Accent backgrounds (badge bg, card glow) |

### Secondary — Teal
| Token | Value | Usage |
|---|---|---|
| `--color-teal` | `#00BFA5` | Secondary highlights, chart lines |
| `--color-teal-dim` | `rgba(0, 191, 165, 0.08)` | Teal backgrounds |

### Text
| Token | Value | Usage |
|---|---|---|
| `--color-text` | `#FFFFFF` | Primary text, headings |
| `--color-text-secondary` | `#9CA3AF` | Labels, descriptions |
| `--color-text-tertiary` | `#6B7280` | Meta text, timestamps |
| `--color-text-inverse` | `#050505` | Text on light/colored backgrounds |

### States
| Token | Value | Usage |
|---|---|---|
| `--color-success` | `#00C853` | Success/complete (replaces old red with green) |
| `--color-warning` | `#F59E0B` | Warning |
| `--color-danger` | `#EF4444` | Danger (kept for destructive actions only) |
| `--color-info` | `#3B82F6` | Info |

### Borders
| Token | Value | Usage |
|---|---|---|
| `--color-border` | `#1A2123` | Card outlines, dividers |
| `--color-border-hover` | `#252F31` | Hovered card outlines |

### Heatmap Palette (Weekly Workload)
| Token | Value | Meaning |
|---|---|---|
| `--heat-0` | `#0E1415` | No activity |
| `--heat-1` | `#0B5F3B` | Low activity |
| `--heat-2` | `#10A85E` | Medium activity |
| `--heat-3` | `#00C853` | High activity |
| `--heat-4` | `#00E676` | Fully occupied |

### Brand Green (Hero Wave)
| Token | Value | Usage |
|---|---|---|
| `--brand-green-glow` | `#00E676` | Hero wave brightest peaks |
| `--brand-green-mid` | `#00C853` | Mid-band wave |
| `--brand-green-shadow` | `rgba(0, 147, 71, 0.2)` | Wave diffusion/fading |

---

## 2. Typography

| Token | Font Family | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| `--font-display` | Inter | 36px (2.25rem) | 700 | 1.1 | Greeting: "Hi. Let's make today count." |
| `--font-heading-lg` | Inter | 24px (1.5rem) | 700 | 1.3 | Section headings |
| `--font-heading-md` | Inter | 18px (1.125rem) | 600 | 1.3 | Card titles |
| `--font-body` | Inter | 14px (0.875rem) | 400 | 1.5 | Body text |
| `--font-small` | Inter | 12px (0.75rem) | 400 | 1.4 | Labels, captions |
| `--font-label` | Inter | 11px (0.6875rem) | 500 | 1 | UPPERCASE labels |
| `--font-kpi-value` | Inter | 28px (1.75rem) | 700 | 1.0 | KPI big numbers |
| `--font-mono` | Courier New | 14px | 400 | 1.4 | Code, data values |

**Font source:** Inter via `next/font` (same as current). No new font families or weights.

---

## 3. Spacing Scale

| Scale | Value | CSS | Tailwind mapping |
|---|---|---|---|
| `0` | 0 | `0` | `0` |
| `1` | 4px | `0.25rem` | `1` |
| `2` | 8px | `0.5rem` | `2` |
| `3` | 12px | `0.75rem` | `3` |
| `4` | 16px | `1rem` | `4` |
| `5` | 20px | `1.25rem` | `5` |
| `6` | 24px | `1.5rem` | `6` |
| `8` | 32px | `2rem` | `8` |
| `10` | 40px | `2.5rem` | `10` |
| `12` | 48px | `3rem` | `12` |
| `16` | 64px | `4rem` | `16` |
| `20` | 80px | `5rem` | `20` |

**Layout rules from images:**
- Card gap: `16px` (gap-4)
- Card padding: `16px 20px` (px-5 py-4)
- Sidebar width: `240px`
- Top nav height: `64px`
- Main content max-width: full width, grid-based
- KPI tile grid: 6-column desktop, 3-column tablet, 2-column mobile

---

## 4. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Small buttons, badges |
| `--radius-md` | `8px` | Cards, inputs |
| `--radius-lg` | `12px` | Hero banner, large cards |
| `--radius-full` | `9999px` | Avatar circles, pill-shaped badges (agent status dots only) |

Border radius stays conservative: **max 12px**. The hero banner gets `12px`; cards stay `8px`.

---

## 5. Shadows & Glows

| Token | Value | Usage |
|---|---|---|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.7)` | Card depth |
| `--shadow-glow-accent` | `0 0 20px rgba(0, 200, 83, 0.3), 0 0 60px rgba(0, 200, 83, 0.1)` | CTA hover, active states |
| `--shadow-glow-hero` | `0 0 80px rgba(0, 230, 118, 0.15)` | Hero banner ambient |
| `--shadow-float` | `0 8px 32px rgba(0,0,0,0.6)` | Floating panels, dropdowns |

---

## 6. Components (Derived from Images)

### 6.1 Hero Greeting Banner
- Background: `bg image.png` (green wave)
- Height: ~180px min, scales to 1/3 viewport height at large screens
- Border radius: `--radius-lg` (12px)
- Text position: top-left, inside wave area
- CTA button: "Set Live Briefing" in `--color-accent` white text, radius `--radius-sm`
- 3 pill KPI badges top-right of wave: small rounded pills with `--color-accent-bg` background

### 6.2 KPI Stat Cards (x6 row grid)
- Grid: 6 columns, 1fr each, gap 16px
- Surface: `--color-surface`, border `--color-border`
- Padding: `16px 20px`
- Border radius: `--radius-md` (8px)
- Big value: `--font-kpi-value` (`28px`, bold, white)
- Label below: `--font-label` (uppercase, 11px, `--color-text-secondary`)
- Change badge: small pill with green (`var(--color-accent)`), shows "+X% from previous week"
- Hover: surface → `--color-elevated`, subtle glow
- Special highlight: one card can have green gradient background (`.finished-94` card)

### 6.3 Weekly Workload Heatmap
- Grid: 7 columns (Mon-Sun) x 15 rows (agent names)
- Cell size: ~16px square, gap 2px
- Cell colors: `--heat-0` through `--heat-4`
- Legend row above: 4 dots (low/medium/high/fully occupied) using heat palette
- Header: day-of-week label (Mon Tue Wed Thu Fri Sat Sun)
- Left column: agent initials / names
- Border radius on cells: `2px`
- "View all" link top-right of section

### 6.4 Left Sidebar
- Width: 240px, fixed position
- Background: `--color-sidebar`
- Top: YVON logo header
- Section headers: UPPERCASE `--font-label` (gray)
- Nav items: 24px height, hover → `--color-elevated`, active → left border green `--color-accent`
- Agent list: avatar dot (4 states: green=active, amber=busy, gray=idle, red=offline) + name
- Bottom: "+ Add to Workspace" outlined button

### 6.5 Top Navigation Bar
- Height: 64px
- Background: `var(--color-sidebar)` with `border-bottom: 1px solid var(--color-border)`
- Left: YVON logo
- Center: Pill search input (dark bg, gray text, rounded-full)
- Right: Monthly selector (pill buttons), notification bell, green dot profile avatar

---

## 7. Image Assets

| Asset | Source | Usage |
|---|---|---|
| `bg image.png` | `NEW UI design/bg image.png` | Hero banner background |
| Agent avatars | Generated per agent | Sidebar roster, workload heatmap labels |
| Dashboard favicon | Current | Browser tab |

---

## 8. Key Design Rules

1. **Green accent is the new identity** — All primary CTAs, highlights, and active states use green tokens. Red remains only for danger/destructive actions.

2. **Hero wave is non-negotiable** — The "Hi. Let's make today count." greeting with the green wave is the signature visual identity. It must be prominent on the CEO command page.

3. **No hardcoded colors** — Same rule as v1. All values reference CSS tokens from `globals.css`.

4. **Dark mode only** — No light mode variant. All backgrounds, text, and surfaces assume dark.

5. **Heatmap uses exactly 5 levels** — Not 4, not 7. The 5-level green intensity scale is fixed.

6. **Font stays Inter** — No typography changes beyond weight/size. Courier New for mono only.

7. **Card surfaces use subtle elevation** — Not flat, not heavy shadow. `0 1px 3px rgba(0,0,0,0.5)` is the standard.

8. **Max 2 primary CTAs per screen** — Greeting banner = 1 CTA. No more than 1 other green button on the same viewport.

---

## 9. Migration Notes (v1 → v2)

| Change | Before | After |
|---|---|---|
| Primary accent | Red (`#E94560`) | Green (`#00C853`) |
| Card surface | Dark navy | Near-black with green-tinted borders |
| Brand identity | Cyberpunk-red | Energy-green |
| Hero element | None | Green wave greeting banner |
| Heatmap | Not present | New component (5-level green scale) |
| Border radius | Max 8px | Max 12px (hero only) |
| Shadows | Minimal | Glow effects on accent elements |

---

## 10. globals.css Tokens (to implement)

```css
/* ═══════════════════════════════════════════════════════════════
   YVON Dashboard v2 — Design Tokens
   ═══════════════════════════════════════════════════════════════ */

:root {
  /* Base */
  --color-bg: #050505;
  --color-surface: #0E1415;
  --color-elevated: #161C1D;
  --color-sidebar: #080C0D;
  --color-warroom: #0D1112;

  /* Accent — Green */
  --color-accent: #00C853;
  --color-accent-bright: #00E676;
  --color-accent-dim: #00892D;
  --color-accent-bg: rgba(0, 200, 83, 0.08);

  /* Secondary */
  --color-teal: #00BFA5;
  --color-teal-dim: rgba(0, 191, 165, 0.08);

  /* Text */
  --color-text: #FFFFFF;
  --color-text-secondary: #9CA3AF;
  --color-text-tertiary: #6B7280;
  --color-text-inverse: #050505;

  /* States */
  --color-success: #00C853;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #3B82F6;

  /* Borders */
  --color-border: #1A2123;
  --color-border-hover: #252F31;

  /* Heatmap */
  --heat-0: #0E1415;
  --heat-1: #0B5F3B;
  --heat-2: #10A85E;
  --heat-3: #00C853;
  --heat-4: #00E676;

  /* Brand */
  --brand-green-glow: #00E676;
  --brand-green-mid: #00C853;
  --brand-green-shadow: rgba(0, 147, 71, 0.2);

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.7);
  --shadow-glow-accent: 0 0 20px rgba(0, 200, 83, 0.3), 0 0 60px rgba(0, 200, 83, 0.1);
  --shadow-glow-hero: 0 0 80px rgba(0, 230, 118, 0.15);
  --shadow-float: 0 8px 32px rgba(0, 0, 0, 0.6);

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

---

## 11. Implementation Workflow

Phase 1 — Tokens
1. Update `globals.css` with new color tokens (above)
2. Update `tailwind.config.ts` to match — all custom colors as Tailwind utilities

Phase 2 — Foundation
3. Copy `bg image.png` into `public/static/hero-wave.png`
4. Copy current favicon/assets

Phase 3 — Components
5. Build `HeroGreeting` — green wave banner with greeting text + CTA
6. Build `KPIStatGrid` — 6-column responsive grid
7. Build `WorkloadHeatmap` — weekly agent capacity visualization
8. Re-theme existing sidebar/nav with green accent

Phase 4 — Pages
9. Wire components into `app/ceo/page.tsx`
10. Verify mobile breakpoints (stack columns: 6→3→2)
11. Verify all CSS variables resolve correctly (no red leaking through)

---
