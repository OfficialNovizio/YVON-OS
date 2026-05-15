---
name: consolidated-design-feedback
description: "All design rules, corrections, and never-again patterns from the YVON UI sessions"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c82b1f68-80e1-400b-9c60-5597e8fc08c0
---

# Consolidated Design Feedback — SINGLE SOURCE OF TRUTH
> Read by Marcus at every session start AND at every Forming stage.
> If a rule is here, follow it. If it's not here, don't guess — ask.
> No other feedback files exist. This is the only one.

## 1. ROUTING — NEVER AGAIN
**Rule:** ALL UI/design/frontend tasks MUST route through Marcus → Mia. 
**Why:** The user has repeatedly said "I've told you 100 times" about routing to the correct agent. I skipped routing every time.
**How:** Every message auto-triggers the Marcus command block. If the keywords include React, CSS, Tailwind, layout, design, UI, UX, fonts, colors, cards, containers, glass → Mia agent. Not optional.

## 2. FONT SIZING — CEO Dashboard
**Rule:** Never use fonts smaller than 12px for readable text. Use 800 weight throughout.
| Element | Min size | Weight |
|---------|----------|--------|
| Page title | 48–52px | 800 |
| Section labels | 12px | 800 |
| Ticker items | 14px | 600 |
| Tab buttons | 13px | 700 |
| KPI values | 52px | 800 |
| Body text | 14px | 500–600 |
| Agent names | 13px | 700 |
| Status badges | 11px | 700–800 |
| Delta/change | 14px | 800 |
| "Full view" links | 12px | 700 |

## 3. GLASS CONTAINER RULES
**4 variants — use all per screen:**
- V1 Clear Ice: white frosted, navy text (#0c2c52) — neutral info, tables
- V2 Azure Tint: blue gradient, white text (#f4f8ff) — brand, cool-blue panels
- V3 Obsidian: dark smoke, white text (#f1f5fb) — urgent, cinematic
- V4 Prism: iridescent, plum text (#2a1240) — completed items

**Text contrast — HARD RULE:**
- Light containers (V1, V4) → PURE BLACK text (#000000 for primary)
- Dark containers (V2, V3) → PURE WHITE text (#ffffff for primary)
- NO muted navy (rgba(12,44,82,X)) or off-white tones. Pure black/white.
- Accent colors on V1 cards must be dark: GREEN → #047857, VIOLET/ACCENT → dark enough for 4.5:1 contrast on white

**Container structure:**
- Every section needs a visible glass container — no rgba(255,255,255,0.04) invisible backgrounds
- Each list item gets its own glass card (not shared container)
- KPI metrics: individual V1 cards with 220×64 sparklines, not a combined strip
- Cards: use V1 Clear Ice for data. No drop shadows between stacked cards (remove `0 18px 50px...` from boxShadow)

## 4. SCROLLABLE LISTS
**Rule:** Any list that could grow (priorities, reports, cards) needs maxHeight + overflowY: auto. 
Defaults: maxHeight: 360–420px, scrollbarWidth: thin. Header and stats bar stay outside the scroll area.

## 5. NEVER AGAIN — Error Prevention
- If a user correction repeats → save immediately to this file's "Never Again" section
- If a build error happens twice → add the fix pattern here
- If the user says "I told you" → the mistake should have been caught by the Marcus routing step
- Graphify is Windows-only (`C:/Users/Novy/...`) — not available on macOS. Cannot run graphify:build here.
- The Tuckman model (Forming→Storming→Norming→Performing→Adjourning) is the ONLY execution model. No skipping stages.

