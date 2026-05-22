-- Migration 029: Enable RLS on all unprotected tables
-- All data access in YVON goes through server-side /api/ routes using
-- SUPABASE_SERVICE_ROLE_KEY. The anon key (exposed to browser) must have
-- no direct table access. This migration locks all 41 unprotected tables.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Core business tables ───────────────────────────────────────────────────

ALTER TABLE ventures                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items           ENABLE ROW LEVEL SECURITY;

-- ─── Content & Marketing ────────────────────────────────────────────────────

ALTER TABLE content_calendar        ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pitches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_suggestions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_series          ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns               ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_assets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_ideas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE narrative_arcs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_pass_reasons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clothing_items          ENABLE ROW LEVEL SECURITY;

-- ─── Analytics & Intelligence ───────────────────────────────────────────────

ALTER TABLE analytics_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_momentum       ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_map         ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_baselines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_conviction      ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_reliability      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_weight_history  ENABLE ROW LEVEL SECURITY;

-- ─── Competitor & Market ────────────────────────────────────────────────────

ALTER TABLE competitors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_content      ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_metrics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_signals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles        ENABLE ROW LEVEL SECURITY;

-- ─── Social & Activity ──────────────────────────────────────────────────────

ALTER TABLE activity_feed           ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts_cache      ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_snapshots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE posthog_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_dna               ENABLE ROW LEVEL SECURITY;

-- ─── Service-role-only policies (one per table) ─────────────────────────────
-- USING (true) with TO service_role means only the server-side client
-- (which holds SUPABASE_SERVICE_ROLE_KEY) can read/write. The browser anon
-- client is completely blocked.

CREATE POLICY ventures_svc               ON ventures               FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY tasks_svc                  ON tasks                  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY decisions_svc              ON decisions              FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY deliverables_svc           ON deliverables           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY sops_svc                   ON sops                   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY daily_logs_svc             ON daily_logs             FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY roadmap_items_svc          ON roadmap_items          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY content_calendar_svc       ON content_calendar       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY content_pitches_svc        ON content_pitches        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY content_suggestions_svc    ON content_suggestions    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY content_series_svc         ON content_series         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY content_performance_svc    ON content_performance    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY content_scores_svc         ON content_scores         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY content_variants_svc       ON content_variants       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY campaigns_svc              ON campaigns              FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY campaign_assets_svc        ON campaign_assets        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY campaign_ideas_svc         ON campaign_ideas         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY narrative_arcs_svc         ON narrative_arcs         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY pitch_pass_reasons_svc     ON pitch_pass_reasons     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY clothing_items_svc         ON clothing_items         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY analytics_snapshots_svc    ON analytics_snapshots    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY anomaly_alerts_svc         ON anomaly_alerts         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY audience_momentum_svc      ON audience_momentum      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY attribution_map_svc        ON attribution_map        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY growth_baselines_svc       ON growth_baselines       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY revenue_events_svc         ON revenue_events         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY experiments_svc            ON experiments            FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY channel_conviction_svc     ON channel_conviction     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY signal_reliability_svc     ON signal_reliability     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY scoring_weight_history_svc ON scoring_weight_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY competitors_svc            ON competitors            FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY competitor_content_svc     ON competitor_content     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY competitor_metrics_svc     ON competitor_metrics     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY competitor_snapshots_svc   ON competitor_snapshots   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY community_signals_svc      ON community_signals      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY creator_profiles_svc       ON creator_profiles       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY activity_feed_svc          ON activity_feed          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY social_posts_cache_svc     ON social_posts_cache     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY social_snapshots_svc       ON social_snapshots       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY posthog_sessions_svc       ON posthog_sessions       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY crisis_alerts_svc          ON crisis_alerts          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY brand_dna_svc              ON brand_dna              FOR ALL TO service_role USING (true) WITH CHECK (true);
