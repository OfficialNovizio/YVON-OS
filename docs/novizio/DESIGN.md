# Novizio — Design System
> LONG-TERM. Load for any UI, visual, component, or asset work on Novizio.
> ⚠️  These rules OVERRIDE any design content in agent MEMORY.md files for Novizio work.
> Cross-venture shared patterns → docs/memory/design.md

---

## Aesthetic Direction
Editorial fashion. Warm, clean, minimal. Product breathes. Nothing competes with the garment.
- Light, warm palette — no dark mode for Novizio
- Photography: natural light, clean or editorial backgrounds
- No pill buttons, no heavy gradients, no dark overlays
- Whitespace is intentional — not empty, considered

---

## Palette
> ⚠️  Not finalised — fill in real values before first UI session.

| Role | Value | Notes |
|------|-------|-------|
| Background | Warm white ~#FAFAF8 | Editorial, clean |
| Primary text | Deep charcoal ~#1C1C1C | High contrast on light |
| Accent | Warm sand ~#C8A882 | Understated luxury |
| Surface | Soft cream ~#F2EDE4 | Section backgrounds |
| Border | Light warm grey ~#E8E4DF | Subtle separation |

---

## Typography
> ⚠️  Not finalised — confirm with Stark before implementing.

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Hero / editorial | Serif TBD | 48–64px | 300–400 |
| Body | Inter | 16px | 400 |
| Labels / caps | Inter | 11–12px | 600 |
| Price / KPI | Inter | 24px | 700 |

---

## Component Rules
- Border radius: 4px max — no pill shapes
- Buttons: minimal, outlined or filled — no drop shadows
- Cards: clean edges, no heavy box shadows
- Images: always full-bleed or clean float — no decorative borders

---

## ⚠️  Cold Start Warning
Many fields above are stubs. Before Mia works on any Novizio UI:
1. Stark fills in real palette and typography values
2. Mia confirms tokens exist in globals.css before using them
3. If token doesn't exist — create it in globals.css + tailwind.config.ts together
