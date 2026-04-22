# MCP Servers Configuration (Cursor)

This folder contains MCP server configurations for Cursor. Restart Cursor after creating/modifying these files.

## Available Servers

- **github.json** - Code review graph using `uvx code-review-graph`
- **stitch.json** - Google Stitch AI via standard npx
- **obsidian.json** - Obsidian MCP (config in settings.local.json)
- **supabase.json** - Supabase database queries
- **sequential-thinking.json** - Multi-step task planning

## Usage Example

```bash
# Build the code review graph first:
uvx code-review-graph build "C:\Users\Novy\Desktop\Projects\Official YVON"

# Then use Cursor's built-in MCP tools for code analysis
```
