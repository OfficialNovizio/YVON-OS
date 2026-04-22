# YVON 3.1: Spatial Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the YVON shell and CEO dashboard into a high-end "Spatial Editorial" terminal featuring an elastic macOS Dock and GSAP-powered motion intelligence.

**Architecture:** Use one continuous radial-gradient canvas (`#001a35` to `#000`) instead of flat sections. Navigation moves to a fixed bottom `UnifiedControls` layer (Dock + Brand Pill). All components reveal via `ScrollTrigger` and internal GSAP timelines.

**Tech Stack:** Next.js 15, GSAP 3.15+, Tailwind CSS 3.4, Lucide React.

---

### Task 1: Global CSS & Design Tokens Overhaul

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Define new Spatial CSS tokens**
Update the root variables to include the spatial gradient background, thick glass materials, and clamped editorial typography scales.

```css
:root {
  /* Spatial Canvas */
  --bg-spatial: radial-gradient(circle at 50% 50%, #001a35 0%, #000000 80%);
  --glow-primary: #0071e3;
  --glow-secondary: #2997ff;

  /* Glass - VisionOS Tier */
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-blur: 40px;
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-reflection: inset 0 1px 1px rgba(255, 255, 255, 0.1);

  /* Typography Clamps */
  --font-size-hero: clamp(50px, 8vw, 110px);
  --font-size-section: clamp(32px, 5vw, 64px);
  --font-size-card-val: clamp(28px, 4vw, 56px);
}

.glass-spatial {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-reflection);
}

.canvas-spatial {
  background: var(--bg-spatial);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}
```

- [ ] **Step 2: Commit Design Tokens**

```bash
git add app/globals.css
git commit -m "design: update spatial tokens and glass utilities"
```

---

### Task 2: Advanced GSAP Reveal Hook

**Files:**
- Create: `components/hooks/use-spatial-reveal.ts`
- Modify: `components/ceo-v3/use-scroll-reveal.ts` (deprecate or wrap)

- [ ] **Step 1: Implement the Spatial Reveal Hook**
This hook will handle the elastic scale-in and opacity fade used for the premium spatial look.

```typescript
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useSpatialReveal(refs: React.RefObject<HTMLElement | null>[]) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      refs.forEach((ref) => {
        if (!ref.current) return
        gsap.fromTo(ref.current, 
          { opacity: 0, scale: 0.95, y: 30 },
          { 
            opacity: 1, scale: 1, y: 0,
            duration: 1.2,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        )
      })
    })
    return () => ctx.revert()
  }, [refs])
}
```

- [ ] **Step 2: Commit Hook**

```bash
git add components/hooks/use-spatial-reveal.ts
git commit -m "feat: add useSpatialReveal GSAP hook"
```

---

### Task 3: The Unified Control Layer (Dock + Brand Selector)

**Files:**
- Create: `components/layout/UnifiedControls.tsx`
- Create: `components/layout/DockItem.tsx`

- [ ] **Step 1: Build the DockItem with GSAP tooltips**
Create a component for individual dock icons that handles the hover-tooltip logic.

- [ ] **Step 2: Implement UnifiedControls**
Build the fixed bottom layer containing the 64px Dock and the Brand Pill.

```tsx
// components/layout/UnifiedControls.tsx snippet
export default function UnifiedControls() {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-5 z-[9999]">
      <div className="dock glass-spatial rounded-[24px] h-[64px] flex items-center p-2 gap-2">
        {/* Dock Items Mapping */}
      </div>
      <div className="brand-pill glass-spatial h-[64px] rounded-[24px] px-6 flex items-center gap-3 cursor-pointer">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_12px_#34c759]" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Active Venture</span>
          <span className="text-[17px] font-bold">Novizio Brand</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit Controls**

```bash
git commit -m "feat: implement bottom Unified Controls (Dock + Brand Pill)"
```

---

### Task 4: Spatial Hero & Editorial Refactoring

**Files:**
- Modify: `components/ceo-v3/Scene1Hero.tsx`

- [ ] **Step 1: Refactor to Editorial Style**
Update the hero to use centered, clamped typography and remove the flat background.

- [ ] **Step 2: Add Entry GSAP Timeline**
Use GSAP to animate the title split-by-character or entire blocks for the "Intelligence Redefined" entrance.

- [ ] **Step 3: Commit Hero**

```bash
git commit -m "refactor: upgrade Scene1Hero to high-fidelity spatial style"
```

---

### Task 4: Elastic Bar Chart Component

**Files:**
- Create: `components/ui/ElasticBarChart.tsx`

- [ ] **Step 1: Build SVG/Div based chart**
Use GSAP to animate the height of bars with `elastic.out(1, 0.4)`.

```tsx
// components/ui/ElasticBarChart.tsx logic
useEffect(() => {
  gsap.to('.spatial-bar', {
    height: (i) => data[i].value + '%',
    stagger: 0.1,
    duration: 1.5,
    ease: 'elastic.out(1, 0.4)',
    scrollTrigger: { trigger: containerRef.current }
  })
}, [data])
```

- [ ] **Step 2: Commit Chart**

```bash
git commit -m "feat: add premium ElasticBarChart component"
```

---

### Task 5: Application Shell Migration

**Files:**
- Modify: `components/Shell.tsx`
- Modify: `app/ceo/page.tsx`

- [ ] **Step 1: Update Shell to use UnifiedControls**
Remove `SidebarUnified` and `NavBar`. Add `UnifiedControls` as a fixed bottom global layer.

- [ ] **Step 2: Re-assemble Dashboard in app/ceo/page.tsx**
Wrap everything in `.canvas-spatial`. Integrate the new components and ensure the `useSpatialReveal` orchestration is smooth.

- [ ] **Step 3: Final Verification**
Run `npm run build` and check for visual consistency and GSAP performance.

- [ ] **Step 4: Commit Migration**

```bash
git commit -m "feat: migrate shell and dashboard to Spatial Intelligence 3.1"
```
