#!/bin/bash
# =============================================================================
# YVON Agent Cron Scheduler
# 
# Run this script once to schedule all 4 agent workflow automations.
# Each runs every 30 minutes via Vercel cron.
#
# Prerequisites:
#   - CRON_SECRET must be set in Supabase Vault (or process.env)
#   - The Vercel project must have cron jobs configured in vercel.json
#
# Usage:
#   chmod +x scripts/schedule-agent-crons.sh
#   ./scripts/schedule-agent-crons.sh
# =============================================================================

set -e

BASE_URL="${YVON_BASE_URL:-https://your-yvon-domain.vercel.app}"
CRON_SECRET="${CRON_SECRET:-}"

if [ -z "$CRON_SECRET" ]; then
  echo "⚠️  CRON_SECRET not set. Set it via: export CRON_SECRET=your-secret"
  echo "   Or configure it in Supabase Vault and load it before running this script."
  echo ""
fi

echo "============================================"
echo " YVON Agent Cron Scheduler"
echo " Base URL: $BASE_URL"
echo "============================================"
echo ""

# ─── Henry — Decision Queue Filtering ─────────────────────────────────────────
echo "📋 Henry Filter — https://vercel.com dashboard → Settings → Cron Jobs:"
echo ""
echo "   Name:     henry-filter"
echo "   Schedule: */30 * * * *"
echo "   Endpoint: /api/agent-cron/henry-filter"
echo "   Method:   GET"
echo "   Header:   Authorization: Bearer \$CRON_SECRET"
echo ""

# ─── Nexus — PR-Only Coding ───────────────────────────────────────────────────
echo "🔧 Nexus Code — https://vercel.com dashboard → Settings → Cron Jobs:"
echo ""
echo "   Name:     nexus-code"
echo "   Schedule: */30 * * * *"
echo "   Endpoint: /api/agent-cron/nexus-code"
echo "   Method:   GET"
echo "   Header:   Authorization: Bearer \$CRON_SECRET"
echo ""

# ─── Steve — QA Gate ──────────────────────────────────────────────────────────
echo "🧪 Steve QA — https://vercel.com dashboard → Settings → Cron Jobs:"
echo ""
echo "   Name:     steve-qa"
echo "   Schedule: */30 * * * *"
echo "   Endpoint: /api/agent-cron/steve-qa"
echo "   Method:   GET"
echo "   Header:   Authorization: Bearer \$CRON_SECRET"
echo ""

# ─── Knox — Security Stops ────────────────────────────────────────────────────
echo "🔒 Knox Security — https://vercel.com dashboard → Settings → Cron Jobs:"
echo ""
echo "   Name:     knox-security"
echo "   Schedule: */30 * * * *"
echo "   Endpoint: /api/agent-cron/knox-security"
echo "   Method:   GET"
echo "   Header:   Authorization: Bearer \$CRON_SECRET"
echo ""

echo "────────────────────────────────────────────"
echo ""

# ─── Manual test commands ─────────────────────────────────────────────────────
if [ -n "$CRON_SECRET" ]; then
  echo "🧪 Test each endpoint manually with curl:"
  echo ""
  echo "  curl -s -H \"Authorization: Bearer $CRON_SECRET\" \\"
  echo "    \"$BASE_URL/api/agent-cron/henry-filter\" | jq"
  echo ""
  echo "  curl -s -H \"Authorization: Bearer $CRON_SECRET\" \\"
  echo "    \"$BASE_URL/api/agent-cron/nexus-code\" | jq"
  echo ""
  echo "  curl -s -H \"Authorization: Bearer $CRON_SECRET\" \\"
  echo "    \"$BASE_URL/api/agent-cron/steve-qa\" | jq"
  echo ""
  echo "  curl -s -H \"Authorization: Bearer $CRON_SECRET\" \\"
  echo "    \"$BASE_URL/api/agent-cron/knox-security\" | jq"
else
  echo "💡 Set CRON_SECRET to see curl test commands."
fi

echo ""
echo "────────────────────────────────────────────"
echo "📝 Vercel Cron Setup Instructions:"
echo ""
echo "1. Open your Vercel project dashboard"
echo "2. Go to Settings → Cron Jobs"
echo "3. Add each cron job with the details shown above"
echo "4. Or add to vercel.json:"
echo ""

cat <<'VERCELJSON'
{
  "crons": [
    {
      "path": "/api/agent-cron/henry-filter",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/agent-cron/nexus-code",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/agent-cron/steve-qa",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/agent-cron/knox-security",
      "schedule": "*/30 * * * *"
    }
  ]
}
VERCELJSON

echo ""
echo "✅ All 4 agent cron endpoints are ready."
echo "   Deploy and configure cron jobs in Vercel to activate them."
