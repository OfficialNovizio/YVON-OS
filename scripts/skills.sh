#!/bin/bash
# YVON Agent Skills Installer
# Only repos that pass Socket + Snyk + high star count
# Run: bash skills.sh

set -e

echo "Installing YVON agent skills..."

# obra/superpowers — 104.9K stars, Socket+Snyk clean
npx skills add obra/superpowers -y

# coreyhaines31/marketingskills — 15.5K stars, Snyk audited
npx skills add coreyhaines31/marketingskills -y

# vercel-labs/agent-skills — 23.6K stars, Vercel org
npx skills add vercel-labs/agent-skills -y

# supabase/agent-skills — Official badge, Supabase org
npx skills add supabase/agent-skills -y

# deanpeters/Product-Manager-Skills — 2.3K stars, Socket+Snyk clean
# Note: CC BY-NC-SA 4.0 license
npx skills add deanpeters/Product-Manager-Skills -y

# pbakaus/impeccable — 12.3K stars, Snyk passed (already installed for Leo)
npx skills add pbakaus/impeccable -y

echo "Done. All skills installed."
