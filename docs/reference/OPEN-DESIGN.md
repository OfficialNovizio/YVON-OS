# Open Design Integration

open-design is a local-first alternative to Claude Design. It provides 72+ design systems and 31 skills for prototyping.

## Location

```
C:\Users\Novy\Desktop\Projects\open-design\
```

## Setup

open-design requires Node 24 and pnpm 10.33.x. To install:

```bash
cd C:\Users\Novy\Desktop\Projects\open-design
corepack enable
pnpm install
```

## Running

```bash
# Start daemon + web in foreground (recommended for first run)
pnpm tools-dev run web

# Or start in background
pnpm tools-dev start web

# Check status
pnpm tools-dev status
```

## Integration with YVON

### Design System Ingestion

The open-design `DESIGN.md` files for relevant brands can inform Mia's design tokens. Copy design system files to:

```
agent-department/mia/skills/design-systems/
```

### UI Prototyping

When Mia prototypes screens, open-design can generate them using YVON design tokens:

1. Start open-design daemon
2. In open-design web UI, select "Neutral Modern" or a custom design system
3. Generate prototypes
4. Copy output to YVON project

### Schema Alignment

open-design format maps to YVON's:
- **Color** → `app/globals.css` (CSS variables)
- **Typography** → `app/globals.css` + `tailwind.config.ts`
- **Spacing** → `tailwind.config.ts` (spacing scale)
- **Components** → `components/` directory
- **Motion** → Framer Motion in `components/ui/`

## Key Commands

| Command | Description |
|---------|-------------|
| `pnpm tools-dev run web` | Start daemon + web (foreground) |
| `pnpm tools-dev start web` | Start daemon + web (background) |
| `pnpm tools-dev status` | Check daemon status |
| `pnpm tools-dev logs` | Show daemon logs |
| `pnpm tools-dev stop` | Stop managed runtimes |

## Notes

- open-design runs as a separate process from YVON
- The daemon listens on port 7457 by default
- Design systems are stored in `open-design/design-systems/`
- Skills are stored in `open-design/skills/`
- Artifacts are saved to `.od/artifacts/<timestamp>-<slug>/`

## Troubleshooting

If `corepack enable` fails with EPERM on Windows:

```bash
npm install -g pnpm
pnpm install
```

Or use nvm/fnm to manage Node versions and run from WSL2.