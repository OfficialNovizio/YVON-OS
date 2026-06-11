# YVON Dashboard — Design System (v1)
> LONG-TERM. Canonical glass design system for the YVON BI dashboard.
> ⚠️  These rules OVERRIDE any design content in agent MEMORY.md files for YVON dashboard work.
> Cross-venture shared patterns → docs/memory/design.md

---

## Background
All screens use `public/Background Image.jpg` — light blue, no dark overlay ever.

```tsx
<div className="fixed inset-0 -z-10" style={{
  backgroundImage: "url('/Background Image.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: '#ffffff',
}} />
```
**Hard rule: NO rgba overlay on top of this background. It kills the palette.**

---

## Font
SF Pro Display via `@font-face` in globals.css from `/public/fonts/SFPRODISPLAY*.OTF`.
```css
font-family: 'SF Pro Display', 'Inter', -apple-system, sans-serif;
```

---

## 4 Glass Container Variants

Define as `React.CSSProperties` constants at the top of each component. Use all four per screen.

```tsx
const G1: React.CSSProperties = {           // V1 — Clear Ice
  background: 'rgba(255,255,255,0.32)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.45)',
  borderRadius: 16,
}

const G2: React.CSSProperties = {           // V2 — Azure Tint
  background: 'linear-gradient(135deg, rgba(36,99,180,0.42), rgba(20,70,140,0.55))',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 16,
}

const G3: React.CSSProperties = {           // V3 — Obsidian
  background: 'linear-gradient(135deg, rgba(15,22,38,0.58), rgba(8,14,28,0.72))',
  backdropFilter: 'blur(34px)',
  WebkitBackdropFilter: 'blur(34px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

const G4: React.CSSProperties = {           // V4 — Prism
  background: 'radial-gradient(ellipse at 30% 40%, rgba(236,72,153,0.22), transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(6,182,212,0.18), transparent 60%), rgba(255,255,255,0.28)',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  border: '1px solid rgba(255,255,255,0.40)',
  borderRadius: 16,
}

const ink = {
  navy:  '#0c2c52',   // text on V1, V4 (light containers)
  white: '#f1f5fb',   // text on V2, V3 (dark containers)
  plum:  '#2a1240',   // accent text on V4
}
```

## Glass Variant Usage

| Variant | Background | Text | Use for |
|---------|-----------|------|---------|
| V1 Clear Ice | White frosted | `#0c2c52` navy | Data tables, agent status, neutral info |
| V2 Azure Tint | Blue gradient | `#f4f8ff` white | Brand context, cool-blue panels |
| V3 Obsidian | Dark smoke | `#f1f5fb` white | Urgent decisions, cinematic moments |
| V4 Prism | Pink+cyan iridescent | `#2a1240` plum | Completed items, soft iridescent moments |

**HARD RULE: Light containers (V1, V4) → dark text. Dark containers (V2, V3) → light text. Never swap.**

---

## Typography Scale

| Element | Size | Weight |
|---------|------|--------|
| Page title | 48–52px | 800 |
| Section labels | 12px | 800 |
| Ticker items | 14px | 600 |
| Tab buttons | 13px | 700 |
| KPI values | 52px | 800 |
| Body text | 14px | 500–600 |
| Agent names | 13px | 700 |
| Status badges | 11px | 700–800 |
| Delta / change | 14px | 800 |

**Minimum: 12px for any readable text. 800 weight is the default throughout.**

---

## NavBar
`.glass-nav` CSS class — frosted white pill. All text inside: dark navy `#0c2c52`. Never `text-white` inside the nav.

## Dark pill elements
Ticker, TabStrip, dark modals: `background: 'rgba(8,16,36,0.58)'`

## Component Rules
- Each list item: own glass card — no shared container for rows
- KPI metrics: individual V1 cards with 220×64 sparklines
- Lists that grow: `maxHeight: 360–420px` + `overflowY: auto` + `scrollbarWidth: thin`
- No drop shadows between stacked cards — remove `0 18px 50px` from boxShadow

---

## Canonical Reference
Copy exact `G1`–`G4` + ink constants from `app/screens/ceo-command-dashboard/_overview.tsx`. That file is the source of truth for all glass implementation.
