# docs/dev/ — Developer Tooling Documentation

Docs for YVON's developer tools — code graph, build tooling, review tooling.
These are separate from the app architecture docs (those live in `docs/reference/`).

---

## Files

| File | Purpose | Load when | Related to |
|------|---------|-----------|-----------|
| [`CODE_REVIEW_GRAPH.md`](CODE_REVIEW_GRAPH.md) | How the code-review dependency graph works — build it, serve it, use MCP tools with it | Before a code review; when understanding blast radius of a change | `docs/reference/GRAPHIFY.md`, `docs/reference/ARCHITECTURE.md` |

---

## Dev tool commands

```bash
npm run codegraph:build   # rebuild code-review dependency graph
npm run codegraph:serve   # open graph web UI in browser
npm run graphify:build    # rebuild Graphify knowledge graph (AST-only)
npm run graphify:query -- "<question>"  # query the knowledge graph
```

Both graph tools are read-only analysis tools — they never modify source code.
Run `codegraph:build` after significant refactors or file moves.
Run `graphify:build` after any code change that affects imports or exports.
