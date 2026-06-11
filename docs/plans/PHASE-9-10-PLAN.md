# Phase 9 — Production-Ready + Remaining Gaps

> **CEO Marcus:** Close the last 5 gaps from the Phase 7 audit, harden auth, add unit tests. Then Phase 10 for the nice-to-haves.

---

## Phase 9 — Ship-Ready

### 9A. Workspace Switcher in Sidebar
- Add workspace selector to Sidebar top (matching LifeOS spec)
- Shows Novizio/Hourbour with chevron to switch
- Duplicates TopBar functionality (both work, synced)
- Uses existing WorkspaceContext + venture cookie

### 9B. Software Pipeline BACKLOG Column
- Add BACKLOG column between PLANNING and IN PROGRESS
- Tasks flow: TRIAGE → PLANNING → BACKLOG → IN PROGRESS → STEVE QA → NEEDS REVIEW → DONE
- Merge gate: NEEDS REVIEW items create Decision Queue cards
- Already partially wired via Phase 8 agent crons

### 9C. API Auth Middleware
- Create middleware.ts auth check for /api/* routes
- CRON_SECRET bypass for agent cron routes
- Simple token auth for dashboard access
- Rate limiting on sensitive routes (/api/claude, /api/settings)

### 9D. Unit Test Infrastructure
- Vitest setup with React Testing Library
- Tests for: Card, StatusBadge, Chip, PageHeader components
- Tests for: agent-personalities.ts, WorkspaceContext
- Add to CI pipeline

### 9E. Henry Identity + Learning
- Decision Queue cards show Henry avatar/name
- Henry tracks: decisions approved, rejected, deferred
- Simple learning: if owner approves same type 3x, auto-approve
- Stats: "Henry handled X today, escalated Y"

---

## Phase 10 — Nice-to-Have Polish

### 10A. HeyGen Voice Integration
- Advisory Council gets voice synthesis option
- Per-agent voice selection (HeyGen voices)
- Audio player in War Room
- Mock/fallback when no HeyGen API key

### 10B. Leonardo Image Generation
- Asset Lab Generate tab wires to real image generation
- Per-post 8-image generation for Social Approvals
- Brand kit adherence in prompts
- Fallback to mock when no API key

### 10C. Isaac Trend Detection
- Trend Radar wires to real data sources
- Scrapes Twitter/GitHub/arXiv for trends
- Tags by workspace relevance
- Feeds into Content Pipeline + Advisory Council

### 10D. William A/B Copy Generation
- Social Approvals auto-generates A/B copy
- Uses agent personality + venture brand voice
- Tracks which variant wins → feeds back to William
