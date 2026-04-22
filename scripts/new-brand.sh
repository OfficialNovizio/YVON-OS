#\!/bin/bash
# new-brand.sh — Scaffold a new brand from the _template
# Usage: bash scripts/new-brand.sh [brandname] [repo-url] [dev-port]
# Example: bash scripts/new-brand.sh dropedition github.com/org/dropedition 3004

set -e

BRAND=$1
REPO=$2
PORT=$3
PROJ_DIR="$(dirname "$0")/.."

if [ -z "$BRAND" ] || [ -z "$REPO" ] || [ -z "$PORT" ]; then
  echo "❌ Error: all arguments required"
  echo "Usage: bash scripts/new-brand.sh [brandname] [repo-url] [dev-port]"
  exit 1
fi

echo "🚀 Creating brand: $BRAND"

# Copy template
cp -r "$PROJ_DIR/brands/_template" "$PROJ_DIR/brands/$BRAND"

# Replace placeholders
find "$PROJ_DIR/brands/$BRAND" -type f | while read f; do
  sed -i "s/\[Brand Name\]/$BRAND/g" "$f"
  sed -i "s/\[brandname\]/$BRAND/g" "$f"
  sed -i "s/\[name\]/$BRAND/g" "$f"
  sed -i "s|github.com/\[org\]/\[repo\]|$REPO|g" "$f"
  sed -i "s/3000/$PORT/g" "$f"
  sed -i "s/3001/$(($PORT + 1))/g" "$f"
done

echo "✅ Brand scaffolded at brands/$BRAND/"
echo ""
echo "Next steps:"
echo "  1. Fill in brands/$BRAND/BRAND.config.ts"
echo "  2. Create Obsidian memory notes at YVON's Obsidian/brands/$BRAND/"
echo "  3. Create skill file at D:/Global Skills/yvon-skills/brands/$BRAND.md"
echo "  4. Run: bash scripts/skills-sync.sh"
echo "  5. Clone repo: cd brands/$BRAND/workspace && git clone $REPO ."
