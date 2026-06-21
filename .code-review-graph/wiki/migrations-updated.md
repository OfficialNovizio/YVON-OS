# migrations-updated

## Overview

Directory-based community: supabase/migrations

- **Size**: 101 nodes
- **Cohesion**: 0.0000
- **Dominant Language**: sql

## Members

| Name | Kind | File | Lines |
|------|------|------|-------|
| decisions | Class | /root/yvon/supabase/migrations/001_decisions_daily_logs.sql | 2-12 |
| daily_logs | Class | /root/yvon/supabase/migrations/001_decisions_daily_logs.sql | 22-31 |
| ventures | Class | /root/yvon/supabase/migrations/001_phase3_tables.sql | 6-16 |
| tasks | Class | /root/yvon/supabase/migrations/001_phase3_tables.sql | 25-35 |
| deliverables | Class | /root/yvon/supabase/migrations/001_phase3_tables.sql | 40-49 |
| sops | Class | /root/yvon/supabase/migrations/001_phase3_tables.sql | 54-63 |
| content_suggestions | Class | /root/yvon/supabase/migrations/001_phase3_tables.sql | 68-80 |
| competitor_content | Class | /root/yvon/supabase/migrations/001_phase3_tables.sql | 85-94 |
| activity_feed | Class | /root/yvon/supabase/migrations/001_phase3_tables.sql | 99-107 |
| roadmap_items | Class | /root/yvon/supabase/migrations/002_roadmap_items.sql | 2-12 |
| content_calendar | Class | /root/yvon/supabase/migrations/003_content_calendar.sql | 2-13 |
| social_posts_cache | Class | /root/yvon/supabase/migrations/004_calendar_verification.sql | 2-11 |
| revenue_events | Class | /root/yvon/supabase/migrations/005_phase1_brand_pulse.sql | 6-24 |
| posthog_sessions | Class | /root/yvon/supabase/migrations/005_phase1_brand_pulse.sql | 32-52 |
| content_scores | Class | /root/yvon/supabase/migrations/005_phase1_brand_pulse.sql | 60-79 |
| audience_momentum | Class | /root/yvon/supabase/migrations/005_phase1_brand_pulse.sql | 86-98 |
| anomaly_alerts | Class | /root/yvon/supabase/migrations/005_phase1_brand_pulse.sql | 104-118 |
| attribution_map | Class | /root/yvon/supabase/migrations/005_phase1_brand_pulse.sql | 125-140 |
| competitors | Class | /root/yvon/supabase/migrations/006_phase3_market_radar.sql | 5-19 |
| competitor_metrics | Class | /root/yvon/supabase/migrations/006_phase3_market_radar.sql | 25-34 |
| territory_clusters | Class | /root/yvon/supabase/migrations/006_phase3_market_radar.sql | 40-55 |
| campaigns | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 5-20 |
| campaign_ideas | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 26-37 |
| campaign_assets | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 42-49 |
| experiments | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 55-69 |
| content_variants | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 75-90 |
| brand_dna | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 96-104 |
| narrative_arcs | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 109-120 |
| community_signals | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 126-136 |
| creator_profiles | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 142-156 |
| crisis_alerts | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 162-174 |
| channel_conviction | Class | /root/yvon/supabase/migrations/007_phase3_complete.sql | 181-190 |
| skills | Class | /root/yvon/supabase/migrations/008_skills_table.sql | 5-16 |
| update_updated_at_column | Function | /root/yvon/supabase/migrations/008_skills_table.sql | 25-31 |
| execution_plans | Class | /root/yvon/supabase/migrations/009_war_room_plans.sql | 8-21 |
| execution_steps | Class | /root/yvon/supabase/migrations/009_war_room_plans.sql | 30-39 |
| agent_sessions | Class | /root/yvon/supabase/migrations/010_hermes_memory.sql | 9-20 |
| agent_sessions_search_update | Function | /root/yvon/supabase/migrations/010_hermes_memory.sql | 29-37 |
| strategy_log | Class | /root/yvon/supabase/migrations/010_hermes_memory.sql | 47-61 |
| lever_tracker | Class | /root/yvon/supabase/migrations/010_hermes_memory.sql | 71-80 |
| brand_psychology | Class | /root/yvon/supabase/migrations/010_hermes_memory.sql | 87-95 |
| skills_search_update | Function | /root/yvon/supabase/migrations/011_skill_registry.sql | 33-42 |
| increment_skill_usage | Function | /root/yvon/supabase/migrations/013_increment_skill_usage_rpc.sql | 5-14 |
| venture_socials | Class | /root/yvon/supabase/migrations/014_venture_profile_socials.sql | 25-36 |
| ventures_updated_at | Function | /root/yvon/supabase/migrations/014_venture_profile_socials.sql | 47-53 |
| social_snapshots | Class | /root/yvon/supabase/migrations/015_growth_intelligence.sql | 9-15 |
| analytics_snapshots | Class | /root/yvon/supabase/migrations/015_growth_intelligence.sql | 22-29 |
| competitor_snapshots | Class | /root/yvon/supabase/migrations/015_growth_intelligence.sql | 36-44 |
| growth_baselines | Class | /root/yvon/supabase/migrations/015_growth_intelligence.sql | 51-62 |
| cleanup_old_snapshots | Function | /root/yvon/supabase/migrations/015_growth_intelligence.sql | 68-93 |

*... and 51 more members.*

## Execution Flows

No execution flows pass through this community.

## Dependencies

### Incoming

- `/root/yvon/supabase/migrations/007_phase3_complete.sql` (11 edge(s))
- `/root/yvon/supabase/migrations/001_phase3_tables.sql` (7 edge(s))
- `/root/yvon/supabase/migrations/005_phase1_brand_pulse.sql` (6 edge(s))
- `/root/yvon/supabase/migrations/010_hermes_memory.sql` (5 edge(s))
- `/root/yvon/supabase/migrations/015_growth_intelligence.sql` (5 edge(s))
- `/root/yvon/supabase/migrations/019_intelligence_system.sql` (4 edge(s))
- `/root/yvon/supabase/migrations/022_content_suggestion_engine.sql` (4 edge(s))
- `/root/yvon/supabase/migrations/024_career_dashboard.sql` (4 edge(s))
- `/root/yvon/supabase/migrations/025_content_lab.sql` (4 edge(s))
- `/root/yvon/supabase/migrations/036_app_secrets_vault.sql` (4 edge(s))
- `/root/yvon/supabase/migrations/051_agent_metrics.sql` (4 edge(s))
- `/root/yvon/supabase/migrations/006_phase3_market_radar.sql` (3 edge(s))
- `/root/yvon/supabase/migrations/026_network_crm.sql` (3 edge(s))
- `/root/yvon/supabase/migrations/046_venture_agent_memories.sql` (3 edge(s))
- `/root/yvon/supabase/migrations/001_decisions_daily_logs.sql` (2 edge(s))
