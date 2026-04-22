---
name: YVON 3.1 — Spatial Intelligence Design Spec
description: Next-gen Apple-inspired dashboard with macOS Dock, GSAP animations, and Spatial/Editorial aesthetic.
type: project
---

# YVON 3.1 — Spatial Intelligence Design Spec (GSAP Edition)

> "The data doesn't just sit there. It breathes."

YVON 3.1 moves away from the boxed modules of v2.0 and the "HTML basics" feeling of early versions. It embraces a **Spatial Editorial** aesthetic: deep canvases, high-end editorial typography, and high-fidelity macOS-style dock navigation.

---

## 1. Aesthetic Framework

### 1.1 The Canvas
- **Deep Spatial Background**: `radial-gradient(circle at 50% 50%, #001a35 0%, #000 80%)`.
- **Ambient Light Leaks**: Fixed `blur(120px)` blue/teal glows at the viewport corners to create depth.
- **Sectionless Flow**: No more alternating black/gray sections. One continuous deep canvas where content fades in and out via scroll.

### 1.2 Material & Surface
- **Thick Glass (VisionOS Style)**: 
  - `background: rgba(255, 255, 255, 0.03)`
  - `backdrop-filter: blur(40px)`
  - `border: 1px solid rgba(255, 255, 255, 0.1)`
  - `inset 0 1px 1px rgba(255,255,255,0.1)` for high-end surface reflection.
- **Radii**: Standardized at `32px` for main cards and `12px` for dock items.

### 1.3 Editorial Typography
- **Hero Headlines**: `clamp(40px, 6vw, 90px)`, Font-weight 800, `letter-spacing: -4px`.
- **Primary Data**: `font-variant-numeric: tabular-nums` to ensure GSAP count-up numbers don't "wiggle."

---

## 2. Navigation: Unified Control Layer
Located at the bottom of the viewport, the Unified Control Layer groups the functional dock and the brand selector.

### 2.1 The Dock
- **Material**: Translucent glass with 0.5px white border, `backdrop-filter: blur(40px)`.
- **Dimensions**: 64px height, 48px icons.
- **Hover Effect**: GSAP fish-eye scaling (1.0x -> 1.3x) with neighbors scaling at 1.1x.
- **Active State**: Active icon background `#0071e3`.

### 2.2 Brand Selector Pill
- **Placement**: Sits directly to the right of the Dock.
- **Material**: Translucent glass capsule, `backdrop-filter: blur(40px)`.
- **Display**: Shows "Active Venture" label above the bold 17px Brand Name (e.g., Novizio Brand).
- **Pulse Dot**: A #34c759 status dot with a soft glow to indicate a live operational sync.
- **Click**: Opens an overlay menu (VisionOS style) to switch ventures.

### 2.2 Functional Groups
- **Command Group**: ⬡ Command · ◫ Analytics · ◉ Radar · ◈ Market
- **Utility Group (post-divider)**: ✉ Inbox · ◷ Team · ⚙ Settings

---

## 3. Motion Architecture (GSAP)

### 3.1 Orchestration
- **Timeline-based Entry**: Hero title -> Subtitle -> Cards (staggered).
- **ScrollTrigger**: Sections/Cards scale from `0.95` to `1.0` and fade from `0` to `1` as they enter the viewport.

### 3.2 Component Animations
- **Number Count-Up**: GSAP `onUpdate` targeting numeric strings with `power4.out` easing.
- **Bar Graphs**: `elastic.out` height transition (1.5s duration) with `0.1s` stagger per bar.
- **Ambient Movement**: Subtle `y` jitter on the ambient background glows.

---

## 4. Components Reference

| Component | Style Code | GSAP Role |
|---|---|---|
| **Spatial Hero** | Center-aligned, clamped headlines | `expo.out` entry |
| **Dock** | macOS 14 style, glass, active dots | Hover scaling, active-switch fade |
| **Intelligence Card** | 32px radii, VisionOS glass, editorial margins | Scale-in reveal |
| **Elastic Chart** | Linear blue gradients, rounded bar caps | `elastic.out` stagger |

---

## 5. Implementation Roadmap

1. **Tokens Update**: Update `globals.css` with the Spatial gradient and Glass materials.
2. **GSAP & ScrollTrigger Setup**: Initialize the main timeline in `app/ceo/page.tsx`.
3. **The Dock Component**: Build the high-fidelity floating dock to replace the Sidebar and old Navbar.
4. **Scene Refactoring**: Refactor Current V3 components to match the Spatial Editorial look (removing the flat backgrounds).
5. **Data Integration**: Connect the count-up numbers and graphs to the real data streams from the analytical backend.
