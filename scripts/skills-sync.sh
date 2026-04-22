#\!/bin/bash
# skills-sync.sh — Re-copy all skills from Global Skills source to project and agent folders
# Run after ANY edit to D:\Global Skills\yvon-skills\
# Usage: bash scripts/skills-sync.sh

set -e

SKILLS_SOURCE="D:/Global Skills/yvon-skills"
PROJ_DIR="$(dirname "$0")/.."

echo "🔄 Syncing skills from $SKILLS_SOURCE..."

# ── Agents ──
echo "  → marcus"
cp "$SKILLS_SOURCE/coding/01-karpathy.md" "$PROJ_DIR/agents/marcus/skills/coding/"
cp "$SKILLS_SOURCE/agents/01-memory.md"   "$PROJ_DIR/agents/marcus/skills/agents/"
cp "$SKILLS_SOURCE/agents/03-prompting.md" "$PROJ_DIR/agents/marcus/skills/agents/"

echo "  → dev"
cp "$SKILLS_SOURCE/coding/01-karpathy.md" "$PROJ_DIR/agents/dev/skills/coding/"
cp "$SKILLS_SOURCE/coding/02-general.md"  "$PROJ_DIR/agents/dev/skills/coding/"
cp "$SKILLS_SOURCE/agents/01-memory.md"   "$PROJ_DIR/agents/dev/skills/agents/"
cp "$SKILLS_SOURCE/code-review/01-review-changes.md" "$PROJ_DIR/agents/dev/skills/code-review/"
cp "$SKILLS_SOURCE/code-review/02-review-pr.md"       "$PROJ_DIR/agents/dev/skills/code-review/"
cp "$SKILLS_SOURCE/code-review/03-build-graph.md"     "$PROJ_DIR/agents/dev/skills/code-review/"

echo "  → raj"
cp "$SKILLS_SOURCE/coding/01-karpathy.md" "$PROJ_DIR/agents/raj/skills/coding/"
cp "$SKILLS_SOURCE/coding/02-general.md"  "$PROJ_DIR/agents/raj/skills/coding/"
cp "$SKILLS_SOURCE/coding/03-nextjs.md"   "$PROJ_DIR/agents/raj/skills/coding/"
cp "$SKILLS_SOURCE/agents/01-memory.md"   "$PROJ_DIR/agents/raj/skills/agents/"

echo "  → priya"
cp "$SKILLS_SOURCE/coding/01-karpathy.md" "$PROJ_DIR/agents/priya/skills/coding/"
cp "$SKILLS_SOURCE/agents/01-memory.md"   "$PROJ_DIR/agents/priya/skills/agents/"
cp "$SKILLS_SOURCE/ui/01-design.md"       "$PROJ_DIR/agents/priya/skills/ui/"
cp "$SKILLS_SOURCE/ui/02-tailwind.md"     "$PROJ_DIR/agents/priya/skills/ui/"
cp "$SKILLS_SOURCE/ui/03-components.md"   "$PROJ_DIR/agents/priya/skills/ui/"

echo "  → quinn"
cp "$SKILLS_SOURCE/agents/01-memory.md"    "$PROJ_DIR/agents/quinn/skills/agents/"
cp "$SKILLS_SOURCE/agents/02-openrouter.md" "$PROJ_DIR/agents/quinn/skills/agents/"

# ── Brands ──
echo "  → novizio"
cp "$SKILLS_SOURCE/coding/01-karpathy.md" "$PROJ_DIR/brands/novizio/skills/"
cp "$SKILLS_SOURCE/agents/01-memory.md"   "$PROJ_DIR/brands/novizio/skills/"
cp "$SKILLS_SOURCE/brands/novizio.md"     "$PROJ_DIR/brands/novizio/skills/"

echo "  → hourbour"
cp "$SKILLS_SOURCE/coding/01-karpathy.md" "$PROJ_DIR/brands/hourbour/skills/"
cp "$SKILLS_SOURCE/agents/01-memory.md"   "$PROJ_DIR/brands/hourbour/skills/"
cp "$SKILLS_SOURCE/brands/hourbour.md"    "$PROJ_DIR/brands/hourbour/skills/"

echo ""
echo "✅ Skills sync complete — $(date '+%Y-%m-%d %H:%M')"
