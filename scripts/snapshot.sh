#\!/bin/bash
# snapshot.sh — Git stash before every Claude brand session
# Usage: bash scripts/snapshot.sh [brandname]
# Example: bash scripts/snapshot.sh novizio

set -e

BRAND=$1
PROJ_DIR="$(dirname "$0")/.."

if [ -z "$BRAND" ]; then
  echo "❌ Error: brand name required"
  echo "Usage: bash scripts/snapshot.sh [brandname]"
  exit 1
fi

WORKSPACE="$PROJ_DIR/brands/$BRAND/workspace"

if [ \! -d "$WORKSPACE/.git" ]; then
  echo "❌ Error: $WORKSPACE is not a git repo"
  echo "Run: yvon $BRAND clone — first"
  exit 1
fi

cd "$WORKSPACE"
STASH_MSG="YVON snapshot — $BRAND — $(date '+%Y-%m-%d %H:%M')"
git stash push -m "$STASH_MSG"
echo "✅ Snapshot saved: $STASH_MSG"
echo "   To restore: git stash pop"
