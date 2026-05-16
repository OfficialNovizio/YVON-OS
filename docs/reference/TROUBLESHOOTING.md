# TROUBLESHOOTING.md — Common Problems & Fixes
> Load this file only when: debugging errors, investigating unexpected behaviour, or diagnosing API failures.

## API & Authentication
| Problem | Fix |
|---------|-----|
| 401 from any API | Check Vercel env vars are saved and project redeployed |
| Claude agent silent | Check billing at console.anthropic.com |
| Apify returns no data | Instagram handle must not include `@` |
| Google Analytics empty | Service account email must be added as Viewer on GA4 property |

## Build & TypeScript
| Problem | Fix |
|---------|-----|
| TypeScript errors in Linux VM | Use `npx tsc --noEmit` — SWC binary is Windows-only; `npm run build` won't work in Linux VM |
| CORS error | API is being called directly from frontend — route through `/api/` |
| Vercel function timeout | Set `maxDuration: 30` in `vercel.json` for scraper routes |

## Dashboard & Data
| Problem | Fix |
|---------|-----|
| Dashboard not updating | Settings → Clear Cache |
| Venture data not switching | Check `yvon_active_venture` cookie is being set correctly |
| Agent memory not persisting | Verify Supabase `agent_memory` table write in `/api/settings` |

## Design System
| Problem | Fix |
|---------|-----|
| Colors look wrong after globals.css change | Update `tailwind.config.ts` to match — both must stay in sync |
| Component styles not applying | Ensure you're using CSS variable tokens, not hardcoded hex values |

## War Room
| Problem | Fix |
|---------|-----|
| Wrong specialist being called | Review routing keywords in agent SKILLS.md War Room section |
| @ mention not working | Check WarRoom.tsx mention parsing and team-chat route handling |
| More than 2 specialists firing | Verify `.slice(0, 2)` cap is in `/api/team-chat/route.ts` |
